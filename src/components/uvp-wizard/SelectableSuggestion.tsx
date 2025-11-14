/**
 * Selectable Suggestion Component
 *
 * Click to select suggestions instead of drag-and-drop
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, Sparkles } from 'lucide-react'
import { DraggableSuggestion } from '@/types/uvp-wizard'

interface SelectableSuggestionProps {
  suggestion: DraggableSuggestion
  isSelected?: boolean
  onSelect: (suggestion: DraggableSuggestion) => void
  className?: string
}

export const SelectableSuggestion: React.FC<SelectableSuggestionProps> = ({
  suggestion,
  isSelected = false,
  onSelect,
  className
}) => {
  return (
    <button
      onClick={() => onSelect(suggestion)}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "mt-0.5 flex-shrink-0 rounded-full p-1.5 transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isSelected ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <p className={cn(
            "text-sm leading-relaxed",
            isSelected ? "font-medium" : ""
          )}>
            {suggestion.content}
          </p>

          {suggestion.confidence && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}% match
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}