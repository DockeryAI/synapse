/**
 * UI Levels Types for Dashboard V2
 * Progressive disclosure interface with 3 complexity levels
 */

export type UILevel = 'simple' | 'custom' | 'power';

export type UserExpertiseLevel = 'beginner' | 'intermediate' | 'expert';

export interface UserExpertiseProfile {
  id: string;
  userId: string;
  currentLevel: UILevel;
  expertiseLevel: UserExpertiseLevel;
  usageStats: UsageStats;
  levelHistory: LevelHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  totalCampaigns: number;
  totalPiecesEdited: number;
  advancedFeaturesUsed: number;
  daysActive: number;
  lastActiveDate: string;
  preferredLevel: UILevel;
  levelSwitchCount: number;
}

export interface LevelHistoryEntry {
  level: UILevel;
  switchedAt: string;
  reason: 'auto' | 'manual' | 'hint';
  duration: number; // seconds spent at this level
}

export interface UILevelConfig {
  level: UILevel;
  displayName: string;
  description: string;
  features: UILevelFeatures;
  onboardingTips: OnboardingTip[];
  upgradeHints: UpgradeHint[];
  requiredExpertise: UserExpertiseLevel;
}

export interface UILevelFeatures {
  // Simple mode features
  aiSuggestions: boolean;
  oneClickGeneration: boolean;
  quickEdit: boolean;

  // Custom mode features
  inlineEditing: boolean;
  dragDropReordering: boolean;
  emotionalTriggerSelection: boolean;
  timelineVisualization: boolean;
  platformSelection: boolean;

  // Power mode features
  manualPhaseCreation: boolean;
  connectionBuilder: boolean;
  customEmotionalProgression: boolean;
  advancedScheduling: boolean;
  competitiveInsights: boolean;
  breakthroughScoreTuning: boolean;
  fullArcEditor: boolean;
  eqTriggerMatrix: boolean;
}

export interface OnboardingTip {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  order: number;
  completed: boolean;
}

export interface UpgradeHint {
  id: string;
  title: string;
  description: string;
  triggerCondition: HintTriggerCondition;
  targetLevel: UILevel;
  shown: boolean;
  dismissedAt?: string;
}

export interface HintTriggerCondition {
  type: 'usage_count' | 'feature_attempt' | 'time_based' | 'performance';
  threshold: number;
  metric: string;
}

export interface ProgressiveDisclosureSettings {
  autoDetectLevel: boolean;
  allowManualSwitch: boolean;
  showUpgradeHints: boolean;
  showOnboardingTips: boolean;
  rememberPreference: boolean;
  hintDismissalDuration: number; // days before showing hint again
}

export interface SimpleModeConfig {
  maxSuggestedCampaigns: number;
  showPreviewCards: boolean;
  allowQuickEdit: boolean;
  editableFields: SimpleModeEditableField[];
}

export type SimpleModeEditableField = 'title' | 'startDate' | 'endDate' | 'targetAudience';

export interface CustomModeConfig {
  enableDragDrop: boolean;
  showTimeline: boolean;
  enableInlineEdit: boolean;
  showEmotionalTriggers: boolean;
  realtimePreview: boolean;
  maxEditablePieces: number;
}

export interface PowerModeConfig {
  showAllControls: boolean;
  enableManualConnections: boolean;
  showCompetitiveData: boolean;
  enableBreakthroughTuning: boolean;
  showAdvancedAnalytics: boolean;
  maxCustomPhases: number;
}

export interface UILevelTransition {
  fromLevel: UILevel;
  toLevel: UILevel;
  trigger: 'auto' | 'manual' | 'hint';
  timestamp: string;
  userConfirmed: boolean;
}

export interface CampaignSuggestion {
  id: string;
  campaignName: string;
  purpose: string;
  description: string;
  previewText: string;
  estimatedDuration: number; // days
  estimatedPieces: number;
  confidenceScore: number;
  source: 'opportunity_radar' | 'competitive_analysis' | 'seasonal' | 'ai_generated';
  metadata: CampaignSuggestionMetadata;
}

export interface CampaignSuggestionMetadata {
  emotionalTriggers: string[];
  targetChannels: string[];
  keyThemes: string[];
  opportunityScore?: number;
  competitiveAdvantage?: string;
  seasonalRelevance?: number;
}

export interface QuickEditModalData {
  campaignId?: string;
  suggestionId?: string;
  editableFields: {
    title: string;
    startDate: string;
    endDate?: string;
    targetAudience?: string;
  };
}

export interface TimelineReorderEvent {
  pieceId: string;
  oldIndex: number;
  newIndex: number;
  oldDate: string;
  newDate: string;
}

export interface EmotionalTriggerAdjustment {
  pieceId: string;
  oldTrigger: string;
  newTrigger: string;
  intensity?: number; // 0-100
  reason?: string;
}

export interface ConnectionBuilderNode {
  id: string;
  type: 'piece' | 'phase' | 'milestone';
  label: string;
  position: { x: number; y: number };
  data: any;
}

export interface ConnectionBuilderEdge {
  id: string;
  source: string;
  target: string;
  type: 'causal' | 'sequential' | 'conditional';
  label?: string;
  strength?: number; // 0-100
}

export interface UILevelAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month';
  levelUsage: Record<UILevel, number>; // time spent in seconds
  featureUsage: Record<string, number>;
  campaignsCreated: Record<UILevel, number>;
  averageSessionDuration: number;
  levelSatisfactionScore?: number;
}
