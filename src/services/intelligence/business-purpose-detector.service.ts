/**
 * Business Purpose Detection Service
 *
 * CONSOLIDATED: Combines business purpose detection with review platform
 * category targeting. Single source of truth for UVP analysis.
 *
 * Fixes the VoC query targeting crisis by adding business context between
 * industry detection and query generation. Determines what the product
 * actually does for customers vs what industry they serve.
 *
 * Solves: OpenDialog gets compliance signals instead of sales automation
 * because system doesn't understand it sells TO insurance companies.
 *
 * Also provides:
 * - G2/Capterra/TrustRadius search query generation
 * - Category-specific exclusions (Zendesk, Freshdesk, etc.)
 * - Competitor detection from UVP
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { SpecializationData } from '@/types/synapse/specialization.types';
import { supabase } from '@/lib/supabase';

/**
 * PHASE 20L: Platform-specific VoC query configuration
 * Each platform needs different query syntax and approach
 */
export interface VoCQueryConfig {
  /** G2/Capterra/TrustRadius: product category + problem */
  g2Query: string;
  /** Reddit: subreddit-aware query with pain keywords */
  redditQuery: string;
  /** Industry-specific subreddits to search */
  redditSubreddits: string[];
  /** Twitter: role + pain language */
  twitterQuery: string;
  /** LinkedIn via Serper: professional role + industry */
  linkedinQuery: string;
  /** YouTube: tutorial/problem format */
  youtubeQuery: string;
  /** HackerNews: tech-focused industry query */
  hackerNewsQuery: string;
  /** ProductHunt: product category launch/review */
  productHuntQuery: string;
  /** IndieHackers: B2B founder perspective */
  indieHackersQuery: string;
  /** SEC filings: company + strategy keywords */
  secQuery: string;
  /** Companies House: UK company filings */
  companiesHouseQuery: string;
}

/**
 * PHASE 19A: Buyer Intelligence extracted from UVP
 * This is what VoC queries should be based on - NOT product category
 */
export interface BuyerIntelligence {
  /** WHO is the buyer? (from targetCustomer.statement) */
  buyerRole: string;
  /** WHAT problem do they have? (from pain points, transformation goal) */
  buyerProblem: string;
  /** WHERE do they work? (industry context) */
  buyerIndustry: string;
  /** Extracted pain point keywords for queries */
  painKeywords: string[];
  /** Confidence in extraction (0-100) */
  confidence: number;
  /** PHASE 20L: Platform-specific queries */
  vocQueries?: VoCQueryConfig;
}

/**
 * Review platform search configuration
 * PHASE 19: Now uses buyerQuery instead of categoryQuery
 */
export interface ReviewSearchConfig {
  /** DEPRECATED: Old category-based query - DO NOT USE */
  categoryQuery: string;
  /** PHASE 19: Buyer problem query - what buyers say about their problems */
  buyerQuery: string;
  /** Buyer intelligence data for query building */
  buyerIntelligence: BuyerIntelligence;
  /** Alternative search terms */
  alternatives: string[];
  /** Terms to exclude from searches */
  exclusions: string[];
  /** Detected competitors for targeted searches */
  competitors: string[];
}

export interface BusinessPurpose {
  productFunction: ProductFunction;
  customerRole: CustomerRole;
  businessOutcome: BusinessOutcome;
  targetIndustry: string;
  contextualQueries: string[];
  /** V6 VOC FIX: Review platform search configuration */
  reviewSearch: ReviewSearchConfig;
  confidence: number; // 0-100
}

export interface ProductFunction {
  primary: 'automation' | 'compliance' | 'analytics' | 'communication' | 'security' | 'integration';
  secondary?: string[];
  description: string;
  keywords: string[];
}

export interface CustomerRole {
  department: 'sales' | 'operations' | 'compliance' | 'marketing' | 'finance' | 'it' | 'executive';
  title: string[];
  decisionLevel: 'individual' | 'team' | 'department' | 'enterprise';
}

export interface BusinessOutcome {
  primary: 'increase_revenue' | 'reduce_costs' | 'ensure_compliance' | 'improve_efficiency' | 'enhance_experience' | 'mitigate_risk';
  description: string;
  metrics: string[];
}

export class BusinessPurposeDetector {
  /**
   * Analyze UVP to determine what the product actually does vs what industry it serves
   */
  detectBusinessPurpose(uvp: CompleteUVP): BusinessPurpose {
    const productFunction = this.detectProductFunction(uvp);
    const customerRole = this.detectCustomerRole(uvp);
    const businessOutcome = this.detectBusinessOutcome(uvp, productFunction);
    const targetIndustry = this.extractTargetIndustry(uvp);

    const contextualQueries = this.generateContextualQueries(
      productFunction,
      customerRole,
      businessOutcome,
      targetIndustry
    );

    // V6 VOC FIX: Generate review platform search configuration
    const reviewSearch = this.generateReviewSearchConfig(uvp, productFunction, customerRole);

    console.log('[BusinessPurposeDetector] Detected:', {
      function: productFunction.primary,
      role: customerRole.department,
      outcome: businessOutcome.primary,
      industry: targetIndustry,
      reviewCategory: reviewSearch.categoryQuery,
      competitors: reviewSearch.competitors,
    });

    return {
      productFunction,
      customerRole,
      businessOutcome,
      targetIndustry,
      contextualQueries,
      reviewSearch,
      confidence: this.calculateConfidence(uvp, productFunction, customerRole, businessOutcome)
    };
  }

