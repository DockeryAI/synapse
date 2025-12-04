/**
 * Buyer Persona Types - Extracted from Website Intelligence
 * These personas are dynamically extracted from website content (testimonials, case studies, etc.)
 * NOT pre-built templates - these represent REAL buyers found in the wild
 */

// ============================================================================
// Company Classification
// ============================================================================

export type CompanySize =
  | 'solopreneur'           // 1 person
  | 'micro'                 // 2-9 employees
  | 'small'                 // 10-49 employees
  | 'medium'                // 50-249 employees
  | 'large'                 // 250-999 employees
  | 'enterprise'            // 1000+ employees
  | 'unknown'

export type CompanyType =
  | 'startup'               // Early stage, high growth
  | 'established-business'  // Mature, stable business
  | 'enterprise'            // Large corporation
  | 'nonprofit'             // Mission-driven organization
  | 'government'            // Public sector
  | 'individual'            // B2C customer
  | 'unknown'

// ============================================================================
// Pain Point & Desire Types
// ============================================================================

export type PainPointCategory =
  | 'time'                  // "struggling with time", "takes too long"
  | 'cost'                  // "expensive", "budget concerns"
  | 'complexity'            // "too complicated", "confusing"
  | 'quality'               // "poor quality", "unreliable"
  | 'trust'                 // "can't trust", "worried about scams"
  | 'expertise'             // "don't know how", "lack of knowledge"
  | 'scale'                 // "can't grow", "hit a ceiling"
  | 'risk'                  // "too risky", "afraid of failure"
  | 'access'                // "hard to find", "unavailable"
  | 'other'

export interface PainPoint {
  description: string            // The actual pain point in customer's words
  category: PainPointCategory    // Classified pain type
  intensity: 'critical' | 'high' | 'medium' | 'low'
  frequency: number              // How often this pain point appears (0-100)
  evidence: string[]             // Quotes/sources where this was found
}

export interface DesiredOutcome {
  description: string            // What they want to achieve
  metric?: string                // Measurable outcome (e.g., "save 20 hours/week")
  timeframe?: string             // Expected timeframe (e.g., "within 3 months")
  emotional_benefit?: string     // How they want to feel (e.g., "feel confident")
  evidence: string[]             // Quotes/sources
}

export interface UrgencySignal {
  trigger: string                // What creates urgency (e.g., "tax deadline", "leaky roof")
  signal_type: 'deadline' | 'crisis' | 'opportunity' | 'growth' | 'compliance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  evidence: string[]
}

// ============================================================================
// Role & Industry Detection
// ============================================================================

export interface BuyerRole {
  title: string                  // Job title (e.g., "Marketing Director", "CEO")
  seniority: 'executive' | 'director' | 'manager' | 'individual-contributor' | 'owner' | 'unknown'
  department?: string            // Department/function (e.g., "Marketing", "Operations")
  is_decision_maker: boolean     // Are they the final decision maker?
  influence_level: 'high' | 'medium' | 'low'
}

export interface IndustryContext {
  primary_industry: string       // Main industry (e.g., "Healthcare", "Finance")
  sub_industry?: string          // More specific (e.g., "Dental Practices", "Wealth Management")
  industry_keywords: string[]    // Terms that identify this industry
  vertical_specificity: number   // How niche is this? (0-100, higher = more niche)
}

// ============================================================================
// Behavioral Patterns
// ============================================================================

export interface BuyingBehavior {
  decision_speed: 'impulse' | 'fast' | 'moderate' | 'slow' | 'very-slow'
  research_intensity: 'minimal' | 'light' | 'moderate' | 'heavy' | 'exhaustive'
  price_sensitivity: 'low' | 'medium' | 'high'
  relationship_vs_transactional: 'relationship' | 'mixed' | 'transactional'
  evidence: string[]
}

export interface SuccessMetrics {
  metric: string                 // The metric they care about
  baseline?: string              // Where they started
  achieved?: string              // What they achieved
  improvement?: string           // Percentage or absolute improvement
  category: 'revenue' | 'cost' | 'time' | 'quality' | 'satisfaction' | 'growth' | 'other'
}

// ============================================================================
// Extracted Buyer Persona (Main Type)
// ============================================================================

export interface BuyerPersona {
  id: string                           // Unique persona ID
  brand_id?: string                    // Brand this persona belongs to (for database compatibility)

