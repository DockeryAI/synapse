/**
 * Preview System Types for Dashboard V2 - Track B
 * Live preview, split view, timeline visualization, and platform-specific rendering
 */

import type { CampaignPiece, EmotionalTrigger } from './campaign.types';

// ============================================================================
// Split View Configuration
// ============================================================================

export type SplitViewRatio = '40/60' | '50/50' | '60/40';

export type SplitViewPane = 'editor' | 'preview';

export interface SplitViewConfig {
  ratio: SplitViewRatio;
  collapsedPane?: SplitViewPane;
  fullScreenMode: boolean;
  syncScroll: boolean;
  dividerPosition: number; // percentage (0-100)
}

export interface SplitViewState {
  isDragging: boolean;
  startX: number;
  startPosition: number;
}

// ============================================================================
// Timeline Visualization
// ============================================================================

export interface TimelineDay {
  dayNumber: number;
  date: string;
  pieces: CampaignPiece[];
  emotionalTriggers: EmotionalTrigger[];
  isMilestone: boolean;
  milestoneType?: 'checkpoint' | 'campaign_end' | 'phase_transition';
}

export interface TimelineVisualizationData {
  days: TimelineDay[];
  totalDuration: number;
  emotionalProgression: EmotionalTriggerBand[];
  milestones: TimelineMilestone[];
}

export interface EmotionalTriggerBand {
  trigger: EmotionalTrigger;
  color: string;
  startDay: number;
  endDay: number;
  intensity: number; // 0-100
}

export interface TimelineMilestone {
  dayNumber: number;
  type: 'checkpoint' | 'campaign_end' | 'phase_transition';
  label: string;
  description?: string;
}

export interface TimelinePiecePreview {
  pieceId: string;
  title: string;
  content: string;
  emotionalTrigger: EmotionalTrigger;
  preview: string; // truncated content
}

// ============================================================================
// Platform Preview
// ============================================================================

export type PlatformType =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'email';

export type PreviewDevice = 'desktop' | 'mobile';

export type PreviewOrientation = 'portrait' | 'landscape';

export interface PlatformPreviewOptions {
  platform: PlatformType;
  device: PreviewDevice;
  orientation?: PreviewOrientation;
  showCharacterCount: boolean;
  showHashtagHighlight: boolean;
  showLinkPreview: boolean;
  showEmoji: boolean;
}

export interface PlatformLimits {
  platform: PlatformType;
  maxCharacters: number;
  maxHashtags: number;
  maxMentions: number;
  supportsImages: boolean;
  supportsVideos: boolean;
  supportsLinks: boolean;
  imageAspectRatios: string[]; // e.g., ['1:1', '16:9', '9:16']
}

export interface PlatformPreviewData {
  content: string;
  characterCount: number;
  characterLimit: number;
  hashtags: string[];
  mentions: string[];
  links: LinkPreview[];
  warnings: PreviewWarning[];
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  domain: string;
}

