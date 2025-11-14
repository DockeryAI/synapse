/**
 * Edge Function: Analyze Website with AI
 * Uses OpenRouter/Claude to analyze website and customize industry profile
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

interface AnalyzeRequest {
  websiteData: {
    url: string;
    metadata: {
      title: string;
      description: string;
    };
    content: {
      headings: string[];
      paragraphs: string[];
      keywords: string[];
    };
    design: {
      colors: string[];
      fonts: string[];
    };
  };
  genericProfile: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { websiteData, genericProfile } = await req.json() as AnalyzeRequest;

    if (!websiteData || !websiteData.url) {
      return new Response(
        JSON.stringify({ error: 'Website data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-website-ai] Analyzing: ${websiteData.url}`);

    // Build analysis prompt with safety checks
    const safeHeadings = (websiteData.content?.headings || []).slice(0, 10).filter(h => h && h.length < 200);
    const safeParagraphs = (websiteData.content?.paragraphs || []).slice(0, 5).filter(p => p && p.length < 500);
    const safeKeywords = (websiteData.content?.keywords || []).slice(0, 20).filter(k => k && k.length < 50);

    // Limit genericProfile size to prevent prompt overflow
    const limitedProfile = {
      title: genericProfile?.title || 'Unknown',
      uvps: (genericProfile?.full_profile_data?.uvps || []).slice(0, 2),
      emotional_triggers: (genericProfile?.full_profile_data?.emotional_triggers || []).slice(0, 2)
    };

    const prompt = `Analyze this website and customize the industry profile for this brand.

Website: ${websiteData.url || 'Unknown'}
Title: ${(websiteData.metadata?.title || '').substring(0, 200)}
Description: ${(websiteData.metadata?.description || '').substring(0, 300)}

Content Highlights:
${safeHeadings.join('\n')}

${safeParagraphs.join('\n\n')}

Keywords: ${safeKeywords.join(', ')}

Generic Industry Profile:
${JSON.stringify(limitedProfile, null, 2)}

Based on this website content, provide a customized analysis in JSON format:

{
  "brandVoice": "Description of the brand's tone and voice (2-3 sentences)",
  "messagingThemes": ["theme1", "theme2", "theme3"],
  "realUVPs": [
    {
      "uvp": "Unique value proposition",
      "support": "Why this is a UVP based on website content",
      "differentiator": "What makes this different"
    }
  ],
  "customizedEmotionalTriggers": [
    {
      "trigger": "Trigger name",
      "why": "Why this resonates with this brand's audience",
      "applications": ["how to use it"]
    }
  ],
  "actualBrandStory": {
    "origin": "Brand origin story if found",
    "narrative": "Brand narrative"
  },
  "extractedValues": ["value1", "value2", "value3"],
  "targetAudience": "Specific description of who this brand serves"
}

Be specific and base everything on actual website content. No generic advice.`;

    // Call OpenRouter API with timeout
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://marba.app',
          'X-Title': 'MARBA Platform',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[analyze-website-ai] OpenRouter error:', response.status, errorData);

        // Don't throw, return fallback instead
        throw new Error(`OpenRouter returned ${response.status}`);
      }
    } catch (fetchError) {
      console.error('[analyze-website-ai] Fetch error:', fetchError.message);

      // Return fallback data instead of 500 error
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            brandVoice: websiteData.metadata?.description || 'Professional and engaging',
            messagingThemes: safeHeadings.slice(0, 5),
            realUVPs: safeHeadings.slice(0, 3).map((heading, i) => ({
              id: `uvp-${i + 1}`,
              rank: i + 1,
              proposition: heading,
              differentiator: `Unique approach to ${safeKeywords[i] || 'service'}`
            })),
            customizedEmotionalTriggers: [
              { trigger: 'Trust', why: 'Building client relationships', applications: ['testimonials', 'case studies'] },
              { trigger: 'Results', why: 'Proven track record', applications: ['data', 'metrics'] }
            ],
            extractedValues: ['Quality', 'Service', 'Trust'],
            targetAudience: 'General audience',
          },
          metadata: {
            model: MODEL,
            responseTimeMs: Date.now() - startTime,
            fallback: true,
            error: fetchError.message,
          },
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    console.log('[analyze-website-ai] AI response received, length:', responseText.length);
    console.log('[analyze-website-ai] Raw response preview:', responseText.substring(0, 500));

    // Parse JSON from response with multiple strategies
    let customized;
    try {
      // Strategy 1: Try markdown code block with json language
      let jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);

      // Strategy 2: Try markdown code block without language
      if (!jsonMatch) {
        jsonMatch = responseText.match(/```\s*\n([\s\S]*?)\n```/);
      }

      // Strategy 3: Try to find JSON object directly
      if (!jsonMatch) {
        jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      }

      // Strategy 4: Assume entire response is JSON
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;

      console.log('[analyze-website-ai] Attempting to parse JSON, length:', jsonString.length);
      customized = JSON.parse(jsonString.trim());

      // Validate required fields exist
      if (!customized.brandVoice || !customized.messagingThemes) {
        throw new Error('Missing required fields in AI response');
      }

      console.log('[analyze-website-ai] Successfully parsed:', {
        hasUVPs: customized.realUVPs?.length || 0,
        hasTriggers: customized.customizedEmotionalTriggers?.length || 0,
        hasValues: customized.extractedValues?.length || 0,
      });
    } catch (parseError) {
      console.error('[analyze-website-ai] Parse error:', parseError.message);
      console.error('[analyze-website-ai] Response that failed:', responseText.substring(0, 1000));

      // Return fallback with at least some useful data
      customized = {
        brandVoice: websiteData.metadata.description || 'Professional and engaging',
        messagingThemes: websiteData.content.headings.slice(0, 5),
        realUVPs: websiteData.content.headings.slice(0, 3).map((heading, i) => ({
          id: `uvp-${i + 1}`,
          rank: i + 1,
          proposition: heading,
          differentiator: `Unique approach to ${websiteData.content.keywords[i] || 'service'}`
        })),
        customizedEmotionalTriggers: [
          { trigger: 'Trust', why: 'Building client relationships', applications: ['testimonials', 'case studies'] },
          { trigger: 'Results', why: 'Proven track record', applications: ['data', 'metrics'] }
        ],
        extractedValues: ['Quality', 'Service', 'Trust'],
        targetAudience: 'General audience',
      };
    }

    const responseTime = Date.now() - startTime;

    console.log(`[analyze-website-ai] Analysis complete in ${responseTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: customized,
        metadata: {
          model: MODEL,
          responseTimeMs: responseTime,
          tokensUsed: data.usage,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[analyze-website-ai] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
