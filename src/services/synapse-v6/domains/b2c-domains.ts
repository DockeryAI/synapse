/**
 * B2C Domain Configuration
 *
 * Maps API sources to semantic domains for cross-domain unexpectedness scoring.
 * Different domains = higher unexpectedness = breakthrough potential.
 */

export const B2C_DOMAINS = {
  weather: ['weather-api', 'openweathermap'],
  localEvents: ['events-api', 'local-news', 'eventbrite'],
  reviews: ['yelp', 'google-maps', 'google-reviews', 'facebook', 'trustpilot'],
  socialTrends: ['twitter', 'twitter-api', 'tiktok', 'reddit', 'instagram'],
  news: ['serper', 'serper-news', 'newsapi', 'perplexity'],
  search: ['semrush', 'serper-autocomplete', 'google-trends'],
  video: ['youtube', 'tiktok-video'],
} as const;

export type B2CDomain = keyof typeof B2C_DOMAINS;

/**
 * Get domain for a B2C source
 */
export function getB2CDomain(source: string): B2CDomain | null {
  const normalizedSource = source.toLowerCase();

  for (const [domain, sources] of Object.entries(B2C_DOMAINS)) {
    if (sources.some(s => normalizedSource.includes(s))) {
      return domain as B2CDomain;
    }
  }

  return null;
}

/**
 * Check if two sources are from different B2C domains
 */
export function areB2CSourcesCrossDomain(source1: string, source2: string): boolean {
  const domain1 = getB2CDomain(source1);
  const domain2 = getB2CDomain(source2);

  // If either is unknown, treat as different domain
  if (!domain1 || !domain2) return true;

  return domain1 !== domain2;
}
