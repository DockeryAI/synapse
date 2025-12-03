/**
 * Competitor Intelligence Service
 *
 * Core service for Gap Tab 2.0 - handles competitor discovery, scanning,
 * and gap extraction with streaming updates.
 *
 * Features:
 * - Competitor discovery via Perplexity
 * - Website scanning via Apify
 * - Review aggregation (segment-aware)
 * - Ad library integration (Meta/LinkedIn)
 * - Gap extraction via Opus 4.5
 * - Streaming progress updates
 *
 * Created: 2025-11-28
 */

import { EventEmitter } from 'events';
import { supabase } from '@/utils/supabase/client';
import { reviewSourceRouter, type ReviewFetchResult } from './review-source-router.service';
import { adLibrary, type AdFetchResult } from './ad-library.service';
import { llmCompetitorAnalyzer, type LLMAnalysisRequest } from './llm-competitor-analyzer.service';
import {
  GAP_CONFIDENCE_THRESHOLD,
  GAP_HIGH_CONFIDENCE_THRESHOLD,
  MAX_CONCURRENT_SCANS
} from '@/config/gap-tab-cache.config';
import type {
  CompetitorProfile,
  CompetitorScan,
  CompetitorGap,
  CompetitorAlert,
  CompetitorAd,
  DiscoveredCompetitor,
  CompetitorDiscoveryRequest,
  CompetitorScanRequest,
  GapExtractionRequest,
  ExtractedGap,
  ScanType,
  SegmentType,
  BusinessType,
  GapType,
  GapSource,
  CompetitorScanEvent,
  CompetitorScanEventType,
  SourceQuote,
  EnhancedCompetitorDiscoveryRequest,
  EnhancedCompetitorIdentificationRequest
} from '@/types/competitor-intelligence.types';

import {
  SCAN_TTL,
  SEGMENT_REVIEW_SOURCES,
  BUSINESS_TYPE_AD_PLATFORMS,
  COMPETITOR_DISCOVERY_PROMPT,
  COMPETITOR_WEAKNESS_PROMPT,
  GAP_EXTRACTION_PROMPT,
  ENHANCED_COMPETITOR_DISCOVERY_PROMPT,
  ENHANCED_COMPETITOR_IDENTIFICATION_PROMPT,
  CATEGORY_DISCOVERY_CRITERIA,
  getSegmentCategoryKey
} from '@/types/competitor-intelligence.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_COMPETITORS = 10;
const SCAN_TIMEOUT = 30000; // 30 seconds
// Note: MAX_CONCURRENT_SCANS now imported from gap-tab-cache.config.ts

// ============================================================================
// JSON SANITIZER - Handles malformed LLM responses
// ============================================================================

/**
 * Safely parse JSON from LLM responses that may contain:
 * - Markdown code blocks
 * - Citation markers [1], [2]
 * - Trailing text after JSON
 * - Truncated responses
 */
function safeParseJSON<T = any>(content: string, fallback: T): T {
  if (!content || typeof content !== 'string') {
    return fallback;
  }

  // Step 1: Remove markdown code blocks
  let cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Step 2: Extract JSON array or object
  const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) {
    console.warn('[JSON Sanitizer] No JSON structure found in response');
    return fallback;
  }

  let jsonStr = jsonMatch[1];

  // Step 3: Remove citation markers like [1], [2] that break JSON
  jsonStr = jsonStr.replace(/\[\d+\]/g, '');

  // Step 4: Fix common JSON issues
  jsonStr = jsonStr
    // Fix trailing commas before closing brackets
    .replace(/,\s*([}\]])/g, '$1')
    // Fix unquoted keys (simple cases)
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes (careful with apostrophes)
    .replace(/'([^']*)'(\s*[,}\]])/g, '"$1"$2');

  // Step 5: Attempt to repair truncated JSON
  const openBrackets = (jsonStr.match(/\[/g) || []).length;
  const closeBrackets = (jsonStr.match(/\]/g) || []).length;
  const openBraces = (jsonStr.match(/\{/g) || []).length;
  const closeBraces = (jsonStr.match(/\}/g) || []).length;

  // Add missing closing brackets/braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    jsonStr += '}';
  }
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    jsonStr += ']';
  }

  // Step 6: Try to parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[JSON Sanitizer] Parse failed after sanitization:', (e as Error).message);

    // Step 7: Last resort - try to extract valid JSON objects from the string
    try {
      const objects: any[] = [];
      const objectRegex = /\{[^{}]*\}/g;
      let match;
      while ((match = objectRegex.exec(jsonStr)) !== null) {
        try {
          objects.push(JSON.parse(match[0]));
        } catch {
          // Skip invalid objects
        }
      }
      if (objects.length > 0) {
        console.log('[JSON Sanitizer] Recovered', objects.length, 'objects via fallback extraction');
        return objects as T;
      }
    } catch {
      // Final fallback
    }

    return fallback;
  }
}

// ============================================================================
// URL TO PLATFORM NAME EXTRACTION
// ============================================================================

/**
 * Extract a recognizable platform name from a URL
 * e.g., https://www.g2.com/products/... -> "G2"
 */
function extractPlatformFromUrl(url: string): string | null {
  if (!url) return null;

  const urlLower = url.toLowerCase();

  // Map of URL patterns to platform names
  const platformPatterns: [RegExp | string, string][] = [
    [/g2\.com/i, 'G2'],
    [/capterra\.com/i, 'Capterra'],
    [/trustradius\.com/i, 'TrustRadius'],
    [/trustpilot\.com/i, 'TrustPilot'],
    [/reddit\.com/i, 'Reddit'],
    [/yelp\.com/i, 'Yelp'],
    [/google\.com\/maps|maps\.google/i, 'Google Reviews'],
    [/linkedin\.com/i, 'LinkedIn'],
    [/twitter\.com|x\.com/i, 'Twitter'],
    [/news\.ycombinator\.com|hn\./i, 'Hacker News'],
    [/quora\.com/i, 'Quora'],
    [/producthunt\.com/i, 'Product Hunt'],
    [/softwareadvice\.com/i, 'Software Advice'],
    [/getapp\.com/i, 'GetApp'],
    [/glassdoor\.com/i, 'Glassdoor'],
    [/forbes\.com/i, 'Forbes'],
    [/techcrunch\.com/i, 'TechCrunch'],
    [/gartner\.com/i, 'Gartner'],
    [/forrester\.com/i, 'Forrester'],
  ];

  for (const [pattern, name] of platformPatterns) {
    if (typeof pattern === 'string') {
      if (urlLower.includes(pattern)) return name;
    } else {
      if (pattern.test(url)) return name;
    }
  }

  return null;
}

// ============================================================================
// SEGMENT DETECTION
// ============================================================================

interface SegmentDetectionResult {
  segment_type: SegmentType;
  business_type: BusinessType;
  confidence: number;
  reasoning: string;
}

/**
 * Detect business segment from industry and other signals
 */
function detectSegment(
  industry: string,
  website_url?: string,
  location?: string,
  business_description?: string
): SegmentDetectionResult {
  const industryLower = industry.toLowerCase();
  const descLower = (business_description || '').toLowerCase();

  // Local service indicators
  const localIndicators = [
    'plumber', 'electrician', 'hvac', 'landscaping', 'cleaning',
    'restaurant', 'salon', 'barbershop', 'dentist', 'chiropractor',
    'auto repair', 'mechanic', 'florist', 'bakery', 'cafe',
    'gym', 'fitness', 'yoga', 'spa', 'massage'
  ];

  // B2B indicators
  const b2bIndicators = [
    'saas', 'software', 'enterprise', 'b2b', 'consulting',
    'agency', 'marketing', 'legal', 'accounting', 'hr',
    'cloud', 'platform', 'api', 'integration', 'erp', 'crm'
  ];

  // DTC indicators
  const dtcIndicators = [
    'ecommerce', 'e-commerce', 'retail', 'fashion', 'apparel',
    'beauty', 'skincare', 'supplements', 'food', 'beverage',
    'home goods', 'furniture', 'decor', 'subscription box'
  ];

  // Check for local business
  const isLocal = localIndicators.some(ind =>
    industryLower.includes(ind) || descLower.includes(ind)
  );

  // Check for B2B
  const isB2B = b2bIndicators.some(ind =>
    industryLower.includes(ind) || descLower.includes(ind)
  );

  // Check for DTC
  const isDTC = dtcIndicators.some(ind =>
    industryLower.includes(ind) || descLower.includes(ind)
  );

  // Determine segment type
  let segment_type: SegmentType = 'national';
  let business_type: BusinessType = 'mixed';
  let confidence = 0.6;
  let reasoning = 'Default classification based on industry analysis';

  if (isLocal) {
    segment_type = location ? 'local' : 'regional';
    business_type = isB2B ? 'b2b' : 'b2c';
    confidence = 0.8;
    reasoning = `Detected local service business in ${industry}`;
  } else if (isB2B) {
    segment_type = 'national';
    business_type = 'b2b';
    confidence = 0.85;
    reasoning = `Detected B2B business in ${industry}`;

    // Check for global indicators
    if (descLower.includes('global') || descLower.includes('international') ||
        descLower.includes('enterprise')) {
      segment_type = 'global';
      reasoning = `Detected global B2B enterprise in ${industry}`;
    }
  } else if (isDTC) {
    segment_type = 'national';
    business_type = 'dtc';
    confidence = 0.8;
    reasoning = `Detected DTC/e-commerce business in ${industry}`;
  }

  return { segment_type, business_type, confidence, reasoning };
}

