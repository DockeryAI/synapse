/**
 * Bannerbear Configuration
 *
 * Configuration for Bannerbear API integration
 * Used for automated visual generation
 */

export const BANNERBEAR_CONFIG = {
  apiUrl: 'https://api.bannerbear.com/v2',
  apiKey: import.meta.env.VITE_BANNERBEAR_API_KEY || '',
  timeout: 60000, // 60 seconds for image generation
  retry: {
    maxAttempts: 3,
    backoffMs: 1000
  },
  rateLimit: {
    concurrent: 2 // Process 2 images at a time
  }
};

/**
 * Check if Bannerbear is properly configured
 */
export function isBannerbearConfigured(): boolean {
  return Boolean(BANNERBEAR_CONFIG.apiKey && BANNERBEAR_CONFIG.apiKey.length > 0);
}

/**
 * Platform-specific aspect ratios and dimensions
 */
export const PLATFORM_SPECS = {
  linkedin: {
    feed: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    story: { width: 1080, height: 1920, aspectRatio: '9:16' }
  },
  facebook: {
    feed: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    story: { width: 1080, height: 1920, aspectRatio: '9:16' }
  },
  instagram: {
    feed: { width: 1080, height: 1080, aspectRatio: '1:1' },
    story: { width: 1080, height: 1920, aspectRatio: '9:16' },
    reel: { width: 1080, height: 1920, aspectRatio: '9:16' }
  },
  twitter: {
    feed: { width: 1200, height: 675, aspectRatio: '16:9' },
    card: { width: 800, height: 418, aspectRatio: '1.91:1' }
  },
  tiktok: {
    video: { width: 1080, height: 1920, aspectRatio: '9:16' }
  }
} as const;

export type PlatformKey = keyof typeof PLATFORM_SPECS;
export type PlatformFormat = keyof typeof PLATFORM_SPECS[PlatformKey];
