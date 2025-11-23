import { describe, it, expect } from 'vitest';
import { contentMultiplierService } from '@/services/intelligence/content-multiplier.service';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

describe('ContentMultiplierService', () => {
  const mockBreakthrough: Breakthrough = {
    id: 'bt-test-1',
    title: 'Customers craving faster service',
    description: 'Analysis shows strong demand for speed improvements',
    category: 'urgent',
    score: 85,
    clusters: [],
    connections: [],
    dataPoints: [],
    validation: {
      clusterCount: 2,
      totalDataPoints: 15,
      validationStatement: 'Confirmed by 15 customer reviews mentioning wait times',
      sourceTypes: ['Google Reviews', 'YouTube']
    },
    emotionalResonance: {
      eqScore: 8,
      dominantEmotion: 'frustration',
      triggers: ['waiting', 'slow service']
    },
    timing: {
      relevance: 0.9,
      urgency: true,
      seasonal: false
    },
    competitiveAdvantage: {
      hasGap: true,
      gapDescription: 'Competitors are slow to respond to customer service requests'
    },
    suggestedAngles: ['Speed improvements', 'Customer satisfaction'],
    provenance: 'Generated from customer review clustering'
  } as Breakthrough;

  const mockContext: DeepContext = {
    business: {
      profile: {
        id: 'test-id',
        name: 'Test Coffee Shop',
        industry: 'Food & Beverage',
        naicsCode: '722515',
        website: 'https://test.com',
        location: {
          city: 'Seattle',
          state: 'WA',
          country: 'USA'
        },
        keywords: ['coffee', 'cafe'],
        competitors: []
      },
      brandVoice: {
        tone: ['friendly'],
        values: ['quality'],
        personality: ['warm'],
        avoidWords: [],
        signaturePhrases: []
      },
      uniqueAdvantages: [],
      goals: []
    },
    industry: {
      trends: [],
      seasonalPatterns: [],
      competitorAnalysis: {
        topCompetitors: [],
        marketConcentration: 'moderate',
        barrierToEntry: 'medium'
      }
    },
    realTimeCultural: {},
    competitiveIntel: {
      blindSpots: [],
      mistakes: [],
      opportunities: [],
      contentGaps: [],
      positioningWeaknesses: []
    },
    customerPsychology: {
      unarticulated: [],
      emotional: [],
      behavioral: [],
      identityDesires: [],
      objections: []
    },
    synthesis: {
      keyInsights: [],
      hiddenPatterns: [],
      recommendedAngles: [],
      contentGaps: []
    },
    metadata: {
      aggregatedAt: new Date(),
      dataSourcesUsed: [],
      processingTimeMs: 0,
      version: '1.0'
    }
  } as DeepContext;

  it('generates 3-5 angles from a breakthrough', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    expect(multiplied.angles.length).toBeGreaterThanOrEqual(3);
    expect(multiplied.angles.length).toBeLessThanOrEqual(5);
  });

  it('includes pain and aspiration angles for every breakthrough', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hasPain = multiplied.angles.some(a => a.angle === 'Customer Pain Point');
    const hasAspiration = multiplied.angles.some(a => a.angle === 'Aspirational Outcome');

    expect(hasPain).toBe(true);
    expect(hasAspiration).toBe(true);
  });

  it('generates platform variants for each angle', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    multiplied.angles.forEach(angle => {
      const variants = multiplied.platformVariants[angle.id];
      expect(variants).toBeDefined();
      expect(variants.length).toBeGreaterThan(0);

      // Check for key platforms
      const platforms = variants.map(v => v.platform);
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('instagram');
    });
  });

  it('generates weekly calendar with optimal time slots', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    expect(multiplied.weeklyCalendar.length).toBeGreaterThan(0);

    multiplied.weeklyCalendar.forEach(day => {
      expect(day.day).toBeDefined();
      expect(day.platform).toBeDefined();
      expect(day.timeSlot).toBeDefined();
      expect(day.content).toBeDefined();
    });
  });

  it('creates platform-specific content variations', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);
    const firstAngle = multiplied.angles[0];
    const variants = multiplied.platformVariants[firstAngle.id];

    const linkedIn = variants.find(v => v.platform === 'linkedin');
    const twitter = variants.find(v => v.platform === 'twitter');

    expect(linkedIn).toBeDefined();
    expect(twitter).toBeDefined();

    // LinkedIn should be longer than Twitter
    expect(linkedIn!.characterCount).toBeGreaterThan(twitter!.characterCount);

    // Twitter should be under 280 characters
    expect(twitter!.characterCount).toBeLessThanOrEqual(280);
  });

  it('batch multiplies multiple breakthroughs', () => {
    const breakthroughs = [mockBreakthrough, { ...mockBreakthrough, id: 'bt-test-2' }];
    const multiplied = contentMultiplierService.multiplyBreakthroughs(breakthroughs, mockContext);

    expect(multiplied.length).toBe(2);
    expect(multiplied[0].breakthroughId).toBe('bt-test-1');
    expect(multiplied[1].breakthroughId).toBe('bt-test-2');
  });

  it('includes social proof angle when enough validation exists', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hasSocialProof = multiplied.angles.some(a => a.angle === 'Social Proof');
    expect(hasSocialProof).toBe(true);
  });

  it('includes competitive advantage angle when gap exists', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hasCompetitive = multiplied.angles.some(a => a.angle === 'Competitive Advantage');
    expect(hasCompetitive).toBe(true);
  });

  it('includes urgency angle when breakthrough is urgent', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hasUrgency = multiplied.angles.some(a => a.angle === 'Time-Sensitive Opportunity');
    expect(hasUrgency).toBe(true);
  });

  it('generates unique hooks for each angle', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const hooks = multiplied.angles.map(a => a.hook);
    const uniqueHooks = new Set(hooks);

    expect(uniqueHooks.size).toBe(hooks.length);
  });

  it('includes business name in LinkedIn variants', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);
    const firstAngle = multiplied.angles[0];
    const variants = multiplied.platformVariants[firstAngle.id];

    const linkedIn = variants.find(v => v.platform === 'linkedin');
    expect(linkedIn!.content).toContain('Test Coffee Shop');
  });

  it('includes email subject line for email variants', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);
    const firstAngle = multiplied.angles[0];
    const variants = multiplied.platformVariants[firstAngle.id];

    const email = variants.find(v => v.platform === 'email');
    expect(email).toBeDefined();
    expect(email!.subject).toBeDefined();
    expect(email!.subject!.length).toBeGreaterThan(0);
  });

  it('includes hashtags for social media variants', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);
    const firstAngle = multiplied.angles[0];
    const variants = multiplied.platformVariants[firstAngle.id];

    const instagram = variants.find(v => v.platform === 'instagram');
    expect(instagram).toBeDefined();
    expect(instagram!.hashtags).toBeDefined();
    expect(instagram!.hashtags!.length).toBeGreaterThan(0);
  });

  it('distributes calendar posts across different days', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    const days = multiplied.weeklyCalendar.map(c => c.day);
    const uniqueDays = new Set(days);

    // Should have variety in days (not all on same day)
    expect(uniqueDays.size).toBeGreaterThan(1);
  });

  it('assigns appropriate time slots for each platform', () => {
    const multiplied = contentMultiplierService.multiplyBreakthrough(mockBreakthrough, mockContext);

    multiplied.weeklyCalendar.forEach(day => {
      expect(day.timeSlot).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });
});
