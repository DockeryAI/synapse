/**
 * Positioning Extractor Service
 *
 * Phase 3 - Gap Tab 2.0
 * Extracts positioning data from competitor profiles for the 2x2 positioning map.
 * Handles segment-aware axis selection and AI-powered position analysis.
 *
 * Created: 2025-11-28
 */

import type {
  CompetitorProfile,
  CompetitorScan,
  SegmentType,
  BusinessType,
  PositioningDataPoint,
  PositioningMapData,
  PositioningExtractionRequest,
  PositioningExtractionResult,
  SegmentAxes,
  PriceTier,
  ComplexityLevel
} from '@/types/competitor-intelligence.types';

import {
  SEGMENT_AXES,
  POSITIONING_EXTRACTION_PROMPT
} from '@/types/competitor-intelligence.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUADRANT_LABELS: Record<SegmentType, Record<BusinessType, {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}>> = {
  local: {
    b2b: {
      topLeft: 'Premium Boutique',
      topRight: 'Premium Full-Service',
      bottomLeft: 'Budget Specialist',
      bottomRight: 'Convenient Value'
    },
    b2c: {
      topLeft: 'Quality-Focused',
      topRight: 'Premium Convenience',
      bottomLeft: 'Budget Option',
      bottomRight: 'Fast & Affordable'
    },
    dtc: {
      topLeft: 'Luxury Experience',
      topRight: 'Premium Lifestyle',
      bottomLeft: 'Budget Basic',
      bottomRight: 'Accessible Luxury'
    },
    mixed: {
      topLeft: 'Niche Premium',
      topRight: 'Mainstream Premium',
      bottomLeft: 'Niche Value',
      bottomRight: 'Mass Market'
    }
  },
  regional: {
    b2b: {
      topLeft: 'Easy Essential',
      topRight: 'User-Friendly Full Suite',
      bottomLeft: 'Technical Basics',
      bottomRight: 'Power User Platform'
    },
    b2c: {
      topLeft: 'White Glove Local',
      topRight: 'Premium Wide Reach',
      bottomLeft: 'Standard Local',
      bottomRight: 'Standard Coverage'
    },
    dtc: {
      topLeft: 'Aspirational Value',
      topRight: 'Aspirational Premium',
      bottomLeft: 'Functional Value',
      bottomRight: 'Functional Premium'
    },
    mixed: {
      topLeft: 'High Touch Specialist',
      topRight: 'High Touch Full Service',
      bottomLeft: 'Self-Serve Specialist',
      bottomRight: 'Self-Serve Platform'
    }
  },
  national: {
    b2b: {
      topLeft: 'Quick Start Focused',
      topRight: 'Quick Start Comprehensive',
      bottomLeft: 'Complex Specialized',
      bottomRight: 'Complex Enterprise'
    },
    b2c: {
      topLeft: 'Emerging Premium',
      topRight: 'Established Premium',
      bottomLeft: 'Emerging Budget',
      bottomRight: 'Established Value'
    },
    dtc: {
      topLeft: 'Lifestyle Mass',
      topRight: 'Lifestyle Luxury',
      bottomLeft: 'Commodity Mass',
      bottomRight: 'Commodity Premium'
    },
    mixed: {
      topLeft: 'Challenger Point Solution',
      topRight: 'Leader Point Solution',
      bottomLeft: 'Challenger Platform',
      bottomRight: 'Market Leader'
    }
  },
  global: {
    b2b: {
      topLeft: 'Turnkey SMB',
      topRight: 'Turnkey Enterprise',
      bottomLeft: 'Complex SMB',
      bottomRight: 'Heavy Implementation'
    },
    b2c: {
      topLeft: 'Elite Regional',
      topRight: 'Elite Worldwide',
      bottomLeft: 'Standard Regional',
      bottomRight: 'Standard Global'
    },
    dtc: {
      topLeft: 'Niche Prestige',
      topRight: 'Global Icon',
      bottomLeft: 'Niche Value',
      bottomRight: 'Global Value'
    },
    mixed: {
      topLeft: 'Innovative Regional',
      topRight: 'Category Creator',
      bottomLeft: 'Regional Follower',
      bottomRight: 'Global Follower'
    }
  }
};

// ============================================================================
// HEURISTIC EXTRACTION
// ============================================================================

/**
 * Extract positioning heuristically from available data without AI
 * Fallback when AI extraction is not available or fails
 */
