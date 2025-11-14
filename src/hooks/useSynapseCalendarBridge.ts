/**
 * useSynapseCalendarBridge Hook
 *
 * Bridges Synapse intelligence data to the Calendar system.
 * Transforms raw intelligence into calendar-ready content pillars and opportunities.
 *
 * @example
 * ```tsx
 * const { data, loading, transform } = useSynapseCalendarBridge();
 *
 * const handleTransform = async (intelligence: IntelligenceResult[]) => {
 *   await transform(intelligence, specialty);
 *   // data contains transformed intelligence for calendar
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import type { IntelligenceResult } from '../services/parallel-intelligence.service';
import type { SpecialtyDetection } from '../services/specialty-detection.service';

/**
 * Content pillar derived from intelligence
 */
export interface ContentPillar {
  /** Pillar name/theme */
  name: string;
  /** Description of this content pillar */
  description: string;
  /** Keywords associated with this pillar */
  keywords: string[];
  /** Suggested content topics */
  topics: string[];
  /** Confidence score (0-100) */
  confidence: number;
}

/**
 * Opportunity detected from intelligence
 */
export interface DetectedOpportunity {
  /** Opportunity type */
  type: 'trend' | 'seasonal' | 'competitor-gap' | 'customer-pain' | 'reddit-discussion';
  /** Opportunity title */
  title: string;
  /** Description */
  description: string;
  /** Potential impact (low, medium, high) */
  impact: 'low' | 'medium' | 'high';
  /** Suggested action */
  action: string;
  /** Source of this opportunity */
  source: string;
}

/**
 * Transformed intelligence data for calendar
 */
export interface BridgedIntelligence {
  /** Content pillars for this business */
  pillars: ContentPillar[];
  /** Detected opportunities */
  opportunities: DetectedOpportunity[];
  /** Key insights */
  insights: string[];
  /** Target audience characteristics */
  audience: {
    demographics: string[];
    interests: string[];
    painPoints: string[];
  };
  /** Transformed timestamp */
  transformedAt: Date;
}

/**
 * Return type of useSynapseCalendarBridge hook
 */
export interface UseSynapseCalendarBridgeReturn {
  /** Transformed intelligence data */
  data: BridgedIntelligence | null;
  /** Is transformation running */
  loading: boolean;
  /** Error if one occurred */
  error: Error | null;
  /** Transform intelligence data */
  transform: (intelligence: IntelligenceResult[], specialty: SpecialtyDetection) => Promise<BridgedIntelligence>;
  /** Reset state */
  reset: () => void;
}

/**
 * Custom hook for bridging Synapse intelligence to Calendar system
 *
 * @returns {UseSynapseCalendarBridgeReturn} Bridge state and controls
 */
