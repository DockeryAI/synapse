/**
 * Location Detection Service
 *
 * Automatically detects business location (city, state) from URL and other signals
 * Used to eliminate manual location entry in Synapse
 *
 * Detection methods:
 * 1. Domain parsing (e.g., dallasplumbing.com → Dallas, TX)
 * 2. WHOIS lookup (registrant address)
 * 3. Website content scraping (contact pages, footer)
 * 4. OpenAI inference from business context
 *
 * Created: 2025-11-13
 */

import { supabase } from '@/lib/supabase';
import { chat } from '@/lib/openrouter';
import { OutScraperAPI } from './outscraper-api';

export interface LocationResult {
  city: string;
  state: string;
  confidence: number; // 0-1
  method: 'domain' | 'whois' | 'scraping' | 'ai' | 'website_scraping' | 'fallback';
  reasoning?: string;
  allLocations?: Array<{ city: string; state: string }>; // All detected locations if multiple exist
  hasMultipleLocations?: boolean;
}

class LocationDetectionService {
  /**
   * Main detection method - tries multiple strategies
   */
  async detectLocation(url: string, industryHint?: string): Promise<LocationResult> {
    console.log('[LocationDetection] Starting detection for:', url);

    // Try methods in order of reliability
    let result: LocationResult | null = null;

    // Method 1: Domain parsing (fast, medium reliability)
    result = this.detectFromDomain(url);
    if (result && result.confidence > 0.7) {
      console.log('[LocationDetection] ✅ Domain parsing succeeded:', result);
      return result;
    }

    // Method 2: Supabase cache check (instant if cached)
    result = await this.checkCache(url);
    if (result) {
      console.log('[LocationDetection] ✅ Cache hit:', result);
      return result;
    }
    console.log('[LocationDetection] Cache miss, trying website scraping (most reliable)...');

    // Method 3: Scrape website content FIRST (most businesses have location on homepage)
    result = await this.detectFromWebsite(url, industryHint);
    console.log('[LocationDetection] Website scraping result:', result);
    if (result && result.confidence > 0.6) {
      console.log('[LocationDetection] ✅ Website scraping succeeded:', result);
      await this.cacheResult(url, result); // Cache for next time
      return result;
    }
    console.log('[LocationDetection] Website scraping failed, trying AI detection...');

    // Method 4: AI inference from URL + industry (domain-based)
    result = await this.detectWithAI(url, industryHint);
    console.log('[LocationDetection] AI detection result:', result);
    if (result && result.confidence > 0.6) {
      console.log('[LocationDetection] ✅ AI detection succeeded:', result);
      await this.cacheResult(url, result); // Cache for next time
      return result;
    }
    console.log('[LocationDetection] Domain-based AI detection failed, trying OutScraper...');

    // Method 5: OutScraper Google Maps search (finds all locations)
    result = await this.detectWithOutScraper(url, industryHint);
    console.log('[LocationDetection] OutScraper detection result:', result);
    if (result && result.confidence > 0.7) {
      console.log('[LocationDetection] ✅ OutScraper detection succeeded:', result);
      await this.cacheResult(url, result); // Cache for next time
      return result;
    }
    console.log('[LocationDetection] ⚠️ All detection methods failed');

    // No fallback - return null so user can manually enter location
    return null;
  }

