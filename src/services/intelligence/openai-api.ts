/**
 * OpenAI API Integration
 * Content generation and optimization
 * SECURITY: Uses Edge Function to keep API keys server-side
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Helper function to call OpenAI via Edge Function
 */
async function callAIProxy(messages: Array<{ role: string; content: string }>, max_tokens: number = 200): Promise<any> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      provider: 'openai',
      model: 'gpt-4',
      messages,
      max_tokens
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI Proxy error (${response.status}): ${errorText}`)
  }

  return await response.json()
}

class OpenAIAPIService {
  async generateHeadline(prompt: string, tone: string = 'professional'): Promise<string[]> {
    try {
      const data = await callAIProxy([
        { role: 'system', content: `You are a professional copywriter. Generate 5 compelling headlines in a ${tone} tone.` },
        { role: 'user', content: prompt }
      ], 200)

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
    try {
      const data = await callAIProxy([
        { role: 'system', content: `Generate an engaging social media caption under ${maxLength} characters.` },
        { role: 'user', content: prompt }
      ], 100)

      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('[OpenAI API] Error:', error)
      return `${prompt} - Learn more about how we can help you achieve your goals.`
    }
  }
}

export const OpenAIAPI = new OpenAIAPIService()
