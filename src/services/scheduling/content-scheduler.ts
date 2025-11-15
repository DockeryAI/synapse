/**
 * Content Scheduler Service
 * Handles optimal time detection, schedule validation, and timezone support
 * Tasks 3.2 - Content Scheduling Engine
 */

import type { Platform, ContentItem } from '@/types/content-calendar.types';

/**
 * Audience insights for optimal posting times
 */
interface AudienceInsights {
  timezone: string;
  demographics: {
    age_range: string;
    primary_countries: string[];
  };
  activity_patterns: {
    peak_hours: number[];
    peak_days: number[];
  };
}

/**
 * Goal-based preferences
 */
interface ContentGoals {
  objective: 'engagement' | 'reach' | 'conversions' | 'awareness';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Scheduling recommendation
 */
export interface SchedulingRecommendation {
  suggestedTime: Date;
  confidence: number;
  reasoning: string;
  alternativeTimes: Date[];
}

/**
 * Conflict detection result
 */
export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingItems: ContentItem[];
  recommendation: string;
}

/**
 * Best days analysis
 */
export interface BestDaysAnalysis {
  dayOfWeek: number;
  score: number;
  averageEngagement: number;
  postCount: number;
}

/**
 * Recurring schedule configuration
 */
export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek?: number[];
  timeOfDay: string;
  endDate?: Date;
  count?: number;
}

/**
 * Platform-specific optimal posting times
 * Based on industry research and best practices
 */
const PLATFORM_OPTIMAL_TIMES: Record<Platform, { hours: number[]; days: number[] }> = {
  instagram: {
    hours: [11, 13, 17, 19], // 11am, 1pm, 5pm, 7pm
    days: [2, 3, 4], // Tue, Wed, Thu
  },
  twitter: {
    hours: [9, 12, 15, 18], // 9am, 12pm, 3pm, 6pm
    days: [2, 3, 4], // Tue, Wed, Thu
  },
  linkedin: {
    hours: [8, 10, 12, 17], // 8am, 10am, 12pm, 5pm
    days: [2, 3, 4], // Tue, Wed, Thu
  },
  facebook: {
    hours: [9, 13, 15, 19], // 9am, 1pm, 3pm, 7pm
    days: [2, 3, 4, 5], // Tue, Wed, Thu, Fri
  },
  tiktok: {
    hours: [18, 19, 20, 21], // 6pm, 7pm, 8pm, 9pm
    days: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  },
  email: {
    hours: [8, 10, 14, 16], // 8am, 10am, 2pm, 4pm
    days: [2, 3, 4], // Tue, Wed, Thu
  },
  blog: {
    hours: [9, 10, 11], // 9am, 10am, 11am
    days: [2, 3, 4], // Tue, Wed, Thu
  },
};

/**
 * Calculate optimal posting time for content
 */
export function calculateOptimalTime(
  platform: Platform,
  audience?: AudienceInsights,
  goals?: ContentGoals,
  preferredDate?: Date
): SchedulingRecommendation {
  const platformTimes = PLATFORM_OPTIMAL_TIMES[platform];
  const targetDate = preferredDate || new Date();

  // Get timezone offset if audience provided
  const timezoneOffset = audience?.timezone
    ? getTimezoneOffset(audience.timezone)
    : 0;

  // Determine optimal hour based on platform and audience activity
  let optimalHour: number;

  if (audience?.activity_patterns?.peak_hours?.length) {
    // Use audience's peak hours
    optimalHour = audience.activity_patterns.peak_hours[0];
  } else {
    // Use platform defaults
    optimalHour = platformTimes.hours[0];
  }

  // Adjust for goals
  if (goals?.objective === 'reach') {
    // For reach, prioritize early hours
    optimalHour = platformTimes.hours[0];
  } else if (goals?.objective === 'engagement') {
    // For engagement, prioritize evening hours
    optimalHour = platformTimes.hours[platformTimes.hours.length - 1];
  }

  // Find next available optimal day
  const today = new Date();
  const daysToCheck = 14; // Check next 2 weeks
  let bestDate = new Date(targetDate);

  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const dayOfWeek = checkDate.getDay();

    if (platformTimes.days.includes(dayOfWeek)) {
      bestDate = checkDate;
      break;
    }
  }

  // Set the optimal time
  bestDate.setHours(optimalHour - timezoneOffset, 0, 0, 0);

  // Generate alternative times
  const alternativeTimes: Date[] = platformTimes.hours
    .filter(h => h !== optimalHour)
    .slice(0, 3)
    .map(hour => {
      const altDate = new Date(bestDate);
      altDate.setHours(hour - timezoneOffset, 0, 0, 0);
      return altDate;
    });

  // Calculate confidence based on data availability
  let confidence = 0.7; // Base confidence
  if (audience?.activity_patterns) {
    confidence += 0.2;
  }
  if (goals?.objective) {
    confidence += 0.1;
  }

  // Build reasoning
  const reasoning = buildReasoningMessage(
    platform,
    optimalHour,
    bestDate.getDay(),
    audience,
    goals
  );

  return {
    suggestedTime: bestDate,
    confidence: Math.min(confidence, 1.0),
    reasoning,
    alternativeTimes,
  };
}

