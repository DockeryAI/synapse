/**
 * Buyer Journey Wizard
 * Interactive wizard for defining customer journey with JTBD framework
 */

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, X, Check, AlertCircle } from 'lucide-react'
import { useBuyerJourney } from '@/contexts/BuyerJourneyContext'
import { type WizardStep } from '@/types/buyer-journey'
import { ProgressiveJourneyMap } from './ProgressiveJourneyMap'

// Step Components
import { CustomerDefinitionStep } from './steps/CustomerDefinitionStep'
import {
  JobsToBeDoneStep,
  JourneyStagesStep,
  TouchpointsStep,
  PainPointsStep,
  OpportunitiesStep,
  ReviewStep,
} from './steps/SimpleWizardSteps'

interface BuyerJourneyWizardProps {
  brandId: string
  onComplete?: () => void
  onCancel?: () => void
  uvpData?: any // Pre-population data from UVP wizard
}

export const BuyerJourneyWizard: React.FC<BuyerJourneyWizardProps> = ({
  brandId,
  onComplete,
  onCancel,
  uvpData,
}) => {
  const {
    wizardProgress,
    journeyMap,
    isLoading,
    error,
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    saveJourney,
    prePopulateFromUVP,
  } = useBuyerJourney()

  const [validationError, setValidationError] = useState<string | null>(null)

  // Pre-populate from UVP data on mount
  useEffect(() => {
    if (uvpData) {
      console.log('[BuyerJourneyWizard] Pre-populating from UVP data')
      prePopulateFromUVP(uvpData)
    }
  }, [uvpData, prePopulateFromUVP])

  // Clear validation error when step changes
  useEffect(() => {
    setValidationError(null)
  }, [wizardProgress.current_step])

  // Step Configuration
  const STEPS: {
    step: WizardStep
    title: string
    description: string
    component: React.ReactNode
  }[] = [
    {
      step: 'customer-definition',
      title: 'Define Your Ideal Customer',
      description: 'Create a detailed profile of who you serve best',
      component: <CustomerDefinitionStep />,
    },
    {
      step: 'jobs-to-be-done',
      title: 'Jobs To Be Done',
      description: 'Identify the functional, emotional, and social jobs customers hire you for',
      component: <JobsToBeDoneStep />,
    },
    {
      step: 'journey-stages',
      title: 'Map Journey Stages',
      description: 'Understand how customers move from awareness to advocacy',
      component: <JourneyStagesStep />,
    },
    {
      step: 'touchpoints',
      title: 'Define Touchpoints',
      description: 'Map where customers interact with your brand',
      component: <TouchpointsStep />,
    },
    {
      step: 'pain-points',
      title: 'Identify Friction',
      description: 'Find where customers experience frustration or drop off',
      component: <PainPointsStep />,
    },
    {
      step: 'opportunities',
      title: 'Map Opportunities',
      description: 'Prioritize improvements that will make the biggest impact',
      component: <OpportunitiesStep />,
    },
    {
      step: 'review',
      title: 'Review & Visualize',
      description: 'See your complete buyer journey map',
      component: <ReviewStep />,
    },
  ]

  const currentStepIndex = STEPS.findIndex(s => s.step === wizardProgress.current_step)
  const currentStepConfig = STEPS[currentStepIndex]
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  // Validation function for current step
  const validateCurrentStep = (): { isValid: boolean; error?: string } => {
    const currentStep = wizardProgress.current_step

    switch (currentStep) {
      case 'customer-definition':
        // Require segment name and at least one pain point, goal, or buying trigger
        if (!journeyMap.ideal_customer_profile?.segment_name?.trim()) {
          return {
            isValid: false,
            error: 'Please provide a Customer Segment Name to continue.',
          }
        }
        const icp = journeyMap.ideal_customer_profile
        const hasContent =
          (icp.pain_points && icp.pain_points.length > 0) ||
          (icp.goals && icp.goals.length > 0) ||
          (icp.buying_triggers && icp.buying_triggers.length > 0)

        if (!hasContent) {
          return {
            isValid: false,
            error: 'Please add at least one pain point, goal, or buying trigger to continue.',
          }
        }
        break

      // Other steps are optional for now (can be enhanced later)
      case 'jobs-to-be-done':
      case 'journey-stages':
      case 'touchpoints':
      case 'pain-points':
      case 'opportunities':
      case 'review':
        break
    }

    return { isValid: true }
  }

  // Handlers
  const handleNext = async () => {
    // Validate current step
    const validation = validateCurrentStep()

    if (!validation.isValid) {
      setValidationError(validation.error || 'Please complete the required fields.')
      console.log('[BuyerJourneyWizard] Validation failed:', validation.error)
      return
    }

    // Clear any validation errors
    setValidationError(null)

    // Mark current step as complete
    completeStep(wizardProgress.current_step)

    // Auto-save progress
    await saveJourney()

    // Move to next step
    if (currentStepIndex < STEPS.length - 1) {
      nextStep()
    } else {
      // On final step, mark journey as complete
      if (onComplete) {
        onComplete()
      }
    }
  }

  const handlePrevious = async () => {
    // Auto-save before navigating back
    await saveJourney()
    previousStep()
  }

  const handleStepClick = async (step: WizardStep) => {
    // Auto-save before switching steps
    await saveJourney()
    goToStep(step)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Define Your Buyer Journey</h1>
              <p className="text-muted-foreground mt-1">
                Map how customers discover, evaluate, and choose your business
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <span className="text-muted-foreground">
                {wizardProgress.completed_steps.length} steps completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((s, index) => {
              const isCompleted = wizardProgress.completed_steps.includes(s.step)
              const isCurrent = s.step === wizardProgress.current_step
              const isAccessible = index <= currentStepIndex || isCompleted

              return (
                <button
                  key={s.step}
                  onClick={() => isAccessible && handleStepClick(s.step)}
                  disabled={!isAccessible}
                  className={`
                    px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isCompleted && !isCurrent ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : ''}
                    ${!isCurrent && !isCompleted && isAccessible ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
                    ${!isAccessible ? 'bg-gray-50 dark:bg-gray-900 text-muted-foreground opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isCompleted && !isCurrent && '✓ '}
                  {s.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Two-column layout: Main content + Journey Map sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Validation Error Display */}
            {validationError && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Required Fields Missing
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {validationError}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle>{currentStepConfig.title}</CardTitle>
                <CardDescription>{currentStepConfig.description}</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {currentStepConfig.component}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0 || isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button onClick={handleNext} disabled={isLoading}>
                {currentStepIndex === STEPS.length - 1 ? (
                  <>
                    Complete Journey Map
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

            {/* UVP Pre-population Notice */}
            {uvpData && currentStepIndex === 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Smart Start:</strong> We've pre-filled some information from your UVP wizard to save you time. Feel free to adjust or expand as needed.
                </p>
              </div>
            )}
          </div>

          {/* Journey Map Sidebar - Right column (1/3 width, sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journey Map</CardTitle>
                  <CardDescription className="text-xs">
                    Watch your customer journey build as you complete each step
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressiveJourneyMap
                    currentStep={wizardProgress.current_step}
                    completedSteps={wizardProgress.completed_steps}
                    journeyData={journeyMap}
                    onStageClick={(stage) => {
                      // TODO: Navigate to relevant step for that stage
                      console.log('Stage clicked:', stage)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

