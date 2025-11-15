import * as React from 'react'
import {
  MarbsState,
  MarbsConversation,
  MarbsSuggestion,
  MarbsCapability,
  MarbsContext as MarbsContextType,
} from '@/types/marbs.types'
import {
  ContextAwarenessService,
  ConversationEngine,
  ActionExecutor,
} from '@/services/marbs'

interface MarbsContextValue extends MarbsState {
  sendMessage: (message: string) => Promise<void>
  dismissSuggestion: (suggestionId: string) => void
  executeSuggestion: (suggestionId: string) => Promise<void>
  openMarbs: () => void
  closeMarbs: () => void
  toggleMarbs: () => void
  updateContext: (context: Partial<MarbsContextType>) => void
}

const MarbsContext = React.createContext<MarbsContextValue | undefined>(
  undefined
)

interface MarbsContextProviderProps {
  children: React.ReactNode
  brandId: string
}

export const MarbsContextProvider: React.FC<MarbsContextProviderProps> = ({
  children,
  brandId,
}) => {
  const [state, setState] = React.useState<MarbsState>({
    is_active: false,
    current_conversation: undefined,
    pending_suggestions: [],
    capabilities: [],
    learning_insights: [],
  })

  const [context, setContext] = React.useState<MarbsContext>(() =>
    ContextAwarenessService.detectContext(undefined, { brandId })
  )

  // Update context when location changes
  React.useEffect(() => {
    const updateContext = () => {
      const newContext = ContextAwarenessService.detectContext(undefined, {
        brandId,
      })
      setContext(newContext)
    }

    // Listen for route changes
    window.addEventListener('popstate', updateContext)
    window.addEventListener('pushstate', updateContext)
    window.addEventListener('replacestate', updateContext)

    return () => {
      window.removeEventListener('popstate', updateContext)
      window.removeEventListener('pushstate', updateContext)
      window.removeEventListener('replacestate', updateContext)
    }
  }, [brandId])

  // Send message to Marbs
  const sendMessage = React.useCallback(
    async (message: string) => {
      try {
        const conversationId = state.current_conversation?.id

        const response = await ConversationEngine.sendMessage(
          message,
          context,
          conversationId
        )

        // Update conversation
        const updatedConversation = await ConversationEngine.getConversation(
          response.conversation_id
        )

        setState((prev) => ({
          ...prev,
          current_conversation: updatedConversation || undefined,
          pending_suggestions: [
            ...prev.pending_suggestions,
            ...(response.suggestions || []),
          ],
        }))

        // Execute actions if any
        if (response.actions && response.actions.length > 0) {
          for (const action of response.actions) {
            await ActionExecutor.executeAction(action, context)
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [context, state.current_conversation]
  )

  // Dismiss suggestion
  const dismissSuggestion = React.useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      pending_suggestions: prev.pending_suggestions.filter(
        (s) => s.id !== suggestionId
      ),
    }))
  }, [])

  // Execute suggestion
  const executeSuggestion = React.useCallback(
    async (suggestionId: string) => {
      const suggestion = state.pending_suggestions.find(
        (s) => s.id === suggestionId
      )

      if (!suggestion || !suggestion.action_data) return

      try {
        const action = {
          type: suggestion.action_data.type,
          description: suggestion.description,
          data: suggestion.action_data,
          timestamp: new Date().toISOString(),
        }

        await ActionExecutor.executeAction(action, context)

        // Remove suggestion after execution
        dismissSuggestion(suggestionId)
      } catch (error) {
        console.error('Failed to execute suggestion:', error)
      }
    },
    [state.pending_suggestions, context, dismissSuggestion]
  )

  // Open Marbs
  const openMarbs = React.useCallback(() => {
    setState((prev) => ({ ...prev, is_active: true }))
  }, [])

  // Close Marbs
  const closeMarbs = React.useCallback(() => {
    setState((prev) => ({ ...prev, is_active: false }))
  }, [])

  // Toggle Marbs
  const toggleMarbs = React.useCallback(() => {
    setState((prev) => ({ ...prev, is_active: !prev.is_active }))
  }, [])

  // Update context
  const updateContext = React.useCallback(
    (updates: Partial<MarbsContext>) => {
      setContext((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  // Load capabilities based on context
  React.useEffect(() => {
    const availableCapabilities =
      ContextAwarenessService.getAvailableCapabilities(context)

    const capabilities: MarbsCapability[] = availableCapabilities.map((cap) => ({
      id: cap,
      name: cap.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `${cap} capability`,
      category: 'analysis',
      available: true,
      requires_upgrade: false,
    }))

    setState((prev) => ({ ...prev, capabilities }))
  }, [context])

  const value: MarbsContextValue = {
    ...state,
    sendMessage,
    dismissSuggestion,
    executeSuggestion,
    openMarbs,
    closeMarbs,
    toggleMarbs,
    updateContext,
  }

  return <MarbsContext.Provider value={value}>{children}</MarbsContext.Provider>
}

export const useMarbs = () => {
  const context = React.useContext(MarbsContext)
  if (context === undefined) {
    throw new Error('useMarbs must be used within a MarbsContextProvider')
  }
  return context
}
