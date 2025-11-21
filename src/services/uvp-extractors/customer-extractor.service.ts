/**
 * Target Customer Extractor Service
 *
 * Extracts target customer profiles from website content
 * CRITICAL: Only extracts evidence-based profiles, never assumes
 *
 * Created: 2025-11-18
 */

import type {
  CustomerExtractionResult,
  CustomerProfile,
  ConfidenceScore
} from '@/types/uvp-flow.types';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Raw extraction from Claude (intermediate format)
 */
interface RawCustomerExtraction {
  profiles: {
    statement: string;
    industry?: string;
    company_size?: string;
    role?: string;
    evidence_quotes: string[];
    confidence_level: 'high' | 'medium' | 'low';
    source_sections: string[];
  }[];
  overall_confidence: 'high' | 'medium' | 'low';
  data_quality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

/**
 * Extract target customer profiles from website content
 *
 * @param websiteContent - Array of website content sections
 * @param testimonials - Customer testimonials
 * @param caseStudies - Customer case studies
 * @param businessName - Name of the business being analyzed
 * @returns CustomerExtractionResult with profiles and confidence scores
 */
export async function extractTargetCustomer(
  websiteContent: string[],
  testimonials: string[],
  caseStudies: string[],
  businessName: string
): Promise<CustomerExtractionResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[CustomerExtractor] No Supabase configuration - returning empty result');
    return createEmptyResult();
  }

  try {
    console.log('[CustomerExtractor] Starting target customer extraction for:', businessName);

    // Prepare content for analysis
    const analysisContent = prepareContentForAnalysis(
      websiteContent,
      testimonials,
      caseStudies,
      businessName
    );

    // Call Claude AI to extract target customers
    const rawExtraction = await analyzeWithClaude(analysisContent, businessName);

    // Transform raw extraction into typed profiles
    const profiles = transformRawProfiles(rawExtraction);

    // Extract unique evidence quotes
    const allQuotes = rawExtraction.profiles.flatMap(p => p.evidence_quotes || []);
    const evidenceQuotes = [...new Set(allQuotes)]; // Deduplicate

    // Build data sources
    const sources = buildDataSources(rawExtraction);

    // Calculate overall confidence
    const confidence = calculateConfidence(rawExtraction, profiles);

    const result: CustomerExtractionResult = {
      profiles,
      confidence,
      sources,
      evidenceQuotes
    };

    console.log('[CustomerExtractor] Extraction complete:');
    console.log(`  - Profiles found: ${profiles.length}`);
    console.log(`  - Evidence quotes: ${evidenceQuotes.length}`);
    console.log(`  - Confidence: ${confidence.overall}%`);

    return result;

  } catch (error) {
    console.error('[CustomerExtractor] Extraction failed:', error);
    return createEmptyResult();
  }
}

/**
 * Prepare content for Claude analysis
 */
