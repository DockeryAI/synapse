/**
 * CAMPAIGN PREVIEW & APPROVAL COMPONENTS
 *
 * Export all components for the campaign preview and approval workflow
 */

export { PlatformTabs } from './PlatformTabs';
export { CampaignPreviewCard } from './CampaignPreviewCard';
export { EditSection } from './EditSection';
export { CampaignPreview } from './CampaignPreview';
export {
  ApprovalModal,
  RejectionModal,
  ApprovalHistory,
  CampaignApprovalService
} from './ApprovalWorkflow';

// Re-export types for convenience
export type {
  SupportedPlatform,
  PreviewMode,
  ContentSection,
  CampaignPreviewData,
  PlatformPreviewContent,
  RegenerationResult,
  RegenerationOptions,
  ApprovalDecision,
  CampaignApprovalRecord,
  PublishRequest,
  PublishResult
} from '@/types/campaign-preview.types';
