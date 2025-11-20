/**
 * Wizard Progress Component
 *
 * Visual progress indicator showing current step, completed steps,
 * and overall completion percentage for the UVP wizard.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { WizardStep, WizardProgress as WizardProgressType } from '@/types/uvp-wizard'
import { WIZARD_STEPS, getStepConfig } from '@/config/uvp-wizard-steps'

/**
 * WizardProgress component props
 */
interface WizardProgressProps {
  progress: WizardProgressType
  onStepClick?: (step: WizardStep) => void
  className?: string
}

/**
 * Wizard Progress Component
 */
export const WizardProgress: React.FC<WizardProgressProps> = ({
  progress,
  onStepClick,
  className,
}) => {
  // Filter out welcome and complete steps from progress bar
  const progressSteps: WizardStep[] = WIZARD_STEPS.filter(
    (step) => step !== 'welcome' && step !== 'complete' && step !== 'differentiation'
  ) as WizardStep[]

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {progress.progress_percentage}% Complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="relative">
        {/* Connection line */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 bg-muted"
          style={{
            width: 'calc(100% - 2.5rem)',
            marginLeft: '1.25rem',
          }}
        />

        {/* Steps */}
        <div className="relative grid grid-cols-6 gap-2">
          {progressSteps.map((step, index) => {
            const config = getStepConfig(step)
            const isCurrent = progress.current_step === step
            const isCompleted = progress.completed_steps.includes(step)

            // Allow clicking on completed steps, current step, and any step before/at current progress
            const currentStepIndex = progressSteps.indexOf(progress.current_step)
            const isClickable = isCompleted || isCurrent || index <= currentStepIndex

            return (
              <button
                key={step}
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  isClickable && 'cursor-pointer hover:opacity-80',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-300',
                    isCurrent &&
                      'border-primary bg-primary text-primary-foreground shadow-lg',
                    isCompleted &&
                      !isCurrent &&
                      'border-green-500 bg-green-500 text-white',
                    !isCurrent && !isCompleted && 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs font-medium text-center',
                      isCurrent && 'text-foreground',
                      !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {config.title.split(' ')[0]}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-primary font-semibold mt-0.5">
                      Current
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Validation Status */}
      {!progress.is_valid && progress.validation_errors && (
        <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            {Object.keys(progress.validation_errors).length} field
            {Object.keys(progress.validation_errors).length > 1 ? 's' : ''} need
            {Object.keys(progress.validation_errors).length === 1 ? 's' : ''} attention
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Compact Wizard Progress (for smaller spaces)
 */
interface CompactWizardProgressProps {
  currentStep?: WizardStep
  completedSteps?: WizardStep[]
  percentage?: number
  progress?: WizardProgressType
  className?: string
}

export const CompactWizardProgress: React.FC<CompactWizardProgressProps> = ({
  currentStep,
  completedSteps,
  percentage,
  progress,
  className,
}) => {
  // Use individual props if provided, otherwise fall back to progress object
  const step = currentStep || progress?.current_step || 'welcome'
  const progressPercentage = percentage ?? progress?.progress_percentage ?? 0

  const currentIndex = WIZARD_STEPS.indexOf(step)
  const totalSteps = WIZARD_STEPS.length - 2 // Exclude welcome and complete

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
        Step {Math.max(1, currentIndex)} of {totalSteps}
      </span>
    </div>
  )
}
