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

  for (const result of tabData.results) {
    if (!result.success || !result.data) continue;

    const adapted = adaptApiResult(result, tabData.tab);
    if (adapted) {
      insights.push(...adapted);
    }
  }

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
 * Adapt Voice of Customer data to Trigger insights
 */
function adaptVoCData(data: unknown, apiName: string): TriggerInsight[] {
  if (!data || typeof data !== 'object') return [];

  const insights: TriggerInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).items || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `voc-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: String(record.title || record.headline || 'Customer Insight'),
      content: String(record.content || record.text || record.review || ''),
      category: mapToTriggerCategory(record.sentiment as string || 'neutral'),
      source: {
        name: String(record.source || record.platform || apiName),
        url: String(record.url || record.link || ''),
        verified: Boolean(record.verified),
      },
      metrics: {
        views: Number(record.views || record.impressions || 0),
        engagement: Number(record.engagement || record.reactions || 0),
        recency: parseRecency(record.date as string || record.timestamp as string),
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
  if (!data || typeof data !== 'object') return [];

  const insights: ProofInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).posts || (data as Record<string, unknown>).discussions || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `community-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'proof',
      title: String(record.title || record.headline || 'Community Discussion'),
      content: String(record.content || record.text || record.body || ''),
      proofType: mapToProofType(record.type as string || 'discussion'),
      source: {
        name: String(record.subreddit || record.community || record.platform || apiName),
        url: String(record.url || record.link || record.permalink || ''),
        verified: Boolean(record.verified),
      },
      metrics: {
        upvotes: Number(record.upvotes || record.score || record.likes || 0),
        comments: Number(record.comments || record.replies || 0),
        recency: parseRecency(record.date as string || record.created as string),
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
  if (!data || typeof data !== 'object') return [];

  const insights: CompetitionInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).competitors || (data as Record<string, unknown>).results || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `competitive-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'competition',
      title: String(record.competitor || record.name || record.domain || 'Competitor'),
      content: String(record.insight || record.gap || record.opportunity || ''),
      competitorName: String(record.competitor || record.name || ''),
      gap: String(record.gap || record.weakness || ''),
      opportunity: String(record.opportunity || record.differentiator || ''),
      source: {
        name: String(record.source || apiName),
        url: String(record.url || ''),
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
  if (!data || typeof data !== 'object') return [];

  const insights: TrendInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).articles || (data as Record<string, unknown>).trends || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `trends-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trend',
      title: String(record.title || record.headline || 'Industry Trend'),
      content: String(record.description || record.summary || record.content || ''),
      trendType: mapToTrendType(record.category as string || 'industry'),
      momentum: mapToMomentum(record.growth as number || record.momentum as number),
      source: {
        name: String(record.source || record.publication || apiName),
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
  if (!data || typeof data !== 'object') return [];

  const insights: TriggerInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).results || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `search-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: String(record.query || record.keyword || 'Search Intent'),
      content: String(record.intent || record.description || ''),
      category: 'motivation',
      source: {
        name: apiName,
        url: '',
        verified: true,
      },
      metrics: {
        views: Number(record.volume || record.searches || 0),
        engagement: 0,
        recency: 'recent',
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
  if (!data || typeof data !== 'object') return [];

  const insights: LocalInsight[] = [];
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>).events || (data as Record<string, unknown>).signals || [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    insights.push({
      id: `local-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'local',
      title: String(record.title || record.event || record.name || 'Local Signal'),
      content: String(record.description || record.details || ''),
      location: String(record.location || record.city || record.area || ''),
      timing: String(record.date || record.timing || record.when || ''),
      localType: mapToLocalType(record.type as string || 'event'),
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
