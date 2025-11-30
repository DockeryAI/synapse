/**
 * Local Relevance Scorer Service
 *
 * Scores local insights based on industry match, location proximity,
 * timing, and content quality.
 */

import type {
  LocalInsight,
  LocalInsightType,
  LocalInsightUrgency,
  LocalInsightTiming,
  LocalQueryConfig,
  RawSerperNewsItem,
  RawSerperPlaceItem,
  RawPerplexityInsight,
} from './types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// RELEVANCE SCORING
// ============================================================================

/**
 * Content types that are NOT useful for local business marketing
 */
const NEGATIVE_CONTENT_PATTERNS = [
  /crash|accident|collision|wreck/i,
  /arrest|crime|theft|robbery|shooting|murder|assault/i,
  /traffic|road.?closure|shut.?down/i,
  /fire|blaze|explosion/i,
  /death|killed|died|obituary/i,
  /lawsuit|sued|court.?case/i,
  /missing.?person|amber.?alert/i,
];

/**
 * Content types that ARE useful for HVAC/home services marketing
 */
const HVAC_POSITIVE_PATTERNS = [
  /home.?show|home.?expo|trade.?show/i,
  /energy.?fair|green.?living|sustainability/i,
  /heat.?wave|cold.?front|freeze|storm.?prep/i,
  /new.?construction|housing.?development/i,
  /community.?event|festival|fair|parade/i,
  /charity|fundrais|volunteer/i,
  /school|graduation|back.?to.?school/i,
  /sports|game.?day|championship/i,
  /holiday|celebration|lighting/i,
  /market|farmers.?market|craft.?fair/i,
];

// ============================================================================
// UVP ALIGNMENT SCORING
// ============================================================================

export interface UVPAlignment {
  targetCustomerMatch: string | null;
  differentiatorMatch: string | null;
  valuePropositionMatch: string | null;
  reasons: string[];
  score: number;
}

/**
 * Check UVP alignment and generate specific alignment reasons
 * Only reports TRUE alignment - events/news that genuinely connect to the business
 */
export function checkUVPAlignment(
  insight: Partial<LocalInsight>,
  uvp: CompleteUVP | undefined
): UVPAlignment {
  const alignment: UVPAlignment = {
    targetCustomerMatch: null,
    differentiatorMatch: null,
    valuePropositionMatch: null,
    reasons: [],
    score: 0,
  };

  if (!uvp) return alignment;

  const textToSearch = `${insight.title || ''} ${insight.description || ''}`.toLowerCase();

  // Get industry context for smarter matching
  const industry = uvp.targetCustomer?.industry;
  const industryStr = typeof industry === 'string' ? industry.toLowerCase() : '';
  const isHVAC = industryStr.includes('hvac') || industryStr.includes('plumbing') || industryStr.includes('heating') || industryStr.includes('cooling');
  const isHomeServices = isHVAC || industryStr.includes('roofing') || industryStr.includes('contractor') || industryStr.includes('landscap');

  // INDUSTRY-SPECIFIC ALIGNMENT CHECKS
  // Only claim UVP alignment if the event GENUINELY relates to the business

  if (isHVAC || isHomeServices) {
    // For HVAC/Home Services - look for home-related events
    const hvacRelevantPatterns = [
      /home\s*(show|expo|fair|improvement)/i,
      /energy\s*(fair|expo|efficient|saving)/i,
      /construction|renovation|remodel/i,
      /new\s*home|housing\s*development/i,
      /neighborhood\s*(association|meeting|event)/i,
      /homeowner\s*(association|meeting)/i,
      /property\s*(expo|fair|show)/i,
      /contractor|trade\s*show/i,
      /green\s*(living|home|building)/i,
      /heat\s*wave|cold\s*snap|freeze|storm\s*prep/i,
    ];

    for (const pattern of hvacRelevantPatterns) {
      if (pattern.test(textToSearch)) {
        const targetStatement = uvp.targetCustomer?.statement || '';
        alignment.targetCustomerMatch = targetStatement;
        alignment.reasons.push(`Directly relevant to homeowners - your target audience`);
        alignment.score += 20;
        break;
      }
    }
  }

  // Check for DIRECT service mentions from categories and items
  const categories = uvp.productsServices?.categories || [];
  let foundServiceMatch = false;

  for (const cat of categories) {
    // Check category name
    const catName = cat?.name || '';
    if (catName && catName.length > 4 && textToSearch.includes(catName.toLowerCase())) {
      alignment.reasons.push(`Relates to your service category: ${catName}`);
      alignment.score += 10;
      foundServiceMatch = true;
      break;
    }

    // Check individual products/services in the category
    const items = cat?.items || [];
    for (const item of items) {
      const itemName = typeof item === 'string' ? item : item?.name || '';
      if (itemName && itemName.length > 4 && textToSearch.includes(itemName.toLowerCase())) {
        alignment.reasons.push(`Mentions your service: ${itemName}`);
        alignment.score += 15;
        foundServiceMatch = true;
        break;
      }
    }
    if (foundServiceMatch) break;
  }

  // COMMUNITY ENGAGEMENT OPPORTUNITIES (not UVP alignment, but content opportunities)
  // These should be scored elsewhere, not as UVP alignment

  return alignment;
}

