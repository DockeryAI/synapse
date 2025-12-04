// PRD Feature: SYNAPSE-V6
/**
 * Persona Adapter Service
 *
 * Converts complex buyer personas from database to simple target_personas format
 * for the V1 synapse engine. Simplifies over-engineered BuyerPersona interface
 * into basic persona objects that V1 engine expects.
 */

import type { BuyerPersona } from '@/types/buyer-persona.types';
import { INDUSTRY_EQ_MAP } from '@/services/uvp-wizard/emotional-quotient';

/**
 * Simple target persona format for V1 synapse engine
 */
export interface TargetPersona {
  id: string;
  name: string;
  role: string;
  company_type: string;
  pain_points: string[];
  desired_outcomes: string[];
  emotional_drivers: string[];
  functional_drivers: string[];
  confidence_score: number;
}

/**
 * Convert complex buyer personas from database to simple target_personas
 * for the synapse engine context
 */
export function adaptBuyerPersonasToTargetPersonas(
  buyerPersonas: BuyerPersona[]
): TargetPersona[] {
  if (!buyerPersonas || buyerPersonas.length === 0) {
    return [];
  }

  console.log('[PersonaAdapter] Converting', buyerPersonas.length, 'buyer personas to target personas');

  return buyerPersonas.map((persona, index) => {
    // Extract pain points - handle both simple strings and complex objects
    const painPoints: string[] = [];
    if (Array.isArray(persona.pain_points)) {
      persona.pain_points.forEach(p => {
        if (typeof p === 'string') {
          painPoints.push(p);
        } else if (p && typeof p === 'object' && 'description' in p) {
          painPoints.push((p as any).description);
        }
      });
    }

    // Extract desired outcomes - handle both simple strings and complex objects
    const desiredOutcomes: string[] = [];
    if (Array.isArray(persona.desired_outcomes)) {
      persona.desired_outcomes.forEach(o => {
        if (typeof o === 'string') {
          desiredOutcomes.push(o);
        } else if (o && typeof o === 'object' && 'description' in o) {
          desiredOutcomes.push((o as any).description);
        }
      });
    }

    // Handle different persona formats - some might be simple customer profiles
    const targetPersona: TargetPersona = {
      id: persona.id || `persona-${Date.now()}-${index}`,
      name: persona.persona_name || persona.name || `Customer Segment ${index + 1}`,
      role: typeof persona.role === 'string' ? persona.role :
            (persona.role as any)?.title || 'Target Customer',
      company_type: typeof persona.company_type === 'string' ? persona.company_type :
                   persona.company_type || 'Business',
      pain_points: painPoints,
      desired_outcomes: desiredOutcomes,
      emotional_drivers: persona.emotional_drivers || [],
      functional_drivers: persona.functional_drivers || [],
      confidence_score: persona.confidence_score || 85
    };

    console.log('[PersonaAdapter] Converted persona:', {
      name: targetPersona.name,
      role: targetPersona.role,
      painPoints: targetPersona.pain_points.length,
      emotionalDrivers: targetPersona.emotional_drivers.length
    });

    return targetPersona;
  });
}

/**
 * Build synapse engine context with buyer personas as target_personas
 */
export function buildSynapseContext(params: {
  industry: string;
  archetype: string;
  brandVoice: string;
  keywords: string[];
  emotionalTriggers: string[];
  buyerPersonas: BuyerPersona[];
  competitors?: string[];
  contentGaps?: string[];
  opportunities?: string[];
}): any {
  const targetPersonas = adaptBuyerPersonasToTargetPersonas(params.buyerPersonas);

  const context = {
    industry: params.industry,
    archetype: params.archetype,
    brand_voice: params.brandVoice,
    keywords: params.keywords,
    triggers: params.emotionalTriggers,
    target_personas: targetPersonas,
    competitors: params.competitors || [],
    content_gaps: params.contentGaps || [],
    current_opportunities: params.opportunities || []
  };

  console.log('[PersonaAdapter] Built synapse context:', {
    industry: context.industry,
    archetype: context.archetype,
    targetPersonasCount: context.target_personas.length,
    triggersCount: context.triggers.length
  });

  return context;
}

/**
 * Get industry EQ score for persona balancing
 */
export function getIndustryEQScore(industry: string): number {
  const normalizedIndustry = industry.toLowerCase().trim();

  // Try exact match first
  if (INDUSTRY_EQ_MAP[normalizedIndustry]) {
    return INDUSTRY_EQ_MAP[normalizedIndustry];
  }

  // Try partial matches
  const industryKeys = Object.keys(INDUSTRY_EQ_MAP);
  for (const key of industryKeys) {
    if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
      return INDUSTRY_EQ_MAP[key];
    }
  }

  // Default to balanced emotional/rational
  return 50;
}