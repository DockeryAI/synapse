/**
 * SIMPLE INDUSTRY DETECTION
 *
 * Philosophy: Make the common cases fast and obvious.
 * Use keyword matching for 95% of cases, AI only for truly unclear situations.
 * NO NAICS CODES - just simple, human-readable industry names.
 */

import { callOpenRouter } from '../../utils/openrouter';

interface IndustryPattern {
  keywords: string[];
  industryName: string;
  confidence: number;
}

interface IndustryResult {
  industry: string;
  confidence: number;
  method: 'domain_match' | 'keyword_match' | 'single_keyword' | 'ai_detection' | 'fallback';
  needsConfirmation: boolean;
}

export class SimpleIndustryDetection {

  // Top 100 most common small businesses
  private readonly OBVIOUS_PATTERNS: Record<string, IndustryPattern> = {
    // IT & Technology
    'IT Services': {
      keywords: ['managed it', 'it support', 'help desk', 'technology services', 'it solutions', 'computer support', 'tech support', 'it consulting', 'managed service provider', 'msp'],
      industryName: 'IT Services & Support',
      confidence: 0.95
    },
    'Cybersecurity': {
      keywords: ['cybersecurity', 'cyber security', 'cyberstreams', 'network security', 'data protection', 'security operations', 'threat detection', 'security monitoring', 'information security'],
      industryName: 'Cybersecurity Services',
      confidence: 0.95
    },
    'Software Development': {
      keywords: ['software development', 'app development', 'custom software', 'programming', 'web development', 'mobile apps', 'software engineering'],
      industryName: 'Software Development',
      confidence: 0.95
    },

    // Healthcare
    'Dental Practice': {
      keywords: ['dental', 'dentist', 'teeth', 'oral health', 'orthodontic', 'dental office', 'dental care'],
      industryName: 'Dental Practice',
      confidence: 0.95
    },
    'Medical Practice': {
      keywords: ['medical practice', 'physician', 'doctor office', 'primary care', 'family medicine', 'medical clinic'],
      industryName: 'Medical Practice',
      confidence: 0.95
    },
    'Chiropractic': {
      keywords: ['chiropractor', 'chiropractic', 'spinal', 'adjustment', 'spine care'],
      industryName: 'Chiropractic Care',
      confidence: 0.95
    },

    // Real Estate
    'Real Estate Agent': {
      keywords: ['real estate agent', 'realtor', 'real estate broker', 'home sales', 'property sales', 'listing agent', 'buyer agent', 'seller agent', 'homes for sale', 'properties for sale'],
      industryName: 'Real Estate Agent',
      confidence: 0.95
    },
    'Property Management': {
      keywords: ['property management', 'property manager', 'rental management', 'tenant screening', 'lease management', 'managing rentals'],
      industryName: 'Property Management',
      confidence: 0.95
    },

    // Construction & Trades
    'Roofing': {
      keywords: ['roofing', 'roof repair', 'shingles', 'roof replacement', 'roofer', 'roof installation'],
      industryName: 'Roofing Contractor',
      confidence: 0.95
    },
    'Plumbing': {
      keywords: ['plumbing', 'plumber', 'pipes', 'drain', 'water heater', 'pipe repair'],
      industryName: 'Plumbing Services',
      confidence: 0.95
    },
    'HVAC': {
      keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac repair', 'hvac contractor'],
      industryName: 'HVAC Services',
      confidence: 0.95
    },
    'Electrical': {
      keywords: ['electrician', 'electrical contractor', 'wiring', 'electrical repair', 'electrical services'],
      industryName: 'Electrical Contractor',
      confidence: 0.95
    },

    // Professional Services
    'Law Firm': {
      keywords: ['law firm', 'attorney', 'lawyer', 'legal services', 'law office', 'legal representation'],
      industryName: 'Law Firm',
      confidence: 0.95
    },
    'Accounting': {
      keywords: ['accounting', 'accountant', 'cpa', 'bookkeeping', 'tax preparation', 'tax services'],
      industryName: 'Accounting Services',
      confidence: 0.95
    },
    'Financial Advisor': {
      keywords: ['financial advisor', 'financial planning', 'wealth management', 'investment advisor', 'financial planner'],
      industryName: 'Financial Advisory',
      confidence: 0.95
    },

    // Food & Hospitality
    'Restaurant': {
      keywords: ['restaurant', 'dining', 'menu', 'cuisine', 'bistro', 'cafe', 'eatery', 'food service'],
      industryName: 'Restaurant',
      confidence: 0.95
    },
    'Bakery': {
      keywords: ['bakery', 'baker', 'bread', 'pastries', 'cakes', 'baked goods'],
      industryName: 'Bakery',
      confidence: 0.95
    },
    'Catering': {
      keywords: ['catering', 'event food', 'party catering', 'corporate catering', 'catering service'],
      industryName: 'Catering Services',
      confidence: 0.95
    },

    // Personal Services
    'Hair Salon': {
      keywords: ['salon', 'hair salon', 'haircut', 'hairstylist', 'beauty salon', 'hair care'],
      industryName: 'Hair Salon',
      confidence: 0.95
    },
    'Auto Repair': {
      keywords: ['auto repair', 'mechanic', 'car repair', 'automotive repair', 'oil change', 'auto service'],
      industryName: 'Auto Repair',
      confidence: 0.95
    },
    'Cleaning Service': {
      keywords: ['cleaning service', 'house cleaning', 'maid service', 'janitorial', 'commercial cleaning', 'office cleaning'],
      industryName: 'Cleaning Services',
      confidence: 0.95
    },
    'Landscaping': {
      keywords: ['landscaping', 'lawn care', 'lawn service', 'gardening', 'landscape design'],
      industryName: 'Landscaping Services',
      confidence: 0.95
    },

    // Insurance
    'Insurance Agent': {
      keywords: ['insurance agent', 'insurance broker', 'insurance services', 'insurance agency', 'insurance coverage'],
      industryName: 'Insurance Services',
      confidence: 0.95
    },

    // Marketing
    'Marketing Agency': {
      keywords: ['marketing agency', 'digital marketing', 'marketing services', 'advertising agency', 'brand strategy'],
      industryName: 'Marketing Agency',
      confidence: 0.95
    }
  };

