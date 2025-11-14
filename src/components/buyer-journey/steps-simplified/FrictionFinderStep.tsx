/**
 * Step 3: Friction Finder
 * AI discovers problems from reviews/data
 * Shows as red dots on journey
 * Drag into "Fix Now" or "Fix Later" buckets
 * Red dots transform to green stars when prioritized
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lightbulb, AlertCircle, Target, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FrictionPoint, SimpleStageDetails, SimpleJourneyStage } from '@/types/buyer-journey'

interface FrictionFinderStepProps {
  stages: SimpleStageDetails[]
  frictionPoints: FrictionPoint[]
  onFrictionPointsUpdate: (frictionPoints: FrictionPoint[]) => void
}

export const FrictionFinderStep: React.FC<FrictionFinderStepProps> = ({
  stages,
  frictionPoints,
  onFrictionPointsUpdate,
}) => {
  const [draggedItem, setDraggedItem] = useState<FrictionPoint | null>(null)

  const handleDragStart = (friction: FrictionPoint) => {
    setDraggedItem(friction)
  }

  const handleDrop = (priority: 'fix-now' | 'fix-later') => {
    if (draggedItem) {
      const updated = frictionPoints.map((f) =>
        f.id === draggedItem.id ? { ...f, priority } : f
      )
      onFrictionPointsUpdate(updated)
      setDraggedItem(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleQuickPrioritize = (frictionId: string, priority: 'fix-now' | 'fix-later') => {
    const updated = frictionPoints.map((f) =>
      f.id === frictionId ? { ...f, priority } : f
    )
    onFrictionPointsUpdate(updated)
  }

  // Categorize friction points
  const uncategorized = frictionPoints.filter((f) => f.priority === 'uncategorized')
  const fixNow = frictionPoints.filter((f) => f.priority === 'fix-now')
  const fixLater = frictionPoints.filter((f) => f.priority === 'fix-later')

  // Get stage color
  const getStageColor = (stage: SimpleJourneyStage) => {
    const stageDetails = stages.find((s) => s.stage === stage)
    return stageDetails?.color || '#gray-500'
  }

  return (
    <div className="space-y-8">
      {/* AI Discovery Notice */}
      <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-sm text-purple-900 dark:text-purple-100">
          <strong>AI Discovery:</strong> We've analyzed your customer data and found {frictionPoints.length} potential friction points. Drag each one into "Fix Now" for immediate action or "Fix Later" to track for future improvement.
        </AlertDescription>
      </Alert>

      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{uncategorized.length}</div>
            <div className="text-sm text-muted-foreground">To Review</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{fixNow.length}</div>
            <div className="text-sm text-green-700 dark:text-green-300">Fix Now</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{fixLater.length}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Fix Later</div>
          </CardContent>
        </Card>
      </div>

      {/* Three-column Layout: Uncategorized | Fix Now | Fix Later */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uncategorized Problems */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              Problems Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uncategorized.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                All problems have been categorized! 🎉
              </div>
            ) : (
              uncategorized.map((friction) => (
                <FrictionCard
                  key={friction.id}
                  friction={friction}
                  stageColor={getStageColor(friction.stage)}
                  onDragStart={() => handleDragStart(friction)}
                  onQuickAction={(priority) => handleQuickPrioritize(friction.id, priority)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Fix Now Bucket */}
        <Card
          className={cn(
            'border-2 transition-colors',
            draggedItem ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-green-300'
          )}
          onDrop={() => handleDrop('fix-now')}
          onDragOver={handleDragOver}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Target className="h-5 w-5" />
              Fix Now
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              High-priority issues to address immediately
            </p>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[200px]">
            {fixNow.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Drag problems here to prioritize
              </div>
            ) : (
              fixNow.map((friction) => (
                <FrictionCard
                  key={friction.id}
                  friction={friction}
                  stageColor={getStageColor(friction.stage)}
                  isPrioritized
                  priorityColor="green"
                  onDragStart={() => handleDragStart(friction)}
                  onQuickAction={(priority) => handleQuickPrioritize(friction.id, priority)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Fix Later Bucket */}
        <Card
          className={cn(
            'border-2 transition-colors',
            draggedItem ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-blue-300'
          )}
          onDrop={() => handleDrop('fix-later')}
          onDragOver={handleDragOver}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
              Fix Later
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Track for future improvement
            </p>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[200px]">
            {fixLater.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Drag problems here to track
              </div>
            ) : (
              fixLater.map((friction) => (
                <FrictionCard
                  key={friction.id}
                  friction={friction}
                  stageColor={getStageColor(friction.stage)}
                  isPrioritized
                  priorityColor="blue"
                  onDragStart={() => handleDragStart(friction)}
                  onQuickAction={(priority) => handleQuickPrioritize(friction.id, priority)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Journey with Friction Dots */}
      {frictionPoints.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle>Your Journey with Friction Points</CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyWithFrictionDots
              stages={stages}
              frictionPoints={frictionPoints}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Friction Card Component (draggable)
 */
interface FrictionCardProps {
  friction: FrictionPoint
  stageColor: string
  isPrioritized?: boolean
  priorityColor?: 'green' | 'blue'
  onDragStart: () => void
  onQuickAction: (priority: 'fix-now' | 'fix-later') => void
}

const FrictionCard: React.FC<FrictionCardProps> = ({
  friction,
  stageColor,
  isPrioritized = false,
  priorityColor,
  onDragStart,
  onQuickAction,
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'p-4 rounded-lg border-2 cursor-move transition-all hover:shadow-lg',
        isPrioritized && priorityColor === 'green' && 'bg-green-50 dark:bg-green-900/20 border-green-300',
        isPrioritized && priorityColor === 'blue' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
        !isPrioritized && 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Stage Badge */}
      <Badge
        className="mb-2 text-xs"
        style={{ backgroundColor: stageColor, color: 'white' }}
      >
        {friction.stage} stage
      </Badge>

      {/* Problem Description */}
      <div className="text-sm font-medium mb-2">{friction.description}</div>

      {/* Suggested Fix */}
      <div className="text-xs text-muted-foreground mb-3">
        <span className="font-semibold">Fix:</span> {friction.suggested_fix}
      </div>

      {/* Source */}
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="text-xs">
          {friction.source === 'reviews' && '💬 Reviews'}
          {friction.source === 'analytics' && '📊 Analytics'}
          {friction.source === 'ai' && '🤖 AI'}
        </Badge>

        {/* Quick Actions (only for uncategorized) */}
        {!isPrioritized && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onQuickAction('fix-now')
              }}
            >
              Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onQuickAction('fix-later')
              }}
            >
              Later
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Journey with Friction Dots Visualization
 */
interface JourneyWithFrictionDotsProps {
  stages: SimpleStageDetails[]
  frictionPoints: FrictionPoint[]
}

const JourneyWithFrictionDots: React.FC<JourneyWithFrictionDotsProps> = ({
  stages,
  frictionPoints,
}) => {
  return (
    <div className="relative py-8">
      {/* Timeline */}
      <div className="flex justify-between items-center mb-12">
        {stages.map((stage) => {
          const stageFriction = frictionPoints.filter((f) => f.stage === stage.stage)
          const fixNowCount = stageFriction.filter((f) => f.priority === 'fix-now').length
          const fixLaterCount = stageFriction.filter((f) => f.priority === 'fix-later').length
          const uncategorizedCount = stageFriction.filter((f) => f.priority === 'uncategorized').length

          return (
            <div key={stage.stage} className="text-center relative">
              {/* Stage */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl mb-2 mx-auto"
                style={{ backgroundColor: stage.color }}
              >
                {stage.stage === 'discover' && '🔍'}
                {stage.stage === 'research' && '📚'}
                {stage.stage === 'decide' && '✅'}
                {stage.stage === 'buy' && '🛒'}
                {stage.stage === 'love' && '❤️'}
              </div>

              <div className="text-xs font-medium mb-1">{stage.label}</div>

              {/* Friction Dots */}
              <div className="flex gap-1 justify-center mt-2">
                {uncategorizedCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {uncategorizedCount} ⚠️
                  </Badge>
                )}
                {fixNowCount > 0 && (
                  <Badge className="text-xs bg-green-500">
                    {fixNowCount} ✓
                  </Badge>
                )}
                {fixLaterCount > 0 && (
                  <Badge className="text-xs bg-blue-500">
                    {fixLaterCount} 📌
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
