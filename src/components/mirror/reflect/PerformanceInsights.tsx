import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PerformanceInsight } from '@/services/mirror/reflect-dashboard'
import { CheckCircle, AlertTriangle, TrendingUp, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'

interface PerformanceInsightsProps {
  insights: PerformanceInsight[]
  className?: string
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ insights, className }) => {
  const [expandedInsights, setExpandedInsights] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'concern':
        return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getInsightColor = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'concern':
        return 'bg-red-50 border-red-200 text-red-900'
    }
  }

  const getImpactBadge = (impact: PerformanceInsight['impact']) => {
    const colors = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const

    return (
      <Badge variant={colors[impact]} className="text-xs">
        {impact.toUpperCase()} IMPACT
      </Badge>
    )
  }

  // Group insights by type
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.type]) {
      acc[insight.type] = []
    }
    acc[insight.type].push(insight)
    return acc
  }, {} as Record<string, PerformanceInsight[]>)

  const typeOrder: PerformanceInsight['type'][] = ['concern', 'warning', 'opportunity', 'success']
  const typeLabels = {
    success: 'Key Wins',
    warning: 'Warnings',
    opportunity: 'Opportunities',
    concern: 'Concerns',
  }

  return (
    <div className={`${className} space-y-6`}>
      {typeOrder.map((type) => {
        const typeInsights = groupedInsights[type]
        if (!typeInsights || typeInsights.length === 0) return null

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              {getInsightIcon(type)}
              <h3 className="text-lg font-semibold">{typeLabels[type]}</h3>
              <Badge variant="outline">{typeInsights.length}</Badge>
            </div>

            <div className="space-y-3">
              {typeInsights.map((insight) => {
                const isExpanded = expandedInsights.has(insight.id)

                return (
                  <Card
                    key={insight.id}
                    className={`border-2 ${getInsightColor(insight.type)}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            {getImpactBadge(insight.impact)}
                          </div>
                          <CardDescription className="text-sm">
                            {insight.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(insight.id)}
                          className="ml-2"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-4 border-t pt-4">
                        {/* Confidence Score */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confidence Score</span>
                          <Badge variant="outline">
                            {(insight.confidence_score * 100).toFixed(0)}%
                          </Badge>
                        </div>

                        {/* Related KPIs */}
                        {insight.related_kpis.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Related KPIs
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {insight.related_kpis.map((kpiId, index) => (
                                <Badge key={kpiId} variant="secondary" className="text-xs">
                                  KPI {index + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {insight.recommended_actions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Recommended Actions
                            </h4>
                            <ul className="space-y-2">
                              {insight.recommended_actions.map((action, index) => (
                                <li
                                  key={index}
                                  className="text-sm flex items-start gap-2 text-muted-foreground"
                                >
                                  <span className="text-primary font-medium mt-0.5">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Discovery Date */}
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Discovered on {new Date(insight.discovered_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {insights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
            <p className="text-sm text-muted-foreground">
              Performance insights will appear here as your KPIs are tracked over time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
