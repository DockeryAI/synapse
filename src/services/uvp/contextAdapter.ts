/**
 * Context Adapter
 *
 * Transforms cached business intelligence data into ValueForgeContext
 */

import type { ValueForgeContext } from '@/types/valueForge';

export function adaptToValueForgeContext(businessIntel: any): ValueForgeContext {
  // Handle both camelCase and snake_case for backwards compatibility
  const industryProfile = businessIntel.industryProfile || businessIntel.industry_profile || {};

  // Handle both transformed structure (from MARBAAnalysis) and original structure (from dataAdapter)
  // Transformed structure uses: industry (name) and subIndustry (NAICS code)
  // Original structure uses: industryName/displayName and naicsCode
  const industryCode = industryProfile.subIndustry || industryProfile.naicsCode || businessIntel.industryCode || businessIntel.industry_code || '';
  const industryName = industryProfile.industry || industryProfile.industryName || industryProfile.displayName || businessIntel.industryName || '';

  console.log('[ContextAdapter] Debug:', {
    hasIndustryProfile: !!industryProfile,
    profileKeys: Object.keys(industryProfile),
    extractedCode: industryCode,
    extractedName: industryName,
    // Show which properties were found
    foundProperties: {
      subIndustry: industryProfile.subIndustry,
      industry: industryProfile.industry,
      naicsCode: industryProfile.naicsCode,
      industryName: industryProfile.industryName,
      displayName: industryProfile.displayName
    }
  });

  return {
    businessIntel,
    analysis: businessIntel,
    industryProfile: industryProfile,
    businessName: businessIntel.business?.name || '',
    businessUrl: businessIntel.business?.url || '',
    industryCode: industryCode,
    industryName: industryName,
    detectedArchetype: businessIntel.voice_archetype?.id || businessIntel.voiceArchetype?.id,
    detectedValueProps: businessIntel.website_analysis?.value_propositions || businessIntel.websiteAnalysis?.valuePropositions || [],
    detectedDifferentiators: businessIntel.website_analysis?.differentiators || businessIntel.websiteAnalysis?.differentiators || [],
    competitiveGaps: businessIntel.competitive
  };
}
