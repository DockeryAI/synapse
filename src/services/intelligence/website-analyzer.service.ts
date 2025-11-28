/**
 * Website Analyzer Service
 * Uses Claude AI via OpenRouter to extract business messaging from website content
 *
 * NOW WITH JTBD TRANSFORMATION:
 * - Extracts feature-focused value props from website
 * - Transforms them into outcome-focused messaging using JTBD framework
 */

import { jtbdTransformer, type TransformedValueProps } from './jtbd-transformer.service'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface WebsiteMessagingAnalysis {
  // Original feature-focused props
  valuePropositions: string[]

  // NEW: Outcome-focused transformations
  outcomeFocusedProps?: TransformedValueProps

  targetAudience: string[]
  customerProblems: string[]
  solutions: string[]
  proofPoints: string[]
  differentiators: string[]
  confidence: number

  // NEW: Extracted testimonials and meta tags
  testimonials?: string[]
  metaTags?: Record<string, string>
  keywords?: string[]
}

class WebsiteAnalyzerService {
  // Store last scrape result for meta/testimonial access
  private lastScrapeResult: any = null;

  /**
   * Extract website content from a URL
   * Uses Supabase Edge Function to proxy Apify API calls (avoids CORS)
   */
  async extractWebsiteContent(url: string): Promise<string> {
    try {
      console.log('[WebsiteAnalyzer] Fetching content from:', url)

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing')
      }

      // Call Supabase Edge Function (server-side, no CORS issues)
      console.log('[WebsiteAnalyzer] Using Edge Function for content extraction...')
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/scrape-website`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ url })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[WebsiteAnalyzer] Edge Function error:', response.status, errorText)
        throw new Error(`Edge Function failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Unknown error from Edge Function')
      }

      // Store for later access
      this.lastScrapeResult = data;

      // Log extracted testimonials and meta tags
      if (data.content.testimonials?.length > 0) {
        console.log(`[WebsiteAnalyzer] Found ${data.content.testimonials.length} testimonials`)
      }
      if (data.content.metaTags) {
        console.log(`[WebsiteAnalyzer] Found ${Object.keys(data.content.metaTags).length} meta tags`)
      }

      // Combine title, description, text, and headings
      const fullText = [
        data.content.title,
        data.content.description,
        data.content.text,
        data.content.headings?.join(' ')
      ].filter(Boolean).join('\n\n')