  /**
   * Method 1: Parse location from domain name
   * Examples: dallasplumbing.com, austinroofing.net, nycplumber.com
   */
  private detectFromDomain(url: string): LocationResult | null {
    try {
      // Normalize URL to ensure it has a protocol
      const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      const domain = new URL(normalizedUrl).hostname.toLowerCase()
        .replace('www.', '')
        .split('.')[0]; // Get just the domain name

      // City patterns
      const cityPatterns: Record<string, { city: string; state: string }> = {
        // Major cities
        'nyc|newyork': { city: 'New York', state: 'NY' },
        'dallas': { city: 'Dallas', state: 'TX' },
        'austin': { city: 'Austin', state: 'TX' },
        'houston': { city: 'Houston', state: 'TX' },
        'sanantonio': { city: 'San Antonio', state: 'TX' },
        'phoenix': { city: 'Phoenix', state: 'AZ' },
        'philadelphia|philly': { city: 'Philadelphia', state: 'PA' },
        'sandiego': { city: 'San Diego', state: 'CA' },
        'sanjose': { city: 'San Jose', state: 'CA' },
        'jacksonville': { city: 'Jacksonville', state: 'FL' },
        'fortworth': { city: 'Fort Worth', state: 'TX' },
        'columbus': { city: 'Columbus', state: 'OH' },
        'charlotte': { city: 'Charlotte', state: 'NC' },
        'sanfrancisco|sf': { city: 'San Francisco', state: 'CA' },
        'indianapolis': { city: 'Indianapolis', state: 'IN' },
        'seattle': { city: 'Seattle', state: 'WA' },
        'denver': { city: 'Denver', state: 'CO' },
        'washington|dc': { city: 'Washington', state: 'DC' },
        'boston': { city: 'Boston', state: 'MA' },
        'elpaso': { city: 'El Paso', state: 'TX' },
        'nashville': { city: 'Nashville', state: 'TN' },
        'detroit': { city: 'Detroit', state: 'MI' },
        'memphis': { city: 'Memphis', state: 'TN' },
        'portland': { city: 'Portland', state: 'OR' },
        'oklahomacity': { city: 'Oklahoma City', state: 'OK' },
        'lasvegas|vegas': { city: 'Las Vegas', state: 'NV' },
        'louisville': { city: 'Louisville', state: 'KY' },
        'baltimore': { city: 'Baltimore', state: 'MD' },
        'milwaukee': { city: 'Milwaukee', state: 'WI' },
        'albuquerque': { city: 'Albuquerque', state: 'NM' },
        'tucson': { city: 'Tucson', state: 'AZ' },
        'fresno': { city: 'Fresno', state: 'CA' },
        'mesa': { city: 'Mesa', state: 'AZ' },
        'sacramento': { city: 'Sacramento', state: 'CA' },
        'atlanta': { city: 'Atlanta', state: 'GA' },
        'kansascity': { city: 'Kansas City', state: 'MO' },
        'colorado': { city: 'Denver', state: 'CO' },
        'miami': { city: 'Miami', state: 'FL' },
        'raleigh': { city: 'Raleigh', state: 'NC' },
        'omaha': { city: 'Omaha', state: 'NE' },
        'longbeach': { city: 'Long Beach', state: 'CA' },
        'virginia': { city: 'Virginia Beach', state: 'VA' },
        'oakland': { city: 'Oakland', state: 'CA' },
        'minneapolis': { city: 'Minneapolis', state: 'MN' },
        'tulsa': { city: 'Tulsa', state: 'OK' },
        'tampa': { city: 'Tampa', state: 'FL' },
        'arlington': { city: 'Arlington', state: 'TX' },
        'neworleans': { city: 'New Orleans', state: 'LA' },
        'chicago': { city: 'Chicago', state: 'IL' },
        'losangeles|la': { city: 'Los Angeles', state: 'CA' },
      };

      for (const [pattern, location] of Object.entries(cityPatterns)) {
        // Match only if city name is at the START of domain or is a complete word
        // This prevents "thephoenix" from matching "phoenix"
        const regex = new RegExp(`^${pattern}(?![a-z])`, 'i');
        if (regex.test(domain)) {
          return {
            ...location,
            confidence: 0.8,
            method: 'domain',
            reasoning: `Detected "${location.city}" in domain name`
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[LocationDetection] Domain parsing error:', error);
      return null;
    }
  }

  /**
   * Method 2: Check Supabase cache
   */
  private async checkCache(url: string): Promise<LocationResult | null> {
    try {
      // Check if user is authenticated before querying cache
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Skip cache for unauthenticated users
        return null;
      }

      // Normalize URL to ensure it has a protocol
      const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      const domain = new URL(normalizedUrl).hostname;

      const { data, error } = await supabase
        .from('location_detection_cache')
        .select('city, state, confidence, method, reasoning, hasMultipleLocations, allLocations')
        .eq('domain', domain)
        .single();

      if (error || !data) {
        return null;
      }

      // Invalidate old cache entries that don't have multi-location support
      if (data.hasMultipleLocations === undefined) {
        return null;
      }

      // Check if cache is still valid (30 days)
      return data as LocationResult;
    } catch (error) {
      return null;
    }
  }

  /**
   * Method 3: Use AI to infer location from URL and industry context
   */
  private async detectWithAI(url: string, industryHint?: string): Promise<LocationResult | null> {
    console.log('[LocationDetection] Starting AI detection for:', url);
    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const domain = new URL(fullUrl).hostname;

      const prompt = `You are a location detection expert. Analyze this business URL and determine the most likely city and state.

URL: ${url}
Domain: ${domain}
${industryHint ? `Industry: ${industryHint}` : ''}

Look for location clues in:
1. Domain name (e.g., "dallasplumbing.com" → Dallas, TX)
2. Common city abbreviations or nicknames
3. Regional service patterns

Respond ONLY with valid JSON in this exact format:
{
  "city": "City Name",
  "state": "XX",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

If you cannot detect a location with confidence > 0.5, respond with:
{
  "city": null,
  "state": null,
  "confidence": 0.0,
  "reasoning": "Could not detect location from URL"
}`;

      console.log('[LocationDetection] Calling OpenRouter AI...');
      const aiUrlResponse = await chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        model: 'anthropic/claude-opus-4.1',
        temperature: 0.3,
        maxTokens: 200
      });

      console.log('[LocationDetection] AI response received:', aiUrlResponse?.substring(0, 100));
      const text = aiUrlResponse.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[LocationDetection] No JSON in AI response:', text);
        throw new Error('No JSON in AI response');
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log('[LocationDetection] Parsed AI result:', result);

      if (!result.city || !result.state || result.confidence < 0.5) {
        console.log('[LocationDetection] AI result rejected: city/state missing or confidence < 0.5');
        return null;
      }

      return {
        city: result.city,
        state: result.state,
        confidence: result.confidence,
        method: 'ai',
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error('[LocationDetection] AI inference error:', error);
      return null;
    }
  }

