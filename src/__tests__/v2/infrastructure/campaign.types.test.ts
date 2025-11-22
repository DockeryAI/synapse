/**
 * Campaign Types Tests
 */

import { describe, it, expect } from 'vitest';
import type {
  Campaign,
  CampaignMode,
  CampaignPurpose,
  CampaignStatus,
  CampaignPiece,
  CampaignArc,
  EmotionalTrigger
} from '@/types/v2';

describe('Campaign Types', () => {
  describe('CampaignMode', () => {
    it('should accept valid mode values', () => {
      const contentMode: CampaignMode = 'content';
      const campaignMode: CampaignMode = 'campaign';

      expect(contentMode).toBe('content');
      expect(campaignMode).toBe('campaign');
    });
  });

  describe('CampaignPurpose', () => {
    it('should accept all valid purpose values', () => {
      const purposes: CampaignPurpose[] = [
        'product_launch',
        'seasonal_push',
        'problem_education',
        'competitive_disruption',
        'trust_building',
        'authority_establishment',
        'conversion_optimization'
      ];

      expect(purposes).toHaveLength(7);
    });
  });

  describe('CampaignStatus', () => {
    it('should accept all valid status values', () => {
      const statuses: CampaignStatus[] = [
        'draft',
        'scheduled',
        'active',
        'completed',
        'paused'
      ];

      expect(statuses).toHaveLength(5);
    });
  });

  describe('EmotionalTrigger', () => {
    it('should accept all valid emotional triggers', () => {
      const triggers: EmotionalTrigger[] = [
        'fear',
        'trust',
        'security',
        'efficiency',
        'growth',
        'innovation',
        'safety',
        'hope',
        'opportunity',
        'urgency',
        'curiosity',
        'authority'
      ];

      expect(triggers).toHaveLength(12);
    });
  });

  describe('Campaign', () => {
    it('should create a valid campaign object', () => {
      const campaign: Campaign = {
        id: 'test-id',
        brandId: 'brand-id',
        name: 'Test Campaign',
        purpose: 'product_launch',
        status: 'draft',
        templateId: 'template-id',
        arc: {
          id: 'arc-id',
          name: 'Test Arc',
          description: 'Test description',
          phases: [],
          totalDuration: 14,
          emotionalProgression: ['curiosity', 'trust', 'urgency']
        },
        pieces: [],
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(campaign.id).toBe('test-id');
      expect(campaign.purpose).toBe('product_launch');
      expect(campaign.status).toBe('draft');
    });
  });

  describe('CampaignPiece', () => {
    it('should create a valid campaign piece', () => {
      const piece: CampaignPiece = {
        id: 'piece-id',
        campaignId: 'campaign-id',
        phaseId: 'phase-1',
        title: 'Test Piece',
        content: 'Test content',
        emotionalTrigger: 'curiosity',
        scheduledDate: '2024-01-01',
        status: 'pending',
        channel: 'linkedin',
        order: 1
      };

      expect(piece.id).toBe('piece-id');
      expect(piece.emotionalTrigger).toBe('curiosity');
      expect(piece.status).toBe('pending');
    });
  });

  describe('CampaignArc', () => {
    it('should create a valid campaign arc', () => {
      const arc: CampaignArc = {
        id: 'arc-id',
        name: 'RACE Journey',
        description: 'Reach, Act, Convert, Engage',
        phases: [
          {
            id: 'phase-1',
            name: 'Reach',
            dayNumber: 1,
            emotionalTrigger: 'curiosity',
            objective: 'Build awareness',
            contentType: 'awareness'
          }
        ],
        totalDuration: 21,
        emotionalProgression: ['curiosity', 'trust', 'urgency', 'authority']
      };

      expect(arc.name).toBe('RACE Journey');
      expect(arc.phases).toHaveLength(1);
      expect(arc.totalDuration).toBe(21);
    });
  });
});
