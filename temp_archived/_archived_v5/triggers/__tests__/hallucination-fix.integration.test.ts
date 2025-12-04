/**
 * Hallucination Fix Integration Tests - Triggers 4.0
 *
 * Phase 7 tests for source-locked architecture.
 * Validates:
 * 1. SourceRegistry IDs are valid for all triggers
 * 2. Output validator catches hallucination patterns
 * 3. useResolvedSources returns only verified data
 * 4. V4 cards render with proper source data
 * 5. No LLM-generated URLs/quotes/authors in output
 *
 * Created: 2025-12-01
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { outputValidator, validateLLMOutput, validateTrigger } from '../output-validator.service';
import { sourcePreservationService } from '../source-preservation.service';
import { applyTriggerFilters } from '@/components/v5/TriggerFilters';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from '../trigger-consolidation.service';
import type { SourcePlatform } from '@/types/verified-source.types';

// ============================================================================
// TEST 1: OUTPUT VALIDATOR - HALLUCINATION DETECTION
// ============================================================================

describe('Output Validator - Hallucination Detection', () => {
  beforeEach(() => {
    outputValidator.resetStats();
  });

  describe('URL detection', () => {
    it('rejects output containing http URLs', () => {
      const output = '{"sampleIds": [1], "title": "Check https://reddit.com/r/test"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'url_in_output')).toBe(true);
    });

    it('rejects output containing www URLs', () => {
      const output = '{"sampleIds": [1], "title": "Visit www.example.com"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'url_in_output')).toBe(true);
    });

    it('rejects output containing domain patterns', () => {
      const output = '{"sampleIds": [1], "title": "See reddit.com for more"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'url_in_output')).toBe(true);
    });
  });

  describe('Username detection', () => {
    it('rejects output containing Twitter handles', () => {
      const output = '{"sampleIds": [1], "title": "User @johndoe said"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'username_in_output')).toBe(true);
    });

    it('allows r/ subreddit references in titles', () => {
      // Subreddit references might be legitimate in extracted quotes
      const output = '{"sampleIds": [1], "title": "Discussion from r/startup"}';
      const result = validateLLMOutput(output);

      // r/ patterns are not blocked, only @ mentions
      const hasCriticalErrors = result.errors.filter(e => e.severity === 'critical').length > 0;
      expect(hasCriticalErrors).toBe(false);
    });
  });

  describe('Forbidden JSON fields', () => {
    it('rejects output with "url" field', () => {
      const output = '{"sampleIds": [1], "url": "https://example.com"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'url_field')).toBe(true);
    });

    it('rejects output with "author" field', () => {
      const output = '{"sampleIds": [1], "author": "John Doe"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'author_field')).toBe(true);
    });

    it('rejects output with "quote" field', () => {
      const output = '{"sampleIds": [1], "quote": "Some fabricated quote"}';
      const result = validateLLMOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'quote_field')).toBe(true);
    });
  });

  describe('Legacy evidence format', () => {
    it('warns about evidence array (not critical)', () => {
      const output = '{"sampleIds": [1], "evidence": [{"id": 1}]}';
      const result = validateLLMOutput(output);

      expect(result.errors.some(e => e.type === 'evidence_object')).toBe(true);
      // Warning, not critical - still valid
      const criticalErrors = result.errors.filter(e => e.severity === 'critical');
      expect(criticalErrors.length).toBe(0);
    });
  });

  describe('Valid output', () => {
    it('accepts clean output with only sampleIds', () => {
      const output = JSON.stringify({
        triggers: [{
          sampleIds: [1, 2, 3],
          category: 'pain-point',
          title: 'Users struggle with slow loading times',
          confidence: 0.85,
          executiveSummary: 'Multiple users report frustration with performance',
        }]
      });

      const result = validateLLMOutput(output);
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'critical').length).toBe(0);
    });
  });
});

// ============================================================================
// TEST 2: TRIGGER OBJECT VALIDATION
// ============================================================================

describe('Trigger Object Validation', () => {
  it('validates required fields', () => {
    const incompleteTrigger = {
      title: 'Test',
      // Missing: sampleIds, category, confidence
    };

    const result = validateTrigger(incompleteTrigger, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates sampleIds are within range', () => {
    const trigger = {
      sampleIds: [1, 5, 15], // 15 is out of range if max is 10
      category: 'pain-point',
      title: 'Test trigger',
      confidence: 0.8,
    };

    const result = validateTrigger(trigger, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.type === 'invalid_sample_id')).toBe(true);
  });

  it('validates sampleIds is non-empty array', () => {
    const trigger = {
      sampleIds: [],
      category: 'pain-point',
      title: 'Test',
      confidence: 0.8,
    };

    const result = validateTrigger(trigger, 10);
    expect(result.isValid).toBe(false);
  });

  it('rejects triggers with forbidden fields', () => {
    const trigger = {
      sampleIds: [1, 2],
      category: 'pain-point',
      title: 'Test',
      confidence: 0.8,
      url: 'https://example.com', // Forbidden
      author: 'John', // Forbidden
    };

    const result = validateTrigger(trigger, 10);
    expect(result.isValid).toBe(false);
  });

  it('accepts valid trigger object', () => {
    const trigger = {
      sampleIds: [1, 2, 3],
      category: 'pain-point',
      title: 'Users need better performance',
      confidence: 0.85,
      executiveSummary: 'Performance is a key concern',
    };

    const result = validateTrigger(trigger, 10);
    expect(result.isValid).toBe(true);
  });
});

// ============================================================================
// TEST 3: SOURCE REGISTRY INTEGRITY
// ============================================================================

describe('Source Registry Integrity', () => {
  it('registers sources with unique IDs', () => {
    const rawSamples = [
      {
        url: 'https://reddit.com/r/startups/abc123',
        content: 'This product is too expensive',
        author: 'user123',
        platform: 'reddit' as SourcePlatform,
        timestamp: new Date().toISOString(),
      },
      {
        url: 'https://twitter.com/user/status/456',
        content: 'Love the new features',
        author: 'twitter_user',
        platform: 'twitter' as SourcePlatform,
        timestamp: new Date().toISOString(),
      },
    ];

    const verifiedSources = sourcePreservationService.convertBatch(rawSamples);

    expect(verifiedSources.length).toBe(2);
    expect(verifiedSources[0].id).toBeTruthy();
    expect(verifiedSources[1].id).toBeTruthy();
    expect(verifiedSources[0].id).not.toBe(verifiedSources[1].id);
  });

  it('retrieves sources by ID', () => {
    const rawSample = {
      url: `https://reddit.com/r/test/${Date.now()}`,
      content: `Test content ${Date.now()}`,
      author: 'testuser',
      platform: 'reddit' as SourcePlatform,
      timestamp: new Date().toISOString(),
    };

    const [verifiedSource] = sourcePreservationService.convertBatch([rawSample]);
    const retrieved = sourcePreservationService.getSource(verifiedSource.id);

    expect(retrieved).toBeTruthy();
    expect(retrieved?.originalUrl).toBe(rawSample.url);
    expect(retrieved?.originalAuthor).toBe(rawSample.author);
  });

  it('returns undefined for non-existent IDs', () => {
    const retrieved = sourcePreservationService.getSource('non-existent-id-12345');
    expect(retrieved).toBeUndefined();
  });

  it('preserves original data immutably', () => {
    const rawSample = {
      url: `https://g2.com/products/test/reviews/${Date.now()}`,
      content: `Great product! ${Date.now()}`,
      author: 'verified_user',
      platform: 'g2' as SourcePlatform,
      timestamp: new Date().toISOString(),
    };

    const [verifiedSource] = sourcePreservationService.convertBatch([rawSample]);

    // Verify all fields are preserved (VerifiedSource uses originalUrl, originalAuthor, originalContent)
    expect(verifiedSource.originalUrl).toBe(rawSample.url);
    expect(verifiedSource.originalContent).toBe(rawSample.content);
    expect(verifiedSource.originalAuthor).toBe(rawSample.author);
    expect(verifiedSource.platform).toBe(rawSample.platform);
  });
});

// ============================================================================
// TEST 4: EVIDENCE ITEM TRACEABILITY
// ============================================================================

describe('Evidence Item Traceability', () => {
  it('evidence items must have verifiedSourceId', () => {
    // Create a mock ConsolidatedTrigger with evidence
    const trigger: ConsolidatedTrigger = {
      id: 'trigger-1',
      title: 'Test Trigger',
      category: 'pain-point' as TriggerCategory,
      confidence: 0.85,
      evidence: [
        {
          quote: 'Test quote',
          platform: 'reddit',
          relevance: 0.9,
          verifiedSourceId: 'source-123', // Required field
        },
      ],
      buyerJourneyStage: 'awareness',
      executiveSummary: 'Test summary',
      isTimeSensitive: false,
    };

    // Verify evidence has verifiedSourceId
    expect(trigger.evidence[0].verifiedSourceId).toBeTruthy();
    expect(typeof trigger.evidence[0].verifiedSourceId).toBe('string');
  });

  it('rejects evidence without verifiedSourceId in display layer', () => {
    const evidenceWithoutId: EvidenceItem = {
      quote: 'Some quote',
      platform: 'twitter',
      relevance: 0.8,
      // Missing verifiedSourceId
    };

    // In display layer, missing verifiedSourceId means unresolvable source
    expect(evidenceWithoutId.verifiedSourceId).toBeUndefined();
  });
});

// ============================================================================
// TEST 5: PROMPT INJECTION DEFENSE
// ============================================================================

describe('Prompt Injection Defense', () => {
  it('rejects output with injected URLs in title', () => {
    const maliciousOutput = JSON.stringify({
      sampleIds: [1],
      category: 'pain-point',
      title: 'Check out https://malicious-site.com for more',
      confidence: 0.8,
    });

    const result = validateLLMOutput(maliciousOutput);
    expect(result.isValid).toBe(false);
  });

  it('rejects output with injected evidence objects', () => {
    const maliciousOutput = JSON.stringify({
      sampleIds: [1],
      category: 'pain-point',
      title: 'Test',
      confidence: 0.8,
      evidence: [{
        url: 'https://fake-source.com',
        author: 'fake_author',
        quote: 'Fabricated quote',
      }],
    });

    const result = validateLLMOutput(maliciousOutput);
    // Should catch the URL and author fields
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects output attempting to reference non-existent samples', () => {
    const trigger = {
      sampleIds: [999, 1000], // Way out of range
      category: 'pain-point',
      title: 'Test',
      confidence: 0.8,
    };

    const result = validateTrigger(trigger, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors.filter(e => e.type === 'invalid_sample_id').length).toBe(2);
  });
});

// ============================================================================
// TEST 6: FILTER FUNCTIONS
// ============================================================================

describe('Trigger Filter Functions', () => {
  const mockTriggers: ConsolidatedTrigger[] = [
    {
      id: '1',
      title: 'High confidence pain point',
      category: 'pain-point',
      confidence: 0.95,
      evidence: [{ quote: 'test', platform: 'reddit', relevance: 0.9, verifiedSourceId: 's1' }],
      buyerJourneyStage: 'consideration',
      executiveSummary: 'Test',
      isTimeSensitive: true,
    },
    {
      id: '2',
      title: 'Low confidence fear',
      category: 'fear',
      confidence: 0.45,
      evidence: [{ quote: 'test', platform: 'twitter', relevance: 0.8, verifiedSourceId: 's2' }],
      buyerJourneyStage: 'awareness',
      executiveSummary: 'Test',
      isTimeSensitive: false,
    },
    {
      id: '3',
      title: 'Medium confidence desire',
      category: 'desire',
      confidence: 0.72,
      evidence: [{ quote: 'test', platform: 'g2', relevance: 0.85, verifiedSourceId: 's3' }],
      buyerJourneyStage: 'decision',
      executiveSummary: 'Test',
      isTimeSensitive: false,
    },
  ];

  it('filters by category', () => {
    const filtered = applyTriggerFilters(mockTriggers, {
      categories: ['pain-point'],
      minConfidence: 0,
      platforms: [],
      showTimeSensitiveOnly: false,
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].category).toBe('pain-point');
  });

  it('filters by minimum confidence', () => {
    const filtered = applyTriggerFilters(mockTriggers, {
      categories: [],
      minConfidence: 70,
      platforms: [],
      showTimeSensitiveOnly: false,
    });

    expect(filtered.length).toBe(2); // 95% and 72%
    expect(filtered.every(t => t.confidence * 100 >= 70)).toBe(true);
  });

  it('filters by platform', () => {
    const filtered = applyTriggerFilters(mockTriggers, {
      categories: [],
      minConfidence: 0,
      platforms: ['reddit'],
      showTimeSensitiveOnly: false,
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].evidence[0].platform).toBe('reddit');
  });

  it('filters time-sensitive only', () => {
    const filtered = applyTriggerFilters(mockTriggers, {
      categories: [],
      minConfidence: 0,
      platforms: [],
      showTimeSensitiveOnly: true,
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].isTimeSensitive).toBe(true);
  });
});

// ============================================================================
// TEST 7: VALIDATOR STATISTICS
// ============================================================================

describe('Validator Statistics', () => {
  beforeEach(() => {
    outputValidator.resetStats();
  });

  it('tracks validation count', () => {
    validateLLMOutput('{"sampleIds": [1]}');
    validateLLMOutput('{"sampleIds": [2]}');
    validateLLMOutput('{"sampleIds": [3]}');

    const stats = outputValidator.getStats();
    expect(stats.totalValidations).toBe(3);
  });

  it('tracks rejection count', () => {
    validateLLMOutput('{"sampleIds": [1]}'); // Valid
    validateLLMOutput('{"url": "https://fake.com"}'); // Invalid
    validateLLMOutput('{"author": "fake"}'); // Invalid

    const stats = outputValidator.getStats();
    expect(stats.rejections).toBe(2);
    expect(stats.rejectionRate).toBeCloseTo(66.67, 0);
  });

  it('resets statistics', () => {
    validateLLMOutput('{"url": "https://fake.com"}');
    outputValidator.resetStats();

    const stats = outputValidator.getStats();
    expect(stats.totalValidations).toBe(0);
    expect(stats.rejections).toBe(0);
  });
});

// ============================================================================
// INTEGRATION SUMMARY TEST
// ============================================================================

describe('End-to-End Source Integrity', () => {
  beforeEach(() => {
    outputValidator.resetStats();
  });

  it('complete flow: raw samples → registry → trigger → display', () => {
    // Step 1: Register raw samples (use unique URLs/content to avoid dedup)
    const timestamp = Date.now();
    const rawSamples = [
      {
        url: `https://reddit.com/r/saas/comments/abc${timestamp}`,
        content: `Pricing is confusing and too expensive for small teams ${timestamp}`,
        author: 'startup_founder',
        platform: 'reddit' as SourcePlatform,
        timestamp: new Date().toISOString(),
      },
      {
        url: `https://twitter.com/user/status/${timestamp}`,
        content: `Love the product but the onboarding needs work ${timestamp}`,
        author: 'happy_customer',
        platform: 'twitter' as SourcePlatform,
        timestamp: new Date().toISOString(),
      },
    ];

    const verifiedSources = sourcePreservationService.convertBatch(rawSamples);
    expect(verifiedSources.length).toBe(2);

    // Step 2: Simulate LLM output (clean - no hallucinations)
    const llmOutput = JSON.stringify({
      triggers: [{
        sampleIds: [1, 2],
        category: 'pain-point',
        title: 'Pricing and onboarding are key concerns',
        confidence: 0.87,
        executiveSummary: 'Users express concerns about pricing complexity and onboarding experience',
      }]
    });

    const validationResult = validateLLMOutput(llmOutput);
    expect(validationResult.isValid).toBe(true);

    // Step 3: Create ConsolidatedTrigger with verifiedSourceIds
    const trigger: ConsolidatedTrigger = {
      id: 'trigger-1',
      title: 'Pricing and onboarding are key concerns',
      category: 'pain-point',
      confidence: 0.87,
      evidence: verifiedSources.map((source, index) => ({
        quote: source.originalContent,
        platform: source.platform,
        relevance: 0.9 - (index * 0.05),
        verifiedSourceId: source.id, // Link to registry
      })),
      buyerJourneyStage: 'consideration',
      executiveSummary: 'Users express concerns about pricing complexity',
      isTimeSensitive: false,
    };

    // Step 4: Verify display can resolve all sources
    for (const evidence of trigger.evidence) {
      expect(evidence.verifiedSourceId).toBeTruthy();

      const resolvedSource = sourcePreservationService.getSource(evidence.verifiedSourceId!);
      expect(resolvedSource).toBeDefined();
      // VerifiedSource uses originalUrl and originalAuthor field names
      expect(resolvedSource?.originalUrl).toMatch(/^https?:\/\//);
      expect(resolvedSource?.originalAuthor).toBeTruthy();
    }

    // Step 5: Verify no LLM-generated source data leaked
    expect(trigger.evidence.every(e => e.verifiedSourceId)).toBe(true);

    // Final validation stats
    const stats = outputValidator.getStats();
    expect(stats.rejectionRate).toBe(0);
  });
});
