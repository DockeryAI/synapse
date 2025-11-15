/**
 * WWHEnhancementFlow Component
 * Multi-step flow: P→S→O → WHY → HOW → WHAT → Reveal
 * Orchestrates the complete UVP + WWH enhancement experience
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProblemSolutionFlow } from './ProblemSolutionFlow'
import { UVPPurposeStep } from './UVPPurposeStep'
import { UVPApproachStep } from './UVPApproachStep'
import { UVPOfferingsStep } from './UVPOfferingsStep'
import { RevealExperience } from './RevealExperience'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { WWHEnhancer } from '@/services/mirror/wwh-enhancer'
import type { WWHEnhancedData } from '@/services/mirror/wwh-enhancer'

interface WWHEnhancementFlowProps {
  brandData?: any
  onComplete: (data: {
    problem: string
    solution: string
    outcome: string
    purpose: string
    approach: string[]
    offerings: string[]
    wwhData: WWHEnhancedData
  }) => void
  className?: string
}

type FlowStep = 'pso' | 'why' | 'how' | 'what' | 'reveal'

export const WWHEnhancementFlow: React.FC<WWHEnhancementFlowProps> = ({
  brandData,
  onComplete,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState<FlowStep>('pso')
  const [completedSteps, setCompletedSteps] = React.useState<Set<FlowStep>>(new Set())

  // Form data
  const [problem, setProblem] = React.useState('')
  const [solution, setSolution] = React.useState('')
  const [outcome, setOutcome] = React.useState('')
  const [purpose, setPurpose] = React.useState('')
  const [approach, setApproach] = React.useState<string[]>([])
  const [offerings, setOfferings] = React.useState<string[]>([])

  // Reveal data
  const [wwhData, setWwhData] = React.useState<WWHEnhancedData | null>(null)
  const [showReveal, setShowReveal] = React.useState(false)

  const steps: { key: FlowStep; label: string; completed: boolean }[] = [
    { key: 'pso', label: 'Problem → Solution → Outcome', completed: completedSteps.has('pso') },
    { key: 'why', label: 'WHY: Purpose', completed: completedSteps.has('why') },
    { key: 'how', label: 'HOW: Approach', completed: completedSteps.has('how') },
    { key: 'what', label: 'WHAT: Offerings', completed: completedSteps.has('what') },
    { key: 'reveal', label: 'Enhanced WWH', completed: completedSteps.has('reveal') },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)
  const progress = ((completedSteps.size) / steps.length) * 100

  const handlePSOComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add('pso'))
    setCurrentStep('why')
  }

  const handleWhyComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add('why'))
    setCurrentStep('how')
  }

  const handleHowComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add('how'))
    setCurrentStep('what')
  }

  const handleWhatComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add('what'))

    // Generate WWH enhanced data
    const enhanced = WWHEnhancer.enhance({
      brandName: brandData?.name || 'Your Brand',
      industry: brandData?.industry,
      originalMission: brandData?.full_profile_data?.mission,
      originalVision: brandData?.full_profile_data?.vision,
      originalOfferings: brandData?.full_profile_data?.offerings,
      problemStatement: problem,
      solutionStatement: solution,
      outcomeStatement: outcome,
      purposeStatement: purpose,
      uniqueApproach: approach,
      coreOfferings: offerings,
    })

    setWwhData(enhanced)
    setCurrentStep('reveal')
    setShowReveal(true)
  }

  const handleRevealComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add('reveal'))

    // Call parent completion handler
    if (wwhData) {
      onComplete({
        problem,
        solution,
        outcome,
        purpose,
        approach,
        offerings,
        wwhData,
      })
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key)
    }
  }

  return (
    <div className={className}>
      {/* Progress Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Your Progress</span>
                <span className="text-muted-foreground">{completedSteps.size}/{steps.length} steps</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div
                  key={step.key}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold
                      ${
                        step.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : step.key === currentStep
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
                      }
                    `}
                  >
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className="text-xs text-center max-w-[80px] leading-tight">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      {currentStepIndex > 0 && currentStep !== 'reveal' && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Problem → Solution → Outcome */}
        {currentStep === 'pso' && (
          <ProblemSolutionFlow
            problem={problem}
            solution={solution}
            outcome={outcome}
            onProblemChange={setProblem}
            onSolutionChange={setSolution}
            onOutcomeChange={setOutcome}
            onSave={handlePSOComplete}
          />
        )}

        {/* Step 2: WHY - Purpose */}
        {currentStep === 'why' && (
          <UVPPurposeStep
            value={purpose}
            onChange={setPurpose}
            onNext={handleWhyComplete}
            brandData={brandData}
          />
        )}

        {/* Step 3: HOW - Approach */}
        {currentStep === 'how' && (
          <UVPApproachStep
            values={approach}
            onChange={setApproach}
            onNext={handleHowComplete}
            brandData={brandData}
          />
        )}

        {/* Step 4: WHAT - Offerings */}
        {currentStep === 'what' && (
          <UVPOfferingsStep
            values={offerings}
            onChange={setOfferings}
            onComplete={handleWhatComplete}
            brandData={brandData}
          />
        )}

        {/* Step 5: Reveal Experience */}
        {currentStep === 'reveal' && showReveal && wwhData && (
          <RevealExperience
            data={wwhData}
            problem={problem}
            solution={solution}
            outcome={outcome}
            onComplete={handleRevealComplete}
            onClose={() => setShowReveal(false)}
          />
        )}
      </div>
    </div>
  )
}
