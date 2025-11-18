/**
 * Multi-Model Orchestrator Service Tests
 *
 * Tests for 3-tier AI orchestration system (Haiku → Sonnet → Opus)
 *
 * Created: 2025-11-18
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiOrchestrator, AI_MODELS } from '@/services/ai/multi-model-orchestrator.service';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token' } }
      }))
    }
  }
}));

// Mock global fetch
global.fetch = vi.fn();

describe('MultiModelOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              dataPoints: ['test'],
              sources: ['test'],
              raw: {}
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      })
    });
  });

  describe('extract', () => {
    it('should extract data using Haiku model', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                dataPoints: ['value1', 'value2', 'value3'],
                sources: ['website', 'reviews'],
                raw: { additional: 'data' }
              })
            }
          }],
          usage: {
            prompt_tokens: 150,
            completion_tokens: 250,
            total_tokens: 400
          }
        })
      });

      const result = await aiOrchestrator.extract(
        'Extract value propositions',
        'Business: Acme Corp'
      );

      // Should return successful response
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.dataPoints).toBeDefined();
      expect(Array.isArray(result.content.dataPoints)).toBe(true);

      // Should use Haiku model
      expect(result.model).toBe(AI_MODELS.HAIKU);

      // Should track usage and cost
      expect(result.usage).toBeDefined();
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(result.usage.completionTokens).toBeGreaterThan(0);
      expect(result.usage.estimatedCost).toBeGreaterThan(0);

      // Should track latency
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should handle extraction errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await aiOrchestrator.extract('Extract data');

      // Should return error response
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('analyze', () => {
    it('should analyze data using Sonnet model', async () => {
      const extractedData = {
        dataPoints: ['value1', 'value2'],
        sources: ['website'],
        raw: {}
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                structured: {
                  categories: ['cat1', 'cat2']
                },
                patterns: ['pattern1', 'pattern2'],
                confidence: 85,
                reasoning: 'Analysis explanation'
              })
            }
          }],
          usage: {
            prompt_tokens: 200,
            completion_tokens: 400,
            total_tokens: 600
          }
        })
      });

      const result = await aiOrchestrator.analyze(
        extractedData,
        'Analyze the extracted data'
      );

      // Should return successful response
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.structured).toBeDefined();
      expect(result.content.patterns).toBeDefined();
      expect(result.content.confidence).toBeDefined();
      expect(result.content.reasoning).toBeDefined();

      // Should use Sonnet model
      expect(result.model).toBe(AI_MODELS.SONNET);

      // Confidence should be in valid range
      expect(result.content.confidence).toBeGreaterThanOrEqual(0);
      expect(result.content.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle analysis errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const extractedData = {
        dataPoints: ['test'],
        sources: ['test'],
        raw: {}
      };

      const result = await aiOrchestrator.analyze(extractedData, 'Analyze');

      // Should return error response
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('synthesize', () => {
    it('should synthesize results using Opus model', async () => {
      const analysisResult = {
        structured: { data: 'analyzed' },
        patterns: ['pattern1'],
        confidence: 90,
        reasoning: 'Analysis complete'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                final: {
                  synthesized: 'result',
                  polished: true
                },
                validation: {
                  passed: true,
                  issues: [],
                  confidence: 95
                }
              })
            }
          }],
          usage: {
            prompt_tokens: 300,
            completion_tokens: 600,
            total_tokens: 900
          }
        })
      });

      const result = await aiOrchestrator.synthesize(
        analysisResult,
        'Synthesize final output'
      );

      // Should return successful response
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.final).toBeDefined();
      expect(result.content.validation).toBeDefined();

      // Should use Opus model
      expect(result.model).toBe(AI_MODELS.OPUS);

      // Validation should have required structure
      expect(result.content.validation).toHaveProperty('passed');
      expect(result.content.validation).toHaveProperty('issues');
      expect(result.content.validation).toHaveProperty('confidence');

      // Should be most expensive tier
      expect(result.usage.estimatedCost).toBeGreaterThan(0);
    });

    it('should handle invalid JSON responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This is not valid JSON'
            }
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300
          }
        })
      });

      const analysisResult = {
        structured: {},
        patterns: [],
        confidence: 50,
        reasoning: 'test'
      };

      const result = await aiOrchestrator.synthesize(analysisResult, 'Synthesize');

      // Should handle error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('runFullPipeline', () => {
    it('should execute all 3 tiers successfully', async () => {
      let callCount = 0;

      (global.fetch as any).mockImplementation(async () => {
        callCount++;

        // Tier 1: Extract
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: JSON.stringify({
                    dataPoints: ['extracted1', 'extracted2'],
                    sources: ['source1'],
                    raw: { tier: 1 }
                  })
                }
              }],
              usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
            })
          };
        }

        // Tier 2: Analyze
        if (callCount === 2) {
          return {
            ok: true,
            json: async () => ({
              choices: [{
                message: {
                  content: JSON.stringify({
                    structured: { analyzed: true },
                    patterns: ['pattern1'],
                    confidence: 85,
                    reasoning: 'Analysis complete'
                  })
                }
              }],
              usage: { prompt_tokens: 200, completion_tokens: 400, total_tokens: 600 }
            })
          };
        }

        // Tier 3: Synthesize
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  final: { result: 'synthesized' },
                  validation: {
                    passed: true,
                    issues: [],
                    confidence: 95
                  }
                })
              }
            }],
            usage: { prompt_tokens: 300, completion_tokens: 600, total_tokens: 900 }
          })
        };
      });

      const result = await aiOrchestrator.runFullPipeline(
        'Extract data',
        'Analyze patterns',
        'Synthesize output',
        'Context: Business data'
      );

      // Should complete all 3 stages
      expect(callCount).toBe(3);

      // Should have result
      expect(result.result).toBeDefined();

      // Should have stage results
      expect(result.stages).toBeDefined();
      expect(result.stages.extract).toBeDefined();
      expect(result.stages.analyze).toBeDefined();
      expect(result.stages.synthesize).toBeDefined();

      // Should calculate total cost and latency
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.totalLatency).toBeGreaterThan(0);

      // All stages should be successful
      expect(result.stages.extract.success).toBe(true);
      expect(result.stages.analyze.success).toBe(true);
      expect(result.stages.synthesize.success).toBe(true);
    });

    it('should fail gracefully if extraction fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Error'
      });

      const result = await aiOrchestrator.runFullPipeline(
        'Extract',
        'Analyze',
        'Synthesize'
      );

      // Should have error in extraction stage
      expect(result.stages.extract.success).toBe(false);

      // Result should be null due to failure
      expect(result.result).toBeNull();
    });

    it('should calculate costs correctly across tiers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                dataPoints: ['test'],
                sources: ['test'],
                raw: {},
                structured: {},
                patterns: [],
                confidence: 50,
                reasoning: 'test',
                final: {},
                validation: { passed: true, issues: [], confidence: 50 }
              })
            }
          }],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 500,
            total_tokens: 1500
          }
        })
      });

      const result = await aiOrchestrator.runFullPipeline(
        'Extract',
        'Analyze',
        'Synthesize'
      );

      // Should have cost breakdown
      expect(result.stages.extract.usage.estimatedCost).toBeGreaterThan(0);
      expect(result.stages.analyze.usage.estimatedCost).toBeGreaterThan(0);
      expect(result.stages.synthesize.usage.estimatedCost).toBeGreaterThan(0);

      // Total cost should sum stages
      const expectedTotal =
        result.stages.extract.usage.estimatedCost +
        result.stages.analyze.usage.estimatedCost +
        result.stages.synthesize.usage.estimatedCost;

      expect(result.totalCost).toBeCloseTo(expectedTotal, 6);

      // Opus (tier 3) should be most expensive
      expect(result.stages.synthesize.usage.estimatedCost)
        .toBeGreaterThan(result.stages.extract.usage.estimatedCost);
      expect(result.stages.synthesize.usage.estimatedCost)
        .toBeGreaterThan(result.stages.analyze.usage.estimatedCost);
    });
  });
});
