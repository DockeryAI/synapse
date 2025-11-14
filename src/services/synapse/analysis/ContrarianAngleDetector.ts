/**
 * Contrarian Angle Detector
 *
 * Analyzes competitor claims and content to identify opportunities for
 * contrarian positioning. Finds "everyone says X, but actually Y" angles
 * that differentiate your brand.
 *
 * Created: 2025-11-11
 */

import type {
  BreakthroughInsight,
  CompetitorClaim,
  ContrarianAngle,
  ContrarianDetectionResult
} from '@/types/synapseContent.types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('VITE_OPENROUTER_API_KEY is not set in .env file');
}

export class ContrarianAngleDetector {
  /**
   * Detect contrarian angles from insights
   */
  async detectContrarianAngles(
    insights: BreakthroughInsight[]
  ): Promise<ContrarianDetectionResult> {
    console.log('[ContrarianDetector] Analyzing', insights.length, 'insights for contrarian angles');

    // Extract competitor claims from insights
    const competitorClaims = this.extractCompetitorClaims(insights);

    // Find contrarian angles
    const contrarianAngles: ContrarianAngle[] = [];

    for (const claim of competitorClaims) {
      try {
        const angle = await this.generateContrarianAngle(claim, insights);
        if (angle) {
          contrarianAngles.push(angle);
        }
      } catch (error) {
        console.error('[ContrarianDetector] Error generating angle for claim:', claim, error);
      }
    }

    // Rank by differentiation potential
    const ranked = this.rankByDifferentiation(contrarianAngles);

    return {
      competitorClaims,
      contrarianAngles: ranked,
      topOpportunity: ranked[0] || null
    };
  }

  /**
   * Extract common competitor claims from insights
   */
  private extractCompetitorClaims(insights: BreakthroughInsight[]): CompetitorClaim[] {
    const claims: CompetitorClaim[] = [];
    const claimMap = new Map<string, { count: number; confidence: number }>();

    for (const insight of insights) {
      // Look for competitive analysis in evidence
      if (insight.evidence && Array.isArray(insight.evidence)) {
        for (const evidence of insight.evidence) {
          if (
            typeof evidence === 'string' &&
            (evidence.toLowerCase().includes('competitor') ||
              evidence.toLowerCase().includes('everyone') ||
              evidence.toLowerCase().includes('industry') ||
              evidence.toLowerCase().includes('typical'))
          ) {
            const key = this.normalizeClaimText(evidence);
            const existing = claimMap.get(key);

            if (existing) {
              claimMap.set(key, {
                count: existing.count + 1,
                confidence: Math.min(existing.confidence + 0.1, 1.0)
              });
            } else {
              claimMap.set(key, {
                count: 1,
                confidence: insight.confidence || 0.7
              });
            }
          }
        }
      }

      // Also check insight text for competitive framing
      if (
        insight.insight &&
        (insight.insight.toLowerCase().includes('unlike') ||
          insight.insight.toLowerCase().includes('while others') ||
          insight.insight.toLowerCase().includes('most'))
      ) {
        const key = this.normalizeClaimText(insight.insight);
        const existing = claimMap.get(key);

        if (existing) {
          claimMap.set(key, {
            count: existing.count + 1,
            confidence: Math.min(existing.confidence + 0.1, 1.0)
          });
        } else {
          claimMap.set(key, {
            count: 1,
            confidence: insight.confidence || 0.7
          });
        }
      }
    }

    // Convert to array
    for (const [claim, data] of claimMap.entries()) {
      claims.push({
        claim,
        competitor: 'Industry consensus',
        frequency: data.count,
        confidence: data.confidence
      });
    }

    return claims.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  /**
   * Normalize claim text for deduplication
   */
  private normalizeClaimText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .substring(0, 200);
  }

