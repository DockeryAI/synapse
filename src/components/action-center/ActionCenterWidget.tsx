/**
 * Action Center Widget
 * Persistent, expandable widget that stays on the right side
 * Allows users to queue content and actions as they work
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronRight,
  ChevronLeft,
  ListTodo,
  Calendar,
  FileText,
  Sparkles,
  X,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionItem {
  id: string
  type: 'content' | 'task' | 'idea'
  title: string
  description?: string
  source: string // Which section it came from
  createdAt: Date
  status: 'queued' | 'scheduled' | 'completed'
  scheduledDate?: Date
}

interface ActionCenterWidgetProps {
  className?: string
}

export const ActionCenterWidget: React.FC<ActionCenterWidgetProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [actions, setActions] = React.useState<ActionItem[]>([])

  const handleAddAction = (action: Omit<ActionItem, 'id' | 'createdAt' | 'status'>) => {
    const newAction: ActionItem = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: 'queued',
    }
    setActions(prev => [newAction, ...prev])
  }

  const handleRemoveAction = (id: string) => {
    setActions(prev => prev.filter(action => action.id !== id))
  }

  const handleMarkComplete = (id: string) => {
    setActions(prev =>
      prev.map(action =>
        action.id === id
          ? { ...action, status: 'completed' as const }
          : action
      )
    )
  }

  const handleSchedule = (id: string, date: Date) => {
    setActions(prev =>
      prev.map(action =>
        action.id === id
          ? { ...action, status: 'scheduled' as const, scheduledDate: date }
          : action
      )
    )
  }

  const queuedCount = actions.filter(a => a.status === 'queued').length
  const scheduledCount = actions.filter(a => a.status === 'scheduled').length
  const completedCount = actions.filter(a => a.status === 'completed').length

  const getTypeIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'content':
        return <FileText className="h-4 w-4" />
      case 'task':
        return <ListTodo className="h-4 w-4" />
      case 'idea':
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ActionItem['type']) => {
    switch (type) {
      case 'content':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      case 'task':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'idea':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
    }
  }

  // Make handleAddAction available globally for other components
  React.useEffect(() => {
    // @ts-ignore - Add to window for global access
    window.addToActionCenter = handleAddAction
    return () => {
      // @ts-ignore
      delete window.addToActionCenter
    }
  }, [])

  return (
    <div
      className={cn(
        'fixed right-0 top-20 z-50 transition-all duration-300',
        isExpanded ? 'w-96' : 'w-14',
        className
      )}
    >
      <Card className="h-[calc(100vh-6rem)] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-sm">Action Center</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mx-auto"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapsed view - Just counter */}
        {!isExpanded && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-2">
            <div className="text-center">
              <div className="rounded-full bg-purple-600 text-white w-10 h-10 flex items-center justify-center font-bold text-sm mb-1">
                {queuedCount}
              </div>
              <p className="text-xs text-muted-foreground">Queued</p>
            </div>
            {scheduledCount > 0 && (
              <div className="text-center">
                <div className="rounded-full bg-blue-600 text-white w-10 h-10 flex items-center justify-center font-bold text-sm mb-1">
                  {scheduledCount}
                </div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            )}
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <>
            {/* Stats */}
            <div className="p-3 border-b">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{queuedCount}</div>
                  <div className="text-xs text-muted-foreground">Queued</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
                  <div className="text-xs text-muted-foreground">Scheduled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
              </div>
            </div>

            {/* Actions List */}
            <ScrollArea className="flex-1 p-3">
              {actions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No actions queued yet</p>
                  <p className="text-xs mt-1">
                    Add content and tasks as you work through MARBA
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <Card
                      key={action.id}
                      className={cn(
                        'p-3',
                        action.status === 'completed' && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn('p-1.5 rounded', getTypeColor(action.type))}>
                          {getTypeIcon(action.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {action.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {action.status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveAction(action.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {action.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {action.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {action.source}
                            </Badge>
                            {action.status === 'queued' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  // TODO: Open calendar picker
                                  handleMarkComplete(action.id)
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Done
                              </Button>
                            )}
                            {action.status === 'scheduled' && action.scheduledDate && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {action.scheduledDate.toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Quick Add Button */}
            <div className="p-3 border-t">
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Example of adding an action
                  handleAddAction({
                    type: 'task',
                    title: 'Review Action Center',
                    description: 'Test the Action Center functionality',
                    source: 'Mirror',
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
