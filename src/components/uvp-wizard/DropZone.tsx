/**
 * Drop Zone Component
 *
 * A droppable area using @dnd-kit for accepting draggable suggestions.
 * Used in the UVP wizard for users to build their value proposition by dragging items.
 */

import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Plus, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DraggableSuggestion, DropZone as DropZoneType } from '@/types/uvp-wizard'
import { CompactDraggableItem } from './DraggableItem'

/**
 * DropZone component props
 */
interface DropZoneProps {
  zone: DropZoneType
  onDrop: (suggestion: DraggableSuggestion) => void
  onRemove: (id: string) => void
  onCustomInput?: (value: string) => void
  customValue?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * DropZone Component
 */
export const DropZone: React.FC<DropZoneProps> = ({
  zone,
  onDrop,
  onRemove,
  onCustomInput,
  customValue,
  placeholder = 'Drag suggestions here or type your own...',
  disabled = false,
  className,
}) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: zone.id,
    disabled,
    data: {
      accepts: zone.accepts,
    },
  })

  const [isEditingCustom, setIsEditingCustom] = React.useState(false)
  const [customText, setCustomText] = React.useState(customValue || '')

  // Check if the dragged item can be dropped here
  const canDrop = active
    ? zone.accepts.includes(active.data.current?.type)
    : false

  // Check if zone is at capacity
  const isFull = zone.max_items ? zone.items.length >= zone.max_items : false

  // Auto-save custom text
  React.useEffect(() => {
    if (customText && onCustomInput) {
      const timer = setTimeout(() => {
        onCustomInput(customText)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [customText, onCustomInput])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'relative min-h-[120px] rounded-lg border-2 border-dashed transition-all duration-200',
          'flex flex-col gap-2 p-4',
          isOver && canDrop && 'border-primary bg-primary/5 shadow-lg',
          isOver && !canDrop && 'border-destructive bg-destructive/5',
          !isOver && zone.items.length === 0 && 'border-muted bg-muted/20',
          !isOver && zone.items.length > 0 && 'border-border bg-card',
          isFull && 'opacity-60',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {/* Empty State */}
        {zone.items.length === 0 && !isEditingCustom && (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <MousePointerClick className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              {isOver && canDrop ? 'Drop here!' : 'Drag a suggestion here'}
            </p>
            <p className="text-xs text-muted-foreground">or</p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-1"
              onClick={() => setIsEditingCustom(true)}
            >
              type your own
            </Button>
          </div>
        )}

        {/* Dropped Items */}
        {zone.items.length > 0 && (
          <div className="space-y-2">
            {zone.items.map((item) => (
              <CompactDraggableItem
                key={item.id}
                suggestion={item}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}

        {/* Custom Input Area */}
        {(isEditingCustom || customValue) && (
          <div className="space-y-2">
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={placeholder}
              className="min-h-[80px] resize-none"
              autoFocus={isEditingCustom}
              onBlur={() => {
                if (!customText) {
                  setIsEditingCustom(false)
                }
              }}
            />
            {customText && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{customText.length} characters</span>
                {customText.length < 10 && (
                  <span className="text-destructive">• Needs at least 10 characters</span>
                )}
                {customText.length >= 10 && (
                  <span className="text-green-600">• Good length</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add More Button (when items exist but not editing) */}
        {zone.items.length > 0 && !isEditingCustom && !isFull && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setIsEditingCustom(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add custom text
          </Button>
        )}

        {/* Capacity Indicator */}
        {zone.max_items && zone.items.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {zone.items.length} / {zone.max_items} items
          </div>
        )}

        {/* Drag Over Overlay */}
        {isOver && (
          <div
            className={cn(
              'absolute inset-0 rounded-lg pointer-events-none',
              'flex items-center justify-center',
              canDrop
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-destructive/10 border-2 border-destructive'
            )}
          >
            <p className="text-sm font-medium">
              {canDrop ? 'Drop to add' : 'Cannot drop this item here'}
            </p>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {zone.items.length === 0 && !isEditingCustom && (
        <p className="text-xs text-muted-foreground px-1">
          Tip: You can drag multiple suggestions or write your own custom answer
        </p>
      )}
    </div>
  )
}

/**
 * Simple DropZone (minimal variant for text-only input)
 */
interface SimpleDropZoneProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  helperText?: string
  className?: string
}

export const SimpleDropZone: React.FC<SimpleDropZoneProps> = ({
  value,
  onChange,
  placeholder = 'Enter your answer...',
  disabled = false,
  helperText,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[120px] resize-none"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{helperText}</span>
        <span>
          {value.length} characters
          {value.length < 10 && value.length > 0 && (
            <span className="text-destructive ml-2">• Needs at least 10</span>
          )}
          {value.length >= 10 && (
            <span className="text-green-600 ml-2">• Good length</span>
          )}
        </span>
      </div>
    </div>
  )
}
