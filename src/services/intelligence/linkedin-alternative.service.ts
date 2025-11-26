/**
 * LinkedIn Alternative Service
 *
 * Gets LinkedIn-equivalent B2B intelligence using Perplexity + Serper
 * instead of direct LinkedIn scraping (which requires cookies/proxies).
 *
 * Strategy:
 * - Perplexity: Company research, executive info, recent news
 * - Serper: site:linkedin.com searches for public indexed content
 *
 * Works for B2B industries (112 NAICS codes) without authentication hassle.
 */

import type { LinkedInB2BInsights, PsychologicalTrigger } from './apify-social-scraper.service'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Determine if a business needs LinkedIn data based on type
 * B2B, professional services, tech = needs LinkedIn
 * Local retail, restaurants, personal services = doesn't need LinkedIn
 */
export function needsLinkedInData(businessType: string, naicsCode?: string): boolean {
  const b2bKeywords = [
    'b2b', 'enterprise', 'consulting', 'agency', 'saas', 'software',
    'professional services', 'law firm', 'accounting', 'cpa', 'financial',
    'marketing agency', 'it services', 'managed services', 'staffing',
    'recruiting', 'hr services', 'business consulting', 'management',
    'technology', 'tech', 'engineering', 'architecture', 'commercial',
    'industrial', 'manufacturing', 'wholesale', 'distribution'
  ]

  const b2cKeywords = [
    'restaurant', 'cafe', 'bar', 'retail', 'salon', 'spa', 'gym',
    'fitness', 'yoga', 'dental', 'medical', 'clinic', 'veterinary',
    'pet', 'childcare', 'daycare', 'cleaning', 'landscaping', 'plumber',
    'electrician', 'hvac', 'roofing', 'auto repair', 'car wash',
    'florist', 'bakery', 'boutique', 'photography studio'
  ]

  const lowerType = businessType.toLowerCase()

  // Explicit B2C = no LinkedIn needed
  if (b2cKeywords.some(kw => lowerType.includes(kw))) {
    return false
  }

  // Explicit B2B = needs LinkedIn
  if (b2bKeywords.some(kw => lowerType.includes(kw))) {
    return true
  }

  // Check NAICS if provided (from industry-api-selector logic)
  if (naicsCode) {
    const b2bNaicsPrefixes = ['541', '523', '524', '561', '518', '511', '517']
    return b2bNaicsPrefixes.some(prefix => naicsCode.startsWith(prefix))
  }

  // Default: assume doesn't need LinkedIn (safer, faster)
  return false
}

/**
 * Get LinkedIn-equivalent insights using Perplexity + Serper
 */
export async function getLinkedInAlternativeInsights(
  companyName: string,
  industry: string,
  website?: string
): Promise<LinkedInB2BInsights> {
  console.log(`[LinkedIn Alt] Getting B2B insights for ${companyName} via Perplexity + Serper`)

  try {
    // Run both queries in parallel
    const [perplexityData, serperData] = await Promise.all([
      queryPerplexityForCompany(companyName, industry),
      searchLinkedInViaSerper(companyName)
    ])

    // Merge and structure the data
    return structureLinkedInInsights(companyName, perplexityData, serperData)
  } catch (error) {
    console.error('[LinkedIn Alt] Error:', error)
    // Return empty structure on error
    return getEmptyLinkedInInsights()
  }
}

/**
 * Query Perplexity for company intelligence
 */
async function queryPerplexityForCompany(
  companyName: string,
  industry: string
): Promise<PerplexityCompanyData> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[LinkedIn Alt] Missing Supabase credentials')
    return { executives: [], news: [], painPoints: [], trends: [] }
  }

  const prompt = `Research ${companyName} in the ${industry} industry. Provide:
1. Key executives and their roles (CEO, CTO, VP Sales, etc.)
2. Recent company news and announcements (last 6 months)
3. Common pain points and challenges they discuss publicly
4. Industry trends they're addressing
5. Their main competitors

Be specific and factual. Focus on publicly available information.`

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/perplexity-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return parsePerplexityResponse(content)
  } catch (error) {
    console.error('[LinkedIn Alt] Perplexity query failed:', error)
    return { executives: [], news: [], painPoints: [], trends: [] }
  }
}

/**
 * Search LinkedIn content indexed by Google via Serper
 */
async function searchLinkedInViaSerper(companyName: string): Promise<SerperLinkedInData> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { posts: [], profiles: [], companyInfo: null }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-serper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        q: `site:linkedin.com "${companyName}"`,
        num: 20
      })
    })

    if (!response.ok) {
      throw new Error(`Serper error: ${response.status}`)
    }

    const data = await response.json()
    return parseSerperLinkedInResults(data, companyName)
  } catch (error) {
    console.error('[LinkedIn Alt] Serper search failed:', error)
    return { posts: [], profiles: [], companyInfo: null }
  }
}

/**
 * Parse Perplexity response into structured data
 */
function parsePerplexityResponse(content: string): PerplexityCompanyData {
  const executives: string[] = []
  const news: string[] = []
  const painPoints: string[] = []
  const trends: string[] = []

  // Extract executives (look for title patterns)
  const execPatterns = /(?:CEO|CTO|CFO|COO|VP|Director|Head of|Chief)[^.]*[A-Z][a-z]+\s+[A-Z][a-z]+/g
  const execMatches = content.match(execPatterns)
  if (execMatches) {
    executives.push(...execMatches.slice(0, 5))
  }

  // Extract news items (sentences with dates or "announced", "launched", etc.)
  const newsPatterns = /[^.]*(?:announced|launched|released|acquired|partnered|raised|expanded)[^.]*/gi
  const newsMatches = content.match(newsPatterns)
  if (newsMatches) {
    news.push(...newsMatches.slice(0, 5).map(n => n.trim()))
  }

  // Extract pain points (challenge/problem language)
  const painPatterns = /[^.]*(?:challenge|struggle|pain point|difficulty|problem|issue)[^.]*/gi
  const painMatches = content.match(painPatterns)
  if (painMatches) {
    painPoints.push(...painMatches.slice(0, 5).map(p => p.trim()))
  }

  // Extract trends
  const trendPatterns = /[^.]*(?:trend|growing|emerging|shifting|adopting|focusing on)[^.]*/gi
  const trendMatches = content.match(trendPatterns)
  if (trendMatches) {
    trends.push(...trendMatches.slice(0, 5).map(t => t.trim()))
  }

  return { executives, news, painPoints, trends }
}