/**
 * Extract key terms from a statement (nouns, verbs, important phrases)
 */
function extractKeyTerms(statement: string): string[] {
  if (!statement) return [];

  // Remove common stop words and get significant terms
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'their', 'they', 'them', 'who', 'what', 'which', 'this', 'that', 'these', 'those',
    'it', 'its', 'our', 'your', 'we', 'you', 'i', 'me', 'my', 'myself',
  ]);

  // Get words that are 4+ characters and not stop words
  const words = statement.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 4 && !stopWords.has(word));

  // Also look for multi-word phrases
  const phrases: string[] = [];
  const phrasePatterns = [
    /hvac|heating|cooling|air conditioning/gi,
    /home owner|homeowner|property owner/gi,
    /emergency|urgent|same.?day/gi,
    /energy.?efficient|eco.?friendly/gi,
    /family.?owned|locally.?owned/gi,
    /24.?7|around.the.clock/gi,
  ];

  for (const pattern of phrasePatterns) {
    const matches = statement.match(pattern);
    if (matches) {
      phrases.push(...matches.map(m => m.toLowerCase()));
    }
  }

  return [...new Set([...words, ...phrases])];
}

/**
 * Truncate text to specified length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Score a local insight based on relevance factors
 * Now accepts optional UVP for specific alignment checking
 */
export function scoreLocalInsight(
  insight: Partial<LocalInsight>,
  config: LocalQueryConfig,
  uvp?: CompleteUVP
): { score: number; reasons: string[]; uvpAlignment?: UVPAlignment } {
  let score = 30; // Lower base score
  const reasons: string[] = [];

  const textToSearch = `${insight.title || ''} ${insight.description || ''}`.toLowerCase();

  // NEGATIVE: Penalize crime/accident/traffic news heavily
  for (const pattern of NEGATIVE_CONTENT_PATTERNS) {
    if (pattern.test(textToSearch)) {
      score -= 40;
      reasons.push('Negative news (crime/accident) - not suitable for marketing');
      break;
    }
  }

  // POSITIVE: Industry-specific content boost
  const industryLower = config.industry.toLowerCase();
  if (industryLower.includes('hvac') || industryLower.includes('plumbing') || industryLower.includes('heating')) {
    for (const pattern of HVAC_POSITIVE_PATTERNS) {
      if (pattern.test(textToSearch)) {
        score += 25;
        reasons.push('Relevant to home services industry');
        break;
      }
    }
  }

  // Industry keyword match: +20
  if (matchesIndustry(insight, config.industry)) {
    score += 20;
    reasons.push(`Matches ${config.industry} keywords`);
  }

  // Location match: +25 (important!)
  if (isInCity(insight.location, config.location.city) ||
      isInCity(insight.title, config.location.city) ||
      isInCity(insight.description, config.location.city)) {
    score += 25;
    reasons.push(`Located in ${config.location.city}`);
  } else {
    // Penalize if clearly in wrong location
    const wrongLocationPatterns = [
      /chicago|new york|los angeles|miami|seattle|denver|phoenix/i,
    ];
    for (const pattern of wrongLocationPatterns) {
      if (pattern.test(textToSearch) && !textToSearch.includes(config.location.city.toLowerCase())) {
        score -= 30;
        reasons.push('Wrong location');
        break;
      }
    }
  }

  // Timing: +15 for upcoming events
  if (insight.timing) {
    if (insight.timing.isUpcoming && insight.timing.daysUntil !== undefined && insight.timing.daysUntil <= 14) {
      score += 15;
      reasons.push('Upcoming event');
    }
    if (insight.timing.isOngoing) {
      score += 10;
      reasons.push('Currently happening');
    }
    if (insight.timing.isPast) {
      score -= 15;
      reasons.push('Past event');
    }
  }

  // Type relevance: +10 for high-engagement types
  if (insight.type && ['event', 'charity', 'community', 'school', 'sports'].includes(insight.type)) {
    score += 10;
    reasons.push(`${insight.type} content - good for engagement`);
  }

  // UVP ALIGNMENT: Check against actual UVP data
  let uvpAlignment: UVPAlignment | undefined;
  if (uvp) {
    uvpAlignment = checkUVPAlignment(insight, uvp);
    score += uvpAlignment.score;

    // Prepend UVP reasons (they're more important)
    if (uvpAlignment.reasons.length > 0) {
      reasons.unshift(...uvpAlignment.reasons);
    }
  }

  // Clamp score
  const finalScore = Math.min(100, Math.max(0, score));

  return { score: finalScore, reasons, uvpAlignment };
}

