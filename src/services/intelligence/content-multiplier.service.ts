/**
 * Content Multiplication Service
 *
 * Transforms a single breakthrough into a complete content ecosystem:
 * 1. Generates 3-5 unique angles on the insight
 * 2. Creates platform-specific variants (LinkedIn, Instagram, Email, etc.)
 * 3. Builds a weekly content calendar
 *
 * Example: "Customers craving faster service"
 *  → Pain angle: "Are slow checkout times frustrating your customers?"
 *  → Aspiration angle: "Imagine checkout times cut in half"
 *  → Social proof angle: "15 reviews confirm customers want faster service"
 *  → Each angle × 5 platforms = 15+ pieces of content ready to publish
 *
 * Created: 2025-11-23
 */

import type { Breakthrough } from './breakthrough-generator.service';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContentAngle {
  id: string;
  angle: string;               // "Customer Pain Point", "Aspirational Outcome", etc.
  perspective: string;         // The specific take on this angle
  hook: string;                // Opening line to grab attention
  cta: string;                 // Call to action
  emotionalTrigger: string;    // "frustration", "hope", "fomo", etc.
}

export interface PlatformVariant {
  platform: 'linkedin' | 'instagram' | 'facebook' | 'email' | 'twitter' | 'blog';
  content: string;
  format: string;              // "text-post", "carousel", "email", etc.
  hashtags?: string[];
  subject?: string;            // For email
  characterCount: number;
}

export interface MultipliedContent {
  breakthroughId: string;
  originalTitle: string;
  angles: ContentAngle[];
  platformVariants: Record<string, PlatformVariant[]>;  // angleId -> variants
  weeklyCalendar: WeeklyContent[];
}

export interface WeeklyContent {
  day: string;
  angleId: string;
  platform: string;
  content: string;
  timeSlot: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ContentMultiplierService {
  /**
   * Main entry point: Multiplies a single breakthrough into full content package
   */
  public multiplyBreakthrough(
    breakthrough: Breakthrough,
    context: DeepContext
  ): MultipliedContent {
    const angles = this.generateAngles(breakthrough, context);
    const platformVariants: Record<string, PlatformVariant[]> = {};

    angles.forEach(angle => {
      platformVariants[angle.id] = this.generatePlatformVariants(angle, breakthrough, context);
    });

    const multipliedContent: MultipliedContent = {
      breakthroughId: breakthrough.id,
      originalTitle: breakthrough.title,
      angles,
      platformVariants,
      weeklyCalendar: []
    };

    multipliedContent.weeklyCalendar = this.generateWeeklyCalendar(multipliedContent);

    return multipliedContent;
  }

  /**
   * Batch multiply multiple breakthroughs
   */
  public multiplyBreakthroughs(
    breakthroughs: Breakthrough[],
    context: DeepContext
  ): MultipliedContent[] {
    return breakthroughs.map(bt => this.multiplyBreakthrough(bt, context));
  }

  /**
   * Generates 3-5 unique content angles from a breakthrough
   * Each angle approaches the insight from a different psychological perspective
   */
  private generateAngles(breakthrough: Breakthrough, context: DeepContext): ContentAngle[] {
    const angles: ContentAngle[] = [];
    const businessName = context.business?.profile?.name || 'we';

    // ANGLE 1: Customer Pain Point (always included)
    angles.push({
      id: `${breakthrough.id}-pain`,
      angle: 'Customer Pain Point',
      perspective: `Focus on the problem: ${breakthrough.description}`,
      hook: this.generatePainHook(breakthrough, context),
      cta: `Learn how ${businessName} solves this`,
      emotionalTrigger: 'frustration'
    });

    // ANGLE 2: Aspirational Outcome (always included)
    angles.push({
      id: `${breakthrough.id}-aspiration`,
      angle: 'Aspirational Outcome',
      perspective: `Show the desired state after addressing: ${breakthrough.title}`,
      hook: this.generateAspirationHook(breakthrough, context),
      cta: 'See what is possible',
      emotionalTrigger: 'hope'
    });

    // ANGLE 3: Social Proof (if enough validation)
    if (breakthrough.validation.totalDataPoints >= 5) {
      angles.push({
        id: `${breakthrough.id}-proof`,
        angle: 'Social Proof',
        perspective: breakthrough.validation.validationStatement,
        hook: this.generateProofHook(breakthrough, context),
        cta: `Join ${breakthrough.validation.totalDataPoints}+ others who discovered this`,
        emotionalTrigger: 'belonging'
      });
    }

    // ANGLE 4: Competitive Advantage (if available)
    if (breakthrough.competitiveAdvantage?.gapDescription) {
      angles.push({
        id: `${breakthrough.id}-competitive`,
        angle: 'Competitive Advantage',
        perspective: breakthrough.competitiveAdvantage.gapDescription,
        hook: this.generateCompetitiveHook(breakthrough, context),
        cta: 'Get what competitors cannot offer',
        emotionalTrigger: 'exclusivity'
      });
    }

    // ANGLE 5: Urgency/Timing (if urgent)
    if (breakthrough.timing.urgency) {
      angles.push({
        id: `${breakthrough.id}-urgent`,
        angle: 'Time-Sensitive Opportunity',
        perspective: 'Act now before this opportunity passes',
        hook: this.generateUrgencyHook(breakthrough, context),
        cta: 'Do not miss out',
        emotionalTrigger: 'fomo'
      });
    }

    return angles;
  }

  // Helper methods for generating hooks
  private generatePainHook(bt: Breakthrough, ctx: DeepContext): string {
    const audience = ctx.business?.profile?.targetAudience || 'customers';
    return `Are ${audience} struggling with ${bt.title.toLowerCase()}?`;
  }

  private generateAspirationHook(bt: Breakthrough, ctx: DeepContext): string {
    return `Imagine ${bt.description.toLowerCase()} - it is closer than you think.`;
  }

  private generateProofHook(bt: Breakthrough, ctx: DeepContext): string {
    return `${bt.validation.totalDataPoints}+ data points confirm: ${bt.title}`;
  }

  private generateCompetitiveHook(bt: Breakthrough, ctx: DeepContext): string {
    return `What if you could deliver ${bt.title.toLowerCase()} when competitors can't?`;
  }

  private generateUrgencyHook(bt: Breakthrough, ctx: DeepContext): string {
    return `${bt.title} — but only for a limited time.`;
  }

  /**
   * Generates platform-specific content variants for a given angle
   * Adapts tone, length, and format to each platform's best practices
   */
  private generatePlatformVariants(
    angle: ContentAngle,
    breakthrough: Breakthrough,
    context: DeepContext
  ): PlatformVariant[] {
    const businessName = context.business?.profile?.name || 'us';

    return [
      this.createLinkedInVariant(angle, breakthrough, businessName),
      this.createInstagramVariant(angle, breakthrough, businessName),
      this.createFacebookVariant(angle, breakthrough, businessName),
      this.createEmailVariant(angle, breakthrough, businessName),
      this.createTwitterVariant(angle, breakthrough, businessName)
    ];
  }

  private createLinkedInVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
    const content = `${angle.hook}

${bt.description}

${angle.perspective}

At ${business}, we have noticed this pattern and built our approach around it.

${angle.cta} → [link]

#${bt.category.replace('-', '')} #BusinessInsights #CustomerExperience`;

    return {
      platform: 'linkedin',
      content,
      format: 'text-post',
      hashtags: [bt.category.replace('-', ''), 'BusinessInsights', 'CustomerExperience'],
      characterCount: content.length
    };
  }

