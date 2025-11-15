/**
 * Reflect Dashboard Service
 * Review outcomes, analyze results, and feed insights back into the MIRROR cycle
 * Part of the MIRROR Framework - Reflect Phase
 */

export interface KPIMetric {
  id: string
  name: string
  category: 'engagement' | 'reach' | 'conversion' | 'revenue' | 'retention' | 'awareness'
  current_value: number
  target_value: number
  previous_value: number
  unit: string
  change_percentage: number
  change_direction: 'up' | 'down' | 'stable'
  trend: 'improving' | 'declining' | 'stable'
  status: 'exceeding' | 'on_track' | 'at_risk' | 'critical'
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  last_updated: string
}

export interface PerformanceInsight {
  id: string
  title: string
  description: string
  type: 'success' | 'warning' | 'opportunity' | 'concern'
  impact: 'high' | 'medium' | 'low'
  related_kpis: string[]
  recommended_actions: string[]
  confidence_score: number
  discovered_at: string
}

export interface ChannelPerformance {
  channel: string
  metrics: {
    impressions: number
    engagement_rate: number
    conversion_rate: number
    roi: number
    cost_per_acquisition: number
  }
  trend: 'up' | 'down' | 'stable'
  performance_score: number
  top_content: Array<{
    id: string
    title: string
    performance_score: number
  }>
}

export interface CampaignPerformance {
  campaign_id: string
  campaign_name: string
  status: 'active' | 'completed' | 'paused'
  start_date: string
  end_date?: string
  budget_spent: number
  budget_remaining: number
  kpis: Record<string, number>
  roi: number
  performance_vs_target: number
  key_learnings: string[]
}

export interface ReflectionReport {
  period: string
  overall_score: number
  kpi_summary: {
    total_kpis: number
    exceeding: number
    on_track: number
    at_risk: number
    critical: number
  }
  top_wins: PerformanceInsight[]
  top_concerns: PerformanceInsight[]
  channel_performance: ChannelPerformance[]
  campaign_performance: CampaignPerformance[]
  strategic_recommendations: string[]
  next_cycle_priorities: string[]
}

export class ReflectDashboard {
  /**
   * Calculate KPI status based on performance
   */
  static calculateKPIStatus(
    current: number,
    target: number,
    previous: number
  ): {
    status: KPIMetric['status']
    trend: KPIMetric['trend']
    changePercentage: number
    changeDirection: KPIMetric['change_direction']
  } {
    const changePercentage = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const progressToTarget = target > 0 ? (current / target) * 100 : 100

    let status: KPIMetric['status']
    if (progressToTarget >= 100) status = 'exceeding'
    else if (progressToTarget >= 80) status = 'on_track'
    else if (progressToTarget >= 60) status = 'at_risk'
    else status = 'critical'

    let trend: KPIMetric['trend']
    if (changePercentage > 5) trend = 'improving'
    else if (changePercentage < -5) trend = 'declining'
    else trend = 'stable'

    let changeDirection: KPIMetric['change_direction']
    if (changePercentage > 0) changeDirection = 'up'
    else if (changePercentage < 0) changeDirection = 'down'
    else changeDirection = 'stable'

    return { status, trend, changePercentage, changeDirection }
  }

  /**
   * Generate KPI metrics from objectives
   */
  static generateKPIMetrics(objectives: any[]): KPIMetric[] {
    const kpis: KPIMetric[] = []

    objectives.forEach((objective) => {
      const category = this.mapCategoryToKPI(objective.category)
      const { status, trend, changePercentage, changeDirection } = this.calculateKPIStatus(
        objective.current_value,
        objective.target_value,
        objective.current_value * 0.9 // Simulate previous value
      )

      kpis.push({
        id: `kpi-${objective.id}`,
        name: objective.title,
        category,
        current_value: objective.current_value,
        target_value: objective.target_value,
        previous_value: objective.current_value * 0.9,
        unit: objective.unit || '',
        change_percentage: changePercentage,
        change_direction: changeDirection,
        trend,
        status,
        period: 'monthly',
        last_updated: new Date().toISOString(),
      })
    })

    return kpis
  }

