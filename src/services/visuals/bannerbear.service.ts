/**
 * BANNERBEAR SERVICE
 *
 * Integration with Bannerbear API for automated visual generation
 * Handles image creation, template management, and error handling
 *
 * Philosophy: "Professional visuals, zero design effort"
 */

import { BANNERBEAR_CONFIG, isBannerbearConfigured } from '../../config/bannerbear.config';

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
  // PRIVATE HELPERS
  // ==========================================================================

  private validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        'Bannerbear API key not configured. Please set VITE_BANNERBEAR_API_KEY in your .env file.'
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
