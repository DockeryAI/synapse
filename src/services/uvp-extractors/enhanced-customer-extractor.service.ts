/**
 * Enhanced Customer Extractor with Industry Intelligence
 *
 * Combines website extraction with:
 * - Industry-specific buyer personas
 * - Location-based demographics
 * - Competitive positioning
 * - JTBD framework
 */

import { claudeAIService } from '@/services/ai/ClaudeAIService';
import { getIndustryProfile } from '@/services/industry/IndustryProfileGenerator.service';
import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { homeServicesPersonas, healthcarePersonas, restaurantPersonas } from '@/data/buyer-personas';
import type { CustomerProfile } from '@/types/uvp-flow.types';
import type { CustomerPersona } from '@/types/buyer-journey';
import type { IndustryProfileFull } from '@/types/industry-profile.types';

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
 * Get relevant buyer personas for the industry
 */
function getIndustryPersonas(industry: string): CustomerPersona[] {
  const normalizedIndustry = industry.toLowerCase();

  if (normalizedIndustry.includes('home') || normalizedIndustry.includes('repair') ||
      normalizedIndustry.includes('plumb') || normalizedIndustry.includes('hvac')) {
    return homeServicesPersonas;
  }

  if (normalizedIndustry.includes('health') || normalizedIndustry.includes('medical') ||
      normalizedIndustry.includes('dental') || normalizedIndustry.includes('clinic')) {
    return healthcarePersonas;
  }

  if (normalizedIndustry.includes('restaurant') || normalizedIndustry.includes('food') ||
      normalizedIndustry.includes('cafe') || normalizedIndustry.includes('bar')) {
    return restaurantPersonas;
  }

  // Default generic personas
  return [
    {
      id: 'generic-consumer',
      name: 'Individual Consumers',
      avatar_color: '#3b82f6',
      industry: industry,
      quick_description: 'Individuals seeking personal solutions',
      key_traits: ['Value-conscious', 'Quality-focused', 'Convenience-seeking'],
      demographics: {
        age_range: '25-65',
        income_range: '$40k-$150k',
        location_type: 'Various',
      },
      pain_points: [
        'Finding trustworthy providers',
        'Getting fair pricing',
        'Ensuring quality service',
      ],
      goals: [
        'Solve their immediate problem',
        'Get good value for money',
        'Have a positive experience',
      ],
    },
    {
      id: 'generic-business',
      name: 'Business Buyers',
      avatar_color: '#8b5cf6',
      industry: industry,
      quick_description: 'Businesses needing B2B solutions',
      key_traits: ['ROI-focused', 'Process-driven', 'Risk-aware'],
      demographics: {
        age_range: 'N/A',
        income_range: 'Various',
        location_type: 'Commercial',
      },
      pain_points: [
        'Managing vendor relationships',
        'Controlling costs',
        'Ensuring reliability',
      ],
      goals: [
        'Improve operational efficiency',
        'Reduce costs',
        'Minimize disruption',
      ],
    },
  ];
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
    const industryPersonas = getIndustryPersonas(industry);
    console.log(`[EnhancedCustomerExtractor] Found ${industryPersonas.length} industry personas`);

    // Get industry profile for deeper insights
    let industryProfile: IndustryProfileFull | null = null;
    try {
      industryProfile = await getIndustryProfile(industry);
      console.log('[EnhancedCustomerExtractor] Industry profile loaded');
    } catch (error) {
      console.log('[EnhancedCustomerExtractor] Industry profile not available');
    }

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
    const prompt = `Analyze this ${industry} business website to identify their target customers.

BUSINESS: ${businessName}
INDUSTRY: ${industry}
${locationData ? `LOCATION: ${locationData.city}, ${locationData.state}` : ''}

${industryProfile ? `
INDUSTRY INSIGHTS:
- Typical buyers: ${industryProfile.demographic_insights || 'Various demographics'}
- Customer triggers: ${industryProfile.customer_triggers?.slice(0, 3).join(', ') || 'Multiple triggers'}
- Journey stages: ${industryProfile.customer_journey || 'Standard journey'}
` : ''}

WEBSITE CONTENT:
${contentForAnalysis.substring(0, 8000)}

Extract 3-5 specific customer profiles. For each profile:

1. WHO they are (demographics, role, company type)
2. WHAT specific problem they have
3. WHY they need this solution now
4. WHERE they are in their journey
5. HOW they make decisions

Consider:
- Who is mentioned on the website (testimonials, case studies, "we serve")
- Industry-typical buyers for ${industry}
- Local market characteristics ${locationData ? `in ${locationData.city}` : ''}
- Service/product offerings that indicate customer types

Return a JSON array of customer profiles, each with:
{
  "id": "unique-id",
  "statement": "Clear, specific description of this customer segment",
  "industry": "Their industry/sector",
  "companySize": "Size if B2B",
  "role": "Decision maker role",
  "painPoints": ["specific", "pain", "points"],
  "goals": ["what", "they", "want"],
  "buyingCriteria": ["how", "they", "evaluate"],
  "evidenceQuotes": ["quotes from website"],
  "confidence": {
    "overall": 0-100,
    "dataQuality": 0-100,
    "industryMatch": 0-100
  }
}

Focus on REAL customer segments found on the website, not generic personas.`;

    const response = await claudeAIService.generateContent(prompt);
    const extractedProfiles = parseCustomerProfiles(response);

    // Merge extracted profiles with industry personas
    const enhancedProfiles = mergeWithIndustryPersonas(
      extractedProfiles,
      industryPersonas,
      industryProfile
    );

    // Calculate confidence scores
    const confidence = {
      overall: calculateOverallConfidence(enhancedProfiles, industryPersonas),
      dataQuality: websiteContent.length > 0 ? 80 : 40,
      industryMatch: industryProfile ? 90 : 60,
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
    const fallbackProfiles = industryPersonas.map(persona => ({
      id: persona.id,
      statement: `${persona.name}: ${persona.quick_description}`,
      painPoints: persona.pain_points,
      goals: persona.goals,
      demographics: persona.demographics,
      evidenceQuotes: [],
      sources: [{ type: 'industry-profile' as const, url: '' }],
      confidence: {
        overall: 60,
        dataQuality: 40,
        modelAgreement: 80,
      },
    }));

    return {
      profiles: fallbackProfiles,
      industryPersonas,
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
      painPoints: p.painPoints || [],
      goals: p.goals || [],
      buyingCriteria: p.buyingCriteria || [],
      evidenceQuotes: p.evidenceQuotes || [],
      sources: [{ type: 'website' as const, url: '' }],
      confidence: p.confidence || {
        overall: 70,
        dataQuality: 70,
        modelAgreement: 70,
      },
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
  industryPersonas: CustomerPersona[],
  industryProfile: IndustryProfileFull | null
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
        painPoints: persona.pain_points,
        goals: persona.goals,
        demographics: persona.demographics,
        evidenceQuotes: [],
        sources: [{ type: 'industry-profile' as const, url: '' }],
        confidence: {
          overall: 75,
          dataQuality: 60,
          modelAgreement: 90,
        },
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