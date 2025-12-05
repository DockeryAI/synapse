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

/**
 * Review platform search configuration
 */
export interface ReviewSearchConfig {
  /** Primary category for G2/Capterra searches */
  categoryQuery: string;
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
  // V6 VOC FIX: Review Platform Search Configuration
  // ==========================================================================

  /**
   * Generate G2/Capterra/TrustRadius search configuration based on business purpose
   * Maps product function + customer role to specific software categories
   */
  private generateReviewSearchConfig(
    uvp: CompleteUVP,
    productFunction: ProductFunction,
    customerRole: CustomerRole
  ): ReviewSearchConfig {
    const allText = this.extractAllText(uvp).toLowerCase();

    // Category mapping based on product function + role combination
    const categoryMap: Record<string, { query: string; alternatives: string[]; exclusions: string[] }> = {
      // Automation + Sales = Conversational AI / Sales Automation
      'automation_sales': {
        query: '"conversational AI" OR "AI agent" OR "chatbot platform" OR "sales automation"',
        alternatives: ['virtual agent', 'dialogue system', 'AI SDR', 'conversational sales'],
        exclusions: ['Zendesk', 'Freshdesk', 'Intercom', 'help desk', 'ticketing', 'CRM'],
      },
      // Automation + Operations = Workflow Automation
      'automation_operations': {
        query: '"workflow automation" OR "process automation" OR "RPA" OR "business automation"',
        alternatives: ['no-code automation', 'iPaaS', 'integration platform'],
        exclusions: ['help desk', 'ticketing'],
      },
      // Automation + IT = Integration Platform
      'automation_it': {
        query: '"integration platform" OR "iPaaS" OR "API management" OR "data integration"',
        alternatives: ['workflow automation', 'enterprise integration'],
        exclusions: [],
      },
      // Communication + Sales = Sales Engagement
      'communication_sales': {
        query: '"sales engagement" OR "outbound automation" OR "sales communication"',
        alternatives: ['email automation', 'cadence software', 'SDR tools'],
        exclusions: ['help desk', 'support ticketing'],
      },
      // Communication + Marketing = Marketing Automation
      'communication_marketing': {
        query: '"marketing automation" OR "email marketing" OR "campaign management"',
        alternatives: ['martech', 'demand generation', 'lead nurturing'],
        exclusions: [],
      },
      // Analytics + Any = BI / Analytics
      'analytics_any': {
        query: '"business intelligence" OR "analytics platform" OR "data visualization"',
        alternatives: ['BI software', 'reporting tools', 'dashboard'],
        exclusions: [],
      },
      // Compliance + Any = GRC / Compliance
      'compliance_any': {
        query: '"compliance software" OR "GRC platform" OR "audit management"',
        alternatives: ['regtech', 'risk management', 'policy management'],
        exclusions: [],
      },
      // Security + Any = Security Software
      'security_any': {
        query: '"security software" OR "cybersecurity" OR "identity management"',
        alternatives: ['IAM', 'SIEM', 'endpoint security'],
        exclusions: [],
      },
    };

    // Determine category key
    let categoryKey = `${productFunction.primary}_${customerRole.department}`;
    let config = categoryMap[categoryKey];

    // Fallback to function + any
    if (!config) {
      categoryKey = `${productFunction.primary}_any`;
      config = categoryMap[categoryKey];
    }

    // Ultimate fallback
    if (!config) {
      config = {
        query: '"B2B software" OR "enterprise platform"',
        alternatives: ['business software', 'SaaS'],
        exclusions: [],
      };
    }

    // Detect specific CAI patterns in UVP text (OpenDialog, Drift, etc.)
    const caiPatterns = ['conversational ai', 'ai agent', 'chatbot', 'virtual agent', 'dialogue', 'dialog system', 'nlp platform'];
    const hasCAI = caiPatterns.some(p => allText.includes(p));

    if (hasCAI) {
      // Override to CAI-specific search
      config = {
        query: '"conversational AI" OR "AI agent" OR "chatbot platform" OR "virtual assistant"',
        alternatives: ['dialogue system', 'NLP platform', 'voice bot', 'conversational sales'],
        exclusions: ['Zendesk', 'Freshdesk', 'Intercom', 'help desk', 'ticketing', 'CRM', 'Salesforce Service Cloud'],
      };
    }

    // Detect competitors mentioned in UVP
    const competitors = this.detectCompetitors(uvp);

    return {
      categoryQuery: config.query,
      alternatives: config.alternatives,
      exclusions: config.exclusions,
      competitors,
    };
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
}

// Export singleton instance
export const businessPurposeDetector = new BusinessPurposeDetector();