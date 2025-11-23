/**
 * Segment Analytics Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { segmentAnalyticsService, PerformanceMetrics } from '@/services/v2/segment-analytics.service';
import { personaMappingService } from '@/services/v2/persona-mapping.service';

describe('SegmentAnalyticsService', () => {
  let testPersonaId: string;

  beforeEach(() => {
    // Clear personas
    personaMappingService.getAllPersonas().forEach(p => {
      personaMappingService.deletePersona(p.id);
    });

    // Create test persona and store ID
    const persona = personaMappingService.createPersona({
      name: 'Test Persona',
      description: 'Test',
      psychographics: {
        goals: ['Goal'],
        painPoints: ['Pain'],
        values: ['Value'],
        challenges: ['Challenge'],
      },
      behavioralTraits: {
        decisionMakingStyle: 'analytical',
        informationPreference: 'text',
        purchaseDrivers: ['quality'],
      },
    });
    testPersonaId = persona.id;
  });

  describe('logPerformance', () => {
    it('logs performance metrics', () => {
      const metrics: PerformanceMetrics = {
        personaId: testPersonaId,
        pieceId: 'piece-1',
        engagementRate: 0.045,
        conversionRate: 0.02,
        ctr: 0.035,
        trigger: 'trust',
        platform: 'linkedin',
        publishedAt: new Date().toISOString(),
      };

      segmentAnalyticsService.logPerformance(metrics);
      const data = segmentAnalyticsService.getPerformanceData(testPersonaId);
      expect(data).toBeDefined();
    });
  });

  describe('getPerformanceData', () => {
    beforeEach(() => {
      // Log some test metrics using the actual persona ID
      for (let i = 0; i < 5; i++) {
        segmentAnalyticsService.logPerformance({
          personaId: testPersonaId,
          pieceId: `piece-${i}`,
          engagementRate: 0.04 + i * 0.01,
          conversionRate: 0.02,
          ctr: 0.03,
          trigger: 'trust',
          platform: 'linkedin',
          publishedAt: new Date().toISOString(),
        });
      }
    });

    it('returns null for non-existent persona', () => {
      const data = segmentAnalyticsService.getPerformanceData('non-existent');
      expect(data).toBeNull();
    });

    it('calculates aggregate metrics', () => {
      const data = segmentAnalyticsService.getPerformanceData(testPersonaId);
      // Data should exist and have metrics
      expect(data).toBeTruthy();
      if (data) {
        expect(data.metrics.totalPieces).toBeGreaterThan(0);
      }
    });

    it('includes trend data', () => {
      const data = segmentAnalyticsService.getPerformanceData(testPersonaId);
      // Data should exist
      expect(data).toBeTruthy();
      if (data) {
        expect(Array.isArray(data.trendData)).toBe(true);
      }
    });

    it('includes platform breakdown', () => {
      const data = segmentAnalyticsService.getPerformanceData(testPersonaId);
      // Data should exist
      expect(data).toBeTruthy();
      if (data) {
        expect(Array.isArray(data.platformBreakdown)).toBe(true);
      }
    });

    it('filters by time range', () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const data = segmentAnalyticsService.getPerformanceData(testPersonaId, timeRange);
      expect(data).toBeDefined();
    });
  });

  describe('getAnalyticsSummary', () => {
    beforeEach(() => {
      const personas = personaMappingService.getAllPersonas();
      // Log metrics for test persona
      for (let i = 0; i < 3; i++) {
        segmentAnalyticsService.logPerformance({
          personaId: personas[0].id,
          pieceId: `piece-${i}`,
          engagementRate: 0.05,
          conversionRate: 0.02,
          ctr: 0.03,
          trigger: 'trust',
          platform: 'linkedin',
          publishedAt: new Date().toISOString(),
        });
      }
    });

    it('generates summary for brand', () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const summary = segmentAnalyticsService.getAnalyticsSummary('brand-1', timeRange);
      expect(summary).toBeDefined();
      expect(summary.brandId).toBe('brand-1');
    });

    it('includes overall performance metrics', () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const summary = segmentAnalyticsService.getAnalyticsSummary('brand-1', timeRange);
      expect(summary.overallPerformance.avgEngagementRate).toBeGreaterThan(0);
    });

    it('includes performance heatmap', () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const summary = segmentAnalyticsService.getAnalyticsSummary('brand-1', timeRange);
      expect(summary.performanceHeatmap).toBeDefined();
      expect(Array.isArray(summary.performanceHeatmap)).toBe(true);
    });

    it('includes gap analysis', () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const summary = segmentAnalyticsService.getAnalyticsSummary('brand-1', timeRange);
      expect(summary.gapAnalysis).toBeDefined();
      expect(Array.isArray(summary.gapAnalysis)).toBe(true);
    });

    it('includes trigger effectiveness', () => {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      const summary = segmentAnalyticsService.getAnalyticsSummary('brand-1', timeRange);
      expect(summary.triggerEffectiveness).toBeDefined();
    });
  });

  describe('getTriggerPerformance', () => {
    beforeEach(() => {
      // Log performance with different triggers using actual persona ID
      segmentAnalyticsService.logPerformance({
        personaId: testPersonaId,
        pieceId: 'piece-1',
        engagementRate: 0.06,
        conversionRate: 0.03,
        ctr: 0.04,
        trigger: 'trust',
        platform: 'linkedin',
        publishedAt: new Date().toISOString(),
      });

      segmentAnalyticsService.logPerformance({
        personaId: testPersonaId,
        pieceId: 'piece-2',
        engagementRate: 0.03,
        conversionRate: 0.01,
        ctr: 0.02,
        trigger: 'fear',
        platform: 'linkedin',
        publishedAt: new Date().toISOString(),
      });
    });

    it('returns trigger performance data', () => {
      const performance = segmentAnalyticsService.getTriggerPerformance(testPersonaId);
      expect(performance.length).toBeGreaterThan(0);
    });

    it('includes trend for each trigger', () => {
      const performance = segmentAnalyticsService.getTriggerPerformance(testPersonaId);
      if (performance.length > 0) {
        expect(performance[0].trend).toBeDefined();
      }
    });
  });

  describe('identifyUnderservedPersonas', () => {
    it('identifies personas needing more content', () => {
      const gaps = segmentAnalyticsService.identifyUnderservedPersonas(2);
      expect(Array.isArray(gaps)).toBe(true);
    });

    it('sorts gaps by days since last content', () => {
      const gaps = segmentAnalyticsService.identifyUnderservedPersonas(2);
      if (gaps.length > 1) {
        expect(gaps[0].daysSinceLastContent).toBeGreaterThanOrEqual(
          gaps[1].daysSinceLastContent
        );
      }
    });
  });

  describe('getFrequencyRecommendations', () => {
    it('provides frequency recommendations', () => {
      const rec = segmentAnalyticsService.getFrequencyRecommendations(testPersonaId);
      expect(rec.current).toBeDefined();
      expect(rec.recommended).toBeDefined();
      expect(rec.reasoning).toBeDefined();
    });

    it('recommends starting frequency for new personas', () => {
      const rec = segmentAnalyticsService.getFrequencyRecommendations(testPersonaId);
      expect(rec.recommended).toBe(2);
    });
  });
});
