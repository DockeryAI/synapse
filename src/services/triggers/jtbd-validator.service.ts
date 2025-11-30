/**
 * Jobs-To-Be-Done (JTBD) Validator Service
 *
 * Validates triggers against JTBD templates per business profile.
 * Uses the framework: "When [situation], I want to [motivation], so I can [expected outcome]"
 *
 * This ensures triggers align with the actual jobs customers are trying to accomplish,
 * not just generic pain points that could apply to any product.
 *
 * From TRIGGER_RESEARCH.md:
 * - Each profile has specific JTBD patterns
 * - Triggers must match at least one JTBD for the profile
 * - Validation extracts situation/motivation/outcome from trigger text
 *
 * Created: 2025-11-29
 */

import type { BusinessProfileType } from './profile-detection.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface JTBDTemplate {
  id: string;
  situation: string;
  motivation: string;
  expectedOutcome: string;
  keywords: string[];
  fullStatement: string;
}

export interface JTBDValidationResult {
  isValid: boolean;
  matchedJTBD: JTBDTemplate | null;
  matchScore: number; // 0-1
  reasoning: string;
  extractedComponents: {
    situation?: string;
    motivation?: string;
    outcome?: string;
  };
}

// ============================================================================
// JTBD TEMPLATES PER PROFILE
// From TRIGGER_RESEARCH.md
// ============================================================================

