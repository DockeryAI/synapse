// PRD Feature: SYNAPSE-V6
/**
 * Psychology Analysis Example Test
 *
 * Demonstrates the 9 psychology principle analysis on VoC insights
 */

import { ContentPsychologyEngine, type VoCInsight } from '../generation/ContentPsychologyEngine';

describe('ContentPsychologyEngine - VoC Analysis', () => {
  let engine: ContentPsychologyEngine;

  beforeEach(() => {
    engine = new ContentPsychologyEngine();
  });

  it('should analyze a loss aversion VoC insight', () => {
    const vocInsight: VoCInsight = {
      id: 'voc-1',
      title: 'Customer Review',
      text: 'I was losing so much time manually doing this. My competitors were getting ahead of me and I was falling behind. So frustrated with wasting hours every week.',
    };

    const analysis = engine.analyzeVoCInsight(vocInsight);

    expect(analysis.insight_id).toBe('voc-1');
    expect(analysis.principle_scores).toHaveLength(9);
    expect(analysis.top_principles).toHaveLength(3);

    // Loss Aversion should score highly
    const lossAversion = analysis.principle_scores.find(p => p.principle === 'Loss Aversion');
    expect(lossAversion).toBeDefined();
    expect(lossAversion!.score).toBeGreaterThan(6);
    expect(lossAversion!.triggers.length).toBeGreaterThan(0);
    expect(lossAversion!.content_application).toContain('Don\'t let');

    console.log('Analysis Result:', JSON.stringify(analysis, null, 2));
  });

  it('should analyze a curiosity gap VoC insight', () => {
    const vocInsight: VoCInsight = {
      id: 'voc-2',
      title: 'Customer Question',
      text: 'I\'m wondering how other businesses are handling this? What is the secret to making this work? I don\'t understand why this is so confusing.',
    };

    const analysis = engine.analyzeVoCInsight(vocInsight);

    // Curiosity Gap should score highly
    const curiosity = analysis.top_principles[0];
    expect(curiosity.principle).toBe('Curiosity Gap');
    expect(curiosity.score).toBeGreaterThan(5);
    expect(curiosity.explanation).toContain('curiosity');
    expect(curiosity.triggers).toContain('Contains question that creates information gap');
  });

  it('should analyze a social proof VoC insight', () => {
    const vocInsight: VoCInsight = {
      id: 'voc-3',
      title: 'Industry Discussion',
      text: 'Everyone in our industry is doing this. All my colleagues recommended it. Most people in the industry use this approach and the reviews are great.',
    };

    const analysis = engine.analyzeVoCInsight(vocInsight);

    // Social Proof should score highly
    const socialProof = analysis.principle_scores.find(p => p.principle === 'Social Proof');
    expect(socialProof).toBeDefined();
    expect(socialProof!.score).toBeGreaterThan(6);
    expect(socialProof!.triggers).toContain('"everyone" references peer behavior');
  });

  it('should analyze batch of VoC insights', () => {
    const vocInsights: VoCInsight[] = [
      {
        id: 'voc-1',
        title: 'Loss Aversion Example',
        text: 'I\'m losing customers to competitors and missing out on opportunities.',
      },
      {
        id: 'voc-2',
        title: 'Scarcity Example',
        text: 'I need this done urgently, ASAP. The deadline is approaching quickly.',
      },
      {
        id: 'voc-3',
        title: 'Authority Example',
        text: 'Looking for expert advice with proven results backed by research and data.',
      },
    ];

    const batchAnalysis = engine.analyzeVoCInsightsBatch(vocInsights);

    expect(batchAnalysis.total_analyzed).toBe(3);
    expect(batchAnalysis.analyses).toHaveLength(3);
    expect(batchAnalysis.top_performers).toHaveLength(3);
    expect(batchAnalysis.average_psychology_score).toBeGreaterThan(0);
    expect(Object.keys(batchAnalysis.principle_frequency).length).toBeGreaterThan(0);
    expect(batchAnalysis.recommendations.length).toBeGreaterThan(0);

    console.log('Batch Analysis Result:', JSON.stringify(batchAnalysis, null, 2));
  });

  it('should prioritize insights by psychology score', () => {
    const vocInsights: VoCInsight[] = [
      {
        id: 'weak',
        title: 'Weak signal',
        text: 'This is okay.',
      },
      {
        id: 'strong',
        title: 'Strong signal',
        text: 'I\'m losing so much money! Everyone in my industry is already using this and I\'m falling behind. I urgently need proven expert advice with data-driven results.',
      },
    ];

    const batchAnalysis = engine.analyzeVoCInsightsBatch(vocInsights);

    // Strong signal should be first
    expect(batchAnalysis.analyses[0].insight_id).toBe('strong');
    expect(batchAnalysis.analyses[0].overall_psychology_score).toBeGreaterThan(
      batchAnalysis.analyses[1].overall_psychology_score
    );
  });
});
