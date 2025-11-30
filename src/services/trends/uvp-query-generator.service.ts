/**
 * UVP Query Generator Service - V3 (Phase 8: Deep Mining)
 *
 * Completely rewritten to extract brand-relevant keywords from ALL UVP fields,
 * not just specific structured fields that may be empty.
 *
 * The key insight: OpenDialog's UVP has "insurance", "AI agents", "automation"
 * in product names and differentiators, NOT in targetCustomer.industry.
 * We need to extract keywords from everywhere.
 *
 * Phase 8 Enhancements:
 * - Query multiplication (50-100 queries vs 21)
 * - Synonym expansion for key terms
 * - "vs", "alternatives", "problems with" variations
 * - Time-bucketed query support
 *
 * Created: 2025-11-29
 * Updated: 2025-11-30 - Complete rewrite for better keyword extraction
 * Updated: 2025-11-30 - Phase 8: Query multiplication for deep mining
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedQuery {
  query: string;
  type: 'search' | 'news' | 'video' | 'social' | 'ai';
  priority: number;
  sourceKeywords: string[];
  // Phase 10: Added use_case, outcome, persona for diversified queries
  intent: 'trend' | 'pain_point' | 'opportunity' | 'competitor' | 'local' | 'product' | 'use_case' | 'outcome' | 'persona';
}

export interface ProductUseCase {
  /** Product name */
  name: string;
  /** Extracted use case (sales, support, analytics, etc.) */
  useCase: string;
  /** Product category from UVP */
  category: string;
  /** Full description for context */
  description: string;
}

export interface UVPKeywords {
  /** Core industry/vertical terms */
  industry: string[];
  /** Pain points and problems */
  painPoints: string[];
  /** Differentiator keywords */
  differentiators: string[];
  /** Target customer descriptors */
  customerDescriptors: string[];
  /** Location keywords */
  location: string[];
  /** Product/service names and keywords */
  products: string[];
  /** Product use cases with context (Phase 7) */
  productUseCases: ProductUseCase[];
  /** Emotional driver keywords */
  emotionalDrivers: string[];
  /** Functional driver keywords */
  functionalDrivers: string[];
  /** Brand name */
  brandName: string;
}

// ============================================================================
// USE CASE DETECTION - Phase 7
// ============================================================================

/**
 * Use case patterns to extract from product descriptions
 * Maps keywords in descriptions to standardized use case labels
 */
const USE_CASE_PATTERNS: Record<string, string[]> = {
  // Sales & Revenue
  'sales': [
    'sales', 'selling', 'revenue', 'deals', 'pipeline', 'quota', 'closing',
    'prospecting', 'lead generation', 'conversion', 'upsell', 'cross-sell'
  ],
  'sales assistant': [
    'sales assistant', 'sales automation', 'sales ai', 'virtual sales',
    'sales agent', 'sales bot', 'selling assistant'
  ],

  // Customer Support
  'customer support': [
    'support', 'service', 'help desk', 'ticketing', 'resolution',
    'customer care', 'customer service', 'support automation'
  ],
  'contact center': [
    'contact center', 'call center', 'ivr', 'voice', 'telephony',
    'inbound', 'outbound', 'agent assist'
  ],

  // Analytics & Insights
  'analytics': [
    'analytics', 'insights', 'reporting', 'dashboard', 'metrics',
    'data visualization', 'business intelligence', 'bi'
  ],

  // Automation & Operations
  'automation': [
    'automation', 'workflow', 'process', 'rpa', 'orchestration',
    'efficiency', 'streamline', 'automate'
  ],
  'operations': [
    'operations', 'ops', 'operational', 'back office', 'processing',
    'administration', 'management'
  ],

  // Marketing & Engagement
  'marketing': [
    'marketing', 'campaign', 'engagement', 'outreach', 'nurture',
    'content', 'social', 'brand'
  ],

  // Onboarding & Training
  'onboarding': [
    'onboarding', 'training', 'education', 'learning', 'enablement',
    'adoption', 'tutorial'
  ],

  // Compliance & Risk
  'compliance': [
    'compliance', 'regulatory', 'audit', 'risk', 'governance',
    'security', 'policy'
  ],

  // Self-Service
  'self-service': [
    'self-service', 'self service', 'portal', 'faq', 'knowledge base',
    'chatbot', 'virtual assistant'
  ]
};

// ============================================================================
// PHASE 10 REVISED: DYNAMIC EXTRACTION (No Hardcoded Patterns)
// ============================================================================

/**
 * Common action verbs that indicate use cases/tasks
 * These are universal across all industries
 */
const ACTION_VERBS = [
  // Service actions
  'install', 'installation', 'repair', 'repairing', 'maintain', 'maintenance',
  'clean', 'cleaning', 'inspect', 'inspection', 'replace', 'replacement',
  'service', 'servicing', 'fix', 'fixing', 'upgrade', 'upgrading',
  // Scheduling/booking actions
  'schedule', 'scheduling', 'book', 'booking', 'appointment', 'reserve', 'reservation',
  // Processing actions
  'process', 'processing', 'handle', 'handling', 'manage', 'management',
  'automate', 'automation', 'streamline', 'optimize', 'optimization',
  // Communication actions
  'notify', 'notification', 'remind', 'reminder', 'follow-up', 'followup',
  'contact', 'outreach', 'respond', 'response', 'support',
  // Data/document actions
  'track', 'tracking', 'monitor', 'monitoring', 'report', 'reporting',
  'analyze', 'analysis', 'document', 'documentation', 'record', 'recording',
  // Sales/customer actions
  'qualify', 'qualification', 'convert', 'conversion', 'onboard', 'onboarding',
  'collect', 'collection', 'bill', 'billing', 'invoice', 'invoicing',
  // Assessment actions
  'assess', 'assessment', 'evaluate', 'evaluation', 'diagnose', 'diagnosis',
  'estimate', 'estimation', 'quote', 'quoting'
];

/**
 * Outcome indicator words - used to detect outcomes from transformation text
 */
const OUTCOME_INDICATORS = {
  reduction: ['reduce', 'decrease', 'lower', 'minimize', 'cut', 'save', 'eliminate', 'less'],
  increase: ['increase', 'improve', 'boost', 'enhance', 'grow', 'maximize', 'more', 'better'],
  speed: ['faster', 'quicker', 'instant', 'immediate', 'real-time', 'same-day', '24/7', 'always'],
  quality: ['accurate', 'reliable', 'consistent', 'professional', 'quality', 'error-free'],
  scale: ['scale', 'expand', 'grow', 'capacity', 'volume', 'handle more']
};

/**
 * Job title patterns to extract from text
 */
const TITLE_PATTERNS = [
  // C-level
  /\b(ceo|cfo|cio|cto|coo|cmo)\b/i,
  /\bchief\s+\w+\s+officer\b/i,
  // VP level
  /\bvp\s+(?:of\s+)?[\w\s]+/i,
  /\bvice\s+president\s+(?:of\s+)?[\w\s]+/i,
  // Director level
  /\bdirector\s+(?:of\s+)?[\w\s]+/i,
  /\bhead\s+of\s+[\w\s]+/i,
  // Manager level
  /\b[\w\s]+\s+manager\b/i,
  /\bmanager\s+(?:of\s+)?[\w\s]+/i,
  // Owner/Operator
  /\b(owner|operator|proprietor|founder)\b/i,
  /\bbusiness\s+owner\b/i,
  /\bpractice\s+owner\b/i,
  // Specific roles
  /\b(facilities|operations|service|sales|marketing|it|hr|finance)\s+(manager|director|lead)\b/i
];

