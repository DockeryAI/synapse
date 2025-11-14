/**
 * useCalendarGeneration Hook
 *
 * Orchestrates the 30-day calendar generation flow:
 * Specialty Detection → Calendar Population → Content Ideas Generation
 *
 * This hook connects the calendar population and content generation services,
 * transforming business intelligence into a full month of platform-optimized content.
 *
 * @example
 * ```tsx
 * const { calendar, loading, error, generate } = useCalendarGeneration();
 *
 * const handleGenerate = async (specialty: SpecialtyDetection) => {
 *   await generate(specialty, intelligenceData);
 *   // calendar contains 30 content items
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { CalendarPopulationService, ContentIdea } from '../services/calendar-population.service';
import { ContentIdeasGeneratorService, ContentSuggestion } from '../services/content-ideas-generator.service';
import type { SpecialtyDetection } from '../services/specialty-detection.service';
import type { IntelligenceResult } from '../services/parallel-intelligence.service';

/**
 * Calendar item combining base idea with platform-specific suggestions
 */
export interface CalendarItem {
  /** Base content idea */
  idea: ContentIdea;
  /** Platform-specific suggestions */
  suggestions: ContentSuggestion;
  /** Unique identifier */
  id: string;
  /** Scheduled day (1-30) */
  day: number;
}

/**
 * Complete calendar data
 */
export interface CalendarData {
  /** All 30 calendar items */
  items: CalendarItem[];
  /** Business specialty this calendar is for */
  specialty: SpecialtyDetection;
  /** Distribution statistics */
  stats: {
    educational: number;
    promotional: number;
    engagement: number;
    byPlatform: Record<string, number>;
  };
  /** When calendar was generated */
  generatedAt: Date;
}

/**
 * Current step in calendar generation
 */
export type CalendarGenerationStep =
  | 'idle'
  | 'populating'
  | 'enhancing'
  | 'complete'
  | 'error';

/**
 * Error during calendar generation
 */
export interface CalendarGenerationError {
  /** Which step failed */
  step: CalendarGenerationStep;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
}

/**
 * Return type of useCalendarGeneration hook
 */
export interface UseCalendarGenerationReturn {
  /** Complete calendar data (null until generated) */
  calendar: CalendarData | null;
  /** Is generation currently running */
  loading: boolean;
  /** Current step in the process */
  currentStep: CalendarGenerationStep;
  /** Error if one occurred */
  error: CalendarGenerationError | null;
  /** Generate the calendar */
  generate: (specialty: SpecialtyDetection, intelligence?: IntelligenceResult[]) => Promise<CalendarData>;
  /** Reset the calendar state */
  reset: () => void;
  /** Progress percentage (0-100) */
  progress: number;
}

// Initialize services
const calendarPopulator = new CalendarPopulationService();
const contentGenerator = new ContentIdeasGeneratorService();

/**
 * Custom hook for orchestrating 30-day calendar generation
 *
 * Handles the complete flow from specialty detection to platform-optimized content,
 * including distribution management and error handling.
 *
 * @returns {UseCalendarGenerationReturn} Calendar generation state and controls
 */
