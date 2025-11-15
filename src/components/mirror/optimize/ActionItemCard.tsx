import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ActionItem } from '@/services/mirror/action-planner'
import { Calendar, User, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react'

interface ActionItemCardProps {
  action: ActionItem
  onStatusChange?: (status: ActionItem['status']) => void
  onToggleChecklist?: (checklistId: string) => void
  className?: string
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({
  action,
  onStatusChange,
  onToggleChecklist,
  className,
}) => {
  const isOverdue = new Date(action.due_date) < new Date() && action.status !== 'completed'
  const daysUntilDue = Math.ceil((new Date(action.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      case 'not_started':
        return <Badge variant="outline">Not Started</Badge>
      default:
        return null
    }
  }

  const checklistProgress = action.checklist.length > 0
    ? (action.checklist.filter((item) => item.completed).length / action.checklist.length) * 100
    : 0

  return (
    <Card className={`${className} ${isOverdue ? 'border-red-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-1 h-4 ${getPriorityColor(action.priority)}`} />
              <h4 className="font-semibold">{action.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>
          {getStatusBadge(action.status)}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs">
          {action.owner && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{action.owner}</span>
            </div>
          )}

          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(action.due_date).toLocaleDateString()}
              {daysUntilDue >= 0 && ` (${daysUntilDue}d)`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{action.estimated_hours}h</span>
          </div>
        </div>

        {/* Tags */}
        {action.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {action.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Checklist */}
        {action.checklist.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Checklist</span>
              <span className="font-medium">
                {action.checklist.filter((item) => item.completed).length}/{action.checklist.length}
              </span>
            </div>
            <Progress value={checklistProgress} className="h-2" />

            <div className="space-y-1">
              {action.checklist.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  onClick={() => onToggleChecklist?.(item.id)}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                    {item.text}
                  </span>
                </div>
              ))}
              {action.checklist.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{action.checklist.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {isOverdue && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>Overdue by {Math.abs(daysUntilDue)} days</span>
          </div>
        )}

        {action.dependencies.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Depends on {action.dependencies.length} other action(s)
          </div>
        )}

        {/* Status Actions */}
        {onStatusChange && action.status !== 'completed' && action.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2 border-t">
            {action.status === 'not_started' && (
              <Button size="sm" onClick={() => onStatusChange('in_progress')} className="flex-1">
                Start
              </Button>
            )}
            {action.status === 'in_progress' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onStatusChange('blocked')} className="flex-1">
                  Block
                </Button>
                <Button size="sm" onClick={() => onStatusChange('completed')} className="flex-1">
                  Complete
                </Button>
              </>
            )}
            {action.status === 'blocked' && (
              <Button size="sm" onClick={() => onStatusChange('in_progress')} className="flex-1">
                Unblock
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
