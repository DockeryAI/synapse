/**
 * ============================================================================
 * DYNAMIC NAICS DISCOVERY - Auto-Learn New Industries
 * ============================================================================
 *
 * Automatically discovers and adds missing NAICS codes when encountered.
 * Uses AI to generate proper NAICS entries with keywords and descriptions.
 *
 * Flow:
 * 1. Industry detection encounters unknown business type
 * 2. System generates proper NAICS code via AI
 * 3. Saves to database for future use
 * 4. Returns enriched code immediately
 */

import { llmService } from '../llm/LLMService';
import type { NAICSCode } from '../../data/naics-codes';
import { NAICS_CODES, getNAICSCode } from '../../data/naics-codes';

interface DiscoveredNAICS extends NAICSCode {
  discoveredAt: string;
  sourceWebsite?: string;
}

// In-memory cache of discovered codes (loaded from localStorage on init)
let discoveredCodes: DiscoveredNAICS[] = [];
let isInitialized = false;

export class DynamicNAICSDiscovery {

  /**
   * Initialize by loading previously discovered codes from localStorage
   */
  async initialize(): Promise<void> {
    if (isInitialized) return;

    try {
      const stored = localStorage.getItem('discovered_naics_codes');
      if (stored) {
        discoveredCodes = JSON.parse(stored);
        console.log(`[NAICS Discovery] Loaded ${discoveredCodes.length} previously discovered codes`);
      }
      isInitialized = true;
    } catch (error) {
      console.error('[NAICS Discovery] Failed to load discovered codes:', error);
      discoveredCodes = [];
      isInitialized = true;
    }
  }

  /**
   * Check if a NAICS code exists (static or discovered)
   */
  hasCode(code: string): boolean {
    // Check static codes first
    if (getNAICSCode(code)) {
      return true;
    }

    // Check discovered codes
    return discoveredCodes.some(c => c.code === code);
  }

  /**
   * Get all available codes (static + discovered)
   */
  getAllCodes(): NAICSCode[] {
    return [...NAICS_CODES, ...discoveredCodes];
  }

  /**
   * Discover and add a new NAICS code when system encounters unknown industry
   */
  async discoverAndAddCode(
    businessContext: {
      description: string;
      services: string[];
      industry: string;
      websiteUrl?: string;
    }
  ): Promise<NAICSCode | null> {

    await this.initialize();

    console.log('[NAICS Discovery] Discovering NAICS code for:', businessContext.industry);

    try {
      // Use AI to determine proper NAICS classification
      const naicsEntry = await this.generateNAICSEntry(businessContext);

      if (!naicsEntry) {
        console.warn('[NAICS Discovery] Could not generate NAICS entry');
        return null;
      }

      // Check if we already have this code
      if (this.hasCode(naicsEntry.code)) {
        console.log('[NAICS Discovery] Code already exists:', naicsEntry.code);
        return naicsEntry;
      }

      // Add to discovered codes
      const discoveredEntry: DiscoveredNAICS = {
        ...naicsEntry,
        discoveredAt: new Date().toISOString(),
        sourceWebsite: businessContext.websiteUrl
      };

      discoveredCodes.push(discoveredEntry);

      // Persist to localStorage
      this.saveDiscoveredCodes();

      // Also save to database for team-wide learning
      await this.saveToDatabase(discoveredEntry);

      console.log(`[NAICS Discovery] ✅ Added new code: ${naicsEntry.code} - ${naicsEntry.title}`);

      return naicsEntry;

    } catch (error) {
      console.error('[NAICS Discovery] Failed to discover code:', error);
      return null;
    }
  }

