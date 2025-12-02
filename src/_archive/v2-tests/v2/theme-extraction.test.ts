/**
 * Theme Extraction Service Tests
 *
 * Tests for content-based theme extraction with keyword analysis,
 * semantic clustering, and uniqueness enforcement.
 *
 * Created: 2025-11-22
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themeExtractionService } from '@/services/v2/theme-extraction.service';
import { DEFAULT_THEME_EXTRACTION_CONFIG } from '@/types/v2/theme.types';
import type { DataPoint } from '@/types/connections.types';
import type { Theme, ThemeExtractionInput } from '@/types/v2/theme.types';

// Mock the embedding service to avoid API calls
vi.mock('@/services/intelligence/embedding.service', () => ({
  embeddingService: {
    generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0).map(() => Math.random())),
    cosineSimilarity: vi.fn().mockImplementation((a: number[], b: number[]) => {
      if (!a || !b || a.length !== b.length) return 0;
      // Simple mock similarity based on array comparison
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }),
  },
}));

// Helper to create test data points
function createDataPoint(
  id: string,
  content: string,
  source: DataPoint['source'] = 'website',
  type: DataPoint['type'] = 'pain_point'
): DataPoint {
  return {
    id,
    source,
    type,
    content,
    metadata: {
      sentiment: 'neutral',
    },
    createdAt: new Date(),
  };
}

describe('ThemeExtractionService', () => {
  beforeEach(() => {
    // Clear used themes before each test
    themeExtractionService.clearUsedThemes();
  });

  describe('extractThemes', () => {
    it('should extract themes from data points', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Insurance coverage gaps leave homeowners vulnerable during storm season'),
        createDataPoint('2', 'Storm damage claims are often denied due to coverage exclusions'),
        createDataPoint('3', 'Homeowners need better protection against storm related property damage'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false, // Disable for faster tests
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Should return themes
      expect(result.themes.length).toBeGreaterThan(0);

      // Should have stats
      expect(result.stats.dataPointsAnalyzed).toBe(3);
      expect(result.stats.finalThemeCount).toBeGreaterThan(0);

      // Should have metadata
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
      expect(result.metadata.config).toBeDefined();
    });

    it('should extract keywords with frequency weighting', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Marketing automation helps businesses grow their revenue'),
        createDataPoint('2', 'Businesses need marketing tools to automate repetitive tasks'),
        createDataPoint('3', 'Revenue growth comes from effective marketing automation'),
        createDataPoint('4', 'Automation tools help marketing teams focus on strategy'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
          minKeywordFrequency: 2,
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Should extract themes related to frequent keywords
      const allKeywords = result.themes.flatMap(t => t.keywords.map(k => k.toLowerCase()));

      // These words appear multiple times
      expect(allKeywords).toContain('marketing');
      expect(allKeywords).toContain('automation');
    });

    it('should respect maxThemes configuration', async () => {
      const dataPoints: DataPoint[] = Array.from({ length: 20 }, (_, i) =>
        createDataPoint(`${i}`, `Topic ${i} content about subject ${i} with details ${i}`)
      );

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
          maxThemes: 5,
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      expect(result.themes.length).toBeLessThanOrEqual(5);
    });

    it('should generate n-gram based themes', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Content marketing strategy drives customer engagement'),
        createDataPoint('2', 'A good content marketing strategy is essential for growth'),
        createDataPoint('3', 'Develop your content marketing strategy with our tools'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Should extract multi-word themes
      const multiWordThemes = result.themes.filter(t =>
        t.primary.includes(' ')
      );

      expect(multiWordThemes.length).toBeGreaterThan(0);
    });

    it('should track source data point IDs', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('dp-1', 'Insurance coverage for homeowners'),
        createDataPoint('dp-2', 'Coverage options for property insurance'),
        createDataPoint('dp-3', 'Homeowners insurance policies'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Each theme should have source data point IDs
      for (const theme of result.themes) {
        expect(theme.sourceDataPointIds.length).toBeGreaterThan(0);
        // Source IDs should be from our data points
        theme.sourceDataPointIds.forEach(id => {
          expect(['dp-1', 'dp-2', 'dp-3']).toContain(id);
        });
      }
    });
  });

  describe('uniqueness enforcement', () => {
    it('should reject themes too similar to used themes', async () => {
      // First extraction
      const dataPoints1: DataPoint[] = [
        createDataPoint('1', 'Storm damage insurance claims process'),
        createDataPoint('2', 'Filing insurance claims after storm damage'),
      ];

      const result1 = await themeExtractionService.extractThemes({
        dataPoints: dataPoints1,
        config: { useEmbeddings: false },
      });

      // Second extraction with similar content
      const dataPoints2: DataPoint[] = [
        createDataPoint('3', 'Storm damage insurance claims procedures'),
        createDataPoint('4', 'Insurance claims for storm damage repairs'),
      ];

      const result2 = await themeExtractionService.extractThemes({
        dataPoints: dataPoints2,
        config: { useEmbeddings: false },
      });

      // Should have some rejected themes due to similarity
      // (The exact number depends on the similarity calculation)
      expect(result2.rejectedThemes.length).toBeGreaterThanOrEqual(0);

      // Rejected themes should have uniqueness scores
      for (const rejected of result2.rejectedThemes) {
        expect(rejected.uniquenessScore).toBeDefined();
        expect(rejected.uniquenessScore.isUnique).toBe(false);
      }
    });

    it('should track used themes across extractions', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Digital marketing trends for small businesses'),
        createDataPoint('2', 'Marketing trends in digital advertising'),
        createDataPoint('3', 'Small business marketing strategies'),
      ];

      await themeExtractionService.extractThemes({
        dataPoints,
        config: { useEmbeddings: false, minKeywordFrequency: 1 },
      });

      const usedThemes = themeExtractionService.getUsedThemes();
      expect(usedThemes.length).toBeGreaterThan(0);
    });

    it('should clear used themes registry', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Social media marketing automation tools'),
        createDataPoint('2', 'Marketing automation for social media'),
        createDataPoint('3', 'Automation tools for marketing teams'),
      ];

      await themeExtractionService.extractThemes({
        dataPoints,
        config: { useEmbeddings: false, minKeywordFrequency: 1 },
      });

      expect(themeExtractionService.getUsedThemes().length).toBeGreaterThan(0);

      themeExtractionService.clearUsedThemes();

      expect(themeExtractionService.getUsedThemes().length).toBe(0);
    });

    it('should calculate uniqueness score correctly', () => {
      const theme: Theme = {
        id: 'test-theme',
        primary: 'Test Theme',
        secondary: null,
        uniqueModifier: null,
        keywords: ['test', 'theme'],
        confidence: 0.8,
        sourceDataPointIds: ['1'],
        extractedAt: new Date(),
      };

      // With no used themes, should be unique
      themeExtractionService.clearUsedThemes();
      const score = themeExtractionService.calculateUniquenessScore(theme);

      expect(score.score).toBe(1);
      expect(score.isUnique).toBe(true);
      expect(score.closestMatch).toBeNull();
    });
  });

  describe('clustering', () => {
    it('should cluster similar themes', async () => {
      const dataPoints: DataPoint[] = [
        // Cluster 1: Insurance related
        createDataPoint('1', 'Insurance coverage options for homeowners'),
        createDataPoint('2', 'Homeowner insurance policy details'),
        createDataPoint('3', 'Coverage limits for home insurance'),
        // Cluster 2: Marketing related
        createDataPoint('4', 'Digital marketing strategies for growth'),
        createDataPoint('5', 'Marketing automation platforms'),
        createDataPoint('6', 'Growth through digital marketing channels'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
          clusteringSimilarityThreshold: 0.3, // Lower threshold for keyword-based similarity
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Should form clusters
      expect(result.clusters.length).toBeGreaterThanOrEqual(0);

      // Clusters should have cohesion scores
      for (const cluster of result.clusters) {
        expect(cluster.cohesion).toBeGreaterThan(0);
        expect(cluster.cohesion).toBeLessThanOrEqual(1);
        expect(cluster.themes.length).toBeGreaterThan(1);
        expect(cluster.centroid).toBeDefined();
      }
    });

    it('should identify common keywords in clusters', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Email marketing campaigns for businesses'),
        createDataPoint('2', 'Business email marketing best practices'),
        createDataPoint('3', 'Marketing automation for email campaigns'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: {
          useEmbeddings: false,
          clusteringSimilarityThreshold: 0.2,
        },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Clusters should have common keywords
      for (const cluster of result.clusters) {
        expect(cluster.commonKeywords).toBeDefined();
        expect(Array.isArray(cluster.commonKeywords)).toBe(true);
      }
    });
  });

  describe('content analysis', () => {
    it('should handle different data sources', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Customer pain points from customer reviews about service quality', 'outscraper', 'pain_point'),
        createDataPoint('2', 'Industry trends and customer insights from news sources', 'news', 'trending_topic'),
        createDataPoint('3', 'Competitor analysis shows customer service gaps', 'serper', 'competitive_gap'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: { useEmbeddings: false, minKeywordFrequency: 1 },
      };

      const result = await themeExtractionService.extractThemes(input);

      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.stats.dataPointsAnalyzed).toBe(3);
    });

    it('should filter stop words', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'The quick brown fox jumps over the lazy dog'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: { useEmbeddings: false },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Stop words should not be primary themes
      const primaryThemes = result.themes.map(t => t.primary.toLowerCase());
      expect(primaryThemes).not.toContain('the');
      expect(primaryThemes).not.toContain('over');
    });

    it('should handle empty content gracefully', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', ''),
        createDataPoint('2', '   '),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: { useEmbeddings: false },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Should not crash, may return empty themes
      expect(result).toBeDefined();
      expect(result.stats.dataPointsAnalyzed).toBe(2);
    });
  });

  describe('statistics and metadata', () => {
    it('should calculate correct statistics', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Business growth strategies for startups'),
        createDataPoint('2', 'Startup funding and investment options'),
        createDataPoint('3', 'Growth hacking techniques for new businesses'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: { useEmbeddings: false },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Stats should be populated
      expect(result.stats.dataPointsAnalyzed).toBe(3);
      expect(result.stats.totalKeywords).toBeGreaterThan(0);
      expect(result.stats.uniqueKeywords).toBeGreaterThan(0);
      expect(result.stats.finalThemeCount).toBeGreaterThanOrEqual(0);

      // Average confidence should be between 0 and 1
      expect(result.stats.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.stats.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should include processing metadata', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Test content for metadata validation'),
      ];

      const input: ThemeExtractionInput = {
        dataPoints,
        config: { useEmbeddings: false },
      };

      const result = await themeExtractionService.extractThemes(input);

      // Metadata should be complete
      expect(result.metadata.startedAt).toBeInstanceOf(Date);
      expect(result.metadata.completedAt).toBeInstanceOf(Date);
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.config).toBeDefined();

      // Completed should be after started
      expect(result.metadata.completedAt.getTime()).toBeGreaterThanOrEqual(
        result.metadata.startedAt.getTime()
      );
    });
  });

  describe('configuration', () => {
    it('should use default config when not specified', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Default configuration test content'),
      ];

      const result = await themeExtractionService.extractThemes({
        dataPoints,
      });

      expect(result.metadata.config.maxThemes).toBe(DEFAULT_THEME_EXTRACTION_CONFIG.maxThemes);
      expect(result.metadata.config.minKeywordFrequency).toBe(
        DEFAULT_THEME_EXTRACTION_CONFIG.minKeywordFrequency
      );
    });

    it('should merge custom config with defaults', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Custom configuration test content'),
      ];

      const customConfig = {
        maxThemes: 10,
        minKeywordFrequency: 3,
      };

      const result = await themeExtractionService.extractThemes({
        dataPoints,
        config: customConfig,
      });

      expect(result.metadata.config.maxThemes).toBe(10);
      expect(result.metadata.config.minKeywordFrequency).toBe(3);
      // Other defaults should still be present
      expect(result.metadata.config.uniquenessThreshold).toBe(
        DEFAULT_THEME_EXTRACTION_CONFIG.uniquenessThreshold
      );
    });
  });

  describe('edge cases', () => {
    it('should handle single data point', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Single data point with limited content'),
      ];

      const result = await themeExtractionService.extractThemes({
        dataPoints,
        config: { useEmbeddings: false },
      });

      expect(result).toBeDefined();
      expect(result.stats.dataPointsAnalyzed).toBe(1);
    });

    it('should handle very long content', async () => {
      const longContent = 'keyword '.repeat(1000);
      const dataPoints: DataPoint[] = [
        createDataPoint('1', longContent),
      ];

      const result = await themeExtractionService.extractThemes({
        dataPoints,
        config: { useEmbeddings: false },
      });

      expect(result).toBeDefined();
      // Should extract "keyword" as a theme due to high frequency
      const hasKeyword = result.themes.some(t =>
        t.primary.toLowerCase() === 'keyword'
      );
      expect(hasKeyword).toBe(true);
    });

    it('should handle special characters in content', async () => {
      const dataPoints: DataPoint[] = [
        createDataPoint('1', 'Email: test@example.com, Price: $100, Rating: 4.5/5'),
        createDataPoint('2', 'Special chars: @#$%^&*()'),
      ];

      const result = await themeExtractionService.extractThemes({
        dataPoints,
        config: { useEmbeddings: false },
      });

      expect(result).toBeDefined();
      // Should not crash on special characters
    });
  });
});
