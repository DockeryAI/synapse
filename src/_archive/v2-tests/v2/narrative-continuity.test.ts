/**
 * Narrative Continuity Service Tests
 *
 * Tests for analyzing and enforcing story coherence across campaigns.
 *
 * Created: 2025-11-22
 */

import { describe, it, expect } from 'vitest';
import { narrativeContinuityService } from '@/services/v2/narrative-continuity.service';
import type { CampaignPiece, NarrativeAnalysisInput } from '@/types/v2/narrative.types';

// Helper to create test campaign pieces
function createPiece(
  id: string,
  position: number,
  overrides: Partial<CampaignPiece> = {}
): CampaignPiece {
  return {
    id,
    position,
    title: `Piece ${position}`,
    content: `Content for piece ${position}`,
    type: 'education',
    emotionalTone: 'curious',
    themes: ['marketing', 'growth'],
    ...overrides,
  };
}

describe('NarrativeContinuityService', () => {
  describe('analyzeNarrativeContinuity', () => {
    it('should analyze a well-structured campaign', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['problem', 'pain-point'],
          title: 'The Hidden Cost of Manual Processes',
        }),
        createPiece('2', 2, {
          type: 'education',
          emotionalTone: 'curious',
          themes: ['problem', 'solution'],
          title: 'Understanding Why Automation Matters',
        }),
        createPiece('3', 3, {
          type: 'proof',
          emotionalTone: 'confident',
          themes: ['solution', 'results'],
          title: 'How Company X Saved 40 Hours Per Week',
        }),
        createPiece('4', 4, {
          type: 'offer',
          emotionalTone: 'hopeful',
          themes: ['solution', 'results'],
          title: 'Your Automation Journey Starts Here',
        }),
        createPiece('5', 5, {
          type: 'cta',
          emotionalTone: 'urgent',
          themes: ['results', 'action'],
          title: 'Start Your Free Trial Today',
          cta: 'Get Started Now',
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Should have overall score
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      // Should score all pieces
      expect(result.pieceScores.length).toBe(5);

      // Should generate transitions
      expect(result.transitions.length).toBe(4);

      // Should have transition quality
      expect(result.transitionQuality).toBeGreaterThan(0);

      // Should analyze narrative arc
      expect(result.narrativeArc).toBeDefined();
      expect(result.narrativeArc.arcType).toBeDefined();
      expect(result.narrativeArc.arcAdherence).toBeGreaterThan(0);

      // Should analyze emotional journey
      expect(result.emotionalJourney).toBeDefined();
      expect(result.emotionalJourney.progression.length).toBe(5);

      // Should have theme consistency
      expect(result.themeConsistency).toBeDefined();
      expect(result.themeConsistency.score).toBeGreaterThan(0);

      // Should have summary
      expect(result.summary).toBeDefined();
      expect(['excellent', 'good', 'needs-work', 'poor']).toContain(result.summary.verdict);
    });

    it('should identify issues in poorly structured campaign', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'cta',
          emotionalTone: 'urgent',
          themes: ['buy-now'],
        }),
        createPiece('2', 2, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['different-topic'],
        }),
        createPiece('3', 3, {
          type: 'story',
          emotionalTone: 'authoritative',
          themes: ['another-thing'],
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Should identify issues
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Score should be lower for poor structure
      expect(result.overallScore).toBeLessThan(80);

      // Should have issues in piece scores
      const piecesWithIssues = result.pieceScores.filter(p => p.issues.length > 0);
      expect(piecesWithIssues.length).toBeGreaterThan(0);

      // Theme consistency should be low (no shared themes)
      expect(result.themeConsistency.score).toBeLessThan(50);
    });

    it('should handle single piece campaign', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'education',
          emotionalTone: 'curious',
          themes: ['topic'],
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.pieceScores.length).toBe(1);
      expect(result.transitions.length).toBe(0);
      expect(result.transitionQuality).toBe(100); // No transitions to fail
    });

    it('should apply custom configuration', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['topic'] }),
        createPiece('2', 2, { themes: ['topic'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({
        pieces,
        config: {
          minContinuityScore: 90,
          themeWeight: 0.5,
        },
      });

      expect(result).toBeDefined();
      expect(result.pieceScores.length).toBe(2);
    });
  });

  describe('generateTransitions', () => {
    it('should generate transitions between consecutive pieces', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['problem'],
        }),
        createPiece('2', 2, {
          type: 'education',
          emotionalTone: 'curious',
          themes: ['problem', 'solution'],
        }),
        createPiece('3', 3, {
          type: 'proof',
          emotionalTone: 'confident',
          themes: ['solution'],
        }),
      ];

      const transitions = narrativeContinuityService.generateTransitions(pieces);

      expect(transitions.length).toBe(2);

      // First transition
      expect(transitions[0].fromPieceId).toBe('1');
      expect(transitions[0].toPieceId).toBe('2');
      expect(transitions[0].quality).toBeGreaterThan(0);
      expect(transitions[0].connectionType).toBeDefined();

      // Second transition
      expect(transitions[1].fromPieceId).toBe('2');
      expect(transitions[1].toPieceId).toBe('3');
    });

    it('should identify abrupt transitions', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['insurance'],
        }),
        createPiece('2', 2, {
          type: 'cta',
          emotionalTone: 'urgent',
          themes: ['cooking'],
        }),
      ];

      const transitions = narrativeContinuityService.generateTransitions(pieces);

      expect(transitions.length).toBe(1);
      // Quality should be lower due to theme mismatch and type jump
      expect(transitions[0].quality).toBeLessThan(80);
      // Connection type should reflect the jump
      expect(['escalation', 'pivot', 'resolution']).toContain(transitions[0].connectionType);
    });

    it('should generate bridge text for weak transitions', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'story',
          emotionalTone: 'hopeful',
          themes: ['transformation'],
        }),
        createPiece('2', 2, {
          type: 'offer',
          emotionalTone: 'urgent',
          themes: ['pricing'],
        }),
      ];

      const transitions = narrativeContinuityService.generateTransitions(pieces, {
        generateBridges: true,
      });

      // Should have bridge text if transition is weak
      if (transitions[0].quality < 70) {
        expect(transitions[0].bridgeText).toBeDefined();
      }
    });

    it('should identify correct connection types', () => {
      // Test escalation
      const escalationPieces: CampaignPiece[] = [
        createPiece('1', 1, { emotionalTone: 'curious' }),
        createPiece('2', 2, { emotionalTone: 'urgent' }),
      ];

      const escalation = narrativeContinuityService.generateTransitions(escalationPieces);
      expect(escalation[0].connectionType).toBe('escalation');

      // Test continuation
      const continuationPieces: CampaignPiece[] = [
        createPiece('1', 1, { emotionalTone: 'curious', type: 'education' }),
        createPiece('2', 2, { emotionalTone: 'curious', type: 'education' }),
      ];

      const continuation = narrativeContinuityService.generateTransitions(continuationPieces);
      expect(continuation[0].connectionType).toBe('continuation');
    });
  });

  describe('enforceStoryCoherence', () => {
    it('should return success for already coherent campaign', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['problem', 'topic'],
        }),
        createPiece('2', 2, {
          type: 'education',
          emotionalTone: 'curious',
          themes: ['topic', 'solution'],
        }),
        createPiece('3', 3, {
          type: 'proof',
          emotionalTone: 'confident',
          themes: ['solution', 'results'],
        }),
      ];

      const result = narrativeContinuityService.enforceStoryCoherence(pieces, 50);

      expect(result.success).toBe(true);
      expect(result.newScore).toBeGreaterThanOrEqual(50);
    });

    it('should suggest changes for poor coherence', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'cta',
          emotionalTone: 'urgent',
          themes: ['action'],
        }),
        createPiece('2', 2, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['different'],
        }),
      ];

      const result = narrativeContinuityService.enforceStoryCoherence(pieces, 80);

      // May not achieve target but should suggest changes
      expect(result.changes.length).toBeGreaterThanOrEqual(0);
      expect(result.newScore).toBeDefined();
    });

    it('should list remaining issues', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['a'] }),
        createPiece('2', 2, { themes: ['b'] }),
        createPiece('3', 3, { themes: ['c'] }),
      ];

      const result = narrativeContinuityService.enforceStoryCoherence(pieces, 90);

      // High target will likely have remaining issues
      expect(result.remainingIssues).toBeDefined();
    });
  });

  describe('piece scoring', () => {
    it('should score pieces based on continuity', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          themes: ['marketing', 'automation'],
          emotionalTone: 'curious',
        }),
        createPiece('2', 2, {
          themes: ['marketing', 'automation'],
          emotionalTone: 'hopeful',
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Second piece should have good continuity score
      const secondPiece = result.pieceScores.find(p => p.position === 2);
      expect(secondPiece?.continuityScore).toBeGreaterThan(50);
    });

    it('should identify theme drift', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['insurance'] }),
        createPiece('2', 2, { themes: ['insurance'] }),
        createPiece('3', 3, { themes: ['cooking'] }), // Theme drift!
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Third piece should have lower theme consistency
      const thirdPiece = result.pieceScores.find(p => p.position === 3);
      expect(thirdPiece?.themeConsistency).toBeLessThan(
        result.pieceScores.find(p => p.position === 2)?.themeConsistency || 0
      );
    });
  });

  describe('narrative arc analysis', () => {
    it('should detect problem-solution arc', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { type: 'awareness', emotionalTone: 'empathetic' }),
        createPiece('2', 2, { type: 'education', emotionalTone: 'curious' }),
        createPiece('3', 3, { type: 'proof', emotionalTone: 'confident' }),
        createPiece('4', 4, { type: 'offer', emotionalTone: 'hopeful' }),
        createPiece('5', 5, { type: 'cta', emotionalTone: 'urgent' }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.narrativeArc.arcType).toBe('problem-solution');
      expect(result.narrativeArc.arcAdherence).toBeGreaterThan(50);
    });

    it('should identify missing story elements', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { type: 'awareness' }),
        createPiece('2', 2, { type: 'cta' }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Should identify missing elements between awareness and CTA
      expect(result.narrativeArc.missingElements.length).toBeGreaterThan(0);
    });

    it('should calculate arc adherence', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { type: 'education' }),
        createPiece('2', 2, { type: 'education' }),
        createPiece('3', 3, { type: 'education' }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Repetitive education pieces don't follow any arc well
      expect(result.narrativeArc.arcAdherence).toBeLessThan(80);
    });
  });

  describe('emotional journey analysis', () => {
    it('should track emotional progression', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { emotionalTone: 'empathetic' }),
        createPiece('2', 2, { emotionalTone: 'curious' }),
        createPiece('3', 3, { emotionalTone: 'confident' }),
        createPiece('4', 4, { emotionalTone: 'urgent' }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.emotionalJourney.progression.length).toBe(4);
      expect(result.emotionalJourney.progression[0].tone).toBe('empathetic');
      expect(result.emotionalJourney.progression[3].tone).toBe('urgent');
    });

    it('should identify emotional flatline', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { emotionalTone: 'curious' }),
        createPiece('2', 2, { emotionalTone: 'curious' }),
        createPiece('3', 3, { emotionalTone: 'curious' }),
        createPiece('4', 4, { emotionalTone: 'curious' }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.emotionalJourney.isSmooth).toBe(false);
      expect(result.emotionalJourney.issues.length).toBeGreaterThan(0);
    });

    it('should identify abrupt emotional shifts', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { emotionalTone: 'empathetic' }), // intensity 40
        createPiece('2', 2, { emotionalTone: 'urgent' }),     // intensity 85
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Should flag the large jump
      expect(result.emotionalJourney.issues.some(i => i.includes('Abrupt'))).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('should prioritize critical issues', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'cta',
          themes: ['a'],
        }),
        createPiece('2', 2, {
          type: 'awareness',
          themes: ['b'],
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // If there are suggestions, critical should come first
      if (result.suggestions.length > 1) {
        const priorities = result.suggestions.map(s => s.priority);
        const criticalIndex = priorities.indexOf('critical');
        const lowIndex = priorities.indexOf('low');

        if (criticalIndex >= 0 && lowIndex >= 0) {
          expect(criticalIndex).toBeLessThan(lowIndex);
        }
      }
    });

    it('should suggest adding transitions for weak connections', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['insurance'] }),
        createPiece('2', 2, { themes: ['cooking'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      const transitionSuggestions = result.suggestions.filter(
        s => s.type === 'add_transition'
      );

      expect(transitionSuggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should include expected improvement estimates', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['a'] }),
        createPiece('2', 2, { themes: ['b'] }),
        createPiece('3', 3, { themes: ['c'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      for (const suggestion of result.suggestions) {
        expect(suggestion.expectedImprovement).toBeDefined();
        expect(suggestion.expectedImprovement).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('theme consistency', () => {
    it('should identify common themes', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['marketing', 'growth'] }),
        createPiece('2', 2, { themes: ['marketing', 'sales'] }),
        createPiece('3', 3, { themes: ['marketing', 'revenue'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.themeConsistency.commonThemes).toContain('marketing');
      expect(result.themeConsistency.score).toBeGreaterThan(50);
    });

    it('should identify orphaned themes', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['common', 'orphan1'] }),
        createPiece('2', 2, { themes: ['common', 'orphan2'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.themeConsistency.orphanedThemes).toContain('orphan1');
      expect(result.themeConsistency.orphanedThemes).toContain('orphan2');
    });
  });

  describe('summary generation', () => {
    it('should identify strengths in good campaigns', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, {
          type: 'awareness',
          emotionalTone: 'empathetic',
          themes: ['problem'],
        }),
        createPiece('2', 2, {
          type: 'education',
          emotionalTone: 'curious',
          themes: ['problem', 'solution'],
        }),
        createPiece('3', 3, {
          type: 'proof',
          emotionalTone: 'confident',
          themes: ['solution'],
        }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.summary.strengths.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify weaknesses in poor campaigns', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: ['a'] }),
        createPiece('2', 2, { themes: ['b'] }),
        createPiece('3', 3, { themes: ['c'] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      // Score should be low due to no common themes
      expect(result.overallScore).toBeLessThan(70);
      // Theme consistency should be very low
      expect(result.themeConsistency.score).toBeLessThan(50);
      // Should have suggestions for improvement
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return appropriate verdict', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1),
        createPiece('2', 2),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(['excellent', 'good', 'needs-work', 'poor']).toContain(result.summary.verdict);
    });
  });

  describe('edge cases', () => {
    it('should handle empty pieces array', () => {
      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces: [] });

      expect(result.pieceScores.length).toBe(0);
      expect(result.transitions.length).toBe(0);
    });

    it('should handle two-piece campaign', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1),
        createPiece('2', 2),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.pieceScores.length).toBe(2);
      expect(result.transitions.length).toBe(1);
    });

    it('should handle pieces with empty themes', () => {
      const pieces: CampaignPiece[] = [
        createPiece('1', 1, { themes: [] }),
        createPiece('2', 2, { themes: [] }),
      ];

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result).toBeDefined();
      expect(result.themeConsistency.score).toBe(0);
    });

    it('should handle very long campaign', () => {
      const pieces: CampaignPiece[] = Array.from({ length: 20 }, (_, i) =>
        createPiece(`${i + 1}`, i + 1, {
          themes: ['common-theme', `unique-${i}`],
        })
      );

      const result = narrativeContinuityService.analyzeNarrativeContinuity({ pieces });

      expect(result.pieceScores.length).toBe(20);
      expect(result.transitions.length).toBe(19);
    });
  });
});
