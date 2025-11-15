import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tactic } from '@/services/mirror/tactics-planner'
import { CheckCircle, Circle, Clock, DollarSign, TrendingUp, Target } from 'lucide-react'

interface TacticCardProps {
  tactic: Tactic
  onToggleStep?: (stepIndex: number) => void
  onStatusChange?: (status: Tactic['status']) => void
  showDetails?: boolean
  className?: string
}

export const TacticCard: React.FC<TacticCardProps> = ({
  tactic,
  onToggleStep,
  onStatusChange,
  showDetails = true,
  className,
}) => {
  const [expanded, setExpanded] = React.useState(false)

  const completedSteps = tactic.steps.filter((s) => s.completed).length
  const progressPercentage = (completedSteps / tactic.steps.length) * 100

  const getEffortColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-500">High Impact</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Impact</Badge>
      case 'low':
        return <Badge variant="secondary">Low Impact</Badge>
      default:
        return null
    }
  }

  const getStatusBadge = (status: Tactic['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>
      case 'planned':
        return <Badge variant="outline">Planned</Badge>
      default:
        return null
    }
  }

  const totalHours = tactic.steps.reduce((sum, step) => sum + step.duration_hours, 0)

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{tactic.name}</h4>
              {getStatusBadge(tactic.status)}
            </div>
            <p className="text-sm text-muted-foreground">{tactic.description}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {getImpactBadge(tactic.expected_impact)}
          <Badge variant="outline" className="text-xs">
            {tactic.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {tactic.timeline}
          </Badge>
        </div>

        {/* Effort Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getEffortColor(tactic.effort_level)}`} />
            <span className="text-muted-foreground">Effort: {tactic.effort_level}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="text-muted-foreground">Budget: {tactic.budget_required}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-muted-foreground">{totalHours}h total</span>
          </div>
        </div>

        {/* Progress */}
        {showDetails && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedSteps}/{tactic.steps.length} steps
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Steps */}
        {showDetails && expanded && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold">Steps:</h5>
              <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
                Hide
              </Button>
            </div>

            {tactic.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                onClick={() => onToggleStep?.(index)}
              >
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {step.order}. {step.action}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{step.duration_hours}h</span>
                    {step.owner && <span>• {step.owner}</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Prerequisites */}
            {tactic.prerequisites.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">Prerequisites:</p>
                <div className="flex flex-wrap gap-1">
                  {tactic.prerequisites.map((prereq, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {prereq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Details Button */}
        {showDetails && !expanded && (
          <Button size="sm" variant="outline" className="w-full" onClick={() => setExpanded(true)}>
            View {tactic.steps.length} Steps
          </Button>
        )}

        {/* Status Actions */}
        {onStatusChange && (
          <div className="flex gap-2 pt-2 border-t">
            {tactic.status === 'planned' && (
              <Button size="sm" onClick={() => onStatusChange('in_progress')} className="flex-1">
                Start
              </Button>
            )}
            {tactic.status === 'in_progress' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onStatusChange('paused')} className="flex-1">
                  Pause
                </Button>
                <Button size="sm" onClick={() => onStatusChange('completed')} className="flex-1">
                  Complete
                </Button>
              </>
            )}
            {tactic.status === 'paused' && (
              <Button size="sm" onClick={() => onStatusChange('in_progress')} className="flex-1">
                Resume
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
