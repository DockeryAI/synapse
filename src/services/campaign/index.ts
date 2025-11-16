/**
 * Campaign Services Export
 *
 * Central export for all campaign-related services
 */

// Core Services
export { CampaignStateMachine, campaignStateMachine } from './CampaignState';
export { CampaignWorkflowService, campaignWorkflow } from './CampaignWorkflow';
export { CampaignDatabaseService, campaignDB } from './CampaignDB';
export { CampaignOrchestrator, campaignOrchestrator } from './CampaignOrchestrator';
export { CampaignRecommender } from './CampaignRecommender';
export { generateSmartPicks } from './SmartPickGenerator';

// Types
export type {
  CampaignState,
  CampaignType,
  CampaignSession,
  CampaignStateTransition,
  GeneratedCampaignContent,
  PlatformContent,
  CampaignRecord,
  ContentPieceRecord,
  CampaignWorkflowEvent,
  CampaignEventHandler,
  CampaignError,
  WorkflowConfig
} from '@/types/campaign-workflow.types';

export type { SmartPickGenerationOptions, SmartPickGenerationResult } from '@/types/smart-picks.types';