  /**
   * SIMPLE DETECTION - Check obvious patterns first
   */
  async detect(websiteUrl: string, websiteContent: any): Promise<IndustryResult> {

    // Extract text content from various sources
    const contentText = this.extractContentText(websiteContent);
    const domain = websiteUrl.toLowerCase();
    const content = contentText.toLowerCase();

    console.log('[SimpleDetection] Starting detection for:', websiteUrl);
    console.log('[SimpleDetection] Content length:', content.length);

    // Step 1: Check domain name for super obvious clues
    const domainResult = this.checkDomain(domain);
    if (domainResult) {
      console.log('[SimpleDetection] ✅ Domain match:', domainResult.industry);
      return domainResult;
    }

    // Step 2: Check content for keyword patterns (multiple matches)
    const multiKeywordResult = this.checkMultipleKeywords(content);
    if (multiKeywordResult) {
      console.log('[SimpleDetection] ✅ Multiple keyword match:', multiKeywordResult.industry);
      return multiKeywordResult;
    }

    // Step 3: Single strong keyword match
    const singleKeywordResult = this.checkSingleKeyword(content);
    if (singleKeywordResult) {
      console.log('[SimpleDetection] ✅ Single keyword match:', singleKeywordResult.industry);
      return singleKeywordResult;
    }

    // Step 4: ONLY if no keywords match, use AI
    console.log('[SimpleDetection] ⚠️ No keyword match - asking AI...');
    return await this.detectWithAI(websiteContent);
  }

  /**
   * Extract text from website content object
   */
  private extractContentText(websiteContent: any): string {
    const parts: string[] = [];

    if (websiteContent.metadata?.title) parts.push(websiteContent.metadata.title);
    if (websiteContent.metadata?.description) parts.push(websiteContent.metadata.description);
    if (websiteContent.metadata?.ogTitle) parts.push(websiteContent.metadata.ogTitle);
    if (websiteContent.metadata?.ogDescription) parts.push(websiteContent.metadata.ogDescription);

    if (websiteContent.content?.h1) parts.push(websiteContent.content.h1);
    if (websiteContent.content?.h2s) parts.push(...websiteContent.content.h2s);
    if (websiteContent.content?.paragraphs) parts.push(...websiteContent.content.paragraphs.slice(0, 20));

    if (websiteContent.services) parts.push(...websiteContent.services);
    if (websiteContent.description) parts.push(websiteContent.description);

    return parts.join(' ');
  }

