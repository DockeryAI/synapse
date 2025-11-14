/**
 * OpenAI API Integration
 * Content generation and optimization
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

class OpenAIAPIService {
  async generateHeadline(prompt: string, tone: string = 'professional'): Promise<string[]> {
    if (!OPENAI_API_KEY) {
      return [
        `${prompt} - Transform Your Business`,
        `Discover the Power of ${prompt}`,
        `${prompt}: The Complete Solution`
      ]
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
    if (!OPENAI_API_KEY) {
      return `${prompt} - Learn more about how we can help you achieve your goals.`
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
