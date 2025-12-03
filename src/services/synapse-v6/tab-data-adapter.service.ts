// PRD Feature: SYNAPSE-V6
/**
 * Tab Data Adapter Service
 *
 * Transforms V6 API results into the format expected by existing UI components.
 * Maintains backward compatibility while enabling the new data layer.
 *
 * Converts:
 * - V6 ApiResult[] -> Legacy Insight[] format
 * - V6 tab names -> Legacy tab names
 * - Raw API data -> Structured insight objects
 */

import type { TabData, ApiResult } from './api-orchestrator.service';
import type { InsightTab } from './brand-profile.service';
import type { Insight, TriggerInsight, ProofInsight, TrendInsight, CompetitionInsight, LocalInsight } from '@/components/v5/InsightCards';

/**
 * Convert V6 tab data to legacy Insight format
 */
export function adaptTabToInsights(tabData: TabData): Insight[] {
  const insights: Insight[] = [];

  console.log(`[TabDataAdapter] Processing ${tabData.tab} with ${tabData.results.length} results`);

  for (const result of tabData.results) {
    if (!result.success) {
      console.log(`[TabDataAdapter] Skipping failed result: ${result.apiName}`);
      continue;
    }
    if (!result.data) {
      console.log(`[TabDataAdapter] Skipping empty data: ${result.apiName}`);
      continue;
    }

    console.log(`[TabDataAdapter] Adapting ${result.apiName} data:`, JSON.stringify(result.data).substring(0, 200));

    const adapted = adaptApiResult(result, tabData.tab);
    if (adapted && adapted.length > 0) {
      console.log(`[TabDataAdapter] ${result.apiName} produced ${adapted.length} insights`);
      insights.push(...adapted);
    } else {
      console.log(`[TabDataAdapter] ${result.apiName} produced no insights`);
    }
  }

  console.log(`[TabDataAdapter] Total insights for ${tabData.tab}: ${insights.length}`);
  return insights;
}

/**
 * Adapt a single API result to Insight format
 */
function adaptApiResult(result: ApiResult, tab: InsightTab): Insight[] | null {
  const { apiName, data } = result;

  switch (tab) {
    case 'voc':
      return adaptVoCData(data, apiName);
    case 'community':
      return adaptCommunityData(data, apiName);
    case 'competitive':
      return adaptCompetitiveData(data, apiName);
    case 'trends':
      return adaptTrendsData(data, apiName);
    case 'search':
      return adaptSearchData(data, apiName);
    case 'local_timing':
      return adaptLocalTimingData(data, apiName);
    default:
      return null;
  }
}

/**
 * Extract items from nested API response data
 * Handles various response formats: { success, data: [...] }, { results: [...] }, direct array, etc.
 */
function extractItems(data: unknown): unknown[] {
  if (!data || typeof data !== 'object') return [];

  // Direct array
  if (Array.isArray(data)) return data;

  const obj = data as Record<string, unknown>;

  // Nested response formats
  if (obj.success && obj.data) {
    return extractItems(obj.data);
  }

  // Common array field names
  const arrayFields = ['items', 'results', 'reviews', 'posts', 'articles', 'organic', 'searchResults', 'news', 'discussions', 'data', 'suggestions', 'queries', 'relatedSearches'];
  for (const field of arrayFields) {
    if (Array.isArray(obj[field])) {
      return obj[field] as unknown[];
    }
  }

  // Serper-specific formats
  if (obj.organic && Array.isArray(obj.organic)) return obj.organic as unknown[];
  if (obj.news && Array.isArray(obj.news)) return obj.news as unknown[];
  if (obj.places && Array.isArray(obj.places)) return obj.places as unknown[];

  // Weather-specific - single object response, wrap it
  if (obj.location || obj.weather || obj.temperature || obj.current) {
    return [obj];
  }

  // Filter out "no results" responses
  if (obj.noResults === true || obj.noResults === 'true') {
    return [];
  }

  // If object has meaningful content fields, treat as single item
  if (obj.title || obj.name || obj.description || obj.text) {
    return [obj];
  }

  return [];
}

/**
 * Adapt Voice of Customer data to Trigger insights
 */
