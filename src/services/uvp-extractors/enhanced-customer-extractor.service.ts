/**
 * Enhanced Customer Extractor with Industry Intelligence
 *
 * Combines website extraction with:
 * - Industry-specific buyer personas
 * - Location-based demographics
 * - Competitive positioning
 * - JTBD framework
 */

import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { getPersonasForIndustry } from '@/data/buyer-personas';
import type { CustomerProfile } from '@/types/uvp-flow.types';
import type { CustomerPersona } from '@/types/buyer-journey';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface EnhancedCustomerExtractionResult {
  profiles: CustomerProfile[];
  industryPersonas: CustomerPersona[];
  locationData?: {
    city: string;
    state: string;
    demographics: string[];
  };
  confidence: {
    overall: number;
    dataQuality: number;
    industryMatch: number;
  };
}

/**
 * Extract customer profiles with industry intelligence
 */
export async function extractEnhancedCustomers(
  websiteContent: string[],
  businessName: string,
  industry: string,
  location?: string
): Promise<EnhancedCustomerExtractionResult> {
  console.log('[EnhancedCustomerExtractor] Starting extraction...');
  console.log(`  - Industry: ${industry}`);
  console.log(`  - Location: ${location || 'Not specified'}`);

  try {
    // Get industry personas
    const industryPersonas = getPersonasForIndustry(industry);
    console.log(`[EnhancedCustomerExtractor] Found ${industryPersonas.length} industry personas`);

    // Note: Industry profile integration can be added later if needed

    // Extract location data if available
    let locationData = undefined;
    if (location) {
      try {
        const locationInfo = await locationDetectionService.detectLocation(location);
        locationData = {
          city: locationInfo.city,
          state: locationInfo.state,
          demographics: [
            `${locationInfo.city} area residents`,
            `Local ${industry.toLowerCase()} market`,
          ],
        };
        console.log('[EnhancedCustomerExtractor] Location data extracted');
      } catch (error) {
        console.log('[EnhancedCustomerExtractor] Location detection failed');
      }
    }

    // Prepare content for analysis
    const contentForAnalysis = websiteContent.join('\n\n');

    // Build enhanced prompt with industry context
    const prompt = `Extract SPECIFIC customer segments from this ${industry} business website.

BUSINESS: ${businessName}
INDUSTRY: ${industry}
${locationData ? `LOCATION: ${locationData.city}, ${locationData.state}` : ''}

WEBSITE CONTENT:
${contentForAnalysis.substring(0, 8000)}

**CRITICAL REQUIREMENTS - EVERY profile MUST have at least ONE of:**
1. LOCATION/GEOGRAPHY: "${locationData?.city || '[City]'} area", "Texas", "Southwest region"
2. INDUSTRY-SPECIFIC: "energy executives", "practice-owning dentists", "Series B founders"
3. NET WORTH/SIZE: "$2M+ net worth", "50-200 employees", "$10M ARR"
4. AGE/STAGE: "45-60 year olds", "pre-retirees", "second-generation owners"
5. TRIGGER EVENT: "recently sold", "post-IPO", "inherited practice"

**BANNED GENERIC TERMS - Reject profiles with:**
- "busy professionals" → MUST specify industry/role
- "successful executives" → MUST specify what industry/level
- "business owners" → MUST specify what kind of business
- "high net worth individuals" → MUST specify how much/industry
- "growing companies" → MUST specify size/industry

**MINE FOR SPECIFICS:**
1. Look for testimonials: Who gave them? What's their title/company?
2. Look for case studies: What industry? What size? What location?
3. Look for "we serve" statements: Extract exact language
4. Look for service pricing: Indicates customer financial level
5. Look for founder story: Often mentions specific customer type

**COMPETITOR TEST:**
Could any competitor use this exact same customer description?
- If YES → Too generic, add specifics or REJECT
- If NO → Good, it's unique to this business

**EXTRACT REAL LANGUAGE:**
Use the EXACT phrases from the website, not your interpretations.
If they say "Houston energy executives", use that exact phrase.
If they say "practice-owning physicians", use that exact phrase.

Return JSON array with 2-4 profiles (quality over quantity):
[
  {
    "id": "unique-id",
    "statement": "SPECIFIC segment with location/industry/size/age detail",
    "industry": "Their specific industry",
    "companySize": "Exact size if B2B",
    "role": "Specific decision-maker role",
    "painPoints": ["specific pain with numbers/details", "not generic anxiety"],
    "goals": ["specific outcome they want", "with timeline or metric"],
    "buyingCriteria": ["how they evaluate"],
    "evidenceQuotes": ["EXACT quotes from website that prove this segment exists"],
    "confidence": {
      "overall": 90 if specific, 40 if generic,
      "dataQuality": based on quote evidence,
      "industryMatch": 0-100
    }
  }
]

**If no specific segments found, return EMPTY ARRAY [] - do NOT invent generic personas.**

Focus on EVIDENCE from the website, not assumptions about the industry.`;

    // Call AI via Supabase edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-opus-4.5',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No response from AI');
    }

    const extractedProfiles = parseCustomerProfiles(analysisText);

    // Merge extracted profiles with industry personas
    const enhancedProfiles = mergeWithIndustryPersonas(
      extractedProfiles,
      industryPersonas
    );

    // Calculate confidence scores
    const confidence = {
      overall: calculateOverallConfidence(enhancedProfiles, industryPersonas),
      dataQuality: websiteContent.length > 0 ? 80 : 40,
      industryMatch: 70,
    };

    return {
      profiles: enhancedProfiles,
      industryPersonas,
      locationData,
      confidence,
    };

  } catch (error) {
    console.error('[EnhancedCustomerExtractor] Extraction failed:', error);

    // Return industry personas as fallback
    const fallbackPersonas = getPersonasForIndustry(industry);
    const fallbackProfiles = fallbackPersonas.map(persona => ({
      id: persona.id,
      statement: `${persona.name}: ${persona.quick_description}`,
      industry: persona.industry,
      evidenceQuotes: [],
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api' as const,
        name: 'Industry Personas',
        url: '',
        extractedAt: new Date(),
        reliability: 60,
        dataPoints: 1
      }],
      confidence: {
        overall: 60,
        dataQuality: 40,
        modelAgreement: 80,
        sourceCount: 1,
      },
      isManualInput: false
    }));

    return {
      profiles: fallbackProfiles,
      industryPersonas: fallbackPersonas,
      confidence: {
        overall: 60,
        dataQuality: 40,
        industryMatch: 80,
      },
    };
  }
}

