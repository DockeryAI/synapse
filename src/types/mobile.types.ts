/**
 * Mobile Optimization Types
 * Because apparently we need to scientifically measure thumb-scrolling addiction
 * Welcome to 2025, where we optimize for dopamine hits
 */

export type MobilePlatform = 'instagram' | 'tiktok' | 'facebook' | 'youtube-shorts' | 'twitter';

export type DeviceType = 'iphone' | 'android';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface DeviceDimensions {
  width: number;
  height: number;
  deviceName: string;
  deviceType: DeviceType;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface MobilePreviewConfig {
  platform: MobilePlatform;
  device: DeviceType;
  aspectRatio: AspectRatio;
  showUI: boolean; // Platform UI elements (likes, comments, etc.)
}

export interface ThumbScrollMetrics {
  stopScore: number; // 0-100: likelihood of stopping scroll
  hookStrength: number; // First 3 seconds impact (0-100)
  visualAppeal: number; // Visual stopping power (0-100)
  readability: number; // Text legibility on mobile (0-100)
  recommendations: string[];
  heatmapData?: HeatmapPoint[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1: attention intensity
  timestamp: number; // ms into video/image
}

export interface FormatValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // Overall format score (0-100)
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  fix?: string; // Suggested fix
}

export interface ValidationWarning {
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MobileContentRequirements {
  platform: MobilePlatform;
  minResolution: { width: number; height: number };
  maxResolution: { width: number; height: number };
  aspectRatio: AspectRatio[];
  minFontSize: number; // px
  maxCaptionLength: number;
  maxVideoLength: number; // seconds
  maxFileSize: number; // bytes
  requiredElements: string[];
  optimalLoadTime: number; // ms
}

export interface ContentAnalysis {
  content: string;
  contentType: 'video' | 'image' | 'carousel' | 'text';
  hook: {
    text: string;
    strength: number; // 0-100
    timeToHook: number; // seconds
  };
  visualElements: {
    hasText: boolean;
    textReadability: number;
    colorContrast: number;
    hasMotion: boolean;
    hasFaces: boolean;
  };
  thumbScrollScore: ThumbScrollMetrics;
  formatValidation: FormatValidationResult;
}

export interface ABTestVariant {
  id: string;
  hook: string;
  stopScore: number;
  impressions: number;
  stops: number;
  stopRate: number; // percentage
}

export interface ResponsiveIssue {
  component: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  element?: string;
  fix: string;
  location?: string; // file path
}

// Device presets - because we're not animals
export const DEVICE_PRESETS: Record<DeviceType, DeviceDimensions> = {
  iphone: {
    width: 390,
    height: 844,
    deviceName: 'iPhone 14',
    deviceType: 'iphone',
    safeArea: {
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    },
  },
  android: {
    width: 412,
    height: 915,
    deviceName: 'Pixel 7',
    deviceType: 'android',
    safeArea: {
      top: 24,
      bottom: 0,
      left: 0,
      right: 0,
    },
  },
};

// Platform requirements - the fun police
export const PLATFORM_REQUIREMENTS: Record<MobilePlatform, MobileContentRequirements> = {
  instagram: {
    platform: 'instagram',
    minResolution: { width: 1080, height: 1920 },
    maxResolution: { width: 1080, height: 1920 },
    aspectRatio: ['9:16', '1:1', '4:5'],
    minFontSize: 32,
    maxCaptionLength: 2200,
    maxVideoLength: 90,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    requiredElements: ['caption', 'hashtags'],
    optimalLoadTime: 3000,
  },
  tiktok: {
    platform: 'tiktok',
    minResolution: { width: 1080, height: 1920 },
    maxResolution: { width: 1080, height: 1920 },
    aspectRatio: ['9:16'],
    minFontSize: 36,
    maxCaptionLength: 2200,
    maxVideoLength: 600,
    maxFileSize: 287 * 1024 * 1024, // 287MB
    requiredElements: ['caption', 'sound'],
    optimalLoadTime: 2000,
  },
  facebook: {
    platform: 'facebook',
    minResolution: { width: 1080, height: 1080 },
    maxResolution: { width: 1920, height: 1920 },
    aspectRatio: ['16:9', '1:1', '9:16'],
    minFontSize: 28,
    maxCaptionLength: 63206,
    maxVideoLength: 240 * 60, // 240 minutes
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB (lol)
    requiredElements: ['caption'],
    optimalLoadTime: 3000,
  },
  'youtube-shorts': {
    platform: 'youtube-shorts',
    minResolution: { width: 1080, height: 1920 },
    maxResolution: { width: 1080, height: 1920 },
    aspectRatio: ['9:16'],
    minFontSize: 36,
    maxCaptionLength: 100,
    maxVideoLength: 60,
    maxFileSize: 256 * 1024 * 1024, // 256MB
    requiredElements: ['title'],
    optimalLoadTime: 2000,
  },
  twitter: {
    platform: 'twitter',
    minResolution: { width: 1200, height: 675 },
    maxResolution: { width: 1920, height: 1200 },
    aspectRatio: ['16:9', '1:1'],
    minFontSize: 24,
    maxCaptionLength: 280,
    maxVideoLength: 140,
    maxFileSize: 512 * 1024 * 1024, // 512MB
    requiredElements: ['caption'],
    optimalLoadTime: 3000,
  },
};

// Thumb-scroll scoring weights - the secret sauce (that will definitely need tweaking in prod)
export const SCROLL_SCORING_WEIGHTS = {
  hookStrength: 0.4, // First 3 seconds are CRITICAL
  visualAppeal: 0.35, // Gotta stop that thumb
  readability: 0.15, // Can they even read it?
  platformFit: 0.1, // Does it look native?
};

// Minimum acceptable scores (anything below these and your content is digital trash)
export const MINIMUM_SCORES = {
  stopScore: 70, // Below this? Don't even bother posting
  hookStrength: 60,
  visualAppeal: 65,
  readability: 75,
};
