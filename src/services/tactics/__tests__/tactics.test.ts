/**
 * Immediate Win Tactics - Unit Tests
 * Test that tactics services generate correctly
 */

import { describe, it, expect } from 'vitest';
import { ugcContestService } from '../UGCContestService';
import { hashtagBuilderService } from '../HashtagBuilderService';
import { emailCaptureService } from '../EmailCaptureService';
import { seasonalCalendarService } from '../SeasonalCalendarService';
import { BusinessContext } from '../../../types/tactics.types';

// Test business context
const mockBusinessContext: BusinessContext = {
  id: 'test_biz_123',
  name: 'Test Bakery',
  industry: 'bakery',
  specialty: 'wedding cakes',
  location: 'Austin, TX',
  targetAudience: 'brides and event planners',
  platforms: ['instagram', 'facebook'],
};

describe('UGC Contest Service', () => {
  it('should generate a photo contest', async () => {
    const result = await ugcContestService.generateContest(mockBusinessContext, 'photo');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.type).toBe('photo');
    expect(result.data?.hashtag).toContain('#');
    expect(result.data?.rules.length).toBeGreaterThan(0);
    expect(result.data?.templates).toBeDefined();
    expect(result.data?.templates.announcement).toContain('CONTEST');
  });

  it('should generate a video contest with different templates', async () => {
    const result = await ugcContestService.generateContest(mockBusinessContext, 'video');

    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('video');
    expect(result.data?.templates.announcement).toBeDefined();
  });

  it('should suggest appropriate prizes based on business type', async () => {
    const result = await ugcContestService.generateContest(mockBusinessContext, 'review');

    expect(result.success).toBe(true);
    expect(result.data?.prize).toBeDefined();
    expect(result.data?.prize.value).toBeGreaterThan(0);
  });
});

describe('Hashtag Builder Service', () => {
  it('should generate 3+10+5 formula', async () => {
    const result = await hashtagBuilderService.generateFormula(mockBusinessContext, 'instagram');

    expect(result.success).toBe(true);
    expect(result.data?.formula.branded.length).toBe(3);
    expect(result.data?.formula.niche.length).toBe(10);
    expect(result.data?.formula.trending.length).toBe(5);
    expect(result.data?.formula.total).toBe(18);
  });

  it('should include business name in branded hashtags', async () => {
    const result = await hashtagBuilderService.generateFormula(mockBusinessContext);

    expect(result.success).toBe(true);
    const branded = result.data?.formula.branded || [];
    const hasBusinessName = branded.some((h) =>
      h.toLowerCase().includes(mockBusinessContext.name.toLowerCase().replace(/\s+/g, ''))
    );
    expect(hasBusinessName).toBe(true);
  });

  it('should generate location-based hashtags if location provided', async () => {
    const result = await hashtagBuilderService.generateFormula(mockBusinessContext);

    expect(result.success).toBe(true);
    const allHashtags = [
      ...result.data!.formula.branded,
      ...result.data!.formula.niche,
    ];
    const hasLocation = allHashtags.some((h) =>
      h.toLowerCase().includes('austin')
    );
    expect(hasLocation).toBe(true);
  });
});

describe('Email Capture Service', () => {
  it('should generate discount capture page', async () => {
    const result = await emailCaptureService.generateCapturePage(
      mockBusinessContext,
      'discount'
    );

    expect(result.success).toBe(true);
    expect(result.data?.template).toBe('discount');
    expect(result.data?.leadMagnet.type).toBe('discount');
    expect(result.data?.form.fields.length).toBeGreaterThan(0);
    expect(result.data?.form.gdprCompliant).toBe(true);
  });

  it('should generate guide capture page with download', async () => {
    const result = await emailCaptureService.generateCapturePage(
      mockBusinessContext,
      'guide'
    );

    expect(result.success).toBe(true);
    expect(result.data?.leadMagnet.type).toBe('pdf');
    expect(result.data?.leadMagnet.deliveryMethod).toBe('download');
  });

  it('should include GDPR consent in all forms', async () => {
    const result = await emailCaptureService.generateCapturePage(
      mockBusinessContext,
      'checklist'
    );

    expect(result.success).toBe(true);
    expect(result.data?.form.gdprCompliant).toBe(true);
    expect(result.data?.form.consentText).toContain('privacy');
  });

  it('should export valid HTML', async () => {
    const pageResult = await emailCaptureService.generateCapturePage(
      mockBusinessContext,
      'discount'
    );
    const htmlResult = await emailCaptureService.exportHTML(pageResult.data!);

    expect(htmlResult.success).toBe(true);
    expect(htmlResult.data).toContain('<!DOCTYPE html>');
    expect(htmlResult.data).toContain('</html>');
    expect(htmlResult.data).toContain(pageResult.data!.title);
  });
});