/**
 * Extract use cases dynamically from product names and descriptions
 * No hardcoded industry-specific patterns - works for ANY industry
 */
function extractUseCasesFromProducts(uvp: CompleteUVP): string[] {
  const useCases: string[] = [];

  if (!uvp.productsServices?.categories) {
    return useCases;
  }

  // Process each product
  uvp.productsServices.categories.forEach(category => {
    category.items.forEach(item => {
      const text = `${item.name} ${item.description || ''} ${category.name}`.toLowerCase();

      // Find action verbs in the text
      for (const verb of ACTION_VERBS) {
        if (text.includes(verb)) {
          // Extract the context around the verb
          const words = text.split(/\s+/);
          const verbIndex = words.findIndex(w => w.includes(verb));

          if (verbIndex >= 0) {
            // Try to get noun after verb (e.g., "scheduling appointments" → "appointment scheduling")
            const nextWord = words[verbIndex + 1];
            const prevWord = words[verbIndex - 1];

            // Build use case phrase
            let useCase = verb;

            // Add context word if meaningful
            if (nextWord && nextWord.length > 3 && !ACTION_VERBS.includes(nextWord)) {
              useCase = `${nextWord} ${verb}`;
            } else if (prevWord && prevWord.length > 3 && !ACTION_VERBS.includes(prevWord)) {
              useCase = `${prevWord} ${verb}`;
            }

            // Clean up and normalize
            useCase = useCase.replace(/ing$/, '').trim();
            if (useCase.length > 3) {
              useCases.push(useCase);
            }
          }
        }
      }

      // Also extract noun phrases that indicate services/use cases
      // e.g., "HVAC Installation" → "HVAC installation"
      const nounPhrases = text.match(/\b(\w+)\s+(service|system|solution|platform|tool|automation)\b/gi);
      if (nounPhrases) {
        nounPhrases.forEach(phrase => {
          const clean = phrase.toLowerCase().replace(/\s+(service|system|solution|platform|tool)$/, '');
          if (clean.length > 3) {
            useCases.push(clean);
          }
        });
      }
    });
  });

  // Deduplicate and clean
  const uniqueUseCases = [...new Set(useCases)]
    .filter(uc => uc.length > 3)
    .slice(0, 10);

  console.log('[UVPQueryGen:Phase10:Dynamic] Extracted use cases from products:', uniqueUseCases);
  return uniqueUseCases;
}

/**
 * Extract outcomes dynamically from transformation goal (before → after)
 * No hardcoded patterns - parses the actual UVP text
 */
function extractOutcomesFromTransformation(uvp: CompleteUVP): string[] {
  const outcomes: string[] = [];

  const beforeText = (uvp.transformationGoal?.before || '').toLowerCase();
  const afterText = (uvp.transformationGoal?.after || '').toLowerCase();
  const differentiators = (uvp.uniqueSolution?.differentiators?.map(d => d.statement).join(' ') || '').toLowerCase();
  const functionalDrivers = (uvp.targetCustomer?.functionalDrivers?.join(' ') || '').toLowerCase();

  const allText = `${afterText} ${differentiators} ${functionalDrivers}`;

  // Extract outcomes based on indicator patterns
  for (const [category, indicators] of Object.entries(OUTCOME_INDICATORS)) {
    for (const indicator of indicators) {
      if (allText.includes(indicator)) {
        // Try to extract the full phrase around the indicator
        const regex = new RegExp(`${indicator}\\s+([\\w\\s]{3,30})`, 'gi');
        const matches = allText.match(regex);

        if (matches) {
          matches.forEach(match => {
            const clean = match.trim();
            if (clean.length > 5 && clean.split(' ').length <= 5) {
              outcomes.push(clean);
            }
          });
        } else {
          // Just use the indicator as a base outcome
          outcomes.push(`${indicator} ${category === 'reduction' ? 'costs' : category === 'increase' ? 'efficiency' : 'performance'}`);
        }
      }
    }
  }

  // Extract from "before" text - these are pain points to solve
  if (beforeText) {
    // Look for problem indicators
    const problemIndicators = ['struggling', 'wasting', 'losing', 'missing', 'slow', 'manual', 'inefficient', 'costly'];
    for (const indicator of problemIndicators) {
      if (beforeText.includes(indicator)) {
        // Convert problem to outcome (e.g., "wasting time" → "save time")
        const problemMatch = beforeText.match(new RegExp(`${indicator}\\s+([\\w\\s]{3,20})`, 'i'));
        if (problemMatch) {
          const problem = problemMatch[1].trim();
          // Invert the problem to an outcome
          if (indicator === 'wasting' || indicator === 'losing') {
            outcomes.push(`save ${problem}`);
          } else if (indicator === 'slow') {
            outcomes.push(`faster ${problem}`);
          } else if (indicator === 'manual') {
            outcomes.push(`automate ${problem}`);
          } else {
            outcomes.push(`improve ${problem}`);
          }
        }
      }
    }
  }

  // Deduplicate and clean
  const uniqueOutcomes = [...new Set(outcomes)]
    .filter(o => o.length > 5)
    .slice(0, 8);

  console.log('[UVPQueryGen:Phase10:Dynamic] Extracted outcomes from transformation:', uniqueOutcomes);
  return uniqueOutcomes;
}

/**
 * Extract personas dynamically from target customer
 * No hardcoded title list - parses the actual UVP text
 */
function extractPersonasFromTarget(uvp: CompleteUVP): string[] {
  const personas: string[] = [];

  const roleText = uvp.targetCustomer?.role || '';
  const statementText = uvp.targetCustomer?.statement || '';
  // decisionMakers may not exist on all CustomerProfile types
  const decisionMakers: string[] = (uvp.targetCustomer as { decisionMakers?: string[] })?.decisionMakers || [];

  const allText = `${roleText} ${statementText} ${decisionMakers.join(' ')}`;

  // Extract titles using patterns
  for (const pattern of TITLE_PATTERNS) {
    const matches = allText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const clean = match.trim();
        // Capitalize first letter of each word
        const formatted = clean.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        if (formatted.length > 2) {
          personas.push(formatted);
        }
      });
    }
  }

  // Also check decision makers array directly
  decisionMakers.forEach(dm => {
    if (dm && dm.length > 2) {
      personas.push(dm);
    }
  });

  // If no specific titles found, extract from role description
  if (personas.length === 0 && roleText) {
    // Try to extract the key role
    const roleMatch = roleText.match(/\b([\w\s]+(?:manager|director|owner|operator|lead|head|chief))\b/i);
    if (roleMatch) {
      personas.push(roleMatch[1].trim());
    } else {
      // Just use the role as-is if it's short enough
      if (roleText.length < 50) {
        personas.push(roleText);
      }
    }
  }

  // Deduplicate and clean
  const uniquePersonas = [...new Set(personas)]
    .filter(p => p.length > 2)
    .slice(0, 5);

  console.log('[UVPQueryGen:Phase10:Dynamic] Extracted personas from target:', uniquePersonas);
  return uniquePersonas;
}

// Legacy function wrappers for backwards compatibility
function extractSpecificUseCases(uvp: CompleteUVP): string[] {
  return extractUseCasesFromProducts(uvp);
}

function extractOutcomes(uvp: CompleteUVP): string[] {
  return extractOutcomesFromTransformation(uvp);
}

