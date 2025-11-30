/**
 * Proof Consolidation Service
 *
 * Aggregates proof points from all sources into a unified, scored collection.
 * Handles deduplication, quality scoring, and profile-aware filtering.
 *
 * Input: DeepContext + UVP + Profile Type
 * Output: Consolidated proof points with quality scores
 *
 * Created: 2025-11-29
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from '../triggers/profile-detection.service';
import type { ReviewPlatformResult, PlatformSummary, ReviewPlatformReview } from './review-platform-scraper.service';
import type { PressResult, PressMention } from './press-news-scraper.service';
import type { DeepTestimonialResult, ExtractedTestimonial } from './deep-testimonial-scraper.service';
import type { ClientLogoResult, ExtractedLogo } from './client-logo-extractor.service';
import type { SocialProofResult, SocialMetric } from './social-proof-scraper.service';

// ============================================================================
// TYPES
// ============================================================================

export type ProofType =
  | 'rating'
  | 'testimonial'
  | 'metric'
  | 'certification'
  | 'social'
  | 'logo'
  | 'press'
  | 'award'
  | 'review'
  | 'years';

export type ProofSource =
  | 'google-reviews'
  | 'g2'
  | 'capterra'
  | 'trustradius'
  | 'clutch'
  | 'yelp'
  | 'trustpilot'
  | 'website'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'amazon'
  | 'bbb'
  | 'industry-specific';

export interface ConsolidatedProof {
  id: string;
  type: ProofType;
  title: string;
  value: string;
  source: ProofSource | string;
  sourceUrl?: string;

  // Scoring
  qualityScore: number;      // 0-100 composite score
  recencyScore: number;      // 0-100 based on age
  authorityScore: number;    // 0-100 based on source credibility
  specificityScore: number;  // 0-100 based on detail/metrics
  verificationScore: number; // 0-100 based on verification status

  // Metadata
  confidence: number;        // 0-100 overall confidence
  recency?: Date;
  isVerified: boolean;
  profileRelevance: number;  // 0-100 based on business category

  // UVP Alignment
  alignedClaims: string[];   // Which UVP claims this proof supports
  alignmentScore: number;    // 0-100 how well it supports UVP

  // Raw data reference
  rawSourceId?: string;
  rawQuote?: string;

  // Rich display fields (Phase 7.8)
  fullQuote?: string;           // Untruncated quote text
  authorName?: string;          // Reviewer/testimonial author
  authorCompany?: string;       // Author's company
  authorRole?: string;          // Author's role/title
  authorPhoto?: string;         // Photo URL if available
  reviewDate?: Date;            // When review was written
  publicationName?: string;     // For press: publication name (Forbes, etc.)
  screenshotUrl?: string;       // Screenshot of proof if captured

  // Case Study fields (Phase 7.9)
  isCaseStudy?: boolean;        // True if this is a case study
  caseStudy?: {
    customerName: string;       // Customer/company name (title)
    industry?: string;          // Customer's industry
    execSummary?: string;       // Executive summary
    challenge?: string;         // The challenge they faced
    solution?: string;          // How the solution helped
    outcome?: string;           // The results/outcome
    metrics?: string[];         // Key stats ("40% increase", "$500K saved")
    testimonialQuote?: string;  // Pull quote from the case study
  };
}

export interface ProofConsolidationResult {
  proofs: ConsolidatedProof[];
  profileType: BusinessProfileType;
  totalExtracted: number;
  deduplicatedCount: number;
  avgQualityScore: number;
  topProofTypes: ProofType[];
  sourceCoverage: Record<string, number>;
}

// ============================================================================
// PROFILE-SPECIFIC PROOF PRIORITIES
// ============================================================================

const PROFILE_PROOF_PRIORITIES: Record<BusinessProfileType, {
  priorityTypes: ProofType[];
  prioritySources: ProofSource[];
  boostKeywords: string[];
}> = {
  'local-service-b2b': {
    priorityTypes: ['certification', 'testimonial', 'years', 'metric'],
    prioritySources: ['google-reviews', 'website', 'bbb', 'linkedin'],
    boostKeywords: ['licensed', 'certified', 'insured', 'bonded', 'years', 'commercial', 'emergency', 'response time']
  },
  'local-service-b2c': {
    priorityTypes: ['rating', 'review', 'testimonial', 'award'],
    prioritySources: ['google-reviews', 'yelp', 'website', 'facebook'],
    boostKeywords: ['stars', 'reviews', 'recommended', 'best', 'top rated', 'friendly', 'professional']
  },
  'regional-b2b-agency': {
    priorityTypes: ['testimonial', 'metric', 'logo', 'award'],
    prioritySources: ['clutch', 'google-reviews', 'website', 'linkedin'],
    boostKeywords: ['ROI', 'increase', 'growth', '%', 'results', 'case study', 'portfolio']
  },
  'regional-retail-b2c': {
    priorityTypes: ['rating', 'social', 'years', 'award'],
    prioritySources: ['google-reviews', 'facebook', 'website', 'yelp'],
    boostKeywords: ['locations', 'serving', 'since', 'community', 'local', 'family']
  },
  'national-saas-b2b': {
    priorityTypes: ['rating', 'certification', 'logo', 'metric'],
    prioritySources: ['g2', 'capterra', 'trustradius', 'website'],
    boostKeywords: ['SOC 2', 'enterprise', 'uptime', 'security', 'integrations', 'Fortune 500', 'G2 Leader']
  },
  'national-product-b2c': {
    priorityTypes: ['rating', 'review', 'press', 'social'],
    prioritySources: ['amazon', 'trustpilot', 'website', 'instagram'],
    boostKeywords: ['reviews', 'sold', 'customers', 'as seen', 'featured', 'bestseller', 'award-winning']
  },
  'global-saas-b2b': {
    priorityTypes: ['rating', 'certification', 'logo', 'metric'],
    prioritySources: ['g2', 'capterra', 'trustradius', 'website'],
    boostKeywords: ['GDPR', 'ISO', 'global', 'enterprise', 'multinational', 'data residency', 'compliance']
  }
};

// ============================================================================
// SOURCE AUTHORITY SCORES
// ============================================================================

const SOURCE_AUTHORITY: Record<ProofSource, number> = {
  'g2': 95,
  'capterra': 90,
  'trustradius': 90,
  'clutch': 90,
  'google-reviews': 85,
  'yelp': 80,
  'trustpilot': 85,
  'amazon': 80,
  'bbb': 85,
  'linkedin': 75,
  'website': 60,
  'facebook': 55,
  'instagram': 50,
  'industry-specific': 85
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateProofId(type: ProofType, source: string, index: number): string {
  return `proof-${type}-${source.replace(/[^a-z0-9]/gi, '')}-${index}`;
}

function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.content) return String(value.content);
    if (value.value) return String(value.value);
    if (value.statement) return String(value.statement);
    if (value.name) return String(value.name);
    return JSON.stringify(value);
  }
  return String(value);
}

function calculateRecencyScore(date?: Date | string): number {
  if (!date) return 50; // Unknown = neutral

  const proofDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const monthsAgo = (now.getTime() - proofDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsAgo < 6) return 100;
  if (monthsAgo < 12) return 75;
  if (monthsAgo < 24) return 50;
  return 25;
}

function calculateSpecificityScore(text: string): number {
  let score = 40; // Base score

  // Check for metrics/numbers
  if (/\d+%|\d+x|\$\d+|\d+ (years|months|customers|clients|reviews)/.test(text)) {
    score += 30;
  }

  // Check for specific outcomes
  if (/increase|decrease|improve|reduce|save|grow|boost/i.test(text)) {
    score += 15;
  }

  // Check for named entities
  if (/\b[A-Z][a-z]+ (Inc|LLC|Corp|Company|Group)\b/.test(text)) {
    score += 15;
  }

  return Math.min(score, 100);
}

function calculateVerificationScore(proof: Partial<ConsolidatedProof>): number {
  let score = 40; // Base score

  // Verified source
  if (['g2', 'capterra', 'trustradius'].includes(proof.source as string)) {
    score += 40; // These platforms verify reviewers
  } else if (['google-reviews', 'yelp'].includes(proof.source as string)) {
    score += 30;
  }

  // Has source URL
  if (proof.sourceUrl) {
    score += 10;
  }

  // Explicitly verified
  if (proof.isVerified) {
    score += 20;
  }

  return Math.min(score, 100);
}

function calculateQualityScore(
  recency: number,
  authority: number,
  specificity: number,
  verification: number
): number {
  // Weighted average: Recency 30%, Authority 30%, Specificity 20%, Verification 20%
  return Math.round(
    (recency * 0.3) +
    (authority * 0.3) +
    (specificity * 0.2) +
    (verification * 0.2)
  );
}

function calculateProfileRelevance(
  proof: Partial<ConsolidatedProof>,
  profileType: BusinessProfileType
): number {
  const config = PROFILE_PROOF_PRIORITIES[profileType];
  if (!config) return 50;

  let score = 50; // Base score

  // Boost for priority type
  if (config.priorityTypes.includes(proof.type as ProofType)) {
    score += 20;
  }

  // Boost for priority source
  if (config.prioritySources.includes(proof.source as ProofSource)) {
    score += 15;
  }

  // Boost for keywords
  const text = `${proof.title || ''} ${proof.value || ''}`.toLowerCase();
  const keywordMatches = config.boostKeywords.filter(kw => text.includes(kw.toLowerCase()));
  score += Math.min(keywordMatches.length * 5, 15);

  return Math.min(score, 100);
}

function deduplicateProofs(proofs: ConsolidatedProof[]): ConsolidatedProof[] {
  const seen = new Map<string, ConsolidatedProof>();

  for (const proof of proofs) {
    // Create a fingerprint based on normalized value
    const fingerprint = proof.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);

    if (!seen.has(fingerprint)) {
      seen.set(fingerprint, proof);
    } else {
      // Keep the one with higher quality score
      const existing = seen.get(fingerprint)!;
      if (proof.qualityScore > existing.qualityScore) {
        seen.set(fingerprint, proof);
      }
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

function extractFromReviews(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];

  // Google rating
  if (deepContext.reviews?.averageRating) {
    const authorityScore = SOURCE_AUTHORITY['google-reviews'];
    const recencyScore = 75; // Reviews are generally recent
    const specificityScore = 80; // Ratings are specific
    const verificationScore = 70;

    proofs.push({
      id: generateProofId('rating', 'google', 0),
      type: 'rating',
      title: 'Google Rating',
      value: `${deepContext.reviews.averageRating}/5 stars`,
      source: 'google-reviews',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 95,
      isVerified: true,
      profileRelevance: calculateProfileRelevance({ type: 'rating', source: 'google-reviews' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  }

  // Review count
  if (deepContext.reviews?.totalReviews) {
    const authorityScore = SOURCE_AUTHORITY['google-reviews'];
    const recencyScore = 75;
    const specificityScore = 90;
    const verificationScore = 70;

    proofs.push({
      id: generateProofId('metric', 'google', 1),
      type: 'metric',
      title: 'Total Reviews',
      value: `${deepContext.reviews.totalReviews}+ customer reviews`,
      source: 'google-reviews',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 95,
      isVerified: true,
      profileRelevance: calculateProfileRelevance({ type: 'metric', source: 'google-reviews' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  }

  return proofs;
}

function extractFromSynthesis(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];

  // Key insights as testimonials
  deepContext.synthesis?.keyInsights?.slice(0, 5).forEach((insight, idx) => {
    const insightStr = safeString(insight);
    if (!insightStr) return;

    const authorityScore = 65;
    const recencyScore = 60;
    const specificityScore = calculateSpecificityScore(insightStr);
    const verificationScore = 50;

    proofs.push({
      id: generateProofId('testimonial', 'synthesis', idx),
      type: 'testimonial',
      title: 'Customer Insight',
      value: insightStr,
      source: 'website',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 70,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'testimonial', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  });

  return proofs;
}

function extractFromIndustry(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];

  // Industry trends as market proof
  deepContext.industry?.trends?.slice(0, 3).forEach((trend, idx) => {
    const trendStr = safeString(trend);
    if (!trendStr) return;

    const authorityScore = 70;
    const recencyScore = 80; // Trends are timely
    const specificityScore = calculateSpecificityScore(trendStr);
    const verificationScore = 60;

    proofs.push({
      id: generateProofId('metric', 'industry', idx),
      type: 'metric',
      title: 'Industry Trend',
      value: trendStr,
      source: 'industry-specific',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 75,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'metric', source: 'industry-specific' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  });

  return proofs;
}

function extractFromRawDataPoints(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];

  // Raw data points with source URLs (actual customer voice)
  deepContext.rawDataPoints?.filter(p => p.sourceUrl || p.source).slice(0, 15).forEach((point, idx) => {
    const content = safeString(point.content);
    const source = safeString(point.source) || 'website';
    if (!content) return;

    // Determine source type for authority scoring
    let proofSource: ProofSource = 'website';
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('g2')) proofSource = 'g2';
    else if (sourceLower.includes('capterra')) proofSource = 'capterra';
    else if (sourceLower.includes('google') || sourceLower.includes('review')) proofSource = 'google-reviews';
    else if (sourceLower.includes('linkedin')) proofSource = 'linkedin';
    else if (sourceLower.includes('yelp')) proofSource = 'yelp';
    else if (sourceLower.includes('trustpilot')) proofSource = 'trustpilot';

    const authorityScore = SOURCE_AUTHORITY[proofSource] || 60;
    const recencyScore = calculateRecencyScore(point.timestamp);
    const specificityScore = calculateSpecificityScore(content);
    const verificationScore = calculateVerificationScore({ source: proofSource, sourceUrl: point.sourceUrl });

    proofs.push({
      id: generateProofId('review', source, idx),
      type: 'review',
      title: source || 'Customer Voice',
      value: content.slice(0, 250) + (content.length > 250 ? '...' : ''),
      source: proofSource,
      sourceUrl: point.sourceUrl,
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: point.confidence ? point.confidence * 100 : 70,
      isVerified: proofSource !== 'website',
      profileRelevance: calculateProfileRelevance({ type: 'review', source: proofSource }, profileType),
      alignedClaims: [],
      alignmentScore: 0,
      rawSourceId: point.id,
      rawQuote: content
    });
  });

  return proofs;
}

function extractFromUVP(uvp: CompleteUVP, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];

  // Differentiators as certifications/proof
  uvp.uniqueSolution?.differentiators?.slice(0, 3).forEach((diff, idx) => {
    const diffStr = safeString(diff);
    if (!diffStr) return;

    const authorityScore = 60;
    const recencyScore = 80;
    const specificityScore = calculateSpecificityScore(diffStr);
    const verificationScore = 50;

    proofs.push({
      id: generateProofId('certification', 'uvp', idx),
      type: 'certification',
      title: 'Key Differentiator',
      value: diffStr,
      source: 'website',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 85,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'certification', source: 'website' }, profileType),
      alignedClaims: ['differentiator'],
      alignmentScore: 80
    });
  });

  // Key benefit
  if (uvp.keyBenefit?.statement) {
    const benefitStr = safeString(uvp.keyBenefit.statement);
    if (benefitStr) {
      const authorityScore = 60;
      const recencyScore = 80;
      const specificityScore = calculateSpecificityScore(benefitStr);
      const verificationScore = 50;

      proofs.push({
        id: generateProofId('metric', 'uvp-benefit', 0),
        type: 'metric',
        title: 'Primary Benefit',
        value: benefitStr,
        source: 'website',
        qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
        recencyScore,
        authorityScore,
        specificityScore,
        verificationScore,
        confidence: 85,
        isVerified: false,
        profileRelevance: calculateProfileRelevance({ type: 'metric', source: 'website' }, profileType),
        alignedClaims: ['key_benefit'],
        alignmentScore: 90
      });
    }
  }

  return proofs;
}

function extractFromWebsiteAnalysis(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  // Check both locations - business.websiteAnalysis (legacy) and websiteAnalysis (direct)
  const analysis = deepContext.business?.websiteAnalysis || (deepContext as any).websiteAnalysis;

  if (!analysis) return proofs;

  console.log('[ProofConsolidation] Website analysis found:', {
    testimonials: analysis.testimonials?.length || 0,
    proofPoints: analysis.proofPoints?.length || 0
  });

  // Testimonials from website
  analysis.testimonials?.slice(0, 5).forEach((testimonial, idx) => {
    const testimonialStr = safeString(testimonial);
    if (!testimonialStr) return;

    const authorityScore = SOURCE_AUTHORITY['website'];
    const recencyScore = 60;
    const specificityScore = calculateSpecificityScore(testimonialStr);
    const verificationScore = 50;

    proofs.push({
      id: generateProofId('testimonial', 'website', idx),
      type: 'testimonial',
      title: 'Customer Testimonial',
      value: testimonialStr,
      source: 'website',
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 70,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'testimonial', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  });

  // NOTE: Removed proofPoints extraction - these are our own claims without source URLs
  // We only want externally verified proof points
  // analysis.proofPoints?.slice(0, 5).forEach(...);

  return proofs;
}

function extractFromReviewPlatforms(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  const reviewPlatforms = (deepContext as any).reviewPlatforms as ReviewPlatformResult | undefined;

  if (!reviewPlatforms) return proofs;

  console.log('[ProofConsolidation] Review platforms found:', {
    g2: reviewPlatforms.g2?.found,
    capterra: reviewPlatforms.capterra?.found,
    trustradius: reviewPlatforms.trustradius?.found,
    clutch: reviewPlatforms.clutch?.found,
    totalReviews: reviewPlatforms.allReviews?.length || 0
  });

  // Helper to process a platform
  const processPlatform = (
    platform: PlatformSummary | undefined,
    sourceName: ProofSource
  ) => {
    if (!platform?.found) return;

    // Overall rating for this platform
    if (platform.overallRating) {
      const authorityScore = SOURCE_AUTHORITY[sourceName] || 80;
      const recencyScore = 80; // Platform aggregates are recent
      const specificityScore = 85;
      const verificationScore = 90; // These platforms verify reviewers

      proofs.push({
        id: generateProofId('rating', sourceName, 0),
        type: 'rating',
        title: `${sourceName.toUpperCase()} Rating`,
        value: `${platform.overallRating}/5 stars${platform.totalReviews ? ` (${platform.totalReviews} reviews)` : ''}`,
        source: sourceName,
        sourceUrl: platform.profileUrl,
        qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
        recencyScore,
        authorityScore,
        specificityScore,
        verificationScore,
        confidence: 95,
        isVerified: true,
        profileRelevance: calculateProfileRelevance({ type: 'rating', source: sourceName }, profileType),
        alignedClaims: [],
        alignmentScore: 0
      });
    }

    // Badges (G2 Leader, etc.)
    platform.badges?.forEach((badge, idx) => {
      const authorityScore = SOURCE_AUTHORITY[sourceName] || 80;
      const recencyScore = 90; // Badges are earned quarterly
      const specificityScore = 90;
      const verificationScore = 95;

      proofs.push({
        id: generateProofId('award', sourceName, idx),
        type: 'award',
        title: `${sourceName.toUpperCase()} Badge`,
        value: badge,
        source: sourceName,
        sourceUrl: platform.profileUrl,
        qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
        recencyScore,
        authorityScore,
        specificityScore,
        verificationScore,
        confidence: 95,
        isVerified: true,
        profileRelevance: calculateProfileRelevance({ type: 'award', source: sourceName }, profileType),
        alignedClaims: [],
        alignmentScore: 0
      });
    });

    // Individual reviews with quotes
    platform.topReviews?.forEach((review, idx) => {
      if (!review.quote) return;

      const authorityScore = SOURCE_AUTHORITY[sourceName] || 80;
      const recencyScore = review.reviewDate ? calculateRecencyScore(review.reviewDate) : 70;
      const specificityScore = calculateSpecificityScore(review.quote);
      const verificationScore = review.verified ? 90 : 70;

      proofs.push({
        id: generateProofId('review', sourceName, idx + 100),
        type: 'review',
        title: `${sourceName.toUpperCase()} Review`,
        value: review.quote.slice(0, 250) + (review.quote.length > 250 ? '...' : ''),
        source: sourceName,
        sourceUrl: review.sourceUrl,
        qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
        recencyScore,
        authorityScore,
        specificityScore,
        verificationScore,
        confidence: 90,
        isVerified: review.verified || false,
        profileRelevance: calculateProfileRelevance({ type: 'review', source: sourceName }, profileType),
        alignedClaims: [],
        alignmentScore: 0,
        // Rich fields
        fullQuote: review.quote,
        authorName: review.reviewerName,
        authorCompany: review.reviewerCompany,
        authorRole: review.reviewerRole,
        reviewDate: review.reviewDate ? new Date(review.reviewDate) : undefined
      });
    });
  };

  // Process each platform
  processPlatform(reviewPlatforms.g2, 'g2');
  processPlatform(reviewPlatforms.capterra, 'capterra');
  processPlatform(reviewPlatforms.trustradius, 'trustradius');
  processPlatform(reviewPlatforms.clutch, 'clutch');

  return proofs;
}

function extractFromPressMentions(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  const pressMentions = (deepContext as any).pressMentions as PressResult | undefined;

  if (!pressMentions?.mentions?.length) return proofs;

  console.log('[ProofConsolidation] Press mentions found:', pressMentions.mentions.length);

  pressMentions.mentions.slice(0, 10).forEach((mention, idx) => {
    // Authority score from the scraper (based on publication)
    const authorityScore = mention.authorityScore;
    const recencyScore = mention.publishDate ? calculateRecencyScore(mention.publishDate) : 60;
    const specificityScore = mention.isFeaturedArticle ? 85 : 65;
    const verificationScore = mention.publicationType === 'major' ? 90 : 70;

    proofs.push({
      id: generateProofId('press', mention.publicationName.replace(/[^a-z0-9]/gi, ''), idx),
      type: 'press',
      title: `Featured in ${mention.publicationName}`,
      value: mention.snippet.slice(0, 250) + (mention.snippet.length > 250 ? '...' : ''),
      source: 'website', // Generic source type
      sourceUrl: mention.sourceUrl,
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: mention.publicationType === 'major' ? 95 : 80,
      isVerified: true, // Published content is verifiable
      profileRelevance: calculateProfileRelevance({ type: 'press', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0,
      // Rich fields
      fullQuote: mention.snippet,
      publicationName: mention.publicationName,
      reviewDate: mention.publishDate ? new Date(mention.publishDate) : undefined
    });
  });

  return proofs;
}

function extractFromDeepTestimonials(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  const deepTestimonials = (deepContext as any).deepTestimonials as DeepTestimonialResult | undefined;

  if (!deepTestimonials) return proofs;

  console.log('[ProofConsolidation] Deep testimonials found:', deepTestimonials.totalFound,
    'testimonials array:', deepTestimonials.testimonials?.length || 0,
    'caseStudies array:', deepTestimonials.caseStudies?.length || 0);

  // Process testimonials
  deepTestimonials.testimonials?.slice(0, 10).forEach((testimonial, idx) => {
    const authorityScore = 70; // Website testimonials have moderate authority
    const recencyScore = testimonial.date ? calculateRecencyScore(testimonial.date) : 60;
    const specificityScore = testimonial.metrics?.length ? 90 : calculateSpecificityScore(testimonial.quote);
    const verificationScore = testimonial.authorName ? 70 : 50;

    // Extract title - try to get company/subject name from quote if not available
    let testimonialTitle = 'Customer Testimonial';
    if (testimonial.authorCompany) {
      testimonialTitle = `Testimonial from ${testimonial.authorCompany}`;
    } else {
      // Try to extract subject from beginning of quote (e.g., "Perfect Fit demonstrates...")
      const subjectMatch = testimonial.quote?.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:demonstrates|shows|is|was|helps|enables)/);
      if (subjectMatch) {
        testimonialTitle = `${subjectMatch[1]} Demo`;
      }
    }

    proofs.push({
      id: generateProofId('testimonial', 'deep-testimonial', idx),
      type: 'testimonial',
      title: testimonialTitle,
      value: testimonial.quote.slice(0, 250) + (testimonial.quote.length > 250 ? '...' : ''),
      source: 'website',
      sourceUrl: testimonial.sourceUrl,
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 75,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'testimonial', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0,
      // Rich fields
      fullQuote: testimonial.quote,
      authorName: testimonial.authorName,
      authorCompany: testimonial.authorCompany,
      authorRole: testimonial.authorRole,
      authorPhoto: testimonial.authorPhoto
    });
  });

  // Process case studies (higher value)
  deepTestimonials.caseStudies?.slice(0, 5).forEach((caseStudyData, idx) => {
    const authorityScore = 80; // Case studies are more authoritative
    const recencyScore = caseStudyData.date ? calculateRecencyScore(caseStudyData.date) : 65;
    const specificityScore = caseStudyData.metrics?.length ? 95 : 75;
    const verificationScore = caseStudyData.authorCompany ? 80 : 60;

    // Use customer name from case study structure if available
    // Also detect content type from URL for ebooks/resources
    let customerName = caseStudyData.caseStudy?.customerName || caseStudyData.authorCompany || 'Customer';

    // Override with content type detection for ebooks and resources
    const url = caseStudyData.sourceUrl?.toLowerCase() || '';
    const title = caseStudyData.quote?.toLowerCase() || '';
    if (url.includes('ebook') || url.includes('e-book') || title.includes('ebook')) {
      customerName = title.includes('case stud') ? 'Case Studies Ebook' : 'Ebook Resource';
    } else if (url.includes('/download') || url.includes('/resource') || url.includes('/whitepaper')) {
      customerName = 'Resource Download';
    } else if (customerName === 'Customer') {
      // Try to extract from the quote content
      const perfectFitMatch = caseStudyData.quote?.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:demonstrates|shows|is|was)/);
      if (perfectFitMatch) {
        customerName = perfectFitMatch[1];
      }
    }

    proofs.push({
      id: generateProofId('testimonial', 'case-study', idx),
      type: 'testimonial',
      title: customerName, // Just the customer name as title
      value: caseStudyData.caseStudy?.execSummary || caseStudyData.quote.slice(0, 250) + (caseStudyData.quote.length > 250 ? '...' : ''),
      source: 'website',
      sourceUrl: caseStudyData.sourceUrl,
      qualityScore: calculateQualityScore(recencyScore, authorityScore, specificityScore, verificationScore),
      recencyScore,
      authorityScore,
      specificityScore,
      verificationScore,
      confidence: 80,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'testimonial', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0,
      fullQuote: caseStudyData.quote,
      authorName: caseStudyData.authorName,
      authorCompany: caseStudyData.authorCompany,
      authorRole: caseStudyData.authorRole,
      // Case study specific fields
      isCaseStudy: true,
      caseStudy: caseStudyData.caseStudy ? {
        customerName: caseStudyData.caseStudy.customerName,
        industry: caseStudyData.caseStudy.industry,
        execSummary: caseStudyData.caseStudy.execSummary,
        challenge: caseStudyData.caseStudy.challenge,
        solution: caseStudyData.caseStudy.solution,
        outcome: caseStudyData.caseStudy.outcome,
        metrics: caseStudyData.caseStudy.metrics,
        testimonialQuote: caseStudyData.caseStudy.testimonialQuote
      } : undefined
    });

    // If case study has metrics, add them as separate proof points
    const metrics = caseStudyData.caseStudy?.metrics || caseStudyData.metrics;
    metrics?.forEach((metric, mIdx) => {
      proofs.push({
        id: generateProofId('metric', 'case-study-metric', idx * 10 + mIdx),
        type: 'metric',
        title: `Result from ${customerName}`,
        value: metric,
        source: 'website',
        sourceUrl: caseStudyData.sourceUrl,
        qualityScore: 85,
        recencyScore: 70,
        authorityScore: 80,
        specificityScore: 95,
        verificationScore: 75,
        confidence: 85,
        isVerified: false,
        profileRelevance: calculateProfileRelevance({ type: 'metric', source: 'website' }, profileType),
        alignedClaims: [],
        alignmentScore: 0
      });
    });
  });

  return proofs;
}

function extractFromClientLogos(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  const clientLogos = (deepContext as any).clientLogos as ClientLogoResult | undefined;

  if (!clientLogos?.logos?.length) return proofs;

  console.log('[ProofConsolidation] Client logos found:', clientLogos.totalCount);

  // Add a summary proof point for logo count
  if (clientLogos.totalCount > 0) {
    const hasFortune500 = clientLogos.fortune500Count > 0;
    const authorityScore = hasFortune500 ? 90 : 70;

    proofs.push({
      id: generateProofId('logo', 'logo-count', 0),
      type: 'logo',
      title: 'Trusted By',
      value: hasFortune500
        ? `Trusted by ${clientLogos.totalCount}+ companies including ${clientLogos.fortune500Count} Fortune 500`
        : `Trusted by ${clientLogos.totalCount}+ companies`,
      source: 'website',
      qualityScore: calculateQualityScore(70, authorityScore, 80, 60),
      recencyScore: 70,
      authorityScore,
      specificityScore: 80,
      verificationScore: 60,
      confidence: 75,
      isVerified: false,
      profileRelevance: calculateProfileRelevance({ type: 'logo', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  }

  // Add individual recognizable logos
  clientLogos.logos
    .filter(l => l.isRecognizable)
    .slice(0, 5)
    .forEach((logo, idx) => {
      const authorityScore = logo.category === 'fortune500' ? 95 : 80;

      proofs.push({
        id: generateProofId('logo', logo.companyName.replace(/[^a-z0-9]/gi, ''), idx),
        type: 'logo',
        title: `${logo.companyName} Logo`,
        value: `${logo.companyName} is a customer`,
        source: 'website',
        sourceUrl: logo.sourceUrl,
        qualityScore: calculateQualityScore(70, authorityScore, 85, 70),
        recencyScore: 70,
        authorityScore,
        specificityScore: 85,
        verificationScore: 70,
        confidence: 80,
        isVerified: false,
        profileRelevance: calculateProfileRelevance({ type: 'logo', source: 'website' }, profileType),
        alignedClaims: [],
        alignmentScore: 0
      });
    });

  return proofs;
}

function extractFromSocialProof(deepContext: DeepContext, profileType: BusinessProfileType): ConsolidatedProof[] {
  const proofs: ConsolidatedProof[] = [];
  const socialProof = (deepContext as any).socialProof as SocialProofResult | undefined;

  if (!socialProof?.metrics?.length) return proofs;

  console.log('[ProofConsolidation] Social proof metrics found:', socialProof.metrics.length);

  // Add proof for each social platform with meaningful followers
  socialProof.metrics.forEach((metric, idx) => {
    if (!metric.count || metric.count < 100) return; // Skip tiny accounts

    const authorityScore = metric.verified ? 85 : 65;
    const displayCount = metric.displayCount || formatSocialCount(metric.count);

    proofs.push({
      id: generateProofId('social', metric.platform, idx),
      type: 'social',
      title: `${metric.platform.charAt(0).toUpperCase() + metric.platform.slice(1)} Following`,
      value: `${displayCount} ${metric.metricType} on ${metric.platform}${metric.verified ? ' (Verified)' : ''}`,
      source: 'website',
      sourceUrl: metric.profileUrl,
      qualityScore: calculateQualityScore(80, authorityScore, 70, metric.verified ? 85 : 60),
      recencyScore: 80, // Social metrics are current
      authorityScore,
      specificityScore: 70,
      verificationScore: metric.verified ? 85 : 60,
      confidence: 70,
      isVerified: metric.verified || false,
      profileRelevance: calculateProfileRelevance({ type: 'social', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  });

  // Add total followers as aggregate proof
  if (socialProof.totalFollowers > 1000) {
    proofs.push({
      id: generateProofId('social', 'total', 0),
      type: 'social',
      title: 'Social Following',
      value: `${formatSocialCount(socialProof.totalFollowers)} total followers across ${socialProof.metrics.length} platforms`,
      source: 'website',
      qualityScore: 70,
      recencyScore: 80,
      authorityScore: 65,
      specificityScore: 75,
      verificationScore: socialProof.hasVerifiedAccounts ? 80 : 55,
      confidence: 70,
      isVerified: socialProof.hasVerifiedAccounts,
      profileRelevance: calculateProfileRelevance({ type: 'social', source: 'website' }, profileType),
      alignedClaims: [],
      alignmentScore: 0
    });
  }

  return proofs;
}

// Helper to format social counts
function formatSocialCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

class ProofConsolidationService {
  /**
   * Consolidate proof from all sources
   */
  consolidate(
    deepContext: DeepContext | null,
    uvp: CompleteUVP | null,
    profileType: BusinessProfileType = 'national-saas-b2b'
  ): ProofConsolidationResult {
    console.log('[ProofConsolidation] Starting consolidation for profile:', profileType);

    let allProofs: ConsolidatedProof[] = [];

    // Extract from EXTERNAL sources only (must have sourceUrl or be from verified platform)
    if (deepContext) {
      // Google Reviews - has verified ratings
      const reviews = extractFromReviews(deepContext, profileType);
      allProofs.push(...reviews);

      // NOTE: Removed sourceless extractors - these are our own claims
      // allProofs.push(...extractFromSynthesis(deepContext, profileType)); // No source URLs
      // allProofs.push(...extractFromIndustry(deepContext, profileType));  // No source URLs

      // Raw data points - only those with source URLs
      const rawData = extractFromRawDataPoints(deepContext, profileType);
      allProofs.push(...rawData);

      // Website testimonials - these should have source URLs
      const websiteProofs = extractFromWebsiteAnalysis(deepContext, profileType);
      allProofs.push(...websiteProofs);

      // Review platforms (G2, Capterra, etc) - verified external sources
      const platformProofs = extractFromReviewPlatforms(deepContext, profileType);
      allProofs.push(...platformProofs);

      // Press mentions - have source URLs
      const pressProofs = extractFromPressMentions(deepContext, profileType);
      allProofs.push(...pressProofs);

      // Deep testimonials/case studies - have source URLs
      const deepTestimonialProofs = extractFromDeepTestimonials(deepContext, profileType);
      allProofs.push(...deepTestimonialProofs);
      console.log('[ProofConsolidation] Deep testimonials extracted:', deepTestimonialProofs.length, 'proofs', deepTestimonialProofs.filter(p => p.type === 'testimonial').length, 'testimonials');

      // Client logos - have source URLs
      const logoProofs = extractFromClientLogos(deepContext, profileType);
      allProofs.push(...logoProofs);

      // Social proof - have profile URLs
      const socialProofs = extractFromSocialProof(deepContext, profileType);
      allProofs.push(...socialProofs);

      console.log('[ProofConsolidation] Extraction summary:', {
        reviews: reviews.length,
        rawData: rawData.length,
        website: websiteProofs.length,
        platforms: platformProofs.length,
        press: pressProofs.length,
        deepTestimonials: deepTestimonialProofs.length,
        logos: logoProofs.length,
        social: socialProofs.length
      });
    }

    // NOTE: Removed extractFromUVP - we only want real external proof, not our own claims
    // if (uvp) {
    //   allProofs.push(...extractFromUVP(uvp, profileType));
    // }

    const totalExtracted = allProofs.length;
    console.log(`[ProofConsolidation] Extracted ${totalExtracted} proof points`);

    // FILTER: Only keep proofs with source URLs (external validation)
    // EXCEPTION: Website-sourced content (testimonials, metrics from brand site) doesn't need external URLs
    const beforeFilter = allProofs.length;
    allProofs = allProofs.filter(p =>
      (p.sourceUrl && p.sourceUrl.length > 0) ||
      p.source === 'website' // Allow website-sourced proofs without external URL requirement
    );
    console.log(`[ProofConsolidation] After sourceUrl filter: ${allProofs.length} proof points (filtered ${beforeFilter - allProofs.length})`);

    // Deduplicate
    allProofs = deduplicateProofs(allProofs);
    const deduplicatedCount = totalExtracted - allProofs.length;
    console.log(`[ProofConsolidation] Deduplicated ${deduplicatedCount} duplicates`);

    // Sort by quality score
    allProofs.sort((a, b) => b.qualityScore - a.qualityScore);

    // Calculate average quality
    const avgQualityScore = allProofs.length > 0
      ? Math.round(allProofs.reduce((sum, p) => sum + p.qualityScore, 0) / allProofs.length)
      : 0;

    // Determine top proof types
    const typeCounts = allProofs.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<ProofType, number>);

    const topProofTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type as ProofType);

    // Calculate source coverage
    const sourceCoverage = allProofs.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`[ProofConsolidation] Complete: ${allProofs.length} proofs, avg quality ${avgQualityScore}`);
    console.log(`[ProofConsolidation] Type breakdown:`, typeCounts);

    return {
      proofs: allProofs,
      profileType,
      totalExtracted,
      deduplicatedCount,
      avgQualityScore,
      topProofTypes,
      sourceCoverage
    };
  }

  /**
   * Get proof relevant for a specific UVP claim
   */
  getProofForClaim(
    proofs: ConsolidatedProof[],
    claim: 'target_customer' | 'key_benefit' | 'transformation' | 'differentiator'
  ): ConsolidatedProof[] {
    return proofs.filter(p =>
      p.alignedClaims.includes(claim) || p.alignmentScore > 50
    ).slice(0, 5);
  }

  /**
   * Get top N proof points by quality
   */
  getTopProof(proofs: ConsolidatedProof[], n: number = 5): ConsolidatedProof[] {
    return proofs
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, n);
  }

  /**
   * Filter proof by type
   */
  filterByType(proofs: ConsolidatedProof[], types: ProofType[]): ConsolidatedProof[] {
    return proofs.filter(p => types.includes(p.type));
  }

  /**
   * Filter proof by minimum quality score
   */
  filterByQuality(proofs: ConsolidatedProof[], minScore: number = 50): ConsolidatedProof[] {
    return proofs.filter(p => p.qualityScore >= minScore);
  }
}

export const proofConsolidationService = new ProofConsolidationService();
export default proofConsolidationService;
