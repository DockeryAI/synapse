/**
 * Breakthrough Generator Service
 *
 * Converts clusters and connections into actionable breakthrough insights
 * with unique titles, scoring, and provenance tracking.
 */

import type { InsightCluster } from './clustering.service';
import type { Connection } from './connection-discovery.service';
import type { DataPoint } from '@/types/connections.types';

export interface Breakthrough {
  id: string;
  title: string;
  description: string;
  score: number; // 0-100
  category: 'urgent' | 'high-value' | 'evergreen';

  // Source tracking
  clusters: InsightCluster[];
  connections: Connection[];
  dataPoints: DataPoint[];

  // Validation
  validation: {
    clusterCount: number;
    totalDataPoints: number;
    sourceTypes: string[];
    validationStatement: string;
  };

  // Performance indicators
  timing: {
    relevance: number; // 0-1
    urgency: boolean;
    seasonal: boolean;
  };

  competitiveAdvantage: {
    hasGap: boolean;
    gapDescription?: string;
  };

  emotionalResonance: {
    eqScore: number; // 0-100
    dominantEmotion: string;
    triggers: string[];
  };

  // Content generation hints
  suggestedAngles: string[];
  provenance: string; // Human-readable source description
}

class BreakthroughGeneratorService {
  /**
   * Generate breakthroughs from clusters and connections
   */
  generateBreakthroughs(
    clusters: InsightCluster[],
    connections: Connection[]
  ): Breakthrough[] {
    const breakthroughs: Breakthrough[] = [];
    const usedTitles = new Set<string>();

    // Generate from connections (strongest signal)
    for (const connection of connections) {
      const breakthrough = this.connectionToBreakthrough(connection, clusters, usedTitles);
      if (breakthrough && breakthrough.score >= 60) {
        breakthroughs.push(breakthrough);
      }
    }

    // Generate from standalone strong clusters
    for (const cluster of clusters) {
      if (cluster.size >= 5 && cluster.coherence >= 0.7) {
        const breakthrough = this.clusterToBreakthrough(cluster, usedTitles);
        if (breakthrough && breakthrough.score >= 60) {
          breakthroughs.push(breakthrough);
        }
      }
    }

    // Sort by score and deduplicate
    const unique = this.deduplicateBreakthroughs(breakthroughs);
    return unique.sort((a, b) => b.score - a.score);
  }

