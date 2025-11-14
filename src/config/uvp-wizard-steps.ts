/**
 * UVP Wizard Step Configuration
 *
 * Defines all wizard steps, their metadata, validation rules, and UI configuration.
 * This centralized configuration makes it easy to add, remove, or reorder steps.
 */

import { WizardStep, WizardStepConfig, UVP } from '@/types/uvp-wizard'

/**
 * Complete wizard step configurations
 */
export const WIZARD_STEP_CONFIGS: Record<WizardStep, WizardStepConfig> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Your UVP Wizard',
    subtitle: 'Build a compelling value proposition in 5 minutes',
    description:
      'This interactive wizard will guide you through creating a powerful Unique Value Proposition that clearly communicates why customers should choose you over competitors.',
    icon: 'Sparkles',
    order: 0,
    field_name: 'target_customer', // Dummy field since welcome doesn't have a specific field
    placeholder: '',
    helper_text: '',
    required: false,
    supports_ai_suggestions: false,
  },

  'target-customer': {
    id: 'target-customer',
    title: 'Who is Your Target Customer?',
    subtitle: 'Define your ideal customer segment',
    description:
      'Be specific about who you serve. Instead of "everyone," describe your ideal customer with details about their demographics, role, challenges, and context.',
    icon: 'Users',
    order: 1,
    field_name: 'target_customer',
    placeholder: 'e.g., Small business owners in the tech industry with 10-50 employees...',
    helper_text:
      'Great target customers are specific and measurable. Include role, industry, company size, or key characteristics.',
    required: true,
    min_length: 10,
    max_length: 500,
    supports_ai_suggestions: true,
    suggestion_prompt:
      'Generate 5 specific target customer segments for this brand based on industry and market analysis',
  },

  'customer-problem': {
    id: 'customer-problem',
    title: 'What Are They REALLY Trying to Achieve?',
    subtitle: 'Uncover the deeper job to be done',
    description:
      'Beyond the surface problem, what transformation are they seeking? What progress are they trying to make in their life? Think emotionally - what do they want to FEEL or BECOME?',
    icon: 'AlertCircle',
    order: 2,
    field_name: 'customer_problem',
    placeholder:
      'e.g., They want to feel proud of their home and confident they\'re building generational wealth for their family...',
    helper_text:
      'Go deeper than features. What emotional or social job are they hiring you to do? What does success really look like in their life?',
    required: true,
    min_length: 10,
    max_length: 1000,
    supports_ai_suggestions: true,
    suggestion_prompt:
      'Generate 5 deep JTBD-focused problems that reveal what customers are REALLY trying to achieve emotionally and socially',
  },

  'unique-solution': {
    id: 'unique-solution',
    title: 'How Do You Solve It Differently?',
    subtitle: 'Your unique solution and what makes it special',
    description:
      'Describe both WHAT you offer and WHY it\'s different. What\'s your unique approach, methodology, or capability that competitors don\'t have?',
    icon: 'Lightbulb',
    order: 3,
    field_name: 'unique_solution',
    placeholder:
      'e.g., AI-powered marketing platform that learns from your data, with proprietary algorithms that predict ROI before you launch campaigns - the only solution built specifically for small teams...',
    helper_text:
      'Combine your solution with what makes it unique. This is both what you do AND why you\'re the best choice.',
    required: true,
    min_length: 10,
    max_length: 800,
    supports_ai_suggestions: true,
    suggestion_prompt:
      'Generate 5 solutions that combine WHAT is offered with WHY it\'s unique and different from competitors',
  },

  'key-benefit': {
    id: 'key-benefit',
    title: 'What\'s the Key Benefit?',
    subtitle: 'The measurable outcome your customers achieve',
    description:
      'What tangible result or benefit do customers get from your solution? Focus on outcomes and measurable improvements.',
    icon: 'TrendingUp',
    order: 4,
    field_name: 'key_benefit',
    placeholder:
      'e.g., Increase marketing ROI by 40% while reducing time spent on reporting by 10 hours per week...',
    helper_text:
      'Quantify the benefit when possible. Time saved, money earned, problems eliminated, etc.',
    required: true,
    min_length: 10,
    max_length: 500,
    supports_ai_suggestions: true,
    suggestion_prompt:
      'Generate 5 measurable benefits customers experience from this type of solution',
  },

  differentiation: {
    id: 'differentiation',
    title: 'What Makes You Different?',
    subtitle: 'Your competitive advantage',
    description:
      'Why should customers choose you over alternatives? What unique capability, approach, or quality sets you apart?',
    icon: 'Zap',
    order: 99, // Move to end - this step is now combined with unique-solution
    field_name: 'differentiation',
    placeholder:
      'e.g., Only platform built specifically for small teams with AI-powered insights and no learning curve...',
    helper_text:
      'Think about what you do differently or better than competitors. Be honest and specific.',
    required: false, // Make optional since it's combined with solution
    min_length: 0,
    max_length: 500,
    supports_ai_suggestions: true,
    suggestion_prompt:
      'Generate 5 ways a company can differentiate itself in this industry from competitors',
    skip: true, // Mark as skipped in the wizard flow
  },

  review: {
    id: 'review',
    title: 'Review Your UVP',
    subtitle: 'See your complete value proposition',
    description:
      'Review all components of your UVP. Make any final adjustments before completing. You can always come back and edit later.',
    icon: 'CheckCircle',
    order: 5,
    field_name: 'target_customer', // Dummy field since review shows all fields
    placeholder: '',
    helper_text: '',
    required: false,
    supports_ai_suggestions: false,
  },

  complete: {
    id: 'complete',
    title: 'UVP Complete!',
    subtitle: 'Your value proposition is ready',
    description:
      'Congratulations! Your UVP has been saved and you can now use it across all MARBA tools. You\'ve unlocked the full framework.',
    icon: 'PartyPopper',
    order: 6,
    field_name: 'target_customer', // Dummy field
    placeholder: '',
    helper_text: '',
    required: false,
    supports_ai_suggestions: false,
  },
}