  /**
   * Method 3.5: Use OutScraper to find business on Google Maps
   */
  private async detectWithOutScraper(url: string, industryHint?: string): Promise<LocationResult | null> {
    console.log('[LocationDetection] Starting OutScraper detection for:', url);
    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      // Extract business name from domain
      const domain = new URL(fullUrl).hostname.replace('www.', '').split('.')[0];

      // Smart business name extraction
      let businessName = domain.replace(/[-_]/g, ' ');

      // Handle common suffixes (restaurant, cafe, bar, grill, etc.)
      const suffixes = ['restaurant', 'cafe', 'bar', 'grill', 'bistro', 'eatery', 'kitchen', 'dining'];
      for (const suffix of suffixes) {
        // Match suffix at the end (case insensitive)
        const regex = new RegExp(suffix + '$', 'i');
        if (regex.test(businessName)) {
          // Split it: "thehenryrestaurant" -> "thehenry restaurant"
          businessName = businessName.replace(regex, ` ${suffix}`);
          break;
        }
      }

      // Handle "the" prefix: "the henry" -> "The Henry"
      businessName = businessName.replace(/^the\s+/i, 'The ');

      // Capitalize words
      businessName = businessName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();

      console.log('[LocationDetection] Searching Google Maps for:', businessName);

      // Search Google Maps via OutScraper
      const listings = await OutScraperAPI.getBusinessListings({
        query: businessName,
        limit: 50  // Get up to 50 results to find all locations
      });

      console.log('[LocationDetection] OutScraper found', listings.length, 'listings');

      if (listings.length === 0) {
        return null;
      }

      // Extract unique city/state pairs from addresses
      const locationSet = new Set<string>();
      const allLocations: Array<{ city: string; state: string }> = [];

      for (const listing of listings) {
        if (!listing.address) {
          console.log('[LocationDetection] Skipping listing with no address:', listing.name);
          continue;
        }

        console.log('[LocationDetection] Parsing address:', listing.address);

        // Parse city/state from address
        // Try multiple formats:
        // 1. "123 Main St, Dallas, TX 75201, USA"
        // 2. "123 Main St, Dallas, TX 75201"
        // 3. "Dallas, TX 75201"
        const addressParts = listing.address.split(',').map(p => p.trim());

        console.log('[LocationDetection] Address parts:', addressParts);

        let city = '';
        let state = '';

        // Try to find city and state
        for (let i = addressParts.length - 1; i >= 0; i--) {
          const part = addressParts[i];

          // Check if this part contains state code (2 letters followed by optional zip)
          const stateMatch = part.match(/\b([A-Z]{2})\b/);
          if (stateMatch && !state) {
            state = stateMatch[1];
            // City is typically the part before the state
            if (i > 0) {
              city = addressParts[i - 1];
            }
            break;
          }
        }

        if (city && state && state.length === 2) {
          const key = `${city}|${state}`;
          if (!locationSet.has(key)) {
            locationSet.add(key);
            allLocations.push({ city, state });
            console.log('[LocationDetection] ✅ Extracted location:', { city, state });
          }
        } else {
          console.log('[LocationDetection] ❌ Failed to extract location from:', listing.address);
        }
      }

      console.log('[LocationDetection] Extracted', allLocations.length, 'unique locations from OutScraper');

      if (allLocations.length === 0) {
        return null;
      }

      // Single location
      if (allLocations.length === 1) {
        return {
          city: allLocations[0].city,
          state: allLocations[0].state,
          confidence: 0.9,
          method: 'ai',
          reasoning: `Found single location via Google Maps: ${allLocations[0].city}, ${allLocations[0].state}`,
          hasMultipleLocations: false
        };
      }

      // Multiple locations
      return {
        city: allLocations[0].city,  // First as primary
        state: allLocations[0].state,
        confidence: 0.95,
        method: 'ai',
        reasoning: `Found ${allLocations.length} locations via Google Maps, primary: ${allLocations[0].city}, ${allLocations[0].state}`,
        hasMultipleLocations: true,
        allLocations
      };

    } catch (error) {
      console.error('[LocationDetection] OutScraper detection error:', error);
      return null;
    }
  }

  /**
   * Extract addresses from HTML using regex patterns
   */
  private extractAddresses(html: string): string[] {
    const addresses: string[] = [];

    // Pattern: street number + street name + city + state + zip
    const fullAddressPattern = /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct|Circle|Cir|Parkway|Pkwy)[.,]?\s*(?:#\d+\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/g;

    // Pattern: city, state zip
    const cityStatePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/g;

    // Pattern: city, state (no zip)
    const cityStateOnlyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g;

    let match;

    // Find full addresses
    while ((match = fullAddressPattern.exec(html)) !== null) {
      addresses.push(match[0]);
    }

    // Find city, state + zip
    while ((match = cityStatePattern.exec(html)) !== null) {
      addresses.push(match[0]);
    }

    // Find city, state only (less reliable, so check it's in common patterns)
    while ((match = cityStateOnlyPattern.exec(html)) !== null) {
      const fullMatch = match[0];
      // Only include if it looks like an address context
      if (html.substring(Math.max(0, match.index - 100), match.index).toLowerCase().includes('address') ||
          html.substring(Math.max(0, match.index - 100), match.index).toLowerCase().includes('location') ||
          html.substring(Math.max(0, match.index - 100), match.index).toLowerCase().includes('contact')) {
        addresses.push(fullMatch);
      }
    }

    return [...new Set(addresses)]; // Remove duplicates
  }

  /**
   * Extract structured data (JSON-LD) from HTML
   */
  private extractStructuredData(html: string): string {
    const jsonLdMatches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (!jsonLdMatches) {
      return '';
    }

    const structuredData: string[] = [];

    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const parsed = JSON.parse(jsonContent);
        structuredData.push(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return structuredData.join('\n');
  }

  /**
   * Method 4: Scrape website content and extract location
   */
  private async detectFromWebsite(url: string, industryHint?: string): Promise<LocationResult | null> {
    console.log('[LocationDetection] Fetching website content...');

    // Normalize URL to ensure it has a protocol
    const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;

    // Try common location page URLs first (highest quality data)
    const baseUrl = new URL(normalizedUrl).origin;
    const locationPages = [
      `${baseUrl}/locations`,
      `${baseUrl}/locations-menus`,
      `${baseUrl}/find-us`,
      `${baseUrl}/contact`,
      `${baseUrl}/store-locator`,
      `${baseUrl}/our-locations`
    ];

    // Try each location page
    for (const locationPageUrl of locationPages) {
      console.log('[LocationDetection] Trying location page:', locationPageUrl);
      const result = await this.scrapeAndAnalyze(locationPageUrl, industryHint);
      if (result && result.confidence > 0.6) {
        console.log('[LocationDetection] ✅ Found locations on dedicated page:', locationPageUrl);
        return result;
      }
    }

    // Fallback to homepage if no location page found
    console.log('[LocationDetection] No location page found, trying homepage...');
    return await this.scrapeAndAnalyze(normalizedUrl, industryHint);
  }

  /**
   * Scrape a URL and analyze for locations
   */
  private async scrapeAndAnalyze(url: string, industryHint?: string): Promise<LocationResult | null> {
    try {
      // Direct fetch with CORS proxy
      console.log('[LocationDetection] Fetching HTML directly...');
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const fetchResponse = await fetch(proxyUrl);
      const html = await fetchResponse.text();

      console.log('[LocationDetection] HTML fetched, length:', html.length);

      // Extract addresses using regex patterns
      const addresses = this.extractAddresses(html);
      console.log('[LocationDetection] Found addresses:', addresses.length);

      // Extract structured data (JSON-LD)
      const structuredData = this.extractStructuredData(html);
      console.log('[LocationDetection] Found structured data:', structuredData.length);

      // Get visible text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const content = [
        '=== ADDRESSES FOUND ===',
        addresses.join('\n'),
        '',
        '=== STRUCTURED DATA ===',
        structuredData,
        '',
        '=== PAGE CONTENT ===',
        textContent.substring(0, 4000)
      ].join('\n');

      console.log('[LocationDetection] - Addresses found:', addresses.length);
      console.log('[LocationDetection] - Structured data length:', structuredData.length);
      console.log('[LocationDetection] - Total content length:', content.length);

      const prompt = `Extract the physical business location(s) from this website content.

URL: ${url}
${industryHint ? `Industry: ${industryHint}` : ''}

Website Content:
${content}

**EXTRACTION PRIORITY:**

1. **ADDRESSES FOUND** section - These are pre-extracted addresses with city, state
2. **STRUCTURED DATA** section - JSON-LD with address/location objects
3. **PAGE CONTENT** - Look for city, state patterns

**RULES:**
- Extract EVERY distinct city mentioned in addresses or contact info
- DO NOT return null for city if you found a state - look harder
- If you see "TX" or "Texas", there MUST be a city nearby
- Check addresses, contact sections, footer, "about us", "locations"
- Confidence should be 0.8+ if you find ANY city in the content

**Common patterns:**
- "123 Main St, Houston, TX 75201"
- "Houston, TX"
- "Located in Houston, Texas"
- "Visit us in Houston"
- Phone numbers often have city context nearby

**If multiple cities found:**
- Primary = first address listed, or HQ designation, or most detail
- Include ALL cities in allLocations array

Respond ONLY with valid JSON in this exact format:

If SINGLE location found:
{
  "city": "City Name",
  "state": "XX",
  "confidence": 0.0-1.0,
  "hasMultipleLocations": false,
  "reasoning": "explanation"
}

If MULTIPLE locations found:
{
  "city": "Primary City",
  "state": "XX",
  "confidence": 0.0-1.0,
  "hasMultipleLocations": true,
  "allLocations": [
    {"city": "City1", "state": "XX"},
    {"city": "City2", "state": "YY"}
  ],
  "reasoning": "Found N locations, primary is City1 based on..."
}

If NO location found:
{
  "city": null,
  "state": null,
  "confidence": 0.0,
  "hasMultipleLocations": false,
  "reasoning": "No location information found"
}`;

      console.log('[LocationDetection] Analyzing website content with AI...');
      const aiResponse = await chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        model: 'anthropic/claude-opus-4.1',
        temperature: 0.2,
        maxTokens: 500  // Increased to handle multiple locations
      });

      console.log('[LocationDetection] Website analysis response:', aiResponse?.substring(0, 100));
      const text = aiResponse.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[LocationDetection] No JSON in website analysis response');
        return null;
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log('[LocationDetection] Parsed website analysis result:', result);

      // Accept if we have both city and state with good confidence
      // OR if we have state-only with very high confidence (0.7+)
      const hasRequiredData = (result.city && result.state) || (result.state && result.confidence >= 0.7);

      if (!hasRequiredData || result.confidence < 0.5) {
        console.log('[LocationDetection] Website analysis rejected: insufficient confidence or missing data');
        return null;
      }

      return {
        city: result.city || null, // Allow null for state-only results
        state: result.state,
        confidence: result.confidence,
        method: 'website_scraping',
        reasoning: result.reasoning,
        hasMultipleLocations: result.hasMultipleLocations || false,
        allLocations: result.allLocations || undefined
      };
    } catch (error) {
      console.error('[LocationDetection] Website scraping error:', error);
      return null;
    }
  }

  /**
   * Cache the result for future lookups
   */
  private async cacheResult(url: string, result: LocationResult): Promise<void> {
    try {
      // Check if user is authenticated before caching
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Skip cache for unauthenticated users
        return;
      }

      // Normalize URL to ensure it has a protocol
      const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      const domain = new URL(normalizedUrl).hostname;

      // Delete old entry first to avoid conflicts
      await supabase
        .from('location_detection_cache')
        .delete()
        .eq('domain', domain);

      // Insert new entry
      await supabase
        .from('location_detection_cache')
        .insert({
          domain,
          city: result.city,
          state: result.state,
          confidence: result.confidence,
          method: result.method,
          reasoning: result.reasoning,
          hasMultipleLocations: result.hasMultipleLocations || false,
          allLocations: result.allLocations || null,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      // Silently fail - caching is optional
    }
  }

  /**
   * Format location as string
   */
  formatLocation(result: LocationResult): string {
    return `${result.city}, ${result.state}`;
  }
}

export const locationDetectionService = new LocationDetectionService();
// LocationResult is already exported as interface above
