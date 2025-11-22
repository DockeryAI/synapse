/**
 * Competitive Analyzer Service Tests
 *
 * Tests for competitive content analysis including:
 * - Theme extraction from competitor content
 * - Gap identification
 * - Differentiation scoring
 * - White space opportunity detection
 *
 * Created: 2025-11-22
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themeExtractorService } from '@/services/v2/intelligence/theme-extractor.service';
import type {
  CompetitorContent,
  ExtractedTheme,
  ThemeCluster,
  ThemeExtractionInput,
} from '@/types/v2/competitive.types';

// Helper to create competitor content
function createCompetitorContent(
  competitorId: string,
  competitorName: string,
  content: string,
  contentType: CompetitorContent['contentType'] = 'landing'
): CompetitorContent {
  return {
    competitorId,
    competitorName,
    url: `https://${competitorName.toLowerCase().replace(/\s/g, '')}.com`,
    title: `${competitorName} - Main Page`,
    content,
    contentType,
    scrapedAt: new Date(),
  };
}

describe('ThemeExtractorService', () => {
  describe('extractThemes', () => {
    it('should extract themes from competitor content', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'Competitor A',
          'Our marketing automation platform helps businesses grow revenue through automated campaigns. We offer advanced automation features for email marketing.'
        ),
        createCompetitorContent(
          'comp2',
          'Competitor B',
          'Grow your business with our marketing automation tools. Our platform provides automation features that save time and increase revenue.'
        ),
      ];

      const input: ThemeExtractionInput = {
        content,
        minFrequency: 1,
        maxThemes: 50,
      };

      const result = themeExtractorService.extractThemes(input);

      // Should return themes
      expect(result.themes.length).toBeGreaterThan(0);

      // Should include common phrases
      const themeTexts = result.themes.map(t => t.theme.toLowerCase());
      expect(themeTexts.some(t => t.includes('marketing') || t.includes('automation'))).toBe(true);

      // Should have processing time
      expect(result.processingTimeMs).toBeGreaterThan(0);

      // Should track total content
      expect(result.totalContent).toBe(2);
    });

    it('should filter themes by minimum frequency', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'Competitor A',
          'Email marketing automation helps businesses grow'
        ),
        createCompetitorContent(
          'comp2',
          'Competitor B',
          'Social media marketing helps companies scale'
        ),
        createCompetitorContent(
          'comp3',
          'Competitor C',
          'Content marketing helps brands engage audiences'
        ),
      ];

      const input: ThemeExtractionInput = {
        content,
        minFrequency: 2, // Only themes appearing 2+ times
        maxThemes: 50,
      };

      const result = themeExtractorService.extractThemes(input);

      // All returned themes should have frequency >= 2
      for (const theme of result.themes) {
        expect(theme.frequency).toBeGreaterThanOrEqual(2);
      }
    });

    it('should assign confidence scores', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent('comp1', 'A', 'Digital transformation drives innovation'),
        createCompetitorContent('comp2', 'B', 'Digital transformation improves efficiency'),
        createCompetitorContent('comp3', 'C', 'Digital transformation enables growth'),
        createCompetitorContent('comp4', 'D', 'Digital transformation reduces costs'),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // All themes should have confidence between 0 and 1
      for (const theme of result.themes) {
        expect(theme.confidence).toBeGreaterThanOrEqual(0);
        expect(theme.confidence).toBeLessThanOrEqual(1);
      }

      // Themes with higher frequency should have higher confidence
      const sorted = [...result.themes].sort((a, b) => b.frequency - a.frequency);
      if (sorted.length >= 2) {
        expect(sorted[0].confidence).toBeGreaterThanOrEqual(sorted[sorted.length - 1].confidence);
      }
    });

    it('should detect theme categories', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'A',
          'Our unique solution offers exclusive features that differentiate us. We provide the best value with proven results from happy customers.'
        ),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Should have some categorized themes
      const categorized = result.themes.filter(t => t.category !== undefined);
      expect(categorized.length).toBeGreaterThan(0);
    });

    it('should detect sentiment from context', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'A',
          'Our excellent product provides amazing results. The best solution for your success.'
        ),
        createCompetitorContent(
          'comp2',
          'B',
          'Struggling with difficult problems? Our product solves painful issues quickly.'
        ),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Should have themes with sentiment
      const withSentiment = result.themes.filter(t => t.sentiment !== undefined);
      expect(withSentiment.length).toBeGreaterThan(0);
    });

    it('should track competitor IDs for each theme', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent('comp1', 'A', 'Cloud computing enables scalability'),
        createCompetitorContent('comp2', 'B', 'Cloud computing provides flexibility'),
        createCompetitorContent('comp3', 'C', 'Edge computing offers low latency'),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Each theme should have competitor IDs
      for (const theme of result.themes) {
        expect(Array.isArray(theme.competitorIds)).toBe(true);
        expect(theme.competitorIds.length).toBeGreaterThan(0);
      }

      // Themes appearing in multiple competitors should have multiple IDs
      const multiCompetitor = result.themes.find(t => t.frequency >= 2);
      if (multiCompetitor) {
        expect(multiCompetitor.competitorIds.length).toBeGreaterThan(1);
      }
    });
  });

  describe('clusterThemes', () => {
    it('should cluster similar themes together', () => {
      const themes: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Marketing Automation',
          frequency: 5,
          competitorIds: ['a', 'b'],
          confidence: 0.8,
          keywords: ['marketing', 'automation'],
        },
        {
          id: '2',
          theme: 'Automation Tools',
          frequency: 3,
          competitorIds: ['b', 'c'],
          confidence: 0.6,
          keywords: ['automation', 'tools'],
        },
        {
          id: '3',
          theme: 'Customer Support',
          frequency: 4,
          competitorIds: ['a'],
          confidence: 0.7,
          keywords: ['customer', 'support'],
        },
      ];

      const clusters = themeExtractorService.clusterThemes(themes);

      // Should create clusters
      expect(clusters.length).toBeGreaterThan(0);

      // Each cluster should have themes
      for (const cluster of clusters) {
        expect(cluster.themes.length).toBeGreaterThan(0);
        expect(cluster.totalFrequency).toBeGreaterThan(0);
        expect(cluster.name).toBeTruthy();
      }
    });

    it('should sort clusters by total frequency', () => {
      const themes: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Low Frequency Theme',
          frequency: 1,
          competitorIds: ['a'],
          confidence: 0.3,
          keywords: ['low', 'frequency'],
        },
        {
          id: '2',
          theme: 'High Frequency Theme',
          frequency: 10,
          competitorIds: ['a', 'b', 'c'],
          confidence: 0.9,
          keywords: ['high', 'frequency'],
        },
        {
          id: '3',
          theme: 'Medium Frequency Theme',
          frequency: 5,
          competitorIds: ['a', 'b'],
          confidence: 0.6,
          keywords: ['medium', 'frequency'],
        },
      ];

      const clusters = themeExtractorService.clusterThemes(themes);

      // Should be sorted by frequency (descending)
      for (let i = 1; i < clusters.length; i++) {
        expect(clusters[i - 1].totalFrequency).toBeGreaterThanOrEqual(clusters[i].totalFrequency);
      }
    });

    it('should use most frequent theme as cluster name', () => {
      const themes: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Email Marketing',
          frequency: 10,
          competitorIds: ['a', 'b'],
          confidence: 0.9,
          keywords: ['email', 'marketing'],
        },
        {
          id: '2',
          theme: 'Marketing Emails',
          frequency: 3,
          competitorIds: ['c'],
          confidence: 0.5,
          keywords: ['marketing', 'emails'],
        },
      ];

      const clusters = themeExtractorService.clusterThemes(themes);

      // Cluster containing both should be named after higher frequency
      const clusterWithBoth = clusters.find(c =>
        c.themes.some(t => t.id === '1') && c.themes.some(t => t.id === '2')
      );

      if (clusterWithBoth) {
        expect(clusterWithBoth.name).toBe('Email Marketing');
      }
    });
  });

  describe('findUniqueThemes', () => {
    it('should find themes unique to target set', () => {
      const targetThemes: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Unique Feature',
          frequency: 3,
          competitorIds: ['target'],
          confidence: 0.7,
          keywords: ['unique', 'feature'],
        },
        {
          id: '2',
          theme: 'Common Feature',
          frequency: 5,
          competitorIds: ['target'],
          confidence: 0.8,
          keywords: ['common', 'feature'],
        },
      ];

      const comparisonThemes: ExtractedTheme[] = [
        {
          id: '3',
          theme: 'Common Feature',
          frequency: 4,
          competitorIds: ['comp1'],
          confidence: 0.7,
          keywords: ['common', 'feature'],
        },
        {
          id: '4',
          theme: 'Other Feature',
          frequency: 2,
          competitorIds: ['comp1'],
          confidence: 0.5,
          keywords: ['other', 'feature'],
        },
      ];

      const unique = themeExtractorService.findUniqueThemes(targetThemes, comparisonThemes);

      // Should only return themes not in comparison set
      expect(unique.length).toBe(1);
      expect(unique[0].theme).toBe('Unique Feature');
    });

    it('should be case-insensitive', () => {
      const targetThemes: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Marketing Automation',
          frequency: 3,
          competitorIds: ['target'],
          confidence: 0.7,
          keywords: ['marketing', 'automation'],
        },
      ];

      const comparisonThemes: ExtractedTheme[] = [
        {
          id: '2',
          theme: 'MARKETING AUTOMATION',
          frequency: 4,
          competitorIds: ['comp1'],
          confidence: 0.7,
          keywords: ['marketing', 'automation'],
        },
      ];

      const unique = themeExtractorService.findUniqueThemes(targetThemes, comparisonThemes);

      // Should not find any unique themes (case-insensitive match)
      expect(unique.length).toBe(0);
    });
  });

  describe('findCommonThemes', () => {
    it('should find themes common to both sets', () => {
      const themesA: ExtractedTheme[] = [
        {
          id: '1',
          theme: 'Shared Theme',
          frequency: 3,
          competitorIds: ['a'],
          confidence: 0.7,
          keywords: ['shared', 'theme'],
        },
        {
          id: '2',
          theme: 'Only In A',
          frequency: 2,
          competitorIds: ['a'],
          confidence: 0.5,
          keywords: ['only', 'a'],
        },
      ];

      const themesB: ExtractedTheme[] = [
        {
          id: '3',
          theme: 'Shared Theme',
          frequency: 4,
          competitorIds: ['b'],
          confidence: 0.8,
          keywords: ['shared', 'theme'],
        },
        {
          id: '4',
          theme: 'Only In B',
          frequency: 2,
          competitorIds: ['b'],
          confidence: 0.5,
          keywords: ['only', 'b'],
        },
      ];

      const common = themeExtractorService.findCommonThemes(themesA, themesB);

      // Should only return shared themes
      expect(common.length).toBe(1);
      expect(common[0].theme).toBe('Shared Theme');
    });
  });

  describe('phrase extraction', () => {
    it('should extract bigrams and trigrams', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'A',
          'The marketing automation platform provides powerful analytics dashboard features'
        ),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Should extract multi-word phrases
      const multiWord = result.themes.filter(t => t.theme.split(' ').length >= 2);
      expect(multiWord.length).toBeGreaterThan(0);
    });

    it('should filter stop words', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'A',
          'The and or but for with from this that which what where when'
        ),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Stop words alone should not create themes
      const stopWordThemes = result.themes.filter(t =>
        ['the', 'and', 'or', 'but', 'for'].includes(t.theme.toLowerCase())
      );
      expect(stopWordThemes.length).toBe(0);
    });

    it('should handle HTML content', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent(
          'comp1',
          'A',
          '<h1>Marketing Automation</h1><p>Our <strong>powerful</strong> platform helps you grow.</p>'
        ),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Should extract themes without HTML tags
      const hasHtmlTags = result.themes.some(t =>
        t.theme.includes('<') || t.theme.includes('>')
      );
      expect(hasHtmlTags).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content array', () => {
      const result = themeExtractorService.extractThemes({
        content: [],
        minFrequency: 1,
      });

      expect(result.themes).toEqual([]);
      expect(result.clusters).toEqual([]);
      expect(result.totalContent).toBe(0);
    });

    it('should handle content with no extractable themes', () => {
      const content: CompetitorContent[] = [
        createCompetitorContent('comp1', 'A', 'a b c d e f'),
      ];

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
      });

      // Should handle gracefully
      expect(Array.isArray(result.themes)).toBe(true);
    });

    it('should limit themes to maxThemes', () => {
      const content: CompetitorContent[] = [];

      // Create content with many unique phrases
      for (let i = 0; i < 20; i++) {
        content.push(
          createCompetitorContent(
            `comp${i}`,
            `Company ${i}`,
            `Unique phrase number ${i} with keyword${i} and feature${i}`
          )
        );
      }

      const result = themeExtractorService.extractThemes({
        content,
        minFrequency: 1,
        maxThemes: 10,
      });

      // Should not exceed maxThemes
      expect(result.themes.length).toBeLessThanOrEqual(10);
    });
  });
});
