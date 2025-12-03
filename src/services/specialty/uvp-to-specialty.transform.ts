/**
 * UVP → Specialty Profile Transform Service
 *
 * Transforms UVP data directly into V1-compatible specialty profile fields.
 * NO LLM required - this is pure data mapping from extracted UVP data.
 *
 * The UVP wizard already extracts ~60-70% of what V1 profiles have:
 * - Customer profiles with emotional/functional drivers
 * - Differentiators with evidence
 * - Benefits with metrics
 * - Transformation statements
 *
 * This service maps that data to the specialty_profiles schema.
 *
 * Created: 2025-12-02
 */

import type { CompleteUVP, CustomerProfile, Differentiator, KeyBenefit, TransformationGoal } from '@/types/uvp-flow.types';
import type { BusinessProfileType, SpecialtyProfileRow } from '@/types/specialty-profile.types';

// ============================================================================
// TYPES
// ============================================================================

export interface UVPTransformInput {
  uvp: CompleteUVP;
  businessName: string;
  industry: string;
  businessProfileType: BusinessProfileType;
}

export interface UVPTransformResult {
  /** Fields derived directly from UVP (no LLM needed) */
  derived: {
    // Core trigger data
    common_pain_points: string[];
    common_buying_triggers: string[];
    customer_triggers: Array<{ trigger: string; urgency: number; frequency: string }>;
    urgency_drivers: string[];
    competitive_advantages: string[];
    trust_builders: string[];
    risk_mitigation: string;
    transformations: Array<{ from: string; to: string; emotional_value: string; worth_premium: boolean }>;
    success_metrics: Array<{ metric: string; timeframe: string; measurable: boolean }>;
    objection_handlers: Array<{ objection: string; response: string; effectiveness: number }>;

    // FULL UVP DATA - for injection into LLM prompts
    full_uvp: {
      // Target customer
      target_customer_statement: string;
      target_customer_industry?: string;
      target_customer_role?: string;
      target_customer_company_size?: string;
      emotional_drivers: string[];
      functional_drivers: string[];

      // Products/services
      products_services: string[];
      product_categories: string[];

      // Transformation
      transformation_statement: string;
      transformation_before: string;
      transformation_after: string;
      transformation_why: string;

      // Unique solution
      unique_solution_statement: string;
      differentiators: string[];
      methodology?: string;
      proprietary_approach?: string;

      // Key benefit
      key_benefit_statement: string;
      benefit_metrics: Array<{ metric: string; value: string; timeframe?: string }>;
      outcome_type: string;

      // Synthesized UVP
      value_proposition_statement: string;
      why_statement: string;
      what_statement: string;
      how_statement: string;
    };
  };

  /** Fields that still need LLM generation */
  missing: {
    market_trends: boolean;
    seasonal_patterns: boolean;
    geographic_variations: boolean;
    headline_templates: boolean;
    hook_library: boolean;
    power_words: boolean;
    avoid_words: boolean;
    innovation_opportunities: boolean;
  };

  /** Quality metrics */
  coverage: {
    totalFields: number;
    derivedFields: number;
    percentComplete: number;
  };
}

// ============================================================================
// TRANSFORM SERVICE
// ============================================================================

class UVPToSpecialtyTransformService {

