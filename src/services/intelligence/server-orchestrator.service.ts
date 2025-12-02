/**
 * Server-Side Orchestrator Client
 *
 * Makes ONE call to Supabase Edge Function which runs ALL extractions in parallel
 * server-side, bypassing browser's 6-TCP-connection limit.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Browser ──► 1 Request ──► Edge Function ──► 6 Parallel AI ──► │
 * │                                                                 │
 * │  Result: All data in ~30-40 seconds (vs 2+ minutes client-side) │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * PROGRESSIVE LOADING (2025-12-02):
 * Phase 1: Products, Customers, Differentiators (~15s) → Show UI
 * Phase 2: BuyerPersonas, Transformations, Benefits (background)
 *
 * Created: 2025-11-25
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
// Note: Legacy format types imported but conversion returns 'any' for flexibility

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ServerExtractionResult {
  // Raw extraction data (matches edge function output)
  products: Array<{
    name: string;
    description: string;
    category: string;
    confidence: number;
    sourceExcerpt?: string;
  }>;

  customers: Array<{
    statement: string;
    industry?: string;
    companySize?: string;
    role?: string;
    emotionalDrivers: string[];
    functionalDrivers: string[];
    evidenceQuotes: string[];
    confidence: number;
  }>;

  differentiators: Array<{
    statement: string;
    evidence: string;
    category: string;
    strengthScore: number;
  }>;

  buyerPersonas: Array<{
    name: string;
    title: string;
    industry: string;
    painPoints: string[];
    desiredOutcomes: string[];
    buyingBehavior: string;
    triggers?: string[];
    objections?: string[];
    confidence: number;
  }>;

  transformations: Array<{
    fromState: string;
    toState: string;
    mechanism: string;
    timeline?: string;
    metrics?: string;
    confidence: number;
  }>;

  benefits: Array<{
    feature: string;
    benefit: string;
    emotionalBenefit?: string;
    category: string;
    confidence: number;
  }>;

  extractionTime: number;
  parallelCalls: number;
}

export interface OrchestrationProgress {
  stage: 'sending' | 'processing' | 'complete';
  progress: number;
  message: string;
}

class ServerOrchestratorService {
  // Cache for prepared content (used across phases)
  private cachedContent: { websiteContent: string; testimonials: string[] } | null = null;

  /**
   * Phase 1: Extract Products, Customers, Differentiators (~15s)
   * Critical data for showing Products page immediately
   */
  async extractPhase0(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<Partial<ServerExtractionResult>> {
    console.log('🚀🚀🚀 [ServerOrchestrator] PHASE 0: PRODUCTS ONLY (~12-15s) 🚀🚀🚀');
    return this.extractWithPhase(websiteData, businessName, industry, 0, onProgress);
  }

  /**
   * Phase 1: Extract Customers ONLY (parallel with Phase 0)
   */
  async extractPhase1(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<Partial<ServerExtractionResult>> {
    console.log('[ServerOrchestrator] PHASE 1: Customers ONLY (parallel with Products)');
    return this.extractWithPhase(websiteData, businessName, industry, 1, onProgress);
  }

  /**
   * Phase 2: Extract Differentiators ONLY (after Products + Customers complete)
   */
  async extractPhase2(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<Partial<ServerExtractionResult>> {
    console.log('[ServerOrchestrator] PHASE 2: Differentiators ONLY (after Products + Customers)');
    return this.extractWithPhase(websiteData, businessName, industry, 2, onProgress);
  }

  /**
   * Phase 3: Extract Benefits ONLY (after Differentiators complete)
   */
  async extractPhase3(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<Partial<ServerExtractionResult>> {
    console.log('[ServerOrchestrator] PHASE 3: Benefits ONLY (after Differentiators)');
    return this.extractWithPhase(websiteData, businessName, industry, 3, onProgress);
  }

  /**
   * Internal: Extract with specific phase
   */
  private async extractWithPhase(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    phase: 0 | 1 | 2 | 3,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<Partial<ServerExtractionResult>> {
    const startTime = Date.now();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Cache content for reuse across phases
    if (!this.cachedContent) {
      this.cachedContent = {
        websiteContent: this.prepareContent(websiteData),
        testimonials: this.extractTestimonials(websiteData)
      };
    }

    const { websiteContent, testimonials } = this.cachedContent;

    onProgress?.({
      stage: 'sending',
      progress: 0,
      message: phase === 1 ? 'Scanning for products and services' : 'Analyzing buyer personas'
    });

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteContent,
          businessName,
          industry,
          testimonials,
          phase // Send phase to Edge Function
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Server orchestrator error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      const totalTime = Date.now() - startTime;

      console.log(`[ServerOrchestrator] Phase ${phase} complete in ${totalTime}ms`);
      console.log(`[ServerOrchestrator] Server processing: ${result.extractionTime}ms`);
      console.log(`[ServerOrchestrator] Server reported phase: ${result.phase}, parallelCalls: ${result.parallelCalls}`);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Phase ${phase} complete in ${(totalTime / 1000).toFixed(1)}s`
      });

      return result;
    } catch (error) {
      console.error(`[ServerOrchestrator] Phase ${phase} failed:`, error);
      throw error;
    }
  }

  /**
   * Clear cached content (call when starting new extraction)
   */
  clearCache(): void {
    this.cachedContent = null;
  }

  /**
   * Call server-side orchestrator for parallel extraction
   * ONE request, ALL data, ~30-40 seconds
   */
  async extractAll(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: OrchestrationProgress) => void
  ): Promise<ServerExtractionResult> {
    const startTime = Date.now();

    console.log('[ServerOrchestrator] Starting server-side parallel extraction...');
    console.log(`  - Business: ${businessName}`);
    console.log(`  - Industry: ${industry}`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Prepare website content
    const websiteContent = this.prepareContent(websiteData);
    const testimonials = this.extractTestimonials(websiteData);

    console.log(`  - Content length: ${websiteContent.length} chars`);
    console.log(`  - Testimonials: ${testimonials.length}`);

    // 5 sections, 65 seconds total = 13 seconds per section
    // Progress: 0% -> 20% -> 40% -> 60% -> 80% -> 100%
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Section 1: Scanning website content (0-13s)
    onProgress?.({
      stage: 'sending',
      progress: 0,
      message: 'Scanning website content'
    });

    // Section 2: Scanning for services/products (13s)
    timeouts.push(setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 20,
        message: 'Scanning website for services and products'
      });
    }, 13000));

    // Section 3: Analyzing testimonials (26s)
    timeouts.push(setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 40,
        message: 'Analyzing customer testimonials and case studies'
      });
    }, 26000));

    // Section 4: Extracting value propositions (39s)
    timeouts.push(setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 60,
        message: 'Extracting value propositions'
      });
    }, 39000));

    // Section 5: Extracting products/services (52s)
    timeouts.push(setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 80,
        message: 'Extracting products and services'
      });
    }, 52000));

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteContent,
          businessName,
          industry,
          testimonials
        })
      });

      // Clear all progress timeouts
      timeouts.forEach(t => clearTimeout(t));

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Server orchestrator error: ${response.status} - ${error}`);
      }

      const result: ServerExtractionResult = await response.json();

      const totalTime = Date.now() - startTime;

      console.log('[ServerOrchestrator] ========================================');
      console.log('[ServerOrchestrator] SERVER-SIDE EXTRACTION COMPLETE');
      console.log(`[ServerOrchestrator] Client → Server → Response: ${totalTime}ms`);
      console.log(`[ServerOrchestrator] Server Processing: ${result.extractionTime}ms`);
      console.log(`[ServerOrchestrator] Parallel Calls: ${result.parallelCalls}`);
      console.log(`[ServerOrchestrator] Results:`);
      console.log(`  - Products: ${result.products.length}`);
      console.log(`  - Customers: ${result.customers.length}`);
      console.log(`  - Differentiators: ${result.differentiators.length}`);
      console.log(`  - Buyer Personas: ${result.buyerPersonas.length}`);
      console.log(`  - Transformations: ${result.transformations.length}`);
      console.log(`  - Benefits: ${result.benefits.length}`);
      // Log timing data if available
      if ((result as any)._timing) {
        const timing = (result as any)._timing;
        console.log('[ServerOrchestrator] === PARALLEL TIMING ANALYSIS ===');
        console.log(`[ServerOrchestrator] Total: ${timing.totalTime}ms | Sum: ${timing.sumDurations}ms | Efficiency: ${timing.parallelEfficiency}`);
        console.log(`[ServerOrchestrator] Is Parallel: ${timing.isParallel}`);
        timing.calls?.forEach((t: any) => {
          console.log(`[ServerOrchestrator]   ${t.name}: +${t.startedAt}ms → +${t.completedAt}ms (${t.duration}ms) [key ${t.key}]`);
        });
      }
      console.log('[ServerOrchestrator] ========================================');

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Complete in ${(totalTime / 1000).toFixed(1)}s`
      });

      return result;

    } catch (error) {
      console.error('[ServerOrchestrator] Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Convert server result to existing type formats (for backward compatibility)
   * Uses 'any' for flexible integration - types validated at runtime
   */
  convertToLegacyFormats(result: ServerExtractionResult): {
    products: any;
    customers: any;
    differentiators: any;
    buyerIntelligence: any;
    transformations: any;
    benefits: any;
  } {
    return {
      products: {
        products: result.products.map((p, i) => ({
          id: `prod-${i}`,
          name: p.name,
          description: p.description,
          category: p.category as any,
          confidence: p.confidence,
          evidence: p.sourceExcerpt ? [p.sourceExcerpt] : [],
          pricing: undefined
        })),
        // Generate categories array from unique product categories
        categories: [...new Set(result.products.map(p => p.category))],
        confidence: {
          overall: this.avgConfidence(result.products.map(p => p.confidence)),
          dataQuality: 80,
          modelAgreement: this.avgConfidence(result.products.map(p => p.confidence))
        },
        sources: [],
        extractionConfidence: this.avgConfidence(result.products.map(p => p.confidence)),
        totalFound: result.products.length,
        timestamp: new Date().toISOString()
      },

      customers: {
        profiles: result.customers.map((c, i) => ({
          id: `cust-${i}`,
          statement: c.statement,
          industry: c.industry || 'General',
          companySize: (c.companySize || 'medium') as any,
          role: c.role || 'Decision Maker',
          emotionalDrivers: c.emotionalDrivers || [],
          functionalDrivers: c.functionalDrivers || [],
          evidenceQuotes: c.evidenceQuotes || [],
          confidence: c.confidence
        })),
        extractionConfidence: this.avgConfidence(result.customers.map(c => c.confidence)),
        totalFound: result.customers.length,
        timestamp: new Date().toISOString()
      },

      differentiators: {
        differentiators: result.differentiators.map((d, i) => ({
          id: `diff-${i}`,
          statement: d.statement,
          // outcomeStatement for solutions - use the statement as it describes the unique approach
          outcomeStatement: d.statement,
          evidence: d.evidence,
          category: d.category as any,
          strengthScore: d.strengthScore
        })),
        extractionConfidence: this.avgConfidence(result.differentiators.map(d => d.strengthScore)),
        totalFound: result.differentiators.length,
        timestamp: new Date().toISOString()
      },

      buyerIntelligence: {
        personas: result.buyerPersonas.map((p, i) => ({
          id: `persona-${i}`,
          name: p.name,
          title: p.title,
          industry: p.industry,
          company_size: 'medium' as any,
          pain_points: p.painPoints.map((pp, j) => ({
            description: pp,
            category: 'other' as any,
            intensity: 'high' as any,
            frequency: 70,
            evidence: []
          })),
          desired_outcomes: p.desiredOutcomes.map((o, j) => ({
            description: o,
            evidence: []
          })),
          buying_behavior: {
            decision_speed: 'moderate' as any,
            research_intensity: 'moderate' as any,
            price_sensitivity: 'medium' as any,
            relationship_vs_transactional: 'relationship' as any,
            evidence: []
          },
          confidence_score: p.confidence
        })),
        total_evidence_points: result.buyerPersonas.length * 5,
        extraction_quality: 'good' as const,
        extraction_timestamp: new Date().toISOString(),
        common_pain_points: [],
        common_outcomes: [],
        industry_patterns: [],
        data_gaps: [],
        assumptions_made: []
      },

      transformations: {
        goals: result.transformations.map((t, i) => ({
          id: `trans-${i}`,
          statement: `${t.fromState} → ${t.toState}`,
          // outcomeStatement is the JTBD-transformed outcome-focused version for synthesis
          outcomeStatement: t.toState, // The "after" state IS the outcome
          before: t.fromState,
          after: t.toState,
          how: t.mechanism,
          emotionalDrivers: [],
          functionalDrivers: [],
          eqScore: { emotional: 65, rational: 65, overall: 65 },
          confidence: {
            overall: t.confidence,
            dataQuality: 70,
            sourceCount: 1,
            modelAgreement: t.confidence,
            reasoning: 'Server-side extraction'
          },
          sources: [],
          customerQuotes: [],
          isManualInput: false
        })),
        source: 'generated' as const,
        confidence: this.avgConfidence(result.transformations.map(t => t.confidence)),
        method: 'server-side-parallel'
      },

      benefits: {
        benefits: result.benefits.map((b, i) => ({
          id: `ben-${i}`,
          feature: b.feature,
          benefit: b.benefit,
          // outcomeStatement uses emotionalBenefit (identity-level) > benefit (outcome-level) > feature
          outcomeStatement: b.emotionalBenefit || b.benefit || b.feature,
          emotionalBenefit: b.emotionalBenefit,
          category: b.category as any,
          confidence: b.confidence
        })),
        extractionConfidence: this.avgConfidence(result.benefits.map(b => b.confidence)),
        totalFound: result.benefits.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  private avgConfidence(scores: number[]): number {
    if (scores.length === 0) return 50;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private prepareContent(websiteData: WebsiteData): string {
    // Compile ALL available content for maximum extraction quality
    const parts: string[] = [];

    // Add metadata
    if (websiteData.metadata?.title) {
      parts.push(`TITLE: ${websiteData.metadata.title}`);
    }
    if (websiteData.metadata?.description) {
      parts.push(`DESCRIPTION: ${websiteData.metadata.description}`);
    }

    // Add headings
    if (websiteData.content?.headings?.length) {
      parts.push('HEADINGS:');
      parts.push(...websiteData.content.headings);
    }

    // Add paragraphs
    if (websiteData.content?.paragraphs?.length) {
      parts.push('CONTENT:');
      parts.push(...websiteData.content.paragraphs);
    }

    // Add navigation (often contains service names)
    if (websiteData.structure?.navigation?.length) {
      parts.push('NAVIGATION/MENU:');
      parts.push(...websiteData.structure.navigation);
    }

    // Add link texts (often contain product/service names)
    if (websiteData.content?.links?.length) {
      const linkTexts = websiteData.content.links
        .map((l: any) => typeof l === 'string' ? l : l?.text || l?.href)
        .filter((t: string) => t && t.length > 2 && t.length < 100);
      if (linkTexts.length) {
        parts.push('LINKS:');
        parts.push(...linkTexts.slice(0, 50));
      }
    }

    const content = parts.join('\n');
    console.log(`[ServerOrchestrator] Prepared content: ${content.length} chars from ${parts.length} parts`);
    return content;
  }

  private extractTestimonials(websiteData: WebsiteData): string[] {
    return websiteData.content.paragraphs.filter(p =>
      p.includes('"') || p.includes('helped') || p.includes('amazing') || p.length > 100
    ).slice(0, 10);
  }
}

export const serverOrchestrator = new ServerOrchestratorService();
export { ServerOrchestratorService };