  /**
   * Determine what the product actually does (not what industry it serves)
   */
  private detectProductFunction(uvp: CompleteUVP): ProductFunction {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Product function patterns (what the software DOES)
    const functionPatterns = {
      automation: {
        keywords: ['automate', 'automated', 'automation', 'ai agent', 'chatbot', 'conversational ai', 'streamline', 'optimize workflow'],
        weight: 10
      },
      compliance: {
        keywords: ['compliance', 'regulatory', 'audit', 'policy', 'governance', 'risk management', 'legal requirements'],
        weight: 8
      },
      analytics: {
        keywords: ['analytics', 'reporting', 'insights', 'dashboard', 'metrics', 'data analysis', 'business intelligence'],
        weight: 7
      },
      communication: {
        keywords: ['communication', 'messaging', 'engagement', 'customer service', 'support', 'interaction'],
        weight: 6
      },
      security: {
        keywords: ['security', 'encryption', 'protection', 'authentication', 'authorization', 'secure'],
        weight: 5
      },
      integration: {
        keywords: ['integration', 'connect', 'sync', 'api', 'workflow', 'seamless'],
        weight: 4
      }
    };

    let bestMatch: any = { function: 'automation', score: 0 };
    const secondaryFunctions: string[] = [];

    for (const [func, pattern] of Object.entries(functionPatterns)) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of pattern.keywords) {
        if (allText.includes(keyword)) {
          score += pattern.weight;
          matchedKeywords.push(keyword);
        }
      }

