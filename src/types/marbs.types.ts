// Type definitions for Marbs AI Assistant

export interface MarbsMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MarbsConversation {
  id: string;
  brand_id: string;
  user_id: string;
  context: MarbsContext;
  messages: MarbsMessage[];
  actions_taken: MarbsAction[];
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface MarbsContext {
  current_section?: string;
  current_subsection?: string;
  current_page?: string;
  page_data?: Record<string, any>;
  user_intent?: string;
  relevant_data?: Record<string, any>;
}

export interface MarbsAction {
  type: MarbsActionType;
  description: string;
  data: Record<string, any>;
  timestamp: string;
  result?: 'success' | 'failure' | 'partial';
}

export type MarbsActionType =
  | 'content_generated'
  | 'analysis_run'
  | 'data_updated'
  | 'insight_discovered'
  | 'task_created'
  | 'objective_set'
  | 'recommendation_made'
  | 'calendar_updated'
  | 'design_created'
  | 'post_scheduled'
  | 'analytics_fetched';

export interface MarbsSuggestion {
  id: string;
  type: 'action' | 'insight' | 'optimization' | 'warning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_label?: string;
  action_data?: Record<string, any>;
  dismissible: boolean;
  expires_at?: string;
  created_at: string;
}

export interface MarbsCapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'automation' | 'insight' | 'optimization';
  available: boolean;
  requires_upgrade?: boolean;
  usage_count?: number;
}

export interface MarbsState {
  is_active: boolean;
  current_conversation?: MarbsConversation;
  pending_suggestions: MarbsSuggestion[];
  capabilities: MarbsCapability[];
  learning_insights: string[];
}

export interface MarbsRequest {
  message: string;
  context: MarbsContext;
  conversation_id?: string;
  streaming?: boolean;
}

export interface MarbsResponse {
  message: string;
  actions?: MarbsAction[];
  suggestions?: MarbsSuggestion[];
  conversation_id: string;
  metadata?: Record<string, any>;
}

export interface MarbsAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  data_visualizations?: any[];
  confidence_score: number;
  sources: string[];
}
