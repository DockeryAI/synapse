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
    // Load from environment if not provided
    this.clientId = config?.clientId ||
      import.meta.env.VITE_REDDIT_CLIENT_ID ||
      import.meta.env.REDDIT_CLIENT_ID || '';

    this.clientSecret = config?.clientSecret ||
      import.meta.env.VITE_REDDIT_CLIENT_SECRET ||
      import.meta.env.REDDIT_CLIENT_SECRET || '';

    this.userAgent = config?.userAgent ||
      import.meta.env.VITE_REDDIT_USER_AGENT ||
      import.meta.env.REDDIT_USER_AGENT ||
      'Synapse/1.0';
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Get or refresh OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
      return this.accessToken.accessToken;
    }

    console.log('[RedditAPI] Fetching new access token...');

    // Request new token using client credentials flow
    const auth = btoa(`${this.clientId}:${this.clientSecret}`);

    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Reddit OAuth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // 1 min buffer
      };

      console.log('[RedditAPI] ✅ Access token obtained, expires in', data.expires_in, 'seconds');

      return this.accessToken.accessToken;
    } catch (error) {
      console.error('[RedditAPI] OAuth error:', error);
      throw new Error('Failed to authenticate with Reddit API');
    }
  }

  /**
   * Make authenticated API request
   */
  private async fetchAPI(endpoint: string, useAuth = true): Promise<any> {
    const url = useAuth
      ? `https://oauth.reddit.com${endpoint}`
      : `https://www.reddit.com${endpoint}.json`;

    const headers: Record<string, string> = {
      'User-Agent': this.userAgent
    };

    if (useAuth) {
      const token = await this.getAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        // If auth fails, try public API
        if (useAuth && response.status === 403) {
          console.warn('[RedditAPI] Auth failed, falling back to public API');
          return this.fetchAPI(endpoint, false);
        }
        throw new Error(`Reddit API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[RedditAPI] Fetch error:', error);
      throw error;
    }
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

      return {
        triggers: allTriggers.slice(0, 50), // Top 50 triggers
        insights: allInsights.slice(0, 30), // Top 30 insights
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

export const redditAPI = new RedditAPI();
