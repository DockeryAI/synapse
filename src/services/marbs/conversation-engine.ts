import {
  MarbsConversation,
  MarbsMessage,
  MarbsRequest,
  MarbsResponse,
  MarbsContext,
  MarbsAction,
  MarbsSuggestion,
} from '@/types/marbs.types'
import { supabase } from '@/lib/supabase'
import { ContextAwarenessService } from './context-awareness'

/**
 * Conversation Engine Service
 * Handles AI conversations, message history, and context management
 */

export class ConversationEngine {
  /**
   * Send message to Marbs and get response
   */
  static async sendMessage(
    message: string,
    context: MarbsContext,
    conversationId?: string
  ): Promise<MarbsResponse> {
    try {
      // Get or create conversation
      const conversation = conversationId
        ? await this.getConversation(conversationId)
        : await this.createConversation(context)

      if (!conversation) {
        throw new Error('Failed to create or retrieve conversation')
      }

      // Build request
      const request: MarbsRequest = {
        message,
        context,
        conversation_id: conversation.id,
        streaming: false,
      }

      // Call Supabase edge function
      const { data: response, error } = await supabase.functions.invoke(
        'marbs-assistant',
        {
          body: request,
        }
      )

      if (error) throw error

      // Save messages to database
      await this.saveMessage(conversation.id, {
        role: 'user',
        content: message,
      })

      await this.saveMessage(conversation.id, {
        role: 'assistant',
        content: response.message,
      })

      // Save actions if any
      if (response.actions && response.actions.length > 0) {
        await this.saveActions(conversation.id, response.actions)
      }

      return response as MarbsResponse
    } catch (error) {
      console.error('Failed to send message to Marbs:', error)
      throw error
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(
    conversationId: string
  ): Promise<MarbsConversation | null> {
    try {
      const { data, error } = await supabase
        .from('marbs_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error

      // Get messages
      const messages = await this.getMessages(conversationId)

      // Get actions
      const actions = await this.getActions(conversationId)

      return {
        ...data,
        messages,
        actions_taken: actions,
      } as MarbsConversation
    } catch (error) {
      console.error('Failed to get conversation:', error)
      return null
    }
  }

  /**
   * Create new conversation
   */
  static async createConversation(
    context: MarbsContext
  ): Promise<MarbsConversation | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('User not authenticated')

      const brandId = context.relevant_data?.brand_id || context.page_data?.brandId

      if (!brandId) throw new Error('Brand ID not found in context')

      const { data, error } = await supabase
        .from('marbs_conversations')
        .insert({
          brand_id: brandId,
          user_id: user.id,
          context: context,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        ...data,
        messages: [],
        actions_taken: [],
      } as MarbsConversation
    } catch (error) {
      console.error('Failed to create conversation:', error)
      return null
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<MarbsMessage[]> {
    try {
      const { data, error } = await supabase
        .from('marbs_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      return (data as any[]).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      })) as MarbsMessage[]
    } catch (error) {
      console.error('Failed to get messages:', error)
      return []
    }
  }

  /**
   * Save message to database
   */
  static async saveMessage(
    conversationId: string,
    message: Pick<MarbsMessage, 'role' | 'content'>
  ): Promise<void> {
    try {
      const { error } = await supabase.from('marbs_messages').insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(),
      })

      if (error) throw error

      // Update conversation last_message_at
      await supabase
        .from('marbs_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  /**
   * Get actions for a conversation
   */
  static async getActions(conversationId: string): Promise<MarbsAction[]> {
    try {
      const { data, error } = await supabase
        .from('marbs_actions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      return data as MarbsAction[]
    } catch (error) {
      console.error('Failed to get actions:', error)
      return []
    }
  }

  /**
   * Save actions to database
   */
  static async saveActions(
    conversationId: string,
    actions: MarbsAction[]
  ): Promise<void> {
    try {
      const records = actions.map((action) => ({
        conversation_id: conversationId,
        type: action.type,
        description: action.description,
        data: action.data,
        timestamp: action.timestamp,
        result: action.result,
      }))

      const { error } = await supabase.from('marbs_actions').insert(records)

      if (error) throw error
    } catch (error) {
      console.error('Failed to save actions:', error)
    }
  }

  /**
   * Get recent conversations for a brand
   */
  static async getRecentConversations(
    brandId: string,
    limit: number = 10
  ): Promise<MarbsConversation[]> {
    try {
      const { data, error } = await supabase
        .from('marbs_conversations')
        .select('*')
        .eq('brand_id', brandId)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Get messages for each conversation
      const conversations = await Promise.all(
        (data as any[]).map(async (conv) => {
          const messages = await this.getMessages(conv.id)
          const actions = await this.getActions(conv.id)
          return {
            ...conv,
            messages,
            actions_taken: actions,
          } as MarbsConversation
        })
      )

      return conversations
    } catch (error) {
      console.error('Failed to get recent conversations:', error)
      return []
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Delete messages
      await supabase
        .from('marbs_messages')
        .delete()
        .eq('conversation_id', conversationId)

      // Delete actions
      await supabase
        .from('marbs_actions')
        .delete()
        .eq('conversation_id', conversationId)

      // Delete conversation
      const { error } = await supabase
        .from('marbs_conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  }

  /**
   * Build system prompt based on context
   */
  static buildSystemPrompt(context: MarbsContext): string {
    const capabilities =
      ContextAwarenessService.getAvailableCapabilities(context)
    const contextDescription =
      ContextAwarenessService.formatContextForPrompt(context)

    return `You are Marbs, an AI assistant for the MARBA Mirror marketing intelligence platform.

${contextDescription}

Available capabilities in this section:
${capabilities.map((cap) => `- ${cap}`).join('\n')}

Your role:
- Help users understand their brand data and insights
- Suggest optimizations and improvements
- Generate content and creative ideas
- Execute actions when requested
- Provide strategic guidance based on MIRROR framework

Guidelines:
- Be concise and actionable
- Reference specific data when available
- Suggest concrete next steps
- Use marketing terminology appropriately
- Focus on the current section's objectives

When suggesting actions, use this format:
ACTION: [action_type] - [description]
`
  }
}
