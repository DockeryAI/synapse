/**
 * BRAND KIT SERVICE
 *
 * Manages brand visual identity for content generation
 * Extracts from Mirror diagnostics and applies to visuals
 *
 * Philosophy: "Your brand, automated beautifully"
 */

import type {
  BrandKit,
  MirrorVisualData,
  BrandKitExtractionResult,
  BrandStyle,
} from '../../types/brand-kit.types';

import {
  DEFAULT_BRAND_KITS,
  inferBrandStyle,
  extractColors,
  normalizeHexColor,
} from '../../types/brand-kit.types';

import type { ImageParams } from '../visuals/bannerbear.service';
import type { VisualTemplate } from '../../types/visual.types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// BRAND KIT SERVICE
// ============================================================================

export class BrandKitService {
  /**
   * Extract brand kit from Mirror diagnostics
   * Primary method for getting brand visual identity
   */
  async extractFromMirror(brandId: string, industry: string): Promise<BrandKitExtractionResult> {
    try {
      // Load Mirror data
      const mirrorData = await this.loadMirrorData(brandId);

      if (!mirrorData) {
        // No Mirror data - use industry defaults
        return this.createDefaultBrandKit(brandId, industry);
      }

      // Extract colors
      const { primary, secondary, accent } = extractColors(mirrorData.colors);

      // Infer style from Mirror diagnostics
      const style = inferBrandStyle({
        archetype: mirrorData.archetype,
        businessModel: mirrorData.businessModel,
        industry,
        tone: mirrorData.tone,
      });

      // Build brand kit
      const brandKit: BrandKit = {
        id: this.generateId(),
        brandId,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
        logoUrl: mirrorData.logoUrl,
        fontFamily: 'Inter', // Default for now
        style,
        tone: mirrorData.tone,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'mirror',
      };

      // Save to database
      await this.saveBrandKit(brandKit);

      return {
        success: true,
        brandKit,
        source: 'mirror',
      };
    } catch (error) {
      console.error('Failed to extract brand kit from Mirror:', error);
      // Fallback to defaults
      return this.createDefaultBrandKit(brandId, industry);
    }
  }

  /**
   * Get brand kit from database or create default
   */
  async getBrandKit(brandId: string, industry: string): Promise<BrandKit> {
    try {
      // Try to load from database
      const saved = await this.loadBrandKitFromDB(brandId);

      if (saved) {
        return saved;
      }

      // Try to extract from Mirror
      const extracted = await this.extractFromMirror(brandId, industry);

      if (extracted.brandKit) {
        return extracted.brandKit;
      }

      // Last resort: create default
      const defaultResult = this.createDefaultBrandKit(brandId, industry);
      return defaultResult.brandKit!;
    } catch (error) {
      console.error('Failed to get brand kit:', error);
      // Emergency fallback
      const defaultResult = this.createDefaultBrandKit(brandId, industry);
      return defaultResult.brandKit!;
    }
  }

  /**
   * Save brand kit to database
   */
  async saveBrandKit(brandKit: BrandKit): Promise<void> {
    try {
      // For MVP: Skip database save
      // Full version would use Supabase

      // TODO: Implement Supabase save
      // const { error } = await supabase
      //   .from('brand_kits')
      //   .upsert({
      //     id: brandKit.id,
      //     brand_id: brandKit.brandId,
      //     primary_color: brandKit.primaryColor,
      //     secondary_color: brandKit.secondaryColor,
      //     accent_color: brandKit.accentColor,
      //     logo_url: brandKit.logoUrl,
      //     font_family: brandKit.fontFamily,
      //     style: brandKit.style,
      //     tone: brandKit.tone,
      //     source: brandKit.source,
      //   });

      console.log('Brand kit saved:', brandKit.brandId);
    } catch (error) {
      console.error('Failed to save brand kit:', error);
      // Non-critical - continue without saving
    }
  }

