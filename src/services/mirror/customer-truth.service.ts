/**
 * Customer Truth Service
 * Analyzes who really buys and why using review mining and AI
 */

import {
  type BrandData,
  type CustomerTruthAnalysis,
  type CustomerTruthData,
  type WhyTheyChose,
  type BuyerJourneyGap,
} from '@/types/mirror-diagnostics'
import { chat } from '@/lib/openrouter'
import { OutScraperAPI, type GoogleReview } from '@/services/intelligence/outscraper-api'
import { BuyerJourneyService } from '@/services/buyer-journey.service'

export class CustomerTruthService {
  /**
   * Run full customer truth analysis
   */
  static async analyzeCustomerTruth(
    brandId: string,
    brandData: BrandData
  ): Promise<CustomerTruthAnalysis> {
    console.log('[CustomerTruthService] Starting analysis for:', brandData.name)

    try {
      // Mine reviews for insights using OutScraper
      const reviewInsights = await this.mineReviews(
        brandData.name,
        brandData.industry,
        brandData.location
      )

      // If no reviews found, use AI research as alternative data source
      let whyTheyChose = reviewInsights.whyTheyChose
      let commonObjections = reviewInsights.objections

      if (reviewInsights.reviews.length === 0) {
        console.log('[CustomerTruth] Using AI research for customer insights...')
        const aiInsights = await this.researchCustomerInsightsWithAI(brandData)
        whyTheyChose = aiInsights.whyTheyChose
        commonObjections = aiInsights.objections
      }

      // Get actual demographics (inferred from reviews until Buyer Journey completed)
      const actualDemographic = await this.getActualDemographics(brandId, brandData, reviewInsights.reviews)

      // Compare expected vs actual
      const expectedDemographic = this.inferExpectedDemographic(brandData)
      const matchPercentage = this.calculateDemographicMatch(
        expectedDemographic,
        actualDemographic
      )

      // Map buyer journey gaps
      const buyerJourneyGaps = await this.identifyJourneyGaps(
        brandData,
        reviewInsights
      )

      // Analyze price vs value perception
      const priceVsValuePerception = this.analyzePriceValuePerception(reviewInsights)

      // Build complete customer truth data
      const data: CustomerTruthData = {
        expected_demographic: expectedDemographic,
        actual_demographic: actualDemographic,
        match_percentage: matchPercentage,
        why_they_choose: whyTheyChose,
        common_objections: commonObjections,
        buyer_journey_gaps: buyerJourneyGaps,
        price_vs_value_perception: priceVsValuePerception,
      }

      // Calculate score
      const score = this.calculateMatchScore(data)

      console.log('[CustomerTruthService] Analysis complete. Score:', score)

      return { score, data }
    } catch (error) {
      console.error('[CustomerTruthService] Analysis failed, using degraded data:', error)

      // Return degraded but valid analysis using AI research
      const aiInsights = await this.researchCustomerInsightsWithAI(brandData).catch(() => ({
        whyTheyChose: [
          { reason: 'Quality service', percentage: 40, source: 'industry_default' },
          { reason: 'Professional approach', percentage: 30, source: 'industry_default' },
          { reason: 'Competitive value', percentage: 30, source: 'industry_default' },
        ],
        objections: ['Analysis unavailable - API service issue'],
      }))

      const expectedDemographic = this.inferExpectedDemographic(brandData)

      const data: CustomerTruthData = {
        expected_demographic: expectedDemographic,
        actual_demographic: {
          age: 'Unable to determine',
          income: 'Unable to determine',
          location: brandData.location || 'Unknown',
        },
        match_percentage: 50, // Neutral when unknown
        why_they_choose: aiInsights.whyTheyChose,
        common_objections: aiInsights.objections,
        buyer_journey_gaps: [],
        price_vs_value_perception: 'Unable to determine without review data',
      }

      return {
        score: 50, // Neutral score when degraded
        data
      }
    }
  }

  /**
   * Check if buyer journey has been completed for this brand
   */
  static async hasBuyerJourneyCompleted(brandId: string): Promise<boolean> {
    try {
      return await BuyerJourneyService.checkCompletion(brandId)
    } catch (error) {
      console.error('[CustomerTruthService] Error checking buyer journey:', error)
      return false
    }
  }

