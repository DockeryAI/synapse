/**
 * Goal Progress Tracker Component
 *
 * Displays progress tracking for all active objectives from mirror_intend_objectives table.
 * Features real-time progress calculation, velocity-based projections, industry benchmarking,
 * and visual progress indicators with success probability scoring.
 *
 * Tasks: 420-427
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnalyticsService } from '@/services/analytics/analytics.service'
import type { GoalProgress, Objective } from '@/types/analytics.types'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface GoalProgressTrackerProps {
  brandId: string
  objectives: Objective[]
  className?: string
}

export const GoalProgressTracker: React.FC<GoalProgressTrackerProps> = ({
  brandId,
  objectives,
  className,
}) => {
  const [progressData, setProgressData] = React.useState<Record<string, GoalProgress>>({})
  const [expandedGoals, setExpandedGoals] = React.useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (objectives.length > 0) {
      loadProgressData()
    }
  }, [objectives])

  const loadProgressData = async () => {
    setIsLoading(true)
    try {
      const progressMap: Record<string, GoalProgress> = {}

      for (const objective of objectives) {
        try {
          const progress = await AnalyticsService.calculateGoalProgress(objective.id)
          progressMap[objective.id] = progress
        } catch (error) {
          // Skip objectives that don't have progress data yet
          console.warn(`[GoalProgressTracker] Skipping objective ${objective.id}:`, error)
        }
      }

      setProgressData(progressMap)
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  const getStatusColor = (status: GoalProgress['onTrackStatus']) => {
    switch (status) {
      case 'ahead':
        return 'bg-green-50 border-green-300 text-green-900'
      case 'on-track':
        return 'bg-blue-50 border-blue-300 text-blue-900'
      case 'slightly-behind':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900'
      case 'behind':
        return 'bg-red-50 border-red-300 text-red-900'
    }
  }

  const getStatusIcon = (status: GoalProgress['onTrackStatus']) => {
    switch (status) {
      case 'ahead':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'on-track':
        return <Target className="h-5 w-5 text-blue-600" />
      case 'slightly-behind':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'behind':
        return <AlertCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusLabel = (status: GoalProgress['onTrackStatus']) => {
    switch (status) {
      case 'ahead':
        return 'Ahead of Schedule'
      case 'on-track':
        return 'On Track'
      case 'slightly-behind':
        return 'Slightly Behind'
      case 'behind':
        return 'Behind Schedule'
    }
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toFixed(0)
  }

  const calculateSuccessProbability = (progress: GoalProgress): number => {
    const { progressPercentage, timeRemaining, velocity } = progress
    const remaining = progress.targetValue - progress.currentValue

    if (progressPercentage >= 100) return 100

    if (velocity <= 0) return 10

    const daysNeeded = remaining / velocity
    const probability = Math.min(100, Math.max(0, ((timeRemaining - daysNeeded) / timeRemaining) * 100 + 50))

    return Math.round(probability)
  }

  if (objectives.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
          <p className="text-sm text-muted-foreground">
            Set objectives in the Intend phase to start tracking progress
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Goals</CardDescription>
            <CardTitle className="text-3xl">{objectives.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>On Track</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {Object.values(progressData).filter((p) => p.onTrackStatus === 'ahead' || p.onTrackStatus === 'on-track')
                .length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>At Risk</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {Object.values(progressData).filter((p) => p.onTrackStatus === 'slightly-behind').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Behind</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {Object.values(progressData).filter((p) => p.onTrackStatus === 'behind').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Goal Cards */}
      {objectives.map((objective) => {
        const progress = progressData[objective.id]
        if (!progress) return null

        const isExpanded = expandedGoals.has(objective.id)
        const successProbability = calculateSuccessProbability(progress)

        return (
          <Card key={objective.id} className={`border-2 ${getStatusColor(progress.onTrackStatus)}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(progress.onTrackStatus)}
                    <CardTitle className="text-lg">{progress.objectiveName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline">{getStatusLabel(progress.onTrackStatus)}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {progress.timeRemaining} days remaining
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleExpanded(objective.id)}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {formatValue(progress.currentValue)} / {formatValue(progress.targetValue)}
                  </span>
                  <span className="text-sm font-bold">
                    {Math.min(100, progress.progressPercentage).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, progress.progressPercentage)}
                  className="h-3"
                />
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Velocity</div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{formatValue(progress.velocity)}/day</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Projected Date</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {new Date(progress.projectedCompletionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Success Probability</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{successProbability}%</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t">
                  {/* Industry Benchmark */}
                  {progress.industryBenchmark && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Industry Benchmark</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatValue(progress.industryBenchmark)}</span>
                        {progress.currentValue > progress.industryBenchmark ? (
                          <Badge variant="default" className="bg-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Above
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Below
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">Timeline</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="font-medium text-foreground">
                          {new Date(progress.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Date:</span>
                        <span className="font-medium text-foreground">
                          {new Date(progress.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projected Completion:</span>
                        <span className={`font-medium ${
                          new Date(progress.projectedCompletionDate) <= new Date(progress.targetDate)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {new Date(progress.projectedCompletionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">Recommendations</div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {progress.onTrackStatus === 'behind' && (
                        <>
                          <li>• Increase velocity by {((progress.targetValue - progress.currentValue) / progress.timeRemaining - progress.velocity).toFixed(0)} units/day</li>
                          <li>• Consider adjusting target date or reallocating resources</li>
                          <li>• Review tactics that are working for similar objectives</li>
                        </>
                      )}
                      {progress.onTrackStatus === 'slightly-behind' && (
                        <>
                          <li>• Small course correction needed to stay on track</li>
                          <li>• Monitor closely for next 7 days</li>
                          <li>• Consider minor tactical adjustments</li>
                        </>
                      )}
                      {(progress.onTrackStatus === 'on-track' || progress.onTrackStatus === 'ahead') && (
                        <>
                          <li>• Maintain current strategy - it's working well</li>
                          <li>• Document successful tactics for future campaigns</li>
                          <li>• Consider stretching target if consistently ahead</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
