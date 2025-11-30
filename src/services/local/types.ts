/**
 * Local 2.0 Types
 *
 * Types for local event/news discovery pipeline.
 * Surfaces community events, local news, and neighborhood happenings.
 */

// ============================================================================
// INSIGHT TYPES
// ============================================================================

export type LocalInsightType = 'event' | 'news' | 'community' | 'school' | 'sports' | 'charity';

export type LocalInsightUrgency = 'high' | 'medium' | 'low';

export interface LocalInsightTiming {
  isUpcoming: boolean;
  daysUntil?: number;
  isOngoing: boolean;
  isPast: boolean;
  eventDate?: string;
  displayDate?: string;
}

export interface LocalInsightSource {
  name: string;
  url?: string;
  type: 'serper_news' | 'serper_places' | 'perplexity';
  snippet?: string;
}

export interface LocalInsight {
  id: string;
  type: LocalInsightType;
  title: string;
  description: string;
  location: string;
  relevanceScore: number;
  relevanceReasons: string[];  // Why this insight is relevant to the business
  urgency: LocalInsightUrgency;
  timing: LocalInsightTiming;
  contentAngles: string[];
  sources: LocalInsightSource[];

  // Optional metadata
  industry?: string;
  keywords?: string[];
  imageUrl?: string;
}

// ============================================================================
// QUERY CONFIGURATION
// ============================================================================

export interface LocalLocation {
  city: string;
  state: string;
  neighborhood?: string;
  zipCode?: string;
}

export interface LocalQueryConfig {
  location: LocalLocation;
  industry: string;
  businessName?: string;
  targetCustomer?: string;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface LocalPipelineStats {
  rawCount: number;
  validatedCount: number;
  highRelevanceCount: number;
  byType: Record<LocalInsightType, number>;
}

export interface LocalPipelineResult {
  insights: LocalInsight[];
  stats: LocalPipelineStats;
  apisUsed: string[];
  location: string;
  generatedAt: string;
}

export interface LocalPipelineState {
  stage: 'idle' | 'extracting' | 'generating_queries' | 'fetching_news' | 'fetching_places' | 'fetching_perplexity' | 'scoring' | 'complete' | 'error';
  progress: number;
  statusMessage: string;
  error?: string;
}

// ============================================================================
// RAW API RESPONSE TYPES
// ============================================================================

export interface RawSerperNewsItem {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl?: string;
}

export interface RawSerperPlaceItem {
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  category?: string;
  placeId?: string;
}

export interface RawPerplexityInsight {
  title: string;
  description: string;
  type?: string;
  date?: string;
  relevance?: string;
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

export interface LocalContentAngle {
  angle: string;
  hook: string;
  tone: 'celebratory' | 'supportive' | 'promotional' | 'informative';
}

export interface GeneratedLocalContent {
  insight: LocalInsight;
  headline: string;
  content: string;
  callToAction: string;
  hashtags: string[];
  platform: string;
  contentType: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export type LocalMainFilter = 'all' | 'high_relevance' | 'upcoming' | 'this_week';
export type LocalTypeFilter = 'all' | LocalInsightType;

// ============================================================================
// CONSTANTS
// ============================================================================

export const LOCAL_INSIGHT_TYPE_CONFIG: Record<LocalInsightType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  event: {
    label: 'Event',
    icon: '🎪',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  news: {
    label: 'News',
    icon: '📰',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  community: {
    label: 'Community',
    icon: '🏘️',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  school: {
    label: 'School',
    icon: '🏫',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  sports: {
    label: 'Sports',
    icon: '⚽',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  charity: {
    label: 'Charity',
    icon: '💝',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
};

export const LOCAL_URGENCY_CONFIG: Record<LocalInsightUrgency, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  high: {
    label: 'High Priority',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};
