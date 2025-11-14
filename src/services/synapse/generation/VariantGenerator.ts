/**
 * A/B Variant Generator
 *
 * Generates multiple variations of the same content with different psychological angles
 * for A/B testing. Each variant emphasizes a different strategy (scarcity, FOMO, exclusivity).
 *
 * Created: 2025-11-11
 */

import type {
  SynapseContent,
  ContentVariant,
  ABTestGroup,
  VariantStrategy,
  BusinessProfile
} from '@/types/synapseContent.types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('VITE_OPENROUTER_API_KEY is not set in .env file');
}

export class VariantGenerator {
  /**
   * Generate A/B test variants from original content
   */
  async generateVariants(
    originalContent: SynapseContent,
    business: BusinessProfile,
    strategies: VariantStrategy[] = ['scarcity', 'fomo', 'exclusivity']
  ): Promise<ABTestGroup> {
    console.log('[VariantGenerator] Generating variants with strategies:', strategies);

    const variants: ContentVariant[] = [];

    // Generate each variant
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      const variantLetter = ['A', 'B', 'C'][i] as 'A' | 'B' | 'C';

      try {
        const variant = await this.generateSingleVariant(
          originalContent,
          business,
          strategy,
          variantLetter
        );
        variants.push(variant);
      } catch (error) {
        console.error(`[VariantGenerator] Error generating ${strategy} variant:`, error);
      }
    }

    // Determine recommended test order
    const recommended = this.recommendTestOrder(variants);