/**
 * Parse Serper results for LinkedIn-specific content
 */
function parseSerperLinkedInResults(
  data: any,
  companyName: string
): SerperLinkedInData {
  const posts: Array<{ title: string; snippet: string; url: string }> = []
  const profiles: Array<{ name: string; title: string; url: string }> = []
  let companyInfo: { description: string; employees: string; url: string } | null = null

  const results = data.organic || []

  for (const result of results) {
    const url = result.link || ''
    const title = result.title || ''
    const snippet = result.snippet || ''

    // Company page
    if (url.includes('/company/') && !companyInfo) {
      companyInfo = {
        description: snippet,
        employees: extractEmployeeCount(snippet),
        url
      }
    }
    // Personal profiles (potential decision makers)
    else if (url.includes('/in/')) {
      const titleMatch = snippet.match(/(?:CEO|CTO|CFO|VP|Director|Manager|Head|Chief)[^-|]*/i)
      if (titleMatch) {
        profiles.push({
          name: title.replace(' - LinkedIn', '').replace(' | LinkedIn', ''),
          title: titleMatch[0].trim(),
          url
        })
      }
    }
    // Posts/articles
    else if (url.includes('/posts/') || url.includes('/pulse/')) {
      posts.push({ title, snippet, url })
    }
  }

  return { posts, profiles: profiles.slice(0, 10), companyInfo }
}

/**
 * Extract employee count from LinkedIn snippet
 */
function extractEmployeeCount(text: string): string {
  const match = text.match(/(\d+[,\d]*)\s*(?:employees|followers)/i)
  return match ? match[1] : 'Unknown'
}

/**
 * Structure the combined data into LinkedInB2BInsights format
 */
function structureLinkedInInsights(
  companyName: string,
  perplexity: PerplexityCompanyData,
  serper: SerperLinkedInData
): LinkedInB2BInsights {
  // Build company posts from Serper LinkedIn posts
  const company_posts = serper.posts.map(post => ({
    text: post.snippet,
    likes: 0, // Not available from search
    comments: 0,
    shares: 0,
    author_title: '',
    engagement_rate: 0,
    topics: extractTopicsFromText(post.snippet)
  }))

  // Build decision maker posts from profiles + Perplexity exec data
  const decision_maker_posts = serper.profiles.map(profile => ({
    text: `${profile.name} - ${profile.title} at ${companyName}`,
    author: profile.name,
    title: profile.title,
    company: companyName,
    engagement: 0,
    pain_points: [] as string[]
  }))

  // Build psychological triggers from Perplexity pain points
  const professional_pain_points: PsychologicalTrigger[] = perplexity.painPoints.map((pp, i) => ({
    type: 'pain-point' as const,
    text: pp,
    intensity: 0.7 - (i * 0.1),
    frequency: 1,
    context: pp,
    source: 'Perplexity Research'
  }))

  // Trending topics from news + trends
  const trending_topics = [
    ...perplexity.news.slice(0, 3),
    ...perplexity.trends.slice(0, 3)
  ].map(t => t.slice(0, 100))

  // Buyer intent signals from pain points and trends
  const buyer_intent_signals = perplexity.painPoints.slice(0, 5).map((pp, i) => ({
    signal: pp.slice(0, 150),
    strength: 0.8 - (i * 0.1),
    context: 'Industry research'
  }))

  return {
    company_posts,
    decision_maker_posts,
    professional_pain_points,
    trending_topics,
    buyer_intent_signals
  }
}

/**
 * Extract topics from text
 */
function extractTopicsFromText(text: string): string[] {
  const topics: string[] = []
  const words = text.toLowerCase().split(/\s+/)

  // Industry/business keywords
  const topicKeywords = [
    'growth', 'innovation', 'digital', 'transformation', 'leadership',
    'strategy', 'technology', 'ai', 'automation', 'efficiency',
    'sustainability', 'culture', 'talent', 'hiring', 'sales',
    'marketing', 'customer', 'experience', 'data', 'analytics'
  ]

  for (const keyword of topicKeywords) {
    if (words.includes(keyword)) {
      topics.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  }

  return topics.slice(0, 5)
}

/**
 * Return empty insights structure
 */
function getEmptyLinkedInInsights(): LinkedInB2BInsights {
  return {
    company_posts: [],
    decision_maker_posts: [],
    professional_pain_points: [],
    trending_topics: [],
    buyer_intent_signals: []
  }
}

// Types
interface PerplexityCompanyData {
  executives: string[]
  news: string[]
  painPoints: string[]
  trends: string[]
}

interface SerperLinkedInData {
  posts: Array<{ title: string; snippet: string; url: string }>
  profiles: Array<{ name: string; title: string; url: string }>
  companyInfo: { description: string; employees: string; url: string } | null
}

// Export singleton
class LinkedInAlternativeService {
  needsLinkedInData = needsLinkedInData
  getInsights = getLinkedInAlternativeInsights
}

export const linkedInAlternativeService = new LinkedInAlternativeService()
