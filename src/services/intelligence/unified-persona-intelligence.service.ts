/**
 * Unified Persona Intelligence Service
 *
 * CONSOLIDATION: Merges buyer-intelligence-extractor + customer-extractor into ONE AI call
 *
 * This service extracts ALL persona-related data in a single prompt:
 * - Customer personas with roles, seniority, company info
 * - Pain points with intensity, category, quotes
 * - Desired outcomes with metrics and emotional benefits
 * - Urgency signals and buying behavior
 * - Success metrics
 * - Emotional and functional drivers for each persona
 * - Evidence quotes and confidence levels
 *
 * Performance target: ~15-20 seconds (vs 40-60 seconds for 2 separate calls)
 *
 * Created: 2025-11-25
 */

import type {
  CustomerExtractionResult,
  CustomerProfile,
  ConfidenceScore
} from '@/types/uvp-flow.types';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type {
  BuyerPersona,
  BuyerIntelligenceResult,
  PainPoint,
  DesiredOutcome,
  UrgencySignal,
  BuyerRole,
  IndustryContext,
  BuyingBehavior,
  SuccessMetrics,
  EvidenceSource,
  CompanyType,
  CompanySize
} from '@/types/buyer-persona.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Website data input
 */
export interface WebsiteData {
  url: string;
  content: string;
  testimonials?: string[];
  case_studies?: string[];
  about_page?: string;
  services?: string[];
}

/**
 * Combined result from unified extraction
 */
export interface UnifiedPersonaResult {
  // From buyer-intelligence-extractor
  buyerIntelligence: BuyerIntelligenceResult;

  // From customer-extractor (for UVP flow)
  customerProfiles: CustomerExtractionResult;
}

/**
 * Raw unified extraction from Claude
 */
interface RawUnifiedPersonaExtraction {
  personas: {
    // Core identification
    persona_name: string;
    statement: string; // Customer profile statement for UVP flow

    // Role info
    role_title: string;
    role_seniority: string;
    department?: string;

    // Company info
    company_type: string;
    company_size: string;
    industry: string;
    sub_industry?: string;

    // Pain points with full detail
    pain_points: {
      description: string;
      category: string;
      intensity: string;
      quote: string;
    }[];

    // Desired outcomes
    desired_outcomes: {
      description: string;
      metric?: string;
      emotional_benefit?: string;
      quote: string;
    }[];

    // Urgency signals
    urgency_signals: {
      trigger: string;
      signal_type: string;
      severity: string;
      quote: string;
    }[];

    // Buying behavior
    buying_behavior: {
      decision_speed: string;
      research_intensity: string;
      price_sensitivity: string;
      relationship_vs_transactional: string;
    };

    // Success metrics
    success_metrics: {
      metric: string;
      baseline?: string;
      achieved?: string;
      improvement?: string;
      category: string;
    }[];

    // Persona-specific drivers (for UVP Target Customer cards)
    emotional_drivers: string[];
    functional_drivers: string[];

    // Evidence
    evidence_quotes: string[];
    source_sections: string[];
    confidence_level: 'high' | 'medium' | 'low';
  }[];

  // Common patterns across personas
  common_pain_points: string[];
  common_outcomes: string[];
  industry_patterns: string[];

  // Quality indicators
  data_quality: 'excellent' | 'good' | 'fair' | 'poor';
  overall_confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

class UnifiedPersonaIntelligenceService {
  /**
   * Extract all persona intelligence in ONE AI call
   * Replaces: buyerIntelligenceExtractor + extractTargetCustomer
   */
  async extractUnifiedPersonas(
    websiteData: WebsiteData,
    businessName: string
  ): Promise<UnifiedPersonaResult> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[UnifiedPersona] No Supabase configuration - returning empty result');
      return this.createEmptyResult();
    }

    const startTime = Date.now();

