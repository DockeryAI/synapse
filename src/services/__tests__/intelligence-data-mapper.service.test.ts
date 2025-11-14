/**
 * Unit Tests for Intelligence Data Mapper Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntelligenceDataMapper } from '../intelligence-data-mapper.service';
import { intelligenceMock } from '../mocks/intelligence.mock';

describe('IntelligenceDataMapper', () => {
  let mapper: IntelligenceDataMapper;

  beforeEach(() => {
    mapper = new IntelligenceDataMapper();
  });

  describe('mapIntelligence', () => {
    it('should map all intelligence sources to structured format', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      expect(result).toHaveProperty('brandVoice');
      expect(result).toHaveProperty('customerSentiment');
      expect(result).toHaveProperty('competitiveGaps');
      expect(result).toHaveProperty('trendingTopics');
      expect(result).toHaveProperty('topKeywords');
    });

    it('should extract brand voice from intelligence', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      expect(result.brandVoice.tone).toBeTruthy();
      expect(result.brandVoice.keywords).toBeInstanceOf(Array);
      expect(result.brandVoice.style).toBeTruthy();
    });

    it('should parse customer sentiment from reviews', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      expect(result.customerSentiment.reviewCount).toBeGreaterThan(0);
      expect(result.customerSentiment.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.customerSentiment.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate quality score based on source coverage', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should track which data sources were used', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      expect(result.dataSources).toBeInstanceOf(Array);
      expect(result.dataSources.length).toBeGreaterThan(0);
    });
  });

  describe('trending topics extraction', () => {
    it('should filter trending topics by relevance', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      result.trendingTopics.forEach(topic => {
        expect(topic.relevance).toBeGreaterThanOrEqual(0);
        expect(topic.relevance).toBeLessThanOrEqual(100);
      });
    });

    it('should include topic source attribution', async () => {
      const result = await mapper.mapIntelligence(intelligenceMock);

      result.trendingTopics.forEach(topic => {
        expect(topic.source).toBeTruthy();
        expect(['serper', 'youtube', 'news', 'reddit']).toContain(topic.source);
      });
    });
  });
});