    return {
      testId: `test-${Date.now()}`,
      originalInsightId: originalContent.insightId,
      variants,
      recommendedTest: recommended
    };
  }

  /**
   * Generate a single variant with specific strategy
   */
  private async generateSingleVariant(
    original: SynapseContent,
    business: BusinessProfile,
    strategy: VariantStrategy,
    variantLetter: 'A' | 'B' | 'C'
  ): Promise<ContentVariant> {
    const prompt = this.buildVariantPrompt(original, business, strategy);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MARBA Variant Generator'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const variantText = data.choices[0].message.content;

    // Parse variant content
    const parsed = this.parseVariantContent(variantText);

    // Create new content object with variant
    const variantContent: SynapseContent = {
      ...original,
      id: `${original.id}-variant-${variantLetter}`,
      content: {
        ...original.content,
        headline: parsed.headline,
        hook: parsed.hook,
        body: parsed.body,
        cta: parsed.cta
      }
    };

    // Detect differences
    const differences = this.detectDifferences(original, variantContent);

    return {
      id: variantContent.id,
      variantLetter,
      strategy,
      content: variantContent,
      differenceFromOriginal: differences
    };
  }

  /**
   * Build variant generation prompt
   */
  private buildVariantPrompt(
    original: SynapseContent,
    business: BusinessProfile,
    strategy: VariantStrategy
  ): string {
    const strategyGuidelines = this.getStrategyGuidelines(strategy);

    return `You are a conversion copywriter creating an A/B test variant of existing content.

BUSINESS: ${business.name} (${business.industry})
STRATEGY: ${strategy.toUpperCase()}

ORIGINAL CONTENT:
Headline: ${original.content.headline}
Hook: ${original.content.hook}
Body: ${original.content.body}
CTA: ${original.content.cta}

---

YOUR TASK: Create a ${strategy} variant of this content.

${strategyGuidelines}

CRITICAL RULES:
1. Keep the core message and value proposition
2. Adjust the psychological angle to emphasize ${strategy}
3. Maintain the same length (+/- 20%)
4. Keep it brand-safe and professional
5. Make the changes subtle but measurable

OUTPUT FORMAT (return ONLY the variant content, no explanations):

HEADLINE: [${strategy} variant headline]
HOOK: [${strategy} variant hook]
BODY: [${strategy} variant body]
CTA: [${strategy} variant CTA]`;
  }

  /**
   * Get strategy-specific guidelines
   */
  private getStrategyGuidelines(strategy: VariantStrategy): string {
    switch (strategy) {
      case 'scarcity':
        return `SCARCITY STRATEGY:
- Emphasize limited availability or spots
- Use phrases like "limited", "only X left", "filling up fast"
- Create urgency around supply constraints
- Maintain authenticity (don't manufacture fake scarcity)

EXAMPLES:
❌ "Book your event today"
✅ "Only 3 December slots remaining"

❌ "We're available for corporate events"
✅ "Last week for December bookings before we're fully booked"`;

      case 'fomo':
        return `FOMO STRATEGY (Fear of Missing Out):
- Emphasize what they'll miss if they don't act
- Use social proof and bandwagon effect
- Highlight others who have already acted
- Create urgency around opportunity cost

EXAMPLES:
❌ "Book your holiday party"
✅ "While your competitors are securing their December dates, will you be left scrambling?"

❌ "Call us today"
✅ "Don't be the team without a venue this holiday season"`;

      case 'exclusivity':
        return `EXCLUSIVITY STRATEGY:
- Position as VIP or exclusive opportunity
- Emphasize quality over quantity
- Use "insider", "select", "preferred" language
- Make them feel special for being considered

EXAMPLES:
❌ "We're available for bookings"
✅ "Accepting a select number of corporate events for discerning teams"

❌ "Book now"
✅ "For serious event planners who won't settle for the usual"`;

      case 'urgency':
        return `URGENCY STRATEGY:
- Emphasize time-sensitive nature
- Use deadlines and countdowns
- Create pressure around timing
- Maintain credibility (real deadlines only)

EXAMPLES:
❌ "Contact us"
✅ "Spots close Friday at 5pm"

❌ "Book your event"
✅ "This week only: December availability"`;

      case 'social-proof':
        return `SOCIAL PROOF STRATEGY:
- Emphasize popularity and trust
- Reference other customers or usage
- Use testimonials or statistics
- Build credibility through numbers

EXAMPLES:
❌ "Great venue"
✅ "Trusted by 50+ Dallas companies for their holiday events"

❌ "Book with us"
✅ "Join the teams who refuse to settle for crowded chain restaurants"`;

      default:
        return '';
    }
  }

  /**
   * Parse variant content from Claude response
   */
  private parseVariantContent(text: string): {
    headline: string;
    hook: string;
    body: string;
    cta: string;
  } {
    const lines = text.split('\n').filter(l => l.trim());

    const result = {
      headline: '',
      hook: '',
      body: '',
      cta: ''
    };

    let currentSection = '';
    let bodyLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) {
        currentSection = 'headline';
        result.headline = line.replace('HEADLINE:', '').trim();
      } else if (line.startsWith('HOOK:')) {
        currentSection = 'hook';
        result.hook = line.replace('HOOK:', '').trim();
      } else if (line.startsWith('BODY:')) {
        currentSection = 'body';
        const bodyStart = line.replace('BODY:', '').trim();
        if (bodyStart) bodyLines.push(bodyStart);
      } else if (line.startsWith('CTA:')) {
        currentSection = 'cta';
        result.cta = line.replace('CTA:', '').trim();
      } else if (currentSection === 'headline' && !result.headline) {
        result.headline = line.trim();
      } else if (currentSection === 'hook' && !result.hook) {
        result.hook = line.trim();
      } else if (currentSection === 'body') {
        bodyLines.push(line.trim());
      } else if (currentSection === 'cta' && !result.cta) {
        result.cta = line.trim();
      }
    }

    result.body = bodyLines.join('\n\n');

    return result;
  }

  /**
   * Detect differences between original and variant
   */
  private detectDifferences(original: SynapseContent, variant: SynapseContent): string[] {
    const differences: string[] = [];

    if (original.content.headline !== variant.content.headline) {
      differences.push(`Headline: Changed from "${original.content.headline.substring(0, 50)}..." to "${variant.content.headline.substring(0, 50)}..."`);
    }

    if (original.content.hook !== variant.content.hook) {
      differences.push(`Hook: Adjusted psychological angle`);
    }

    if (original.content.body !== variant.content.body) {
      differences.push(`Body: Reframed with variant strategy`);
    }

    if (original.content.cta !== variant.content.cta) {
      differences.push(`CTA: Modified call-to-action`);
    }

    return differences.length > 0 ? differences : ['Minor refinements applied'];
  }

  /**
   * Recommend test order
   */
  private recommendTestOrder(variants: ContentVariant[]): string {
    // Recommend starting with scarcity (usually highest converting)
    const scarcityVariant = variants.find(v => v.strategy === 'scarcity');
    if (scarcityVariant) {
      return `Test Variant ${scarcityVariant.variantLetter} (Scarcity) first - typically highest converting`;
    }

    // Fall back to first variant
    return variants.length > 0
      ? `Test Variant ${variants[0].variantLetter} (${variants[0].strategy}) first`
      : 'No variants generated';
  }
}
