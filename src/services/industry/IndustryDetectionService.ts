/**
 * ============================================================================
 * INDUSTRY DETECTION SERVICE - NAICS-BASED SUB-INDUSTRY PRECISION
 * ============================================================================
 *
 * Detects the MOST SPECIFIC industry classification possible using:
 * - Exact self-description from website
 * - Industry modifiers (construction, software, healthcare, etc.)
 * - Service signals and patterns
 * - NAICS code mapping with custom sub-industry extensions
 *
 * CRITICAL: Always use customer's EXACT language, not generic categories
 */

import { llmService } from '../llm/LLMService';
import { NAICS_CODES, searchNAICSByKeywords, getNAICSHierarchy, getNAICSCode, type NAICSCode } from '../../data/naics-codes';
import { dynamicNAICSDiscovery } from './DynamicNAICSDiscovery';

export interface IndustryDetection {
  primaryNAICS: string;           // Most specific code (e.g., "541618-CONST")
  industryChain: string[];        // Full hierarchy ["54", "5416", "541618", "541618-CONST"]
  customerLanguage: string;       // EXACTLY what they call themselves
  confidence: number;             // 0-1
  detectionMethod: 'exact' | 'keyword' | 'ai' | 'ai_corrected' | 'keyword_fallback' | 'fallback_needs_confirmation';
}

interface SelfDescription {
  exact?: string;                 // Exact phrase from website
  inferred?: string;              // Inferred from services/content
  source: 'website_text' | 'meta' | 'services' | 'inferred';
}

interface IndustryModifiers {
  modifiers: string[];            // ["construction", "software", etc.]
  confidence: number;
}

export class IndustryDetectionService {

  /**
   * Main entry point - detect MOST SPECIFIC industry
   */
  async detectIndustry(websiteData: any): Promise<IndustryDetection> {
    console.log('[IndustryDetection] Starting precise detection...');

    // Step 1: Extract how THEY describe themselves
    const selfDescription = this.extractSelfDescription(websiteData);
    console.log('[IndustryDetection] Self-description:', selfDescription);

    // Step 2: Extract industry modifiers
    const modifiers = this.extractIndustryModifiers(websiteData);
    console.log('[IndustryDetection] Industry modifiers:', modifiers);

    // Step 3: Analyze service signals
    const serviceSignals = this.analyzeServiceSignals(websiteData);
    console.log('[IndustryDetection] Service signals:', serviceSignals);

    // Step 4: Map to NAICS with sub-industry precision
    const naicsMapping = await this.mapToNAICS(
      selfDescription,
      modifiers,
      serviceSignals,
      websiteData
    );

    console.log('[IndustryDetection] Final detection:', naicsMapping);

    return naicsMapping;
  }

