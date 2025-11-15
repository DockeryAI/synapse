/**
 * API Billing Tracker Service
 * Tracks API usage and costs across all features and providers
 */

import { supabase } from '@/lib/supabase'

export interface BillingEvent {
  id?: string
  brand_id: string
  api_config_id?: string
  provider: string
  api_name: string
  feature_name: string
  use_case?: string
  request_type: string
  model_used?: string
  tokens_input?: number
  tokens_output?: number
  tokens_total?: number
  request_count: number
  cost_input?: number
  cost_output?: number
  cost_fixed?: number
  cost_total: number
  currency: string
  user_id?: string
  session_id?: string
  request_metadata?: Record<string, any>
  response_time_ms?: number
  status: 'success' | 'error' | 'timeout' | 'rate_limited'
  error_message?: string
  created_at?: string
}

export interface CostByApi {
  provider: string
  api_name: string
  total_requests: number
  total_cost: number
  total_tokens: number
  avg_cost_per_request: number
  percentage_of_total: number
}

export interface CostByFeature {
  feature_name: string
  total_requests: number
  total_cost: number
  api_breakdown: Array<{
    provider: string
    api_name: string
    requests: number
    cost: number
  }>
  percentage_of_total: number
}

export interface CostAggregation {
  period: string // 'day', 'week', 'month'
  start_date: string
  end_date: string
  total_cost: number
  total_requests: number
  total_tokens: number
  by_api: CostByApi[]
  by_feature: CostByFeature[]
}

export interface CostProjection {
  current_month_cost: number
  projected_month_end_cost: number
  days_remaining: number
  average_daily_cost: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
}

