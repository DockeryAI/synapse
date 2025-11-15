import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  X,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { useMarbs } from './MarbsContextProvider'
import { cn } from '@/lib/utils'
import { MarbsMessage } from '@/types/marbs.types'

interface MarbsSidebarProps {
  className?: string
}

export const MarbsSidebar: React.FC<MarbsSidebarProps> = ({ className }) => {
  const {
    is_active,
    current_conversation,
    pending_suggestions,
    capabilities,
    sendMessage,
    dismissSuggestion,
    executeSuggestion,
    closeMarbs,
  } = useMarbs()

  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showCapabilities, setShowCapabilities] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [current_conversation?.messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    try {
      await sendMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!is_active) return null

  return (
    <div
      className={cn(
        'fixed right-6 bottom-24 z-40 w-96 h-[600px] flex flex-col',
        'bg-background border rounded-lg shadow-2xl',
        'animate-in slide-in-from-right duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Marbs Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={closeMarbs}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions */}
      {pending_suggestions.length > 0 && (
        <div className="p-4 border-b bg-muted/20 space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground">
            Suggestions
          </div>
          {pending_suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1">
                    {suggestion.type === 'action' && (
                      <Zap className="h-3 w-3 text-primary" />
                    )}
                    {suggestion.type === 'insight' && (
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                    )}
                    <span className="text-sm font-medium">
                      {suggestion.title}
                    </span>
                    <Badge
                      variant={
                        suggestion.priority === 'high' ? 'destructive' : 'secondary'
                      }
                      className="ml-auto"
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                  {suggestion.expires_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Expires soon
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {suggestion.action_label && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => executeSuggestion(suggestion.id)}
                  >
                    {suggestion.action_label}
                  </Button>
                )}
                {suggestion.dismissible && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissSuggestion(suggestion.id)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <div className="border-b">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowCapabilities(!showCapabilities)}
          >
            <span className="text-xs font-medium">
              Available in this section ({capabilities.length})
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showCapabilities && 'rotate-180'
              )}
            />
          </Button>
          {showCapabilities && (
            <div className="p-2 space-y-1 max-h-32 overflow-y-auto">
              {capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="text-xs text-muted-foreground px-2 py-1"
                >
                  • {cap.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {current_conversation?.messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/20" />
            <p className="mb-2">Hi! I'm Marbs, your AI assistant.</p>
            <p className="text-xs">
              Ask me anything about your brand, content, or marketing strategy.
            </p>
          </div>
        )}

        {current_conversation?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Input
            placeholder="Ask Marbs..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
interface MessageBubbleProps {
  message: MarbsMessage
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div
          className={cn(
            'text-xs mt-1 opacity-70',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