const PROFILE_JTBD_TEMPLATES: Record<BusinessProfileType, JTBDTemplate[]> = {
  'local-service-b2b': [
    {
      id: 'local-b2b-1',
      situation: 'equipment fails or needs emergency repair',
      motivation: 'get reliable, fast service',
      expectedOutcome: 'minimize downtime and lost productivity',
      keywords: ['emergency', 'repair', 'downtime', 'reliability', 'fast response'],
      fullStatement: 'When my equipment fails, I want to get reliable, fast service, so I can minimize downtime and lost productivity.'
    },
    {
      id: 'local-b2b-2',
      situation: 'contract is up for renewal or vendor is underperforming',
      motivation: 'find a more reliable vendor',
      expectedOutcome: 'avoid the headaches of my current provider',
      keywords: ['contract', 'renewal', 'switch', 'reliable', 'vendor', 'provider'],
      fullStatement: 'When my contract is up for renewal, I want to find a more reliable vendor, so I can avoid the headaches of my current provider.'
    },
    {
      id: 'local-b2b-3',
      situation: 'facing compliance audit or inspection',
      motivation: 'ensure all systems meet requirements',
      expectedOutcome: 'pass inspection without issues',
      keywords: ['compliance', 'audit', 'inspection', 'requirements', 'regulations'],
      fullStatement: 'When facing a compliance audit, I want to ensure all systems meet requirements, so I can pass inspection without issues.'
    }
  ],

  'local-service-b2c': [
    {
      id: 'local-b2c-1',
      situation: 'need a service but my regular provider is unavailable',
      motivation: 'find a trustworthy alternative quickly',
      expectedOutcome: 'get quality service without stress',
      keywords: ['need', 'find', 'trust', 'quality', 'available', 'alternative'],
      fullStatement: 'When I need a service but my regular provider is unavailable, I want to find a trustworthy alternative quickly, so I can get quality service without stress.'
    },
    {
      id: 'local-b2c-2',
      situation: 'moving to a new area',
      motivation: 'find reliable local service providers',
      expectedOutcome: 'establish relationships with quality providers',
      keywords: ['moving', 'new area', 'find', 'local', 'reliable'],
      fullStatement: 'When moving to a new area, I want to find reliable local service providers, so I can establish relationships with quality providers.'
    },
    {
      id: 'local-b2c-3',
      situation: 'had a bad experience with current provider',
      motivation: 'switch to someone better',
      expectedOutcome: 'never have that experience again',
      keywords: ['bad experience', 'switch', 'better', 'disappointed', 'frustrated'],
      fullStatement: 'When I have a bad experience with my current provider, I want to switch to someone better, so I never have that experience again.'
    },
    {
      id: 'local-b2c-4',
      situation: 'have a special occasion coming up',
      motivation: 'look and feel my best',
      expectedOutcome: 'make a great impression',
      keywords: ['special occasion', 'wedding', 'event', 'interview', 'look good'],
      fullStatement: 'When I have a special occasion coming up, I want to look and feel my best, so I can make a great impression.'
    }
  ],

  'regional-b2b-agency': [
    {
      id: 'regional-b2b-1',
      situation: 'not seeing ROI from current agency',
      motivation: 'find a partner who delivers measurable results',
      expectedOutcome: 'justify marketing spend to leadership',
      keywords: ['roi', 'results', 'measurable', 'justify', 'spend', 'agency'],
      fullStatement: 'When not seeing ROI from my current agency, I want to find a partner who delivers measurable results, so I can justify marketing spend to leadership.'
    },
    {
      id: 'regional-b2b-2',
      situation: 'new CMO/leadership wants fresh perspective',
      motivation: 'evaluate and potentially switch agencies',
      expectedOutcome: 'establish new strategic direction',
      keywords: ['new cmo', 'leadership', 'fresh', 'evaluate', 'switch', 'strategic'],
      fullStatement: 'When new leadership wants a fresh perspective, I want to evaluate agencies, so I can establish a new strategic direction.'
    },
    {
      id: 'regional-b2b-3',
      situation: 'launching new product or entering new market',
      motivation: 'partner with experts who understand the space',
      expectedOutcome: 'successfully launch and gain market share',
      keywords: ['launch', 'new market', 'experts', 'partner', 'expand'],
      fullStatement: 'When launching a new product, I want to partner with experts who understand the space, so I can successfully launch and gain market share.'
    },
    {
      id: 'regional-b2b-4',
      situation: 'preparing for audit or compliance requirement',
      motivation: 'work with an accounting firm that specializes in my industry',
      expectedOutcome: 'pass audit smoothly and maintain compliance',
      keywords: ['audit', 'compliance', 'accounting', 'specialize', 'industry'],
      fullStatement: 'When preparing for an audit, I want to work with an accounting firm that specializes in my industry, so I can pass smoothly and maintain compliance.'
    }
  ],

  'regional-retail-b2c': [
    {
      id: 'regional-retail-1',
      situation: 'ready to expand to new locations',
      motivation: 'find the right markets and sites',
      expectedOutcome: 'grow revenue without cannibalizing existing stores',
      keywords: ['expand', 'new location', 'market', 'site', 'grow'],
      fullStatement: 'When ready to expand to new locations, I want to find the right markets and sites, so I can grow revenue without cannibalizing existing stores.'
    },
    {
      id: 'regional-retail-2',
      situation: 'competitors are opening in my territory',
      motivation: 'strengthen my market position',
      expectedOutcome: 'protect market share and stay competitive',
      keywords: ['competitor', 'territory', 'market share', 'competitive'],
      fullStatement: 'When competitors are opening in my territory, I want to strengthen my market position, so I can protect market share and stay competitive.'
    },
    {
      id: 'regional-retail-3',
      situation: 'seasonal demand is approaching',
      motivation: 'optimize inventory and staffing',
      expectedOutcome: 'maximize sales during peak season',
      keywords: ['seasonal', 'inventory', 'staffing', 'peak', 'demand'],
      fullStatement: 'When seasonal demand is approaching, I want to optimize inventory and staffing, so I can maximize sales during peak season.'
    }
  ],

  'national-saas-b2b': [
    {
      id: 'national-saas-1',
      situation: 'company closes funding round',
      motivation: 'rapidly scale operations with better tools',
      expectedOutcome: 'hit aggressive growth targets before next round',
      keywords: ['funding', 'scale', 'growth', 'series', 'invest'],
      fullStatement: 'When my company closes a funding round, I want to rapidly scale operations with better tools, so I can hit aggressive growth targets before the next round.'
    },
    {
      id: 'national-saas-2',
      situation: 'current vendor is getting acquired or sunsetting',
      motivation: 'migrate to a stable alternative',
      expectedOutcome: 'avoid disruption to operations',
      keywords: ['acquired', 'sunset', 'migrate', 'alternative', 'disruption'],
      fullStatement: 'When my current vendor is getting acquired, I want to migrate to a stable alternative, so I can avoid disruption to operations.'
    },
    {
      id: 'national-saas-3',
      situation: 'hitting limits of current tool',
      motivation: 'find a solution that scales with us',
      expectedOutcome: 'grow without being held back by tooling',
      keywords: ['limits', 'scale', 'grow', 'enterprise', 'upgrade'],
      fullStatement: 'When hitting the limits of my current tool, I want to find a solution that scales with us, so I can grow without being held back by tooling.'
    },
    {
      id: 'national-saas-4',
      situation: 'facing integration challenges',
      motivation: 'find a platform with native integrations',
      expectedOutcome: 'eliminate manual data transfer and errors',
      keywords: ['integration', 'api', 'connect', 'automate', 'manual'],
      fullStatement: 'When facing integration challenges, I want to find a platform with native integrations, so I can eliminate manual data transfer and errors.'
    },
    {
      id: 'national-saas-5',
      situation: 'concerned about vendor lock-in',
      motivation: 'ensure data portability and open architecture',
      expectedOutcome: 'have freedom to switch if needed',
      keywords: ['lock-in', 'vendor', 'portability', 'export', 'open'],
      fullStatement: 'When concerned about vendor lock-in, I want to ensure data portability and open architecture, so I have freedom to switch if needed.'
    }
  ],

  'national-product-b2c': [
    {
      id: 'national-product-1',
      situation: 'D2C costs are rising unsustainably',
      motivation: 'establish retail distribution partnerships',
      expectedOutcome: 'lower CAC and expand reach',
      keywords: ['d2c', 'retail', 'distribution', 'cac', 'partnership'],
      fullStatement: 'When D2C costs are rising unsustainably, I want to establish retail distribution partnerships, so I can lower CAC and expand reach.'
    },
    {
      id: 'national-product-2',
      situation: 'category reset timing is approaching',
      motivation: 'pitch for better shelf placement',
      expectedOutcome: 'increase distribution and velocity',
      keywords: ['category reset', 'shelf', 'planogram', 'distribution', 'retail buyer'],
      fullStatement: 'When category reset timing is approaching, I want to pitch for better shelf placement, so I can increase distribution and velocity.'
    },
    {
      id: 'national-product-3',
      situation: 'product goes viral on social',
      motivation: 'scale production and distribution quickly',
      expectedOutcome: 'capitalize on demand before it fades',
      keywords: ['viral', 'demand', 'scale', 'production', 'social'],
      fullStatement: 'When my product goes viral on social, I want to scale production and distribution quickly, so I can capitalize on demand before it fades.'
    },
    {
      id: 'national-product-4',
      situation: 'competing with larger brands',
      motivation: 'differentiate on authenticity and quality',
      expectedOutcome: 'win loyal customers despite smaller marketing budget',
      keywords: ['compete', 'differentiate', 'authenticity', 'quality', 'loyal'],
      fullStatement: 'When competing with larger brands, I want to differentiate on authenticity and quality, so I can win loyal customers despite a smaller marketing budget.'
    }
  ],

  'global-saas-b2b': [
    {
      id: 'global-saas-1',
      situation: 'expanding to new regions with compliance requirements',
      motivation: 'ensure GDPR/data residency compliance',
      expectedOutcome: 'operate globally without regulatory risk',
      keywords: ['gdpr', 'compliance', 'data residency', 'global', 'regulatory'],
      fullStatement: 'When expanding to new regions with compliance requirements, I want to ensure GDPR/data residency compliance, so I can operate globally without regulatory risk.'
    },
    {
      id: 'global-saas-2',
      situation: 'enterprise customers require audit trails',
      motivation: 'implement governance and security features',
      expectedOutcome: 'win enterprise deals with confidence',
      keywords: ['enterprise', 'audit', 'governance', 'security', 'soc2'],
      fullStatement: 'When enterprise customers require audit trails, I want to implement governance and security features, so I can win enterprise deals with confidence.'
    },
    {
      id: 'global-saas-3',
      situation: 'current vendor lacks enterprise-grade support',
      motivation: 'find a vendor with global support coverage',
      expectedOutcome: 'ensure 24/7 support across all regions',
      keywords: ['enterprise', 'support', 'global', '24/7', 'sla'],
      fullStatement: 'When my current vendor lacks enterprise-grade support, I want to find a vendor with global support coverage, so I can ensure 24/7 support across all regions.'
    }
  ]
};

