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
 */

export { OnboardingFlow } from './OnboardingFlow';
export type { DetectedBusinessData } from './OnboardingFlow';

export { PathSelector } from './PathSelector';
export type { ContentPath } from './PathSelector';

export { SinglePostTypeSelector } from './SinglePostTypeSelector';
export type { PostType } from './SinglePostTypeSelector';

export { CustomerStoryInputModal } from './CustomerStoryInputModal';

export { ContentPreview } from './ContentPreview';
