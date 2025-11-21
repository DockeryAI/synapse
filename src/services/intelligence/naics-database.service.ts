/**
 * NAICS Database Service
 *
 * Fetches real 40-field industry profiles from Supabase
 * and maps them to the format needed for orchestration.
 */

import { supabase } from '@/lib/supabase';
import type { IndustryProfileFull } from '@/types/industry-profile.types';

export interface IndustryProfile {
  naicsCode: string;
  industry: string;
  category: string;
  triggers: {
    fear: string[];
    desire: string[];
    urgency: string[];
    trust: string[];
    social: string[];
  };
  powerWords: string[];
  avoidWords: string[];
  languagePatterns: {
    formal: string[];
    casual: string[];
    emotional: string[];
  };
  customerPersona: {
    primaryMotivation: string;
    decisionDrivers: string[];
    objections: string[];
    valueLanguage: string[];
  };
  contentAngles: string[];
  headlines: string[];
  ctas: string[];
  painPoints: string[];
  solutions: string[];
}

class NAICSDatabaseService {
  private cache = new Map<string, IndustryProfile>();

  /**
   * Get profile for an industry - fetches from Supabase
   */
  async getProfile(naicsCode: string): Promise<IndustryProfile | undefined> {
    // Check cache first
    if (this.cache.has(naicsCode)) {
      return this.cache.get(naicsCode);
    }

    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('naics_code', naicsCode)
        .single();

      if (error || !data) {
        console.warn(`[NAICS] Profile not found for ${naicsCode}`);
        return undefined;
      }

      const profile = this.mapToOrchestrationFormat(data as IndustryProfileFull);
      this.cache.set(naicsCode, profile);
      return profile;

    } catch (error) {
      console.error('[NAICS] Error fetching profile:', error);
      return undefined;
    }
  }

  /**
   * Match industry text to best profile
   */
  async matchIndustry(industryText: string): Promise<IndustryProfile> {
    // Try to find by industry name
    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('*')
        .ilike('industry_name', `%${industryText}%`)
        .limit(1)
        .single();

      if (!error && data) {
        const profile = this.mapToOrchestrationFormat(data as IndustryProfileFull);
        this.cache.set(data.naics_code, profile);
        return profile;
      }
    } catch {
      // Continue to fallback
    }

    // Fallback: return generic business profile
    return this.getGenericProfile();
  }

  /**
   * Map IndustryProfileFull (40 fields) to orchestration format
   */
  private mapToOrchestrationFormat(full: IndustryProfileFull): IndustryProfile {
    // Extract triggers from customer_triggers array
    const triggers = this.extractTriggers(full.customer_triggers || [], full.urgency_drivers || []);

    // Extract language patterns
    const languagePatterns = {
      formal: (full.solution_language || []).slice(0, 5),
      casual: (full.customer_language_dictionary || []).slice(0, 10),
      emotional: (full.pain_point_language || []).slice(0, 5)
    };

    // Extract customer persona
    const customerPersona = {
      primaryMotivation: full.customer_journey?.substring(0, 200) || 'Quality service at fair value',
      decisionDrivers: (full.success_metrics || []).slice(0, 5),
      objections: this.extractObjections(full.objection_handlers || []),
      valueLanguage: (full.customer_language_dictionary || []).slice(0, 10)
    };

    return {
      naicsCode: full.naics_code,
      industry: full.industry_name || full.industry,
      category: full.category,
      triggers,
      powerWords: full.power_words || [],
      avoidWords: full.avoid_words || [],
      languagePatterns,
      customerPersona,
      contentAngles: (full.market_trends || []).concat(full.innovation_opportunities || []),
      headlines: full.headline_templates || [],
      ctas: full.call_to_action_templates || [],
      painPoints: full.pain_point_language || [],
      solutions: full.solution_language || []
    };
  }

  /**
   * Extract triggers by category from customer_triggers
   */
  private extractTriggers(
    customerTriggers: any[],
    urgencyDrivers: string[]
  ): IndustryProfile['triggers'] {
    const triggers: IndustryProfile['triggers'] = {
      fear: [],
      desire: [],
      urgency: urgencyDrivers.slice(0, 7),
      trust: [],
      social: []
    };

    // Parse customer triggers - they may be strings or objects
    for (const trigger of customerTriggers) {
      const text = typeof trigger === 'string' ? trigger : trigger.trigger || trigger.description || '';
      const lower = text.toLowerCase();

      if (lower.includes('worry') || lower.includes('fear') || lower.includes('risk') || lower.includes('lose') || lower.includes('miss')) {
        triggers.fear.push(text);
      } else if (lower.includes('want') || lower.includes('need') || lower.includes('desire') || lower.includes('hope') || lower.includes('dream')) {
        triggers.desire.push(text);
      } else if (lower.includes('trust') || lower.includes('reliable') || lower.includes('proven') || lower.includes('guarantee')) {
        triggers.trust.push(text);
      } else if (lower.includes('everyone') || lower.includes('people') || lower.includes('community') || lower.includes('family')) {
        triggers.social.push(text);
      } else {
        // Default to desire
        triggers.desire.push(text);
      }
    }

    // Ensure minimums
    if (triggers.fear.length === 0) triggers.fear = ['losing money', 'making mistakes', 'missing out'];
    if (triggers.desire.length === 0) triggers.desire = ['success', 'growth', 'peace of mind'];
    if (triggers.trust.length === 0) triggers.trust = ['proven results', 'experience', 'testimonials'];
    if (triggers.social.length === 0) triggers.social = ['customers trust us', 'community recommends'];

    return triggers;
  }

  /**
   * Extract objection text from objection_handlers
   */
  private extractObjections(handlers: any[]): string[] {
    return handlers.slice(0, 5).map(h => {
      if (typeof h === 'string') return h;
      return h.objection || h.concern || String(h);
    });
  }

  /**
   * Generic fallback profile
   */
  private getGenericProfile(): IndustryProfile {
    return {
      naicsCode: '000000',
      industry: 'General Business',
      category: 'General',
      triggers: {
        fear: ['losing money', 'missing out', 'making mistakes', 'wasting time', 'falling behind'],
        desire: ['success', 'growth', 'efficiency', 'quality', 'value', 'trust'],
        urgency: ['limited time', 'act now', 'before it\'s too late', 'don\'t miss'],
        trust: ['experience', 'reviews', 'results', 'reputation', 'guarantee'],
        social: ['customers trust', 'businesses choose', 'community recommends']
      },
      powerWords: ['proven', 'trusted', 'quality', 'value', 'results', 'guaranteed', 'professional', 'expert'],
      avoidWords: ['cheap', 'discount', 'deal', 'limited', 'act now'],
      languagePatterns: {
        formal: ['services', 'solutions', 'process', 'engagement', 'deliverables'],
        casual: ['works', 'easy', 'best', 'great'],
        emotional: ['finally', 'peace of mind', 'confidence', 'relief']
      },
      customerPersona: {
        primaryMotivation: 'Getting quality results at fair value',
        decisionDrivers: ['Price', 'Quality', 'Trust', 'Convenience', 'Reviews'],
        objections: ['Too expensive', 'Don\'t need it', 'Not now', 'Can do it myself'],
        valueLanguage: ['price', 'quality', 'service', 'value', 'results']
      },
      contentAngles: ['How-to guides', 'Problem-solution content', 'Customer stories'],
      headlines: ['How to [achieve outcome]', 'The [number] things you need to know', 'Why [topic] matters'],
      ctas: ['Learn more', 'Get started', 'Contact us'],
      painPoints: ['wasting time', 'losing money', 'making mistakes'],
      solutions: ['save time', 'increase efficiency', 'get results']
    };
  }
}

export const naicsDatabase = new NAICSDatabaseService();