// ============================================================================
// SERVICE
// ============================================================================

class JTBDValidatorService {
  /**
   * Validate a trigger against JTBD templates for the profile
   */
  validate(
    triggerTitle: string,
    triggerSummary: string | undefined,
    profileType: BusinessProfileType,
    uvp?: CompleteUVP
  ): JTBDValidationResult {
    const templates = PROFILE_JTBD_TEMPLATES[profileType] || PROFILE_JTBD_TEMPLATES['national-saas-b2b'];
    const combinedText = `${triggerTitle} ${triggerSummary || ''}`.toLowerCase();

    // Find best matching JTBD template
    let bestMatch: JTBDTemplate | null = null;
    let bestScore = 0;

    for (const template of templates) {
      const score = this.calculateMatchScore(combinedText, template);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    // Also check against UVP-derived JTBD if available
    if (uvp) {
      const uvpJTBD = this.deriveJTBDFromUVP(uvp);
      if (uvpJTBD) {
        const uvpScore = this.calculateMatchScore(combinedText, uvpJTBD);
        if (uvpScore > bestScore) {
          bestScore = uvpScore;
          bestMatch = uvpJTBD;
        }
      }
    }

    // Extract components from trigger text
    const extractedComponents = this.extractJTBDComponents(combinedText);

    // Determine validity (threshold: 0.3)
    const isValid = bestScore >= 0.3;

    const reasoning = bestMatch
      ? `Matches JTBD: "${bestMatch.fullStatement}" (score: ${(bestScore * 100).toFixed(0)}%)`
      : `No JTBD match found (score: ${(bestScore * 100).toFixed(0)}%)`;

    return {
      isValid,
      matchedJTBD: bestMatch,
      matchScore: bestScore,
      reasoning,
      extractedComponents
    };
  }

  /**
   * Get all JTBD templates for a profile
   */
  getTemplatesForProfile(profileType: BusinessProfileType): JTBDTemplate[] {
    return PROFILE_JTBD_TEMPLATES[profileType] || PROFILE_JTBD_TEMPLATES['national-saas-b2b'];
  }

  /**
   * Create a JTBD statement from UVP data
   */
  deriveJTBDFromUVP(uvp: CompleteUVP): JTBDTemplate | null {
    const targetCustomer = uvp.targetCustomer?.statement;
    const transformation = uvp.transformationGoal;
    const painPoints = uvp.targetCustomer?.emotionalDrivers;

    if (!targetCustomer || !transformation?.before || !transformation?.after) {
      return null;
    }

    const situation = transformation.before;
    const motivation = painPoints?.[0] || 'solve this problem';
    const outcome = transformation.after;

    return {
      id: 'uvp-derived',
      situation,
      motivation,
      expectedOutcome: outcome,
      keywords: [
        ...situation.toLowerCase().split(' ').filter(w => w.length > 4),
        ...motivation.toLowerCase().split(' ').filter(w => w.length > 4),
        ...outcome.toLowerCase().split(' ').filter(w => w.length > 4)
      ],
      fullStatement: `When ${situation}, I want to ${motivation}, so I can ${outcome}.`
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private calculateMatchScore(text: string, template: JTBDTemplate): number {
    // Count keyword matches
    const matchedKeywords = template.keywords.filter(kw => text.includes(kw));
    const keywordScore = matchedKeywords.length / template.keywords.length;

    // Check for situation/motivation/outcome pattern matches
    const situationMatch = text.includes(template.situation.toLowerCase().substring(0, 20)) ? 0.2 : 0;
    const motivationMatch = text.includes(template.motivation.toLowerCase().substring(0, 15)) ? 0.2 : 0;
    const outcomeMatch = text.includes(template.expectedOutcome.toLowerCase().substring(0, 15)) ? 0.1 : 0;

    // Weighted score
    return (keywordScore * 0.5) + situationMatch + motivationMatch + outcomeMatch;
  }

  private extractJTBDComponents(text: string): {
    situation?: string;
    motivation?: string;
    outcome?: string;
  } {
    const components: {
      situation?: string;
      motivation?: string;
      outcome?: string;
    } = {};

    // Try to extract "when X" pattern for situation
    const whenMatch = text.match(/when\s+([^,]+)/i);
    if (whenMatch) {
      components.situation = whenMatch[1].trim();
    }

    // Try to extract "want/need/looking for X" pattern for motivation
    const wantMatch = text.match(/(?:want|need|looking for)\s+([^,]+)/i);
    if (wantMatch) {
      components.motivation = wantMatch[1].trim();
    }

    // Try to extract "so I can/to achieve X" pattern for outcome
    const outcomeMatch = text.match(/(?:so i can|to achieve|in order to)\s+([^,]+)/i);
    if (outcomeMatch) {
      components.outcome = outcomeMatch[1].trim();
    }

    return components;
  }
}

// Export singleton
export const jtbdValidatorService = new JTBDValidatorService();