  /**
   * Transform UVP data into specialty profile fields
   * Returns both derived fields and flags for what still needs LLM generation
   */
  transform(input: UVPTransformInput): UVPTransformResult {
    const { uvp, businessProfileType } = input;

    console.log('[UVPTransform] Starting transform for:', input.businessName);
    console.log('[UVPTransform] UVP components available:', {
      hasTargetCustomer: !!uvp.targetCustomer,
      hasTransformation: !!uvp.transformationGoal,
      hasUniqueSolution: !!uvp.uniqueSolution,
      hasKeyBenefit: !!uvp.keyBenefit,
      hasProducts: !!uvp.productsServices,
    });

    // Extract all customer profiles (may be array or single)
    const customerProfiles = this.extractCustomerProfiles(uvp);

    // Transform each field type
    const common_pain_points = this.extractPainPoints(customerProfiles, uvp.transformationGoal);
    const common_buying_triggers = this.extractBuyingTriggers(customerProfiles, uvp.transformationGoal);
    const customer_triggers = this.extractCustomerTriggers(customerProfiles, uvp.transformationGoal);
    const urgency_drivers = this.extractUrgencyDrivers(uvp.transformationGoal, customerProfiles);
    const competitive_advantages = this.extractCompetitiveAdvantages(uvp.uniqueSolution);
    const trust_builders = this.extractTrustBuilders(uvp.keyBenefit, uvp.uniqueSolution);
    const risk_mitigation = this.extractRiskMitigation(uvp.uniqueSolution);
    const transformations = this.extractTransformations(uvp.transformationGoal);
    const success_metrics = this.extractSuccessMetrics(uvp.keyBenefit);
    const objection_handlers = this.extractObjectionHandlers(customerProfiles, uvp.uniqueSolution);

    // Extract FULL UVP data for LLM prompt injection
    const full_uvp = this.extractFullUVP(uvp);

    const derived = {
      common_pain_points,
      common_buying_triggers,
      customer_triggers,
      urgency_drivers,
      competitive_advantages,
      trust_builders,
      risk_mitigation,
      transformations,
      success_metrics,
      objection_handlers,
      full_uvp,
    };

    // Calculate what we have vs what's missing
    const derivedFieldCount = Object.values(derived).filter(v =>
      Array.isArray(v) ? v.length > 0 : !!v
    ).length;

    const totalFields = 18; // Total fields in a complete specialty profile
    const percentComplete = Math.round((derivedFieldCount / totalFields) * 100);

    console.log('[UVPTransform] Transform complete:', {
      painPoints: common_pain_points.length,
      buyingTriggers: common_buying_triggers.length,
      customerTriggers: customer_triggers.length,
      urgencyDrivers: urgency_drivers.length,
      competitiveAdvantages: competitive_advantages.length,
      fullUVPIncluded: !!full_uvp.value_proposition_statement,
      percentComplete: `${percentComplete}%`,
    });

    return {
      derived,
      missing: {
        market_trends: true,
        seasonal_patterns: true,
        geographic_variations: businessProfileType.includes('local') || businessProfileType.includes('regional'),
        headline_templates: true,
        hook_library: true,
        power_words: true,
        avoid_words: true,
        innovation_opportunities: true,
      },
      coverage: {
        totalFields,
        derivedFields: derivedFieldCount,
        percentComplete,
      },
    };
  }

