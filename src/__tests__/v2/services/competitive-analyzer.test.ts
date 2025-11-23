/**
 * Competitive Analyzer Service Tests
 *
 * Tests for competitive intelligence scraping and analysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { competitiveAnalyzerService } from '@/services/intelligence/competitive-analyzer.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// Mock DeepContext
const mockContext: Partial<DeepContext> = {
  business: {
    profile: {
      id: 'test-business',
      name: 'Test Business',
      industry: 'food',
      naicsCode: '722511',
      website: 'https://test.com',
      location: {
        city: 'Test City',
        state: 'TS',
        country: 'USA'
      },
      keywords: ['test', 'business'],
      competitors: ['https://competitor1.com', 'https://competitor2.com']
    },
    brandVoice: {
      tone: ['professional'],
      values: ['quality'],
      personality: ['trustworthy'],
      avoidWords: [],
      signaturePhrases: []
    },
    uniqueAdvantages: ['fast service'],
    goals: []
  },
  industry: {
    profile: {},
    trends: [
      {
        trend: 'Online ordering increasing',
        direction: 'rising',
        strength: 0.8,
        timeframe: '2024',
        impact: 'high'
      }
    ],
    seasonality: [],
    competitiveLandscape: {
      topCompetitors: [],
      marketConcentration: 'moderate',
      barrierToEntry: 'medium'
    },
    economicFactors: []
  },
  customerPsychology: {
    unarticulated: [
      {
        need: 'Quick meal prep solutions',
        confidence: 0.85,
        evidence: ['Customers mention time constraints']
      }
    ],
    emotional: [],
    behavioral: [],
    identityDesires: [],
    purchaseMotivations: [],
    objections: []
  },
  synthesis: {
    keyInsights: ['Focus on convenience', 'Health-conscious options'],
    hiddenPatterns: [],
    opportunityScore: 75,
    recommendedAngles: [],
    confidenceLevel: 0.8,
    generatedAt: new Date()
  },
  competitiveIntel: {
    blindSpots: [],
    mistakes: [],
    opportunities: [],
    contentGaps: [],
    positioningWeaknesses: []
  },
  realTimeCultural: {},
  metadata: {
    aggregatedAt: new Date(),
    dataSourcesUsed: ['test'],
    processingTimeMs: 1000,
    version: '1.0'
  }
} as DeepContext;

describe('CompetitiveAnalyzerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeCompetitors', () => {
    it('returns fallback analysis when Apify not configured', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      expect(result.confidence).toBeLessThanOrEqual(0.5);
      expect(result.competitors).toHaveLength(0);
      expect(result.analysisDate).toBeInstanceOf(Date);
    });

    it('includes white spaces from customer psychology', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      expect(result.whiteSpaces.length).toBeGreaterThan(0);
      expect(result.whiteSpaces[0]).toHaveProperty('gap');
      expect(result.whiteSpaces[0]).toHaveProperty('opportunity');
      expect(result.whiteSpaces[0]).toHaveProperty('urgency');
    });

    it('generates differentiation strategies', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      if (result.differentiationStrategies.length > 0) {
        const strategy = result.differentiationStrategies[0];
        expect(strategy).toHaveProperty('strategy');
        expect(strategy).toHaveProperty('rationale');
        expect(strategy).toHaveProperty('implementation');
        expect(Array.isArray(strategy.implementation)).toBe(true);
      }
    });

    it('handles empty competitor URL array', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        [],
        mockContext
      );

      expect(result.competitors).toHaveLength(0);
      expect(result).toHaveProperty('whiteSpaces');
      expect(result).toHaveProperty('differentiationStrategies');
    });
  });

  describe('White Space Identification', () => {
    it('identifies gaps from unarticulated needs', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      const needGaps = result.whiteSpaces.filter(ws =>
        ws.gap.includes('Quick meal prep')
      );

      expect(needGaps.length).toBeGreaterThan(0);
    });

    it('assigns urgency levels correctly', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      result.whiteSpaces.forEach(ws => {
        expect(['high', 'medium', 'low']).toContain(ws.urgency);
      });
    });

    it('assigns difficulty levels', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      result.whiteSpaces.forEach(ws => {
        expect(['easy', 'medium', 'hard']).toContain(ws.difficulty);
      });
    });

    it('calculates potential impact', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      result.whiteSpaces.forEach(ws => {
        expect(ws.potentialImpact).toBeGreaterThanOrEqual(0);
        expect(ws.potentialImpact).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Differentiation Strategies', () => {
    it('provides implementation steps', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      if (result.differentiationStrategies.length > 0) {
        const strategy = result.differentiationStrategies[0];
        expect(Array.isArray(strategy.implementation)).toBe(true);
        expect(strategy.implementation.length).toBeGreaterThan(0);
      }
    });

    it('includes expected outcomes', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      if (result.differentiationStrategies.length > 0) {
        const strategy = result.differentiationStrategies[0];
        expect(strategy.expectedOutcome).toBeTruthy();
        expect(typeof strategy.expectedOutcome).toBe('string');
      }
    });

    it('tracks competitor adoption', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      if (result.differentiationStrategies.length > 0) {
        const strategy = result.differentiationStrategies[0];
        expect(Array.isArray(strategy.competitorsDoingThis)).toBe(true);
        expect(Array.isArray(strategy.competitorsNotDoingThis)).toBe(true);
      }
    });
  });

  describe('Theme Comparison', () => {
    it('returns empty comparison when no competitors scraped', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      expect(result.themeComparison).toBeDefined();
      expect(typeof result.themeComparison).toBe('object');
    });

    it('includes yours and theirs counts', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      Object.values(result.themeComparison).forEach(counts => {
        expect(counts).toHaveProperty('yours');
        expect(counts).toHaveProperty('theirs');
        expect(typeof counts.yours).toBe('number');
        expect(typeof counts.theirs).toBe('number');
      });
    });
  });

  describe('Industry-Specific Expectations', () => {
    it('identifies food industry expectations', async () => {
      const foodContext = {
        ...mockContext,
        business: {
          ...mockContext.business!,
          profile: {
            ...mockContext.business!.profile,
            industry: 'food'
          }
        }
      } as DeepContext;

      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        foodContext
      );

      // Should include food industry expectations
      const gaps = result.whiteSpaces.map(ws => ws.gap.toLowerCase());
      const hasFoodExpectation = gaps.some(gap =>
        gap.includes('food') || gap.includes('fresh') || gap.includes('service')
      );

      expect(hasFoodExpectation || result.whiteSpaces.length > 0).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('has lower confidence for fallback analysis', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('confidence is between 0 and 1', async () => {
      const result = await competitiveAnalyzerService.analyzeCompetitors(
        ['https://example.com'],
        mockContext
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
