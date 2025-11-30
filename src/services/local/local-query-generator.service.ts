/**
 * Local Query Generator Service
 *
 * Generates location-aware queries from UVP data for local event/news discovery.
 * These queries feed into Serper News, Serper Places, and Perplexity APIs.
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { LocalQueryConfig, LocalLocation } from './types';

// ============================================================================
// LOCATION EXTRACTION
// ============================================================================

/**
 * Known US cities for location extraction
 */
const KNOWN_CITIES: Record<string, string> = {
  'austin': 'TX',
  'san antonio': 'TX',
  'houston': 'TX',
  'dallas': 'TX',
  'fort worth': 'TX',
  'denver': 'CO',
  'phoenix': 'AZ',
  'chicago': 'IL',
  'los angeles': 'CA',
  'san diego': 'CA',
  'san francisco': 'CA',
  'seattle': 'WA',
  'portland': 'OR',
  'miami': 'FL',
  'tampa': 'FL',
  'orlando': 'FL',
  'atlanta': 'GA',
  'nashville': 'TN',
  'new york': 'NY',
  'boston': 'MA',
  'philadelphia': 'PA',
  'central texas': 'TX',
};

/**
 * Extract location data from UVP
 */
export function extractLocationFromUVP(uvp: CompleteUVP): LocalLocation | null {
  // Collect all text to search for location
  const textSources = [
    uvp.targetCustomer?.statement,
    uvp.targetCustomer?.industry,
    uvp.targetCustomer?.description,
    uvp.uniqueSolution?.statement,
    uvp.transformationGoal?.currentState,
    uvp.valuePropositionStatement,
  ].filter(Boolean).join(' ');

  console.log('[LocalQueryGenerator] Searching for location in:', textSources.substring(0, 200));

  // 1. Try to find known cities in the text
  const textLower = textSources.toLowerCase();
  for (const [city, state] of Object.entries(KNOWN_CITIES)) {
    if (textLower.includes(city)) {
      console.log(`[LocalQueryGenerator] Found known city: ${city}, ${state}`);
      return {
        city: city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        state,
      };
    }
  }

  // 2. Try pattern matching for "in [City]" or "in [City], [ST]"
  const patterns = [
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z]{2})?\b/g,
    /\bserving\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z]{2})?\b/g,
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:homeowner|resident|business)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/g,
  ];

  for (const pattern of patterns) {
    const matches = textSources.matchAll(pattern);
    for (const match of matches) {
      const city = match[1]?.trim();
      const state = match[2] || '';
      if (city && !isGenericLocation(city) && city.length > 2) {
        console.log(`[LocalQueryGenerator] Found location via pattern: ${city}, ${state}`);
        return { city, state };
      }
    }
  }

  // 3. Default fallback
  console.warn('[LocalQueryGenerator] No location found in UVP, using default');
  return null;
}

/**
 * Check if a location string is too generic
 */
function isGenericLocation(location: string): boolean {
  const genericTerms = ['the area', 'your area', 'local', 'nearby', 'region', 'community'];
  return genericTerms.some(term => location.toLowerCase().includes(term));
}

// ============================================================================
// QUERY GENERATION
// ============================================================================

/**
 * Generate all local queries from config
 */
export function generateLocalQueries(config: LocalQueryConfig): {
  newsQueries: string[];
  placesQueries: string[];
  perplexityQueries: string[];
} {
  const { location, industry, businessName } = config;
  const { city, state, neighborhood } = location;

  const cityState = state ? `${city}, ${state}` : city;

  // News queries - for Serper News API
  const newsQueries = [
    `${city} community events`,
    `${city} local news`,
    `${cityState} upcoming events`,
    `${city} ${industry} news`,
    `${city} business news`,
    `${city} charity events`,
    `${city} festivals`,
    ...(neighborhood ? [`${neighborhood} ${city} news`] : []),
  ];

  // Places queries - for Serper Places API
  const placesQueries = [
    `events in ${city}`,
    `community centers ${city}`,
    `event venues ${city}`,
    `${industry} ${city}`,
    ...(neighborhood ? [`events ${neighborhood} ${city}`] : []),
  ];

  // Perplexity queries - for AI synthesis
  const perplexityQueries = [
    generatePerplexityQuery(config),
  ];

  return {
    newsQueries,
    placesQueries,
    perplexityQueries,
  };
}

/**
 * Generate a comprehensive Perplexity query for local insights
 */
