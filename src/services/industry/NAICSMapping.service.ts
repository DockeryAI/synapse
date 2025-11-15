/**
 * NAICS MAPPING SERVICE
 *
 * Stores and retrieves user input → NAICS code mappings
 * Enables fuzzy matching to improve over time
 *
 * Features:
 * - Save user input mappings to database
 * - Track usage count for better matching
 * - Query mappings for fuzzy matching
 * - Auto-cleanup of low-confidence mappings
 */

import { supabase } from '@/lib/supabase';
import { type NAICSMapping } from '@/types/industry-profile.types';

export class NAICSMappingService {
  /**
   * Save a new mapping from user input to NAICS code
   */
  static async saveMapping(
    userInput: string,
    naicsCode: string,
    displayName: string,
    confidence: number
  ): Promise<void> {
    console.log(`[NAICSMapping] Saving mapping: "${userInput}" → ${naicsCode}`);

    try {
      // Check if mapping already exists
      const { data: existing } = await supabase
        .from('naics_mappings')
        .select('*')
        .eq('user_input', userInput.toLowerCase().trim())
        .eq('naics_code', naicsCode)
        .single();

      if (existing) {
        // Update usage count
        const { error } = await supabase
          .from('naics_mappings')
          .update({ usage_count: (existing.usage_count || 0) + 1 })
          .eq('user_input', userInput.toLowerCase().trim())
          .eq('naics_code', naicsCode);

        if (error) {
          console.error('[NAICSMapping] Failed to update usage count:', error);
        } else {
          console.log('[NAICSMapping] Updated usage count for existing mapping');
        }

        return;
      }

      // Create new mapping
      const { error } = await supabase
        .from('naics_mappings')
        .insert({
          user_input: userInput.toLowerCase().trim(),
          naics_code: naicsCode,
          display_name: displayName,
          confidence,
          created_at: new Date().toISOString(),
          usage_count: 1
        });

      if (error) {
        console.error('[NAICSMapping] Failed to save mapping:', error);
        throw error;
      }

      console.log('[NAICSMapping] Mapping saved successfully');

    } catch (error) {
      console.error('[NAICSMapping] Error saving mapping:', error);
      // Don't throw - mapping is not critical
    }
  }

  /**
   * Find mapping for user input
   */
  static async findMapping(userInput: string): Promise<NAICSMapping | null> {
    try {
      const { data, error } = await supabase
        .from('naics_mappings')
        .select('*')
        .eq('user_input', userInput.toLowerCase().trim())
        .order('usage_count', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data as NAICSMapping;

    } catch (error) {
      console.error('[NAICSMapping] Error finding mapping:', error);
      return null;
    }
  }

  /**
   * Find similar mappings using fuzzy matching
   */
  static async findSimilarMappings(userInput: string, limit: number = 5): Promise<NAICSMapping[]> {
    try {
      const input = userInput.toLowerCase().trim();

      // Get all mappings (this is not ideal for scale, but works for MVP)
      const { data, error } = await supabase
        .from('naics_mappings')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error || !data) {
        return [];
      }

      // Calculate similarity scores
      const scored = data.map(mapping => {
        const similarity = this.calculateSimilarity(input, mapping.user_input);
        return { mapping, similarity };
      });

      // Return top matches
      return scored
        .filter(s => s.similarity > 0.5) // Minimum threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(s => s.mapping as NAICSMapping);

    } catch (error) {
      console.error('[NAICSMapping] Error finding similar mappings:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two strings (Levenshtein-like)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1.0;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return commonWords / totalWords;
  }

  /**
   * Get most popular mappings (for analytics)
   */
  static async getPopularMappings(limit: number = 10): Promise<NAICSMapping[]> {
    try {
      const { data, error } = await supabase
        .from('naics_mappings')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data as NAICSMapping[];

    } catch (error) {
      console.error('[NAICSMapping] Error getting popular mappings:', error);
      return [];
    }
  }

  /**
   * Clean up low-confidence, low-usage mappings
   */
  static async cleanup(
    minConfidence: number = 0.5,
    minUsageCount: number = 2
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('naics_mappings')
        .delete()
        .lt('confidence', minConfidence)
        .lt('usage_count', minUsageCount)
        .select();

      if (error) {
        console.error('[NAICSMapping] Cleanup error:', error);
        return 0;
      }

      const deleted = data?.length || 0;
      console.log(`[NAICSMapping] Cleaned up ${deleted} low-quality mappings`);

      return deleted;

    } catch (error) {
      console.error('[NAICSMapping] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get mapping statistics
   */
  static async getStats(): Promise<{
    total: number;
    highConfidence: number;
    mostUsed: NAICSMapping | null;
  }> {
    try {
      // Total count
      const { count: total } = await supabase
        .from('naics_mappings')
        .select('*', { count: 'exact', head: true });

      // High confidence count (>0.8)
      const { count: highConfidence } = await supabase
        .from('naics_mappings')
        .select('*', { count: 'exact', head: true })
        .gt('confidence', 0.8);

      // Most used
      const { data: mostUsedData } = await supabase
        .from('naics_mappings')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(1)
        .single();

      return {
        total: total || 0,
        highConfidence: highConfidence || 0,
        mostUsed: mostUsedData as NAICSMapping | null
      };

    } catch (error) {
      console.error('[NAICSMapping] Error getting stats:', error);
      return { total: 0, highConfidence: 0, mostUsed: null };
    }
  }
}
