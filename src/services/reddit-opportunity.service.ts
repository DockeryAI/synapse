/**
 * Reddit Opportunity Service
 *
 * Discovers SMB business opportunities from Reddit by:
 * - Finding problem discovery posts ("looking for", "need help")
 * - Mapping niche communities (10-20 subreddits per industry)
 * - Detecting local opportunities (city/region subreddits)
 * - Extracting content ideas from FAQs
 * - Gathering competitor intelligence
 *
 * NOT brand monitoring - focuses on opportunity discovery for SMBs
 */

import type { SpecialtyDetection } from './specialty-detection.service'
import type { IntelligenceResult } from './parallel-intelligence.service'

/**
 * Reddit opportunity type
 */
export type OpportunityType =
  | 'problem-discovery'      // Users asking for help/recommendations
  | 'local-opportunity'      // Local city/region discussions
  | 'content-idea'          // FAQ or discussion topic
  | 'competitor-intel'      // Competitor mentions/reviews
  | 'niche-community'       // Relevant subreddit discovered

/**
 * Discovered Reddit opportunity
 */
export interface RedditOpportunity {
  /** Unique identifier */
  id: string;
  /** Type of opportunity */
  type: OpportunityType;
  /** Subreddit where found */
  subreddit: string;
  /** Post/comment title */
  title: string;
  /** Post/comment content */
  content: string;
  /** Reddit post URL */
  url: string;
  /** Number of upvotes */
  upvotes: number;
  /** Number of comments */
  commentCount: number;
  /** When posted */
  postedAt: Date;
  /** Relevance score 0-100 */
  relevanceScore: number;
  /** Why this is an opportunity */
  reasoning: string;
  /** Suggested action */
  suggestedAction: string;
  /** Location if local opportunity */
  location?: string;
}

/**
 * Subreddit recommendation for a specialty
 */
export interface SubredditRecommendation {
  /** Subreddit name */
  name: string;
  /** Number of subscribers */
  subscribers: number;
  /** Why relevant to specialty */
  relevance: string;
  /** Estimated monthly posts */
  activityLevel: 'low' | 'medium' | 'high';
  /** Type of subreddit */
  category: 'industry' | 'local' | 'niche' | 'general';
}

/**
 * Aggregated Reddit intelligence
 */
export interface RedditIntelligence {
  /** All discovered opportunities */
  opportunities: RedditOpportunity[];
  /** Recommended subreddits to monitor */
  recommendedSubreddits: SubredditRecommendation[];
  /** Top FAQ topics for content ideas */
  topFAQTopics: string[];
  /** Competitor mentions found */
  competitorMentions: number;
  /** Local opportunities found */
  localOpportunities: number;
  /** Overall opportunity score 0-100 */
  opportunityScore: number;
  /** Summary of findings */
  summary: string;
}

/**
 * Reddit Opportunity Service
 *
 * Discovers business opportunities from Reddit discussions
 */
export class RedditOpportunityService {
  private readonly MAX_OPPORTUNITIES = 50
  private readonly MIN_RELEVANCE_SCORE = 60

