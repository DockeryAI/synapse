/**
 * Command Parser Service
 *
 * Parses natural language commands into executable actions using Claude AI.
 * Transforms conversational input into platform API calls.
 *
 * Command Categories:
 * - Campaign creation: "Create a viral campaign for my bakery"
 * - Content modification: "Make this week's posts more casual"
 * - Topic exploration: "Find trending topics about shoes"
 * - Performance analysis: "Why did this post do well?"
 * - Schedule changes: "Post more in the mornings"
 * - Visual analysis: "Analyze this image"
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ParsedCommand,
  CommandIntent,
  CommandParameters,
  CommandAction,
  CommandExecutionResult,
  ServiceResponse,
  ICommandParser,
} from '../../../types/ai-commands.types';

export class CommandParser implements ICommandParser {
  private anthropic: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Parse natural language command into structured format
   */
  async parse(
    input: string,
    context?: Record<string, any>
  ): Promise<ServiceResponse<ParsedCommand>> {
    const startTime = Date.now();

    try {
      // Use Claude to parse the command
      const systemPrompt = this.buildParsingSystemPrompt(context);
      const userPrompt = this.buildParsingUserPrompt(input);

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Parse Claude's response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const parsed = this.parseClaudeResponse(textContent.text, input);

      return {
        success: true,
        data: parsed,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
          cost: this.calculateCost(response.usage),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse command',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Execute a parsed command
   */
  async execute(command: ParsedCommand): Promise<ServiceResponse<CommandExecutionResult>> {
    const startTime = Date.now();

    try {
      const executedActions: CommandAction[] = [];
      const results: any[] = [];
      const errors: string[] = [];

      // Execute each action
      for (const action of command.actions) {
        try {
          const result = await this.executeAction(action);
          executedActions.push(action);
          results.push(result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${action.type}: ${errorMsg}`);
        }
      }

      const success = errors.length === 0;

      return {
        success,
        data: {
          success,
          command,
          data: results,
          message: this.buildExecutionMessage(command, success, results),
          executedActions,
          errors: errors.length > 0 ? errors : undefined,
          executedAt: new Date(),
        },
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute command',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Prompt Engineering
  // ============================================================================

  /**
   * Build system prompt for command parsing
   */
  private buildParsingSystemPrompt(context?: Record<string, any>): string {
    return `You are a command parser for Synapse, a marketing automation platform for SMBs.

Your job is to parse natural language commands into structured JSON that can be executed.

**Command Categories:**

1. **campaign_creation**: User wants to create a new campaign
   - Examples: "Create a viral campaign for my bakery", "Start a new Instagram campaign", "Launch social proof campaign"
   - Extract: campaign type, target audience, platforms, duration

2. **content_modification**: User wants to change existing content
   - Examples: "Make this week's posts more casual", "Add emojis to all future posts", "Make it funnier"
   - Extract: timeframe, modifications (tone, style, length), content IDs if specific

3. **topic_exploration**: User wants to find content topics or trends
   - Examples: "Find trending topics about shoes", "What should I post about?", "Give me content ideas"
   - Extract: topics, industry, trending preference

4. **performance_analysis**: User wants to understand campaign/post performance
   - Examples: "Why did this post do well?", "Analyze my campaign performance", "What's working?"
   - Extract: post ID, metric, comparison period

5. **schedule_changes**: User wants to modify posting schedule
   - Examples: "Post more in the mornings", "Only post on weekdays", "Increase posting frequency"
   - Extract: timing patterns, frequency changes

6. **visual_analysis**: User wants to analyze an image
   - Examples: "Analyze this image", "What caption should I use?", "Suggest a campaign based on this photo"
   - Extract: image URL/file, analysis goal

7. **general_question**: Not a command, just a question
   - Examples: "How does social proof work?", "What platforms do you support?"

8. **clarification_needed**: Command is ambiguous
   - When parameters are missing or intent is unclear

**Your Response Format (STRICT JSON):**

\`\`\`json
{
  "intent": "campaign_creation|content_modification|topic_exploration|performance_analysis|schedule_changes|visual_analysis|general_question|clarification_needed",
  "confidence": 0.0-1.0,
  "parameters": {
    // Intent-specific parameters
  },
  "requiresConfirmation": true|false,
  "clarificationQuestions": ["Question 1?", "Question 2?"], // Only if clarification needed
  "actions": [
    {
      "type": "create_campaign|modify_content|generate_topics|analyze_performance|update_schedule|analyze_image",
      "description": "Human-readable description of what will happen",
      "endpoint": "/api/campaigns/create", // API endpoint to call
      "payload": {}, // Data to send
      "expectedResult": "What the user should see"
    }
  ]
}
\`\`\`

**Context:**
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

**Important:**
- ALWAYS return valid JSON
- Set confidence based on how clear the command is
- Include clarificationQuestions if ambiguous
- Generate specific, executable actions
- Consider business context when parsing
- Be generous with intent detection - err on the side of taking action`;
  }

  /**
   * Build user prompt for command parsing
   */
  private buildParsingUserPrompt(input: string): string {
    return `Parse this command:

"${input}"

Return structured JSON with intent, confidence, parameters, and actions.`;
  }

  /**
   * Parse Claude's JSON response into ParsedCommand
   */
  private parseClaudeResponse(text: string, originalInput: string): ParsedCommand {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);

    if (!jsonMatch) {
      // Fallback to general question if no valid JSON
      return {
        input: originalInput,
        intent: 'general_question',
        confidence: 0.5,
        parameters: { query: originalInput },
        requiresConfirmation: false,
        actions: [],
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        input: originalInput,
        intent: parsed.intent as CommandIntent,
        confidence: parsed.confidence || 0.8,
        parameters: parsed.parameters || {},
        requiresConfirmation: parsed.requiresConfirmation !== false, // Default true
        clarificationQuestions: parsed.clarificationQuestions,
        actions: parsed.actions || [],
      };
    } catch (error) {
      // JSON parse error - treat as general question
      return {
        input: originalInput,
        intent: 'general_question',
        confidence: 0.5,
        parameters: { query: originalInput },
        requiresConfirmation: false,
        actions: [],
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Action Execution
  // ============================================================================

  /**
   * Execute a single action
   */
  private async executeAction(action: CommandAction): Promise<any> {
    switch (action.type) {
      case 'create_campaign':
        return this.executeCampaignCreation(action);

      case 'modify_content':
        return this.executeContentModification(action);

      case 'generate_topics':
        return this.executeTopicGeneration(action);

      case 'analyze_performance':
        return this.executePerformanceAnalysis(action);

      case 'update_schedule':
        return this.executeScheduleUpdate(action);

      case 'analyze_image':
        return this.executeImageAnalysis(action);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute campaign creation
   */
  private async executeCampaignCreation(action: CommandAction): Promise<any> {
    // In production, this would call the actual campaign creation API
    // For now, return mock success
    console.log('[CommandParser] Creating campaign:', action.payload);

    return {
      campaignId: `camp_${Date.now()}`,
      status: 'created',
      payload: action.payload,
    };
  }

  /**
   * Execute content modification
   */
  private async executeContentModification(action: CommandAction): Promise<any> {
    // In production, this would call the content modification API
    console.log('[CommandParser] Modifying content:', action.payload);

    return {
      modifiedCount: action.payload?.contentIds?.length || 0,
      modifications: action.payload?.modifications,
    };
  }

  /**
   * Execute topic generation
   */
  private async executeTopicGeneration(action: CommandAction): Promise<any> {
    // In production, this would call the topic explorer service
    console.log('[CommandParser] Generating topics:', action.payload);

    return {
      topicCount: action.payload?.topics?.length || 5,
      topics: action.payload?.topics || [],
    };
  }

  /**
   * Execute performance analysis
   */
  private async executePerformanceAnalysis(action: CommandAction): Promise<any> {
    // In production, this would call analytics API
    console.log('[CommandParser] Analyzing performance:', action.payload);

    return {
      postId: action.payload?.postId,
      analysis: 'Performance analysis complete',
    };
  }

  /**
   * Execute schedule update
   */
  private async executeScheduleUpdate(action: CommandAction): Promise<any> {
    // In production, this would call scheduling API
    console.log('[CommandParser] Updating schedule:', action.payload);

    return {
      scheduleUpdated: true,
      newPattern: action.payload?.schedulePattern,
    };
  }

  /**
   * Execute image analysis
   */
  private async executeImageAnalysis(action: CommandAction): Promise<any> {
    // In production, this would call visual understanding service
    console.log('[CommandParser] Analyzing image:', action.payload);

    return {
      imageUrl: action.payload?.imageUrl,
      analysis: 'Image analysis complete',
    };
  }

  // ============================================================================
  // PRIVATE METHODS - Utilities
  // ============================================================================

  /**
   * Build execution result message
   */
  private buildExecutionMessage(
    command: ParsedCommand,
    success: boolean,
    results: any[]
  ): string {
    if (!success) {
      return `Failed to execute command: "${command.input}"`;
    }

    switch (command.intent) {
      case 'campaign_creation':
        return `✅ Campaign created successfully! ${results[0]?.campaignId || ''}`;

      case 'content_modification':
        return `✅ Modified ${results[0]?.modifiedCount || 0} pieces of content`;

      case 'topic_exploration':
        return `✅ Found ${results[0]?.topicCount || 0} trending topics`;

      case 'performance_analysis':
        return `✅ Performance analysis complete`;

      case 'schedule_changes':
        return `✅ Posting schedule updated`;

      case 'visual_analysis':
        return `✅ Image analyzed successfully`;

      default:
        return `✅ Command executed successfully`;
    }
  }

  /**
   * Calculate API cost
   */
  private calculateCost(usage: {
    input_tokens: number;
    output_tokens: number;
  }): number {
    const inputCost = (usage.input_tokens / 1_000_000) * 3.0; // $3 per 1M input tokens
    const outputCost = (usage.output_tokens / 1_000_000) * 15.0; // $15 per 1M output tokens
    return inputCost + outputCost;
  }
}

/**
 * Factory function to create CommandParser instance
 */
export const createCommandParser = (apiKey: string): CommandParser => {
  return new CommandParser(apiKey);
};