function extractPersonas(uvp: CompleteUVP): string[] {
  return extractPersonasFromTarget(uvp);
}

// ============================================================================
// PHASE 8: SYNONYM EXPANSION & QUERY VARIATIONS
// ============================================================================

/**
 * Industry synonym mappings for query multiplication
 */
const INDUSTRY_SYNONYMS: Record<string, string[]> = {
  'insurance': ['insurtech', 'insurance industry', 'insurance sector', 'carriers'],
  'conversational AI': ['chatbot', 'virtual assistant', 'AI assistant', 'dialogue AI'],
  'automation': ['RPA', 'process automation', 'workflow automation', 'intelligent automation'],
  'customer experience': ['CX', 'customer service', 'contact center', 'customer support'],
  'financial services': ['fintech', 'banking', 'financial technology'],
  'healthcare': ['healthtech', 'medical', 'health industry'],
  'enterprise software': ['B2B SaaS', 'enterprise tech', 'business software'],
  'marketing': ['martech', 'digital marketing', 'advertising'],
  'sales': ['sales tech', 'revenue operations', 'sales enablement'],
  'analytics': ['business intelligence', 'BI', 'data analytics'],
};

/**
 * Query variation templates for multiplication
 */
const QUERY_VARIATIONS = {
  trend: [
    '{topic} trends {year}',
    '{topic} market trends',
    'emerging {topic} trends',
    '{topic} industry outlook {year}',
    'future of {topic}',
    '{topic} predictions {year}',
  ],
  comparison: [
    '{topic} vs alternatives',
    'best {topic} solutions',
    '{topic} comparison {year}',
    'top {topic} tools',
  ],
  problem: [
    '{topic} challenges',
    '{topic} problems',
    '{topic} issues {year}',
    'common {topic} mistakes',
    'why {topic} fails',
  ],
  opportunity: [
    '{topic} opportunities',
    '{topic} growth areas',
    '{topic} innovations {year}',
    '{topic} disruption',
  ],
  howTo: [
    'how to improve {topic}',
    '{topic} best practices',
    '{topic} strategies {year}',
    '{topic} implementation',
  ]
};

/**
 * Expand a topic into multiple query variations
 */
function expandQueryVariations(
  topic: string,
  variationType: keyof typeof QUERY_VARIATIONS,
  year: number
): string[] {
  const templates = QUERY_VARIATIONS[variationType];
  return templates.map(template =>
    template
      .replace('{topic}', topic)
      .replace('{year}', year.toString())
  );
}

/**
 * Get synonyms for an industry term
 */
function getIndustrySynonyms(industry: string): string[] {
  const lowerIndustry = industry.toLowerCase();
  for (const [key, synonyms] of Object.entries(INDUSTRY_SYNONYMS)) {
    if (lowerIndustry.includes(key.toLowerCase()) || synonyms.some(s => lowerIndustry.includes(s.toLowerCase()))) {
      return [industry, ...synonyms.filter(s => s.toLowerCase() !== lowerIndustry)];
    }
  }
  return [industry];
}

/**
 * Extract use case from product description
 */
function extractUseCase(description: string, name: string): string {
  const lowerDesc = (description + ' ' + name).toLowerCase();

  // Check each use case pattern
  for (const [useCase, patterns] of Object.entries(USE_CASE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerDesc.includes(pattern)) {
        return useCase;
      }
    }
  }

  // Fallback: try to extract from category-like words
  if (lowerDesc.includes('ai') || lowerDesc.includes('assistant')) {
    return 'AI assistant';
  }

  return 'solution'; // Generic fallback
}

/**
 * Extract product use cases from UVP products
 */
function extractProductUseCases(uvp: CompleteUVP): ProductUseCase[] {
  const useCases: ProductUseCase[] = [];

  if (!uvp.productsServices?.categories) {
    return useCases;
  }

  uvp.productsServices.categories.forEach(category => {
    category.items.forEach(item => {
      const useCase = extractUseCase(item.description || '', item.name);

      useCases.push({
        name: item.name,
        useCase,
        category: category.name,
        description: item.description || ''
      });
    });
  });

  console.log('[UVPQueryGen] Extracted product use cases:', useCases.map(u => `${u.name} → ${u.useCase}`));

  return useCases;
}

// ============================================================================
// INDUSTRY DETECTION - The Key Fix
// ============================================================================

/**
 * Industry keyword patterns - aligned with triggers profile-detection.service.ts
 * Comprehensive patterns to detect specialty from ANY text in the UVP
 */
const INDUSTRY_PATTERNS: Record<string, string[]> = {
  // Conversational AI / Enterprise AI (OpenDialog's specialty)
  'conversational AI': [
    'conversational ai', 'chatbot', 'nlp', 'nlu', 'enterprise ai',
    'customer service automation', 'contact center', 'cx platform',
    'dialogue management', 'virtual assistant', 'bot platform',
    'ai agent', 'ai agents', 'agent management', 'intelligent automation'
  ],

  // Insurance (OpenDialog's vertical)
  'insurance': [
    'insurance', 'insurtech', 'claims', 'underwriting', 'policyholder',
    'carrier', 'broker', 'policy', 'premium', 'coverage', 'risk management',
    'insurance operations', 'claims processing', 'policy administration'
  ],

  // Financial Services (removed 'financial' - too generic, matches 'financing')
  'financial services': [
    'banking', 'fintech', 'lending', 'mortgage', 'credit', 'wealth management',
    'financial services', 'payments', 'investment', 'trading', 'compliance',
    'bank', 'financial institution', 'financial technology'
  ],

  // Healthcare
  'healthcare': [
    'healthcare', 'medical', 'health tech', 'patient', 'clinical',
    'hospital', 'pharma', 'telehealth', 'ehr', 'emr', 'medical device'
  ],

  // SaaS / Enterprise Software
  'enterprise software': [
    'saas', 'software', 'platform', 'api', 'integration', 'dashboard',
    'cloud', 'subscription', 'enterprise software', 'b2b software'
  ],

  // Automation / Process
  'automation': [
    'automation', 'workflow', 'rpa', 'process automation', 'orchestration',
    'intelligent process', 'business process', 'digital transformation'
  ],

  // Customer Experience
  'customer experience': [
    'customer experience', 'cx', 'customer service', 'contact center',
    'call center', 'support', 'customer success', 'self-service'
  ],

  // Marketing / Agency
  'marketing': [
    'marketing', 'advertising', 'digital marketing', 'content marketing',
    'seo', 'social media', 'brand', 'campaign', 'creative agency'
  ],

  // Consulting / Professional Services
  'consulting': [
    'consulting', 'advisory', 'professional services', 'strategy',
    'management consulting', 'implementation', 'transformation'
  ],

  // Retail / E-commerce
  'retail': [
    'retail', 'ecommerce', 'e-commerce', 'shopping', 'checkout',
    'omnichannel', 'store', 'commerce', 'merchandising'
  ],

  // Local Services B2B
  'commercial services': [
    'hvac', 'plumbing', 'electrical', 'it services', 'managed services',
    'commercial cleaning', 'security', 'landscaping', 'facilities'
  ],

  // Local Services B2C
  'local services': [
    'dental', 'salon', 'spa', 'restaurant', 'fitness', 'gym',
    'pet', 'auto repair', 'home services', 'residential'
  ],
};

/**
 * Detect industries from text by pattern matching
 * Returns industries sorted by match strength (most specific/frequent first)
 */