  /**
   * Generate contrarian angle for a claim
   */
  private async generateContrarianAngle(
    claim: CompetitorClaim,
    insights: BreakthroughInsight[]
  ): Promise<ContrarianAngle | null> {
    const prompt = this.buildContrarianPrompt(claim, insights);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Contrarian Detector'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const result = this.parseContrarianResponse(data.choices[0].message.content);

      if (!result) return null;

      return {
        id: `contrarian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        competitorClaim: claim.claim,
        contrarianAngle: result.angle,
        reasoning: result.reasoning,
        evidenceSupport: result.evidence,
        riskLevel: this.assessRiskLevel(result.angle),
        differentiationScore: this.calculateDifferentiationScore(result.angle, claim)
      };
    } catch (error) {
      console.error('[ContrarianDetector] Error calling API:', error);
      return null;
    }
  }

  /**
   * Build prompt for contrarian angle generation
   */
  private buildContrarianPrompt(
    claim: CompetitorClaim,
    insights: BreakthroughInsight[]
  ): string {
    const supportingInsights = insights
      .filter(i => i.confidence > 0.7)
      .slice(0, 3)
      .map(i => i.insight)
      .join('\n- ');

    return `You are a strategic marketing analyst specializing in contrarian positioning.

COMPETITOR CLAIM: "${claim.claim}"

SUPPORTING INSIGHTS:
- ${supportingInsights}

YOUR TASK: Create a contrarian angle that challenges this claim in an authentic, evidence-based way.

REQUIREMENTS:
1. The contrarian angle must be TRUE and defensible (not just provocative)
2. Should flip the conventional wisdom in an interesting way
3. Must be specific and actionable (not vague)
4. Should feel fresh, not cynical or negative

FORMAT YOUR RESPONSE EXACTLY AS:

CONTRARIAN ANGLE: [Your contrarian positioning statement]

REASONING: [Why this challenges the competitor claim and why it's true]

EVIDENCE:
- [Supporting evidence point 1]
- [Supporting evidence point 2]
- [Supporting evidence point 3]

EXAMPLES OF GOOD CONTRARIAN ANGLES:
❌ "We're better than competitors" (too vague)
✅ "While competitors optimize for 'cleanliness,' we optimize for health outcomes"

❌ "Everyone is wrong about X" (too negative)
✅ "What most call 'customer service' is actually just problem management. We prevent problems."`;
  }

  /**
   * Parse contrarian response from Claude
   */
  private parseContrarianResponse(text: string): {
    angle: string;
    reasoning: string;
    evidence: string[];
  } | null {
    try {
      const lines = text.split('\n').filter(l => l.trim());

      let angle = '';
      let reasoning = '';
      const evidence: string[] = [];
      let currentSection = '';

      for (const line of lines) {
        if (line.startsWith('CONTRARIAN ANGLE:')) {
          currentSection = 'angle';
          angle = line.replace('CONTRARIAN ANGLE:', '').trim();
        } else if (line.startsWith('REASONING:')) {
          currentSection = 'reasoning';
          reasoning = line.replace('REASONING:', '').trim();
        } else if (line.startsWith('EVIDENCE:')) {
          currentSection = 'evidence';
        } else if (currentSection === 'angle' && !angle) {
          angle = line.trim();
        } else if (currentSection === 'reasoning' && line.trim() && !line.startsWith('-')) {
          reasoning += ' ' + line.trim();
        } else if (currentSection === 'evidence' && line.trim().startsWith('-')) {
          evidence.push(line.replace(/^-\s*/, '').trim());
        }
      }

      if (!angle || !reasoning) {
        return null;
      }

      return {
        angle,
        reasoning: reasoning.trim(),
        evidence: evidence.length > 0 ? evidence : ['No specific evidence provided']
      };
    } catch (error) {
      console.error('[ContrarianDetector] Error parsing response:', error);
      return null;
    }
  }

  /**
   * Assess risk level of contrarian angle
   */
  private assessRiskLevel(angle: string): 'low' | 'medium' | 'high' {
    const lowercaseAngle = angle.toLowerCase();

    // High risk indicators
    const highRiskWords = [
      'never',
      'always',
      'impossible',
      'wrong',
      'lie',
      'scam',
      'fake',
      'fraud'
    ];
    if (highRiskWords.some(word => lowercaseAngle.includes(word))) {
      return 'high';
    }

    // Medium risk indicators
    const mediumRiskWords = ['most', 'everyone', 'nobody', 'all', 'none'];
    if (mediumRiskWords.some(word => lowercaseAngle.includes(word))) {
      return 'medium';
    }

    // Low risk
    return 'low';
  }

  /**
   * Calculate differentiation score
   */
  private calculateDifferentiationScore(angle: string, claim: CompetitorClaim): number {
    let score = 0.5; // Base score

    // Higher frequency claim = higher differentiation potential
    score += Math.min(claim.frequency * 0.05, 0.2);

    // Higher confidence = better differentiation
    score += claim.confidence * 0.15;

    // Length and specificity bonus
    if (angle.length > 50 && angle.length < 200) {
      score += 0.1;
    }

    // Contains specific differentiators
    const differentiators = ['while', 'unlike', 'instead of', 'rather than', 'actually'];
    if (differentiators.some(word => angle.toLowerCase().includes(word))) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Rank contrarian angles by differentiation potential
   */
  private rankByDifferentiation(angles: ContrarianAngle[]): ContrarianAngle[] {
    return angles
      .sort((a, b) => {
        // Prefer low risk
        if (a.riskLevel !== b.riskLevel) {
          const riskOrder = { low: 3, medium: 2, high: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }

        // Then by differentiation score
        return b.differentiationScore - a.differentiationScore;
      })
      .slice(0, 5); // Top 5
  }

  /**
   * Get contrarian angle for specific insight
   */
  async getContrarianAngleForInsight(
    insight: BreakthroughInsight
  ): Promise<ContrarianAngle | null> {
    const result = await this.detectContrarianAngles([insight]);
    return result.topOpportunity;
  }
}
