/**
 * Platform Character Limits Configuration
 *
 * Defines character limits for different social media and content platforms.
 * Used for validating content length during generation.
 *
 * Created: 2025-11-11
 */

import type { PlatformLimits, Platform } from '@/types/synapseContent.types';

/**
 * Character limits by platform
 *
 * Each platform has min/max/optimal for:
 * - headline: Short attention-grabbing title
 * - body: Main content text
 * - total: Combined character count
 */
export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  'linkedin': {
    platform: 'linkedin',
    headline: { min: 40, max: 150, optimal: 120 },
    body: { min: 200, max: 3000, optimal: 1300 },
    total: { min: 300, max: 3000, optimal: 1400 }
  },

  'twitter': {
    platform: 'twitter',
    headline: { min: 30, max: 100, optimal: 80 },
    body: { min: 50, max: 280, optimal: 240 },
    total: { min: 100, max: 280, optimal: 250 }
  },

  'facebook': {
    platform: 'facebook',
    headline: { min: 40, max: 150, optimal: 120 },
    body: { min: 100, max: 5000, optimal: 1500 },
    total: { min: 200, max: 5000, optimal: 1600 }
  },

  'instagram': {
    platform: 'instagram',
    headline: { min: 30, max: 100, optimal: 80 },
    body: { min: 100, max: 2200, optimal: 1000 },
    total: { min: 150, max: 2200, optimal: 1100 }
  },

  'tiktok': {
    platform: 'tiktok',
    headline: { min: 30, max: 100, optimal: 80 },
    body: { min: 80, max: 2200, optimal: 800 },
    total: { min: 120, max: 2200, optimal: 900 }
  },

  'youtube': {
    platform: 'youtube',
    headline: { min: 40, max: 100, optimal: 70 },  // Video title
    body: { min: 100, max: 5000, optimal: 2000 },  // Description
    total: { min: 150, max: 5000, optimal: 2100 }
  }
};

/**
 * Get platform limits by name
 */
export function getPlatformLimits(platform: Platform): PlatformLimits {
  return PLATFORM_LIMITS[platform];
}

/**
 * Get all supported platforms
 */
export function getSupportedPlatforms(): Platform[] {
  return Object.keys(PLATFORM_LIMITS) as Platform[];
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: string): platform is Platform {
  return platform in PLATFORM_LIMITS;
}

/**
 * Get optimal character count for a specific section
 */
export function getOptimalCount(
  platform: Platform,
  section: 'headline' | 'body' | 'total'
): number {
  return PLATFORM_LIMITS[platform][section].optimal;
}

/**
 * Check if character count is within acceptable range
 */
export function isWithinRange(
  platform: Platform,
  section: 'headline' | 'body' | 'total',
  count: number
): boolean {
  const limits = PLATFORM_LIMITS[platform][section];
  return count >= limits.min && count <= limits.max;
}
