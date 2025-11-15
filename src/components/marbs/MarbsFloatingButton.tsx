import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Sparkles, X } from 'lucide-react'
import { useMarbs } from './MarbsContextProvider'
import { cn } from '@/lib/utils'

interface MarbsFloatingButtonProps {
  className?: string
}

export const MarbsFloatingButton: React.FC<MarbsFloatingButtonProps> = ({
  className,
}) => {
  const { is_active, pending_suggestions, toggleMarbs } = useMarbs()
  const [isHovered, setIsHovered] = React.useState(false)

  const hasSuggestions = pending_suggestions.length > 0

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <Button
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          'hover:scale-110 active:scale-95',
          is_active && 'bg-primary/90',
          hasSuggestions && 'animate-pulse'
        )}
        onClick={toggleMarbs}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {is_active ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}

        {/* Suggestions Badge */}
        {hasSuggestions && !is_active && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
          >
            {pending_suggestions.length}
          </Badge>
        )}

        {/* Sparkle Effect */}
        {hasSuggestions && !is_active && (
          <Sparkles
            className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-bounce"
            style={{ animationDelay: '0.5s' }}
          />
        )}
      </Button>

      {/* Tooltip */}
      {isHovered && !is_active && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md whitespace-nowrap">
          {hasSuggestions
            ? `${pending_suggestions.length} suggestion${
                pending_suggestions.length > 1 ? 's' : ''
              }`
            : 'Ask Marbs'}
          <div className="absolute top-full right-6 -mt-px">
            <div className="border-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  )
}
