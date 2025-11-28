/**
 * Reddit API Service
 *
 * Mines Reddit for psychological triggers, customer pain points, and trending topics.
 * Integrates with Synapse's ContentPsychologyEngine to power breakthrough content.
 *
 * Features:
 * - OAuth 2.0 authentication with token refresh
 * - Subreddit search by industry/keywords
 * - Psychological trigger extraction from comments
 * - Customer pain point & desire mining
 * - Trending topic identification
 * - Fallback to public API if auth fails
 *
 * Created: 2025-11-14
 */

import type { EmotionalTriggerType } from '@/types/synapse.types';

// ============================================================================
// TYPES
// ============================================================================

export interface RedditAuthConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

export interface RedditAccessToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  expiresAt: number; // Unix timestamp
}

export interface RedditPsychologicalTrigger {
  text: string;
  type: EmotionalTriggerType;
  intensity: number; // 1-10
  context: string; // Surrounding text for context
  subreddit: string;
  upvotes: number; // Social validation
  url: string;
}

export interface RedditCustomerInsight {
  painPoint?: string; // "I hate when..."
  desire?: string; // "I wish..."
  context: string;
  subreddit: string;
  upvotes: number;
  url: string;
}

export interface RedditTrendingTopic {
  topic: string;
  subreddit: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  topPosts: Array<{
    title: string;
    url: string;
    upvotes: number;
    comments: number;
  }>;
}

export interface RedditIntelligenceResult {
  triggers: RedditPsychologicalTrigger[];
  insights: RedditCustomerInsight[];
  trendingTopics: RedditTrendingTopic[];
  metadata: {
    searchQuery: string;
    subreddits: string[];
    totalComments: number;
    totalPosts: number;
    timestamp: string;
  };
}

// ============================================================================
// REDDIT API CLASS
// ============================================================================

export class RedditAPI {
  private clientId: string;
  private clientSecret: string;
  private userAgent: string;
  private accessToken: RedditAccessToken | null = null;