  /**
   * Convert connection to breakthrough
   */
  private connectionToBreakthrough(
    connection: Connection,
    clusters: InsightCluster[],
    usedTitles: Set<string>
  ): Breakthrough | null {
    // Find related clusters
    const relatedClusters = clusters.filter(cluster =>
      connection.dataPoints.some(dp =>
        cluster.dataPoints.some(cdp => cdp.id === dp.id)
      )
    );

    if (relatedClusters.length === 0) return null;

    // Extract themes from connection
    const themes = this.extractThemes(connection.dataPoints);

    // Use template system for title generation
    const insightType = this.determineInsightType(connection.dataPoints);
    const template = this.selectTitleTemplate(insightType, themes.join(' '), usedTitles);
    const variables = this.extractTemplateVariables(connection, relatedClusters, connection.dataPoints);
    const title = this.interpolateTemplate(template, variables);

    const description = this.generateDescription(connection, relatedClusters);

    // Calculate scores
    const timingScore = this.calculateTimingScore(connection.dataPoints);
    const validationScore = this.calculateValidationScore(relatedClusters);
    const competitiveScore = this.calculateCompetitiveScore(connection.dataPoints);
    const emotionalScore = this.calculateEmotionalScore(connection.dataPoints, relatedClusters);

    const totalScore = Math.round(
      (timingScore * 0.25) +
      (validationScore * 0.25) +
      (competitiveScore * 0.25) +
      (emotionalScore * 0.25)
    );

    // Determine category
    const category = this.determineCategory(connection.dataPoints, totalScore);

    // Build validation
    const validation = {
      clusterCount: relatedClusters.length,
      totalDataPoints: connection.dataPoints.length,
      sourceTypes: [...new Set(connection.dataPoints.map(dp => dp.source))],
      validationStatement: this.buildValidationStatement(relatedClusters, connection.dataPoints)
    };

    // Build provenance
    const provenance = this.buildProvenance(relatedClusters, connection.dataPoints);

    return {
      id: `breakthrough-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      score: totalScore,
      category,
      clusters: relatedClusters,
      connections: [connection],
      dataPoints: connection.dataPoints,
      validation,
      timing: {
        relevance: timingScore / 100,
        urgency: this.hasTimingTrigger(connection.dataPoints),
        seasonal: this.isSeasonalTrigger(connection.dataPoints)
      },
      competitiveAdvantage: {
        hasGap: this.hasCompetitorGap(connection.dataPoints),
        gapDescription: this.getGapDescription(connection.dataPoints)
      },
      emotionalResonance: {
        eqScore: emotionalScore,
        dominantEmotion: this.getDominantEmotion(relatedClusters),
        triggers: this.extractEmotionalTriggers(connection.dataPoints)
      },
      suggestedAngles: this.generateAngles(themes, connection),
      provenance
    };
  }

  /**
   * Convert strong cluster to breakthrough
   */
  private clusterToBreakthrough(cluster: InsightCluster, usedTitles: Set<string>): Breakthrough | null {
    const themes = this.extractThemes(cluster.dataPoints);

    // Use template system for title generation
    const insightType = this.determineInsightType(cluster.dataPoints);
    const template = this.selectTitleTemplate(insightType, cluster.theme, usedTitles);
    // Create a minimal connection-like object for template extraction
    const pseudoConnection = {
      dataPoints: cluster.dataPoints,
      strength: 0,
      type: 'pattern',
      id: cluster.id,
      sources: cluster.sources,
      connectionType: 'single-cluster',
      breakthroughScore: 0,
      emotionalResonance: 0,
      clusters: [cluster.id],
      evidence: []
    } as Connection;
    const variables = this.extractTemplateVariables(
      pseudoConnection,
      [cluster],
      cluster.dataPoints
    );
    const title = this.interpolateTemplate(template, variables);

    const description = cluster.validationStatement || `Consistent pattern found across ${cluster.size} data points`;

    const score = Math.round(
      (cluster.size / 20) * 40 + // Size score (max 40)
      (cluster.coherence * 30) + // Coherence score (max 30)
      (cluster.sources.length * 10) // Source diversity (max ~30)
    );

    return {
      id: `breakthrough-cluster-${cluster.id}`,
      title,
      description,
      score: Math.min(100, score),
      category: 'evergreen',
      clusters: [cluster],
      connections: [],
      dataPoints: cluster.dataPoints,
      validation: {
        clusterCount: 1,
        totalDataPoints: cluster.size,
        sourceTypes: cluster.sources,
        validationStatement: cluster.validationStatement || `${cluster.size} data points confirm this pattern`
      },
      timing: {
        relevance: 0.5,
        urgency: false,
        seasonal: false
      },
      competitiveAdvantage: {
        hasGap: false
      },
      emotionalResonance: {
        eqScore: 60,
        dominantEmotion: cluster.emotionalTrigger || 'insight',
        triggers: cluster.commonPhrases || []
      },
      suggestedAngles: [`How to leverage ${cluster.theme}`, `The truth about ${cluster.theme}`],
      provenance: `Cluster: ${cluster.theme} (${cluster.size} points from ${cluster.sources.join(', ')})`
    };
  }

  /**
   * Determines the insight type from data points to select appropriate template
   */
  private determineInsightType(dataPoints: DataPoint[]): string {
    // Check for customer-related signals
    const hasYoutube = dataPoints.some(dp => dp.source === 'youtube');
    const hasReviews = dataPoints.some(dp => dp.source === 'outscraper' || dp.source.includes('google'));
    if (hasYoutube || hasReviews) {
      return 'customer-need';
    }

    // Check for competitive signals
    const hasCompetitor = dataPoints.some(dp => dp.source === 'semrush' || dp.source.includes('competitor'));
    if (hasCompetitor) {
      return 'competitive-gap';
    }

    // Check for timing signals
    const hasTiming = dataPoints.some(dp => dp.source === 'weather' || dp.source === 'news' || dp.type === 'timing');
    if (hasTiming) {
      return 'seasonal-timing';
    }

    // Check for emotional signals
    const hasEmotional = dataPoints.some(dp => dp.metadata?.sentiment || dp.content.match(/\b(frustrated|excited|worried|anxious|hopeful)\b/i));
    if (hasEmotional) {
      return 'emotional-trigger';
    }

    // Check for local signals
    const hasLocation = dataPoints.some(dp => dp.metadata?.location);
    if (hasLocation) {
      return 'local-cultural';
    }

    // Default to market trend
    return 'market-trend';
  }

  /**
   * Title templates categorized by insight type
   * Each category has 5-15 unique templates for variety
   */
  private static readonly TITLE_TEMPLATES = {
    customerNeed: [
      "Customers silently craving {insight}",
      "The hidden desire for {insight} your competitors miss",
      "Why {segment} desperately needs {insight}",
      "{segment} secretly wants {insight} but won't ask",
      "Untapped demand for {insight} in {location}",
      "The {insight} gap nobody's filling",
      "{segment} would pay more for {insight}",
      "Customers choosing competitors for {insight}",
      "The {insight} your audience begs for online",
      "{segment} frustrated by lack of {insight}",
      "Emerging appetite for {insight}",
      "What {segment} really means when they say '{quote}'",
      "The {insight} opportunity hiding in reviews",
      "Why customers defect over missing {insight}",
      "Unmet expectations around {insight}"
    ],
    marketTrend: [
      "{industry} shifting toward {insight}",
      "Rising tide of {insight} in {location}",
      "{insight} becoming table stakes in {industry}",
      "Market momentum behind {insight}",
      "The {insight} wave competitors are riding",
      "{industry} leaders betting on {insight}",
      "Accelerating demand for {insight}",
      "{insight} reshaping {industry} expectations",
      "Why {industry} can't ignore {insight} anymore",
      "The {insight} trend reaching {location}",
      "Market validation for {insight} approach",
      "{industry} evolution toward {insight}"
    ],
    competitiveGap: [
      "Competitors neglecting {insight}",
      "The {insight} blindspot across {industry}",
      "Where rivals fail at {insight}",
      "Competitor weakness in {insight} creates opening",
      "{insight} advantage competitors can't copy quickly",
      "Industry-wide failure to deliver {insight}",
      "Exploitable gap in {insight} positioning",
      "Differentiation opportunity through {insight}",
      "The {insight} void in current market",
      "Competitors losing customers over {insight}"
    ],
    emotionalTrigger: [
      "{emotion} driving {segment} decisions",
      "The {emotion} your messaging must tap",
      "Fear of {pain} motivating {segment}",
      "{segment} seeking {aspiration}",
      "Anxiety around {pain} in {segment}",
      "Hope for {aspiration} among {audience}",
      "The {emotion} behind every purchase",
      "Emotional pull of {insight} for {segment}"
    ],
    seasonalTiming: [
      "{event} creating urgency for {insight}",
      "Limited window for {insight} before {timing}",
      "{season} demand spike for {insight}",
      "Time-sensitive {insight} opportunity",
      "{event} amplifying need for {insight}"
    ],
    localCultural: [
      "{location} culture values {insight}",
      "Local preference for {insight} in {location}",
      "{location} community rallying around {insight}",
      "Regional demand for {insight}",
      "{location} identity tied to {insight}"
    ]
  } as const;

  /**
   * Selects appropriate template based on insight type and content
   * Tracks used templates to ensure uniqueness within a session
   */
  private selectTitleTemplate(
    insightType: string,
    content: string,
    usedTemplates: Set<string>
  ): string {
    // Determine category from insight type
    let categoryKey: keyof typeof BreakthroughGeneratorService.TITLE_TEMPLATES = 'marketTrend';

    const lowerType = insightType.toLowerCase();
    if (lowerType.includes('customer') || lowerType.includes('need') || lowerType.includes('unarticulated')) {
      categoryKey = 'customerNeed';
    } else if (lowerType.includes('competition') || lowerType.includes('gap') || lowerType.includes('blindspot')) {
      categoryKey = 'competitiveGap';
    } else if (lowerType.includes('emotional') || lowerType.includes('trigger')) {
      categoryKey = 'emotionalTrigger';
    } else if (lowerType.includes('event') || lowerType.includes('seasonal') || lowerType.includes('timing')) {
      categoryKey = 'seasonalTiming';
    } else if (lowerType.includes('local') || lowerType.includes('cultural')) {
      categoryKey = 'localCultural';
    }

    const templates = BreakthroughGeneratorService.TITLE_TEMPLATES[categoryKey];

    // Filter to unused templates
    const availableTemplates = templates.filter(t => !usedTemplates.has(t));

    // If all used, reset and start over
    if (availableTemplates.length === 0) {
      usedTemplates.clear();
      const selected = templates[0];
      usedTemplates.add(selected);
      return selected;
    }

    // Select random from available
    const selected = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    usedTemplates.add(selected);
    return selected;
  }

  /**
   * Extracts variables from connection for template interpolation
   */
  private extractTemplateVariables(connection: Connection, clusters: InsightCluster[], dataPoints: DataPoint[]): Record<string, string> {
    // Extract the core insight text from clusters
    const insightText = clusters.length > 0
      ? clusters[0].theme
      : (dataPoints.length > 0 ? dataPoints[0].content.substring(0, 100) : 'this opportunity');

    // Truncate if too long for title
    const truncatedInsight = insightText.length > 50
      ? insightText.substring(0, 47) + '...'
      : insightText;

    // Extract location from data points if available
    const locationData = dataPoints.find(dp => dp.metadata?.location);
    const location = locationData?.metadata?.location || 'your area';

    // Extract industry from data points
    const industryData = dataPoints.find(dp => dp.metadata?.industry);
    const industry = industryData?.metadata?.industry || 'your industry';

    // Extract quotes from data points
    const quoteData = dataPoints.find(dp => dp.content.includes('"'));
    const quote = quoteData?.content.match(/"([^"]+)"/)?.[1] || 'customer feedback';

    return {
      insight: truncatedInsight,
      segment: 'customers',
      location: location,
      industry: industry,
      emotion: 'desire',
      pain: 'current frustrations',
      aspiration: 'better outcomes',
      event: 'recent developments',
      timing: 'the opportunity passes',
      season: 'this period',
      quote: quote,
      audience: 'your audience'
    };
  }

  /**
   * Interpolates template with variables
   */
  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    // Replace each variable placeholder
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Extract meaningful themes from data points
   */
  private extractThemes(dataPoints: DataPoint[]): string[] {
    const keywords: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    for (const dp of dataPoints) {
      const words = dp.content
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.has(w));

      for (const word of words) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    }

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Generate unique title from themes
   */
  private generateUniqueTitle(
    themes: string[],
    connection: Connection,
    clusters: InsightCluster[]
  ): string {
    // Use cluster themes if available
    if (clusters.length > 0 && clusters[0].theme) {
      const mainTheme = clusters[0].theme;

      // Title templates based on data types
      const hasTiming = connection.dataPoints.some(dp => dp.type === 'timing');
      const hasCompetitor = connection.dataPoints.some(dp => dp.source === 'semrush');
      const hasCustomer = connection.dataPoints.some(dp => dp.source === 'youtube' || dp.source === 'outscraper');

      if (hasTiming && hasCustomer) {
        return `${mainTheme}: The Window is Closing`;
      } else if (hasCompetitor) {
        return `The ${mainTheme} Gap Competitors Are Missing`;
      } else if (hasCustomer) {
        return `What Customers Really Want: ${mainTheme}`;
      }
    }

    // Fallback to theme-based title
    const mainTheme = themes[0] || 'insight';
    return `${mainTheme.charAt(0).toUpperCase() + mainTheme.slice(1)} Opportunity Discovered`;
  }

  /**
   * Generate description
   */
  private generateDescription(connection: Connection, clusters: InsightCluster[]): string {
    const clusterNames = clusters.map(c => c.theme).join(' + ');
    const sourceTypes = [...new Set(connection.dataPoints.map(dp => dp.source))];

    return `Pattern connecting ${clusterNames} across ${sourceTypes.join(', ')}. ${connection.dataPoints.length} data points validate this angle.`;
  }

  /**
   * Calculate timing score
   */
  private calculateTimingScore(dataPoints: DataPoint[]): number {
    const hasWeather = dataPoints.some(dp => dp.source === 'weather');
    const hasNews = dataPoints.some(dp => dp.source === 'news');
    const hasTrends = dataPoints.some(dp => dp.type === 'timing');

    let score = 50; // Base
    if (hasWeather) score += 25;
    if (hasNews) score += 15;
    if (hasTrends) score += 10;

    return Math.min(100, score);
  }

  /**
   * Calculate validation score from clusters
   */
  private calculateValidationScore(clusters: InsightCluster[]): number {
    const totalSize = clusters.reduce((sum, c) => sum + c.size, 0);
    const avgCoherence = clusters.reduce((sum, c) => sum + c.coherence, 0) / clusters.length;

    return Math.min(100, (totalSize / 10) * 30 + (avgCoherence * 70));
  }

  /**
   * Calculate competitive advantage score
   */
  private calculateCompetitiveScore(dataPoints: DataPoint[]): number {
    const hasCompetitorData = dataPoints.some(dp => dp.source === 'semrush');
    const hasGap = this.hasCompetitorGap(dataPoints);

    let score = 40; // Base
    if (hasCompetitorData) score += 30;
    if (hasGap) score += 30;

    return Math.min(100, score);
  }

  /**
   * Calculate emotional resonance score
   */
  private calculateEmotionalScore(dataPoints: DataPoint[], clusters: InsightCluster[]): number {
    const hasYoutube = dataPoints.some(dp => dp.source === 'youtube');
    const hasReviews = dataPoints.some(dp => dp.source === 'outscraper');
    const negativeSentiment = dataPoints.filter(dp => dp.metadata?.sentiment === 'negative').length;

    let score = 50; // Base
    if (hasYoutube) score += 15;
    if (hasReviews) score += 15;
    if (negativeSentiment > dataPoints.length / 2) score += 20; // Pain points score higher

    return Math.min(100, score);
  }

  /**
   * Determine breakthrough category
   */
  private determineCategory(dataPoints: DataPoint[], score: number): 'urgent' | 'high-value' | 'evergreen' {
    const hasWeather = dataPoints.some(dp => dp.source === 'weather');
    const hasNews = dataPoints.some(dp => dp.source === 'news' && this.isRecent(dp));

    if ((hasWeather || hasNews) && score >= 80) return 'urgent';
    if (score >= 70) return 'high-value';
    return 'evergreen';
  }

  /**
   * Check if data point is recent
   */
  private isRecent(dp: DataPoint): boolean {
    if (!dp.createdAt) return false;
    const daysSince = (Date.now() - new Date(dp.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
  }

  /**
   * Build validation statement
   */
  private buildValidationStatement(clusters: InsightCluster[], dataPoints: DataPoint[]): string {
    const clusterSizes = clusters.map(c => c.size);
    const totalValidation = clusterSizes.reduce((a, b) => a + b, 0);
    const sources = [...new Set(dataPoints.map(dp => dp.source))];

    if (clusters.length > 1) {
      return `Validated by ${totalValidation} data points across ${clusters.length} patterns from ${sources.join(', ')}`;
    } else if (clusters.length === 1) {
      return clusters[0].validationStatement || `${totalValidation} data points confirm this pattern`;
    }

    return `${dataPoints.length} data points from ${sources.join(', ')}`;
  }

  /**
   * Build provenance string
   */
  private buildProvenance(clusters: InsightCluster[], dataPoints: DataPoint[]): string {
    const sources = [...new Set(dataPoints.map(dp => dp.source))];
    const clusterInfo = clusters.length > 0 ? ` (${clusters.map(c => c.theme).join(' + ')})` : '';

    return `Based on: ${sources.join(' + ')}${clusterInfo}`;
  }

  /**
   * Check for timing triggers
   */
  private hasTimingTrigger(dataPoints: DataPoint[]): boolean {
    return dataPoints.some(dp =>
      dp.source === 'weather' ||
      dp.source === 'news' ||
      dp.type === 'timing'
    );
  }

  /**
   * Check for seasonal triggers
   */
  private isSeasonalTrigger(dataPoints: DataPoint[]): boolean {
    const seasonalKeywords = ['summer', 'winter', 'spring', 'fall', 'holiday', 'season', 'christmas', 'thanksgiving'];
    return dataPoints.some(dp =>
      seasonalKeywords.some(keyword => dp.content.toLowerCase().includes(keyword))
    );
  }

  /**
   * Check for competitor gaps
   */
  private hasCompetitorGap(dataPoints: DataPoint[]): boolean {
    return dataPoints.some(dp =>
      dp.source === 'semrush' &&
      (dp.content.toLowerCase().includes('gap') ||
       dp.content.toLowerCase().includes('missing') ||
       dp.content.toLowerCase().includes('not covering'))
    );
  }

  /**
   * Get gap description
   */
  private getGapDescription(dataPoints: DataPoint[]): string | undefined {
    const gapPoint = dataPoints.find(dp =>
      dp.source === 'semrush' && dp.content.toLowerCase().includes('gap')
    );

    return gapPoint?.content.substring(0, 150);
  }

  /**
   * Get dominant emotion from clusters
   */
  private getDominantEmotion(clusters: InsightCluster[]): string {
    if (clusters.length === 0) return 'neutral';

    const sentiments = clusters.map(c => c.dominantSentiment);
    const counts: Record<string, number> = {};

    for (const sentiment of sentiments) {
      counts[sentiment] = (counts[sentiment] || 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Extract emotional triggers
   */
  private extractEmotionalTriggers(dataPoints: DataPoint[]): string[] {
    const triggers: string[] = [];
    const emotionalWords = ['frustrated', 'excited', 'worried', 'confused', 'satisfied', 'disappointed', 'hopeful'];

    for (const dp of dataPoints) {
      const content = dp.content.toLowerCase();
      for (const word of emotionalWords) {
        if (content.includes(word) && !triggers.includes(word)) {
          triggers.push(word);
        }
      }
    }

    return triggers.slice(0, 3);
  }

  /**
   * Generate content angles
   */
  private generateAngles(themes: string[], connection: Connection): string[] {
    const angles: string[] = [];
    const mainTheme = themes[0] || 'insight';

    angles.push(`Why ${mainTheme} matters now`);
    angles.push(`The ${mainTheme} mistake everyone makes`);
    angles.push(`How to leverage ${mainTheme} for growth`);

    return angles;
  }

  /**
   * Deduplicate similar breakthroughs
   */
  private deduplicateBreakthroughs(breakthroughs: Breakthrough[]): Breakthrough[] {
    const unique: Breakthrough[] = [];
    const seenTitles = new Set<string>();

    for (const breakthrough of breakthroughs) {
      const normalizedTitle = breakthrough.title.toLowerCase().replace(/[^a-z\s]/g, '');

      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        unique.push(breakthrough);
      }
    }

    return unique;
  }
}

export const breakthroughGenerator = new BreakthroughGeneratorService();
