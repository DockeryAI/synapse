import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { KPIMetric } from '@/services/mirror/reflect-dashboard'
import { TrendingUp, TrendingDown, Minus, Target, AlertCircle, CheckCircle } from 'lucide-react'

interface KPIDashboardProps {
  kpis: KPIMetric[]
  className?: string
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ kpis, className }) => {
  const getStatusColor = (status: KPIMetric['status']) => {
    switch (status) {
      case 'exceeding':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'on_track':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'at_risk':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: KPIMetric['status']) => {
    switch (status) {
      case 'exceeding':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'on_track':
        return <Target className="h-5 w-5 text-blue-600" />
      case 'at_risk':
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getTrendIcon = (direction: KPIMetric['change_direction']) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`
    if (unit === '$') return `$${value.toLocaleString()}`
    return value.toLocaleString() + (unit ? ` ${unit}` : '')
  }

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0
  }

  // Group KPIs by category
  const groupedKPIs = kpis.reduce((acc, kpi) => {
    if (!acc[kpi.category]) {
      acc[kpi.category] = []
    }
    acc[kpi.category].push(kpi)
    return acc
  }, {} as Record<string, KPIMetric[]>)

  const categoryLabels: Record<string, string> = {
    engagement: 'Engagement',
    reach: 'Reach',
    conversion: 'Conversion',
    revenue: 'Revenue',
    retention: 'Retention',
    awareness: 'Awareness',
  }

  return (
    <div className={className}>
      {Object.entries(groupedKPIs).map(([category, categoryKPIs]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-semibold mb-4 capitalize">
            {categoryLabels[category] || category} Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryKPIs.map((kpi) => {
              const progressPercentage = getProgressPercentage(kpi.current_value, kpi.target_value)

              return (
                <Card
                  key={kpi.id}
                  className={`border-2 ${getStatusColor(kpi.status)}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Updated {new Date(kpi.last_updated).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusIcon(kpi.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Current Value */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-2xl font-bold">
                          {formatValue(kpi.current_value, kpi.unit)}
                        </span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(kpi.change_direction)}
                          <span
                            className={`text-sm font-medium ${
                              kpi.change_direction === 'up'
                                ? 'text-green-600'
                                : kpi.change_direction === 'down'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {kpi.change_percentage > 0 ? '+' : ''}
                            {kpi.change_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        vs {formatValue(kpi.previous_value, kpi.unit)} previous
                      </p>
                    </div>

                    {/* Progress to Target */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Target Progress</span>
                        <span className="text-xs font-medium">
                          {progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {formatValue(kpi.target_value, kpi.unit)}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2 border-t">
                      <Badge
                        variant={
                          kpi.status === 'exceeding'
                            ? 'default'
                            : kpi.status === 'on_track'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {kpi.status.replace('_', ' ').toUpperCase()} • {kpi.trend.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {kpis.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No KPIs Available</h3>
            <p className="text-sm text-muted-foreground">
              Set objectives in the Intend phase to start tracking performance metrics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
