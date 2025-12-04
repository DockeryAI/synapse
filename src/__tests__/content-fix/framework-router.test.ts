/**
 * Framework Router Service Tests
 *
 * Tests framework routing and guideline generation
 */

import { describe, it, expect } from 'vitest';
import { frameworkRouter } from '@/services/content/FrameworkRouter.service';
import { frameworkLibrary } from '@/services/synapse-v6/generation/ContentFrameworkLibrary';
import type { DataPoint } from '@/types/connections.types';

describe('FrameworkRouter', () => {
  const sampleDataPoints: DataPoint[] = [
    {
      id: '1',
      source: 'serper',
      content: 'Great service and friendly staff',
      type: 'sentiment',
      metadata: { sentiment: 'positive' },
      createdAt: new Date()
    }
  ];

  describe('buildGenerationGuidelines', () => {
    it('should extract all stages from framework', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidelines = frameworkRouter.buildGenerationGuidelines(aidaFramework);

      expect(guidelines.framework).toBe(aidaFramework);
      expect(guidelines.stageGuidelines.size).toBeGreaterThan(0);
      expect(guidelines.stageGuidelines.has('Attention')).toBe(true);
    });

    it('should extract psychology principles', () => {
      const pasFramework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const guidelines = frameworkRouter.buildGenerationGuidelines(pasFramework);

      expect(guidelines.psychologyPrinciples.length).toBeGreaterThan(0);
      expect(guidelines.psychologyPrinciples.some(p => p.includes('Loss Aversion'))).toBe(true);
    });

    it('should determine appropriate CTA style', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidelines = frameworkRouter.buildGenerationGuidelines(aidaFramework);

      expect(guidelines.ctaStyle).toBeDefined();
      expect(typeof guidelines.ctaStyle).toBe('string');
    });
  });

  describe('routeTitleGeneration', () => {
    it('should generate title guidance for AIDA framework', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidance = frameworkRouter.routeTitleGeneration({
        dataPoints: sampleDataPoints,
        framework: aidaFramework,
        customerFocus: true
      });

      expect(guidance).toContain('Title Framework');
      expect(guidance).toContain('AIDA');
      expect(guidance).toContain('Attention');
    });

    it('should include customer focus reminders when requested', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidance = frameworkRouter.routeTitleGeneration({
        dataPoints: sampleDataPoints,
        framework: aidaFramework,
        customerFocus: true
      });

      expect(guidance).toContain('CUSTOMER FOCUS');
      expect(guidance).toContain('customers');
      expect(guidance.toLowerCase()).toContain('not business owners');
    });

    it('should include example formulas if available', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidance = frameworkRouter.routeTitleGeneration({
        dataPoints: sampleDataPoints,
        framework: aidaFramework,
        customerFocus: false
      });

      // AIDA has example formulas in its first stage
      expect(guidance).toContain('Formula');
    });
  });

  describe('routeSynapseGeneration', () => {
    it('should return all required guidance sections', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const routing = frameworkRouter.routeSynapseGeneration(
        sampleDataPoints,
        aidaFramework
      );

      expect(routing.titleGuidance).toBeDefined();
      expect(routing.hookGuidance).toBeDefined();
      expect(routing.bodyGuidance).toBeDefined();
      expect(routing.ctaGuidance).toBeDefined();
      expect(routing.psychologyPrinciples).toBeDefined();
    });

    it('should include psychology principles', () => {
      const pasFramework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const routing = frameworkRouter.routeSynapseGeneration(
        sampleDataPoints,
        pasFramework
      );

      expect(routing.psychologyPrinciples.length).toBeGreaterThan(0);
    });

    it('should structure body guidance with multiple stages', () => {
      const babFramework = frameworkLibrary.getFramework('before-after-bridge')!;
      const routing = frameworkRouter.routeSynapseGeneration(
        sampleDataPoints,
        babFramework
      );

      expect(routing.bodyGuidance).toContain('Before');
      expect(routing.bodyGuidance).toContain('After');
    });
  });

  describe('routeClusterNaming', () => {
    it('should provide problem-focused naming for negative sentiment', () => {
      const problemDataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Terrible wait times',
          type: 'pain_point',
          metadata: { sentiment: 'negative' },
          createdAt: new Date()
        }
      ];

      const pasFramework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const guidance = frameworkRouter.routeClusterNaming(problemDataPoints, pasFramework);

      expect(guidance).toContain('Customer Pain');
      expect(guidance).toContain('SPECIFIC');
      expect(guidance).toContain('customer perspective');
    });

    it('should provide benefit-focused naming for positive sentiment', () => {
      const positiveDataPoints: DataPoint[] = [
        {
          id: '1',
          source: 'serper',
          content: 'Love the fresh ingredients',
          type: 'sentiment',
          metadata: { sentiment: 'positive' },
          createdAt: new Date()
        }
      ];

      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const guidance = frameworkRouter.routeClusterNaming(positiveDataPoints, aidaFramework);

      expect(guidance).toContain('Benefit');
      expect(guidance).toBeDefined();
    });

    it('should enforce specificity requirements', () => {
      const pasFramework = frameworkLibrary.getFramework('problem-agitate-solution')!;
      const guidance = frameworkRouter.routeClusterNaming(sampleDataPoints, pasFramework);

      expect(guidance.toLowerCase()).toContain('specific');
      expect(guidance).toContain('NOT generic');
    });
  });

  describe('attachMetadata', () => {
    it('should create complete metadata object', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const metadata = frameworkRouter.attachMetadata(aidaFramework, 0.85);

      expect(metadata.frameworkId).toBe('aida');
      expect(metadata.frameworkName).toBe('AIDA (Attention-Interest-Desire-Action)');
      expect(metadata.confidence).toBe(0.85);
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.channel).toBe('social');
    });
  });

  describe('formatForPrompt', () => {
    it('should format complete prompt injection', () => {
      const aidaFramework = frameworkLibrary.getFramework('aida')!;
      const routing = frameworkRouter.routeSynapseGeneration(
        sampleDataPoints,
        aidaFramework
      );

      const formatted = frameworkRouter.formatForPrompt(routing, aidaFramework);

      expect(formatted).toContain('CONTENT FRAMEWORK');
      expect(formatted).toContain('AIDA');
      expect(formatted).toContain('Title Generation');
      expect(formatted).toContain('Hook/Opening');
      expect(formatted).toContain('Body Structure');
      expect(formatted).toContain('Call-to-Action');
      expect(formatted).toContain('Psychology Principles');
    });
  });
});
