/**
 * Draggable Item Component
 *
 * A draggable suggestion card using @dnd-kit for drag-and-drop interactions.
 * Used in the UVP wizard to allow users to drag suggestions into their UVP fields.
 */

import * as React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical, Sparkles, Edit2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DraggableSuggestion } from '@/types/uvp-wizard'

/**
 * DraggableItem component props
 */
interface DraggableItemProps {
  suggestion: DraggableSuggestion
  onSelect?: (suggestion: DraggableSuggestion) => void
  onRemove?: (id: string) => void
  onCustomize?: (suggestion: DraggableSuggestion) => void
  disabled?: boolean
  showRemove?: boolean
  className?: string
}

/**
 * DraggableItem Component
 */
export const DraggableItem: React.FC<DraggableItemProps> = ({
  suggestion,
  onSelect,
  onRemove,
  onCustomize,
  disabled = false,
  showRemove = false,
  className,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: suggestion.id,
    disabled,
    data: suggestion,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  // Get source icon and color
  const sourceConfig = getSourceConfig(suggestion.source)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-card border rounded-lg p-4 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg scale-105 border-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-grab active:cursor-grabbing',
        className
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <div
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          disabled && 'hidden'
        )}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className={cn('flex items-start gap-3', !disabled && 'pl-4')}>
        {/* Source Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            sourceConfig.bgColor
          )}
        >
          {sourceConfig.icon}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{suggestion.content}</p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2">
            {/* Source Badge */}
            <Badge variant="secondary" className="text-xs">
              {sourceConfig.label}
            </Badge>

            {/* Confidence Score */}
            {suggestion.confidence && (
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}% match
              </Badge>
            )}

            {/* Tags */}
            {suggestion.tags && suggestion.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {suggestion.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Customize Button */}
          {suggestion.is_customizable && onCustomize && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onCustomize(suggestion)
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Remove Button */}
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(suggestion.id)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Select Overlay (on click) */}
      {onSelect && !disabled && (
        <button
          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-5 bg-primary transition-opacity rounded-lg"
          onClick={() => onSelect(suggestion)}
          aria-label="Select this suggestion"
        />
      )}
    </div>
  )
}

/**
 * Compact Draggable Item (smaller variant)
 */
interface CompactDraggableItemProps {
  suggestion: DraggableSuggestion
  onRemove?: (id: string) => void
  className?: string
}

export const CompactDraggableItem: React.FC<CompactDraggableItemProps> = ({
  suggestion,
  onRemove,
  className,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: suggestion.id,
    data: suggestion,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 bg-card border rounded-md px-3 py-2',
        'hover:border-primary/50 hover:shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-lg scale-105',
        'cursor-grab active:cursor-grabbing',
        className
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <p className="text-sm flex-1 truncate">{suggestion.content}</p>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(suggestion.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

/**
 * Get configuration for suggestion source
 */
function getSourceConfig(source: DraggableSuggestion['source']) {
  switch (source) {
    case 'ai-generated':
      return {
        icon: <Sparkles className="h-4 w-4 text-purple-600" />,
        label: 'AI Generated',
        bgColor: 'bg-purple-100 dark:bg-purple-950',
      }
    case 'industry-profile':
      return {
        icon: <span className="text-xs font-bold text-blue-600">IP</span>,
        label: 'Industry',
        bgColor: 'bg-blue-100 dark:bg-blue-950',
      }
    case 'competitor-analysis':
      return {
        icon: <span className="text-xs font-bold text-orange-600">CA</span>,
        label: 'Competitor',
        bgColor: 'bg-orange-100 dark:bg-orange-950',
      }
    case 'user-custom':
      return {
        icon: <Edit2 className="h-4 w-4 text-green-600" />,
        label: 'Custom',
        bgColor: 'bg-green-100 dark:bg-green-950',
      }
    default:
      return {
        icon: <span className="text-xs font-bold text-gray-600">?</span>,
        label: 'Unknown',
        bgColor: 'bg-gray-100 dark:bg-gray-950',
      }
  }
}
