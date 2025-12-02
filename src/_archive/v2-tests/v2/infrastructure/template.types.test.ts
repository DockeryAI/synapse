/**
 * Template Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ContentTemplateCategory,
  CampaignTemplateCategory,
  CONTENT_TEMPLATE_IDS,
  CAMPAIGN_TEMPLATE_IDS
} from '@/types/v2';
import type {
  ContentTemplate,
  CampaignTemplate,
  TemplatePerformanceMetrics
} from '@/types/v2';

describe('Template Types', () => {
  describe('ContentTemplateCategory', () => {
    it('should have all expected categories', () => {
      expect(ContentTemplateCategory.HOOK_BASED).toBe('hook_based');
      expect(ContentTemplateCategory.PROBLEM_SOLUTION).toBe('problem_solution');
      expect(ContentTemplateCategory.STORY_BASED).toBe('story_based');
      expect(ContentTemplateCategory.EDUCATIONAL).toBe('educational');
      expect(ContentTemplateCategory.URGENCY).toBe('urgency');
      expect(ContentTemplateCategory.AUTHORITY).toBe('authority');
      expect(ContentTemplateCategory.ENGAGEMENT).toBe('engagement');
    });
  });

  describe('CampaignTemplateCategory', () => {
    it('should have all expected categories', () => {
      expect(CampaignTemplateCategory.CORE_JOURNEY).toBe('core_journey');
      expect(CampaignTemplateCategory.LAUNCH).toBe('launch');
      expect(CampaignTemplateCategory.AUTHORITY).toBe('authority');
      expect(CampaignTemplateCategory.CONVERSION).toBe('conversion');
    });
  });

  describe('CONTENT_TEMPLATE_IDS', () => {
    it('should have all 20 content template IDs', () => {
      const templateIds = Object.values(CONTENT_TEMPLATE_IDS);
      expect(templateIds).toHaveLength(20);

      // Hook-based (4)
      expect(CONTENT_TEMPLATE_IDS.CURIOSITY_GAP).toBe('curiosity_gap');
      expect(CONTENT_TEMPLATE_IDS.PATTERN_INTERRUPT).toBe('pattern_interrupt');
      expect(CONTENT_TEMPLATE_IDS.SPECIFIC_NUMBER).toBe('specific_number');
      expect(CONTENT_TEMPLATE_IDS.CONTRARIAN).toBe('contrarian');

      // Problem-Solution (3)
      expect(CONTENT_TEMPLATE_IDS.MISTAKE_EXPOSER).toBe('mistake_exposer');
      expect(CONTENT_TEMPLATE_IDS.HIDDEN_COST).toBe('hidden_cost');
      expect(CONTENT_TEMPLATE_IDS.QUICK_WIN).toBe('quick_win');

      // Story-based (3)
      expect(CONTENT_TEMPLATE_IDS.TRANSFORMATION).toBe('transformation');
      expect(CONTENT_TEMPLATE_IDS.FAILURE_TO_SUCCESS).toBe('failure_to_success');
      expect(CONTENT_TEMPLATE_IDS.BEHIND_THE_SCENES).toBe('behind_the_scenes');

      // Educational (3)
      expect(CONTENT_TEMPLATE_IDS.MYTH_BUSTER).toBe('myth_buster');
      expect(CONTENT_TEMPLATE_IDS.GUIDE_SNIPPET).toBe('guide_snippet');
      expect(CONTENT_TEMPLATE_IDS.COMPARISON).toBe('comparison');

      // Urgency (3)
      expect(CONTENT_TEMPLATE_IDS.TREND_JACKER).toBe('trend_jacker');
      expect(CONTENT_TEMPLATE_IDS.DEADLINE_DRIVER).toBe('deadline_driver');
      expect(CONTENT_TEMPLATE_IDS.SEASONAL).toBe('seasonal');

      // Authority (3)
      expect(CONTENT_TEMPLATE_IDS.DATA_REVELATION).toBe('data_revelation');
      expect(CONTENT_TEMPLATE_IDS.EXPERT_ROUNDUP).toBe('expert_roundup');
      expect(CONTENT_TEMPLATE_IDS.CASE_STUDY).toBe('case_study');

      // Engagement (1)
      expect(CONTENT_TEMPLATE_IDS.CHALLENGE_POST).toBe('challenge_post');
    });
  });

  describe('CAMPAIGN_TEMPLATE_IDS', () => {
    it('should have all 15 campaign template IDs', () => {
      const templateIds = Object.values(CAMPAIGN_TEMPLATE_IDS);
      expect(templateIds).toHaveLength(15);

      // Core Journey (5)
      expect(CAMPAIGN_TEMPLATE_IDS.RACE_JOURNEY).toBe('race_journey');
      expect(CAMPAIGN_TEMPLATE_IDS.PAS_SERIES).toBe('pas_series');
      expect(CAMPAIGN_TEMPLATE_IDS.BAB_CAMPAIGN).toBe('bab_campaign');
      expect(CAMPAIGN_TEMPLATE_IDS.TRUST_LADDER).toBe('trust_ladder');
      expect(CAMPAIGN_TEMPLATE_IDS.HEROS_JOURNEY).toBe('heros_journey');

      // Launch (2)
      expect(CAMPAIGN_TEMPLATE_IDS.PRODUCT_LAUNCH).toBe('product_launch');
      expect(CAMPAIGN_TEMPLATE_IDS.SEASONAL_URGENCY).toBe('seasonal_urgency');

      // Authority (3)
      expect(CAMPAIGN_TEMPLATE_IDS.AUTHORITY_BUILDER).toBe('authority_builder');
      expect(CAMPAIGN_TEMPLATE_IDS.COMPARISON_CAMPAIGN).toBe('comparison_campaign');
      expect(CAMPAIGN_TEMPLATE_IDS.EDUCATION_FIRST).toBe('education_first');

      // Conversion (5)
      expect(CAMPAIGN_TEMPLATE_IDS.SOCIAL_PROOF).toBe('social_proof');
      expect(CAMPAIGN_TEMPLATE_IDS.OBJECTION_CRUSHER).toBe('objection_crusher');
      expect(CAMPAIGN_TEMPLATE_IDS.QUICK_WIN_CAMPAIGN).toBe('quick_win_campaign');
      expect(CAMPAIGN_TEMPLATE_IDS.SCARCITY_SEQUENCE).toBe('scarcity_sequence');
      expect(CAMPAIGN_TEMPLATE_IDS.VALUE_STACK).toBe('value_stack');
    });
  });

  describe('TemplatePerformanceMetrics', () => {
    it('should create valid performance metrics', () => {
      const metrics: TemplatePerformanceMetrics = {
        expectedCTRImprovement: 35,
        expectedEngagementMultiplier: 2.5,
        expectedRecallImprovement: 22,
        expectedROI: 4.5,
        confidenceLevel: 'high',
        basedOnSampleSize: 1000
      };

      expect(metrics.expectedCTRImprovement).toBe(35);
      expect(metrics.confidenceLevel).toBe('high');
    });
  });

  describe('ContentTemplate', () => {
    it('should create a valid content template', () => {
      const template: ContentTemplate = {
        id: CONTENT_TEMPLATE_IDS.CURIOSITY_GAP,
        name: 'Curiosity Gap',
        description: 'Known + Unknown + Stakes',
        type: 'content',
        category: ContentTemplateCategory.HOOK_BASED,
        structure: {
          sections: [],
          format: 'standard',
          wordCountRange: { min: 200, max: 500 }
        },
        variables: [],
        emotionalTriggers: ['curiosity'],
        bestFor: ['awareness', 'engagement'],
        dataPointMatches: ['trend', 'industry_insight'],
        performanceMetrics: {
          expectedCTRImprovement: 45,
          expectedEngagementMultiplier: 2.0,
          confidenceLevel: 'high',
          basedOnSampleSize: 500
        }
      };

      expect(template.id).toBe('curiosity_gap');
      expect(template.type).toBe('content');
      expect(template.category).toBe(ContentTemplateCategory.HOOK_BASED);
    });
  });

  describe('CampaignTemplate', () => {
    it('should create a valid campaign template', () => {
      const template: CampaignTemplate = {
        id: CAMPAIGN_TEMPLATE_IDS.RACE_JOURNEY,
        name: 'RACE Journey',
        description: 'Reach, Act, Convert, Engage',
        type: 'campaign',
        category: CampaignTemplateCategory.CORE_JOURNEY,
        arc: {
          id: 'race-arc',
          name: 'RACE Arc',
          description: 'Full customer journey',
          phases: [],
          totalDuration: 21,
          emotionalProgression: ['curiosity', 'trust', 'urgency', 'authority']
        },
        pieceCount: 7,
        durationDays: 21,
        emotionalProgression: ['curiosity', 'trust', 'urgency', 'authority'],
        bestFor: ['awareness', 'conversion'],
        performanceMetrics: {
          expectedCTRImprovement: 35,
          expectedEngagementMultiplier: 3.0,
          expectedROI: 4.5,
          confidenceLevel: 'high',
          basedOnSampleSize: 200
        }
      };

      expect(template.id).toBe('race_journey');
      expect(template.type).toBe('campaign');
      expect(template.pieceCount).toBe(7);
      expect(template.durationDays).toBe(21);
    });
  });
});
