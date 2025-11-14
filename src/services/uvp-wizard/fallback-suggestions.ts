/**
 * Fallback Suggestions for UVP Wizard
 *
 * Provides static suggestions when API is unavailable or fails
 */

import { DraggableSuggestion, SuggestionType } from '@/types/uvp-wizard'

export class FallbackSuggestions {
  static generateCustomerSegments(): DraggableSuggestion[] {
    const suggestions = [
      "Small business owners looking to scale their operations efficiently",
      "Enterprise companies seeking digital transformation solutions",
      "Startups needing cost-effective growth strategies",
      "Marketing teams wanting better analytics and insights",
      "Tech-savvy professionals seeking productivity tools"
    ]

    return suggestions.map((content, index) => ({
      id: `customer-fallback-${Date.now()}-${index}`,
      content,
      type: 'customer-segment' as SuggestionType,
      source: 'fallback',
      confidence: 0.8,
      is_selected: false,
      is_customizable: true,
    }))
  }

  static generateCustomerProblems(): DraggableSuggestion[] {
    const suggestions = [
      "Struggling to manage multiple tools and platforms inefficiently",
      "Lacking visibility into key performance metrics",
      "Spending too much time on repetitive manual tasks",
      "Difficulty scaling operations while maintaining quality",
      "Unable to make data-driven decisions quickly"
    ]

    return suggestions.map((content, index) => ({
      id: `problem-fallback-${Date.now()}-${index}`,
      content,
      type: 'problem' as SuggestionType,
      source: 'fallback',
      confidence: 0.8,
      is_selected: false,
      is_customizable: true,
    }))
  }

  static generateSolutions(): DraggableSuggestion[] {
    const suggestions = [
      "All-in-one platform that consolidates your workflow",
      "AI-powered automation that handles repetitive tasks",
      "Real-time analytics dashboard with actionable insights",
      "Scalable cloud infrastructure that grows with you",
      "Intuitive interface that requires minimal training"
    ]

    return suggestions.map((content, index) => ({
      id: `solution-fallback-${Date.now()}-${index}`,
      content,
      type: 'solution' as SuggestionType,
      source: 'fallback',
      confidence: 0.8,
      is_selected: false,
      is_customizable: true,
    }))
  }

  static generateKeyBenefits(): DraggableSuggestion[] {
    const suggestions = [
      "Save 10+ hours per week on manual tasks",
      "Increase revenue by 30% within 6 months",
      "Reduce operational costs by 40%",
      "Improve team productivity by 2x",
      "Get actionable insights in real-time"
    ]

    return suggestions.map((content, index) => ({
      id: `benefit-fallback-${Date.now()}-${index}`,
      content,
      type: 'benefit' as SuggestionType,
      source: 'fallback',
      confidence: 0.8,
      is_selected: false,
      is_customizable: true,
    }))
  }

  static generateDifferentiators(): DraggableSuggestion[] {
    const suggestions = [
      "We're the only solution built specifically for your industry",
      "Our AI learns and adapts to your unique business needs",
      "24/7 dedicated support with industry experts",
      "No setup fees or long-term contracts required",
      "Integrates seamlessly with your existing tools"
    ]

    return suggestions.map((content, index) => ({
      id: `differentiator-fallback-${Date.now()}-${index}`,
      content,
      type: 'differentiator' as SuggestionType,
      source: 'fallback',
      confidence: 0.8,
      is_selected: false,
      is_customizable: true,
    }))
  }
}