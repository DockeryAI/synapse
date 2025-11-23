/**
 * Industry Research Service
 * Dynamically generates industry profiles for unknown NAICS codes
 * Uses OpenRouter with Opus 4.1 for high-quality research
 */

import type { IndustryProfile, EmotionalTriggerWeights, IndustryVocabulary, ComplianceRule } from './data/industry-profiles';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'anthropic/claude-opus-4-20250514'; // Opus 4.1

interface NAICSInfo {
  code: string;
  title: string;
  description: string;
}

interface ResearchProgress {
  status: 'pending' | 'researching' | 'complete' | 'error';
  stage: string;
  error?: string;
}

/**
 * Industry Research Service
 * Generates industry profiles on-demand using AI research
 */
export class IndustryResearchService {
  private researchCache = new Map<string, IndustryProfile>();
  private researchProgress = new Map<string, ResearchProgress>();

  /**
   * Check if industry profile exists or is being researched
   */
  getResearchStatus(naicsCode: string): ResearchProgress {
    return this.researchProgress.get(naicsCode) || { status: 'pending', stage: 'Not started' };
  }

  /**
   * Get cached profile if available
   */
  getCachedProfile(industryId: string): IndustryProfile | null {
    return this.researchCache.get(industryId) || null;
  }

  /**
   * Research and generate industry profile
   */
  async researchIndustry(naicsCode: string, naicsInfo: NAICSInfo): Promise<IndustryProfile> {
    const industryId = this.generateIndustryId(naicsInfo.title);

    // Check cache first
    const cached = this.researchCache.get(industryId);
    if (cached) return cached;

    // Set progress
    this.researchProgress.set(naicsCode, { status: 'researching', stage: 'Starting research' });

    try {
      // Run all 3 research prompts in parallel
      const [emotionalTriggers, vocabulary, compliance] = await Promise.all([
        this.analyzeEmotionalTriggers(naicsInfo),
        this.analyzeVocabulary(naicsInfo),
        this.analyzeCompliance(naicsInfo),
      ]);

      this.researchProgress.set(naicsCode, { status: 'researching', stage: 'Generating profile' });

      // Build profile
      const profile: IndustryProfile = {
        id: industryId,
        name: naicsInfo.title,
        naicsPrefix: naicsCode.substring(0, 2),
        description: naicsInfo.description,
        emotionalTriggers,
        vocabulary,
        compliance: this.buildComplianceRules(compliance),
        performanceBenchmarks: this.generateDefaultBenchmarks(),
        examples: [],
        customizationStrength: 'medium',
        generatedAt: new Date().toISOString(),
        isAIGenerated: true,
      };

      // Cache it
      this.researchCache.set(industryId, profile);
      this.researchProgress.set(naicsCode, { status: 'complete', stage: 'Research complete' });

      console.log('[IndustryResearch] Generated profile for:', naicsInfo.title);
      return profile;
    } catch (error) {
      this.researchProgress.set(naicsCode, {
        status: 'error',
        stage: 'Research failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * PROMPT 1: Analyze emotional triggers
   */
  private async analyzeEmotionalTriggers(naicsInfo: NAICSInfo): Promise<EmotionalTriggerWeights> {
    const prompt = `You are an expert marketing psychologist analyzing industry-specific emotional triggers.

INDUSTRY: ${naicsInfo.title}
NAICS CODE: ${naicsInfo.code}
DESCRIPTION: ${naicsInfo.description}

Analyze this industry and provide emotional trigger weights (0-100, must sum to 100) for these 10 core triggers:

1. FEAR - Avoiding negative outcomes, loss aversion
2. TRUST - Building credibility, reliability
3. SECURITY - Safety, protection, stability
4. EFFICIENCY - Time savings, productivity
5. GROWTH - Expansion, scaling, improvement
6. INNOVATION - Cutting-edge, new solutions
7. HOPE - Positive future, aspirations
8. URGENCY - Time-sensitive, FOMO
9. EXCLUSIVITY - Premium, elite, selective
10. COMMUNITY - Belonging, connection, social

Consider:
- What are customers' primary concerns in this industry?
- What emotional states drive purchase decisions?
- What fears/desires dominate this market?
- Industry maturity and competitive landscape

Return ONLY valid JSON:
{
  "fear": <0-100>,
  "trust": <0-100>,
  "security": <0-100>,
  "efficiency": <0-100>,
  "growth": <0-100>,
  "innovation": <0-100>,
  "hope": <0-100>,
  "urgency": <0-100>,
  "exclusivity": <0-100>,
  "community": <0-100>
}

Weights must sum to exactly 100.`;

    const response = await this.callOpenRouter(prompt);
    return JSON.parse(response);
  }

  /**
   * PROMPT 2: Analyze vocabulary
   */
  private async analyzeVocabulary(naicsInfo: NAICSInfo): Promise<IndustryVocabulary> {
    const prompt = `You are an expert copywriter specializing in industry-specific language.

INDUSTRY: ${naicsInfo.title}
NAICS CODE: ${naicsInfo.code}
DESCRIPTION: ${naicsInfo.description}

Generate industry-appropriate vocabulary for marketing campaigns:

**PREFERRED TERMS** (10-15 terms):
Words that resonate naturally with this industry's audience. What language do insiders use?

**AVOID TERMS** (5-10 terms):
Words that sound wrong, unprofessional, or dated in this industry.

**POWER WORDS** (15-20 words):
High-converting words proven effective in this industry.

**TECHNICAL TERMS** (8-12 terms):
Industry jargon that builds credibility (use sparingly).

**CALL-TO-ACTION PHRASES** (8-10 phrases):
Industry-specific CTAs that drive action.

Return ONLY valid JSON:
{
  "preferredTerms": ["term1", "term2", ...],
  "avoidTerms": ["term1", "term2", ...],
  "powerWords": ["word1", "word2", ...],
  "technicalTerms": ["term1", "term2", ...],
  "callToActionPhrases": ["phrase1", "phrase2", ...]
}

Be specific to ${naicsInfo.title}. Avoid generic marketing terms.`;

    const response = await this.callOpenRouter(prompt);
    return JSON.parse(response);
  }

  /**
   * PROMPT 3: Analyze compliance
   */
  private async analyzeCompliance(naicsInfo: NAICSInfo): Promise<any> {
    const prompt = `You are a legal compliance expert for marketing and advertising.

INDUSTRY: ${naicsInfo.title}
NAICS CODE: ${naicsInfo.code}
DESCRIPTION: ${naicsInfo.description}

Identify compliance rules and restrictions for marketing in this industry:

**BANNED TERMS** (if any):
Words/phrases that violate regulations or best practices.

**REQUIRED DISCLOSURES** (if any):
Legal disclaimers or disclosures required by law.

**CLAIM RESTRICTIONS**:
Are there limits on what claims can be made? (e.g., "guaranteed results")

**REGULATORY BODIES**:
What agencies regulate advertising in this industry? (FDA, FTC, SEC, etc.)

**RISK LEVEL**:
- "low" - minimal regulations
- "medium" - moderate restrictions
- "high" - heavily regulated (healthcare, finance, legal)

Return ONLY valid JSON:
{
  "bannedTerms": ["term1", "term2", ...],
  "requiredDisclosures": ["disclosure1", "disclosure2", ...],
  "maxClaimsAllowed": <number or null>,
  "regulatoryBodies": ["agency1", "agency2", ...],
  "riskLevel": "low" | "medium" | "high",
  "specialNotes": "Any additional compliance considerations"
}

If no specific regulations exist for this industry, return minimal restrictions.
Focus on US regulations unless industry is international.`;

    const response = await this.callOpenRouter(prompt);
    return JSON.parse(response);
  }

  /**
   * Call OpenRouter API with Opus 4.1
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('VITE_OPENROUTER_API_KEY not configured');
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Synapse Industry Research',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temp for more consistent JSON
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Build compliance rules from analysis
   */
  private buildComplianceRules(complianceData: any): ComplianceRule[] {
    const rules: ComplianceRule[] = [];

    if (complianceData.bannedTerms?.length > 0) {
      rules.push({
        id: 'banned-terms',
        description: 'Prohibited terms for this industry',
        severity: 'error',
        bannedTerms: complianceData.bannedTerms,
      });
    }

    if (complianceData.requiredDisclosures?.length > 0) {
      rules.push({
        id: 'required-disclosures',
        description: 'Required legal disclosures',
        severity: 'warning',
        requiredDisclosures: complianceData.requiredDisclosures,
      });
    }

    if (complianceData.maxClaimsAllowed) {
      rules.push({
        id: 'max-claims',
        description: `Maximum ${complianceData.maxClaimsAllowed} claims per piece`,
        severity: 'warning',
        maxClaims: complianceData.maxClaimsAllowed,
      });
    }

    return rules;
  }

  /**
   * Generate default performance benchmarks
   */
  private generateDefaultBenchmarks() {
    return {
      averageCTR: 2.5,
      averageEngagement: 3.0,
      topPerformingTemplates: ['curiosity-gap', 'problem-solution'],
      industryBestPractices: ['Focus on benefits', 'Use social proof', 'Clear CTAs'],
    };
  }

  /**
   * Generate clean industry ID from title
   */
  private generateIndustryId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Clear cache (for testing)
   */
  clearCache() {
    this.researchCache.clear();
    this.researchProgress.clear();
  }
}

// Singleton instance
export const industryResearchService = new IndustryResearchService();
