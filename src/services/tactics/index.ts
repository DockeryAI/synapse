/**
 * Immediate Win Tactics - Service Exports
 * All tactics services in one convenient import
 */

export { UGCContestService, ugcContestService } from './UGCContestService';
export { HashtagBuilderService, hashtagBuilderService } from './HashtagBuilderService';
export { EmailCaptureService, emailCaptureService } from './EmailCaptureService';
export { SeasonalCalendarService, seasonalCalendarService } from './SeasonalCalendarService';

// Re-export types for convenience
export type {
  UGCContest,
  UGCContestType,
  Prize,
  ContestTemplates,
  ContestTracking,
  HashtagFormula,
  HashtagSet,
  HashtagPerformance,
  HashtagResearch,
  RotationStrategy,
  EmailCapturePage,
  EmailCaptureTemplate,
  LeadMagnet,
  CaptureForm,
  FormField,
  ThankYouPage,
  EmailIntegration,
  CaptureStats,
  SeasonalCalendar,
  Holiday,
  Season,
  LocalEvent,
  SeasonalOpportunity,
  CampaignSuggestion,
  Tactic,
  TacticCategory,
  ExpectedResults,
  TacticActivation,
  ActualResults,
  BusinessContext,
  ServiceResponse,
  GenerationOptions,
} from '../../types/tactics.types';