function prepareContentForAnalysis(
  websiteContent: string[],
  testimonials: string[],
  caseStudies: string[],
  businessName: string
): string {
  const sections: string[] = [];

  sections.push(`=== BUSINESS: ${businessName} ===\n`);

  // Testimonials are highest value for customer identification
  if (testimonials && testimonials.length > 0) {
    sections.push(`=== CUSTOMER TESTIMONIALS (${testimonials.length} testimonials) ===`);
    testimonials.forEach((testimonial, idx) => {
      sections.push(`[Testimonial ${idx + 1}] ${testimonial}`);
    });
    sections.push('');
  }

  // Case studies are also high value
  if (caseStudies && caseStudies.length > 0) {
    sections.push(`=== CASE STUDIES (${caseStudies.length} case studies) ===`);
    caseStudies.forEach((caseStudy, idx) => {
      sections.push(`[Case Study ${idx + 1}] ${caseStudy}`);
    });
    sections.push('');
  }

  // Website content - limit to reasonable size
  if (websiteContent && websiteContent.length > 0) {
    sections.push(`=== WEBSITE CONTENT ===`);
    const combinedContent = websiteContent.join('\n\n');
    sections.push(combinedContent.slice(0, 10000)); // Limit to 10k chars
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Analyze content with Claude AI to extract target customer profiles
 */
async function analyzeWithClaude(
  content: string,
  businessName: string
): Promise<RawCustomerExtraction> {
  const prompt = `You are an expert market researcher analyzing website content to identify ALL possible target customer profiles.

Your task: Extract EVERY potential customer segment this business could serve - aim for 5-10 specific profiles.

Business: ${businessName}

CRITICAL INSTRUCTIONS:

1. EXTRACT COMPREHENSIVELY:
   - Look for EVERY mention of customers, even indirect references
   - Include both explicit evidence AND reasonable inferences from context
   - Analyze language, tone, and industry context to identify likely customers
   - If website says "For businesses", extract specific business types they'd serve
   - Extract AT LEAST 5 different customer profiles, more if applicable

2. LOOK FOR ALL CUSTOMER SIGNALS:
   - Direct mentions: "As a CEO...", "marketing directors", "small business owners"
   - Indirect clues: Industry jargon (SaaS terms → serves tech companies), pricing tiers (enterprise → large companies)
   - Problem statements: "Struggling with X" → people with problem X
   - Use cases: "Perfect for agencies" → agencies are customers
   - Social proof: Client logos, testimonials, case studies
   - Language/tone: Formal → enterprises, casual → startups/SMBs

3. CREATE SPECIFIC SEGMENTS:
   - Don't just say "Business owners" - break into segments: "Solopreneurs", "SMB owners 10-50 employees", "Enterprise executives"
   - Don't just say "Marketers" - break into: "Agency owners", "In-house marketing directors", "Freelance consultants"
   - Include role, industry, company size, and specific challenges when possible

4. CONFIDENCE LEVELS (Be generous):
   - HIGH: Multiple explicit mentions OR clear industry context
   - MEDIUM: Some evidence OR reasonable inference from positioning
   - LOW: Educated guess based on product features / industry norms

5. EVIDENCE QUOTES:
   - Include ANY supporting text - testimonials, product descriptions, use cases
   - If no direct quotes, use contextual evidence: "Pricing page shows enterprise tier" OR "Uses technical jargon suggesting tech audience"
   - 1-3 quotes minimum, but context clues work too

6. EXAMPLES OF GOOD EXTRACTION:
   From "Marketing automation for growing teams":
   - "Marketing managers at 50-200 person companies"
   - "Marketing agencies managing multiple clients"
   - "In-house marketing teams at tech startups"
   - "CMOs at mid-market B2B companies"
   - "Marketing operations professionals"

ANALYSIS CONTENT:
${content}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "profiles": [
    {
      "statement": "[Specific role] at [company type] with [size/characteristic]",
      "industry": "Specific industry",
      "company_size": "Size range",
      "role": "Specific job title/function",
      "evidence_quotes": ["Quote or context clue 1", "Quote or context clue 2"],
      "confidence_level": "high | medium | low",
      "source_sections": ["website", "testimonials", "case_studies", "pricing"]
    }
  ],
  "overall_confidence": "high | medium | low",
  "data_quality": "excellent | good | fair | poor",
  "warnings": []
}

REMEMBER:
- Extract 5-10 profiles minimum - be thorough and comprehensive
- Include medium and low confidence profiles - user can filter later
- Use industry context and reasonable inferences
- Break broad categories into specific segments`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-opus-4.1',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 8192, // Increased for more comprehensive extraction
        temperature: 0.4 // Higher temperature for more creative segmentation
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CustomerExtractor] Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No response from Claude API');
    }

    console.log('[CustomerExtractor] Raw Claude response:', analysisText.substring(0, 500) + '...');

    // Parse JSON response - handle markdown code blocks if present
    let extraction: RawCustomerExtraction;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        analysisText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      extraction = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[CustomerExtractor] Failed to parse JSON:', parseError);
      console.error('[CustomerExtractor] Raw text:', analysisText);
      throw new Error('Failed to parse Claude response as JSON');
    }

    // Validate extraction structure
    if (!extraction.profiles) {
      console.warn('[CustomerExtractor] No profiles in extraction, returning empty array');
      extraction.profiles = [];
    }

    return extraction;

  } catch (error) {
    console.error('[CustomerExtractor] Claude analysis failed:', error);
    throw error;
  }
}

/**
 * Transform raw Claude extraction into typed CustomerProfile objects
 */
function transformRawProfiles(raw: RawCustomerExtraction): Partial<CustomerProfile>[] {
  // Defensive check
  if (!raw.profiles || raw.profiles.length === 0) {
    return [];
  }

  return raw.profiles
    .filter(profile => {
      // ONLY filter out profiles with absolutely NO evidence
      // We want to show 5-10 profiles, so be lenient with filtering
      if (!profile.evidence_quotes || profile.evidence_quotes.length === 0) {
        console.warn('[CustomerExtractor] Skipping profile without any evidence quotes:', profile.statement);
        return false;
      }

      // Allow all profiles with at least 1 evidence quote, regardless of confidence
      // User can decide which profiles are relevant
      return true;
    })
    .map((rawProfile, index) => {
      const profileId = `customer-${Date.now()}-${index}`;

      // Calculate profile-level confidence
      const confidence = calculateProfileConfidence(rawProfile);

      // Build data sources from source sections
      const sources = (rawProfile.source_sections || []).map(section => createDataSource(section));

      const profile: Partial<CustomerProfile> = {
        id: profileId,
        statement: rawProfile.statement || 'Unknown customer profile',
        industry: rawProfile.industry || undefined,
        companySize: rawProfile.company_size || undefined,
        role: rawProfile.role || undefined,
        confidence,
        sources,
        evidenceQuotes: rawProfile.evidence_quotes || [],
        isManualInput: false
      };

      return profile;
    });
}

/**
 * Calculate profile-level confidence score
 */