  // Identity
  name?: string                        // Alternative name field (for database compatibility)
  persona_name: string                 // Descriptive name (e.g., "Time-Starved Agency Owners")
  role: BuyerRole | string             // Job role and seniority (can be string for simplified storage)
  company_type: CompanyType | string   // Type of company they work for
  company_size?: CompanySize           // Size of company
  industry?: IndustryContext | string  // Industry details

  // Pain & Desire
  pain_points: PainPoint[] | string[]  // Top 3-7 pain points (can be simple strings)
  desired_outcomes: DesiredOutcome[] | string[]   // What they want to achieve
  urgency_signals?: UrgencySignal[]    // What drives urgency

  // Behavioral Patterns
  buying_behavior?: BuyingBehavior     // How they buy
  success_metrics?: SuccessMetrics[]   // How they measure success

  // Drivers (for UVP compatibility)
  emotional_drivers?: string[]         // Emotional motivations
  functional_drivers?: string[]        // Functional needs

  // Intelligence Metadata
  confidence_score?: number            // How confident are we? (0-100)
  sample_size?: number                 // How many testimonials/case studies contributed
  evidence_sources?: EvidenceSource[]  // Where did we find this data
  source?: string                      // Source of persona data (e.g., 'uvp_flow', 'website')

  // Extracted Quotes (for validation)
  representative_quotes?: string[]     // 2-3 quotes that exemplify this persona
}

export interface EvidenceSource {
  type: 'testimonial' | 'case-study' | 'review' | 'about-page' | 'service-page' | 'faq' | 'other'
  location: string                     // Where on the website
  snippet: string                      // Relevant excerpt
  relevance_score: number              // How relevant is this? (0-100)
}

// ============================================================================
// Extraction Results (Service Output)
// ============================================================================

export interface BuyerIntelligenceResult {
  personas: BuyerPersona[]             // 5-7 distinct personas
  total_evidence_points: number        // Total data points analyzed
  extraction_quality: 'excellent' | 'good' | 'fair' | 'poor'
  extraction_timestamp: string         // When was this extracted

  // Rollup insights
  common_pain_points: PainPoint[]      // Pain points across ALL personas
  common_outcomes: DesiredOutcome[]    // Outcomes that appear frequently
  industry_patterns: string[]          // Industry-specific patterns detected

  // Warnings/Notes
  data_gaps: string[]                  // What data was missing
  assumptions_made: string[]           // Where we had to infer
}

// ============================================================================
// Pattern Matching Types (for extraction logic)
// ============================================================================

export interface PainPointPattern {
  keywords: string[]                   // Keywords that signal this pain
  regex?: RegExp                       // Optional regex pattern
  category: PainPointCategory
  intensity_indicators: {
    critical: string[]                 // Words that indicate critical pain
    high: string[]
    medium: string[]
    low: string[]
  }
}

export interface RolePattern {
  titles: string[]                     // Job titles to match
  keywords: string[]                   // Keywords in testimonials
  seniority: BuyerRole['seniority']
}

export interface CompanySizeIndicator {
  keywords: string[]                   // Words that signal company size
  size: CompanySize
}

// ============================================================================
// Pain Point Signal Patterns (for extraction)
// ============================================================================