function detectIndustries(text: string): string[] {
  const lowerText = text.toLowerCase();

  // Track match count and specificity per industry
  const industryScores: Map<string, { matchCount: number; specificityScore: number; patterns: string[] }> = new Map();

  for (const [industry, patterns] of Object.entries(INDUSTRY_PATTERNS)) {
    let matchCount = 0;
    let specificityScore = 0;
    const matchedPatterns: string[] = [];

    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        matchCount++;
        // Multi-word patterns are more specific
        specificityScore += pattern.split(' ').length;
        matchedPatterns.push(pattern);
      }
    }

    if (matchCount > 0) {
      industryScores.set(industry, { matchCount, specificityScore, patterns: matchedPatterns });
    }
  }

  // Sort by: 1) match count (more matches = stronger signal), 2) specificity score
  const sortedIndustries = [...industryScores.entries()]
    .sort((a, b) => {
      // First by match count (descending)
      if (b[1].matchCount !== a[1].matchCount) {
        return b[1].matchCount - a[1].matchCount;
      }
      // Then by specificity (descending)
      return b[1].specificityScore - a[1].specificityScore;
    })
    .map(([industry]) => industry);

  // Also collect matched patterns for query generation
  const matchedPatterns: string[] = [];
  for (const [, data] of industryScores) {
    matchedPatterns.push(...data.patterns);
  }

  // Prioritize specific patterns over generic industry names for queries
  // e.g., "AI agents insurance" is better than "conversational AI enterprise software"
  const prioritizedTerms = [
    ...matchedPatterns.filter(p => p.split(' ').length >= 2), // Multi-word phrases first
    ...sortedIndustries, // Then sorted industry categories
    ...matchedPatterns.filter(p => p.split(' ').length === 1), // Single words last
  ];

  console.log('[UVPQueryGen] Industry detection scores:',
    [...industryScores.entries()].map(([ind, s]) => `${ind}: ${s.matchCount} matches, ${s.specificityScore} specificity`).join(', ')
  );

  return [...new Set(prioritizedTerms)].slice(0, 8);
}

/**
 * Extract ALL text from UVP for analysis
 */
function extractAllUVPText(uvp: CompleteUVP): string {
  const texts: string[] = [];

  // Products - CRITICAL: This is where "insurance", "AI agents" etc live
  if (uvp.productsServices?.categories) {
    uvp.productsServices.categories.forEach(cat => {
      texts.push(cat.name);
      cat.items.forEach(item => {
        texts.push(item.name);
        texts.push(item.description || '');
        texts.push(item.category || '');
      });
    });
  }

  // Target customer
  if (uvp.targetCustomer) {
    texts.push(uvp.targetCustomer.statement || '');
    texts.push(uvp.targetCustomer.industry || '');
    texts.push(uvp.targetCustomer.role || '');
    texts.push(uvp.targetCustomer.companySize || '');
    texts.push(...(uvp.targetCustomer.emotionalDrivers || []));
    texts.push(...(uvp.targetCustomer.functionalDrivers || []));
    texts.push(...(uvp.targetCustomer.evidenceQuotes || []));
  }

  // Transformation goal
  if (uvp.transformationGoal) {
    texts.push(uvp.transformationGoal.statement || '');
    texts.push(uvp.transformationGoal.who || '');
    texts.push(uvp.transformationGoal.before || '');
    texts.push(uvp.transformationGoal.after || '');
    texts.push(uvp.transformationGoal.how || '');
    texts.push(uvp.transformationGoal.why || '');
    texts.push(...(uvp.transformationGoal.emotionalDrivers || []));
    texts.push(...(uvp.transformationGoal.functionalDrivers || []));
    uvp.transformationGoal.customerQuotes?.forEach(q => texts.push(q.text));
  }

  // Unique solution
  if (uvp.uniqueSolution) {
    texts.push(uvp.uniqueSolution.statement || '');
    texts.push(uvp.uniqueSolution.methodology || '');
    texts.push(uvp.uniqueSolution.proprietaryApproach || '');
    uvp.uniqueSolution.differentiators?.forEach(d => {
      texts.push(d.statement);
      texts.push(d.evidence || '');
    });
  }

  // Key benefit
  if (uvp.keyBenefit) {
    texts.push(uvp.keyBenefit.statement || '');
    texts.push(uvp.keyBenefit.outcomeStatement || '');
  }

  // Value proposition statement
  if (uvp.valuePropositionStatement) {
    texts.push(uvp.valuePropositionStatement);
  }

  return texts.filter(Boolean).join(' ');
}

// ============================================================================
// KEYWORD EXTRACTION - V2
// ============================================================================

/**
 * Extract meaningful keywords from text
 */
function extractKeywordsFromText(text: string, minLength = 3): string[] {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'this', 'that', 'these', 'those', 'it', 'its', 'we', 'they', 'our', 'their',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'also', 'now', 'new', 'like', 'make', 'way', 'need', 'use', 'get',
    'any', 'many', 'much', 'well', 'back', 'even', 'want', 'first', 'year'
  ]);

  // Extract single words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= minLength && !stopWords.has(w));

  // Extract 2-word and 3-word phrases
  const phrases: string[] = [];
  const wordArray = text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);

  for (let i = 0; i < wordArray.length - 1; i++) {
    const w1 = wordArray[i];
    const w2 = wordArray[i + 1];

    // 2-word phrase (skip if both are stop words)
    if (!stopWords.has(w1) || !stopWords.has(w2)) {
      const phrase2 = `${w1} ${w2}`;
      if (phrase2.length >= 5) phrases.push(phrase2);
    }

    // 3-word phrase
    if (i < wordArray.length - 2) {
      const w3 = wordArray[i + 2];
      if (!stopWords.has(w1) || !stopWords.has(w3)) {
        const phrase3 = `${w1} ${w2} ${w3}`;
        if (phrase3.length >= 8) phrases.push(phrase3);
      }
    }
  }

  return [...new Set([...words, ...phrases])];
}

/**
 * Extract UVP keywords - V2 with industry detection
 */
