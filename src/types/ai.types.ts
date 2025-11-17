/**
 * AI Chat System - Type Definitions
 * Claude Sonnet 4.5 integration with voice input and conversation memory
 */

// ============================================================================
// Chat Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  voiceInput?: boolean;
  campaignContext?: string;
  businessContext?: string;
  processingTime?: number;
  model?: string;
  error?: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  context?: ConversationContext;
}

export interface ConversationContext {
  businessId?: string;
  campaignId?: string;
  industry?: string;
  currentPage?: string;
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  tone?: 'professional' | 'casual' | 'friendly';
  responseLength?: 'brief' | 'detailed';
  language?: string;
}

// ============================================================================
// AI Service Types
// ============================================================================

export interface AIServiceConfig {
  apiKey: string;
  model: 'claude-sonnet-4-5-20250929' | string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: ConversationContext;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalCost?: number;
  };
  error?: string;
}

export interface StreamChunk {
  delta: string;
  complete: boolean;
}

// ============================================================================
// Voice Input Types
// ============================================================================

export interface VoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceTranscription {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  duration: number;
  transcription?: VoiceTranscription;
  status: 'recording' | 'processing' | 'completed' | 'error';
}

// ============================================================================
// Chat Widget Types
// ============================================================================

export interface ChatWidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  showVoiceInput?: boolean;
  showHistory?: boolean;
  maxHeight?: number;
  placeholder?: string;
}

export interface ChatWidgetState {
  isOpen: boolean;
  isLoading: boolean;
  isRecording: boolean;
  error?: string;
  unreadCount: number;
}

// ============================================================================
// Database Types (Supabase)
// ============================================================================

export interface DBConversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  context?: Record<string, unknown>;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Business Intelligence Context for AI
// ============================================================================

export interface AIBusinessContext {
  businessName: string;
  industry: string;
  specialty?: string;
  targetAudience?: string;
  uvpData?: {
    transformation?: string;
    differentiation?: string[];
    proofPoints?: string[];
  };
  currentCampaign?: {
    id: string;
    type: string;
    platform: string;
    performance?: {
      engagementRate?: number;
      reach?: number;
    };
  };
  recentActivity?: {
    lastPost?: Date;
    avgEngagement?: number;
    topPerformingContent?: string;
  };
}

// ============================================================================
// AI Capabilities
// ============================================================================

export type AICapability =
  | 'campaign_strategy'
  | 'content_generation'
  | 'performance_analysis'
  | 'competitor_research'
  | 'hashtag_generation'
  | 'scheduling_optimization'
  | 'pivot_recommendations'
  | 'general_question';

export interface AIIntent {
  capability: AICapability;
  confidence: number;
  parameters?: Record<string, unknown>;
}
