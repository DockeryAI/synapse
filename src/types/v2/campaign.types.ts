/**
 * Campaign Types for Dashboard V2
 * Data models for campaign mode functionality
 */

export type CampaignMode = 'content' | 'campaign';

export type CampaignPurpose =
  | 'product_launch'
  | 'seasonal_push'
  | 'problem_education'
  | 'competitive_disruption'
  | 'trust_building'
  | 'authority_establishment'
  | 'conversion_optimization'
  | 'conversion'
  | 'nurture'
  | 'brand_story'
  | 'launch'
  | 'promotion'
  | 'authority'
  | 'education'
  | 'trust'
  | 'engagement'
  | 'general';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';

export type EmotionalTrigger =
  | 'fear'
  | 'trust'
  | 'security'
  | 'efficiency'
  | 'growth'
  | 'innovation'
  | 'safety'
  | 'hope'
  | 'opportunity'
  | 'urgency'
  | 'curiosity'
  | 'authority'
  | 'desire'
  | 'frustration'
  | 'pride'
  | 'belonging'
  | 'acknowledgment'
  | 'clarity'
  | 'confidence'
  | 'excitement'
  | 'inspiration'
  | 'resolution'
  | 'respect'
  | 'satisfaction'
  | 'triumph'
  | 'understanding';

export interface CampaignArc {
  id: string;
  name: string;
  description: string;
  phases: CampaignPhase[];
  totalDuration: number; // in days
  emotionalProgression: EmotionalTrigger[];
  totalPieces?: number;
  completedPieces?: number;
}

export interface CampaignPhase {
  id: string;
  name: string;
  dayNumber: number;
  emotionalTrigger: EmotionalTrigger;
  objective: string;
  contentType: string;
}

export interface CampaignPiece {
  id: string;
  campaignId: string;
  phaseId: string;
  title: string;
  content: string;
  emotionalTrigger: EmotionalTrigger;
  scheduledDate: string;
  status: 'pending' | 'generated' | 'published';
  channel: string;
  order: number;
  templateId?: string;
  performancePrediction?: PerformancePrediction;
}

export interface PerformancePrediction {
  expectedCTR: number;
  expectedEngagement: number;
  expectedConversion: number;
  confidenceScore: number;
  factors: string[];
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  purpose: CampaignPurpose;
  status: CampaignStatus;
  templateId: string;
  arc: CampaignArc;
  pieces: CampaignPiece[];
  startDate: string;
  endDate: string;
  targetAudience?: string;
  industryCustomization?: IndustryCustomization;
  performancePrediction?: CampaignPerformancePrediction;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryCustomization {
  industryCode: string;
  emotionalWeights: Record<EmotionalTrigger, number>;
  languageOverrides: Record<string, string>;
  complianceNotes?: string[];
}

export interface CampaignPerformancePrediction {
  expectedROI: number;
  expectedConversionRate: number;
  expectedEngagementRate: number;
  timelineScore: number;
  narrativeContinuityScore: number;
  industryBenchmark: {
    avgROI: number;
    avgConversion: number;
    avgEngagement: number;
  };
}

export interface CampaignCreateInput {
  brandId: string;
  name: string;
  purpose: CampaignPurpose;
  templateId: string;
  startDate: string;
  targetAudience?: string;
  industryCode?: string;
}

export interface CampaignUpdateInput {
  name?: string;
  status?: CampaignStatus;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
}

export interface CampaignPieceUpdateInput {
  title?: string;
  content?: string;
  scheduledDate?: string;
  status?: CampaignPiece['status'];
  channel?: string;
}
