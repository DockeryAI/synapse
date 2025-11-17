/**
 * AI Memory Types
 *
 * Types for persistent AI memory, business context, tone preferences, and content learning.
 */

/**
 * Business Context
 * Core business information that AI remembers about each SMB
 */
export interface BusinessContext {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  business_type: 'local-service' | 'restaurant' | 'ecommerce' | 'professional-services' | 'b2b-saas' | 'retail' | 'other';
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  target_audience?: string;
  unique_selling_proposition?: string;
  brand_personality?: string;
  brand_voice_samples?: BrandVoiceSample[];
  campaign_preferences?: CampaignPreferences;
  created_at: Date;
  updated_at: Date;
}

/**
 * Brand Voice Sample
 * Examples of the business's authentic voice
 */
export interface BrandVoiceSample {
  id: string;
  text: string;
  source: 'customer_provided' | 'website' | 'social_media' | 'existing_content';
  quality_score?: number; // 0-1, how representative this is
  created_at: Date;
}

/**
 * Campaign Preferences
 * Learned preferences for campaign creation
 */
export interface CampaignPreferences {
  preferred_campaign_types: string[]; // 'authority-builder', 'revenue-rush', etc.
  preferred_platforms: string[]; // 'instagram', 'facebook', etc.
  preferred_content_types: string[]; // 'video', 'image', 'text', 'carousel'
  preferred_durations: number[]; // 5, 7, 10, 14
  avoid_topics?: string[];
  must_include_topics?: string[];
}

/**
 * Tone Preferences
 * How the business wants to sound
 */
export interface TonePreference {
  id: string;
  user_id: string;
  tone_preset?: TonePreset;
  custom_description?: string; // Free text: "friendly but professional", "witty and bold"
  formality_level: 1 | 2 | 3 | 4 | 5; // 1 = very casual, 5 = very formal
  humor_level: 0 | 1 | 2 | 3; // 0 = serious, 3 = very funny
  enthusiasm_level: 1 | 2 | 3 | 4 | 5; // 1 = reserved, 5 = very enthusiastic
  examples?: string[]; // Example content in desired tone
  apply_to_all_content: boolean; // Default: true
  created_at: Date;
  updated_at: Date;
}

/**
 * Tone Presets
 * Pre-defined tone templates
 */
export type TonePreset =
  | 'casual'
  | 'professional'
  | 'funny'
  | 'inspirational'
  | 'bold'
  | 'friendly'
  | 'authoritative'
  | 'conversational';

/**
 * Tone Preset Definition
 */
export interface TonePresetDefinition {
  id: TonePreset;
  name: string;
  description: string;
  formality_level: 1 | 2 | 3 | 4 | 5;
  humor_level: 0 | 1 | 2 | 3;
  enthusiasm_level: 1 | 2 | 3 | 4 | 5;
  example_content: string[];
  best_for: string[]; // Industries/business types
}

/**
 * Natural Language Tone Adjustment
 * "Make it funnier", "more professional", etc.
 */
export interface ToneAdjustment {
  id: string;
  user_id: string;
  adjustment_text: string; // "make it funnier", "less formal"
  parsed_intent: {
    attribute: 'formality' | 'humor' | 'enthusiasm' | 'tone_preset';
    direction: 'increase' | 'decrease' | 'set';
    magnitude?: number; // -2, -1, +1, +2
    target_value?: TonePreset | number;
  };
  applied_at: Date;
}

/**
 * Content Pattern
 * Learned patterns from successful content
 */
export interface ContentPattern {
  id: string;
  user_id: string;
  pattern_type: 'topic' | 'format' | 'hook' | 'cta' | 'hashtag' | 'timing' | 'platform' | 'content_type';
  pattern_value: string; // The actual pattern (e.g., "behind-the-scenes", "question hooks", etc.)
  campaign_type?: string; // Which campaign type this works for
  platform?: string; // Which platform this works on
  performance_metrics: {
    avg_engagement_rate: number;
    avg_reach: number;
    sample_size: number; // How many posts this is based on
    confidence_score: number; // 0-1, how confident we are
  };
  examples: {
    post_id: string;
    content_preview: string;
    engagement_rate: number;
  }[];
  discovered_at: Date;
  last_validated_at: Date;
  is_active: boolean; // Can be disabled if pattern stops working
}

