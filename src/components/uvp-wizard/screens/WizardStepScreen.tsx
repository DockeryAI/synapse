/**
 * Generic Wizard Step Screen Component
 *
 * Reusable component for all interactive wizard steps with drag-and-drop
 * suggestions and custom input. Used for: Target Customer, Customer Problem,
 * Unique Solution, Key Benefit, and Differentiation.
 */

import * as React from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WizardStepConfig, DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard'
import { SuggestionPanel } from '../SuggestionPanel'
import { DropZone, SimpleDropZone } from '../DropZone'
import { DraggableItem } from '../DraggableItem'
import { CompactWizardProgress } from '../WizardProgress'

/**
 * WizardStepScreen component props
 */
interface WizardStepScreenProps {
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

/**
 * Wizard Step Screen Component
 */
// Helper function to get the correct suggestion type from field name
const getSuggestionType = (fieldName: string): any => {
  const typeMap: Record<string, string> = {
    'target_customer': 'customer-segment',
    'customer_problem': 'problem',
    'unique_solution': 'solution',
    'key_benefit': 'benefit',
    'differentiation': 'differentiator'
  }
  return typeMap[fieldName] || fieldName
}

export const WizardStepScreen: React.FC<WizardStepScreenProps> = ({
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
  console.log('[WizardStepScreen] Received props:', {
    step: config.step,
    fieldName: config.field_name,
    suggestionType: getSuggestionType(config.field_name),
    suggestions: suggestions?.length || 0,
    value: value?.length || 0
  })

  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)
  const [dropZone, setDropZone] = React.useState<DropZoneType>({
    id: 'main-drop-zone',
    accepts: [config.field_name as any],
    items: [],
    is_active: false,
    is_over: false,
    can_drop: false,
  })

  // Get the actively dragged suggestion
  const activeSuggestion = activeDragId
    ? suggestions.find((s) => s.id === activeDragId)
    : null

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && over.id === 'main-drop-zone') {
      const suggestion = suggestions.find((s) => s.id === active.id)
      if (suggestion) {
        handleSelectSuggestion(suggestion)
      }
    }

    setActiveDragId(null)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: DraggableSuggestion) => {
    // Append or replace based on current value
    if (value) {
      onChange(`${value}\n\n${suggestion.content}`)
    } else {
      onChange(suggestion.content)
    }
  }

  // Validation feedback
  const isValid = value.length >= (config.min_length || 10)
  const showWarning = value.length > 0 && !isValid

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <CompactWizardProgress
            progress={{
              current_step: config.id,
              completed_steps: [],
              total_steps: 8,
              progress_percentage: progressPercentage,
              is_valid: isValid,
              validation_errors: {},
              can_go_back: canGoBack,
              can_go_forward: canGoNext,
              can_submit: false,
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
        <p className="text-muted-foreground mb-4">{config.description}</p>

        {/* Helper Info */}
        {config.helper_text && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">{config.helper_text}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-hidden">
        {/* Suggestions Panel - Left Side */}
        {config.supports_ai_suggestions && (
          <div className="lg:col-span-1 overflow-hidden">
            <SuggestionPanel
              suggestions={suggestions}
              type={getSuggestionType(config.field_name)}
              onSelect={handleSelectSuggestion}
              onGenerate={onGenerateSuggestions}
              isLoading={isGenerating}
              title="AI Suggestions"
              description="Drag suggestions to the right or click to add"
            />
          </div>
        )}

        {/* Input Area - Right Side */}
        <div className={cn(config.supports_ai_suggestions ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col">
              <h3 className="text-sm font-semibold mb-3">Your Answer</h3>

              {config.supports_ai_suggestions ? (
                <DropZone
                  zone={dropZone}
                  onDrop={handleSelectSuggestion}
                  onRemove={() => {}}
                  onCustomInput={onChange}
                  customValue={value}
                  placeholder={config.placeholder}
                  className="flex-1"
                />
              ) : (
                <SimpleDropZone
                  value={value}
                  onChange={onChange}
                  placeholder={config.placeholder}
                  helperText={config.helper_text}
                  className="flex-1"
                />
              )}

              {/* Validation Warning */}
              {showWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Please write at least {config.min_length} characters for a complete answer
                  </AlertDescription>
                </Alert>
              )}

              {/* Character Count */}
              <div className="mt-4 text-sm text-muted-foreground">
                {value.length} characters
                {config.min_length && (
                  <span className="ml-2">
                    (minimum: {config.min_length})
                  </span>
                )}
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeSuggestion && (
                <DraggableItem
                  suggestion={activeSuggestion}
                  className="shadow-2xl opacity-90"
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className="min-w-[120px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-sm text-muted-foreground">
          {isValid ? (
            <span className="text-green-600 font-medium">Ready to continue</span>
          ) : (
            <span>Fill in your answer to continue</span>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={!canGoNext || !isValid}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