    try {
      console.log('[UnifiedPersona] Starting unified persona extraction for:', websiteData.url);

      // Prepare comprehensive content
      const analysisContent = this.prepareContentForAnalysis(websiteData, businessName);

      // Single AI call for all persona data
      const rawExtraction = await this.analyzeWithClaude(analysisContent, websiteData.url, businessName);

      // Transform into both output formats
      const buyerIntelligence = this.transformToBuyerIntelligence(rawExtraction, websiteData.url);
      const customerProfiles = this.transformToCustomerProfiles(rawExtraction);

      const duration = Date.now() - startTime;
      console.log(`[UnifiedPersona] Extraction complete in ${duration}ms:`);
      console.log(`  - Personas identified: ${rawExtraction.personas.length}`);
      console.log(`  - Buyer personas: ${buyerIntelligence.personas.length}`);
      console.log(`  - Customer profiles: ${customerProfiles.profiles.length}`);
      console.log(`  - Evidence points: ${buyerIntelligence.total_evidence_points}`);

      return {
        buyerIntelligence,
        customerProfiles
      };

    } catch (error) {
      console.error('[UnifiedPersona] Extraction failed:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Prepare comprehensive content for analysis
   */
  private prepareContentForAnalysis(data: WebsiteData, businessName: string): string {
    const sections: string[] = [];

    sections.push(`=== BUSINESS: ${businessName} ===\n`);

    // Main content (highest priority)
    if (data.content) {
      sections.push(`=== WEBSITE CONTENT ===\n${data.content.slice(0, 12000)}`);
    }

    // Testimonials (high value for persona extraction)
    if (data.testimonials && data.testimonials.length > 0) {
      sections.push(`\n=== CUSTOMER TESTIMONIALS (${data.testimonials.length}) ===`);
      data.testimonials.slice(0, 10).forEach((testimonial, idx) => {
        sections.push(`[Testimonial ${idx + 1}] ${testimonial}`);
      });
    }

    // Case studies (high value)
    if (data.case_studies && data.case_studies.length > 0) {
      sections.push(`\n=== CASE STUDIES (${data.case_studies.length}) ===`);
      data.case_studies.slice(0, 5).forEach((caseStudy, idx) => {
        sections.push(`[Case Study ${idx + 1}] ${caseStudy}`);
      });
    }

    // About page
    if (data.about_page) {
      sections.push(`\n=== ABOUT PAGE ===\n${data.about_page.slice(0, 2000)}`);
    }

    // Services
    if (data.services && data.services.length > 0) {
      sections.push(`\n=== SERVICES ===\n${data.services.join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Single AI call to extract all persona data
   */
  private async analyzeWithClaude(
    content: string,
    url: string,
    businessName: string
  ): Promise<RawUnifiedPersonaExtraction> {
    const prompt = `You are an expert market researcher extracting COMPREHENSIVE buyer persona intelligence from website content.

BUSINESS: ${businessName}
WEBSITE: ${url}

YOUR TASK: Extract the TOP 3 customer segments (MAXIMUM 3) with detail for each persona.

=== EXTRACTION REQUIREMENTS ===

1. IDENTIFY EXACTLY 3 DISTINCT PERSONAS from testimonials, case studies, and content clues
   - Each persona should have a unique combination of role + company type + industry
   - Focus on the 3 MOST IMPORTANT personas only
   - Combine similar personas into one (if 3+ customers say similar things, that's ONE persona)

2. FOR EACH PERSONA, EXTRACT:

   A) IDENTIFICATION:
   - persona_name: Descriptive name like "Growth-Focused Marketing Directors"
   - statement: "Who they are" statement like "Marketing directors at tech startups with 50-200 employees"
   - role_title, role_seniority, department
   - company_type (startup, enterprise, nonprofit, individual, etc.)
   - company_size (solo, small 10-49, medium 50-249, large 250+, enterprise 1000+)
   - industry, sub_industry

   B) PAIN POINTS (2-3 per persona):
   - description, category (time|cost|complexity|quality|trust|risk), intensity (high|medium|low), quote

   C) DESIRED OUTCOMES (2-3 per persona):
   - description, metric, emotional_benefit, quote

   D) URGENCY SIGNALS (1-2 per persona):
   - trigger, signal_type (deadline|crisis|opportunity|growth), severity (high|medium|low), quote

   E) BUYING BEHAVIOR:
   - decision_speed, research_intensity, price_sensitivity, relationship_vs_transactional

   F) SUCCESS METRICS (1-2 per persona):
   - metric, baseline, achieved, improvement, category (revenue|cost|time|quality|risk)