/**
 * Parse AI response into customer profiles
 */
function parseCustomerProfiles(response: string): CustomerProfile[] {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const profiles = JSON.parse(jsonMatch[0]);

    return profiles.map((p: any) => ({
      id: p.id || `customer-${Date.now()}-${Math.random()}`,
      statement: p.statement || '',
      industry: p.industry,
      companySize: p.companySize,
      role: p.role,
      evidenceQuotes: p.evidenceQuotes || [],
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'website',
        name: 'Website Content',
        url: '',
        extractedAt: new Date(),
        reliability: p.confidence?.overall || 70,
        dataPoints: 1
      }],
      confidence: {
        ...p.confidence || {
          overall: 70,
          dataQuality: 70,
          modelAgreement: 70,
        },
        sourceCount: p.confidence?.sourceCount ?? 1,
      },
      isManualInput: false
    }));
  } catch (error) {
    console.error('[EnhancedCustomerExtractor] Parse error:', error);
    return [];
  }
}

/**
 * Merge extracted profiles with industry personas
 */
function mergeWithIndustryPersonas(
  extractedProfiles: CustomerProfile[],
  industryPersonas: CustomerPersona[]
): CustomerProfile[] {
  // If we have good extracted profiles, use them
  if (extractedProfiles.length >= 3) {
    return extractedProfiles;
  }

  // Otherwise, enhance industry personas with extracted data
  const enhancedProfiles: CustomerProfile[] = [...extractedProfiles];

  // Add industry personas that aren't already covered
  industryPersonas.forEach(persona => {
    const alreadyCovered = extractedProfiles.some(p =>
      p.statement.toLowerCase().includes(persona.name.toLowerCase())
    );

    if (!alreadyCovered && enhancedProfiles.length < 5) {
      enhancedProfiles.push({
        id: persona.id,
        statement: `${persona.name}: ${persona.quick_description}`,
        industry: persona.industry,
        role: persona.demographics.age_range,
        evidenceQuotes: [],
        sources: [{
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'api',
          name: 'Industry Personas',
          url: '',
          extractedAt: new Date(),
          reliability: 75,
          dataPoints: 1
        }],
        confidence: {
          overall: 75,
          dataQuality: 60,
          modelAgreement: 90,
          sourceCount: 1,
        },
        isManualInput: false
      });
    }
  });

  return enhancedProfiles;
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(
  profiles: CustomerProfile[],
  industryPersonas: CustomerPersona[]
): number {
  if (profiles.length === 0) return 0;

  // Higher confidence if profiles match industry patterns
  const matchesIndustry = profiles.some(p =>
    industryPersonas.some(persona =>
      p.statement.toLowerCase().includes(persona.name.toLowerCase())
    )
  );

  const baseConfidence = profiles.reduce((sum, p) => sum + p.confidence.overall, 0) / profiles.length;
  const industryBonus = matchesIndustry ? 10 : 0;

  return Math.min(100, baseConfidence + industryBonus);
}