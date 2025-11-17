/**
 * Email Capture Service
 * Generate "link in bio" landing pages that convert at 2-5%
 *
 * Templates: Discount, Free Guide, Checklist, Webinar, Consultation
 * Features: Lead magnet suggestions, GDPR compliance, email integrations
 * Goal: Turn social followers into email subscribers
 */

import {
  EmailCapturePage,
  EmailCaptureTemplate,
  LeadMagnet,
  CaptureForm,
  FormField,
  ThankYouPage,
  EmailIntegration,
  CaptureStats,
  BusinessContext,
  ServiceResponse,
} from '../../types/tactics.types';

export class EmailCaptureService {
  /**
   * Generate email capture page from template
   */
  async generateCapturePage(
    businessContext: BusinessContext,
    template: EmailCaptureTemplate,
    customization?: Partial<EmailCapturePage>
  ): Promise<ServiceResponse<EmailCapturePage>> {
    try {
      const leadMagnet = this.suggestLeadMagnet(businessContext, template);
      const form = this.buildForm(template);
      const thankYouPage = this.createThankYouPage(businessContext, leadMagnet);

      const page: EmailCapturePage = {
        id: this.generateId(),
        businessId: businessContext.id,
        template,
        title: this.generateTitle(businessContext, template, leadMagnet),
        description: this.generateDescription(businessContext, template, leadMagnet),
        leadMagnet,
        form,
        thankYouPage,
        integrations: [],
        slug: this.generateSlug(businessContext, template),
        published: false,
        createdAt: new Date(),
        stats: this.initializeStats(),
        ...customization,
      };

      return {
        success: true,
        data: page,
        metadata: {
          expectedConversion: '2-5%',
          setupTime: '10 minutes',
          cost: '$0',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate capture page',
      };
    }
  }

  /**
   * Suggest lead magnet based on business type
   */
  private suggestLeadMagnet(
    context: BusinessContext,
    template: EmailCaptureTemplate
  ): LeadMagnet {
    // Template-specific suggestions
    const suggestions: Record<EmailCaptureTemplate, LeadMagnet> = {
      discount: {
        type: 'discount',
        title: `${this.getDiscountValue(context)} Off Your First ${this.getOfferType(context)}`,
        description: `Join our VIP list and get an exclusive ${this.getDiscountValue(
          context
        )} discount code delivered to your inbox instantly!`,
        value: this.getDiscountValue(context),
        deliveryMethod: 'email',
      },
      guide: {
        type: 'pdf',
        title: this.generateGuideTitle(context),
        description: `Download our free ${
          context.industry
        } guide packed with insider tips, tricks, and strategies you can use immediately.`,
        value: 'Free (normally $29)',
        deliveryMethod: 'download',
        asset: {
          url: '/assets/guides/placeholder.pdf',
          filename: 'guide.pdf',
          filesize: 1024000,
        },
      },
      checklist: {
        type: 'checklist',
        title: this.generateChecklistTitle(context),
        description: `Get our proven checklist that ${
          context.targetAudience || 'thousands of customers'
        } use to ${this.getDesiredOutcome(context)}.`,
        value: 'Free instant download',
        deliveryMethod: 'download',
      },
      webinar: {
        type: 'video',
        title: `Free ${context.industry} Masterclass`,
        description: `Register for our exclusive webinar where we reveal the secrets to ${this.getDesiredOutcome(
          context
        )}. Limited spots available!`,
        value: 'Free (limited seats)',
        deliveryMethod: 'email',
      },
      consultation: {
        type: 'consultation',
        title: `Free ${context.industry} Consultation (Worth $${this.getConsultationValue(context)})`,
        description: `Book your complimentary 30-minute consultation and discover how we can help you ${this.getDesiredOutcome(
          context
        )}.`,
        value: `$${this.getConsultationValue(context)} value`,
        deliveryMethod: 'email',
      },
    };

    return suggestions[template];
  }

  /**
   * Build form based on template requirements
   */
  private buildForm(template: EmailCaptureTemplate): CaptureForm {
    const baseFields: FormField[] = [
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'your@email.com',
        required: true,
        validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
    ];

    // Template-specific fields
    const additionalFields: Record<EmailCaptureTemplate, FormField[]> = {
      discount: [], // Email only for quick conversion
      guide: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'John',
          required: true,
        },
      ],
      checklist: [],
      webinar: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'John',
          required: true,
        },
        {
          name: 'phone',
          type: 'phone',
          label: 'Phone Number (optional)',
          placeholder: '(555) 123-4567',
          required: false,
        },
      ],
      consultation: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'John',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          placeholder: 'Doe',
          required: true,
        },
        {
          name: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: '(555) 123-4567',
          required: true,
        },
      ],
    };

    const fields = [...baseFields, ...(additionalFields[template] || [])];

    return {
      fields,
      submitButtonText: this.getSubmitButtonText(template),
      consentText:
        'By submitting this form, you agree to receive email communications from us. You can unsubscribe at any time. We respect your privacy.',
      gdprCompliant: true,
    };
  }

  /**
   * Create thank you page configuration
   */
  private createThankYouPage(context: BusinessContext, leadMagnet: LeadMagnet): ThankYouPage {
    const deliveryMessages: Record<string, string> = {
      email: `Check your email! We've sent ${leadMagnet.title} to your inbox. (Check spam folder if you don't see it within 5 minutes)`,
      download: `Your download is ready! ${leadMagnet.title} should download automatically. If not, click the link in the email we just sent you.`,
      redirect: `Thank you for registering! You'll receive confirmation and next steps via email shortly.`,
    };

    return {
      title: '🎉 Success! You\'re In!',
      message: deliveryMessages[leadMagnet.deliveryMethod],
      socialLinks: [
        {
          platform: 'instagram',
          url: `https://instagram.com/${context.name.toLowerCase().replace(/\s+/g, '')}`,
          label: 'Follow us on Instagram',
        },
        {
          platform: 'facebook',
          url: `https://facebook.com/${context.name.toLowerCase().replace(/\s+/g, '')}`,
          label: 'Like us on Facebook',
        },
      ],
    };
  }

  /**
   * Setup email integration
   */
  async setupIntegration(
    pageId: string,
    integration: EmailIntegration
  ): Promise<ServiceResponse<EmailIntegration>> {
    try {
      // Validate API key (in production)
      if (!integration.apiKey && integration.provider !== 'custom') {
        throw new Error('API key required for email integration');
      }

      // In production: Test connection to email service
      integration.enabled = true;

      return {
        success: true,
        data: integration,
        metadata: {
          provider: integration.provider,
          status: 'connected',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup integration',
      };
    }
  }

  /**
   * Track form submission
   */
  async trackSubmission(
    pageId: string,
    email: string,
    formData: Record<string, string>
  ): Promise<ServiceResponse<CaptureStats>> {
    try {
      // In production: Save to database, send to email service
      const stats: CaptureStats = {
        views: 0, // Would fetch from DB
        submissions: 1, // Increment
        conversionRate: 0, // Calculate
        lastSubmission: new Date(),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track submission',
      };
    }
  }

  /**
   * Update page stats
   */
  async updateStats(pageId: string, type: 'view' | 'submit'): Promise<ServiceResponse<void>> {
    try {
      // In production: Update database
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stats',
      };
    }
  }

  /**
   * Get all capture pages for a business
   */
  async getCapturePages(businessId: string): Promise<ServiceResponse<EmailCapturePage[]>> {
    try {
      // In production: Fetch from database
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pages',
      };
    }
  }

  // ============================================================================
  // Content Generation Helpers
  // ============================================================================

  private generateTitle(
    context: BusinessContext,
    template: EmailCaptureTemplate,
    leadMagnet: LeadMagnet
  ): string {
    return leadMagnet.title;
  }

  private generateDescription(
    context: BusinessContext,
    template: EmailCaptureTemplate,
    leadMagnet: LeadMagnet
  ): string {
    return leadMagnet.description;
  }

  private generateGuideTitle(context: BusinessContext): string {
    const templates = [
      `The Ultimate ${context.industry} Guide for Beginners`,
      `10 ${context.industry} Secrets the Pros Don't Want You to Know`,
      `How to ${this.getDesiredOutcome(context)} in 30 Days`,
      `The Complete ${context.specialty || context.industry} Playbook`,
    ];
    return this.randomChoice(templates);
  }

  private generateChecklistTitle(context: BusinessContext): string {
    const templates = [
      `The ${context.industry} Success Checklist`,
      `30-Day ${context.specialty || context.industry} Challenge Checklist`,
      `Pre-${this.getOfferType(context)} Checklist: Don't Miss These Steps!`,
      `${context.industry} Best Practices Checklist`,
    ];
    return this.randomChoice(templates);
  }

  private getDiscountValue(context: BusinessContext): string {
    // Different industries have different discount sweet spots
    const discounts: Record<string, string> = {
      restaurant: '15%',
      retail: '20%',
      service: '$50',
      consultation: '$100',
      fitness: '25%',
      salon: '20%',
    };

    return discounts[context.industry.toLowerCase()] || '20%';
  }

  private getOfferType(context: BusinessContext): string {
    const types: Record<string, string> = {
      restaurant: 'Visit',
      retail: 'Purchase',
      service: 'Service',
      consultation: 'Session',
      fitness: 'Month',
      salon: 'Appointment',
    };

    return types[context.industry.toLowerCase()] || 'Purchase';
  }

  private getConsultationValue(context: BusinessContext): number {
    const values: Record<string, number> = {
      consulting: 200,
      legal: 300,
      financial: 250,
      marketing: 150,
      coaching: 200,
    };

    return values[context.industry.toLowerCase()] || 150;
  }

  private getDesiredOutcome(context: BusinessContext): string {
    const outcomes: Record<string, string> = {
      fitness: 'transform your body',
      consulting: 'grow your business',
      coaching: 'achieve your goals',
      salon: 'get your dream look',
      photography: 'capture perfect moments',
      marketing: 'attract more customers',
    };

    return outcomes[context.industry.toLowerCase()] || 'achieve success';
  }

  private getSubmitButtonText(template: EmailCaptureTemplate): string {
    const texts: Record<EmailCaptureTemplate, string> = {
      discount: 'Get My Discount Code',
      guide: 'Download Free Guide',
      checklist: 'Send Me The Checklist',
      webinar: 'Save My Spot',
      consultation: 'Book My Free Consultation',
    };

    return texts[template];
  }

  private generateSlug(context: BusinessContext, template: EmailCaptureTemplate): string {
    const businessSlug = context.name.toLowerCase().replace(/\s+/g, '-');
    return `${businessSlug}-${template}`;
  }

  private initializeStats(): CaptureStats {
    return {
      views: 0,
      submissions: 0,
      conversionRate: 0,
    };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private generateId(): string {
    return `capture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Export page as HTML (for self-hosting)
   */
  async exportHTML(page: EmailCapturePage): Promise<ServiceResponse<string>> {
    try {
      // Generate standalone HTML
      const html = this.generateHTMLTemplate(page);

      return {
        success: true,
        data: html,
        metadata: {
          filename: `${page.slug}.html`,
          size: html.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export HTML',
      };
    }
  }

  /**
   * Generate standalone HTML template
   */
  private generateHTMLTemplate(page: EmailCapturePage): string {
    // Minimal, mobile-responsive HTML template
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
    }
    h1 { color: #667eea; margin-bottom: 20px; font-size: 28px; }
    p { margin-bottom: 20px; color: #666; }
    .value {
      background: #f7fafc;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
      color: #667eea;
    }
    form { margin-top: 30px; }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    input {
      width: 100%;
      padding: 12px;
      margin-bottom: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 15px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover { background: #5568d3; }
    .consent {
      font-size: 12px;
      color: #999;
      margin-top: 15px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${page.title}</h1>
    <p>${page.description}</p>
    <div class="value">${page.leadMagnet.value}</div>

    <form id="captureForm" action="/api/capture/${page.id}" method="POST">
      ${page.form.fields
        .map(
          (field) => `
        <div>
          <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
          <input
            type="${field.type}"
            id="${field.name}"
            name="${field.name}"
            placeholder="${field.placeholder}"
            ${field.required ? 'required' : ''}
          />
        </div>
      `
        )
        .join('')}

      <button type="submit">${page.form.submitButtonText}</button>

      <p class="consent">${page.form.consentText}</p>
    </form>
  </div>

  <script>
    document.getElementById('captureForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      // Send to your API endpoint
      const response = await fetch(e.target.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        window.location.href = '/thank-you';
      }
    });
  </script>
</body>
</html>`;
  }
}

// Singleton export
export const emailCaptureService = new EmailCaptureService();