export function useSynapseCalendarBridge(): UseSynapseCalendarBridgeReturn {
  const [data, setData] = useState<BridgedIntelligence | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Extract content pillars from intelligence data
   */
  const extractPillars = useCallback((
    intelligence: IntelligenceResult[],
    specialty: SpecialtyDetection
  ): ContentPillar[] => {
    const pillars: ContentPillar[] = [];

    // Pillar 1: Specialty expertise
    pillars.push({
      name: `${specialty.specialty} Expertise`,
      description: `Showcase deep knowledge and expertise in ${specialty.specialty}`,
      keywords: specialty.nicheKeywords,
      topics: [
        `How to choose the right ${specialty.specialty}`,
        `Common ${specialty.specialty} mistakes to avoid`,
        `Expert tips for ${specialty.specialty}`
      ],
      confidence: specialty.confidence
    });

    // Pillar 2: Industry insights (from successful intelligence sources)
    const successfulSources = intelligence.filter(r => r.success);
    if (successfulSources.length > 0) {
      pillars.push({
        name: 'Industry Insights',
        description: 'Share industry trends and insights',
        keywords: ['industry', 'trends', 'insights', 'news'],
        topics: [
          `Latest trends in ${specialty.industry}`,
          `Industry best practices`,
          `What's new in ${specialty.specialty}`
        ],
        confidence: Math.min((successfulSources.length / intelligence.length) * 100, 100)
      });
    }

    // Pillar 3: Customer success stories
    pillars.push({
      name: 'Customer Success',
      description: 'Highlight customer results and testimonials',
      keywords: ['success', 'results', 'testimonials', 'reviews'],
      topics: [
        'Customer success stories',
        'Before and after results',
        'Client testimonials'
      ],
      confidence: 75
    });

    return pillars;
  }, []);

  /**
   * Detect opportunities from intelligence data
   */
  const detectOpportunities = useCallback((
    intelligence: IntelligenceResult[],
    specialty: SpecialtyDetection
  ): DetectedOpportunity[] => {
    const opportunities: DetectedOpportunity[] = [];

    // Check for Reddit intelligence
    const redditData = intelligence.find(r => r.source === 'Reddit' && r.success);
    if (redditData) {
      opportunities.push({
        type: 'reddit-discussion',
        title: 'Active Reddit Discussions',
        description: `Engaged communities discussing ${specialty.specialty}`,
        impact: 'medium',
        action: 'Monitor and participate in relevant discussions',
        source: 'Reddit API'
      });
    }

    // Check for review data (customer pain points)
    const reviewData = intelligence.find(r =>
      (r.source === 'OutScraper-Reviews' || r.source === 'Yelp') && r.success
    );
    if (reviewData) {
      opportunities.push({
        type: 'customer-pain',
        title: 'Customer Pain Points Identified',
        description: 'Common concerns found in customer reviews',
        impact: 'high',
        action: 'Create content addressing these concerns',
        source: reviewData.source
      });
    }

    // Seasonal opportunity (always suggest)
    const currentMonth = new Date().getMonth();
    const season = currentMonth >= 2 && currentMonth <= 4 ? 'Spring' :
                   currentMonth >= 5 && currentMonth <= 7 ? 'Summer' :
                   currentMonth >= 8 && currentMonth <= 10 ? 'Fall' : 'Winter';

    opportunities.push({
      type: 'seasonal',
      title: `${season} Content Opportunity`,
      description: `Seasonal ${specialty.specialty} content for ${season}`,
      impact: 'medium',
      action: `Create ${season}-themed content`,
      source: 'Calendar'
    });

    return opportunities;
  }, []);

  /**
   * Extract key insights from intelligence
   */
  const extractInsights = useCallback((intelligence: IntelligenceResult[]): string[] => {
    const insights: string[] = [];
    const successCount = intelligence.filter(r => r.success).length;

    insights.push(`Gathered data from ${successCount} of ${intelligence.length} intelligence sources`);

    // Add source-specific insights
    const sources = intelligence.filter(r => r.success).map(r => r.source);
    if (sources.length > 0) {
      insights.push(`Successfully analyzed: ${sources.slice(0, 5).join(', ')}${sources.length > 5 ? '...' : ''}`);
    }

    return insights;
  }, []);

  /**
   * Extract audience characteristics
   */
  const extractAudience = useCallback((specialty: SpecialtyDetection) => {
    return {
      demographics: [specialty.targetMarket],
      interests: specialty.nicheKeywords,
      painPoints: [
        `Need reliable ${specialty.specialty}`,
        `Looking for quality service`,
        `Want expert guidance`
      ]
    };
  }, []);

  /**
   * Transform intelligence data for calendar consumption
   */
  const transform = useCallback(async (
    intelligence: IntelligenceResult[],
    specialty: SpecialtyDetection
  ): Promise<BridgedIntelligence> => {
    console.log('🌉 Transforming intelligence for calendar...');

    setLoading(true);
    setError(null);

    try {
      const pillars = extractPillars(intelligence, specialty);
      const opportunities = detectOpportunities(intelligence, specialty);
      const insights = extractInsights(intelligence);
      const audience = extractAudience(specialty);

      const bridgedData: BridgedIntelligence = {
        pillars,
        opportunities,
        insights,
        audience,
        transformedAt: new Date()
      };

      console.log(`✅ Transformed intelligence:`);
      console.log(`   ${pillars.length} content pillars`);
      console.log(`   ${opportunities.length} opportunities detected`);
      console.log(`   ${insights.length} key insights`);

      setData(bridgedData);
      setLoading(false);

      return bridgedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('❌ Bridge transformation failed:', error.message);
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [extractPillars, detectOpportunities, extractInsights, extractAudience]);

  /**
   * Reset bridge state
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    transform,
    reset
  };
}