  /**
   * Discover opportunities from Reddit for a business specialty
   *
   * @param specialty - Detected business specialty
   * @param location - Optional business location for local opportunities
   * @param intelligenceData - Optional intelligence data for context
   * @returns Reddit intelligence with opportunities and recommendations
   */
  async discoverOpportunities(
    specialty: SpecialtyDetection,
    location?: string,
    intelligenceData?: IntelligenceResult[]
  ): Promise<RedditIntelligence> {
    console.log(`🔍 Discovering Reddit opportunities for ${specialty.specialty}...`)

    // 1. Identify relevant subreddits
    const subreddits = await this.identifyRelevantSubreddits(specialty, location)
    console.log(`   Found ${subreddits.length} relevant subreddits`)

    // 2. Search for problem discovery posts
    const problemOpportunities = await this.findProblemDiscoveryPosts(
      specialty,
      subreddits
    )
    console.log(`   Found ${problemOpportunities.length} problem discovery opportunities`)

    // 3. Search for local opportunities if location provided
    let localOpportunities: RedditOpportunity[] = []
    if (location) {
      localOpportunities = await this.findLocalOpportunities(specialty, location)
      console.log(`   Found ${localOpportunities.length} local opportunities`)
    }

    // 4. Extract content ideas from FAQs
    const contentIdeas = await this.extractContentIdeas(specialty, subreddits)
    console.log(`   Found ${contentIdeas.length} content ideas`)

    // 5. Gather competitor intelligence
    const competitorOpportunities = await this.gatherCompetitorIntel(
      specialty,
      intelligenceData
    )
    console.log(`   Found ${competitorOpportunities.length} competitor mentions`)

    // 6. Aggregate all opportunities
    const allOpportunities = [
      ...problemOpportunities,
      ...localOpportunities,
      ...contentIdeas,
      ...competitorOpportunities
    ]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.MAX_OPPORTUNITIES)

    // 7. Calculate metrics
    const opportunityScore = this.calculateOpportunityScore(allOpportunities, subreddits)
    const topFAQTopics = this.extractTopFAQTopics(allOpportunities)

    const summary = this.generateSummary(
      allOpportunities,
      subreddits,
      specialty.specialty
    )

    console.log(`   ✅ Discovered ${allOpportunities.length} total opportunities`)

