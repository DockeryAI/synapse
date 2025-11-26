/**
 * Phase 1 Integration Tests
 *
 * End-to-end tests for framework integration with synapse generation and clustering
 */

import { describe, it, expect, vi } from 'vitest';
import { frameworkSelector } from '@/services/content/FrameworkSelector.service';
import { frameworkRouter } from '@/services/content/FrameworkRouter.service';
import type { DataPoint } from '@/types/connections.types';

describe('Phase 1: Framework Integration', () => {
  describe('End-to-end framework selection', () => {
    it('should select framework based on data pattern', () => {
      const problemData: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Terrible wait times and slow service frustrate customers',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Disappointed with the long lines and delays',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(problemData, 'social', 'engagement');

      expect(result.selected).toBeDefined();
      expect(result.selected.id).toBe('problem-agitate-solution');
      expect(result.dataPattern.type).toBe('problem');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route generation through selected framework', () => {
      const data: DataPoint[] = [
        {
          id: '1',
          source: 'google_trends',
          content: 'Amazing coffee experiences customers love',
          type: 'trending_topic',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(data, 'social', 'engagement');
      const routing = frameworkRouter.routeSynapseGeneration(data, result.selected);

      expect(routing.titleGuidance).toBeDefined();
      expect(routing.hookGuidance).toBeDefined();
      expect(routing.bodyGuidance).toBeDefined();
      expect(routing.ctaGuidance).toBeDefined();
    });
  });

  describe('Framework metadata tracking', () => {
    it('should attach framework metadata', () => {
      const data: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Great service',
          type: 'sentiment',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(data, 'social', 'engagement');
      const metadata = frameworkRouter.attachMetadata(result.selected, result.confidence);

      expect(metadata.frameworkId).toBeDefined();
      expect(metadata.frameworkName).toBeDefined();
      expect(metadata.confidence).toBe(result.confidence);
      expect(metadata.timestamp).toBeDefined();
    });
  });

  describe('Customer perspective enforcement', () => {
    it('should generate customer-focused title guidance', () => {
      const data: DataPoint[] = [
        {
          id: '1',
          source: 'perplexity',
          content: 'Customers want faster service and shorter wait times',
          type: 'unarticulated_need',
          metadata: { sentiment: 'neutral' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(data, 'social', 'engagement');
      const titleGuidance = frameworkRouter.routeTitleGeneration({
        dataPoints: data,
        framework: result.selected,
        customerFocus: true
      });

      expect(titleGuidance).toContain('CUSTOMER FOCUS');
      expect(titleGuidance.toLowerCase()).toContain('customer');
      expect(titleGuidance.toLowerCase()).toContain('not business owners');
    });
  });

  describe('Cluster naming with frameworks', () => {
    it('should provide customer-focused cluster naming guidance', () => {
      const problemData: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Wait times are too long during lunch',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        },
        {
          id: '2',
          source: 'serper',
          content: 'Always have to wait 20 minutes',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(problemData, 'social', 'engagement');
      const namingGuidance = frameworkRouter.routeClusterNaming(problemData, result.selected);

      expect(namingGuidance).toBeDefined();
      expect(namingGuidance).toContain('SPECIFIC');
      expect(namingGuidance).toContain('customer');
      expect(namingGuidance.toLowerCase()).toContain('not generic');
    });
  });

  describe('Cross-industry validation', () => {
    const industries: Array<{ name: string; data: DataPoint[] }> = [
      {
        name: 'restaurant',
        data: [{ id: '1', source: 'serper', content: 'Fresh food and great service', type: 'sentiment', metadata: {}, createdAt: new Date() }]
      },
      {
        name: 'healthcare',
        data: [{ id: '1', source: 'serper', content: 'Quick appointments and caring staff', type: 'sentiment', metadata: {}, createdAt: new Date() }]
      },
      {
        name: 'retail',
        data: [{ id: '1', source: 'serper', content: 'Quality products at good prices', type: 'sentiment', metadata: {}, createdAt: new Date() }]
      }
    ];

    it('should work consistently across industries', () => {
      for (const industry of industries) {
        const result = frameworkSelector.selectBestFramework(industry.data, 'social', 'engagement');

        expect(result.selected).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.reasoning).toBeDefined();
      }
    });
  });

  describe('Performance validation', () => {
    it('should complete framework selection in under 200ms', () => {
      const data: DataPoint[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        source: 'serper',
        content: `Review ${i} with various content and keywords`,
        type: 'sentiment',
        metadata: {},
        createdAt: new Date()
      }));

      const start = Date.now();
      frameworkSelector.selectBestFramework(data, 'social', 'engagement');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Fallback behavior', () => {
    it('should handle empty data gracefully', () => {
      const result = frameworkSelector.selectBestFramework([], 'social', 'engagement');

      expect(result.selected).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5); // Low confidence expected
    });

    it('should handle missing metadata gracefully', () => {
      const data: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Some content without metadata',
          type: 'sentiment',
          metadata: {},
          createdAt: new Date()
        }
      ];

      const result = frameworkSelector.selectBestFramework(data, 'social', 'engagement');

      expect(result.selected).toBeDefined();
    });
  });
});
