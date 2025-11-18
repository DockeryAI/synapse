/**
 * BANNERBEAR SERVICE
 *
 * Integration with Bannerbear API for automated visual generation
 * Handles image creation, template management, and error handling
 *
 * Philosophy: "Professional visuals, zero design effort"
 */

import { BANNERBEAR_CONFIG, isBannerbearConfigured, PLATFORM_SPECS, PlatformKey } from '../../config/bannerbear.config';
import { getTemplateForCampaignType, isTemplateConfigured } from '../../config/campaign-templates.config';
import type {
  GenerateCampaignVisualRequest,
  GeneratedVisual,
  GenerateAllPlatformsRequest,
  BatchVisualResult,
  CampaignTemplateConfig
} from '../../types/campaign-visual.types';
import type { CampaignTypeId } from '../../types/campaign.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageParams {
  templateId: string;
  modifications: Record<string, string | number>; // Key-value pairs for template variables
  metadata?: Record<string, any>; // Optional tracking data
}

export interface CarouselParams {
  templateId: string;
  slides: Array<Record<string, string | number>>; // Array of modifications per slide
  metadata?: Record<string, any>;
}

export interface BannerbearTemplate {
  uid: string;
  name: string;
  width: number;
  height: number;
  tags: string[];
  available_modifications: string[];
}

export interface BannerbearImage {
  uid: string;
  status: 'pending' | 'completed' | 'failed';
  image_url?: string;
  image_url_png?: string;
  image_url_jpg?: string;
  created_at: string;
  self: string; // URL to check status
}

export interface BannerbearError {
  message: string;
  code?: string;
  statusCode: number;
  retryable: boolean;
}

// ============================================================================
// BANNERBEAR SERVICE
// ============================================================================

