/**
 * Category Dictionary Builder
 *
 * Builds product/solution category dictionaries from UVP data.
 * Used for BOOST scoring (1.1-1.3x), NOT hard filtering.
 */

export interface CategoryDictionary {
  primary: string[];      // Core category terms (AI, CRM, etc.)
  productType: string[];  // Product type terms (chatbot, automation, etc.)
  outcomes: string[];     // Outcome/transformation terms
}

// Pre-built category expansions for common solution types
const CATEGORY_EXPANSIONS: Record<string, CategoryDictionary> = {
  ai: {
    primary: ['AI', 'artificial intelligence', 'machine learning', 'ML', 'deep learning'],
    productType: ['chatbot', 'automation', 'agent', 'virtual assistant', 'NLP', 'neural', 'predictive'],
    outcomes: ['automate', 'automated', 'intelligent', 'smart', 'AI-powered', 'self-service', 'predictive'],
  },
  'conversational-ai': {
    primary: ['conversational AI', 'conversational', 'dialogue', 'voice AI'],
    productType: ['chatbot', 'virtual agent', 'voice bot', 'IVR', 'contact center AI', 'customer service AI'],
    outcomes: ['self-service', 'automation', 'deflection', 'resolution', '24/7 support', 'instant response'],
  },
  crm: {
    primary: ['CRM', 'customer relationship management'],
    productType: ['Salesforce', 'HubSpot', 'pipeline', 'contact management', 'lead management'],
    outcomes: ['relationship', 'customer data', 'sales tracking', 'lead scoring', 'customer 360'],
  },
  'sales-automation': {
    primary: ['sales automation', 'sales enablement', 'revenue operations'],
    productType: ['outreach', 'sequence', 'cadence', 'engagement', 'prospecting'],
    outcomes: ['pipeline', 'conversion', 'quota', 'close rate', 'revenue', 'deal velocity'],
  },
  'marketing-automation': {
    primary: ['marketing automation', 'MarTech', 'demand generation'],
    productType: ['email marketing', 'campaign', 'nurture', 'ABM', 'personalization'],
    outcomes: ['leads', 'MQL', 'engagement', 'attribution', 'conversion', 'CAC'],
  },
  analytics: {
    primary: ['analytics', 'BI', 'business intelligence', 'data analytics'],
    productType: ['dashboard', 'reporting', 'visualization', 'metrics', 'KPI'],
    outcomes: ['insights', 'data-driven', 'visibility', 'decision-making', 'performance'],
  },
  security: {
    primary: ['security', 'cybersecurity', 'infosec'],
    productType: ['SIEM', 'SOC', 'threat detection', 'endpoint', 'identity'],
    outcomes: ['protection', 'compliance', 'risk reduction', 'threat prevention', 'secure'],
  },
  compliance: {
    primary: ['compliance', 'GRC', 'regulatory'],
    productType: ['audit', 'policy', 'risk management', 'control'],
    outcomes: ['compliant', 'audit-ready', 'risk reduction', 'governance', 'regulatory'],
  },
  hr: {
    primary: ['HR', 'human resources', 'HRIS', 'HCM'],
    productType: ['payroll', 'recruiting', 'ATS', 'performance', 'learning'],
    outcomes: ['hiring', 'retention', 'engagement', 'productivity', 'culture'],
  },
  finance: {
    primary: ['finance', 'fintech', 'accounting', 'ERP'],
    productType: ['invoicing', 'payments', 'expense', 'budgeting', 'FP&A'],
    outcomes: ['cost savings', 'efficiency', 'visibility', 'accuracy', 'compliance'],
  },
  'customer-service': {
    primary: ['customer service', 'customer support', 'helpdesk'],
    productType: ['ticketing', 'support', 'knowledge base', 'live chat', 'contact center'],
    outcomes: ['resolution', 'satisfaction', 'CSAT', 'NPS', 'first call resolution'],
  },
  ecommerce: {
    primary: ['ecommerce', 'e-commerce', 'online store', 'retail tech'],
    productType: ['cart', 'checkout', 'inventory', 'fulfillment', 'marketplace'],
    outcomes: ['conversion', 'AOV', 'revenue', 'customer lifetime value', 'retention'],
  },
  'digital-transformation': {
    primary: ['digital transformation', 'digitization', 'modernization'],
    productType: ['cloud', 'SaaS', 'platform', 'integration', 'API'],
    outcomes: ['efficiency', 'agility', 'innovation', 'scalability', 'cost reduction'],
  },
  productivity: {
    primary: ['productivity', 'collaboration', 'workflow'],
    productType: ['project management', 'task', 'document', 'communication'],
    outcomes: ['efficiency', 'time savings', 'collaboration', 'streamlined', 'organized'],
  },
};

/**
 * Build category dictionary from UVP product/service data
 */
export function buildCategoryDictionary(
  productsServices?: string,
  uniqueSolution?: string
): CategoryDictionary {
  const primary: Set<string> = new Set();
  const productType: Set<string> = new Set();
  const outcomes: Set<string> = new Set();

  const textToAnalyze = `${productsServices ?? ''} ${uniqueSolution ?? ''}`.toLowerCase();

  // Find matching category expansions
  for (const [key, expansion] of Object.entries(CATEGORY_EXPANSIONS)) {
    // Check if any primary terms match
    const matches = expansion.primary.some(p => textToAnalyze.includes(p.toLowerCase()));

    if (matches) {
      expansion.primary.forEach(p => primary.add(p));
      expansion.productType.forEach(p => productType.add(p));
      expansion.outcomes.forEach(o => outcomes.add(o));
    }
  }

  // Extract additional terms from the text
  const keywords = extractKeywords(textToAnalyze);
  keywords.forEach(k => primary.add(k));

  return {
    primary: Array.from(primary),
    productType: Array.from(productType),
    outcomes: Array.from(outcomes),
  };
}

/**
 * Extract keywords from text for category matching
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];

  // Common tech/business keywords to extract
  const keywordPatterns = [
    /\b(AI|ML|NLP|API|SaaS|B2B|B2C|CRM|ERP|HR|IT)\b/gi,
    /\b(automation|analytics|intelligence|platform|software|solution|tool|system)\b/gi,
    /\b(cloud|digital|mobile|web|enterprise|startup)\b/gi,
  ];

  for (const pattern of keywordPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  return [...new Set(keywords)];
}

/**
 * Calculate category boost for an insight
 * Returns 1.0 (no boost) to 1.3 (max boost)
 */
export function getCategoryBoost(text: string, dict: CategoryDictionary): number {
  const lowerText = text.toLowerCase();

  // Primary match = 1.3x boost
  if (dict.primary.some(term => lowerText.includes(term.toLowerCase()))) {
    return 1.3;
  }

  // Product type match = 1.2x boost
  if (dict.productType.some(term => lowerText.includes(term.toLowerCase()))) {
    return 1.2;
  }

  // Outcome match = 1.1x boost
  if (dict.outcomes.some(term => lowerText.includes(term.toLowerCase()))) {
    return 1.1;
  }

  // No match = no boost
  return 1.0;
}

/**
 * Check if text matches category dictionary (for informational purposes)
 */
export function matchesCategoryDictionary(text: string, dict: CategoryDictionary): boolean {
  return getCategoryBoost(text, dict) > 1.0;
}

export { CATEGORY_EXPANSIONS };