  /**
   * Map objective category to KPI category
   */
  private static mapCategoryToKPI(
    category: string
  ): KPIMetric['category'] {
    const mapping: Record<string, KPIMetric['category']> = {
      awareness: 'awareness',
      leads: 'conversion',
      retention: 'retention',
      revenue: 'revenue',
      engagement: 'engagement',
      custom: 'reach',
    }
    return mapping[category] || 'engagement'
  }

  /**
   * Analyze performance and generate insights
   */
  static analyzePerformance(kpis: KPIMetric[]): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Identify top performers
    const exceedingKPIs = kpis.filter((kpi) => kpi.status === 'exceeding')
    if (exceedingKPIs.length > 0) {
      insights.push({
        id: `insight-success-${Date.now()}`,
        title: `${exceedingKPIs.length} KPIs Exceeding Targets`,
        description: `Strong performance across ${exceedingKPIs.map((k) => k.name).join(', ')}`,
        type: 'success',
        impact: 'high',
        related_kpis: exceedingKPIs.map((k) => k.id),
        recommended_actions: [
          'Document successful strategies for replication',
          'Allocate additional resources to high-performing areas',
          'Consider increasing targets for next cycle',
        ],
        confidence_score: 0.9,
        discovered_at: new Date().toISOString(),
      })
    }

    // Identify critical issues
    const criticalKPIs = kpis.filter((kpi) => kpi.status === 'critical')
    if (criticalKPIs.length > 0) {
      insights.push({
        id: `insight-concern-${Date.now()}`,
        title: `${criticalKPIs.length} KPIs in Critical Status`,
        description: `Immediate attention needed for ${criticalKPIs.map((k) => k.name).join(', ')}`,
        type: 'concern',
        impact: 'high',
        related_kpis: criticalKPIs.map((k) => k.id),
        recommended_actions: [
          'Review and revise strategies for underperforming areas',
          'Conduct root cause analysis',
          'Consider reallocating resources',
          'Update targeting or messaging',
        ],
        confidence_score: 0.95,
        discovered_at: new Date().toISOString(),
      })
    }

    // Identify improving trends
    const improvingKPIs = kpis.filter((kpi) => kpi.trend === 'improving')
    if (improvingKPIs.length >= 3) {
      insights.push({
        id: `insight-opportunity-${Date.now()}`,
        title: `${improvingKPIs.length} KPIs Showing Positive Trends`,
        description: `Momentum building in ${improvingKPIs.slice(0, 3).map((k) => k.name).join(', ')}`,
        type: 'opportunity',
        impact: 'medium',
        related_kpis: improvingKPIs.map((k) => k.id),
        recommended_actions: [
          'Maintain current strategies',
          'Prepare to scale successful initiatives',
          'Monitor for sustained improvement',
        ],
        confidence_score: 0.75,
        discovered_at: new Date().toISOString(),
      })
    }

    // Identify declining trends
    const decliningKPIs = kpis.filter((kpi) => kpi.trend === 'declining')
    if (decliningKPIs.length > 0) {
      insights.push({
        id: `insight-warning-${Date.now()}`,
        title: `${decliningKPIs.length} KPIs Showing Negative Trends`,
        description: `Declining performance in ${decliningKPIs.map((k) => k.name).join(', ')}`,
        type: 'warning',
        impact: decliningKPIs.length > 2 ? 'high' : 'medium',
        related_kpis: decliningKPIs.map((k) => k.id),
        recommended_actions: [
          'Investigate causes of decline',
          'Test new approaches or messaging',
          'Review competitive landscape',
          'Consider A/B testing alternatives',
        ],
        confidence_score: 0.85,
        discovered_at: new Date().toISOString(),
      })
    }