/**
 * Legacy wrapper for backward compatibility
 */
export function scoreLocalInsightSimple(
  insight: Partial<LocalInsight>,
  config: LocalQueryConfig
): number {
  return scoreLocalInsight(insight, config).score;
}

/**
 * Check if insight matches industry
 */
function matchesIndustry(insight: Partial<LocalInsight>, industry: string): boolean {
  if (!industry) return false;

  const industryLower = industry.toLowerCase();
  const searchText = `${insight.title || ''} ${insight.description || ''} ${insight.keywords?.join(' ') || ''}`.toLowerCase();

  // Direct industry mention
  if (searchText.includes(industryLower)) {
    return true;
  }

  // Industry keyword matching
  const industryKeywords = getIndustryKeywords(industryLower);
  return industryKeywords.some(keyword => searchText.includes(keyword));
}

/**
 * Get keywords associated with an industry
 */
function getIndustryKeywords(industry: string): string[] {
  const keywordMap: Record<string, string[]> = {
    restaurant: ['food', 'dining', 'culinary', 'chef', 'taste', 'eat'],
    hvac: ['home', 'energy', 'heating', 'cooling', 'construction', 'renovation'],
    dental: ['health', 'wellness', 'medical', 'family', 'smile'],
    salon: ['beauty', 'fashion', 'bridal', 'wedding', 'spa'],
    fitness: ['health', 'wellness', 'run', 'marathon', '5k', 'athletic'],
    retail: ['shop', 'sale', 'market', 'business', 'downtown'],
    'real estate': ['home', 'housing', 'property', 'neighborhood', 'community'],
    auto: ['car', 'vehicle', 'automotive', 'cruise', 'drive'],
    pet: ['dog', 'cat', 'animal', 'pet', 'adoption'],
    childcare: ['family', 'kids', 'children', 'school', 'camp'],
  };

  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (industry.includes(key)) {
      return keywords;
    }
  }

  return [];
}

/**
 * Check if location matches city
 */
function isInCity(insightLocation: string | undefined, city: string): boolean {
  if (!insightLocation || !city) return false;
  return insightLocation.toLowerCase().includes(city.toLowerCase());
}

/**
 * Check if location matches neighborhood
 */
function isInNeighborhood(insightLocation: string | undefined, neighborhood: string): boolean {
  if (!insightLocation || !neighborhood) return false;
  return insightLocation.toLowerCase().includes(neighborhood.toLowerCase());
}

// ============================================================================
// TIMING CALCULATION
// ============================================================================

/**
 * Calculate timing metadata for an insight
 */
