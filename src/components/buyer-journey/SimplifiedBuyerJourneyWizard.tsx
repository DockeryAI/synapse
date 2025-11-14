/**
 * Simplified Buyer Journey Wizard
 * 4-step visual journey builder that's simple and delightful
 * Step 1: Select Customer → Step 2: Map Journey → Step 3: Find Friction → Step 4: Action Plan
 */

import React, { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react'
import { SimplifiedJourneyProvider, useSimplifiedJourney } from '@/contexts/SimplifiedJourneyContext'
import { getPersonasForIndustry } from '@/data/buyer-personas'

// Step Components
import { CustomerSelectionStep } from './steps-simplified/CustomerSelectionStep'
import { JourneyMappingStep } from './steps-simplified/JourneyMappingStep'
import { FrictionFinderStep } from './steps-simplified/FrictionFinderStep'
import { ActionPlanStep } from './steps-simplified/ActionPlanStep'

interface SimplifiedBuyerJourneyWizardProps {
  brandId: string
  industry?: string
  onComplete?: () => void
  onCancel?: () => void
}

/**
 * Inner Wizard Component (has access to context)
 */
const SimplifiedBuyerJourneyWizardInner: React.FC<{
  industry: string
  onComplete?: () => void
  onCancel?: () => void
}> = ({ industry, onComplete, onCancel }) => {
  const {
    currentStep,
    selectedPersona,
    stages,
    frictionPoints,
    actionItems,
    uvpData,
    isLoading,
    setPersona,
    updateStages,
    updateFrictionPoints,
    toggleActionItem,
    nextStep,
    previousStep,
    saveJourney,
    downloadJourneyMap,
  } = useSimplifiedJourney()

  // Auto-save on step changes
  useEffect(() => {
    if (selectedPersona) {
      saveJourney()
    }
  }, [currentStep, selectedPersona, saveJourney])

  // Step configuration
  const STEPS = [
    {
      id: 'customer' as const,
      title: "Who's Your Customer?",
      description: 'Select or create your ideal customer persona',
    },
    {
      id: 'journey' as const,
      title: 'Map Their Journey',
      description: '5 stages from discovery to advocacy',
    },
    {
      id: 'friction' as const,
      title: 'Find the Friction',
      description: 'Identify and prioritize problems',
    },
    {
      id: 'action' as const,
      title: 'Your Action Plan',
      description: 'Top 3 priorities to improve the journey',
    },
  ]

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const currentStepConfig = STEPS[currentStepIndex]
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  // Validation before moving forward
  const canProceed = () => {
    switch (currentStep) {
      case 'customer':
        return !!selectedPersona
      case 'journey':
        return stages.every((s) => s.key_concern && s.key_concern.trim())
      case 'friction':
        return frictionPoints.some((f) => f.priority !== 'uncategorized')
      case 'action':
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (!canProceed()) {
      return
    }

    await saveJourney()

    if (currentStepIndex === STEPS.length - 1) {
      // Final step - mark as complete
      if (onComplete) {
        onComplete()
      }
    } else {
      nextStep()
    }
  }

  const handlePrevious = async () => {
    await saveJourney()
    previousStep()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Build Your Buyer Journey</h1>
              <p className="text-muted-foreground mt-1">
                Watch your customer's journey unfold as you answer simple questions
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <span className="text-muted-foreground">{currentStepConfig.title}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Pills */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const isCurrent = step.id === currentStep
              const isPast = index < currentStepIndex

              return (
                <div
                  key={step.id}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${isCurrent ? 'bg-primary text-primary-foreground scale-105' : ''}
                    ${isPast ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : ''}
                    ${!isCurrent && !isPast ? 'bg-gray-100 dark:bg-gray-800 text-muted-foreground' : ''}
                  `}
                >
                  {isPast && '✓ '}
                  {step.title}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-8">
              {currentStep === 'customer' && (
                <CustomerSelectionStep
                  industry={industry}
                  selectedPersona={selectedPersona || undefined}
                  onPersonaSelect={setPersona}
                  brandName={uvpData?.brand_name}
                  hasUVPData={!!uvpData}
                  isEnhancing={isLoading}
                />
              )}

              {currentStep === 'journey' && selectedPersona && (
                <JourneyMappingStep
                  persona={selectedPersona}
                  stages={stages}
                  onStagesUpdate={updateStages}
                />
              )}

              {currentStep === 'friction' && (
                <FrictionFinderStep
                  stages={stages}
                  frictionPoints={frictionPoints}
                  onFrictionPointsUpdate={updateFrictionPoints}
                />
              )}

              {currentStep === 'action' && selectedPersona && (
                <ActionPlanStep
                  persona={selectedPersona}
                  stages={stages}
                  frictionPoints={frictionPoints}
                  actionItems={actionItems}
                  onActionItemToggle={toggleActionItem}
                  onDownloadJourney={downloadJourneyMap}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {!canProceed() && (
              <span className="text-amber-600">
                {currentStep === 'customer' && 'Select a customer persona to continue'}
                {currentStep === 'journey' && 'Define key concerns for all stages'}
                {currentStep === 'friction' && 'Prioritize at least one friction point'}
              </span>
            )}
          </div>

          <Button onClick={handleNext} disabled={!canProceed()} size="lg">
            {currentStepIndex === STEPS.length - 1 ? (
              <>
                Complete Journey
                <Check className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Wizard Component (provides context)
 */
export const SimplifiedBuyerJourneyWizard: React.FC<SimplifiedBuyerJourneyWizardProps> = ({
  brandId,
  industry = 'Professional Services',
  onComplete,
  onCancel,
}) => {
  return (
    <SimplifiedJourneyProvider brandId={brandId}>
      <SimplifiedBuyerJourneyWizardInner
        industry={industry}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </SimplifiedJourneyProvider>
  )
}
