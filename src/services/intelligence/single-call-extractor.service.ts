/**
 * Single-Call Intelligence Extractor
 *
 * ONE AI call extracts ALL data - no browser connection bottleneck.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    SINGLE AI CALL (~30-45 seconds)                      │
 * │  Browser ──► 1 API Call ──► AI extracts ALL data at once ──► Results   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Extracts in ONE prompt:
 * - Products/Services (up to 20)
 * - Target Customers with drivers (up to 10)
 * - Differentiators (up to 5)
 * - Buyer Personas (up to 5)
 * - Transformations (up to 5)
 *
 * No browser connection limits, no sequential delays, maximum parallelism
 * on the AI side.
 *
 * Created: 2025-11-25
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SingleCallExtractionResult {
  products: {
    name: string;
    description: string;
    category: string;
    confidence: number;
    sourceExcerpt?: string;
  }[];

  customers: {
    statement: string;
    industry?: string;
    companySize?: string;
    role?: string;
    emotionalDrivers: string[];
    functionalDrivers: string[];
    evidenceQuotes: string[];
    confidence: number;
  }[];

  differentiators: {
    statement: string;
    evidence: string;
    category: string;
    strengthScore: number;
  }[];

  buyerPersonas: {
    name: string;
    title: string;
    industry: string;
    painPoints: string[];
    desiredOutcomes: string[];
    buyingBehavior: string;
    confidence: number;
  }[];

  transformations: {
    fromState: string;
    toState: string;
    mechanism: string;
    confidence: number;
  }[];

  metadata: {
    extractionTime: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    warnings: string[];
  };
}

class SingleCallExtractorService {
  /**
   * Extract ALL intelligence in ONE AI call
   */
  async extractAll(
    websiteContent: string,
    businessName: string,
    industry: string,
    testimonials: string[] = []
  ): Promise<SingleCallExtractionResult> {
    const startTime = Date.now();

    console.log('[SingleCallExtractor] Starting SINGLE AI call extraction...');
    console.log(`  - Business: ${businessName}`);
    console.log(`  - Industry: ${industry}`);
    console.log(`  - Content length: ${websiteContent.length} chars`);
    console.log(`  - Testimonials: ${testimonials.length}`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[SingleCallExtractor] No Supabase config - returning empty result');
      return this.emptyResult(Date.now() - startTime);
    }

    try {
      const prompt = this.buildMegaPrompt(websiteContent, businessName, industry, testimonials);

      console.log('[SingleCallExtractor] Calling AI (single comprehensive extraction)...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4', // Fast + capable
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';

      console.log('[SingleCallExtractor] AI response received, parsing...');

      const parsed = this.parseResponse(responseText);
      const extractionTime = Date.now() - startTime;

      console.log('[SingleCallExtractor] ========================================');
      console.log(`[SingleCallExtractor] SINGLE-CALL EXTRACTION COMPLETE`);
      console.log(`[SingleCallExtractor] Total Time: ${extractionTime}ms (${(extractionTime / 1000).toFixed(1)}s)`);
      console.log(`[SingleCallExtractor] Results:`);
      console.log(`  - Products: ${parsed.products.length}`);
      console.log(`  - Customers: ${parsed.customers.length}`);
      console.log(`  - Differentiators: ${parsed.differentiators.length}`);
      console.log(`  - Buyer Personas: ${parsed.buyerPersonas.length}`);
      console.log(`  - Transformations: ${parsed.transformations.length}`);
      console.log('[SingleCallExtractor] ========================================');

      return {
        ...parsed,
        metadata: {
          extractionTime,
          dataQuality: this.assessQuality(parsed),
          warnings: []
        }
      };

    } catch (error) {
      console.error('[SingleCallExtractor] Extraction failed:', error);
      return this.emptyResult(Date.now() - startTime, [
        `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    }
  }

  private buildMegaPrompt(
    content: string,
    businessName: string,
    industry: string,
    testimonials: string[]
  ): string {
    // Truncate content to reasonable size for single call
    const truncatedContent = content.slice(0, 15000);
    const testimonialText = testimonials.slice(0, 10).join('\n');

    return `You are a business intelligence analyst. Extract ALL of the following from this website content in ONE comprehensive analysis.

BUSINESS: ${businessName}
INDUSTRY: ${industry}

WEBSITE CONTENT:
${truncatedContent}

${testimonialText ? `CUSTOMER TESTIMONIALS:\n${testimonialText}` : ''}

EXTRACT ALL OF THE FOLLOWING (return valid JSON only, no markdown):

{
  "products": [
    // UP TO 20 products/services explicitly mentioned
    // Each: { "name": "", "description": "", "category": "", "confidence": 0-100, "sourceExcerpt": "" }
    // Categories: "Core Service", "Product", "Add-on", "Package", "Solution"
    // Only include what's EXPLICITLY mentioned, never infer
  ],

  "customers": [
    // UP TO 10 target customer profiles
    // Each: {
    //   "statement": "Description of who this customer is",
    //   "industry": "",
    //   "companySize": "small/medium/large/enterprise",
    //   "role": "Job title/role",
    //   "emotionalDrivers": ["What they want to FEEL/BECOME (JTBD emotional job - identity transformation, NOT business metrics)"],
    //   "functionalDrivers": ["The progress they want to make (JTBD functional job)"],
    //   "evidenceQuotes": ["Direct quotes from testimonials if available"],
    //   "confidence": 0-100
    // }
    //
    // CRITICAL: emotionalDrivers must be TRUE emotional JTBD:
    // BAD: "Fear of losing revenue", "Desire for efficiency"
    // GOOD: "Want to feel proud showing work to peers", "Want to become the go-to expert"
  ],

  "differentiators": [
    // UP TO 5 unique differentiators
    // Each: {
    //   "statement": "What makes them different",
    //   "evidence": "Exact quote from website",
    //   "category": "methodology/process/proprietary/unique_feature",
    //   "strengthScore": 0-100
    // }
  ],

  "buyerPersonas": [
    // UP TO 5 buyer personas derived from testimonials/content
    // Each: {
    //   "name": "Descriptive persona name",
    //   "title": "Job title",
    //   "industry": "",
    //   "painPoints": ["What problems they have"],
    //   "desiredOutcomes": ["What they want to achieve"],
    //   "buyingBehavior": "How they make decisions",
    //   "confidence": 0-100
    // }
  ],

  "transformations": [
    // UP TO 5 customer transformations (before → after)
    // Each: {
    //   "fromState": "Current pain/problem state",
    //   "toState": "Desired outcome state",
    //   "mechanism": "How the business enables this",
    //   "confidence": 0-100
    // }
  ]
}

CRITICAL RULES:
1. Only extract what's EXPLICITLY stated - never infer or create
2. Include evidence quotes where possible
3. Be comprehensive - extract as many items as the content supports
4. Higher confidence (80+) for items with direct quotes/evidence
5. Lower confidence (50-70) for items inferred from context
6. Return ONLY valid JSON, no markdown code blocks`;
  }

  private parseResponse(responseText: string): Omit<SingleCallExtractionResult, 'metadata'> {
    try {
      // Strip markdown if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      return {
        products: parsed.products || [],
        customers: parsed.customers || [],
        differentiators: parsed.differentiators || [],
        buyerPersonas: parsed.buyerPersonas || [],
        transformations: parsed.transformations || []
      };
    } catch (error) {
      console.error('[SingleCallExtractor] JSON parse failed:', error);
      console.log('[SingleCallExtractor] Raw response:', responseText.slice(0, 500));

      // Attempt repair
      return this.attemptRepair(responseText);
    }
  }

  private attemptRepair(text: string): Omit<SingleCallExtractionResult, 'metadata'> {
    // Try to extract partial data even from malformed JSON
    const result: Omit<SingleCallExtractionResult, 'metadata'> = {
      products: [],
      customers: [],
      differentiators: [],
      buyerPersonas: [],
      transformations: []
    };

    try {
      // Try to find and parse products array
      const productsMatch = text.match(/"products"\s*:\s*\[([\s\S]*?)\]/);
      if (productsMatch) {
        const productsJson = `[${productsMatch[1]}]`;
        try {
          result.products = JSON.parse(productsJson);
        } catch {}
      }

      // Try customers
      const customersMatch = text.match(/"customers"\s*:\s*\[([\s\S]*?)\]/);
      if (customersMatch) {
        try {
          result.customers = JSON.parse(`[${customersMatch[1]}]`);
        } catch {}
      }

      // Try differentiators
      const diffMatch = text.match(/"differentiators"\s*:\s*\[([\s\S]*?)\]/);
      if (diffMatch) {
        try {
          result.differentiators = JSON.parse(`[${diffMatch[1]}]`);
        } catch {}
      }

      // Try personas
      const personasMatch = text.match(/"buyerPersonas"\s*:\s*\[([\s\S]*?)\]/);
      if (personasMatch) {
        try {
          result.buyerPersonas = JSON.parse(`[${personasMatch[1]}]`);
        } catch {}
      }

      // Try transformations
      const transMatch = text.match(/"transformations"\s*:\s*\[([\s\S]*?)\]/);
      if (transMatch) {
        try {
          result.transformations = JSON.parse(`[${transMatch[1]}]`);
        } catch {}
      }

    } catch (error) {
      console.error('[SingleCallExtractor] Repair failed:', error);
    }

    return result;
  }

  private assessQuality(data: Omit<SingleCallExtractionResult, 'metadata'>): 'excellent' | 'good' | 'fair' | 'poor' {
    const total =
      data.products.length +
      data.customers.length +
      data.differentiators.length +
      data.buyerPersonas.length +
      data.transformations.length;

    if (total >= 30) return 'excellent';
    if (total >= 20) return 'good';
    if (total >= 10) return 'fair';
    return 'poor';
  }

  private emptyResult(extractionTime: number, warnings: string[] = []): SingleCallExtractionResult {
    return {
      products: [],
      customers: [],
      differentiators: [],
      buyerPersonas: [],
      transformations: [],
      metadata: {
        extractionTime,
        dataQuality: 'poor',
        warnings
      }
    };
  }
}

export const singleCallExtractor = new SingleCallExtractorService();
export { SingleCallExtractorService };
