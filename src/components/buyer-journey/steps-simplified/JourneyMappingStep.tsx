/**
 * Step 2: Journey Mapping
 * Shows 5-stage timeline that draws itself
 * Click each stage to view/edit the key concern
 * Customer avatar "walks" the journey
 */

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb, Sparkles } from 'lucide-react'
import { AnimatedJourneyTimeline } from '../visual/AnimatedJourneyTimeline'
import { MinimalCustomerAvatar } from '../visual/CustomerAvatar'
import type { SimpleStageDetails, CustomerPersona, SimpleJourneyStage } from '@/types/buyer-journey'
import { SIMPLIFIED_JOURNEY_STAGES } from '@/types/buyer-journey'

interface JourneyMappingStepProps {
  persona?: CustomerPersona
  stages: SimpleStageDetails[]
  onStagesUpdate: (stages: SimpleStageDetails[]) => void
}

export const JourneyMappingStep: React.FC<JourneyMappingStepProps> = ({
  persona,
  stages,
  onStagesUpdate,
}) => {
  const [selectedStage, setSelectedStage] = useState<SimpleJourneyStage | null>(null)
  const [editingStage, setEditingStage] = useState<SimpleStageDetails | null>(null)

  const selectedStageDetails = stages.find((s) => s.stage === selectedStage)

  const handleStageClick = (stage: SimpleJourneyStage) => {
    setSelectedStage(stage)
    const stageDetails = stages.find((s) => s.stage === stage)
    if (stageDetails) {
      setEditingStage({ ...stageDetails })
    }
  }

  const handleSaveConcern = () => {
    if (editingStage) {
      const updatedStages = stages.map((s) =>
        s.stage === editingStage.stage ? editingStage : s
      )
      onStagesUpdate(updatedStages)
      setSelectedStage(null)
      setEditingStage(null)
    }
  }

  const handleUseSuggestion = (suggestion: string) => {
    if (editingStage) {
      setEditingStage({
        ...editingStage,
        key_concern: suggestion,
      })
    }
  }

  // Calculate completed stages (have key_concern filled)
  const completedStages = stages
    .filter((s) => s.key_concern && s.key_concern.trim())
    .map((s) => s.stage)

  return (
    <div className="space-y-8">
      {/* Customer Context */}
      {persona && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MinimalCustomerAvatar persona={persona} size={48} />
                <div>
                  <div className="text-sm font-medium">Mapping journey for:</div>
                  <div className="text-lg font-bold" style={{ color: persona.avatar_color }}>
                    {persona.name}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{completedStages.length} / {stages.length} stages defined</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Map Their Journey:</strong> Click each stage to define what your customer's biggest concern is at that point. We've suggested concerns based on typical customer behavior.
        </AlertDescription>
      </Alert>

      {/* Animated Journey Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
        <AnimatedJourneyTimeline
          stages={stages}
          currentStage={selectedStage || undefined}
          completedStages={completedStages}
          onStageClick={handleStageClick}
          showAvatar={true}
        />
      </div>

      {/* Stage Editor */}
      {selectedStage && editingStage && (
        <Card className="border-2 animate-in slide-in-from-bottom-4" style={{ borderColor: editingStage.color }}>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: editingStage.color }}
                >
                  <span className="text-2xl text-white">
                    {editingStage.stage === 'discover' && '🔍'}
                    {editingStage.stage === 'research' && '📚'}
                    {editingStage.stage === 'decide' && '✅'}
                    {editingStage.stage === 'buy' && '🛒'}
                    {editingStage.stage === 'love' && '❤️'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: editingStage.color }}>
                    {editingStage.label} Stage
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    What's the biggest concern at this stage?
                  </p>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI-Suggested Concerns (click to use):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingStage.suggested_concerns.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="text-left h-auto py-2 px-3 whitespace-normal"
                    style={{
                      borderColor: editingStage.key_concern === suggestion ? editingStage.color : undefined,
                      backgroundColor: editingStage.key_concern === suggestion ? `${editingStage.color}10` : undefined,
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Or write your own concern:
              </label>
              <Textarea
                value={editingStage.key_concern}
                onChange={(e) =>
                  setEditingStage({ ...editingStage, key_concern: e.target.value })
                }
                placeholder="What's their main worry or question at this stage?"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSaveConcern} style={{ backgroundColor: editingStage.color }}>
                Save & Continue
              </Button>
              <Button variant="outline" onClick={() => setSelectedStage(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      {completedStages.length > 0 && !selectedStage && (
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="text-sm">
              <span className="font-semibold text-green-700 dark:text-green-300">
                Great progress!
              </span>{' '}
              <span className="text-muted-foreground">
                You've defined {completedStages.length} out of {stages.length} stages.
                {completedStages.length === stages.length && ' Your customer journey is complete! 🎉'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
