/**
 * UVP Wizard Main Component
 *
 * Main orchestrator for the UVP wizard. Manages wizard flow, step navigation,
 * and integrates all wizard screens and components.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useUVPWizard } from '@/contexts/UVPWizardContext'
import { getStepConfig, WIZARD_STEPS } from '@/config/uvp-wizard-steps'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { SimpleWizardStepScreen } from './screens/SimpleWizardStepScreen'
import { WizardProgress } from './WizardProgress'
import { CompetitorGapWidget } from './CompetitorGapWidget'
import { Sparkles, Target, Users, Lightbulb, Trophy, ArrowRight, Check, AlertCircle, RefreshCw, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * UVPWizard component props
 */
interface UVPWizardProps {
  brandName?: string
  industry?: string
  onComplete?: () => void
  className?: string
}

/**
 * UVP Wizard Component
 */
export const UVPWizard: React.FC<UVPWizardProps> = ({
  brandName,
  industry,
  onComplete,
  className,
}) => {
  const {
    uvp,
    progress,
    is_loading,
    available_suggestions,
    updateField,
    goNext,
    goBack,
    goToStep,
    generateSuggestions,
  } = useUVPWizard()

  console.log('[UVPWizard] Rendering with:', {
    currentStep: progress.current_step,
    progress,
    uvp,
    is_loading,
    available_suggestions: available_suggestions?.length || 0,
    brandName,
    industry
  })

  const currentStepConfig = getStepConfig(progress.current_step)
  console.log('[UVPWizard] Current step config:', currentStepConfig)

  // Auto-generate suggestions when step changes
  React.useEffect(() => {
    console.log('[UVPWizard] Step changed to:', progress.current_step, {
      supports_ai: currentStepConfig.supports_ai_suggestions,
      available_suggestions: available_suggestions.length,
      shouldGenerate: currentStepConfig.supports_ai_suggestions && !is_loading
    })
    if (currentStepConfig.supports_ai_suggestions && !is_loading) {
      console.log('[UVPWizard] Triggering suggestion generation for step:', progress.current_step)
      generateSuggestions()
    }
  }, [progress.current_step])

  // Handle completion
  React.useEffect(() => {
    if (progress.current_step === 'complete' && onComplete) {
      onComplete()
    }
  }, [progress.current_step, onComplete])

  // Render current step
  const renderStep = () => {
    console.log('[UVPWizard] renderStep called with step:', progress.current_step)
    switch (progress.current_step) {
      case 'welcome':
        return (
          <WelcomeScreen
            onStart={goNext}
            brandName={brandName}
            industry={industry}
          />
        )

      case 'target-customer':
        console.log('[UVPWizard] Passing to SimpleWizardStepScreen:', {
          available_suggestions,
          suggestionsCount: available_suggestions?.length,
          suggestionsArray: available_suggestions
        })
        return (
          <SimpleWizardStepScreen
            config={currentStepConfig}
            value={uvp.target_customer || ''}
            onChange={(value) => updateField('target_customer', value)}
            suggestions={available_suggestions || []}
            onGenerateSuggestions={generateSuggestions}
            onNext={goNext}
            onBack={goBack}
            canGoNext={progress.can_go_forward}
            canGoBack={progress.can_go_back}
            isGenerating={is_loading}
            showProgress
            progressPercentage={progress.progress_percentage}
          />
        )

      case 'customer-problem':
        return (
          <SimpleWizardStepScreen
            config={currentStepConfig}
            value={uvp.customer_problem || ''}
            onChange={(value) => updateField('customer_problem', value)}
            suggestions={available_suggestions || []}
            onGenerateSuggestions={generateSuggestions}
            onNext={goNext}
            onBack={goBack}
            canGoNext={progress.can_go_forward}
            canGoBack={progress.can_go_back}
            isGenerating={is_loading}
            showProgress
            progressPercentage={progress.progress_percentage}
          />
        )

      case 'unique-solution':
        return (
          <div className="space-y-4">
            {/* Competitor Gap Widget */}
            <CompetitorGapWidget
              industry={industry}
              competitors={uvp.competitors || []}
            />

            <SimpleWizardStepScreen
              config={currentStepConfig}
              value={uvp.unique_solution || ''}
              onChange={(value) => {
                // Update both solution and differentiation fields
                updateField('unique_solution', value)
                // Also save to differentiation for backward compatibility
                updateField('differentiation', value)
              }}
              suggestions={available_suggestions || []}
              onGenerateSuggestions={generateSuggestions}
              onNext={goNext}
              onBack={goBack}
              canGoNext={progress.can_go_forward}
              canGoBack={progress.can_go_back}
              isGenerating={is_loading}
              showProgress
              progressPercentage={progress.progress_percentage}
            />
          </div>
        )

      case 'key-benefit':
        return (
          <SimpleWizardStepScreen
            config={currentStepConfig}
            value={uvp.key_benefit || ''}
            onChange={(value) => updateField('key_benefit', value)}
            suggestions={available_suggestions || []}
            onGenerateSuggestions={generateSuggestions}
            onNext={goNext}
            onBack={goBack}
            canGoNext={progress.can_go_forward}
            canGoBack={progress.can_go_back}
            isGenerating={is_loading}
            showProgress
            progressPercentage={progress.progress_percentage}
          />
        )

      // Differentiation step is now combined with unique-solution

      case 'review':
        return <ReviewScreen uvp={uvp} onNext={goNext} onBack={goBack} onEdit={goToStep} />

      case 'complete':
        console.log('[UVPWizard] Rendering CompleteScreen with UVP:', uvp)
        return <CompleteScreen uvp={uvp} brandName={brandName} />

      default:
        return null
    }
  }

  return (
    <div className={cn('bg-background', className)} data-uvp-wizard>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Full Progress Bar - Only show after welcome */}
          {progress.current_step !== 'welcome' &&
            progress.current_step !== 'complete' && (
              <div className="mb-8">
                <WizardProgress progress={progress} onStepClick={goToStep} />
              </div>
            )}

          {/* Step Content */}
          <div className="bg-card rounded-lg border shadow-sm p-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Review Screen - Show all UVP components
 */
interface ReviewScreenProps {
  uvp: any
  onNext: () => void
  onBack: () => void
  onEdit: (step: any) => void
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ uvp, onNext, onBack, onEdit }) => {
  const handleComplete = () => {
    console.log('[ReviewScreen] Complete UVP button clicked, calling onNext()')
    console.log('[ReviewScreen] Current UVP:', uvp)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your UVP</h2>
        <p className="text-muted-foreground">
          Review your complete value proposition below. You can edit any section by clicking on it.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewCard
          title="Target Customer"
          content={uvp.target_customer}
          onEdit={() => onEdit('target-customer')}
        />
        <ReviewCard
          title="Customer Problem"
          content={uvp.customer_problem}
          onEdit={() => onEdit('customer-problem')}
        />
        <ReviewCard
          title="Unique Solution"
          content={uvp.unique_solution}
          onEdit={() => onEdit('unique-solution')}
        />
        <ReviewCard
          title="Key Benefit"
          content={uvp.key_benefit}
          onEdit={() => onEdit('key-benefit')}
        />
        {uvp.differentiation && (
          <ReviewCard
            title="Differentiation"
            content={uvp.differentiation}
            onEdit={() => onEdit('unique-solution')}
          />
        )}
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button onClick={onBack} className="px-4 py-2 border rounded hover:bg-accent">
          Back
        </button>
        <button
          onClick={handleComplete}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Complete UVP
        </button>
      </div>
    </div>
  )
}