    return insights
  }

  /**
   * Generate comprehensive reflection report
   */
  static generateReflectionReport(
    kpis: KPIMetric[],
    campaigns: CampaignPerformance[] = []
  ): ReflectionReport {
    const insights = this.analyzePerformance(kpis)

    const kpiSummary = {
      total_kpis: kpis.length,
      exceeding: kpis.filter((k) => k.status === 'exceeding').length,
      on_track: kpis.filter((k) => k.status === 'on_track').length,
      at_risk: kpis.filter((k) => k.status === 'at_risk').length,
      critical: kpis.filter((k) => k.status === 'critical').length,
    }

    const overallScore = kpis.length > 0
      ? ((kpiSummary.exceeding * 100 + kpiSummary.on_track * 80 + kpiSummary.at_risk * 60 + kpiSummary.critical * 30) / kpis.length)
      : 0

    const topWins = insights.filter((i) => i.type === 'success' || i.type === 'opportunity')
    const topConcerns = insights.filter((i) => i.type === 'concern' || i.type === 'warning')

    // Generate strategic recommendations
    const recommendations: string[] = []
    if (kpiSummary.critical > 0) {
      recommendations.push('Prioritize addressing critical KPIs with immediate action plans')
    }
    if (kpiSummary.exceeding > kpiSummary.total_kpis * 0.5) {
      recommendations.push('Consider raising targets to maintain growth momentum')
    }
    if (insights.some((i) => i.type === 'warning')) {
      recommendations.push('Implement A/B testing for declining metrics')
    }
    recommendations.push('Continue monitoring trends for early intervention opportunities')
    recommendations.push('Document and share successful strategies across teams')

    // Determine next cycle priorities
    const priorities: string[] = []
    if (kpiSummary.critical > 0) {
      priorities.push('Recovery plans for critical metrics')
    }
    if (kpiSummary.at_risk > 0) {
      priorities.push('Prevention strategies for at-risk areas')
    }
    priorities.push('Scaling successful initiatives')
    priorities.push('Innovation in stable performing areas')

    return {
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      overall_score: Math.round(overallScore),
      kpi_summary: kpiSummary,
      top_wins: topWins,
      top_concerns: topConcerns,
      channel_performance: [],
      campaign_performance: campaigns,
      strategic_recommendations: recommendations,
      next_cycle_priorities: priorities,
    }
  }

  /**
   * Calculate trend data for charts
   */
  static calculateTrendData(
    kpi: KPIMetric,
    historicalData?: Array<{ date: string; value: number }>
  ): Array<{ date: string; value: number; target: number }> {
    // If no historical data, generate simulated trend
    if (!historicalData || historicalData.length === 0) {
      const data: Array<{ date: string; value: number; target: number }> = []
      const today = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(today)
        date.setMonth(today.getMonth() - i)

        const progress = (11 - i) / 11
        const randomVariation = (Math.random() - 0.5) * 0.1
        const value = Math.round(
          kpi.previous_value +
          (kpi.current_value - kpi.previous_value) * progress * (1 + randomVariation)
        )

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value,
          target: kpi.target_value,
        })
      }

      return data
    }

    return historicalData.map((d) => ({
      ...d,
      target: kpi.target_value,
    }))
  }

  /**
   * Export report data for download
   */
  static exportReportData(report: ReflectionReport): string {
    return JSON.stringify(report, null, 2)
  }

  /**
   * Generate executive summary
   */
  static generateExecutiveSummary(report: ReflectionReport): string {
    const { overall_score, kpi_summary, top_wins, top_concerns } = report

    let summary = `# MIRROR Reflection Report - ${report.period}\n\n`
    summary += `**Overall Performance Score:** ${overall_score}/100\n\n`

    summary += `## KPI Overview\n`
    summary += `- Total KPIs Tracked: ${kpi_summary.total_kpis}\n`
    summary += `- Exceeding Targets: ${kpi_summary.exceeding}\n`
    summary += `- On Track: ${kpi_summary.on_track}\n`
    summary += `- At Risk: ${kpi_summary.at_risk}\n`
    summary += `- Critical: ${kpi_summary.critical}\n\n`

    if (top_wins.length > 0) {
      summary += `## Key Wins\n`
      top_wins.forEach((win) => {
        summary += `- ${win.title}: ${win.description}\n`
      })
      summary += `\n`
    }

    if (top_concerns.length > 0) {
      summary += `## Areas of Concern\n`
      top_concerns.forEach((concern) => {
        summary += `- ${concern.title}: ${concern.description}\n`
      })
      summary += `\n`
    }

    summary += `## Strategic Recommendations\n`
    report.strategic_recommendations.forEach((rec, i) => {
      summary += `${i + 1}. ${rec}\n`
    })

    summary += `\n## Next Cycle Priorities\n`
    report.next_cycle_priorities.forEach((priority, i) => {
      summary += `${i + 1}. ${priority}\n`
    })

    return summary
  }
}
