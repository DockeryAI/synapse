/**
 * HackerNews API Service
 *
 * Phase 8: Deep Mining - Free API for tech/B2B trend discovery
 * Uses the Algolia-powered HN Search API: https://hn.algolia.com/api
 *
 * Created: 2025-11-30
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HNSearchResult {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text?: string;
  _tags: string[];
}

export interface HNSearchResponse {
  hits: HNSearchResult[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

export interface HNTrendInsight {
  id: string;
  title: string;
  description: string;
  url?: string;
  author: string;
  points: number;
  comments: number;
  date: string;
  engagementScore: number; // Calculated from points + comments
  source: 'hackernews';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const HN_API_BASE = 'https://hn.algolia.com/api/v1';

/**
 * Search HackerNews for stories matching a query
 */
export async function searchHackerNews(
  query: string,
  options: {
    tags?: 'story' | 'comment' | 'poll' | 'show_hn' | 'ask_hn';
    numericFilters?: string; // e.g., "points>10,num_comments>5"
    hitsPerPage?: number;
    page?: number;
  } = {}
): Promise<HNTrendInsight[]> {
  const {
    tags = 'story',
    numericFilters = 'points>5',
    hitsPerPage = 20,
    page = 0
  } = options;

  try {
    const params = new URLSearchParams({
      query,
      tags,
      numericFilters,
      hitsPerPage: hitsPerPage.toString(),
      page: page.toString()
    });

    const response = await fetch(`${HN_API_BASE}/search?${params}`);

    if (!response.ok) {
      console.warn('[HackerNews] API error:', response.status);
      return [];
    }

    const data: HNSearchResponse = await response.json();

    console.log(`[HackerNews] Found ${data.nbHits} total results, returning ${data.hits.length}`);

    return data.hits.map(hit => ({
      id: `hn-${hit.objectID}`,
      title: hit.title || 'HN Discussion',
      description: hit.story_text?.substring(0, 300) || `Discussion with ${hit.num_comments} comments and ${hit.points} points`,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author,
      points: hit.points,
      comments: hit.num_comments,
      date: hit.created_at,
      engagementScore: calculateEngagementScore(hit.points, hit.num_comments),
      source: 'hackernews'
    }));

  } catch (err) {
    console.error('[HackerNews] Search failed:', err);
    return [];
  }
}

/**
 * Search HN for recent stories (last 7 days)
 */
export async function searchRecentHN(
  query: string,
  daysBack: number = 7
): Promise<HNTrendInsight[]> {
  const timestamp = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

  try {
    const params = new URLSearchParams({
      query,
      tags: 'story',
      numericFilters: `created_at_i>${timestamp},points>3`,
      hitsPerPage: '20'
    });

    const response = await fetch(`${HN_API_BASE}/search_by_date?${params}`);

    if (!response.ok) {
      console.warn('[HackerNews] Recent search error:', response.status);
      return [];
    }

    const data: HNSearchResponse = await response.json();

    console.log(`[HackerNews] Found ${data.hits.length} recent stories for "${query}"`);

    return data.hits.map(hit => ({
      id: `hn-recent-${hit.objectID}`,
      title: hit.title || 'HN Discussion',
      description: hit.story_text?.substring(0, 300) || `Recent discussion with ${hit.num_comments} comments`,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author,
      points: hit.points,
      comments: hit.num_comments,
      date: hit.created_at,
      engagementScore: calculateEngagementScore(hit.points, hit.num_comments),
      source: 'hackernews'
    }));

  } catch (err) {
    console.error('[HackerNews] Recent search failed:', err);
    return [];
  }
}

/**
 * Get front page stories (trending now)
 */
export async function getFrontPageStories(): Promise<HNTrendInsight[]> {
  try {
    const response = await fetch(`${HN_API_BASE}/search?tags=front_page&hitsPerPage=30`);

    if (!response.ok) {
      console.warn('[HackerNews] Front page error:', response.status);
      return [];
    }

    const data: HNSearchResponse = await response.json();

    console.log(`[HackerNews] Fetched ${data.hits.length} front page stories`);

    return data.hits.map(hit => ({
      id: `hn-fp-${hit.objectID}`,
      title: hit.title || 'HN Story',
      description: `Trending on HN: ${hit.points} points, ${hit.num_comments} comments`,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author,
      points: hit.points,
      comments: hit.num_comments,
      date: hit.created_at,
      engagementScore: calculateEngagementScore(hit.points, hit.num_comments),
      source: 'hackernews'
    }));

  } catch (err) {
    console.error('[HackerNews] Front page fetch failed:', err);
    return [];
  }
}

/**
 * Search multiple topics and aggregate results
 */
export async function searchMultipleTopics(
  topics: string[],
  options: { hitsPerTopic?: number; minPoints?: number } = {}
): Promise<HNTrendInsight[]> {
  const { hitsPerTopic = 10, minPoints = 5 } = options;

  const results: HNTrendInsight[] = [];
  const seenIds = new Set<string>();

  // Run searches in parallel
  const searches = topics.map(topic =>
    searchHackerNews(topic, {
      numericFilters: `points>${minPoints}`,
      hitsPerPage: hitsPerTopic
    })
  );

  const allResults = await Promise.allSettled(searches);

  allResults.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      result.value.forEach(insight => {
        if (!seenIds.has(insight.id)) {
          seenIds.add(insight.id);
          results.push(insight);
        }
      });
    } else {
      console.warn(`[HackerNews] Topic "${topics[idx]}" search failed:`, result.reason);
    }
  });

  // Sort by engagement score
  results.sort((a, b) => b.engagementScore - a.engagementScore);

  console.log(`[HackerNews] Multi-topic search: ${results.length} unique results from ${topics.length} topics`);

  return results;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate engagement score from points and comments
 * HN engagement formula: points + (comments * 2) - gives weight to discussion
 */
function calculateEngagementScore(points: number, comments: number): number {
  return points + (comments * 2);
}

/**
 * Filter insights by minimum engagement threshold
 */
export function filterByEngagement(
  insights: HNTrendInsight[],
  minScore: number = 20
): HNTrendInsight[] {
  return insights.filter(i => i.engagementScore >= minScore);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const HackerNewsAPI = {
  search: searchHackerNews,
  searchRecent: searchRecentHN,
  getFrontPage: getFrontPageStories,
  searchMultiple: searchMultipleTopics,
  filterByEngagement
};

export default HackerNewsAPI;