export function extractUVPKeywords(uvp: CompleteUVP): UVPKeywords {
  const allText = extractAllUVPText(uvp);

  // DEBUG: Log what text we're analyzing
  console.log('[UVPQueryGen] Analyzing UVP text (first 500 chars):', allText.substring(0, 500));

  // Detect industries from ALL text
  const detectedIndustries = detectIndustries(allText);
  console.log('[UVPQueryGen] Detected industries from UVP:', detectedIndustries);

  // Extract product names (these are gold for queries)
  const productNames: string[] = [];
  if (uvp.productsServices?.categories) {
    uvp.productsServices.categories.forEach(cat => {
      productNames.push(cat.name);
      cat.items.forEach(item => {
        productNames.push(item.name);
      });
    });
  }

  // Extract pain points from transformation goal
  const painPoints: string[] = [];
  if (uvp.transformationGoal) {
    if (uvp.transformationGoal.before) {
      painPoints.push(...extractKeywordsFromText(uvp.transformationGoal.before));
    }
    if (uvp.transformationGoal.emotionalDrivers) {
      painPoints.push(...uvp.transformationGoal.emotionalDrivers);
    }
    if (uvp.transformationGoal.functionalDrivers) {
      painPoints.push(...uvp.transformationGoal.functionalDrivers);
    }
  }

  // Extract differentiator keywords
  const differentiators: string[] = [];
  if (uvp.uniqueSolution?.differentiators) {
    uvp.uniqueSolution.differentiators.forEach(d => {
      differentiators.push(...extractKeywordsFromText(d.statement));
    });
  }
  if (uvp.uniqueSolution?.methodology) {
    differentiators.push(...extractKeywordsFromText(uvp.uniqueSolution.methodology));
  }

  // Extract customer descriptors
  const customerDescriptors: string[] = [];
  if (uvp.targetCustomer) {
    if (uvp.targetCustomer.statement) {
      customerDescriptors.push(...extractKeywordsFromText(uvp.targetCustomer.statement));
    }
    if (uvp.targetCustomer.role) customerDescriptors.push(uvp.targetCustomer.role);
    if (uvp.targetCustomer.companySize) customerDescriptors.push(uvp.targetCustomer.companySize);
  }

  // Location
  const location: string[] = [];
  if (uvp.targetCustomer?.marketGeography) {
    const geo = uvp.targetCustomer.marketGeography;
    if (geo.headquarters) location.push(geo.headquarters);
    if (geo.primaryRegions) location.push(...geo.primaryRegions);
    if (geo.focusMarkets) location.push(...geo.focusMarkets);
  }

  // Emotional drivers
  const emotionalDrivers = [
    ...(uvp.targetCustomer?.emotionalDrivers || []),
    ...(uvp.transformationGoal?.emotionalDrivers || [])
  ];

  // Functional drivers
  const functionalDrivers = [
    ...(uvp.targetCustomer?.functionalDrivers || []),
    ...(uvp.transformationGoal?.functionalDrivers || [])
  ];

  // Determine brand name
  let brandName = 'Brand';
  if (productNames.length > 0) {
    // Try to extract brand name from first product (e.g., "OpenDialog AI Agent...")
    const firstProduct = productNames[0];
    const words = firstProduct.split(/\s+/);
    if (words.length > 0) {
      brandName = words[0]; // Use first word as brand name heuristic
    }
  }

  // Phase 7: Extract product use cases
  const productUseCases = extractProductUseCases(uvp);

  const keywords: UVPKeywords = {
    industry: [...new Set(detectedIndustries)].slice(0, 5),
    painPoints: [...new Set(painPoints)].slice(0, 20),
    differentiators: [...new Set(differentiators)].slice(0, 20),
    customerDescriptors: [...new Set(customerDescriptors)].slice(0, 10),
    location: [...new Set(location)].slice(0, 5),
    products: [...new Set(productNames)].slice(0, 10),
    productUseCases, // Phase 7
    emotionalDrivers: [...new Set(emotionalDrivers)].slice(0, 10),
    functionalDrivers: [...new Set(functionalDrivers)].slice(0, 10),
    brandName
  };

  console.log('[UVPQueryGen] Extracted keywords:', {
    industries: keywords.industry,
    products: keywords.products.slice(0, 3),
    productUseCases: keywords.productUseCases.map(p => `${p.name} → ${p.useCase}`),
    painPoints: keywords.painPoints.slice(0, 3)
  });

  return keywords;
}

// ============================================================================
// QUERY GENERATION - V2
// ============================================================================

/**
 * Generate brand-specific trend queries
 */
