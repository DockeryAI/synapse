/**
 * TemplateManager Service
 * Manages design templates for Design Studio
 */

import * as fabric from 'fabric';
import type { Template, DesignData, Platform } from '@/types/design-studio.types';
import { supabase } from '@/lib/supabase';

/**
 * Template manager for CRUD operations on design templates
 */
export class TemplateManager {
  /**
   * Get templates with optional filters
   * @param platform - Filter by platform
   * @param category - Filter by category
   * @returns Array of templates
   */
  static async getTemplates(
    platform?: Platform,
    category?: string
  ): Promise<Template[]> {
    try {
      let query = supabase
        .from('design_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (platform) {
        query = query.eq('platform', platform);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Return built-in templates as fallback
      return this.getBuiltInTemplates(platform, category);
    }
  }

  /**
   * Get single template by ID
   * @param id - Template ID
   * @returns Template or null
   */
  static async getTemplate(id: string): Promise<Template | null> {
    try {
      // Check built-in templates first
      const builtIn = this.getBuiltInTemplates();
      const builtInTemplate = builtIn.find((t) => t.id === id);
      if (builtInTemplate) return builtInTemplate;

      // Check database
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Save new template
   * @param template - Template data
   * @returns Template ID
   */
  static async saveTemplate(template: Omit<Template, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('design_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          platform: template.platform,
          width: template.width,
          height: template.height,
          thumbnail: template.thumbnail,
          design_data: template.designData,
          is_premium: template.isPremium,
          is_custom: template.isCustom,
          created_by: template.createdBy,
          tags: template.tags,
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   * @param id - Template ID
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('design_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Load template to canvas
   * @param templateId - Template ID
   * @param canvas - Fabric canvas instance
   */
  static async loadTemplateToCanvas(
    templateId: string,
    canvas: fabric.Canvas
  ): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Clear canvas
      canvas.clear();

      // Set canvas dimensions
      canvas.setDimensions({
        width: template.width,
        height: template.height,
      });

      // Load template design data
      return new Promise((resolve, reject) => {
        canvas.loadFromJSON(
          template.designData.canvas,
          () => {
            canvas.renderAll();
            resolve();
          },
          (error: any) => {
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Error loading template to canvas:', error);
      throw error;
    }
  }

  /**
   * Get built-in templates (15 templates across platforms)
   */
  static getBuiltInTemplates(
    platform?: Platform,
    category?: string
  ): Template[] {
    const templates: Template[] = [
      // Instagram Templates (5)
      {
        id: 'instagram-quote-card',
        name: 'Quote Card',
        description: 'Inspirational quote with gradient background',
        category: 'Social Post',
        platform: 'instagram',
        width: 1080,
        height: 1080,
        thumbnail: '/templates/instagram-quote.png',
        isPremium: false,
        isCustom: false,
        designData: this.createQuoteCardTemplate(1080, 1080),
      },
      {
        id: 'instagram-product-showcase',
        name: 'Product Showcase',
        description: 'Clean product display with text overlay',
        category: 'Social Post',
        platform: 'instagram',
        width: 1080,
        height: 1080,
        thumbnail: '/templates/instagram-product.png',
        isPremium: false,
        isCustom: false,
        designData: this.createProductShowcaseTemplate(1080, 1080),
      },
      {
        id: 'instagram-story-announcement',
        name: 'Story Announcement',
        description: 'Bold announcement for Instagram stories',
        category: 'Story',
        platform: 'instagram',
        width: 1080,
        height: 1920,
        thumbnail: '/templates/instagram-story-announcement.png',
        isPremium: false,
        isCustom: false,
        designData: this.createStoryAnnouncementTemplate(1080, 1920),
      },
      {
        id: 'instagram-story-bts',
        name: 'Behind the Scenes',
        description: 'Behind the scenes story template',
        category: 'Story',
        platform: 'instagram',
        width: 1080,
        height: 1920,
        thumbnail: '/templates/instagram-story-bts.png',
        isPremium: false,
        isCustom: false,
        designData: this.createBTSTemplate(1080, 1920),
      },
      {
        id: 'instagram-tips-carousel',
        name: 'Tips & Tricks',
        description: 'Educational carousel slide template',
        category: 'Social Post',
        platform: 'instagram',
        width: 1080,
        height: 1080,
        thumbnail: '/templates/instagram-tips.png',
        isPremium: false,
        isCustom: false,
        designData: this.createTipsTemplate(1080, 1080),
      },

      // Facebook Templates (5)
      {
        id: 'facebook-event-promo',
        name: 'Event Promo',
        description: 'Event promotion with date and details',
        category: 'Social Post',
        platform: 'facebook',
        width: 1200,
        height: 630,
        thumbnail: '/templates/facebook-event.png',
        isPremium: false,
        isCustom: false,
        designData: this.createEventPromoTemplate(1200, 630),
      },
      {
        id: 'facebook-cover',
        name: 'Brand Header',
        description: 'Facebook cover photo template',
        category: 'Banner',
        platform: 'facebook',
        width: 820,
        height: 312,
        thumbnail: '/templates/facebook-cover.png',
        isPremium: false,
        isCustom: false,
        designData: this.createBrandHeaderTemplate(820, 312),
      },
      {
        id: 'facebook-lead-gen',
        name: 'Lead Gen Ad',
        description: 'Lead generation advertisement',
        category: 'Ad',
        platform: 'facebook',
        width: 1200,
        height: 628,
        thumbnail: '/templates/facebook-leadgen.png',
        isPremium: false,
        isCustom: false,
        designData: this.createLeadGenTemplate(1200, 628),
      },
      {
        id: 'facebook-flash-sale',
        name: 'Flash Sale',
        description: 'Urgent sale promotion',
        category: 'Story',
        platform: 'facebook',
        width: 1080,
        height: 1920,
        thumbnail: '/templates/facebook-sale.png',
        isPremium: false,
        isCustom: false,
        designData: this.createFlashSaleTemplate(1080, 1920),
      },
      {
        id: 'facebook-community',
        name: 'Community Cover',
        description: 'Group cover photo template',
        category: 'Banner',
        platform: 'facebook',
        width: 1640,
        height: 856,
        thumbnail: '/templates/facebook-community.png',
        isPremium: false,
        isCustom: false,
        designData: this.createCommunityTemplate(1640, 856),
      },

      // LinkedIn Templates (5)
      {
        id: 'linkedin-quote',
        name: 'Professional Quote',
        description: 'Professional quote for LinkedIn',
        category: 'Social Post',
        platform: 'linkedin',
        width: 1200,
        height: 627,
        thumbnail: '/templates/linkedin-quote.png',
        isPremium: false,
        isCustom: false,
        designData: this.createProfessionalQuoteTemplate(1200, 627),
      },
      {
        id: 'linkedin-article',
        name: 'Thought Leadership',
        description: 'Article header template',
        category: 'Social Post',
        platform: 'linkedin',
        width: 1200,
        height: 627,
        thumbnail: '/templates/linkedin-article.png',
        isPremium: false,
        isCustom: false,
        designData: this.createThoughtLeadershipTemplate(1200, 627),
      },
      {
        id: 'linkedin-b2b-offer',
        name: 'B2B Offer',
        description: 'Business offer advertisement',
        category: 'Ad',
        platform: 'linkedin',
        width: 1200,
        height: 627,
        thumbnail: '/templates/linkedin-offer.png',
        isPremium: false,
        isCustom: false,
        designData: this.createB2BOfferTemplate(1200, 627),
      },
      {
        id: 'linkedin-banner',
        name: 'Company Profile',
        description: 'LinkedIn banner template',
        category: 'Banner',
        platform: 'linkedin',
        width: 1584,
        height: 396,
        thumbnail: '/templates/linkedin-banner.png',
        isPremium: false,
        isCustom: false,
        designData: this.createCompanyBannerTemplate(1584, 396),
      },
      {
        id: 'linkedin-presentation',
        name: 'Presentation Slide',
        description: 'Document presentation template',
        category: 'Social Post',
        platform: 'linkedin',
        width: 1280,
        height: 720,
        thumbnail: '/templates/linkedin-presentation.png',
        isPremium: false,
        isCustom: false,
        designData: this.createPresentationTemplate(1280, 720),
      },
    ];

    // Filter by platform and category if provided
    return templates.filter((template) => {
      const platformMatch = !platform || template.platform === platform;
      const categoryMatch = !category || template.category === category;
      return platformMatch && categoryMatch;
    });
  }

  /**
   * Create Quote Card template
   */
  private static createQuoteCardTemplate(width: number, height: number): DesignData {
    return {
      version: '1.0',
      metadata: {
        width,
        height,
        platform: 'instagram',
        template: 'quote-card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      canvas: {
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            left: 0,
            top: 0,
            width,
            height,
            fill: '#6366f1',
            selectable: false,
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height / 2 - 50,
            text: '"Your inspirational quote here"',
            fontSize: 48,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#ffffff',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: width * 0.8,
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height / 2 + 100,
            text: '- Author Name',
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#e0e7ff',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
        ],
      },
    };
  }

  /**
   * Create Product Showcase template
   */
  private static createProductShowcaseTemplate(width: number, height: number): DesignData {
    return {
      version: '1.0',
      metadata: {
        width,
        height,
        platform: 'instagram',
        template: 'product-showcase',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      canvas: {
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            left: 0,
            top: 0,
            width,
            height,
            fill: '#f3f4f6',
            selectable: false,
          },
          {
            type: 'rect',
            left: width / 2,
            top: height - 200,
            width: width * 0.9,
            height: 150,
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
            rx: 20,
            ry: 20,
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height - 220,
            text: 'Product Name',
            fontSize: 36,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#1f2937',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height - 160,
            text: 'Add your product description here',
            fontSize: 20,
            fontFamily: 'Arial',
            fill: '#6b7280',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
        ],
      },
    };
  }

  /**
   * Create Story Announcement template
   */
  private static createStoryAnnouncementTemplate(width: number, height: number): DesignData {
    return {
      version: '1.0',
      metadata: {
        width,
        height,
        platform: 'instagram',
        template: 'story-announcement',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      canvas: {
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            left: 0,
            top: 0,
            width,
            height,
            fill: '#ef4444',
            selectable: false,
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height / 2 - 100,
            text: 'BIG\nANNOUNCEMENT',
            fontSize: 72,
            fontFamily: 'Impact',
            fontWeight: 'bold',
            fill: '#ffffff',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height / 2 + 100,
            text: 'Swipe up to learn more',
            fontSize: 28,
            fontFamily: 'Arial',
            fill: '#fef2f2',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
        ],
      },
    };
  }

  // Simplified template creators for remaining templates
  private static createBTSTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'instagram', 'Behind the Scenes', '#8b5cf6');
  }

  private static createTipsTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'instagram', 'Tip #1', '#10b981');
  }

  private static createEventPromoTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'facebook', 'Event Name', '#f59e0b');
  }

  private static createBrandHeaderTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'facebook', 'Your Brand', '#3b82f6');
  }

  private static createLeadGenTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'facebook', 'Get Started Today', '#06b6d4');
  }

  private static createFlashSaleTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'facebook', 'FLASH SALE', '#dc2626');
  }

  private static createCommunityTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'facebook', 'Community Name', '#7c3aed');
  }

  private static createProfessionalQuoteTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'linkedin', 'Professional Quote', '#1e40af');
  }

  private static createThoughtLeadershipTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'linkedin', 'Thought Leadership', '#0f766e');
  }

  private static createB2BOfferTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'linkedin', 'Special Offer', '#0891b2');
  }

  private static createCompanyBannerTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'linkedin', 'Company Name', '#4f46e5');
  }

  private static createPresentationTemplate(width: number, height: number): DesignData {
    return this.createSimpleTemplate(width, height, 'linkedin', 'Presentation Title', '#059669');
  }

  /**
   * Create simple template with background and text
   */
  private static createSimpleTemplate(
    width: number,
    height: number,
    platform: Platform,
    text: string,
    color: string
  ): DesignData {
    return {
      version: '1.0',
      metadata: {
        width,
        height,
        platform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      canvas: {
        version: '5.3.0',
        objects: [
          {
            type: 'rect',
            left: 0,
            top: 0,
            width,
            height,
            fill: color,
            selectable: false,
          },
          {
            type: 'i-text',
            left: width / 2,
            top: height / 2,
            text,
            fontSize: 48,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#ffffff',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
          },
        ],
      },
    };
  }
}
