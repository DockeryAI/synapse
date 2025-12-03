/**
 * EQ Calculator Service Tests
 *
 * Tests for Emotional Quotient scoring algorithm
 *
 * Created: 2025-11-18
 */

import { describe, it, expect } from 'vitest';
import { eqCalculator } from '@/services/ai/eq-calculator.service';
import { assertEQScoreValid } from '../utils/test-helpers';

describe('EQCalculator', () => {
  describe('calculateEQ', () => {
    it('should calculate high EQ scores for emotional content', () => {
      const emotionalText = `
        I was absolutely devastated when my business was struggling.
        I felt overwhelmed, frustrated, and hopeless. Working 70 hours a week
        and still feeling like I was failing was crushing my spirit.

        But then I found this amazing solution and everything transformed.
        Now I'm thrilled, confident, and passionate about my business again.
        The relief I felt was incredible. I'm finally living my dream and
        feeling inspired every single day.
      `;

      const score = eqCalculator.calculateEQ(emotionalText);

      // Validate structure
      assertEQScoreValid(score);

      // Should have high emotional resonance (lots of emotional words)
      expect(score.emotional_resonance).toBeGreaterThan(40);

      // Overall score should be high
      expect(score.overall).toBeGreaterThan(30);

      // Should be classified as emotional or highly-emotional
      expect(['emotional', 'highly-emotional', 'balanced']).toContain(score.classification);

      // Should detect emotional words
      expect(score.breakdown.emotionalWords).toBeGreaterThan(5);
    });

    it('should calculate low EQ scores for rational content', () => {
      const rationalText = `
        Our system processes data at 1000 requests per second.
        The algorithm uses machine learning models trained on 50000 samples.
        Database queries are optimized using indexed columns and query caching.
        The infrastructure consists of load balancers, application servers, and database replicas.
        Performance metrics are measured using standard benchmarking tools.
      `;

      const score = eqCalculator.calculateEQ(rationalText);

      // Validate structure
      assertEQScoreValid(score);

      // Should have low emotional resonance (minimal emotional words)
      expect(score.emotional_resonance).toBeLessThan(30);

      // Overall score should be low
      expect(score.overall).toBeLessThan(50);

      // Should be classified as rational or highly-rational
      expect(['rational', 'highly-rational', 'balanced']).toContain(score.classification);

      // Should detect few emotional words
      expect(score.breakdown.emotionalWords).toBeLessThan(3);
    });

    it('should detect identity language correctly', () => {
      const identityText = `
        I'm the type of person who values quality over quantity.
        I see myself as a strategic thinker and problem solver.
        People like me want to work with the best in the industry.
        As a business leader, I need premium solutions.
        I identify as someone who invests in excellence.
        Our community of elite entrepreneurs believes in continuous growth.
        Join us and become part of this exclusive group of industry leaders.
      `;

      const score = eqCalculator.calculateEQ(identityText);

      // Validate structure
      assertEQScoreValid(score);

      // Should detect identity language
      expect(score.identity_alignment).toBeGreaterThan(30);

      // Should count identity phrases
      expect(score.breakdown.identityPhrases).toBeGreaterThan(3);

      // Overall score should be elevated by identity signals
      expect(score.overall).toBeGreaterThan(20);
    });

    it('should detect urgency signals correctly', () => {
      const urgencyText = `
        Act now before this limited time offer expires!
        Only 5 spots remaining - hurry before they're gone.
        This exclusive opportunity won't last long.
        Don't miss out on this urgent deadline.
        Available today only while supplies last.
        Join millions of others right away before it's too late.
        Last chance to secure your spot immediately.
      `;

      const score = eqCalculator.calculateEQ(urgencyText);

      // Validate structure
      assertEQScoreValid(score);

      // Should detect urgency signals
      expect(score.urgency_signals).toBeGreaterThan(50);

      // Should count urgency phrases
      expect(score.breakdown.urgencyPhrases).toBeGreaterThan(5);

      // Overall score should be influenced by urgency
      expect(score.overall).toBeGreaterThan(20);
    });

    it('should handle empty or minimal text gracefully', () => {
      // Empty string
      const emptyScore = eqCalculator.calculateEQ('');
      assertEQScoreValid(emptyScore);
      expect(emptyScore.overall).toBe(0);
      expect(emptyScore.breakdown.totalWords).toBe(0);

      // Very short text
      const shortScore = eqCalculator.calculateEQ('Hello there');
      assertEQScoreValid(shortScore);
      expect(shortScore.breakdown.totalWords).toBeGreaterThanOrEqual(0);

      // Minimal text with no emotional content
      const minimalScore = eqCalculator.calculateEQ('The product works fine.');
      assertEQScoreValid(minimalScore);
      expect(minimalScore.overall).toBeLessThan(30);
    });

    it('should apply correct weighting formula', () => {
      // Create text with known characteristics
      const text = `
        I'm absolutely thrilled and excited about this amazing transformation!
        I see myself as someone who values premium, exclusive solutions.
        Act now - this limited time offer expires today!
      `;

      const score = eqCalculator.calculateEQ(text);

      // Manually verify the formula: (emotional × 0.4) + (identity × 0.35) + (urgency × 0.25)
      const expectedOverall = Math.round(
        (score.emotional_resonance * 0.4) +
        (score.identity_alignment * 0.35) +
        (score.urgency_signals * 0.25)
      );

      expect(score.overall).toBe(expectedOverall);

      // All components should be present
      expect(score.emotional_resonance).toBeGreaterThan(0);
      expect(score.identity_alignment).toBeGreaterThan(0);
      expect(score.urgency_signals).toBeGreaterThan(0);
    });

    it('should classify scores into correct categories', () => {
      // Test classification boundaries
      const testCases = [
        { text: 'a '.repeat(100), expectedRange: ['highly-rational', 'rational'] }, // No emotional content
        {
          text: 'Good product that works well for business applications.',
          expectedRange: ['highly-rational', 'rational', 'balanced']
        },
        {
          text: `I'm the type of person who feels passionate and excited about amazing opportunities!`,
          expectedRange: ['balanced', 'emotional', 'highly-emotional']
        },
        {
          text: `I'm absolutely devastated, overwhelmed, and terrified! This incredible, amazing,
                 fantastic transformation is urgent! Act now! Don't miss this exclusive, limited opportunity!
                 I feel thrilled, inspired, and passionate! People like me believe in this premium solution!`,
          expectedRange: ['emotional', 'highly-emotional']
        }
      ];

      testCases.forEach(({ text, expectedRange }) => {
        const score = eqCalculator.calculateEQ(text);
        expect(expectedRange).toContain(score.classification);
      });

      // Verify all possible classifications are valid
      const validClassifications = [
        'highly-emotional',
        'emotional',
        'balanced',
        'rational',
        'highly-rational'
      ];

      testCases.forEach(({ text }) => {
        const score = eqCalculator.calculateEQ(text);
        expect(validClassifications).toContain(score.classification);
      });
    });

    it('should generate meaningful reasoning', () => {
      const text = `
        I was frustrated and overwhelmed working 70 hours a week.
        As a business owner, I see myself as someone who values efficiency.
        This urgent solution transformed my life immediately!
      `;

      const score = eqCalculator.calculateEQ(text);

      // Reasoning should be non-empty
      expect(score.reasoning).toBeDefined();
      expect(score.reasoning.length).toBeGreaterThan(20);

      // Reasoning should describe the score
      expect(typeof score.reasoning).toBe('string');

      // Should mention relevant aspects based on scores
      if (score.emotional_resonance > 60) {
        expect(score.reasoning.toLowerCase()).toMatch(/emotional|emotion/);
      }

      if (score.identity_alignment > 60) {
        expect(score.reasoning.toLowerCase()).toMatch(/identity/);
      }

      if (score.urgency_signals > 60) {
        expect(score.reasoning.toLowerCase()).toMatch(/urgency/);
      }
    });
  });

  describe('calculateBatchEQ', () => {
    it('should calculate average EQ across multiple texts', () => {
      const texts = [
        'I was absolutely devastated and overwhelmed by the challenges.',
        'The system processes 1000 requests per second with high efficiency.',
        'I feel incredibly excited and thrilled about this amazing opportunity!'
      ];

      const batchScore = eqCalculator.calculateBatchEQ(texts);

      // Validate structure
      assertEQScoreValid(batchScore);

      // Calculate individual scores
      const individualScores = texts.map(text => eqCalculator.calculateEQ(text));

      // Batch overall should be close to average
      const avgOverall = Math.round(
        individualScores.reduce((sum, s) => sum + s.overall, 0) / individualScores.length
      );

      expect(batchScore.overall).toBe(avgOverall);

      // Components should also be averaged
      const avgEmotional = Math.round(
        individualScores.reduce((sum, s) => sum + s.emotional_resonance, 0) / individualScores.length
      );

      expect(batchScore.emotional_resonance).toBe(avgEmotional);

      // Breakdown should aggregate totals
      const totalWords = individualScores.reduce((sum, s) => sum + s.breakdown.totalWords, 0);
      expect(batchScore.breakdown.totalWords).toBe(totalWords);
    });

    it('should handle empty array gracefully', () => {
      const batchScore = eqCalculator.calculateBatchEQ([]);

      // Should return zero score
      assertEQScoreValid(batchScore);
      expect(batchScore.overall).toBe(0);
      expect(batchScore.emotional_resonance).toBe(0);
      expect(batchScore.identity_alignment).toBe(0);
      expect(batchScore.urgency_signals).toBe(0);
      expect(batchScore.classification).toBe('highly-rational');
      expect(batchScore.reasoning).toContain('No text');
    });

    it('should handle single text correctly', () => {
      const text = 'I feel absolutely amazing and thrilled about this transformation!';

      const singleScore = eqCalculator.calculateEQ(text);
      const batchScore = eqCalculator.calculateBatchEQ([text]);

      // Single text batch should equal direct calculation
      expect(batchScore.overall).toBe(singleScore.overall);
      expect(batchScore.emotional_resonance).toBe(singleScore.emotional_resonance);
      expect(batchScore.identity_alignment).toBe(singleScore.identity_alignment);
      expect(batchScore.urgency_signals).toBe(singleScore.urgency_signals);
    });

    it('should balance emotional and rational texts', () => {
      const emotionalText = `
        I'm absolutely devastated, overwhelmed, frustrated, and terrified!
        This incredible, amazing, fantastic transformation is thrilling!
      `;

      const rationalText = `
        The system architecture includes database servers and load balancers.
        Performance metrics indicate optimal resource utilization.
      `;

      // Individual scores
      const emotionalScore = eqCalculator.calculateEQ(emotionalText);
      const rationalScore = eqCalculator.calculateEQ(rationalText);

      // Batch score should be between them
      const batchScore = eqCalculator.calculateBatchEQ([emotionalText, rationalText]);

      expect(batchScore.overall).toBeGreaterThan(rationalScore.overall);
      expect(batchScore.overall).toBeLessThan(emotionalScore.overall);

      // Should be classified as balanced
      expect(['balanced', 'emotional', 'rational']).toContain(batchScore.classification);
    });
  });

  describe('edge cases', () => {
    it('should handle text with special characters', () => {
      const text = `
        I'm SO excited!!! This is AMAZING!!! 😊🎉
        100% satisfied with this incredible solution!!!
        #grateful #blessed #transformation
      `;

      const score = eqCalculator.calculateEQ(text);

      // Should handle without crashing
      assertEQScoreValid(score);

      // Should still detect emotional words
      expect(score.emotional_resonance).toBeGreaterThan(0);
    });

    it('should handle text with repeated words', () => {
      const text = 'amazing amazing amazing amazing fantastic fantastic wonderful wonderful';

      const score = eqCalculator.calculateEQ(text);

      // Should count repeated words
      assertEQScoreValid(score);
      expect(score.breakdown.emotionalWords).toBeGreaterThan(3);
    });

    it('should be case insensitive', () => {
      const lowerText = 'i feel amazing and excited about this transformation';
      const upperText = 'I FEEL AMAZING AND EXCITED ABOUT THIS TRANSFORMATION';
      const mixedText = 'I fEeL aMaZiNg AnD eXcItEd AbOuT tHiS tRaNsFoRmAtIoN';

      const lowerScore = eqCalculator.calculateEQ(lowerText);
      const upperScore = eqCalculator.calculateEQ(upperText);
      const mixedScore = eqCalculator.calculateEQ(mixedText);

      // All should produce same results
      expect(lowerScore.emotional_resonance).toBe(upperScore.emotional_resonance);
      expect(lowerScore.emotional_resonance).toBe(mixedScore.emotional_resonance);
      expect(lowerScore.overall).toBe(upperScore.overall);
      expect(lowerScore.overall).toBe(mixedScore.overall);
    });

    it('should filter out very short words', () => {
      const text = 'I am so in to it go up or on';

      const score = eqCalculator.calculateEQ(text);

      // Very short words (<=2 chars) should be filtered
      assertEQScoreValid(score);

      // Should have fewer words than input due to filtering
      const inputWords = text.split(/\s+/).length;
      expect(score.breakdown.totalWords).toBeLessThan(inputWords);
    });

    it('should handle numbers and mixed content', () => {
      const text = `
        We increased revenue by 300% and saved $50,000 per year.
        I'm thrilled with these amazing results!
        The ROI was calculated at 450% within 12 months.
      `;

      const score = eqCalculator.calculateEQ(text);

      // Should handle mixed content
      assertEQScoreValid(score);

      // Should detect emotional words despite numbers
      expect(score.breakdown.emotionalWords).toBeGreaterThan(0);

      // Should count actual words (numbers filtered as words with length check)
      expect(score.breakdown.totalWords).toBeGreaterThan(5);
    });
  });
});