      if (score > bestMatch.score) {
        if (bestMatch.score > 0) secondaryFunctions.push(bestMatch.function);
        bestMatch = { function: func, score, keywords: matchedKeywords };
      } else if (score > 0) {
        secondaryFunctions.push(func);
      }
    }

    return {
      primary: bestMatch.function as any,
      secondary: secondaryFunctions.length > 0 ? secondaryFunctions : undefined,
      description: this.getProductFunctionDescription(bestMatch.function, bestMatch.keywords),
      keywords: bestMatch.keywords || []
    };
  }

  /**
   * Determine who in the customer organization uses/buys this
   */
  private detectCustomerRole(uvp: CompleteUVP): CustomerRole {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Customer role patterns (WHO uses this)
    const rolePatterns = {
      sales: {
        keywords: ['sales', 'sales team', 'sales agent', 'sales director', 'revenue', 'quota', 'pipeline', 'lead generation', 'conversion'],
        titles: ['Sales Director', 'VP Sales', 'Sales Manager', 'Account Executive', 'Sales Representative'],
        weight: 10
      },
      operations: {
        keywords: ['operations', 'ops', 'workflow', 'process', 'efficiency', 'productivity', 'automation'],
        titles: ['Operations Director', 'VP Operations', 'Process Manager', 'Operations Manager'],
        weight: 8
      },
      compliance: {
        keywords: ['compliance', 'regulatory', 'audit', 'risk', 'policy', 'governance'],
        titles: ['Compliance Officer', 'Risk Manager', 'Audit Director', 'Legal Counsel'],
        weight: 7
      },
      marketing: {
        keywords: ['marketing', 'campaign', 'brand', 'customer acquisition', 'lead generation', 'engagement'],
        titles: ['Marketing Director', 'VP Marketing', 'Campaign Manager', 'Customer Success'],
        weight: 6
      },
      it: {
        keywords: ['technical', 'integration', 'api', 'system', 'platform', 'technology'],
        titles: ['IT Director', 'CTO', 'Technical Lead', 'System Administrator'],
        weight: 5
      },
      executive: {
        keywords: ['strategic', 'growth', 'transformation', 'competitive advantage', 'business outcomes'],
        titles: ['CEO', 'COO', 'VP', 'Director', 'Executive Team'],
        weight: 4
      }
    };

    let bestMatch: any = { department: 'sales', score: 0 };

    for (const [dept, pattern] of Object.entries(rolePatterns)) {
      let score = 0;
      for (const keyword of pattern.keywords) {
        if (allText.includes(keyword)) {
          score += pattern.weight;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { department: dept, score, titles: pattern.titles };
      }
    }

    return {
      department: bestMatch.department as any,
      title: bestMatch.titles || ['Business User'],
      decisionLevel: this.determineDecisionLevel(allText)
    };
  }

  /**
   * Determine what business outcome the product delivers
   */
  private detectBusinessOutcome(uvp: CompleteUVP, productFunction: ProductFunction): BusinessOutcome {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Business outcome patterns (WHAT customer achieves)
    const outcomePatterns = {
      increase_revenue: {
        keywords: ['revenue', 'sales', 'income', 'profit', 'growth', 'conversion', 'close deals', 'more sales'],
        metrics: ['revenue growth', 'sales conversion', 'deal size', 'quota attainment'],
        weight: 10
      },
      improve_efficiency: {
        keywords: ['efficiency', 'productivity', 'streamline', 'optimize', 'faster', 'automate', 'save time'],
        metrics: ['time saved', 'process efficiency', 'automation rate', 'productivity gains'],
        weight: 8
      },
      reduce_costs: {
        keywords: ['cost', 'expense', 'budget', 'save money', 'reduce costs', 'efficiency', 'ROI'],
        metrics: ['cost reduction', 'ROI', 'operational savings', 'efficiency gains'],
        weight: 7
      },
      enhance_experience: {
        keywords: ['experience', 'satisfaction', 'engagement', 'service', 'customer', 'user experience'],
        metrics: ['satisfaction score', 'engagement rate', 'response time', 'customer retention'],
        weight: 6
      },
      ensure_compliance: {
        keywords: ['compliance', 'regulatory', 'audit', 'requirements', 'standards', 'policy'],
        metrics: ['compliance rate', 'audit score', 'risk reduction', 'policy adherence'],
        weight: 5
      },
      mitigate_risk: {
        keywords: ['risk', 'security', 'protection', 'mitigation', 'safety', 'prevention'],
        metrics: ['risk score', 'incident reduction', 'security rating', 'threat prevention'],
        weight: 4
      }
    };

    let bestMatch: any = { outcome: 'improve_efficiency', score: 0 };

    for (const [outcome, pattern] of Object.entries(outcomePatterns)) {
      let score = 0;
      for (const keyword of pattern.keywords) {
        if (allText.includes(keyword)) {
          score += pattern.weight;
        }
      }

      // Boost score based on product function alignment
      if (productFunction.primary === 'automation' && outcome === 'improve_efficiency') score += 5;
      if (productFunction.primary === 'compliance' && outcome === 'ensure_compliance') score += 5;
      if (productFunction.primary === 'analytics' && outcome === 'increase_revenue') score += 3;

      if (score > bestMatch.score) {
        bestMatch = { outcome, score, metrics: pattern.metrics };
      }
    }

    return {
      primary: bestMatch.outcome as any,
      description: this.getBusinessOutcomeDescription(bestMatch.outcome),
      metrics: bestMatch.metrics || ['business impact']
    };
  }

  /**
   * Generate contextual queries based on business purpose instead of just industry
   */
  private generateContextualQueries(
    productFunction: ProductFunction,
    customerRole: CustomerRole,
    businessOutcome: BusinessOutcome,
    targetIndustry: string
  ): string[] {
    const queries: string[] = [];

    // Format: [Industry] + [Customer Role] + [Product Function] + [Outcome]
    const industryContext = targetIndustry || 'business';

    // Primary business purpose queries
    queries.push(
      `${industryContext} ${customerRole.department} ${productFunction.primary}`,
      `${industryContext} ${businessOutcome.primary.replace('_', ' ')}`,
      `${industryContext} ${productFunction.description}`,
    );

    // Specific role-based queries
    for (const title of customerRole.title.slice(0, 2)) {
      queries.push(`${industryContext} ${title.toLowerCase()} challenges`);
    }

    // Function-specific queries
    for (const keyword of productFunction.keywords.slice(0, 3)) {
      queries.push(`${industryContext} ${keyword} solutions`);
    }

    // Outcome-specific queries
    for (const metric of businessOutcome.metrics.slice(0, 2)) {
      queries.push(`${industryContext} improve ${metric}`);
    }

    // For OpenDialog specifically - sales automation NOT compliance
    if (productFunction.primary === 'automation' && customerRole.department === 'sales') {
      queries.push(
        `${industryContext} sales automation tools`,
        `${industryContext} AI sales agents`,
        `${industryContext} contact center automation`,
        `${industryContext} lead qualification automation`
      );
    }

    return queries.slice(0, 10); // Return top 10 most relevant
  }

  // Helper methods
  private extractAllText(uvp: CompleteUVP): string {
    const texts: string[] = [];

    if (uvp.valuePropositionStatement) texts.push(uvp.valuePropositionStatement);
    if (uvp.whyStatement) texts.push(uvp.whyStatement);
    if (uvp.whatStatement) texts.push(uvp.whatStatement);
    if (uvp.howStatement) texts.push(uvp.howStatement);
    if (uvp.targetCustomer?.statement) texts.push(uvp.targetCustomer.statement);
    if (uvp.keyBenefit?.statement) texts.push(uvp.keyBenefit.statement);
    if (uvp.transformationGoal?.statement) texts.push(uvp.transformationGoal.statement);

    // Include differentiators
    if (uvp.uniqueSolution?.differentiators) {
      uvp.uniqueSolution.differentiators.forEach(d => {
        texts.push(d.statement);
        if (d.evidence) texts.push(d.evidence);
      });
    }

    return texts.join(' ');
  }

  private extractTargetIndustry(uvp: CompleteUVP): string {
    const text = this.extractAllText(uvp).toLowerCase();

    // Industry detection patterns
    const industries = {
      'insurance': ['insurance', 'insurtech', 'policy', 'claims', 'underwriting'],
      'healthcare': ['healthcare', 'medical', 'patient', 'clinical', 'hospital'],
      'financial': ['financial', 'banking', 'fintech', 'lending', 'investment'],
      'retail': ['retail', 'ecommerce', 'shopping', 'consumer', 'merchant'],
      'manufacturing': ['manufacturing', 'industrial', 'factory', 'production'],
      'real estate': ['real estate', 'property', 'housing', 'mortgage']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }

    return 'business'; // Generic fallback
  }

  private determineDecisionLevel(text: string): 'individual' | 'team' | 'department' | 'enterprise' {
    if (text.includes('enterprise') || text.includes('organization') || text.includes('company-wide')) {
      return 'enterprise';
    }
    if (text.includes('department') || text.includes('division')) {
      return 'department';
    }
    if (text.includes('team') || text.includes('group')) {
      return 'team';
    }
    return 'individual';
  }

  private getProductFunctionDescription(func: string, keywords: string[]): string {
    const descriptions = {
      automation: 'Automates business processes and workflows',
      compliance: 'Ensures regulatory compliance and risk management',
      analytics: 'Provides data insights and business intelligence',
      communication: 'Enables customer communication and engagement',
      security: 'Protects data and ensures system security',
      integration: 'Connects systems and enables data flow'
    };

    return descriptions[func as keyof typeof descriptions] || 'Provides business value';
  }

  private getBusinessOutcomeDescription(outcome: string): string {
    const descriptions = {
      increase_revenue: 'Drives revenue growth and sales performance',
      improve_efficiency: 'Improves operational efficiency and productivity',
      reduce_costs: 'Reduces operational costs and expenses',
      enhance_experience: 'Enhances customer and user experience',
      ensure_compliance: 'Ensures regulatory compliance and governance',
      mitigate_risk: 'Mitigates business and operational risks'
    };

    return descriptions[outcome as keyof typeof descriptions] || 'Delivers business value';
  }

  private calculateConfidence(
    uvp: CompleteUVP,
    productFunction: ProductFunction,
    customerRole: CustomerRole,
    businessOutcome: BusinessOutcome
  ): number {
    let confidence = 0;

    // Base confidence from data completeness
    const textLength = this.extractAllText(uvp).length;
    confidence += Math.min(textLength / 500 * 30, 30); // Up to 30 points for text completeness

    // Confidence from function keyword matches
    confidence += Math.min(productFunction.keywords.length * 10, 30);

    // Confidence from role detection clarity
    if (customerRole.title.length > 1) confidence += 20;
    else confidence += 10;

    // Confidence from outcome alignment
    if (businessOutcome.metrics.length > 2) confidence += 20;
    else confidence += 10;

    return Math.min(Math.round(confidence), 100);
  }

  // ==========================================================================
  // PHASE 19A: Buyer Intelligence Extraction
  // ==========================================================================

  /**
   * PHASE 19A: Extract buyer intelligence from UVP
   * This is the CORRECT data for VoC queries - buyer role + problem, NOT product category
   */
  extractBuyerIntelligence(uvp: CompleteUVP): BuyerIntelligence {
    let buyerRole = '';
    let buyerProblem = '';
    let buyerIndustry = '';
    const painKeywords: string[] = [];
    let confidence = 0;

    // 1. Extract Buyer Role from targetCustomer.statement
    const customerStatement = uvp.targetCustomer?.statement || '';
    if (customerStatement) {
      // Extract the role portion (usually before "struggling with" or "who")
      const roleMatch = customerStatement.match(/^([^\.]+?)(?:\s+(?:struggling|who|seeking|looking|that|with high))/i);
      if (roleMatch) {
        buyerRole = roleMatch[1].trim();
        confidence += 30;
      } else {
        // Fallback: take first part of statement
        buyerRole = customerStatement.split(/\s+(?:who|that|with)\s+/i)[0]?.trim() || customerStatement.substring(0, 50);
        confidence += 15;
      }
    }

    // 2. Extract Buyer Problem from multiple sources
    // Priority: transformationGoal.before > pain point keywords from statement > keyBenefit inverse

    // Try transformationGoal.before first (explicit pain point)
    if (uvp.transformationGoal?.before) {
      buyerProblem = uvp.transformationGoal.before;
      confidence += 35;

      // Extract keywords
      const problemWords = buyerProblem.toLowerCase()
        .replace(/^(?:struggling with|dealing with|facing)\s+/i, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !['with', 'from', 'that', 'their', 'about'].includes(w));
      painKeywords.push(...problemWords.slice(0, 4));
    }

    // Try to extract from customer statement "struggling with X"
    if (!buyerProblem && customerStatement) {
      const problemMatch = customerStatement.match(/struggling with\s+(.+?)(?:\.|$)/i) ||
                          customerStatement.match(/facing\s+(.+?)(?:\.|$)/i) ||
                          customerStatement.match(/dealing with\s+(.+?)(?:\.|$)/i);
      if (problemMatch) {
        buyerProblem = problemMatch[1].trim();
        confidence += 25;

        // Extract keywords
        const problemWords = buyerProblem.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        painKeywords.push(...problemWords.slice(0, 3));
      }
    }

    // Fallback: invert keyBenefit to derive problem
    if (!buyerProblem && uvp.keyBenefit?.statement) {
      // "Convert 15%+ more quotes" → "low quote conversion"
      const benefit = uvp.keyBenefit.statement.toLowerCase();
      if (benefit.includes('convert')) buyerProblem = 'low conversion rates';
      else if (benefit.includes('save')) buyerProblem = 'wasted time and resources';
      else if (benefit.includes('increase')) buyerProblem = 'stagnant growth';
      else if (benefit.includes('reduce')) buyerProblem = 'high costs';
      else if (benefit.includes('improve')) buyerProblem = 'poor performance';
      else buyerProblem = 'operational challenges';

      confidence += 10;
    }

    // 3. Extract Buyer Industry
    buyerIndustry = uvp.targetCustomer?.industry || '';
    if (!buyerIndustry) {
      // Try to detect from statement
      const industryPatterns = [
        { pattern: /insurance/i, industry: 'insurance' },
        { pattern: /healthcare|medical|hospital/i, industry: 'healthcare' },
        { pattern: /financial|banking|fintech/i, industry: 'financial services' },
        { pattern: /retail|ecommerce|store/i, industry: 'retail' },
        { pattern: /restaurant|food service/i, industry: 'restaurant' },
        { pattern: /real estate|property/i, industry: 'real estate' },
        { pattern: /manufacturing|industrial/i, industry: 'manufacturing' },
        { pattern: /technology|software|saas/i, industry: 'technology' },
      ];

      const allText = this.extractAllText(uvp).toLowerCase();
      for (const { pattern, industry } of industryPatterns) {
        if (pattern.test(allText)) {
          buyerIndustry = industry;
          confidence += 10;
          break;
        }
      }
    } else {
      confidence += 15;
    }

    console.log('[PHASE 19A] Extracted buyer intelligence:', {
      buyerRole,
      buyerProblem,
      buyerIndustry,
      painKeywords,
      confidence,
    });

    // PHASE 20L: Generate platform-specific queries
    const vocQueries = this.generateVoCQueryConfig(
      buyerRole,
      buyerProblem,
      buyerIndustry,
      painKeywords
    );

    return {
      buyerRole,
      buyerProblem,
      buyerIndustry,
      painKeywords,
      confidence: Math.min(confidence, 100),
      vocQueries,
    };
  }

  // ==========================================================================
  // PHASE 20L: Platform-Specific VoC Query Generation
  // ==========================================================================

  /**
   * Industry-specific subreddit mapping
   * Returns relevant subreddits based on buyer's industry
   */
  private getIndustrySubreddits(buyerIndustry: string, buyerRole: string): string[] {
    const industryMap: Record<string, string[]> = {
      'insurance': ['insurance', 'InsuranceAgent', 'InsuranceProfessional', 'sales', 'InsurTech'],
      'healthcare': ['healthcare', 'HealthIT', 'medicine', 'nursing', 'healthIT'],
      'real estate': ['realtors', 'RealEstate', 'CommercialRealEstate', 'realestateinvesting'],
      'legal': ['LawFirm', 'Lawyers', 'legal', 'law'],
      'finance': ['FinancialCareers', 'CFP', 'accounting', 'FinancialPlanning', 'Banking'],
      'financial services': ['FinancialCareers', 'CFP', 'accounting', 'FinancialPlanning', 'Banking'],
      'technology': ['SaaS', 'startups', 'Entrepreneur', 'B2BMarketing', 'software'],
      'retail': ['retail', 'smallbusiness', 'ecommerce', 'Entrepreneur'],
      'construction': ['Construction', 'Contractor', 'HomeImprovement', 'HVAC'],
      'restaurant': ['restaurateur', 'KitchenConfidential', 'foodservice', 'smallbusiness'],
      'manufacturing': ['manufacturing', 'engineering', 'supplychain', 'logistics'],
    };

    // Role-specific additions
    const roleSubreddits: Record<string, string[]> = {
      'sales': ['sales', 'salesforce', 'B2BSales'],
      'marketing': ['marketing', 'digital_marketing', 'B2BMarketing'],
      'operations': ['operations', 'supplychain', 'projectmanagement'],
      'executive': ['Entrepreneur', 'startups', 'smallbusiness'],
    };

    const industryKey = buyerIndustry.toLowerCase();
    let subreddits = industryMap[industryKey] || ['business', 'smallbusiness', 'Entrepreneur'];

    // Add role-specific subreddits if buyer role contains key terms
    for (const [roleKey, roleSubs] of Object.entries(roleSubreddits)) {
      if (buyerRole.toLowerCase().includes(roleKey)) {
        subreddits = [...subreddits, ...roleSubs];
        break;
      }
    }

    // Deduplicate and limit
    return [...new Set(subreddits)].slice(0, 6);
  }

  /**
   * PHASE 20L: Generate platform-specific VoC queries
   * Each platform needs different query syntax for relevance
   */
  private generateVoCQueryConfig(
    buyerRole: string,
    buyerProblem: string,
    buyerIndustry: string,
    painKeywords: string[]
  ): VoCQueryConfig {
    // Extract key terms for queries
    const roleShort = buyerRole.split(/\s+/).slice(0, 3).join(' ');
    const problemShort = buyerProblem.split(/\s+/).slice(0, 3).join(' ');
    const topPainKeyword = painKeywords[0] || problemShort;

    // G2/Capterra: Search by industry + product category + problem
    // Format: "[industry] [product type] [problem term]"
    const g2Query = `${buyerIndustry} software ${topPainKeyword}`;

    // Reddit: Use industry subreddits + pain language
    const redditSubreddits = this.getIndustrySubreddits(buyerIndustry, buyerRole);
    const redditQuery = `"${problemShort}" OR "${topPainKeyword}" frustrating OR struggling OR help`;

    // Twitter: Role + pain indicators (emotional language)
    // Format: "[role]" AND ("[pain1]" OR "[pain2]") - works within 7 day window
    const twitterPainTerms = painKeywords.slice(0, 2).map(k => `"${k}"`).join(' OR ') || `"${problemShort}"`;
    const twitterQuery = `"${buyerIndustry}" (${twitterPainTerms} OR frustrated OR struggling)`;

    // LinkedIn via Serper: Professional context
    // Format: site:linkedin.com "[role]" "[industry]" challenges
    const linkedinQuery = `site:linkedin.com "${roleShort}" "${buyerIndustry}" challenges OR insights`;

    // YouTube: Tutorial/problem solving format
    // People search YouTube for "how to fix X" or "[industry] tips"
    const youtubeQuery = `${buyerIndustry} ${problemShort} tips OR solutions OR how to`;

    // HackerNews: Tech-focused, discussion format
    // HN users discuss tools and problems in technical context
    const hackerNewsQuery = `${buyerIndustry} ${topPainKeyword}`;

    // ProductHunt: Product launches in category
    // Look for products solving similar problems
    const productHuntQuery = `${buyerIndustry} ${topPainKeyword} software`;

    // IndieHackers: Founder/B2B perspective
    // Founders discuss building for specific markets
    const indieHackersQuery = `${buyerIndustry} B2B ${topPainKeyword}`;

    // SEC filings: Company strategy language
    // Look for industry + strategy terms in filings
    const secQuery = `${buyerIndustry} strategy growth challenges`;

    // Companies House: UK company context
    const companiesHouseQuery = `${buyerIndustry} ${buyerRole}`;

    const config: VoCQueryConfig = {
      g2Query,
      redditQuery,
      redditSubreddits,
      twitterQuery,
      linkedinQuery,
      youtubeQuery,
      hackerNewsQuery,
      productHuntQuery,
      indieHackersQuery,
      secQuery,
      companiesHouseQuery,
    };

    console.log('[PHASE 20L] Generated VoC query config:', {
      industry: buyerIndustry,
      role: buyerRole,
      redditSubreddits,
      g2Query,
      twitterQuery,
    });

    return config;
  }

  // ==========================================================================
  // PHASE 19B: Buyer Query Generation (Replaces categoryQuery)
  // ==========================================================================

  /**
   * PHASE 19: Generate buyer-focused query instead of product category query
   *
   * CORRECT: "[Buyer Role]" "[Buyer Problem]" discussions OR challenges
   * WRONG:   "[Product Category]" reviews OR alternatives
   */
  private generateBuyerQuery(buyerIntel: BuyerIntelligence): string {
    const { buyerRole, buyerProblem, buyerIndustry } = buyerIntel;

    // Build query components
    const queryParts: string[] = [];

    // Add buyer role (quoted for exact match)
    if (buyerRole && buyerRole.length > 5) {
      // Extract key role words (2-3 words max for search)
      const roleWords = buyerRole.split(/\s+/).slice(0, 4).join(' ');
      queryParts.push(`"${roleWords}"`);
    }

    // Add buyer problem (quoted for relevance)
    if (buyerProblem && buyerProblem.length > 5) {
      // Extract problem essence (2-3 words)
      const problemWords = buyerProblem.split(/\s+/).slice(0, 3).join(' ');
      queryParts.push(`"${problemWords}"`);
    }

    // Add industry context if available
    if (buyerIndustry) {
      queryParts.push(buyerIndustry);
    }

    // Add discussion/challenge context
    queryParts.push('discussions OR challenges OR frustrations');

    const query = queryParts.join(' ');

    console.log('[PHASE 19B] Generated buyer query:', query);

    return query;
  }

  // ==========================================================================
  // V6 VOC FIX: Review Platform Search Configuration (UPDATED FOR PHASE 19)
  // ==========================================================================

  /**
   * Generate G2/Capterra/TrustRadius search configuration based on BUYER INTELLIGENCE
   * PHASE 19: Now generates buyer-problem queries instead of product-category queries
   */
  private generateReviewSearchConfig(
    uvp: CompleteUVP,
    productFunction: ProductFunction,
    customerRole: CustomerRole
  ): ReviewSearchConfig {
    // PHASE 19A: Extract buyer intelligence first
    const buyerIntel = this.extractBuyerIntelligence(uvp);

    // PHASE 19B: Generate buyer-focused query
    const buyerQuery = this.generateBuyerQuery(buyerIntel);

    // Keep legacy categoryQuery for backwards compatibility but mark as deprecated
    const legacyCategoryQuery = this.generateLegacyCategoryQuery(uvp, productFunction, customerRole);

    // Detect competitors mentioned in UVP
    const competitors = this.detectCompetitors(uvp);

    // Generate alternatives based on buyer problem variations
    const alternatives = this.generateBuyerAlternatives(buyerIntel);

    // Exclusions remain the same - filter out irrelevant platforms
    const exclusions = this.getExclusionsForProfile(productFunction, customerRole);

    console.log('[PHASE 19] ReviewSearchConfig:', {
      buyerQuery,
      legacyCategoryQuery,
      buyerIntelligence: buyerIntel,
    });

    return {
      categoryQuery: legacyCategoryQuery, // DEPRECATED - for backwards compat only
      buyerQuery,
      buyerIntelligence: buyerIntel,
      alternatives,
      exclusions,
      competitors,
    };
  }

  /**
   * Generate alternative buyer queries for broader coverage
   */
  private generateBuyerAlternatives(buyerIntel: BuyerIntelligence): string[] {
    const alternatives: string[] = [];
    const { buyerRole, buyerProblem, buyerIndustry, painKeywords } = buyerIntel;

    // Alternative 1: Industry + problem
    if (buyerIndustry && buyerProblem) {
      alternatives.push(`${buyerIndustry} "${buyerProblem}" challenges`);
    }

    // Alternative 2: Role variations
    if (buyerRole) {
      // Add plural/singular variations
      const roleBase = buyerRole.replace(/s$/, '');
      alternatives.push(`"${roleBase}" opinions struggles`);
    }

    // Alternative 3: Pain keyword combinations
    if (painKeywords.length >= 2) {
      alternatives.push(`"${painKeywords[0]}" "${painKeywords[1]}" frustration`);
    }

    return alternatives.slice(0, 3);
  }

  /**
   * Get exclusions based on profile to filter irrelevant results
   */
  private getExclusionsForProfile(productFunction: ProductFunction, customerRole: CustomerRole): string[] {
    // Always exclude help desk/ticketing for non-support roles
    if (customerRole.department !== 'operations') {
      return ['Zendesk', 'Freshdesk', 'Intercom', 'help desk', 'ticketing'];
    }
    return [];
  }

  /**
   * DEPRECATED: Legacy category query generator for backwards compatibility
   * New code should use buyerQuery instead
   */
  private generateLegacyCategoryQuery(
    uvp: CompleteUVP,
    productFunction: ProductFunction,
    customerRole: CustomerRole
  ): string {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Category mapping based on product function + role combination
    const categoryMap: Record<string, string> = {
      'automation_sales': '"conversational AI" OR "AI agent" OR "chatbot platform" OR "sales automation"',
      'automation_operations': '"workflow automation" OR "process automation" OR "RPA"',
      'automation_it': '"integration platform" OR "iPaaS" OR "API management"',
      'communication_sales': '"sales engagement" OR "outbound automation"',
      'communication_marketing': '"marketing automation" OR "email marketing"',
      'analytics_any': '"business intelligence" OR "analytics platform"',
      'compliance_any': '"compliance software" OR "GRC platform"',
      'security_any': '"security software" OR "cybersecurity"',
    };

    let categoryKey = `${productFunction.primary}_${customerRole.department}`;
    let query = categoryMap[categoryKey];

    if (!query) {
      categoryKey = `${productFunction.primary}_any`;
      query = categoryMap[categoryKey];
    }

    if (!query) {
      query = '"B2B software" OR "enterprise platform"';
    }

    // Detect specific CAI patterns
    const caiPatterns = ['conversational ai', 'ai agent', 'chatbot', 'virtual agent'];
    if (caiPatterns.some(p => allText.includes(p))) {
      query = '"conversational AI" OR "AI agent" OR "chatbot platform"';
    }

    return query;
  }

  /**
   * Detect competitors mentioned in UVP text
   */
  private detectCompetitors(uvp: CompleteUVP): string[] {
    const allText = this.extractAllText(uvp).toLowerCase();
    const competitors: string[] = [];

    // Common competitor mention patterns
    const patterns = [
      /unlike\s+(\w+)/gi,
      /compared\s+to\s+(\w+)/gi,
      /vs\.?\s+(\w+)/gi,
      /alternative\s+to\s+(\w+)/gi,
      /replaces?\s+(\w+)/gi,
      /better\s+than\s+(\w+)/gi,
      /instead\s+of\s+(\w+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const competitor = match[1];
        // Filter out common words
        if (competitor.length > 3 &&
            !/^(the|our|your|their|other|manual|legacy|traditional|existing|current|old)$/i.test(competitor)) {
          competitors.push(competitor);
        }
      }
    }

    // Known CAI competitors to look for
    const knownCompetitors = [
      'drift', 'qualified', 'intercom', 'ada', 'cognigy', 'kore.ai',
      'liveperson', 'dialogflow', 'amazon lex', 'ibm watson', 'nuance',
      'genesys', 'nice', 'five9', 'talkdesk', 'zendesk'
    ];

    for (const known of knownCompetitors) {
      if (allText.includes(known) && !competitors.includes(known)) {
        competitors.push(known);
      }
    }

    return [...new Set(competitors)].slice(0, 5);
  }

  // ==========================================================================
  // PHASE 15: Use Stored Specialization Data
  // ==========================================================================

  /**
   * Get stored specialization data for a brand
   * Returns null if no specialization is stored
   */
  async getStoredSpecialization(brandId: string): Promise<SpecializationData | null> {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('specialization_data')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (error || !data?.specialization_data) {
        return null;
      }

      return data.specialization_data as SpecializationData;
    } catch (err) {
      console.warn('[BusinessPurposeDetector] Failed to get stored specialization:', err);
      return null;
    }
  }

  /**
   * Generate review search config from stored specialization data
   * Uses profile-specific queries instead of generic detection
   */
  generateReviewSearchConfigFromSpecialization(
    specialization: SpecializationData
  ): ReviewSearchConfig {
    // Profile-specific query generation
    const profileQueries: Record<string, { query: string; alternatives: string[]; exclusions: string[] }> = {
      'local-service-b2c': {
        query: `"${specialization.service_type}" reviews "${specialization.niche}"`,
        alternatives: [specialization.industry_vertical, 'local business reviews'],
        exclusions: [],
      },
      'local-service-b2b': {
        query: `"commercial ${specialization.service_type}" reviews`,
        alternatives: [specialization.industry_vertical, 'B2B service reviews'],
        exclusions: [],
      },
      'regional-b2b-agency': {
        query: `"${specialization.service_type} agency" reviews ${specialization.industry_vertical}`,
        alternatives: ['agency reviews', 'consultant reviews'],
        exclusions: [],
      },
      'regional-retail-b2c': {
        query: `"${specialization.service_type}" store reviews`,
        alternatives: ['retail reviews', 'shopping experience'],
        exclusions: [],
      },
      'national-saas-b2b': {
        // CRITICAL: Use industry_sold_to for SaaS, not generic "software"
        query: `"${(specialization as any).industry_sold_to || specialization.industry_vertical}" "${(specialization as any).product_function || specialization.service_type}" software reviews`,
        alternatives: [
          `${(specialization as any).unique_approach || 'AI'} reviews`,
          `G2 ${(specialization as any).product_function || 'software'}`,
        ],
        exclusions: ['help desk', 'ticketing', 'CRM'],
      },
      'national-product-b2c': {
        query: `"${(specialization as any).product_category || specialization.service_type}" "${(specialization as any).differentiator_angle || 'quality'}" reviews`,
        alternatives: ['product reviews', 'customer feedback'],
        exclusions: [],
      },
      'global-saas-b2b': {
        query: `"enterprise ${(specialization as any).enterprise_function || specialization.service_type}" reviews Gartner`,
        alternatives: ['enterprise software reviews', 'G2 enterprise'],
        exclusions: [],
      },
    };

    const config = profileQueries[specialization.profile_type] || {
      query: `"${specialization.service_type}" ${specialization.industry_vertical} reviews`,
      alternatives: [],
      exclusions: [],
    };

    // PHASE 19: Build buyer intelligence from specialization
    const buyerIntelligence: BuyerIntelligence = {
      buyerRole: specialization.target_outcome ? 'business professional' : 'customer',
      buyerProblem: specialization.target_outcome || 'operational challenges',
      buyerIndustry: specialization.industry_vertical,
      painKeywords: [specialization.niche, specialization.service_type].filter(Boolean),
      confidence: 80, // High confidence from stored specialization
    };

    // Build buyer query from specialization
    const buyerQuery = `"${buyerIntelligence.buyerRole}" "${specialization.niche}" challenges discussions`;

    return {
      categoryQuery: config.query,
      buyerQuery,
      buyerIntelligence,
      alternatives: config.alternatives,
      exclusions: config.exclusions,
      competitors: specialization.detected_competitors || [],
    };
  }

  /**
   * Detect business purpose using stored specialization if available
   * Falls back to UVP analysis if no stored specialization
   */
  async detectBusinessPurposeWithSpecialization(
    uvp: CompleteUVP,
    brandId?: string
  ): Promise<BusinessPurpose> {
    // Try to get stored specialization first
    if (brandId) {
      const storedSpec = await this.getStoredSpecialization(brandId);
      if (storedSpec) {
        console.log('[BusinessPurposeDetector] Using stored specialization:', storedSpec.profile_type);

        // Build business purpose from stored specialization
        const reviewSearch = this.generateReviewSearchConfigFromSpecialization(storedSpec);

        return {
          productFunction: {
            primary: this.mapProfileToFunction(storedSpec.profile_type),
            description: storedSpec.unique_method || 'Specialized business solution',
            keywords: [storedSpec.service_type, storedSpec.niche],
          },
          customerRole: {
            department: this.mapProfileToDepartment(storedSpec.profile_type),
            title: ['Target Customer'],
            decisionLevel: 'team',
          },
          businessOutcome: {
            primary: 'improve_efficiency',
            description: storedSpec.target_outcome || 'Business improvement',
            metrics: ['business impact'],
          },
          targetIndustry: storedSpec.industry_vertical,
          contextualQueries: [
            `${storedSpec.industry_vertical} ${storedSpec.service_type}`,
            `${storedSpec.niche} solutions`,
          ],
          reviewSearch,
          confidence: 95, // High confidence when using stored data
        };
      }
    }

    // Fall back to standard UVP analysis
    return this.detectBusinessPurpose(uvp);
  }

  /**
   * Map profile type to product function
   */
  private mapProfileToFunction(profileType: string): 'automation' | 'compliance' | 'analytics' | 'communication' | 'security' | 'integration' {
    const mapping: Record<string, 'automation' | 'compliance' | 'analytics' | 'communication' | 'security' | 'integration'> = {
      'national-saas-b2b': 'automation',
      'global-saas-b2b': 'automation',
      'regional-b2b-agency': 'communication',
      'local-service-b2b': 'integration',
      'local-service-b2c': 'communication',
      'regional-retail-b2c': 'communication',
      'national-product-b2c': 'communication',
    };
    return mapping[profileType] || 'automation';
  }

  /**
   * Map profile type to department
   */
  private mapProfileToDepartment(profileType: string): 'sales' | 'operations' | 'compliance' | 'marketing' | 'finance' | 'it' | 'executive' {
    const mapping: Record<string, 'sales' | 'operations' | 'compliance' | 'marketing' | 'finance' | 'it' | 'executive'> = {
      'national-saas-b2b': 'sales',
      'global-saas-b2b': 'executive',
      'regional-b2b-agency': 'marketing',
      'local-service-b2b': 'operations',
      'local-service-b2c': 'operations',
      'regional-retail-b2c': 'operations',
      'national-product-b2c': 'marketing',
    };
    return mapping[profileType] || 'operations';
  }
}

// Export singleton instance
export const businessPurposeDetector = new BusinessPurposeDetector();