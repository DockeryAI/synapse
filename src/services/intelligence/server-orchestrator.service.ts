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

    onProgress?.({
      stage: 'sending',
      progress: 5,
      message: 'Preparing analysis request...'
    });

    // Simulate progress stages over ~65 seconds for Opus 4.5
    // Total 5 stages: preparing (5%), connecting (15%), analyzing (30-60%), extracting (70%), finalizing (85%)
    const progressInterval = setInterval(() => {
      // This will be cleared when we get the response
    }, 1000);

    // Stage 1: Preparing (0-5 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'sending',
        progress: 10,
        message: 'Connecting to AI server...'
      });
    }, 2000);

    // Stage 2: Connected (5-13 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 20,
        message: 'Analyzing website content...'
      });
    }, 6000);

    // Stage 3: Analyzing products (13-26 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 35,
        message: 'Extracting products & services...'
      });
    }, 13000);

    // Stage 4: Analyzing customers (26-39 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 50,
        message: 'Identifying customer profiles...'
      });
    }, 26000);

    // Stage 5: Extracting benefits (39-52 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 65,
        message: 'Extracting benefits & differentiators...'
      });
    }, 39000);

    // Stage 6: Transformations (52-60 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 80,
        message: 'Building transformation insights...'
      });
    }, 52000);

    // Stage 7: Almost done (60-65 seconds)
    setTimeout(() => {
      onProgress?.({
        stage: 'processing',
        progress: 90,
        message: 'Finalizing analysis...'
      });
    }, 60000);

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

      clearInterval(progressInterval);

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