  /**
   * Mine reviews for customer insights using OutScraper + AI
   */
  private static async mineReviews(
    brandName: string,
    industry: string,
    location?: string
  ): Promise<{
    whyTheyChose: WhyTheyChose[]
    objections: string[]
    sentiment: number
    reviews: GoogleReview[]
  }> {
    try {
      console.log('[CustomerTruth] Finding business on Google Maps...')

      // First, find the business on Google Maps
      const query = location ? `${brandName} ${industry} ${location}` : `${brandName} ${industry}`
      const listings = await OutScraperAPI.getBusinessListings({
        query,
        location: location || '',
        limit: 5,
      })

      if (listings.length === 0) {
        throw new Error('Business not found on Google Maps')
      }

      // Find the best match for the brand name
      const businessListing = listings.find(
        listing => listing.name.toLowerCase().includes(brandName.toLowerCase())
      ) || listings[0]

      console.log('[CustomerTruth] Found business:', businessListing.name)
      console.log('[CustomerTruth] Place ID:', businessListing.place_id)
      console.log('[CustomerTruth] Scraping Google reviews...')

      // Scrape reviews for this business using place_id (guaranteed exact match)
      const reviews = await OutScraperAPI.scrapeGoogleReviews({
        place_id: businessListing.place_id,
        limit: 50, // Get more reviews for better analysis
        sort: 'newest',
      })

      if (reviews.length === 0) {
        console.warn('[CustomerTruth] No reviews found, will use AI research instead')
        // Return empty reviews - caller will use AI fallback
        return {
          whyTheyChose: [],
          objections: [],
          sentiment: 0,
          reviews: [],
        }
      }

      console.log('[CustomerTruth] Found', reviews.length, 'reviews. Analyzing with AI...')

      // Prepare review text for AI analysis
      const reviewTexts = reviews
        .slice(0, 30) // Analyze top 30 to avoid token limits
        .map((r, i) => `Review ${i + 1} (${r.rating}⭐): ${r.text}`)
        .join('\n\n')

      // Extract patterns using AI
      const prompt = `Analyze these REAL Google reviews for "${brandName}" and extract:

1. Top 3-5 reasons why customers chose this business (estimate percentage for each)
2. Top 3-5 common objections or complaints from negative reviews

Be specific and quote actual phrases from reviews where possible.

Reviews:
${reviewTexts}

Return ONLY valid JSON:
{
  "whyTheyChose": [
    {"reason": "Specific reason from reviews", "percentage": 35, "source": "reviews"}
  ],
  "objections": ["Specific complaint 1", "Specific complaint 2"]
}`

      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 1500,
        }
      )

      const parsed = JSON.parse(response)

      // Calculate actual sentiment from ratings
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const sentiment = avgRating / 5 // Convert 0-5 scale to 0-1

      console.log('[CustomerTruth] Analysis complete. Avg rating:', avgRating.toFixed(2))

