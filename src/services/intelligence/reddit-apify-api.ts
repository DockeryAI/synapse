/**
 * Reddit API Service (Apify Version)
 *
 * Mines Reddit for psychological triggers, customer pain points, and trending topics.
 * Uses Apify Reddit scraper to avoid OAuth complexity and rate limiting.
 * Integrates with Synapse's ContentPsychologyEngine to power breakthrough content.
 *
 * Features:
 * - No OAuth required - uses Apify Reddit scraper
 * - Subreddit search by industry/keywords
 * - Psychological trigger extraction from comments
 * - Customer pain point & desire mining
 * - Trending topic identification
 * - Progressive loading without timeouts
 *
 * Updated: 2025-11-25
 */

import type { EmotionalTriggerType } from '@/types/synapse.types';

// ============================================================================
// TYPES (same as original for compatibility)
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
  expiresAt: number;
}

export interface RedditPsychologicalTrigger {
  text: string;
  type: EmotionalTriggerType;
  intensity: number; // 1-10
  context: string;
  subreddit: string;
  upvotes: number;
  url: string;
}

export interface RedditCustomerInsight {
  painPoint?: string;
  desire?: string;
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
// REDDIT API CLASS (APIFY VERSION)
// ============================================================================

export class RedditAPI {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(config?: RedditAuthConfig) {
    // No OAuth needed with Apify!
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('[RedditAPI] Supabase configuration missing');
    }
  }

  // ==========================================================================
  // APIFY INTEGRATION
  // ==========================================================================

