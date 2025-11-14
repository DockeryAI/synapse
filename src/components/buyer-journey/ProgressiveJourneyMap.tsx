/**
 * Progressive Journey Map Component
 * Visually displays the customer journey map that builds as user completes wizard
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { JourneyStageCard } from './JourneyStageCard'
import type { BuyerJourneyMap, WizardStep, JourneyStage } from '@/types/buyer-journey'
import { Users, ArrowRight } from 'lucide-react'

export interface ProgressiveJourneyMapProps {
  currentStep: WizardStep
  completedSteps: WizardStep[]
  journeyData: Partial<BuyerJourneyMap>
  onStageClick?: (stage: JourneyStage) => void
  className?: string
}

// Map wizard steps to what journey data they unlock
const STEP_TO_UNLOCKS: Record<WizardStep, string[]> = {
  'customer-definition': ['icp', 'demographics'],
  'jobs-to-be-done': ['jobs'],
  'journey-stages': ['stages'],
  'touchpoints': ['touchpoints'],
  'pain-points': ['pain_points'],
  'opportunities': ['opportunities'],
  'review': ['all'],
}

export const ProgressiveJourneyMap: React.FC<ProgressiveJourneyMapProps> = ({
  currentStep,
  completedSteps,
  journeyData,
  onStageClick,
  className,
}) => {
  // Determine which stages are unlocked based on completed steps
  const isStageUnlocked = (stage: JourneyStage): boolean => {
    // If touchpoints step is completed, all stages are unlocked
    if (completedSteps.includes('touchpoints')) return true

    // Otherwise check if relevant steps are completed
    const requiredSteps: WizardStep[] = ['customer-definition', 'pain-points']
    return requiredSteps.some(step => completedSteps.includes(step))
  }

  const getStageStatus = (stage: JourneyStage): 'locked' | 'active' | 'complete' => {
    if (!isStageUnlocked(stage)) return 'locked'

    // Check if stage has data
    const hasTouchpoints = journeyData.touchpoints?.some(t => t.stage === stage)
    const hasPainPoints = journeyData.pain_points?.some(p => p.stage === stage)

    if (hasTouchpoints || hasPainPoints) return 'complete'
    if (currentStep === 'touchpoints' || currentStep === 'pain-points') return 'active'

    return 'active'
  }

  const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'advocacy']

  return (
    <div className={cn('space-y-6', className)}>
      {/* ICP Display - Shows when customer-definition is complete */}
      <AnimatePresence>
        {completedSteps.includes('customer-definition') && journeyData.ideal_customer_profile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border-2 border-blue-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ideal Customer Profile</h3>
                <p className="text-xs text-muted-foreground">
                  {journeyData.ideal_customer_profile.segment_name || 'Your target customer'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journey Stages */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Customer Journey Stages
        </h4>

        {stages.map((stage, index) => {
          const status = getStageStatus(stage)
          const touchpoints = journeyData.touchpoints?.filter(t => t.stage === stage) || []
          const painPoints = journeyData.pain_points?.filter(p => p.stage === stage) || []

          return (
            <React.Fragment key={stage}>
              <JourneyStageCard
                stage={stage}
                status={status}
                touchpoints={touchpoints}
                painPoints={painPoints}
                onClick={() => status !== 'locked' && onStageClick?.(stage)}
              />

              {/* Arrow connector - only show between stages */}
              {index < stages.length - 1 && (
                <div className="flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: status === 'locked' ? 0.3 : 1,
                      scale: 1
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ArrowRight className={cn(
                      'h-4 w-4',
                      status === 'locked' ? 'text-muted-foreground/30' : 'text-primary'
                    )} />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="text-center pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          {completedSteps.length === 0 && 'Start mapping your customer journey'}
          {completedSteps.length > 0 && completedSteps.length < 6 && `${completedSteps.length} of 6 steps complete`}
          {completedSteps.length === 6 && '✓ Journey map complete'}
        </p>
      </div>
    </div>
  )
}
