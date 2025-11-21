/**
 * Visual Understanding Service
 *
 * Analyzes images using Claude's vision capabilities to generate content suggestions.
 * Upload image → AI generates captions, suggests campaigns, extracts brand colors.
 *
 * Features:
 * - Image analysis with Claude Vision
 * - Caption generation (casual, professional, creative)
 * - Campaign type recommendations
 * - Brand color extraction
 * - Platform and hashtag suggestions
 * - Quality assessment and improvement tips
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  VisualAnalysisRequest,
  VisualAnalysisResult,
  ServiceResponse,
  IVisualUnderstanding,
} from '../../../types/ai-commands.types';

export class VisualUnderstandingService implements IVisualUnderstanding {
  private anthropic: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Analyze an image and generate content suggestions
   */
  async analyze(request: VisualAnalysisRequest): Promise<ServiceResponse<VisualAnalysisResult>> {
    const startTime = Date.now();

    try {
      // Prepare image for Claude Vision API
      const imageData = await this.prepareImage(request);

      // Build analysis prompt
      const systemPrompt = this.buildAnalysisSystemPrompt(request);
      const userPrompt = this.buildAnalysisUserPrompt(request);

      // Call Claude Vision API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      });

      // Parse Claude's response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const analysis = this.parseAnalysisResponse(textContent.text, request);

      return {
        success: true,
        data: analysis,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
          cost: this.calculateCost(response.usage),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Image Preparation
  // ============================================================================

  /**
   * Prepare image for Claude Vision API
   */
  private async prepareImage(request: VisualAnalysisRequest): Promise<string> {
    if (request.imageBase64) {
      // Already base64 encoded
      return request.imageBase64;
    }

    if (request.imageUrl) {
      // Fetch and convert to base64
      return this.fetchAndEncodeImage(request.imageUrl);
    }

    if (request.imageFile) {
      // Convert File to base64
      return this.fileToBase64(request.imageFile);
    }

    throw new Error('No image provided (imageUrl, imageFile, or imageBase64 required)');
  }

  /**
   * Fetch image from URL and encode as base64
   */
  private async fetchAndEncodeImage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return this.blobToBase64(blob);
    } catch (error) {
      throw new Error(`Failed to fetch image from URL: ${error}`);
    }
  }

  /**
   * Convert File to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert Blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ============================================================================
  // PRIVATE METHODS - Prompt Engineering
  // ============================================================================

  /**
   * Build system prompt for image analysis
   */
  private buildAnalysisSystemPrompt(request: VisualAnalysisRequest): string {
    return `You are a visual content analyst for Synapse, helping SMBs create effective social media content.

**Your Task:**
Analyze the provided image and generate comprehensive content suggestions.

**Analysis Goals:**
${request.analysisGoal === 'all' || !request.analysisGoal ? '- Provide complete analysis (captions, campaign types, colors, suggestions)' : ''}
${request.analysisGoal === 'caption' ? '- Focus on caption generation' : ''}
${request.analysisGoal === 'campaign_type' ? '- Focus on recommending campaign type' : ''}
${request.analysisGoal === 'brand_colors' ? '- Focus on extracting brand colors' : ''}
${request.analysisGoal === 'product_suggestion' ? '- Focus on product suggestions' : ''}

**Business Context:**
${request.businessContext || 'General business/product'}

**Your Response Format (STRICT JSON):**

\`\`\`json
{
  "description": "Detailed description of what's in the image",
  "detectedElements": ["element1", "element2", "element3"],
  "suggestedCaptions": {
    "casual": "Casual, friendly caption",
    "professional": "Professional, polished caption",
    "creative": "Creative, engaging caption"
  },
  "recommendedCampaignType": {
    "type": "authority_builder|social_proof|local_pulse",
    "reasoning": "Why this campaign type fits the image",
    "confidence": 0.0-1.0
  },
  "brandColors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE"
  },
  "productSuggestions": ["product1", "product2"],
  "recommendedPlatforms": ["instagram", "facebook", "tiktok"],
  "recommendedHashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "qualityScore": 0-100,
  "improvements": ["improvement1", "improvement2"]
}
\`\`\`

**Caption Guidelines:**
- Casual: Conversational, includes emojis, relatable
- Professional: Polished, informative, credible
- Creative: Unique angle, storytelling, memorable

**Campaign Type Guidelines:**
- authority_builder: Expert content, educational, thought leadership
- social_proof: User-generated, testimonials, community-focused
- local_pulse: Location-based, timely, community-relevant

**Brand Color Guidelines:**
- Identify 3 dominant colors from image
- Return as hex codes
- Primary = most prominent, Secondary = supporting, Accent = highlight

**Quality Score (0-100):**
- 90-100: Professional quality, excellent lighting, clear subject
- 70-89: Good quality, minor improvements possible
- 50-69: Average quality, needs work
- 0-49: Poor quality, significant issues

**Important:**
- Always return valid JSON
- Be specific and actionable
- Consider business context when making suggestions
- Provide realistic hashtags (not generic)`;
  }

  /**
   * Build user prompt for image analysis
   */
  private buildAnalysisUserPrompt(request: VisualAnalysisRequest): string {
    let prompt = 'Analyze this image and provide content suggestions.';

    if (request.analysisGoal && request.analysisGoal !== 'all') {
      prompt += `\n\nFocus on: ${request.analysisGoal.replace(/_/g, ' ')}`;
    }

    if (request.businessContext) {
      prompt += `\n\nBusiness Context: ${request.businessContext}`;
    }

    prompt += '\n\nReturn JSON format only.';

    return prompt;
  }

  /**
   * Parse Claude's JSON response into VisualAnalysisResult
   */
  private parseAnalysisResponse(
    text: string,
    request: VisualAnalysisRequest
  ): VisualAnalysisResult {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);

      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        request,
        description: parsed.description || 'Image analysis',
        detectedElements: parsed.detectedElements || [],
        suggestedCaptions: parsed.suggestedCaptions || {
          casual: 'Check this out! 📸',
          professional: 'Showcasing quality and excellence.',
          creative: 'A visual story worth sharing.',
        },
        recommendedCampaignType: parsed.recommendedCampaignType,
        brandColors: parsed.brandColors,
        productSuggestions: parsed.productSuggestions,
        recommendedPlatforms: parsed.recommendedPlatforms || ['instagram', 'facebook'],
        recommendedHashtags: parsed.recommendedHashtags || ['photography', 'content', 'marketing'],
        qualityScore: parsed.qualityScore || 75,
        improvements: parsed.improvements,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.warn('[VisualUnderstanding] Failed to parse analysis, using fallback:', error);
      return this.mockAnalysisResult(request);
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Utilities
  // ============================================================================

  /**
   * Calculate API cost
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const inputCost = (usage.input_tokens / 1_000_000) * 3.0;
    const outputCost = (usage.output_tokens / 1_000_000) * 15.0;
    return inputCost + outputCost;
  }

  /**
   * Mock analysis result (fallback)
   */
  private mockAnalysisResult(request: VisualAnalysisRequest): VisualAnalysisResult {
    return {
      request,
      description: 'A professional image suitable for social media marketing',
      detectedElements: ['product', 'branding', 'composition'],
      suggestedCaptions: {
        casual: 'Love how this turned out! What do you think? 💫',
        professional: 'Elevating our brand with quality and attention to detail.',
        creative: 'When vision meets reality. This is what we create.',
      },
      recommendedCampaignType: {
        type: 'social_proof',
        reasoning: 'Image showcases quality and customer value, perfect for social proof content',
        confidence: 0.8,
      },
      brandColors: {
        primary: '#4A90E2',
        secondary: '#F5A623',
        accent: '#7ED321',
      },
      productSuggestions: ['Main product featured', 'Related accessories'],
      recommendedPlatforms: ['instagram', 'facebook', 'pinterest'],
      recommendedHashtags: [
        'SmallBusiness',
        'Quality',
        'BehindTheScenes',
        'MadeWithLove',
        'LocalBusiness',
      ],
      qualityScore: 85,
      improvements: [
        'Consider adding more lighting',
        'Try different angles for variety',
        'Include brand elements more prominently',
      ],
      analyzedAt: new Date(),
    };
  }
}

/**
 * Factory function to create VisualUnderstandingService
 */
export const createVisualUnderstanding = (apiKey: string): VisualUnderstandingService => {
  return new VisualUnderstandingService(apiKey);
};