  /**
   * Extract the FULL UVP data for injection into LLM prompts
   * This is the key to V1-quality triggers - the LLM needs full context
   */
  private extractFullUVP(uvp: CompleteUVP): UVPTransformResult['derived']['full_uvp'] {
    // Target customer
    const targetCustomer = uvp.targetCustomer;
    const target_customer_statement = targetCustomer?.statement || '';
    const target_customer_industry = targetCustomer?.industry;
    const target_customer_role = targetCustomer?.role;
    const target_customer_company_size = targetCustomer?.companySize;

    // DEBUG: Log raw driver data
    console.log('[UVPTransform] 🔍 DEBUG - targetCustomer.emotionalDrivers:', targetCustomer?.emotionalDrivers);
    console.log('[UVPTransform] 🔍 DEBUG - targetCustomer.functionalDrivers:', targetCustomer?.functionalDrivers);
    console.log('[UVPTransform] 🔍 DEBUG - transformationGoal.emotionalDrivers:', uvp.transformationGoal?.emotionalDrivers);
    console.log('[UVPTransform] 🔍 DEBUG - transformationGoal.functionalDrivers:', uvp.transformationGoal?.functionalDrivers);

    const emotional_drivers = [
      ...(targetCustomer?.emotionalDrivers || []),
      ...(uvp.transformationGoal?.emotionalDrivers || []),
    ].filter(d => d); // Filter out null/undefined

    const functional_drivers = [
      ...(targetCustomer?.functionalDrivers || []),
      ...(uvp.transformationGoal?.functionalDrivers || []),
    ].filter(d => d); // Filter out null/undefined

    console.log('[UVPTransform] 🔍 DEBUG - emotional_drivers final:', emotional_drivers);
    console.log('[UVPTransform] 🔍 DEBUG - functional_drivers final:', functional_drivers);

    // Products/services
    const products_services: string[] = [];
    const product_categories: string[] = [];
    if (uvp.productsServices?.categories) {
      uvp.productsServices.categories.forEach(cat => {
        product_categories.push(cat.name);
        cat.items.forEach(item => {
          products_services.push(item.name);
          if (item.description) {
            products_services.push(`${item.name}: ${item.description}`);
          }
        });
      });
    }

    // Transformation
    const transformation = uvp.transformationGoal;
    const transformation_statement = transformation?.statement || transformation?.outcomeStatement || '';
    const transformation_before = transformation?.before || '';
    const transformation_after = transformation?.after || '';
    const transformation_why = transformation?.why || '';

    // Unique solution
    const solution = uvp.uniqueSolution;
    const unique_solution_statement = solution?.statement || solution?.outcomeStatement || '';

    // DEBUG: Log the actual differentiators structure
    console.log('[UVPTransform] 🔍 DEBUG - solution.differentiators raw:', JSON.stringify(solution?.differentiators, null, 2)?.substring(0, 500));

    // Filter out null/undefined statements and map to strings
    const differentiators = (solution?.differentiators || [])
      .filter(d => d && d.statement)
      .map(d => d.statement);

    console.log('[UVPTransform] 🔍 DEBUG - differentiators after filter:', differentiators);

    const methodology = solution?.methodology;
    const proprietary_approach = solution?.proprietaryApproach;

    // Key benefit
    const benefit = uvp.keyBenefit;
    const key_benefit_statement = benefit?.statement || benefit?.outcomeStatement || '';
    const benefit_metrics = benefit?.metrics?.map(m => ({
      metric: m.metric,
      value: m.value,
      timeframe: m.timeframe,
    })) || [];
    const outcome_type = benefit?.outcomeType || 'mixed';

    // Synthesized UVP
    const value_proposition_statement = uvp.valuePropositionStatement || '';
    const why_statement = uvp.whyStatement || '';
    const what_statement = uvp.whatStatement || '';
    const how_statement = uvp.howStatement || '';

    console.log('[UVPTransform] Full UVP extracted:', {
      targetCustomer: target_customer_statement.substring(0, 50) + '...',
      products: products_services.length,
      transformation: !!transformation_statement,
      solution: !!unique_solution_statement,
      benefit: !!key_benefit_statement,
      uvpStatement: !!value_proposition_statement,
    });

    return {
      target_customer_statement,
      target_customer_industry,
      target_customer_role,
      target_customer_company_size,
      emotional_drivers,
      functional_drivers,
      products_services,
      product_categories,
      transformation_statement,
      transformation_before,
      transformation_after,
      transformation_why,
      unique_solution_statement,
      differentiators,
      methodology,
      proprietary_approach,
      key_benefit_statement,
      benefit_metrics,
      outcome_type,
      value_proposition_statement,
      why_statement,
      what_statement,
      how_statement,
    };
  }

  // ============================================================================
  // EXTRACTION METHODS
  // ============================================================================

  /**
   * Extract all customer profiles from UVP
   * Handles both single profile and array cases
   */
  private extractCustomerProfiles(uvp: CompleteUVP): CustomerProfile[] {
    const profiles: CustomerProfile[] = [];

    // Single target customer
    if (uvp.targetCustomer) {
      profiles.push(uvp.targetCustomer);
    }

    // Additional profiles from products/services if available
    // (Some UVP flows have multiple customer segments)

    return profiles;
  }

