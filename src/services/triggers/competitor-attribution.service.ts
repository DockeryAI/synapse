/**
 * Competitor Attribution Service
 *
 * Extracts and resolves competitor mentions from trigger evidence.
 * Uses fuzzy matching to handle brand variations and aliases.
 *
 * Key features:
 * - Fuzzy matching for brand name variations (e.g., "HubSpot" vs "Hubspot" vs "HS")
 * - Competitor name/alias resolution
 * - Extraction of competitor mentions from raw text
 * - Attribution confidence scoring
 *
 * Success Target: 90% accuracy on brand mentions
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 1 (Foundation Layer)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CompetitorAlias {
  /** Canonical name of the competitor */
  canonicalName: string;
  /** All known aliases and variations */
  aliases: string[];
  /** Domain if known */
  domain?: string;
  /** Industry/category */
  category?: string;
}

export interface CompetitorMention {
  /** The canonical competitor name */
  name: string;
  /** The exact text that was matched */
  matchedText: string;
  /** Position in the source text */
  position: number;
  /** Confidence of the match (0-1) */
  confidence: number;
  /** Type of mention */
  mentionType: 'direct' | 'alias' | 'fuzzy' | 'domain';
  /** Context around the mention */
  context?: string;
}

export interface CompetitorAttributionResult {
  /** List of competitors mentioned */
  competitors: CompetitorMention[];
  /** Primary competitor (most mentioned or highest confidence) */
  primaryCompetitor?: string;
  /** Total number of competitor mentions */
  mentionCount: number;
  /** Whether the text is about competitor displacement/switching */
  isCompetitorDisplacement: boolean;
  /** Displacement type if applicable */
  displacementType?: 'switching-from' | 'switching-to' | 'comparing' | 'complaint';
}

export interface FuzzyMatchResult {
  matched: boolean;
  similarity: number;
  canonicalName: string;
  matchedAlias: string;
}

// ============================================================================
// COMMON COMPETITOR ALIASES
// ============================================================================

/**
 * Common SaaS/Tech competitors with their aliases
 * This list can be extended via brand-specific competitor data
 */