export function calculateTiming(dateString?: string): LocalInsightTiming {
  if (!dateString) {
    return {
      isUpcoming: false,
      isOngoing: false,
      isPast: false,
    };
  }

  const eventDate = parseDate(dateString);
  if (!eventDate) {
    return {
      isUpcoming: false,
      isOngoing: false,
      isPast: false,
      displayDate: dateString,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isUpcoming: diffDays > 0,
    daysUntil: diffDays > 0 ? diffDays : undefined,
    isOngoing: diffDays === 0,
    isPast: diffDays < 0,
    eventDate: eventDate.toISOString(),
    displayDate: formatDisplayDate(eventDate, diffDays),
  };
}

/**
 * Parse various date formats
 */
function parseDate(dateString: string): Date | null {
  // Try native parsing first
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Try common formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
    /(\d{4})-(\d{2})-(\d{2})/,         // YYYY-MM-DD
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,   // Month DD, YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      try {
        return new Date(dateString);
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Format date for display
 */
function formatDisplayDate(date: Date, daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil > 0 && daysUntil <= 7) return `In ${daysUntil} days`;
  if (daysUntil > 7 && daysUntil <= 14) return 'Next week';
  if (daysUntil < 0 && daysUntil >= -7) return `${Math.abs(daysUntil)} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// URGENCY CALCULATION
// ============================================================================

/**
 * Calculate urgency based on timing and type
 */
export function calculateUrgency(
  timing: LocalInsightTiming,
  type: LocalInsightType
): LocalInsightUrgency {
  // High urgency: happening soon or high-engagement type
  if (timing.isOngoing) return 'high';
  if (timing.isUpcoming && timing.daysUntil !== undefined && timing.daysUntil <= 3) return 'high';
  if (type === 'charity' && timing.isUpcoming && timing.daysUntil !== undefined && timing.daysUntil <= 7) return 'high';

  // Medium urgency: upcoming within 2 weeks
  if (timing.isUpcoming && timing.daysUntil !== undefined && timing.daysUntil <= 14) return 'medium';

  // Low urgency: everything else
  return 'low';
}

// ============================================================================
// HOOK TEMPLATES (with variable interpolation)
// ============================================================================

/**
 * Hook templates by insight type
 * Variables: {event}, {title}, {location}, {city}, {business}, {offer}, {topic}, {team}, {school}, {charity}, {cause}
 */
const HOOK_TEMPLATES: Record<LocalInsightType, string[]> = {
  event: [
    'Join us at {event}!',
    'Stop by before/after {event} for a special offer',
    'Proud to be part of {event}',
    'Find us at {event} in {city}',
    'Countdown to {event} - are you coming?',
  ],
  news: [
    'Exciting news for {city}!',
    'What {title} means for our community',
    'Supporting {topic} in our neighborhood',
    'Big changes coming to {city}',
    'Great news for {city} businesses',
  ],
  community: [
    'Proud to be part of the {city} community',
    'Supporting our {city} neighbors',
    'What makes {city} special',
    'Community spotlight: {title}',
    'Why we love {city}',
  ],
  school: [
    'Teachers deserve the best - special offer!',
    'Back-to-school ready at our store',
    'Congrats to {school} graduates!',
    'Supporting {city} students',
    'Cheering on our local schools',
  ],
  sports: [
    'Game day special!',
    'Go {team}! Show your colors for a discount',
    'Proud sponsor of {team}',
    'Game day in {city}',
    'Cheering on our local athletes',
  ],
  charity: [
    'Proud to support {charity}',
    "We're matching donations to {cause}",
    'Join us at {event}',
    'Giving back to {city}',
    'Community impact through partnership',
  ],
};

/**
 * Interpolate template variables with actual values
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (match, key) => variables[key] || match
  );
}

/**
 * Build variables object from insight and optional config
 */
export function buildTemplateVariables(
  insight: LocalInsight,
  config?: LocalQueryConfig
): Record<string, string> {
  // Extract meaningful parts from title
  const shortTitle = insight.title.length > 50
    ? insight.title.substring(0, 50) + '...'
    : insight.title;

  return {
    event: shortTitle,
    title: shortTitle,
    location: insight.location,
    city: config?.location.city || insight.location.split(',')[0]?.trim() || 'our city',
    business: config?.businessName || 'our business',
    offer: 'a special treat',  // Placeholder - can be customized
    topic: extractTopic(insight.title),
    team: extractTeamName(insight.title) || 'the team',
    school: extractSchoolName(insight.title) || 'our local school',
    charity: extractCharityName(insight.title) || 'this great cause',
    cause: extractCause(insight.description) || 'our community',
  };
}

/**
 * Extract topic from title
 */
function extractTopic(title: string): string {
  // Common topic patterns
  const topicPatterns = [
    /about\s+(.+?)(?:\s+in|\s+at|$)/i,
    /new\s+(.+?)(?:\s+in|\s+at|\s+for|$)/i,
    /(.+?)\s+coming/i,
    /(.+?)\s+announced/i,
  ];

  for (const pattern of topicPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1].substring(0, 30);
    }
  }

  return title.split(' ').slice(0, 3).join(' ');
}

/**
 * Extract team name from title
 */
function extractTeamName(title: string): string | null {
  const teamPatterns = [
    /(\w+(?:\s+\w+)?)\s+(?:win|beat|defeat|vs|versus|game)/i,
    /(?:go|cheer)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+)\s+(?:football|basketball|baseball|soccer|hockey)/i,
  ];

  for (const pattern of teamPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract school name from title
 */
function extractSchoolName(title: string): string | null {
  const schoolPatterns = [
    /(\w+(?:\s+\w+)?)\s+(?:high\s+school|elementary|middle\s+school|school)/i,
    /(\w+)\s+(?:ISD|school\s+district)/i,
    /(\w+)\s+(?:university|college)/i,
  ];

  for (const pattern of schoolPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1] + (match[0].includes('High') ? ' High School' : '');
    }
  }

  return null;
}

/**
 * Extract charity name from title
 */
function extractCharityName(title: string): string | null {
  const charityPatterns = [
    /(?:for|support|help)\s+(.+?)(?:\s+fundrais|\s+event|$)/i,
    /(.+?)\s+(?:foundation|fund|charity)/i,
  ];

  for (const pattern of charityPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1].substring(0, 40);
    }
  }

  return null;
}

/**
 * Extract cause from description
 */
function extractCause(description: string): string | null {
  const causePatterns = [
    /(?:support|help|benefit)\s+(.+?)(?:\s+in|\s+at|\.|,|$)/i,
    /(?:raise|raising)\s+(?:money|funds)\s+for\s+(.+?)(?:\s+in|\s+at|\.|,|$)/i,
  ];

  for (const pattern of causePatterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      return match[1].substring(0, 40);
    }
  }

  return null;
}

// ============================================================================
// CONTENT ANGLE GENERATION
// ============================================================================

/**
 * Generate content angles for a local insight
 */
export function generateContentAngles(
  insight: LocalInsight,
  config?: LocalQueryConfig
): string[] {
  const templates = HOOK_TEMPLATES[insight.type] || HOOK_TEMPLATES.news;
  const variables = buildTemplateVariables(insight, config);

  // Interpolate templates with actual values
  const angles = templates.map(template =>
    interpolateTemplate(template, variables)
  );

  // Add timing-based angles
  if (insight.timing.isUpcoming && insight.timing.daysUntil !== undefined && insight.timing.daysUntil <= 7) {
    angles.push('This week only!');
  }
  if (insight.timing.isOngoing) {
    angles.push('Happening now!');
  }

  return angles.slice(0, 4); // Limit to 4 angles
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Check if an insight should be completely filtered out (not shown at all)
 */
export function shouldFilterInsight(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Filter out negative/controversial news - these should NEVER appear
  const negativePatterns = [
    /shooting|shot|gunfire|gunman/i,
    /murder|killed|homicide|death|died|fatal/i,
    /arrest|arrested|crime|criminal|theft|robbery|assault/i,
    /deportation|deported|ICE\s/i,
    /crash|accident|collision|wreck/i,
    /fire|blaze|explosion|burn/i,
    /lawsuit|sued|indicted/i,
    /missing\s*person|amber\s*alert/i,
    /rape|sexual\s*assault/i,
    /drug|overdose/i,
    /protest|riot/i,
  ];

  for (const pattern of negativePatterns) {
    if (pattern.test(text)) {
      return true; // Filter out completely
    }
  }

  // 2. Filter out garbage/invalid content
  // Title is too short or looks like JSON fragment
  if (title.length < 10) return true;
  if (/^(community|event|news|date|type)$/i.test(title.trim())) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(title.trim())) return true; // Just a date
  if (/^["']?\w+["']?\s*:\s*/.test(title)) return true; // Starts with JSON key

  // 3. Filter out non-events that are just date ranges
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(title.trim())) return true;

  return false;
}

/**
 * Check if this is useful content for local business marketing
 * Returns true if content has marketing potential
 */
export function hasMarketingPotential(title: string, description: string, type: string): boolean {
  const text = `${title} ${description}`.toLowerCase();

  // Positive signals - content that's good for marketing
  const positivePatterns = [
    /festival|fair|parade|celebration/i,
    /market|farmers\s*market|craft/i,
    /charity|fundrais|volunteer|donation/i,
    /community\s*event|block\s*party|neighborhood/i,
    /grand\s*opening|ribbon\s*cutting/i,
    /concert|music|performance|show/i,
    /sports|game|tournament|championship/i,
    /school|graduation|back.to.school/i,
    /holiday|christmas|thanksgiving|halloween/i,
    /trail\s*of\s*lights|lighting|tree\s*lighting/i,
    /expo|convention|conference/i,
    /home\s*show|home\s*expo|trade\s*show/i,
    /run|5k|marathon|walk/i,
  ];

  for (const pattern of positivePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Event and charity types are generally good
  if (['event', 'charity', 'sports', 'community'].includes(type)) {
    // But need some substance
    return title.length > 20 && description.length > 20;
  }

  return false;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

/**
 * Clean up titles that contain JSON fragments or other artifacts
 */
function cleanTitle(title: string): string {
  if (!title) return 'Untitled';

  let cleaned = title;

  // Remove any JSON key prefixes - catch all common patterns
  // Patterns like: "title": ", "description": ", "business_relevance": ", etc.
  const jsonKeyPatterns = [
    /^["']?\s*(title|description|type|date|hvac_relevance|business_relevance|relevance|name|event|location|summary)["']?\s*:\s*["']?/gi,
    /["']?\s*:\s*["']?$/g,  // Trailing ": " patterns
  ];

  for (const pattern of jsonKeyPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove leading/trailing JSON artifacts
  cleaned = cleaned
    .replace(/^[\{\[\s"']+/g, '')  // Leading {, [, quotes, whitespace
    .replace(/[\}\]\s"',]+$/g, '') // Trailing }, ], quotes, whitespace, commas
    .trim();

  // If we still have JSON-like content in the middle, try to extract clean text
  if (cleaned.includes('":')) {
    // Try to find the actual value after ":"
    const valueMatch = cleaned.match(/:\s*["']?([^"',\{\}]+)["']?/);
    if (valueMatch && valueMatch[1]) {
      cleaned = valueMatch[1].trim();
    } else {
      // Remove all JSON key patterns anywhere in the string
      cleaned = cleaned.replace(/["']?\w+["']?\s*:\s*/g, '').trim();
    }
  }

  // Clean up any remaining quotes or brackets
  cleaned = cleaned
    .replace(/^["']+|["']+$/g, '')
    .replace(/^\s*,\s*|\s*,\s*$/g, '')
    .trim();

  // Truncate if too long
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 117) + '...';
  }

  return cleaned || 'Untitled';
}

/**
 * Clean up description that may contain JSON artifacts
 */
function cleanDescription(desc: string): string {
  if (!desc) return '';

  let cleaned = desc;

  // Remove JSON key prefixes
  const jsonKeyPatterns = [
    /^["']?\s*(description|title|type|date|relevance|relevance_to_hvac|hvac_relevance|business_relevance|summary|location|name)["']?\s*:\s*["']?/gi,
  ];

  for (const pattern of jsonKeyPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove leading/trailing artifacts
  cleaned = cleaned
    .replace(/^[\{\[\s"']+/g, '')
    .replace(/[\}\]\s"',]+$/g, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  // If description still looks like it has JSON in the middle, try to extract
  if (cleaned.includes('":')) {
    // Try to extract actual content after a colon
    const parts = cleaned.split(/["']?\w+["']?\s*:\s*["']?/);
    if (parts.length > 1) {
      // Take the longest non-empty part
      cleaned = parts.reduce((longest, part) => {
        const trimmed = part.replace(/["\{\}]/g, '').trim();
        return trimmed.length > longest.length ? trimmed : longest;
      }, '');
    }
  }

  return cleaned.trim();
}

// ============================================================================
// RAW DATA PROCESSING
// ============================================================================

/**
 * Process raw Serper News item into LocalInsight
 * Returns null if content should be filtered out
 */
export function processNewsItem(
  item: RawSerperNewsItem,
  config: LocalQueryConfig,
  uvp?: CompleteUVP
): LocalInsight | null {
  const cleanedTitle = cleanTitle(item.title);
  const cleanedDesc = cleanDescription(item.snippet);

  // Filter out negative news and garbage content
  if (shouldFilterInsight(cleanedTitle, cleanedDesc)) {
    return null;
  }

  const timing = calculateTiming(item.date);
  const type = detectInsightType(cleanedTitle, cleanedDesc);

  const insight: LocalInsight = {
    id: uuidv4(),
    type,
    title: cleanedTitle,
    description: cleanedDesc,
    location: config.location.city,
    relevanceScore: 0,
    relevanceReasons: [],
    urgency: 'medium',
    timing,
    contentAngles: [],
    sources: [{
      name: item.source,
      url: item.link,
      type: 'serper_news',
      snippet: item.snippet,
    }],
    imageUrl: item.imageUrl,
  };

  const { score, reasons } = scoreLocalInsight(insight, config, uvp);
  insight.relevanceScore = score;
  insight.relevanceReasons = reasons;
  insight.urgency = calculateUrgency(timing, type);
  insight.contentAngles = generateContentAngles(insight, config);

  return insight;
}

/**
 * Process raw Serper Place item into LocalInsight
 * Returns null if content should be filtered out
 */
export function processPlaceItem(
  item: RawSerperPlaceItem,
  config: LocalQueryConfig,
  uvp?: CompleteUVP
): LocalInsight | null {
  const cleanedTitle = cleanTitle(item.name);
  const cleanedDesc = item.category ? `${item.category} - ${item.address}` : item.address;

  // Filter out garbage content
  if (shouldFilterInsight(cleanedTitle, cleanedDesc)) {
    return null;
  }

  const type: LocalInsightType = 'community';

  const insight: LocalInsight = {
    id: uuidv4(),
    type,
    title: cleanedTitle,
    description: cleanedDesc,
    location: item.address,
    relevanceScore: 0,
    relevanceReasons: [],
    urgency: 'low',
    timing: {
      isUpcoming: false,
      isOngoing: true,
      isPast: false,
    },
    contentAngles: [],
    sources: [{
      name: item.name,
      url: item.website,
      type: 'serper_places',
    }],
  };

  const { score, reasons } = scoreLocalInsight(insight, config, uvp);
  insight.relevanceScore = score;
  insight.relevanceReasons = reasons;
  insight.contentAngles = generateContentAngles(insight, config);

  return insight;
}

/**
 * Process raw Perplexity insight into LocalInsight
 * Returns null if content should be filtered out
 */
export function processPerplexityInsight(
  item: RawPerplexityInsight,
  config: LocalQueryConfig,
  uvp?: CompleteUVP
): LocalInsight | null {
  // Clean up title and description from JSON artifacts
  const cleanedTitle = cleanTitle(item.title);
  const cleanedDescription = cleanDescription(item.description);

  // Filter out garbage content and negative news
  if (shouldFilterInsight(cleanedTitle, cleanedDescription)) {
    return null;
  }

  const timing = calculateTiming(item.date);
  const type = (item.type as LocalInsightType) || detectInsightType(cleanedTitle, cleanedDescription);

  const insight: LocalInsight = {
    id: uuidv4(),
    type,
    title: cleanedTitle,
    description: cleanedDescription,
    location: config.location.city,
    relevanceScore: 0,
    relevanceReasons: [],
    urgency: 'medium',
    timing,
    contentAngles: [],
    sources: [{
      name: 'AI Research',
      type: 'perplexity',
    }],
  };

  const { score, reasons } = scoreLocalInsight(insight, config, uvp);
  insight.relevanceScore = score;
  insight.relevanceReasons = reasons;
  insight.urgency = calculateUrgency(timing, type);
  insight.contentAngles = generateContentAngles(insight, config);

  return insight;
}

/**
 * Detect insight type from text
 */
function detectInsightType(title: string, description: string): LocalInsightType {
  const text = `${title} ${description}`.toLowerCase();

  if (text.match(/school|student|teacher|graduation|back.to.school|campus/)) return 'school';
  if (text.match(/game|team|sport|athletic|tournament|championship|league/)) return 'sports';
  if (text.match(/charity|fundrais|donat|volunteer|nonprofit|foundation/)) return 'charity';
  if (text.match(/festival|fair|parade|celebration|concert|show/)) return 'event';
  if (text.match(/community|neighborhood|local|resident|citizen/)) return 'community';

  return 'news';
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Deduplicate insights by title similarity
 */
export function deduplicateInsights(insights: LocalInsight[]): LocalInsight[] {
  const seen = new Map<string, LocalInsight>();

  for (const insight of insights) {
    const key = normalizeTitle(insight.title);

    if (!seen.has(key)) {
      seen.set(key, insight);
    } else {
      // Keep the one with higher relevance score
      const existing = seen.get(key)!;
      if (insight.relevanceScore > existing.relevanceScore) {
        // Merge sources
        insight.sources = [...existing.sources, ...insight.sources];
        seen.set(key, insight);
      } else {
        existing.sources = [...existing.sources, ...insight.sources];
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50);
}
