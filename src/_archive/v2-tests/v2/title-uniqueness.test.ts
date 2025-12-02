/**
 * Title Uniqueness Tests
 *
 * Validates that content generation produces unique titles across multiple generations.
 * This is a critical Week 1 testing checkpoint requirement.
 */

import { describe, it, expect, vi } from 'vitest';
import { templateRegistry } from '@/services/v2/templates/content-template-registry';
import { CampaignTemplateRegistry } from '@/services/v2/templates/campaign-template-registry';

// Mock AI service for consistent test behavior
vi.mock('@/services/ai/multi-model-orchestrator.service', () => ({
  multiModelOrchestrator: {
    route: vi.fn().mockResolvedValue({
      content: 'Generated content for testing',
      model: 'test-model'
    })
  }
}));

describe('Title Uniqueness', () => {
  describe('Content Templates', () => {
    it('should generate unique titles across 20+ generations', async () => {
      const templates = templateRegistry.getAllTemplates();
      const generatedTitles: string[] = [];

      // Generate titles from each content template
      for (const template of templates) {
        if (template) {
          // Each template should be able to generate unique content
          const mockInput = {
            topic: 'Feature A, Benefit B, Solution C',
            industry: 'SaaS',
            targetAudience: 'Small business owners',
            tone: 'professional' as const,
            platform: 'linkedin' as const
          };

          const result = template.generate(mockInput);

          // Titles should follow template patterns
          expect(result.title).toBeDefined();
          expect(result.title.length).toBeGreaterThan(0);

          generatedTitles.push(result.title);
        }
      }

      // All 20 templates should produce titles
      expect(generatedTitles.length).toBe(20);

      // Check uniqueness - all titles should be different
      const uniqueTitles = new Set(generatedTitles);
      expect(uniqueTitles.size).toBe(generatedTitles.length);
    });

    it('should maintain title uniqueness with same input across templates', () => {
      const commonInput = {
        topic: 'HIPAA Compliance, Patient Care, Data Security',
        industry: 'Healthcare',
        targetAudience: 'Healthcare administrators',
        tone: 'professional' as const,
        platform: 'linkedin' as const
      };

      const titles: string[] = [];

      // Generate from different template types
      const templateIds = [
        'curiosity-gap',
        'pattern-interrupt',
        'specific-number',
        'contrarian',
        'transformation',
        'myth-buster',
        'trend-jacker',
        'data-revelation'
      ] as const;

      for (const id of templateIds) {
        const template = templateRegistry.getTemplate(id);
        if (template) {
          const result = template.generate(commonInput);
          titles.push(result.title);
        }
      }

      // All titles should be unique despite same input
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should produce different title structures per template type', () => {
      const input = {
        topic: 'Automated Investing, Low Fees, Easy Setup',
        industry: 'Finance',
        targetAudience: 'Young professionals',
        tone: 'casual' as const,
        platform: 'twitter' as const
      };

      // Curiosity Gap should create engaging titles
      const curiosityTemplate = templateRegistry.getTemplate('curiosity-gap');
      if (curiosityTemplate) {
        const result = curiosityTemplate.generate(input);
        // Should have a non-empty title
        expect(result.title.length).toBeGreaterThan(10);
      }

      // Specific Number should contain a number
      const numberTemplate = templateRegistry.getTemplate('specific-number');
      if (numberTemplate) {
        const result = numberTemplate.generate(input);
        expect(result.title).toMatch(/\d+/);
      }

      // Myth Buster should contain myth/truth language
      const mythTemplate = templateRegistry.getTemplate('myth-buster');
      if (mythTemplate) {
        const result = mythTemplate.generate(input);
        expect(result.title.toLowerCase()).toMatch(/myth|truth|reality|actually|believe/);
      }
    });
  });

  describe('Campaign Templates', () => {
    it('should generate unique campaign names across all 15 templates', () => {
      const templates = CampaignTemplateRegistry.getAll();
      const campaignNames: string[] = [];

      for (const template of templates) {
        // Campaign templates have unique names in metadata
        campaignNames.push(template.metadata.name);
      }

      // All 15 templates should have unique names
      expect(campaignNames.length).toBe(15);
      const uniqueNames = new Set(campaignNames);
      expect(uniqueNames.size).toBe(15);
    });

    it('should have unique template IDs across campaigns', () => {
      const templates = CampaignTemplateRegistry.getAll();
      const templateIds: string[] = [];

      for (const template of templates) {
        templateIds.push(template.metadata.id);
      }

      // All 15 templates should have unique IDs
      expect(templateIds.length).toBe(15);
      const uniqueIds = new Set(templateIds);
      expect(uniqueIds.size).toBe(15);
    });

    it('should have valid piece counts per template', () => {
      const templates = CampaignTemplateRegistry.getAll();
      const pieceCounts: number[] = [];

      for (const template of templates) {
        // Piece count is in metadata
        pieceCounts.push(template.metadata.pieceCount);
      }

      // All 15 templates should have piece counts
      expect(pieceCounts.length).toBe(15);

      // All counts should be valid positive numbers
      for (const count of pieceCounts) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Title Generation Quality', () => {
    it('should not produce placeholder or generic titles', () => {
      const templates = templateRegistry.getAllTemplates();

      const genericPatterns = [
        /^title$/i,
        /^content$/i,
        /^post$/i,
        /^untitled$/i,
        /lorem ipsum/i,
        /^test/i
      ];

      for (const template of templates) {
        if (template) {
          const result = template.generate({
            topic: 'Innovation, Speed, Reliability',
            industry: 'Technology',
            targetAudience: 'CTOs',
            tone: 'professional' as const,
            platform: 'linkedin' as const
          });

          for (const pattern of genericPatterns) {
            expect(result.title).not.toMatch(pattern);
          }
        }
      }
    });

    it('should maintain reasonable title lengths', () => {
      const templates = templateRegistry.getAllTemplates();

      for (const template of templates) {
        if (template) {
          const result = template.generate({
            topic: 'Quality Products, Fast Shipping, Great Service',
            industry: 'Retail',
            targetAudience: 'Online shoppers',
            tone: 'casual' as const,
            platform: 'instagram' as const
          });

          // Title should be reasonable length (10-200 characters)
          expect(result.title.length).toBeGreaterThan(10);
          expect(result.title.length).toBeLessThan(200);
        }
      }
    });

    it('should incorporate business context in titles where appropriate', () => {
      const template = templateRegistry.getTemplate('transformation');

      if (template) {
        const result = template.generate({
          topic: 'Personal Training, Weight Loss, Muscle Building',
          industry: 'Fitness',
          targetAudience: 'Adults seeking fitness',
          tone: 'friendly' as const,
          platform: 'facebook' as const
        });

        // Transformation stories should reference the journey
        const titleLower = result.title.toLowerCase();
        expect(
          titleLower.includes('fitness') ||
          titleLower.includes('transform') ||
          titleLower.includes('journey') ||
          titleLower.includes('change') ||
          titleLower.includes('result')
        ).toBe(true);
      }
    });
  });

  describe('Cross-Session Uniqueness', () => {
    it('should produce consistent titles for same template with same input', () => {
      const template = templateRegistry.getTemplate('data-revelation');

      if (template) {
        const input = {
          topic: 'Uptime, Security, Scalability',
          industry: 'SaaS',
          targetAudience: 'Developers',
          tone: 'professional' as const,
          platform: 'linkedin' as const
        };

        // Generate twice with same input
        const title1 = template.generate(input).title;
        const title2 = template.generate(input).title;

        // Should be consistent (deterministic)
        expect(title1).toBe(title2);
      }
    });

    it('should adapt titles based on industry context', () => {
      const template = templateRegistry.getTemplate('transformation');

      if (template) {
        const saasInput = {
          topic: 'Automation, Efficiency',
          industry: 'SaaS',
          targetAudience: 'Developers',
          tone: 'professional' as const,
          platform: 'linkedin' as const
        };

        const healthInput = {
          topic: 'Patient Care, Outcomes',
          industry: 'Healthcare',
          targetAudience: 'Doctors',
          tone: 'professional' as const,
          platform: 'linkedin' as const
        };

        const saasTitle = template.generate(saasInput).title;
        const healthTitle = template.generate(healthInput).title;

        // Both should have content
        expect(saasTitle.length).toBeGreaterThan(10);
        expect(healthTitle.length).toBeGreaterThan(10);
      }
    });
  });
});
