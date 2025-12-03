/**
 * Preserves specific insights and formats them cleanly
 */

interface FormattedInsight {
  title: string;           // The specific, actionable insight
  overview?: string;       // Additional context if needed
  bullets?: string[];      // Supporting evidence points
}

/**
 * Cleans up text while preserving specificity
 */
function cleanText(text: string): string {
  const cleaned = text.trim();

  // Ensure it ends with proper punctuation
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    return `${cleaned}.`;
  }

  return cleaned;
}

/**
 * Splits semicolon-separated text into array
 */
function splitSemicolons(text: string): string[] {
  if (!text.includes(';')) return [text];

  return text.split(';').map(s => s.trim()).filter(Boolean);
}

/**
 * Takes semicolon-separated insight and returns the most specific part as title
 */
function extractSpecificInsight(rawText: string): FormattedInsight {
  const parts = splitSemicolons(rawText);

  if (parts.length === 0) {
    return { title: rawText };
  }

  // Last part is usually the most specific/actionable insight
  const mainInsight = parts[parts.length - 1];

  // If there are supporting parts, use them as bullets
  const supportingParts = parts.slice(0, -1);

  return {
    title: cleanText(mainInsight),
    bullets: supportingParts.length > 0 ? supportingParts : undefined
  };
}

/**
 * Main entry point: preserves specificity, only cleans formatting
 */
export function formatInsightText(
  rawText: string,
  category: 'customer' | 'market' | 'competition' | 'local' | 'opportunity',
  actionableInsight?: string
): FormattedInsight {
  if (!rawText) {
    return {
      title: 'Insight data unavailable',
      overview: 'No data available for this insight.'
    };
  }

  // Check if it's semicolon-separated
  if (rawText.includes(';')) {
    const formatted = extractSpecificInsight(rawText);

    // Add actionable insight as overview if provided
    if (actionableInsight) {
      formatted.overview = cleanText(actionableInsight);
    }

    return formatted;
  }

  // Single insight - keep it as is, just clean
  return {
    title: cleanText(rawText),
    overview: actionableInsight ? cleanText(actionableInsight) : undefined
  };
}
