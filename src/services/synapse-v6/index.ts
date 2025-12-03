// PRD Feature: SYNAPSE-V6
/**
 * Synapse V6 Module Index
 *
 * Exports all V6 services for clean imports throughout the app.
 * This is the main entry point for V6 functionality.
 */

// Brand Profile Management
export {
  type BusinessProfileType,
  type InsightTab,
  type TabApiPriorities,
  type BrandProfile,
  detectProfileType,
  getOrCreateBrandProfile,
  updateIndustryMatch,
  getTabApis,
  brandProfileService,
} from './brand-profile.service';

// UVP Context Building
export {
  type UVPQueryContext,
  buildUVPContext,
  buildTabQuery,
  formatContextForPrompt,
  getQueryDepth,
  uvpContextBuilder,
} from './uvp-context-builder.service';

// Industry Booster (Optional)
export {
  type IndustryProfile,
  type IndustryBooster,
  matchIndustryProfile,
  applyBoosterToContext,
  getIndustryQueryModifiers,
  industryBooster,
} from './industry-booster.service';

// API Orchestration
export {
  type ApiResult,
  type TabData,
  type OrchestratorEvent,
  ApiOrchestrator,
  apiOrchestrator,
} from './api-orchestrator.service';

// Tab Data Adapter
export {
  adaptTabToInsights,
  tabDataAdapter,
} from './tab-data-adapter.service';

// Connection Discovery
export {
  type V6ConnectionResult,
  type BreakthroughConnection,
  V6ConnectionService,
  v6ConnectionService,
} from './v6-connection-service';

// Content Pipeline
export {
  type V6ContentPiece,
  type V6ContentVariant,
  type ContentType,
  type ContentGenerationOptions,
  V6ContentPipeline,
  v6ContentPipeline,
} from './v6-content-pipeline.service';

// Re-export V1 connection types for convenience
export type { DataPoint, DataSource, DataPointType, Connection } from '@/types/connections.types';