// ============================================================================
// COMPETITOR INTELLIGENCE SERVICE
// ============================================================================

class CompetitorIntelligenceService extends EventEmitter {
  private activeScans: Map<string, AbortController> = new Map();

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  // ==========================================================================
  // EVENT EMISSION
  // ==========================================================================

  private emitScanEvent(event: CompetitorScanEvent): void {
    this.emit('scan-event', event);
    console.log('[CompetitorIntelligence]', event.type, event.status, event.competitor_name || '');
  }

  // ==========================================================================
  // COMPETITOR DISCOVERY
  // ==========================================================================

  /**
   * Discover competitors for a brand using Perplexity
   * Enhanced: Accepts full brand context for more accurate results
   */
  async discoverCompetitors(request: CompetitorDiscoveryRequest | EnhancedCompetitorDiscoveryRequest): Promise<DiscoveredCompetitor[]> {
    this.emitScanEvent({
      type: 'competitor-discovery',
      status: 'started'
    });

    try {
      // Detect segment if not provided
      const segment = request.segment_type && request.business_type
        ? { segment_type: request.segment_type, business_type: request.business_type }
        : detectSegment(request.industry, request.website_url, request.location);

      // Check if we have enhanced context
      const enhancedRequest = request as EnhancedCompetitorDiscoveryRequest;
      const hasEnhancedContext = !!(
        enhancedRequest.unique_solution ||
        enhancedRequest.key_benefit ||
        enhancedRequest.existing_competitor_names?.length
      );

      // Get category-specific criteria
      const categoryKey = getSegmentCategoryKey(segment.segment_type, segment.business_type);
      const categoryCriteria = CATEGORY_DISCOVERY_CRITERIA[categoryKey];

      // Format existing competitors list for the prompt
      const existingCompetitorsList = enhancedRequest.existing_competitor_names?.length
        ? enhancedRequest.existing_competitor_names.map(n => `- ${n}`).join('\n')
        : 'None yet - this is the initial discovery';

      // Build the discovery prompt - use enhanced if we have context
      let prompt: string;

      if (hasEnhancedContext) {
        console.log('[CompetitorIntelligence] Using ENHANCED discovery prompt with full context');
        prompt = ENHANCED_COMPETITOR_DISCOVERY_PROMPT
          .replace('{brand_name}', request.brand_name)
          .replace('{industry}', request.industry)
          .replace('{brand_website}', enhancedRequest.brand_website || request.website_url || 'Not provided')
          .replace('{location}', request.location || 'Not specified')
          .replace('{unique_solution}', enhancedRequest.unique_solution || 'Not specified')
          .replace('{key_benefit}', enhancedRequest.key_benefit || 'Not specified')
          .replace('{target_customer}', enhancedRequest.target_customer || 'Not specified')
          .replace('{brand_description}', enhancedRequest.brand_description || 'Not provided')
          .replace('{segment_type}', segment.segment_type)
          .replace('{business_type}', segment.business_type)
          .replace('{category_criteria}', categoryCriteria)
          .replace('{existing_competitors}', existingCompetitorsList)
          .replace(/\{brand_name\}/g, request.brand_name); // Replace any remaining occurrences
      } else {
        console.log('[CompetitorIntelligence] Using basic discovery prompt (no enhanced context)');
        prompt = COMPETITOR_DISCOVERY_PROMPT
          .replace('{brand_name}', request.brand_name)
          .replace('{industry}', request.industry)
          .replace('{website_url}', request.website_url || 'Not provided')
          .replace('{location}', request.location || 'Not specified')
          .replace('{business_type}', segment.business_type)
          .replace('{segment_type}', segment.segment_type);
      }

      console.log('[CompetitorIntelligence] Discovery context:', {
        brand: request.brand_name,
        industry: request.industry,
        segment: segment.segment_type,
        businessType: segment.business_type,
        hasUVP: !!enhancedRequest.unique_solution,
        existingCompetitors: enhancedRequest.existing_competitor_names?.length || 0
      });

      // Call Perplexity via ai-proxy
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst specializing in market positioning. Respond only with valid JSON arrays. Focus on direct competitors that would realistically compete for the same customers.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse competitors from response using safe parser
      const parsed = safeParseJSON<DiscoveredCompetitor[]>(content, []);
      let competitors = Array.isArray(parsed) ? parsed : [];

      // Filter out existing competitors and limit to MAX_COMPETITORS
      const existingNames = new Set(
        (request.existing_competitors || []).map(n => this.normalizeCompetitorName(n))
      );
      // Also exclude names from the enhanced request
      if (enhancedRequest.existing_competitor_names) {
        enhancedRequest.existing_competitor_names.forEach(n =>
          existingNames.add(this.normalizeCompetitorName(n))
        );
      }

      competitors = competitors
        .filter(c => !existingNames.has(this.normalizeCompetitorName(c.name)))
        .slice(0, MAX_COMPETITORS)
        .map(c => ({
          ...c,
          segment_type: segment.segment_type,
          business_type: segment.business_type
        }));

      console.log('[CompetitorIntelligence] Discovery found', competitors.length, 'new competitors');

      this.emitScanEvent({
        type: 'competitor-discovery',
        status: 'completed',
        data: competitors
      });

      return competitors;

    } catch (error) {
      this.emitScanEvent({
        type: 'competitor-discovery',
        status: 'error',
        error: error instanceof Error ? error.message : 'Discovery failed'
      });
      throw error;
    }
  }

  /**
   * Save discovered competitors to database
   */
  async saveCompetitors(
    brand_id: string,
    competitors: DiscoveredCompetitor[]
  ): Promise<CompetitorProfile[]> {
    const profiles: CompetitorProfile[] = [];

    for (const competitor of competitors) {
      const { data, error } = await supabase
        .from('competitor_profiles')
        .upsert({
          brand_id,
          name: competitor.name,
          website: competitor.website,
          is_verified: false,
          discovery_source: 'perplexity',
          confidence_score: competitor.confidence,
          segment_type: competitor.segment_type,
          business_type: competitor.business_type,
          is_active: true,
          metadata: { discovery_reason: competitor.reason }
        }, {
          onConflict: 'brand_id,name'
        })
        .select()
        .single();

      if (data && !error) {
        profiles.push(data as unknown as CompetitorProfile);
      }
    }

    return profiles;
  }

  // ==========================================================================
  // COMPETITOR IDENTIFICATION (for manual add flow)
  // ==========================================================================