export const PAIN_SIGNAL_PATTERNS: PainPointPattern[] = [
  {
    keywords: ['struggling with', 'wasting time', 'takes too long', 'time-consuming', 'slow process'],
    category: 'time',
    intensity_indicators: {
      critical: ['crisis', 'emergency', 'immediately', 'desperate'],
      high: ['urgent', 'quickly', 'ASAP', 'soon'],
      medium: ['would like', 'hoping to', 'planning to'],
      low: ['eventually', 'someday', 'considering']
    }
  },
  {
    keywords: ['too expensive', 'can\'t afford', 'budget concerns', 'costly', 'overpriced'],
    category: 'cost',
    intensity_indicators: {
      critical: ['can\'t afford', 'breaking the bank', 'going broke'],
      high: ['expensive', 'costly', 'budget tight'],
      medium: ['would prefer cheaper', 'looking for value'],
      low: ['nice to save', 'bonus if affordable']
    }
  },
  {
    keywords: ['too complicated', 'confusing', 'hard to understand', 'overwhelmed', 'complex'],
    category: 'complexity',
    intensity_indicators: {
      critical: ['completely lost', 'no idea', 'helpless'],
      high: ['very confusing', 'overwhelming', 'frustrated'],
      medium: ['bit complex', 'learning curve'],
      low: ['slightly confusing', 'minor issue']
    }
  },
  {
    keywords: ['unreliable', 'poor quality', 'inconsistent', 'disappointing', 'subpar'],
    category: 'quality',
    intensity_indicators: {
      critical: ['completely failed', 'disaster', 'terrible'],
      high: ['very poor', 'unacceptable', 'frustrated'],
      medium: ['could be better', 'inconsistent'],
      low: ['minor issues', 'small concerns']
    }
  },
  {
    keywords: ['don\'t trust', 'scam', 'worried about', 'afraid of', 'skeptical'],
    category: 'trust',
    intensity_indicators: {
      critical: ['scam', 'fraud', 'rip-off'],
      high: ['very worried', 'serious concerns', 'skeptical'],
      medium: ['cautious', 'hesitant'],
      low: ['slightly concerned', 'want reassurance']
    }
  },
  {
    keywords: ['don\'t know how', 'need help', 'lack expertise', 'no experience', 'not sure how'],
    category: 'expertise',
    intensity_indicators: {
      critical: ['completely clueless', 'no idea', 'lost'],
      high: ['need expert', 'can\'t do it myself'],
      medium: ['would like guidance', 'prefer professional'],
      low: ['minor questions', 'want to learn']
    }
  },
  {
    keywords: ['can\'t scale', 'hit a ceiling', 'growth problems', 'outgrown', 'maxed out'],
    category: 'scale',
    intensity_indicators: {
      critical: ['business at risk', 'losing customers', 'falling behind'],
      high: ['urgent need to scale', 'rapid growth'],
      medium: ['planning to grow', 'expanding'],
      low: ['future growth', 'someday scale']
    }
  },
  {
    keywords: ['too risky', 'afraid of', 'worried it won\'t work', 'might fail', 'uncertain'],
    category: 'risk',
    intensity_indicators: {
      critical: ['terrified', 'could lose everything', 'catastrophic'],
      high: ['very risky', 'major concern'],
      medium: ['some risk', 'cautious'],
      low: ['minor concern', 'manageable risk']
    }
  }
]

// ============================================================================
// Company Size Detection Patterns
// ============================================================================

export const COMPANY_SIZE_INDICATORS: CompanySizeIndicator[] = [
  { keywords: ['solo', 'freelance', 'one-person', 'just me', 'solopreneur'], size: 'solopreneur' },
  { keywords: ['small team', 'few employees', '5 people', 'startup team'], size: 'micro' },
  { keywords: ['small business', 'SMB', 'local business', '20 employees'], size: 'small' },
  { keywords: ['mid-size', 'growing company', '100 employees', 'regional'], size: 'medium' },
  { keywords: ['large company', 'corporate', '500 employees'], size: 'large' },
  { keywords: ['enterprise', 'Fortune 500', '1000+ employees', 'multinational'], size: 'enterprise' }
]

// ============================================================================
// Role Detection Patterns
// ============================================================================

export const ROLE_PATTERNS: RolePattern[] = [
  {
    titles: ['CEO', 'President', 'Founder', 'Owner', 'Managing Director'],
    keywords: ['run the company', 'own the business', 'started the company'],
    seniority: 'executive'
  },
  {
    titles: ['VP', 'Vice President', 'SVP', 'EVP', 'Chief', 'CTO', 'CFO', 'CMO', 'COO'],
    keywords: ['lead the team', 'oversee', 'responsible for department'],
    seniority: 'executive'
  },
  {
    titles: ['Director', 'Head of', 'Lead'],
    keywords: ['manage the team', 'direct reports', 'lead initiatives'],
    seniority: 'director'
  },
  {
    titles: ['Manager', 'Team Lead', 'Supervisor'],
    keywords: ['manage day-to-day', 'supervise', 'coordinate team'],
    seniority: 'manager'
  },
  {
    titles: ['Specialist', 'Coordinator', 'Associate', 'Analyst', 'Consultant'],
    keywords: ['individual contributor', 'hands-on', 'execute'],
    seniority: 'individual-contributor'
  },
  {
    titles: ['Business Owner', 'Proprietor', 'Principal'],
    keywords: ['own', 'self-employed', 'my business'],
    seniority: 'owner'
  }
]