   G) DRIVERS (2-3 of each):
   - emotional_drivers: fears, desires, frustrations
   - functional_drivers: practical requirements, needs

   H) EVIDENCE:
   - evidence_quotes (2-3), source_sections, confidence_level (high|medium|low)

3. COMMON PATTERNS (across all personas):
   - common_pain_points: Pain points appearing in 2+ personas
   - common_outcomes: Desired outcomes appearing in 2+ personas
   - industry_patterns: Industry-specific observations

=== CONTENT TO ANALYZE ===
${content}

=== OUTPUT FORMAT (JSON only, no markdown) ===
{
  "personas": [
    {
      "persona_name": "Time-Starved Marketing Directors",
      "statement": "Marketing directors at tech startups with 50-200 employees",
      "role_title": "Marketing Director",
      "role_seniority": "director",
      "department": "Marketing",
      "company_type": "startup",
      "company_size": "medium",
      "industry": "Technology",
      "sub_industry": "SaaS",
      "pain_points": [
        {
          "description": "Wasting 15+ hours per week on manual reporting",
          "category": "time",
          "intensity": "high",
          "quote": "I was spending 3 hours every day just pulling data"
        }
      ],
      "desired_outcomes": [
        {
          "description": "Automate reporting to save time for strategy",
          "metric": "Save 15 hours per week",
          "emotional_benefit": "Feel like a strategic leader",
          "quote": "Now I actually have time to think strategically"
        }
      ],
      "urgency_signals": [
        {
          "trigger": "Rapid company growth creating data chaos",
          "signal_type": "growth",
          "severity": "high",
          "quote": "We doubled in size and our processes broke"
        }
      ],
      "buying_behavior": {
        "decision_speed": "moderate",
        "research_intensity": "heavy",
        "price_sensitivity": "medium",
        "relationship_vs_transactional": "relationship"
      },
      "success_metrics": [
        {
          "metric": "Time spent on reporting",
          "baseline": "15 hours/week",
          "achieved": "2 hours/week",
          "improvement": "87% reduction",
          "category": "time"
        }
      ],
      "emotional_drivers": [
        "Fear of being seen as just tactical, not strategic",
        "Frustration with drowning in data instead of using it",
        "Desire to be recognized as a growth driver"
      ],
      "functional_drivers": [
        "Need to automate repetitive reporting tasks",
        "Must demonstrate ROI to leadership",
        "Require real-time visibility into campaign performance"
      ],
      "evidence_quotes": [
        "I was drowning in data before finding them",
        "Cut my reporting time from 15 hours to 2 hours per week"
      ],
      "source_sections": ["testimonials", "case_studies"],
      "confidence_level": "high"
    }
  ],
  "common_pain_points": [
    "Time wasted on manual processes",
    "Difficulty scaling operations"
  ],
  "common_outcomes": [
    "Significant time savings",
    "Better strategic decision making"
  ],
  "industry_patterns": [
    "Tech companies focus on automation and efficiency"
  ],
  "data_quality": "excellent",
  "overall_confidence": "high",
  "warnings": []
}

