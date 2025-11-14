/**
 * UVP Generator Service
 *
 * Generates value propositions using Claude 3.5 Sonnet
 * based on competitive analysis and customer insights
 */

import type {
  UVPGenerationRequest,
  UVPGenerationResponse,
  VennDiagramData
} from '../../types/uvp';

/**
 * Build the AI prompt for UVP generation
 */
function buildUVPPrompt(request: UVPGenerationRequest): string {
  const {
    decisionFactors,
    priceSensitivity,
    superpower,
    industryProfile,
    competitiveGaps,
    websiteAnalysis
  } = request;

  // Extract key data points
  const customerTriggers = industryProfile.customerTriggers
    .slice(0, 5)
    .map(t => t.trigger)
    .join(', ');

  const powerWords = industryProfile.powerWords.slice(0, 15).join(', ');

  const keywordGaps = competitiveGaps.keywordGaps
    .slice(0, 5)
    .map(k => k.keyword)
    .join(', ');

  const competitorWeaknesses = competitiveGaps.weaknesses
    .slice(0, 3)
    .map(w => w.weakness || w)
    .join(', ');

  const proofPoints = (websiteAnalysis.proofPoints || []).join(', ');
  const differentiators = (websiteAnalysis.differentiators || []).join(', ');

  const priceSensitivityMap = {
    premium: '"Price doesn\'t matter if you\'re the best" - they value quality over cost',
    value: '"Fair price for great service" - they compare value, not just price',
    budget: '"I need the most affordable option" - price is the primary factor'
  };

  return `You are a value proposition strategist specializing in ${industryProfile.industryName}.

# CUSTOMER INSIGHTS

**Top Decision Factors (what matters most to them):**
${decisionFactors.join(', ')}

**Price Sensitivity:**
${priceSensitivityMap[priceSensitivity]}

**What Customers Love (in their own words):**
"${superpower}"

# COMPETITIVE LANDSCAPE

**Keyword Gaps (what competitors rank for that we could target):**
${keywordGaps}

**Competitor Weaknesses to Exploit:**
${competitorWeaknesses}

# YOUR STRENGTHS

**Proof Points & Credentials:**
${proofPoints}

**Key Differentiators:**
${differentiators}

# INDUSTRY INTELLIGENCE

**Customer Triggers (what makes them buy):**
${customerTriggers}

**High-Converting Language Patterns:**
${powerWords}

# YOUR TASK

Create 3 distinct value propositions, each targeting different customer motivations:

## 1. EMOTIONAL (The Heart)
- Targets feelings, security, peace of mind
- Uses emotional language and transformation
- Makes them FEEL safe/confident/relieved
- Formula: Focus on the emotional outcome, not the service

## 2. LOGICAL (The Brain)
- Appeals to rational decision-makers
- Uses facts, numbers, credentials
- Makes the logical case with proof
- Formula: Credentials + Features + Results

## 3. UNIQUE (The Edge)
- Creates memorable distinction
- Uses "the only" or unique claim
- Makes them remember you vs competitors
- Formula: Unique capability + desired outcome

# IMPORTANT RULES

1. DO NOT mention competitors by name
2. Use the customer's actual language ("${superpower}")
3. Incorporate the decision factors they care about: ${decisionFactors.join(', ')}
4. Match their price sensitivity (${priceSensitivity})
5. Keep each UVP to 1-2 sentences (max 150 characters)
6. Use power words from the industry: ${powerWords.split(', ').slice(0, 5).join(', ')}

# VENN DIAGRAM DATA

Also provide the 3-circle Venn diagram data:
- **What Customers Want**: Top 4-5 things from decision factors and triggers
- **Competitor Gaps**: Top 4-5 weaknesses or missing features
- **Your Strengths**: Top 4-5 proof points and differentiators
- **Intersection**: A 1-sentence summary of the unique position

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no code blocks):

{
  "uvps": {
    "emotional": {
      "text": "The full UVP text (1-2 sentences)",
      "strength": "Why this resonates emotionally (1 sentence)",
      "score": 85
    },
    "logical": {
      "text": "The full UVP text (1-2 sentences)",
      "strength": "Why this works logically (1 sentence)",
      "score": 90
    },
    "unique": {
      "text": "The full UVP text (1-2 sentences)",
      "strength": "Why this creates distinction (1 sentence)",
      "score": 88
    }
  },
  "vennDiagram": {
    "customerWants": ["Item 1", "Item 2", "Item 3", "Item 4"],
    "competitorGaps": ["Gap 1", "Gap 2", "Gap 3", "Gap 4"],
    "yourStrengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
    "intersection": "One sentence describing the unique position at the intersection"
  },
  "keyPhrases": ["Phrase 1", "Phrase 2", "Phrase 3"]
}`;
}

