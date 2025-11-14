// Application-wide constants

import type { ContentPlatform } from '@/types';

// MIRROR Framework Phase Names
// MIRROR: Measure, Intend, Reimagine, Reach, Optimize, Reflect
export const MIRROR_PHASES = {
  measure: 'Measure',
  intend: 'Intend',
  reimagine: 'Reimagine',
  reach: 'Reach',
  optimize: 'Optimize',
  reflect: 'Reflect',
} as const;

// Content Platforms
export const PLATFORMS: Record<ContentPlatform, { name: string; icon: string; color: string }> = {
  facebook: { name: 'Facebook', icon: 'facebook', color: '#1877F2' },
  instagram: { name: 'Instagram', icon: 'instagram', color: '#E4405F' },
  linkedin: { name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  twitter: { name: 'Twitter', icon: 'twitter', color: '#1DA1F2' },
  tiktok: { name: 'TikTok', icon: 'tiktok', color: '#000000' },
  google_business: { name: 'Google Business', icon: 'google', color: '#4285F4' },
  blog: { name: 'Blog', icon: 'file-text', color: '#6366F1' },
  email: { name: 'Email', icon: 'mail', color: '#8B5CF6' },
};

// Content Generation Modes
export const GENERATION_MODES = {
  marba: {
    name: 'MARBA',
    description: 'Fast generation with Claude Sonnet 3.5',
    icon: 'zap',
    color: 'blue',
  },
  synapse: {
    name: 'Synapse',
    description: 'Enhanced with psychology, connections, and power words',
    icon: 'brain',
    color: 'purple',
  },
} as const;

// MARBA Score Components
export const MARBA_COMPONENTS = {
  messaging: { name: 'Messaging', max: 20, color: 'blue' },
  authenticity: { name: 'Authenticity', max: 20, color: 'green' },
  relevance: { name: 'Relevance', max: 20, color: 'yellow' },
  brand_alignment: { name: 'Brand Alignment', max: 20, color: 'purple' },
  action: { name: 'Action', max: 20, color: 'red' },
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  critical: { label: 'Critical', color: 'red', icon: 'alert-circle' },
  high: { label: 'High', color: 'orange', icon: 'alert-triangle' },
  medium: { label: 'Medium', color: 'yellow', icon: 'info' },
  low: { label: 'Low', color: 'blue', icon: 'circle' },
} as const;

// Status Colors
export const STATUS_COLORS = {
  draft: 'gray',
  scheduled: 'blue',
  published: 'green',
  failed: 'red',
  archived: 'gray',
  new: 'blue',
  in_progress: 'yellow',
  reviewed: 'purple',
  actioned: 'green',
  dismissed: 'gray',
  expired: 'red',
  completed: 'green',
  on_track: 'green',
  at_risk: 'yellow',
  behind: 'red',
} as const;

// Opportunity Types
export const OPPORTUNITY_TYPES = {
  weather_based: { label: 'Weather', icon: 'cloud', color: 'blue' },
  trending_topic: { label: 'Trending', icon: 'trending-up', color: 'purple' },
  competitor_move: { label: 'Competitor', icon: 'users', color: 'orange' },
  keyword_opportunity: { label: 'Keyword', icon: 'search', color: 'green' },
  review_response: { label: 'Review', icon: 'star', color: 'yellow' },
  seasonal_event: { label: 'Seasonal', icon: 'calendar', color: 'red' },
  local_news: { label: 'Local News', icon: 'newspaper', color: 'indigo' },
  industry_shift: { label: 'Industry', icon: 'bar-chart', color: 'teal' },
  audience_behavior: { label: 'Audience', icon: 'activity', color: 'pink' },
  platform_update: { label: 'Platform', icon: 'settings', color: 'cyan' },
} as const;

// Urgency Levels
export const URGENCY_LEVELS = {
  critical: { label: 'Critical', hours: 24, color: 'red' },
  high: { label: 'High', hours: 72, color: 'orange' },
  medium: { label: 'Medium', hours: 168, color: 'yellow' },
  low: { label: 'Low', hours: 336, color: 'blue' },
} as const;

// Marbs Action Types
export const MARBS_ACTION_TYPES = {
  content_generated: { label: 'Content Generated', icon: 'file-text' },
  analysis_run: { label: 'Analysis Run', icon: 'pie-chart' },
  data_updated: { label: 'Data Updated', icon: 'database' },
  insight_discovered: { label: 'Insight Discovered', icon: 'lightbulb' },
  task_created: { label: 'Task Created', icon: 'check-square' },
  objective_set: { label: 'Objective Set', icon: 'target' },
  recommendation_made: { label: 'Recommendation Made', icon: 'message-circle' },
  calendar_updated: { label: 'Calendar Updated', icon: 'calendar' },
  design_created: { label: 'Design Created', icon: 'image' },
  post_scheduled: { label: 'Post Scheduled', icon: 'clock' },
  analytics_fetched: { label: 'Analytics Fetched', icon: 'trending-up' },
} as const;

// Intelligence Badge Styles
export const INTELLIGENCE_BADGES = {
  synapse: 'intelligence-badge-synapse',
  industry: 'intelligence-badge-industry',
  opportunity: 'intelligence-badge-opportunity',
  learning: 'intelligence-badge-learning',
  competitive: 'intelligence-badge-competitive',
} as const;

// Default Content Lengths (characters)
export const CONTENT_LENGTHS = {
  facebook: { short: 100, medium: 250, long: 500 },
  instagram: { short: 125, medium: 300, long: 600 },
  linkedin: { short: 150, medium: 500, long: 1300 },
  twitter: { short: 100, medium: 200, long: 280 },
  tiktok: { short: 50, medium: 100, long: 150 },
  google_business: { short: 100, medium: 300, long: 500 },
  blog: { short: 300, medium: 800, long: 2000 },
  email: { short: 200, medium: 500, long: 1000 },
} as const;

// Recommended Posting Times (hours in 24h format)
export const RECOMMENDED_POSTING_TIMES = {
  facebook: [9, 13, 15],
  instagram: [11, 13, 19],
  linkedin: [8, 12, 17],
  twitter: [9, 12, 17],
  tiktok: [18, 19, 21],
  google_business: [9, 12, 17],
  blog: [9, 10, 14],
  email: [10, 14, 18],
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  analyzeMirror: '/supabase/functions/v1/analyze-mirror',
  marbsAssistant: '/supabase/functions/v1/marbs-assistant',
  generateContent: '/supabase/functions/v1/generate-content',
  enrichWithSynapse: '/supabase/functions/v1/enrich-with-synapse',
  publishToPlatforms: '/supabase/functions/v1/publish-to-platforms',
  collectAnalytics: '/supabase/functions/v1/collect-analytics',
} as const;

// OpenRouter Models
export const OPENROUTER_MODELS = {
  claude35Sonnet: 'anthropic/claude-3.5-sonnet',
  claude3Opus: 'anthropic/claude-3-opus',
  gpt4: 'openai/gpt-4-turbo',
  gpt35: 'openai/gpt-3.5-turbo',
} as const;

// Feature Flags
export const FEATURES = {
  synapseMode: true,
  designStudio: true,
  marbsAssistant: true,
  intelligenceOpportunities: true,
  competitiveTracking: true,
  learningPatterns: true,
  abTesting: false, // Coming soon
  advancedAnalytics: false, // Coming soon
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  theme: 'marba_theme',
  selectedBrand: 'marba_selected_brand',
  marbsConversation: 'marba_marbs_conversation',
  calendarView: 'marba_calendar_view',
  calendarFilters: 'marba_calendar_filters',
  recentSearches: 'marba_recent_searches',
  userPreferences: 'marba_user_preferences',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  generic: 'An unexpected error occurred. Please try again.',
  network: 'Network error. Please check your connection and try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  rateLimit: 'Too many requests. Please wait a moment and try again.',
  timeout: 'Request timed out. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  contentGenerated: 'Content generated successfully!',
  contentScheduled: 'Content scheduled successfully!',
  contentPublished: 'Content published successfully!',
  settingsSaved: 'Settings saved successfully!',
  dataSynced: 'Data synced successfully!',
  analysisComplete: 'Analysis complete!',
} as const;

// Validation Rules
export const VALIDATION = {
  minPasswordLength: 8,
  maxContentLength: 5000,
  maxHashtags: 30,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
} as const;

// Date Formats
export const DATE_FORMATS = {
  short: 'MMM d, yyyy',
  long: 'MMMM d, yyyy h:mm a',
  time: 'h:mm a',
  iso: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Chart Colors (for data visualization)
export const CHART_COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
  pastels: ['#93C5FD', '#C4B5FD', '#F9A8D4', '#FCD34D', '#6EE7B7'],
  dark: ['#1E40AF', '#6D28D9', '#BE185D', '#D97706', '#059669'],
} as const;

// Animation Durations (milliseconds)
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
