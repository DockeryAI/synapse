/**
 * V4 Content Engine
 *
 * Single export point for all V4 services.
 *
 * Created: 2025-11-26
 */

// Types
export * from './types';

// Core Services (Phase 1)
export { promptLibrary, PromptLibrary } from './prompt-library';
export { contentScorer, ContentScorer } from './content-scorer';
export { psychologyEngine, PsychologyEngine } from './psychology-engine';
export { contentOrchestrator, ContentOrchestrator } from './content-orchestrator';

// Campaign Intelligence (Phase 2)
export { pillarGenerator, PillarGenerator } from './pillar-generator';
export { contentMixEngine, ContentMixEngine } from './content-mix-engine';
export { funnelTagger, FunnelTagger } from './funnel-tagger';
export { campaignTemplates, CampaignTemplatesService } from './campaign-templates';

// User Modes (Phase 3)
export { easyMode, EasyModeService } from './easy-mode';
export { powerMode, PowerModeService } from './power-mode';
export { contentMixer, ContentMixerService } from './content-mixer';

// Calendar Integration (Phase 4)
export { v4CalendarIntegration } from './calendar-integration';
export type { V4CalendarItem, V4ContentMetadata, SaveToCalendarOptions, BulkSaveResult } from './calendar-integration';

// Intelligence Integration (Phase 7)
export { intelligenceIntegration } from './intelligence-integration';
export type { IntelligenceContext, ContentHistoryItem } from './intelligence-integration';

// Intelligence Populator (Phase 8)
export { intelligencePopulator } from './intelligence-populator';

// Synapse Data Provider (Phase 9 - Auto-inject API data into content)
export { synapseDataProvider } from './synapse-data-provider.service';
export type { SynapseInsightData } from './synapse-data-provider.service';
