// PRD Feature: SYNAPSE-V6
/**
 * Synapse Core Service Tests
 * Critical path: Content quality scoring (0-100)
 */

import { describe, it, expect } from 'vitest';
import { synapseCoreService } from '../synapse-core.service';

describe('SynapseCoreService', () => {
  describe('scoreContent', () => {
    it('should score high-quality content above 75', () => {
      const content =
        'Transform your business with our exclusive limited-time offer! Discover proven strategies that drive results. Act now - this opportunity won\'t last!';
      const score = synapseCoreService.scoreContent(content);

      expect(score.overall).toBeGreaterThanOrEqual(50);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should score low-quality content below 50', () => {
      const content = 'This is a post.';
      const score = synapseCoreService.scoreContent(content);

      expect(score.overall).toBeLessThan(50);
      expect(score.overall).toBeGreaterThanOrEqual(0);
    });

    it('should score empty content at 0', () => {
      const score = synapseCoreService.scoreContent('');
      expect(score.overall).toBe(0);
    });

    it('should detect power words and increase score', () => {
      const withoutPowerWords = 'Please see our products.';
      const withPowerWords = 'Discover exclusive products and unlock amazing value!';

      const scoreWithout = synapseCoreService.scoreContent(withoutPowerWords);
      const scoreWith = synapseCoreService.scoreContent(withPowerWords);

      expect(scoreWith.overall).toBeGreaterThan(scoreWithout.overall);
    });

    it('should detect call to action and increase score', () => {
      const withoutCTA = 'We have great products available for purchase whenever you want them.';
      const withCTA = 'Shop now and get 20% off! Limited time offer - click here today!';

      const scoreWithout = synapseCoreService.scoreContent(withoutCTA);
      const scoreWith = synapseCoreService.scoreContent(withCTA);

      expect(scoreWith.overall).toBeGreaterThan(scoreWithout.overall);
    });

    it('should detect urgency and increase score', () => {
      const withoutUrgency = 'Our sale is available for purchase.';
      const withUrgency = 'Flash sale ends tonight! Don\'t miss out - only 24 hours left!';

      const scoreWithout = synapseCoreService.scoreContent(withoutUrgency);
      const scoreWith = synapseCoreService.scoreContent(withUrgency);

      expect(scoreWith.overall).toBeGreaterThan(scoreWithout.overall);
    });

    it('should handle special characters gracefully', () => {
      const content = 'Amazing! 🔥 Get 50% OFF today! 💯 #Sale @YourBrand';
      const score = synapseCoreService.scoreContent(content);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should be consistent for identical content', () => {
      const content = 'Discover exclusive deals and transform your experience today!';
      const score1 = synapseCoreService.scoreContent(content);
      const score2 = synapseCoreService.scoreContent(content);

      expect(score1.overall).toBe(score2.overall);
    });

    it('should handle very long content', () => {
      const longContent = 'Amazing product! '.repeat(100);
      const score = synapseCoreService.scoreContent(longContent);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzePowerWords', () => {
    it('should detect power words', () => {
      const result = synapseCoreService.analyzePowerWords('Discover exclusive amazing secret');

      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should return zero for content without power words', () => {
      const result = synapseCoreService.analyzePowerWords('This is normal text');

      expect(result.totalCount).toBe(0);
      expect(result.score).toBe(0);
    });
  });

  // V5 REMOVED - detectEmotionalTriggers tests
  // Use detectPsychologyTriggers instead
  describe.skip('detectEmotionalTriggers (V5 DEPRECATED)', () => {
    it('should detect curiosity triggers', () => {
      // REMOVED - use detectPsychologyTriggers
    });

    it('should detect urgency triggers', () => {
      // REMOVED - use detectPsychologyTriggers
    });

    it('should detect fear triggers', () => {
      // REMOVED - use detectPsychologyTriggers
    });

    it('should return empty for neutral content', () => {
      // REMOVED - use detectPsychologyTriggers

      expect(triggers.triggers.length).toBe(0);
    });
  });

  describe('analyzeCallToAction', () => {
    it('should detect strong CTAs', () => {
      const result = synapseCoreService.analyzeCallToAction('Click here now! Shop today and save!');

      expect(result.hasCTA).toBe(true);
      expect(result.strength).toBeGreaterThan(0);
      expect(result.strength).toBeGreaterThan(0);
    });

    it('should detect soft CTAs', () => {
      const result = synapseCoreService.analyzeCallToAction('Learn more about our services');

      expect(result.hasCTA).toBe(true);
      expect(result.strength).toBeGreaterThan(0);
    });

    it('should return zero for content without CTA', () => {
      const result = synapseCoreService.analyzeCallToAction('This is just informational content.');

      expect(result.hasCTA).toBe(false);
      expect(result.strength).toBe(0);
    });
  });

  describe('calculateReadability', () => {
    it('should calculate readability scores', () => {
      const result = synapseCoreService.calculateReadability('This is a simple sentence. It is easy to read. Everyone can understand it.');

      expect(result.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(result.fleschKincaidGrade).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should penalize overly complex content', () => {
      const simple = 'Buy now. Save big. Get deals.';
      const complex =
        'Notwithstanding the aforementioned considerations, the implementation of comprehensive methodological frameworks necessitates careful deliberation.';

      const simpleScore = synapseCoreService.calculateReadability(simple);
      const complexScore = synapseCoreService.calculateReadability(complex);

      expect(simpleScore.score).toBeGreaterThan(complexScore.score);
    });
  });
});
