/**
 * INDUSTRY MATCHING SERVICE
 *
 * Handles fuzzy matching for free-form industry input
 * Falls back to Opus 4.1 for NAICS detection if no match found
 */

import { COMPLETE_NAICS_CODES, type NAICSOption } from '@/data/complete-naics-codes';

export interface MatchResult {
  type: 'exact' | 'fuzzy' | 'none';
  match?: NAICSOption;
  confidence: number;
  alternatives?: NAICSOption[];
}

export class IndustryMatchingService {
  /**
   * Fuzzy match free-form industry text against our database
   */
  static findMatch(freeformText: string): MatchResult {
    const cleaned = freeformText.toLowerCase().trim();

    // 1. Exact display name match
    const exactMatch = COMPLETE_NAICS_CODES.find(
      ind => ind.display_name.toLowerCase() === cleaned
    );

    if (exactMatch) {
      return {
        type: 'exact',
        match: exactMatch,
        confidence: 1.0
      };
    }

    // 2. Keyword match
    const keywordMatches = COMPLETE_NAICS_CODES.filter(ind =>
      ind.keywords.some(kw =>
        cleaned.includes(kw.toLowerCase()) ||
        kw.toLowerCase().includes(cleaned)
      )
    ).slice(0, 5);

    if (keywordMatches.length > 0) {
      // Calculate fuzzy confidence based on keyword overlap
      const scored = keywordMatches.map(match => {
        const matchingKeywords = match.keywords.filter(kw =>
          cleaned.includes(kw.toLowerCase()) || kw.toLowerCase().includes(cleaned)
        );
        const confidence = matchingKeywords.length / match.keywords.length;
        return { match, confidence };
      });

      // Sort by confidence
      scored.sort((a, b) => b.confidence - a.confidence);

      return {
        type: 'fuzzy',
        match: scored[0].match,
        confidence: scored[0].confidence,
        alternatives: scored.slice(1, 4).map(s => s.match)
      };
    }

    // 3. Partial text match in display name
    const partialMatches = COMPLETE_NAICS_CODES.filter(ind =>
      ind.display_name.toLowerCase().includes(cleaned) ||
      cleaned.includes(ind.display_name.toLowerCase())
    ).slice(0, 5);

    if (partialMatches.length > 0) {
      return {
        type: 'fuzzy',
        match: partialMatches[0],
        confidence: 0.6,
        alternatives: partialMatches.slice(1, 4)
      };
    }

    // No match found
    return {
      type: 'none',
      confidence: 0,
      alternatives: []
    };
  }

  /**
   * Search industries by text (for dropdown)
   */
  static searchIndustries(searchTerm: string, limit: number = 30): NAICSOption[] {
    if (!searchTerm || searchTerm.length < 2) {
      // Return top industries by popularity
      return COMPLETE_NAICS_CODES
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit);
    }

    const cleaned = searchTerm.toLowerCase();

    // Search in display name and keywords
    const matches = COMPLETE_NAICS_CODES.filter(ind =>
      ind.display_name.toLowerCase().includes(cleaned) ||
      ind.keywords.some(kw => kw.toLowerCase().includes(cleaned))
    );

    // Sort by relevance
    return matches
      .sort((a, b) => {
        // Exact match in display name gets highest priority
        const aExact = a.display_name.toLowerCase() === cleaned ? 10 : 0;
        const bExact = b.display_name.toLowerCase() === cleaned ? 10 : 0;

        // Starts with gets second priority
        const aStarts = a.display_name.toLowerCase().startsWith(cleaned) ? 5 : 0;
        const bStarts = b.display_name.toLowerCase().startsWith(cleaned) ? 5 : 0;

        // Keyword match gets third priority
        const aKeyword = a.keywords.some(kw => kw.toLowerCase() === cleaned) ? 3 : 0;
        const bKeyword = b.keywords.some(kw => kw.toLowerCase() === cleaned) ? 3 : 0;

        // Then by popularity
        const aPopularity = a.popularity || 0;
        const bPopularity = b.popularity || 0;

        return (bExact + bStarts + bKeyword + bPopularity) -
               (aExact + aStarts + aKeyword + aPopularity);
      })
      .slice(0, limit);
  }

  /**
   * Get industry by NAICS code
   */
  static getByCode(naicsCode: string): NAICSOption | undefined {
    return COMPLETE_NAICS_CODES.find(ind => ind.naics_code === naicsCode);
  }

  /**
   * Check if we have full profile for this industry
   */
  static hasFullProfile(industry: NAICSOption): boolean {
    return industry.has_full_profile === true;
  }
}