class BannerbearService {
  private apiUrl: string;
  private apiKey: string;
  private requestQueue: Promise<any>[] = [];
  private visualCache: Map<string, { visual: GeneratedVisual; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.apiUrl = BANNERBEAR_CONFIG.apiUrl;
    this.apiKey = BANNERBEAR_CONFIG.apiKey;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Create a single image from template
   * Returns image URL once generated
   */
  async createImage(params: ImageParams): Promise<string> {
    this.validateConfig();

    try {
      const response = await this.makeRequest<{ uid: string }>('/images', {
        method: 'POST',
        body: JSON.stringify({
          template: params.templateId,
          modifications: this.formatModifications(params.modifications),
          metadata: params.metadata,
          webhook_url: null, // Synchronous for MVP
        }),
      });

      // Poll for completion (synchronous generation)
      const imageUrl = await this.pollForImage(response.uid);
      return imageUrl;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create multiple images (carousel)
   * Returns array of image URLs
   */
  async createCarousel(params: CarouselParams): Promise<string[]> {
    this.validateConfig();

    try {
      const imagePromises = params.slides.map((modifications, index) =>
        this.createImage({
          templateId: params.templateId,
          modifications,
          metadata: {
            ...params.metadata,
            slide_index: index,
            total_slides: params.slides.length,
          },
        })
      );

      // Generate all images in parallel (with rate limiting)
      return await this.withRateLimit(imagePromises);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<BannerbearTemplate[]> {
    this.validateConfig();

    try {
      const response = await this.makeRequest<BannerbearTemplate[]>('/templates', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get template details
   */
  async getTemplate(templateId: string): Promise<BannerbearTemplate> {
    this.validateConfig();

    try {
      const response = await this.makeRequest<BannerbearTemplate>(`/templates/${templateId}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if service is configured and ready
   */
  isConfigured(): boolean {
    return isBannerbearConfigured();
  }

  // ==========================================================================
  // CAMPAIGN-SPECIFIC VISUAL GENERATION
  // ==========================================================================

  /**
   * Generate a visual for a specific campaign type and platform
   * Automatically maps campaign content to appropriate template
   */
  async generateCampaignVisual(request: GenerateCampaignVisualRequest): Promise<GeneratedVisual> {
    this.validateConfig();
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.getCachedVisual(cacheKey);
    if (cached) {
      console.log(`[Bannerbear] Cache hit for ${request.campaignType}/${request.platform}`);
      return cached;
    }

    try {
      // Get template config for campaign type
      const templateConfig = getTemplateForCampaignType(request.campaignType);
      const templateId = request.templateId || templateConfig.templateId;

      // Check if template is configured
      if (!isTemplateConfigured(request.campaignType) && !request.templateId) {
        throw new Error(
          `Template for ${request.campaignType} not configured in Bannerbear dashboard. ` +
          `Please create template and update campaign-templates.config.ts`
        );
      }

      // Map campaign content to template variables
      const modifications = this.mapCampaignContentToTemplate(request.content, templateConfig, request.branding);

      // Get platform-specific dimensions
      const platformKey = request.platform as PlatformKey;
      const format = request.format || 'feed';
      const dimensions = PLATFORM_SPECS[platformKey]?.[format as keyof typeof PLATFORM_SPECS[typeof platformKey]];

      if (!dimensions) {
        throw new Error(`Invalid platform/format: ${request.platform}/${format}`);
      }

      // Generate image
      console.log(`[Bannerbear] Generating ${request.campaignType} visual for ${request.platform}...`);
      const response = await this.makeRequest<{ uid: string }>('/images', {
        method: 'POST',
        body: JSON.stringify({
          template: templateId,
          modifications: this.formatModifications(modifications),
          metadata: {
            campaign_type: request.campaignType,
            platform: request.platform,
            format: format,
            brand_name: request.content.brandName,
          },
          webhook_url: null,
        }),
      });

      // Poll for completion
      const imageUrl = await this.pollForImage(response.uid);
      const generationTime = Date.now() - startTime;

      // Create result
      const visual: GeneratedVisual = {
        id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignType: request.campaignType,
        platform: request.platform,
        format: format,
        imageUrl,
        bannerbearUid: response.uid,
        templateId,
        metadata: {
          generatedAt: new Date(),
          generationTime,
          dimensions: { width: dimensions.width, height: dimensions.height },
          aspectRatio: dimensions.aspectRatio,
        },
        status: 'completed',
      };

      // Cache the result
      this.cacheVisual(cacheKey, visual);

      console.log(`[Bannerbear] ✓ Generated in ${generationTime}ms: ${imageUrl}`);
      return visual;

    } catch (error: any) {
      console.error(`[Bannerbear] Failed to generate ${request.campaignType} visual:`, error);

      // Return failed visual
      return {
        id: `visual_failed_${Date.now()}`,
        campaignType: request.campaignType,
        platform: request.platform,
        format: request.format || 'feed',
        imageUrl: '',
        bannerbearUid: '',
        templateId: '',
        metadata: {
          generatedAt: new Date(),
          generationTime: Date.now() - startTime,
          dimensions: { width: 0, height: 0 },
          aspectRatio: '0:0',
        },
        status: 'failed',
        error: error.message || 'Image generation failed',
      };
    }
  }

  /**
   * Generate visuals for all platforms (batch generation)
   * Returns results for each platform, with graceful failure handling
   */
  async generateAllPlatforms(request: GenerateAllPlatformsRequest): Promise<BatchVisualResult> {
    const platforms = request.platforms || ['linkedin', 'facebook', 'instagram', 'twitter'];
    const startTime = Date.now();

    console.log(`[Bannerbear] Generating ${request.campaignType} visuals for ${platforms.length} platforms...`);

    const visualPromises = platforms.map(platform =>
      this.generateCampaignVisual({
        campaignType: request.campaignType,
        platform: platform as any,
        content: request.content,
        branding: request.branding,
      }).catch(error => {
        console.error(`[Bannerbear] Failed to generate for ${platform}:`, error);
        return null;
      })
    );

    // Generate with rate limiting
    const visuals = await this.withRateLimit(visualPromises);

    // Filter out nulls and separate completed/failed
    const validVisuals = visuals.filter((v): v is GeneratedVisual => v !== null);
    const completed = validVisuals.filter(v => v.status === 'completed').length;
    const failed = validVisuals.filter(v => v.status === 'failed').length;
    const errors = validVisuals
      .filter(v => v.status === 'failed')
      .map(v => ({ platform: v.platform, error: v.error || 'Unknown error' }));

    const totalTime = Date.now() - startTime;
    console.log(
      `[Bannerbear] Batch complete in ${totalTime}ms: ${completed} succeeded, ${failed} failed`
    );

    return {
      total: platforms.length,
      completed,
      failed,
      visuals: validVisuals,
      errors,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        'Bannerbear visual generation is not configured. ' +
        'This feature is optional for MVP and will be added in a future release.'
      );
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(BANNERBEAR_CONFIG.timeout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || response.statusText,
        statusCode: response.status,
        code: errorData.code,
      };
    }

    return response.json();
  }

  private async pollForImage(imageUid: string, maxAttempts = 30): Promise<string> {
    let attempts = 0;
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const image = await this.makeRequest<BannerbearImage>(`/images/${imageUid}`, {
          method: 'GET',
        });

        if (image.status === 'completed') {
          // Return PNG by default, fallback to JPG
          return image.image_url_png || image.image_url_jpg || image.image_url || '';
        }

        if (image.status === 'failed') {
          throw new Error('Image generation failed');
        }

        // Still pending, wait and retry
        await this.sleep(pollInterval);
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await this.sleep(pollInterval);
        attempts++;
      }
    }

    throw new Error('Image generation timed out after 60 seconds');
  }

  private formatModifications(modifications: Record<string, string | number>): Array<{
    name: string;
    text?: string;
    color?: string;
    image_url?: string;
  }> {
    // Convert flat object to Bannerbear's expected format
    return Object.entries(modifications).map(([name, value]) => ({
      name,
      text: String(value),
    }));
  }

  private async withRateLimit<T>(promises: Promise<T>[]): Promise<T[]> {
    const { concurrent } = BANNERBEAR_CONFIG.rateLimit;
    const results: T[] = [];

    // Process in batches
    for (let i = 0; i < promises.length; i += concurrent) {
      const batch = promises.slice(i, i + concurrent);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + concurrent < promises.length) {
        await this.sleep(1000); // 1 second between batches
      }
    }

    return results;
  }

  private handleError(error: any): BannerbearError {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Bannerbear API error';

    // Determine if error is retryable
    const retryable = statusCode === 429 || statusCode >= 500;

    return {
      message,
      code: error.code,
      statusCode,
      retryable,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Map campaign content to template variables based on field mappings
   */
  private mapCampaignContentToTemplate(
    content: GenerateCampaignVisualRequest['content'],
    templateConfig: CampaignTemplateConfig,
    branding?: GenerateCampaignVisualRequest['branding']
  ): Record<string, string | number> {
    const modifications: Record<string, string | number> = {};
    const { fieldMappings, defaults } = templateConfig;

    // Map headline (always required)
    if (fieldMappings.headline) {
      modifications[fieldMappings.headline] = content.headline;
    }

    // Map subheadline if present
    if (fieldMappings.subheadline && content.subheadline) {
      modifications[fieldMappings.subheadline] = content.subheadline;
    }

    // Map body text if present
    if (fieldMappings.bodyText && content.bodyText) {
      modifications[fieldMappings.bodyText] = content.bodyText;
    }

    // Campaign-specific fields
    // Stats (Authority Builder)
    if (fieldMappings.stat && content.stats && content.stats.length > 0) {
      modifications[fieldMappings.stat] = content.stats[0];
    }

    // Testimonial & Customer Name (Social Proof)
    if (fieldMappings.testimonial && content.testimonial) {
      modifications[fieldMappings.testimonial] = content.testimonial;
    }
    if (fieldMappings.customerName && content.customerName) {
      modifications[fieldMappings.customerName] = content.customerName;
    }

    // Location (Local Pulse)
    if (fieldMappings.location && content.location) {
      modifications[fieldMappings.location] = content.location;
    }

    // Branding
    if (fieldMappings.logoUrl && branding?.logoUrl) {
      modifications[fieldMappings.logoUrl] = branding.logoUrl;
    }
    if (fieldMappings.brandColor && branding?.primaryColor) {
      modifications[fieldMappings.brandColor] = branding.primaryColor;
    }

    // Apply defaults for missing optional fields
    if (defaults) {
      Object.entries(defaults).forEach(([key, value]) => {
        if (!modifications[key]) {
          modifications[key] = value;
        }
      });
    }

    return modifications;
  }

  /**
   * Generate cache key for a visual request
   */
  private getCacheKey(request: GenerateCampaignVisualRequest): string {
    const parts = [
      request.campaignType,
      request.platform,
      request.format || 'feed',
      request.content.headline,
      request.content.brandName,
    ];
    return parts.join('::');
  }

  /**
   * Get cached visual if still valid
   */
  private getCachedVisual(cacheKey: string): GeneratedVisual | null {
    const cached = this.visualCache.get(cacheKey);
    if (!cached) return null;

    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      this.visualCache.delete(cacheKey);
      return null;
    }

    return cached.visual;
  }

  /**
   * Cache a generated visual
   */
  private cacheVisual(cacheKey: string, visual: GeneratedVisual): void {
    this.visualCache.set(cacheKey, {
      visual,
      timestamp: Date.now(),
    });

    // Periodic cleanup of expired entries (every 100 additions)
    if (this.visualCache.size % 100 === 0) {
      this.cleanupCache();
    }
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.visualCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.visualCache.delete(key);
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const bannerbearService = new BannerbearService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick image generation with retries
 */
export async function generateImage(
  templateId: string,
  modifications: Record<string, string | number>,
  retries = BANNERBEAR_CONFIG.retry.maxAttempts
): Promise<string | null> {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await bannerbearService.createImage({
        templateId,
        modifications,
      });
    } catch (error: any) {
      lastError = error;

      if (!error.retryable || attempt === retries - 1) {
        break;
      }

      // Exponential backoff
      const backoff = BANNERBEAR_CONFIG.retry.backoffMs * Math.pow(2, attempt);
      console.log(`Bannerbear attempt ${attempt + 1} failed, retrying in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  console.error('Bannerbear image generation failed after retries:', lastError);
  return null; // Graceful fallback
}

/**
 * Batch image generation with progress callback
 */
export async function generateBatch(
  items: Array<{ templateId: string; modifications: Record<string, string | number> }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<string | null>> {
  const results: Array<string | null> = [];

  for (let i = 0; i < items.length; i++) {
    const result = await generateImage(items[i].templateId, items[i].modifications);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return results;
}
