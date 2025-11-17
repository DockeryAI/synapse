/**
 * Video System Type Definitions
 *
 * Defines types for video content generation, Stories ads, captions, and trending audio
 */

// ============================================================================
// VIDEO TEMPLATES
// ============================================================================

/**
 * Video template types for different content formats
 */
export type VideoTemplateType =
  | 'behind_the_scenes'
  | 'product_demo'
  | 'testimonial'
  | 'tutorial'
  | 'trending';

/**
 * Video aspect ratios
 */
export type VideoAspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

/**
 * Video duration range (in seconds)
 */
export interface VideoDuration {
  min: number;
  max: number;
  optimal: number;
}

/**
 * Video template structure with hook, body, and CTA
 */
export interface VideoTemplate {
  id: string;
  type: VideoTemplateType;
  name: string;
  description: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;

  // Template sections
  hook: VideoHook;
  body: VideoBody;
  cta: VideoCTA;

  // Platform optimization
  platforms: ('tiktok' | 'instagram_reels' | 'youtube_shorts' | 'facebook_reels')[];

  // Template metadata
  idealFor: string[];
  engagementMultiplier: number; // Expected engagement boost (e.g., 10 = 10x)
}

/**
 * Video hook (first 3 seconds)
 */
export interface VideoHook {
  duration: number; // Seconds (typically 3)
  strategies: string[];
  examples: string[];
}

/**
 * Video body content
 */
export interface VideoBody {
  duration: number; // Seconds
  structure: string[];
  pacing: 'fast' | 'medium' | 'slow';
}

/**
 * Video call-to-action
 */
export interface VideoCTA {
  duration: number; // Seconds
  types: string[];
  placement: 'overlay' | 'end_screen' | 'both';
}

// ============================================================================
// STORIES ADS
// ============================================================================

/**
 * Stories ad template types
 */
export type StoriesAdType =
  | 'flash_sale'
  | 'product_launch'
  | 'event_promotion'
  | 'limited_offer';

/**
 * Stories ad template
 */
export interface StoriesAdTemplate {
  id: string;
  type: StoriesAdType;
  name: string;
  description: string;

  // Always vertical full-screen
  aspectRatio: '9:16';
  duration: VideoDuration;

  // Stories-specific features
  features: StoriesAdFeatures;

  // Cost optimization
  targetCPM: {
    min: number; // $0.50
    max: number; // $2.00
  };

  // Platform support
  platforms: ('instagram' | 'facebook')[];
}

/**
 * Stories ad features
 */
export interface StoriesAdFeatures {
  countdownSticker: boolean;
  swipeUpCTA: boolean;
  productTags: boolean;
  pollSticker: boolean;
  questionSticker: boolean;
  brandOverlay: BrandOverlay;
}

/**
 * Brand overlay configuration
 */
export interface BrandOverlay {
  logo: boolean;
  colors: boolean;
  position: 'top' | 'bottom' | 'corner';
  opacity: number;
}

// ============================================================================
// AUTO-CAPTIONS
// ============================================================================

/**
 * Caption format types
 */
export type CaptionFormat = 'srt' | 'vtt' | 'ass' | 'burned';

/**
 * Caption configuration
 */
export interface CaptionConfig {
  format: CaptionFormat;
  language: string;

  // Styling
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: 'top' | 'middle' | 'bottom';

  // Timing
  maxCharsPerLine: number;
  maxLinesPerCaption: number;
  wordTiming: boolean;
}

/**
 * Caption segment (single caption with timing)
 */
export interface CaptionSegment {
  id: number;
  startTime: number; // Seconds
  endTime: number; // Seconds
  text: string;
  confidence?: number; // Whisper API confidence score
}

/**
 * Caption generation result
 */
export interface CaptionResult {
  segments: CaptionSegment[];
  language: string;
  duration: number;
  averageConfidence: number;
  srtContent?: string;
  vttContent?: string;
}

// ============================================================================
// TRENDING AUDIO
// ============================================================================

/**
 * Audio platforms
 */
export type AudioPlatform = 'tiktok' | 'instagram_reels' | 'youtube_shorts';

/**
 * Audio genre/vibe
 */
export type AudioGenre =
  | 'upbeat'
  | 'chill'
  | 'dramatic'
  | 'inspirational'
  | 'funny'
  | 'trending';

/**
 * Trending audio track
 */
export interface TrendingAudio {
  id: string;
  title: string;
  artist: string;

  // Licensing
  licensed: boolean;
  licenseType: 'royalty_free' | 'commercial' | 'attribution';

  // Platform data
  platforms: AudioPlatform[];
  trendScore: number; // 0-100, higher = more trending

  // Audio metadata
  genre: AudioGenre;
  duration: number; // Seconds
  bpm: number;

  // Usage data
  usageCount: number;
  lastTrendingDate: string;

  // File
  audioUrl: string;
  previewUrl: string;
}

/**
 * Audio suggestion based on campaign type
 */
export interface AudioSuggestion {
  audio: TrendingAudio;
  reason: string;
  matchScore: number; // 0-100
  campaignTypeId: string;
}

// ============================================================================
// VIDEO GENERATION
// ============================================================================

/**
 * Video generation request
 */
export interface VideoGenerationRequest {
  templateId: string;
  content: VideoContent;
  config: VideoGenerationConfig;
}

/**
 * Video content to be rendered
 */
export interface VideoContent {
  hook: string;
  body: string;
  cta: string;

  // Media assets
  images?: string[];
  videoClips?: string[];
  logo?: string;

  // Branding
  brandColor?: string;
  brandFont?: string;
}

/**
 * Video generation configuration
 */
export interface VideoGenerationConfig {
  aspectRatio: VideoAspectRatio;
  duration: number;

  // Features
  captions: boolean;
  captionConfig?: CaptionConfig;

  audio: boolean;
  audioId?: string;

  // Output
  quality: 'draft' | 'high' | 'production';
  format: 'mp4' | 'mov' | 'webm';
}

/**
 * Video generation result
 */
export interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  aspectRatio: VideoAspectRatio;
  fileSize: number; // Bytes

  // Metadata
  captions?: CaptionResult;
  audioId?: string;

  // Quality metrics
  estimatedEngagement: number;
  stopScore?: number; // Thumb-scroll stopping score
}

// ============================================================================
// VIDEO ANALYTICS
// ============================================================================

/**
 * Video performance metrics
 */
export interface VideoPerformance {
  videoId: string;
  views: number;
  engagement: number; // Likes, comments, shares
  watchTime: number; // Average watch time in seconds
  completionRate: number; // Percentage who watched to end

  // Platform breakdown
  platformMetrics: {
    platform: string;
    views: number;
    engagement: number;
  }[];

  // Comparison
  engagementMultiplier: number; // Actual vs static posts
}
