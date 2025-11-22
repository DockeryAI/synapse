/**
 * Opportunity Radar Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OpportunityRadarService } from '@/services/v2/intelligence/opportunity-radar.service';

describe('OpportunityRadarService', () => {
  let service: OpportunityRadarService;

  beforeEach(() => {
    service = new OpportunityRadarService();
  });

  describe('detectOpportunities', () => {
    it('should detect trending topics from data points', async () => {
      const dataPoints = [
        { id: '1', content: 'AI automation', keywords: ['AI', 'automation'] },
        { id: '2', content: 'AI tools', keywords: ['AI', 'tools'] },
        { id: '3', content: 'AI productivity', keywords: ['AI', 'productivity'] },
        { id: '4', content: 'AI workflow', keywords: ['AI', 'workflow'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);

      expect(alerts.length).toBeGreaterThan(0);
      const aiAlert = alerts.find(a => a.title.includes('AI'));
      expect(aiAlert).toBeDefined();
      expect(aiAlert?.source).toBe('trending-topic');
    });

    it('should detect customer pain points', async () => {
      const dataPoints = [
        { id: '1', content: 'Slow loading', type: 'pain-point', keywords: ['performance'] },
        { id: '2', content: 'Takes too long', type: 'pain-point', keywords: ['performance'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);

      const painAlert = alerts.find(a => a.source === 'customer-pain');
      expect(painAlert).toBeDefined();
      expect(painAlert?.suggestedTemplates).toContain('quick-win');
    });

    it('should detect competitor gaps', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Competitor lacks mobile support',
          type: 'competitor-intel',
          title: 'Mobile Gap',
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);

      const gapAlert = alerts.find(a => a.source === 'competitor-gap');
      expect(gapAlert).toBeDefined();
      expect(gapAlert?.suggestedTemplates).toContain('contrarian');
    });

    it('should detect market shifts', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Industry moving to cloud',
          type: 'market-intel',
          title: 'Cloud Migration Trend',
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);

      const shiftAlert = alerts.find(a => a.source === 'market-shift');
      expect(shiftAlert).toBeDefined();
      expect(shiftAlert?.tier).toBe('urgent');
    });

    it('should detect news events', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Major acquisition announced',
          type: 'news',
          title: 'Industry Acquisition',
          priority: 'high' as const,
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);

      const newsAlert = alerts.find(a => a.source === 'news-event');
      expect(newsAlert).toBeDefined();
      expect(newsAlert?.urgencyScore).toBeGreaterThanOrEqual(90);
    });

    it('should include seasonal opportunities', async () => {
      const alerts = await service.detectOpportunities([]);

      // Should have at least seasonal alerts
      const seasonalAlert = alerts.find(a => a.source === 'seasonal');
      expect(seasonalAlert).toBeDefined();
    });
  });

  describe('tier classification', () => {
    it('should classify urgent alerts correctly', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Breaking news',
          type: 'news',
          title: 'Critical Update',
          priority: 'high' as const,
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const urgentAlerts = service.getUrgentAlerts();

      expect(urgentAlerts.length).toBeGreaterThan(0);
      urgentAlerts.forEach(alert => {
        expect(alert.tier).toBe('urgent');
        expect(alert.urgencyScore).toBeGreaterThanOrEqual(80);
      });
    });

    it('should classify high-value alerts correctly', async () => {
      const dataPoints = [
        { id: '1', content: 'Growing trend', keywords: ['trend', 'growth'] },
        { id: '2', content: 'Trend analysis', keywords: ['trend', 'analysis'] },
        { id: '3', content: 'Trend report', keywords: ['trend', 'report'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const highValueAlerts = service.getAlertsByTier('high-value');

      // May or may not have high-value depending on scores
      highValueAlerts.forEach(alert => {
        expect(alert.urgencyScore).toBeGreaterThanOrEqual(50);
        expect(alert.urgencyScore).toBeLessThan(80);
      });
    });

    it('should classify evergreen alerts correctly', async () => {
      const alerts = await service.detectOpportunities([]);
      const evergreenAlerts = service.getAlertsByTier('evergreen');

      evergreenAlerts.forEach(alert => {
        expect(alert.tier).toBe('evergreen');
        expect(alert.urgencyScore).toBeLessThan(50);
      });
    });
  });

  describe('alert filtering', () => {
    it('should filter alerts by tier', async () => {
      const dataPoints = [
        { id: '1', content: 'AI topic', keywords: ['AI'] },
        { id: '2', content: 'AI tools', keywords: ['AI'] },
        { id: '3', content: 'AI apps', keywords: ['AI'] },
        { id: '4', content: 'Market shift', type: 'market-intel', title: 'Shift' },
      ];

      await service.detectOpportunities(dataPoints);

      const urgentAlerts = service.getAlertsByTier('urgent');
      const highValueAlerts = service.getAlertsByTier('high-value');
      const evergreenAlerts = service.getAlertsByTier('evergreen');

      urgentAlerts.forEach(a => expect(a.tier).toBe('urgent'));
      highValueAlerts.forEach(a => expect(a.tier).toBe('high-value'));
      evergreenAlerts.forEach(a => expect(a.tier).toBe('evergreen'));
    });

    it('should filter alerts by source', async () => {
      const dataPoints = [
        { id: '1', content: 'Trend', keywords: ['trend'] },
        { id: '2', content: 'Trend 2', keywords: ['trend'] },
        { id: '3', content: 'Trend 3', keywords: ['trend'] },
      ];

      await service.detectOpportunities(dataPoints);

      const trendingAlerts = service.getAlertsBySource('trending-topic');
      const seasonalAlerts = service.getAlertsBySource('seasonal');

      trendingAlerts.forEach(a => expect(a.source).toBe('trending-topic'));
      seasonalAlerts.forEach(a => expect(a.source).toBe('seasonal'));
    });
  });

  describe('alert management', () => {
    it('should dismiss alerts', async () => {
      const dataPoints = [
        { id: '1', content: 'Topic', keywords: ['topic'] },
        { id: '2', content: 'Topic 2', keywords: ['topic'] },
        { id: '3', content: 'Topic 3', keywords: ['topic'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const initialCount = alerts.length;

      if (alerts.length > 0) {
        service.dismissAlert(alerts[0].id);
        const remainingAlerts = service.getAllAlerts();
        expect(remainingAlerts.length).toBe(initialCount - 1);
      }
    });

    it('should clear all alerts', async () => {
      const dataPoints = [
        { id: '1', content: 'Topic', keywords: ['topic'] },
        { id: '2', content: 'Topic 2', keywords: ['topic'] },
        { id: '3', content: 'Topic 3', keywords: ['topic'] },
      ];

      await service.detectOpportunities(dataPoints);
      service.clearAlerts();

      const alerts = service.getAllAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const config = service.getConfig();

      expect(config.maxAlerts).toBe(50);
      expect(config.refreshInterval).toBe(300000);
      expect(config.tierThresholds.urgent).toBe(80);
      expect(config.tierThresholds.highValue).toBe(50);
    });

    it('should allow custom configuration', () => {
      const customService = new OpportunityRadarService({
        maxAlerts: 100,
        tierThresholds: {
          urgent: 90,
          highValue: 60,
        },
      });

      const config = customService.getConfig();
      expect(config.maxAlerts).toBe(100);
      expect(config.tierThresholds.urgent).toBe(90);
    });

    it('should update configuration', () => {
      service.updateConfig({ maxAlerts: 25 });
      const config = service.getConfig();
      expect(config.maxAlerts).toBe(25);
    });

    it('should limit alerts to maxAlerts', async () => {
      const limitedService = new OpportunityRadarService({ maxAlerts: 5 });

      const manyDataPoints = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        content: `Topic ${i}`,
        keywords: [`topic${i}`],
      }));

      const alerts = await limitedService.detectOpportunities(manyDataPoints);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('suggested content', () => {
    it('should suggest appropriate templates for trending topics', async () => {
      const dataPoints = [
        { id: '1', content: 'Hot topic', keywords: ['hot'] },
        { id: '2', content: 'Hot news', keywords: ['hot'] },
        { id: '3', content: 'Hot trend', keywords: ['hot'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const trendAlert = alerts.find(a => a.source === 'trending-topic');

      expect(trendAlert?.suggestedTemplates).toContain('trend-jacker');
    });

    it('should suggest appropriate templates for customer pains', async () => {
      const dataPoints = [
        { id: '1', content: 'Problem', type: 'pain-point', keywords: ['issue'] },
        { id: '2', content: 'Problem 2', type: 'pain-point', keywords: ['issue'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const painAlert = alerts.find(a => a.source === 'customer-pain');

      expect(painAlert?.suggestedTemplates).toContain('mistake-exposer');
      expect(painAlert?.suggestedTemplates).toContain('quick-win');
    });

    it('should include emotional triggers in suggestions', async () => {
      const dataPoints = [
        { id: '1', content: 'Urgent matter', type: 'market-intel', title: 'Urgent' },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const alert = alerts.find(a => a.source === 'market-shift');

      expect(alert?.suggestedTriggers).toBeDefined();
      expect(alert?.suggestedTriggers.length).toBeGreaterThan(0);
    });
  });

  describe('expiration', () => {
    it('should set expiration dates based on tier', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Critical news',
          type: 'news',
          title: 'Breaking',
          priority: 'high' as const,
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const urgentAlert = alerts.find(a => a.tier === 'urgent');

      if (urgentAlert?.expiresAt) {
        const expiresDate = new Date(urgentAlert.expiresAt);
        const now = new Date();
        const diffHours = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Urgent should expire within ~24 hours
        expect(diffHours).toBeLessThanOrEqual(25);
        expect(diffHours).toBeGreaterThan(0);
      }
    });
  });

  describe('metadata', () => {
    it('should include trend data in metadata', async () => {
      const dataPoints = [
        { id: '1', content: 'Trending', keywords: ['trend'] },
        { id: '2', content: 'Trending 2', keywords: ['trend'] },
        { id: '3', content: 'Trending 3', keywords: ['trend'] },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const trendAlert = alerts.find(a => a.source === 'trending-topic');

      expect(trendAlert?.metadata.trendData).toBeDefined();
      expect(trendAlert?.metadata.trendData?.volume).toBeGreaterThan(0);
    });

    it('should include competitor data in metadata', async () => {
      const dataPoints = [
        {
          id: '1',
          content: 'Gap in market',
          type: 'competitor-intel',
          source: 'Competitor X',
        },
      ];

      const alerts = await service.detectOpportunities(dataPoints);
      const gapAlert = alerts.find(a => a.source === 'competitor-gap');

      expect(gapAlert?.metadata.competitorData).toBeDefined();
    });
  });
});
