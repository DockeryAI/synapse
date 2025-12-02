/**
 * Campaign Arc Generator Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CampaignArcGeneratorService,
  campaignArcGenerator,
  type ArcGeneratorConfig,
  type BrandContext,
} from '@/services/v2/campaign-arc-generator.service';

describe('CampaignArcGeneratorService', () => {
  let service: CampaignArcGeneratorService;
  let mockBrandContext: BrandContext;
  let mockConfig: ArcGeneratorConfig;

  beforeEach(() => {
    service = new CampaignArcGeneratorService();
    mockBrandContext = {
      brandId: 'brand-123',
      brandName: 'Test Brand',
      industry: 'SaaS',
      uvp: 'We help businesses grow faster',
      targetAudience: 'small business owners',
      tone: 'professional',
    };
    mockConfig = {
      startDate: '2024-01-01T00:00:00.000Z',
      targetAudience: 'small business owners',
      primaryGoal: 'lead generation',
      industryCode: '541511',
    };
  });

  describe('generateArc', () => {
    it('should generate a complete arc for race_journey template', () => {
      const result = service.generateArc('race_journey', mockBrandContext, mockConfig);

      expect(result.campaign).toBeDefined();
      expect(result.pieces).toHaveLength(4);
      expect(result.campaign.templateId).toBe('race_journey');
      expect(result.campaign.brandId).toBe('brand-123');
    });

    it('should generate correct number of pieces for each template', () => {
      const templates = [
        { id: 'race_journey', pieces: 4 },
        { id: 'pas_series', pieces: 3 },
        { id: 'trust_ladder', pieces: 5 },
        { id: 'heros_journey', pieces: 5 },
        { id: 'quick_win_campaign', pieces: 3 },
      ];

      templates.forEach(({ id, pieces }) => {
        const result = service.generateArc(id, mockBrandContext, mockConfig);
        expect(result.pieces).toHaveLength(pieces);
      });
    });

    it('should set correct emotional triggers for pieces', () => {
      const result = service.generateArc('pas_series', mockBrandContext, mockConfig);

      expect(result.pieces[0].emotionalTrigger).toBe('fear');
      expect(result.pieces[1].emotionalTrigger).toBe('hope');
      expect(result.pieces[2].emotionalTrigger).toBe('desire');
    });

    it('should calculate timeline correctly', () => {
      const result = service.generateArc('race_journey', mockBrandContext, mockConfig);

      expect(result.timeline.startDate).toEqual(mockConfig.startDate);
      expect(result.timeline.totalDuration).toBe(14);
      expect(result.timeline.endDate).toEqual('2024-01-15T00:00:00.000Z');
    });

    it('should throw error for unknown template', () => {
      expect(() => {
        service.generateArc('unknown_template', mockBrandContext, mockConfig);
      }).toThrow('Unknown campaign template: unknown_template');
    });

    it('should apply custom interval days constraint', () => {
      const customConfig: ArcGeneratorConfig = {
        ...mockConfig,
        customConstraints: {
          intervalDays: 7,
        },
      };

      const result = service.generateArc('pas_series', mockBrandContext, customConfig);

      const firstDate = new Date(result.pieces[0].scheduledDate);
      const secondDate = new Date(result.pieces[1].scheduledDate);
      const daysDiff = Math.round(
        (secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(7);
    });

    it('should apply max pieces constraint', () => {
      const customConfig: ArcGeneratorConfig = {
        ...mockConfig,
        customConstraints: {
          maxPieces: 2,
        },
      };

      const result = service.generateArc('trust_ladder', mockBrandContext, customConfig);

      expect(result.pieces).toHaveLength(2);
    });
  });

  describe('calculateEmotionalProgression', () => {
    it('should return high score for well-structured progression', () => {
      const result = service.generateArc('heros_journey', mockBrandContext, mockConfig);

      expect(result.emotionalProgression.score).toBeGreaterThanOrEqual(70);
    });

    it('should detect repeated triggers and lower score', () => {
      // Create pieces with repeated triggers
      const result = service.generateArc('trust_ladder', mockBrandContext, mockConfig);

      // Trust ladder has 'trust' twice, so should have some deduction
      const progression = result.emotionalProgression;
      expect(progression.flow).toContain('trust');
    });

    it('should provide suggestions for improvement', () => {
      const result = service.generateArc('race_journey', mockBrandContext, mockConfig);

      expect(result.emotionalProgression).toBeDefined();
      expect(Array.isArray(result.emotionalProgression.suggestions)).toBe(true);
    });

    it('should track emotional flow correctly', () => {
      const result = service.generateArc('pas_series', mockBrandContext, mockConfig);

      expect(result.emotionalProgression.flow).toEqual(['fear', 'hope', 'desire']);
    });
  });

  describe('generatePieceContent', () => {
    it('should generate valid piece with all required fields', () => {
      const pieceTemplate = {
        structure: 'Problem',
        emotionalTrigger: 'fear' as const,
        position: 0,
        total: 3,
      };

      const piece = service.generatePieceContent(
        pieceTemplate,
        mockBrandContext,
        'campaign-123',
        '2024-01-01T00:00:00.000Z'
      );

      expect(piece.id).toBeDefined();
      expect(piece.campaignId).toBe('campaign-123');
      expect(piece.title).toBeDefined();
      expect(piece.content).toBeDefined();
      expect(piece.emotionalTrigger).toBe('fear');
      expect(piece.status).toBe('pending');
    });

    it('should include performance prediction', () => {
      const pieceTemplate = {
        structure: 'Solution',
        emotionalTrigger: 'desire' as const,
        position: 2,
        total: 3,
      };

      const piece = service.generatePieceContent(
        pieceTemplate,
        mockBrandContext,
        'campaign-123',
        '2024-01-01T00:00:00.000Z'
      );

      expect(piece.performancePrediction).toBeDefined();
      expect(piece.performancePrediction.expectedCTR).toBeGreaterThan(0);
      expect(piece.performancePrediction.confidenceScore).toBeGreaterThan(0);
    });

    it('should generate appropriate title based on structure', () => {
      const pieceTemplate = {
        structure: 'Teaser',
        emotionalTrigger: 'curiosity' as const,
        position: 0,
        total: 4,
      };

      const piece = service.generatePieceContent(
        pieceTemplate,
        mockBrandContext,
        'campaign-123',
        '2024-01-01T00:00:00.000Z'
      );

      expect(piece.title).toContain('Test Brand');
    });
  });

  describe('optimizeTimeline', () => {
    it('should optimize with default settings', () => {
      const result = service.generateArc('race_journey', mockBrandContext, mockConfig);

      // Pieces should be scheduled in order
      for (let i = 1; i < result.pieces.length; i++) {
        expect(new Date(result.pieces[i].scheduledDate).getTime())
          .toBeGreaterThan(new Date(result.pieces[i - 1].scheduledDate).getTime());
      }
    });

    it('should filter excluded triggers', () => {
      const customConfig: ArcGeneratorConfig = {
        ...mockConfig,
        customConstraints: {
          excludeTriggers: ['fear'],
        },
      };

      const result = service.generateArc('pas_series', mockBrandContext, customConfig);

      const hasFear = result.pieces.some(p => p.emotionalTrigger === 'fear');
      expect(hasFear).toBe(false);
    });
  });

  describe('all campaign templates', () => {
    const allTemplates = [
      'race_journey',
      'pas_series',
      'bab_campaign',
      'trust_ladder',
      'heros_journey',
      'product_launch',
      'seasonal_urgency',
      'authority_builder',
      'comparison_campaign',
      'education_first',
      'social_proof',
      'objection_crusher',
      'quick_win_campaign',
      'scarcity_sequence',
      'value_stack',
    ];

    allTemplates.forEach(templateId => {
      it(`should generate valid arc for ${templateId}`, () => {
        const result = service.generateArc(templateId, mockBrandContext, mockConfig);

        expect(result.campaign).toBeDefined();
        expect(result.campaign.id).toBeDefined();
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.emotionalProgression.score).toBeGreaterThanOrEqual(0);
        expect(result.timeline.totalDuration).toBeGreaterThan(0);

        // Each piece should have required fields
        result.pieces.forEach(piece => {
          expect(piece.id).toBeDefined();
          expect(piece.title).toBeDefined();
          expect(piece.content).toBeDefined();
          expect(piece.emotionalTrigger).toBeDefined();
          expect(piece.performancePrediction).toBeDefined();
        });
      });
    });
  });

  describe('singleton export', () => {
    it('should export singleton instance', () => {
      expect(campaignArcGenerator).toBeDefined();
      expect(campaignArcGenerator).toBeInstanceOf(CampaignArcGeneratorService);
    });
  });

  describe('campaign structure', () => {
    it('should set correct campaign purpose', () => {
      const conversionTemplates = ['race_journey', 'pas_series', 'objection_crusher'];
      const educationTemplates = ['comparison_campaign', 'education_first'];

      conversionTemplates.forEach(id => {
        const result = service.generateArc(id, mockBrandContext, mockConfig);
        expect(result.campaign.purpose).toBe('conversion');
      });

      educationTemplates.forEach(id => {
        const result = service.generateArc(id, mockBrandContext, mockConfig);
        expect(result.campaign.purpose).toBe('education');
      });
    });

    it('should track piece IDs in campaign', () => {
      const result = service.generateArc('race_journey', mockBrandContext, mockConfig);

      expect(result.campaign.pieces).toHaveLength(result.pieces.length);
      result.pieces.forEach(piece => {
        expect(result.campaign.pieces).toContain(piece.id);
      });
    });

    it('should set correct arc metadata', () => {
      const result = service.generateArc('trust_ladder', mockBrandContext, mockConfig);

      expect(result.campaign.arc).toBeDefined();
      expect(result.campaign.arc.totalPieces).toBe(5);
      expect(result.campaign.arc.completedPieces).toBe(0);
      expect(result.campaign.arc.emotionalProgression).toHaveLength(5);
    });
  });
});