function generatePerplexityQuery(config: LocalQueryConfig): string {
  const { location, industry, businessName } = config;
  const { city, state } = location;
  const cityState = state ? `${city}, ${state}` : city;

  return `What are the upcoming local events, community happenings, and notable news in ${cityState} in the next 2-4 weeks?

Focus on:
1. Community festivals, fairs, and public events
2. School events (sports, graduations, back-to-school)
3. Charity events and fundraisers
4. Local business grand openings or celebrations
5. Sports events (local teams, youth sports)
6. Cultural celebrations and civic events

${industry ? `Also find any events specifically relevant to the ${industry} industry.` : ''}
${businessName ? `The business is called "${businessName}".` : ''}

For each event, provide:
- Event name
- Date (if known)
- Brief description
- Why it matters for local businesses

Format as a JSON array of objects with: title, description, date, type (event/news/community/school/sports/charity).`;
}

// ============================================================================
// CONFIG BUILDER
// ============================================================================

/**
 * Extract industry string from UVP
 */
function extractIndustryFromUVP(uvp: CompleteUVP): string {
  // Try targetCustomer.industry first (if it's a string)
  if (typeof uvp.targetCustomer?.industry === 'string' && uvp.targetCustomer.industry) {
    return uvp.targetCustomer.industry;
  }

  // Try to extract from targetCustomer statement
  const statement = uvp.targetCustomer?.statement || '';
  const industryPatterns = [
    /hvac|plumbing|heating|cooling|air condition/i,
    /restaurant|food|dining|cafe/i,
    /dental|dentist|orthodont/i,
    /salon|beauty|spa|hair/i,
    /fitness|gym|personal train/i,
    /retail|shop|store/i,
    /real estate|realtor|property/i,
    /auto|car|vehicle|mechanic/i,
    /pet|veterinar|grooming/i,
    /childcare|daycare|preschool/i,
    /landscap|lawn|garden/i,
    /roofing|contractor|construction/i,
  ];

  for (const pattern of industryPatterns) {
    if (pattern.test(statement)) {
      const match = statement.match(pattern);
      if (match) {
        return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
      }
    }
  }

  // Try products/services categories
  const categories = uvp.productsServices?.categories;
  if (categories && categories.length > 0) {
    const firstCategory = categories[0];
    if (typeof firstCategory === 'string') {
      return firstCategory;
    }
    if (firstCategory?.name) {
      return firstCategory.name;
    }
  }

  return 'local business';
}

/**
 * Build LocalQueryConfig from UVP
 */
export function buildLocalQueryConfig(uvp: CompleteUVP): LocalQueryConfig | null {
  const location = extractLocationFromUVP(uvp);

  if (!location) {
    console.warn('[LocalQueryGenerator] Cannot build config without location');
    return null;
  }

  // Extract industry from UVP
  const industry = extractIndustryFromUVP(uvp);
  console.log('[LocalQueryGenerator] Extracted industry:', industry);

  return {
    location,
    industry,
    businessName: undefined, // Could be enhanced with brand data
    targetCustomer: uvp.targetCustomer?.statement,
  };
}

/**
 * Build LocalQueryConfig with manual location override
 */
export function buildLocalQueryConfigWithLocation(
  uvp: CompleteUVP,
  manualLocation: LocalLocation
): LocalQueryConfig {
  const industry = extractIndustryFromUVP(uvp);
  console.log('[LocalQueryGenerator] Extracted industry (manual location):', industry);

  return {
    location: manualLocation,
    industry,
    businessName: undefined,
    targetCustomer: uvp.targetCustomer?.statement,
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get time-based query modifiers
 */
export function getTimeModifiers(): string[] {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  return [
    'this week',
    'this weekend',
    'upcoming',
    `${month} ${year}`,
    'next 2 weeks',
  ];
}

/**
 * Get industry-specific event keywords
 */
export function getIndustryEventKeywords(industry: string): string[] {
  const industryKeywords: Record<string, string[]> = {
    'restaurant': ['food festival', 'taste of', 'restaurant week', 'farmers market'],
    'hvac': ['home show', 'home expo', 'trade show', 'energy fair'],
    'dental': ['health fair', 'wellness event', 'back to school'],
    'salon': ['bridal show', 'fashion event', 'beauty expo'],
    'fitness': ['5k', 'marathon', 'fitness challenge', 'wellness fair'],
    'retail': ['sidewalk sale', 'shop local', 'small business saturday'],
    'real estate': ['open house tour', 'home show', 'parade of homes'],
    'auto': ['car show', 'auto expo', 'cruise night'],
    'pet': ['pet adoption', 'dog show', 'pet expo'],
    'childcare': ['back to school', 'summer camp fair', 'family fun day'],
  };

  // Find matching keywords
  const lowercaseIndustry = industry.toLowerCase();
  for (const [key, keywords] of Object.entries(industryKeywords)) {
    if (lowercaseIndustry.includes(key)) {
      return keywords;
    }
  }

  return ['community event', 'local festival', 'charity event'];
}