  /**
   * Use AI to generate proper NAICS entry with all required fields
   */
  private async generateNAICSEntry(context: {
    description: string;
    services: string[];
    industry: string;
  }): Promise<NAICSCode | null> {

    const prompt = `You are a NAICS classification expert. Generate a proper NAICS code entry for this business.

BUSINESS CONTEXT:
Industry: ${context.industry}
Description: ${context.description}
Services: ${context.services.join(', ')}

TASK:
1. Determine the MOST SPECIFIC official NAICS code (6-digit level)
2. Identify the parent hierarchy (sector, subsector, industry group)
3. Generate appropriate keywords for detection

OFFICIAL NAICS SECTORS:
- 11: Agriculture, Forestry, Fishing
- 21: Mining, Quarrying, Oil and Gas
- 22: Utilities
- 23: Construction
- 31-33: Manufacturing
- 42: Wholesale Trade
- 44-45: Retail Trade
- 48-49: Transportation and Warehousing
- 51: Information
- 52: Finance and Insurance
- 53: Real Estate and Rental
- 54: Professional, Scientific, and Technical Services
- 55: Management of Companies
- 56: Administrative and Support Services
- 61: Educational Services
- 62: Health Care and Social Assistance
- 71: Arts, Entertainment, and Recreation
- 72: Accommodation and Food Services
- 81: Other Services

RETURN ONLY VALID JSON (no markdown):
{
  "code": "123456",
  "parentCode": "12345",
  "level": 6,
  "title": "Official NAICS Title",
  "description": "Clear description of what this industry includes",
  "isStandard": true,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hierarchy": {
    "sector": "XX",
    "sectorTitle": "Sector Name",
    "subsector": "XXX",
    "subsectorTitle": "Subsector Name",
    "industryGroup": "XXXX",
    "industryGroupTitle": "Industry Group Name"
  }
}

IMPORTANT:
- Use actual official NAICS codes (research real codes if needed)
- Keywords should be diverse (industry terms, common phrases, service types)
- Description should be specific enough to differentiate from similar industries
- All hierarchy levels must be valid NAICS codes`;

    const response = await llmService.call(prompt, {
      model: 'anthropic/claude-3-5-sonnet',
      temperature: 0.1, // Very low for accuracy
      maxTokens: 800
    });

    try {
      const result = JSON.parse(response.content);

      // Validate required fields
      if (!result.code || !result.title || !result.keywords) {
        console.error('[NAICS Discovery] Invalid AI response - missing required fields');
        return null;
      }

      // Return just the NAICSCode interface fields
      return {
        code: result.code,
        parentCode: result.parentCode || null,
        level: result.level || 6,
        title: result.title,
        description: result.description || result.title,
        isStandard: result.isStandard !== false, // Default to true
        keywords: result.keywords || []
      };

    } catch (error) {
      console.error('[NAICS Discovery] Failed to parse AI response:', error);
      console.error('Response content:', response.content);
      return null;
    }
  }

  /**
   * Save discovered codes to localStorage
   */
  private saveDiscoveredCodes(): void {
    try {
      localStorage.setItem('discovered_naics_codes', JSON.stringify(discoveredCodes));
      console.log(`[NAICS Discovery] Saved ${discoveredCodes.length} codes to localStorage`);
    } catch (error) {
      console.error('[NAICS Discovery] Failed to save to localStorage:', error);
    }
  }

  /**
   * Save to database for team-wide learning
   */
  private async saveToDatabase(entry: DiscoveredNAICS): Promise<void> {
    try {
      // TODO: Implement database storage when ready
      // For now, just localStorage is fine
      console.log('[NAICS Discovery] TODO: Save to database:', entry.code);
    } catch (error) {
      console.error('[NAICS Discovery] Failed to save to database:', error);
    }
  }

  /**
   * Get statistics about discovered codes
   */
  getStats(): {
    totalDiscovered: number;
    recentDiscoveries: DiscoveredNAICS[];
    sectors: { [key: string]: number };
  } {
    const sectors: { [key: string]: number } = {};

    discoveredCodes.forEach(code => {
      const sector = code.code.substring(0, 2);
      sectors[sector] = (sectors[sector] || 0) + 1;
    });

    return {
      totalDiscovered: discoveredCodes.length,
      recentDiscoveries: discoveredCodes.slice(-10),
      sectors
    };
  }

  /**
   * Clear all discovered codes (for testing/reset)
   */
  clearDiscovered(): void {
    discoveredCodes = [];
    localStorage.removeItem('discovered_naics_codes');
    console.log('[NAICS Discovery] Cleared all discovered codes');
  }
}

// Export singleton
export const dynamicNAICSDiscovery = new DynamicNAICSDiscovery();