export class ApiBillingTracker {
  /**
   * Record a billing event
   */
  static async recordEvent(event: BillingEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('api_billing_events').insert([event])

      if (error) {
        console.error('Error recording billing event:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('Exception recording billing event:', err)
      return { success: false, error: String(err) }
    }
  }

  /**
   * Record a batch of billing events (more efficient)
   */
  static async recordBatch(events: BillingEvent[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('api_billing_events').insert(events)

      if (error) {
        console.error('Error recording billing events:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('Exception recording billing events:', err)
      return { success: false, error: String(err) }
    }
  }

  /**
   * Get cost breakdown by API for a time period
   */
  static async getCostByApi(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostByApi[]> {
    try {
      const { data, error } = await supabase
        .from('api_billing_events')
        .select('provider, api_name, cost_total, request_count, tokens_total')
        .eq('brand_id', brandId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'success')

      if (error) throw error

      // Aggregate by API
      const apiMap = new Map<string, CostByApi>()
      let totalCost = 0

      data?.forEach((event) => {
        const key = `${event.provider}:${event.api_name}`
        const existing = apiMap.get(key) || {
          provider: event.provider,
          api_name: event.api_name,
          total_requests: 0,
          total_cost: 0,
          total_tokens: 0,
          avg_cost_per_request: 0,
          percentage_of_total: 0,
        }

        existing.total_requests += event.request_count || 1
        existing.total_cost += parseFloat(String(event.cost_total)) || 0
        existing.total_tokens += event.tokens_total || 0
        totalCost += parseFloat(String(event.cost_total)) || 0

        apiMap.set(key, existing)
      })

      // Calculate percentages and averages
      const results = Array.from(apiMap.values()).map((api) => ({
        ...api,
        avg_cost_per_request: api.total_requests > 0 ? api.total_cost / api.total_requests : 0,
        percentage_of_total: totalCost > 0 ? (api.total_cost / totalCost) * 100 : 0,
      }))

      return results.sort((a, b) => b.total_cost - a.total_cost)
    } catch (err) {
      console.error('Error getting cost by API:', err)
      return []
    }
  }

  /**
   * Get cost breakdown by feature/use case
   */
  static async getCostByFeature(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostByFeature[]> {
    try {
      const { data, error } = await supabase
        .from('api_billing_events')
        .select('feature_name, provider, api_name, cost_total, request_count')
        .eq('brand_id', brandId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'success')

      if (error) throw error

      // Aggregate by feature
      const featureMap = new Map<string, CostByFeature>()
      let totalCost = 0

      data?.forEach((event) => {
        const existing = featureMap.get(event.feature_name) || {
          feature_name: event.feature_name,
          total_requests: 0,
          total_cost: 0,
          api_breakdown: [],
          percentage_of_total: 0,
        }

        existing.total_requests += event.request_count || 1
        existing.total_cost += parseFloat(String(event.cost_total)) || 0
        totalCost += parseFloat(String(event.cost_total)) || 0

        // Add to API breakdown
        const apiBreakdown = existing.api_breakdown.find(
          (a) => a.provider === event.provider && a.api_name === event.api_name
        )

        if (apiBreakdown) {
          apiBreakdown.requests += event.request_count || 1
          apiBreakdown.cost += parseFloat(String(event.cost_total)) || 0
        } else {
          existing.api_breakdown.push({
            provider: event.provider,
            api_name: event.api_name,
            requests: event.request_count || 1,
            cost: parseFloat(String(event.cost_total)) || 0,
          })
        }

        featureMap.set(event.feature_name, existing)
      })

      // Calculate percentages
      const results = Array.from(featureMap.values()).map((feature) => ({
        ...feature,
        percentage_of_total: totalCost > 0 ? (feature.total_cost / totalCost) * 100 : 0,
        api_breakdown: feature.api_breakdown.sort((a, b) => b.cost - a.cost),
      }))

      return results.sort((a, b) => b.total_cost - a.total_cost)
    } catch (err) {
      console.error('Error getting cost by feature:', err)
      return []
    }
  }

  /**
   * Get cost aggregation for a time period
   */
  static async getCostAggregation(
    brandId: string,
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<CostAggregation> {
    const [byApi, byFeature] = await Promise.all([
      this.getCostByApi(brandId, startDate, endDate),
      this.getCostByFeature(brandId, startDate, endDate),
    ])

    const totalCost = byApi.reduce((sum, api) => sum + api.total_cost, 0)
    const totalRequests = byApi.reduce((sum, api) => sum + api.total_requests, 0)
    const totalTokens = byApi.reduce((sum, api) => sum + api.total_tokens, 0)

    return {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_cost: totalCost,
      total_requests: totalRequests,
      total_tokens: totalTokens,
      by_api: byApi,
      by_feature: byFeature,
    }
  }

  /**
   * Get cost projection for current month
   */
  static async getCostProjection(brandId: string): Promise<CostProjection> {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysInMonth = monthEnd.getDate()
      const currentDay = now.getDate()
      const daysRemaining = daysInMonth - currentDay

      // Get current month's cost
      const { data, error } = await supabase
        .from('api_billing_events')
        .select('cost_total, created_at')
        .eq('brand_id', brandId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', now.toISOString())
        .eq('status', 'success')

      if (error) throw error

      const currentMonthCost = data?.reduce(
        (sum, event) => sum + (parseFloat(String(event.cost_total)) || 0),
        0
      ) || 0

      const averageDailyCost = currentDay > 0 ? currentMonthCost / currentDay : 0
      const projectedMonthEndCost = averageDailyCost * daysInMonth

      // Calculate trend (compare to previous week)
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: recentData } = await supabase
        .from('api_billing_events')
        .select('cost_total')
        .eq('brand_id', brandId)
        .gte('created_at', weekAgo.toISOString())
        .lte('created_at', now.toISOString())
        .eq('status', 'success')

      const recentCost = recentData?.reduce(
        (sum, event) => sum + (parseFloat(String(event.cost_total)) || 0),
        0
      ) || 0

      const recentDailyCost = recentCost / 7

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (recentDailyCost > averageDailyCost * 1.1) trend = 'increasing'
      else if (recentDailyCost < averageDailyCost * 0.9) trend = 'decreasing'

      // Confidence based on how much data we have
      const confidence = Math.min(currentDay / daysInMonth, 1)

      return {
        current_month_cost: currentMonthCost,
        projected_month_end_cost: projectedMonthEndCost,
        days_remaining: daysRemaining,
        average_daily_cost: averageDailyCost,
        trend,
        confidence,
      }
    } catch (err) {
      console.error('Error getting cost projection:', err)
      return {
        current_month_cost: 0,
        projected_month_end_cost: 0,
        days_remaining: 0,
        average_daily_cost: 0,
        trend: 'stable',
        confidence: 0,
      }
    }
  }

  /**
   * Get daily cost trend for charting
   */
  static async getDailyCostTrend(
    brandId: string,
    days: number = 30
  ): Promise<Array<{ date: string; cost: number; requests: number }>> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('api_billing_events')
        .select('created_at, cost_total, request_count')
        .eq('brand_id', brandId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'success')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Aggregate by day
      const dailyMap = new Map<string, { cost: number; requests: number }>()

      data?.forEach((event) => {
        const date = new Date(event.created_at).toISOString().split('T')[0]
        const existing = dailyMap.get(date) || { cost: 0, requests: 0 }

        existing.cost += parseFloat(String(event.cost_total)) || 0
        existing.requests += event.request_count || 1

        dailyMap.set(date, existing)
      })

      // Fill in missing days with 0
      const result: Array<{ date: string; cost: number; requests: number }> = []
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        const data = dailyMap.get(dateStr) || { cost: 0, requests: 0 }

        result.push({
          date: dateStr,
          cost: data.cost,
          requests: data.requests,
        })
      }

      return result
    } catch (err) {
      console.error('Error getting daily cost trend:', err)
      return []
    }
  }

  /**
   * Get total cost for current month
   */
  static async getCurrentMonthCost(brandId: string): Promise<number> {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data, error } = await supabase
        .from('api_billing_events')
        .select('cost_total')
        .eq('brand_id', brandId)
        .gte('created_at', monthStart.toISOString())
        .eq('status', 'success')

      if (error) throw error

      return data?.reduce((sum, event) => sum + (parseFloat(String(event.cost_total)) || 0), 0) || 0
    } catch (err) {
      console.error('Error getting current month cost:', err)
      return 0
    }
  }

