// LLM Service stub
export class LLMService {
  async chat(messages: any[]) {
    return { content: '' }
  }
}

export const llmService = new LLMService()
