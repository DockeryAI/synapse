/**
 * Conversation Storage Service
 * Persists AI chat conversations and messages to Supabase
 *
 * Features:
 * - Create/read/update/delete conversations
 * - Store messages with metadata
 * - Retrieve conversation history
 * - Search conversations
 * - Clean up old conversations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Conversation,
  ChatMessage,
  ConversationContext,
  DBConversation,
  DBMessage,
  ServiceResponse,
} from '../../types/ai.types';

export class ConversationStorageService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    context?: ConversationContext
  ): Promise<ServiceResponse<Conversation>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          context: context || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const conversation = this.dbToConversation(data);

      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      };
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ServiceResponse<Conversation>> {
    try {
      // Get conversation
      const { data: convData, error: convError } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get messages
      const { data: messagesData, error: messagesError } = await this.supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const conversation = this.dbToConversation(convData);
      conversation.messages = messagesData.map((msg) => this.dbToMessage(msg));

      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversation',
      };
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ServiceResponse<Conversation[]>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversations = data.map((conv) => this.dbToConversation(conv));

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversations',
      };
    }
  }

  /**
   * Get or create current conversation for user
   */
  async getCurrentConversation(
    userId: string,
    context?: ConversationContext
  ): Promise<ServiceResponse<Conversation>> {
    try {
      // Try to get most recent conversation
      const { data, error } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Return existing conversation with messages
        return this.getConversation(data.id);
      } else {
        // Create new conversation
        return this.createConversation(userId, context);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current conversation',
      };
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ServiceResponse<ChatMessage>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await this.supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      const chatMessage = this.dbToMessage(data);

      return {
        success: true,
        data: chatMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add message',
      };
    }
  }

  /**
   * Update conversation context
   */
  async updateContext(
    conversationId: string,
    context: ConversationContext
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .update({
          context,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update context',
      };
    }
  }

  /**
   * Update conversation title
   */
  async updateTitle(conversationId: string, title: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update title',
      };
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<ServiceResponse<void>> {
    try {
      // Messages will be deleted by CASCADE
      const { error } = await this.supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      };
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(
    userId: string,
    query: string
  ): Promise<ServiceResponse<Conversation[]>> {
    try {
      // Search in conversation titles
      const { data: convData, error: convError } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Also search in message content
      const { data: msgData, error: msgError } = await this.supabase
        .from('ai_messages')
        .select('conversation_id')
        .ilike('content', `%${query}%`);

      if (msgError) throw msgError;

      // Combine results
      const conversationIds = new Set([
        ...convData.map((c) => c.id),
        ...msgData.map((m) => m.conversation_id),
      ]);

      const { data: allConvs, error: allError } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .in('id', Array.from(conversationIds))
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (allError) throw allError;

      const conversations = allConvs.map((conv) => this.dbToConversation(conv));

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search conversations',
      };
    }
  }

  /**
   * Clean up old conversations (optional maintenance)
   */
  async cleanupOldConversations(
    userId: string,
    daysOld: number = 90
  ): Promise<ServiceResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', userId)
        .lt('updated_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup conversations',
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert DB conversation to Conversation type
   */
  private dbToConversation(db: DBConversation): Conversation {
    return {
      id: db.id,
      userId: db.user_id,
      messages: [],
      createdAt: new Date(db.created_at),
      updatedAt: new Date(db.updated_at),
      title: db.title,
      context: db.context as ConversationContext,
    };
  }

  /**
   * Convert DB message to ChatMessage type
   */
  private dbToMessage(db: DBMessage): ChatMessage {
    return {
      id: db.id,
      role: db.role,
      content: db.content,
      timestamp: new Date(db.created_at),
      metadata: db.metadata,
    };
  }

  /**
   * Get database schema SQL (for setup)
   */
  static getDatabaseSchema(): string {
    return `
-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_messages(created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own conversations
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: Messages inherit conversation permissions
CREATE POLICY "Users can view messages in their conversations"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON ai_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );
`;
  }
}

// Factory function
export const createConversationStorage = (
  supabaseUrl: string,
  supabaseKey: string
): ConversationStorageService => {
  return new ConversationStorageService(supabaseUrl, supabaseKey);
};
