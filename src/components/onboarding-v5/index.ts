/**
 * Onboarding V5 Components
 *
 * Complete path selection and content generation flow with SOURCE VERIFICATION.
 *
 * CORE PRINCIPLE: All content must be source-verified. Customer stories require
 * user input or source links. No fabrication. Ever.
 *
 * Flow:
 * 1. OnboardingFlow - Single URL input with progressive detection
 * 2. PathSelector - Choose campaign vs single post
 * 3a. Campaign path → CampaignTypeEngine (source-verified)
 * 3b. Single post path → SinglePostTypeSelector
 * 4. Customer Success Stories → CustomerStoryInputModal (NO FABRICATION)
 * 5. ContentPreview - Display with SOURCE ATTRIBUTION always visible
 * 6. InsightsDashboard - Display extracted business insights
 * 7. SmartSuggestions - AI-generated campaign and post suggestions
 * 8. ScheduleConfirmation - Show scheduling results with analytics
 */

export { OnboardingFlow } from './OnboardingFlow';
export type { DetectedBusinessData } from './OnboardingFlow';

export { PathSelector } from './PathSelector';
export type { ContentPath } from './PathSelector';

export { SinglePostTypeSelector } from './SinglePostTypeSelector';
export type { PostType } from './SinglePostTypeSelector';

export { CustomerStoryInputModal } from './CustomerStoryInputModal';

export { ContentPreview } from './ContentPreview';

export { InsightsDashboard } from './InsightsDashboard';
export type { InsightsDashboardProps } from './InsightsDashboard';

export { SmartSuggestions } from './SmartSuggestions';
export type { SmartSuggestionsProps, CampaignSuggestion, PostSuggestion, SuggestionData } from './SmartSuggestions';

export { ScheduleConfirmation } from './ScheduleConfirmation';
export type { ScheduleConfirmationProps } from './ScheduleConfirmation';
