/**
 * Industry Dictionary Builder
 *
 * Builds industry-specific term dictionaries from UVP data.
 * Used as a filter layer before connection engine.
 */

export interface IndustryDictionary {
  primary: string[];      // Core industry terms
  synonyms: string[];     // Alternative names
  related: string[];      // Related concepts
  companies?: string[];   // Major players (optional)
  sicCodes?: string[];    // SEC SIC codes for filing filters
}

// Pre-built industry expansions for common verticals
const INDUSTRY_EXPANSIONS: Record<string, IndustryDictionary> = {
  insurance: {
    primary: ['insurance'],
    synonyms: ['insurer', 'carrier', 'underwriter', 'insurtech'],
    related: ['policy', 'premium', 'claims', 'coverage', 'quote', 'underwriting', 'actuarial', 'risk management', 'policyholder'],
    companies: ['MetLife', 'Prudential', 'AIG', 'Allstate', 'State Farm', 'Progressive', 'Geico', 'Liberty Mutual', 'Nationwide', 'Travelers'],
    sicCodes: ['6311', '6321', '6324', '6331', '6351', '6361', '6399'],
  },
  healthcare: {
    primary: ['healthcare', 'health care'],
    synonyms: ['hospital', 'clinical', 'medical', 'health system', 'healthtech'],
    related: ['patient', 'provider', 'EHR', 'EMR', 'HIPAA', 'clinical', 'diagnosis', 'treatment', 'care coordination', 'telehealth'],
    companies: ['UnitedHealth', 'CVS Health', 'Anthem', 'Cigna', 'HCA Healthcare', 'Kaiser', 'Humana'],
    sicCodes: ['8000', '8011', '8021', '8031', '8041', '8042', '8049', '8050', '8060', '8062', '8063', '8069', '8071', '8072', '8082', '8092', '8093', '8099'],
  },
  'financial-services': {
    primary: ['financial services', 'finance', 'banking'],
    synonyms: ['bank', 'fintech', 'lender', 'financial institution'],
    related: ['lending', 'compliance', 'KYC', 'AML', 'wealth management', 'investment', 'credit', 'mortgage', 'payments'],
    companies: ['JPMorgan', 'Bank of America', 'Wells Fargo', 'Citibank', 'Goldman Sachs', 'Morgan Stanley', 'Charles Schwab'],
    sicCodes: ['6000', '6020', '6021', '6022', '6029', '6035', '6036', '6099', '6111', '6141', '6153', '6159', '6162', '6163', '6200', '6211', '6221', '6231', '6282', '6289'],
  },
  'real-estate': {
    primary: ['real estate', 'property'],
    synonyms: ['realty', 'brokerage', 'proptech'],
    related: ['MLS', 'residential', 'commercial', 'listing', 'mortgage', 'closing', 'escrow', 'appraisal', 'title'],
    companies: ['Realogy', 'RE/MAX', 'Keller Williams', 'Coldwell Banker', 'Century 21', 'Zillow', 'Redfin', 'Compass'],
    sicCodes: ['6500', '6510', '6512', '6519', '6531', '6541', '6552', '6553'],
  },
  legal: {
    primary: ['legal', 'law'],
    synonyms: ['law firm', 'attorney', 'lawyer', 'legaltech'],
    related: ['litigation', 'compliance', 'contract', 'counsel', 'discovery', 'paralegal', 'case management', 'billing'],
    sicCodes: ['8111'],
  },
  retail: {
    primary: ['retail', 'store'],
    synonyms: ['retailer', 'merchant', 'e-commerce', 'ecommerce'],
    related: ['inventory', 'POS', 'omnichannel', 'merchandising', 'checkout', 'fulfillment', 'returns'],
    companies: ['Walmart', 'Amazon', 'Target', 'Costco', 'Home Depot', 'Lowes', 'Best Buy', 'Macys'],
    sicCodes: ['5200', '5211', '5231', '5251', '5261', '5271', '5311', '5331', '5399', '5411', '5412', '5421', '5431', '5441', '5451', '5461', '5499', '5500', '5511', '5521', '5531', '5541', '5551', '5561', '5571', '5599', '5600', '5611', '5621', '5632', '5641', '5651', '5661', '5699', '5700', '5712', '5713', '5714', '5719', '5722', '5731', '5734', '5735', '5736', '5812', '5813', '5900', '5912', '5921', '5932', '5941', '5942', '5943', '5944', '5945', '5946', '5947', '5948', '5949', '5961', '5962', '5963', '5983', '5984', '5989', '5992', '5993', '5994', '5995', '5999'],
  },
  restaurant: {
    primary: ['restaurant', 'food service'],
    synonyms: ['hospitality', 'dining', 'foodtech', 'QSR', 'fast food'],
    related: ['reservation', 'POS', 'kitchen', 'menu', 'delivery', 'takeout', 'front of house', 'back of house'],
    sicCodes: ['5812', '5813', '7011'],
  },
  manufacturing: {
    primary: ['manufacturing', 'industrial'],
    synonyms: ['manufacturer', 'production', 'factory'],
    related: ['supply chain', 'inventory', 'logistics', 'quality control', 'lean', 'automation', 'ERP', 'MES'],
    sicCodes: ['2000', '2011', '2013', '2015', '2020', '2021', '2022', '2023', '2024', '2026', '2030', '2032', '2033', '2034', '2035', '2037', '2038', '2041', '2043', '2044', '2045', '2046', '2047', '2048', '2050', '2051', '2052', '2060', '2061', '2062', '2063', '2064', '2066', '2067', '2068', '2070', '2074', '2075', '2076', '2077', '2079', '2080', '2082', '2083', '2084', '2085', '2086', '2087', '2091', '2092', '2095', '2096', '2097', '2098', '2099', '3000', '3011', '3021', '3052', '3053', '3060', '3061', '3069', '3080', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089'],
  },
  construction: {
    primary: ['construction', 'building'],
    synonyms: ['contractor', 'builder', 'construction tech'],
    related: ['project management', 'trades', 'subcontractor', 'permit', 'bidding', 'estimating', 'safety'],
    sicCodes: ['1500', '1510', '1520', '1521', '1522', '1531', '1540', '1541', '1542', '1600', '1611', '1620', '1622', '1623', '1629', '1700', '1711', '1721', '1731', '1741', '1742', '1743', '1751', '1752', '1761', '1771', '1781', '1791', '1793', '1794', '1795', '1796', '1799'],
  },
  technology: {
    primary: ['technology', 'software', 'tech'],
    synonyms: ['SaaS', 'platform', 'cloud', 'IT'],
    related: ['API', 'integration', 'developer', 'enterprise', 'B2B', 'startup', 'product', 'engineering'],
    companies: ['Microsoft', 'Apple', 'Google', 'Amazon', 'Meta', 'Salesforce', 'Oracle', 'SAP', 'ServiceNow', 'Workday'],
    sicCodes: ['7370', '7371', '7372', '7373', '7374', '7375', '7376', '7377', '7378', '7379'],
  },
  education: {
    primary: ['education', 'edtech'],
    synonyms: ['school', 'university', 'learning', 'training'],
    related: ['student', 'teacher', 'curriculum', 'LMS', 'enrollment', 'assessment', 'accreditation'],
    sicCodes: ['8200', '8211', '8221', '8222', '8231', '8243', '8244', '8249', '8299'],
  },
  logistics: {
    primary: ['logistics', 'shipping'],
    synonyms: ['freight', 'transportation', '3PL', 'supply chain'],
    related: ['warehouse', 'fulfillment', 'tracking', 'last mile', 'carrier', 'fleet', 'TMS', 'WMS'],
    sicCodes: ['4200', '4210', '4212', '4213', '4214', '4215', '4220', '4221', '4222', '4225', '4226', '4231'],
  },
  energy: {
    primary: ['energy', 'utilities'],
    synonyms: ['power', 'oil', 'gas', 'renewable', 'cleantech'],
    related: ['grid', 'generation', 'distribution', 'solar', 'wind', 'electric', 'natural gas'],
    sicCodes: ['1300', '1311', '1381', '1382', '1389', '4900', '4911', '4922', '4923', '4924', '4925', '4931', '4932', '4939', '4941', '4952', '4953', '4959', '4961', '4971'],
  },
  'professional-services': {
    primary: ['professional services', 'consulting'],
    synonyms: ['consultant', 'advisory', 'agency'],
    related: ['strategy', 'implementation', 'project', 'engagement', 'client', 'billable', 'utilization'],
    sicCodes: ['8700', '8711', '8712', '8713', '8721', '8731', '8732', '8733', '8734', '8741', '8742', '8743', '8744', '8748'],
  },
};

/**
 * Build industry dictionary from UVP industry field
 */
export function buildIndustryDictionary(industry: string): IndustryDictionary {
  const normalized = industry.toLowerCase().trim();

  // Check for exact or partial matches in pre-built expansions
  for (const [key, dict] of Object.entries(INDUSTRY_EXPANSIONS)) {
    // Check if the industry matches the key or any primary term
    if (normalized.includes(key) || dict.primary.some(p => normalized.includes(p.toLowerCase()))) {
      return dict;
    }
    // Check synonyms
    if (dict.synonyms.some(s => normalized.includes(s.toLowerCase()))) {
      return dict;
    }
  }

  // Fallback: create minimal dictionary from raw input
  return {
    primary: [normalized],
    synonyms: [],
    related: [],
  };
}

/**
 * Check if text matches industry dictionary
 */
export function matchesIndustryDictionary(text: string, dict: IndustryDictionary): boolean {
  const lowerText = text.toLowerCase();

  return (
    dict.primary.some(term => lowerText.includes(term.toLowerCase())) ||
    dict.synonyms.some(term => lowerText.includes(term.toLowerCase())) ||
    dict.related.some(term => lowerText.includes(term.toLowerCase())) ||
    (dict.companies?.some(term => lowerText.includes(term.toLowerCase())) ?? false)
  );
}

/**
 * Get SIC codes for SEC filtering
 */
export function getIndustrySicCodes(dict: IndustryDictionary): string[] {
  return dict.sicCodes ?? [];
}

export { INDUSTRY_EXPANSIONS };