      return {
        whyTheyChose: parsed.whyTheyChose || [],
        objections: parsed.objections || [],
        sentiment,
        reviews, // Store raw reviews for potential UI display
      }
    } catch (error) {
      console.error('[CustomerTruthService] Review mining failed:', error)
      throw new Error(`Failed to mine customer reviews: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Research customer insights using AI when no reviews are available
   * Uses Perplexity to research industry patterns and competitive intel
   */
  private static async researchCustomerInsightsWithAI(
    brandData: BrandData
  ): Promise<{
    whyTheyChose: WhyTheyChose[]
    objections: string[]
  }> {
    try {
      console.log('[CustomerTruth] Researching customer patterns for:', brandData.industry)

      const prompt = `Research typical customer buying patterns for ${brandData.industry} businesses like "${brandData.name}".

What are the top 3-5 reasons customers choose ${brandData.industry} providers?
What are the top 3-5 common objections or concerns customers have before purchasing?

Return ONLY valid JSON:
{
  "whyTheyChose": [
    {"reason": "Specific reason", "percentage": 35, "source": "industry_research"}
  ],
  "objections": ["Specific concern 1", "Specific concern 2"]
}`

      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 1000,
        }
      )

      const parsed = JSON.parse(response)

      console.log('[CustomerTruth] ✅ AI research complete:', parsed.whyTheyChose.length, 'patterns found')

      return {
        whyTheyChose: parsed.whyTheyChose || [],
        objections: parsed.objections || [],
      }
    } catch (error) {
      console.error('[CustomerTruth] AI research failed:', error)
      // Return industry defaults as last resort
      return {
        whyTheyChose: [
          { reason: 'Quality and reliability', percentage: 40, source: 'industry_default' },
          { reason: 'Professional service', percentage: 30, source: 'industry_default' },
          { reason: 'Competitive pricing', percentage: 30, source: 'industry_default' },
        ],
        objections: [
          'Price concerns',
          'Trust and credibility',
          'Service quality uncertainty',
        ],
      }
    }
  }

  /**
   * Get actual customer demographics
   *
   * STRATEGY:
   * 1. If Buyer Journey completed → use defined ICP (future)
   * 2. Otherwise → infer from review text patterns using AI
   *
   * NOTE: This will be enhanced once Buyer Journey module is complete
   */
  private static async getActualDemographics(
    brandId: string,
    brandData: BrandData,
    reviews: GoogleReview[]
  ): Promise<{ age: string; income: string; location: string }> {
    // Check for ICP data from Buyer Journey first
    try {
      const icp = await BuyerJourneyService.getICP(brandId)
      if (icp && icp.demographics) {
        console.log('[CustomerTruth] Using ICP data from Buyer Journey')
        const demo = icp.demographics
        return {
          age: demo.age_range || '25-55',
          income: demo.income_range || '$40k-$80k',
          location: demo.location || brandData.location || 'Regional market',
        }
      }
    } catch (error) {
      console.log('[CustomerTruth] No ICP data available, will infer from reviews')
    }

    // Fall back to inferring from review patterns
    console.log('[CustomerTruth] Inferring demographics from review patterns...')

    try {
      // Use a sample of reviews to infer demographic patterns
      const reviewSample = reviews
        .slice(0, 20)
        .map(r => r.text)
        .join('\n')

      const prompt = `Analyze these customer reviews and infer the likely demographic profile of the customer base.

Reviews:
${reviewSample}

Based on language patterns, concerns mentioned, and context clues, infer:
1. Age range (e.g., "25-40", "40-60")
2. Income level (e.g., "$30k-$60k", "$60k-$100k", "$100k+")
3. Location type (e.g., "Urban professionals", "Suburban families", "Rural residents")

Return ONLY valid JSON with no additional text:
{
  "age": "age range",
  "income": "income range",
  "location": "location description"
}`

      const response = await chat(
        [
          { role: 'system', content: 'You are a data analysis assistant. Always respond with valid JSON only, no additional text or explanation.' },
          { role: 'user', content: prompt }
        ],
        {
          temperature: 0.3,
          maxTokens: 300,
        }
      )

      // Extract JSON from response (handles markdown code blocks)
      let jsonStr = response.trim()
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      } else if (!jsonStr.startsWith('{')) {
        // Try to find JSON object in the response
        const objMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (objMatch) {
          jsonStr = objMatch[0]
        }
      }

      const parsed = JSON.parse(jsonStr)

      console.log('[CustomerTruth] Inferred demographics:', parsed)

      return {
        age: parsed.age || '25-55',
        income: parsed.income || '$40k-$80k',
        location: parsed.location || brandData.location || 'Regional market',
      }
    } catch (error) {
      console.error('[CustomerTruth] Demographics inference failed:', error)
      // Fallback to broad estimates
      return {
        age: '25-55',
        income: '$40k-$80k',
        location: brandData.location || 'Regional market',
      }
    }
  }

  /**
   * Infer expected demographic from brand data
   */
  private static inferExpectedDemographic(brandData: BrandData): {
    age: string
    income: string
    location: string
  } {
    // Parse from target_audience if available
    if (brandData.target_audience) {
      return {
        age: '35-55',
        income: '$60k-$100k',
        location: brandData.location || 'Suburban areas',
      }
    }

    // Default expectations based on industry
    return {
      age: '35-55',
      income: '$60k-$100k',
      location: brandData.location || 'General market',
    }
  }

  /**
   * Calculate match between expected and actual demographics
   */
  private static calculateDemographicMatch(
    expected: { age: string; income: string; location: string },
    actual: { age: string; income: string; location: string }
  ): number {
    // Simple string comparison for now
    // TODO: Implement more sophisticated matching
    let matches = 0
    let total = 3

    if (expected.age === actual.age) matches++
    if (expected.income === actual.income) matches++
    if (expected.location === actual.location) matches++

    return Math.round((matches / total) * 100)
  }

  /**
   * Identify buyer journey gaps using AI
   */
  private static async identifyJourneyGaps(
    brandData: BrandData,
    reviewInsights: any
  ): Promise<BuyerJourneyGap[]> {
    const prompt = `Analyze potential buyer journey gaps for a ${brandData.industry} business.

Customer feedback indicates:
${reviewInsights.objections.join('\n')}

Identify gaps in these stages:
- Awareness (how they discover you)
- Consideration (how they evaluate you)
- Purchase (how they buy)
- Loyalty (how they return)

Return ONLY valid JSON array:
[{"stage":"awareness","gap":"What's missing","impact":"Why it matters"}]`

    try {
      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.4,
          maxTokens: 800,
        }
      )

      const parsed = JSON.parse(response)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[CustomerTruthService] Journey gap analysis failed:', error)
      return []
    }
  }

  /**
   * Analyze price vs value perception from reviews
   */
  private static analyzePriceValuePerception(reviewInsights: any): string {
    // Analyze if reviews mention price positively or negatively
    const priceReasons = reviewInsights.whyTheyChose.filter((r: WhyTheyChose) =>
      r.reason.toLowerCase().includes('price') ||
      r.reason.toLowerCase().includes('cheap') ||
      r.reason.toLowerCase().includes('affordable') ||
      r.reason.toLowerCase().includes('expensive')
    )

    if (priceReasons.length > 0) {
      const totalPercentage = priceReasons.reduce(
        (sum: number, r: WhyTheyChose) => sum + r.percentage,
        0
      )

      if (totalPercentage > 40) {
        return 'Competing primarily on price - customers choose you because you\'re cheapest'
      } else if (totalPercentage > 20) {
        return 'Price is a factor but not the main driver'
      }
    }

    return 'Competing on value and quality - price is not the primary reason customers choose you'
  }

  /**
   * Calculate customer match score (0-100)
   */
  private static calculateMatchScore(data: CustomerTruthData): number {
    let score = 100

    // Penalty for demographic mismatch
    if (data.match_percentage < 50) score -= 30
    else if (data.match_percentage < 70) score -= 15

    // Penalty if competing on price
    if (data.price_vs_value_perception.includes('cheapest')) score -= 20

    // Penalty for journey gaps
    score -= data.buyer_journey_gaps.length * 5

    return Math.max(0, Math.min(100, score))
  }

}
