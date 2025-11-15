/**
 * VISUAL TYPES
 *
 * Types for visual generation and template management
 */

// ============================================================================
// VISUAL STYLES
// ============================================================================

export type ColorScheme = 'trust' | 'urgency' | 'friendly' | 'professional' | 'bold';

export type VisualLayout = 'centered' | 'split' | 'list' | 'quote' | 'hero';

export type VisualStyle = 'minimal' | 'modern' | 'bold' | 'elegant' | 'playful';

// ============================================================================
// VISUAL TEMPLATE
// ============================================================================

export interface VisualTemplate {
  id: string;
  name: string; // User-friendly: "Professional Post", "Bold Announcement"
  description: string;

  // Bannerbear integration
  bannerbearTemplateId: string;

  // Content mapping
  suitableFor: string[]; // Content types this works for
  platforms: string[]; // Which platforms (facebook, instagram, etc.)

  // Visual characteristics
  colorScheme: ColorScheme;
  layout: VisualLayout;
  style: VisualStyle;

  // Dimensions
  width: number;
  height: number;
  aspectRatio: string; // "1:1", "16:9", "9:16"

  // Template variables
  requiredFields: string[]; // What data is needed
  optionalFields: string[];

  // Usage
  useCount?: number;
  avgPerformance?: number;

  // Psychology (hidden)
  psychologyTags?: {
    primaryEmotion: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    trustLevel: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// BRAND VISUAL IDENTITY
// ============================================================================

export interface BrandVisualIdentity {
  // Colors
  primaryColor: string; // Hex
  secondaryColor?: string;
  accentColor?: string;
  colorPalette?: string[]; // Full palette

  // Typography
  primaryFont?: string;
  secondaryFont?: string;

  // Logo
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

  // Style preferences
  preferredStyle?: VisualStyle;
  preferredLayout?: VisualLayout;

  // Brand elements
  tagline?: string;
  website?: string;
  socialHandles?: Record<string, string>;
}

// ============================================================================
// VISUAL GENERATION
// ============================================================================

export interface VisualGenerationParams {
  contentId: string;
  contentText: string;
  contentType: string;
  platform: string;

  // Brand context
  brandName: string;
  brandIdentity?: BrandVisualIdentity;

  // Visual preferences
  templateId?: string; // Specific template to use
  colorScheme?: ColorScheme;
  style?: VisualStyle;

  // Customization
  headline?: string;
  subheadline?: string;
  cta?: string;
  additionalText?: Record<string, string>;
}

export interface VisualGenerationResult {
  success: boolean;
  imageUrl?: string;
  templateUsed: string;
  generationTime: number; // ms
  error?: string;
}

// ============================================================================
// VISUAL SELECTION
// ============================================================================

export interface VisualSelectionCriteria {
  contentType: string;
  platform: string;
  colorScheme?: ColorScheme;
  style?: VisualStyle;
  aspectRatio?: string;
}

export interface VisualTemplateMatch {
  template: VisualTemplate;
  score: number; // 0-100 match confidence
  reason: string;
}