const COMMON_COMPETITORS: CompetitorAlias[] = [
  // CRM
  {
    canonicalName: 'Salesforce',
    aliases: ['salesforce', 'sfdc', 'sf', 'salesforce.com', 'sales force'],
    domain: 'salesforce.com',
    category: 'crm',
  },
  {
    canonicalName: 'HubSpot',
    aliases: ['hubspot', 'hub spot', 'hs', 'hubspot.com'],
    domain: 'hubspot.com',
    category: 'crm',
  },
  {
    canonicalName: 'Zoho',
    aliases: ['zoho', 'zoho crm', 'zoho.com'],
    domain: 'zoho.com',
    category: 'crm',
  },
  {
    canonicalName: 'Pipedrive',
    aliases: ['pipedrive', 'pipe drive', 'pipedrive.com'],
    domain: 'pipedrive.com',
    category: 'crm',
  },

  // Project Management
  {
    canonicalName: 'Asana',
    aliases: ['asana', 'asana.com'],
    domain: 'asana.com',
    category: 'project-management',
  },
  {
    canonicalName: 'Monday.com',
    aliases: ['monday', 'monday.com', 'mondaycom'],
    domain: 'monday.com',
    category: 'project-management',
  },
  {
    canonicalName: 'Jira',
    aliases: ['jira', 'atlassian jira', 'jira software'],
    domain: 'atlassian.com',
    category: 'project-management',
  },
  {
    canonicalName: 'Trello',
    aliases: ['trello', 'trello.com'],
    domain: 'trello.com',
    category: 'project-management',
  },
  {
    canonicalName: 'ClickUp',
    aliases: ['clickup', 'click up', 'clickup.com'],
    domain: 'clickup.com',
    category: 'project-management',
  },
  {
    canonicalName: 'Notion',
    aliases: ['notion', 'notion.so', 'notionhq'],
    domain: 'notion.so',
    category: 'project-management',
  },

  // Marketing Automation
  {
    canonicalName: 'Mailchimp',
    aliases: ['mailchimp', 'mail chimp', 'mailchimp.com'],
    domain: 'mailchimp.com',
    category: 'marketing-automation',
  },
  {
    canonicalName: 'Marketo',
    aliases: ['marketo', 'adobe marketo', 'marketo.com'],
    domain: 'marketo.com',
    category: 'marketing-automation',
  },
  {
    canonicalName: 'ActiveCampaign',
    aliases: ['activecampaign', 'active campaign', 'activecampaign.com'],
    domain: 'activecampaign.com',
    category: 'marketing-automation',
  },
  {
    canonicalName: 'Klaviyo',
    aliases: ['klaviyo', 'klaviyo.com'],
    domain: 'klaviyo.com',
    category: 'marketing-automation',
  },

  // Customer Support
  {
    canonicalName: 'Zendesk',
    aliases: ['zendesk', 'zen desk', 'zendesk.com'],
    domain: 'zendesk.com',
    category: 'customer-support',
  },
  {
    canonicalName: 'Intercom',
    aliases: ['intercom', 'intercom.io', 'intercom.com'],
    domain: 'intercom.com',
    category: 'customer-support',
  },
  {
    canonicalName: 'Freshdesk',
    aliases: ['freshdesk', 'fresh desk', 'freshworks'],
    domain: 'freshdesk.com',
    category: 'customer-support',
  },
  {
    canonicalName: 'Drift',
    aliases: ['drift', 'drift.com'],
    domain: 'drift.com',
    category: 'customer-support',
  },

  // Analytics
  {
    canonicalName: 'Google Analytics',
    aliases: ['google analytics', 'ga', 'ga4', 'universal analytics'],
    domain: 'analytics.google.com',
    category: 'analytics',
  },
  {
    canonicalName: 'Mixpanel',
    aliases: ['mixpanel', 'mixpanel.com'],
    domain: 'mixpanel.com',
    category: 'analytics',
  },
  {
    canonicalName: 'Amplitude',
    aliases: ['amplitude', 'amplitude.com'],
    domain: 'amplitude.com',
    category: 'analytics',
  },
  {
    canonicalName: 'Segment',
    aliases: ['segment', 'segment.io', 'segment.com', 'twilio segment'],
    domain: 'segment.com',
    category: 'analytics',
  },

  // AI/Chatbots
  {
    canonicalName: 'Cognigy',
    aliases: ['cognigy', 'cognigy.ai', 'cognigy.com'],
    domain: 'cognigy.ai',
    category: 'conversational-ai',
  },
  {
    canonicalName: 'Kore.ai',
    aliases: ['kore', 'kore.ai', 'koreai'],
    domain: 'kore.ai',
    category: 'conversational-ai',
  },
  {
    canonicalName: 'Botpress',
    aliases: ['botpress', 'botpress.com'],
    domain: 'botpress.com',
    category: 'conversational-ai',
  },
  {
    canonicalName: 'Rasa',
    aliases: ['rasa', 'rasa.com', 'rasa open source'],
    domain: 'rasa.com',
    category: 'conversational-ai',
  },

  // Cloud/Infrastructure
  {
    canonicalName: 'AWS',
    aliases: ['aws', 'amazon web services', 'amazon aws', 'ec2', 's3'],
    domain: 'aws.amazon.com',
    category: 'cloud',
  },
  {
    canonicalName: 'Azure',
    aliases: ['azure', 'microsoft azure', 'ms azure'],
    domain: 'azure.microsoft.com',
    category: 'cloud',
  },
  {
    canonicalName: 'Google Cloud',
    aliases: ['gcp', 'google cloud', 'google cloud platform', 'gcloud'],
    domain: 'cloud.google.com',
    category: 'cloud',
  },
];

/**
 * Patterns indicating competitor displacement/switching
 */
