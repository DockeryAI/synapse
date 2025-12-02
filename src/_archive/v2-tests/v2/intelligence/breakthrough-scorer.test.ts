/**
 * Breakthrough Scorer Service Tests
 * Tests for all 11 factors, weighting, and explanations
 */

import { describe, it, expect } from 'vitest';
import {
  breakthroughScorerService,
  BreakthroughScorerService,
} from '../../../services/v2/intelligence/breakthrough-scorer.service';
import { ScoringInput, ScoringFactorId } from '../../../types/v2/scoring.types';

describe('BreakthroughScorerService', () => {
  const baseInput: ScoringInput = {
    content: {
      title: 'Test Content Title',
      hook: 'This is a test hook for the content',
      body: 'This is the main body of the test content with useful information.',
      cta: 'Take action now',
    },
    context: {},
  };

  describe('Basic Scoring', () => {
    it('should calculate a score with all 11 factors', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      expect(result.breakdown.factors).toHaveLength(11);
      expect(result.breakdown.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.totalScore).toBeLessThanOrEqual(100);
    });

    it('should assign a grade based on total score', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.breakdown.grade);
    });

    it('should include metadata', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      expect(result.metadata.scoringVersion).toBe('2.0.0');
      expect(result.metadata.inputFactors).toBe(11);
      expect(result.metadata.calculationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should generate unique IDs', () => {
      const result1 = breakthroughScorerService.calculateScore(baseInput);
      const result2 = breakthroughScorerService.calculateScore(baseInput);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('Factor Weights', () => {
    it('all factor weights should sum to approximately 1', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const weightSum = result.breakdown.factors.reduce((sum, f) => sum + f.weight, 0);

      expect(weightSum).toBeCloseTo(1, 2);
    });

    it('weighted scores should equal score * weight', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      result.breakdown.factors.forEach(factor => {
        expect(factor.weightedScore).toBeCloseTo(factor.score * factor.weight, 2);
      });
    });

    it('total score should equal sum of weighted scores', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const calculatedTotal = result.breakdown.factors.reduce(
        (sum, f) => sum + f.weightedScore,
        0
      );

      expect(result.breakdown.totalScore).toBe(Math.round(calculatedTotal));
    });
  });

  describe('Industry-Specific Weighting', () => {
    it('should apply insurance-specific weights', () => {
      const insuranceInput: ScoringInput = {
        ...baseInput,
        context: { industryId: 'insurance' },
      };
      const result = breakthroughScorerService.calculateScore(insuranceInput);

      // Insurance should have higher EQ match weight
      const eqFactor = result.breakdown.factors.find(f => f.id === 'eq_match');
      expect(eqFactor?.weight).toBeGreaterThan(0.12);
    });

    it('should apply SaaS-specific weights', () => {
      const saasInput: ScoringInput = {
        ...baseInput,
        context: { industryId: 'saas' },
      };
      const result = breakthroughScorerService.calculateScore(saasInput);

      // SaaS should have higher uniqueness weight
      const uniquenessFactor = result.breakdown.factors.find(f => f.id === 'uniqueness');
      expect(uniquenessFactor?.weight).toBeGreaterThan(0.12);
    });

    it('should normalize weights after industry overrides', () => {
      const insuranceInput: ScoringInput = {
        ...baseInput,
        context: { industryId: 'insurance' },
      };
      const result = breakthroughScorerService.calculateScore(insuranceInput);
      const weightSum = result.breakdown.factors.reduce((sum, f) => sum + f.weight, 0);

      expect(weightSum).toBeCloseTo(1, 2);
    });
  });

  describe('Individual Factor Scoring', () => {
    describe('Timing Factor', () => {
      it('should score higher with timing language', () => {
        const timingInput: ScoringInput = {
          content: {
            title: 'Limited Time Offer Today Only',
            hook: 'Act now before the deadline',
            body: 'This holiday season special ends soon',
            cta: 'Get it today',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(timingInput);
        const timingFactor = result.breakdown.factors.find(f => f.id === 'timing');

        expect(timingFactor?.score).toBeGreaterThan(60);
      });

      it('should score higher with seasonal triggers', () => {
        const seasonalInput: ScoringInput = {
          ...baseInput,
          signals: { seasonalTriggers: ['holiday season', 'new year'] },
        };
        const result = breakthroughScorerService.calculateScore(seasonalInput);
        const timingFactor = result.breakdown.factors.find(f => f.id === 'timing');

        expect(timingFactor?.score).toBeGreaterThan(65);
      });
    });

    describe('Uniqueness Factor', () => {
      it('should score higher with unique angle indicators', () => {
        const uniqueInput: ScoringInput = {
          content: {
            title: 'The Hidden Secret Nobody Talks About',
            hook: 'Contrarian view that challenges the myth',
            body: 'Unconventional approach that works',
            cta: 'Learn more',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(uniqueInput);
        const uniqueFactor = result.breakdown.factors.find(f => f.id === 'uniqueness');

        expect(uniqueFactor?.score).toBeGreaterThan(70);
      });

      it('should score lower with generic terms', () => {
        const genericInput: ScoringInput = {
          content: {
            title: 'Top Tips and Best Practices',
            hook: 'The ultimate guide to success',
            body: 'Follow these best practices',
            cta: 'Read more',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(genericInput);
        const uniqueFactor = result.breakdown.factors.find(f => f.id === 'uniqueness');

        expect(uniqueFactor?.score).toBeLessThan(60);
      });
    });

    describe('Validation Factor', () => {
      it('should score higher with data and numbers', () => {
        const dataInput: ScoringInput = {
          content: {
            title: 'How We Increased Revenue by 47%',
            hook: '83% of customers saw results in 30 days',
            body: 'Our case study shows 10x improvement for 500 customers',
            cta: 'See the data',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(dataInput);
        const validationFactor = result.breakdown.factors.find(f => f.id === 'validation');

        expect(validationFactor?.score).toBeGreaterThan(70);
      });
    });

    describe('EQ Match Factor', () => {
      it('should score higher with emotional triggers', () => {
        const eqInput: ScoringInput = {
          ...baseInput,
          context: { industryId: 'insurance' },
          eqProfile: {
            emotionalTriggers: { fear: 35, trust: 30, security: 35 },
            tonePreference: 'professional',
          },
        };
        const result = breakthroughScorerService.calculateScore(eqInput);
        const eqFactor = result.breakdown.factors.find(f => f.id === 'eq_match');

        expect(eqFactor?.score).toBeGreaterThan(65);
      });
    });

    describe('Market Gap Factor', () => {
      it('should score higher with problem-focused content', () => {
        const problemInput: ScoringInput = {
          content: {
            title: 'The Challenge Nobody Addresses',
            hook: 'Most struggle with this pain point',
            body: 'The frustration of missing this gap causes problems',
            cta: 'Solve your challenge',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(problemInput);
        const gapFactor = result.breakdown.factors.find(f => f.id === 'market_gap');

        expect(gapFactor?.score).toBeGreaterThan(65);
      });
    });

    describe('Audience Alignment Factor', () => {
      it('should score higher with audience context', () => {
        const audienceInput: ScoringInput = {
          content: {
            title: 'For Business Owners Only',
            hook: 'You know your teams struggle with this',
            body: 'Your business leaders need this solution',
            cta: 'Help your team',
          },
          context: {
            targetAudience: 'Business owners',
            customerSegment: 'SMB',
          },
        };
        const result = breakthroughScorerService.calculateScore(audienceInput);
        const audienceFactor = result.breakdown.factors.find(f => f.id === 'audience_alignment');

        expect(audienceFactor?.score).toBeGreaterThan(70);
      });
    });

    describe('Competitive Edge Factor', () => {
      it('should score higher with differentiation', () => {
        const diffInput: ScoringInput = {
          content: {
            title: 'Unlike Other Solutions',
            hook: 'Different approach that works better',
            body: 'We are the only unique first-to-market solution',
            cta: 'See the difference',
          },
          context: {},
          signals: { competitorContent: ['competitor A', 'competitor B'] },
        };
        const result = breakthroughScorerService.calculateScore(diffInput);
        const compFactor = result.breakdown.factors.find(f => f.id === 'competitive_edge');

        expect(compFactor?.score).toBeGreaterThan(70);
      });
    });

    describe('Trend Relevance Factor', () => {
      it('should score higher with trending topics', () => {
        const trendInput: ScoringInput = {
          ...baseInput,
          signals: { trendingTopics: ['AI', 'automation', '2025 trends'] },
        };
        const result = breakthroughScorerService.calculateScore(trendInput);
        const trendFactor = result.breakdown.factors.find(f => f.id === 'trend_relevance');

        expect(trendFactor?.score).toBeGreaterThan(70);
      });
    });

    describe('Engagement Potential Factor', () => {
      it('should score higher with engagement prompts', () => {
        const engageInput: ScoringInput = {
          content: {
            title: 'What Do You Think?',
            hook: 'Agree or disagree with this take?',
            body: 'Comment below and share your thoughts',
            cta: 'Tag someone who needs this',
          },
          context: {},
        };
        const result = breakthroughScorerService.calculateScore(engageInput);
        const engageFactor = result.breakdown.factors.find(f => f.id === 'engagement_potential');

        expect(engageFactor?.score).toBeGreaterThan(70);
      });
    });

    describe('Conversion Likelihood Factor', () => {
      it('should score higher with strong CTA', () => {
        const ctaInput: ScoringInput = {
          content: {
            title: 'Get Started Today',
            hook: 'Join thousands of customers',
            body: 'See results in 30 days',
            cta: 'Start your free trial and claim your discount',
          },
          context: { campaignGoal: 'trial signups' },
          eqProfile: { valueProposition: 'Save time and money' },
        };
        const result = breakthroughScorerService.calculateScore(ctaInput);
        const convFactor = result.breakdown.factors.find(f => f.id === 'conversion_likelihood');

        expect(convFactor?.score).toBeGreaterThan(75);
      });
    });

    describe('Brand Consistency Factor', () => {
      it('should score higher with brand context', () => {
        const brandInput: ScoringInput = {
          ...baseInput,
          context: { industryId: 'saas' },
          eqProfile: {
            tonePreference: 'professional',
            valueProposition: 'Streamline your workflow',
          },
        };
        const result = breakthroughScorerService.calculateScore(brandInput);
        const brandFactor = result.breakdown.factors.find(f => f.id === 'brand_consistency');

        expect(brandFactor?.score).toBeGreaterThan(80);
      });
    });
  });

  describe('Score Explanations', () => {
    it('should generate explanations for each factor', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      result.breakdown.factors.forEach(factor => {
        expect(factor.explanation).toBeDefined();
        expect(factor.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should generate improvement suggestions for low scores', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const lowScoreFactors = result.breakdown.factors.filter(f => f.score < 70);

      lowScoreFactors.forEach(factor => {
        expect(factor.improvementSuggestion).toBeDefined();
      });
    });

    it('should generate overall explanation', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      expect(result.breakdown.overallExplanation).toBeDefined();
      expect(result.breakdown.overallExplanation.length).toBeGreaterThan(0);
    });

    it('should identify strengths and weaknesses', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);

      expect(result.breakdown.strengths).toBeDefined();
      expect(result.breakdown.weaknesses).toBeDefined();
    });
  });

  describe('Grading System', () => {
    it('should assign A for scores >= 90', () => {
      // Create optimized content for high score
      const highInput: ScoringInput = {
        content: {
          title: 'Hidden Secret: New 2025 Trend Revealed',
          hook: 'Contrarian view - agree or disagree?',
          body: '83% of customers saw 10x results. Unlike others, we solved the pain problem. Case study with data proven results.',
          cta: 'Start your free trial now - comment below',
        },
        context: {
          industryId: 'saas',
          targetAudience: 'Business owners',
          customerSegment: 'SMB',
          platform: 'linkedin',
          campaignGoal: 'trial signups',
        },
        signals: {
          trendingTopics: ['AI automation', '2025'],
          competitorContent: ['competitor'],
          seasonalTriggers: ['new year'],
          historicalPerformance: 85,
        },
        eqProfile: {
          emotionalTriggers: { efficiency: 40, growth: 35, innovation: 25 },
          tonePreference: 'professional',
          valueProposition: 'Save time and scale faster',
        },
      };
      const result = breakthroughScorerService.calculateScore(highInput);

      expect(result.breakdown.totalScore).toBeGreaterThanOrEqual(80);
      expect(['A', 'B']).toContain(result.breakdown.grade);
    });
  });

  describe('Radar Chart Data', () => {
    it('should generate valid radar chart data', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const radarData = breakthroughScorerService.generateRadarChartData(result);

      expect(radarData.labels).toHaveLength(11);
      expect(radarData.datasets).toHaveLength(1);
      expect(radarData.datasets[0].data).toHaveLength(11);
    });
  });

  describe('Improvement Suggestions', () => {
    it('should return suggestions sorted by impact', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const suggestions = breakthroughScorerService.getImprovementSuggestions(result);

      if (suggestions.length > 1) {
        for (let i = 0; i < suggestions.length - 1; i++) {
          expect(suggestions[i].potentialGain).toBeGreaterThanOrEqual(
            suggestions[i + 1].potentialGain
          );
        }
      }
    });

    it('should include potential gain for each suggestion', () => {
      const result = breakthroughScorerService.calculateScore(baseInput);
      const suggestions = breakthroughScorerService.getImprovementSuggestions(result);

      suggestions.forEach(suggestion => {
        expect(suggestion.potentialGain).toBeGreaterThanOrEqual(0);
        expect(suggestion.factor).toBeDefined();
        expect(suggestion.suggestion).toBeDefined();
      });
    });
  });
});