/**
 * Ordered list of wizard steps
 */
export const WIZARD_STEPS: WizardStep[] = Object.values(WIZARD_STEP_CONFIGS)
  .filter((config) => !(config as any).skip) // Filter out skipped steps
  .sort((a, b) => a.order - b.order)
  .map((config) => config.id)

/**
 * Get configuration for a specific step
 */
export function getStepConfig(step: WizardStep): WizardStepConfig {
  return WIZARD_STEP_CONFIGS[step]
}

/**
 * Get the next step
 */
export function getNextStep(currentStep: WizardStep): WizardStep | null {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep)
  if (currentIndex >= 0 && currentIndex < WIZARD_STEPS.length - 1) {
    return WIZARD_STEPS[currentIndex + 1]
  }
  return null
}

/**
 * Get the previous step
 */
export function getPreviousStep(currentStep: WizardStep): WizardStep | null {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep)
  if (currentIndex > 0) {
    return WIZARD_STEPS[currentIndex - 1]
  }
  return null
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentStep: WizardStep): number {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep)
  return Math.round((currentIndex / WIZARD_STEPS.length) * 100)
}

/**
 * Check if step is completed
 */
export function isStepCompleted(step: WizardStep, uvp: Partial<UVP>): boolean {
  const config = getStepConfig(step)

  if (!config.required) {
    return true
  }

  const fieldValue = uvp[config.field_name]

  if (!fieldValue || typeof fieldValue !== 'string') {
    return false
  }

  if (config.min_length && fieldValue.length < config.min_length) {
    return false
  }

  if (config.max_length && fieldValue.length > config.max_length) {
    return false
  }

  return true
}

/**
 * Get completion status for all steps
 */
export function getCompletionStatus(uvp: Partial<UVP>): Record<WizardStep, boolean> {
  const status: Record<string, boolean> = {}

  WIZARD_STEPS.forEach((step) => {
    status[step] = isStepCompleted(step, uvp)
  })

  return status as Record<WizardStep, boolean>
}

/**
 * Get overall UVP completion percentage
 */
export function getUVPCompletionPercentage(uvp: Partial<UVP>): number {
  const requiredSteps = WIZARD_STEPS.filter(
    (step) => WIZARD_STEP_CONFIGS[step].required
  )
  const completedSteps = requiredSteps.filter((step) => isStepCompleted(step, uvp))

  return Math.round((completedSteps.length / requiredSteps.length) * 100)
}

/**
 * Check if UVP is fully complete
 */
export function isUVPComplete(uvp: Partial<UVP>): boolean {
  const requiredSteps = WIZARD_STEPS.filter(
    (step) => WIZARD_STEP_CONFIGS[step].required
  )

  return requiredSteps.every((step) => isStepCompleted(step, uvp))
}

/**
 * Get validation errors for a step
 */
export function getStepValidationErrors(
  step: WizardStep,
  uvp: Partial<UVP>
): string[] {
  const config = getStepConfig(step)
  const errors: string[] = []

  if (!config.required) {
    return errors
  }

  const fieldValue = uvp[config.field_name]

  if (!fieldValue) {
    errors.push(`${config.title} is required`)
    return errors
  }

  if (typeof fieldValue !== 'string') {
    return errors
  }

  if (config.min_length && fieldValue.length < config.min_length) {
    errors.push(
      `${config.title} must be at least ${config.min_length} characters`
    )
  }

  if (config.max_length && fieldValue.length > config.max_length) {
    errors.push(
      `${config.title} must be no more than ${config.max_length} characters`
    )
  }

  return errors
}

/**
 * Get icon component name for a step
 */
export function getStepIcon(step: WizardStep): string {
  return WIZARD_STEP_CONFIGS[step].icon
}

/**
 * Get human-readable step name
 */
export function getStepName(step: WizardStep): string {
  return WIZARD_STEP_CONFIGS[step].title
}

/**
 * Check if step supports AI suggestions
 */
export function stepSupportsAI(step: WizardStep): boolean {
  return WIZARD_STEP_CONFIGS[step].supports_ai_suggestions
}
