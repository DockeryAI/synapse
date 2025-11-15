import { MarbsContext } from '@/types/marbs.types'

/**
 * Context Awareness Service
 * Detects current section, URL, data context, and user intent
 */

interface PageContext {
  url: string
  pathname: string
  search: string
  hash: string
}

interface DataContext {
  brandId?: string
  sectionId?: string
  contentId?: string
  [key: string]: any
}

export class ContextAwarenessService {
  /**
   * Detect current context from URL and page state
   */
  static detectContext(
    pageContext?: PageContext,
    dataContext?: DataContext
  ): MarbsContext {
    const pathname = pageContext?.pathname || window.location.pathname
    const hash = pageContext?.hash || window.location.hash

    // Parse section from pathname
    const pathParts = pathname.split('/').filter(Boolean)
    const currentSection = this.detectSection(pathParts)
    const currentSubsection = this.detectSubsection(pathParts, hash)

    // Gather relevant data based on section
    const relevantData = this.gatherRelevantData(currentSection, dataContext)

    // Detect user intent from context
    const userIntent = this.detectUserIntent(currentSection, relevantData)

    return {
      current_section: currentSection,
      current_subsection: currentSubsection,
      current_page: pathname,
      page_data: dataContext,
      user_intent: userIntent,
      relevant_data: relevantData,
    }
  }

  /**
   * Detect section from pathname
   */
  private static detectSection(pathParts: string[]): string {
    if (pathParts.length === 0) return 'home'

    const firstPart = pathParts[0].toLowerCase()

    // Map paths to sections
    const sectionMap: Record<string, string> = {
      mirror: 'mirror',
      situation: 'mirror_situation',
      objectives: 'mirror_objectives',
      strategy: 'mirror_strategy',
      tactics: 'mirror_tactics',
      action: 'mirror_action',
      control: 'mirror_control',
      calendar: 'content_calendar',
      content: 'content_calendar',
      analytics: 'analytics',
      settings: 'settings',
      intelligence: 'intelligence',
      opportunities: 'opportunities',
    }

    return sectionMap[firstPart] || 'unknown'
  }

  /**
   * Detect subsection from pathname and hash
   */
  private static detectSubsection(
    pathParts: string[],
    hash: string
  ): string | undefined {
    if (pathParts.length > 1) {
      return pathParts[1]
    }

    if (hash) {
      // Remove leading # from hash
      return hash.substring(1)
    }

    return undefined
  }

  /**
   * Gather relevant data based on current section
   */
  private static gatherRelevantData(
    section: string,
    dataContext?: DataContext
  ): Record<string, any> {
    const data: Record<string, any> = {}

    if (!dataContext) return data

    // Section-specific data gathering
    switch (section) {
      case 'mirror_situation':
      case 'mirror_objectives':
      case 'mirror_strategy':
      case 'mirror_tactics':
      case 'mirror_action':
      case 'mirror_control':
        data.brand_id = dataContext.brandId
        data.section_data = dataContext.sectionData
        break

      case 'content_calendar':
        data.brand_id = dataContext.brandId
        data.calendar_items = dataContext.calendarItems
        data.filters = dataContext.filters
        break

      case 'analytics':
        data.brand_id = dataContext.brandId
        data.metrics = dataContext.metrics
        data.date_range = dataContext.dateRange
        break

      case 'intelligence':
      case 'opportunities':
        data.brand_id = dataContext.brandId
        data.opportunities = dataContext.opportunities
        data.insights = dataContext.insights
        break

      default:
        data.brand_id = dataContext.brandId
    }

    return data
  }

  /**
   * Detect user intent from context
   */
  private static detectUserIntent(
    section: string,
    relevantData: Record<string, any>
  ): string | undefined {
    // Infer intent based on section and data
    switch (section) {
      case 'mirror_situation':
        return 'analyze_brand_situation'
      case 'mirror_objectives':
        return 'define_objectives'
      case 'mirror_strategy':
        return 'develop_strategy'
      case 'mirror_tactics':
        return 'plan_tactics'
      case 'mirror_action':
        return 'create_action_plan'
      case 'mirror_control':
        return 'setup_tracking'
      case 'content_calendar':
        return relevantData.filters ? 'browse_content' : 'create_content'
      case 'analytics':
        return 'review_performance'
      case 'intelligence':
      case 'opportunities':
        return 'discover_opportunities'
      default:
        return undefined
    }
  }

  /**
   * Get capabilities available for current context
   */
  static getAvailableCapabilities(context: MarbsContext): string[] {
    const section = context.current_section

    const capabilitiesMap: Record<string, string[]> = {
      mirror_situation: [
        'analyze_brand_health',
        'identify_gaps',
        'suggest_improvements',
      ],
      mirror_objectives: [
        'suggest_objectives',
        'validate_objectives',
        'prioritize_objectives',
      ],
      mirror_strategy: [
        'analyze_competitors',
        'suggest_positioning',
        'identify_differentiation',
      ],
      mirror_tactics: ['suggest_tactics', 'optimize_channels', 'plan_campaigns'],
      mirror_action: [
        'create_action_items',
        'assign_tasks',
        'set_timelines',
      ],
      mirror_control: [
        'suggest_kpis',
        'setup_tracking',
        'configure_alerts',
      ],
      content_calendar: [
        'generate_content_ideas',
        'create_content',
        'schedule_posts',
        'optimize_content',
      ],
      analytics: [
        'analyze_metrics',
        'identify_trends',
        'suggest_optimizations',
      ],
      intelligence: [
        'discover_opportunities',
        'analyze_competitors',
        'identify_trends',
      ],
    }

    return capabilitiesMap[section || ''] || []
  }

  /**
   * Format context for AI prompt
   */
  static formatContextForPrompt(context: MarbsContext): string {
    const lines: string[] = []

    if (context.current_section) {
      lines.push(`Section: ${context.current_section}`)
    }

    if (context.current_subsection) {
      lines.push(`Subsection: ${context.current_subsection}`)
    }

    if (context.user_intent) {
      lines.push(`User intent: ${context.user_intent}`)
    }

    if (context.relevant_data && Object.keys(context.relevant_data).length > 0) {
      lines.push(
        `Available data: ${Object.keys(context.relevant_data).join(', ')}`
      )
    }

    return lines.join('\n')
  }
}
