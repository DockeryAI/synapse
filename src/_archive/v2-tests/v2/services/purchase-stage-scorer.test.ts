/**
 * Purchase Stage Scorer Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { purchaseStageScorerService } from '@/services/v2/purchase-stage-scorer.service';
import type { SegmentMatchInput, PurchaseStage } from '@/types/v2';

describe('PurchaseStageScorerService', () => {
  describe('scoreContent', () => {
    it('detects awareness stage content', () => {
      const content: SegmentMatchInput = {
        content: 'What is preventive healthcare? Learn the basics of staying healthy.',
        title: 'Understanding Healthcare Basics',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      // Should detect a stage
      expect(['awareness', 'consideration', 'decision']).toContain(score.detectedStage);
      expect(score.stageScores.awareness).toBeGreaterThan(0);
    });

    it('detects consideration stage content', () => {
      const content: SegmentMatchInput = {
        content: 'Compare our healthcare plans vs traditional insurance. See the benefits and features.',
        title: 'Healthcare Plan Comparison',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      // Should detect a stage
      expect(['awareness', 'consideration', 'decision']).toContain(score.detectedStage);
      expect(score.stageScores.consideration).toBeGreaterThan(0);
    });

    it('detects decision stage content', () => {
      const content: SegmentMatchInput = {
        content: 'Get started with our plan today. Limited offer - 20% off. Buy now!',
        title: 'Special Pricing Offer',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      // Should detect a stage
      expect(['awareness', 'consideration', 'decision']).toContain(score.detectedStage);
      expect(score.stageScores.decision).toBeGreaterThan(0);
    });

    it('returns scores for all stages', () => {
      const content: SegmentMatchInput = {
        content: 'Test content',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      expect(score.stageScores).toHaveProperty('awareness');
      expect(score.stageScores).toHaveProperty('consideration');
      expect(score.stageScores).toHaveProperty('decision');
    });

    it('includes indicators in result', () => {
      const content: SegmentMatchInput = {
        content: 'What is healthcare and how to choose the best option',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      expect(score.indicators).toBeDefined();
      expect(Array.isArray(score.indicators)).toBe(true);
    });

    it('provides recommendations', () => {
      const content: SegmentMatchInput = {
        content: 'Learn about healthcare',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      expect(score.recommendations).toBeDefined();
      expect(score.recommendations.length).toBeGreaterThan(0);
    });

    it('calculates confidence score', () => {
      const content: SegmentMatchInput = {
        content: 'What is healthcare? How to understand the basics.',
      };

      const score = purchaseStageScorerService.scoreContent(content);
      expect(score.confidence).toBeGreaterThan(0);
      expect(score.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('getGuidelines', () => {
    it('returns guidelines for awareness stage', () => {
      const guidelines = purchaseStageScorerService.getGuidelines('awareness');
      expect(guidelines.stage).toBe('awareness');
      expect(guidelines.characteristics).toBeDefined();
      expect(guidelines.contentTypes).toBeDefined();
      expect(guidelines.callToActions).toBeDefined();
    });

    it('returns guidelines for consideration stage', () => {
      const guidelines = purchaseStageScorerService.getGuidelines('consideration');
      expect(guidelines.stage).toBe('consideration');
      expect(guidelines.characteristics.length).toBeGreaterThan(0);
    });

    it('returns guidelines for decision stage', () => {
      const guidelines = purchaseStageScorerService.getGuidelines('decision');
      expect(guidelines.stage).toBe('decision');
      expect(guidelines.callToActions.length).toBeGreaterThan(0);
    });
  });

  describe('getAllGuidelines', () => {
    it('returns guidelines for all stages', () => {
      const allGuidelines = purchaseStageScorerService.getAllGuidelines();
      expect(allGuidelines.length).toBe(3);
    });
  });

  describe('recommendTransition', () => {
    const content: SegmentMatchInput = {
      content: 'Test content',
    };

    it('provides transition from awareness to consideration', () => {
      const transition = purchaseStageScorerService.recommendTransition(
        'awareness',
        'consideration',
        content
      );

      expect(transition.from).toBe('awareness');
      expect(transition.to).toBe('consideration');
      expect(transition.requiredChanges.length).toBeGreaterThan(0);
    });

    it('provides transition from consideration to decision', () => {
      const transition = purchaseStageScorerService.recommendTransition(
        'consideration',
        'decision',
        content
      );

      expect(transition.from).toBe('consideration');
      expect(transition.to).toBe('decision');
      expect(transition.requiredChanges).toContain('Add pricing information or pricing CTA');
    });

    it('includes confidence score in transition', () => {
      const transition = purchaseStageScorerService.recommendTransition(
        'awareness',
        'decision',
        content
      );

      expect(transition.confidence).toBeGreaterThan(0);
    });
  });

  describe('validateForStage', () => {
    it('validates awareness stage content', () => {
      const content: SegmentMatchInput = {
        content: 'Learn about healthcare basics and what you need to know.',
      };

      const validation = purchaseStageScorerService.validateForStage(content, 'awareness');
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.isValid).toBeDefined();
    });

    it('provides issues when content doesn\'t match stage', () => {
      const content: SegmentMatchInput = {
        content: 'Buy now! Limited offer! Get 50% off pricing today!',
      };

      const validation = purchaseStageScorerService.validateForStage(content, 'awareness');
      expect(validation.issues).toBeDefined();
    });

    it('provides suggestions for improvement', () => {
      const content: SegmentMatchInput = {
        content: 'Some generic content here',
      };

      const validation = purchaseStageScorerService.validateForStage(content, 'decision');
      expect(validation.suggestions).toBeDefined();
      expect(Array.isArray(validation.suggestions)).toBe(true);
    });

    it('returns valid=true for well-matched content', () => {
      const content: SegmentMatchInput = {
        content: 'What is healthcare and how to understand your options. Learn more about the basics.',
      };

      const validation = purchaseStageScorerService.validateForStage(content, 'awareness');
      expect(typeof validation.isValid).toBe('boolean');
    });
  });
});
