/**
 * Apify Social Media Scraper Service
 *
 * Comprehensive social media scrapers for psychological trigger enrichment:
 * - Twitter/X: Real-time sentiment, trending pain points, viral discussions
 * - Quora: Deep questions revealing desires/fears, top answers, engagement metrics
 * - LinkedIn: B2B decision-maker posts (uses Perplexity+Serper fallback - no cookies needed)
 * - TrustPilot: Enterprise buyer reviews, feature requests, satisfaction patterns
 * - G2: B2B software reviews, buyer intent signals, competitive intelligence
 *
 * Security: All API calls go through Supabase Edge Function
 * No VITE_ prefix keys - Edge Function secrets only
 */

import { getLinkedInAlternativeInsights, needsLinkedInData } from './linkedin-alternative.service'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Psychological trigger categories
export interface PsychologicalTrigger {
  type: 'desire' | 'fear' | 'frustration' | 'aspiration' | 'pain-point'
  text: string
  intensity: number // 0-1
  frequency: number
  context: string
  source: string
}

export interface TwitterSentiment {
  tweets: Array<{
    text: string
    likes: number
    retweets: number
    replies: number
    sentiment: 'positive' | 'negative' | 'neutral'
    author: string
    timestamp: string
    engagement_rate: number
  }>
  trending_topics: string[]
  pain_points: PsychologicalTrigger[]
  viral_discussions: Array<{
    topic: string
    volume: number
    sentiment: string
    key_phrases: string[]
  }>
  overall_sentiment: {
    positive: number
    negative: number
    neutral: number
  }
}

export interface QuoraInsights {
  questions: Array<{
    question: string
    upvotes: number
    followers: number
    answers_count: number
    url: string
    topics: string[]
    psychological_category: 'desire' | 'fear' | 'uncertainty' | 'problem'
  }>
  top_answers: Array<{
    answer: string
    upvotes: number
    author_credentials: string
    question: string
    key_insights: string[]
  }>
  desires: PsychologicalTrigger[]
  fears: PsychologicalTrigger[]
  engagement_metrics: {
    avg_upvotes: number
    avg_answers: number
    total_followers: number
  }
}

export interface LinkedInB2BInsights {
  company_posts: Array<{
    text: string
    likes: number
    comments: number
    shares: number
    author_title: string
    engagement_rate: number
    topics: string[]
  }>
  decision_maker_posts: Array<{
    text: string
    author: string
    title: string
    company: string
    engagement: number
    pain_points: string[]
  }>
  professional_pain_points: PsychologicalTrigger[]
  trending_topics: string[]
  buyer_intent_signals: Array<{
    signal: string
    strength: number
    context: string
  }>
}

export interface TrustPilotReviews {
  reviews: Array<{
    title: string
    text: string
    rating: number
    date: string
    verified: boolean
    helpful_count: number
    company: string
  }>
  feature_requests: Array<{
    feature: string
    demand: number
    sentiment: string
  }>
  satisfaction_patterns: {
    common_praises: string[]
    common_complaints: string[]
    deal_breakers: string[]
    wow_factors: string[]
  }
  psychological_triggers: PsychologicalTrigger[]
  overall_rating: number
  total_reviews: number
}

export interface G2Reviews {
  reviews: Array<{
    title: string
    text: string
    rating: number
    pros: string
    cons: string
    user_role: string
    company_size: string
    industry: string
    date: string
  }>
  buyer_intent_signals: Array<{
    signal: string
    category: 'evaluation' | 'consideration' | 'decision'
    strength: number
  }>
  feature_requests: Array<{
    feature: string
    requested_by: number
    priority: 'high' | 'medium' | 'low'
  }>
  competitive_intelligence: {
    alternatives_mentioned: string[]
    switching_reasons: string[]
    retention_factors: string[]
  }
  psychological_triggers: PsychologicalTrigger[]
  enterprise_insights: {
    avg_rating: number
    total_reviews: number
    recommendation_rate: number
  }
}

// ITEM #13: Yelp reviews interface for SMB Local businesses
export interface YelpReviews {
  reviews: Array<{
    text: string
    rating: number
    date: string
    user_name: string
    user_location: string
    photos: string[]
    useful_count: number
    funny_count: number
    cool_count: number
    is_elite: boolean
  }>
  business_info: {
    name: string
    rating: number
    review_count: number
    categories: string[]
    price_range: string
    address: string
    phone: string
  }
  tips: Array<{
    text: string
    likes: number
    user_name: string
  }>
  popular_dishes: string[]
  satisfaction_patterns: {
    common_praises: string[]
    common_complaints: string[]
    what_to_order: string[]
    ambiance_notes: string[]
  }
  psychological_triggers: PsychologicalTrigger[]
}