  /**
   * Identify a competitor by name/website using AI
   * Enhanced: Accepts full brand context for more accurate identification
   * Returns enriched competitor info for user confirmation before saving
   */
  async identifyCompetitor(request: {
    name: string;
    website?: string;
    brand_industry: string;
    brand_name: string;
  } | EnhancedCompetitorIdentificationRequest): Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }> {
    console.log('[CompetitorIntelligence] Identifying competitor:', request.name);

    try {
      // Check if we have enhanced context
      const enhancedRequest = request as EnhancedCompetitorIdentificationRequest;
      const hasEnhancedContext = !!(
        enhancedRequest.unique_solution ||
        enhancedRequest.key_benefit ||
        enhancedRequest.existing_competitor_names?.length
      );

      // Format existing competitors list
      const existingCompetitorsList = enhancedRequest.existing_competitor_names?.length
        ? enhancedRequest.existing_competitor_names.map(n => `- ${n}`).join('\n')
        : 'None specified';

      let prompt: string;

      if (hasEnhancedContext) {
        console.log('[CompetitorIntelligence] Using ENHANCED identification prompt with full context');

        // Get segment category for context
        const segmentType = enhancedRequest.segment_type || 'national';
        const businessType = enhancedRequest.business_type || 'b2b';

        prompt = ENHANCED_COMPETITOR_IDENTIFICATION_PROMPT
          .replace('{search_name}', request.name)
          .replace('{search_website}', request.website || '(No website provided - search for the company)')
          .replace('{brand_name}', request.brand_name)
          .replace('{industry}', request.brand_industry)
          .replace('{unique_solution}', enhancedRequest.unique_solution || 'Not specified')
          .replace('{key_benefit}', enhancedRequest.key_benefit || 'Not specified')
          .replace('{target_customer}', enhancedRequest.target_customer || 'Not specified')
          .replace('{segment_type}', segmentType)
          .replace('{business_type}', businessType)
          .replace('{existing_competitors}', existingCompetitorsList)
          .replace(/\{search_name\}/g, request.name)
          .replace(/\{brand_name\}/g, request.brand_name);
      } else {
        console.log('[CompetitorIntelligence] Using basic identification prompt (no enhanced context)');

        prompt = `Identify and verify this company as a potential competitor:

Company to identify: ${request.name}
${request.website ? `Website hint: ${request.website}` : '(No website provided - search for the company)'}
Industry context: ${request.brand_industry}
We are analyzing competitors for: ${request.brand_name}

IMPORTANT: Even if only a company name is provided (no website), search your knowledge to identify the company. Many companies are well-known by just their name (e.g., "Kore" is Kore.ai, "Intercom" is intercom.com).

Return this exact JSON structure:
{
  "found": true,
  "competitor": {
    "name": "Official company name",
    "website": "https://their-website.com",
    "description": "What they do in 1-2 sentences",
    "reason": "Why they compete in this industry",
    "confidence": 0.85
  },
  "alternatives": []
}

If the company truly cannot be identified:
{
  "found": false,
  "competitor": null,
  "error": "Could not find a company matching this name"
}

You MUST include the "competitor" field in your response. Respond with valid JSON only.`;
      }

      console.log('[CompetitorIntelligence] Identification context:', {
        searchName: request.name,
        brand: request.brand_name,
        industry: request.brand_industry,
        hasUVP: !!enhancedRequest.unique_solution,
        existingCompetitors: enhancedRequest.existing_competitor_names?.length || 0
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst specializing in market positioning. Verify companies and assess if they are true competitors based on market positioning, target customers, and product offerings. You must always include the "competitor" field in your JSON response when found=true. Respond only with valid JSON.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      console.log('[CompetitorIntelligence] Raw AI response:', content.substring(0, 500));

      // Parse the response
      const result = safeParseJSON<{
        found: boolean;
        competitor?: DiscoveredCompetitor;
        alternatives?: DiscoveredCompetitor[];
        error?: string;
      }>(content, { found: false, error: 'Failed to parse response' });

      console.log('[CompetitorIntelligence] Parsed result:', {
        found: result.found,
        hasCompetitor: !!result.competitor,
        competitorName: result.competitor?.name,
        error: result.error
      });

      // If found=true but competitor is missing, try to construct it from the response
      if (result.found && !result.competitor) {
        console.warn('[CompetitorIntelligence] AI returned found=true but no competitor object, constructing fallback');

        // Try to extract from the raw response if there's any company info
        const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
        const websiteMatch = content.match(/"website"\s*:\s*"([^"]+)"/);
        const descMatch = content.match(/"description"\s*:\s*"([^"]+)"/);

        if (nameMatch) {
          result.competitor = {
            name: nameMatch[1],
            website: websiteMatch?.[1] || '',
            description: descMatch?.[1] || `Competitor in ${request.brand_industry}`,
            reason: `Identified as competitor to ${request.brand_name}`,
            confidence: 0.7
          };
          console.log('[CompetitorIntelligence] Constructed fallback competitor:', result.competitor.name);
        } else {
          // Last resort: use the original search name
          result.competitor = {
            name: request.name,
            website: request.website || '',
            description: `Company in ${request.brand_industry}`,
            reason: `Manually added as competitor`,
            confidence: 0.5
          };
          console.log('[CompetitorIntelligence] Using search name as fallback:', request.name);
        }
      }

      console.log('[CompetitorIntelligence] Identification result:', result.found ? 'Found' : 'Not found', result.competitor?.name || '');

      return {
        found: result.found,
        competitor: result.competitor || null,
        alternatives: result.alternatives,
        error: result.error
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] Identification failed:', error);
      return {
        found: false,
        competitor: null,
        error: error instanceof Error ? error.message : 'Identification failed'
      };
    }
  }

  /**
   * Add a single competitor, scan it, and extract gaps
   * Used after user confirms the identified competitor
   */
  async addAndScanCompetitor(
    brand_id: string,
    competitor: DiscoveredCompetitor,
    deepContext: DeepContext,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{
    profile: CompetitorProfile;
    gaps: CompetitorGap[];
  }> {
    console.log('[CompetitorIntelligence] Adding and scanning competitor:', competitor.name);

    // Stage 1: Save competitor to DB
    onProgress?.('Saving competitor...', 10);
    const [savedProfile] = await this.saveCompetitors(brand_id, [competitor]);

    if (!savedProfile) {
      throw new Error('Failed to save competitor');
    }

    // Stage 2: Scan the competitor
    onProgress?.('Scanning competitor...', 30);
    const scans = await this.scanCompetitor(savedProfile, true, (scanProgress) => {
      // Map scan progress 0-100 to overall progress 30-70
      onProgress?.('Scanning competitor...', 30 + (scanProgress * 0.4));
    });

    // Stage 3: Extract gaps
    onProgress?.('Extracting insights...', 75);

    const uvpData = deepContext.business?.uvp ? {
      unique_solution: deepContext.business.uvp.uniqueSolution || '',
      key_benefit: deepContext.business.uvp.keyBenefit || '',
      differentiation: deepContext.business.uvp.uniqueSolution || ''
    } : undefined;

    const extractedGaps = await this.extractGaps({
      brand_id,
      competitor_id: savedProfile.id,
      competitor_name: savedProfile.name,
      scan_data: {
        website: scans.find(s => s.scan_type === 'website'),
        reviews: scans.filter(s => s.scan_type.startsWith('reviews-')),
        perplexity: scans.find(s => s.scan_type === 'perplexity-research'),
        llm_analysis: scans.find(s => s.scan_type === 'llm-analysis')
      },
      uvp_data: uvpData
    });

    // Stage 4: Save gaps
    onProgress?.('Saving insights...', 90);
    const savedGaps = await this.saveGaps(
      brand_id,
      savedProfile.id,
      savedProfile.name,
      extractedGaps,
      scans.map(s => s.id)
    );

    onProgress?.('Complete!', 100);

    console.log('[CompetitorIntelligence] Added competitor with', savedGaps.length, 'gaps');

    return {
      profile: savedProfile,
      gaps: savedGaps
    };
  }

  // ==========================================================================
  // COMPETITOR SCANNING
  // ==========================================================================

  /**
   * Get appropriate scan types for a segment
   * Always includes llm-analysis as a reliable fallback data source
   */
  getScanTypesForSegment(
    segment_type: SegmentType,
    business_type: BusinessType
  ): ScanType[] {
    // Core scan types - llm-analysis always included as reliable fallback
    const scanTypes: ScanType[] = ['website', 'perplexity-research', 'llm-analysis'];

    // Add review sources based on segment
    const reviewSources = SEGMENT_REVIEW_SOURCES[segment_type] || [];
    scanTypes.push(...reviewSources);

    // Add ad platforms based on business type
    const adPlatforms = BUSINESS_TYPE_AD_PLATFORMS[business_type] || [];
    adPlatforms.forEach(platform => {
      if (platform === 'meta') scanTypes.push('ads-meta');
      if (platform === 'linkedin') scanTypes.push('ads-linkedin');
    });

    return scanTypes;
  }

  /**
   * Scan a single competitor with all appropriate scan types
   * OPTIMIZED: Runs all scan types in PARALLEL using Promise.allSettled
   */
  async scanCompetitor(
    competitor: CompetitorProfile,
    force_refresh = false,
    onProgress?: (progress: number) => void
  ): Promise<CompetitorScan[]> {
    const scanTypes = this.getScanTypesForSegment(
      competitor.segment_type || 'national',
      competitor.business_type || 'mixed'
    );

    const total = scanTypes.length;
    let completed = 0;

    // Helper to track progress
    const trackProgress = () => {
      completed++;
      onProgress?.(completed / total);
    };

    // Run a single scan type (for parallel execution)
    const runScanType = async (scanType: ScanType): Promise<CompetitorScan | null> => {
      try {
        // Check if we have a fresh scan (cache hit)
        if (!force_refresh) {
          const existingScan = await this.getLatestScan(competitor.id, scanType);
          if (existingScan && !existingScan.is_stale) {
            trackProgress();
            return existingScan;
          }
        }

        // Emit start event
        this.emitScanEvent({
          type: this.scanTypeToEventType(scanType),
          competitor_id: competitor.id,
          competitor_name: competitor.name,
          status: 'started'
        });

        // Perform the scan
        const scan = await this.performScan(competitor, scanType);

        // Emit completion event
        this.emitScanEvent({
          type: this.scanTypeToEventType(scanType),
          competitor_id: competitor.id,
          competitor_name: competitor.name,
          status: 'completed',
          data: scan
        });

        trackProgress();
        return scan;

      } catch (error) {
        this.emitScanEvent({
          type: this.scanTypeToEventType(scanType),
          competitor_id: competitor.id,
          competitor_name: competitor.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Scan failed'
        });
        trackProgress();
        return null;
      }
    };

    // PARALLEL EXECUTION: Run all scan types simultaneously
    console.log(`[CompetitorIntelligence] Starting PARALLEL scan of ${scanTypes.length} types for ${competitor.name}`);
    const startTime = performance.now();

    const results = await Promise.allSettled(
      scanTypes.map(scanType => runScanType(scanType))
    );

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`[CompetitorIntelligence] Parallel scan complete for ${competitor.name} in ${duration}s`);

    // Collect successful scans
    const scans: CompetitorScan[] = results
      .filter((r): r is PromiseFulfilledResult<CompetitorScan | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((s): s is CompetitorScan => s !== null);

    return scans;
  }

  /**
   * Perform a specific type of scan
   */
  private async performScan(
    competitor: CompetitorProfile,
    scanType: ScanType
  ): Promise<CompetitorScan | null> {
    const ttl = SCAN_TTL[scanType] || 7 * 24 * 60 * 60 * 1000;
    const expires_at = new Date(Date.now() + ttl).toISOString();

    let scan_data: Record<string, unknown> = {};
    let extracted_weaknesses: string[] = [];
    let extracted_strengths: string[] = [];
    let extracted_claims: string[] = [];

    switch (scanType) {
      case 'website':
        scan_data = await this.scanWebsite(competitor);
        extracted_claims = (scan_data.claims as string[]) || [];
        break;

      case 'perplexity-research':
        scan_data = await this.scanPerplexityResearch(competitor);
        extracted_weaknesses = (scan_data.weaknesses as string[]) || [];
        break;

      case 'reviews-google':
      case 'reviews-yelp':
      case 'reviews-g2':
      case 'reviews-capterra':
      case 'reviews-trustpilot':
        scan_data = await this.scanReviews(competitor, scanType);
        extracted_weaknesses = (scan_data.negative_themes as string[]) || [];
        extracted_strengths = (scan_data.positive_themes as string[]) || [];
        break;

      case 'ads-meta':
      case 'ads-linkedin':
        scan_data = await this.scanAds(competitor, scanType);
        break;

      case 'llm-analysis':
        scan_data = await this.scanLLMAnalysis(competitor);
        extracted_weaknesses = (scan_data.weaknesses as string[]) || [];
        extracted_strengths = (scan_data.strengths as string[]) || [];
        break;

      default:
        return null;
    }

    // Save scan to database
    const { data, error } = await supabase
      .from('competitor_scans')
      .insert({
        competitor_id: competitor.id,
        brand_id: competitor.brand_id,
        scan_type: scanType,
        scan_data,
        extracted_weaknesses,
        extracted_strengths,
        extracted_claims,
        expires_at,
        data_quality_score: this.calculateDataQuality(scan_data)
      })
      .select()
      .single();

    if (error) {
      console.error('[CompetitorIntelligence] Failed to save scan:', error);
      return null;
    }

    return data as unknown as CompetitorScan;
  }

  /**
   * Scan competitor website via Apify
   */
  private async scanWebsite(competitor: CompetitorProfile): Promise<Record<string, unknown>> {
    if (!competitor.website) {
      return { error: 'No website URL' };
    }

    try {
      // Use existing Apify website scraper
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apify-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            actorId: 'apify/website-content-crawler',
            input: {
              startUrls: [{ url: competitor.website }],
              maxCrawlPages: 5,
              maxCrawlDepth: 1
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Apify error: ${response.status}`);
      }

      const data = await response.json();

      // Extract positioning from website content
      const content = data.pages?.map((p: { text?: string }) => p.text).join(' ') || '';
      const positioning = await this.extractPositioning(content, competitor.name);

      return {
        pages_crawled: data.pages?.length || 0,
        positioning: positioning.summary,
        claims: positioning.claims,
        features: positioning.features,
        raw_content_preview: content.substring(0, 1000)
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] Website scan failed:', error);
      return { error: error instanceof Error ? error.message : 'Scan failed' };
    }
  }

  /**
   * Research competitor weaknesses via Perplexity
   */
  private async scanPerplexityResearch(competitor: CompetitorProfile): Promise<Record<string, unknown>> {
    const prompt = COMPETITOR_WEAKNESS_PROMPT
      .replace('{competitor_name}', competitor.name)
      .replace('{competitor_website}', competitor.website || 'unknown');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'perplexity',
            model: 'sonar-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive analyst. Find real customer complaints and weaknesses. Respond with valid JSON.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Perplexity error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse weaknesses using safe parser
      const weaknesses = safeParseJSON<Array<{ weakness: string; quote: string; source: string }>>(content, []);

      return {
        weaknesses: weaknesses.map(w => w.weakness),
        quotes: weaknesses.map(w => ({ quote: w.quote, source: w.source })),
        raw_response: content
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] Perplexity research failed:', error);
      return { error: error instanceof Error ? error.message : 'Research failed' };
    }
  }

  /**
   * Scan reviews from various platforms using the Review Source Router
   */
  private async scanReviews(
    competitor: CompetitorProfile,
    scanType: ScanType
  ): Promise<Record<string, unknown>> {
    const platformName = scanType.replace('reviews-', '');

    try {
      // Use the Review Source Router for actual review fetching
      const reviewResults = await reviewSourceRouter.fetchReviews(competitor);

      // Find the result for this specific platform
      const platformResult = reviewResults.find(r =>
        r.platform.toLowerCase().includes(platformName) ||
        platformName.includes(r.platform.toLowerCase())
      );

      if (platformResult) {
        return {
          platform: platformResult.platform,
          summary: this.generateReviewSummaryText(platformResult),
          positive_themes: platformResult.summary.top_praises,
          negative_themes: platformResult.summary.top_complaints,
          sample_size: platformResult.summary.total_reviews,
          average_rating: platformResult.summary.average_rating,
          sentiment_score: platformResult.summary.sentiment_score,
          reviews: platformResult.reviews.slice(0, 20), // Keep top 20 reviews
          fetch_time_ms: platformResult.fetch_time_ms
        };
      }

      // If no matching platform, return aggregated data from all sources
      if (reviewResults.length > 0) {
        const allComplaints = reviewResults.flatMap(r => r.summary.top_complaints);
        const allPraises = reviewResults.flatMap(r => r.summary.top_praises);
        const totalReviews = reviewResults.reduce((sum, r) => sum + r.summary.total_reviews, 0);

        return {
          platform: platformName,
          summary: `Aggregated from ${reviewResults.length} sources`,
          positive_themes: [...new Set(allPraises)].slice(0, 5),
          negative_themes: [...new Set(allComplaints)].slice(0, 5),
          sample_size: totalReviews,
          sources: reviewResults.map(r => r.platform)
        };
      }

      return {
        platform: platformName,
        summary: 'No reviews found',
        positive_themes: [],
        negative_themes: [],
        sample_size: 0
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] Review scan error:', error);
      return { error: error instanceof Error ? error.message : 'Review scan failed' };
    }
  }

  /**
   * Generate a human-readable summary from review results
   */
  private generateReviewSummaryText(result: ReviewFetchResult): string {
    const { summary } = result;
    const parts: string[] = [];

    if (summary.total_reviews > 0) {
      parts.push(`Found ${summary.total_reviews} reviews on ${result.platform}.`);
    }

    if (summary.average_rating !== null) {
      parts.push(`Average rating: ${summary.average_rating}/5.`);
    }

    if (summary.top_complaints.length > 0) {
      parts.push(`Top complaints: ${summary.top_complaints.slice(0, 3).join(', ')}.`);
    }

    if (summary.sentiment_score < -0.3) {
      parts.push('Overall sentiment is negative.');
    } else if (summary.sentiment_score > 0.3) {
      parts.push('Overall sentiment is positive.');
    } else {
      parts.push('Overall sentiment is mixed.');
    }

    return parts.join(' ');
  }

  /**
   * Scan ads from Meta/LinkedIn ad libraries using the Ad Library Service
   */
  private async scanAds(
    competitor: CompetitorProfile,
    scanType: ScanType
  ): Promise<Record<string, unknown>> {
    const platform = scanType === 'ads-meta' ? 'meta' : 'linkedin';

    try {
      // Use the Ad Library Service for fetching and analysis
      const adResults = await adLibrary.fetchAds(competitor);

      // Find the result for this specific platform
      const platformResult = adResults.find(r => r.platform === platform);

      if (platformResult) {
        return {
          platform: platformResult.platform,
          ads_found: platformResult.ads.length,
          active_ads: platformResult.analysis.active_ads,
          messaging_themes: platformResult.analysis.messaging_themes,
          emotional_appeals: platformResult.analysis.emotional_appeals,
          cta_patterns: platformResult.analysis.cta_patterns,
          target_audience_signals: platformResult.analysis.target_audience_signals,
          top_performing_hooks: platformResult.analysis.top_performing_hooks,
          creative_formats: platformResult.analysis.creative_formats,
          activity_trend: platformResult.analysis.activity_trend,
          ads: platformResult.ads.slice(0, 10), // Keep top 10 ads for gap extraction
          fetch_time_ms: platformResult.fetch_time_ms
        };
      }

      // Aggregate from all platforms if specific one not found
      if (adResults.length > 0) {
        const allThemes = adResults.flatMap(r => r.analysis.messaging_themes);
        const allAppeals = adResults.flatMap(r => r.analysis.emotional_appeals);
        const totalAds = adResults.reduce((sum, r) => sum + r.ads.length, 0);

        return {
          platform,
          ads_found: totalAds,
          messaging_themes: [...new Set(allThemes)].slice(0, 10),
          emotional_appeals: [...new Set(allAppeals)].slice(0, 5),
          sources: adResults.map(r => r.platform)
        };
      }

      return {
        platform,
        ads_found: 0,
        messaging_themes: [],
        status: 'no_ads_found'
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] Ad scan error:', error);
      return {
        platform,
        ads_found: 0,
        messaging_themes: [],
        error: error instanceof Error ? error.message : 'Ad scan failed'
      };
    }
  }

  /**
   * Perform LLM-powered competitor analysis using segment-specific prompts
   * This is a reliable fallback when scrapers fail (enterprise sites often block scrapers)
   */
  private async scanLLMAnalysis(competitor: CompetitorProfile): Promise<Record<string, unknown>> {
    try {
      // Build the LLM analysis request with brand context
      const brandInfo = await this.getBrandInfo(competitor.brand_id);

      const request: LLMAnalysisRequest = {
        competitor_name: competitor.name,
        competitor_website: competitor.website || undefined,
        brand_name: brandInfo?.name || 'Your Brand',
        brand_industry: brandInfo?.industry || 'Technology',
        segment_type: competitor.segment_type || 'national',
        business_type: competitor.business_type || 'b2b',
        brand_uvp: brandInfo?.uvp || undefined
      };

      // Use premium model for better quality analysis
      const analysis = await llmCompetitorAnalyzer.analyzeCompetitor(request, true);

      if (!analysis) {
        console.warn('[CompetitorIntelligence] LLM analysis returned null for:', competitor.name);
        return { error: 'LLM analysis failed - no response' };
      }

      // Convert analysis to scan_data format
      return {
        source: 'llm-analysis',
        model_used: analysis.model_used,
        positioning: analysis.positioning,
        strengths: analysis.strengths.map(s => s.point),
        strengths_with_evidence: analysis.strengths,
        weaknesses: analysis.weaknesses.map(w => w.point),
        weaknesses_with_sources: analysis.weaknesses,
        pricing: analysis.pricing,
        gaps_identified: analysis.gaps_vs_brand,
        data_quality: 0.75, // LLM analysis is reliable but not as strong as real reviews
        analysis_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[CompetitorIntelligence] LLM analysis error:', error);
      return { error: error instanceof Error ? error.message : 'LLM analysis failed' };
    }
  }

  /**
   * Get brand info for LLM analysis context
   */
  private async getBrandInfo(brandId: string): Promise<{
    name: string;
    industry: string;
    uvp?: string;
  } | null> {
    try {
      const { data } = await supabase
        .from('brands')
        .select('name, industry, uvp_text')
        .eq('id', brandId)
        .single();

      if (!data) return null;

      return {
        name: data.name,
        industry: data.industry || 'Technology',
        uvp: data.uvp_text || undefined
      };
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // GAP EXTRACTION
  // ==========================================================================

  /**
   * Extract competitive gaps from scan data
   */
  async extractGaps(request: GapExtractionRequest): Promise<ExtractedGap[]> {
    this.emitScanEvent({
      type: 'competitor-gap-extraction',
      competitor_id: request.competitor_id,
      competitor_name: request.competitor_name,
      status: 'started'
    });

    try {
      // Compile all scan data into the prompt
      let complaints = this.compileComplaints(request.scan_data);
      const adThemes = this.compileAdThemes(request.scan_data);
      const positioning = request.scan_data.website?.extracted_positioning || '';
      const claims = request.scan_data.website?.extracted_claims?.join(', ') || '';

      // ALWAYS call Perplexity to get citations with URLs for provenance
      // This is the ONLY way to get real source links
      let perplexityCitations: Array<{ title: string; url: string }> = [];

      console.log('[CompetitorIntelligence] Calling Perplexity for complaints with source URLs for', request.competitor_name);
      try {
        const perplexityResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              provider: 'perplexity',
              model: 'sonar-pro',
              messages: [
                {
                  role: 'system',
                  content: 'You are a competitive analyst researching customer complaints. Find REAL customer complaints with EXACT QUOTES from review sites. Always cite your sources with [1], [2] etc.'
                },
                {
                  role: 'user',
                  content: `Find the top 5-10 REAL customer complaints about ${request.competitor_name} from G2, Capterra, TrustPilot, Reddit, or other review sites.

For EACH complaint, include:
1. The EXACT QUOTE from the review (in quotation marks)
2. The source platform (G2, Capterra, Reddit, etc.)
3. The reviewer type if known (Enterprise User, SMB Owner, etc.)

Format each as:
"[exact customer quote here]" - [Platform], [Reviewer Type]

Be specific and cite real sources. Do not make up quotes.`
                }
              ],
              temperature: 0.2,
              max_tokens: 2000
            })
          }
        );

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const perplexityContent = perplexityData.choices?.[0]?.message?.content || '';

          // Extract citations from Perplexity response
          // Perplexity returns citations as array of URL strings: ["url1", "url2", ...]
          if (perplexityData.citations && Array.isArray(perplexityData.citations)) {
            perplexityCitations = perplexityData.citations.map((c: any, i: number) => {
              // Handle both string URLs and object format
              const url = typeof c === 'string' ? c : (c.url || c.link || '');
              const title = typeof c === 'string' ? `Source ${i + 1}` : (c.title || c.name || `Source ${i + 1}`);
              return { title, url };
            }).filter((c: any) => c.url && c.url.startsWith('http'));
            console.log('[CompetitorIntelligence] Perplexity returned', perplexityCitations.length, 'citation URLs:', perplexityCitations.slice(0, 3).map(c => c.url));
          } else {
            console.log('[CompetitorIntelligence] Perplexity response has no citations field. Keys:', Object.keys(perplexityData));
          }

          if (perplexityContent.length > 50) {
            // Use Perplexity content as complaints (has real quotes with citations)
            complaints = perplexityContent;
            if (perplexityCitations.length > 0) {
              complaints += '\n\nSOURCE URLS FOR CITATIONS:\n';
              perplexityCitations.forEach((c, i) => {
                complaints += `[${i + 1}] ${extractPlatformFromUrl(c.url) || c.title}: ${c.url}\n`;
              });
            }
            console.log('[CompetitorIntelligence] Perplexity returned', complaints.length, 'chars of complaints with', perplexityCitations.length, 'source URLs');
          }
        } else {
          console.warn('[CompetitorIntelligence] Perplexity API returned error:', perplexityResponse.status);
        }
      } catch (perplexityErr) {
        console.warn('[CompetitorIntelligence] Perplexity API call failed:', perplexityErr);
        // Fall back to compiled complaints without URLs
      }

      // Get products and segments from UVP data
      const productsList = request.uvp_data?.products?.length
        ? request.uvp_data.products.map((p: any) => `- ${p.name || p}`).join('\n')
        : '- (No products specified - suggest general product categories)';

      const segmentsList = request.uvp_data?.segments?.length
        ? request.uvp_data.segments.map((s: any) => `- ${s.name || s}`).join('\n')
        : '- (No segments specified - suggest general customer types)';

      const brandName = request.uvp_data?.brand_name || 'Your brand';
      const targetCustomer = request.uvp_data?.target_customer || 'Not specified';

      const prompt = GAP_EXTRACTION_PROMPT
        .replace(/{competitor_name}/g, request.competitor_name)
        .replace(/{brand_name}/g, brandName)
        .replace('{positioning_summary}', positioning)
        .replace('{key_claims}', claims)
        .replace('{complaints}', complaints)
        .replace('{ad_themes}', adThemes)
        .replace('{unique_solution}', request.uvp_data?.unique_solution || 'Not provided')
        .replace(/{key_benefit}/g, request.uvp_data?.key_benefit || 'Not provided')
        .replace('{target_customer}', targetCustomer)
        .replace('{products_list}', productsList)
        .replace('{segments_list}', segmentsList);

      // Call Opus 4.5 via ai-proxy for high-quality extraction
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-opus-4',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive positioning strategist. Extract actionable competitive gaps. Respond only with valid JSON arrays.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 3000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse gaps using safe parser
      let gaps: ExtractedGap[] = safeParseJSON<ExtractedGap[]>(content, []);

      // Log raw extraction count before filtering
      const rawGapCount = gaps.length;
      console.log('[CompetitorIntelligence] Raw gaps extracted:', rawGapCount, 'for', request.competitor_name);

      // DEBUG: Log first raw gap's field names to understand LLM response structure
      if (gaps.length > 0) {
        const firstGap = gaps[0];
        console.log('[CompetitorIntelligence] RAW gap field names for', request.competitor_name, ':', Object.keys(firstGap));
        console.log('[CompetitorIntelligence] RAW first gap:', JSON.stringify(firstGap, null, 2).substring(0, 500));
      }

      // Normalize field names - LLM sometimes returns camelCase or different variations
      // Also handle quote/source format from malformed LLM responses
      gaps = gaps.map(g => {
        const normalized: any = { ...g };
        const raw = g as any;

        // SKIP malformed quote/source objects from LLM response
        // These produce low-quality gaps - better to skip them than show garbage
        if (raw.quote && !raw.title && !raw.void && !raw.the_void) {
          console.log('[CompetitorIntelligence] SKIPPING malformed quote object (not a proper gap):', raw.quote?.substring(0, 50));
          return null; // Will be filtered out below
        }

        // Normalize title (could be name, gap_title, Title, gap_name)
        if (!normalized.title) {
          normalized.title = raw.name || raw.gap_title || raw.Title || raw.gap_name || raw.gapTitle || '';
        }

        // Normalize the_void (could be theVoid, void, the_void)
        if (!normalized.the_void) {
          normalized.the_void = raw.theVoid || raw.void || raw.the_Void || raw['The Void'] || '';
        }

        // Normalize the_demand (could be theDemand, demand, the_demand)
        if (!normalized.the_demand) {
          normalized.the_demand = raw.theDemand || raw.demand || raw.the_Demand || raw['The Demand'] || '';
        }

        // Normalize your_angle (could be yourAngle, angle, your_angle)
        if (!normalized.your_angle) {
          normalized.your_angle = raw.yourAngle || raw.angle || raw.your_Angle || raw['Your Angle'] || '';
        }

        // Normalize gap_type (could be gapType, type, gap_type)
        if (!normalized.gap_type) {
          normalized.gap_type = raw.gapType || raw.type || 'feature-gap';
        }

        // Normalize applicable_products (could be applicableProducts)
        if (!normalized.applicable_products) {
          normalized.applicable_products = raw.applicableProducts || raw.applicable_products || [];
        }

        // Normalize applicable_segments (could be applicableSegments)
        if (!normalized.applicable_segments) {
          normalized.applicable_segments = raw.applicableSegments || raw.applicable_segments || [];
        }

        // Normalize source_quotes (could be sourceQuotes, sources)
        if (!normalized.source_quotes) {
          normalized.source_quotes = raw.sourceQuotes || raw.source_quotes || raw.sources || [];
        }
        // Ensure source_quotes is an array of proper SourceQuote objects
        if (Array.isArray(normalized.source_quotes)) {
          normalized.source_quotes = normalized.source_quotes.map((sq: any) => ({
            quote: sq.quote || sq.text || '',
            source: sq.source || sq.platform || 'Unknown',
            url: sq.url || sq.link || '',
            date: sq.date || sq.timestamp || '',
            author: sq.author || sq.user || ''
          }));
        }

        return normalized as ExtractedGap;
      });

      // Log a sample gap to debug field names
      // Filter out nulls from malformed items
      gaps = gaps.filter((g): g is ExtractedGap => g !== null);

      if (gaps.length > 0) {
        console.log('[CompetitorIntelligence] Sample gap after normalization:', {
          title: gaps[0].title,
          the_void: gaps[0].the_void?.substring(0, 50) + '...',
          the_demand: gaps[0].the_demand?.substring(0, 50) + '...',
          your_angle: gaps[0].your_angle?.substring(0, 50) + '...'
        });
      }

      // Validate gaps have required fields
      const validGaps = gaps.filter(g => g.title && g.the_void && g.the_demand && g.your_angle);
      console.log('[CompetitorIntelligence] Valid gaps (with required fields):', validGaps.length);

      // Apply confidence threshold from config (lowered from 0.6 to 0.4)
      gaps = validGaps.filter(g => (g.confidence || 0) >= GAP_CONFIDENCE_THRESHOLD);

      // Log filtering results
      const filteredOutCount = validGaps.length - gaps.length;
      console.log('[CompetitorIntelligence] Gap filtering for', request.competitor_name, {
        raw: rawGapCount,
        valid: validGaps.length,
        afterConfidenceFilter: gaps.length,
        filteredOut: filteredOutCount,
        threshold: GAP_CONFIDENCE_THRESHOLD,
        highConfidenceCount: gaps.filter(g => (g.confidence || 0) >= GAP_HIGH_CONFIDENCE_THRESHOLD).length,
        lowConfidenceCount: gaps.filter(g => (g.confidence || 0) < GAP_HIGH_CONFIDENCE_THRESHOLD).length
      });

      // Mark gaps as low confidence for UI badge
      gaps = gaps.map(g => ({
        ...g,
        is_low_confidence: (g.confidence || 0) < GAP_HIGH_CONFIDENCE_THRESHOLD
      }));

      // POST-PROCESS: Inject Perplexity citation URLs into source_quotes
      // The LLM may not have properly matched citation numbers to URLs
      // CRITICAL: Always prefer platform name extracted from URL over LLM's source name
      if (perplexityCitations.length > 0) {
        console.log('[CompetitorIntelligence] Injecting', perplexityCitations.length, 'citation URLs into gaps');
        gaps = gaps.map(gap => {
          // If gap has source_quotes without URLs, try to match citation numbers
          if (gap.source_quotes && gap.source_quotes.length > 0) {
            gap.source_quotes = gap.source_quotes.map((sq, idx) => {
              let url = sq.url;
              let source = sq.source;

              // If quote already has URL, extract platform from it (override bad source names)
              if (url && url.startsWith('http')) {
                const platformFromUrl = extractPlatformFromUrl(url);
                if (platformFromUrl) {
                  source = platformFromUrl; // Always use URL-derived platform name
                }
                return { ...sq, source, url };
              }

              // Try to extract citation number from quote text like [1] or [2]
              const citationMatch = sq.quote?.match(/\[(\d+)\]/);
              if (citationMatch) {
                const citationNum = parseInt(citationMatch[1], 10) - 1; // 0-indexed
                if (perplexityCitations[citationNum]) {
                  url = perplexityCitations[citationNum].url;
                  // ALWAYS use platform from URL when available - override LLM source names
                  source = extractPlatformFromUrl(url) || perplexityCitations[citationNum].title || source;
                  return { ...sq, url, source };
                }
              }

              // Fallback: assign citations round-robin if no URL
              if (perplexityCitations[idx % perplexityCitations.length]) {
                url = perplexityCitations[idx % perplexityCitations.length].url;
                // ALWAYS use platform from URL when available - override LLM source names
                source = extractPlatformFromUrl(url) || source;
                return { ...sq, url, source };
              }
              return sq;
            });
          } else if (!gap.source_quotes || gap.source_quotes.length === 0) {
            // If gap has no source_quotes, create them from the Perplexity citations
            // Use the gap title as context since we don't have verbatim quotes
            gap.source_quotes = perplexityCitations.slice(0, 2).map(citation => ({
              quote: `See source for customer feedback on: ${gap.title}`,
              source: extractPlatformFromUrl(citation.url) || citation.title || 'Web Research',
              url: citation.url,
              date: '',
              author: ''
            }));
          }
          return gap;
        });
        console.log('[CompetitorIntelligence] After URL injection, sample source_quotes:',
          gaps[0]?.source_quotes?.slice(0, 2).map(sq => ({ url: sq.url, source: sq.source }))
        );
      }

      // FINAL POST-PROCESS: Normalize any remaining bad source names
      // This catches cases where LLM returned garbage source names and no URL was available
      const BAD_SOURCE_NAMES = [
        'Customer complaints', 'Customer complaint', 'customer complaints',
        'Market Analysis', 'market analysis', 'Industry Report', 'industry report',
        'Review Platform', 'review platform', 'Online Reviews', 'online reviews',
        'User Feedback', 'user feedback', 'Customer Feedback', 'customer feedback',
        'Unknown', 'unknown', 'N/A', 'n/a', ''
      ];

      gaps = gaps.map(gap => {
        if (gap.source_quotes && gap.source_quotes.length > 0) {
          gap.source_quotes = gap.source_quotes.map(sq => {
            // If URL exists, try to get platform from it again
            if (sq.url && sq.url.startsWith('http')) {
              const platformFromUrl = extractPlatformFromUrl(sq.url);
              if (platformFromUrl) {
                return { ...sq, source: platformFromUrl };
              }
            }
            // If source is a known bad name, replace with "Web Research"
            if (BAD_SOURCE_NAMES.includes(sq.source)) {
              return { ...sq, source: sq.url ? 'Web Source' : 'Market Research' };
            }
            return sq;
          });
        }
        return gap;
      });

      this.emitScanEvent({
        type: 'competitor-gap-extraction',
        competitor_id: request.competitor_id,
        competitor_name: request.competitor_name,
        status: 'completed',
        data: gaps
      });

      return gaps;

    } catch (error) {
      this.emitScanEvent({
        type: 'competitor-gap-extraction',
        competitor_id: request.competitor_id,
        competitor_name: request.competitor_name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Extraction failed'
      });
      throw error;
    }
  }

  /**
   * Save extracted gaps to database
   */
  async saveGaps(
    brand_id: string,
    competitor_id: string,
    competitor_name: string,
    gaps: ExtractedGap[],
    source_scan_ids: string[]
  ): Promise<CompetitorGap[]> {
    const savedGaps: CompetitorGap[] = [];

    for (const gap of gaps) {
      // Use source_quotes from the new format, fall back to sources for legacy
      const sourceQuotes = gap.source_quotes || gap.sources || [];

      const { data, error } = await supabase
        .from('competitor_gaps')
        .insert({
          brand_id,
          competitor_ids: [competitor_id],
          competitor_names: [competitor_name],
          title: gap.title,
          the_void: gap.the_void,
          the_demand: gap.the_demand,
          your_angle: gap.your_angle,
          gap_type: gap.gap_type,
          confidence_score: gap.confidence,
          source_count: sourceQuotes.length || 1,
          primary_source: 'perplexity' as GapSource,
          source_quotes: sourceQuotes,
          source_scan_ids,
          // Store product/segment mapping in existing JSONB columns until migration is run
          // These map to applicable_products and applicable_segments from extraction
          customer_profiles: gap.applicable_segments || [],
          applicable_offerings: gap.applicable_products || []
        })
        .select()
        .single();

      if (data && !error) {
        savedGaps.push(data as unknown as CompetitorGap);
      } else if (error) {
        console.warn('[CompetitorIntelligence] Failed to save gap:', gap.title, error.message);
      }
    }

    return savedGaps;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getLatestScan(
    competitor_id: string,
    scan_type: ScanType
  ): Promise<CompetitorScan | null> {
    const { data, error } = await supabase
      .from('competitor_scans')
      .select('*')
      .eq('competitor_id', competitor_id)
      .eq('scan_type', scan_type)
      .order('scanned_at', { ascending: false })
      .limit(1);

    // Handle no data or error gracefully (don't use .single() which throws 406 on empty)
    if (error || !data || data.length === 0) return null;

    // Check if stale
    const scan = data[0] as unknown as CompetitorScan;
    scan.is_stale = new Date(scan.expires_at) < new Date();

    return scan;
  }

  private scanTypeToEventType(scanType: ScanType): CompetitorScanEventType {
    if (scanType === 'website') return 'competitor-scan-website';
    if (scanType.startsWith('reviews-')) return 'competitor-scan-reviews';
    if (scanType.startsWith('ads-')) return 'competitor-scan-ads';
    if (scanType === 'perplexity-research') return 'competitor-scan-research';
    if (scanType === 'llm-analysis') return 'competitor-scan-llm';
    return 'competitor-scan-website';
  }

  private async extractPositioning(
    content: string,
    companyName: string
  ): Promise<{ summary: string; claims: string[]; features: string[] }> {
    // Use a quick AI call to extract positioning from website content
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-opus-4.5',
            messages: [
              {
                role: 'user',
                content: `Extract the positioning from this website content for ${companyName}. Return JSON with: summary (1-2 sentences), claims (array of marketing claims), features (array of key features).\n\nContent:\n${content.substring(0, 5000)}`
              }
            ],
            temperature: 0.2,
            max_tokens: 1000
          })
        }
      );

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content || '{}';
      // Parse website analysis using safe parser
      const parsed = safeParseJSON<{ summary?: string; claims?: string[]; features?: string[] }>(responseContent, {});
      return {
        summary: parsed.summary || '',
        claims: parsed.claims || [],
        features: parsed.features || []
      };
    } catch {
      return { summary: '', claims: [], features: [] };
    }
  }

  private calculateDataQuality(scan_data: Record<string, unknown>): number {
    if (scan_data.error) return 0.1;
    if (!scan_data || Object.keys(scan_data).length === 0) return 0.2;

    let score = 0.5;
    if (scan_data.positioning) score += 0.1;
    if (scan_data.claims && (scan_data.claims as string[]).length > 0) score += 0.1;
    if (scan_data.weaknesses && (scan_data.weaknesses as string[]).length > 0) score += 0.2;
    if (scan_data.quotes && (scan_data.quotes as unknown[]).length > 0) score += 0.1;

    return Math.min(score, 1);
  }

  private compileComplaints(scan_data: GapExtractionRequest['scan_data']): string {
    const complaints: string[] = [];

    // From Perplexity research
    if (scan_data.perplexity) {
      const weaknesses = scan_data.perplexity.extracted_weaknesses || [];
      complaints.push(...weaknesses);
    }

    // From reviews
    if (scan_data.reviews) {
      for (const review of scan_data.reviews) {
        const negatives = review.extracted_weaknesses || [];
        complaints.push(...negatives);
      }
    }

    // From LLM analysis (reliable fallback with sourced weaknesses)
    if (scan_data.llm_analysis) {
      const llmWeaknesses = scan_data.llm_analysis.extracted_weaknesses || [];
      // Mark as LLM-sourced for provenance tracking
      complaints.push(...llmWeaknesses.map(w => `[LLM Analysis] ${w}`));
    }

    return complaints.length > 0
      ? complaints.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : 'No specific complaints found';
  }

  private compileAdThemes(scan_data: GapExtractionRequest['scan_data']): string {
    if (!scan_data.ads || scan_data.ads.length === 0) {
      return 'No ad data available';
    }

    const themes = new Set<string>();
    for (const ad of scan_data.ads) {
      ad.messaging_themes.forEach(t => themes.add(t));
    }

    return themes.size > 0
      ? Array.from(themes).join(', ')
      : 'No clear messaging themes identified';
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Full competitor intelligence flow:
   * 1. Check for existing competitors in DB (use cache!)
   * 2. Only discover if no competitors exist
   * 3. Use cached scans where available
   * 4. Extract fresh gaps from scan data
   */
  async runFullAnalysis(
    brand_id: string,
    brand_name: string,
    industry: string,
    website_url?: string,
    location?: string,
    uvp_data?: GapExtractionRequest['uvp_data']
  ): Promise<{
    competitors: CompetitorProfile[];
    gaps: CompetitorGap[];
  }> {
    // Step 1: Check for EXISTING competitors in DB first (use the cache!)
    let competitors = await this.getCompetitors(brand_id);

    if (competitors.length > 0) {
      console.log(`[CompetitorIntelligence] Using ${competitors.length} CACHED competitors from DB`);
    } else {
      // Only discover if no cached competitors
      console.log('[CompetitorIntelligence] No cached competitors, running discovery...');
      const discovered = await this.discoverCompetitors({
        brand_id,
        brand_name,
        industry,
        website_url,
        location
      });
      competitors = await this.saveCompetitors(brand_id, discovered);
    }

    // Step 2: For each competitor, use cached scans or fetch new ones
    const allGaps: CompetitorGap[] = [];

    const scanPromises = competitors.map(async (competitor) => {
      const scanStartTime = performance.now();
      console.log(`[CompetitorIntelligence] Processing: ${competitor.name}`);

      // Try to load cached scans first
      const cachedScans = await this.getScans(competitor.id);

      let scans;
      if (cachedScans.length > 0) {
        console.log(`[CompetitorIntelligence] Using ${cachedScans.length} CACHED scans for ${competitor.name}`);
        scans = cachedScans;
      } else {
        console.log(`[CompetitorIntelligence] No cached scans, fetching fresh for ${competitor.name}`);
        scans = await this.scanCompetitor(competitor);
      }

      // Log scan results per competitor for debugging
      const scanSummary = {
        website: scans.find(s => s.scan_type === 'website') ? 'OK' : 'MISSING',
        perplexity: scans.find(s => s.scan_type === 'perplexity-research') ? 'OK' : 'MISSING',
        llm_analysis: scans.find(s => s.scan_type === 'llm-analysis') ? 'OK' : 'MISSING',
        reviews: scans.filter(s => s.scan_type.startsWith('reviews-')).length
      };
      console.log(`[CompetitorIntelligence] Scan results for ${competitor.name}:`, scanSummary);

      // Step 4: Extract gaps (now includes LLM analysis as reliable fallback)
      const extractedGaps = await this.extractGaps({
        brand_id,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        scan_data: {
          website: scans.find(s => s.scan_type === 'website'),
          reviews: scans.filter(s => s.scan_type.startsWith('reviews-')),
          perplexity: scans.find(s => s.scan_type === 'perplexity-research'),
          llm_analysis: scans.find(s => s.scan_type === 'llm-analysis')
        },
        uvp_data
      });

      const scanDuration = ((performance.now() - scanStartTime) / 1000).toFixed(1);
      console.log(`[CompetitorIntelligence] ${competitor.name} complete in ${scanDuration}s: ${extractedGaps.length} gaps extracted`);

      // Step 5: Save gaps
      const savedGaps = await this.saveGaps(
        brand_id,
        competitor.id,
        competitor.name,
        extractedGaps,
        scans.map(s => s.id)
      );

      return savedGaps;
    });

    // Wait for all with concurrency limit
    const results = await Promise.allSettled(scanPromises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allGaps.push(...result.value);
      } else {
        // Log failures for debugging
        console.error('[CompetitorIntelligence] Competitor scan failed:', result.reason);
      }
    }

    return { competitors, gaps: allGaps };
  }

  /**
   * Get all competitors for a brand
   */
  async getCompetitors(brand_id: string): Promise<CompetitorProfile[]> {
    const { data, error } = await supabase
      .from('competitor_profiles')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[CompetitorIntelligence] Failed to get competitors:', error);
      return [];
    }

    return (data || []) as unknown as CompetitorProfile[];
  }

  /**
   * Get all gaps for a brand
   */
  async getGaps(brand_id: string, competitor_id?: string): Promise<CompetitorGap[]> {
    let query = supabase
      .from('competitor_gaps')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('is_dismissed', false)
      .order('confidence_score', { ascending: false });

    if (competitor_id) {
      query = query.contains('competitor_ids', [competitor_id]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CompetitorIntelligence] Failed to get gaps:', error);
      return [];
    }

    // Map DB columns to expected TypeScript field names
    // DB stores: customer_profiles -> applicable_segments, applicable_offerings -> applicable_products
    return (data || []).map((row: any) => ({
      ...row,
      applicable_segments: row.customer_profiles || [],
      applicable_products: row.applicable_offerings || []
    })) as CompetitorGap[];
  }

  /**
   * Get scans for a competitor
   */
  async getScans(competitor_id: string): Promise<CompetitorScan[]> {
    const { data, error } = await supabase
      .from('competitor_scans')
      .select('*')
      .eq('competitor_id', competitor_id)
      .eq('is_stale', false)
      .order('scanned_at', { ascending: false });

    if (error) {
      console.error('[CompetitorIntelligence] Failed to get scans:', error);
      return [];
    }

    return (data || []) as unknown as CompetitorScan[];
  }

  /**
   * Add a competitor manually
   */
  async addCompetitor(
    brand_id: string,
    name: string,
    website?: string,
    segment_type?: SegmentType,
    business_type?: BusinessType
  ): Promise<CompetitorProfile | null> {
    const { data, error } = await supabase
      .from('competitor_profiles')
      .insert({
        brand_id,
        name,
        website,
        discovery_source: 'manual',
        confidence_score: 1.0,
        segment_type,
        business_type,
        is_active: true,
        is_verified: true
      })
      .select()
      .single();

    if (error) {
      console.error('[CompetitorIntelligence] Failed to add competitor:', error);
      return null;
    }

    return data as unknown as CompetitorProfile;
  }

  /**
   * Remove a competitor
   */
  async removeCompetitor(competitor_id: string): Promise<boolean> {
    const { error } = await supabase
      .from('competitor_profiles')
      .update({ is_active: false })
      .eq('id', competitor_id);

    return !error;
  }

  /**
   * Dismiss a gap
   */
  async dismissGap(gap_id: string): Promise<boolean> {
    const { error } = await supabase
      .from('competitor_gaps')
      .update({ is_dismissed: true })
      .eq('id', gap_id);

    return !error;
  }

  /**
   * Star/unstar a gap
   */
  async toggleGapStar(gap_id: string, is_starred: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('competitor_gaps')
      .update({ is_starred })
      .eq('id', gap_id);

    return !error;
  }

  /**
   * Normalize competitor name for fuzzy matching
   * Handles variations like "Rasa" vs "Rasa.ai" vs "Rasa AI"
   */
  private normalizeCompetitorName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\.(ai|io|com|co|app)$/i, '')  // Remove common suffixes like .ai, .io
      .replace(/\s+(ai|inc|llc|ltd|corp)$/i, '') // Remove company suffixes
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
      .trim();
  }

  async dedupeCompetitorsForBrand(brand_id: string): Promise<number> {
    console.log('[CompetitorIntelligence] Deduping competitors for brand:', brand_id);

    // Get all competitors
    const { data: allCompetitors, error } = await supabase
      .from('competitor_profiles')
      .select('id, name, created_at')
      .eq('brand_id', brand_id)
      .order('created_at', { ascending: false });

    if (error || !allCompetitors) {
      console.error('[CompetitorIntelligence] Failed to fetch competitors for dedupe:', error);
      return 0;
    }

    // Find duplicates using fuzzy name matching
    // e.g., "Rasa" and "Rasa.ai" should be considered the same
    const seen = new Map<string, string>(); // normalized name -> id of first (newest) occurrence
    const duplicateIds: string[] = [];

    for (const c of allCompetitors) {
      const normalizedName = this.normalizeCompetitorName(c.name);
      console.log('[CompetitorIntelligence] Checking:', c.name, '-> normalized:', normalizedName);

      if (seen.has(normalizedName)) {
        // This is a duplicate - mark for deletion
        console.log('[CompetitorIntelligence] Found duplicate:', c.name, 'matches existing entry');
        duplicateIds.push(c.id);
      } else {
        seen.set(normalizedName, c.id);
      }
    }

    if (duplicateIds.length === 0) {
      console.log('[CompetitorIntelligence] No duplicates found');
      return 0;
    }

    console.log('[CompetitorIntelligence] Found', duplicateIds.length, 'duplicate competitors to remove');

    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('competitor_profiles')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('[CompetitorIntelligence] Failed to delete duplicates:', deleteError);
      return 0;
    }

    console.log('[CompetitorIntelligence] Removed', duplicateIds.length, 'duplicates');
    return duplicateIds.length;
  }

  /**
   * Delete all competitors for a brand (used before fresh discovery)
   */
  async deleteCompetitorsForBrand(brand_id: string): Promise<number> {
    console.log('[CompetitorIntelligence] Deleting all competitors for brand:', brand_id);

    const { data, error } = await supabase
      .from('competitor_profiles')
      .delete()
      .eq('brand_id', brand_id)
      .select('id');

    if (error) {
      console.error('[CompetitorIntelligence] Failed to delete competitors:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log('[CompetitorIntelligence] Deleted', deletedCount, 'competitors');
    return deletedCount;
  }

  /**
   * Delete all gaps for a brand (used before rescan to clear stale data)
   */
  async deleteGapsForBrand(brand_id: string): Promise<number> {
    console.log('[CompetitorIntelligence] Deleting all gaps for brand:', brand_id);

    const { data, error } = await supabase
      .from('competitor_gaps')
      .delete()
      .eq('brand_id', brand_id)
      .select('id');

    if (error) {
      console.error('[CompetitorIntelligence] Failed to delete gaps:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log('[CompetitorIntelligence] Deleted', deletedCount, 'gaps');
    return deletedCount;
  }

  /**
   * Delete all scans for a brand (used before rescan to force fresh data)
   */
  async deleteScansForBrand(brand_id: string): Promise<number> {
    console.log('[CompetitorIntelligence] Deleting all scans for brand:', brand_id);

    // First get competitor IDs for this brand
    const { data: competitors } = await supabase
      .from('competitor_profiles')
      .select('id')
      .eq('brand_id', brand_id);

    if (!competitors || competitors.length === 0) {
      return 0;
    }

    const competitorIds = competitors.map(c => c.id);

    const { data, error } = await supabase
      .from('competitor_scans')
      .delete()
      .in('competitor_id', competitorIds)
      .select('id');

    if (error) {
      console.error('[CompetitorIntelligence] Failed to delete scans:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log('[CompetitorIntelligence] Deleted', deletedCount, 'scans');
    return deletedCount;
  }
}

// Export singleton
export const competitorIntelligence = new CompetitorIntelligenceService();
export default competitorIntelligence;
