/**
 * Simple Wizard Step Screen with Clickable Suggestions
 *
 * Clean, user-friendly interface for UVP wizard steps
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info, Sparkles, Edit3, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WizardStepConfig, DraggableSuggestion, WizardStep } from '@/types/uvp-wizard'
import { SelectableSuggestion } from '../SelectableSuggestion'
import { EditableSuggestion } from '../EditableSuggestion'
import { CompactWizardProgress } from '../WizardProgress'
import { CompetitorGapWidget } from '../CompetitorGapWidget'

interface SimpleWizardStepScreenProps {
  config: WizardStepConfig
  value: string
  onChange: (value: string) => void
  suggestions: DraggableSuggestion[]
  onGenerateSuggestions: () => void
  onNext: () => void
  onBack: () => void
  canGoNext: boolean
  canGoBack: boolean
  isGenerating?: boolean
  showProgress?: boolean
  progressPercentage?: number
  className?: string
}

export const SimpleWizardStepScreen: React.FC<SimpleWizardStepScreenProps> = ({
  config,
  value,
  onChange,
  suggestions,
  onGenerateSuggestions,
  onNext,
  onBack,
  canGoNext,
  canGoBack,
  isGenerating = false,
  showProgress = true,
  progressPercentage = 0,
  className,
}) => {
  console.log('[SimpleWizardStepScreen] Props received:', {
    suggestions: suggestions,
    suggestionsLength: suggestions?.length,
    isGenerating,
    config: config.title
  })
  const [mode, setMode] = React.useState<'suggestions' | 'custom'>('suggestions')
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<DraggableSuggestion[]>([])
  const [customValue, setCustomValue] = React.useState('')  // Start with blank text
  const [customAdditions, setCustomAdditions] = React.useState<string[]>([])
  const [newCustom, setNewCustom] = React.useState('')
  const [hasRestoredSelections, setHasRestoredSelections] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Restore selections from existing value when suggestions load
  React.useEffect(() => {
    if (value && suggestions.length > 0 && !hasRestoredSelections) {
      console.log('[SimpleWizardStepScreen] Restoring selections from value:', value)

      // Split the saved value by ' | ' separator
      const savedSelections = value.split(' | ').map(s => s.trim())

      // Find matching suggestions
      const matchingSuggestions = suggestions.filter(suggestion =>
        savedSelections.some(saved =>
          suggestion.content.trim() === saved || saved.includes(suggestion.content.trim())
        )
      )

      if (matchingSuggestions.length > 0) {
        console.log('[SimpleWizardStepScreen] Restored', matchingSuggestions.length, 'selections')
        setSelectedSuggestions(matchingSuggestions)
      }

      setHasRestoredSelections(true)
    }
  }, [value, suggestions, hasRestoredSelections])

  // Update mode when suggestions become available
  React.useEffect(() => {
    if (suggestions && suggestions.length > 0 && mode === 'custom') {
      console.log('[SimpleWizardStepScreen] Suggestions available, switching to suggestions mode')
      setMode('suggestions')
    }
  }, [suggestions])

  // Auto-generate suggestions on mount if none exist
  React.useEffect(() => {
    console.log('[SimpleWizardStepScreen] Mount effect:', {
      suggestionsLength: suggestions.length,
      isGenerating,
      shouldGenerate: suggestions.length === 0 && !isGenerating
    })
    if (suggestions.length === 0 && !isGenerating) {
      console.log('[SimpleWizardStepScreen] Triggering auto-generation')
      // Small delay to ensure loading animation shows
      setTimeout(() => {
        onGenerateSuggestions()
      }, 100)
    }

    // Scroll to top when step changes
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [config.step])

  // Don't auto-populate custom value - keep it blank for user input

  const handleSelectSuggestion = (suggestion: DraggableSuggestion) => {
    const isSelected = selectedSuggestions.some(s => s.id === suggestion.id)

    if (isSelected) {
      // Remove if already selected
      setSelectedSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    } else {
      // Add to selection
      setSelectedSuggestions(prev => [...prev, suggestion])
    }
  }

  const handleAddCustom = () => {
    if (newCustom.trim().length > 10) {
      setCustomAdditions(prev => [...prev, newCustom.trim()])
      setNewCustom('')
    }
  }

  const handleRemoveCustom = (index: number) => {
    setCustomAdditions(prev => prev.filter((_, i) => i !== index))
  }

  const handleApplySelection = () => {
    // Combine selected suggestions and custom additions
    const allSelections = [
      ...selectedSuggestions.map(s => s.content),
      ...customAdditions
    ]

    // Join with a separator that indicates multiple items
    const combinedValue = allSelections.join(' | ')
    onChange(combinedValue)
  }

  const handleCustomSubmit = () => {
    onChange(customValue)
  }

  // Check if we have valid selection
  const hasValidSelection = React.useMemo(() => {
    if (mode === 'suggestions') {
      return selectedSuggestions.length > 0 || customAdditions.length > 0
    }
    return customValue.length >= (config.min_length || 10)
  }, [mode, selectedSuggestions, customAdditions, customValue, config.min_length])

  // Update the main value when selections change
  React.useEffect(() => {
    if (selectedSuggestions.length > 0 || customAdditions.length > 0) {
      handleApplySelection()
    }
  }, [selectedSuggestions, customAdditions])

  const showWarning = value.length > 0 && value.length < (config.min_length || 10)

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="space-y-4 mb-6">
        {showProgress && (
          <CompactWizardProgress
            currentStep={config.step as WizardStep}
            completedSteps={[]}
            percentage={progressPercentage}
          />
        )}

        <div>
          <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
          {config.subtitle && (
            <p className="text-muted-foreground">{config.subtitle}</p>
          )}
        </div>

        {config.description && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              {config.description}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={mode === 'suggestions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('suggestions')}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Suggestions
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('custom')}
          className="gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Write My Own
        </Button>
      </div>

      {/* Main Content Area */}
      <div className={cn("flex-1 mb-6", isGenerating ? "overflow-hidden" : "overflow-y-auto")}>
        {mode === 'suggestions' ? (
          <div className="space-y-3">
            {isGenerating ? (
              <div className="text-center py-16 px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {/* Large pulsing background circle */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 -m-16 rounded-full bg-primary/10"
                  />

                  <div className="relative inline-block">
                    {/* Main sparkles icon with pulse */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className="h-16 w-16 text-primary" />
                    </motion.div>

                    {/* Spinning ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 -m-4"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-t-4 border-primary" />
                    </motion.div>

                    {/* Counter-spinning outer ring */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 -m-8"
                    >
                      <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
                      <div className="absolute inset-0 rounded-full border-b-2 border-primary/50" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 space-y-2"
                  >
                    <p className="text-lg font-semibold text-primary">
                      AI is Working...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing your industry and website data
                    </p>
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center justify-center gap-1 pt-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Select one or more options that describe your situation (you can select multiple):
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGenerateSuggestions}
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {/* AI Suggestions */}
                <div className="space-y-3">
                  {suggestions.map((suggestion) => {
                    // Use EditableSuggestion if the content has placeholders
                    const hasPlaceholders = /<[^>]+>/.test(suggestion.content)

                    if (hasPlaceholders) {
                      return (
                        <EditableSuggestion
                          key={suggestion.id}
                          suggestion={suggestion}
                          isSelected={selectedSuggestions.some(s => s.id === suggestion.id)}
                          onSelect={handleSelectSuggestion}
                        />
                      )
                    } else {
                      return (
                        <SelectableSuggestion
                          key={suggestion.id}
                          suggestion={suggestion}
                          isSelected={selectedSuggestions.some(s => s.id === suggestion.id)}
                          onSelect={handleSelectSuggestion}
                        />
                      )
                    }
                  })}
                </div>

                {/* Add Custom Option */}
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-medium mb-2 block">
                    Add your own (optional):
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      value={newCustom}
                      onChange={(e) => setNewCustom(e.target.value)}
                      placeholder="Describe your specific situation..."
                      className="min-h-[80px] resize-none flex-1"
                    />
                    <Button
                      onClick={handleAddCustom}
                      disabled={newCustom.trim().length < 10}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  {newCustom.length > 0 && newCustom.length < 10 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 10 characters ({10 - newCustom.length} more needed)
                    </p>
                  )}
                </div>

                {/* Custom Additions List */}
                {customAdditions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Your custom additions:</p>
                    {customAdditions.map((custom, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <Check className="h-5 w-5 text-primary mt-0.5" />
                        <p className="flex-1 text-sm">{custom}</p>
                        <button
                          onClick={() => handleRemoveCustom(index)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={onGenerateSuggestions} disabled={isGenerating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {config.prompt || 'Your Answer'}
              </label>
              <Textarea
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={config.placeholder}
                className="min-h-[150px] resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {customValue.length} characters
                  {config.min_length && (
                    <span className="ml-1">
                      (minimum: {config.min_length})
                    </span>
                  )}
                </p>
                {customValue !== value && customValue.length >= (config.min_length || 10) && (
                  <Button
                    size="sm"
                    onClick={handleCustomSubmit}
                    className="gap-2"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                )}
              </div>
            </div>

            {config.helper_text && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {config.helper_text}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Current Selection Display */}
      {value && (
        <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Your Selection:</p>
              {/* Parse and display multiple selections */}
              {value.includes(' | ') ? (
                <div className="space-y-1.5">
                  {value.split(' | ').map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary text-xs mt-0.5">•</span>
                      <p className="text-sm text-muted-foreground flex-1">{item.trim()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{value}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {mode === 'suggestions' && !hasValidSelection && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Please select at least one option or add your own custom answer
          </AlertDescription>
        </Alert>
      )}
      {mode === 'custom' && showWarning && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Please write at least {config.min_length} characters for a complete answer
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          {config.optional && (
            <Button variant="ghost" onClick={onNext}>
              Skip
            </Button>
          )}

          <Button
            onClick={() => {
              console.log('[SimpleWizardStepScreen] Next clicked, hasValidSelection:', hasValidSelection)
              if (hasValidSelection || config.optional) {
                onNext()
              }
            }}
            disabled={!canGoNext || (!config.optional && !hasValidSelection)}
            className="gap-2"
          >
            {config.step === 'differentiation' ? 'Review' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}