export interface PreviewWarning {
  type: 'character_limit' | 'hashtag_limit' | 'mention_limit' | 'image_size' | 'video_duration';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// ============================================================================
// Mobile Device Specifications
// ============================================================================

export type MobileDevice = 'iphone14' | 'iphone14pro' | 'galaxys23' | 'pixel7' | 'generic';

export interface MobileDeviceSpec {
  id: MobileDevice;
  name: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  safeAreaInsets: SafeAreaInsets;
  frameAsset?: string; // path to device frame image
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ============================================================================
// Preview State Management
// ============================================================================

export interface PreviewState {
  currentPieceId: string | null;
  selectedPlatform: PlatformType;
  selectedDevice: PreviewDevice;
  selectedMobileDevice: MobileDevice;
  orientation: PreviewOrientation;
  splitViewConfig: SplitViewConfig;
  previewData: PlatformPreviewData | null;
  timelineData: TimelineVisualizationData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

export interface PreviewSnapshot {
  id: string;
  timestamp: number;
  pieceId: string;
  platform: PlatformType;
  content: string;
  previewData: PlatformPreviewData;
  imageDataUrl?: string; // base64 encoded screenshot
}

export interface PreviewCache {
  [key: string]: {
    data: PlatformPreviewData;
    timestamp: number;
    expiresAt: number;
  };
}

// ============================================================================
// Preview Renderer Configuration
// ============================================================================

export interface PreviewRendererConfig {
  debounceDelay: number; // milliseconds
  cacheExpiration: number; // milliseconds
  enableAutoSave: boolean;
  enableSnapshots: boolean;
  maxSnapshotHistory: number;
}

export interface RenderOptions {
  platform: PlatformType;
  device: PreviewDevice;
  content: string;
  includeMetadata: boolean;
  generateThumbnail: boolean;
}

// ============================================================================
// Content Analysis
// ============================================================================

export interface ContentAnalysis {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  hashtags: string[];
  mentions: string[];
  emojis: string[];
  links: string[];
  readabilityScore: number;
  sentimentScore: number;
  emotionalTone: EmotionalTrigger[];
}

// ============================================================================
// Export Types
// ============================================================================

export interface PreviewExportOptions {
  format: 'png' | 'jpg' | 'pdf';
  includeDeviceFrame: boolean;
  includeMetadata: boolean;
  quality: number; // 0-100
  width?: number;
  height?: number;
}

// ============================================================================
// Platform-Specific Types
// ============================================================================

export interface FacebookPreview {
  type: 'post' | 'story' | 'reel';
  content: string;
  linkPreview?: LinkPreview;
  imageUrls?: string[];
  videoUrl?: string;
  callToAction?: string;
}

export interface InstagramPreview {
  type: 'feed' | 'story' | 'reel';
  content: string;
  hashtags: string[];
  location?: string;
  imageUrls?: string[];
  aspectRatio: '1:1' | '4:5' | '9:16';
}

export interface LinkedInPreview {
  type: 'post' | 'article';
  content: string;
  headline?: string;
  hashtags: string[];
  linkPreview?: LinkPreview;
  imageUrl?: string;
}

export interface TwitterPreview {
  content: string;
  hashtags: string[];
  mentions: string[];
  linkPreview?: LinkPreview;
  imageUrls?: string[];
  isThread: boolean;
  threadPosition?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const PLATFORM_LIMITS: Record<PlatformType, PlatformLimits> = {
  facebook: {
    platform: 'facebook',
    maxCharacters: 63206,
    maxHashtags: 30,
    maxMentions: 50,
    supportsImages: true,
    supportsVideos: true,
    supportsLinks: true,
    imageAspectRatios: ['1:1', '16:9', '4:5'],
  },
  instagram: {
    platform: 'instagram',
    maxCharacters: 2200,
    maxHashtags: 30,
    maxMentions: 20,
    supportsImages: true,
    supportsVideos: true,
    supportsLinks: false, // only in bio
    imageAspectRatios: ['1:1', '4:5', '9:16'],
  },
  linkedin: {
    platform: 'linkedin',
    maxCharacters: 3000,
    maxHashtags: 5,
    maxMentions: 30,
    supportsImages: true,
    supportsVideos: true,
    supportsLinks: true,
    imageAspectRatios: ['1:1', '16:9', '1.91:1'],
  },
  twitter: {
    platform: 'twitter',
    maxCharacters: 280,
    maxHashtags: 2, // recommended
    maxMentions: 10,
    supportsImages: true,
    supportsVideos: true,
    supportsLinks: true,
    imageAspectRatios: ['16:9', '1:1'],
  },
  tiktok: {
    platform: 'tiktok',
    maxCharacters: 2200,
    maxHashtags: 5,
    maxMentions: 20,
    supportsImages: false,
    supportsVideos: true,
    supportsLinks: false,
    imageAspectRatios: ['9:16'],
  },
  youtube: {
    platform: 'youtube',
    maxCharacters: 5000,
    maxHashtags: 15,
    maxMentions: 30,
    supportsImages: true, // thumbnails
    supportsVideos: true,
    supportsLinks: true,
    imageAspectRatios: ['16:9'],
  },
  email: {
    platform: 'email',
    maxCharacters: 100000,
    maxHashtags: 0,
    maxMentions: 0,
    supportsImages: true,
    supportsVideos: false,
    supportsLinks: true,
    imageAspectRatios: ['16:9', '1:1', '2:1'],
  },
};

export const MOBILE_DEVICE_SPECS: Record<MobileDevice, MobileDeviceSpec> = {
  iphone14: {
    id: 'iphone14',
    name: 'iPhone 14',
    screenWidth: 390,
    screenHeight: 844,
    pixelRatio: 3,
    safeAreaInsets: { top: 47, right: 0, bottom: 34, left: 0 },
  },
  iphone14pro: {
    id: 'iphone14pro',
    name: 'iPhone 14 Pro',
    screenWidth: 393,
    screenHeight: 852,
    pixelRatio: 3,
    safeAreaInsets: { top: 59, right: 0, bottom: 34, left: 0 },
  },
  galaxys23: {
    id: 'galaxys23',
    name: 'Galaxy S23',
    screenWidth: 360,
    screenHeight: 780,
    pixelRatio: 3,
    safeAreaInsets: { top: 24, right: 0, bottom: 0, left: 0 },
  },
  pixel7: {
    id: 'pixel7',
    name: 'Pixel 7',
    screenWidth: 412,
    screenHeight: 915,
    pixelRatio: 2.625,
    safeAreaInsets: { top: 24, right: 0, bottom: 0, left: 0 },
  },
  generic: {
    id: 'generic',
    name: 'Generic Mobile',
    screenWidth: 375,
    screenHeight: 667,
    pixelRatio: 2,
    safeAreaInsets: { top: 20, right: 0, bottom: 0, left: 0 },
  },
};

export const EMOTIONAL_TRIGGER_COLORS: Record<EmotionalTrigger, string> = {
  fear: '#EF4444', // red
  trust: '#3B82F6', // blue
  security: '#10B981', // green
  efficiency: '#8B5CF6', // purple
  growth: '#06B6D4', // cyan
  innovation: '#F59E0B', // amber
  safety: '#84CC16', // lime
  hope: '#EC4899', // pink
  opportunity: '#14B8A6', // teal
  urgency: '#F97316', // orange
  curiosity: '#6366F1', // indigo
  authority: '#64748B', // slate
};