/**
 * Build human-readable reasoning for scheduling recommendation
 */
function buildReasoningMessage(
  platform: Platform,
  hour: number,
  dayOfWeek: number,
  audience?: AudienceInsights,
  goals?: ContentGoals
): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];
  const timeStr = hour > 12 ? `${hour - 12}pm` : `${hour}am`;

  let reasoning = `${dayName}s at ${timeStr} are optimal for ${platform}`;

  if (audience?.activity_patterns) {
    reasoning += ' based on your audience activity patterns';
  } else {
    reasoning += ' according to platform best practices';
  }

  if (goals?.objective) {
    reasoning += ` and aligned with your ${goals.objective} goals`;
  }

  return reasoning + '.';
}

/**
 * Validate schedule and check for conflicts
 */
export function validateSchedule(
  contentItem: Partial<ContentItem>,
  existingSchedule: ContentItem[]
): ScheduleConflict {
  if (!contentItem.scheduled_time) {
    return {
      hasConflict: false,
      conflictingItems: [],
      recommendation: 'No schedule time set.',
    };
  }

  const scheduledTime = new Date(contentItem.scheduled_time);
  const platform = contentItem.platform;

  // Check for items scheduled within 30 minutes on same platform
  const timeWindow = 30 * 60 * 1000; // 30 minutes in ms

  const conflictingItems = existingSchedule.filter(item => {
    if (!item.scheduled_time || item.platform !== platform) {
      return false;
    }

    const itemTime = new Date(item.scheduled_time);
    const timeDiff = Math.abs(itemTime.getTime() - scheduledTime.getTime());

    return timeDiff < timeWindow;
  });

  if (conflictingItems.length > 0) {
    const nextAvailable = new Date(scheduledTime);
    nextAvailable.setMinutes(nextAvailable.getMinutes() + 35);

    return {
      hasConflict: true,
      conflictingItems,
      recommendation: `Multiple posts scheduled on ${platform} within 30 minutes. Consider rescheduling to ${nextAvailable.toLocaleTimeString()} or later to avoid audience fatigue.`,
    };
  }

  // Check for too many posts in one day on same platform
  const sameDay = existingSchedule.filter(item => {
    if (!item.scheduled_time || item.platform !== platform) {
      return false;
    }

    const itemDate = new Date(item.scheduled_time).toDateString();
    const scheduledDate = scheduledTime.toDateString();

    return itemDate === scheduledDate;
  });

  if (sameDay.length >= 3) {
    return {
      hasConflict: true,
      conflictingItems: sameDay,
      recommendation: `${sameDay.length} posts already scheduled on ${platform} for this day. Consider spreading content across multiple days for better engagement.`,
    };
  }

  return {
    hasConflict: false,
    conflictingItems: [],
    recommendation: 'Schedule looks good!',
  };
}

/**
 * Analyze best days of week for posting based on historical metrics
 */
export function suggestBestDays(
  platform: Platform,
  historicalMetrics?: Array<{
    date: string;
    engagement: number;
    reach: number;
  }>
): BestDaysAnalysis[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // If no metrics, return platform defaults
  if (!historicalMetrics || historicalMetrics.length === 0) {
    const platformDays = PLATFORM_OPTIMAL_TIMES[platform].days;

    return platformDays.map(day => ({
      dayOfWeek: day,
      score: 0.8,
      averageEngagement: 0,
      postCount: 0,
    }));
  }

  // Analyze metrics by day of week
  const dayStats: Record<number, {
    totalEngagement: number;
    count: number;
    totalReach: number;
  }> = {};

  historicalMetrics.forEach(metric => {
    const date = new Date(metric.date);
    const dayOfWeek = date.getDay();

    if (!dayStats[dayOfWeek]) {
      dayStats[dayOfWeek] = {
        totalEngagement: 0,
        count: 0,
        totalReach: 0,
      };
    }

    dayStats[dayOfWeek].totalEngagement += metric.engagement;
    dayStats[dayOfWeek].totalReach += metric.reach;
    dayStats[dayOfWeek].count += 1;
  });

  // Calculate scores and averages
  const maxEngagement = Math.max(
    ...Object.values(dayStats).map(s => s.totalEngagement / s.count)
  );

  const results: BestDaysAnalysis[] = Object.entries(dayStats).map(([day, stats]) => {
    const averageEngagement = stats.totalEngagement / stats.count;
    const score = averageEngagement / maxEngagement;

    return {
      dayOfWeek: parseInt(day),
      score,
      averageEngagement,
      postCount: stats.count,
    };
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();

    // Get UTC time
    const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));

    // Get timezone time
    const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // Calculate offset in hours
    const offset = (tzTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);

    return Math.round(offset);
  } catch (error) {
    console.error('Invalid timezone:', timezone, error);
    return 0;
  }
}

