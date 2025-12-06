/**
 * Audience Dictionary Builder
 *
 * Builds audience/role-specific term dictionaries from UVP data.
 * Used as a filter layer before connection engine.
 */

export interface AudienceDictionary {
  roles: string[];        // Job titles and roles
  departments: string[];  // Department/function names
  functions: string[];    // Business functions and activities
}

// Pre-built role expansions for common buyer personas
const ROLE_EXPANSIONS: Record<string, AudienceDictionary> = {
  executive: {
    roles: ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO', 'CISO', 'CRO', 'CPO', 'VP', 'President', 'Chief', 'C-suite', 'C-level', 'executive'],
    departments: ['executive', 'leadership', 'management', 'board'],
    functions: ['strategy', 'growth', 'risk', 'board', 'investor', 'stakeholder', 'governance'],
  },
  sales: {
    roles: ['sales leader', 'sales manager', 'VP sales', 'CRO', 'sales director', 'account executive', 'AE', 'SDR', 'BDR', 'sales rep', 'sales operations', 'sales ops', 'revenue operations', 'RevOps'],
    departments: ['sales', 'revenue', 'commercial', 'business development'],
    functions: ['quota', 'pipeline', 'conversion', 'close rate', 'deal', 'prospect', 'lead', 'opportunity', 'forecast', 'territory'],
  },
  marketing: {
    roles: ['CMO', 'marketing director', 'VP marketing', 'demand gen', 'growth', 'content', 'brand', 'product marketing', 'PMM', 'marketing manager', 'digital marketing'],
    departments: ['marketing', 'growth', 'brand', 'communications'],
    functions: ['leads', 'attribution', 'brand', 'CAC', 'MQL', 'campaign', 'content', 'SEO', 'paid', 'organic', 'awareness'],
  },
  operations: {
    roles: ['COO', 'operations manager', 'VP operations', 'operations director', 'process', 'efficiency'],
    departments: ['operations', 'ops', 'process'],
    functions: ['efficiency', 'automation', 'cost', 'workflow', 'process improvement', 'lean', 'optimization'],
  },
  it: {
    roles: ['CTO', 'CIO', 'CISO', 'IT director', 'IT manager', 'engineer', 'developer', 'architect', 'DevOps', 'SRE', 'security'],
    departments: ['IT', 'engineering', 'technology', 'development', 'infrastructure', 'security'],
    functions: ['integration', 'security', 'stack', 'infrastructure', 'deployment', 'scalability', 'reliability', 'uptime'],
  },
  finance: {
    roles: ['CFO', 'controller', 'finance director', 'VP finance', 'treasurer', 'FP&A', 'accounting', 'financial analyst'],
    departments: ['finance', 'accounting', 'FP&A', 'treasury'],
    functions: ['ROI', 'budget', 'compliance', 'audit', 'cost', 'revenue', 'margin', 'cash flow', 'forecast'],
  },
  hr: {
    roles: ['CHRO', 'HR director', 'VP HR', 'people ops', 'talent', 'recruiting', 'HR manager', 'people operations'],
    departments: ['HR', 'human resources', 'people', 'talent', 'recruiting'],
    functions: ['hiring', 'retention', 'culture', 'engagement', 'performance', 'compensation', 'benefits', 'onboarding'],
  },
  'customer-success': {
    roles: ['CS', 'customer success manager', 'CSM', 'VP customer success', 'support', 'CX', 'customer experience'],
    departments: ['customer success', 'support', 'CX', 'service'],
    functions: ['churn', 'satisfaction', 'retention', 'NPS', 'CSAT', 'renewal', 'upsell', 'expansion'],
  },
  product: {
    roles: ['CPO', 'product manager', 'PM', 'VP product', 'product director', 'product owner', 'product lead'],
    departments: ['product', 'product management'],
    functions: ['roadmap', 'feature', 'user', 'adoption', 'engagement', 'feedback', 'prioritization', 'backlog'],
  },
  owner: {
    roles: ['owner', 'founder', 'entrepreneur', 'small business owner', 'business owner', 'proprietor', 'partner'],
    departments: ['ownership', 'founding team'],
    functions: ['everything', 'survival', 'growth', 'profit', 'cash flow', 'customers', 'employees'],
  },
  legal: {
    roles: ['general counsel', 'GC', 'legal counsel', 'attorney', 'lawyer', 'VP legal', 'legal director', 'compliance officer'],
    departments: ['legal', 'compliance', 'regulatory'],
    functions: ['contract', 'litigation', 'compliance', 'regulatory', 'risk', 'IP', 'privacy', 'GDPR'],
  },
  procurement: {
    roles: ['procurement', 'purchasing', 'VP procurement', 'procurement manager', 'buyer', 'sourcing'],
    departments: ['procurement', 'purchasing', 'sourcing', 'supply chain'],
    functions: ['vendor', 'supplier', 'contract', 'negotiation', 'RFP', 'RFI', 'cost savings'],
  },
};

/**
 * Build audience dictionary from UVP role and customer profiles
 */
export function buildAudienceDictionary(
  targetRole: string,
  customerProfiles?: Array<{ role?: string }>
): AudienceDictionary {
  const roles: Set<string> = new Set();
  const departments: Set<string> = new Set();
  const functions: Set<string> = new Set();

  // Process target role
  const normalizedRole = targetRole.toLowerCase().trim();
  const matchedExpansion = findMatchingRoleExpansion(normalizedRole);

  if (matchedExpansion) {
    matchedExpansion.roles.forEach(r => roles.add(r));
    matchedExpansion.departments.forEach(d => departments.add(d));
    matchedExpansion.functions.forEach(f => functions.add(f));
  } else {
    // Add raw role if no expansion found
    roles.add(normalizedRole);
  }

  // Process additional customer profiles
  if (customerProfiles) {
    for (const profile of customerProfiles) {
      if (profile.role) {
        const profileExpansion = findMatchingRoleExpansion(profile.role.toLowerCase());
        if (profileExpansion) {
          profileExpansion.roles.forEach(r => roles.add(r));
          profileExpansion.departments.forEach(d => departments.add(d));
          profileExpansion.functions.forEach(f => functions.add(f));
        } else {
          roles.add(profile.role.toLowerCase());
        }
      }
    }
  }

  return {
    roles: Array.from(roles),
    departments: Array.from(departments),
    functions: Array.from(functions),
  };
}

/**
 * Find matching role expansion from pre-built map
 */
function findMatchingRoleExpansion(role: string): AudienceDictionary | null {
  for (const [key, expansion] of Object.entries(ROLE_EXPANSIONS)) {
    // Check key match
    if (role.includes(key)) {
      return expansion;
    }
    // Check if any role term matches
    if (expansion.roles.some(r => role.includes(r.toLowerCase()))) {
      return expansion;
    }
    // Check department match
    if (expansion.departments.some(d => role.includes(d.toLowerCase()))) {
      return expansion;
    }
  }
  return null;
}

/**
 * Check if text matches audience dictionary
 */
export function matchesAudienceDictionary(text: string, dict: AudienceDictionary): boolean {
  const lowerText = text.toLowerCase();

  return (
    dict.roles.some(term => lowerText.includes(term.toLowerCase())) ||
    dict.departments.some(term => lowerText.includes(term.toLowerCase())) ||
    dict.functions.some(term => lowerText.includes(term.toLowerCase()))
  );
}

export { ROLE_EXPANSIONS };
