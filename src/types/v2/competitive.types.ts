/**
 * Competitive Analysis Types
 *
 * Types for competitor content analysis, theme extraction,
 * and differentiation scoring.
 */

/**
 * Competitor information
 */
export interface Competitor {
  id: string;
  name: string;
  url: string;
  industry?: string;
  description?: string;
}

/**
 * Content scraped from competitor
 */
export interface CompetitorContent {
  competitorId: string;
  competitorName: string;
  url: string;
  title: string;
  content: string;
  contentType: 'blog' | 'landing' | 'product' | 'about' | 'service' | 'other';
  scrapedAt: Date;
  metadata?: {
    author?: string;
    publishedDate?: string;
    keywords?: string[];
    description?: string;
  };
}

/**
 * Extracted theme from content
 */
export interface ExtractedTheme {
  id: string;
  theme: string;
  frequency: number;
  competitorIds: string[];
  confidence: number;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: 'value-prop' | 'feature' | 'benefit' | 'pain-point' | 'differentiator' | 'social-proof';
}

/**
 * Theme cluster group
 */
export interface ThemeCluster {
  id: string;
  name: string;
  themes: ExtractedTheme[];
  totalFrequency: number;
  competitorCoverage: number; // % of competitors using this cluster
}

/**
 * White space opportunity
 */
export interface WhiteSpaceOpportunity {
  id: string;
  area: string;
  description: string;
  competitorGap: string[];
  yourCoverage: boolean;
  opportunityScore: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  suggestedAngle: string;
  keywords: string[];
}

/**
 * Gap between your content and competitors
 */
export interface ContentGap {
  id: string;
  theme: string;
  competitorUsage: number; // % of competitors using it
  yourUsage: boolean;
  gapType: 'missing' | 'underutilized' | 'opportunity';
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Differentiation score breakdown
 */
export interface DifferentiationScore {
  overall: number; // 0-100
  breakdown: {
    uniqueThemes: number;
    messagingClarity: number;
    valueProposition: number;
    contentQuality: number;
    brandVoice: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

/**
 * Complete competitive analysis report
 */
export interface CompetitiveAnalysisReport {
  id: string;
  brandId: string;
  analyzedAt: Date;
  competitors: Competitor[];
  yourContent: CompetitorContent[];
  competitorContent: CompetitorContent[];
  themes: {
    yours: ExtractedTheme[];
    competitors: ExtractedTheme[];
    common: ExtractedTheme[];
    unique: ExtractedTheme[];
  };
  clusters: ThemeCluster[];
  whiteSpaces: WhiteSpaceOpportunity[];
  contentGaps: ContentGap[];
  differentiationScore: DifferentiationScore;
  summary: {
    totalCompetitors: number;
    totalContent: number;
    averageCompetitorThemes: number;
    yourThemeCount: number;
    uniqueThemePercentage: number;
    topOpportunities: string[];
  };
}

/**
 * Configuration for competitive analysis
 */
export interface CompetitiveAnalysisConfig {
  /** Maximum competitors to analyze */
  maxCompetitors: number;
  /** Maximum content pages per competitor */
  maxContentPerCompetitor: number;
  /** Minimum theme frequency to include */
  minThemeFrequency: number;
  /** Similarity threshold for clustering */
  clusteringThreshold: number;
  /** Include social media content */
  includeSocial: boolean;
  /** Scraping timeout in seconds */
  scrapeTimeout: number;
}

/**
 * Default configuration
 */
export const DEFAULT_COMPETITIVE_CONFIG: CompetitiveAnalysisConfig = {
  maxCompetitors: 5,
  maxContentPerCompetitor: 10,
  minThemeFrequency: 2,
  clusteringThreshold: 0.7,
  includeSocial: false,
  scrapeTimeout: 120,
};

/**
 * Input for competitive analysis
 */
export interface CompetitiveAnalysisInput {
  brandId: string;
  brandUrl: string;
  brandContent?: CompetitorContent[];
  competitors: Competitor[];
  config?: Partial<CompetitiveAnalysisConfig>;
}

/**
 * Theme extraction input
 */
export interface ThemeExtractionInput {
  content: CompetitorContent[];
  minFrequency?: number;
  maxThemes?: number;
}

/**
 * Theme extraction result
 */
export interface ThemeExtractionResult {
  themes: ExtractedTheme[];
  clusters: ThemeCluster[];
  totalContent: number;
  processingTimeMs: number;
}