    return {
      opportunities: allOpportunities,
      recommendedSubreddits: subreddits,
      topFAQTopics,
      competitorMentions: competitorOpportunities.length,
      localOpportunities: localOpportunities.length,
      opportunityScore,
      summary
    }
  }

  /**
   * Identify relevant subreddits for a business specialty
   */
  private async identifyRelevantSubreddits(
    specialty: SpecialtyDetection,
    location?: string
  ): Promise<SubredditRecommendation[]> {
    const subreddits: SubredditRecommendation[] = []

    // Industry-specific subreddits
    const industrySubreddits = this.getIndustrySubreddits(specialty)
    subreddits.push(...industrySubreddits)

    // Niche specialty subreddits
    if (specialty.hasSpecialty) {
      const nicheSubreddits = this.getNicheSubreddits(specialty)
      subreddits.push(...nicheSubreddits)
    }

    // Local subreddits if location provided
    if (location) {
      const localSubreddits = this.getLocalSubreddits(location)
      subreddits.push(...localSubreddits)
    }

    // General business subreddits
    const generalSubreddits = this.getGeneralBusinessSubreddits()
    subreddits.push(...generalSubreddits)

    // Limit to top 20 most relevant
    return subreddits
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 20)
  }

  /**
   * Get industry-specific subreddits
   */
  private getIndustrySubreddits(specialty: SpecialtyDetection): SubredditRecommendation[] {
    const industry = specialty.industry.toLowerCase()
    const spec = specialty.specialty.toLowerCase()

    // Map industries to known subreddits
    const industryMap: Record<string, SubredditRecommendation[]> = {
      'health': [
        { name: 'r/Health', subscribers: 800000, relevance: 'General health discussions', activityLevel: 'high', category: 'industry' },
        { name: 'r/AskDocs', subscribers: 300000, relevance: 'Health questions and advice', activityLevel: 'high', category: 'industry' }
      ],
      'food': [
        { name: 'r/food', subscribers: 22000000, relevance: 'Food enthusiasts', activityLevel: 'high', category: 'industry' },
        { name: 'r/Cooking', subscribers: 5000000, relevance: 'Cooking discussions', activityLevel: 'high', category: 'industry' },
        { name: 'r/AskCulinary', subscribers: 500000, relevance: 'Culinary questions', activityLevel: 'medium', category: 'industry' }
      ],
      'retail': [
        { name: 'r/retail', subscribers: 100000, relevance: 'Retail industry discussions', activityLevel: 'medium', category: 'industry' }
      ],
      'professional services': [
        { name: 'r/consulting', subscribers: 150000, relevance: 'Professional consulting', activityLevel: 'medium', category: 'industry' },
        { name: 'r/freelance', subscribers: 200000, relevance: 'Freelance professionals', activityLevel: 'high', category: 'industry' }
      ]
    }

    // Find matching industry
    for (const [key, subs] of Object.entries(industryMap)) {
      if (industry.includes(key) || spec.includes(key)) {
        return subs
      }
    }

    return []
  }

  /**
   * Get niche specialty subreddits
   */
  private getNicheSubreddits(specialty: SpecialtyDetection): SubredditRecommendation[] {
    const nicheKeywords = specialty.nicheKeywords.join(' ').toLowerCase()
    const subreddits: SubredditRecommendation[] = []

    // Niche keyword to subreddit mappings
    const nicheMap: Record<string, SubredditRecommendation> = {
      'wedding': { name: 'r/weddingplanning', subscribers: 400000, relevance: 'Wedding planning community', activityLevel: 'high', category: 'niche' },
      'vegan': { name: 'r/vegan', subscribers: 1000000, relevance: 'Vegan lifestyle', activityLevel: 'high', category: 'niche' },
      'luxury': { name: 'r/luxury', subscribers: 50000, relevance: 'Luxury goods and services', activityLevel: 'medium', category: 'niche' },
      'organic': { name: 'r/organic', subscribers: 30000, relevance: 'Organic products', activityLevel: 'low', category: 'niche' },
      'pediatric': { name: 'r/Parenting', subscribers: 3000000, relevance: 'Parents community', activityLevel: 'high', category: 'niche' }
    }

    // Find matching niches
    for (const [keyword, sub] of Object.entries(nicheMap)) {
      if (nicheKeywords.includes(keyword)) {
        subreddits.push(sub)
      }
    }

    return subreddits
  }

  /**
   * Get local city/region subreddits
   */
  private getLocalSubreddits(location: string): SubredditRecommendation[] {
    const loc = location.toLowerCase().replace(/[^a-z\s]/g, '')
    const subreddits: SubredditRecommendation[] = []

    // Major cities
    const cityMap: Record<string, SubredditRecommendation> = {
      'new york': { name: 'r/nyc', subscribers: 500000, relevance: 'NYC local community', activityLevel: 'high', category: 'local' },
      'los angeles': { name: 'r/LosAngeles', subscribers: 400000, relevance: 'LA local community', activityLevel: 'high', category: 'local' },
      'chicago': { name: 'r/chicago', subscribers: 300000, relevance: 'Chicago local community', activityLevel: 'high', category: 'local' },
      'san francisco': { name: 'r/sanfrancisco', subscribers: 250000, relevance: 'SF local community', activityLevel: 'high', category: 'local' },
      'seattle': { name: 'r/Seattle', subscribers: 300000, relevance: 'Seattle local community', activityLevel: 'high', category: 'local' },
      'boston': { name: 'r/boston', subscribers: 250000, relevance: 'Boston local community', activityLevel: 'high', category: 'local' },
      'austin': { name: 'r/Austin', subscribers: 200000, relevance: 'Austin local community', activityLevel: 'high', category: 'local' }
    }

    // Find matching city
    for (const [city, sub] of Object.entries(cityMap)) {
      if (loc.includes(city)) {
        subreddits.push(sub)
      }
    }

    return subreddits
  }

  /**
   * Get general business subreddits
   */
  private getGeneralBusinessSubreddits(): SubredditRecommendation[] {
    return [
      { name: 'r/smallbusiness', subscribers: 1000000, relevance: 'Small business owners', activityLevel: 'high', category: 'general' },
      { name: 'r/Entrepreneur', subscribers: 2000000, relevance: 'Entrepreneurs and startups', activityLevel: 'high', category: 'general' },
      { name: 'r/marketing', subscribers: 800000, relevance: 'Marketing discussions', activityLevel: 'high', category: 'general' }
    ]
  }

  /**
   * Find problem discovery posts (users asking for help/recommendations)
   */
  private async findProblemDiscoveryPosts(
    specialty: SpecialtyDetection,
    subreddits: SubredditRecommendation[]
  ): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = []

    // Problem discovery keywords
    const problemKeywords = [
      'looking for',
      'need help',
      'recommendations',
      'advice needed',
      'where can i find',
      'best place for',
      'anyone know',
      'help me find'
    ]

    // Simulate Reddit search results
    // In production, this would use Reddit API
    const mockProblems = this.generateMockProblemPosts(specialty, subreddits, problemKeywords)

    for (const post of mockProblems) {
      const relevanceScore = this.calculateRelevanceScore(post, specialty)

      if (relevanceScore >= this.MIN_RELEVANCE_SCORE) {
        opportunities.push({
          id: `reddit-${post.id}`,
          type: 'problem-discovery',
          subreddit: post.subreddit,
          title: post.title,
          content: post.content,
          url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
          upvotes: post.upvotes,
          commentCount: post.commentCount,
          postedAt: post.postedAt,
          relevanceScore,
          reasoning: `User actively seeking ${specialty.specialty} services`,
          suggestedAction: 'Engage with helpful advice and subtle service mention'
        })
      }
    }

    return opportunities
  }

  /**
   * Find local opportunities in city/region subreddits
   */
  private async findLocalOpportunities(
    specialty: SpecialtyDetection,
    location: string
  ): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = []
    const localSubreddits = this.getLocalSubreddits(location)

    // Simulate local Reddit posts
    const mockLocalPosts = this.generateMockLocalPosts(specialty, location, localSubreddits)

    for (const post of mockLocalPosts) {
      const relevanceScore = this.calculateRelevanceScore(post, specialty)

      if (relevanceScore >= this.MIN_RELEVANCE_SCORE) {
        opportunities.push({
          id: `reddit-local-${post.id}`,
          type: 'local-opportunity',
          subreddit: post.subreddit,
          title: post.title,
          content: post.content,
          url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
          upvotes: post.upvotes,
          commentCount: post.commentCount,
          postedAt: post.postedAt,
          relevanceScore,
          reasoning: `Local ${location} user seeking ${specialty.specialty}`,
          suggestedAction: 'Respond as local business with personalized recommendation',
          location
        })
      }
    }

    return opportunities
  }

  /**
   * Extract content ideas from FAQ posts
   */
  private async extractContentIdeas(
    specialty: SpecialtyDetection,
    subreddits: SubredditRecommendation[]
  ): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = []

    // Simulate FAQ/common question posts
    const mockFAQPosts = this.generateMockFAQPosts(specialty, subreddits)

    for (const post of mockFAQPosts) {
      opportunities.push({
        id: `reddit-faq-${post.id}`,
        type: 'content-idea',
        subreddit: post.subreddit,
        title: post.title,
        content: post.content,
        url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
        upvotes: post.upvotes,
        commentCount: post.commentCount,
        postedAt: post.postedAt,
        relevanceScore: 75,
        reasoning: 'Common question that could become educational content',
        suggestedAction: 'Create blog post or social content addressing this FAQ'
      })
    }

    return opportunities
  }

  /**
   * Gather competitor intelligence from Reddit
   */
  private async gatherCompetitorIntel(
    specialty: SpecialtyDetection,
    intelligenceData?: IntelligenceResult[]
  ): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = []

    // Extract competitor names from intelligence data
    const competitors = this.extractCompetitorNames(intelligenceData)

    // Simulate competitor mention posts
    if (competitors.length > 0) {
      const mockCompetitorPosts = this.generateMockCompetitorPosts(specialty, competitors)

      for (const post of mockCompetitorPosts) {
        opportunities.push({
          id: `reddit-competitor-${post.id}`,
          type: 'competitor-intel',
          subreddit: post.subreddit,
          title: post.title,
          content: post.content,
          url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
          upvotes: post.upvotes,
          commentCount: post.commentCount,
          postedAt: post.postedAt,
          relevanceScore: 70,
          reasoning: 'Competitor mentioned - opportunity to learn or differentiate',
          suggestedAction: 'Monitor for service gaps or customer pain points'
        })
      }
    }

    return opportunities
  }

  /**
   * Calculate relevance score for a post
   */
  private calculateRelevanceScore(post: any, specialty: SpecialtyDetection): number {
    let score = 50 // Base score

    const text = `${post.title} ${post.content}`.toLowerCase()
    const spec = specialty.specialty.toLowerCase()
    const keywords = specialty.nicheKeywords.map(k => k.toLowerCase())

    // Bonus for specialty match
    if (text.includes(spec)) score += 20

    // Bonus for niche keywords
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10
    })

    // Bonus for engagement
    if (post.upvotes > 10) score += 10
    if (post.commentCount > 5) score += 10

    return Math.min(score, 100)
  }

  /**
   * Calculate overall opportunity score
   */
  private calculateOpportunityScore(
    opportunities: RedditOpportunity[],
    subreddits: SubredditRecommendation[]
  ): number {
    if (opportunities.length === 0) return 0

    let score = 0

    // Base score from opportunity count
    score += Math.min(opportunities.length * 2, 40)

    // Bonus for high-quality opportunities
    const highQuality = opportunities.filter(o => o.relevanceScore >= 80).length
    score += Math.min(highQuality * 5, 30)

    // Bonus for variety of opportunity types
    const types = new Set(opportunities.map(o => o.type))
    score += types.size * 5

    // Bonus for active subreddits
    const activeSubreddits = subreddits.filter(s => s.activityLevel === 'high').length
    score += Math.min(activeSubreddits * 3, 15)

    return Math.min(score, 100)
  }

  /**
   * Extract top FAQ topics for content ideas
   */
  private extractTopFAQTopics(opportunities: RedditOpportunity[]): string[] {
    return opportunities
      .filter(o => o.type === 'content-idea')
      .map(o => o.title)
      .slice(0, 10)
  }

  /**
   * Generate summary of Reddit findings
   */
  private generateSummary(
    opportunities: RedditOpportunity[],
    subreddits: SubredditRecommendation[],
    specialty: string
  ): string {
    const problemCount = opportunities.filter(o => o.type === 'problem-discovery').length
    const localCount = opportunities.filter(o => o.type === 'local-opportunity').length
    const contentCount = opportunities.filter(o => o.type === 'content-idea').length

    return `Found ${opportunities.length} opportunities across ${subreddits.length} subreddits for ${specialty}. ` +
      `Includes ${problemCount} problem discovery posts, ${localCount} local opportunities, and ${contentCount} content ideas.`
  }

  /**
   * Extract competitor names from intelligence data
   */
  private extractCompetitorNames(intelligenceData?: IntelligenceResult[]): string[] {
    // This would extract competitor names from intelligence sources
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Generate mock problem discovery posts (placeholder for Reddit API)
   */
  private generateMockProblemPosts(
    specialty: SpecialtyDetection,
    subreddits: SubredditRecommendation[],
    keywords: string[]
  ): any[] {
    // In production, this would use Reddit API
    // For now, return placeholder structure
    return []
  }

  /**
   * Generate mock local posts (placeholder for Reddit API)
   */
  private generateMockLocalPosts(
    specialty: SpecialtyDetection,
    location: string,
    subreddits: SubredditRecommendation[]
  ): any[] {
    // In production, this would use Reddit API
    return []
  }

  /**
   * Generate mock FAQ posts (placeholder for Reddit API)
   */
  private generateMockFAQPosts(
    specialty: SpecialtyDetection,
    subreddits: SubredditRecommendation[]
  ): any[] {
    // In production, this would use Reddit API
    return []
  }

  /**
   * Generate mock competitor posts (placeholder for Reddit API)
   */
  private generateMockCompetitorPosts(
    specialty: SpecialtyDetection,
    competitors: string[]
  ): any[] {
    // In production, this would use Reddit API
    return []
  }
}

// Export singleton
export const redditOpportunityService = new RedditOpportunityService()