  /**
   * Apply brand kit to visual template
   * Generates Bannerbear modifications with brand colors
   */
  applyToVisual(
    brandKit: BrandKit,
    visualTemplate: VisualTemplate,
    contentData: Record<string, string | number>
  ): ImageParams {
    // Build modifications with brand styling
    const modifications: Record<string, string | number> = {
      ...contentData,

      // Brand colors
      primary_color: brandKit.primaryColor,
      secondary_color: brandKit.secondaryColor,
    };

    // Add accent color if available
    if (brandKit.accentColor) {
      modifications.accent_color = brandKit.accentColor;
    }

    // Add logo if available
    if (brandKit.logoUrl) {
      modifications.logo_url = brandKit.logoUrl;
    }

    // Add font if specified
    if (brandKit.fontFamily && brandKit.fontFamily !== 'Inter') {
      modifications.font_family = brandKit.fontFamily;
    }

    return {
      templateId: visualTemplate.bannerbearTemplateId,
      modifications,
      metadata: {
        brandId: brandKit.brandId,
        brandStyle: brandKit.style,
      },
    };
  }

  /**
   * Update brand kit colors manually
   */
  async updateColors(
    brandId: string,
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
    }
  ): Promise<BrandKit> {
    const existing = await this.loadBrandKitFromDB(brandId);

    if (!existing) {
      throw new Error('Brand kit not found');
    }

    const updated: BrandKit = {
      ...existing,
      primaryColor: colors.primary ? normalizeHexColor(colors.primary) : existing.primaryColor,
      secondaryColor: colors.secondary ? normalizeHexColor(colors.secondary) : existing.secondaryColor,
      accentColor: colors.accent ? normalizeHexColor(colors.accent) : existing.accentColor,
      updatedAt: new Date(),
    };

    await this.saveBrandKit(updated);

    return updated;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async loadMirrorData(brandId: string): Promise<MirrorVisualData | null> {
    try {
      const { data, error } = await supabase
        .from('mirror_diagnostics')
        .select('archetype, business_model, audience')
        .eq('brand_id', brandId)
        .single();

      if (error || !data) {
        console.log('No Mirror diagnostics found for brand:', brandId);
        return null;
      }

      // Extract colors from Mirror data if available
      // Note: Mirror doesn't currently store visual colors directly
      // This would need to be added to Mirror diagnostics
      return {
        colors: undefined, // Will use industry defaults
        archetype: data.archetype,
        businessModel: data.business_model,
        tone: typeof data.audience === 'string' ? data.audience : undefined,
      };
    } catch (error) {
      console.error('Error loading Mirror data:', error);
      return null;
    }
  }

  private async loadBrandKitFromDB(brandId: string): Promise<BrandKit | null> {
    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('brand_id', brandId)
        .single();

      if (error || !data) {
        return null;
      }

      // Convert database format to BrandKit type
      return {
        id: data.id,
        brandId: data.brand_id,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        colorPalette: data.color_palette,
        fontFamily: data.font_family,
        headingFont: data.heading_font,
        bodyFont: data.body_font,
        logoUrl: data.logo_url,
        logoPosition: data.logo_position as any,
        style: data.style as BrandStyle,
        tone: data.tone,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        source: data.source as any,
      };
    } catch (error) {
      console.error('Error loading brand kit from database:', error);
      return null;
    }
  }

  private createDefaultBrandKit(brandId: string, industry: string): BrandKitExtractionResult {
    const defaultKit = DEFAULT_BRAND_KITS[industry] || DEFAULT_BRAND_KITS.default;

    const brandKit: BrandKit = {
      id: this.generateId(),
      brandId,
      primaryColor: defaultKit.primaryColor!,
      secondaryColor: defaultKit.secondaryColor!,
      accentColor: defaultKit.accentColor,
      logoUrl: undefined,
      fontFamily: defaultKit.fontFamily!,
      style: defaultKit.style!,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'defaults',
    };

    return {
      success: true,
      brandKit,
      source: 'defaults',
      warnings: ['No Mirror data available - using industry defaults'],
    };
  }

  private generateId(): string {
    return `brandkit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const brandKitService = new BrandKitService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get or create brand kit for a brand
 */
export async function getBrandKit(brandId: string, industry: string): Promise<BrandKit> {
  return brandKitService.getBrandKit(brandId, industry);
}

/**
 * Apply brand styling to visual
 */
export function applyBrandStyling(
  brandKit: BrandKit,
  visualTemplate: VisualTemplate,
  contentData: Record<string, string | number>
): ImageParams {
  return brandKitService.applyToVisual(brandKit, visualTemplate, contentData);
}