const DISPLACEMENT_PATTERNS = {
  'switching-from': [
    /switching from\s+/i,
    /migrating from\s+/i,
    /moving away from\s+/i,
    /left\s+/i,
    /ditched\s+/i,
    /dropped\s+/i,
    /cancelled?\s+(our|my)?\s*/i,
  ],
  'switching-to': [
    /switching to\s+/i,
    /migrating to\s+/i,
    /moving to\s+/i,
    /trying\s+/i,
    /testing\s+/i,
    /evaluating\s+/i,
  ],
  'comparing': [
    /vs\.?\s+/i,
    /versus\s+/i,
    /compared to\s+/i,
    /alternative to\s+/i,
    /better than\s+/i,
    /instead of\s+/i,
  ],
  'complaint': [
    /frustrated with\s+/i,
    /hate\s+/i,
    /problems? with\s+/i,
    /issues? with\s+/i,
    /disappointed with\s+/i,
    /terrible\s+/i,
  ],
};

// ============================================================================
// SERVICE
// ============================================================================

class CompetitorAttributionService {
  private competitorRegistry: Map<string, CompetitorAlias> = new Map();
  private aliasIndex: Map<string, string> = new Map(); // alias -> canonical name

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize the competitor registry with common competitors
   */
  private initializeRegistry(): void {
    for (const competitor of COMMON_COMPETITORS) {
      this.registerCompetitor(competitor);
    }
  }

  /**
   * Register a new competitor with aliases
   */
  registerCompetitor(competitor: CompetitorAlias): void {
    this.competitorRegistry.set(competitor.canonicalName.toLowerCase(), competitor);

    // Index all aliases
    for (const alias of competitor.aliases) {
      this.aliasIndex.set(alias.toLowerCase(), competitor.canonicalName);
    }

    // Also index the canonical name
    this.aliasIndex.set(competitor.canonicalName.toLowerCase(), competitor.canonicalName);

    // Index domain if available
    if (competitor.domain) {
      this.aliasIndex.set(competitor.domain.toLowerCase(), competitor.canonicalName);
    }
  }

  /**
   * Register multiple brand-specific competitors
   */
  registerBrandCompetitors(competitors: Array<{ name: string; aliases?: string[] }>): void {
    for (const comp of competitors) {
      this.registerCompetitor({
        canonicalName: comp.name,
        aliases: comp.aliases || [comp.name.toLowerCase()],
      });
    }
  }

