/**
 * Local Signals Service
 *
 * Specialized signal processing for local business profiles:
 * - Local Service B2B (Commercial HVAC, IT MSPs, cleaning services)
 * - Local Service B2C (Dental, salons, restaurants, fitness)
 *
 * Phase 3: Profile-Specific Pipelines - Local Service Profiles
 *
 * Key Features:
 * 1. Geographic radius filtering (25-50 mile default)
 * 2. Local review platform integration (Google, Yelp, Nextdoor)
 * 3. Seasonal pattern detection
 * 4. Life event signal processing
 * 5. Local competition analysis
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './profile-detection.service';
import { recencyCalculatorService, type RecencyResult } from './recency-calculator.service';
import { competitorAttributionService, type CompetitorMention } from './competitor-attribution.service';
import { reviewAggregatorService, type NormalizedReview, type ReviewPlatform } from './review-aggregator.service';
import { urgencyDetectorService, type UrgencyLevel } from './urgency-detector.service';

// ============================================================================
// TYPES
// ============================================================================

export type LocalSignalType =
  | 'review-complaint'
  | 'recommendation-request'
  | 'new-resident'
  | 'life-event'
  | 'seasonal-spike'
  | 'competitor-mention'
  | 'service-failure'
  | 'expansion-need'
  | 'contract-renewal'
  | 'emergency-need';

export interface GeoLocation {
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  metro?: string;
}

export interface LocalSignal {
  id: string;
  type: LocalSignalType;
  source: ReviewPlatform | 'reddit' | 'facebook' | 'nextdoor' | 'linkedin';
  content: string;
  timestamp: Date;
  location: GeoLocation;
  author?: string;
  url?: string;
  metadata?: LocalSignalMetadata;
}

export interface LocalSignalMetadata {
  rating?: number; // 1-5 for reviews
  reviewCount?: number;
  businessCategory?: string;
  competitorMentioned?: string;
  lifeEventType?: LifeEventType;
  seasonalContext?: string;
  urgencyIndicators?: string[];
}

export type LifeEventType =
  | 'new-resident'
  | 'home-purchase'
  | 'engagement'
  | 'wedding'
  | 'new-baby'
  | 'graduation'
  | 'new-job'
  | 'retirement'
  | 'divorce'
  | 'health-issue'
  | 'pet-adoption';

export interface LocalSignalResult {
  signal: LocalSignal;
  score: number;
  recencyScore: number;
  geographicRelevance: number;
  competitorAttribution?: CompetitorMention;
  urgencyLevel: UrgencyLevel;
  actionableInsight: string;
  recommendedResponse: string;
}

export interface LocalAreaAnalysis {
  location: GeoLocation;
  totalSignals: number;
  signalsByType: Record<LocalSignalType, number>;
  topCompetitors: string[];
  seasonalTrends: SeasonalTrend[];
  lifeEventVolume: number;
  averageUrgency: UrgencyLevel;
  marketOpportunityScore: number;
}

export interface SeasonalTrend {
  name: string;
  currentlyActive: boolean;
  peakMonths: number[];
  signalMultiplier: number;
  relevantServices: string[];
}

export interface LocalRadiusConfig {
  primaryRadiusMiles: number;
  secondaryRadiusMiles: number;
  maxRadiusMiles: number;
  priorityZipCodes?: string[];
}

export interface LocalSignalProcessingConfig {
  profileType: 'local-service-b2b' | 'local-service-b2c';
  radiusConfig: LocalRadiusConfig;
  priorityPlatforms: ReviewPlatform[];
  lifeEventsEnabled: boolean;
  seasonalDetection: boolean;
  minimumReviewRating: number;
  competitorList?: string[];
}

// ============================================================================
// LIFE EVENT PATTERNS
// ============================================================================

const LIFE_EVENT_PATTERNS: Record<LifeEventType, RegExp[]> = {
  'new-resident': [
    /just\s+moved\s+to|recently\s+moved|new\s+to\s+(?:the\s+)?(?:area|city|town|neighborhood)/i,
    /relocated\s+(?:to|from)|moving\s+to\s+[A-Z][a-z]+/i,
    /settling\s+in|getting\s+settled/i,
    /new\s+(?:home|house|apartment|condo)\s+in/i
  ],
  'home-purchase': [
    /(?:just\s+)?bought\s+a\s+(?:house|home|condo)/i,
    /new\s+homeowner|first\s+(?:time\s+)?home\s+buyer/i,
    /closed\s+on|closing\s+on|under\s+contract/i,
    /fixer\s+upper|renovation|remodel/i
  ],
  'engagement': [
    /(?:just\s+)?(?:got\s+)?engaged|engagement|proposal/i,
    /said\s+yes|she\s+said\s+yes|he\s+said\s+yes/i,
    /getting\s+married|wedding\s+planning/i
  ],
  'wedding': [
    /wedding|getting\s+married|bridal|bride|groom/i,
    /reception|ceremony|venue/i,
    /honeymoon|newlywed/i
  ],
  'new-baby': [
    /(?:just\s+)?had\s+a\s+baby|new\s+(?:baby|parent|mom|dad)/i,
    /pregnant|expecting|due\s+(?:date|in)/i,
    /nursery|baby\s+shower|maternity/i,
    /first\s+time\s+(?:parent|mom|dad)/i
  ],
  'graduation': [
    /graduat(?:ed|ing|ion)|just\s+graduated/i,
    /class\s+of\s+20\d{2}|commencement/i,
    /college\s+(?:grad|graduate)|high\s+school\s+(?:grad|senior)/i
  ],
  'new-job': [
    /(?:just\s+)?(?:got|started|accepted)\s+(?:a\s+)?(?:new\s+)?job/i,
    /new\s+(?:position|role|career)|career\s+change/i,
    /promotion|promoted|starting\s+at/i
  ],
  'retirement': [
    /retir(?:ed|ing|ement)|just\s+retired/i,
    /last\s+day\s+of\s+work|leaving\s+(?:the\s+)?workforce/i,
    /pension|401k|retirement\s+(?:party|plan)/i
  ],
  'divorce': [
    /divorc(?:e|ed|ing)|separation|separated/i,
    /ex\-(?:spouse|wife|husband)/i,
    /custody|splitting\s+up/i
  ],
  'health-issue': [
    /diagnos(?:ed|is)|health\s+(?:issue|problem|concern)/i,
    /surgery|procedure|treatment|therapy/i,
    /chronic|condition|illness/i
  ],
  'pet-adoption': [
    /(?:just\s+)?adopt(?:ed|ing)\s+(?:a\s+)?(?:dog|cat|puppy|kitten|pet)/i,
    /new\s+(?:dog|cat|puppy|kitten|pet|fur\s*baby)/i,
    /rescue(?:d)?|shelter\s+(?:dog|cat|pet)/i
  ]
};

// Seasonal patterns with service mappings
const SEASONAL_PATTERNS: SeasonalTrend[] = [
  {
    name: 'HVAC Summer Peak',
    currentlyActive: false,
    peakMonths: [5, 6, 7, 8],
    signalMultiplier: 1.5,
    relevantServices: ['hvac', 'ac', 'air conditioning', 'cooling', 'refrigeration']
  },
  {
    name: 'HVAC Winter Peak',
    currentlyActive: false,
    peakMonths: [11, 12, 1, 2],
    signalMultiplier: 1.5,
    relevantServices: ['hvac', 'heating', 'furnace', 'boiler', 'heat pump']
  },
  {
    name: 'Spring Cleaning',
    currentlyActive: false,
    peakMonths: [3, 4, 5],
    signalMultiplier: 1.3,
    relevantServices: ['cleaning', 'janitorial', 'carpet', 'deep clean', 'pressure washing']
  },
  {
    name: 'Tax Season',
    currentlyActive: false,
    peakMonths: [1, 2, 3, 4],
    signalMultiplier: 1.6,
    relevantServices: ['accounting', 'tax', 'bookkeeping', 'cpa', 'financial']
  },
  {
    name: 'Back to School',
    currentlyActive: false,
    peakMonths: [7, 8, 9],
    signalMultiplier: 1.4,
    relevantServices: ['dental', 'orthodontics', 'pediatric', 'eye exam', 'tutoring']
  },
  {
    name: 'New Year Resolutions',
    currentlyActive: false,
    peakMonths: [1, 2],
    signalMultiplier: 1.7,
    relevantServices: ['gym', 'fitness', 'personal training', 'diet', 'wellness', 'dental']
  },
  {
    name: 'Wedding Season',
    currentlyActive: false,
    peakMonths: [5, 6, 9, 10],
    signalMultiplier: 1.5,
    relevantServices: ['salon', 'spa', 'photography', 'catering', 'florist', 'venue']
  },
  {
    name: 'Holiday Season',
    currentlyActive: false,
    peakMonths: [11, 12],
    signalMultiplier: 1.4,
    relevantServices: ['restaurant', 'catering', 'cleaning', 'decorating', 'party planning']
  },
  {
    name: 'Landscaping Peak',
    currentlyActive: false,
    peakMonths: [4, 5, 6, 7, 8, 9],
    signalMultiplier: 1.4,
    relevantServices: ['landscaping', 'lawn', 'garden', 'tree service', 'irrigation']
  },
  {
    name: 'IT Budget Cycle',
    currentlyActive: false,
    peakMonths: [9, 10, 11],
    signalMultiplier: 1.3,
    relevantServices: ['it services', 'msp', 'managed services', 'cybersecurity', 'it support']
  }
];

// Default configurations per profile type
const DEFAULT_CONFIGS: Record<'local-service-b2b' | 'local-service-b2c', LocalSignalProcessingConfig> = {
  'local-service-b2b': {
    profileType: 'local-service-b2b',
    radiusConfig: {
      primaryRadiusMiles: 25,
      secondaryRadiusMiles: 50,
      maxRadiusMiles: 100
    },
    priorityPlatforms: ['google', 'yelp', 'facebook'],
    lifeEventsEnabled: false, // Less relevant for B2B
    seasonalDetection: true,
    minimumReviewRating: 1 // Track all reviews, even negative
  },
  'local-service-b2c': {
    profileType: 'local-service-b2c',
    radiusConfig: {
      primaryRadiusMiles: 15,
      secondaryRadiusMiles: 25,
      maxRadiusMiles: 50
    },
    priorityPlatforms: ['google', 'yelp', 'facebook', 'trustpilot'],
    lifeEventsEnabled: true, // Very relevant for B2C
    seasonalDetection: true,
    minimumReviewRating: 1
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class LocalSignalsService {
  private activeSeasonalPatterns: SeasonalTrend[] = [];

  constructor() {
    this.updateSeasonalPatterns();
  }

  /**
   * Get default configuration for a local profile type
   */
  getDefaultConfig(
    profileType: 'local-service-b2b' | 'local-service-b2c'
  ): LocalSignalProcessingConfig {
    return { ...DEFAULT_CONFIGS[profileType] };
  }

  /**
   * Process a raw signal for local context
   */
  processSignal(
    content: string,
    source: LocalSignal['source'],
    location: GeoLocation,
    timestamp: Date = new Date(),
    config?: Partial<LocalSignalProcessingConfig>
  ): LocalSignalResult {
    const fullConfig = {
      ...DEFAULT_CONFIGS['local-service-b2c'],
      ...config
    };

    // Detect signal type
    const signalType = this.detectSignalType(content);

    // Build the signal object
    const signal: LocalSignal = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: signalType,
      source,
      content,
      timestamp,
      location,
      metadata: this.extractMetadata(content, signalType)
    };

    // Calculate scores
    const recencyResult = recencyCalculatorService.calculateRecency(timestamp, 'review');
    const geographicRelevance = 1.0; // Assumed relevant since we're processing it
    const seasonalBoost = this.getSeasonalBoost(content);

    // Check for competitor mentions
    let competitorAttribution: CompetitorMention | undefined;
    if (fullConfig.competitorList?.length) {
      const mentions = competitorAttributionService.findMentionsInContent(
        content,
        fullConfig.competitorList
      );
      if (mentions.length > 0) {
        competitorAttribution = mentions[0];
      }
    }

    // Detect urgency
    const urgencyAnalysis = urgencyDetectorService.detectUrgency({
      content,
      source,
      timestamp,
      hasCompetitorMention: !!competitorAttribution,
      hasPricingDiscussion: /price|cost|budget|afford|expensive|cheap/i.test(content),
      hasNegativeSentiment: this.hasNegativeSentiment(content),
      authorRole: undefined
    });

    // Calculate composite score
    let score = recencyResult.score * geographicRelevance * seasonalBoost;

    // Boost for competitor complaints (high-value signal)
    if (competitorAttribution && signal.type === 'competitor-mention') {
      score *= 1.4;
    }

    // Boost for emergency/urgent needs
    if (signal.type === 'emergency-need' || urgencyAnalysis.level === 'immediate') {
      score *= 1.5;
    }

    // Generate actionable insight
    const { insight, response } = this.generateActionableInsight(signal, urgencyAnalysis.level);

    return {
      signal,
      score: Math.min(1, score),
      recencyScore: recencyResult.score,
      geographicRelevance,
      competitorAttribution,
      urgencyLevel: urgencyAnalysis.level,
      actionableInsight: insight,
      recommendedResponse: response
    };
  }

  /**
   * Process multiple signals and return sorted by score
   */
  processSignals(
    signals: Array<{
      content: string;
      source: LocalSignal['source'];
      location: GeoLocation;
      timestamp?: Date;
    }>,
    config?: Partial<LocalSignalProcessingConfig>
  ): LocalSignalResult[] {
    return signals
      .map(s => this.processSignal(s.content, s.source, s.location, s.timestamp, config))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Detect life events in content
   */
  detectLifeEvents(content: string): LifeEventType[] {
    const detectedEvents: LifeEventType[] = [];

    for (const [eventType, patterns] of Object.entries(LIFE_EVENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          detectedEvents.push(eventType as LifeEventType);
          break; // Only add each event type once
        }
      }
    }

    return detectedEvents;
  }

  /**
   * Get service recommendations based on life events
   */
  getServicesForLifeEvent(eventType: LifeEventType): string[] {
    const serviceMap: Record<LifeEventType, string[]> = {
      'new-resident': [
        'hvac inspection', 'cleaning service', 'landscaping', 'home security',
        'internet/cable', 'utility setup', 'movers', 'storage'
      ],
      'home-purchase': [
        'home inspection', 'hvac', 'plumbing', 'electrical', 'roofing',
        'pest control', 'home warranty', 'insurance', 'renovation'
      ],
      'engagement': [
        'wedding venue', 'catering', 'photography', 'florist', 'salon',
        'spa', 'wedding planner', 'jewelry'
      ],
      'wedding': [
        'catering', 'venue', 'photographer', 'florist', 'salon', 'spa',
        'dj/entertainment', 'transportation', 'honeymoon travel'
      ],
      'new-baby': [
        'pediatrician', 'daycare', 'childproofing', 'cleaning service',
        'photography', 'financial planning', 'life insurance'
      ],
      'graduation': [
        'photographer', 'catering', 'party venue', 'career coaching',
        'moving services', 'apartment hunting'
      ],
      'new-job': [
        'relocation services', 'professional wardrobe', 'networking events',
        'financial planning', 'commute solutions'
      ],
      'retirement': [
        'financial planning', 'healthcare', 'travel', 'home modification',
        'estate planning', 'senior services'
      ],
      'divorce': [
        'legal services', 'financial planning', 'real estate', 'therapy',
        'moving services', 'home security'
      ],
      'health-issue': [
        'healthcare', 'physical therapy', 'home care', 'pharmacy',
        'medical equipment', 'wellness services'
      ],
      'pet-adoption': [
        'veterinarian', 'pet grooming', 'pet training', 'pet supplies',
        'dog walking', 'pet sitting', 'pet insurance'
      ]
    };

    return serviceMap[eventType] || [];
  }

  /**
   * Get currently active seasonal patterns
   */
  getActiveSeasonalPatterns(): SeasonalTrend[] {
    return this.activeSeasonalPatterns;
  }

  /**
   * Check if a service is in seasonal peak
   */
  isServiceInPeak(serviceType: string): { inPeak: boolean; pattern?: SeasonalTrend } {
    const serviceLower = serviceType.toLowerCase();

    for (const pattern of this.activeSeasonalPatterns) {
      if (pattern.relevantServices.some(s => serviceLower.includes(s) || s.includes(serviceLower))) {
        return { inPeak: true, pattern };
      }
    }

    return { inPeak: false };
  }

  /**
   * Analyze a local area based on signals
   */
  analyzeLocalArea(
    signals: LocalSignalResult[],
    location: GeoLocation
  ): LocalAreaAnalysis {
    const signalsByType: Record<LocalSignalType, number> = {
      'review-complaint': 0,
      'recommendation-request': 0,
      'new-resident': 0,
      'life-event': 0,
      'seasonal-spike': 0,
      'competitor-mention': 0,
      'service-failure': 0,
      'expansion-need': 0,
      'contract-renewal': 0,
      'emergency-need': 0
    };

    const competitorCounts: Record<string, number> = {};
    let totalUrgencyScore = 0;
    let lifeEventCount = 0;

    for (const result of signals) {
      signalsByType[result.signal.type]++;

      if (result.competitorAttribution) {
        const comp = result.competitorAttribution.matchedCompetitor;
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
      }

      if (result.signal.type === 'life-event') {
        lifeEventCount++;
      }

      // Map urgency to numeric score
      const urgencyMap = { 'immediate': 4, 'active': 3, 'researching': 2, 'browsing': 1 };
      totalUrgencyScore += urgencyMap[result.urgencyLevel];
    }

    // Get top competitors
    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([comp]) => comp);

    // Calculate average urgency
    const avgUrgencyScore = signals.length > 0 ? totalUrgencyScore / signals.length : 0;
    const avgUrgency: UrgencyLevel =
      avgUrgencyScore >= 3.5 ? 'immediate' :
      avgUrgencyScore >= 2.5 ? 'active' :
      avgUrgencyScore >= 1.5 ? 'researching' : 'browsing';

    // Calculate market opportunity score (0-1)
    const marketOpportunityScore = Math.min(1,
      (signals.length / 100) * 0.3 + // Volume factor
      (signalsByType['recommendation-request'] / Math.max(signals.length, 1)) * 0.3 + // Demand factor
      (signalsByType['competitor-mention'] / Math.max(signals.length, 1)) * 0.2 + // Competition factor
      (avgUrgencyScore / 4) * 0.2 // Urgency factor
    );

    return {
      location,
      totalSignals: signals.length,
      signalsByType,
      topCompetitors,
      seasonalTrends: this.activeSeasonalPatterns,
      lifeEventVolume: lifeEventCount,
      averageUrgency: avgUrgency,
      marketOpportunityScore
    };
  }

  /**
   * Filter signals by radius from a center point
   * Note: In production, this would use proper geocoding
   */
  filterByRadius(
    signals: LocalSignalResult[],
    centerLocation: GeoLocation,
    radiusMiles: number
  ): LocalSignalResult[] {
    // Simplified filtering - in production, use proper geo distance calculation
    // For now, we filter by city/state match
    return signals.filter(result => {
      const signalLoc = result.signal.location;

      // Same city is within radius
      if (signalLoc.city.toLowerCase() === centerLocation.city.toLowerCase() &&
          signalLoc.state.toLowerCase() === centerLocation.state.toLowerCase()) {
        return true;
      }

      // Same metro area
      if (signalLoc.metro && centerLocation.metro &&
          signalLoc.metro.toLowerCase() === centerLocation.metro.toLowerCase()) {
        return true;
      }

      // If we have coordinates, calculate actual distance
      if (signalLoc.latitude && signalLoc.longitude &&
          centerLocation.latitude && centerLocation.longitude) {
        const distance = this.calculateDistance(
          signalLoc.latitude, signalLoc.longitude,
          centerLocation.latitude, centerLocation.longitude
        );
        return distance <= radiusMiles;
      }

      return false;
    });
  }

  /**
   * Get all seasonal patterns (active and inactive)
   */
  getAllSeasonalPatterns(): SeasonalTrend[] {
    return SEASONAL_PATTERNS.map(p => ({
      ...p,
      currentlyActive: this.activeSeasonalPatterns.some(ap => ap.name === p.name)
    }));
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private updateSeasonalPatterns(): void {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    this.activeSeasonalPatterns = SEASONAL_PATTERNS.filter(pattern =>
      pattern.peakMonths.includes(currentMonth)
    ).map(p => ({ ...p, currentlyActive: true }));
  }

  private detectSignalType(content: string): LocalSignalType {
    const contentLower = content.toLowerCase();

    // Emergency/urgent need
    if (/urgent|emergency|asap|immediately|broken|not working|flooding|leak/i.test(content)) {
      return 'emergency-need';
    }

    // Recommendation request
    if (/recommend|suggestion|looking for|need a|anyone know|who do you use/i.test(content)) {
      return 'recommendation-request';
    }

    // New resident
    if (LIFE_EVENT_PATTERNS['new-resident'].some(p => p.test(content))) {
      return 'new-resident';
    }

    // Life event (check all patterns)
    for (const [eventType, patterns] of Object.entries(LIFE_EVENT_PATTERNS)) {
      if (eventType !== 'new-resident' && patterns.some(p => p.test(content))) {
        return 'life-event';
      }
    }

    // Competitor mention with complaint
    if (/switch|terrible|awful|worst|disappointed|leaving|left/i.test(content) &&
        /competitor|company|service|provider|business/i.test(content)) {
      return 'competitor-mention';
    }

    // Review complaint
    if (/complaint|issue|problem|poor|bad|terrible|never again/i.test(content)) {
      return 'review-complaint';
    }

    // Service failure
    if (/failed|broke|didn't work|no-show|never showed|ghosted/i.test(content)) {
      return 'service-failure';
    }

    // Contract renewal
    if (/renew|contract|annual|agreement|term/i.test(content)) {
      return 'contract-renewal';
    }

    // Expansion need
    if (/expand|growing|new location|additional|more\s+(?:space|capacity)/i.test(content)) {
      return 'expansion-need';
    }

    // Seasonal (check active patterns)
    for (const pattern of this.activeSeasonalPatterns) {
      if (pattern.relevantServices.some(s => contentLower.includes(s))) {
        return 'seasonal-spike';
      }
    }

    // Default to recommendation request
    return 'recommendation-request';
  }

  private extractMetadata(content: string, signalType: LocalSignalType): LocalSignalMetadata {
    const metadata: LocalSignalMetadata = {};

    // Extract rating if present
    const ratingMatch = content.match(/(\d)\s*(?:star|\/5|out of 5)/i);
    if (ratingMatch) {
      metadata.rating = parseInt(ratingMatch[1], 10);
    }

    // Extract life event type if applicable
    if (signalType === 'life-event' || signalType === 'new-resident') {
      const events = this.detectLifeEvents(content);
      if (events.length > 0) {
        metadata.lifeEventType = events[0];
      }
    }

    // Extract urgency indicators
    const urgencyPatterns = [
      /urgent/i, /asap/i, /emergency/i, /immediately/i,
      /today/i, /right now/i, /as soon as possible/i
    ];
    metadata.urgencyIndicators = urgencyPatterns
      .filter(p => p.test(content))
      .map(p => p.source);

    // Extract seasonal context
    for (const pattern of this.activeSeasonalPatterns) {
      if (pattern.relevantServices.some(s => content.toLowerCase().includes(s))) {
        metadata.seasonalContext = pattern.name;
        break;
      }
    }

    return metadata;
  }

  private getSeasonalBoost(content: string): number {
    const contentLower = content.toLowerCase();

    for (const pattern of this.activeSeasonalPatterns) {
      if (pattern.relevantServices.some(s => contentLower.includes(s))) {
        return pattern.signalMultiplier;
      }
    }

    return 1.0;
  }

  private hasNegativeSentiment(content: string): boolean {
    const negativePatterns = [
      /terrible|awful|worst|horrible|hate|angry|frustrated|disappointed/i,
      /never\s+(?:again|use)|stay\s+away|avoid|warning/i,
      /rip\s*off|scam|fraud|dishonest/i,
      /0\s*stars?|zero\s*stars?|1\s*star/i
    ];

    return negativePatterns.some(p => p.test(content));
  }

  private generateActionableInsight(
    signal: LocalSignal,
    urgency: UrgencyLevel
  ): { insight: string; response: string } {
    const signalTypeInsights: Record<LocalSignalType, { insight: string; response: string }> = {
      'review-complaint': {
        insight: 'Competitor receiving negative feedback - opportunity to capture dissatisfied customer',
        response: 'Monitor for follow-up discussions, engage with helpful content about your service quality'
      },
      'recommendation-request': {
        insight: 'Active buyer seeking service provider recommendations in your area',
        response: 'Respond with value-first approach, share relevant testimonials from similar customers'
      },
      'new-resident': {
        insight: 'New resident to area actively seeking local service providers',
        response: 'Welcome messaging, new resident special offers, introduce your local expertise'
      },
      'life-event': {
        insight: `Life event detected (${signal.metadata?.lifeEventType}) - high intent buying moment`,
        response: 'Personalized outreach acknowledging the life change, relevant service bundles'
      },
      'seasonal-spike': {
        insight: `Seasonal demand spike (${signal.metadata?.seasonalContext}) - increased search volume`,
        response: 'Seasonal messaging, limited availability urgency, timely promotional offers'
      },
      'competitor-mention': {
        insight: 'Direct competitor mentioned negatively - capture opportunity',
        response: 'Differentiation messaging, address specific pain points mentioned about competitor'
      },
      'service-failure': {
        insight: 'Service failure reported - urgent capture opportunity',
        response: 'Fast response offering immediate assistance, reliability guarantees'
      },
      'expansion-need': {
        insight: 'Business growth signal - potential for larger contract or multiple locations',
        response: 'Enterprise/growth packages, scalability messaging, case studies'
      },
      'contract-renewal': {
        insight: 'Contract renewal period - potential to win displaced business',
        response: 'Competitive comparison, switching incentives, seamless transition messaging'
      },
      'emergency-need': {
        insight: 'Emergency service need - immediate high-intent buyer',
        response: '24/7 availability messaging, rapid response guarantee, priority service'
      }
    };

    const base = signalTypeInsights[signal.type];

    // Enhance response based on urgency
    if (urgency === 'immediate') {
      return {
        insight: `URGENT: ${base.insight}`,
        response: `PRIORITY ACTION: ${base.response} - Immediate follow-up recommended`
      };
    }

    return base;
  }

  private calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    // Haversine formula for distance in miles
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export singleton
export const localSignalsService = new LocalSignalsService();
export { LocalSignalsService };