/**
 * Generate recurring content schedule
 */
export function scheduleRecurring(
  baseContent: Partial<ContentItem>,
  config: RecurringSchedule
): Date[] {
  const scheduleDates: Date[] = [];
  const startDate = baseContent.scheduled_time
    ? new Date(baseContent.scheduled_time)
    : new Date();

  // Parse time of day
  const [hours, minutes] = config.timeOfDay.split(':').map(Number);

  let currentDate = new Date(startDate);
  currentDate.setHours(hours, minutes, 0, 0);

  const maxIterations = config.count || 52; // Max 1 year of weekly posts
  let iteration = 0;

  while (iteration < maxIterations) {
    // Check if we've passed end date
    if (config.endDate && currentDate > config.endDate) {
      break;
    }

    // Check if day matches criteria (for weekly/biweekly)
    const shouldInclude =
      config.frequency === 'daily' ||
      !config.daysOfWeek ||
      config.daysOfWeek.includes(currentDate.getDay());

    if (shouldInclude) {
      scheduleDates.push(new Date(currentDate));
      iteration++;
    }

    // Increment date based on frequency
    switch (config.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return scheduleDates;
}

/**
 * Find next available time slot that avoids conflicts
 */
export function findNextAvailableSlot(
  platform: Platform,
  preferredTime: Date,
  existingSchedule: ContentItem[],
  minGapMinutes: number = 30
): Date {
  let candidateTime = new Date(preferredTime);
  const maxAttempts = 48; // Check up to 48 hours ahead
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Check if this time has conflicts
    const conflict = validateSchedule(
      { scheduled_time: candidateTime.toISOString(), platform },
      existingSchedule
    );

    if (!conflict.hasConflict) {
      return candidateTime;
    }

    // Move forward by minGap
    candidateTime = new Date(candidateTime.getTime() + minGapMinutes * 60 * 1000);
    attempts++;
  }

  // If no slot found, return original time
  return preferredTime;
}

/**
 * Batch schedule optimization
 * Distributes multiple items across optimal time slots
 */
export function optimizeBatchSchedule(
  items: Array<Partial<ContentItem>>,
  dateRange: { start: Date; end: Date },
  existingSchedule: ContentItem[] = []
): Array<{ item: Partial<ContentItem>; scheduledTime: Date }> {
  const results: Array<{ item: Partial<ContentItem>; scheduledTime: Date }> = [];
  const workingSchedule = [...existingSchedule];

  items.forEach(item => {
    if (!item.platform) {
      console.warn('Item missing platform, skipping:', item);
      return;
    }

    // Calculate optimal time within date range
    const recommendation = calculateOptimalTime(
      item.platform,
      undefined,
      undefined,
      dateRange.start
    );

    // Ensure time is within range
    let scheduledTime = recommendation.suggestedTime;
    if (scheduledTime < dateRange.start) {
      scheduledTime = dateRange.start;
    } else if (scheduledTime > dateRange.end) {
      scheduledTime = dateRange.end;
    }

    // Find available slot
    scheduledTime = findNextAvailableSlot(
      item.platform,
      scheduledTime,
      workingSchedule
    );

    // Add to results and working schedule
    results.push({ item, scheduledTime });

    // Add to working schedule to avoid conflicts with subsequent items
    if (item.id) {
      workingSchedule.push({
        ...item,
        scheduled_time: scheduledTime.toISOString(),
      } as ContentItem);
    }
  });

  return results;
}

export default {
  calculateOptimalTime,
  validateSchedule,
  suggestBestDays,
  getTimezoneOffset,
  scheduleRecurring,
  findNextAvailableSlot,
  optimizeBatchSchedule,
};
