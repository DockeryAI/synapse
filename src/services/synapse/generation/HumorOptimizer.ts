/**
 * Humor Optimizer
 *
 * Adds professional humor to content based on edginess level (0-100 scale).
 * Uses Claude to enhance content while maintaining brand safety and professionalism.
 *
 * Edginess Scale:
 * - 0-25: Professional (subtle, polished, corporate-safe)
 * - 26-50: Approachable (warm, relatable, friendly)
 * - 51-75: Casual (conversational, witty, personable)
 * - 76-100: Edgy (bold, playful, attention-grabbing)
 *
 * Created: 2025-11-11
 */

import type {
  SynapseContent,
  BusinessProfile,
  EdginessLevel,
  HumorEnhancementResult,
  EDGINESS_RANGES
} from '@/types/synapseContent.types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('VITE_OPENROUTER_API_KEY is not set in .env file');
}

export class HumorOptimizer {
  /**
   * Add humor to content based on edginess level
   */
  async enhance(
    content: SynapseContent,
    business: BusinessProfile,
    edginessLevel: EdginessLevel
  ): Promise<HumorEnhancementResult> {
    const edginessLabel = this.getEdginessLabel(edginessLevel);

    const prompt = this.buildEnhancementPrompt(content, business, edginessLevel, edginessLabel);

    console.log('[HumorOptimizer] Enhancing content with edginess level:', edginessLevel, edginessLabel);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Synapse Humor Optimizer'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const enhancedText = data.choices[0].message.content;

      console.log('[HumorOptimizer] Enhanced content received:', enhancedText.substring(0, 200));

      // Parse the enhanced content
      const enhanced = this.parseEnhancedContent(enhancedText);

      return {
        original: {
          headline: content.content.headline,
          hook: content.content.hook,
          body: content.content.body,
          cta: content.content.cta
        },
        enhanced,
        edginessLevel,
        enhancementsApplied: this.detectEnhancements(content, enhanced)
      };
    } catch (error) {
      console.error('[HumorOptimizer] Enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Get edginess range label
   */
  private getEdginessLabel(level: EdginessLevel): string {
    if (level <= 25) return 'Professional';
    if (level <= 50) return 'Approachable';
    if (level <= 75) return 'Casual';
    return 'Edgy';
  }

  /**
   * Build enhancement prompt for Claude
   */
  private buildEnhancementPrompt(
    content: SynapseContent,
    business: BusinessProfile,
    edginessLevel: EdginessLevel,
    edginessLabel: string
  ): string {
    // Get edginess-specific guidelines
    const guidelines = this.getEdginessGuidelines(edginessLevel, business.industry);

    return `You are a professional copywriter enhancing content with humor for a ${business.industry} business.

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
EDGINESS LEVEL: ${edginessLevel}/100 (${edginessLabel})

CURRENT CONTENT:

Headline: ${content.content.headline}
Hook: ${content.content.hook}
Body: ${content.content.body}
CTA: ${content.content.cta}

---

YOUR TASK: Enhance this content with ${edginessLabel.toLowerCase()} humor while maintaining professionalism and brand safety.

${guidelines}

CRITICAL RULES:
1. ✅ MAINTAIN CLARITY - Humor should enhance, not obscure the message
2. ✅ BRAND SAFE - No offensive, controversial, or risky humor
3. ✅ INDUSTRY APPROPRIATE - Match the ${business.industry} tone
4. ✅ PRESERVE CTA - Keep the call-to-action clear and actionable
5. ❌ NO FORCED HUMOR - If it doesn't flow naturally, leave it unchanged
6. ❌ NO MEMES/TRENDS - No dated references or TikTok-speak
7. ❌ NO PUNS FOR PUNS' SAKE - Only use wordplay if it strengthens the message

OUTPUT FORMAT (return ONLY the enhanced content, no explanations):

HEADLINE: [enhanced headline]
HOOK: [enhanced hook]
BODY: [enhanced body - preserve line breaks with \\n\\n]
CTA: [enhanced CTA]`;
  }

  /**
   * Get edginess-specific guidelines
   */
  private getEdginessGuidelines(level: EdginessLevel, industry: string): string {
    if (level <= 25) {
      // Professional (0-25)
      return `PROFESSIONAL TONE (Edginess: ${level}/100):
- Use subtle, sophisticated observations
- Employ light irony or understatement
- Keep it polished and corporate-safe
- Think "knowing smile" not "laugh out loud"

GOOD EXAMPLES:
❌ "Your lawn is a hot mess!"
✅ "Your lawn has strong opinions about summer"

❌ "That meeting could've been an email"
✅ "Efficient meetings start with great coffee"`;
    } else if (level <= 50) {
      // Approachable (26-50)
      return `APPROACHABLE TONE (Edginess: ${level}/100):
- Use relatable, warm observations
- Gentle self-deprecation or shared experiences
- Conversational and friendly
- Think "coffee chat with a colleague"

GOOD EXAMPLES:
❌ "Adulting is hard"
✅ "When 'I'll handle it tomorrow' becomes a lifestyle choice"

❌ "Monday vibes"
✅ "Monday mornings hit different when your coffee is right"`;
    } else if (level <= 75) {
      // Casual (51-75)
      return `CASUAL TONE (Edginess: ${level}/100):
- Use witty, conversational language
- Playful observations about common situations
- More personality, less formality
- Think "text from a clever friend"

GOOD EXAMPLES:
❌ "We're the best!"
✅ "We're the 'where have you been all my life' of lawn care"

❌ "Professional service"
✅ "Because 'I'll mow it this weekend' is the adult version of 'my dog ate my homework'"`;
    } else {
      // Edgy (76-100)
      return `EDGY TONE (Edginess: ${level}/100):
- Use bold, attention-grabbing language
- Push boundaries while staying brand-safe
- More irreverent, less corporate
- Think "the friend who tells it like it is"

GOOD EXAMPLES:
❌ "We're amazing!"
✅ "That lawn isn't going to passive-aggressively grow itself into an HOA violation. Oh wait, it is."

❌ "Quality coffee"
✅ "Because your coworkers deserve better than whatever's happening in that break room pot"

SAFETY LIMITS (DO NOT CROSS):
- No profanity or crude language
- No controversial topics (politics, religion, etc.)
- No making fun of customers
- No liability-creating content (alcohol excess, etc.)`;
    }
  }

  /**
   * Parse Claude's enhanced content response
   */
  private parseEnhancedContent(text: string): { headline: string; hook: string; body: string; cta: string } {
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

    // Join body lines with double line breaks
    result.body = bodyLines.join('\n\n');

    return result;
  }

  /**
   * Detect what was enhanced
   */
  private detectEnhancements(
    original: SynapseContent,
    enhanced: { headline: string; hook: string; body: string; cta: string }
  ): string[] {
    const changes: string[] = [];

    if (enhanced.headline !== original.content.headline) {
      changes.push('Headline enhanced');
    }
    if (enhanced.hook !== original.content.hook) {
      changes.push('Hook enhanced');
    }
    if (enhanced.body !== original.content.body) {
      changes.push('Body enhanced');
    }
    if (enhanced.cta !== original.content.cta) {
      changes.push('CTA enhanced');
    }

    return changes.length > 0 ? changes : ['No changes made'];
  }
}