export function useCalendarGeneration(): UseCalendarGenerationReturn {
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<CalendarGenerationStep>('idle');
  const [error, setError] = useState<CalendarGenerationError | null>(null);

  /**
   * Calculate progress percentage based on current step
   */
  const getProgress = useCallback((): number => {
    switch (currentStep) {
      case 'idle':
        return 0;
      case 'populating':
        return 30;
      case 'enhancing':
        return 70;
      case 'complete':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  }, [currentStep]);

  /**
   * Reset calendar state to initial values
   */
  const reset = useCallback(() => {
    setCalendar(null);
    setLoading(false);
    setCurrentStep('idle');
    setError(null);
  }, []);

  /**
   * Calculate distribution statistics
   */
  const calculateStats = useCallback((items: CalendarItem[]) => {
    const stats = {
      educational: 0,
      promotional: 0,
      engagement: 0,
      byPlatform: {} as Record<string, number>
    };

    items.forEach(item => {
      // Count by content type
      stats[item.idea.contentType]++;

      // Count by platform
      const platform = item.idea.platform;
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
    });

    return stats;
  }, []);

  /**
   * Generate a complete 30-day content calendar
   *
   * @param specialty - Detected business specialty
   * @param intelligence - Optional intelligence data for enhanced generation
   * @returns Promise resolving to complete calendar data
   * @throws {CalendarGenerationError} If any step fails
   */
  const generate = useCallback(async (
    specialty: SpecialtyDetection,
    intelligence?: IntelligenceResult[]
  ): Promise<CalendarData> => {
    console.log('📅 Starting calendar generation for:', specialty.specialty);

    // Reset state
    setCalendar(null);
    setError(null);
    setLoading(true);

    try {
      // STEP 1: Populate Calendar (generate 30 content ideas)
      setCurrentStep('populating');
      console.log('📝 Step 1/2: Populating 30-day calendar...');

      const brandId = 'temp-brand-id'; // This would come from context/props in real usage
      const contentIdeas = await calendarPopulator.populate(
        brandId,
        specialty,
        intelligence || []
      );

      if (contentIdeas.length !== 30) {
        console.warn(`⚠️ Expected 30 ideas, got ${contentIdeas.length}`);
      }

      console.log(`✅ Calendar populated with ${contentIdeas.length} ideas`);
      console.log(`   Distribution:`, calendarPopulator.getDistributionStats(contentIdeas).byType);

      // STEP 2: Enhance with Platform-Specific Suggestions
      setCurrentStep('enhancing');
      console.log('🎨 Step 2/2: Generating platform-specific content...');

      const contentSuggestions = await contentGenerator.generateSuggestions(
        contentIdeas,
        specialty
      );

      console.log(`✅ Generated ${contentSuggestions.length} platform-optimized suggestions`);

      // Complete!
      setCurrentStep('complete');

      // Combine ideas with suggestions into calendar items
      const calendarItems: CalendarItem[] = contentSuggestions.map((suggestion, index) => ({
        idea: suggestion.idea,
        suggestions: suggestion,
        id: `calendar-item-${suggestion.idea.id}`,
        day: suggestion.idea.scheduledDay
      }));

      // Calculate statistics
      const stats = calculateStats(calendarItems);

      const calendarData: CalendarData = {
        items: calendarItems,
        specialty,
        stats,
        generatedAt: new Date()
      };

      setCalendar(calendarData);
      setLoading(false);

      console.log('🎉 Calendar generation complete!');
      console.log('   30-day content calendar ready for scheduling');

      return calendarData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      const calendarError: CalendarGenerationError = {
        step: currentStep,
        message: errorMessage,
        originalError: err instanceof Error ? err : undefined
      };

      console.error('❌ Calendar generation failed at step:', currentStep);
      console.error('   Error:', errorMessage);

      setError(calendarError);
      setCurrentStep('error');
      setLoading(false);

      throw calendarError;
    }
  }, [currentStep, calculateStats]);

  return {
    calendar,
    loading,
    currentStep,
    error,
    generate,
    reset,
    progress: getProgress()
  };
}

/**
 * Helper function to get user-friendly step names
 */
export function getCalendarStepName(step: CalendarGenerationStep): string {
  switch (step) {
    case 'idle':
      return 'Ready';
    case 'populating':
      return 'Populating Calendar';
    case 'enhancing':
      return 'Enhancing Content';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get step descriptions
 */
export function getCalendarStepDescription(step: CalendarGenerationStep): string {
  switch (step) {
    case 'idle':
      return 'Ready to generate 30-day content calendar';
    case 'populating':
      return 'Generating 30 content ideas based on your business specialty...';
    case 'enhancing':
      return 'Creating platform-specific variations for Instagram, Facebook, Twitter, LinkedIn, and TikTok...';
    case 'complete':
      return '30-day content calendar ready!';
    case 'error':
      return 'An error occurred during calendar generation';
    default:
      return '';
  }
}