  private createInstagramVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
    // Instagram: Visual-first, shorter text, emoji-friendly
    const content = `✨ ${angle.hook}

${bt.description.substring(0, 100)}${bt.description.length > 100 ? '...' : ''}

${angle.cta} - link in bio 💫

#${bt.category.replace('-', '').toLowerCase()} #localbusiness #community #customerservice`;

    return {
      platform: 'instagram',
      content,
      format: 'carousel-post',
      hashtags: [bt.category.replace('-', '').toLowerCase(), 'localbusiness', 'community', 'customerservice'],
      characterCount: content.length
    };
  }

  private createFacebookVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
    // Facebook: Conversational, community-focused
    const content = `${angle.hook}

${bt.description}

We are ${business}, and we have built our entire approach around this insight.

${angle.cta} 💡`;

    return {
      platform: 'facebook',
      content,
      format: 'link-post',
      characterCount: content.length
    };
  }

  private createEmailVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
    // Email: Personal, direct, with clear structure
    const subject = angle.hook.length > 50
      ? angle.hook.substring(0, 47) + '...'
      : angle.hook;

    const content = `Hi there,

${angle.hook}

${bt.description}

${angle.perspective}

${angle.cta} by replying to this email or visiting [link].

Best,
The ${business} Team

P.S. ${bt.validation.validationStatement}`;

    return {
      platform: 'email',
      content,
      format: 'html-email',
      subject,
      characterCount: content.length
    };
  }

  private createTwitterVariant(angle: ContentAngle, bt: Breakthrough, business: string): PlatformVariant {
    // Twitter: Concise, punchy, under 280 characters
    const hook = angle.hook.length > 120 ? angle.hook.substring(0, 117) + '...' : angle.hook;
    const content = `${hook}

${angle.cta}

#${bt.category.replace('-', '')}`.substring(0, 280);

    return {
      platform: 'twitter',
      content,
      format: 'tweet',
      hashtags: [bt.category.replace('-', '')],
      characterCount: content.length
    };
  }

  /**
   * Creates a 7-day content calendar from multiplied content
   * Strategically distributes angles across platforms and days
   */
  private generateWeeklyCalendar(multipliedContent: MultipliedContent): WeeklyContent[] {
    const calendar: WeeklyContent[] = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const platforms = ['linkedin', 'instagram', 'facebook', 'email', 'twitter'];

    multipliedContent.angles.forEach((angle, angleIndex) => {
      const dayIndex = angleIndex % days.length;
      const platformIndex = angleIndex % platforms.length;

      const variants = multipliedContent.platformVariants[angle.id];
      if (variants) {
        const variant = variants.find(v => v.platform === platforms[platformIndex]) || variants[0];

        calendar.push({
          day: days[dayIndex],
          angleId: angle.id,
          platform: variant.platform,
          content: variant.content,
          timeSlot: this.getOptimalTimeSlot(variant.platform)
        });
      }
    });

    return calendar;
  }

  /**
   * Returns optimal posting time for each platform based on research
   */
  private getOptimalTimeSlot(platform: string): string {
    const timeSlots: Record<string, string> = {
      linkedin: '9:00 AM',    // Business hours, morning
      instagram: '11:00 AM',  // Late morning engagement peak
      facebook: '1:00 PM',    // Lunch scrolling time
      email: '10:00 AM',      // Mid-morning inbox check
      twitter: '3:00 PM',     // Afternoon engagement
      blog: '8:00 AM'         // Morning reading time
    };
    return timeSlots[platform] || '12:00 PM';
  }
}

export const contentMultiplierService = new ContentMultiplierService();
