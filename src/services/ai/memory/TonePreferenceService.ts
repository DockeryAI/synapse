/**
 * Tone Preference Service
 *
 * Manages tone preferences with natural language commands like "make it funnier".
 * Tone adjustments persist for ALL future content.
 */

import { supabase } from '../../../lib/supabase';
import type {
  TonePreference,
  TonePreset,
  TonePresetDefinition,
  ToneAdjustment,
  ToneAdjustmentResult,
  AITonePreferenceRow,
} from '../../../types/ai-memory.types';

/**
 * Tone Preset Definitions
 */
const TONE_PRESETS: Record<TonePreset, TonePresetDefinition> = {
  casual: {
    id: 'casual',
    name: 'Casual',
    description: 'Friendly, relaxed, conversational',
    formality_level: 2,
    humor_level: 1,
    enthusiasm_level: 3,
    example_content: [
      'Hey there! 👋 Just wanted to share something cool with you...',
      'Real talk: This changed everything for me.',
    ],
    best_for: ['local-service', 'retail', 'restaurant'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Polished, credible, business-focused',
    formality_level: 4,
    humor_level: 0,
    enthusiasm_level: 2,
    example_content: [
      'We are pleased to announce our latest service offering...',
      'Our expertise in this field spans over two decades.',
    ],
    best_for: ['b2b-saas', 'professional-services'],
  },
  funny: {
    id: 'funny',
    name: 'Funny',
    description: 'Witty, humorous, entertaining',
    formality_level: 2,
    humor_level: 3,
    enthusiasm_level: 4,
    example_content: [
      'Monday meetings got you down? Us too. ☕😅',
      'We fix problems faster than you can say "call a plumber" (seriously, we timed it)',
    ],
    best_for: ['restaurant', 'retail', 'ecommerce'],
  },
  inspirational: {
    id: 'inspirational',
    name: 'Inspirational',
    description: 'Motivating, uplifting, empowering',
    formality_level: 3,
    humor_level: 0,
    enthusiasm_level: 5,
    example_content: [
      'Every journey begins with a single step. Take yours today.',
      'You deserve the transformation you\'ve been dreaming of.',
    ],
    best_for: ['professional-services', 'ecommerce'],
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Confident, direct, attention-grabbing',
    formality_level: 3,
    humor_level: 1,
    enthusiasm_level: 5,
    example_content: [
      'Stop settling for mediocre. You deserve exceptional.',
      'This is the solution you\'ve been searching for. Period.',
    ],
    best_for: ['ecommerce', 'b2b-saas'],
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable, welcoming',
    formality_level: 2,
    humor_level: 1,
    enthusiasm_level: 4,
    example_content: [
      'Welcome to our little corner of the internet! 🌟',
      'We\'re so glad you\'re here. Let\'s make something amazing together.',
    ],
    best_for: ['local-service', 'restaurant', 'retail'],
  },
  authoritative: {
    id: 'authoritative',
    name: 'Authoritative',
    description: 'Expert, knowledgeable, commanding',
    formality_level: 4,
    humor_level: 0,
    enthusiasm_level: 3,
    example_content: [
      'The data is clear: This approach delivers results.',
      'In my 15 years of experience, here\'s what works...',
    ],
    best_for: ['professional-services', 'b2b-saas'],
  },
  conversational: {
    id: 'conversational',
    name: 'Conversational',
    description: 'Natural, authentic, like talking to a friend',
    formality_level: 2,
    humor_level: 1,
    enthusiasm_level: 3,
    example_content: [
      'So here\'s the thing...',
      'I know what you\'re thinking, and yeah, you\'re right.',
    ],
    best_for: ['local-service', 'restaurant', 'ecommerce'],
  },
};

export class TonePreferenceService {
  /**
   * Get tone preference for user
   */
  static async getTonePreference(userId: string): Promise<TonePreference | null> {
    const { data, error } = await supabase
      .from('ai_tone_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - use default
        return null;
      }
      console.error('Error fetching tone preference:', error);
      throw error;
    }

    return this.mapRowToTonePreference(data as AITonePreferenceRow);
  }

  /**
   * Set tone preset
   */
  static async setTonePreset(userId: string, preset: TonePreset): Promise<TonePreference> {
    const presetDef = TONE_PRESETS[preset];

    const payload: any = {
      user_id: userId,
      tone_preset: preset,
      custom_description: null,
      formality_level: presetDef.formality_level,
      humor_level: presetDef.humor_level,
      enthusiasm_level: presetDef.enthusiasm_level,
      examples: presetDef.example_content,
      apply_to_all_content: true,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getTonePreference(userId);
    if (!existing) {
      payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ai_tone_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error setting tone preset:', error);
      throw error;
    }

    return this.mapRowToTonePreference(data as AITonePreferenceRow);
  }

  /**
   * Set custom tone description
   */
  static async setCustomTone(
    userId: string,
    description: string,
    formality: 1 | 2 | 3 | 4 | 5 = 3,
    humor: 0 | 1 | 2 | 3 = 1,
    enthusiasm: 1 | 2 | 3 | 4 | 5 = 3
  ): Promise<TonePreference> {
    const payload: any = {
      user_id: userId,
      tone_preset: null,
      custom_description: description,
      formality_level: formality,
      humor_level: humor,
      enthusiasm_level: enthusiasm,
      examples: [],
      apply_to_all_content: true,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getTonePreference(userId);
    if (!existing) {
      payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ai_tone_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error setting custom tone:', error);
      throw error;
    }

    return this.mapRowToTonePreference(data as AITonePreferenceRow);
  }

  /**
   * Adjust tone with natural language
   * Examples: "make it funnier", "more professional", "less formal"
   */
  static async adjustToneNaturally(
    userId: string,
    adjustment: string
  ): Promise<ToneAdjustmentResult> {
    const current = await this.getTonePreference(userId);
    const parsed = this.parseNaturalLanguageAdjustment(adjustment);

    if (!current) {
      // Create default tone first
      await this.setTonePreset(userId, 'casual');
      return this.adjustToneNaturally(userId, adjustment);
    }

    const previousTone = {
      formality_level: current.formality_level,
      humor_level: current.humor_level,
      enthusiasm_level: current.enthusiasm_level,
      tone_preset: current.tone_preset,
    };

    let newFormality = current.formality_level;
    let newHumor = current.humor_level;
    let newEnthusiasm = current.enthusiasm_level;
    let newPreset = current.tone_preset;
    const changes: string[] = [];

    // Apply adjustment
    if (parsed.attribute === 'tone_preset' && parsed.target_value) {
      newPreset = parsed.target_value as TonePreset;
      const preset = TONE_PRESETS[newPreset];
      newFormality = preset.formality_level;
      newHumor = preset.humor_level;
      newEnthusiasm = preset.enthusiasm_level;
      changes.push(`Switched to ${preset.name} tone`);
    } else if (parsed.attribute === 'formality') {
      newFormality = this.adjustLevel(newFormality, parsed.direction, parsed.magnitude || 1, 1, 5);
      newPreset = undefined; // Custom adjustment
      changes.push(
        parsed.direction === 'increase'
          ? 'Made tone more formal'
          : 'Made tone less formal'
      );
    } else if (parsed.attribute === 'humor') {
      newHumor = this.adjustLevel(newHumor, parsed.direction, parsed.magnitude || 1, 0, 3);
      newPreset = undefined;
      changes.push(
        parsed.direction === 'increase'
          ? 'Made tone funnier'
          : 'Made tone less funny'
      );
    } else if (parsed.attribute === 'enthusiasm') {
      newEnthusiasm = this.adjustLevel(newEnthusiasm, parsed.direction, parsed.magnitude || 1, 1, 5);
      newPreset = undefined;
      changes.push(
        parsed.direction === 'increase'
          ? 'Made tone more enthusiastic'
          : 'Made tone less enthusiastic'
      );
    }

    // Update database
    const { error } = await supabase
      .from('ai_tone_preferences')
      .update({
        tone_preset: newPreset,
        formality_level: newFormality,
        humor_level: newHumor,
        enthusiasm_level: newEnthusiasm,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error adjusting tone:', error);
      throw error;
    }

    const newTone = {
      formality_level: newFormality,
      humor_level: newHumor,
      enthusiasm_level: newEnthusiasm,
      tone_preset: newPreset,
    };

    return {
      success: true,
      previous_tone: previousTone,
      new_tone: newTone,
      changes,
    };
  }

  /**
   * Parse natural language tone adjustment
   */
  private static parseNaturalLanguageAdjustment(text: string): ToneAdjustment['parsed_intent'] {
    const lowerText = text.toLowerCase().trim();

    // Check for preset switches
    for (const [key, preset] of Object.entries(TONE_PRESETS)) {
      if (
        lowerText.includes(preset.name.toLowerCase()) ||
        lowerText.includes(`make it ${preset.name.toLowerCase()}`) ||
        lowerText.includes(`switch to ${preset.name.toLowerCase()}`)
      ) {
        return {
          attribute: 'tone_preset',
          direction: 'set',
          target_value: key as TonePreset,
        };
      }
    }

    // Humor adjustments
    if (
      lowerText.includes('funnier') ||
      lowerText.includes('more funny') ||
      lowerText.includes('more humor')
    ) {
      return {
        attribute: 'humor',
        direction: 'increase',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    if (
      lowerText.includes('less funny') ||
      lowerText.includes('less humor') ||
      lowerText.includes('more serious')
    ) {
      return {
        attribute: 'humor',
        direction: 'decrease',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    // Formality adjustments
    if (
      lowerText.includes('more professional') ||
      lowerText.includes('more formal') ||
      lowerText.includes('less casual')
    ) {
      return {
        attribute: 'formality',
        direction: 'increase',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    if (
      lowerText.includes('less professional') ||
      lowerText.includes('less formal') ||
      lowerText.includes('more casual')
    ) {
      return {
        attribute: 'formality',
        direction: 'decrease',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    // Enthusiasm adjustments
    if (
      lowerText.includes('more enthusiastic') ||
      lowerText.includes('more energetic') ||
      lowerText.includes('more excited')
    ) {
      return {
        attribute: 'enthusiasm',
        direction: 'increase',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    if (
      lowerText.includes('less enthusiastic') ||
      lowerText.includes('less energetic') ||
      lowerText.includes('more reserved')
    ) {
      return {
        attribute: 'enthusiasm',
        direction: 'decrease',
        magnitude: lowerText.includes('much') || lowerText.includes('way') ? 2 : 1,
      };
    }

    // Default: assume they want more casual
    return {
      attribute: 'formality',
      direction: 'decrease',
      magnitude: 1,
    };
  }

  /**
   * Adjust level within bounds
   */
  private static adjustLevel(
    current: number,
    direction: 'increase' | 'decrease' | 'set',
    magnitude: number,
    min: number,
    max: number
  ): any {
    if (direction === 'increase') {
      return Math.min(max, current + magnitude);
    } else if (direction === 'decrease') {
      return Math.max(min, current - magnitude);
    }
    return current;
  }

  /**
   * Get tone for AI injection
   */
  static async getToneForAI(userId: string): Promise<{
    preset?: TonePreset;
    custom_description?: string;
    formality: number;
    humor: number;
    enthusiasm: number;
    examples?: string[];
  } | null> {
    const pref = await this.getTonePreference(userId);
    if (!pref) {
      return null;
    }

    return {
      preset: pref.tone_preset,
      custom_description: pref.custom_description || undefined,
      formality: pref.formality_level,
      humor: pref.humor_level,
      enthusiasm: pref.enthusiasm_level,
      examples: pref.examples,
    };
  }

  /**
   * Get all tone presets
   */
  static getTonePresets(): TonePresetDefinition[] {
    return Object.values(TONE_PRESETS);
  }

  /**
   * Get recommended tone preset for business type
   */
  static getRecommendedPreset(businessType: string): TonePreset {
    for (const preset of Object.values(TONE_PRESETS)) {
      if (preset.best_for.includes(businessType)) {
        return preset.id;
      }
    }
    return 'casual'; // Default
  }

  /**
   * Helper: Map database row to TonePreference
   */
  private static mapRowToTonePreference(row: AITonePreferenceRow): TonePreference {
    return {
      id: row.id,
      user_id: row.user_id,
      tone_preset: row.tone_preset as TonePreset | undefined,
      custom_description: row.custom_description || undefined,
      formality_level: row.formality_level as 1 | 2 | 3 | 4 | 5,
      humor_level: row.humor_level as 0 | 1 | 2 | 3,
      enthusiasm_level: row.enthusiasm_level as 1 | 2 | 3 | 4 | 5,
      examples: row.examples || [],
      apply_to_all_content: row.apply_to_all_content,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
