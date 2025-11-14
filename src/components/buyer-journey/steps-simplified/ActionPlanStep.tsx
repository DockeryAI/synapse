/**
 * Step 4: Action Plan
 * Shows complete journey map with all elements
 * Top 3 "Fix Now" items as checklist
 * Download/export functionality
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  CheckCircle2,
  Target,
  Calendar,
  TrendingUp,
  Sparkles,
  PartyPopper,
} from 'lucide-react'
import { AnimatedJourneyTimeline } from '../visual/AnimatedJourneyTimeline'
import { MinimalCustomerAvatar } from '../visual/CustomerAvatar'
import type {
  CustomerPersona,
  SimpleStageDetails,
  FrictionPoint,
  ActionItem,
} from '@/types/buyer-journey'

interface ActionPlanStepProps {
  persona: CustomerPersona
  stages: SimpleStageDetails[]
  frictionPoints: FrictionPoint[]
  actionItems: ActionItem[]
  onActionItemToggle: (itemId: string) => void
  onDownloadJourney: () => void
}

export const ActionPlanStep: React.FC<ActionPlanStepProps> = ({
  persona,
  stages,
  frictionPoints,
  actionItems,
  onActionItemToggle,
  onDownloadJourney,
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // Initialize checked items from persisted actionItems on mount and when actionItems change
  useEffect(() => {
    const initialChecked = new Set(
      actionItems.filter((item) => item.completed).map((item) => item.id)
    )
    setCheckedItems(initialChecked)
  }, [actionItems])

  const handleCheckItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
    onActionItemToggle(itemId)
  }

  // Get top 3 Fix Now friction points and convert to action items
  const fixNowItems = frictionPoints
    .filter((f) => f.priority === 'fix-now')
    .slice(0, 3)
    .map((f, index) => {
      const existing = actionItems.find((a) => a.id === f.id)
      return (
        existing || {
          id: f.id,
          title: f.description,
          description: f.suggested_fix,
          stage: f.stage,
          estimated_time: index === 0 ? '1-2 days' : index === 1 ? '3-5 days' : '1 week',
          impact: 'high' as const,
          completed: false, // Initialize as not completed
        }
      )
    })

  const completionPercentage = Math.round((checkedItems.size / Math.max(1, fixNowItems.length)) * 100)

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300">
        <PartyPopper className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-sm text-green-900 dark:text-green-100">
          <strong>Journey Map Complete!</strong> You now have a clear view of your customer's path and actionable steps to improve it.
        </AlertDescription>
      </Alert>

      {/* Customer Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <MinimalCustomerAvatar persona={persona} size={64} />
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Journey Map for:</div>
              <div className="text-2xl font-bold" style={{ color: persona.avatar_color }}>
                {persona.name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{persona.quick_description}</div>
            </div>
            <Button onClick={onDownloadJourney} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete Journey Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Your Complete Customer Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedJourneyTimeline
            stages={stages}
            completedStages={stages.filter((s) => s.key_concern).map((s) => s.stage)}
            showAvatar={true}
          />

          {/* Journey Stages Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            {stages.map((stage) => (
              <Card key={stage.stage} className="border-2" style={{ borderColor: stage.color }}>
                <CardContent className="p-4">
                  <div className="text-center mb-2">
                    <div
                      className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white text-xl mb-2"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.stage === 'discover' && '🔍'}
                      {stage.stage === 'research' && '📚'}
                      {stage.stage === 'decide' && '✅'}
                      {stage.stage === 'buy' && '🛒'}
                      {stage.stage === 'love' && '❤️'}
                    </div>
                    <div className="font-semibold text-sm" style={{ color: stage.color }}>
                      {stage.label}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-3">
                    {stage.key_concern || 'No concern defined'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items Checklist */}
      <Card className="border-2 border-green-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Your Action Plan - Top 3 Priorities
            </CardTitle>
            <Badge className="bg-green-600 text-white">
              {completionPercentage}% Complete
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Start with these high-impact improvements to remove friction from your customer journey
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {fixNowItems.length === 0 ? (
            <Alert>
              <AlertDescription>
                No action items yet. Go back to Step 3 to prioritize some friction points as "Fix Now".
              </AlertDescription>
            </Alert>
          ) : (
            fixNowItems.map((item, index) => (
              <ActionItemCard
                key={item.id}
                item={item}
                index={index + 1}
                isChecked={checkedItems.has(item.id)}
                onCheck={() => handleCheckItem(item.id)}
                stageColor={stages.find((s) => s.stage === item.stage)?.color || '#gray-500'}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stages.length}</div>
            <div className="text-sm text-muted-foreground">Journey Stages Mapped</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{frictionPoints.length}</div>
            <div className="text-sm text-muted-foreground">Friction Points Identified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{fixNowItems.length}</div>
            <div className="text-sm text-muted-foreground">Priority Actions</div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Guidance */}
      <Card className="bg-purple-50 dark:bg-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Mirror Diagnostics:</strong> Your journey map will now enhance Customer Truth analysis with real ICP data instead of assumptions
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Content Calendar:</strong> Generate targeted content for each journey stage using your friction points and concerns
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Action Tracking:</strong> Your action items are saved and can be tracked in your dashboard
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Action Item Card Component
 */
interface ActionItemCardProps {
  item: ActionItem
  index: number
  isChecked: boolean
  onCheck: () => void
  stageColor: string
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({
  item,
  index,
  isChecked,
  onCheck,
  stageColor,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isChecked ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <Checkbox
          checked={isChecked}
          onCheckedChange={onCheck}
          className="mt-1"
        />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{index}
              </Badge>
              <Badge style={{ backgroundColor: stageColor, color: 'white' }} className="text-xs">
                {item.stage}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {item.estimated_time}
            </div>
          </div>

          <div className={`font-medium mb-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </div>

          <div className="text-sm text-muted-foreground">{item.description}</div>

          {/* Impact Badge */}
          <div className="mt-2">
            <Badge
              variant={item.impact === 'high' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {item.impact === 'high' && '🔥 High Impact'}
              {item.impact === 'medium' && '⚡ Medium Impact'}
              {item.impact === 'low' && '💡 Low Impact'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
