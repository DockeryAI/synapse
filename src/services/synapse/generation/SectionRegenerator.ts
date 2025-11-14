/**
 * Section Regenerator
 *
 * Regenerates individual content sections (headline, hook, body, CTA)
 * without regenerating the entire content piece. Provides 3-5 alternative
 * options to choose from.
 *
 * Created: 2025-11-11
 */

import type {
  SynapseContent,
  BusinessProfile,
  ContentSection,
  RegenerationRequest,
  RegenerationResult,
  RegenerationHistory
} from '@/types/synapseContent.types';
import type { BreakthroughInsight } from '@/types/breakthrough.types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('VITE_OPENROUTER_API_KEY is not set in .env file');
}

export class SectionRegenerator {
  /**
   * Regenerate a specific section of content
   */
  async regenerateSection(
    content: SynapseContent,
    section: ContentSection,
    business: BusinessProfile,
    insight: BreakthroughInsight,
    improvementDirection?: string
  ): Promise<RegenerationResult> {
    console.log(`[SectionRegenerator] Regenerating ${section} for content ${content.id}`);

    const currentContent = this.getCurrentSectionContent(content, section);

    const prompt = this.buildRegenerationPrompt(
      content,
      section,
      currentContent,
      business,
      insight,
      improvementDirection
    );

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MARBA Section Regenerator'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const alternatives = this.parseRegeneratedOptions(
        data.choices[0].message.content,
        section
      );