  /**
   * Extract pain points from emotional drivers
   * Maps: customerProfiles[].emotionalDrivers → common_pain_points
   */
  private extractPainPoints(profiles: CustomerProfile[], transformation?: TransformationGoal): string[] {
    const painPoints: string[] = [];
    const seen = new Set<string>();

    // From customer profiles emotional drivers
    profiles.forEach(profile => {
      if (profile.emotionalDrivers) {
        profile.emotionalDrivers.forEach(driver => {
          const normalized = this.normalizePainPoint(driver);
          if (normalized && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            painPoints.push(normalized);
          }
        });
      }
    });

    // From transformation "before" state
    if (transformation?.before) {
      const normalized = this.normalizePainPoint(transformation.before);
      if (normalized && !seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        painPoints.push(normalized);
      }
    }

    // From transformation emotional drivers
    if (transformation?.emotionalDrivers) {
      transformation.emotionalDrivers.forEach(driver => {
        const normalized = this.normalizePainPoint(driver);
        if (normalized && !seen.has(normalized.toLowerCase())) {
          seen.add(normalized.toLowerCase());
          painPoints.push(normalized);
        }
      });
    }

    return painPoints;
  }

  /**
   * Extract buying triggers from functional drivers
   * Maps: customerProfiles[].functionalDrivers → common_buying_triggers
   */
  private extractBuyingTriggers(profiles: CustomerProfile[], transformation?: TransformationGoal): string[] {
    const triggers: string[] = [];
    const seen = new Set<string>();

    // From customer profiles functional drivers
    profiles.forEach(profile => {
      if (profile.functionalDrivers) {
        profile.functionalDrivers.forEach(driver => {
          const normalized = this.normalizeBuyingTrigger(driver);
          if (normalized && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            triggers.push(normalized);
          }
        });
      }
    });

    // From transformation functional drivers
    if (transformation?.functionalDrivers) {
      transformation.functionalDrivers.forEach(driver => {
        const normalized = this.normalizeBuyingTrigger(driver);
        if (normalized && !seen.has(normalized.toLowerCase())) {
          seen.add(normalized.toLowerCase());
          triggers.push(normalized);
        }
      });
    }

    return triggers;
  }

  /**
   * Extract customer triggers with urgency and frequency
   * Maps: customerProfiles[] → customer_triggers with metadata
   */
  private extractCustomerTriggers(
    profiles: CustomerProfile[],
    transformation?: TransformationGoal
  ): Array<{ trigger: string; urgency: number; frequency: string }> {
    const triggers: Array<{ trigger: string; urgency: number; frequency: string }> = [];
    const seen = new Set<string>();

    // From profile statements
    profiles.forEach(profile => {
      if (profile.statement && !seen.has(profile.statement.toLowerCase())) {
        seen.add(profile.statement.toLowerCase());
        triggers.push({
          trigger: profile.statement,
          urgency: this.inferUrgency(profile.statement),
          frequency: this.inferFrequency(profile.statement),
        });
      }

      // From emotional drivers (high urgency)
      profile.emotionalDrivers?.forEach(driver => {
        if (!seen.has(driver.toLowerCase())) {
          seen.add(driver.toLowerCase());
          triggers.push({
            trigger: driver,
            urgency: 8, // Emotional drivers are high urgency
            frequency: 'ongoing',
          });
        }
      });

      // From functional drivers (medium urgency)
      profile.functionalDrivers?.forEach(driver => {
        if (!seen.has(driver.toLowerCase())) {
          seen.add(driver.toLowerCase());
          triggers.push({
            trigger: driver,
            urgency: 6, // Functional drivers are medium urgency
            frequency: 'monthly',
          });
        }
      });
    });

    // From transformation
    if (transformation?.statement && !seen.has(transformation.statement.toLowerCase())) {
      seen.add(transformation.statement.toLowerCase());
      triggers.push({
        trigger: transformation.statement,
        urgency: 9, // Transformation goals are high urgency
        frequency: 'quarterly',
      });
    }

    return triggers;
  }