export function generateTrendQueries(uvp: CompleteUVP): GeneratedQuery[] {
  const keywords = extractUVPKeywords(uvp);
  const queries: GeneratedQuery[] = [];
  const currentYear = new Date().getFullYear();

  // Primary industry terms (the most important!)
  const primaryIndustry = keywords.industry[0] || 'technology';
  const secondaryIndustry = keywords.industry[1];

  // Product keywords for queries (legacy - still used for some queries)
  const productKeywords = keywords.products.length > 0
    ? extractKeywordsFromText(keywords.products.join(' ')).slice(0, 5)
    : [];

  // Phase 7: Product use cases for targeted queries
  const productUseCases = keywords.productUseCases.slice(0, 3); // Top 3 products

  console.log('[UVPQueryGen] Building queries with:', {
    primaryIndustry,
    secondaryIndustry,
    productKeywords,
    productUseCases: productUseCases.map(p => `${p.name} → ${p.useCase}`)
  });

  // =========================================================================
  // PHASE 7: PRODUCT USE CASE QUERIES (40% of queries - highest priority)
  // =========================================================================

  // For each major product, generate use case + industry queries
  productUseCases.forEach((product, idx) => {
    const useCase = product.useCase;
    const productName = product.name;

    // 1. Use case + industry trend query (e.g., "AI sales insurance trends 2025")
    queries.push({
      query: `${useCase} ${primaryIndustry} trends ${currentYear}`,
      type: 'search',
      priority: 100 - idx * 2, // Highest priority
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'product'
    });

    // 2. Product category + industry (e.g., "sales automation insurance trends")
    if (product.category) {
      queries.push({
        query: `${product.category} ${primaryIndustry} trends ${currentYear}`,
        type: 'search',
        priority: 98 - idx * 2,
        sourceKeywords: [product.category, primaryIndustry],
        intent: 'product'
      });
    }

    // 3. Use case + secondary industry if available (e.g., "AI sales conversational AI trends")
    if (secondaryIndustry && idx === 0) { // Only for top product
      queries.push({
        query: `${useCase} ${secondaryIndustry} market trends`,
        type: 'search',
        priority: 96,
        sourceKeywords: [useCase, secondaryIndustry],
        intent: 'product'
      });
    }

    // 4. Product-specific news query
    if (idx < 2) { // Top 2 products get news queries
      queries.push({
        query: `${useCase} ${primaryIndustry} news ${currentYear}`,
        type: 'news',
        priority: 95 - idx * 3,
        sourceKeywords: [useCase, primaryIndustry],
        intent: 'product'
      });
    }

    // 5. Product-specific video query (for top product only)
    if (idx === 0) {
      queries.push({
        query: `${useCase} ${primaryIndustry} ${currentYear}`,
        type: 'video',
        priority: 92,
        sourceKeywords: [useCase, primaryIndustry],
        intent: 'product'
      });
    }
  });

  // =========================================================================
  // INDUSTRY QUERIES (40% of queries)
  // =========================================================================

  // 1. Core industry trend query
  queries.push({
    query: `${primaryIndustry} industry trends ${currentYear}`,
    type: 'search',
    priority: 88,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // 2. Combine industries if we have two (e.g., "AI insurance trends")
  if (secondaryIndustry) {
    queries.push({
      query: `${secondaryIndustry} ${primaryIndustry} trends ${currentYear}`,
      type: 'search',
      priority: 86,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });
  }

  // =========================================================================
  // PAIN POINT QUERIES (20% of queries)
  // =========================================================================

  // Pain point queries
  keywords.painPoints.slice(0, 2).forEach((painPoint, idx) => {
    queries.push({
      query: `${primaryIndustry} ${painPoint} solutions`,
      type: 'search',
      priority: 80 - idx * 3,
      sourceKeywords: [primaryIndustry, painPoint],
      intent: 'pain_point'
    });
  });

  // =========================================================================
  // NEWS QUERIES (industry-level, product news handled in Phase 7 section)
  // =========================================================================

  queries.push({
    query: `${primaryIndustry} ${secondaryIndustry || 'technology'} news ${currentYear}`,
    type: 'news',
    priority: 75,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // =========================================================================
  // VIDEO QUERIES (industry-level, product videos handled in Phase 7 section)
  // =========================================================================

  queries.push({
    query: `${primaryIndustry} ${secondaryIndustry || ''} trends ${currentYear}`.trim(),
    type: 'video',
    priority: 70,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // =========================================================================
  // SOCIAL/REDDIT QUERIES - Use product use cases
  // =========================================================================

  // Use top product use case for social queries
  const topUseCase = productUseCases[0]?.useCase || primaryIndustry;

  queries.push({
    query: `${topUseCase} ${primaryIndustry} challenges`,
    type: 'social',
    priority: 78,
    sourceKeywords: [topUseCase, primaryIndustry],
    intent: 'pain_point'
  });

  // Customer role specific
  if (keywords.customerDescriptors[0]) {
    queries.push({
      query: `${keywords.customerDescriptors[0]} ${primaryIndustry} problems`,
      type: 'social',
      priority: 75,
      sourceKeywords: [keywords.customerDescriptors[0], primaryIndustry],
      intent: 'pain_point'
    });
  }

  // =========================================================================
  // AI SYNTHESIS QUERIES - Use product use cases for context
  // =========================================================================

  const customerContext = keywords.customerDescriptors.slice(0, 2).join(', ') || 'businesses';
  // Use product use cases for better AI context
  const useCaseContext = productUseCases.slice(0, 2).map(p => p.useCase).join(', ') || 'solutions';

  queries.push({
    query: `What are the top emerging trends in ${primaryIndustry} for ${currentYear}? Focus on trends relevant to ${customerContext} dealing with ${useCaseContext}. Include specific market data and adoption rates.`.trim(),
    type: 'ai',
    priority: 85,
    sourceKeywords: [primaryIndustry, ...productUseCases.slice(0, 2).map(p => p.useCase)],
    intent: 'trend'
  });

  // Product-specific AI synthesis
  if (productUseCases[0]) {
    queries.push({
      query: `What are the latest innovations and trends in ${productUseCases[0].useCase} for ${primaryIndustry}? Focus on ${productUseCases[0].category || 'technology'} solutions. Include competitor activity and market growth.`,
      type: 'ai',
      priority: 90,
      sourceKeywords: [productUseCases[0].useCase, primaryIndustry],
      intent: 'product'
    });
  }

  // Pain point synthesis
  if (keywords.painPoints[0]) {
    queries.push({
      query: `What market opportunities exist in ${primaryIndustry} for solving ${keywords.painPoints[0]}? Include growth projections and adoption trends.`,
      type: 'ai',
      priority: 82,
      sourceKeywords: [primaryIndustry, keywords.painPoints[0]],
      intent: 'opportunity'
    });
  }

  // Log generated queries
  console.log('[UVPQueryGen] Generated', queries.length, 'queries');
  queries.slice(0, 5).forEach(q => console.log(`  [${q.type}] ${q.query}`));

  return queries.sort((a, b) => b.priority - a.priority);
}

/**
 * Get queries for a specific API type
 */
export function getQueriesForType(
  queries: GeneratedQuery[],
  type: GeneratedQuery['type']
): GeneratedQuery[] {
  return queries.filter(q => q.type === type);
}

// ============================================================================
// PHASE 8: DEEP MINING QUERY GENERATOR
// ============================================================================

/**
 * Generate multiplied queries for deep mining (50-100 queries)
 * Uses synonym expansion, variation templates, and cross-product combinations
 */
export function generateDeepMiningQueries(uvp: CompleteUVP): GeneratedQuery[] {
  const keywords = extractUVPKeywords(uvp);
  const queries: GeneratedQuery[] = [];
  const currentYear = new Date().getFullYear();
  const seenQueries = new Set<string>();

  // Helper to add unique queries
  const addQuery = (query: GeneratedQuery) => {
    const key = query.query.toLowerCase().trim();
    if (!seenQueries.has(key)) {
      seenQueries.add(key);
      queries.push(query);
    }
  };

  // Get primary terms with synonyms
  const primaryIndustry = keywords.industry[0] || 'technology';
  const industrySynonyms = getIndustrySynonyms(primaryIndustry).slice(0, 3);
  const secondaryIndustry = keywords.industry[1];

  // Get top product use cases
  const productUseCases = keywords.productUseCases.slice(0, 3);

  console.log('[UVPQueryGen:DeepMining] Starting with:', {
    industries: industrySynonyms,
    useCases: productUseCases.map(p => p.useCase),
    painPoints: keywords.painPoints.slice(0, 3)
  });

  // =========================================================================
  // 1. INDUSTRY TREND VARIATIONS (across synonyms)
  // =========================================================================

  for (const industry of industrySynonyms) {
    // Trend variations
    expandQueryVariations(industry, 'trend', currentYear).forEach((q, idx) => {
      addQuery({
        query: q,
        type: 'search',
        priority: 95 - idx * 2,
        sourceKeywords: [industry],
        intent: 'trend'
      });
    });

    // Problem variations (only for primary)
    if (industry === primaryIndustry) {
      expandQueryVariations(industry, 'problem', currentYear).slice(0, 3).forEach((q, idx) => {
        addQuery({
          query: q,
          type: 'search',
          priority: 85 - idx * 2,
          sourceKeywords: [industry],
          intent: 'pain_point'
        });
      });
    }
  }

  // =========================================================================
  // 2. PRODUCT USE CASE VARIATIONS
  // =========================================================================

  for (const product of productUseCases) {
    const useCase = product.useCase;

    // Trend variations for use case + industry
    addQuery({
      query: `${useCase} ${primaryIndustry} trends ${currentYear}`,
      type: 'search',
      priority: 98,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'product'
    });

    addQuery({
      query: `${useCase} market growth ${currentYear}`,
      type: 'search',
      priority: 96,
      sourceKeywords: [useCase],
      intent: 'product'
    });

    addQuery({
      query: `${useCase} innovations ${currentYear}`,
      type: 'search',
      priority: 94,
      sourceKeywords: [useCase],
      intent: 'product'
    });

    // Comparison queries
    addQuery({
      query: `best ${useCase} solutions ${primaryIndustry}`,
      type: 'search',
      priority: 88,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'product'
    });

    // News for product
    addQuery({
      query: `${useCase} ${primaryIndustry} news`,
      type: 'news',
      priority: 90,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'product'
    });

    // Video for product
    addQuery({
      query: `${useCase} ${primaryIndustry} ${currentYear}`,
      type: 'video',
      priority: 85,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'product'
    });
  }

  // =========================================================================
  // 3. PAIN POINT VARIATIONS
  // =========================================================================

  keywords.painPoints.slice(0, 5).forEach((painPoint, idx) => {
    addQuery({
      query: `${primaryIndustry} ${painPoint} solutions`,
      type: 'search',
      priority: 80 - idx * 2,
      sourceKeywords: [primaryIndustry, painPoint],
      intent: 'pain_point'
    });

    addQuery({
      query: `how to solve ${painPoint} in ${primaryIndustry}`,
      type: 'search',
      priority: 78 - idx * 2,
      sourceKeywords: [primaryIndustry, painPoint],
      intent: 'pain_point'
    });
  });

  // =========================================================================
  // 4. CROSS-INDUSTRY COMBINATIONS (if secondary exists)
  // =========================================================================

  if (secondaryIndustry) {
    addQuery({
      query: `${primaryIndustry} ${secondaryIndustry} convergence trends`,
      type: 'search',
      priority: 82,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });

    addQuery({
      query: `${secondaryIndustry} in ${primaryIndustry} ${currentYear}`,
      type: 'search',
      priority: 80,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });

    // Use case + secondary industry
    if (productUseCases[0]) {
      addQuery({
        query: `${productUseCases[0].useCase} ${secondaryIndustry} adoption`,
        type: 'search',
        priority: 84,
        sourceKeywords: [productUseCases[0].useCase, secondaryIndustry],
        intent: 'product'
      });
    }
  }

  // =========================================================================
  // 5. NEWS QUERIES (multiplied)
  // =========================================================================

  industrySynonyms.slice(0, 2).forEach((industry, idx) => {
    addQuery({
      query: `${industry} news ${currentYear}`,
      type: 'news',
      priority: 75 - idx * 3,
      sourceKeywords: [industry],
      intent: 'trend'
    });

    addQuery({
      query: `${industry} announcements`,
      type: 'news',
      priority: 73 - idx * 3,
      sourceKeywords: [industry],
      intent: 'trend'
    });
  });

  // =========================================================================
  // 6. VIDEO QUERIES (multiplied)
  // =========================================================================

  addQuery({
    query: `${primaryIndustry} trends ${currentYear}`,
    type: 'video',
    priority: 70,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  addQuery({
    query: `${primaryIndustry} future`,
    type: 'video',
    priority: 68,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  if (secondaryIndustry) {
    addQuery({
      query: `${secondaryIndustry} ${primaryIndustry}`,
      type: 'video',
      priority: 66,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });
  }

  // =========================================================================
  // 7. SOCIAL/REDDIT QUERIES (multiplied)
  // =========================================================================

  addQuery({
    query: `${primaryIndustry} challenges`,
    type: 'social',
    priority: 72,
    sourceKeywords: [primaryIndustry],
    intent: 'pain_point'
  });

  addQuery({
    query: `${primaryIndustry} frustrations`,
    type: 'social',
    priority: 70,
    sourceKeywords: [primaryIndustry],
    intent: 'pain_point'
  });

  if (productUseCases[0]) {
    addQuery({
      query: `${productUseCases[0].useCase} problems`,
      type: 'social',
      priority: 71,
      sourceKeywords: [productUseCases[0].useCase],
      intent: 'pain_point'
    });
  }

  keywords.painPoints.slice(0, 2).forEach((painPoint, idx) => {
    addQuery({
      query: `${painPoint} ${primaryIndustry}`,
      type: 'social',
      priority: 68 - idx * 2,
      sourceKeywords: [painPoint, primaryIndustry],
      intent: 'pain_point'
    });
  });

  // =========================================================================
  // 8. AI SYNTHESIS QUERIES (multiplied)
  // =========================================================================

  const customerContext = keywords.customerDescriptors.slice(0, 2).join(', ') || 'businesses';
  const useCaseContext = productUseCases.slice(0, 2).map(p => p.useCase).join(', ') || 'solutions';

  addQuery({
    query: `What are the top emerging trends in ${primaryIndustry} for ${currentYear}? Focus on trends relevant to ${customerContext} dealing with ${useCaseContext}. Include specific market data and adoption rates.`,
    type: 'ai',
    priority: 92,
    sourceKeywords: [primaryIndustry, ...productUseCases.slice(0, 2).map(p => p.useCase)],
    intent: 'trend'
  });

  addQuery({
    query: `What are the biggest challenges facing ${primaryIndustry} in ${currentYear}? What solutions are gaining traction?`,
    type: 'ai',
    priority: 88,
    sourceKeywords: [primaryIndustry],
    intent: 'pain_point'
  });

  if (productUseCases[0]) {
    addQuery({
      query: `What are the latest innovations and trends in ${productUseCases[0].useCase} for ${primaryIndustry}? Focus on ${productUseCases[0].category || 'technology'} solutions. Include competitor activity and market growth.`,
      type: 'ai',
      priority: 94,
      sourceKeywords: [productUseCases[0].useCase, primaryIndustry],
      intent: 'product'
    });
  }

  if (keywords.painPoints[0]) {
    addQuery({
      query: `What market opportunities exist in ${primaryIndustry} for solving ${keywords.painPoints[0]}? Include growth projections and adoption trends.`,
      type: 'ai',
      priority: 86,
      sourceKeywords: [primaryIndustry, keywords.painPoints[0]],
      intent: 'opportunity'
    });
  }

  // Sort by priority
  const sortedQueries = queries.sort((a, b) => b.priority - a.priority);

  console.log('[UVPQueryGen:DeepMining] Generated', sortedQueries.length, 'queries');
  console.log('[UVPQueryGen:DeepMining] By type:', {
    search: sortedQueries.filter(q => q.type === 'search').length,
    news: sortedQueries.filter(q => q.type === 'news').length,
    video: sortedQueries.filter(q => q.type === 'video').length,
    social: sortedQueries.filter(q => q.type === 'social').length,
    ai: sortedQueries.filter(q => q.type === 'ai').length
  });

  return sortedQueries;
}

// ============================================================================
// PHASE 10 REVISED: DYNAMIC BALANCED QUERY GENERATION
// ============================================================================

/**
 * Generate balanced queries across use cases, industry, outcomes, and personas
 * Target distribution: 40% use case, 30% industry, 20% outcome, 10% persona
 *
 * REVISED: Uses dynamic extraction - no hardcoded industry-specific patterns
 * Works across all 6 business categories
 */
export function generateBalancedQueries(uvp: CompleteUVP): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const currentYear = new Date().getFullYear();
  const seenQueries = new Set<string>();

  // Helper to add unique queries
  const addQuery = (query: GeneratedQuery) => {
    const key = query.query.toLowerCase().trim();
    if (!seenQueries.has(key) && key.length > 10) {
      seenQueries.add(key);
      queries.push(query);
    }
  };

  // Extract all components using dynamic extraction
  const keywords = extractUVPKeywords(uvp);
  const useCases = extractUseCasesFromProducts(uvp);
  const outcomes = extractOutcomesFromTransformation(uvp);
  const personas = extractPersonasFromTarget(uvp);

  const primaryIndustry = keywords.industry[0] || 'business';
  const secondaryIndustry = keywords.industry[1];

  console.log('[UVPQueryGen:Phase10:Dynamic] Starting balanced query generation:', {
    industries: keywords.industry,
    useCases,
    outcomes,
    personas
  });

  // =========================================================================
  // 1. USE CASE QUERIES (40% - dynamic from products)
  // =========================================================================

  for (const useCase of useCases.slice(0, 8)) {
    // Core use case + industry trend query
    addQuery({
      query: `${useCase} ${primaryIndustry} trends ${currentYear}`,
      type: 'search',
      priority: 98,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'use_case'
    });

    // Use case automation trend
    addQuery({
      query: `${useCase} automation trends ${currentYear}`,
      type: 'search',
      priority: 96,
      sourceKeywords: [useCase],
      intent: 'use_case'
    });

    // Use case technology/tools
    addQuery({
      query: `${useCase} software tools ${currentYear}`,
      type: 'search',
      priority: 94,
      sourceKeywords: [useCase],
      intent: 'use_case'
    });

    // Use case news
    addQuery({
      query: `${useCase} ${primaryIndustry} news`,
      type: 'news',
      priority: 90,
      sourceKeywords: [useCase, primaryIndustry],
      intent: 'use_case'
    });

    // Use case video
    addQuery({
      query: `${useCase} best practices ${currentYear}`,
      type: 'video',
      priority: 85,
      sourceKeywords: [useCase],
      intent: 'use_case'
    });

    // Use case social/discussions
    addQuery({
      query: `${useCase} challenges solutions`,
      type: 'social',
      priority: 82,
      sourceKeywords: [useCase],
      intent: 'use_case'
    });
  }

  // =========================================================================
  // 2. INDUSTRY QUERIES (30%)
  // =========================================================================

  // Core industry trend
  addQuery({
    query: `${primaryIndustry} industry trends ${currentYear}`,
    type: 'search',
    priority: 92,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Industry technology adoption
  addQuery({
    query: `${primaryIndustry} technology trends ${currentYear}`,
    type: 'search',
    priority: 90,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Industry automation
  addQuery({
    query: `${primaryIndustry} automation adoption ${currentYear}`,
    type: 'search',
    priority: 88,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Industry digital transformation
  addQuery({
    query: `${primaryIndustry} digital transformation`,
    type: 'search',
    priority: 86,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Secondary industry combinations
  if (secondaryIndustry) {
    addQuery({
      query: `${secondaryIndustry} ${primaryIndustry} trends ${currentYear}`,
      type: 'search',
      priority: 84,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });

    addQuery({
      query: `${secondaryIndustry} in ${primaryIndustry}`,
      type: 'search',
      priority: 82,
      sourceKeywords: [primaryIndustry, secondaryIndustry],
      intent: 'trend'
    });
  }

  // Industry news
  addQuery({
    query: `${primaryIndustry} news ${currentYear}`,
    type: 'news',
    priority: 80,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Industry videos
  addQuery({
    query: `${primaryIndustry} trends ${currentYear}`,
    type: 'video',
    priority: 78,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Industry social discussions
  addQuery({
    query: `${primaryIndustry} challenges ${currentYear}`,
    type: 'social',
    priority: 75,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // =========================================================================
  // 3. OUTCOME QUERIES (20% - dynamic from transformation)
  // =========================================================================

  for (const outcome of outcomes.slice(0, 6)) {
    // Outcome + industry query
    addQuery({
      query: `${outcome} ${primaryIndustry} ${currentYear}`,
      type: 'search',
      priority: 88,
      sourceKeywords: [outcome, primaryIndustry],
      intent: 'outcome'
    });

    // Outcome automation/technology
    addQuery({
      query: `${outcome} automation tools`,
      type: 'search',
      priority: 85,
      sourceKeywords: [outcome],
      intent: 'outcome'
    });

    // Outcome how-to
    addQuery({
      query: `how to ${outcome} ${primaryIndustry}`,
      type: 'search',
      priority: 82,
      sourceKeywords: [outcome, primaryIndustry],
      intent: 'outcome'
    });
  }

  // =========================================================================
  // 4. PERSONA QUERIES (10% - dynamic from target customer)
  // =========================================================================

  for (const persona of personas.slice(0, 3)) {
    // Persona priorities query
    addQuery({
      query: `${persona} ${primaryIndustry} priorities ${currentYear}`,
      type: 'search',
      priority: 78,
      sourceKeywords: [persona, primaryIndustry],
      intent: 'persona'
    });

    // Persona challenges
    addQuery({
      query: `${persona} challenges ${currentYear}`,
      type: 'search',
      priority: 75,
      sourceKeywords: [persona],
      intent: 'persona'
    });

    // Persona technology trends
    addQuery({
      query: `${persona} technology trends`,
      type: 'search',
      priority: 72,
      sourceKeywords: [persona],
      intent: 'persona'
    });
  }

  // =========================================================================
  // 5. AI SYNTHESIS QUERIES (contextual)
  // =========================================================================

  // Use case focused AI query
  if (useCases[0]) {
    addQuery({
      query: `What are the latest trends in ${useCases[0]} for ${primaryIndustry}? Include market adoption, key vendors, and technology innovations for ${currentYear}.`,
      type: 'ai',
      priority: 95,
      sourceKeywords: [useCases[0], primaryIndustry],
      intent: 'use_case'
    });
  }

  // Outcome focused AI query
  if (outcomes[0]) {
    addQuery({
      query: `How are ${primaryIndustry} companies achieving ${outcomes[0]}? What technologies, strategies, and best practices are most effective in ${currentYear}?`,
      type: 'ai',
      priority: 90,
      sourceKeywords: [outcomes[0], primaryIndustry],
      intent: 'outcome'
    });
  }

  // Persona focused AI query
  if (personas[0]) {
    addQuery({
      query: `What are the top priorities for ${personas[0]} in ${primaryIndustry} for ${currentYear}? What automation and technology initiatives are they investing in?`,
      type: 'ai',
      priority: 85,
      sourceKeywords: [personas[0], primaryIndustry],
      intent: 'persona'
    });
  }

  // Industry overview AI query
  addQuery({
    query: `What are the top emerging trends in ${primaryIndustry} for ${currentYear}? Focus on technology adoption, automation, and market changes. Include specific data and examples.`,
    type: 'ai',
    priority: 88,
    sourceKeywords: [primaryIndustry],
    intent: 'trend'
  });

  // Sort by priority
  const sortedQueries = queries.sort((a, b) => b.priority - a.priority);

  // Log distribution
  const distribution = {
    use_case: sortedQueries.filter(q => q.intent === 'use_case').length,
    industry: sortedQueries.filter(q => q.intent === 'trend').length,
    outcome: sortedQueries.filter(q => q.intent === 'outcome').length,
    persona: sortedQueries.filter(q => q.intent === 'persona').length,
    other: sortedQueries.filter(q => !['use_case', 'trend', 'outcome', 'persona'].includes(q.intent)).length
  };

  const total = sortedQueries.length;
  const percentages = {
    use_case: Math.round((distribution.use_case / total) * 100),
    industry: Math.round((distribution.industry / total) * 100),
    outcome: Math.round((distribution.outcome / total) * 100),
    persona: Math.round((distribution.persona / total) * 100)
  };

  console.log('[UVPQueryGen:Phase10:Dynamic] Generated', total, 'queries');
  console.log('[UVPQueryGen:Phase10:Dynamic] Distribution:', distribution);
  console.log('[UVPQueryGen:Phase10:Dynamic] Percentages:', percentages);
  console.log('[UVPQueryGen:Phase10:Dynamic] By type:', {
    search: sortedQueries.filter(q => q.type === 'search').length,
    news: sortedQueries.filter(q => q.type === 'news').length,
    video: sortedQueries.filter(q => q.type === 'video').length,
    social: sortedQueries.filter(q => q.type === 'social').length,
    ai: sortedQueries.filter(q => q.type === 'ai').length
  });

  // Log sample queries for debugging
  console.log('[UVPQueryGen:Phase10:Dynamic] Sample queries:');
  sortedQueries.slice(0, 5).forEach(q => {
    console.log(`  [${q.intent}] ${q.query}`);
  });

  return sortedQueries;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const UVPQueryGenerator = {
  extractKeywords: extractUVPKeywords,
  generateQueries: generateTrendQueries,
  generateDeepMiningQueries,
  generateBalancedQueries, // Phase 10 Revised: Dynamic extraction
  getQueriesForType,
  // Phase 8 helpers
  expandQueryVariations,
  getIndustrySynonyms,
  // Phase 10 Revised: Dynamic extractors (no hardcoded patterns)
  extractUseCasesFromProducts,
  extractOutcomesFromTransformation,
  extractPersonasFromTarget,
  // Legacy aliases for backwards compatibility
  extractSpecificUseCases,
  extractOutcomes,
  extractPersonas
};

export default UVPQueryGenerator;
