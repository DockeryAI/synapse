/**
 * Editable Suggestion Component
 *
 * Suggestions with inline editable placeholders
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, Sparkles, Edit2 } from 'lucide-react'
import { DraggableSuggestion } from '@/types/uvp-wizard'
import { Input } from '@/components/ui/input'

interface EditableSuggestionProps {
  suggestion: DraggableSuggestion
  isSelected?: boolean
  onSelect: (suggestion: DraggableSuggestion) => void
  className?: string
}

export const EditableSuggestion: React.FC<EditableSuggestionProps> = ({
  suggestion,
  isSelected = false,
  onSelect,
  className
}) => {
  const [editedContent, setEditedContent] = React.useState(suggestion.content)
  const [placeholderValues, setPlaceholderValues] = React.useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = React.useState(false)

  // Parse content for placeholders like <enter percentage>, <specify timeframe>, etc.
  const parseContent = (content: string) => {
    const placeholderRegex = /<([^>]+)>/g
    const parts: Array<{ type: 'text' | 'placeholder', value: string, key?: string }> = []
    let lastIndex = 0
    let match

    while ((match = placeholderRegex.exec(content)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index)
        })
      }

      // Add placeholder
      const placeholderKey = match[1]
      parts.push({
        type: 'placeholder',
        value: placeholderValues[placeholderKey] || '',
        key: placeholderKey
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex)
      })
    }

    return parts
  }

  // Build the final content with replaced values
  const buildFinalContent = () => {
    let finalContent = suggestion.content
    Object.entries(placeholderValues).forEach(([key, value]) => {
      if (value) {
        finalContent = finalContent.replace(`<${key}>`, value)
      }
    })
    return finalContent
  }

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [key]: value
    }))

    // Update the edited content
    const newContent = buildFinalContent()
    setEditedContent(newContent)
  }

  const handleSelect = () => {
    // If there are placeholders filled, use the edited content
    const hasFilledPlaceholders = Object.values(placeholderValues).some(v => v.length > 0)
    const modifiedSuggestion = {
      ...suggestion,
      content: hasFilledPlaceholders ? buildFinalContent() : suggestion.content
    }
    onSelect(modifiedSuggestion)
  }

  const contentParts = parseContent(suggestion.content)
  const hasPlaceholders = contentParts.some(part => part.type === 'placeholder')

  return (
    <div
      className={cn(
        "w-full rounded-lg border-2 transition-all",
        isSelected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card",
        className
      )}
    >
      <button
        onClick={handleSelect}
        className="w-full text-left p-4 hover:bg-accent/50 transition-colors rounded-t-lg"
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

          <div className="flex-1 space-y-2">
            {!hasPlaceholders ? (
              // Simple text display if no placeholders
              <p className={cn(
                "text-sm leading-relaxed",
                isSelected ? "font-medium" : ""
              )}>
                {suggestion.content}
              </p>
            ) : (
              // Render with editable placeholders
              <div className="text-sm leading-relaxed">
                {contentParts.map((part, index) => {
                  if (part.type === 'text') {
                    return <span key={index}>{part.value}</span>
                  } else {
                    return (
                      <span key={index} className="inline-flex items-center gap-1 mx-1">
                        <Input
                          type="text"
                          placeholder={part.key}
                          value={placeholderValues[part.key!] || ''}
                          onChange={(e) => {
                            e.stopPropagation()
                            handlePlaceholderChange(part.key!, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block w-auto min-w-[100px] h-6 px-2 py-0 text-xs"
                        />
                      </span>
                    )
                  }
                })}
              </div>
            )}

            {hasPlaceholders && Object.keys(placeholderValues).length > 0 && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <div className="font-medium mb-1 flex items-center gap-1">
                  <Edit2 className="h-3 w-3" />
                  Preview:
                </div>
                <p className="text-muted-foreground">{buildFinalContent()}</p>
              </div>
            )}

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
    </div>
  )
}