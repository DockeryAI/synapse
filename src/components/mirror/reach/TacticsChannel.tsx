import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TacticalChannel } from '@/services/mirror/tactics-planner'
import { TacticCard } from './TacticCard'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'

interface TacticsChannelProps {
  channel: TacticalChannel
  onToggleStep?: (tacticId: string, stepIndex: number) => void
  onStatusChange?: (tacticId: string, status: any) => void
  className?: string
}

export const TacticsChannel: React.FC<TacticsChannelProps> = ({
  channel,
  onToggleStep,
  onStatusChange,
  className,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'primary':
        return 'bg-green-500'
      case 'secondary':
        return 'bg-blue-500'
      case 'tertiary':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(channel.priority)}`} />
              <CardTitle>{channel.channel}</CardTitle>
            </div>
            <Badge variant="secondary">{channel.priority}</Badge>
          </div>

          {/* Budget Allocation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Budget Allocation
              </span>
              <span className="font-medium">{channel.budget_allocation}%</span>
            </div>
            <Progress value={channel.budget_allocation} className="h-2" />
          </div>

          {/* Tactics Count */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="font-medium">{channel.tactics.length}</span>
              <span className="text-muted-foreground">tactics</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Success Metrics
          </div>
          <div className="flex flex-wrap gap-1">
            {channel.success_metrics.map((metric, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {metric}
              </Badge>
            ))}
          </div>
        </div>

        {/* Resources Needed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Resources Needed
          </div>
          <div className="flex flex-wrap gap-1">
            {channel.resources_needed.map((resource, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {resource}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tactics */}
        <div className="space-y-3 pt-2 border-t">
          {channel.tactics.map((tactic) => (
            <TacticCard
              key={tactic.id}
              tactic={tactic}
              onToggleStep={(stepIndex) => onToggleStep?.(tactic.id, stepIndex)}
              onStatusChange={(status) => onStatusChange?.(tactic.id, status)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