      console.log('[WebsiteAnalyzer] Edge Function extracted', fullText.length, 'characters')
      return fullText

    } catch (error) {
      console.error('[WebsiteAnalyzer] Failed to fetch website:', error)
      throw new Error(`Failed to fetch website: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get last scraped testimonials
   */
  getLastTestimonials(): string[] {
    return this.lastScrapeResult?.content?.testimonials || [];
  }

  /**
   * Get last scraped meta tags
   */
  getLastMetaTags(): Record<string, string> {
    return this.lastScrapeResult?.content?.metaTags || {};
  }

  /**
   * Get keywords from meta tags, title, headings, and content
   * Extracts THEIR keywords - what they're already targeting
   */
  getKeywords(): string[] {
    const metaTags = this.getLastMetaTags();
    const content = this.lastScrapeResult?.content;
    const keywords: Set<string> = new Set();

    // 1. Meta keywords tag (primary source - their explicitly set keywords)
    const keywordString = metaTags['keywords'] || metaTags['Keywords'] || '';
    if (keywordString) {
      keywordString.split(',').forEach((k: string) => {
        const kw = k.trim().toLowerCase();
        if (kw && kw.length >= 3 && kw.length <= 50) {
          keywords.add(kw);
        }
      });
    }

    // 2. Title tag - extract significant words
    const title = metaTags['title'] || metaTags['og:title'] || '';
    if (title) {
      this.extractSignificantWords(title).forEach(w => keywords.add(w));
    }

    // 3. Meta description - extract significant words
    const description = metaTags['description'] || metaTags['og:description'] || '';
    if (description) {
      this.extractSignificantWords(description).forEach(w => keywords.add(w));
    }

    // 4. H1/H2 headings from raw content if available
    const rawContent = content?.rawText || '';
    if (rawContent) {
      // Extract H1 and H2 headings (often contain key service/product terms)
      const headingMatches = rawContent.match(/<h[12][^>]*>([^<]+)<\/h[12]>/gi) || [];
      headingMatches.forEach((match: string) => {
        const text = match.replace(/<[^>]+>/g, '').trim();
        this.extractSignificantWords(text).forEach(w => keywords.add(w));
      });
    }

    console.log(`[WebsiteAnalyzer] Extracted ${keywords.size} keywords from website`);
    return Array.from(keywords).slice(0, 30); // Limit to top 30 keywords
  }

  /**
   * Extract significant words from text (removes common stop words)
   */
  private extractSignificantWords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our',
      'they', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'as', 'if', 'then', 'else'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 4 && word.length <= 30 && !stopWords.has(word));
  }

  /**
   * Analyze website content using Claude AI to extract business messaging
   */
  async analyzeWebsiteMessaging(
    websiteContent: string,
    businessName: string
  ): Promise<WebsiteMessagingAnalysis> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[WebsiteAnalyzer] No Supabase configuration - returning empty analysis')
      return {
        valuePropositions: [],
        targetAudience: [],
        customerProblems: [],
        solutions: [],
        proofPoints: [],
        differentiators: [],
        confidence: 0
      }
    }

    try {
      console.log('[WebsiteAnalyzer] Starting AI analysis for:', businessName)

      // Truncate content to avoid token limits (keep first ~20,000 chars)
      const truncatedContent = websiteContent.slice(0, 20000)

      const prompt = `You are a brand strategist analyzing a business's website content to understand EXACTLY what they sell and who they serve.

Business: ${businessName}
Website Content:
${truncatedContent}

Extract the following business-specific information. CRITICAL RULES:
- Only include what they EXPLICITLY state on their website
- Use their EXACT words and phrases whenever possible
- DO NOT use generic industry assumptions
- If something is not mentioned, use empty array
- FOCUS on finding their SPECIALIZATION (niche, specific services, unique focus)

1. VALUE PROPOSITIONS: What unique benefits, guarantees, or promises do they explicitly mention? Their exact value statements.

2. TARGET AUDIENCE: Who EXACTLY are they talking to? Look for specific demographics, industries, types of customers. Use their exact language. Examples: "luxury car owners", "classic car collectors", "high-net-worth individuals", "exotic vehicle enthusiasts", "young families", "first-time homebuyers", etc.

3. CUSTOMER PROBLEMS: What specific problems, pain points, or challenges do they say their customers face? Use their exact words.

4. THEIR SOLUTION: How do they describe solving those problems? What specific services or products do they offer? BE SPECIFIC about what they sell.

5. PROOF POINTS: What credentials, experience, results, testimonials, certifications, awards, or stats do they cite?

6. DIFFERENTIATORS: What makes them different or specialized? Look for:
   - Niche focus (e.g., "rare cars", "vintage vehicles", "luxury homes", "commercial properties")
   - Specific expertise (e.g., "25 years insuring classic cars", "certified appraisers for collectibles")
   - Unique services (e.g., "agreed value coverage", "restoration specialists", "concierge service")
   - Market position (e.g., "only provider in X", "largest X in Y")

Return ONLY valid JSON (no markdown, no explanations):
{
  "valuePropositions": ["exact quote 1", "exact quote 2"],
  "targetAudience": ["exact audience description 1", "exact audience 2"],
  "customerProblems": ["problem 1 in their words", "problem 2"],
  "solutions": ["specific service/product 1", "specific service 2"],
  "proofPoints": ["credential 1", "stat 1", "testimonial theme"],
  "differentiators": ["unique specialization 1", "niche focus 2", "unique service 3"]
}`

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.1',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 4096,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[WebsiteAnalyzer] OpenRouter API error:', response.status, errorText)
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      console.log('[WebsiteAnalyzer] Raw AI response:', analysisText.substring(0, 200) + '...')

      // Parse JSON response
      const analysis = JSON.parse(analysisText)

      // Calculate confidence based on data richness
      const dataPoints = [
        analysis.valuePropositions?.length || 0,
        analysis.targetAudience?.length || 0,
        analysis.customerProblems?.length || 0,
        analysis.solutions?.length || 0,
        analysis.proofPoints?.length || 0,
        analysis.differentiators?.length || 0
      ]

      const totalDataPoints = dataPoints.reduce((sum, count) => sum + count, 0)
      const confidence = Math.min(totalDataPoints > 0 ? 50 + (totalDataPoints * 5) : 30, 95)

      console.log('[WebsiteAnalyzer] Analysis complete:')
      console.log('  - Value Propositions:', analysis.valuePropositions?.length || 0)
      console.log('  - Target Audience:', analysis.targetAudience?.length || 0)
      console.log('  - Problems:', analysis.customerProblems?.length || 0)
      console.log('  - Solutions:', analysis.solutions?.length || 0)
      console.log('  - Proof Points:', analysis.proofPoints?.length || 0)
      console.log('  - Differentiators:', analysis.differentiators?.length || 0)
      console.log('  - Confidence:', confidence + '%')

      // =========================================================================
      // ✨ JTBD TRANSFORMATION: Convert feature props to outcome-focused
      // =========================================================================
      let outcomeFocusedProps: TransformedValueProps | undefined

      // SPEED: Skip JTBD transformation - takes 60+ seconds and slows down dashboard
      // The raw value propositions are sufficient for context building
      console.log('[WebsiteAnalyzer] Skipping JTBD transformation for speed')

      // Get testimonials and meta tags from last scrape
      const testimonials = this.getLastTestimonials();
      const metaTags = this.getLastMetaTags();
      const keywords = this.getKeywords();

      console.log('[WebsiteAnalyzer] Testimonials found:', testimonials.length);
      console.log('[WebsiteAnalyzer] Keywords found:', keywords.length);

      return {
        valuePropositions: analysis.valuePropositions || [],
        outcomeFocusedProps,
        targetAudience: analysis.targetAudience || [],
        customerProblems: analysis.customerProblems || [],
        solutions: analysis.solutions || [],
        proofPoints: analysis.proofPoints || [],
        differentiators: analysis.differentiators || [],
        confidence,
        testimonials,
        metaTags,
        keywords
      }
    } catch (error) {
      console.error('[WebsiteAnalyzer] AI analysis failed:', error)

      // Return empty analysis on error (graceful fallback)
      return {
        valuePropositions: [],
        outcomeFocusedProps: undefined,
        targetAudience: [],
        customerProblems: [],
        solutions: [],
        proofPoints: [],
        differentiators: [],
        confidence: 0,
        testimonials: [],
        metaTags: {},
        keywords: []
      }
    }
  }

  /**
   * Convenience method: Fetch and analyze in one call
   */
  async analyzeWebsite(url: string): Promise<WebsiteMessagingAnalysis> {
    try {
      // Extract business name from URL
      const businessName = new URL(url).hostname.replace('www.', '').split('.')[0]

      // Fetch content
      const content = await this.extractWebsiteContent(url)

      // Analyze with AI
      return await this.analyzeWebsiteMessaging(content, businessName)
    } catch (error) {
      console.error('[WebsiteAnalyzer] analyzeWebsite failed:', error)
      throw error
    }
  }

  /**
   * FAST: Extract ONLY testimonials and meta tags from raw scrape (no LLM)
   * Use this for parallel extraction without blocking other operations
   */
  async extractRawTestimonialsAndMeta(url: string): Promise<{
    testimonials: string[];
    metaTags: Record<string, string>;
    keywords: string[];
  }> {
    try {
      console.log('[WebsiteAnalyzer/FastExtract] Fetching raw data from:', url)

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { testimonials: [], metaTags: {}, keywords: [] };
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/scrape-website`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ url })
        }
      )

      if (!response.ok) {
        console.error('[WebsiteAnalyzer/FastExtract] Failed:', response.status);
        return { testimonials: [], metaTags: {}, keywords: [] };
      }

      const data = await response.json()

      if (!data.success) {
        return { testimonials: [], metaTags: {}, keywords: [] };
      }

      // Store for later access
      this.lastScrapeResult = data;

      // Extract keywords from meta tags
      const metaTags = data.content?.metaTags || {};
      const keywordString = metaTags['keywords'] || metaTags['Keywords'] || '';
      const keywords = keywordString
        ? keywordString.split(',').map((k: string) => k.trim()).filter(Boolean)
        : [];

      console.log(`[WebsiteAnalyzer/FastExtract] Got ${data.content?.testimonials?.length || 0} testimonials, ${keywords.length} keywords`);

      return {
        testimonials: data.content?.testimonials || [],
        metaTags,
        keywords
      };
    } catch (error) {
      console.error('[WebsiteAnalyzer/FastExtract] Error:', error);
      return { testimonials: [], metaTags: {}, keywords: [] };
    }
  }
}

export const websiteAnalyzer = new WebsiteAnalyzerService()
export { WebsiteAnalyzerService }