function extractPositioningHeuristic(
  competitor: CompetitorProfile,
  scans?: CompetitorScan[]
): { xValue: number; yValue: number; priceTier: PriceTier; complexityLevel: ComplexityLevel; confidence: number } {
  let xValue = 50;
  let yValue = 50;
  let confidence = 0.3;

  // Extract from positioning summary keywords
  const summary = (competitor.positioning_summary || '').toLowerCase();
  const claims = (competitor.key_claims || []).join(' ').toLowerCase();
  const pricing = (competitor.pricing_model || '').toLowerCase();
  const audience = (competitor.target_audience || '').toLowerCase();
  const combined = `${summary} ${claims} ${pricing} ${audience}`;

  // Price tier detection
  let priceTier: PriceTier = 'mid-market';
  if (combined.includes('enterprise') || combined.includes('custom pricing') || combined.includes('contact sales')) {
    priceTier = 'enterprise';
    xValue += 15;
  } else if (combined.includes('premium') || combined.includes('professional') || combined.includes('advanced')) {
    priceTier = 'premium';
    xValue += 10;
  } else if (combined.includes('free') || combined.includes('budget') || combined.includes('affordable') || combined.includes('low cost')) {
    priceTier = 'budget';
    xValue -= 15;
  }

  // Complexity detection
  let complexityLevel: ComplexityLevel = 'moderate';
  if (combined.includes('enterprise') || combined.includes('complex') || combined.includes('advanced setup')) {
    complexityLevel = 'enterprise';
    yValue -= 10;
  } else if (combined.includes('simple') || combined.includes('easy') || combined.includes('quick start') || combined.includes('intuitive')) {
    complexityLevel = 'simple';
    yValue += 15;
  } else if (combined.includes('comprehensive') || combined.includes('full-featured') || combined.includes('all-in-one')) {
    complexityLevel = 'complex';
    yValue -= 5;
  }

  // Quality signals boost Y value
  if (combined.includes('quality') || combined.includes('best-in-class') || combined.includes('leading')) {
    yValue += 10;
  }
  if (combined.includes('trusted') || combined.includes('reliable') || combined.includes('proven')) {
    yValue += 5;
  }

  // Use review sentiment if available
  const reviewScan = scans?.find(s => s.scan_type.startsWith('reviews-'));
  if (reviewScan?.sentiment_summary) {
    const avgRating = reviewScan.sentiment_summary.average_rating;
    if (avgRating) {
      // Higher rating = higher Y value
      yValue += (avgRating - 3) * 8; // -16 to +16 adjustment
      confidence += 0.1;
    }
  }

  // Clamp values
  xValue = Math.max(5, Math.min(95, xValue));
  yValue = Math.max(5, Math.min(95, yValue));

  return { xValue, yValue, priceTier, complexityLevel, confidence: Math.min(confidence, 0.6) };
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

/**
 * Extract positioning using AI (Opus 4.5 via Perplexity or direct Claude)
 */
async function extractPositioningWithAI(
  request: PositioningExtractionRequest,
  axes: SegmentAxes,
  segmentType: SegmentType,
  businessType: BusinessType
): Promise<PositioningExtractionResult | null> {
  try {
    const prompt = POSITIONING_EXTRACTION_PROMPT
      .replace('{competitor_name}', request.competitorName)
      .replace('{website}', request.website || 'N/A')
      .replace('{positioning_summary}', request.scanData?.positioning_summary || 'Unknown')
      .replace('{key_claims}', (request.scanData?.key_claims || []).join(', ') || 'None')
      .replace('{pricing_model}', request.scanData?.pricing_model || 'Unknown')
      .replace('{target_audience}', request.scanData?.target_audience || 'Unknown')
      .replace('{average_rating}', String(request.reviewSentiment?.averageRating || 'N/A'))
      .replace('{top_themes}', (request.reviewSentiment?.topThemes || []).join(', ') || 'None')
      .replace('{segment_type}', segmentType)
      .replace('{business_type}', businessType)
      .replace('{x_axis_label}', axes.xAxis.label)
      .replace('{x_low_label}', axes.xAxis.lowLabel)
      .replace('{x_high_label}', axes.xAxis.highLabel)
      .replace('{y_axis_label}', axes.yAxis.label)
      .replace('{y_low_label}', axes.yAxis.lowLabel)
      .replace('{y_high_label}', axes.yAxis.highLabel);

    // Use Perplexity proxy for AI extraction
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a market positioning analyst. Respond only with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.warn('[positioning-extractor] AI extraction failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[positioning-extractor] No JSON found in AI response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      competitorId: request.competitorId,
      xValue: Math.max(0, Math.min(100, parsed.xValue || 50)),
      yValue: Math.max(0, Math.min(100, parsed.yValue || 50)),
      priceTier: parsed.priceTier || 'mid-market',
      complexityLevel: parsed.complexityLevel || 'moderate',
      confidence: parsed.confidence || 0.7,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error('[positioning-extractor] AI extraction error:', error);
    return null;
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

class PositioningExtractorService {
  /**
   * Get segment-aware axes for the positioning map
   */
  getAxes(segmentType: SegmentType, businessType: BusinessType): SegmentAxes {
    return SEGMENT_AXES[segmentType]?.[businessType] || SEGMENT_AXES.national.mixed;
  }

  /**
   * Get quadrant labels for the positioning map
   */
  getQuadrantLabels(segmentType: SegmentType, businessType: BusinessType) {
    return QUADRANT_LABELS[segmentType]?.[businessType] || QUADRANT_LABELS.national.mixed;
  }

  /**
   * Extract positioning for a single competitor
   */
  async extractPositioning(
    competitor: CompetitorProfile,
    scans: CompetitorScan[] = [],
    useAI: boolean = true
  ): Promise<PositioningDataPoint> {
    const segmentType = competitor.segment_type || 'national';
    const businessType = competitor.business_type || 'mixed';
    const axes = this.getAxes(segmentType, businessType);

    let extraction: {
      xValue: number;
      yValue: number;
      priceTier: PriceTier;
      complexityLevel: ComplexityLevel;
      confidence: number;
      reasoning?: string;
    };

    // Try AI extraction first if enabled
    if (useAI) {
      const reviewScan = scans.find(s => s.scan_type.startsWith('reviews-'));
      const aiResult = await extractPositioningWithAI(
        {
          competitorId: competitor.id,
          competitorName: competitor.name,
          website: competitor.website,
          scanData: {
            positioning_summary: competitor.positioning_summary || undefined,
            key_claims: competitor.key_claims,
            pricing_model: competitor.pricing_model || undefined,
            target_audience: competitor.target_audience || undefined
          },
          reviewSentiment: reviewScan?.sentiment_summary ? {
            averageRating: reviewScan.sentiment_summary.average_rating,
            topThemes: [
              ...(reviewScan.sentiment_summary.top_positive_themes || []),
              ...(reviewScan.sentiment_summary.top_negative_themes || [])
            ]
          } : undefined
        },
        axes,
        segmentType,
        businessType
      );

      if (aiResult) {
        extraction = aiResult;
      } else {
        // Fallback to heuristic
        extraction = extractPositioningHeuristic(competitor, scans);
      }
    } else {
      extraction = extractPositioningHeuristic(competitor, scans);
    }

    return {
      id: competitor.id,
      name: competitor.name,
      logoUrl: competitor.logo_url,
      xValue: extraction.xValue,
      yValue: extraction.yValue,
      priceTier: extraction.priceTier,
      complexityLevel: extraction.complexityLevel,
      gapCount: 0, // Will be populated by caller
      isYourBrand: false,
      confidence: extraction.confidence,
      positioningSummary: competitor.positioning_summary || undefined,
      keyDifferentiators: competitor.key_claims
    };
  }

  /**
   * Generate complete positioning map data for a brand
   */
  async generatePositioningMap(
    brandId: string,
    competitors: CompetitorProfile[],
    competitorScans: Map<string, CompetitorScan[]>,
    gapCounts: Map<string, number>,
    segmentType: SegmentType,
    businessType: BusinessType,
    yourBrandData?: {
      name: string;
      xValue: number;
      yValue: number;
      positioningSummary?: string;
      keyDifferentiators?: string[];
    }
  ): Promise<PositioningMapData> {
    const axes = this.getAxes(segmentType, businessType);
    const quadrantLabels = this.getQuadrantLabels(segmentType, businessType);

    // Extract positioning for all competitors in parallel
    const dataPointPromises = competitors.map(async (competitor) => {
      const scans = competitorScans.get(competitor.id) || [];
      const dataPoint = await this.extractPositioning(competitor, scans, true);
      dataPoint.gapCount = gapCounts.get(competitor.id) || 0;
      return dataPoint;
    });

    const dataPoints = await Promise.all(dataPointPromises);

    // Create your brand data point if provided
    let yourBrand: PositioningDataPoint | undefined;
    if (yourBrandData) {
      yourBrand = {
        id: 'your-brand',
        name: yourBrandData.name,
        logoUrl: null,
        xValue: yourBrandData.xValue,
        yValue: yourBrandData.yValue,
        priceTier: this.inferPriceTier(yourBrandData.xValue),
        complexityLevel: this.inferComplexityLevel(yourBrandData.yValue),
        gapCount: 0,
        isYourBrand: true,
        confidence: 1.0,
        positioningSummary: yourBrandData.positioningSummary,
        keyDifferentiators: yourBrandData.keyDifferentiators
      };
    }

    return {
      brandId,
      segmentType,
      businessType,
      axes,
      dataPoints,
      yourBrand,
      quadrantLabels,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Infer price tier from X value
   */
  private inferPriceTier(xValue: number): PriceTier {
    if (xValue >= 80) return 'enterprise';
    if (xValue >= 60) return 'premium';
    if (xValue >= 30) return 'mid-market';
    return 'budget';
  }

  /**
   * Infer complexity level from Y value
   */
  private inferComplexityLevel(yValue: number): ComplexityLevel {
    if (yValue >= 80) return 'simple';
    if (yValue >= 50) return 'moderate';
    if (yValue >= 25) return 'complex';
    return 'enterprise';
  }

  /**
   * Suggest optimal positioning for your brand based on competitor gaps
   */
  suggestOptimalPositioning(
    dataPoints: PositioningDataPoint[],
    gapCounts: Map<string, number>
  ): { xValue: number; yValue: number; reasoning: string } {
    if (dataPoints.length === 0) {
      return { xValue: 50, yValue: 50, reasoning: 'No competitor data available' };
    }

    // Find quadrants with least competition
    const quadrants = {
      topLeft: { count: 0, avgGaps: 0, competitors: [] as PositioningDataPoint[] },
      topRight: { count: 0, avgGaps: 0, competitors: [] as PositioningDataPoint[] },
      bottomLeft: { count: 0, avgGaps: 0, competitors: [] as PositioningDataPoint[] },
      bottomRight: { count: 0, avgGaps: 0, competitors: [] as PositioningDataPoint[] }
    };

    for (const point of dataPoints) {
      const quadrant = point.xValue < 50
        ? (point.yValue >= 50 ? 'topLeft' : 'bottomLeft')
        : (point.yValue >= 50 ? 'topRight' : 'bottomRight');
      quadrants[quadrant].count++;
      quadrants[quadrant].avgGaps += point.gapCount;
      quadrants[quadrant].competitors.push(point);
    }

    // Calculate average gaps per quadrant
    for (const key of Object.keys(quadrants) as (keyof typeof quadrants)[]) {
      if (quadrants[key].count > 0) {
        quadrants[key].avgGaps /= quadrants[key].count;
      }
    }

    // Find best quadrant (least competition + most gaps)
    let bestQuadrant = 'topRight';
    let bestScore = -Infinity;

    for (const [key, data] of Object.entries(quadrants)) {
      // Score = avg gaps - competition density
      const score = data.avgGaps - (data.count * 2);
      if (score > bestScore) {
        bestScore = score;
        bestQuadrant = key;
      }
    }

    // Determine coordinates based on best quadrant
    let xValue: number;
    let yValue: number;

    switch (bestQuadrant) {
      case 'topLeft':
        xValue = 30;
        yValue = 70;
        break;
      case 'topRight':
        xValue = 70;
        yValue = 70;
        break;
      case 'bottomLeft':
        xValue = 30;
        yValue = 30;
        break;
      case 'bottomRight':
        xValue = 70;
        yValue = 30;
        break;
      default:
        xValue = 60;
        yValue = 60;
    }

    const q = quadrants[bestQuadrant as keyof typeof quadrants];
    const reasoning = q.count === 0
      ? `The ${bestQuadrant} quadrant is currently unoccupied - a unique positioning opportunity.`
      : `The ${bestQuadrant} quadrant has ${q.count} competitor(s) with an average of ${q.avgGaps.toFixed(1)} gaps - positioning here allows you to capitalize on their weaknesses.`;

    return { xValue, yValue, reasoning };
  }
}

// Export singleton instance
export const positioningExtractor = new PositioningExtractorService();
export default positioningExtractor;
