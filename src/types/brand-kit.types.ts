/**
 * BRAND KIT TYPES
 *
 * Types for brand visual identity management
 * Extracted from Mirror diagnostics and applied to visuals
 */

// ============================================================================
// BRAND KIT
// ============================================================================

export interface BrandKit {
  id: string;
  brandId: string;

  // Colors
  primaryColor: string; // Hex color
  secondaryColor: string;
  accentColor?: string;
  colorPalette?: string[]; // Full palette if available

  // Typography
  fontFamily: string; // Default: 'Inter'
  headingFont?: string;
  bodyFont?: string;

  // Logo
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

  // Style
  style: BrandStyle;
  tone?: string; // 'professional', 'friendly', 'authoritative', etc.

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'mirror' | 'manual' | 'ai-generated' | 'defaults';
}

export type BrandStyle = 'professional' | 'friendly' | 'bold' | 'minimal' | 'elegant';

// ============================================================================
// BRAND KIT EXTRACTION (From Mirror)
// ============================================================================

export interface MirrorVisualData {
  colors?: string[];
  logoUrl?: string;
  archetype?: string;
  businessModel?: string;
  tone?: string;
}

export interface BrandKitExtractionResult {
  success: boolean;
  brandKit?: BrandKit;
  source: 'mirror' | 'defaults';
  warnings?: string[];
}

// ============================================================================
// DEFAULT BRAND KITS
// ============================================================================

export const DEFAULT_BRAND_KITS: Record<string, Partial<BrandKit>> = {
  restaurant: {
    primaryColor: '#f59e0b', // Warm amber
    secondaryColor: '#dc2626', // Rich red
    accentColor: '#fbbf24', // Light yellow
    style: 'friendly',
    fontFamily: 'Inter',
  },
  cpa: {
    primaryColor: '#1e40af', // Professional blue
    secondaryColor: '#64748b', // Neutral gray
    accentColor: '#10b981', // Trust green
    style: 'professional',
    fontFamily: 'Inter',
  },
  realtor: {
    primaryColor: '#0369a1', // Trust blue
    secondaryColor: '#be123c', // Bold red
    accentColor: '#fbbf24', // Gold accent
    style: 'bold',
    fontFamily: 'Inter',
  },
  dentist: {
    primaryColor: '#0891b2', // Medical blue
    secondaryColor: '#10b981', // Clean green
    accentColor: '#f59e0b', // Warm orange
    style: 'professional',
    fontFamily: 'Inter',
  },
  consultant: {
    primaryColor: '#4f46e5', // Strategic indigo
    secondaryColor: '#64748b', // Professional gray
    accentColor: '#10b981', // Growth green
    style: 'professional',
    fontFamily: 'Inter',
  },
  default: {
    primaryColor: '#1e40af', // Safe blue
    secondaryColor: '#64748b', // Neutral gray
    accentColor: '#10b981', // Positive green
    style: 'professional',
    fontFamily: 'Inter',
  },
};

// ============================================================================
// STYLE INFERENCE
// ============================================================================

export interface StyleInferenceParams {
  archetype?: string;
  businessModel?: string;
  industry: string;
  tone?: string;
}

/**
 * Infer brand style from Mirror diagnostics
 */
export function inferBrandStyle(params: StyleInferenceParams): BrandStyle {
  const { archetype, businessModel, industry, tone } = params;

  // Archetype-based inference
  if (archetype) {
    const archetypeLower = archetype.toLowerCase();

    if (archetypeLower.includes('sage') || archetypeLower.includes('expert')) {
      return 'professional';
    }

    if (archetypeLower.includes('jester') || archetypeLower.includes('everyman')) {
      return 'friendly';
    }

    if (archetypeLower.includes('hero') || archetypeLower.includes('outlaw')) {
      return 'bold';
    }

    if (archetypeLower.includes('lover') || archetypeLower.includes('ruler')) {
      return 'elegant';
    }
  }

  // Business model inference
  if (businessModel?.toLowerCase().includes('b2c')) {
    return 'friendly';
  }

  if (businessModel?.toLowerCase().includes('b2b')) {
    return 'professional';
  }

  // Tone inference
  if (tone) {
    const toneLower = tone.toLowerCase();

    if (toneLower.includes('professional') || toneLower.includes('formal')) {
      return 'professional';
    }

    if (toneLower.includes('friendly') || toneLower.includes('casual')) {
      return 'friendly';
    }

    if (toneLower.includes('bold') || toneLower.includes('dynamic')) {
      return 'bold';
    }
  }

  // Industry defaults
  const industryDefaults: Record<string, BrandStyle> = {
    restaurant: 'friendly',
    cpa: 'professional',
    realtor: 'bold',
    dentist: 'professional',
    consultant: 'professional',
  };

  return industryDefaults[industry] || 'professional';
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Ensure color has # prefix
 */
export function normalizeHexColor(color: string): string {
  if (!color) return '#000000';
  const normalized = color.startsWith('#') ? color : `#${color}`;
  return isValidHexColor(normalized) ? normalized : '#000000';
}

/**
 * Extract colors from array with validation
 */
export function extractColors(colors: string[] | undefined): {
  primary: string;
  secondary: string;
  accent?: string;
} {
  if (!colors || colors.length === 0) {
    return {
      primary: '#1e40af',
      secondary: '#64748b',
    };
  }

  const validColors = colors.filter(isValidHexColor).map(normalizeHexColor);

  return {
    primary: validColors[0] || '#1e40af',
    secondary: validColors[1] || '#64748b',
    accent: validColors[2],
  };
}