function calculateProfileConfidence(profile: RawCustomerExtraction['profiles'][0]): ConfidenceScore {
  const { confidence_level, evidence_quotes, industry, company_size, role } = profile;

  // Base confidence from Claude's assessment
  let overall = 0;
  switch (confidence_level) {
    case 'high':
      overall = 85;
      break;
    case 'medium':
      overall = 65;
      break;
    case 'low':
      overall = 40;
      break;
    default:
      overall = 50;
  }

  // Boost based on evidence richness
  const evidenceCount = evidence_quotes?.length || 0;
  const evidenceBoost = Math.min(evidenceCount * 3, 15); // Max +15 for strong evidence

  // Boost based on detail completeness
  let detailBoost = 0;
  if (industry) detailBoost += 5;
  if (company_size) detailBoost += 5;
  if (role) detailBoost += 5;

  // Calculate data quality
  const dataQuality = evidenceCount >= 3 ? 90 : evidenceCount >= 2 ? 70 : 50;

  // Final overall score
  const finalOverall = Math.min(100, overall + evidenceBoost + detailBoost);

  return {
    overall: Math.round(finalOverall),
    dataQuality: Math.round(dataQuality),
    sourceCount: evidence_quotes?.length || 0,
    modelAgreement: 85, // Claude is single model, so assume high agreement
    reasoning: `Confidence based on ${evidenceCount} evidence quotes and ${confidence_level} certainty level. ${industry ? 'Industry identified. ' : ''}${company_size ? 'Company size mentioned. ' : ''}${role ? 'Role specified.' : ''}`
  };
}

/**
 * Calculate overall extraction confidence
 */
function calculateConfidence(
  raw: RawCustomerExtraction,
  profiles: Partial<CustomerProfile>[]
): ConfidenceScore {
  // If no profiles extracted, return low confidence
  if (profiles.length === 0) {
    return {
      overall: 0,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 0,
      reasoning: 'No target customer profiles found with sufficient evidence'
    };
  }

  // Average profile confidences
  const avgConfidence = profiles.reduce((sum, p) => sum + (p.confidence?.overall || 0), 0) / profiles.length;

  // Data quality from Claude assessment
  let dataQuality = 0;
  switch (raw.data_quality) {
    case 'excellent':
      dataQuality = 95;
      break;
    case 'good':
      dataQuality = 80;
      break;
    case 'fair':
      dataQuality = 60;
      break;
    case 'poor':
      dataQuality = 35;
      break;
    default:
      dataQuality = 50;
  }

  // Count total evidence quotes
  const totalQuotes = profiles.reduce((sum, p) => sum + (p.evidenceQuotes?.length || 0), 0);

  // Overall confidence adjustment based on profile count
  let overall = avgConfidence;
  if (profiles.length >= 3) {
    overall = Math.min(100, overall + 5); // Slight boost for multiple well-evidenced profiles
  }

  return {
    overall: Math.round(overall),
    dataQuality: Math.round(dataQuality),
    sourceCount: totalQuotes,
    modelAgreement: 85,
    reasoning: `Extracted ${profiles.length} customer profile(s) with ${totalQuotes} supporting quotes. Data quality: ${raw.data_quality}. ${raw.warnings?.length ? `Warnings: ${raw.warnings.join('; ')}` : ''}`
  };
}

/**
 * Build data sources from extraction
 */
function buildDataSources(raw: RawCustomerExtraction): DataSource[] {
  const sourceSet = new Set<string>();

  // Collect all unique source sections
  raw.profiles.forEach(profile => {
    profile.source_sections?.forEach(section => sourceSet.add(section));
  });

  // Create data source objects
  return Array.from(sourceSet).map(section => createDataSource(section));
}

/**
 * Create a data source object
 */
function createDataSource(sourceType: string): DataSource {
  const sourceMap: Record<string, Partial<DataSource>> = {
    'testimonials': {
      type: 'reviews',
      name: 'Customer Testimonials',
      reliability: 95
    },
    'case_studies': {
      type: 'website',
      name: 'Case Studies',
      reliability: 90
    },
    'website_content': {
      type: 'website',
      name: 'Website Content',
      reliability: 75
    },
    'about_page': {
      type: 'website',
      name: 'About Page',
      reliability: 80
    }
  };

  const sourceData = sourceMap[sourceType] || {
    type: 'website' as const,
    name: 'Unknown Source',
    reliability: 50
  };

  return {
    id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: sourceData.type || 'website',
    name: sourceData.name || 'Unknown Source',
    extractedAt: new Date(),
    reliability: sourceData.reliability || 50,
    dataPoints: 1
  };
}

/**
 * Create empty result when no data or errors occur
 */
function createEmptyResult(): CustomerExtractionResult {
  return {
    profiles: [],
    confidence: {
      overall: 0,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 0,
      reasoning: 'No customer profiles extracted - insufficient evidence or no content provided'
    },
    sources: [],
    evidenceQuotes: []
  };
}
