// LLM Service stub
export class LLMService {
  async chat(messages: any[]) {
    return { content: '' }
  }

  async generateCompletion(options: {
    model: string
    prompt: string
    maxTokens: number
    temperature: number
  }): Promise<string> {
    return ''
  }
}

export const llmService = new LLMService()
