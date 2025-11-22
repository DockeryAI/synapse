/**
 * Test script for EQ Calculator v2 integration
 * Tests the improved emotional resonance scoring in Week4Orchestrator
 */

import { Week4Orchestrator } from '../src/services/v2/integration/Week4Orchestrator';
import type { ExtractionResult } from '../src/types/v2/extractor.types';

async function testEQIntegration() {
  console.log('\n========================================');
  console.log('Testing EQ Calculator v2 Integration');
  console.log('========================================\n');

  const orchestrator = new Week4Orchestrator({
    synthesisMode: 'STANDARD' as any,
    qualityThreshold: 70,
    autoEnhance: true,
    enableCacheWarming: false,
  });

  // Phoenix Insurance test data
  const brandId = 'phoenix-insurance';

  // Simulated extraction results with collector car specialty
  const extractionResults: ExtractionResult[] = [
    {
      extractorId: 'product-service',
      data: {
        products: ['Collector Car Insurance', 'Exotic Vehicle Coverage'],
        services: ['Agreed Value Coverage', 'Track Day Protection'],
        specialty: 'collector car insurance',
      },
      confidence: {
        overall: 0.85,
        dataPoints: 4,
      },
      metadata: {
        extractorId: 'product',
        timestamp: Date.now(),
        version: '2.0',
      },
    },
    {
      extractorId: 'customer-segments',
      data: {
        segments: ['Classic Car Collectors', 'Exotic Car Enthusiasts'],
        demographics: ['High Net Worth Individuals', 'Car Show Participants'],
      },
      confidence: {
        overall: 0.82,
        dataPoints: 4,
      },
      metadata: {
        extractorId: 'customer',
        timestamp: Date.now(),
        version: '2.0',
      },
    },
    {
      extractorId: 'benefits',
      data: {
        functional: ['Comprehensive Protection', 'Agreed Value Coverage'],
        emotional: ['Peace of Mind', 'Passion Protection'],
        social: ['Collector Community Recognition', 'Show Ready Coverage'],
      },
      confidence: {
        overall: 0.78,
        dataPoints: 6,
      },
      metadata: {
        extractorId: 'benefits',
        timestamp: Date.now(),
        version: '2.0',
      },
    },
  ];

  // Website analysis data
  const websiteAnalysis = {
    domain: 'phoenixinsurance.com',
    keyMessages: [
      'Texas-based collector and exotic car insurance specialists',
      'Protecting automotive passions since 1985',
      'Coverage that understands your investment',
    ],
  };

  const industryContext = {
    industryName: 'Specialty Auto Insurance',
    naicsCode: '524126',
  };

  try {
    console.log('🚀 Starting orchestration with EQ v2...\n');

    const result = await orchestrator.orchestrate(
      brandId,
      extractionResults,
      {
        sessionId: 'test-eq-v2',
        industryContext,
        websiteAnalysis,
      }
    );

    console.log('✅ Orchestration complete!\n');

    // Display quality scores
    console.log('📊 Quality Scores:');
    console.log('─────────────────');
    console.log(`Overall Score: ${result.quality.overall}%`);

    if (result.quality.metrics) {
      console.log(`\nDetailed Metrics:`);
      console.log(`  • Clarity: ${result.quality.metrics.clarity?.score || 'N/A'}%`);
      console.log(`  • Coherence: ${result.quality.metrics.coherence?.score || 'N/A'}%`);
      console.log(`  • Completeness: ${result.quality.metrics.completeness?.score || 'N/A'}%`);
      console.log(`  • Confidence: ${result.quality.metrics.confidence?.score || 'N/A'}%`);
      console.log(`  • Emotional Resonance (EQ v2): ${result.quality.metrics.emotional_resonance?.score || 'N/A'}%`);

      // Highlight if EQ v2 score is good for collector cars
      const eqScore = result.quality.metrics.emotional_resonance?.score || 0;
      if (eqScore >= 70) {
        console.log(`\n  🎯 Excellent emotional resonance for collector car specialty!`);
      } else if (eqScore >= 60) {
        console.log(`\n  ✅ Good emotional resonance`);
      } else {
        console.log(`\n  ⚠️ Lower than expected emotional resonance`);
      }
    }

    // Display synthesized UVP
    console.log('\n📝 Synthesized UVP:');
    console.log('─────────────────');
    console.log(`Primary: ${result.synthesis.uvp.primary}`);

    if (result.synthesis.uvp.secondary?.length) {
      console.log(`\nSecondary Statements:`);
      result.synthesis.uvp.secondary.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
    }

    // Display framework components if present
    if (result.synthesis.uvp.jobToBeDone) {
      console.log('\n🎯 Jobs-to-be-Done:');
      console.log(`  Statement: ${result.synthesis.uvp.jobToBeDone.statement}`);
    }

    if (result.synthesis.uvp.goldenCircle) {
      console.log('\n⭕ Golden Circle:');
      console.log(`  WHY: ${result.synthesis.uvp.goldenCircle.why}`);
      console.log(`  HOW: ${result.synthesis.uvp.goldenCircle.how}`);
      console.log(`  WHAT: ${result.synthesis.uvp.goldenCircle.what}`);
    }

    // Display processing metadata
    console.log('\n⏱️ Processing Times:');
    console.log('─────────────────');
    console.log(`Total Duration: ${result.metadata.totalDuration}ms`);
    console.log(`  • Synthesis: ${result.metadata.synthesisTime}ms`);
    console.log(`  • Quality Scoring: ${result.metadata.qualityScoringTime}ms`);
    console.log(`  • Enhancement: ${result.metadata.enhancementTime}ms`);

    // Status
    console.log('\n📋 Status:', result.status);

    if (result.enhancements?.length) {
      console.log(`\n✨ ${result.enhancements.length} enhancement(s) applied`);
    }

    console.log('\n========================================');
    console.log('✅ EQ v2 Integration Test Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testEQIntegration().catch(console.error);