  constructor(config?: RedditAuthConfig) {
    // COMMENTED OUT: Using Apify-based reddit-apify-api.ts instead
    // This OAuth-based implementation is preserved but disabled to avoid conflicts
    // Reddit credentials are managed server-side by reddit-oauth Edge Function
    // Client-side code doesn't need direct access to credentials
    this.clientId = config?.clientId || '';
    this.clientSecret = config?.clientSecret || '';
    this.userAgent = config?.userAgent || 'Synapse/1.0';

    // Note: All Reddit API calls go through Supabase Edge Function (reddit-oauth)
    // which securely handles authentication using server-side secrets
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * COMMENTED OUT: Using Apify-based reddit-apify-api.ts instead
   * Get or refresh OAuth access token (via Supabase Edge Function to avoid CORS)
   */
  private async getAccessToken(): Promise<string> {
    throw new Error('Reddit OAuth disabled - using Apify-based implementation in reddit-apify-api.ts');
    /*
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
      return this.accessToken.accessToken;
    }

    console.log('[RedditAPI] Fetching new access token via Edge Function...');

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Reddit API credentials not configured');
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/reddit-oauth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            endpoint: '/oauth/token',
            userAgent: this.userAgent
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RedditAPI] Edge Function error:', response.status, errorText);
        throw new Error(`Edge Function failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error from Edge Function');
      }

      this.accessToken = {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        scope: data.scope,
        expiresAt: Date.now() + (data.expiresIn * 1000) - 60000 // 1 min buffer
      };

      console.log('[RedditAPI] ✅ Access token obtained via Edge Function, expires in', data.expiresIn, 'seconds');

      return this.accessToken.accessToken;
    } catch (error) {
      console.error('[RedditAPI] OAuth error:', error);
      throw new Error('Failed to authenticate with Reddit API');
    }
    */
  }

  /**
   * COMMENTED OUT: Using Apify-based reddit-apify-api.ts instead
   * Make authenticated API request (via Supabase Edge Function to avoid CORS)
   * Falls back to public API if auth fails
   */
  private async fetchAPI(endpoint: string, useAuth = true): Promise<any> {
    throw new Error('Reddit OAuth disabled - using Apify-based implementation in reddit-apify-api.ts');
    /*
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    try {
      let accessToken = '';
      if (useAuth) {
        try {
          accessToken = await this.getAccessToken();
        } catch (authError) {
          console.warn('[RedditAPI] OAuth failed, falling back to public API:', authError);
          useAuth = false; // Fall back to public API
        }
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/reddit-oauth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            endpoint,
            accessToken,
            userAgent: this.userAgent,
            useAuth
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RedditAPI] Edge Function error:', response.status, errorText);
        throw new Error(`Edge Function failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Edge Function');
      }

      return result.data;
    } catch (error) {
      console.error('[RedditAPI] Fetch error:', error);
      throw error;
    }
    */
  }

  // ==========================================================================
  // PSYCHOLOGICAL TRIGGER EXTRACTION
  // ==========================================================================

  /**
   * Analyze text for psychological triggers
   */
  private analyzePsychologicalTriggers(
    text: string,
    context: {
      subreddit: string;
      upvotes: number;
      url: string;
    }
  ): RedditPsychologicalTrigger[] {
    const triggers: RedditPsychologicalTrigger[] = [];
    const lowerText = text.toLowerCase();

    // CURIOSITY triggers
    const curiosityPatterns = [
      /you (won't|wont) believe/i,
      /the secret (to|of)/i,
      /what (actually|really) (happened|works)/i,
      /turns out/i,
      /discovered (that|how)/i,
      /found out (that|how)/i
    ];

    for (const pattern of curiosityPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'curiosity',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'curiosity'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // FEAR triggers
    const fearPatterns = [
      /avoid|warning|mistake|danger|risk|scary|afraid/i,
      /don't (do|make|try)/i,
      /be careful/i,
      /watch out/i
    ];

    for (const pattern of fearPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'fear',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'fear'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // DESIRE triggers
    const desirePatterns = [
      /imagine|dream|wish|want|hope|achieve|accomplish/i,
      /finally (got|found|achieved)/i,
      /this changed my life/i
    ];

    for (const pattern of desirePatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'desire',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'desire'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // BELONGING triggers
    const belongingPatterns = [
      /join (us|our|the)/i,
      /community|together|family|tribe|team/i,
      /one of us|we all/i,
      /everyone (here|knows)/i
    ];

    for (const pattern of belongingPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'belonging',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'belonging'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // ACHIEVEMENT triggers
    const achievementPatterns = [
      /success|victory|accomplished|proud|finally (did|achieved)/i,
      /made it|reached|hit (my|the) goal/i,
      /(beat|overcame|conquered)/i
    ];

    for (const pattern of achievementPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'achievement',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'achievement'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // TRUST triggers
    const trustPatterns = [
      /honest(ly)?|transparent|authentic|genuine/i,
      /trust me|believe me|i promise/i,
      /no (bs|bullshit|lie)/i
    ];

    for (const pattern of trustPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'trust',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'trust'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    // URGENCY triggers
    const urgencyPatterns = [
      /last chance|running out|limited|now or never/i,
      /don't wait|act (now|fast|quickly)/i,
      /hurry|urgent/i
    ];

    for (const pattern of urgencyPatterns) {
      if (pattern.test(text)) {
        triggers.push({
          text: this.extractMatchContext(text, pattern),
          type: 'urgency',
          intensity: this.calculateTriggerIntensity(context.upvotes, 'urgency'),
          context: text.substring(0, 200),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        });
      }
    }

    return triggers;
  }

  /**
   * Extract context around matched pattern
   */
  private extractMatchContext(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match) return text.substring(0, 100);

    const matchIndex = match.index || 0;
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + match[0].length + 50);

    return text.substring(start, end).trim();
  }

  /**
   * Calculate trigger intensity based on upvotes and type
   */
  private calculateTriggerIntensity(upvotes: number, type: EmotionalTriggerType): number {
    // Base intensity on upvotes (social validation)
    let intensity = Math.min(10, Math.floor(upvotes / 10) + 1);

    // Adjust by trigger type (some are naturally stronger)
    const typeMultipliers: Record<EmotionalTriggerType, number> = {
      'curiosity': 1.0,
      'fear': 1.2,
      'desire': 1.1,
      'belonging': 0.9,
      'achievement': 1.0,
      'trust': 0.8,
      'urgency': 1.3
    };

    intensity *= typeMultipliers[type];

    return Math.min(10, Math.max(1, Math.round(intensity)));
  }

  // ==========================================================================
  // CUSTOMER INSIGHTS EXTRACTION
  // ==========================================================================

  /**
   * Extract pain points and desires from comments
   */
  private extractCustomerInsights(
    text: string,
    context: {
      subreddit: string;
      upvotes: number;
      url: string;
    }
  ): RedditCustomerInsight | null {
    const lowerText = text.toLowerCase();

    // Pain points: "I hate...", "I can't stand...", "frustrating when..."
    const painPointPatterns = [
      /i hate (when|how|that)/i,
      /i can't stand/i,
      /frustrating (when|how|that)/i,
      /annoying (when|how|that)/i,
      /why (is it so|does)/i,
      /the problem (is|with)/i
    ];

    for (const pattern of painPointPatterns) {
      const match = text.match(pattern);
      if (match) {
        const index = match.index || 0;
        const painPoint = text.substring(index, Math.min(text.length, index + 200));

        return {
          painPoint,
          context: text.substring(0, 300),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        };
      }
    }

    // Desires: "I wish...", "If only...", "I'd love..."
    const desirePatterns = [
      /i wish (there was|i could|someone would)/i,
      /if only (there was|i could)/i,
      /i'd love (to|if)/i,
      /would be (great|amazing|perfect) if/i,
      /someone (should|needs to) (make|create|build)/i
    ];

    for (const pattern of desirePatterns) {
      const match = text.match(pattern);
      if (match) {
        const index = match.index || 0;
        const desire = text.substring(index, Math.min(text.length, index + 200));

        return {
          desire,
          context: text.substring(0, 300),
          subreddit: context.subreddit,
          upvotes: context.upvotes,
          url: context.url
        };
      }
    }

    return null;
  }

  // ==========================================================================
  // MAIN INTELLIGENCE GATHERING
  // ==========================================================================

  /**
   * COMMENTED OUT: Using Apify-based reddit-apify-api.ts instead
   * Search Reddit for psychological triggers and insights
   *
   * @param query - Search query (e.g., "fitness motivation", "restaurant problems")
   * @param options - Search options
   */
  async mineIntelligence(
    query: string,
    options: {
      subreddits?: string[]; // Specific subreddits to search
      limit?: number; // Number of posts to analyze (default: 25)
      commentsPerPost?: number; // Comments per post (default: 20)
      sortBy?: 'relevance' | 'hot' | 'top' | 'new'; // Sort order
      timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'; // Time filter
    } = {}
  ): Promise<RedditIntelligenceResult> {
    // Redirect to new Apify implementation
    throw new Error('Reddit OAuth disabled - please use reddit-apify-api.ts instead');
    /*
    const {
      subreddits = [],
      limit = 25,
      commentsPerPost = 20,
      sortBy = 'relevance',
      timeFilter = 'month'
    } = options;

    console.log('[RedditAPI] Mining intelligence for:', query);

    const allTriggers: RedditPsychologicalTrigger[] = [];
    const allInsights: RedditCustomerInsight[] = [];
    const topicMentions: Map<string, RedditTrendingTopic> = new Map();

    try {
      // Build search query
      const subredditFilter = subreddits.length > 0
        ? ` subreddit:${subreddits.join(' OR subreddit:')}`
        : '';

      const searchQuery = query + subredditFilter;

      // Search for posts
      const endpoint = `/search?q=${encodeURIComponent(searchQuery)}&sort=${sortBy}&t=${timeFilter}&limit=${limit}`;
      const searchResults = await this.fetchAPI(endpoint);

      const posts = searchResults.data?.children || [];
      console.log('[RedditAPI] Found', posts.length, 'posts');

      // Analyze each post
      for (const postWrapper of posts) {
        const post = postWrapper.data;
        const postUrl = `https://reddit.com${post.permalink}`;

        // Analyze post title and selftext
        const postText = `${post.title} ${post.selftext || ''}`;
        const postContext = {
          subreddit: post.subreddit,
          upvotes: post.ups,
          url: postUrl
        };

        // Extract triggers from post
        const postTriggers = this.analyzePsychologicalTriggers(postText, postContext);
        allTriggers.push(...postTriggers);

        // Extract insights from post
        const postInsight = this.extractCustomerInsights(postText, postContext);
        if (postInsight) {
          allInsights.push(postInsight);
        }

        // Fetch and analyze comments
        try {
          const commentsEndpoint = `/r/${post.subreddit}/comments/${post.id}?limit=${commentsPerPost}`;
          const commentsData = await this.fetchAPI(commentsEndpoint);

          const comments = commentsData[1]?.data?.children || [];

          for (const commentWrapper of comments) {
            const comment = commentWrapper.data;
            if (!comment.body || comment.body === '[deleted]') continue;

            const commentContext = {
              subreddit: post.subreddit,
              upvotes: comment.ups,
              url: `${postUrl}${comment.id}`
            };

            // Extract triggers from comment
            const commentTriggers = this.analyzePsychologicalTriggers(comment.body, commentContext);
            allTriggers.push(...commentTriggers);

            // Extract insights from comment
            const commentInsight = this.extractCustomerInsights(comment.body, commentContext);
            if (commentInsight) {
              allInsights.push(commentInsight);
            }
          }
        } catch (err) {
          console.warn('[RedditAPI] Failed to fetch comments for post:', post.id);
        }
      }

      // Sort by social validation (upvotes)
      allTriggers.sort((a, b) => b.upvotes - a.upvotes);
      allInsights.sort((a, b) => b.upvotes - a.upvotes);

      console.log('[RedditAPI] ✅ Extracted', allTriggers.length, 'triggers and', allInsights.length, 'insights');

      // V3 FIX: NO SLICE - return ALL triggers and insights, Atomizer handles variety
      return {
        triggers: allTriggers,
        insights: allInsights,
        trendingTopics: Array.from(topicMentions.values()),
        metadata: {
          searchQuery: query,
          subreddits: subreddits.length > 0 ? subreddits : ['all'],
          totalComments: allTriggers.length + allInsights.length,
          totalPosts: posts.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[RedditAPI] Mining failed:', error);
      throw error;
    }
    */
  }

  /**
   * Quick search for industry-specific subreddits
   */
  async findRelevantSubreddits(industry: string): Promise<string[]> {
    // Map common industries to subreddit names
    const industryToSubreddits: Record<string, string[]> = {
      'fitness': ['fitness', 'bodybuilding', 'xxfitness', 'running', 'yoga'],
      'restaurant': ['FoodPorn', 'recipes', 'Cooking', 'AskCulinary', 'KitchenConfidential'],
      'dental': ['Dentistry', 'DentalHygiene', 'askdentists'],
      'realtor': ['RealEstate', 'FirstTimeHomeBuyer', 'realtors'],
      'cpa': ['Accounting', 'tax', 'smallbusiness'],
      'insurance': ['Insurance', 'personalfinance'],
      'consultant': ['consulting', 'Entrepreneur', 'smallbusiness'],
      // Add more as needed
    };

    const normalizedIndustry = industry.toLowerCase();

    for (const [key, subreddits] of Object.entries(industryToSubreddits)) {
      if (normalizedIndustry.includes(key)) {
        return subreddits;
      }
    }

    // Default: search using industry name
    return [industry.replace(/\s+/g, '')];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// COMMENTED OUT: Using Apify-based reddit-apify-api.ts instead
// export const redditAPI = new RedditAPI();
export const redditAPI = null; // Disabled - use reddit-apify-api.ts
