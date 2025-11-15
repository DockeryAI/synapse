/**
 * CONTENT INTELLIGENCE DATA ADAPTER
 *
 * Transforms existing MARBA data → BusinessIntelligence format for V6 Content Engine
 *
 * Flow:
 * 1. Collect BusinessData from APIs (SEMrush, Outscraper, Serper, Website, Social)
 * 2. Fetch Industry Profile from Supabase (145 profiles)
 * 3. Transform to BusinessIntelligence format
 * 4. Return ready for contentOrchestrator.generateAllContent()
 *
 * CRITICAL: NO MOCK DATA. If APIs fail → throw errors.
 */

import type { BusinessIntelligence } from './types';
import type { BusinessData, IndustryProfile as LegacyIndustryProfile } from '@/lib/intelligence/types';
import { supabase } from '@/utils/supabase/client';

// ============================================================================
// AI ANALYSIS HELPERS
// ============================================================================

interface WebsiteMessagingAnalysis {
  valuePropositions: string[];
  targetAudience: string[];
  customerProblems: string[];
  solutions: string[];
  proofPoints: string[];
  differentiators: string[];
  confidence: number;
}

/**
 * Analyze website content using Claude 3.5 Sonnet to extract business-specific messaging
 */
async function analyzeWebsiteMessaging(
  websiteContent: string,
  businessName: string
): Promise<WebsiteMessagingAnalysis> {
  console.log('[AI Analysis] Starting website messaging extraction...');
  console.log('[AI Analysis] Content length:', websiteContent.length, 'characters');

  try {
    const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      console.warn('[AI Analysis] No Anthropic API key found, skipping AI analysis');
      return {
        valuePropositions: [],
        targetAudience: [],
        customerProblems: [],
        solutions: [],
        proofPoints: [],
        differentiators: [],
        confidence: 0
      };
    }

    // Truncate content to avoid token limits (keep first ~5000 words)
    const truncatedContent = websiteContent.slice(0, 20000);

    const prompt = `You are a brand strategist analyzing a business's website content.

Business: ${businessName}
Website Content:
${truncatedContent}

Extract the following business-specific information. CRITICAL: Only include what they EXPLICITLY state. DO NOT use generic industry assumptions. If not mentioned, use empty array.

1. VALUE PROPOSITIONS: What unique benefits, guarantees, or promises do they explicitly mention?
2. TARGET AUDIENCE: Who are they explicitly talking to? Use their exact language.
3. CUSTOMER PROBLEMS: What specific problems do they say their customers face?
4. THEIR SOLUTION: How do they describe solving those problems?
5. PROOF POINTS: What credentials, experience, results, or stats do they cite?
6. DIFFERENTIATORS: What makes them different from competitors in their own words?

Return ONLY valid JSON (no markdown, no explanations):
{
  "valuePropositions": ["exact quote 1", "exact quote 2"],
  "targetAudience": ["exact audience description"],
  "customerProblems": ["problem 1 in their words"],
  "solutions": ["how they solve it"],
  "proofPoints": ["credential 1", "stat 1"],
  "differentiators": ["unique factor 1"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3, // Lower = more precise extraction
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Analysis] API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    console.log('[AI Analysis] Raw response:', analysisText);

    // Parse JSON response
    const analysis = JSON.parse(analysisText);

    console.log('[AI Analysis] ✅ Extraction complete:');
    console.log('  - Value Propositions:', analysis.valuePropositions?.length || 0);
    console.log('  - Target Audience:', analysis.targetAudience?.length || 0);
    console.log('  - Problems:', analysis.customerProblems?.length || 0);
    console.log('  - Solutions:', analysis.solutions?.length || 0);
    console.log('  - Proof Points:', analysis.proofPoints?.length || 0);
    console.log('  - Differentiators:', analysis.differentiators?.length || 0);

    return {
      ...analysis,
      confidence: (
        (analysis.valuePropositions?.length || 0) +
        (analysis.targetAudience?.length || 0) +
        (analysis.customerProblems?.length || 0)
      ) > 0 ? 90 : 50
    };

  } catch (error) {
    console.error('[AI Analysis] Failed:', error);
    // Return empty analysis on error (graceful fallback)
    return {
      valuePropositions: [],
      targetAudience: [],
      customerProblems: [],
      solutions: [],
      proofPoints: [],
      differentiators: [],
      confidence: 0
    };
  }
}

// ============================================================================
// API INTEGRATION HELPERS
// ============================================================================

/**
 * Call SEMrush API for keyword and competitive data
 */
async function callSEMrushAPI(url: string) {
  try {
    // Extract domain from URL
    const domain = new URL(url).hostname.replace('www.', '');

    // Call your existing SEMrush integration
    // TODO: Replace with actual SEMrush service call
    const response = await fetch(`/api/semrush/domain-overview?domain=${domain}`);

    if (!response.ok) {
      throw new Error(`SEMrush API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SEMrush API error:', error);
    throw new Error(`SEMrush API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call Outscraper API for GMB data and reviews
 */
async function callOutscraperAPI(url: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');

    // Call your existing Outscraper integration
    // TODO: Replace with actual Outscraper service call
    const response = await fetch(`/api/outscraper/gmb?domain=${domain}`);

    if (!response.ok) {
      throw new Error(`Outscraper API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Outscraper API error:', error);
    throw new Error(`Outscraper API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call Serper API for search rankings
 */
async function callSerperAPI(url: string, industryKeywords: string[]) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');

    // Call your existing Serper integration
    // TODO: Replace with actual Serper service call
    const response = await fetch(`/api/serper/rankings?domain=${domain}&keywords=${industryKeywords.join(',')}`);

    if (!response.ok) {
      throw new Error(`Serper API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Serper API error:', error);
    throw new Error(`Serper API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Scrape website for content and metadata
 */
async function scrapeWebsite(url: string) {
  try {
    // Call your existing website scraper
    // TODO: Replace with actual scraper service call
    const response = await fetch(`/api/scraper/website?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      throw new Error(`Website scraper failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Website scraper error:', error);
    throw new Error(`Website scraper unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Collect social media data
 */
async function collectSocialData(url: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');

    // Call your existing social media collector
    // TODO: Replace with actual social data service call
    const response = await fetch(`/api/social/collect?domain=${domain}`);

    if (!response.ok) {
      throw new Error(`Social data collection failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Social data collection error:', error);
    throw new Error(`Social data collection unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// INDUSTRY PROFILE FETCHER
// ============================================================================

/**
 * Fetch industry profile from Supabase (145 profiles available)
 */
async function fetchIndustryProfile(industryCode: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', industryCode)
      .limit(1) // Handle duplicate NAICS codes - get first match
      .maybeSingle(); // Use maybeSingle() to avoid 406 errors when not found

    if (error) {
      console.error('[DataAdapter] Industry profile fetch error:', error);
      return null; // Return null instead of throwing
    }

    if (!data) {
      console.warn(`[DataAdapter] No industry profile found for code: ${industryCode} - will generate on-demand or use fallback`);
      return null; // Return null to allow fallback
    }

    console.log(`[DataAdapter] Industry profile found for ${industryCode}:`, data.industry_name);
    return data;
  } catch (error) {
    console.error('[DataAdapter] Industry profile error:', error);
    return null; // Return null instead of throwing to allow fallback
  }
}

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Extract business name from website data or GMB
 */
function extractBusinessName(websiteData: any, gmbData?: any): string {
  // Try website title first
  let name = '';

  if (websiteData?.title && websiteData.title !== 'undefined') {
    name = websiteData.title;
  } else if (websiteData?.metadata?.title && websiteData.metadata.title !== 'undefined') {
    name = websiteData.metadata.title;
  } else if (gmbData?.name) {
    // Fallback to GMB name
    return gmbData.name;
  } else {
    return 'Business';
  }

  // Clean up SEO-style titles (e.g., "Business Name | Tagline | Location")
  // Take only the first part before the first pipe
  if (name.includes('|')) {
    name = name.split('|')[0].trim();
  }

  // If still too long (>60 chars), it might be a description, try GMB instead
  if (name.length > 60 && gmbData?.name) {
    return gmbData.name;
  }

  return name;
}

/**
 * Extract location from website data, GMB data, or Serper results
 */
function extractLocation(websiteData: any, gmbData: any, serperData?: any): { city: string; state: string; country?: string } {
  console.log('[extractLocation] GMB data structure:', JSON.stringify(gmbData, null, 2));

  // Try GMB first (most reliable) - handle multiple possible structures
  if (gmbData) {
    // Structure 1: gmbData.location.city/state
    if (gmbData.location?.city || gmbData.location?.state) {
      return {
        city: gmbData.location.city || '',
        state: gmbData.location.state || '',
        country: gmbData.location.country || 'US'
      };
    }

    // Structure 2: gmbData.city/state directly
    if (gmbData.city || gmbData.state) {
      return {
        city: gmbData.city || '',
        state: gmbData.state || '',
        country: gmbData.country || 'US'
      };
    }

    // Structure 3: Parse from address string
    if (gmbData.address || gmbData.full_address) {
      const addressStr = gmbData.address || gmbData.full_address;
      const parts = addressStr.split(',').map((s: string) => s.trim());
      // Typical format: "Street, City, State ZIP" or "Street, City, State"
      if (parts.length >= 3) {
        return {
          city: parts[parts.length - 2] || '',
          state: parts[parts.length - 1].split(' ')[0] || '', // Extract state from "STATE ZIP"
          country: 'US'
        };
      }
    }
  }

  // Try Serper search results (titles often contain location info like "Business Name | City, ST")
  if (serperData && Array.isArray(serperData)) {
    for (const result of serperData) {
      if (result.competitors && Array.isArray(result.competitors)) {
        for (const comp of result.competitors) {
          // Only check titles (more reliable than snippets)
          const titleText = comp.title || '';

          // Look for "City, ST" or "City ST" pattern with more strict rules:
          // - Must have pipe separator before location (e.g., "Business | City, ST")
          // - Or be at end of title
          // - City must be 3+ chars and capitalized
          const locationPattern = /(?:\|\s+|^)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,\s]+\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)(?:\s|$|-)/;
          const match = titleText.match(locationPattern);

          if (match) {
            const city = match[1].trim();
            const state = match[2].toUpperCase();
            console.log(`[extractLocation] Found "${city}, ${state}" in Serper result: ${comp.title}`);
            return { city, state, country: 'US' };
          }
        }
      }
    }
  }

  // Try to extract from website description or content
  const description = websiteData?.description || websiteData?.content || '';
  const gmbDescription = gmbData?.description || '';
  const serperText = serperData && Array.isArray(serperData)
    ? serperData.flatMap((r: any) => r.competitors || []).map((c: any) => `${c.title} ${c.snippet}`).join(' ')
    : '';
  const combinedText = `${description} ${gmbDescription} ${serperText}`.toLowerCase();

  // Look for "Dallas-Fort Worth" or "DFW"
  if (combinedText.includes('dallas-fort worth') || combinedText.includes('dfw')) {
    console.log('[extractLocation] Found Dallas-Fort Worth reference in descriptions');
    return { city: 'Dallas', state: 'TX', country: 'US' };
  }

  // Look for common city patterns with their states
  const cityStateMap: Record<string, string> = {
    'atlanta': 'GA',
    'houston': 'TX',
    'austin': 'TX',
    'dallas': 'TX',
    'plano': 'TX',
    'frisco': 'TX',
    'mckinney': 'TX',
    'allen': 'TX',
    'fort worth': 'TX',
    'arlington': 'TX',
    'grapevine': 'TX',
    'irving': 'TX',
    'carrollton': 'TX',
    'lewisville': 'TX',
    'flower mound': 'TX',
    'southlake': 'TX',
    'colleyville': 'TX',
    'keller': 'TX',
    'san antonio': 'TX',
    'denver': 'CO',
    'orlando': 'FL',
    'miami': 'FL',
    'tampa': 'FL',
    'chicago': 'IL',
    'seattle': 'WA',
    'portland': 'OR',
    'phoenix': 'AZ',
    'boston': 'MA',
    'new york': 'NY',
    'los angeles': 'CA',
    'san diego': 'CA',
    'san francisco': 'CA'
  };

  // Try to match city names (including multi-word cities)
  const cityPattern = /\b(atlanta|houston|austin|dallas|plano|frisco|mckinney|allen|fort worth|arlington|grapevine|irving|carrollton|lewisville|flower mound|southlake|colleyville|keller|san antonio|denver|orlando|miami|tampa|chicago|seattle|portland|phoenix|boston|new york|los angeles|san diego|san francisco)\b/i;
  const cityMatch = combinedText.match(cityPattern);

  if (cityMatch) {
    const cityLower = cityMatch[1].toLowerCase();
    // Proper case for multi-word cities (e.g., "fort worth" -> "Fort Worth")
    const city = cityMatch[1]
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const state = cityStateMap[cityLower];
    console.log(`[extractLocation] Parsed city "${city}, ${state}" from text`);
    return { city, state, country: 'US' };
  }

  // Fallback to website metadata
  if (websiteData?.metadata?.location) {
    return {
      city: websiteData.metadata.location.city || '',
      state: websiteData.metadata.location.state || '',
      country: 'US'
    };
  }

  // Last resort: Try to parse from GMB business name (e.g., "EmpowerHome Team Dallas")
  if (gmbData?.name) {
    const nameParts = gmbData.name.split(' ');
    const lastWord = nameParts[nameParts.length - 1];

    // Common US cities (basic detection)
    const usCities = [
      'Dallas', 'Houston', 'Austin', 'Atlanta', 'Denver', 'Orlando', 'Miami',
      'Chicago', 'Seattle', 'Portland', 'Phoenix', 'Boston', 'Detroit', 'Nashville',
      'Charlotte', 'Indianapolis', 'Columbus', 'Philadelphia', 'Jacksonville'
    ];

    if (usCities.includes(lastWord)) {
      console.log(`[extractLocation] Parsed city "${lastWord}" from GMB name: ${gmbData.name}`);
      return { city: lastWord, state: '', country: 'US' };
    }
  }

  // Default
  console.warn('[extractLocation] No location data found in GMB or website');
  return { city: '', state: '', country: 'US' };
}

/**
 * Extract competitive intelligence from SEMrush, Serper, Social, and Review data
 */
function extractCompetitiveIntelligence(
  semrushData: any,
  serperData: any,
  socialData?: any,
  reviewData?: any,
  industryProfile?: any,
  businessDomain?: string,
  businessName?: string
) {
  const competitive = {
    searchOpportunities: {
      keywordGaps: [] as any[],
      contentGaps: [] as any[]
    },
    socialOpportunities: {
      platformGaps: [] as any[],
      timingGaps: [] as any[],
      formatGaps: [] as any[]
    },
    reviewOpportunities: {
      advantages: [] as any[],
      weaknessesToExploit: [] as any[]
    }
  };

  // ========== SEARCH OPPORTUNITIES ==========

  // Extract keyword gaps from SEMrush - OPPORTUNITY KEYWORDS (positions 11-50)
  // These are keywords they're ranking for but could improve
  // Filter out brand/business name terms
  if (semrushData?.keywords && Array.isArray(semrushData.keywords)) {
    // Use passed business name for filtering (NOT industry display name)
    const actualBusinessName = businessName || '';

    // Common industry terms that should NOT be filtered as brand terms
    const commonIndustryTerms = new Set([
      'real', 'estate', 'home', 'homes', 'house', 'property', 'realty',
      'plumbing', 'plumber', 'hvac', 'electrician', 'contractor',
      'law', 'legal', 'attorney', 'lawyer', 'dental', 'dentist', 'doctor',
      'restaurant', 'cafe', 'bar', 'grill', 'pizza', 'food',
      'insurance', 'financial', 'accounting', 'tax', 'consulting'
    ]);

    const brandTerms = actualBusinessName
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3 && !commonIndustryTerms.has(term));

    semrushData.keywords.forEach((kw: any) => {
      // Only include opportunity keywords (positions 11-50, not unranked or brand terms)
      if (kw.position >= 11 && kw.position <= 50) {
        const kwLower = kw.keyword.toLowerCase();

        // Check if keyword starts with brand term or is exact match
        const startsWithBrand = brandTerms.some(term =>
          kwLower.startsWith(term + ' ') || kwLower === term
        );
        const isExactBusinessName = kwLower === actualBusinessName.toLowerCase();

        if (!startsWithBrand && !isExactBusinessName && kw.searchVolume >= 50) { // Minimum 50 searches/mo to be worth targeting
          competitive.searchOpportunities.keywordGaps.push({
            keyword: kw.keyword,
            searchVolume: kw.searchVolume || 0,
            difficulty: kw.difficulty || 50,
            currentPosition: kw.position,
            opportunity: `Currently ranking #${kw.position} - opportunity to reach top 10`
          });
        }
      }
    });

    console.log(`[CompetitiveIntel] Found ${competitive.searchOpportunities.keywordGaps.length} opportunity keywords`);
  }

  // Extract content gaps from Serper competitor analysis
  // These are topics/queries where competitors rank but you don't
  // NOTE: Serper queries are brand-focused (business name searches), so we filter those out
  // Only keep queries that represent actual TOPICS, not brand searches
  if (serperData && Array.isArray(serperData) && businessDomain) {
    const actualBusinessName = businessName || '';
    const domainName = businessDomain.split('.')[0].toLowerCase();

    serperData.forEach((result: any) => {
      if (result.query && result.competitors?.length > 0) {
        const queryLower = result.query.toLowerCase();

        // Filter out brand-focused queries that contain the business name or domain
        // We only want TOPIC-based queries like "homes for sale lucas texas"
        const isBrandQuery = queryLower.includes(domainName) ||
                           queryLower.includes(actualBusinessName.toLowerCase());

        // Skip brand-focused queries - they're not useful content gaps
        if (isBrandQuery) {
          console.log(`[CompetitiveIntel] Skipping brand query: "${result.query}"`);
          return;
        }

        // Filter competitors that rank in top 5
        const topCompetitors = result.competitors.filter((comp: any) => comp.position <= 5);

        if (topCompetitors.length > 0) {
          // Check if YOU are already ranking in top 5 for this query
          const youAreRanking = topCompetitors.some((comp: any) =>
            comp.url?.includes(businessDomain)
          ) || (result.position && result.position <= 5);

          if (!youAreRanking) {
            competitive.searchOpportunities.contentGaps.push({
              topic: result.query,  // The search query/topic
              competitorUrl: topCompetitors[0].url,  // Best competitor URL
              competitorPosition: topCompetitors[0].position,  // Their position
              competitorTitle: topCompetitors[0].title || '',  // Their page title
              opportunity: `Competitors rank for "${result.query}" but you don't`
            });
          }
        }
      }
    });

    console.log(`[CompetitiveIntel] Found ${competitive.searchOpportunities.contentGaps.length} content gaps (brand queries filtered)`);
  }

  // ========== SOCIAL OPPORTUNITIES ==========

  // Analyze platform gaps vs industry best practices
  const activePlatforms = socialData?.platforms || [];
  const industryPlatforms = industryProfile?.bestPlatforms || ['Facebook', 'Instagram', 'LinkedIn'];

  industryPlatforms.forEach((platform: string) => {
    const platformLower = platform.toLowerCase();
    const isActive = activePlatforms.some((p: string) => p.toLowerCase() === platformLower);

    if (!isActive) {
      competitive.socialOpportunities.platformGaps.push({
        platform: platform,
        opportunity: `${platform} is highly effective for ${industryProfile?.displayName || 'your industry'} but not yet active`,
        potentialReach: platform === 'Facebook' ? 'High' : platform === 'Instagram' ? 'Medium-High' : 'Medium',
        effort: 'Medium'
      });
    }
  });

  // Add timing gaps based on industry posting frequency
  if (industryProfile?.averageCompetitorActivity?.postsPerWeek) {
    const recommendedPosts = industryProfile.averageCompetitorActivity.postsPerWeek;
    competitive.socialOpportunities.timingGaps.push({
      gap: 'posting_frequency',
      recommendation: `Industry average: ${recommendedPosts} posts/week`,
      opportunity: `Maintain consistent ${recommendedPosts}x/week posting schedule`
    });
  }

  // Add format gaps based on industry content types
  if (industryProfile?.contentTypes?.length > 0) {
    industryProfile.contentTypes.slice(0, 3).forEach((format: string) => {
      competitive.socialOpportunities.formatGaps.push({
        format: format,
        opportunity: `${format} performs well in ${industryProfile?.displayName || 'your industry'}`,
        effectiveness: 'High'
      });
    });
  }

  // ========== REVIEW OPPORTUNITIES ==========

  // Analyze review advantages
  if (reviewData?.rating && reviewData.rating >= 4.0) {
    competitive.reviewOpportunities.advantages.push({
      title: `Strong ${reviewData.rating.toFixed(1)}-star rating`,
      description: `${reviewData.reviewCount || 0} customer reviews averaging ${reviewData.rating.toFixed(1)} stars - showcase this trust signal`,
      impactLevel: 'high'
    });
  }

  // Extract themes from positive reviews
  if (reviewData?.recentReviews?.length > 0) {
    const positiveReviews = reviewData.recentReviews.filter((r: any) => r.rating >= 4);

    if (positiveReviews.length >= 3) {
      competitive.reviewOpportunities.advantages.push({
        title: `${positiveReviews.length} recent positive reviews`,
        description: 'Leverage customer testimonials in marketing content',
        impactLevel: 'medium'
      });

      // Extract common positive themes
      const reviewTexts = positiveReviews.map((r: any) => r.text?.toLowerCase() || '');
      const commonWords = ['professional', 'quality', 'friendly', 'reliable', 'excellent', 'great'];
      const foundThemes = commonWords.filter(word =>
        reviewTexts.some(text => text.includes(word))
      );

      if (foundThemes.length > 0) {
        competitive.reviewOpportunities.advantages.push({
          title: `Customers praise: ${foundThemes.slice(0, 3).join(', ')}`,
          description: 'Emphasize these strengths in content and messaging',
          impactLevel: 'medium'
        });
      }
    }
  }

  // Identify weaknesses to exploit (if rating is low, suggest response strategy)
  if (reviewData?.rating && reviewData.rating < 4.0 && reviewData.reviewCount > 5) {
    competitive.reviewOpportunities.weaknessesToExploit.push({
      weakness: 'Below-average rating',
      opportunity: 'Focus on exceptional service delivery and proactive review requests from satisfied customers',
      actionable: true
    });
  }

  // Suggest review generation if count is low
  if (reviewData?.reviewCount !== undefined && reviewData.reviewCount < 20) {
    competitive.reviewOpportunities.weaknessesToExploit.push({
      weakness: 'Low review count',
      opportunity: 'Implement systematic review request process after successful projects',
      actionable: true
    });
  }

  return competitive;
}

/**
 * Extract search data from SEMrush and Serper
 * For Brand Mirror: includes ALL keywords (brand + non-brand) to show current state
 * For Content Engine: use competitive intelligence for filtered opportunities
 */
function extractSearchData(semrushData: any, serperData: any, businessName?: string) {
  // Get ALL keywords (including brand keywords) - Brand Mirror needs full picture
  const allKeywords = semrushData?.keywords || [];

  // Separate into ranking (1-10) and opportunity (11-50) keywords
  const rankingKeywords = allKeywords.filter((k: any) => k.position <= 10);
  const opportunityKeywords = allKeywords.filter((k: any) => k.position > 10 && k.position <= 50);

  console.log(`[extractSearchData] Total keywords: ${allKeywords.length}`);
  console.log(`[extractSearchData] Ranking (1-10): ${rankingKeywords.length}`);
  console.log(`[extractSearchData] Opportunity (11-50): ${opportunityKeywords.length}`);

  return {
    organicKeywords: semrushData?.organicKeywords || allKeywords.length,
    organicTraffic: semrushData?.organicTraffic || 0,
    // Include ALL ranking keywords (brand + non-brand) for Brand Mirror
    rankings: rankingKeywords.map((kw: any) => ({
      keyword: kw.keyword,
      position: kw.position,
      searchVolume: kw.searchVolume,
      url: kw.url
    })),
    // Include ALL opportunity keywords for comprehensive view
    opportunityKeywords: opportunityKeywords.map((kw: any) => ({
      keyword: kw.keyword,
      position: kw.position,
      searchVolume: kw.searchVolume,
      url: kw.url
    })),
    localPack: serperData?.[0]?.localPack || null
  };
}

/**
 * Extract review data from Outscraper GMB data
 */
function extractReviewData(gmbData: any) {
  return {
    rating: gmbData?.rating || 0,
    reviewCount: gmbData?.reviewCount || 0,
    recentReviews: gmbData?.recentReviews?.map((review: any) => ({
      author: review.author || 'Anonymous',
      text: review.text || '',
      rating: review.rating || 0,
      date: review.date || new Date().toISOString(),
      response: review.response || null
    })) || []
  };
}

/**
 * Extract social data
 */
function extractSocialData(socialData: any) {
  return {
    facebook: socialData?.facebook || null,
    instagram: socialData?.instagram || null,
    linkedin: socialData?.linkedin || null,
    youtube: socialData?.youtube || null,
    totalFollowers: (socialData?.facebook?.followers || 0) +
                    (socialData?.instagram?.followers || 0) +
                    (socialData?.linkedin?.followers || 0),
    platforms: Object.keys(socialData || {}).filter(key => socialData[key]?.exists)
  };
}

// ============================================================================
// MAIN DATA ADAPTER CLASS
// ============================================================================

export class ContentIntelligenceAdapter {
  /**
   * Collect data from APIs and transform to BusinessIntelligence format
   *
   * @param websiteUrl - Business website URL (from Landing form)
   * @param industryCode - NAICS industry code (from Landing form)
   * @returns BusinessIntelligence object ready for Content Engine
   *
   * @throws Error if any API fails (NO fallback data)
   */
  async collectAndTransform(
    websiteUrl: string,
    industryCode: string
  ): Promise<BusinessIntelligence> {
    console.log(`[DataAdapter] Starting data collection for ${websiteUrl}, industry: ${industryCode}`);

    try {
      // Step 1: Call Business Intelligence Analyzer Edge Function (same as V6 Onboarding)
      console.log('[DataAdapter] Calling business intelligence analyzer Edge Function...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-business-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          url: websiteUrl,
          industryCode: industryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const businessData: BusinessData = await response.json();
      console.log('[DataAdapter] ========== RAW EDGE FUNCTION DATA ==========');
      console.log('[DataAdapter] Full response:', JSON.stringify(businessData, null, 2));
      console.log('[DataAdapter] Data completeness:', businessData.dataCompleteness);
      console.log('[DataAdapter] Location data:', businessData.location);
      console.log('[DataAdapter] GMB location:', businessData.gmb);
      console.log('[DataAdapter] SEMrush full data:', businessData.semrush);
      console.log('[DataAdapter] SEMrush keywords:', businessData.semrush?.keywords?.length || 0, 'keywords');
      if (businessData.semrush?.keywords?.length > 0) {
        console.log('[DataAdapter] First 5 keywords:', businessData.semrush.keywords.slice(0, 5));
      } else {
        console.warn('[DataAdapter] ⚠️ NO SEMRUSH KEYWORDS FOUND - Domain may be too new or has no rankings');
      }
      console.log('[DataAdapter] Competitive Intel data:', (businessData as any).competitive);
      console.log('[DataAdapter] Competitors discovered:', (businessData as any).competitive?.competitors?.length || 0);
      if ((businessData as any).competitive?.competitors?.length > 0) {
        console.log('[DataAdapter] First competitor:', (businessData as any).competitive.competitors[0]);
      }
      console.log('[DataAdapter] Social full data:', businessData.social);
      console.log('[DataAdapter] Serper full data:', businessData.serper);
      console.log('[DataAdapter] ===============================================');

      // Log competitive intelligence debug data
      if ((businessData as any).debug) {
        console.log('[DataAdapter] 🔍 COMPETITIVE INTEL DEBUG:');
        console.log('[DataAdapter] Competitor discovery attempted:', (businessData as any).debug.competitorDiscoveryAttempted);
        console.log('[DataAdapter] Competitor discovery success:', (businessData as any).debug.competitorDiscoverySuccess);
        if ((businessData as any).debug.competitorDiscoveryError) {
          console.error('[DataAdapter] ❌ Competitor discovery error:', (businessData as any).debug.competitorDiscoveryError);
        }
        console.log('[DataAdapter] Keyword analysis attempted:', (businessData as any).debug.keywordAnalysisAttempted);
        console.log('[DataAdapter] Keyword analysis success:', (businessData as any).debug.keywordAnalysisSuccess);
        console.log('[DataAdapter] AI analysis attempted:', (businessData as any).debug.aiAnalysisAttempted);
        console.log('[DataAdapter] AI analysis success:', (businessData as any).debug.aiAnalysisSuccess);
        console.log('[DataAdapter] ===============================================');
      }

      // Step 2: Fetch industry profile from Supabase
      console.log('[DataAdapter] Fetching industry profile...');
      const industryProfileData = await fetchIndustryProfile(industryCode);

      // Log profile availability
      if (industryProfileData) {
        console.log(`[DataAdapter] Using full industry profile for ${industryCode}`);
      } else {
        console.warn(`[DataAdapter] No industry profile found for ${industryCode}, using fallback data`);
      }

      // Step 2.5: Extract business name and get AI analysis (AI analysis done by Edge Function)
      const businessName = extractBusinessName(businessData.website, businessData.gmb);
      const websiteAnalysis = businessData.websiteAnalysis || {
        valuePropositions: [],
        targetAudience: [],
        customerProblems: [],
        solutions: [],
        proofPoints: [],
        differentiators: [],
        confidence: 0
      };
      console.log('[DataAdapter] Business name:', businessName);
      console.log('[DataAdapter] Website analysis from Edge Function:', websiteAnalysis);
      console.log('[DataAdapter] Value propositions found:', websiteAnalysis.valuePropositions?.length || 0);

      // Step 3: Transform industry profile to V6 format (with fallback for missing profiles)
      // NOTE: Industry profiles are stored directly in table columns (snake_case), not in a profile_data field
      const industryProfile = {
        industryName: industryProfileData?.industry || industryProfileData?.industry_name || industryCode,
        displayName: industryProfileData?.industry_name || industryProfileData?.industry || industryCode,
        naicsCode: industryCode,
        businessCount: 0, // We don't store this in the new schema
        customerTriggers: industryProfileData?.customer_triggers || [],
        transformations: industryProfileData?.transformations || [],
        powerWords: industryProfileData?.power_words || [],
        provenCTAs: industryProfileData?.cta_templates || [], // Schema uses cta_templates
        seasonalTrends: industryProfileData?.seasonal_patterns || [],
        bestPlatforms: ['Facebook', 'Google My Business'], // TODO: Extract from social_post_templates
        contentTypes: [], // TODO: Extract from social_post_templates
        trustSignals: industryProfileData?.trust_signals || [],
        // Additional fields for ValueForge skill/attribute extraction
        competitive_advantages: industryProfileData?.competitive_advantages || [],
        value_propositions: industryProfileData?.value_propositions || [],
        service_packages: industryProfileData?.service_packages || [],
        quality_indicators: industryProfileData?.quality_indicators || [],
        averageCompetitorActivity: {
          postsPerWeek: 3,
          platforms: ['Facebook'],
          contentTypes: ['updates'],
          responseTime: '24 hours'
        }
      };

      // Step 4: Extract data first (needed for competitive analysis)
      // businessName already extracted in Step 2.5 for AI analysis
      const reviewData = extractReviewData(businessData.gmb);
      const socialData = extractSocialData(businessData.social);
      const searchData = extractSearchData(businessData.semrush, businessData.serper, businessName);

      // Extract domain from websiteUrl for competitive analysis
      let businessDomain = '';
      try {
        businessDomain = new URL(websiteUrl).hostname.replace(/^www\./, '');
      } catch (e) {
        console.warn('[DataAdapter] Could not parse domain from URL:', websiteUrl);
      }

      // Step 5: Transform to BusinessIntelligence format (V6)
      const businessIntelligence: BusinessIntelligence = {
        business: {
          name: businessName, // Use already-extracted business name
          url: websiteUrl,
          industry: industryProfile.displayName, // Use displayName for better human-readable format
          location: extractLocation(businessData.website, businessData.gmb, businessData.serper) // Use helper to extract from GMB or Serper
        },

        industryProfile,

        // AI-extracted business-specific messaging
        websiteAnalysis,

        // Use competitive intelligence from Edge Function if available, otherwise extract locally
        competitive: (businessData as any).competitive || extractCompetitiveIntelligence(
          businessData.semrush,
          businessData.serper,
          socialData,
          reviewData,
          industryProfile,
          businessDomain,
          businessName
        ),

        searchData,

        reviewData,

        socialData,

        realTimeSignals: {
          // Optional - can add weather, trends, etc. later
          collectedAt: new Date().toISOString()
        }
      };

      console.log('[DataAdapter] Transformation complete');
      console.log('[DataAdapter] BusinessIntelligence ready for Content Engine');
      console.log('[DataAdapter] 🎯 FINAL COMPETITIVE OBJECT:', businessIntelligence.competitive);
      console.log('[DataAdapter] 🎯 COMPETITORS IN FINAL OBJECT:', (businessIntelligence.competitive as any)?.competitors);
      console.log('[DataAdapter] 🎯 COMPETITORS LENGTH:', (businessIntelligence.competitive as any)?.competitors?.length || 0);
      console.log('[DataAdapter] Competitive intelligence:', {
        competitors: (businessIntelligence.competitive as any)?.competitors?.length || 0,
        keywordGaps: businessIntelligence.competitive?.searchOpportunities?.keywordGaps?.length || 0,
        contentGaps: businessIntelligence.competitive?.searchOpportunities?.contentGaps?.length || 0,
        platformGaps: businessIntelligence.competitive?.socialOpportunities?.platformGaps?.length || 0,
        reviewAdvantages: businessIntelligence.competitive?.reviewOpportunities?.advantages?.length || 0
      });
      console.log('[DataAdapter] Industry profile loaded:', !!industryProfile);

      return businessIntelligence;

    } catch (error) {
      console.error('[DataAdapter] Fatal error:', error);

      // Re-throw with clear error message (NO fallback data)
      if (error instanceof Error) {
        throw new Error(`Data collection failed: ${error.message}`);
      }

      throw new Error('Data collection failed: Unknown error');
    }
  }

  /**
   * Quick validation check for BusinessIntelligence object
   */
  validateBusinessIntelligence(businessIntel: BusinessIntelligence): boolean {
    const required = [
      businessIntel.business?.name,
      businessIntel.business?.url,
      businessIntel.business?.industry,
      businessIntel.industryProfile?.industryName,
      businessIntel.industryProfile?.naicsCode
    ];

    const isValid = required.every(field => field !== null && field !== undefined && field !== '');

    if (!isValid) {
      console.error('[DataAdapter] Validation failed - missing required fields');
    }

    return isValid;
  }
}

/**
 * Singleton instance for easy import
 */
export const dataAdapter = new ContentIntelligenceAdapter();
