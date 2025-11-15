import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import { MarbsSuggestion } from '@/types/marbs.types'
import { useMarbs } from './MarbsContextProvider'
import { cn } from '@/lib/utils'

interface MarbsInlineSuggestionProps {
  suggestion: MarbsSuggestion
  onDismiss?: () => void
  onExecute?: () => void
  className?: string
}

export const MarbsInlineSuggestion: React.FC<MarbsInlineSuggestionProps> = ({
  suggestion,
  onDismiss,
  onExecute,
  className,
}) => {
  const { dismissSuggestion, executeSuggestion } = useMarbs()

  const handleDismiss = () => {
    dismissSuggestion(suggestion.id)
    onDismiss?.()
  }

  const handleExecute = async () => {
    await executeSuggestion(suggestion.id)
    onExecute?.()
  }

  const priorityColors = {
    critical: 'border-destructive bg-destructive/5',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
    medium: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
    low: 'border-muted',
  }

  const typeIcons = {
    action: <Sparkles className="h-4 w-4 text-primary" />,
    insight: <Sparkles className="h-4 w-4 text-blue-500" />,
    optimization: <Sparkles className="h-4 w-4 text-green-500" />,
    warning: <Sparkles className="h-4 w-4 text-orange-500" />,
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4',
        priorityColors[suggestion.priority],
        className
      )}
    >
      {/* Dismiss Button */}
      {suggestion.dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div className="p-4 pr-10">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5">{typeIcons[suggestion.type]}</div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">{suggestion.title}</h4>
              <Badge variant="secondary" className="text-xs">
                {suggestion.type}
              </Badge>
              <Badge
                variant={
                  suggestion.priority === 'critical' ||
                  suggestion.priority === 'high'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-xs"
              >
                {suggestion.priority}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {suggestion.description}
            </p>

            {/* Action Button */}
            {suggestion.action_label && (
              <Button
                size="sm"
                variant="default"
                className="gap-2"
                onClick={handleExecute}
              >
                {suggestion.action_label}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}

            {/* Expiration */}
            {suggestion.expires_at && (
              <div className="text-xs text-muted-foreground">
                Expires: {new Date(suggestion.expires_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority Indicator */}
      {(suggestion.priority === 'critical' ||
        suggestion.priority === 'high') && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-3 right-[-25px] bg-destructive text-destructive-foreground text-[10px] font-bold px-8 py-0.5 rotate-45 shadow">
            URGENT
          </div>
        </div>
      )}
    </Card>
  )
}

// Inline Suggestions List Component
interface MarbsInlineSuggestionsListProps {
  maxVisible?: number
  className?: string
}

export const MarbsInlineSuggestionsList: React.FC<
  MarbsInlineSuggestionsListProps
> = ({ maxVisible = 3, className }) => {
  const { pending_suggestions } = useMarbs()

  const visibleSuggestions = pending_suggestions.slice(0, maxVisible)

  if (visibleSuggestions.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {visibleSuggestions.map((suggestion) => (
        <MarbsInlineSuggestion key={suggestion.id} suggestion={suggestion} />
      ))}

      {pending_suggestions.length > maxVisible && (
        <div className="text-sm text-center text-muted-foreground">
          +{pending_suggestions.length - maxVisible} more suggestions
        </div>
      )}
    </div>
  )
}
