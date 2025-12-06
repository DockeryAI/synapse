// PRD Feature: SYNAPSE-V6
/**
 * Tab Data Adapter Service
 *
 * Transforms V6 API results into the format expected by UI components.
 *
 * V6 REDESIGN:
 * - Extracts ACTUAL customer quotes from Reddit/Twitter/Reviews
 * - Creates theme clusters for similar quotes across sources
 * - Outputs V6Insight format with explicit quote/executiveSummary/uvpAlignment fields
 *
 * Converts:
 * - V6 ApiResult[] -> V6Insight[] format
 * - Raw API data -> Structured insight objects with quotes
 */

import type { TabData, ApiResult } from './api-orchestrator.service';
import type { InsightTab } from './brand-profile.service';
import type { Insight, TriggerInsight, ProofInsight, TrendInsight, CompetitorInsight, LocalInsight } from '@/components/v5/InsightCards';
import type { V6Insight } from './v6-insight-types';

/**
 * V6 VOC FIX: Source weighting - prioritize real customer reviews over articles
 * Equal distribution goal: Each source type gets ~equal representation
 * Reviews > Tech Communities > Social > AI-extracted > Generic search
 */
function getSourceWeight(apiName: string): number {
  const weights: Record<string, number> = {
    // Review platforms - highest priority (actual customer quotes)
    'apify-g2': 100,
    'apify-capterra': 100,
    'apify-trustradius': 100,
    'apify-trustpilot': 95,
    'apify-yelp': 95,
    'apify-amazon': 90,
    'google-maps': 90,
    'outscraper': 85,
    // V6 Phase 17: SEC-API.io exec strategy quotes - very high priority
    'sec-api-io': 95,           // V6 VOC: Verified exec quotes from SEC filings
    // Tech community discussions - high priority (developer opinions)
    'hackernews-comments': 90,  // V6 VOC: Actual HN comment quotes
    'hackernews': 80,           // HN stories (less direct)
    'producthunt': 85,          // V6 VOC: Startup community feedback
    'indiehackers': 85,         // V6 VOC: Founder/builder discussions
    // Professional subreddits - targeted discussions
    'reddit-professional': 80,
    // REMOVED: 'perplexity-reviews' - generates hallucinated quotes with fake sources
    // Twitter/social exec voices - high priority
    'apify-twitter': 75,
    'apify-linkedin': 75,
    // Generic Reddit (can have noise)
    'reddit': 50,
    // Articles/research - lower priority for VoC
    'perplexity': 40,
    'newsapi': 30,
    'serper': 25,
    // Default for unknown sources
  };
  return weights[apiName] ?? 20;
}

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
      // V6 VOC FIX: Add source weight to each insight for sorting
      const weight = getSourceWeight(result.apiName);
      adapted.forEach((insight) => {
        (insight as Insight & { _sourceWeight?: number })._sourceWeight = weight;
      });
      console.log(`[TabDataAdapter] ${result.apiName} produced ${adapted.length} insights (weight: ${weight})`);
      insights.push(...adapted);
    } else {
      console.log(`[TabDataAdapter] ${result.apiName} produced no insights`);
    }
  }

  // V6 VOC FIX: Sort by source weight (reviews first, articles last)
  insights.sort((a, b) => {
    const weightA = (a as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
    const weightB = (b as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
    return weightB - weightA;
  });

  console.log(`[TabDataAdapter] Total insights for ${tabData.tab}: ${insights.length} (sorted by source weight)`);

  // V6 REDESIGN: Apply theme clustering for VoC insights
  if (tabData.tab === 'voc' && insights.length > 3) {
    return clusterByTheme(insights);
  }

  return insights;
}

/**
 * V6 REDESIGN Phase 17: Semantic clustering using keyword extraction + Jaccard similarity
 * Groups semantically similar quotes across sources (not just exact title match)
 *
 * Algorithm:
 * 1. Extract keywords from each insight's quote/text
 * 2. Calculate Jaccard similarity between keyword sets
 * 3. Cluster insights with similarity > threshold
 * 4. Generate cross-source theme titles
 */
function clusterByTheme(insights: Insight[]): Insight[] {
  if (insights.length === 0) return [];

  // Stop words for keyword extraction
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'and', 'but', 'or', 'if', 'because', 'while',
    'although', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'can', 'get', 'like', 'know', 'think', 'want', 'need',
    'going', 'really', 'also', 'even', 'still', 'much', 'many', 'make', 'made', 'way',
    'been', 'being', 'said', 'says', 'one', 'two', 'first', 'new', 'now', 'come', 'came',
    'use', 'used', 'using', 'work', 'time', 'year', 'years', 'day', 'days', 'people',
    'thing', 'things', 'something', 'anything', 'everything', 'nothing', 'someone',
  ]);

  // Extract keywords from text
  const extractKeywords = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    return new Set(words);
  };

  // Calculate Jaccard similarity between two keyword sets
  const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
    if (a.size === 0 || b.size === 0) return 0;
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  };

  // Extract keywords for each insight
  const insightKeywords = insights.map(insight => {
    const text = (insight as Insight & { quote?: string }).quote || insight.text || '';
    return extractKeywords(text);
  });

  // Clustering via greedy assignment (O(n²) but fine for <100 insights)
  const SIMILARITY_THRESHOLD = 0.15; // Lower threshold for broader clustering
  const clusters: Insight[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < insights.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: Insight[] = [insights[i]];
    assigned.add(i);

    // Find all similar insights
    for (let j = i + 1; j < insights.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = jaccardSimilarity(insightKeywords[i], insightKeywords[j]);
      if (similarity >= SIMILARITY_THRESHOLD) {
        cluster.push(insights[j]);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Generate clustered insights with cross-source theme titles
  const clusteredInsights: Insight[] = [];

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      clusteredInsights.push(cluster[0]);
      continue;
    }

    // Sort by source weight
    const sorted = [...cluster].sort((a, b) => {
      const weightA = (a as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
      const weightB = (b as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
      return weightB - weightA;
    });

    const primary = sorted[0];
    const related = sorted.slice(1, 4); // Max 3 related quotes

    // Generate theme from common keywords across cluster
    const allKeywords: Record<string, number> = {};
    for (const insight of cluster) {
      const text = (insight as Insight & { quote?: string }).quote || insight.text || '';
      const keywords = extractKeywords(text);
      keywords.forEach(kw => {
        allKeywords[kw] = (allKeywords[kw] || 0) + 1;
      });
    }

    // Get keywords that appear in 2+ quotes (cross-source validation)
    const commonKeywords = Object.entries(allKeywords)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    // Generate theme title
    let themeTitle: string;
    if (commonKeywords.length > 0) {
      themeTitle = commonKeywords.join(' & ');
    } else {
      // Fallback to primary's title
      themeTitle = primary.title;
    }

    // Get unique platforms for source count
    const platforms = new Set(cluster.map(c => {
      const sourceObj = typeof c.source === 'object' && c.source !== null
        ? (c.source as { platform?: string })
        : null;
      return sourceObj?.platform || 'Web';
    }));

    // Generate cross-source validated executive summary
    const platformList = [...platforms].slice(0, 3).join(', ');
    const crossSourceSummary = `Cross-source validated pattern: "${themeTitle}" mentioned across ${cluster.length} quotes from ${platformList}${platforms.size > 3 ? ' and more' : ''}. High-confidence insight for content strategy.`;

    const clustered = {
      ...primary,
      title: `${themeTitle} (${platforms.size} sources)`,
      executiveSummary: crossSourceSummary, // Override with cross-source summary
      relatedQuotes: related.map(r => {
        const sourceObj = typeof r.source === 'object' && r.source !== null
          ? (r.source as { name?: string; url?: string; verified?: boolean; platform?: string })
          : { name: String(r.source || 'Unknown') };
        return {
          quote: (r as Insight & { quote?: string }).quote || r.text.replace(/^"|"$/g, '').substring(0, 150),
          source: sourceObj.name || 'Unknown',
          platform: sourceObj.platform || 'Web',
          url: sourceObj.url,
        };
      }),
    };

    clusteredInsights.push(clustered);
  }

  // Sort by cluster size (more sources = more important) then by weight
  clusteredInsights.sort((a, b) => {
    const sizeA = (a as Insight & { relatedQuotes?: unknown[] }).relatedQuotes?.length ?? 0;
    const sizeB = (b as Insight & { relatedQuotes?: unknown[] }).relatedQuotes?.length ?? 0;
    if (sizeB !== sizeA) return sizeB - sizeA;

    const weightA = (a as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
    const weightB = (b as Insight & { _sourceWeight?: number })._sourceWeight ?? 0;
    return weightB - weightA;
  });

  console.log(`[clusterByTheme] Semantic clustering: ${insights.length} insights → ${clusteredInsights.length} clusters (threshold: ${SIMILARITY_THRESHOLD})`);
  return clusteredInsights;
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
 * V6 VOC FIX 2.0: Comprehensive quote validation ported from V5
 *
 * Three-tier validation:
 * 1. REAL_QUOTE_PATTERNS - fast accept for obvious customer quotes
 * 2. NOT_QUOTE_PATTERNS - fast reject for garbage/meta-content
 * 3. META_REVIEW_PATTERNS - reject reviews ABOUT review platforms (new)
 */

// Patterns that DEFINITELY indicate a real customer quote (fast accept)
const REAL_QUOTE_PATTERNS = [
  // First-person switching/migration statements
  /^["']?(We|I|Our team|My company|My team) (switched|moved|migrated|left|cancelled|dropped)/i,
  /^["']?(We|I|Our team) (were|was|are|am) (frustrated|disappointed|surprised|shocked)/i,
  /^["']?(After|Since|When we|Once we) (using|implementing|buying|adopting|deploying)/i,
  // First-person frustration
  /^["']?(I'm|We're|I am|We are) (so )?(frustrated|tired|fed up|done|sick)/i,
  /^["']?(I|We) (hate|hated|can't stand|couldn't stand)/i,
  /^["']?(I|We) (wasted|spent|lost) (\d+|several|many|too many)/i,
  // First-person evaluation
  /^["']?(We're|I'm|We are|I am) (evaluating|comparing|looking at|considering)/i,
  /^["']?(Has anyone|Does anyone) (switched|migrated|moved|tried)/i,
  // Specific outcome statements
  /^["']?(After \d+ (months?|weeks?|years?))/i,
  /^["']?(It took us|We spent) \d+/i,
  // Direct experience markers
  /^["']?In my experience/i,
  /^["']?From my (perspective|experience|point of view)/i,
  /^["']?As (a|an) (user|customer|admin|developer|manager)/i,
];

// Patterns that DEFINITELY indicate NOT a quote (fast reject)
const NOT_QUOTE_PATTERNS = [
  // SEO template patterns
  /^explore\s+.*('s|s)\s+(top\s+)?pros/i,
  /^explore\s+.*features/i,
  /^explore\s/i,
  /^discover\s/i,
  /^learn\s(more|about)\s/i,
  /pros,?\s*cons,?\s*(and\s+)?features/i,
  /real\s+reviews?\s+(from|and|with)/i,
  /verified\s+reviews?/i,
  // No-data responses (prompt leakage)
  /^No (customer|significant|direct|relevant|specific) (quotes?|feedback|data)/i,
  /narratives? were (not )?(found|discovered|available)/i,
  /could not (find|locate|identify)/i,
  // Generic statements about customers (not first-person)
  /^(Users?|Customers?|Companies?|Businesses?) (often|typically|generally|commonly)/i,
  /^(Many|Most|Some) (users?|customers?|companies?)/i,
  // Prompt leakage
  /^Generate (a )?JSON/i,
  /^I cannot fulfill/i,
  /^As an AI/i,
  /^Based on (the|my) (search|analysis)/i,
  // Marketing speak
  /^(Innovative|Revolutionary|Cutting-edge|Industry-leading)/i,
  /^(This|Our|The) (platform|solution|product) (provides|offers|delivers)/i,
  // Review platform page titles
  /^(top|best)\s\d+/i,
  /^read\s\d+\sreviews?/i,
  /\|\s*(g2|capterra|trustpilot|trustradius)/i,
];

// V6 VOC FIX 2.0: NEW - Patterns for reviews ABOUT review platforms themselves
// These are the main source of garbage in current VoC
const META_REVIEW_PATTERNS = [
  // Reviews about G2/Capterra/TrustRadius as products
  /\b(g2|g2\.com|capterra|trustradius|trustpilot|gartner peer insights)\b.*\b(interface|platform|website|service|helpful|easy to use|intuitive)\b/i,
  /\b(interface|platform|website|service)\b.*\b(g2|capterra|trustradius|trustpilot)\b/i,
  // Explicit meta-review language
  /review (platform|site|website) (is|was|has)/i,
  /\b(g2|capterra|trustradius)\b.*(offers?|provides?|has) (detailed|reliable|comprehensive)/i,
  // Comparing review platforms to each other
  /switched from (g2|capterra|trustradius) to/i,
  /(g2|capterra|trustradius) (vs|versus|compared to|or) (g2|capterra|trustradius)/i,
  // Review platform features
  /\b(review verification|verified reviews|incentivize reviews|fake reviews)\b/i,
  // Explicit mentions of reviewing the reviewer
  /review (of|about) (g2|capterra|trustradius|trustpilot)/i,
];

/**
 * V6 VOC FIX 2.0: Three-tier quote validation
 * V6 Phase 17: Added source parameter to allow platform-specific rules
 */
function isLikelyQuote(text: string, source?: string): boolean {
  const normalized = text.trim();

  // Too short = not a real quote
  if (normalized.length < 25) {
    return false;
  }

  // V6 Phase 17: ProductHunt descriptions often use marketing language but still valuable
  // Be more lenient with PH content - focus on rejecting only obvious garbage
  if (source === 'producthunt' || source === 'ProductHunt') {
    // Only reject if it's clearly SEO/template garbage
    if (/^(explore|discover|learn more|read \d+ reviews)/i.test(normalized)) {
      return false;
    }
    // Accept most ProductHunt content
    return normalized.length >= 30;
  }

  // Tier 1: Fast accept for obvious real quotes
  if (REAL_QUOTE_PATTERNS.some(p => p.test(normalized))) {
    return true;
  }

  // Tier 2: Fast reject for obvious garbage
  if (NOT_QUOTE_PATTERNS.some(p => p.test(normalized))) {
    console.log(`[isLikelyQuote] REJECTED (garbage): "${text.substring(0, 60)}..."`);
    return false;
  }

  // Tier 3: Reject meta-reviews about review platforms
  if (META_REVIEW_PATTERNS.some(p => p.test(normalized))) {
    console.log(`[isLikelyQuote] REJECTED (meta-review): "${text.substring(0, 60)}..."`);
    return false;
  }

  // Heuristic scoring for borderline cases
  let score = 0.5;

  // Positive signals
  if (/["']/.test(normalized.charAt(0))) score += 0.1; // Starts with quote mark
  if (/\b(I|we|our|my)\b/i.test(normalized)) score += 0.15; // First-person
  if (/\b(switched|migrated|frustrated|hate|love|wasted|spent)\b/i.test(normalized)) score += 0.1;
  if (/\d+\s*(hours?|days?|weeks?|months?|years?)/i.test(normalized)) score += 0.1; // Time refs

  // Negative signals
  if (/\b(platform|solution|product)\s+(provides|offers)/i.test(normalized)) score -= 0.25;
  if (/\b(innovative|revolutionary|cutting-edge)\b/i.test(normalized)) score -= 0.3;

  return score >= 0.55;
}

/**
 * Check if content is relevant to business/enterprise topics
 * Filters out random consumer garbage (neighbors, landlords, personal issues)
 */
function isRelevantVoCContent(title: string, content: string): boolean {
  const combined = `${title} ${content}`.toLowerCase();

  // Garbage patterns - definitely NOT business-relevant
  const garbagePatterns = [
    /\b(landlord|tenant|neighbor|neighbour|roommate|apartment)\b/,
    /\b(bass|guitar|music|noise|loud)\b/,
    /\b(police|arrest|crime|murder|killed)\b/,
    /\b(boyfriend|girlfriend|husband|wife|married|dating|relationship)\b/,
    /\b(kids|children|baby|toddler|school|homework)\b/,
    /\b(food|recipe|cooking|restaurant|dinner|lunch)\b/,
    /\b(movie|show|tv|netflix|game|gaming|anime)\b/,
    /\b(pet|dog|cat|animal)\b/,
    /\b(reddit|subreddit|upvote|downvote|karma)\b/,
    /\[removed\]|\[deleted\]/,
  ];

  // Check for garbage
  for (const pattern of garbagePatterns) {
    if (pattern.test(combined)) {
      return false;
    }
  }

  // Business relevance signals (at least one should be present)
  const businessPatterns = [
    /\b(software|saas|platform|tool|solution|product|service)\b/,
    /\b(business|company|enterprise|startup|agency|firm)\b/,
    /\b(customer|client|user|buyer|prospect|lead)\b/,
    /\b(sales|marketing|revenue|growth|roi|conversion)\b/,
    /\b(automation|ai|artificial intelligence|machine learning)\b/,
    /\b(compliance|regulation|audit|security|privacy)\b/,
    /\b(insurance|healthcare|finance|legal|tech|technology)\b/,
    /\b(workflow|process|efficiency|productivity)\b/,
    /\b(review|feedback|testimonial|experience)\b/,
    /\b(problem|challenge|issue|pain point|frustration)\b/,
  ];

  for (const pattern of businessPatterns) {
    if (pattern.test(combined)) {
      return true;
    }
  }

  // If no business signal and content is too short, reject
  if (combined.length < 100) {
    return false;
  }

  // Default: allow if no garbage detected (might be relevant)
  return true;
}

/**
 * V6 VOC FIX Phase 17: Smart title extraction from quote content
 *
 * Instead of generic labels like "TrustRadius Feedback", extract the KEY TOPIC
 * from the quote itself to create informative titles like:
 * - "Integration challenges with legacy systems"
 * - "AI automation reduces support tickets 40%"
 * - "Switching from Zendesk to save costs"
 */
function extractQuoteTheme(content: string, platform: string = 'Unknown'): string {
  const lowerContent = content.toLowerCase();

  // PHASE 17: Extract SPECIFIC topic from quote content
  // Priority 1: Look for explicit outcome/metric statements
  const metricMatch = content.match(/(\d+%?\s*(reduction|increase|improvement|faster|savings|growth|less|more))|((saved?|reduced?|increased?|improved?)\s+\d+)/i);
  if (metricMatch) {
    // Extract surrounding context for the metric
    const idx = content.toLowerCase().indexOf(metricMatch[0].toLowerCase());
    const contextStart = Math.max(0, idx - 30);
    const contextEnd = Math.min(content.length, idx + metricMatch[0].length + 30);
    const context = content.substring(contextStart, contextEnd).trim();
    // Clean up and capitalize
    const cleanContext = context.replace(/^[^a-zA-Z]+/, '').substring(0, 50);
    if (cleanContext.length > 20) {
      return capitalizeFirst(cleanContext) + (cleanContext.length >= 50 ? '...' : '');
    }
  }

  // Priority 2: Switching/migration stories with competitor mention
  const switchMatch = content.match(/(switched|moved?|migrat|left|replaced?)\s+(from|to)\s+([A-Z][a-zA-Z]+)/i);
  if (switchMatch) {
    const action = switchMatch[1].toLowerCase().startsWith('switch') ? 'Switching' :
                   switchMatch[1].toLowerCase().startsWith('mov') ? 'Moving' :
                   switchMatch[1].toLowerCase().startsWith('migrat') ? 'Migrating' :
                   switchMatch[1].toLowerCase().startsWith('left') ? 'Leaving' : 'Replacing';
    return `${action} ${switchMatch[2]} ${switchMatch[3]}`;
  }

  // Priority 3: Feature/capability mentions
  const featurePatterns = [
    { pattern: /\b(integration|integrating|integrates?)\s+with\s+(\w+)/i, template: (m: RegExpMatchArray) => `Integration with ${m[2]}` },
    { pattern: /\b(automation|automat(e|ing|ed))\s+(\w+\s+\w+)/i, template: (m: RegExpMatchArray) => `Automating ${m[3]}` },
    { pattern: /\b(onboarding|implementation|setup)\s+(was|is|took)/i, template: () => 'Onboarding experience' },
    { pattern: /\b(support|customer service)\s+(team|response|was|is)/i, template: () => 'Support experience' },
    { pattern: /\b(reporting|analytics|dashboard|insights)/i, template: () => 'Reporting & analytics' },
    { pattern: /\b(workflow|process)\s+(automation|improvement|optimization)/i, template: (m: RegExpMatchArray) => `Workflow ${m[2]}` },
    { pattern: /\b(API|developer|SDK)\s+(experience|documentation|integration)/i, template: () => 'Developer experience' },
    { pattern: /\b(pricing|cost|expensive|affordable|value)/i, template: () => 'Pricing & value' },
    { pattern: /\b(AI|machine learning|ML)\s+(features?|capabilities?|powered)/i, template: () => 'AI capabilities' },
    { pattern: /\b(compliance|security|SOC|HIPAA|GDPR)/i, template: () => 'Security & compliance' },
  ];

  for (const { pattern, template } of featurePatterns) {
    const match = content.match(pattern);
    if (match) {
      return template(match);
    }
  }

  // Priority 4: Sentiment-based categorization with topic extraction
  if (/\b(frustrat|hate|terrible|awful|worst|annoying|disappointed)\b/i.test(lowerContent)) {
    // Try to extract what they're frustrated about
    const aboutMatch = content.match(/(frustrat|disappoint|annoying?)\w*\s+(with|about|by)\s+(\w+\s*\w*)/i);
    if (aboutMatch) {
      return `Frustration with ${aboutMatch[3].trim()}`;
    }
    return 'Customer pain point';
  }

  if (/\b(wish|missing|lacks?|need|would be nice|if only)\b/i.test(lowerContent)) {
    const wishMatch = content.match(/(wish|need|missing|lacks?)\s+(\w+\s*\w*\s*\w*)/i);
    if (wishMatch) {
      return `Request: ${wishMatch[2].trim()}`;
    }
    return 'Feature request';
  }

  if (/\b(love|amazing|excellent|fantastic|game.?changer)\b/i.test(lowerContent)) {
    const loveMatch = content.match(/(love|amazing|excellent)\s+(the\s+)?(\w+\s*\w*)/i);
    if (loveMatch) {
      return `Praise for ${loveMatch[3].trim()}`;
    }
    return 'Positive feedback';
  }

  // Priority 5: Extract first noun phrase as topic
  const nounPhraseMatch = content.match(/\b(the|their|our|my)\s+([a-z]+\s+[a-z]+)/i);
  if (nounPhraseMatch && nounPhraseMatch[2].length > 5) {
    return capitalizeFirst(nounPhraseMatch[2]) + ' feedback';
  }

  // Fallback: Use platform with first few words of quote
  const firstWords = content.split(/\s+/).slice(0, 4).join(' ');
  if (firstWords.length > 15) {
    return capitalizeFirst(firstWords) + '...';
  }

  return `${platform} insight`;
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * V6 VOC FIX: Extract the actual quote portion from content
 * Looks for quoted text or uses first sentence as the quote
 */
function extractQuoteText(content: string): { quote: string; context: string } {
  // Look for text in quotation marks
  const quoteMatch = content.match(/"([^"]{20,300})"/);
  if (quoteMatch) {
    const beforeQuote = content.substring(0, content.indexOf(quoteMatch[0])).trim();
    const afterQuote = content.substring(content.indexOf(quoteMatch[0]) + quoteMatch[0].length).trim();
    return {
      quote: quoteMatch[1],
      context: (beforeQuote || afterQuote).substring(0, 100),
    };
  }

  // Fallback: Use first meaningful sentence as quote
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  if (sentences.length > 0) {
    return {
      quote: sentences[0].trim(),
      context: sentences.slice(1).join('. ').substring(0, 100),
    };
  }

  return { quote: content.substring(0, 300), context: '' };
}

/**
 * V6 FIX: Parse perplexity markdown response to extract individual quotes
 * Perplexity returns markdown text with quotes embedded, not a structured array
 */
function parsePerplexityMarkdown(markdown: string, apiName: string): TriggerInsight[] {
  // V6 VOC FIX 2.0: Use 'any[]' internally to allow V6 fields (executiveSummary, uvpAlignment)
  // These fields are consumed by toV6Insight() later in the pipeline
  const insights: any[] = [];

  // Extract quotes from markdown - look for text in quotation marks
  const quoteRegex = /"([^"]{30,500})"/g;
  let match;

  while ((match = quoteRegex.exec(markdown)) !== null) {
    const quote = match[1];

    // Skip quotes that look like system instructions or headers
    if (quote.toLowerCase().includes('return') ||
        quote.toLowerCase().includes('format') ||
        quote.startsWith('**')) {
      continue;
    }

    // Extract source info if available (often follows the quote)
    const afterQuote = markdown.substring(match.index + match[0].length, match.index + match[0].length + 200);
    const sourceMatch = afterQuote.match(/\*?\*?(G2|Capterra|TrustRadius|Reddit|LinkedIn|Twitter|HackerNews|ProductHunt)\*?\*?/i);
    const platform = sourceMatch ? sourceMatch[1] : 'AI Research';

    // Extract sentiment/category if in brackets before quote
    const beforeQuote = markdown.substring(Math.max(0, match.index - 100), match.index);
    const categoryMatch = beforeQuote.match(/\*?\*?\[([^\]]+)\]\*?\*?/);
    const category = categoryMatch ? categoryMatch[1] : 'Customer Quote';

    // V6 FIX 2.0: Skip meta-reviews about review platforms
    if (META_REVIEW_PATTERNS.some(p => p.test(quote))) {
      console.log(`[parsePerplexityMarkdown] REJECTED meta-review: "${quote.substring(0, 50)}..."`);
      continue;
    }

    // V6 FIX: Extract theme from category and generate proper alignment
    const themeTitle = extractQuoteTheme(quote, platform) || category;
    insights.push({
      id: `voc-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: themeTitle.length > 60 ? themeTitle.substring(0, 60) + '...' : themeTitle,
      text: quote, // Quote content stored in text field for card display
      executiveSummary: generateExecutiveSummary(themeTitle, quote, platform),
      uvpAlignment: generateUVPAlignment(themeTitle, quote),
      sourceTab: 'voc',
      source: {
        name: platform,
        verified: false,
      },
      confidence: 85,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[parsePerplexityMarkdown] ${apiName}: extracted ${insights.length} quotes from markdown`);
  return insights;
}

/**
 * V6 Phase 17: Parse SEC-Edgar Perplexity markdown for exec strategy insights
 * Extracts CEO/CFO quotes about AI strategy, digital transformation, etc.
 * V6 FIX: Returns TriggerInsight[] for VoC tab (not CompetitorInsight)
 */
function parseSecEdgarMarkdown(markdown: string, apiName: string): TriggerInsight[] {
  const insights: any[] = []; // Use any to allow extra fields

  // V6 Phase 17 FIX: Handle multiple quote formats from Perplexity:
  // 1. **"Quote"** — Attribution (Source)
  // 2. "Quote" — Attribution
  // 3. **"Quote"** - Attribution
  // 4. > "Quote" - Attribution (blockquote style)

  // Pattern 1: Bold quotes with attribution **"Quote"** — Attribution
  const boldQuoteRegex = /\*\*"([^"]{40,800})"\*\*\s*[—\-–]\s*([^\n(]+?)(?:\(([^)]+)\))?/g;
  let match;

  while ((match = boldQuoteRegex.exec(markdown)) !== null) {
    const quote = match[1].trim();
    const attribution = match[2].trim();
    const source = match[3]?.trim() || 'SEC Filing';

    if (quote.length < 40 || !attribution) continue;

    const companyMatch = attribution.match(/,\s*([^,]+)$/);
    const companyName = companyMatch ? companyMatch[1].trim() : attribution;
    const theme = extractStrategyTheme(quote);

    insights.push({
      id: `sec-api-io-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${insights.length}`,
      type: 'trigger',
      title: `${theme}: ${companyName}`,
      text: quote,
      quote: quote,
      executiveSummary: `${attribution}: "${quote.substring(0, 100)}..."`,
      uvpAlignment: ['Executive strategy insight', 'Competitive intelligence'],
      sourceTab: 'voc',
      source: {
        name: attribution,
        platform: 'SEC Filing',
        url: '',
        verified: true,
      },
      confidence: 95,
      timestamp: new Date().toISOString(),
    });
  }

  // Pattern 2: Plain quotes if bold pattern found nothing
  if (insights.length === 0) {
    const plainQuoteRegex = /"([^"]{40,800})"\s*[—\-–]\s*([^\n(]+?)(?:\(([^)]+)\))?/g;
    while ((match = plainQuoteRegex.exec(markdown)) !== null) {
      const quote = match[1].trim();
      const attribution = match[2].trim();
      const source = match[3]?.trim() || 'SEC Filing';

      if (quote.length < 40 || !attribution) continue;

      const companyMatch = attribution.match(/,\s*([^,]+)$/);
      const companyName = companyMatch ? companyMatch[1].trim() : attribution;
      const theme = extractStrategyTheme(quote);

      insights.push({
        id: `sec-api-io-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${insights.length}`,
        type: 'trigger',
        title: `${theme}: ${companyName}`,
        text: quote,
        quote: quote,
        executiveSummary: `${attribution}: "${quote.substring(0, 100)}..."`,
        uvpAlignment: ['Executive strategy insight', 'Competitive intelligence'],
        sourceTab: 'voc',
        source: {
          name: attribution,
          platform: 'SEC Filing',
          url: '',
          verified: true,
        },
        confidence: 95,
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.log(`[parseSecEdgarMarkdown] ${apiName}: extracted ${insights.length} exec strategy quotes`);
  return insights;
}

/**
 * PHASE 20E: Parse SEC-API.io structured response format
 * Handles extract-executive-quotes action response
 */
function parseSecApiIoData(data: {
  quotes?: string[];
  strategyStatements?: string[];
  company?: string;
  ticker?: string;
  filedAt?: string;
  source?: string;
}, apiName: string): TriggerInsight[] {
  const insights: TriggerInsight[] = [];
  const company = data.company || 'Unknown Company';
  const ticker = data.ticker || '';
  const filedAt = data.filedAt || '';

  console.log(`[parseSecApiIoData] Processing SEC data for ${company} (${ticker})`);

  // Process quotes array
  const quotes = data.quotes || [];
  for (const quote of quotes) {
    if (!quote || quote.length < 30) continue;

    // Clean up the quote
    const cleanQuote = quote.replace(/^["']|["']$/g, '').trim();
    if (cleanQuote.length < 30) continue;

    const theme = extractStrategyTheme(cleanQuote);

    insights.push({
      id: `sec-api-io-q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: `${theme}: ${company}`,
      text: cleanQuote,
      quote: cleanQuote,
      executiveSummary: `${company} (${ticker}): "${cleanQuote.substring(0, 80)}..."`,
      uvpAlignment: ['Executive strategy insight', 'SEC filing'],
      sourceTab: 'voc',
      source: {
        name: `${company} (${ticker})`,
        platform: data.source || 'SEC 10-K',
        url: '',
        verified: true,
      },
      confidence: 90,
      timestamp: filedAt || new Date().toISOString(),
    });
  }

  // Process strategyStatements array
  const strategies = data.strategyStatements || [];
  for (const statement of strategies) {
    if (!statement || statement.length < 40) continue;

    const cleanStatement = statement.trim();
    const theme = extractStrategyTheme(cleanStatement);

    insights.push({
      id: `sec-api-io-s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: `${theme}: ${company}`,
      text: cleanStatement,
      quote: cleanStatement,
      executiveSummary: `${company} strategy: "${cleanStatement.substring(0, 80)}..."`,
      uvpAlignment: ['Corporate strategy', 'SEC filing'],
      sourceTab: 'voc',
      source: {
        name: `${company} (${ticker})`,
        platform: data.source || 'SEC 10-K MD&A',
        url: '',
        verified: true,
      },
      confidence: 85,
      timestamp: filedAt || new Date().toISOString(),
    });
  }

  console.log(`[parseSecApiIoData] ${apiName}: extracted ${insights.length} insights from SEC data`);
  return insights;
}

/**
 * Extract strategy theme from exec quote
 */
function extractStrategyTheme(quote: string): string {
  const lowerQuote = quote.toLowerCase();

  if (/\b(ai|artificial intelligence|machine learning|ml)\b/i.test(lowerQuote)) {
    return 'AI Strategy';
  }
  if (/\b(digital transformation|digitization|modernization)\b/i.test(lowerQuote)) {
    return 'Digital Transformation';
  }
  if (/\b(automation|automate|automated)\b/i.test(lowerQuote)) {
    return 'Automation Investment';
  }
  if (/\b(customer experience|cx|customer-centric)\b/i.test(lowerQuote)) {
    return 'Customer Experience';
  }
  if (/\b(cloud|saas|platform)\b/i.test(lowerQuote)) {
    return 'Cloud Strategy';
  }
  if (/\b(growth|expand|scale)\b/i.test(lowerQuote)) {
    return 'Growth Strategy';
  }
  if (/\b(efficiency|cost reduction|optimization)\b/i.test(lowerQuote)) {
    return 'Efficiency Initiative';
  }

  return 'Executive Strategy';
}

/**
 * V6 REDESIGN: Adapt Voice of Customer data to V6Insight format
 * Extracts ACTUAL customer quotes from reviews, Reddit, Twitter, etc.
 * Returns insights with explicit quote field for card display
 */
function adaptVoCData(data: unknown, apiName: string): TriggerInsight[] {
  // PHASE 20E: REMOVED perplexity-based parsing - was causing hallucinated quotes
  // apify-g2, apify-capterra, apify-trustradius now use Serper site: searches
  // They return organic[] results that need standard extraction, not markdown parsing

  // PHASE 20E: SEC-API.io returns structured filing data (extract-executive-quotes action)
  // Format: { success, data: { quotes: [], strategyStatements: [], company, ticker, ... } }
  if (apiName === 'sec-api-io') {
    const rawData = data as { success?: boolean; data?: {
      quotes?: string[];
      strategyStatements?: string[];
      company?: string;
      ticker?: string;
      filedAt?: string;
      source?: string;
    } };

    if (rawData?.data && typeof rawData.data === 'object') {
      return parseSecApiIoData(rawData.data, apiName);
    }
  }

  const items = extractItems(data);
  console.log(`[adaptVoCData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: TriggerInsight[] = [];
  let filtered = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const record = item as Record<string, unknown>;

    // V6 VOC FIX: Extract ACTUAL customer quote text
    // Priority order: actual reviews > Reddit posts > snippets > descriptions
    // For Serper site:search results, the snippet IS the quote
    // For direct review scrapes, look for pros/cons/reviewText fields

    // Check for review platform specific fields first
    const reviewText = String(
      record.reviewText ||         // G2/Capterra direct scrape format
      record.pros ||               // G2 pros field
      record.cons ||               // G2 cons field
      record.selftext ||           // Reddit post body
      record.body ||               // Generic body text
      record.comment ||            // Comment text
      ''
    );

    // For Serper site:search, snippet contains the quote from the indexed page
    // V6 FIX: But snippet may also be SEO garbage - filter it
    // V6 Phase 17: Pass apiName to allow platform-specific filtering (e.g., ProductHunt)
    let snippetText = String(record.snippet || '');
    if (snippetText && !isLikelyQuote(snippetText, apiName)) {
      snippetText = ''; // Discard SEO garbage snippets
    }

    // Generic content fallbacks
    const genericText = String(
      record.text ||               // Generic text field
      record.content ||            // Content field
      record.description ||        // Description
      ''
    );

    // Get source title - often useless for quotes (e.g., "Explore Microsoft Copilot...")
    const sourceTitle = String(record.title || record.headline || record.name || '');

    // V6 VOC FIX: Prioritize actual quote content over titles
    // Title is NEVER the quote - it's just metadata
    // The snippet from Serper contains actual quoted text from the review page
    const rawContent = reviewText || snippetText || genericText;

    // Skip items with no meaningful content
    if (!rawContent && !sourceTitle) continue;

    // Skip if only title (no actual quote content)
    if (!rawContent && sourceTitle) {
      // Only use title as a last resort if it looks like a quote
      if (!isLikelyQuote(sourceTitle)) {
        continue; // Skip this - it's just a page title, not a customer quote
      }
    }

    // The actual content to analyze - NEVER use title as primary content
    const contentToUse = rawContent || sourceTitle;

    // V6 FIX: Filter out irrelevant consumer garbage
    if (!isRelevantVoCContent(sourceTitle, contentToUse)) {
      filtered++;
      continue;
    }

    // Determine platform FIRST (needed for theme extraction)
    const url = String(record.url || record.link || record.permalink || '');
    const platform = detectPlatformFromUrl(url, apiName);

    // V6 REDESIGN: Extract quote and generate descriptive title
    const { quote, context } = extractQuoteText(contentToUse);
    const themeTitle = extractQuoteTheme(contentToUse, platform);

    // Build the V6 insight with explicit quote field + UVP alignment
    // The component will display: Title (theme) + Quote (in quotes) + Source link + Alignment
    insights.push({
      id: `voc-${apiName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'trigger',
      title: themeTitle,
      text: context || quote, // Full context for expanded view
      quote: quote, // Actual quote for card display (new field)
      executiveSummary: generateExecutiveSummary(themeTitle, quote, platform), // For expanded view
      uvpAlignment: generateUVPAlignment(themeTitle, quote), // V6 FIX: Add UVP alignment
      sourceTab: 'voc',
      source: {
        name: String(record.source || record.author || record.username || platform),
        platform: platform,
        url: url,
        verified: Boolean(record.verified),
      },
      timestamp: new Date().toISOString(),
    } as TriggerInsight & { quote: string; executiveSummary: string; uvpAlignment: string[] });
  }

  if (filtered > 0) {
    console.log(`[adaptVoCData] ${apiName}: filtered ${filtered} irrelevant items`);
  }

  console.log(`[adaptVoCData] ${apiName}: returning ${insights.length} quote insights`);
  return insights;
}

/**
 * Detect platform from URL for proper source attribution
 * V6 VOC: Added ProductHunt, IndieHackers, TrustRadius detection
 */
function detectPlatformFromUrl(url: string, apiName: string): string {
  const lowerUrl = url.toLowerCase();

  // URL-based detection (most accurate)
  if (lowerUrl.includes('reddit.com')) return 'Reddit';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter';
  if (lowerUrl.includes('g2.com')) return 'G2';
  if (lowerUrl.includes('capterra.com')) return 'Capterra';
  if (lowerUrl.includes('trustradius.com')) return 'TrustRadius';
  if (lowerUrl.includes('trustpilot.com')) return 'Trustpilot';
  if (lowerUrl.includes('yelp.com')) return 'Yelp';
  if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
  if (lowerUrl.includes('news.ycombinator.com')) return 'HackerNews';
  if (lowerUrl.includes('producthunt.com')) return 'ProductHunt';
  if (lowerUrl.includes('indiehackers.com')) return 'IndieHackers';
  if (lowerUrl.includes('youtube.com')) return 'YouTube';
  if (lowerUrl.includes('quora.com')) return 'Quora';
  if (lowerUrl.includes('facebook.com')) return 'Facebook';

  // Fallback to API name mapping
  const apiPlatforms: Record<string, string> = {
    'apify-g2': 'G2',
    'apify-capterra': 'Capterra',
    'apify-trustradius': 'TrustRadius',
    'apify-twitter': 'Twitter',
    'apify-linkedin': 'LinkedIn',
    'apify-yelp': 'Yelp',
    'apify-trustpilot': 'Trustpilot',
    'reddit': 'Reddit',
    'reddit-professional': 'Reddit',
    'hackernews': 'HackerNews',
    'hackernews-comments': 'HackerNews',
    'producthunt': 'ProductHunt',
    'indiehackers': 'IndieHackers',
    'perplexity': 'Research',
    'perplexity-reviews': 'Research',
    'serper': 'Web',
  };

  return apiPlatforms[apiName] || 'Web';
}

/**
 * V6 VOC FIX Phase 17: Generate intelligent executive summary
 *
 * Creates a summary that ADDS VALUE beyond the quote itself:
 * - Extracts key metrics/outcomes if present
 * - Identifies the core issue/benefit
 * - Provides actionable insight context
 */
function generateExecutiveSummary(theme: string, quote: string, platform: string): string {
  const lowerQuote = quote.toLowerCase();

  // Extract metrics if present (most valuable)
  const metricMatch = quote.match(/(\d+%?)\s*(reduction|increase|improvement|faster|savings|more|less|growth)/i);
  if (metricMatch) {
    const metricContext = extractMetricContext(quote, metricMatch);
    return `Quantified impact: ${metricContext}. Source: ${platform} user feedback.`;
  }

  // Extract time-based outcomes
  const timeMatch = quote.match(/(\d+)\s*(hours?|days?|weeks?|months?)\s+(saved|reduced|less|faster)/i);
  if (timeMatch) {
    return `Time savings reported: ${timeMatch[1]} ${timeMatch[2]} ${timeMatch[3]}. Validated from ${platform}.`;
  }

  // Extract competitive context
  const compMatch = quote.match(/(switched|moved?|migrat|left|replaced?)\s+(from|to)\s+([A-Z][a-zA-Z]+)/i);
  if (compMatch) {
    const direction = compMatch[2].toLowerCase();
    const competitor = compMatch[3];
    return `Competitive signal: User ${compMatch[1].toLowerCase()} ${direction} ${competitor}. Potential switching trigger identified.`;
  }

  // Extract pain point specificity
  const painMatch = quote.match(/(frustrat|struggle|difficult|hard|impossible|annoying)\w*\s+(to|with|when)\s+([^.!?]+)/i);
  if (painMatch) {
    const painPoint = painMatch[3].substring(0, 50).trim();
    return `Pain point: Difficulty with ${painPoint}. Messaging opportunity for differentiation.`;
  }

  // Extract feature/capability mentions
  const featureMatch = quote.match(/(integration|API|automation|workflow|reporting|analytics|AI|support)\s+(is|was|has|feature)/i);
  if (featureMatch) {
    const feature = featureMatch[1];
    return `Feature feedback: ${feature} discussed. Review for product positioning alignment.`;
  }

  // Default: Provide platform context + content type
  const contentType = theme.includes('Request') ? 'feature request' :
                      theme.includes('Frustration') || theme.includes('pain') ? 'pain point' :
                      theme.includes('Praise') || theme.includes('Positive') ? 'success story' :
                      theme.includes('Switching') || theme.includes('Moving') ? 'competitive intel' :
                      'customer perspective';

  return `${capitalizeFirst(contentType)} from ${platform}. Use for authentic voice-of-customer content.`;
}

/**
 * Helper: Extract context around a metric match
 */
function extractMetricContext(quote: string, match: RegExpMatchArray): string {
  const idx = quote.toLowerCase().indexOf(match[0].toLowerCase());
  const start = Math.max(0, idx - 20);
  const end = Math.min(quote.length, idx + match[0].length + 20);
  return quote.substring(start, end).trim().replace(/^[^a-zA-Z0-9]+/, '');
}

/**
 * V6 VOC FIX Phase 17: Contextual UVP alignment
 *
 * Generates actionable content suggestions based on quote content.
 * Matches with new smart theme extraction for better alignment.
 */
function generateUVPAlignment(theme: string, quote: string): string[] {
  const lowerQuote = quote.toLowerCase();
  const lowerTheme = theme.toLowerCase();

  // Metric/ROI quotes - most valuable for case studies
  if (/\d+%?\s*(reduction|increase|improvement|faster|savings)/i.test(quote)) {
    return ['Case study opportunity', 'ROI messaging', 'Sales enablement'];
  }

  // Time savings - efficiency messaging
  if (/\d+\s*(hours?|days?|weeks?)\s+(saved|reduced|faster)/i.test(quote)) {
    return ['Efficiency messaging', 'Time-to-value content'];
  }

  // Competitive/switching content
  if (lowerTheme.includes('switching') || lowerTheme.includes('moving') ||
      lowerTheme.includes('leaving') || lowerTheme.includes('migrating')) {
    return ['Competitive comparison', 'Migration guide', 'Win-back campaign'];
  }

  // Integration mentions
  if (lowerTheme.includes('integration') || /\bintegrat/i.test(quote)) {
    return ['Integration documentation', 'Partnership content', 'Technical blog'];
  }

  // AI/Automation mentions
  if (lowerTheme.includes('ai') || lowerTheme.includes('automat')) {
    return ['AI capability messaging', 'Innovation content'];
  }

  // Pain points / frustrations
  if (lowerTheme.includes('frustration') || lowerTheme.includes('pain') ||
      /\b(frustrat|hate|annoying|worst|difficult)\b/.test(lowerQuote)) {
    return ['Differentiation messaging', 'Problem-solution content'];
  }

  // Feature requests
  if (lowerTheme.includes('request') || /\b(wish|missing|need|lacks?)\b/.test(lowerQuote)) {
    return ['Product roadmap input', 'Feature announcement content'];
  }

  // Positive feedback / praise
  if (lowerTheme.includes('praise') || lowerTheme.includes('positive') ||
      /\b(love|amazing|excellent|fantastic|best)\b/.test(lowerQuote)) {
    return ['Testimonial opportunity', 'Social proof content'];
  }

  // Support/service mentions
  if (lowerTheme.includes('support') || lowerTheme.includes('service')) {
    return ['Support excellence messaging', 'Customer success story'];
  }

  // Onboarding/implementation
  if (lowerTheme.includes('onboarding') || lowerTheme.includes('implementation')) {
    return ['Onboarding content', 'Getting started guides'];
  }

  // Pricing/value
  if (lowerTheme.includes('pricing') || lowerTheme.includes('value')) {
    return ['Value proposition content', 'Pricing page optimization'];
  }

  // Default: generic but actionable
  return ['Voice-of-customer content', 'Messaging validation'];
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
function adaptCompetitiveData(data: unknown, apiName: string): CompetitorInsight[] {
  const items = extractItems(data);
  console.log(`[adaptCompetitiveData] ${apiName}: extracted ${items.length} items`);

  if (items.length === 0) return [];

  const insights: CompetitorInsight[] = [];

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
