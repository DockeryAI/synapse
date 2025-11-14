/**
 * Unit Tests for Synapse Calendar Bridge Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SynapseCalendarBridge,
  BridgeConfig,
  SpecialtyDetection,
  IntelligenceResult
} from '../synapse-calendar-bridge.service';
import { intelligenceMock, specialtyMock } from '../mocks/intelligence.mock';

describe('SynapseCalendarBridge', () => {
  let bridge: SynapseCalendarBridge;
  let mockConfig: BridgeConfig;

  beforeEach(() => {
    bridge = new SynapseCalendarBridge();

    const startDate = new Date('2024-12-01');
    const endDate = new Date('2024-12-31');

    mockConfig = {
      brandId: 'test-brand-123',
      intelligenceData: intelligenceMock,
      specialty: specialtyMock,
      startDate,
      endDate
    };
  });

  describe('transformIntelligence', () => {
    it('should transform intelligence to calendar-ready format', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      expect(result).toHaveProperty('contentIdeas');
      expect(result).toHaveProperty('pillars');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('metadata');
    });

    it('should extract 3-5 content pillars', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      expect(result.pillars.length).toBeGreaterThanOrEqual(3);
      expect(result.pillars.length).toBeLessThanOrEqual(5);
    });

    it('should generate up to 30 content ideas', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      expect(result.contentIdeas.length).toBeGreaterThan(0);
      expect(result.contentIdeas.length).toBeLessThanOrEqual(30);
    });

    it('should include metadata with intelligence sources', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      expect(result.metadata.intelligenceSources).toBe(intelligenceMock.filter(i => i.success).length);
      expect(result.metadata.specialtyDetected).toBe(true); // Mock specialty has 87% confidence
      expect(result.metadata.confidenceScore).toBe(specialtyMock.confidence);
    });
  });

  describe('pillar extraction', () => {
    it('should include specialty-based pillar', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      const specialtyPillar = result.pillars.find(p => p.id === 'specialty-showcase');
      expect(specialtyPillar).toBeDefined();
      expect(specialtyPillar?.name).toContain(mockConfig.specialty.specialty);
    });

    it('should include educational content pillar', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      const eduPillar = result.pillars.find(p => p.id === 'educational');
      expect(eduPillar).toBeDefined();
    });

    it('should assign percentage distribution to pillars', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      result.pillars.forEach(pillar => {
        expect(pillar.percentage).toBeGreaterThan(0);
        expect(pillar.percentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('content idea generation', () => {
    it('should generate ideas for multiple platforms', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      const platforms = new Set(result.contentIdeas.map(idea => idea.platform));
      expect(platforms.size).toBeGreaterThan(1); // Should use multiple platforms
    });

    it('should distribute ideas across date range', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      const dates = result.contentIdeas.map(idea => idea.suggestedDate.getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);

      expect(minDate).toBeGreaterThanOrEqual(mockConfig.startDate.getTime());
      expect(maxDate).toBeLessThanOrEqual(mockConfig.endDate.getTime());
    });

    it('should include reasoning for each idea', async () => {
      const result = await bridge.transformIntelligence(mockConfig);

      result.contentIdeas.forEach(idea => {
        expect(idea.reasoning).toBeTruthy();
        expect(typeof idea.reasoning).toBe('string');
      });
    });
  });
});