/**
 * AI Learning
 * General learnings about what works for this business
 */
export interface AILearning {
  id: string;
  user_id: string;
  learning_category: 'content' | 'timing' | 'platform' | 'campaign' | 'audience';
  insight: string; // Human-readable insight: "Your audience engages 3x more with behind-the-scenes content"
  data_points: number; // How many data points support this
  confidence: number; // 0-1
  recommendation?: string; // Actionable recommendation
  created_at: Date;
  is_dismissed: boolean; // User can dismiss learnings
}

/**
 * Context Injection Payload
 * What gets injected into every AI conversation
 */
export interface AIContextPayload {
  business_context: {
    name: string;
    industry: string;
    type: string;
    location?: string;
    target_audience?: string;
    usp?: string;
    brand_personality?: string;
    voice_samples?: string[];
  };
  tone_preferences: {
    preset?: TonePreset;
    custom_description?: string;
    formality: number;
    humor: number;
    enthusiasm: number;
    examples?: string[];
  };
  successful_patterns: {
    topics: string[];
    formats: string[];
    hooks: string[];
    ctas: string[];
  };
  campaign_preferences?: {
    preferred_types: string[];
    preferred_platforms: string[];
    avoid_topics?: string[];
  };
  recent_performance?: {
    avg_engagement_rate: number;
    best_performing_content_type: string;
    best_performing_platform: string;
  };
  learnings?: {
    insight: string;
    recommendation?: string;
  }[];
}

/**
 * Memory Retrieval Options
 */
export interface MemoryRetrievalOptions {
  include_business_context?: boolean;
  include_tone_preferences?: boolean;
  include_content_patterns?: boolean;
  include_campaign_preferences?: boolean;
  include_recent_performance?: boolean;
  include_learnings?: boolean;
  max_learnings?: number;
  max_patterns?: number;
}

/**
 * Content Performance Data
 * Used to identify patterns
 */
export interface ContentPerformanceData {
  post_id: string;
  user_id: string;
  campaign_id?: string;
  campaign_type?: string;
  platform: string;
  content_type: 'video' | 'image' | 'text' | 'carousel';
  content_preview: string;
  topic?: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  posted_at: Date;
  metrics: {
    reach: number;
    engagement: number;
    engagement_rate: number;
    clicks?: number;
    shares?: number;
    saves?: number;
  };
  is_high_performing: boolean; // Engagement > benchmark
  benchmark_multiplier?: number; // How much better than benchmark
}

/**
 * Pattern Discovery Result
 */
export interface PatternDiscoveryResult {
  pattern: ContentPattern;
  is_new: boolean; // New pattern or update to existing
  previous_confidence?: number; // If updating
  recommendation: string; // What to do with this pattern
}

/**
 * Tone Adjustment Result
 */
export interface ToneAdjustmentResult {
  success: boolean;
  previous_tone: Partial<TonePreference>;
  new_tone: Partial<TonePreference>;
  changes: string[]; // Human-readable list of changes
}

/**
 * Context Injection Result
 */
export interface ContextInjectionResult {
  system_message: string; // Formatted for Claude API
  context_payload: AIContextPayload;
  tokens_used: number; // Approximate token count
  components_included: string[]; // Which components were included
}

/**
 * Database Schemas
 */
export interface AIBusinessContextRow {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  business_type: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  target_audience?: string;
  unique_selling_proposition?: string;
  brand_personality?: string;
  brand_voice_samples: any; // JSONB
  campaign_preferences: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface AITonePreferenceRow {
  id: string;
  user_id: string;
  tone_preset?: string;
  custom_description?: string;
  formality_level: number;
  humor_level: number;
  enthusiasm_level: number;
  examples: string[]; // TEXT[]
  apply_to_all_content: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIContentPatternRow {
  id: string;
  user_id: string;
  pattern_type: string;
  pattern_value: string;
  campaign_type?: string;
  platform?: string;
  avg_engagement_rate: number;
  avg_reach: number;
  sample_size: number;
  confidence_score: number;
  examples: any; // JSONB
  discovered_at: string;
  last_validated_at: string;
  is_active: boolean;
}

export interface AILearningRow {
  id: string;
  user_id: string;
  learning_category: string;
  insight: string;
  data_points: number;
  confidence: number;
  recommendation?: string;
  created_at: string;
  is_dismissed: boolean;
}