  /**
   * Extract competitor mentions from text
   */
  extractCompetitorMentions(text: string): CompetitorAttributionResult {
    const mentions: CompetitorMention[] = [];
    const textLower = text.toLowerCase();

    // Check each alias in our index
    for (const [alias, canonicalName] of Array.from(this.aliasIndex.entries())) {
      // Skip very short aliases (too many false positives)
      if (alias.length < 3) continue;

      // Use word boundary matching
      const regex = new RegExp(`\\b${this.escapeRegex(alias)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          name: canonicalName,
          matchedText: match[0],
          position: match.index,
          confidence: this.calculateMatchConfidence(alias, match[0]),
          mentionType: alias === canonicalName.toLowerCase() ? 'direct' : 'alias',
          context: this.extractContext(text, match.index, 50),
        });
      }
    }

    // Deduplicate overlapping mentions (keep highest confidence)
    const deduped = this.deduplicateMentions(mentions);

    // Detect displacement patterns
    const displacementInfo = this.detectDisplacement(text, deduped);

    // Find primary competitor
    const primaryCompetitor = this.findPrimaryCompetitor(deduped);

    return {
      competitors: deduped,
      primaryCompetitor,
      mentionCount: deduped.length,
      isCompetitorDisplacement: displacementInfo.isDisplacement,
      displacementType: displacementInfo.type,
    };
  }

  /**
   * Fuzzy match a potential competitor name
   */
  fuzzyMatch(input: string, threshold: number = 0.7): FuzzyMatchResult | null {
    const inputLower = input.toLowerCase().trim();

    // Try exact match first
    const exactMatch = this.aliasIndex.get(inputLower);
    if (exactMatch) {
      return {
        matched: true,
        similarity: 1.0,
        canonicalName: exactMatch,
        matchedAlias: inputLower,
      };
    }

    // Try fuzzy matching against all aliases
    let bestMatch: FuzzyMatchResult | null = null;
    let bestSimilarity = 0;

    for (const [alias, canonicalName] of Array.from(this.aliasIndex.entries())) {
      const similarity = this.calculateStringSimilarity(inputLower, alias);

      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = {
          matched: true,
          similarity,
          canonicalName,
          matchedAlias: alias,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Resolve a competitor name to its canonical form
   */
  resolveCompetitorName(name: string): string {
    const match = this.fuzzyMatch(name, 0.8);
    return match?.canonicalName || name;
  }

  /**
   * Check if text mentions any competitor
   */
  hasCompetitorMention(text: string): boolean {
    const result = this.extractCompetitorMentions(text);
    return result.mentionCount > 0;
  }

  /**
   * Get all registered competitors
   */
  getAllCompetitors(): CompetitorAlias[] {
    return Array.from(this.competitorRegistry.values());
  }

  /**
   * Get competitors by category
   */
  getCompetitorsByCategory(category: string): CompetitorAlias[] {
    return Array.from(this.competitorRegistry.values()).filter(
      (c) => c.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Calculate match confidence based on exact vs. fuzzy match
   */
  private calculateMatchConfidence(alias: string, matchedText: string): number {
    // Exact case match = highest confidence
    if (alias === matchedText.toLowerCase() && matchedText === matchedText) {
      return 1.0;
    }

    // Case-insensitive exact match
    if (alias === matchedText.toLowerCase()) {
      return 0.95;
    }

    // Partial or fuzzy match
    return 0.8;
  }

  /**
   * Extract context around a mention
   */
  private extractContext(text: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    return text.slice(start, end).trim();
  }

  /**
   * Deduplicate overlapping mentions
   */
  private deduplicateMentions(mentions: CompetitorMention[]): CompetitorMention[] {
    if (mentions.length === 0) return [];

    // Sort by position
    const sorted = [...mentions].sort((a, b) => a.position - b.position);

    const result: CompetitorMention[] = [];
    let lastEnd = -1;

    for (const mention of sorted) {
      const mentionEnd = mention.position + mention.matchedText.length;

      // Skip if this mention overlaps with the previous one
      if (mention.position < lastEnd) {
        // Keep the one with higher confidence
        const lastMention = result[result.length - 1];
        if (mention.confidence > lastMention.confidence) {
          result[result.length - 1] = mention;
          lastEnd = mentionEnd;
        }
        continue;
      }

      result.push(mention);
      lastEnd = mentionEnd;
    }

    return result;
  }

  /**
   * Detect competitor displacement patterns
   */
  private detectDisplacement(
    text: string,
    mentions: CompetitorMention[]
  ): { isDisplacement: boolean; type?: 'switching-from' | 'switching-to' | 'comparing' | 'complaint' } {
    if (mentions.length === 0) {
      return { isDisplacement: false };
    }

    const textLower = text.toLowerCase();

    // Check each displacement pattern type
    for (const [type, patterns] of Object.entries(DISPLACEMENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(textLower)) {
          return {
            isDisplacement: true,
            type: type as 'switching-from' | 'switching-to' | 'comparing' | 'complaint',
          };
        }
      }
    }

    return { isDisplacement: false };
  }

  /**
   * Find the primary competitor (most mentioned or highest confidence)
   */
  private findPrimaryCompetitor(mentions: CompetitorMention[]): string | undefined {
    if (mentions.length === 0) return undefined;

    // Count mentions by competitor
    const counts = new Map<string, { count: number; maxConfidence: number }>();

    for (const mention of mentions) {
      const existing = counts.get(mention.name) || { count: 0, maxConfidence: 0 };
      counts.set(mention.name, {
        count: existing.count + 1,
        maxConfidence: Math.max(existing.maxConfidence, mention.confidence),
      });
    }

    // Find the competitor with highest count, then highest confidence
    let primary: string | undefined;
    let bestScore = 0;

    for (const [name, stats] of Array.from(counts.entries())) {
      const score = stats.count * 10 + stats.maxConfidence;
      if (score > bestScore) {
        bestScore = score;
        primary = name;
      }
    }

    return primary;
  }

  /**
   * Calculate Levenshtein similarity between two strings
   */
  private calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);

    return 1 - distance / maxLength;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton
export const competitorAttributionService = new CompetitorAttributionService();

// Export class for testing
export { CompetitorAttributionService };