describe('Seasonal Calendar Service', () => {
  it('should generate calendar for current year', async () => {
    const year = new Date().getFullYear();
    const result = await seasonalCalendarService.generateCalendar(mockBusinessContext, year);

    expect(result.success).toBe(true);
    expect(result.data?.holidays.length).toBeGreaterThan(0);
    expect(result.data?.seasons.length).toBe(4);
    expect(result.data?.opportunities.length).toBeGreaterThan(0);
  });

  it('should include major holidays', async () => {
    const year = 2025;
    const result = await seasonalCalendarService.generateCalendar(mockBusinessContext, year);

    expect(result.success).toBe(true);
    const holidayNames = result.data?.holidays.map((h) => h.id) || [];
    expect(holidayNames).toContain('christmas');
    expect(holidayNames).toContain('thanksgiving');
    expect(holidayNames).toContain('black-friday');
  });

  it('should emphasize Q4 holidays', async () => {
    const year = 2025;
    const result = await seasonalCalendarService.generateCalendar(mockBusinessContext, year);

    expect(result.success).toBe(true);
    const q4Holidays = result.data?.holidays.filter((h) => h.q4_emphasis) || [];
    expect(q4Holidays.length).toBeGreaterThan(0);

    // Q4 should include Halloween, Thanksgiving, Black Friday, Christmas
    const q4Names = q4Holidays.map((h) => h.id);
    expect(q4Names).toContain('halloween');
    expect(q4Names).toContain('thanksgiving');
    expect(q4Names).toContain('black-friday');
    expect(q4Names).toContain('christmas');
  });

  it('should set promotion start dates 2-3 weeks before holidays', async () => {
    const year = 2025;
    const result = await seasonalCalendarService.generateCalendar(mockBusinessContext, year);

    expect(result.success).toBe(true);
    const christmas = result.data?.holidays.find((h) => h.id === 'christmas');
    expect(christmas).toBeDefined();

    // Promotion should start before the holiday
    expect(christmas!.promotionStartDate < christmas!.date).toBe(true);

    // Should be at least 14 days before
    const daysDiff =
      (christmas!.date.getTime() - christmas!.promotionStartDate.getTime()) /
      (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(14);
  });

  it('should get upcoming opportunities', async () => {
    const result = await seasonalCalendarService.getUpcomingOpportunities(
      mockBusinessContext,
      90
    );

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);

    // All opportunities should be in the future
    const now = new Date();
    const allFuture = result.data?.every((opp) => opp.date >= now);
    expect(allFuture).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should work together: generate full tactic suite', async () => {
    // Generate all tactics for a business
    const [contestResult, hashtagResult, captureResult, calendarResult] = await Promise.all([
      ugcContestService.generateContest(mockBusinessContext, 'photo'),
      hashtagBuilderService.generateFormula(mockBusinessContext),
      emailCaptureService.generateCapturePage(mockBusinessContext, 'discount'),
      seasonalCalendarService.generateCalendar(mockBusinessContext),
    ]);

    // All should succeed
    expect(contestResult.success).toBe(true);
    expect(hashtagResult.success).toBe(true);
    expect(captureResult.success).toBe(true);
    expect(calendarResult.success).toBe(true);

    // Hashtags from contest should be usable
    const contestHashtag = contestResult.data!.hashtag;
    expect(contestHashtag).toContain('#');

    // Calendar should have upcoming opportunities
    expect(calendarResult.data!.opportunities.length).toBeGreaterThan(0);
  });
});
