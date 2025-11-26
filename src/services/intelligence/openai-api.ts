/**
 * OpenAI API Integration
 * Content generation and optimization
 *
 * SECURITY: All API calls now route through Edge Functions
 * API keys are never exposed to the browser
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

class OpenAIAPIService {
  async generateHeadline(prompt: string, tone: string = 'professional'): Promise<string[]> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return [
        `${prompt} - Transform Your Business`,
        `Discover the Power of ${prompt}`,
        `${prompt}: The Complete Solution`
      ]
    }

    try {
      // Use Edge Function for secure API access (no API keys exposed to browser)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openai',
          model: 'gpt-4',
          messages: [
            { role: 'system', content: `You are a professional copywriter. Generate 5 compelling headlines in a ${tone} tone.` },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200
        })
      })

      const data = await response.json()
      const headlines = data.choices[0].message.content.split('\n').filter((h: string) => h.trim())
      return headlines.slice(0, 5)
    } catch (error) {
      console.error('[OpenAI API] Error:', error)
      return [
        `${prompt} - Transform Your Business`,
        `Discover the Power of ${prompt}`,
        `${prompt}: The Complete Solution`
      ]
    }
  }

  async generateCaption(prompt: string, maxLength: number = 280): Promise<string> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return `${prompt} - Learn more about how we can help you achieve your goals.`
    }

    try {
      // Use Edge Function for secure API access (no API keys exposed to browser)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openai',
          model: 'gpt-4',
          messages: [
            { role: 'system', content: `Generate an engaging social media caption under ${maxLength} characters.` },
            { role: 'user', content: prompt }
          ],
          max_tokens: 100
        })
      })

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('[OpenAI API] Error:', error)
      return `${prompt} - Learn more about how we can help you achieve your goals.`
    }
  }
}

export const OpenAIAPI = new OpenAIAPIService()
