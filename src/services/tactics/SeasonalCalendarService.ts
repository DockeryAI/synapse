/**
 * Seasonal Calendar Service
 * Never miss a marketing opportunity - Q4 = 40% of SMB revenue
 *
 * Features:
 * - Major holidays + industry-specific dates
 * - Q4 emphasis (Oct-Dec revenue spike)
 * - Local events from Perplexity API
 * - 2-3 week promotion windows
 * - Campaign suggestions per season
 * - Alert system for opportunities
 */

import {
  SeasonalCalendar,
  Holiday,
  Season,
  LocalEvent,
  SeasonalOpportunity,
  CampaignSuggestion,
  BusinessContext,
  ServiceResponse,
} from '../../types/tactics.types';

export class SeasonalCalendarService {
  // Promotion window: Start marketing 2-3 weeks before event
  private readonly PROMOTION_LEAD_DAYS = 21;
  private readonly ALERT_LEAD_DAYS = 28; // Alert 4 weeks out

  /**
   * Generate complete seasonal calendar for a business
   */
  async generateCalendar(
    businessContext: BusinessContext,
    year: number = new Date().getFullYear()
  ): Promise<ServiceResponse<SeasonalCalendar>> {
    try {
      const holidays = this.getHolidays(year, businessContext.industry);
      const seasons = this.getSeasons(year);
      const localEvents = await this.getLocalEvents(businessContext, year);
      const opportunities = this.generateOpportunities(holidays, seasons, localEvents);

      const calendar: SeasonalCalendar = {
        holidays,
        seasons,
        localEvents,
        opportunities,
      };

      return {
        success: true,
        data: calendar,
        metadata: {
          totalOpportunities: opportunities.length,
          q4Opportunities: opportunities.filter((o) => this.isQ4(o.date)).length,
          nextOpportunity: this.getNextOpportunity(opportunities),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate calendar',
      };
    }
  }

  /**
   * Get holidays for the year (major + industry-specific)
   */
  private getHolidays(year: number, industry: string): Holiday[] {
    const majorHolidays = this.getMajorHolidays(year);
    const industryHolidays = this.getIndustryHolidays(year, industry);

    return [...majorHolidays, ...industryHolidays].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  /**
   * Major holidays that affect all businesses
   */
  private getMajorHolidays(year: number): Holiday[] {
    return [
      // Q1
      {
        id: 'new-years',
        name: "New Year's Day",
        date: new Date(year, 0, 1),
        type: 'major',
        promotionStartDate: new Date(year - 1, 11, 10), // Mid-December
        campaignSuggestions: [
          'New Year, New You campaign',
          'Resolution support content',
          'Fresh start promotions',
        ],
        revenue_impact: 'medium',
        q4_emphasis: false,
      },
      {
        id: 'valentines',
        name: "Valentine's Day",
        date: new Date(year, 1, 14),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(new Date(year, 1, 14)),
        campaignSuggestions: [
          'Couples specials',
          'Self-love promotions',
          'Gift ideas campaign',
        ],
        revenue_impact: 'high',
        q4_emphasis: false,
      },
      // Q2
      {
        id: 'mothers-day',
        name: "Mother's Day",
        date: this.getMothersDay(year),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(this.getMothersDay(year)),
        campaignSuggestions: [
          'Mom appreciation posts',
          'Gift guide for moms',
          'Special mom offers',
        ],
        revenue_impact: 'high',
        q4_emphasis: false,
      },
      {
        id: 'memorial-day',
        name: 'Memorial Day Weekend',
        date: this.getMemorialDay(year),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(this.getMemorialDay(year)),
        campaignSuggestions: [
          'Summer kickoff sale',
          'Long weekend specials',
          'Patriotic content',
        ],
        revenue_impact: 'medium',
        q4_emphasis: false,
      },
      {
        id: 'fathers-day',
        name: "Father's Day",
        date: this.getFathersDay(year),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(this.getFathersDay(year)),
        campaignSuggestions: [
          'Dad gift guide',
          'Father appreciation posts',
          'Dad-focused offers',
        ],
        revenue_impact: 'high',
        q4_emphasis: false,
      },
      // Q3
      {
        id: 'july-4',
        name: 'Independence Day',
        date: new Date(year, 6, 4),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(new Date(year, 6, 4)),
        campaignSuggestions: [
          'Summer sale',
          'Patriotic promotions',
          'BBQ/outdoor content',
        ],
        revenue_impact: 'medium',
        q4_emphasis: false,
      },
      {
        id: 'labor-day',
        name: 'Labor Day Weekend',
        date: this.getLaborDay(year),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(this.getLaborDay(year)),
        campaignSuggestions: [
          'End of summer sale',
          'Back to school prep',
          'Long weekend deals',
        ],
        revenue_impact: 'medium',
        q4_emphasis: false,
      },
      // Q4 - THE BIG MONEY QUARTER (40% of revenue!)
      {
        id: 'halloween',
        name: 'Halloween',
        date: new Date(year, 9, 31),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(new Date(year, 9, 31)),
        campaignSuggestions: [
          'Halloween contest',
          'Spooky specials',
          'Costume/theme content',
        ],
        revenue_impact: 'high',
        q4_emphasis: true,
      },
      {
        id: 'thanksgiving',
        name: 'Thanksgiving',
        date: this.getThanksgiving(year),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(this.getThanksgiving(year)),
        campaignSuggestions: [
          'Gratitude campaign',
          'Customer appreciation',
          'Pre-Black Friday teasers',
        ],
        revenue_impact: 'high',
        q4_emphasis: true,
      },
      {
        id: 'black-friday',
        name: 'Black Friday',
        date: this.getBlackFriday(year),
        type: 'major',
        promotionStartDate: new Date(year, 10, 1), // Start Nov 1!
        campaignSuggestions: [
          'Black Friday mega sale',
          'Exclusive deals countdown',
          'Early bird specials',
        ],
        revenue_impact: 'high',
        q4_emphasis: true,
      },
      {
        id: 'cyber-monday',
        name: 'Cyber Monday',
        date: this.getCyberMonday(year),
        type: 'major',
        promotionStartDate: new Date(year, 10, 1),
        campaignSuggestions: [
          'Online exclusive deals',
          'Digital promotions',
          'Last chance offers',
        ],
        revenue_impact: 'high',
        q4_emphasis: true,
      },
      {
        id: 'christmas',
        name: 'Christmas',
        date: new Date(year, 11, 25),
        type: 'major',
        promotionStartDate: new Date(year, 10, 15), // Mid-November
        campaignSuggestions: [
          'Gift guide series',
          '12 Days of Christmas',
          'Holiday shopping campaign',
        ],
        revenue_impact: 'high',
        q4_emphasis: true,
      },
      {
        id: 'new-years-eve',
        name: "New Year's Eve",
        date: new Date(year, 11, 31),
        type: 'major',
        promotionStartDate: this.calculatePromotionStart(new Date(year, 11, 31)),
        campaignSuggestions: [
          'Year in review content',
          'NYE specials',
          'New year prep campaign',
        ],
        revenue_impact: 'medium',
        q4_emphasis: true,
      },
    ];
  }

  /**
   * Industry-specific holidays
   */
  private getIndustryHolidays(year: number, industry: string): Holiday[] {
    const industryHolidays: Record<string, Holiday[]> = {
      restaurant: [
        {
          id: 'restaurant-week',
          name: 'Restaurant Week',
          date: new Date(year, 2, 15), // Varies by city, using March as example
          type: 'industry_specific',
          industry: 'restaurant',
          promotionStartDate: this.calculatePromotionStart(new Date(year, 2, 15)),
          campaignSuggestions: ['Special menus', 'Prix fixe deals', 'Behind the scenes'],
          revenue_impact: 'high',
          q4_emphasis: false,
        },
        {
          id: 'national-pizza-day',
          name: 'National Pizza Day',
          date: new Date(year, 1, 9),
          type: 'industry_specific',
          industry: 'restaurant',
          promotionStartDate: this.calculatePromotionStart(new Date(year, 1, 9)),
          campaignSuggestions: ['Pizza specials', 'Create your own', 'Pizza party deals'],
          revenue_impact: 'medium',
          q4_emphasis: false,
        },
      ],
      fitness: [
        {
          id: 'fitness-day',
          name: 'National Fitness Day',
          date: new Date(year, 4, 1),
          type: 'industry_specific',
          industry: 'fitness',
          promotionStartDate: this.calculatePromotionStart(new Date(year, 4, 1)),
          campaignSuggestions: ['Free class week', 'Fitness challenges', 'Member spotlights'],
          revenue_impact: 'medium',
          q4_emphasis: false,
        },
      ],
      salon: [
        {
          id: 'hair-appreciation-day',
          name: 'National Hair Day',
          date: new Date(year, 9, 1),
          type: 'industry_specific',
          industry: 'salon',
          promotionStartDate: this.calculatePromotionStart(new Date(year, 9, 1)),
          campaignSuggestions: [
            'Hair transformation contest',
            'Style showcases',
            'Hair care tips',
          ],
          revenue_impact: 'medium',
          q4_emphasis: true,
        },
      ],
      retail: [
        {
          id: 'small-business-saturday',
          name: 'Small Business Saturday',
          date: this.getSmallBusinessSaturday(year),
          type: 'industry_specific',
          industry: 'retail',
          promotionStartDate: this.calculatePromotionStart(this.getSmallBusinessSaturday(year)),
          campaignSuggestions: [
            'Shop local campaign',
            'Behind the business stories',
            'Community focus',
          ],
          revenue_impact: 'high',
          q4_emphasis: true,
        },
      ],
    };

    return industryHolidays[industry.toLowerCase()] || [];
  }

  /**
   * Get seasons with themes and opportunities
   */
  private getSeasons(year: number): Season[] {
    return [
      {
        name: 'spring',
        startDate: new Date(year, 2, 20), // March 20
        endDate: new Date(year, 5, 20), // June 20
        themes: ['Renewal', 'Fresh starts', 'Growth', 'Cleaning', 'Outdoors'],
        opportunities: [
          'Spring cleaning promotions',
          'Fresh start campaigns',
          'Outdoor season prep',
          'Earth Day content (April 22)',
        ],
      },
      {
        name: 'summer',
        startDate: new Date(year, 5, 21), // June 21
        endDate: new Date(year, 8, 22), // September 22
        themes: ['Vacation', 'Fun', 'Sun', 'Travel', 'Relaxation'],
        opportunities: [
          'Summer sale',
          'Vacation-ready campaigns',
          'BBQ season content',
          'Beach/outdoor themes',
        ],
      },
      {
        name: 'fall',
        startDate: new Date(year, 8, 23), // September 23
        endDate: new Date(year, 11, 20), // December 20
        themes: ['Harvest', 'Cozy', 'Back to school', 'Preparation', 'Thanksgiving'],
        opportunities: [
          'Back to school marketing',
          'Pumpkin spice everything',
          'Fall harvest themes',
          'Preparation for winter',
        ],
      },
      {
        name: 'winter',
        startDate: new Date(year, 11, 21), // December 21
        endDate: new Date(year + 1, 2, 19), // March 19 next year
        themes: ['Holidays', 'Giving', 'Family', 'Warmth', 'New beginnings'],
        opportunities: [
          'Holiday shopping season',
          'Gift guides',
          'New Year promotions',
          'Warm & cozy campaigns',
        ],
      },
    ];
  }

  /**
   * Get local events from Perplexity API
   * In production, this would query Perplexity for local events
   */
  private async getLocalEvents(context: BusinessContext, year: number): Promise<LocalEvent[]> {
    // Placeholder for Perplexity API integration
    // In production: Query Perplexity for events in context.location

    if (!context.location) {
      return [];
    }

    // Mock data structure
    const mockEvents: LocalEvent[] = [];

    return mockEvents;
  }

  /**
   * Generate opportunities from holidays, seasons, and local events
   */
  private generateOpportunities(
    holidays: Holiday[],
    seasons: Season[],
    localEvents: LocalEvent[]
  ): SeasonalOpportunity[] {
    const opportunities: SeasonalOpportunity[] = [];

    // Create opportunities from holidays
    holidays.forEach((holiday) => {
      opportunities.push({
        id: `opp_${holiday.id}`,
        title: holiday.name,
        type: 'holiday',
        date: holiday.date,
        alertDate: this.calculateAlertDate(holiday.date),
        suggestedCampaigns: this.generateCampaignSuggestions(holiday),
        status: this.getOpportunityStatus(holiday.date),
      });
    });

    // Create opportunities from seasons
    seasons.forEach((season) => {
      opportunities.push({
        id: `opp_${season.name}`,
        title: `${season.name.charAt(0).toUpperCase() + season.name.slice(1)} Season`,
        type: 'season',
        date: season.startDate,
        alertDate: this.calculateAlertDate(season.startDate),
        suggestedCampaigns: season.opportunities.map((opp) => ({
          title: opp,
          description: `${season.name} themed campaign`,
          duration: 14,
          postCount: 10,
          platforms: ['facebook', 'instagram'],
          expectedImpact: 'Seasonal relevance boost',
        })),
        status: this.getOpportunityStatus(season.startDate),
      });
    });

    // Create opportunities from local events
    localEvents.forEach((event) => {
      opportunities.push({
        id: `opp_${event.id}`,
        title: event.name,
        type: 'local_event',
        date: event.date,
        alertDate: this.calculateAlertDate(event.date),
        suggestedCampaigns: event.campaignIdeas.map((idea) => ({
          title: idea,
          description: `Local event tie-in campaign`,
          duration: 7,
          postCount: 5,
          platforms: ['facebook', 'instagram', 'google_business'],
          expectedImpact: 'Local community engagement',
        })),
        status: this.getOpportunityStatus(event.date),
      });
    });

    return opportunities.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate campaign suggestions for a holiday
   */
  private generateCampaignSuggestions(holiday: Holiday): CampaignSuggestion[] {
    return holiday.campaignSuggestions.map((suggestion) => ({
      title: suggestion,
      description: `${holiday.name} themed campaign`,
      duration: holiday.q4_emphasis ? 14 : 7, // Longer campaigns in Q4
      postCount: holiday.q4_emphasis ? 14 : 7,
      platforms: ['facebook', 'instagram'],
      expectedImpact: `${holiday.revenue_impact} revenue impact`,
    }));
  }

  /**
   * Get upcoming opportunities (next 90 days)
   */
  async getUpcomingOpportunities(
    businessContext: BusinessContext,
    days: number = 90
  ): Promise<ServiceResponse<SeasonalOpportunity[]>> {
    try {
      const calendarResponse = await this.generateCalendar(businessContext);
      if (!calendarResponse.success || !calendarResponse.data) {
        throw new Error('Failed to generate calendar');
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const upcoming = calendarResponse.data.opportunities.filter(
        (opp) => opp.date >= now && opp.date <= futureDate && opp.status !== 'past'
      );

      return {
        success: true,
        data: upcoming,
        metadata: {
          count: upcoming.length,
          days,
          q4Count: upcoming.filter((o) => this.isQ4(o.date)).length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get opportunities',
      };
    }
  }

  // ============================================================================
  // Date Calculation Helpers
  // ============================================================================

  private calculatePromotionStart(eventDate: Date): Date {
    const start = new Date(eventDate);
    start.setDate(start.getDate() - this.PROMOTION_LEAD_DAYS);
    return start;
  }

  private calculateAlertDate(eventDate: Date): Date {
    const alert = new Date(eventDate);
    alert.setDate(alert.getDate() - this.ALERT_LEAD_DAYS);
    return alert;
  }

  private getOpportunityStatus(
    date: Date
  ): 'upcoming' | 'active' | 'past' | 'dismissed' {
    const now = new Date();
    const alertDate = this.calculateAlertDate(date);

    if (date < now) return 'past';
    if (alertDate <= now) return 'active';
    return 'upcoming';
  }

  private isQ4(date: Date): boolean {
    const month = date.getMonth();
    return month >= 9; // October (9) through December (11)
  }

  private getNextOpportunity(opportunities: SeasonalOpportunity[]): string {
    const upcoming = opportunities.find((o) => o.status === 'active' || o.status === 'upcoming');
    if (!upcoming) return 'No upcoming opportunities';

    const days = Math.ceil(
      (upcoming.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${upcoming.title} in ${days} days`;
  }

  // Floating holiday calculations
  private getMothersDay(year: number): Date {
    // Second Sunday in May
    return this.getNthWeekdayOfMonth(year, 4, 0, 2);
  }

  private getFathersDay(year: number): Date {
    // Third Sunday in June
    return this.getNthWeekdayOfMonth(year, 5, 0, 3);
  }

  private getMemorialDay(year: number): Date {
    // Last Monday in May
    return this.getLastWeekdayOfMonth(year, 4, 1);
  }

  private getLaborDay(year: number): Date {
    // First Monday in September
    return this.getNthWeekdayOfMonth(year, 8, 1, 1);
  }

  private getThanksgiving(year: number): Date {
    // Fourth Thursday in November
    return this.getNthWeekdayOfMonth(year, 10, 4, 4);
  }

  private getBlackFriday(year: number): Date {
    const thanksgiving = this.getThanksgiving(year);
    const blackFriday = new Date(thanksgiving);
    blackFriday.setDate(blackFriday.getDate() + 1);
    return blackFriday;
  }

  private getCyberMonday(year: number): Date {
    const blackFriday = this.getBlackFriday(year);
    const cyberMonday = new Date(blackFriday);
    cyberMonday.setDate(cyberMonday.getDate() + 3);
    return cyberMonday;
  }

  private getSmallBusinessSaturday(year: number): Date {
    const blackFriday = this.getBlackFriday(year);
    const sbs = new Date(blackFriday);
    sbs.setDate(sbs.getDate() + 1);
    return sbs;
  }

  private getNthWeekdayOfMonth(
    year: number,
    month: number,
    weekday: number,
    n: number
  ): Date {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const date = 1 + offset + (n - 1) * 7;
    return new Date(year, month, date);
  }

  private getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    const date = lastDay.getDate() - offset;
    return new Date(year, month, date);
  }
}

// Singleton export
export const seasonalCalendarService = new SeasonalCalendarService();