CRITICAL RULES:
- MAXIMUM 3 personas - no more!
- Keep quotes SHORT (under 50 characters)
- Each persona MUST have emotional_drivers and functional_drivers
- Return ONLY valid JSON, no markdown
- Keep responses concise to avoid truncation`;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 10000, // Larger for comprehensive extraction
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UnifiedPersona] Claude API error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      console.log('[UnifiedPersona] Raw response length:', analysisText.length);

      // Parse JSON response using robust repair logic
      const extraction = this.parseAndRepairJSON(analysisText);
      return extraction;

    } catch (error) {
      console.error('[UnifiedPersona] Claude analysis failed:', error);
      throw error;
    }
  }

  /**
   * Robust JSON parsing with truncation repair
   * Handles cases where AI response is cut off mid-JSON
   */
  private parseAndRepairJSON(rawText: string): RawUnifiedPersonaExtraction {
    // Strip markdown code blocks
    let jsonText = rawText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    // Find JSON start
    const jsonStart = jsonText.indexOf('{');
    if (jsonStart === -1) {
      console.warn('[UnifiedPersona] No JSON object found in response');
      return this.getEmptyExtraction('No JSON object found in response');
    }
    jsonText = jsonText.substring(jsonStart);

    // First, try direct parse (happy path)
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.log('[UnifiedPersona] Initial parse failed, attempting repair...');
    }

    // Count braces and brackets to detect truncation
    let openBraces = 0, closeBraces = 0;
    let openBrackets = 0, closeBrackets = 0;
    for (const char of jsonText) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
      if (char === '[') openBrackets++;
      if (char === ']') closeBrackets++;
    }

    const isTruncated = openBraces > closeBraces || openBrackets > closeBrackets;
    console.log(`[UnifiedPersona] JSON analysis: braces {${openBraces}/${closeBraces}, brackets [${openBrackets}/${closeBrackets}], truncated: ${isTruncated}`);

    if (isTruncated) {
      // Strategy: Find complete persona objects by looking for the pattern
      // Each persona ends with "confidence_level": "..." }
      // We'll extract all complete personas we can find

      const personasMatch = jsonText.match(/"personas"\s*:\s*\[/);
      if (personasMatch) {
        const personasStart = personasMatch.index! + personasMatch[0].length;

        // Find all complete persona objects using regex for confidence_level (last field)
        const completePersonas: string[] = [];
        let searchPos = personasStart;

        // Find each complete persona object
        while (true) {
          // Find next object start
          const objStart = jsonText.indexOf('{', searchPos);
          if (objStart === -1) break;

          // Find confidence_level which is the last field
          const confidenceMatch = jsonText.substring(objStart).match(/"confidence_level"\s*:\s*"[^"]*"\s*\}/);
          if (!confidenceMatch) break;

          const objEnd = objStart + confidenceMatch.index! + confidenceMatch[0].length;
          const personaObj = jsonText.substring(objStart, objEnd);

          // Validate this is a parseable object
          try {
            JSON.parse(personaObj);
            completePersonas.push(personaObj);
            console.log(`[UnifiedPersona] Extracted complete persona #${completePersonas.length}`);
            searchPos = objEnd;
          } catch {
            // Not a complete object, skip
            searchPos = objStart + 1;
          }
        }

        if (completePersonas.length > 0) {
          // Reconstruct valid JSON with extracted personas
          const repairedJson = `{"personas":[${completePersonas.join(',')}],"common_pain_points":[],"common_outcomes":[],"industry_patterns":[],"data_quality":"fair","overall_confidence":"medium","warnings":["Response was truncated, extracted ${completePersonas.length} complete personas"]}`;

          try {
            const result = JSON.parse(repairedJson);
            console.log(`[UnifiedPersona] Successfully repaired JSON with ${completePersonas.length} personas`);
            return result;
          } catch (e) {
            console.error('[UnifiedPersona] Repair failed:', e);
          }
        }
      }
    }

    // Last resort: return empty with warning
    console.warn('[UnifiedPersona] Could not repair JSON, returning empty extraction');
    return this.getEmptyExtraction('Failed to parse AI response after repair attempts');
  }

  /**
   * Get empty extraction with warning
   */
  private getEmptyExtraction(warning: string): RawUnifiedPersonaExtraction {
    return {
      personas: [],
      common_pain_points: [],
      common_outcomes: [],
      industry_patterns: [],
      data_quality: 'poor',
      overall_confidence: 'low',
      warnings: [warning]
    };
  }

  /**
   * Transform to BuyerIntelligenceResult format (for data-collection.service)
   */
  private transformToBuyerIntelligence(
    raw: RawUnifiedPersonaExtraction,
    sourceUrl: string
  ): BuyerIntelligenceResult {
    const personas: BuyerPersona[] = raw.personas.map((rawPersona, index) => {
      const personaId = `persona-${Date.now()}-${index}`;

      // Transform role
      const role: BuyerRole = {
        title: rawPersona.role_title,
        seniority: this.normalizeSeniority(rawPersona.role_seniority),
        department: rawPersona.department || this.extractDepartment(rawPersona.role_title),
        is_decision_maker: this.isDecisionMaker(rawPersona.role_seniority),
        influence_level: this.determineInfluenceLevel(rawPersona.role_seniority)
      };

      // Transform industry
      const industry: IndustryContext = {
        primary_industry: rawPersona.industry,
        sub_industry: rawPersona.sub_industry,
        industry_keywords: this.extractIndustryKeywords(rawPersona.industry, rawPersona.sub_industry),
        vertical_specificity: rawPersona.sub_industry ? 75 : 40
      };

      // Transform pain points
      const pain_points: PainPoint[] = (rawPersona.pain_points || []).map(pp => ({
        description: pp.description,
        category: pp.category as any,
        intensity: pp.intensity as any,
        frequency: 50,
        evidence: [pp.quote]
      }));

      // Transform desired outcomes
      const desired_outcomes: DesiredOutcome[] = (rawPersona.desired_outcomes || []).map(outcome => ({
        description: outcome.description,
        metric: outcome.metric,
        emotional_benefit: outcome.emotional_benefit,
        evidence: [outcome.quote]
      }));

      // Transform urgency signals
      const urgency_signals: UrgencySignal[] = (rawPersona.urgency_signals || []).map(signal => ({
        trigger: signal.trigger,
        signal_type: signal.signal_type as any,
        severity: signal.severity as any,
        evidence: [signal.quote]
      }));

      // Transform buying behavior
      const buying_behavior: BuyingBehavior = {
        decision_speed: rawPersona.buying_behavior?.decision_speed as any || 'moderate',
        research_intensity: rawPersona.buying_behavior?.research_intensity as any || 'moderate',
        price_sensitivity: rawPersona.buying_behavior?.price_sensitivity as any || 'moderate',
        relationship_vs_transactional: rawPersona.buying_behavior?.relationship_vs_transactional as any || 'balanced',
        evidence: rawPersona.evidence_quotes || []
      };

      // Transform success metrics
      const success_metrics: SuccessMetrics[] = (rawPersona.success_metrics || []).map(metric => ({
        metric: metric.metric,
        baseline: metric.baseline,
        achieved: metric.achieved,
        improvement: metric.improvement,
        category: metric.category as any
      }));

      // Calculate confidence
      const confidence_score = this.calculateConfidenceScore({
        pain_points: pain_points.length,
        outcomes: desired_outcomes.length,
        urgency: urgency_signals.length,
        quotes: rawPersona.evidence_quotes?.length || 0,
        metrics: success_metrics.length
      });

      // Build evidence sources
      const evidence_sources: EvidenceSource[] = [
        ...pain_points.slice(0, 3).map(pp => ({
          type: 'testimonial' as const,
          location: sourceUrl,
          snippet: pp.evidence[0],
          relevance_score: 85
        })),
        ...desired_outcomes.slice(0, 3).map(outcome => ({
          type: 'case-study' as const,
          location: sourceUrl,
          snippet: outcome.evidence[0],
          relevance_score: 90
        }))
      ];

      return {
        id: personaId,
        persona_name: rawPersona.persona_name,
        role,
        company_type: this.normalizeCompanyType(rawPersona.company_type),
        company_size: this.normalizeCompanySize(rawPersona.company_size),
        industry,
        pain_points,
        desired_outcomes,
        urgency_signals,
        buying_behavior,
        success_metrics,
        confidence_score,
        sample_size: rawPersona.evidence_quotes?.length || 0,
        evidence_sources,
        representative_quotes: rawPersona.evidence_quotes?.slice(0, 3) || []
      };
    });

    return {
      personas,
      total_evidence_points: this.countEvidencePoints(personas),
      extraction_quality: this.assessQuality(personas, raw.data_quality),
      extraction_timestamp: new Date().toISOString(),
      common_pain_points: this.extractCommonPainPoints(personas),
      common_outcomes: this.extractCommonOutcomes(personas),
      industry_patterns: raw.industry_patterns || [],
      data_gaps: this.identifyDataGaps(raw, personas),
      assumptions_made: []
    };
  }

  /**
   * Transform to CustomerExtractionResult format (for UVP flow)
   */
  private transformToCustomerProfiles(raw: RawUnifiedPersonaExtraction): CustomerExtractionResult {
    const profiles: Partial<CustomerProfile>[] = raw.personas
      .filter(p => p.evidence_quotes && p.evidence_quotes.length > 0)
      .map((rawProfile, index) => {
        const profileId = `customer-${Date.now()}-${index}`;

        // Calculate confidence
        const confidence = this.calculateProfileConfidence(rawProfile);

        // Build data sources
        const sources = (rawProfile.source_sections || []).map(section => this.createDataSource(section));

        return {
          id: profileId,
          statement: rawProfile.statement || rawProfile.persona_name,
          industry: rawProfile.industry || undefined,
          companySize: rawProfile.company_size || undefined,
          role: rawProfile.role_title || undefined,
          confidence,
          sources,
          evidenceQuotes: rawProfile.evidence_quotes || [],
          isManualInput: false,
          // Persona-specific drivers for Target Customer cards
          emotionalDrivers: rawProfile.emotional_drivers || [],
          functionalDrivers: rawProfile.functional_drivers || []
        };
      });

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(raw, profiles);

    // Deduplicate all evidence quotes
    const allQuotes = raw.personas.flatMap(p => p.evidence_quotes || []);
    const evidenceQuotes = [...new Set(allQuotes)];

    // Build all sources
    const sources = this.buildAllSources(raw);

    return {
      profiles,
      confidence: overallConfidence,
      sources,
      evidenceQuotes
    };
  }

  // ============================================
  // HELPER METHODS (from original services)
  // ============================================

  private normalizeSeniority(seniority: string): BuyerRole['seniority'] {
    const normalized = seniority.toLowerCase();
    if (['ceo', 'cto', 'cfo', 'cmo', 'president', 'vp', 'executive'].some(term => normalized.includes(term))) {
      return 'executive';
    }
    if (normalized.includes('director') || normalized.includes('head')) {
      return 'director';
    }
    if (normalized.includes('manager') || normalized.includes('lead')) {
      return 'manager';
    }
    if (normalized.includes('owner') || normalized.includes('founder')) {
      return 'owner';
    }
    return 'individual-contributor';
  }

  private extractDepartment(title: string): string | undefined {
    const lower = title.toLowerCase();
    if (lower.includes('marketing')) return 'Marketing';
    if (lower.includes('sales')) return 'Sales';
    if (lower.includes('engineering') || lower.includes('tech')) return 'Engineering';
    if (lower.includes('finance')) return 'Finance';
    if (lower.includes('operations') || lower.includes('ops')) return 'Operations';
    if (lower.includes('hr') || lower.includes('people')) return 'Human Resources';
    if (lower.includes('product')) return 'Product';
    return undefined;
  }

  private isDecisionMaker(seniority: string): boolean {
    const lower = seniority.toLowerCase();
    return ['executive', 'director', 'owner'].some(level => lower.includes(level));
  }

  private determineInfluenceLevel(seniority: string): 'high' | 'medium' | 'low' {
    const normalized = this.normalizeSeniority(seniority);
    if (normalized === 'executive' || normalized === 'owner') return 'high';
    if (normalized === 'director' || normalized === 'manager') return 'medium';
    return 'low';
  }

  private extractIndustryKeywords(primary: string, sub?: string): string[] {
    const keywords = [primary.toLowerCase()];
    if (sub) keywords.push(sub.toLowerCase());
    return keywords;
  }

  private normalizeCompanyType(type: string): CompanyType {
    const lower = type.toLowerCase();
    if (lower.includes('startup')) return 'startup';
    if (lower.includes('enterprise') || lower.includes('large corp')) return 'enterprise';
    if (lower.includes('nonprofit') || lower.includes('non-profit')) return 'nonprofit';
    if (lower.includes('government') || lower.includes('public sector')) return 'government';
    if (lower.includes('individual') || lower.includes('consumer') || lower.includes('b2c')) return 'individual';
    return 'established-business';
  }

  private normalizeCompanySize(size: string): CompanySize {
    const lower = size.toLowerCase();
    if (lower.includes('solo') || lower.includes('freelance') || lower.includes('1 person')) return 'solopreneur';
    if (lower.includes('micro') || lower.includes('2-9')) return 'micro';
    if (lower.includes('small') || lower.includes('10-49')) return 'small';
    if (lower.includes('medium') || lower.includes('50-249') || lower.includes('mid-size')) return 'medium';
    if (lower.includes('large') || lower.includes('250-999')) return 'large';
    if (lower.includes('enterprise') || lower.includes('1000+')) return 'enterprise';
    return 'unknown';
  }

  private calculateConfidenceScore(evidence: {
    pain_points: number;
    outcomes: number;
    urgency: number;
    quotes: number;
    metrics: number;
  }): number {
    const weights = { pain_points: 20, outcomes: 20, urgency: 15, quotes: 25, metrics: 20 };
    let score = 0;
    score += Math.min(evidence.pain_points * 7, weights.pain_points);
    score += Math.min(evidence.outcomes * 7, weights.outcomes);
    score += Math.min(evidence.urgency * 5, weights.urgency);
    score += Math.min(evidence.quotes * 8, weights.quotes);
    score += Math.min(evidence.metrics * 10, weights.metrics);
    return Math.min(score, 100);
  }

  private countEvidencePoints(personas: BuyerPersona[]): number {
    return personas.reduce((total, persona) => {
      return total +
        persona.pain_points.length +
        persona.desired_outcomes.length +
        persona.urgency_signals.length +
        persona.success_metrics.length +
        persona.representative_quotes.length;
    }, 0);
  }

  private assessQuality(
    personas: BuyerPersona[],
    claudeQuality: string
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (claudeQuality === 'poor' || personas.length < 3) return 'poor';
    if (claudeQuality === 'fair' || personas.length < 5) return 'fair';
    const avgConfidence = personas.reduce((sum, p) => sum + p.confidence_score, 0) / personas.length;
    if (avgConfidence >= 80) return 'excellent';
    if (avgConfidence >= 60) return 'good';
    if (avgConfidence >= 40) return 'fair';
    return 'poor';
  }

  private extractCommonPainPoints(personas: BuyerPersona[]): PainPoint[] {
    const painMap = new Map<string, PainPoint>();
    personas.forEach(persona => {
      persona.pain_points.forEach(pain => {
        const key = `${pain.category}-${pain.description.substring(0, 30)}`;
        if (!painMap.has(key)) {
          painMap.set(key, { ...pain, frequency: 1 });
        } else {
          const existing = painMap.get(key)!;
          existing.frequency += 1;
        }
      });
    });
    return Array.from(painMap.values())
      .filter(pain => pain.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private extractCommonOutcomes(personas: BuyerPersona[]): DesiredOutcome[] {
    const outcomeMap = new Map<string, DesiredOutcome & { count: number }>();
    personas.forEach(persona => {
      persona.desired_outcomes.forEach(outcome => {
        const key = outcome.description.substring(0, 50);
        if (!outcomeMap.has(key)) {
          outcomeMap.set(key, { ...outcome, count: 1 });
        } else {
          const existing = outcomeMap.get(key)!;
          existing.count += 1;
        }
      });
    });
    return Array.from(outcomeMap.values())
      .filter(outcome => outcome.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private identifyDataGaps(raw: RawUnifiedPersonaExtraction, personas: BuyerPersona[]): string[] {
    const gaps: string[] = [];
    if (personas.length < 5) {
      gaps.push('Fewer than 5 personas identified');
    }
    const avgConfidence = personas.reduce((sum, p) => sum + p.confidence_score, 0) / personas.length;
    if (avgConfidence < 60) {
      gaps.push('Low average confidence - limited evidence');
    }
    if (raw.warnings && raw.warnings.length > 0) {
      gaps.push(...raw.warnings);
    }
    return gaps;
  }

  private calculateProfileConfidence(profile: RawUnifiedPersonaExtraction['personas'][0]): ConfidenceScore {
    let overall = 0;
    switch (profile.confidence_level) {
      case 'high': overall = 85; break;
      case 'medium': overall = 65; break;
      case 'low': overall = 40; break;
      default: overall = 50;
    }

    const evidenceCount = profile.evidence_quotes?.length || 0;
    const evidenceBoost = Math.min(evidenceCount * 3, 15);

    let detailBoost = 0;
    if (profile.industry) detailBoost += 5;
    if (profile.company_size) detailBoost += 5;
    if (profile.role_title) detailBoost += 5;

    const dataQuality = evidenceCount >= 3 ? 90 : evidenceCount >= 2 ? 70 : 50;
    const finalOverall = Math.min(100, overall + evidenceBoost + detailBoost);

    return {
      overall: Math.round(finalOverall),
      dataQuality: Math.round(dataQuality),
      sourceCount: evidenceCount,
      modelAgreement: 85,
      reasoning: `Confidence based on ${evidenceCount} evidence quotes and ${profile.confidence_level} certainty.`
    };
  }

  private calculateOverallConfidence(
    raw: RawUnifiedPersonaExtraction,
    profiles: Partial<CustomerProfile>[]
  ): ConfidenceScore {
    if (profiles.length === 0) {
      return {
        overall: 0,
        dataQuality: 0,
        sourceCount: 0,
        modelAgreement: 0,
        reasoning: 'No target customer profiles found'
      };
    }

    const avgConfidence = profiles.reduce((sum, p) => sum + (p.confidence?.overall || 0), 0) / profiles.length;

    let dataQuality = 0;
    switch (raw.data_quality) {
      case 'excellent': dataQuality = 95; break;
      case 'good': dataQuality = 80; break;
      case 'fair': dataQuality = 60; break;
      case 'poor': dataQuality = 35; break;
      default: dataQuality = 50;
    }

    const totalQuotes = profiles.reduce((sum, p) => sum + (p.evidenceQuotes?.length || 0), 0);
    let overall = avgConfidence;
    if (profiles.length >= 3) overall = Math.min(100, overall + 5);

    return {
      overall: Math.round(overall),
      dataQuality: Math.round(dataQuality),
      sourceCount: totalQuotes,
      modelAgreement: 85,
      reasoning: `Extracted ${profiles.length} profiles with ${totalQuotes} supporting quotes.`
    };
  }

  private createDataSource(sourceType: string): DataSource {
    const sourceMap: Record<string, Partial<DataSource>> = {
      'testimonials': { type: 'reviews', name: 'Customer Testimonials', reliability: 95 },
      'case_studies': { type: 'website', name: 'Case Studies', reliability: 90 },
      'website': { type: 'website', name: 'Website Content', reliability: 75 },
      'pricing': { type: 'website', name: 'Pricing Page', reliability: 80 },
      'about': { type: 'website', name: 'About Page', reliability: 80 }
    };

    const sourceData = sourceMap[sourceType] || { type: 'website' as const, name: 'Unknown Source', reliability: 50 };

    return {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: sourceData.type || 'website',
      name: sourceData.name || 'Unknown Source',
      extractedAt: new Date(),
      reliability: sourceData.reliability || 50,
      dataPoints: 1
    };
  }

  private buildAllSources(raw: RawUnifiedPersonaExtraction): DataSource[] {
    const sourceSet = new Set<string>();
    raw.personas.forEach(profile => {
      profile.source_sections?.forEach(section => sourceSet.add(section));
    });
    return Array.from(sourceSet).map(section => this.createDataSource(section));
  }

  private createEmptyResult(): UnifiedPersonaResult {
    return {
      buyerIntelligence: {
        personas: [],
        total_evidence_points: 0,
        extraction_quality: 'poor',
        extraction_timestamp: new Date().toISOString(),
        common_pain_points: [],
        common_outcomes: [],
        industry_patterns: [],
        data_gaps: ['Extraction failed'],
        assumptions_made: []
      },
      customerProfiles: {
        profiles: [],
        confidence: {
          overall: 0,
          dataQuality: 0,
          sourceCount: 0,
          modelAgreement: 0,
          reasoning: 'Extraction failed'
        },
        sources: [],
        evidenceQuotes: []
      }
    };
  }
}

// Export singleton
export const unifiedPersonaIntelligence = new UnifiedPersonaIntelligenceService();
export { UnifiedPersonaIntelligenceService };
