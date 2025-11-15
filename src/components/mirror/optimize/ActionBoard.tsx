import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActionItem } from '@/services/mirror/action-planner'
import { ActionItemCard } from './ActionItemCard'

interface ActionBoardProps {
  actions: ActionItem[]
  onStatusChange?: (actionId: string, status: ActionItem['status']) => void
  onToggleChecklist?: (actionId: string, checklistId: string) => void
  className?: string
}

export const ActionBoard: React.FC<ActionBoardProps> = ({
  actions,
  onStatusChange,
  onToggleChecklist,
  className,
}) => {
  const columns = [
    { status: 'not_started' as const, title: 'To Do', color: 'bg-gray-200' },
    { status: 'in_progress' as const, title: 'In Progress', color: 'bg-blue-200' },
    { status: 'blocked' as const, title: 'Blocked', color: 'bg-red-200' },
    { status: 'completed' as const, title: 'Completed', color: 'bg-green-200' },
  ]

  const getColumnActions = (status: ActionItem['status']) => {
    return actions.filter((action) => action.status === status)
  }

  return (
    <div className={`${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`}>
      {columns.map((column) => {
        const columnActions = getColumnActions(column.status)

        return (
          <Card key={column.status} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{column.title}</CardTitle>
                <Badge variant="secondary">{columnActions.length}</Badge>
              </div>
              <div className={`h-1 ${column.color} rounded-full`} />
            </CardHeader>
            <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[600px]">
              {columnActions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No actions
                </div>
              ) : (
                columnActions.map((action) => (
                  <ActionItemCard
                    key={action.id}
                    action={action}
                    onStatusChange={(status) => onStatusChange?.(action.id, status)}
                    onToggleChecklist={(checklistId) => onToggleChecklist?.(action.id, checklistId)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
