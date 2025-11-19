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
  CustomerProfile
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
  const prompt = `You are an expert market researcher analyzing website content to identify target customer profiles.

Your task: Extract WHO this business serves based on EVIDENCE ONLY.

Business: ${businessName}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. EVIDENCE-ONLY EXTRACTION:
   - ONLY extract customer profiles when you find CLEAR EVIDENCE
   - Evidence = testimonials with job titles, case studies with company info, explicit "we serve..." statements
   - If you find NO clear evidence, return EMPTY profiles array
   - NEVER infer or assume customer types without supporting quotes

2. LOOK FOR EXPLICIT MENTIONS:
   - Job titles/roles: "As a CEO...", "As a marketing director...", "I'm a small business owner..."
   - Industries: "in the healthcare space", "SaaS company", "retail business"
   - Company size: "10-person team", "enterprise", "solo entrepreneur", "startup"
   - Demographics: "homeowner", "parent", "professional", "student"

3. SUPPORTING QUOTES ARE MANDATORY:
   - Every profile MUST have at least 2-3 evidence quotes
   - Quotes must be ACTUAL text from the content (not paraphrased)
   - If you can't find quotes, don't create the profile

4. GROUP SIMILAR CUSTOMERS:
   - If you see 5 testimonials from "marketing directors at SaaS companies", that's ONE profile
   - Don't create separate profiles for each testimonial
   - Look for PATTERNS across multiple data points

5. CONFIDENCE LEVELS:
   - HIGH: Multiple explicit mentions with job titles, industries, company sizes
   - MEDIUM: Some explicit mentions but missing some details
   - LOW: Only vague hints, few quotes, uncertain

6. WHEN TO RETURN EMPTY:
   - No testimonials or case studies
   - No clear customer mentions in content
   - Only generic marketing language ("anyone can use this!")
   - Content focuses on product features, not customers

ANALYSIS CONTENT:
${content}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no explanations):
{
  "profiles": [
    {
      "statement": "Marketing Directors at B2B SaaS companies with 20-100 employees",
      "industry": "B2B SaaS / Technology",
      "company_size": "20-100 employees",
      "role": "Marketing Director / VP Marketing",
      "evidence_quotes": [
        "As a marketing director at a fast-growing SaaS startup, I was drowning in data",
        "I'm responsible for marketing at a 50-person software company",
        "We're a B2B SaaS business serving mid-market companies"
      ],
      "confidence_level": "high",
      "source_sections": ["testimonials", "case_studies"]
    }
  ],
  "overall_confidence": "high | medium | low",
  "data_quality": "excellent | good | fair | poor",
  "warnings": [
    "Only found customer mentions in testimonials, none in main content",
    "Industry information is vague - mostly generic",
    "No explicit company size mentions found"
  ]
}

REMEMBER:
- Empty profiles array is BETTER than guessing
- Quality over quantity - one well-evidenced profile beats three weak ones
- Evidence quotes are MANDATORY
- Never assume or infer - only extract what's explicitly stated`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.2 // Low temperature for factual extraction
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
      // Filter out profiles without evidence quotes
      if (!profile.evidence_quotes || profile.evidence_quotes.length === 0) {
        console.warn('[CustomerExtractor] Skipping profile without evidence quotes:', profile.statement);
        return false;
      }

      // Filter out profiles with low confidence and minimal evidence
      if (profile.confidence_level === 'low' && profile.evidence_quotes.length < 2) {
        console.warn('[CustomerExtractor] Skipping low-confidence profile with insufficient evidence');
        return false;
      }

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