class ApifySocialScraperService {
  /**
   * Run Apify social scraper through Edge Function
   */
  private async runSocialScraper(scraperType: string, input: any): Promise<any> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration not found')
    }

    try {
      console.log(`[Apify Social] Starting ${scraperType} scraper...`)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/apify-scraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actorId: 'placeholder', // Required field, overridden by scraperType
          scraperType,
          input
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`${scraperType} scraper failed: ${error}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        console.log(`[Apify Social] ${scraperType} completed: ${result.data.length} results`)
        return result.data
      } else {
        throw new Error(result.error || 'Scraper failed')
      }
    } catch (error) {
      console.error(`[Apify Social] ${scraperType} error:`, error)
      throw error
    }
  }

  /**
   * Extract psychological triggers from text content
   */
  private extractPsychologicalTriggers(
    texts: string[],
    source: string
  ): PsychologicalTrigger[] {
    const triggers: PsychologicalTrigger[] = []

    // Fear patterns
    const fearPatterns = [
      /afraid of|scared|worry|concerned|anxious|nervous|hesitant/gi,
      /risk|danger|threat|vulnerable|insecure/gi,
      /can't afford|too expensive|overpriced/gi,
      /waste of (money|time)|regret/gi,
      /scam|fraud|rip-off|misleading/gi
    ]

    // Desire patterns
    const desirePatterns = [
      /want|need|looking for|searching for|wish/gi,
      /dream|hope|aspire|goal/gi,
      /better|improve|enhance|upgrade/gi,
      /easy|simple|convenient|fast/gi,
      /save (time|money)|efficiency/gi
    ]

    // Frustration patterns
    const frustrationPatterns = [
      /frustrated|annoyed|irritated|upset/gi,
      /difficult|hard|complicated|confusing/gi,
      /doesn't work|broken|buggy|glitchy/gi,
      /poor|bad|terrible|awful|horrible/gi,
      /slow|sluggish|unresponsive/gi
    ]

    // Pain point patterns
    const painPointPatterns = [
      /problem|issue|trouble|struggle/gi,
      /pain|hurts|suffering/gi,
      /challenge|obstacle|barrier/gi,
      /lacking|missing|need more/gi,
      /limited|restricted|can't/gi
    ]

    texts.forEach(text => {
      if (!text) return

      // Check fear triggers
      fearPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          triggers.push({
            type: 'fear',
            text: matches[0],
            intensity: matches.length / text.split(' ').length,
            frequency: matches.length,
            context: text.slice(0, 200),
            source
          })
        }
      })

      // Check desire triggers
      desirePatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          triggers.push({
            type: 'desire',
            text: matches[0],
            intensity: matches.length / text.split(' ').length,
            frequency: matches.length,
            context: text.slice(0, 200),
            source
          })
        }
      })

      // Check frustration triggers
      frustrationPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          triggers.push({
            type: 'frustration',
            text: matches[0],
            intensity: matches.length / text.split(' ').length,
            frequency: matches.length,
            context: text.slice(0, 200),
            source
          })
        }
      })

      // Check pain point triggers
      painPointPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          triggers.push({
            type: 'pain-point',
            text: matches[0],
            intensity: matches.length / text.split(' ').length,
            frequency: matches.length,
            context: text.slice(0, 200),
            source
          })
        }
      })
    })

    // Sort by intensity and deduplicate
    return triggers
      .sort((a, b) => b.intensity - a.intensity)
      .filter((trigger, index, self) =>
        index === self.findIndex(t => t.text.toLowerCase() === trigger.text.toLowerCase())
      )
      .slice(0, 20) // Top 20 triggers
  }

  /**
   * Scrape Twitter/X for real-time sentiment and viral discussions
   */
  async scrapeTwitterSentiment(keywords: string[], limit: number = 20): Promise<TwitterSentiment> {
    try {
      // Build search queries for apidojo/tweet-scraper actor
      // This actor expects 'searchTerms' as array of search strings
      // Reduce to 3 keywords to speed up
      const searchQueries = keywords.slice(0, 3).map(kw => kw.trim())

      const results = await this.runSocialScraper('TWITTER', {
        searchTerms: searchQueries,
        maxTweets: 75, // Increased for more data points
        addUserInfo: true,
        scrapeTweetReplies: false,
        // Actor-specific settings for better results
        tweetsDesired: 75,
        proxyConfiguration: { useApifyProxy: true }
      })

      const tweets = results.map((tweet: any) => ({
        text: tweet.text || '',
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        sentiment: this.analyzeSentiment(tweet.text || ''),
        author: tweet.author?.userName || '',
        timestamp: tweet.createdAt || new Date().toISOString(),
        engagement_rate: this.calculateEngagementRate(tweet)
      }))

      const allTexts = tweets.map(t => t.text)
      const pain_points = this.extractPsychologicalTriggers(allTexts, 'Twitter')

      const sentimentCounts = tweets.reduce(
        (acc, tweet) => {
          acc[tweet.sentiment]++
          return acc
        },
        { positive: 0, negative: 0, neutral: 0 }
      )

      const total = tweets.length || 1
      const overall_sentiment = {
        positive: sentimentCounts.positive / total,
        negative: sentimentCounts.negative / total,
        neutral: sentimentCounts.neutral / total
      }

      const trending_topics = this.extractTrendingTopics(allTexts)
      const viral_discussions = this.identifyViralDiscussions(tweets)

      return {
        tweets,
        trending_topics,
        pain_points,
        viral_discussions,
        overall_sentiment
      }
    } catch (error) {
      console.error('[Apify Social] Twitter scraping error:', error)
      throw error
    }
  }

  /**
   * Scrape Quora for deep questions revealing desires and fears
   * V3: Added retry logic with exponential backoff + Serper fallback
   */
  async scrapeQuoraInsights(keywords: string[], limit: number = 10): Promise<QuoraInsights> {
    // V3: Try Apify first with retry, then fallback to Serper
    let results: any[] = [];
    let apifyFailed = false;

    // Attempt 1: Try Apify with retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Apify Social] Quora attempt ${attempt}/2...`);

        // Build Quora search URLs for the generic web-scraper
        // Use only 2 keywords to reduce crawl time
        const startUrls = keywords.slice(0, 2).map(kw => ({
          url: `https://www.quora.com/search?q=${encodeURIComponent(kw)}`
        }));

        results = await this.runSocialScraper('QUORA', {
          startUrls,
          maxRequestsPerCrawl: 50,
          maxCrawlDepth: 2,
          pageFunction: `async function pageFunction(context) {
            const { $, request } = context;
            const questions = [];
            $('div[class*="Question"]').each((i, el) => {
              questions.push({
                question: $(el).find('span[class*="QuestionText"]').text().trim(),
                url: request.url
              });
            });
            return questions;
          }`
        });

        if (results && results.length > 0) {
          console.log(`[Apify Social] Quora succeeded with ${results.length} results`);
          break; // Success, exit retry loop
        }
      } catch (error) {
        console.warn(`[Apify Social] Quora attempt ${attempt} failed:`, error);
        if (attempt < 2) {
          // Exponential backoff: wait 2^attempt seconds
          const waitMs = Math.pow(2, attempt) * 1000;
          console.log(`[Apify Social] Waiting ${waitMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        } else {
          apifyFailed = true;
        }
      }
    }

    // V3: Fallback to Serper site:quora.com search if Apify fails
    if (apifyFailed || !results || results.length === 0) {
      console.log('[Apify Social] Quora Apify failed, using Serper site:quora.com fallback...');
      try {
        results = await this.fetchQuoraViaSerper(keywords);
        console.log(`[Apify Social] Serper Quora fallback returned ${results.length} results`);
      } catch (serperError) {
        console.error('[Apify Social] Serper Quora fallback also failed:', serperError);
        // Return empty results instead of throwing
        return this.getEmptyQuoraInsights();
      }
    }

    try {

      const questions = results.map((item: any) => {
        const psychCategory = this.categorizeQuestion(item.question || '')
        return {
          question: item.question || '',
          upvotes: item.upvotes || 0,
          followers: item.followers || 0,
          answers_count: item.answersCount || 0,
          url: item.url || '',
          topics: item.topics || [],
          psychological_category: psychCategory
        }
      })

      const top_answers = results
        .flatMap((item: any) => (item.answers || []).slice(0, 2))
        .map((answer: any) => ({
          answer: answer.text || '',
          upvotes: answer.upvotes || 0,
          author_credentials: answer.author?.credentials || '',
          question: answer.question || '',
          key_insights: this.extractKeyInsights(answer.text || '')
        }))
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 10)

      const allQuestions = questions.map(q => q.question)
      const allAnswers = top_answers.map(a => a.answer)
      const allTexts = [...allQuestions, ...allAnswers]

      const desires = this.extractPsychologicalTriggers(allTexts, 'Quora')
        .filter(t => t.type === 'desire')

      const fears = this.extractPsychologicalTriggers(allTexts, 'Quora')
        .filter(t => t.type === 'fear')

      const engagement_metrics = {
        avg_upvotes: questions.reduce((sum, q) => sum + q.upvotes, 0) / (questions.length || 1),
        avg_answers: questions.reduce((sum, q) => sum + q.answers_count, 0) / (questions.length || 1),
        total_followers: questions.reduce((sum, q) => sum + q.followers, 0)
      }

      return {
        questions,
        top_answers,
        desires,
        fears,
        engagement_metrics
      }
    } catch (error) {
      console.error('[Apify Social] Quora scraping error:', error)
      return this.getEmptyQuoraInsights();
    }
  }

  /**
   * V3: Fetch Quora data via Serper site:quora.com search as fallback
   */
  private async fetchQuoraViaSerper(keywords: string[]): Promise<any[]> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase config missing for Serper fallback');
    }

    const results: any[] = [];

    // Search Quora via Serper for each keyword
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/serper-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: `site:quora.com ${keyword}`,
            num: 10
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        const organic = data.organic || [];

        // Convert Serper results to Quora format
        for (const result of organic) {
          if (result.link?.includes('quora.com')) {
            results.push({
              question: result.title?.replace(' - Quora', '').trim() || '',
              url: result.link,
              snippet: result.snippet || '',
              upvotes: 0, // Not available from Serper
              followers: 0,
              answersCount: 0
            });
          }
        }
      } catch (e) {
        console.warn(`[Apify Social] Serper Quora search failed for "${keyword}":`, e);
      }
    }

    return results;
  }

  /**
   * V3: Return empty QuoraInsights structure when all methods fail
   */
  private getEmptyQuoraInsights(): QuoraInsights {
    return {
      questions: [],
      top_answers: [],
      desires: [],
      fears: [],
      engagement_metrics: {
        avg_upvotes: 0,
        avg_answers: 0,
        total_followers: 0
      }
    };
  }

  /**
   * Get LinkedIn B2B insights
   *
   * Uses Perplexity + Serper as primary method (no cookies/proxy needed).
   * LinkedIn's direct scraper requires session cookies which is impractical.
   *
   * @param companyName - Company to research
   * @param industry - Industry for context
   * @param businessType - Optional business type for smarter routing
   */
  async scrapeLinkedInB2B(
    companyName: string,
    industry: string,
    businessType?: string
  ): Promise<LinkedInB2BInsights> {
    // Check if this business type even needs LinkedIn data
    if (businessType && !needsLinkedInData(businessType)) {
      console.log(`[Apify Social] Skipping LinkedIn for B2C business: ${businessType}`)
      return {
        company_posts: [],
        decision_maker_posts: [],
        professional_pain_points: [],
        trending_topics: [],
        buyer_intent_signals: []
      }
    }

    try {
      console.log(`[Apify Social] Getting LinkedIn insights via Perplexity+Serper for: ${companyName}`)

      // Use the alternative service (Perplexity + Serper)
      // This gives us 70% of LinkedIn value without cookies/proxies
      const insights = await getLinkedInAlternativeInsights(companyName, industry)

      console.log(`[Apify Social] LinkedIn alternative returned ${insights.company_posts.length} posts, ${insights.decision_maker_posts.length} decision makers`)

      return insights
    } catch (error) {
      console.error('[Apify Social] LinkedIn alternative error:', error)
      // Return empty on error rather than crashing
      return {
        company_posts: [],
        decision_maker_posts: [],
        professional_pain_points: [],
        trending_topics: [],
        buyer_intent_signals: []
      }
    }
  }

  /**
   * Scrape TrustPilot for enterprise buyer reviews and satisfaction patterns
   */
  async scrapeTrustPilotReviews(
    companyName: string,
    limit: number = 10
  ): Promise<TrustPilotReviews> {
    try {
      // Build TrustPilot URL for the generic web-scraper
      // Try common domain patterns for TrustPilot company pages
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      // Only use 1 URL to reduce crawl time
      const startUrls = [
        { url: `https://www.trustpilot.com/review/${slug}.com` }
      ]

      const results = await this.runSocialScraper('TRUSTPILOT', {
        startUrls,
        maxRequestsPerCrawl: 50, // Increased for more reviews
        maxCrawlDepth: 2,
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const reviews = [];
          $('article[class*="review"], div[class*="ReviewCard"]').each((i, el) => {
            reviews.push({
              title: $(el).find('h2, [class*="title"]').text().trim(),
              text: $(el).find('p[class*="text"], [class*="content"]').text().trim(),
              rating: parseInt($(el).find('[data-rating], img[alt*="star"]').attr('data-rating') || '0'),
              date: $(el).find('time, [class*="date"]').attr('datetime') || new Date().toISOString()
            });
          });
          return reviews;
        }`
      })

      const reviews = results.map((review: any) => ({
        title: review.title || '',
        text: review.text || '',
        rating: review.rating || 0,
        date: review.date || new Date().toISOString(),
        verified: review.verified || false,
        helpful_count: review.helpfulCount || 0,
        company: companyName
      }))

      // Extract feature requests (mentioned improvements)
      const feature_requests = this.extractFeatureRequests(
        reviews.map(r => r.text)
      )

      // Analyze satisfaction patterns
      const positiveReviews = reviews.filter(r => r.rating >= 4)
      const negativeReviews = reviews.filter(r => r.rating <= 2)

      const satisfaction_patterns = {
        common_praises: this.extractCommonThemes(positiveReviews.map(r => r.text), 'positive'),
        common_complaints: this.extractCommonThemes(negativeReviews.map(r => r.text), 'negative'),
        deal_breakers: this.extractDealBreakers(negativeReviews.map(r => r.text)),
        wow_factors: this.extractWowFactors(positiveReviews.map(r => r.text))
      }

      const psychological_triggers = this.extractPsychologicalTriggers(
        reviews.map(r => r.text),
        'TrustPilot'
      )

      const overall_rating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)

      return {
        reviews,
        feature_requests,
        satisfaction_patterns,
        psychological_triggers,
        overall_rating,
        total_reviews: reviews.length
      }
    } catch (error) {
      console.error('[Apify Social] TrustPilot scraping error:', error)
      throw error
    }
  }

  /**
   * Scrape G2 for B2B software reviews and buyer intent
   */
  async scrapeG2Reviews(
    productName: string,
    category: string,
    limit: number = 10
  ): Promise<G2Reviews> {
    try {
      // Build G2 URL for the generic web-scraper
      const slug = productName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      // Only use 1 URL to reduce crawl time
      const startUrls = [
        { url: `https://www.g2.com/products/${slug}/reviews` }
      ]

      const results = await this.runSocialScraper('G2', {
        startUrls,
        maxRequestsPerCrawl: 50, // Increased for more reviews
        maxCrawlDepth: 2,
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const reviews = [];
          $('div[class*="review"], article[class*="Review"]').each((i, el) => {
            reviews.push({
              title: $(el).find('h3, [class*="title"]').text().trim(),
              text: $(el).find('[class*="body"], [class*="content"]').text().trim(),
              pros: $(el).find('[class*="pros"], [class*="like"]').text().trim(),
              cons: $(el).find('[class*="cons"], [class*="dislike"]').text().trim(),
              rating: parseFloat($(el).find('[class*="rating"], [class*="stars"]').attr('data-rating') || '0'),
              userRole: $(el).find('[class*="role"], [class*="title"]').first().text().trim()
            });
          });
          return reviews;
        }`
      })

      const reviews = results.map((review: any) => ({
        title: review.title || '',
        text: review.text || review.reviewText || '',
        rating: review.rating || 0,
        pros: review.pros || '',
        cons: review.cons || '',
        user_role: review.userRole || review.role || '',
        company_size: review.companySize || '',
        industry: review.industry || '',
        date: review.date || new Date().toISOString()
      }))

      const buyer_intent_signals = this.extractG2BuyerIntent(reviews)

      const feature_requests = this.extractFeatureRequests(
        reviews.map(r => `${r.cons} ${r.text}`)
      )

      const competitive_intelligence = {
        alternatives_mentioned: this.extractAlternatives(reviews.map(r => r.text)),
        switching_reasons: this.extractSwitchingReasons(reviews.map(r => r.text)),
        retention_factors: this.extractRetentionFactors(reviews.map(r => r.pros))
      }

      const psychological_triggers = this.extractPsychologicalTriggers(
        reviews.map(r => `${r.text} ${r.pros} ${r.cons}`),
        'G2'
      )

      const total_reviews = reviews.length
      const avg_rating = reviews.reduce((sum, r) => sum + r.rating, 0) / (total_reviews || 1)
      const recommendation_rate = reviews.filter(r => r.rating >= 4).length / (total_reviews || 1)

      return {
        reviews,
        buyer_intent_signals,
        feature_requests,
        competitive_intelligence,
        psychological_triggers,
        enterprise_insights: {
          avg_rating,
          total_reviews,
          recommendation_rate
        }
      }
    } catch (error) {
      console.error('[Apify Social] G2 scraping error:', error)
      throw error
    }
  }

  /**
   * ITEM #13: Scrape Yelp reviews for SMB Local businesses
   * Extracts reviews, tips, popular items, and sentiment patterns
   */
  async scrapeYelpReviews(businessName: string, location: string, limit: number = 30): Promise<YelpReviews> {
    console.log(`[Apify Social] Scraping Yelp for: ${businessName} in ${location}`)

    try {
      const rawData = await this.runSocialScraper('YELP', {
        searchTerms: [businessName],
        location: location,
        maxItems: limit,
        includeReviews: true,
        reviewsLimit: limit
      })

      // Transform raw Yelp data
      const business = rawData[0] || {}
      const reviews = (business.reviews || rawData).map((r: any) => ({
        text: r.text || r.comment || '',
        rating: r.rating || r.stars || 3,
        date: r.date || r.time || new Date().toISOString(),
        user_name: r.user?.name || r.author || 'Anonymous',
        user_location: r.user?.location || '',
        photos: r.photos || [],
        useful_count: r.useful || r.usefulCount || 0,
        funny_count: r.funny || r.funnyCount || 0,
        cool_count: r.cool || r.coolCount || 0,
        is_elite: r.user?.isElite || false
      }))

      // Extract business info
      const business_info = {
        name: business.name || businessName,
        rating: business.rating || 0,
        review_count: business.reviewCount || reviews.length,
        categories: business.categories || [],
        price_range: business.price || '',
        address: business.address || location,
        phone: business.phone || ''
      }

      // Extract tips
      const tips = (business.tips || []).map((t: any) => ({
        text: t.text || '',
        likes: t.likes || t.complimentCount || 0,
        user_name: t.user?.name || 'Anonymous'
      }))

      // Extract popular dishes/items from reviews
      const popular_dishes = this.extractPopularItems(reviews.map((r: any) => r.text))

      // Build satisfaction patterns
      const reviewTexts = reviews.map((r: any) => r.text)
      const highRatedReviews = reviews.filter((r: any) => r.rating >= 4).map((r: any) => r.text)
      const lowRatedReviews = reviews.filter((r: any) => r.rating <= 2).map((r: any) => r.text)

      const satisfaction_patterns = {
        common_praises: this.extractCommonThemes(highRatedReviews, 'positive'),
        common_complaints: this.extractCommonThemes(lowRatedReviews, 'negative'),
        what_to_order: popular_dishes,
        ambiance_notes: this.extractAmbianceNotes(reviewTexts)
      }

      // Extract psychological triggers
      const psychological_triggers = this.extractPsychologicalTriggers(reviewTexts, 'Yelp')

      console.log(`[Apify Social] Yelp: Found ${reviews.length} reviews, ${tips.length} tips`)

      return {
        reviews,
        business_info,
        tips,
        popular_dishes,
        satisfaction_patterns,
        psychological_triggers
      }
    } catch (error) {
      console.error('[Apify Social] Yelp scraping error:', error)
      throw error
    }
  }

  /**
   * Extract popular items/dishes mentioned in reviews
   */
  private extractPopularItems(texts: string[]): string[] {
    const itemPatterns = [
      /try the (.+?)(?:\.|,|!|$)/gi,
      /order the (.+?)(?:\.|,|!|$)/gi,
      /get the (.+?)(?:\.|,|!|$)/gi,
      /recommend the (.+?)(?:\.|,|!|$)/gi,
      /best (.+?) i've/gi,
      /amazing (.+?)(?:\.|,|!|$)/gi
    ]

    const items = new Map<string, number>()

    texts.forEach(text => {
      itemPatterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(text)) !== null) {
          const item = match[1]?.trim().toLowerCase()
          if (item && item.length > 2 && item.length < 50) {
            items.set(item, (items.get(item) || 0) + 1)
          }
        }
      })
    })

    return Array.from(items.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([item]) => item)
  }

  /**
   * Extract ambiance and atmosphere notes from reviews
   */
  private extractAmbianceNotes(texts: string[]): string[] {
    const ambianceKeywords = [
      'atmosphere', 'ambiance', 'vibe', 'decor', 'cozy', 'romantic',
      'loud', 'quiet', 'crowded', 'spacious', 'clean', 'dirty',
      'lighting', 'music', 'outdoor', 'patio', 'seating'
    ]

    const notes: string[] = []

    texts.forEach(text => {
      const lowerText = text.toLowerCase()
      ambianceKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          // Extract sentence containing the keyword
          const sentences = text.split(/[.!?]/)
          const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword))
          if (relevantSentence && relevantSentence.trim().length > 10) {
            notes.push(relevantSentence.trim().slice(0, 150))
          }
        }
      })
    })

    // Remove duplicates and limit
    return [...new Set(notes)].slice(0, 5)
  }

  // Helper methods for analysis

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = /good|great|awesome|excellent|love|best|perfect|amazing|fantastic/gi
    const negativeWords = /bad|terrible|awful|hate|worst|poor|horrible|disappointing/gi

    const positiveMatches = (text.match(positiveWords) || []).length
    const negativeMatches = (text.match(negativeWords) || []).length

    if (positiveMatches > negativeMatches) return 'positive'
    if (negativeMatches > positiveMatches) return 'negative'
    return 'neutral'
  }

  private calculateEngagementRate(tweet: any): number {
    const total = (tweet.likeCount || 0) + (tweet.retweetCount || 0) + (tweet.replyCount || 0)
    const followers = tweet.author?.followersCount || 1000
    return total / followers
  }

  private calculateLinkedInEngagement(post: any): number {
    const total = (post.numLikes || 0) + (post.numComments || 0) + (post.numShares || 0)
    return total / 100 // Normalized engagement score
  }

  private extractTrendingTopics(texts: string[]): string[] {
    const words = texts.join(' ').toLowerCase().split(/\s+/)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were'])
    const wordFreq: Record<string, number> = {}

    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private identifyViralDiscussions(tweets: any[]): any[] {
    return tweets
      .filter(t => t.engagement_rate > 0.05) // High engagement
      .slice(0, 5)
      .map(t => ({
        topic: this.extractMainTopic(t.text),
        volume: t.likes + t.retweets + t.replies,
        sentiment: t.sentiment,
        key_phrases: this.extractKeyPhrases(t.text)
      }))
  }

  private categorizeQuestion(question: string): 'desire' | 'fear' | 'uncertainty' | 'problem' {
    if (/how to|how can|best way/i.test(question)) return 'desire'
    if (/should i|is it safe|will it/i.test(question)) return 'fear'
    if (/which|what is better|compare/i.test(question)) return 'uncertainty'
    return 'problem'
  }

  private extractKeyInsights(text: string): string[] {
    return text
      .split(/[.!?]/)
      .filter(s => s.length > 20)
      .slice(0, 3)
      .map(s => s.trim())
  }

  private extractTopics(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || []
    return hashtags.map(h => h.slice(1)).slice(0, 5)
  }

  private extractPainPoints(text: string): string[] {
    const painPatterns = [
      /struggling with|having trouble|difficult to|challenge of/gi,
      /need better|looking for|wish we had/gi
    ]

    const painPoints: string[] = []
    painPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        painPoints.push(...matches)
      }
    })

    return painPoints.slice(0, 3)
  }

  private extractBuyerIntentSignals(texts: string[]): any[] {
    const signals: any[] = []
    const intentPatterns = {
      evaluation: /considering|evaluating|looking at|researching/gi,
      consideration: /comparing|versus|alternative to|instead of/gi,
      decision: /implementing|purchasing|buying|switching to/gi
    }

    texts.forEach(text => {
      Object.entries(intentPatterns).forEach(([category, pattern]) => {
        const matches = text.match(pattern)
        if (matches) {
          signals.push({
            signal: matches[0],
            category,
            strength: matches.length,
            context: text.slice(0, 150)
          })
        }
      })
    })

    return signals.slice(0, 10)
  }

  private extractFeatureRequests(texts: string[]): any[] {
    const requests: Record<string, number> = {}
    const requestPatterns = [
      /need|want|wish|should have|would be great if/gi,
      /missing|lacking|doesn't have|no support for/gi
    ]

    texts.forEach(text => {
      requestPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          const feature = text.slice(
            text.indexOf(matches[0]),
            text.indexOf(matches[0]) + 100
          )
          requests[feature] = (requests[feature] || 0) + 1
        }
      })
    })

    return Object.entries(requests)
      .map(([feature, demand]) => ({
        feature: feature.slice(0, 100),
        demand,
        priority: demand > 5 ? 'high' : demand > 2 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10)
  }

  private extractCommonThemes(texts: string[], sentiment: 'positive' | 'negative'): string[] {
    const themes = sentiment === 'positive'
      ? ['quality', 'service', 'value', 'experience', 'support']
      : ['price', 'delay', 'issue', 'problem', 'disappointment']

    return themes.filter(theme =>
      texts.some(text => text.toLowerCase().includes(theme))
    )
  }

  private extractDealBreakers(texts: string[]): string[] {
    const dealBreakerPatterns = [
      /never again|won't use|avoid|stay away/gi,
      /scam|fraud|terrible|worst/gi
    ]

    const dealBreakers: string[] = []
    texts.forEach(text => {
      dealBreakerPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          dealBreakers.push(text.slice(0, 100))
        }
      })
    })

    return dealBreakers.slice(0, 5)
  }

  private extractWowFactors(texts: string[]): string[] {
    const wowPatterns = [
      /amazing|incredible|outstanding|exceeded expectations/gi,
      /love|best|perfect|fantastic/gi
    ]

    const wowFactors: string[] = []
    texts.forEach(text => {
      wowPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          wowFactors.push(text.slice(0, 100))
        }
      })
    })

    return wowFactors.slice(0, 5)
  }

  private extractG2BuyerIntent(reviews: any[]): any[] {
    const signals: any[] = []

    reviews.forEach(review => {
      if (/switching from|migrating from|replacing/i.test(review.text)) {
        signals.push({
          signal: 'Product switching',
          category: 'decision',
          strength: 0.9
        })
      }

      if (/evaluating|considering|looking at/i.test(review.text)) {
        signals.push({
          signal: 'Active evaluation',
          category: 'consideration',
          strength: 0.7
        })
      }

      if (/recommend|should use|great for/i.test(review.text)) {
        signals.push({
          signal: 'Strong recommendation',
          category: 'decision',
          strength: 0.8
        })
      }
    })

    return signals.slice(0, 10)
  }

  private extractAlternatives(texts: string[]): string[] {
    const alternatives = new Set<string>()
    const altPattern = /compared to|versus|instead of|alternative to|better than/gi

    texts.forEach(text => {
      const matches = text.match(altPattern)
      if (matches) {
        const words = text.split(/\s+/)
        words.forEach((word, i) => {
          if (matches.some(m => text.indexOf(m) < text.indexOf(word))) {
            if (word.length > 3 && /^[A-Z]/.test(word)) {
              alternatives.add(word)
            }
          }
        })
      }
    })

    return Array.from(alternatives).slice(0, 5)
  }

  private extractSwitchingReasons(texts: string[]): string[] {
    const reasons: string[] = []
    const switchPatterns = [
      /switched because|moved from.*because|left.*for/gi
    ]

    texts.forEach(text => {
      switchPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
          reasons.push(text.slice(text.indexOf(matches[0]), text.indexOf(matches[0]) + 150))
        }
      })
    })

    return reasons.slice(0, 5)
  }

  private extractRetentionFactors(prosTexts: string[]): string[] {
    return this.extractCommonThemes(prosTexts, 'positive')
  }

  private extractMainTopic(text: string): string {
    const words = text.split(/\s+/).filter(w => w.length > 5)
    return words[0] || 'General discussion'
  }

  private extractKeyPhrases(text: string): string[] {
    return text
      .split(/[.!?,]/)
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 3)
      .map(s => s.trim())
  }
}

export const apifySocialScraper = new ApifySocialScraperService()
