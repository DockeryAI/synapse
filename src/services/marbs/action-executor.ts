import { MarbsAction, MarbsActionType, MarbsContext } from '@/types/marbs.types'
import { supabase } from '@/lib/supabase'
import { chat } from '@/lib/openrouter'

/**
 * Action Executor Service
 * Executes actions requested by Marbs (generate content, update data, etc.)
 */

interface ActionResult {
  success: boolean
  result: 'success' | 'failure' | 'partial'
  data?: any
  error?: string
}

export class ActionExecutor {
  /**
   * Execute an action
   */
  static async executeAction(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      switch (action.type) {
        case 'content_generated':
          return await this.generateContent(action, context)

        case 'analysis_run':
          return await this.runAnalysis(action, context)

        case 'data_updated':
          return await this.updateData(action, context)

        case 'task_created':
          return await this.createTask(action, context)

        case 'objective_set':
          return await this.setObjective(action, context)

        case 'calendar_updated':
          return await this.updateCalendar(action, context)

        case 'post_scheduled':
          return await this.schedulePost(action, context)

        case 'analytics_fetched':
          return await this.fetchAnalytics(action, context)

        default:
          return {
            success: false,
            result: 'failure',
            error: `Unknown action type: ${action.type}`,
          }
      }
    } catch (error) {
      console.error('Failed to execute action:', error)
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate content
   */
  private static async generateContent(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const {
        platform,
        contentType,
        topic,
        tone,
        mode = 'marba',
      } = action.data

      const content = await chat([
        { role: 'system', content: 'You are a professional content writer.' },
        { role: 'user', content: `Generate ${contentType} content for ${platform} about ${topic} in a ${tone} tone.` }
      ], { maxTokens: 1000 })

      return {
        success: true,
        result: 'success',
        data: content,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Failed to generate content',
      }
    }
  }

  /**
   * Run analysis
   */
  private static async runAnalysis(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { analysisType, targetData } = action.data

      // Call analyze-mirror edge function
      const { data, error } = await supabase.functions.invoke(
        'analyze-mirror',
        {
          body: {
            analysis_type: analysisType,
            target_data: targetData,
            brand_id: context.relevant_data?.brand_id,
          },
        }
      )

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Analysis failed',
      }
    }
  }

  /**
   * Update data
   */
  private static async updateData(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { table, id, updates } = action.data

      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Update failed',
      }
    }
  }

  /**
   * Create task
   */
  private static async createTask(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { title, description, dueDate, priority } = action.data

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          brand_id: context.relevant_data?.brand_id,
          title,
          description,
          due_date: dueDate,
          priority,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Task creation failed',
      }
    }
  }

  /**
   * Set objective
   */
  private static async setObjective(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { category, title, description, targetValue, timeline } =
        action.data

      const { data, error } = await supabase
        .from('mirror_objectives')
        .insert({
          brand_id: context.relevant_data?.brand_id,
          category,
          title,
          description,
          target_value: targetValue,
          timeline,
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Objective creation failed',
      }
    }
  }

  /**
   * Update calendar
   */
  private static async updateCalendar(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { items } = action.data

      const records = items.map((item: any) => ({
        brand_id: context.relevant_data?.brand_id,
        ...item,
        created_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('content_calendar_items')
        .insert(records)
        .select()

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Calendar update failed',
      }
    }
  }

  /**
   * Schedule post
   */
  private static async schedulePost(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { contentId, scheduledTime, platforms } = action.data

      // Call publish edge function
      const { data, error } = await supabase.functions.invoke(
        'publish-to-platforms',
        {
          body: {
            content_id: contentId,
            scheduled_time: scheduledTime,
            platforms,
            brand_id: context.relevant_data?.brand_id,
          },
        }
      )

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Post scheduling failed',
      }
    }
  }

  /**
   * Fetch analytics
   */
  private static async fetchAnalytics(
    action: MarbsAction,
    context: MarbsContext
  ): Promise<ActionResult> {
    try {
      const { platforms, dateRange } = action.data

      // Call collect-analytics edge function
      const { data, error } = await supabase.functions.invoke(
        'collect-analytics',
        {
          body: {
            platforms,
            date_range: dateRange,
            brand_id: context.relevant_data?.brand_id,
          },
        }
      )

      if (error) throw error

      return {
        success: true,
        result: 'success',
        data,
      }
    } catch (error) {
      return {
        success: false,
        result: 'failure',
        error: error instanceof Error ? error.message : 'Analytics fetch failed',
      }
    }
  }

  /**
   * Get action history for a brand
   */
  static async getActionHistory(
    brandId: string,
    limit: number = 50
  ): Promise<MarbsAction[]> {
    try {
      const { data, error } = await supabase
        .from('marbs_actions')
        .select('*')
        .eq('brand_id', brandId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data as MarbsAction[]
    } catch (error) {
      console.error('Failed to get action history:', error)
      return []
    }
  }
}
