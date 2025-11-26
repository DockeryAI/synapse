/**
 * Framework Selector Service Tests
 *
 * Tests framework selection logic based on data patterns
 */

import { describe, it, expect } from 'vitest';
import { frameworkSelector } from '@/services/content/FrameworkSelector.service';
import type { DataPoint } from '@/types/connections.types';

describe('FrameworkSelector', () => {
  describe('analyzeDataPattern', () => {
    it('should detect problem pattern from complaint data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'The wait time is terrible and staff is rude',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Very disappointed with the slow service',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const pattern = frameworkSelector.analyzeDataPattern(dataPoints);

      expect(pattern.type).toBe('problem');
      expect(pattern.confidence).toBeGreaterThan(0.5);
      expect(pattern.sentimentBias).toBe('negative');
    });

    it('should detect desire pattern from positive aspirational data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'google_trends',
          content: 'People want amazing coffee experiences',
          type: 'trending_topic',
          metadata: {},
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'google_trends',
          content: 'Customers love the perfect latte art',
          type: 'trending_topic',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const pattern = frameworkSelector.analyzeDataPattern(dataPoints);

      expect(pattern.type).toBe('desire');
      expect(pattern.confidence).toBeGreaterThan(0.5);
      expect(pattern.sentimentBias).toBe('positive');
    });

    it('should detect urgency pattern from time-sensitive data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'weather',
          content: 'Cold front arriving tonight, temperatures dropping fast',
          type: 'timing',
          metadata: {},
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Holiday shopping season starting now',
          type: 'local_event',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const pattern = frameworkSelector.analyzeDataPattern(dataPoints);

      expect(pattern.type).toBe('urgency');
      expect(pattern.confidence).toBeGreaterThan(0.4);
    });

    it('should detect transformation pattern from before/after data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'They transformed their menu and results are amazing',
          type: 'sentiment',
          metadata: {},
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Before the upgrade it was okay, after its excellent',
          type: 'sentiment',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const pattern = frameworkSelector.analyzeDataPattern(dataPoints);

      expect(pattern.type).toBe('transformation');
      expect(pattern.confidence).toBeGreaterThan(0.4);
    });

    it('should detect comparison pattern', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Better than the other bakery on main street',
          type: 'competitive_gap',
          metadata: {},
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Compared to competitors, they are different',
          type: 'competitive_gap',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const pattern = frameworkSelector.analyzeDataPattern(dataPoints);

      expect(pattern.type).toBe('comparison');
      expect(pattern.confidence).toBeGreaterThan(0.4);
    });

    it('should return low confidence for empty data', () => {
      const pattern = frameworkSelector.analyzeDataPattern([]);

      expect(pattern.confidence).toBeLessThan(0.5);
      expect(pattern.keywords).toHaveLength(0);
    });
  });

  describe('selectBestFramework', () => {
    it('should select PAS framework for problem-focused data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Major problems with wait times and service issues',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'conversion');

      expect(result.selected.id).toBe('problem-agitate-solution');
      expect(result.dataPattern.type).toBe('problem');
      expect(result.reasoning).toContain('problem pattern');
    });

    it('should select AIDA framework for desire/opportunity data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'google_trends',
          content: 'Amazing opportunity for growth with excellent potential',
          type: 'market_trend',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement');

      expect(result.selected.id).toBe('aida');
      expect(result.dataPattern.type).toBe('desire');
    });

    it('should select BAB framework for transformation data', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Before the changes it was average, after the transformation its amazing',
          type: 'sentiment',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement');

      expect(result.selected.id).toBe('before-after-bridge');
      expect(result.dataPattern.type).toBe('transformation');
    });

    it('should return alternatives', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Problems and issues everywhere',
          type: 'pain_point',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement');

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.alternatives.length).toBeLessThanOrEqual(2);
    });

    it('should include confidence score', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Amazing excellent wonderful perfect',
          type: 'sentiment',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('explainSelection', () => {
    it('should generate human-readable explanation', () => {
      const dataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Problem with service',
          type: 'pain_point',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(dataPoints, 'social', 'engagement');
      const explanation = frameworkSelector.explainSelection(result);

      expect(explanation).toContain('Framework Selected');
      expect(explanation).toContain('Confidence');
      expect(explanation).toContain('Pattern Detected');
      expect(explanation).toContain('Framework Stages');
    });
  });
});