  /**
   * Extract urgency drivers from transformation "before" state
   * Maps: transformation.before + emotionalDrivers → urgency_drivers
   */
  private extractUrgencyDrivers(transformation?: TransformationGoal, profiles?: CustomerProfile[]): string[] {
    const drivers: string[] = [];
    const seen = new Set<string>();

    // From transformation "before" state (what they're trying to escape)
    if (transformation?.before) {
      const urgencyStatement = `Escape from: ${transformation.before}`;
      if (!seen.has(urgencyStatement.toLowerCase())) {
        seen.add(urgencyStatement.toLowerCase());
        drivers.push(transformation.before);
      }
    }

    // High-urgency emotional drivers
    profiles?.forEach(profile => {
      profile.emotionalDrivers?.forEach(driver => {
        // Only include drivers that indicate urgency (fear, deadline, risk)
        if (this.isUrgencyDriver(driver) && !seen.has(driver.toLowerCase())) {
          seen.add(driver.toLowerCase());
          drivers.push(driver);
        }
      });
    });

    // From transformation emotional drivers
    transformation?.emotionalDrivers?.forEach(driver => {
      if (this.isUrgencyDriver(driver) && !seen.has(driver.toLowerCase())) {
        seen.add(driver.toLowerCase());
        drivers.push(driver);
      }
    });

    return drivers;
  }

  /**
   * Extract competitive advantages from unique solution
   * Maps: uniqueSolution.differentiators → competitive_advantages
   */
  private extractCompetitiveAdvantages(solution?: { differentiators?: Differentiator[]; statement?: string }): string[] {
    const advantages: string[] = [];
    const seen = new Set<string>();

    if (solution?.differentiators) {
      solution.differentiators.forEach(diff => {
        if (diff.statement && !seen.has(diff.statement.toLowerCase())) {
          seen.add(diff.statement.toLowerCase());
          advantages.push(diff.statement);
        }
      });
    }

    // Also include the main solution statement
    if (solution?.statement && !seen.has(solution.statement.toLowerCase())) {
      seen.add(solution.statement.toLowerCase());
      advantages.push(solution.statement);
    }

    return advantages;
  }

  /**
   * Extract trust builders from key benefits
   * Maps: keyBenefit + uniqueSolution → trust_builders
   */
  private extractTrustBuilders(benefit?: KeyBenefit, solution?: { differentiators?: Differentiator[] }): string[] {
    const builders: string[] = [];
    const seen = new Set<string>();

    // From key benefit metrics
    if (benefit?.metrics) {
      benefit.metrics.forEach(metric => {
        const trustStatement = `${metric.metric}: ${metric.value}${metric.timeframe ? ` in ${metric.timeframe}` : ''}`;
        if (!seen.has(trustStatement.toLowerCase())) {
          seen.add(trustStatement.toLowerCase());
          builders.push(trustStatement);
        }
      });
    }

    // From key benefit statement
    if (benefit?.statement && !seen.has(benefit.statement.toLowerCase())) {
      seen.add(benefit.statement.toLowerCase());
      builders.push(benefit.statement);
    }

    // From differentiator evidence
    solution?.differentiators?.forEach(diff => {
      if (diff.evidence && !seen.has(diff.evidence.toLowerCase())) {
        seen.add(diff.evidence.toLowerCase());
        builders.push(diff.evidence);
      }
    });

    return builders;
  }

  /**
   * Extract risk mitigation from unique solution
   */
  private extractRiskMitigation(solution?: { statement?: string; methodology?: string; proprietaryApproach?: string }): string {
    if (solution?.proprietaryApproach) return solution.proprietaryApproach;
    if (solution?.methodology) return solution.methodology;
    if (solution?.statement) return solution.statement;
    return '';
  }

  /**
   * Extract transformations in V1 format
   * Maps: transformationGoal → transformations[]
   */
  private extractTransformations(transformation?: TransformationGoal): Array<{ from: string; to: string; emotional_value: string; worth_premium: boolean }> {
    if (!transformation) return [];

    const transformations: Array<{ from: string; to: string; emotional_value: string; worth_premium: boolean }> = [];

    // Main transformation
    if (transformation.before && transformation.after) {
      transformations.push({
        from: transformation.before,
        to: transformation.after,
        emotional_value: transformation.why || transformation.emotionalDrivers?.[0] || 'Improved outcomes',
        worth_premium: true,
      });
    }

    // From statement if structured data not available
    if (transformations.length === 0 && transformation.statement) {
      transformations.push({
        from: 'Current challenges',
        to: transformation.statement,
        emotional_value: transformation.emotionalDrivers?.[0] || 'Achievement of goals',
        worth_premium: true,
      });
    }

    return transformations;
  }