/**
 * Review Card Component
 */
const ReviewCard: React.FC<{ title: string; content: string; onEdit: () => void }> = ({
  title,
  content,
  onEdit,
}) => (
  <button
    onClick={onEdit}
    className="w-full text-left p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all"
  >
    <h3 className="font-semibold text-sm mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{content}</p>
  </button>
)

/**
 * Complete Screen - Celebration and next steps
 */
interface CompleteScreenProps {
  uvp: any
  brandName?: string
}

const CompleteScreen: React.FC<CompleteScreenProps> = ({ uvp, brandName }) => {
  const [showVennDiagram, setShowVennDiagram] = React.useState(false)
  const [showWWH, setShowWWH] = React.useState(false)
  const [refinedWWH, setRefinedWWH] = React.useState<{why: string, what: string, how: string} | null>(null)
  const [refinedSweetSpot, setRefinedSweetSpot] = React.useState<string | null>(null)
  const [isRefining, setIsRefining] = React.useState(false)
  const { goToStep } = useUVPWizard()

  React.useEffect(() => {
    console.log('[CompleteScreen] Mounted with UVP:', uvp)

    // Validate UVP data exists
    if (!uvp || !uvp.target_customer || !uvp.customer_problem || !uvp.unique_solution || !uvp.key_benefit) {
      console.error('[CompleteScreen] Missing required UVP data!', uvp)
      return
    }

    console.log('[CompleteScreen] Starting reveal animations and auto-refining with Opus')

    // Show visualizations immediately
    setShowVennDiagram(true)
    setShowWWH(true)

    // Auto-refine both WWH and Sweet Spot with Opus immediately
    handleRefineWithOpus()
  }, [])

  // Refine WWH and Sweet Spot with Opus
  const handleRefineWithOpus = async () => {
    setIsRefining(true)
    try {
      const prompt = `You are a master copywriter. Make this UVP ULTRA-CONCISE - think tagline, not paragraph.

Target Customer: ${uvp.target_customer}
Problem: ${uvp.customer_problem}
Solution: ${uvp.unique_solution}
Benefit: ${uvp.key_benefit}
Differentiation: ${uvp.differentiation}

Create TWO things:

1. WWH Framework (6-8 words each):
- WHY: "Help investors find income-generating properties fast"
- WHAT: "AI-powered property screening and lifestyle mapping"
- HOW: "Exclusive data + concierge-style guidance"

2. Sweet Spot Statement (2-3 sentences MAXIMUM):
A concise, powerful summary of who you serve, what problem you solve, and what makes you unique.
NO RAMBLING. Clear, direct, memorable.

Return ONLY a JSON object in this exact format:
{
  "why": "6-8 words",
  "what": "6-8 words",
  "how": "6-8 words",
  "sweetSpot": "2-3 clear, concise sentences"
}`

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.1',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const refined = JSON.parse(jsonMatch[0])
        setRefinedWWH({ why: refined.why, what: refined.what, how: refined.how })
        setRefinedSweetSpot(refined.sweetSpot)
      }
    } catch (error) {
      console.error('[CompleteScreen] Failed to refine with Opus:', error)
      // Don't alert - just fail silently and show unrefined version
    } finally {
      setIsRefining(false)
    }
  }

  // Reset to start over
  const handleStartOver = () => {
    if (confirm('Are you sure you want to start the UVP wizard from the beginning? Your current progress will be saved as a draft.')) {
      goToStep('welcome')
    }
  }

  // Helper to extract first option from pipe-separated values
  const getFirstOption = (text: string | undefined): string => {
    if (!text) return ''
    return text.split('|')[0].trim()
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Celebration Header */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Your UVP is Complete!</h2>
        <p className="text-muted-foreground">
          {brandName ? `${brandName}'s value proposition is ready` : 'Your value proposition is ready'}
        </p>
      </motion.div>

      {/* UVP Statement Card - ONLY show Opus-refined version */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Your Unique Value Proposition</h3>
              {isRefining ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
                </div>
              ) : refinedSweetSpot ? (
                <p className="text-base leading-relaxed font-medium">
                  {refinedSweetSpot}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Refining your value proposition...
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Venn Diagram Reveal */}
      <AnimatePresence>
        {showVennDiagram && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <Card className="p-8 bg-gradient-to-br from-background via-primary/5 to-background">
              <h3 className="text-xl font-bold mb-2 text-center">Your UVP Sweet Spot</h3>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Where customer needs, your capabilities, and market gaps intersect
              </p>

              {/* Venn Diagram */}
              <div className="relative w-full max-w-2xl mx-auto h-96 mb-8">
                {/* Customer Needs Circle */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute left-0 top-12 w-64 h-64 rounded-full bg-blue-500/50 dark:bg-blue-500/40 border-4 border-blue-600 dark:border-blue-400"
                >
                  <div className="absolute top-6 left-6 right-12">
                    <Users className="h-6 w-6 text-blue-700 dark:text-blue-300 mb-2" />
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Customer Needs</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-tight">
                      {uvp.customer_problem?.slice(0, 80)}...
                    </p>
                  </div>
                </motion.div>

                {/* Your Solution Circle */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute right-0 top-12 w-64 h-64 rounded-full bg-green-500/50 dark:bg-green-500/40 border-4 border-green-600 dark:border-green-400"
                >
                  <div className="absolute top-6 right-6 left-12 text-right">
                    <Lightbulb className="h-6 w-6 text-green-700 dark:text-green-300 mb-2 ml-auto" />
                    <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-1">Your Solution</p>
                    <p className="text-xs text-green-800 dark:text-green-200 leading-tight">
                      {uvp.unique_solution?.slice(0, 80)}...
                    </p>
                  </div>
                </motion.div>

                {/* Competitor Gap Circle */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 w-64 h-64 rounded-full bg-purple-500/50 dark:bg-purple-500/40 border-4 border-purple-600 dark:border-purple-400"
                >
                  <div className="absolute bottom-6 left-6 right-6 text-center">
                    <Target className="h-6 w-6 text-purple-700 dark:text-purple-300 mb-2 mx-auto" />
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">Market Gap</p>
                    <p className="text-xs text-purple-800 dark:text-purple-200 leading-tight">
                      {uvp.differentiation ? uvp.differentiation.slice(0, 80) + '...' : 'Our unique approach'}
                    </p>
                  </div>
                </motion.div>

                {/* Center Sweet Spot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/80 border-4 border-primary flex items-center justify-center shadow-lg"
                >
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>

              {/* Sweet Spot Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-primary/10 dark:bg-primary/20 rounded-lg p-6 border-2 border-primary/30"
              >
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Your Unique Sweet Spot
                </h4>
                {isRefining ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                ) : refinedSweetSpot ? (
                  <p className="text-base leading-relaxed font-medium">
                    {refinedSweetSpot}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">For {uvp.target_customer}</span> who need{' '}
                    <span className="font-semibold">{uvp.customer_problem}</span>, you deliver{' '}
                    <span className="font-semibold text-primary">{uvp.unique_solution}</span> that provides{' '}
                    <span className="font-semibold">{uvp.key_benefit}</span>.
                  </p>
                )}
                <div className="flex items-start gap-2 text-xs text-muted-foreground mt-4">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    This is the perfect intersection where customer needs meet your unique capabilities in a way competitors can't easily replicate.
                  </p>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WWH Framework */}
      <AnimatePresence>
        {showWWH && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Your WWH Framework
                </h3>
                {isRefining && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Refining with Opus...
                  </div>
                )}
              </div>

              {refinedWWH ? (
                /* REFINED VERSION - Ultra-short taglines */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Optimized by Claude Opus 4.1</span>
                  </div>

                  {/* Why - Refined */}
                  <div className="flex items-start gap-4 p-5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-sm text-white">WHY</span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <p className="text-lg font-semibold text-foreground leading-tight">
                        {refinedWWH.why}
                      </p>
                    </div>
                  </div>

                  {/* What - Refined */}
                  <div className="flex items-start gap-4 p-5 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-sm text-white">WHAT</span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <p className="text-lg font-semibold text-foreground leading-tight">
                        {refinedWWH.what}
                      </p>
                    </div>
                  </div>

                  {/* How - Refined */}
                  <div className="flex items-start gap-4 p-5 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-sm text-white">HOW</span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <p className="text-lg font-semibold text-foreground leading-tight">
                        {refinedWWH.how}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* LOADING STATE - Show skeleton */
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-muted/30 rounded-lg border animate-pulse">
                      <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 flex items-center">
                        <div className="h-6 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {refinedWWH && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-1">
                    ✓ Your WWH framework is ultra-concise and memorable
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    These taglines are ready to use across all your marketing
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation & Next Steps - Always visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        {/* Edit Specific Steps */}
        <Card className="p-6 bg-muted/30 border-2">
          <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Refine Your UVP
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => goToStep('target-customer')}
              className="justify-start h-auto py-3"
            >
              <Users className="h-5 w-5 mr-2" />
              <span>Edit<br />Customer</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => goToStep('customer-problem')}
              className="justify-start h-auto py-3"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Edit<br />Problem</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => goToStep('unique-solution')}
              className="justify-start h-auto py-3"
            >
              <Lightbulb className="h-5 w-5 mr-2" />
              <span>Edit<br />Solution</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => goToStep('key-benefit')}
              className="justify-start h-auto py-3"
            >
              <Target className="h-5 w-5 mr-2" />
              <span>Edit<br />Benefit</span>
            </Button>
          </div>
          <div className="flex justify-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-muted-foreground hover:text-foreground mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Completely Over
            </Button>
          </div>
        </Card>

        {/* Customer Journey Transition */}
        <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
              <Map className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold">Ready for the Next Step?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your UVP is the foundation. Now let's map your <strong>Customer Journey</strong>
              to generate perfectly tailored content and campaigns that convert at every stage.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => window.location.href = `/buyer-journey?brandId=${uvp.brand_id}`}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-5 w-5" />
                Yes, Map My Customer Journey
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = '/mirror'}
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              ✨ Completing your customer journey unlocks AI-powered content tailored to each stage of your customer's buying process
            </p>
          </div>
        </Card>

        {/* Continue to MARBA */}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Or continue to explore the full MARBA framework
          </p>
          <Button size="lg" variant="outline" className="gap-2">
            Continue to MARBA Framework
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