  /**
   * Get feature usage stats (e.g., how many times Synapse was used)
   */
  static async getFeatureUsageStats(
    brandId: string,
    featureName: string,
    days: number = 30
  ): Promise<{
    total_uses: number
    total_cost: number
    avg_cost_per_use: number
    api_breakdown: Array<{ provider: string; api_name: string; cost: number; uses: number }>
  }> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('api_billing_events')
        .select('provider, api_name, cost_total, request_count')
        .eq('brand_id', brandId)
        .eq('feature_name', featureName)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'success')

      if (error) throw error

      const totalUses = data?.length || 0
      const totalCost = data?.reduce(
        (sum, event) => sum + (parseFloat(String(event.cost_total)) || 0),
        0
      ) || 0

      // Aggregate by API
      const apiMap = new Map<string, { cost: number; uses: number }>()

      data?.forEach((event) => {
        const key = `${event.provider}:${event.api_name}`
        const existing = apiMap.get(key) || { cost: 0, uses: 0 }

        existing.cost += parseFloat(String(event.cost_total)) || 0
        existing.uses += 1

        apiMap.set(key, existing)
      })

      const apiBreakdown = Array.from(apiMap.entries()).map(([key, value]) => {
        const [provider, api_name] = key.split(':')
        return {
          provider,
          api_name,
          cost: value.cost,
          uses: value.uses,
        }
      })

      return {
        total_uses: totalUses,
        total_cost: totalCost,
        avg_cost_per_use: totalUses > 0 ? totalCost / totalUses : 0,
        api_breakdown: apiBreakdown.sort((a, b) => b.cost - a.cost),
      }
    } catch (err) {
      console.error('Error getting feature usage stats:', err)
      return {
        total_uses: 0,
        total_cost: 0,
        avg_cost_per_use: 0,
        api_breakdown: [],
      }
    }
  }
}
