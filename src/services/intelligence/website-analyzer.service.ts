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

// Brand Voice Profile - extracted from website tone analysis
export interface BrandVoiceProfile {
  tone: ('professional' | 'friendly' | 'authoritative' | 'casual' | 'inspiring' | 'technical' | 'conversational')[];
  values: string[];
  personality: string[];
  vocabularyPatterns: string[];  // Power words and phrases they use
  avoidWords: string[];          // Words/styles that don't match their voice
  signaturePhrases: string[];    // Unique expressions from their content
  sentenceStyle: 'short' | 'medium' | 'long' | 'mixed';
  emotionalTemperature: 'warm' | 'neutral' | 'urgent' | 'calm';
  confidence: number;
}

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

  // Brand voice/tone analysis
  brandVoice?: BrandVoiceProfile

  // Phase 6: Enhanced proof extraction
  extractedProof?: {
    trustBadges: string[];     // BBB, security seals, etc.
    clientLogos: string[];     // Company names from logo sections
    awards: string[];          // Awards and recognition
    pressMentions: string[];   // "As seen in" press logos
    certifications: string[];  // Professional certifications
    socialProof: string[];     // Follower counts, review counts
  }
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
   * Phase 6: Extract proof elements from raw website HTML/content
   * Uses pattern matching for common proof indicators
   */
  extractProofElements(rawContent?: string): {
    trustBadges: string[];
    clientLogos: string[];
    awards: string[];
    pressMentions: string[];
    certifications: string[];
    socialProof: string[];
  } {
    const content = rawContent || this.lastScrapeResult?.content?.rawText || '';
    const textContent = this.lastScrapeResult?.content?.text || '';

    const result = {
      trustBadges: [] as string[],
      clientLogos: [] as string[],
      awards: [] as string[],
      pressMentions: [] as string[],
      certifications: [] as string[],
      socialProof: [] as string[]
    };

    if (!content && !textContent) return result;

    const fullContent = `${content} ${textContent}`.toLowerCase();

    // 6.2 Trust Badge Detection
    const badgePatterns = [
      /bbb\s*(accredited|a\+|rating)/i,
      /ssl\s*(secure|certificate)/i,
      /norton\s*secured?/i,
      /mcafee\s*secure/i,
      /verified\s*(by|buyer|purchase)/i,
      /trust\s*pilot/i,
      /secure\s*(checkout|payment|site)/i,
      /pci\s*(dss|compliant)/i,
      /hipaa\s*compliant/i,
      /gdpr\s*compliant/i
    ];
    badgePatterns.forEach(pattern => {
      const match = fullContent.match(pattern);
      if (match) result.trustBadges.push(match[0]);
    });

    // 6.3 Client Logo Detection (look for alt text patterns)
    const logoPatterns = [
      /trusted\s*by\s*([^<\n]+)/gi,
      /our\s*clients?\s*include\s*([^<\n]+)/gi,
      /used\s*by\s*([^<\n]+)/gi,
      /partners?\s*include\s*([^<\n]+)/gi,
      /logo[^>]*alt\s*=\s*["']([^"']+)["']/gi
    ];
    logoPatterns.forEach(pattern => {
      const matches = fullContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2 && match[1].length < 100) {
          result.clientLogos.push(match[1].trim());
        }
      }
    });

    // 6.5 Awards Detection
    const awardPatterns = [
      /best\s*(of|in)\s*\d{4}/gi,
      /award\s*winner/gi,
      /(\d{4}\s*)?(gold|silver|bronze)\s*award/gi,
      /top\s*rated\s*\d{4}/gi,
      /voted\s*(#?\d+|best|top)/gi,
      /winner\s*of\s*([^<\n]+)/gi,
      /recognized\s*(by|as)\s*([^<\n]+)/gi
    ];
    awardPatterns.forEach(pattern => {
      const matches = fullContent.matchAll(pattern);
      for (const match of matches) {
        result.awards.push(match[0].trim());
      }
    });

    // 6.4 Press/Media Detection
    const pressPatterns = [
      /as\s*seen\s*(on|in)\s*([^<\n]{3,50})/gi,
      /featured\s*(on|in)\s*([^<\n]{3,50})/gi,
      /press\s*mention/gi,
      /media\s*coverage/gi,
      /(forbes|techcrunch|wsj|wall street journal|nyt|new york times|cnn|bbc|cnbc)/gi
    ];
    pressPatterns.forEach(pattern => {
      const matches = fullContent.matchAll(pattern);
      for (const match of matches) {
        result.pressMentions.push(match[0].trim());
      }
    });

    // 6.1 Certifications Detection
    const certPatterns = [
      /soc\s*2\s*(type\s*[12i])?/gi,
      /iso\s*(27001|9001|14001)/gi,
      /certified\s*([a-z]+\s*){1,3}/gi,
      /licensed\s*(and\s*)?(insured|bonded)/gi,
      /accredited\s*(by\s*)?([^<\n]{3,30})?/gi,
      /(board\s*)?certified\s*(professional|expert)?/gi,
      /(\d+)\s*years?\s*(of\s*)?(experience|in\s*business|serving)/gi
    ];
    certPatterns.forEach(pattern => {
      const matches = fullContent.matchAll(pattern);
      for (const match of matches) {
        result.certifications.push(match[0].trim());
      }
    });

    // Social Proof Detection
    const socialPatterns = [
      /(\d+[,\d]*k?)\+?\s*(followers?|customers?|users?|clients?|reviews?)/gi,
      /(\d+\.?\d*)\s*star(s)?\s*(rating|reviews?)?/gi,
      /rated\s*(\d\.?\d?)\s*(out\s*of\s*5|stars?)/gi,
      /(\d+)\s*happy\s*(customers?|clients?)/gi,
      /join\s*(\d+[,\d]*k?)\+?\s*(others?|customers?|users?)/gi
    ];
    socialPatterns.forEach(pattern => {
      const matches = fullContent.matchAll(pattern);
      for (const match of matches) {
        result.socialProof.push(match[0].trim());
      }
    });

    // Deduplicate and limit
    result.trustBadges = [...new Set(result.trustBadges)].slice(0, 10);
    result.clientLogos = [...new Set(result.clientLogos)].slice(0, 20);
    result.awards = [...new Set(result.awards)].slice(0, 10);
    result.pressMentions = [...new Set(result.pressMentions)].slice(0, 10);
    result.certifications = [...new Set(result.certifications)].slice(0, 10);
    result.socialProof = [...new Set(result.socialProof)].slice(0, 10);

    const totalFound = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    if (totalFound > 0) {
      console.log(`[WebsiteAnalyzer] Phase 6: Extracted ${totalFound} proof elements`);
    }

    return result;
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
          model: 'anthropic/claude-opus-4.5',
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
   * Analyze brand voice and tone from website content
   * Uses Claude to detect communication style, personality, and vocabulary patterns
   */
  async analyzeBrandVoice(
    websiteContent: string,
    businessName: string
  ): Promise<BrandVoiceProfile> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[WebsiteAnalyzer] No Supabase configuration - returning default brand voice')
      return this.getDefaultBrandVoice();
    }

    try {
      console.log('[WebsiteAnalyzer] Analyzing brand voice for:', businessName)

      // Truncate content to avoid token limits
      const truncatedContent = websiteContent.slice(0, 15000)

      const prompt = `You are a brand communication expert. Analyze this website content to understand the brand's voice, tone, and communication style.

Business: ${businessName}
Website Content:
${truncatedContent}

Analyze these aspects of their communication style:

1. PRIMARY TONE (select 1-3 that best apply):
   - professional: Formal language, industry terminology, structured communication
   - friendly: Conversational, approachable, warm, uses "you/we"
   - authoritative: Expert voice, data-driven, commands respect
   - casual: Relaxed, informal, possibly humorous
   - inspiring: Aspirational, emotional, motivational language
   - technical: Jargon-heavy, detailed specifications
   - conversational: Natural dialogue, questions, personal stories

2. BRAND VALUES (what they clearly care about from their messaging):
   Examples: trust, innovation, quality, customer-first, expertise, reliability, speed, value

3. PERSONALITY TRAITS (how they come across):
   Examples: confident, humble, bold, conservative, innovative, caring, direct, thoughtful

4. VOCABULARY PATTERNS (power words and phrases they use repeatedly):
   Extract 5-10 specific words or short phrases they favor

5. WORDS TO AVOID (styles/language that would NOT match their voice):
   What tone or words are conspicuously absent?

6. SIGNATURE PHRASES (unique expressions, taglines, or recurring statements):
   Exact quotes from their content

7. SENTENCE STYLE: Are their sentences mostly short/punchy, medium-length, long/detailed, or mixed?

8. EMOTIONAL TEMPERATURE: warm (personal, emotional), neutral (balanced), urgent (action-driven), or calm (reassuring)

Return ONLY valid JSON (no markdown, no explanations):
{
  "tone": ["professional", "friendly"],
  "values": ["trust", "expertise", "customer-first"],
  "personality": ["confident", "caring", "direct"],
  "vocabularyPatterns": ["specific phrase 1", "power word 2"],
  "avoidWords": ["overly casual language", "aggressive sales speak"],
  "signaturePhrases": ["their exact tagline", "recurring phrase"],
  "sentenceStyle": "medium",
  "emotionalTemperature": "warm"
}`

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 2048,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        console.error('[WebsiteAnalyzer] Brand voice API error:', response.status)
        return this.getDefaultBrandVoice();
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      // Clean and parse JSON
      let cleaned = analysisText.trim()
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')
      cleaned = cleaned.replace(/\n?\s*```\s*$/i, '')

      const analysis = JSON.parse(cleaned)

      console.log('[WebsiteAnalyzer] Brand voice detected:')
      console.log('  - Tone:', analysis.tone?.join(', '))
      console.log('  - Values:', analysis.values?.slice(0, 3).join(', '))
      console.log('  - Sentence style:', analysis.sentenceStyle)
      console.log('  - Emotional temperature:', analysis.emotionalTemperature)

      return {
        tone: analysis.tone || ['professional'],
        values: analysis.values || [],
        personality: analysis.personality || [],
        vocabularyPatterns: analysis.vocabularyPatterns || [],
        avoidWords: analysis.avoidWords || [],
        signaturePhrases: analysis.signaturePhrases || [],
        sentenceStyle: analysis.sentenceStyle || 'medium',
        emotionalTemperature: analysis.emotionalTemperature || 'neutral',
        confidence: 85
      }
    } catch (error) {
      console.error('[WebsiteAnalyzer] Brand voice analysis failed:', error)
      return this.getDefaultBrandVoice();
    }
  }

  /**
   * Get default brand voice profile when analysis fails
   */
  private getDefaultBrandVoice(): BrandVoiceProfile {
    return {
      tone: ['professional'],
      values: [],
      personality: [],
      vocabularyPatterns: [],
      avoidWords: [],
      signaturePhrases: [],
      sentenceStyle: 'medium',
      emotionalTemperature: 'neutral',
      confidence: 0
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