      return {
        section,
        original: currentContent,
        regenerated: alternatives,
        selectedIndex: undefined,
        reasoning: improvementDirection || `Regenerated ${section} with fresh variations`
      };
    } catch (error) {
      console.error('[SectionRegenerator] Error:', error);
      throw error;
    }
  }

  /**
   * Get current content for a section
   */
  private getCurrentSectionContent(content: SynapseContent, section: ContentSection): string {
    switch (section) {
      case 'headline':
        return content.content.headline;
      case 'hook':
        return content.content.hook;
      case 'body':
        return content.content.body;
      case 'cta':
        return content.content.cta;
      default:
        return '';
    }
  }

  /**
   * Build regeneration prompt
   */
  private buildRegenerationPrompt(
    content: SynapseContent,
    section: ContentSection,
    currentContent: string,
    business: BusinessProfile,
    insight: BreakthroughInsight,
    improvementDirection?: string
  ): string {
    const sectionGuidelines = this.getSectionGuidelines(section, content.format);
    const improvementNote = improvementDirection
      ? `\n\nIMPROVEMENT DIRECTION: ${improvementDirection}`
      : '';

    return `You are a master copywriter regenerating a single section of existing content.

BUSINESS: ${business.name} (${business.industry})
CONTENT FORMAT: ${content.format}
SECTION TO REGENERATE: ${section}

CONTEXT (DO NOT REGENERATE):
${this.buildContextSection(content, section)}

CURRENT ${section.toUpperCase()}:
"${currentContent}"

ORIGINAL INSIGHT:
${insight.insight}

WHY IT'S PROFOUND:
${insight.whyProfound || 'Strong emotional resonance'}

${sectionGuidelines}${improvementNote}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 3-5 variations
2. Each must be distinctly different from the others
3. Maintain the same core message and psychology
4. Keep similar length to original (+/- 20%)
5. Number each variation clearly (OPTION 1, OPTION 2, etc.)
6. NO explanations or commentary - just the variations

OUTPUT FORMAT:

OPTION 1:
[First variation here]

OPTION 2:
[Second variation here]

OPTION 3:
[Third variation here]

OPTION 4:
[Fourth variation here - optional]

OPTION 5:
[Fifth variation here - optional]`;
  }

  /**
   * Build context section showing other parts of content
   */
  private buildContextSection(content: SynapseContent, regeneratingSection: ContentSection): string {
    const parts: string[] = [];

    if (regeneratingSection !== 'headline') {
      parts.push(`Headline: "${content.content.headline}"`);
    }
    if (regeneratingSection !== 'hook') {
      parts.push(`Hook: "${content.content.hook.substring(0, 100)}..."`);
    }
    if (regeneratingSection !== 'body') {
      parts.push(`Body: "${content.content.body.substring(0, 100)}..."`);
    }
    if (regeneratingSection !== 'cta') {
      parts.push(`CTA: "${content.content.cta}"`);
    }

    return parts.join('\n');
  }

  /**
   * Get section-specific guidelines
   */
  private getSectionGuidelines(section: ContentSection, format: string): string {
    switch (section) {
      case 'headline':
        return `HEADLINE GUIDELINES:
- Grab attention in 10-15 words
- Create curiosity or intrigue
- Should work standalone (people read headlines first)
- Avoid clickbait or misleading angles
- Match the ${format} format's style

GOOD HEADLINES:
✅ "The parking spot strategy nobody talks about"
✅ "Why December bookings happen in November"
✅ "What 50+ event planners know about venues"`;

      case 'hook':
        return `HOOK GUIDELINES:
- First 1-2 sentences that pull reader in
- Build on headline's promise
- Create "I need to read this" feeling
- Use pattern interrupts or surprising facts
- Lead naturally into body

GOOD HOOKS:
✅ "Most event planners make this mistake every year..."
✅ "Here's what nobody tells you about holiday bookings..."
✅ "The data reveals something surprising..."`;

      case 'body':
        return `BODY GUIDELINES:
- Deliver on hook's promise with substance
- Use 2-4 paragraphs for ${format}
- Include specific details or evidence
- Build credibility and trust
- Connect emotionally while staying factual

GOOD BODY CONTENT:
✅ Includes specific numbers or examples
✅ Addresses reader's situation directly
✅ Builds logical case for your point
✅ Uses paragraph breaks for readability`;

      case 'cta':
        return `CTA GUIDELINES:
- Clear, direct action step
- Reduce friction (make it easy)
- Create urgency without pressure
- Connect to the content's promise
- ${format === 'controversial-post' ? 'Can be softer/educational' : 'Should be direct'}

GOOD CTAs:
✅ "Book your December event before spots fill up"
✅ "Schedule a consultation today"
✅ "See why 50+ teams choose [Business]"
✅ "Visit us and experience the difference"`;

      default:
        return '';
    }
  }

  /**
   * Parse regenerated options from Claude response
   */
  private parseRegeneratedOptions(text: string, section: ContentSection): string[] {
    const options: string[] = [];
    const lines = text.split('\n');

    let currentOption = '';
    let collectingContent = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this is an option header
      if (/^OPTION\s+\d+:?$/i.test(trimmedLine)) {
        // Save previous option if exists
        if (currentOption.trim()) {
          options.push(currentOption.trim());
        }
        currentOption = '';
        collectingContent = true;
      } else if (/^OPTION\s+\d+:\s+.+/i.test(trimmedLine)) {
        // Option header with content on same line
        if (currentOption.trim()) {
          options.push(currentOption.trim());
        }
        currentOption = trimmedLine.replace(/^OPTION\s+\d+:\s*/i, '');
        collectingContent = true;
      } else if (collectingContent && trimmedLine) {
        // Collect content for current option
        if (currentOption) {
          currentOption += '\n\n' + trimmedLine;
        } else {
          currentOption = trimmedLine;
        }
      }
    }

    // Don't forget last option
    if (currentOption.trim()) {
      options.push(currentOption.trim());
    }

    // If parsing failed, try alternate format
    if (options.length === 0) {
      const sections = text.split(/\n\n+/);
      return sections
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 5);
    }

    return options.slice(0, 5); // Max 5 options
  }

  /**
   * Apply regenerated section to content
   */
  applyRegeneration(
    content: SynapseContent,
    result: RegenerationResult,
    selectedIndex: number
  ): SynapseContent {
    if (selectedIndex < 0 || selectedIndex >= result.regenerated.length) {
      throw new Error(`Invalid selection index: ${selectedIndex}`);
    }

    const newContent = { ...content };
    const selectedText = result.regenerated[selectedIndex];

    switch (result.section) {
      case 'headline':
        newContent.content = { ...newContent.content, headline: selectedText };
        break;
      case 'hook':
        newContent.content = { ...newContent.content, hook: selectedText };
        break;
      case 'body':
        newContent.content = { ...newContent.content, body: selectedText };
        break;
      case 'cta':
        newContent.content = { ...newContent.content, cta: selectedText };
        break;
    }

    // Update metadata
    newContent.metadata = {
      ...newContent.metadata,
      iterationCount: (newContent.metadata.iterationCount || 0) + 1,
      generatedAt: new Date()
    };

    return newContent;
  }

  /**
   * Track regeneration history
   */
  createHistoryEntry(
    content: SynapseContent,
    result: RegenerationResult,
    selectedIndex: number
  ): RegenerationHistory {
    return {
      contentId: content.id,
      section: result.section,
      timestamp: new Date(),
      original: result.original,
      regenerated: result.regenerated,
      selected: result.regenerated[selectedIndex],
      reason: result.reasoning
    };
  }

  /**
   * Batch regenerate multiple sections
   */
  async regenerateMultipleSections(
    content: SynapseContent,
    sections: ContentSection[],
    business: BusinessProfile,
    insight: BreakthroughInsight
  ): Promise<RegenerationResult[]> {
    const results: RegenerationResult[] = [];

    for (const section of sections) {
      try {
        const result = await this.regenerateSection(content, section, business, insight);
        results.push(result);
      } catch (error) {
        console.error(`[SectionRegenerator] Error regenerating ${section}:`, error);
      }
    }

    return results;
  }
}
