/**
 * AI Commands Module - Exports
 *
 * Natural language command parsing and execution for Synapse AI Assistant.
 * Transforms chat into full command center - AI executes actions.
 */

// Services
export { CommandParser, createCommandParser } from './CommandParser';
export { TopicExplorerService, createTopicExplorer } from './TopicExplorerService';
export { CampaignIdeaService, createCampaignIdeaService } from './CampaignIdeaService';
export {
  ProactiveSuggestionsService,
  createProactiveSuggestions,
} from './ProactiveSuggestionsService';
export { VisualUnderstandingService, createVisualUnderstanding } from './VisualUnderstandingService';

// Re-export types for convenience
export type {
  // Command parsing
  ParsedCommand,
  CommandIntent,
  CommandParameters,
  CommandAction,
  CommandExecutionResult,
  // Topic exploration
  TopicExplorationRequest,
  TopicExplorationResult,
  TopicResult,
  ContentIdea,
  // Campaign ideas
  CampaignIdeaRequest,
  CampaignIdeaResult,
  CampaignIdea,
  CampaignPost,
  // Proactive suggestions
  ProactiveSuggestion,
  SuggestionTrigger,
  SuggestionAction,
  ProactiveSuggestionsConfig,
  // Visual understanding
  VisualAnalysisRequest,
  VisualAnalysisResult,
  // Interfaces
  ICommandParser,
  ITopicExplorer,
  ICampaignIdeaService,
  IProactiveSuggestions,
  IVisualUnderstanding,
  ServiceResponse,
} from '../../../types/ai-commands.types';
