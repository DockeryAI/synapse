// PRD Feature: SYNAPSE-V6
/**
 * V6 Insight Types
 *
 * Clean types for V6 source-based insights.
 * No emotion categories - tabs are INPUT sources, not OUTPUT categories.
 *
 * Per Build Plan Phase 11C: Remove V5 emotion pipeline
 */

// V6 source tabs - where the data comes from
export type V6SourceTab =
  | 'voc'           // Voice of Customer - reviews, testimonials
  | 'community'     // Community - Reddit, forums, discussions
  | 'competitive'   // Competitive - SEMrush, Meta Ads
  | 'trends'        // Industry Trends - news, market shifts
  | 'search'        // Search Intent - keywords, autocomplete
  | 'local_timing'; // Local/Timing - weather, events, seasons

// V6 Insight - simple, source-based
export interface V6Insight {
  id: string;
  sourceTab: V6SourceTab;
  title: string;
  text: string;
  source: {
    name: string;
    platform: string;
    url?: string;
    verified: boolean;
  };
  timestamp: string;
  // For connection engine
  embedding?: number[];
  // Connection discovery results
  connections?: V6Connection[];
}

// Connection between insights (from V1 ConnectionHintGenerator)
export interface V6Connection {
  insightId: string;
  similarity: number;        // Cosine similarity (0-1)
  unexpectedness: number;    // Cross-domain bonus (0-100)
  breakthroughScore: number; // Combined score (0-100)
  connectionType: 'same-domain' | 'adjacent-domain' | 'cross-domain';
}

// Source tab display config (no emotions!)
export interface V6TabConfig {
  id: V6SourceTab;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  bgColor: string;
}

export const V6_TAB_CONFIGS: Record<V6SourceTab, V6TabConfig> = {
  voc: {
    id: 'voc',
    label: 'Voice of Customer',
    description: 'Direct customer language from reviews & testimonials',
    icon: 'Heart',
    color: 'text-red-400',
    bgColor: 'bg-red-950/80',
  },
  community: {
    id: 'community',
    label: 'Community',
    description: 'Organic conversations from Reddit, forums, social',
    icon: 'Users',
    color: 'text-green-400',
    bgColor: 'bg-green-950/80',
  },
  competitive: {
    id: 'competitive',
    label: 'Competitive',
    description: 'Competitor positioning and gaps',
    icon: 'Target',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/80',
  },
  trends: {
    id: 'trends',
    label: 'Industry Trends',
    description: 'Emerging patterns and market shifts',
    icon: 'TrendingUp',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/80',
  },
  search: {
    id: 'search',
    label: 'Search Intent',
    description: 'What prospects are searching for',
    icon: 'Search',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/80',
  },
  local_timing: {
    id: 'local_timing',
    label: 'Local/Timing',
    description: 'Weather, events, seasonal signals',
    icon: 'MapPin',
    color: 'text-sky-400',
    bgColor: 'bg-sky-950/80',
  },
};

// Convert adapter output to V6Insight
export function toV6Insight(insight: any): V6Insight {
  const title = insight.title || insight.text?.substring(0, 60) + '...';
  return {
    id: insight.id,
    sourceTab: insight.sourceTab || 'voc',
    title,
    text: insight.text || '',
    source: {
      name: typeof insight.source === 'object' ? insight.source?.name : insight.source || 'Unknown',
      platform: extractPlatform(insight.source, title),
      url: typeof insight.source === 'object' ? insight.source?.url : insight.sourceUrl,
      verified: typeof insight.source === 'object' ? insight.source?.verified : false,
    },
    timestamp: insight.timestamp || new Date().toISOString(),
  };
}

function extractPlatform(source: any, title?: string): string {
  // Check source object for URL first (most reliable)
  const sourceUrl = typeof source === 'object' ? source?.url || '' : '';
  const sourceName = typeof source === 'object' ? source?.name || '' : source || '';
  const combined = `${sourceUrl} ${sourceName} ${title || ''}`.toLowerCase();

  // Check URL patterns first (most accurate)
  if (combined.includes('reddit.com') || combined.includes('r/')) return 'Reddit';
  if (combined.includes('g2.com')) return 'G2';
  if (combined.includes('capterra.com')) return 'Capterra';
  if (combined.includes('yelp.com')) return 'Yelp';
  if (combined.includes('twitter.com') || combined.includes('x.com')) return 'Twitter';
  if (combined.includes('linkedin.com')) return 'LinkedIn';
  if (combined.includes('news.ycombinator.com')) return 'HackerNews';
  if (combined.includes('youtube.com')) return 'YouTube';
  if (combined.includes('trustpilot.com')) return 'Trustpilot';
  if (combined.includes('glassdoor.com')) return 'Glassdoor';
  if (combined.includes('quora.com')) return 'Quora';
  if (combined.includes('facebook.com')) return 'Facebook';

  // Generic fallbacks
  if (combined.includes('google')) return 'Google';
  if (combined.includes('serper')) return 'Web';
  if (combined.includes('weather')) return 'Weather';
  if (combined.includes('news')) return 'News';

  return 'Web';
}
