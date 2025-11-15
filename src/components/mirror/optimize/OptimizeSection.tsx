import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionBoard } from './ActionBoard'
import { OpportunityDashboard } from './OpportunityDashboard'
import { ConnectionDiscovery } from './ConnectionDiscovery'
import { ActionItem, ActionPlanner, ActionTimeline } from '@/services/mirror/action-planner'
import { TrendingUp, Users, Calendar, AlertTriangle, Target } from 'lucide-react'
// import { ContentCalendarHub } from '@/components/content-calendar' // Temporarily disabled due to errors

interface OptimizeSectionProps {
  brandId: string
  userId: string
  tactics?: any[]
  pillars?: any[]
  industry?: string
  brandData?: any
  className?: string
}

export const OptimizeSection: React.FC<OptimizeSectionProps> = ({
  brandId,
  userId,
  tactics = [],
  pillars = [],
  industry,
  brandData,
  className
}) => {
  const [actions, setActions] = React.useState<ActionItem[]>([])
  const [timeline, setTimeline] = React.useState<ActionTimeline[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeView, setActiveView] = React.useState<'calendar' | 'actions'>('calendar')

  // Generate actions from tactics on mount or when tactics change
  React.useEffect(() => {
    if (tactics.length > 0) {
      const generatedActions = ActionPlanner.generateActionsFromTactics(tactics)
      setActions(generatedActions)

      // Create 12-week timeline
      const weeklyTimeline = ActionPlanner.createWeeklyTimeline(generatedActions, 12)
      setTimeline(weeklyTimeline)
    }
  }, [tactics])

  const handleStatusChange = (actionId: string, status: ActionItem['status']) => {
    setActions((prev) =>
      prev.map((action) => {
        if (action.id === actionId) {
          const updates: Partial<ActionItem> = { status }

          // Set completed date if marking as completed
          if (status === 'completed' && !action.completed_date) {
            updates.completed_date = new Date().toISOString().split('T')[0]
          }

          return { ...action, ...updates }
        }
        return action
      })
    )
  }

  const handleToggleChecklist = (actionId: string, checklistId: string) => {
    setActions((prev) =>
      prev.map((action) => {
        if (action.id === actionId) {
          const updatedChecklist = action.checklist.map((item) =>
            item.id === checklistId ? { ...item, completed: !item.completed } : item
          )
          return { ...action, checklist: updatedChecklist }
        }
        return action
      })
    )
  }

  const handleGenerateActions = async () => {
    setIsLoading(true)
    try {
      // Re-generate actions from tactics
      const generatedActions = ActionPlanner.generateActionsFromTactics(tactics)
      setActions(generatedActions)

      const weeklyTimeline = ActionPlanner.createWeeklyTimeline(generatedActions, 12)
      setTimeline(weeklyTimeline)
    } catch (error) {
      console.error('Error generating actions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate metrics
  const report = ActionPlanner.generateActionPlanReport(actions)
  const nextActions = ActionPlanner.suggestNextActions(actions, 5)
  const criticalPath = ActionPlanner.calculateCriticalPath(actions)

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with view toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Optimize</h2>
            <p className="text-muted-foreground">Content calendar and action planning</p>
          </div>
          <div className="flex gap-2">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'calendar' | 'actions')}>
              <TabsList>
                <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
                <TabsTrigger value="actions">Action Board</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Opportunity Dashboard - NEW */}
        <section id="opportunity-dashboard">
          <OpportunityDashboard
            brandId={brandId}
            industry={industry}
            brandData={brandData}
          />
        </section>

        {/* Connection Discovery - Phase 6 */}
        <section id="connection-discovery">
          <ConnectionDiscovery brandData={brandData} />
        </section>

        {/* Content Calendar View */}
        {activeView === 'calendar' && (
          <div className="flex items-center justify-center py-12 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Calendar Temporarily Disabled</h3>
              <p className="text-sm text-muted-foreground">
                Calendar component is being updated to fix performance issues
              </p>
            </div>
          </div>
        )}

        {/* Action Board View */}
        {activeView === 'actions' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Action Plan</h3>
                <p className="text-sm text-muted-foreground">Convert tactics into executable tasks with deadlines</p>
              </div>
              <Button onClick={handleGenerateActions} disabled={isLoading || tactics.length === 0}>
                {isLoading ? 'Generating...' : actions.length > 0 ? 'Regenerate Actions' : 'Generate Actions'}
              </Button>
            </div>

        {/* Metrics Cards */}
        {actions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.total_actions}</div>
                <p className="text-xs text-muted-foreground">
                  {report.total_estimated_hours} hours estimated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.completion_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {report.by_status.completed} of {report.total_actions} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.by_status.in_progress}</div>
                <p className="text-xs text-muted-foreground">
                  {report.by_status.not_started} not started
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.by_status.blocked}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{report.overdue_count}</div>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {actions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Actions Yet</CardTitle>
              <CardDescription>
                Generate actions from your tactics, or tactics will be auto-converted when available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tactics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete the Tactics section first to generate action items automatically
                </p>
              ) : (
                <Button onClick={handleGenerateActions} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Actions from Tactics'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="board" className="space-y-4">
            <TabsList>
              <TabsTrigger value="board">Action Board</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="priority">By Priority</TabsTrigger>
              <TabsTrigger value="next">Next Actions</TabsTrigger>
            </TabsList>

            {/* Kanban Board View */}
            <TabsContent value="board" className="space-y-4">
              <ActionBoard
                actions={actions}
                onStatusChange={handleStatusChange}
                onToggleChecklist={handleToggleChecklist}
              />
            </TabsContent>

            {/* Timeline View */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-3">
                {timeline.slice(0, 8).map((week) => {
                  const isOverCapacity = week.allocated_hours > week.capacity_hours
                  const utilizationPercent = (week.allocated_hours / week.capacity_hours) * 100

                  return (
                    <Card key={week.week}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{week.week}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={isOverCapacity ? 'destructive' : 'secondary'}>
                              {week.allocated_hours}h / {week.capacity_hours}h
                            </Badge>
                            <Badge variant="outline">{week.actions.length} actions</Badge>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isOverCapacity ? 'bg-red-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </CardHeader>
                      {week.actions.length > 0 && (
                        <CardContent>
                          <div className="space-y-2">
                            {week.actions.map((action) => (
                              <div
                                key={action.id}
                                className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">{action.title}</span>
                                  {action.owner && (
                                    <span className="text-muted-foreground ml-2">
                                      • {action.owner}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {action.estimated_hours}h
                                  </Badge>
                                  <Badge
                                    variant={
                                      action.priority === 'critical'
                                        ? 'destructive'
                                        : action.priority === 'high'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {action.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Priority View */}
            <TabsContent value="priority" className="space-y-4">
              {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
                const priorityActions = actions.filter((a) => a.priority === priority)

                if (priorityActions.length === 0) return null

                return (
                  <Card key={priority}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{priority} Priority</CardTitle>
                        <Badge variant={priority === 'critical' || priority === 'high' ? 'destructive' : 'secondary'}>
                          {priorityActions.length} actions
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {priorityActions.map((action) => (
                          <div
                            key={action.id}
                            className="flex items-center justify-between p-3 rounded border"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{action.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {action.description}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {action.owner && <span>{action.owner}</span>}
                                <span>•</span>
                                <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{action.estimated_hours}h</span>
                              </div>
                            </div>
                            <Badge>{action.status.replace('_', ' ')}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            {/* Next Actions View */}
            <TabsContent value="next" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Next Actions</CardTitle>
                  <CardDescription>
                    Top priority actions with all dependencies met
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nextActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No actions ready to start. Check blocked actions or dependencies.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {nextActions.map((action, index) => (
                        <div
                          key={action.id}
                          className="flex items-start gap-3 p-3 rounded border"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{action.title}</div>
                            <div className="text-sm text-muted-foreground">{action.description}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{action.priority}</Badge>
                              <Badge variant="outline">{action.estimated_hours}h</Badge>
                              {action.owner && <Badge variant="secondary">{action.owner}</Badge>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(action.id, 'in_progress')}
                            disabled={action.status === 'in_progress'}
                          >
                            {action.status === 'in_progress' ? 'In Progress' : 'Start'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {criticalPath.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Critical Path</CardTitle>
                    <CardDescription>
                      Key actions that determine project timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {criticalPath.map((actionId, index) => {
                        const action = actions.find((a) => a.id === actionId)
                        if (!action) return null

                        return (
                          <div key={actionId} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-1 h-12 bg-primary" />
                            <div className="flex-1">
                              <div className="font-medium">{action.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {action.estimated_hours}h • Due: {new Date(action.due_date).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge>{action.status.replace('_', ' ')}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
          </>
        )}
      </div>
    </div>
  )
}