  /**
   * Check domain for super obvious matches
   */
  private checkDomain(domain: string): IndustryResult | null {
    // Special cases for super obvious domains
    if (domain.includes('dental') || domain.includes('dentist')) {
      return this.createResult('Dental Practice', 0.99, 'domain_match');
    }
    if (domain.includes('cyber') || domain.includes('cyberstream')) {
      return this.createResult('Cybersecurity Services', 0.99, 'domain_match');
    }
    if (domain.includes('tech') && !domain.includes('architect')) {
      return this.createResult('IT Services & Support', 0.95, 'domain_match');
    }
    if (domain.includes('roof')) {
      return this.createResult('Roofing Contractor', 0.95, 'domain_match');
    }
    if (domain.includes('law') || domain.includes('attorney') || domain.includes('lawyer')) {
      return this.createResult('Law Firm', 0.95, 'domain_match');
    }
    if (domain.includes('realty') || domain.includes('realtor')) {
      return this.createResult('Real Estate Agent', 0.95, 'domain_match');
    }

    return null;
  }

  /**
   * Check for multiple keyword matches (high confidence)
   */
  private checkMultipleKeywords(content: string): IndustryResult | null {
    for (const [industryKey, pattern] of Object.entries(this.OBVIOUS_PATTERNS)) {
      const matches = pattern.keywords.filter(keyword =>
        content.includes(keyword.toLowerCase())
      );

      // Multiple keyword matches OR same keyword appears multiple times
      if (matches.length >= 2) {
        console.log(`[SimpleDetection] Found ${matches.length} keywords for ${pattern.industryName}:`, matches);
        return this.createResult(
          pattern.industryName,
          pattern.confidence,
          'keyword_match'
        );
      }

      // Same keyword multiple times (strong signal)
      if (matches.length === 1) {
        const keyword = matches[0];
        const firstIndex = content.indexOf(keyword);
        const lastIndex = content.lastIndexOf(keyword);
        if (firstIndex !== lastIndex) {
          console.log(`[SimpleDetection] Keyword "${keyword}" appears multiple times for ${pattern.industryName}`);
          return this.createResult(
            pattern.industryName,
            pattern.confidence,
            'keyword_match'
          );
        }
      }
    }

    return null;
  }

  /**
   * Check for single strong keyword match (medium confidence)
   */
  private checkSingleKeyword(content: string): IndustryResult | null {
    for (const [industryKey, pattern] of Object.entries(this.OBVIOUS_PATTERNS)) {
      const match = pattern.keywords.find(keyword => content.includes(keyword.toLowerCase()));
      if (match) {
        console.log(`[SimpleDetection] Single keyword match: "${match}" for ${pattern.industryName}`);
        return this.createResult(
          pattern.industryName,
          0.85, // Lower confidence for single match
          'single_keyword'
        );
      }
    }

    return null;
  }

  /**
   * Use AI to detect industry (for non-obvious cases)
   */
  private async detectWithAI(websiteContent: any): Promise<IndustryResult> {
    console.log('[SimpleDetection] Using AI for detection...');

    const contentText = this.extractContentText(websiteContent);
    const prompt = `You are an expert at identifying business types.

Look at this website content and tell me what industry this business is in.

Website content:
${contentText.substring(0, 2000)}

Respond with ONLY the industry name. Be specific but concise.
Examples: "Cybersecurity Services", "Dental Practice", "Real Estate Agent", "HVAC Services"

Industry:`;

    try {
      const response = await callOpenRouter('brand_onboarding', prompt, {
        max_tokens: 50,
        temperature: 0.1
      });

      const industry = response.content.trim();
      console.log('[SimpleDetection] AI detected:', industry);

      return this.createResult(industry, 0.75, 'ai_detection');
    } catch (error) {
      console.error('[SimpleDetection] AI detection failed:', error);
      return this.createFallback();
    }
  }

  /**
   * Create consistent result format
   */
  private createResult(
    industry: string,
    confidence: number,
    method: 'domain_match' | 'keyword_match' | 'single_keyword' | 'ai_detection' | 'fallback'
  ): IndustryResult {
    return {
      industry,
      confidence,
      method,
      needsConfirmation: confidence < 0.8
    };
  }

  /**
   * Fallback when nothing matches and AI fails
   */
  private createFallback(): IndustryResult {
    return this.createResult(
      'Professional Services',
      0.5,
      'fallback'
    );
  }
}

// Export singleton
export const simpleIndustryDetection = new SimpleIndustryDetection();
