import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ResourceAllocation } from '@/services/mirror/tactics-planner'
import { DollarSign, Clock, Users, Wrench, AlertCircle } from 'lucide-react'

interface ResourceAllocatorProps {
  allocations: ResourceAllocation[]
  tacticNames?: Record<string, string>
  className?: string
}

export const ResourceAllocator: React.FC<ResourceAllocatorProps> = ({
  allocations,
  tacticNames = {},
  className,
}) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <DollarSign className="h-5 w-5" />
      case 'time':
        return <Clock className="h-5 w-5" />
      case 'people':
        return <Users className="h-5 w-5" />
      case 'tools':
        return <Wrench className="h-5 w-5" />
      default:
        return null
    }
  }

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'budget':
        return `$${value.toLocaleString()}`
      case 'time':
        return `${value.toFixed(0)}h`
      case 'people':
        return `${value.toFixed(1)} FTE`
      case 'tools':
        return value.toString()
      default:
        return value.toString()
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {allocations.map((allocation) => {
            const utilizationPercent = (allocation.allocated / allocation.total_available) * 100
            const isOverallocated = utilizationPercent > 100

            return (
              <div key={allocation.resource_type} className="space-y-3">
                {/* Resource Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(allocation.resource_type)}
                      <h3 className="font-semibold capitalize">{allocation.resource_type}</h3>
                    </div>
                    <Badge variant={isOverallocated ? 'destructive' : 'secondary'}>
                      {utilizationPercent.toFixed(0)}% utilized
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Available</p>
                      <p className="font-medium">{formatValue(allocation.total_available, allocation.resource_type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Allocated</p>
                      <p className="font-medium">{formatValue(allocation.allocated, allocation.resource_type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Remaining</p>
                      <p className={`font-medium ${allocation.remaining < 0 ? 'text-red-600' : ''}`}>
                        {formatValue(allocation.remaining, allocation.resource_type)}
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={Math.min(utilizationPercent, 100)}
                    className={`h-2 ${isOverallocated ? 'bg-red-100' : ''}`}
                  />

                  {isOverallocated && (
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        Over-allocated by {formatValue(Math.abs(allocation.remaining), allocation.resource_type)}.
                        Consider reducing scope or increasing resources.
                      </span>
                    </div>
                  )}
                </div>

                {/* Allocation by Tactic */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Allocation by Tactic:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {Object.entries(allocation.allocation_by_tactic)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tacticId, amount]) => (
                        <div key={tacticId} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground truncate flex-1">
                            {tacticNames[tacticId] || tacticId}
                          </span>
                          <span className="font-medium ml-2">{formatValue(amount, allocation.resource_type)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