  /**
   * Extract EXACTLY how they describe themselves
   */
  private extractSelfDescription(websiteData: any): SelfDescription {
    const patterns = [
      /we are (?:a|an|the) ([^.,!?]+)/i,
      /leading ([^.,!?]+) (?:firm|company|business)/i,
      /specializing in ([^.,!?]+)/i,
      /your ([^.,!?]+) (?:partner|expert|specialist)/i,
      /([^.,!?]+) (?:services|solutions|consulting)/i,
      /(?:providing|offering) ([^.,!?]+) (?:services|solutions)/i,
    ];

    // Build text sources from actual ScrapedWebsiteData structure
    const textSources = [
      websiteData.content?.h1 || '',
      websiteData.content?.paragraphs?.slice(0, 3).join(' ') || '',
      websiteData.metadata?.description || '',
      websiteData.metadata?.ogDescription || '',
      websiteData.metadata?.title || '',
      websiteData.content?.h2s?.join(' ') || '',
    ];

    // Try to find exact self-description
    for (const text of textSources) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const description = match[1].trim();
          // Filter out generic/vague descriptions
          if (description.length > 3 && !['the best', 'top quality', 'excellent'].includes(description.toLowerCase())) {
            return {
              exact: description,
              source: 'website_text'
            };
          }
        }
      }
    }

    // Try meta description
    const metaDescription = websiteData.metadata?.description || websiteData.metadata?.ogDescription;
    if (metaDescription) {
      const metaMatch = metaDescription.match(/([^.,!?]+) (?:services|consulting|solutions)/i);
      if (metaMatch && metaMatch[1]) {
        return {
          exact: metaMatch[1].trim(),
          source: 'meta'
        };
      }
    }

    // Fallback to inferred from services
    return {
      inferred: this.inferFromServices(websiteData),
      source: 'inferred'
    };
  }

  /**
   * Infer industry from services offered or content
   */
  private inferFromServices(websiteData: any): string {
    // Build text from available content
    const allText = [
      websiteData.content?.h1 || '',
      websiteData.content?.h2s?.join(' ') || '',
      websiteData.content?.paragraphs?.join(' ') || '',
      websiteData.metadata?.description || '',
    ].join(' ').toLowerCase();

    if (!allText) return 'Business Services';

    // Common service patterns
    const servicePatterns = {
      'Construction Consultant': ['project management', 'construction management', 'site supervision'],
      'Software Consultant': ['software development', 'web development', 'app development', 'IT consulting'],
      'Marketing Consultant': ['marketing strategy', 'digital marketing', 'brand strategy', 'SEO'],
      'Financial Consultant': ['financial planning', 'wealth management', 'investment advisory'],
      'HR Consultant': ['recruiting', 'talent acquisition', 'organizational development'],
      'General Contractor': ['home building', 'commercial construction', 'renovation'],
      'Web Designer': ['web design', 'website development', 'UI/UX design'],
      'Restaurant': ['dining', 'food service', 'catering'],
      'Dentist': ['dental care', 'teeth cleaning', 'orthodontics'],
    };

    for (const [industry, patterns] of Object.entries(servicePatterns)) {
      const matches = patterns.filter(p => allText.includes(p.toLowerCase()));
      if (matches.length >= 1) {
        return industry;
      }
    }

    return 'Professional Services';
  }

  /**
   * Extract industry modifiers (construction, software, healthcare, etc.)
   */
  private extractIndustryModifiers(websiteData: any): IndustryModifiers {
    const modifiers: string[] = [];

    // Build all text from scraped content
    const allText = [
      websiteData.content?.h1 || '',
      websiteData.content?.h2s?.join(' ') || '',
      websiteData.content?.paragraphs?.join(' ') || '',
      websiteData.metadata?.description || '',
      websiteData.metadata?.title || '',
    ].join(' ').toLowerCase();

    // GLOBAL FIX: Build comprehensive industry keywords from all NAICS codes
    const industryKeywords = this.buildDynamicIndustryKeywords();

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const count = keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);

      // Threshold: at least 3 mentions to be significant
      if (count >= 3) {
        modifiers.push(industry);
      }
    }

    // Calculate confidence based on how many modifiers found
    const confidence = Math.min(modifiers.length / 2, 1.0);

    return { modifiers, confidence };
  }

  /**
   * GLOBAL FIX: Dynamically build industry keywords from all NAICS codes
   * This prevents one-off fixes for each industry
   */
  private buildDynamicIndustryKeywords(): { [key: string]: string[] } {
    const keywordMap: { [key: string]: Set<string> } = {};

    // Extract keywords from ALL standard NAICS codes (not custom ones)
    for (const naics of NAICS_CODES) {
      if (!naics.isStandard) continue; // Skip custom codes
      if (!naics.keywords || naics.keywords.length === 0) continue;

      // Use parent code as category (e.g., 531xxx → realestate, 621xxx → healthcare)
      const parentCode = naics.parentCode || naics.code.substring(0, 3);

      if (!keywordMap[parentCode]) {
        keywordMap[parentCode] = new Set();
      }

      // Add all keywords from this NAICS code
      naics.keywords.forEach((keyword: string) => {
        if (keyword && keyword.length > 2) {
          keywordMap[parentCode].add(keyword.toLowerCase());
        }
      });
    }

    // Convert Sets to Arrays and add meaningful labels
    const result: { [key: string]: string[] } = {};
    for (const [code, keywords] of Object.entries(keywordMap)) {
      result[code] = Array.from(keywords);
    }

    return result;
  }

  /**
   * GLOBAL FIX: Validate classification and prevent common misclassifications
   * This catches consulting/other defaults and suggests better codes
   */
  private validateClassification(
    code: string,
    customerLanguage: string,
    context: any,
    confidence: number
  ): {
    isValid: boolean;
    reason?: string;
    suggestedCode: string;
    suggestedLanguage: string;
  } {
    const selectedNAICS = getNAICSCode(code);
    if (!selectedNAICS) {
      return {
        isValid: false,
        reason: 'Code not found in database',
        suggestedCode: '999999',
        suggestedLanguage: 'Business Services'
      };
    }

    const parentCode = code.substring(0, 3);
    const isConsulting = parentCode === '541';
    const isOther = selectedNAICS.title.toLowerCase().includes('other');

    // Build context text for keyword matching
    const contextText = [
      context.description || '',
      customerLanguage || '',
      ...(context.modifiers || []),
      ...(context.signals || [])
    ].join(' ').toLowerCase();

    // RULE 0: CRITICAL - Prevent realtor/property manager confusion
    if (code === '531311' || code === '531312') { // Property Manager codes
      // Check if this is actually a realtor/real estate agent
      const realtorKeywords = ['realtor', 'real estate agent', 'real estate broker', 'buyer agent', 'seller agent', 'listing agent', 'home sales', 'property sales'];
      const hasRealtorKeywords = realtorKeywords.some(keyword => contextText.includes(keyword));

      if (hasRealtorKeywords) {
        console.log('[Validation] ⚠️ CRITICAL: Detected property manager code but context suggests realtor!');
        console.log('[Validation] Context:', contextText);
        return {
          isValid: false,
          reason: 'Detected realtor keywords but classified as property manager',
          suggestedCode: '531210',
          suggestedLanguage: 'Real Estate Agent'
        };
      }
    }

    // RULE 1: If consulting or "Other" category, check if there's a better specific code
    if (isConsulting || isOther) {
      console.log('[Validation] Detected consulting/other category, searching for better match...');

      // Search for NAICS codes whose keywords match the context
      const contextKeywords = contextText.split(/\s+/).filter(k => k.length > 2);
      const betterMatches = searchNAICSByKeywords(contextKeywords);

      // Filter out consulting and "Other" codes from better matches
      const specificMatches = betterMatches.filter(match => {
        const matchParent = match.code.substring(0, 3);
        const isConsultingMatch = matchParent === '541';
        const isOtherMatch = match.title.toLowerCase().includes('other');
        return !isConsultingMatch && !isOtherMatch && match.code !== code;
      });

      if (specificMatches.length > 0) {
        const bestMatch = specificMatches[0];
        return {
          isValid: false,
          reason: `${isConsulting ? 'Consulting' : 'Other'} category used when specific code exists`,
          suggestedCode: bestMatch.code,
          suggestedLanguage: bestMatch.title
        };
      }
    }

    // RULE 2: Check for obvious parent code mismatches
    const parentMismatches: { [key: string]: { keywords: string[], correctParent: string, correctCode: string } } = {
      'real estate': { keywords: ['realtor', 'real estate', 'property', 'homes', 'listings', 'MLS'], correctParent: '531', correctCode: '531210' },
      'healthcare': { keywords: ['doctor', 'physician', 'medical', 'patient', 'clinic', 'dental', 'dentist'], correctParent: '621', correctCode: '621111' },
      'insurance': { keywords: ['insurance', 'policy', 'claims', 'underwriting', 'premiums'], correctParent: '524', correctCode: '524210' },
      'retail': { keywords: ['store', 'shop', 'retail', 'merchandise', 'selling products'], correctParent: '44', correctCode: '448110' },
      'restaurant': { keywords: ['restaurant', 'dining', 'food service', 'menu', 'chef'], correctParent: '722', correctCode: '722511' },
      'construction': { keywords: ['contractor', 'construction', 'building', 'remodeling', 'renovation'], correctParent: '236', correctCode: '236220' }
    };

    for (const [industry, data] of Object.entries(parentMismatches)) {
      const hasKeywords = data.keywords.some(kw => contextText.includes(kw));
      const wrongParent = !code.startsWith(data.correctParent);

      if (hasKeywords && wrongParent) {
        const correctNAICS = getNAICSCode(data.correctCode);
        return {
          isValid: false,
          reason: `Clear ${industry} signals but wrong parent code`,
          suggestedCode: data.correctCode,
          suggestedLanguage: correctNAICS?.title || industry
        };
      }
    }

    // RULE 3: Confidence too low with consulting/other (might be a guess)
    if ((isConsulting || isOther) && confidence < 0.75) {
      console.log('[Validation] Low confidence with consulting/other, attempting keyword search...');

      const contextKeywords = contextText.split(/\s+/).filter(k => k.length > 2);
      const keywordMatches = searchNAICSByKeywords(contextKeywords);
      const nonConsultingMatch = keywordMatches.find(match => {
        const matchParent = match.code.substring(0, 3);
        return matchParent !== '541' && !match.title.toLowerCase().includes('other');
      });

      if (nonConsultingMatch) {
        return {
          isValid: false,
          reason: 'Low confidence consulting/other classification with better keyword match available',
          suggestedCode: nonConsultingMatch.code,
          suggestedLanguage: nonConsultingMatch.title
        };
      }
    }

    // Classification is valid
    return {
      isValid: true,
      suggestedCode: code,
      suggestedLanguage: customerLanguage
    };
  }

  /**
   * Analyze services for sub-industry signals
   */
  private analyzeServiceSignals(websiteData: any): string[] {
    const signals: string[] = [];

    // Build text from content
    const allText = [
      websiteData.content?.h1 || '',
      websiteData.content?.h2s?.join(' ') || '',
      websiteData.content?.paragraphs?.slice(0, 5).join(' ') || '',
      websiteData.metadata?.description || '',
    ].join(' ').toLowerCase();

    // Check for specific service patterns
    if (allText.includes('construction') || allText.includes('project management')) {
      signals.push('construction-focused');
    }
    if (allText.includes('software') || allText.includes('development') || allText.includes('IT')) {
      signals.push('software-focused');
    }
    if (allText.includes('healthcare') || allText.includes('medical') || allText.includes('clinical')) {
      signals.push('healthcare-focused');
    }
    if (allText.includes('marketing') || allText.includes('brand') || allText.includes('advertising')) {
      signals.push('marketing-focused');
    }

    return signals;
  }

  /**
   * Map to MOST SPECIFIC NAICS code
   */
  private async mapToNAICS(
    selfDescription: SelfDescription,
    modifiers: IndustryModifiers,
    serviceSignals: string[],
    websiteData: any
  ): Promise<IndustryDetection> {

    const customerLanguage = selfDescription.exact || selfDescription.inferred || 'Business Services';

    // Build context for mapping
    const context = {
      description: customerLanguage,
      modifiers: modifiers.modifiers,
      signals: serviceSignals,
      services: websiteData.services || [],
    };

    // CRITICAL: Use Claude Opus 4.1 for ALL industry detection
    // Keyword matching is unreliable (e.g., "financial advisor" matching to "software consulting")
    // Opus 4.1 is worth the wait for accurate classification
    console.log('[IndustryDetection] Using Claude Opus 4.1 for precise classification...');
    return await this.classifyWithAI(context, customerLanguage);
  }

  /**
   * Match NAICS by keywords (fast method)
   * Searches both static and dynamically discovered codes
   */
  private matchByKeywords(context: any): NAICSCode | null {
    const allKeywords = [
      ...context.modifiers,
      ...context.signals,
      context.description.toLowerCase().split(' ')
    ].filter(k => k.length > 2);

    // First try static codes (faster)
    let matches = searchNAICSByKeywords(allKeywords);

    // If no matches, also search discovered codes
    if (matches.length === 0) {
      const discoveredCodes = dynamicNAICSDiscovery.getAllCodes();
      matches = this.searchKeywordsInCodes(discoveredCodes, allKeywords);
    }

    // Return most specific match (highest level number)
    if (matches.length > 0) {
      return matches.sort((a, b) => b.level - a.level)[0];
    }

    return null;
  }

  /**
   * Search keywords in a list of NAICS codes (helper for discovered codes)
   */
  private searchKeywordsInCodes(codes: NAICSCode[], keywords: string[]): NAICSCode[] {
    const matches: { code: NAICSCode; score: number }[] = [];

    const validKeywords = keywords
      .filter(k => typeof k === 'string' && k.length > 0)
      .map(k => k.toLowerCase());

    if (validKeywords.length === 0) {
      return [];
    }

    for (const naicsCode of codes) {
      if (!naicsCode.keywords || naicsCode.keywords.length === 0) continue;

      let score = 0;
      for (const keyword of validKeywords) {
        for (const naicsKeyword of naicsCode.keywords) {
          const naicsLower = typeof naicsKeyword === 'string' ? naicsKeyword.toLowerCase() : '';
          if (naicsLower.includes(keyword) || keyword.includes(naicsLower)) {
            score++;
          }
        }
      }

      if (score > 0) {
        matches.push({ code: naicsCode, score });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches.map(m => m.code);
  }

  /**
   * AI-powered NAICS classification for sub-industries with strict validation
   */
  private async classifyWithAI(context: any, customerLanguage: string): Promise<IndustryDetection> {
    const prompt = `RETURN FORMAT: You MUST return ONLY a JSON object. NO explanations, NO markdown, NO conversational text.

{
  "code": "NAICS code from list",
  "customerLanguage": "specific industry name",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of code selection and confidence",
  "warnings": ["any concerns"]
}

---

Classify this business into a NAICS code from the provided list.

🚨 CRITICAL RULES:
1. YOU MUST USE A CODE FROM THE LIST BELOW
   - NEVER invent codes (no 999999, no made-up numbers)
   - If perfect match isn't available, use closest broader category

2. PREFER STANDARD CODES OVER CUSTOM CODES
   - Standard codes (like 523930, 621111) are official NAICS classifications
   - Custom codes (like 541618-FIN, 621111-SPEC) are subcategories
   - Only use custom codes if they're significantly better match

3. CHOOSE THE MOST SPECIFIC CODE THAT MATCHES
   - Example: Financial advisor → 523930 (Investment Advice), not 541618-FIN (Financial Consulting)
   - Example: Dentist → 621210 (Offices of Dentists), not 621111 (Offices of Physicians)

4. SET CONFIDENCE BASED ON MATCH QUALITY:
   - 0.90+ = Clear match with strong evidence (DEFAULT - use this unless you're genuinely uncertain)
   - 0.75-0.89 = Good match with minor ambiguity
   - 0.60-0.74 = Acceptable match but consider confirming with user
   - Below 0.60 = Weak match, user MUST be asked to confirm

   🚨 IMPORTANT: Don't be artificially conservative! If you can clearly identify the industry from the evidence, use 0.90+ confidence.

EVIDENCE:
Business describes itself as: "${context.description}"
Industry modifiers: ${context.modifiers.join(', ') || 'none'}
Service signals: ${context.signals.join(', ') || 'none'}
Services: ${context.services.join(', ') || 'none'}

EXAMPLES OF CORRECT CLASSIFICATION:
✅ Real estate agent/realtor → 531210 (Real Estate Agents and Brokers) - 0.95 confidence
✅ Property listings, buying/selling homes → 531210 (Real Estate Agents and Brokers) - 0.95 confidence
✅ Helping clients buy/sell houses → 531210 (Real Estate Agents and Brokers) - 0.95 confidence
✅ Managing rental properties for owners → 531311 (Residential Property Managers) - 0.95 confidence
✅ Financial advisor helping clients → 523930 (Investment Advice) - 0.95 confidence
✅ Consultant advising banks → 541618-FIN (Financial Consulting) - 0.90 confidence
✅ Medical/Healthcare provider → 621111 (Offices of Physicians) - 0.95 confidence
✅ Dental office → 621210 (Offices of Dentists) - 0.95 confidence
✅ Hospital → 622110 (General Medical and Surgical Hospitals) - 0.95 confidence
✅ Law firm → 541110 (Offices of Lawyers) - 0.95 confidence
✅ Contractor → 236220 (Commercial Building Construction) - 0.90 confidence

🏡 REAL ESTATE DISTINCTION (CRITICAL):
⚠️  Real estate has multiple subcategories - choose carefully:
   - 531210 (Real Estate Agents/Brokers): Helps clients BUY/SELL/RENT properties
     Keywords: realtor, real estate agent, property listings, home sales, buyer's agent, seller's agent
     Look for: MLS listings, "helping you find your dream home", commission-based sales

   - 531311 (Residential Property Managers): MANAGES properties on behalf of owners
     Keywords: property management, leasing, tenant relations, maintenance coordination
     Look for: "managing your investment property", tenant screening, rent collection

   If they say "realtor" or "real estate agent" or show property listings → 531210
   If they say "property management" or "managing rentals" → 531311

❌ NEVER DO THIS:
- Return 999999 or any code not in the list
- Invent new codes
- Return codes that don't exist
- Choose custom codes when standard codes fit better
- Default to "Other" categories (like 541990, 541690, 541618) when a specific category exists
- Default to consulting (541xxx) unless they EXPLICITLY provide consulting/advisory services to OTHER BUSINESSES
- Classify realtors/real estate as consulting - they are 531210!
- Classify doctors/dentists as consulting - they are 621xxx!
- Classify retail stores as consulting - they are 44xxxx!
- Classify insurance agents as consulting - they are 524210!
- Be artificially conservative with confidence - if evidence is clear, use 0.90+

🛑 CRITICAL: CONSULTING (541xxx) IS THE MOST OVER-USED WRONG CLASSIFICATION
⚠️  Only use consulting codes (541xxx) when ALL of these are true:
    1. They explicitly advise/consult OTHER BUSINESSES (B2B advisory)
    2. They don't provide direct services (not healthcare, not real estate, not insurance, not retail)
    3. Their primary revenue is from advisory fees, not product sales or direct services
    4. No other specific code exists for their actual industry

Examples of businesses that are NOT consulting:
- Real estate agent selling homes → 531210 (NOT consulting)
- Doctor treating patients → 621111 (NOT consulting)
- Insurance agent selling policies → 524210 (NOT consulting)
- Contractor building houses → 236220 (NOT consulting)
- Lawyer providing legal services → 541110 (this IS a specific professional service code, not general consulting)
- Accountant doing taxes → 541211 (this IS a specific professional service code, not general consulting)

🚨 WHEN IN DOUBT: Search the list for a SPECIFIC code that matches their actual activity
   - DO NOT default to "Other Management Consulting" (541618)
   - DO NOT default to "Other Professional Services" (541990)
   - These are LAST RESORT codes only when no specific code exists

⚠️  COMMON MISTAKES TO AVOID:
- Real estate agents → Use 531210 (Real Estate Agents), NOT 531311 (Property Managers) or consulting
- Property managers → Use 531311 ONLY if they manage rentals for owners, NOT if they sell homes
- Doctors/dentists → Use 621xxx, NOT 541618 or 541990
- Insurance agents → Use 524210, NOT 541618 or 541990
- Retail stores → Use 44xxxx, NOT 541618 or 541990
- Contractors → Use 236xxx, NOT 541618 or 541990
- Restaurants → Use 722xxx, NOT 541618 or 541990

🚨 CRITICAL REAL ESTATE RULE:
   If context contains ANY of these words: "realtor", "real estate agent", "real estate broker", "home sales", "property sales", "listing agent", "buyer's agent", "seller's agent" → MUST be 531210
   Property manager (531311) is ONLY for managing rentals/leases on behalf of property owners

AVAILABLE NAICS CODES (YOU MUST PICK FROM THIS LIST):
${this.getAvailableNAICSList()}

CUSTOMER LANGUAGE INSTRUCTIONS:
Current description: "${customerLanguage}"
You MUST provide a clear, specific industry name (not generic phrases).
The customer language should match what THEY call themselves, not the NAICS title.

Examples:
✅ "Financial Advisor" (what they call themselves)
✅ "Dental Practice" (not "Dental Services")
✅ "Roofing Contractor" (not "Construction Company")
✅ "Primary Care Physician" (not "Healthcare Provider")`;

    try {
      // CRITICAL: Use Claude Opus 4.1 via OpenRouter for industry classification
      const { callOpenRouter } = await import('../../utils/openrouter');
      const openRouterResponse = await callOpenRouter(
        'brand_onboarding', // Uses Claude Opus 4.1
        prompt,
        'Return ONLY the JSON object with no explanation or markdown.'
      );

      if (!openRouterResponse.success || !openRouterResponse.content) {
        throw new Error('Industry classification failed');
      }

      // Parse JSON with robust error handling
      const result = this.parseJSONResponse(openRouterResponse.content);

      // AUTO-DISCOVERY: Check if this NAICS code exists in our database
      let naicsCode = getNAICSCode(result.code);

      if (!naicsCode) {
        console.log(`[IndustryDetection] 🔍 New NAICS code detected: ${result.code} - Auto-discovering...`);

        // Trigger automatic discovery of this new code
        const discoveredCode = await dynamicNAICSDiscovery.discoverAndAddCode({
          description: context.description,
          services: context.services || [],
          industry: result.customerLanguage || customerLanguage,
          websiteUrl: undefined // Could pass this through if available
        });

        if (discoveredCode) {
          naicsCode = discoveredCode;
          console.log(`[IndustryDetection] ✅ Successfully added new NAICS: ${discoveredCode.code} - ${discoveredCode.title}`);
        } else {
          console.warn(`[IndustryDetection] ⚠️ Could not discover code ${result.code}, using fallback`);
        }
      }

      // Validate customerLanguage is not generic
      let finalCustomerLanguage = result.customerLanguage || customerLanguage;

      // List of generic phrases to reject
      const genericPhrases = [
        'business services', 'our team', 'we offer', 'our experienced',
        'providing', 'offering', 'services', 'company', 'firm'
      ];

      const isGeneric = genericPhrases.some(phrase =>
        finalCustomerLanguage.toLowerCase().includes(phrase)
      );

      // If still generic, use the NAICS title
      if (isGeneric || finalCustomerLanguage.length < 5) {
        finalCustomerLanguage = naicsCode?.title || 'Business Services';
        console.log('[IndustryDetection] Rejected generic name, using NAICS title:', finalCustomerLanguage);
      }

      // Use confidence from AI, default to 0.85 if not provided
      const finalConfidence = result.confidence || 0.85;

      // Log warnings if present
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[IndustryDetection] Warnings:', result.warnings);
      }

      // Log reasoning for debugging
      console.log('[IndustryDetection] Classification:', {
        industry: finalCustomerLanguage,
        code: result.code,
        confidence: finalConfidence,
        reasoning: result.reasoning
      });

      // GLOBAL FIX: Validate classification makes sense
      const validation = this.validateClassification(
        result.code,
        finalCustomerLanguage,
        context,
        finalConfidence
      );

      if (!validation.isValid) {
        console.warn('[IndustryDetection] ⚠️ Classification failed validation:', validation.reason);
        console.warn('[IndustryDetection] Original:', result.code, '-', finalCustomerLanguage);
        console.warn('[IndustryDetection] Corrected:', validation.suggestedCode, '-', validation.suggestedLanguage);

        return {
          primaryNAICS: validation.suggestedCode,
          industryChain: getNAICSHierarchy(validation.suggestedCode),
          customerLanguage: validation.suggestedLanguage,
          confidence: Math.max(0.5, finalConfidence - 0.2), // Reduce confidence on correction
          detectionMethod: 'ai_corrected'
        };
      }

      return {
        primaryNAICS: result.code,
        industryChain: getNAICSHierarchy(result.code),
        customerLanguage: finalCustomerLanguage,
        confidence: finalConfidence,
        detectionMethod: 'ai'
      };
    } catch (error) {
      console.error('[IndustryDetection] AI classification failed:', error);

      // GLOBAL FIX: Try keyword-based fallback instead of defaulting to consulting
      console.log('[IndustryDetection] Attempting keyword-based fallback...');

      const contextText = [
        context.description || '',
        customerLanguage || '',
        ...(context.modifiers || []),
        ...(context.signals || [])
      ].join(' ').toLowerCase();

      // Try to find best match using keywords
      const contextKeywords = contextText.split(/\s+/).filter(k => k.length > 2);
      const keywordMatches = searchNAICSByKeywords(contextKeywords);

      // Filter out consulting and "Other" codes
      const specificMatches = keywordMatches.filter(match => {
        const matchParent = match.code.substring(0, 3);
        const isConsulting = matchParent === '541';
        const isOther = match.title.toLowerCase().includes('other');
        return !isConsulting && !isOther;
      });

      if (specificMatches.length > 0) {
        const bestMatch = specificMatches[0];
        console.log('[IndustryDetection] Keyword fallback found:', bestMatch.code, '-', bestMatch.title);

        return {
          primaryNAICS: bestMatch.code,
          industryChain: getNAICSHierarchy(bestMatch.code),
          customerLanguage: bestMatch.title,
          confidence: 0.6, // Lower confidence for keyword-only match
          detectionMethod: 'keyword_fallback'
        };
      }

      // Last resort: Use 999999 (requires user confirmation)
      console.warn('[IndustryDetection] No good fallback found, using generic code');
      return {
        primaryNAICS: '999999',
        industryChain: getNAICSHierarchy('999999'),
        customerLanguage: customerLanguage || 'Business Services',
        confidence: 0.3, // Very low confidence forces user confirmation
        detectionMethod: 'fallback_needs_confirmation'
      };
    }
  }

  /**
   * Parse JSON response from AI (handles markdown, conversational text, etc.)
   */
  private parseJSONResponse(content: string): any {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();

      // Try extracting JSON from markdown code blocks
      const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/) ||
                       cleaned.match(/```\s*([\s\S]*?)\s*```/);

      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      }

      // Try finding JSON object in conversational text
      const jsonObjMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonObjMatch) {
        cleaned = jsonObjMatch[0];
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('[IndustryDetection] Failed to parse JSON:', content.substring(0, 200));
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }
  }

  /**
   * Get list of available NAICS codes for AI prompt
   */
  private getAvailableNAICSList(): string {
    return NAICS_CODES
      .filter(n => n.level >= 6) // Only detailed industries
      .map(n => `- ${n.code}: ${n.title}`)
      .join('\n');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(mapping: any): number {
    // Confidence based on detection method and data quality
    let confidence = 0.5;

    if (mapping.exact) confidence += 0.3;
    if (mapping.modifiers && mapping.modifiers.length > 0) confidence += 0.2;

    return Math.min(confidence, 0.95);
  }
}

// Export singleton
export const industryDetectionService = new IndustryDetectionService();