  /**
   * Extract success metrics from key benefit
   * Maps: keyBenefit.metrics → success_metrics[]
   */
  private extractSuccessMetrics(benefit?: KeyBenefit): Array<{ metric: string; timeframe: string; measurable: boolean }> {
    if (!benefit?.metrics) return [];

    return benefit.metrics.map(m => ({
      metric: `${m.metric}: ${m.value}`,
      timeframe: m.timeframe || '90 days',
      measurable: benefit.outcomeType === 'quantifiable' || benefit.outcomeType === 'mixed',
    }));
  }

  /**
   * Extract objection handlers from customer profiles and solution
   * Infers common objections from pain points and provides solution-based responses
   */
  private extractObjectionHandlers(
    profiles: CustomerProfile[],
    solution?: { differentiators?: Differentiator[]; statement?: string }
  ): Array<{ objection: string; response: string; effectiveness: number }> {
    const handlers: Array<{ objection: string; response: string; effectiveness: number }> = [];

    // Common objection patterns based on profile type
    const painPoints = profiles.flatMap(p => p.emotionalDrivers || []);
    const differentiators = solution?.differentiators || [];

    // Map pain points to objections
    painPoints.slice(0, 5).forEach((pain, idx) => {
      const relevantDiff = differentiators[idx % differentiators.length];
      handlers.push({
        objection: `Concerned about: ${pain}`,
        response: relevantDiff?.statement || solution?.statement || 'Our solution directly addresses this concern.',
        effectiveness: 7 + Math.floor(Math.random() * 3), // 7-9
      });
    });

    // Add standard objections if we have differentiators
    if (differentiators.length > 0) {
      handlers.push({
        objection: 'Why should I choose you over competitors?',
        response: differentiators[0].statement,
        effectiveness: 9,
      });
    }

    return handlers;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private normalizePainPoint(text: string): string {
    // Clean up and normalize pain point text
    return text
      .replace(/^(fear of|worry about|concern about|frustrated by|struggling with)\s*/i, '')
      .trim();
  }

  private normalizeBuyingTrigger(text: string): string {
    // Clean up and normalize buying trigger text
    return text
      .replace(/^(need to|want to|looking for|searching for|must have)\s*/i, '')
      .trim();
  }

  private inferUrgency(text: string): number {
    const lowUrgency = /eventually|someday|nice to have|consider/i;
    const mediumUrgency = /need|want|looking for|improve/i;
    const highUrgency = /urgent|immediate|asap|critical|deadline|must|emergency/i;

    if (highUrgency.test(text)) return 9;
    if (mediumUrgency.test(text)) return 6;
    if (lowUrgency.test(text)) return 3;
    return 5; // Default medium
  }

  private inferFrequency(text: string): string {
    const ongoing = /always|constantly|every day|continuous/i;
    const monthly = /monthly|regular|often/i;
    const quarterly = /quarterly|periodic|sometimes/i;
    const annual = /annual|yearly|once a year/i;

    if (ongoing.test(text)) return 'ongoing';
    if (monthly.test(text)) return 'monthly';
    if (quarterly.test(text)) return 'quarterly';
    if (annual.test(text)) return 'annually';
    return 'monthly'; // Default
  }

  private isUrgencyDriver(text: string): boolean {
    const urgencyPatterns = /deadline|fear|risk|losing|behind|competitor|urgent|immediate|now|asap|critical|falling|missing|delay|cost|expensive|waste/i;
    return urgencyPatterns.test(text);
  }
}

// Export singleton instance
export const uvpToSpecialtyTransform = new UVPToSpecialtyTransformService();

// Export transform function for direct use
export function transformUVPToSpecialty(input: UVPTransformInput): UVPTransformResult {
  return uvpToSpecialtyTransform.transform(input);
}
