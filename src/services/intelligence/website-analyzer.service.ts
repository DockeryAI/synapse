/**
 * Website Analyzer Service
 * Uses Claude AI via OpenRouter to extract business messaging from website content
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface WebsiteMessagingAnalysis {
  valuePropositions: string[]
  targetAudience: string[]
  customerProblems: string[]
  solutions: string[]
  proofPoints: string[]
  differentiators: string[]
  confidence: number
}

class WebsiteAnalyzerService {
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
   * Analyze website content using Claude AI to extract business messaging
   */
  async analyzeWebsiteMessaging(
    websiteContent: string,
    businessName: string
  ): Promise<WebsiteMessagingAnalysis> {
    if (!OPENROUTER_API_KEY) {
      console.warn('[WebsiteAnalyzer] No OpenRouter API key configured - returning empty analysis')
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

      const prompt = `You are a brand strategist analyzing a business's website content.

Business: ${businessName}
Website Content:
${truncatedContent}

Extract the following business-specific information. CRITICAL: Only include what they EXPLICITLY state. DO NOT use generic industry assumptions. If not mentioned, use empty array.

1. VALUE PROPOSITIONS: What unique benefits, guarantees, or promises do they explicitly mention?
2. TARGET AUDIENCE: Who are they explicitly talking to? Use their exact language.
3. CUSTOMER PROBLEMS: What specific problems do they say their customers face?
4. THEIR SOLUTION: How do they describe solving those problems?
5. PROOF POINTS: What credentials, experience, results, or stats do they cite?
6. DIFFERENTIATORS: What makes them different from competitors in their own words?

Return ONLY valid JSON (no markdown, no explanations):
{
  "valuePropositions": ["exact quote 1", "exact quote 2"],
  "targetAudience": ["exact audience description"],
  "customerProblems": ["problem 1 in their words"],
  "solutions": ["how they solve it"],
  "proofPoints": ["credential 1", "stat 1"],
  "differentiators": ["unique factor 1"]
}`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://marba.ai',
          'X-Title': 'MARBA Intelligence',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
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

      return {
        valuePropositions: analysis.valuePropositions || [],
        targetAudience: analysis.targetAudience || [],
        customerProblems: analysis.customerProblems || [],
        solutions: analysis.solutions || [],
        proofPoints: analysis.proofPoints || [],
        differentiators: analysis.differentiators || [],
        confidence
      }
    } catch (error) {
      console.error('[WebsiteAnalyzer] AI analysis failed:', error)

      // Return empty analysis on error (graceful fallback)
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
}

export const websiteAnalyzer = new WebsiteAnalyzerService()
export { WebsiteAnalyzerService }