  /**
   * Fetch Reddit data using Apify scraper (no OAuth needed!)
   */
  private async fetchRedditViaApify(options: {
    searchQuery?: string;
    subreddit?: string;
    sort?: 'hot' | 'new' | 'top' | 'rising';
    timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    includeComments?: boolean;
    maxComments?: number;
  }): Promise<any[]> {
    const {
      searchQuery,
      subreddit,
      sort = 'hot',
      timeFilter = 'month',
      limit = 15, // Reduced from 25 to fit in 40s timeout
      includeComments = true,
      maxComments = 10 // Reduced from 20 to speed up
    } = options;

    console.log('[RedditAPI] Fetching via Apify:', { searchQuery, subreddit, sort, limit });

    try {
      // Build Reddit URLs for Apify to scrape
      const startUrls: { url: string }[] = [];

      if (searchQuery) {
        // Search across Reddit
        startUrls.push({
          url: `https://www.reddit.com/search/?q=${encodeURIComponent(searchQuery)}&sort=${sort}&t=${timeFilter}`
        });
      } else if (subreddit) {
        // Specific subreddit
        startUrls.push({
          url: `https://www.reddit.com/r/${subreddit}/${sort}/?t=${timeFilter}`
        });
      } else {
        // Front page
        startUrls.push({
          url: `https://www.reddit.com/${sort}/?t=${timeFilter}`
        });
      }

      // Call Apify Reddit scraper via Edge Function
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/apify-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseAnonKey}`
          },
          body: JSON.stringify({
            actorId: 'trudax/reddit-scraper', // Required by Edge Function
            scraperType: 'REDDIT', // Use the REDDIT scraper type
            input: {
              startUrls,
              maxItems: limit,
              includeComments,
              maxCommentsPerPost: maxComments,
              extendedData: true // Get all metadata
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RedditAPI] Apify error:', response.status, errorText);

        // Return empty array on error (progressive loading continues)
        return [];
      }

      const result = await response.json();

      if (!result.success) {
        console.warn('[RedditAPI] Apify returned no data');
        return [];
      }

      console.log('[RedditAPI] Apify returned', result.data?.length || 0, 'posts');
      return result.data || [];

    } catch (error) {
      console.error('[RedditAPI] Apify fetch error:', error);
      // Don't throw - return empty array for progressive loading
      return [];
    }
  }

  // ==========================================================================
  // PSYCHOLOGICAL TRIGGER EXTRACTION (same as original)
  // ==========================================================================

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

  private extractMatchContext(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match) return text.substring(0, 100);

    const matchIndex = match.index || 0;
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + match[0].length + 50);

    return text.substring(start, end).trim();
  }

  private calculateTriggerIntensity(upvotes: number, type: EmotionalTriggerType): number {
    let intensity = Math.min(10, Math.floor(upvotes / 10) + 1);

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
  // CUSTOMER INSIGHTS EXTRACTION (same as original)
  // ==========================================================================

  private extractCustomerInsights(
    text: string,
    context: {
      subreddit: string;
      upvotes: number;
      url: string;
    }
  ): RedditCustomerInsight | null {
    const lowerText = text.toLowerCase();

    // Pain points
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

    // Desires
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
  // MAIN INTELLIGENCE GATHERING (APIFY VERSION)
  // ==========================================================================

  async mineIntelligence(
    query: string,
    options: {
      subreddits?: string[];
      limit?: number;
      commentsPerPost?: number;
      sortBy?: 'relevance' | 'hot' | 'top' | 'new';
      timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
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
    const allRawPosts: any[] = []; // Store raw posts for LLM synthesis

    try {
      // If specific subreddits provided, search them IN PARALLEL (not sequential!)
      if (subreddits.length > 0) {
        // Phase 2 scaling: Increased from 3 to 5 subreddits for more data
        const limitedSubreddits = subreddits.slice(0, 5);
        const subredditPromises = limitedSubreddits.map(subreddit =>
          this.fetchRedditViaApify({
            searchQuery: query,
            subreddit,
            sort: sortBy === 'relevance' ? 'hot' : sortBy,
            timeFilter,
            limit: 10, // Increased from 5 to 10 per subreddit
            includeComments: false, // Skip comments to speed up
            maxComments: 0
          }).catch(() => []) // Don't fail entire batch if one subreddit fails
        );

        const allPostsArrays = await Promise.all(subredditPromises);
        allPostsArrays.forEach(posts => {
          allRawPosts.push(...posts); // Store raw posts
          this.processPosts(posts, allTriggers, allInsights);
        });
      } else {
        // General search across Reddit
        const posts = await this.fetchRedditViaApify({
          searchQuery: query,
          sort: sortBy === 'relevance' ? 'hot' : sortBy,
          timeFilter,
          limit,
          includeComments: true,
          maxComments: commentsPerPost
        });

        allRawPosts.push(...posts); // Store raw posts
        this.processPosts(posts, allTriggers, allInsights);
      }

      // Sort by social validation (upvotes)
      allTriggers.sort((a, b) => b.upvotes - a.upvotes);
      allInsights.sort((a, b) => b.upvotes - a.upvotes);

      console.log('[RedditAPI] Extracted', allTriggers.length, 'triggers and', allInsights.length, 'insights from', allRawPosts.length, 'raw posts');

      // V3 FIX: NO SLICE - return ALL triggers and insights, Atomizer handles variety
      // ADDED: rawPosts for LLM synthesis when pattern matching fails
      return {
        triggers: allTriggers,
        insights: allInsights,
        rawPosts: allRawPosts, // NEW: Include raw posts for LLM to process
        trendingTopics: Array.from(topicMentions.values()),
        metadata: {
          searchQuery: query,
          subreddits: subreddits.length > 0 ? subreddits : ['all'],
          totalComments: allTriggers.length + allInsights.length,
          totalPosts: allRawPosts.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[RedditAPI] Mining failed:', error);
      // Return empty results for progressive loading
      return {
        triggers: [],
        insights: [],
        rawPosts: [], // Include rawPosts in error path for type consistency
        trendingTopics: [],
        metadata: {
          searchQuery: query,
          subreddits: subreddits.length > 0 ? subreddits : ['all'],
          totalComments: 0,
          totalPosts: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Process Apify posts and extract triggers/insights
   * FIXED: Always add post title as insight even if patterns don't match
   */
  private processPosts(
    posts: any[],
    allTriggers: RedditPsychologicalTrigger[],
    allInsights: RedditCustomerInsight[]
  ): void {
    for (const post of posts) {
      // Map Apify structure to our format
      const postUrl = post.url || post.postUrl || '';
      const subreddit = post.subreddit || post.subredditName || 'unknown';
      const upvotes = post.upvotes || post.score || 0;
      const title = post.title || '';
      const body = post.text || post.selftext || '';

      // Analyze post title and text
      const postText = `${title} ${body}`;
      const postContext = {
        subreddit,
        upvotes,
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

      // REMOVED: Raw title fallback that was polluting triggers with nonsense
      // Only pattern-matched insights should be added - raw titles are not psychological triggers
      // If no insight extracted, skip this post - quality over quantity

      // Process comments if available
      const comments = post.comments || [];
      for (const comment of comments) {
        if (!comment.text || comment.text === '[deleted]') continue;

        const commentContext = {
          subreddit,
          upvotes: comment.upvotes || comment.score || 0,
          url: comment.url || postUrl
        };

        // Extract triggers from comment
        const commentTriggers = this.analyzePsychologicalTriggers(comment.text, commentContext);
        allTriggers.push(...commentTriggers);

        // Extract insights from comment
        const commentInsight = this.extractCustomerInsights(comment.text, commentContext);
        if (commentInsight) {
          allInsights.push(commentInsight);
        }
      }
    }
  }

  /**
   * Quick search for industry-specific subreddits
   */
  async findRelevantSubreddits(industry: string): Promise<string[]> {
    const industryToSubreddits: Record<string, string[]> = {
      'fitness': ['fitness', 'bodybuilding', 'xxfitness', 'running', 'yoga'],
      'restaurant': ['FoodPorn', 'recipes', 'Cooking', 'AskCulinary', 'KitchenConfidential'],
      'dental': ['Dentistry', 'DentalHygiene', 'askdentists'],
      'realtor': ['RealEstate', 'FirstTimeHomeBuyer', 'realtors'],
      'cpa': ['Accounting', 'tax', 'smallbusiness'],
      'insurance': ['Insurance', 'personalfinance', 'insurtech', 'InsurancePros', 'smallbusiness'],
      'insurtech': ['insurtech', 'Insurance', 'fintech', 'InsurancePros', 'smallbusiness'],
      'ai': ['artificial', 'MachineLearning', 'ChatGPT', 'LocalLLaMA', 'SaaS', 'startups'],
      'agent': ['artificial', 'MachineLearning', 'ChatGPT', 'SaaS', 'customerservice', 'startups'],
      'chatbot': ['artificial', 'ChatGPT', 'customerservice', 'SaaS', 'smallbusiness'],
      'conversational': ['artificial', 'ChatGPT', 'customerservice', 'SaaS', 'smallbusiness', 'startups'],
      'saas': ['SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'B2B'],
      'consultant': ['consulting', 'Entrepreneur', 'smallbusiness'],
      'financial': ['fintech', 'personalfinance', 'FinancialPlanning', 'CFP'],
      'b2b': ['B2B', 'SaaS', 'startups', 'smallbusiness', 'Entrepreneur'],
      'enterprise': ['sysadmin', 'ITManagers', 'CIO', 'SaaS', 'startups'],
    };

    const normalizedIndustry = industry.toLowerCase();

    for (const [key, subreddits] of Object.entries(industryToSubreddits)) {
      if (normalizedIndustry.includes(key)) {
        return subreddits;
      }
    }

    // Default fallback: broader business/tech subreddits
    return ['smallbusiness', 'startups', 'SaaS', 'Entrepreneur'];
  }

  // ==========================================================================
  // PAIN POINT CONVERSATION MINING (NEW - for Conversations tab)
  // ==========================================================================

  /**
   * Mine Reddit for conversations about specific pain points
   * Uses UVP-derived keywords instead of just industry name
   *
   * @param painPointKeywords - Array of pain point phrases from UVP
   * @param industry - Industry for subreddit targeting
   */
  async mineConversations(
    painPointKeywords: string[],
    industry: string,
    options: {
      limit?: number;
      timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    } = {}
  ): Promise<RedditIntelligenceResult> {
    const { limit = 15, timeFilter = 'month' } = options;

    console.log('[RedditAPI] Mining CONVERSATIONS for pain points:', painPointKeywords.slice(0, 3));

    const allTriggers: RedditPsychologicalTrigger[] = [];
    const allInsights: RedditCustomerInsight[] = [];

    try {
      // Get relevant subreddits
      const subreddits = await this.findRelevantSubreddits(industry);

      // Search for each pain point keyword (limit to 3 for speed)
      const keywordsToSearch = painPointKeywords.slice(0, 3);

      const searchPromises = keywordsToSearch.map(async (keyword) => {
        const posts = await this.fetchRedditViaApify({
          searchQuery: keyword,
          sort: 'hot',
          timeFilter,
          limit: Math.ceil(limit / keywordsToSearch.length),
          includeComments: true,
          maxComments: 5
        });
        return { keyword, posts };
      });

      const results = await Promise.all(searchPromises);

      // Process results and tag with search keyword
      for (const { keyword, posts } of results) {
        for (const post of posts) {
          const postUrl = post.url || post.postUrl || '';
          const subreddit = post.subreddit || post.subredditName || 'unknown';
          const upvotes = post.upvotes || post.score || 0;
          const title = post.title || '';
          const body = post.text || post.selftext || '';
          const postText = `${title} ${body}`;

          // Add as conversation insight with source metadata
          allInsights.push({
            painPoint: title,
            context: body.substring(0, 500) || title,
            subreddit,
            upvotes,
            url: postUrl
          });

          // Also extract triggers
          const postContext = { subreddit, upvotes, url: postUrl };
          const triggers = this.analyzePsychologicalTriggers(postText, postContext);
          allTriggers.push(...triggers);

          // Process comments as conversations
          const comments = post.comments || [];
          for (const comment of comments) {
            if (!comment.text || comment.text === '[deleted]' || comment.text.length < 30) continue;

            allInsights.push({
              painPoint: comment.text.substring(0, 200),
              context: comment.text,
              subreddit,
              upvotes: comment.upvotes || comment.score || 0,
              url: comment.url || postUrl
            });
          }
        }
      }

      // Sort by engagement
      allInsights.sort((a, b) => b.upvotes - a.upvotes);
      allTriggers.sort((a, b) => b.upvotes - a.upvotes);

      console.log('[RedditAPI] Mined', allInsights.length, 'conversation insights');

      return {
        triggers: allTriggers,
        insights: allInsights,
        trendingTopics: [],
        metadata: {
          searchQuery: painPointKeywords.join(' | '),
          subreddits: subreddits.slice(0, 5),
          totalComments: allInsights.length,
          totalPosts: results.reduce((sum, r) => sum + r.posts.length, 0),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[RedditAPI] Conversation mining failed:', error);
      return {
        triggers: [],
        insights: [],
        trendingTopics: [],
        metadata: {
          searchQuery: painPointKeywords.join(' | '),
          subreddits: [],
          totalComments: 0,
          totalPosts: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const redditAPI = new RedditAPI();