/**
 * Generate UVPs using Claude 3.5 Sonnet
 */
export async function generateUVPs(
  request: UVPGenerationRequest
): Promise<UVPGenerationResponse> {
  console.log('[UVP Generator] Generating value propositions...');

  const prompt = buildUVPPrompt(request);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    console.log('[UVP Generator] Raw AI response:', content);

    // Parse JSON response
    const result = parseUVPResponse(content);

    console.log('[UVP Generator] Generated UVPs successfully');
    return result;
  } catch (error) {
    console.error('[UVP Generator] Error:', error);
    throw new Error('Failed to generate value propositions. Please try again.');
  }
}

/**
 * Parse AI response (handles markdown code blocks)
 */
function parseUVPResponse(content: string): UVPGenerationResponse {
  try {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.uvps || !parsed.vennDiagram) {
      throw new Error('Invalid response structure');
    }

    return {
      uvps: {
        emotional: {
          text: parsed.uvps.emotional.text || '',
          strength: parsed.uvps.emotional.strength || '',
          score: parsed.uvps.emotional.score || 85
        },
        logical: {
          text: parsed.uvps.logical.text || '',
          strength: parsed.uvps.logical.strength || '',
          score: parsed.uvps.logical.score || 85
        },
        unique: {
          text: parsed.uvps.unique.text || '',
          strength: parsed.uvps.unique.strength || '',
          score: parsed.uvps.unique.score || 85
        }
      },
      vennDiagram: {
        customerWants: parsed.vennDiagram.customerWants || [],
        competitorGaps: parsed.vennDiagram.competitorGaps || [],
        yourStrengths: parsed.vennDiagram.yourStrengths || [],
        intersection: parsed.vennDiagram.intersection || ''
      },
      keyPhrases: parsed.keyPhrases || []
    };
  } catch (error) {
    console.error('[UVP Generator] Parse error:', error);
    console.error('[UVP Generator] Content:', content);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

/**
 * Extract key phrases from generated UVPs for content enhancement
 */
export function extractKeyPhrases(uvps: UVPGenerationResponse['uvps']): string[] {
  const phrases: string[] = [];

  // Extract from all three UVPs
  const allText = [uvps.emotional.text, uvps.logical.text, uvps.unique.text].join(' ');

  // Simple phrase extraction (can be enhanced with NLP)
  // Look for phrases with numbers, credentials, or unique claims
  const patterns = [
    /\d+\+?\s+years?/gi,  // "20+ years"
    /proven\s+\w+/gi,      // "proven results"
    /only\s+[^.!?]+/gi,    // "only ... that"
    /affordable\s+\w+/gi,  // "affordable fees"
    /\w+\s+guaranteed?/gi  // "results guaranteed"
  ];

  patterns.forEach(pattern => {
    const matches = allText.match(pattern);
    if (matches) {
      phrases.push(...matches.map(m => m.trim()));
    }
  });

  // Return unique phrases
  return [...new Set(phrases)].slice(0, 10);
}
