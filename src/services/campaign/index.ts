/**
 * Campaign Services Export
 *
 * Central export for all campaign-related services
 */

export { CampaignStateMachine, campaignStateMachine } from './CampaignState';
export { CampaignWorkflowService, campaignWorkflow } from './CampaignWorkflow';
export { CampaignDatabaseService, campaignDB } from './CampaignDB';
export { CampaignOrchestrator, campaignOrchestrator } from './CampaignOrchestrator';

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