function adaptVoCData(data: unknown, apiName: string): TriggerInsight[] {
  const items = extractItems(data);
  console.log(`[adaptVoCData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: TriggerInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    // Extract meaningful content
    const title = String(record.title || record.headline || record.name || record.query || 'Customer Insight');
    const content = String(record.content || record.text || record.review || record.snippet || record.description || record.body || '');

    // Skip items with no meaningful content
    if (!content && !title) continue;

    insights.push({
      id: `voc-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'voc',
      source: {
        name: String(record.source || record.platform || record.site || apiName),
        url: String(record.url || record.link || ''),
        verified: Boolean(record.verified),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Adapt Community data to Proof insights
 */
function adaptCommunityData(data: unknown, apiName: string): ProofInsight[] {
  const items = extractItems(data);
  console.log(`[adaptCommunityData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: ProofInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    const title = String(record.title || record.headline || record.name || 'Community Discussion');
    const content = String(record.content || record.text || record.body || record.snippet || record.description || '');

    if (!content && !title) continue;

    insights.push({
      id: `community-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'proof',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'community',
      source: {
        name: String(record.subreddit || record.community || record.platform || record.source || apiName),
        url: String(record.url || record.link || record.permalink || ''),
        verified: Boolean(record.verified),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Adapt Competitive data to Competition insights
 */
function adaptCompetitiveData(data: unknown, apiName: string): CompetitionInsight[] {
  const items = extractItems(data);
  console.log(`[adaptCompetitiveData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: CompetitionInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    const title = String(record.competitor || record.name || record.domain || record.title || 'Competitor');
    const content = String(record.insight || record.gap || record.opportunity || record.description || record.snippet || '');

    insights.push({
      id: `competitive-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'competitor',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'competitive',
      competitorName: String(record.competitor || record.name || record.domain || ''),
      source: {
        name: String(record.source || apiName),
        url: String(record.url || record.link || ''),
        verified: true,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Adapt Trends data to Trend insights
 */
function adaptTrendsData(data: unknown, apiName: string): TrendInsight[] {
  const items = extractItems(data);
  console.log(`[adaptTrendsData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: TrendInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    const title = String(record.title || record.headline || record.name || 'Industry Trend');
    const content = String(record.description || record.summary || record.content || record.snippet || record.text || '');

    if (!content && !title) continue;

    insights.push({
      id: `trends-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trend',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'trends',
      source: {
        name: String(record.source || record.publication || record.author || apiName),
        url: String(record.url || record.link || ''),
        verified: Boolean(record.verified),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Adapt Search data (for now, treat as general insights)
 */
function adaptSearchData(data: unknown, apiName: string): Insight[] {
  const items = extractItems(data);
  console.log(`[adaptSearchData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: TriggerInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    const title = String(record.query || record.keyword || record.title || record.name || 'Search Intent');
    const content = String(record.intent || record.description || record.snippet || record.text || '');

    insights.push({
      id: `search-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'search',
      source: {
        name: apiName,
        url: String(record.url || record.link || ''),
        verified: true,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Adapt Local/Timing data to Local insights
 */
function adaptLocalTimingData(data: unknown, apiName: string): LocalInsight[] {
  const items = extractItems(data);
  console.log(`[adaptLocalTimingData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: LocalInsight[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    // Handle weather data specially
    if (apiName === 'openweather' || record.weather || record.temperature) {
      const weatherDesc = record.weather
        ? (Array.isArray(record.weather) ? (record.weather[0] as Record<string, unknown>)?.description : record.weather)
        : record.description;

      insights.push({
        id: `local-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'local',
        title: `Weather: ${String(weatherDesc || 'Current conditions')}`,
        text: `Temperature: ${record.temperature || (record.main as Record<string, unknown>)?.temp || 'N/A'}. ${String(record.description || '')}`,
        sourceTab: 'local_timing',
        location: String(record.location || record.name || record.city || ''),
        source: {
          name: 'OpenWeather',
          url: '',
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const title = String(record.title || record.event || record.name || 'Local Signal');
    const content = String(record.description || record.details || record.snippet || record.text || '');

    insights.push({
      id: `local-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'local',
      title: title.substring(0, 200),
      text: content.substring(0, 500),
      sourceTab: 'local_timing',
      location: String(record.location || record.city || record.area || record.address || ''),
      source: {
        name: String(record.source || apiName),
        url: String(record.url || record.link || ''),
        verified: Boolean(record.verified),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToTriggerCategory(sentiment: string): 'fear' | 'desire' | 'pain-point' | 'objection' | 'motivation' | 'trust' | 'urgency' {
  const lowerSentiment = sentiment.toLowerCase();
  if (lowerSentiment.includes('fear') || lowerSentiment.includes('negative')) return 'fear';
  if (lowerSentiment.includes('desire') || lowerSentiment.includes('want')) return 'desire';
  if (lowerSentiment.includes('pain') || lowerSentiment.includes('problem')) return 'pain-point';
  if (lowerSentiment.includes('objection') || lowerSentiment.includes('but')) return 'objection';
  if (lowerSentiment.includes('trust') || lowerSentiment.includes('reliable')) return 'trust';
  if (lowerSentiment.includes('urgent') || lowerSentiment.includes('now')) return 'urgency';
  return 'motivation';
}

function mapToProofType(type: string): 'testimonial' | 'statistic' | 'case-study' | 'award' | 'certification' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('testimonial') || lowerType.includes('review')) return 'testimonial';
  if (lowerType.includes('stat') || lowerType.includes('metric')) return 'statistic';
  if (lowerType.includes('case') || lowerType.includes('study')) return 'case-study';
  if (lowerType.includes('award') || lowerType.includes('recognition')) return 'award';
  if (lowerType.includes('cert') || lowerType.includes('accredit')) return 'certification';
  return 'testimonial';
}

function mapToTrendType(category: string): 'industry' | 'technology' | 'consumer' | 'regulatory' {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('tech') || lowerCategory.includes('digital')) return 'technology';
  if (lowerCategory.includes('consumer') || lowerCategory.includes('customer')) return 'consumer';
  if (lowerCategory.includes('regul') || lowerCategory.includes('compliance')) return 'regulatory';
  return 'industry';
}

function mapToMomentum(growth: number): 'rising' | 'stable' | 'declining' {
  if (growth > 10) return 'rising';
  if (growth < -5) return 'declining';
  return 'stable';
}

function mapToLocalType(type: string): 'event' | 'news' | 'weather' | 'seasonal' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('event') || lowerType.includes('conference')) return 'event';
  if (lowerType.includes('news') || lowerType.includes('announcement')) return 'news';
  if (lowerType.includes('weather') || lowerType.includes('climate')) return 'weather';
  return 'seasonal';
}

function parseRecency(dateStr: string): 'recent' | 'moderate' | 'old' {
  if (!dateStr) return 'moderate';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 7) return 'recent';
    if (daysDiff < 30) return 'moderate';
    return 'old';
  } catch {
    return 'moderate';
  }
}

// Export adapter functions
export const tabDataAdapter = {
  adaptTabToInsights,
  adaptApiResult,
};
