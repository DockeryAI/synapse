/**
 * Design Studio Type Definitions
 * Types for the visual content creation tool integrated with Content Calendar
 */

import type { Platform } from './content-calendar.types';

/**
 * Complete design data structure stored in database
 */
export interface DesignData {
  /** Version for backwards compatibility */
  version: string;
  /** Fabric.js canvas JSON representation */
  canvas: any;
  /** Design metadata */
  metadata: {
    width: number;
    height: number;
    platform?: Platform;
    template?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Export options for canvas output
 */
export interface ExportOptions {
  /** Output format */
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  /** Quality for JPG (0-1) */
  quality?: number;
  /** Resolution multiplier (1x, 2x, 3x) */
  multiplier?: number;
  /** Transparent background (PNG only) */
  withoutBackground?: boolean;
  /** Background color if not transparent */
  backgroundColor?: string;
}

/**
 * Design template stored in database
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  platform: Platform;
  width: number;
  height: number;
  thumbnail: string;
  designData: DesignData;
  isPremium: boolean;
  isCustom: boolean;
  createdBy?: string;
  tags?: string[];
}

/**
 * Shape types supported by canvas
 */
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'line' | 'polygon' | 'star';

/**
 * Design tool types
 */
export type ToolType = 'select' | 'text' | 'shape' | 'image' | 'draw' | 'crop' | 'hand' | 'zoom';

/**
 * Canvas history state for undo/redo
 */
export interface CanvasState {
  /** Fabric.js JSON snapshot */
  json: any;
  /** Timestamp of state */
  timestamp: number;
}

/**
 * Platform-specific canvas presets
 */
export interface PlatformPreset {
  id: string;
  name: string;
  platform: Platform;
  width: number;
  height: number;
  description?: string;
}

/**
 * Brand asset for design studio
 */
export interface BrandAsset {
  id: string;
  type: 'logo' | 'image' | 'color' | 'font';
  name: string;
  value: string; // URL for images, hex for colors, font name for fonts
  thumbnail?: string;
  metadata?: Record<string, any>;
}

/**
 * Unsplash photo result
 */
export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  description?: string;
  alt_description?: string;
  width: number;
  height: number;
}

/**
 * Layer information for layer panel
 */
export interface LayerInfo {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape' | 'group';
  visible: boolean;
  locked: boolean;
  thumbnail?: string;
  opacity: number;
}

/**
 * Text style properties
 */
export interface TextProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fill: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  charSpacing: number;
}

/**
 * Shape style properties
 */
export interface ShapeProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rx?: number; // Corner radius for rectangles
  ry?: number;
}

/**
 * Image filter types
 */
export type ImageFilter =
  | 'grayscale'
  | 'sepia'
  | 'brightness'
  | 'contrast'
  | 'blur';

/**
 * Image properties
 */
export interface ImageProperties {
  width: number;
  height: number;
  opacity: number;
  filters: ImageFilter[];
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

/**
 * Common transform properties for all objects
 */
export interface TransformProperties {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  flipX: boolean;
  flipY: boolean;
}

/**
 * Template category
 */
export type TemplateCategory =
  | 'Social Post'
  | 'Story'
  | 'Ad'
  | 'Banner'
  | 'Thumbnail'
  | 'Infographic';

/**
 * Platform presets configuration
 */
export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  'instagram-post': {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'instagram',
    width: 1080,
    height: 1080,
    description: 'Square post for Instagram feed'
  },
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'instagram',
    width: 1080,
    height: 1920,
    description: 'Vertical story format'
  },
  'facebook-post': {
    id: 'facebook-post',
    name: 'Facebook Post',
    platform: 'facebook',
    width: 1200,
    height: 630,
    description: 'Standard Facebook post image'
  },
  'facebook-cover': {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    platform: 'facebook',
    width: 820,
    height: 312,
    description: 'Facebook cover photo'
  },
  'linkedin-post': {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'linkedin',
    width: 1200,
    height: 627,
    description: 'LinkedIn feed post'
  },
  'linkedin-banner': {
    id: 'linkedin-banner',
    name: 'LinkedIn Banner',
    platform: 'linkedin',
    width: 1584,
    height: 396,
    description: 'LinkedIn profile banner'
  },
  'twitter-post': {
    id: 'twitter-post',
    name: 'Twitter Post',
    platform: 'twitter',
    width: 1600,
    height: 900,
    description: 'Twitter post image'
  },
  'twitter-header': {
    id: 'twitter-header',
    name: 'Twitter Header',
    platform: 'twitter',
    width: 1500,
    height: 500,
    description: 'Twitter profile header'
  },
  'tiktok-video': {
    id: 'tiktok-video',
    name: 'TikTok Thumbnail',
    platform: 'tiktok',
    width: 1080,
    height: 1920,
    description: 'TikTok video thumbnail'
  },
};

/**
 * Default fonts available in design studio
 */
export const DEFAULT_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Avant Garde',
];

/**
 * Google Fonts integration (popular 50)
 */
export const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Merriweather',
  'PT Sans',
  'Ubuntu',
  'Playfair Display',
  'Nunito',
  'Mukta',
  'Rubik',
  'Work Sans',
  'Inter',
  'Quicksand',
  'Karla',
  'Barlow',
  'DM Sans',
];

/**
 * Keyboard shortcuts mapping
 */
export const KEYBOARD_SHORTCUTS = {
  // Tools
  V: 'select',
  T: 'text',
  R: 'shape',
  I: 'image',
  P: 'draw',
  H: 'hand',
  Z: 'zoom',

  // Edit operations
  'Ctrl+Z': 'undo',
  'Cmd+Z': 'undo',
  'Ctrl+Y': 'redo',
  'Cmd+Shift+Z': 'redo',
  'Ctrl+C': 'copy',
  'Cmd+C': 'copy',
  'Ctrl+V': 'paste',
  'Cmd+V': 'paste',
  'Ctrl+D': 'duplicate',
  'Cmd+D': 'duplicate',
  'Ctrl+A': 'selectAll',
  'Cmd+A': 'selectAll',
  'Delete': 'delete',
  'Backspace': 'delete',
  'Escape': 'deselect',

  // Layer operations
  'Ctrl+]': 'bringForward',
  'Cmd+]': 'bringForward',
  'Ctrl+[': 'sendBackward',
  'Cmd+[': 'sendBackward',
  'Ctrl+Shift+]': 'bringToFront',
  'Cmd+Shift+]': 'bringToFront',
  'Ctrl+Shift+[': 'sendToBack',
  'Cmd+Shift+[': 'sendToBack',

  // Save
  'Ctrl+S': 'save',
  'Cmd+S': 'save',
} as const;
