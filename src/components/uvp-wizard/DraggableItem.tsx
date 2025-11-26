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
import { GripVertical, Sparkles, Edit2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DraggableSuggestion } from '@/types/uvp-wizard'

/**
 * DraggableItem component props
 */
interface DraggableItemProps {
  suggestion: DraggableSuggestion
  onSelect?: (suggestion: DraggableSuggestion) => void
  onRemove?: (id: string) => void
  onCustomize?: (suggestion: DraggableSuggestion) => void
  onEdit?: (id: string, newContent: string) => void
  disabled?: boolean
  showRemove?: boolean
  showCheckbox?: boolean
  isChecked?: boolean
  onCheckChange?: (id: string, checked: boolean) => void
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
  onEdit,
  disabled = false,
  showRemove = false,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  className,
}) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState(suggestion.content)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: suggestion.id,
    disabled: disabled || isEditing,  // Disable dragging when editing
    data: suggestion,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(suggestion.id, editedContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(suggestion.content)
    setIsEditing(false)
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
        isEditing && 'border-primary shadow-md',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !isEditing && 'cursor-grab active:cursor-grabbing',
        className
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      {!isEditing && (
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
      )}

      {/* Content */}
      <div className={cn('flex items-start gap-3', !disabled && !showCheckbox && 'pl-4')}>
        {/* Checkbox for multi-select */}
        {showCheckbox && onCheckChange && (
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onCheckChange(suggestion.id, checked === true)}
            />
          </div>
        )}

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
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editedContent.trim()}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{suggestion.content}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2">
            {/* Source Badge */}
            <Badge variant="secondary" className="text-xs">
              {sourceConfig.label}
            </Badge>

            {/* Confidence Score */}
            {suggestion.confidence && !isNaN(suggestion.confidence) && suggestion.confidence > 0 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(suggestion.confidence * 100)}% match
              </Badge>
            )}

            {/* Tags - Filter out internal/technical tags */}
            {suggestion.tags && suggestion.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {suggestion.tags
                  .filter(tag => !tag.startsWith('target_') && !tag.startsWith('industry:') && !tag.startsWith('size:') && !tag.startsWith('role:') && !tag.startsWith('location:'))
                  .slice(0, 2)
                  .map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            {/* Edit Button */}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
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
        )}
      </div>

      {/* Quick Select Overlay (on click) */}
      {onSelect && !disabled && !isEditing && (
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
