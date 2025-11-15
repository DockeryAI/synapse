/**
 * Benchmark Grid Component
 * Fetches and displays multiple benchmark comparisons from the service
 */

import * as React from 'react'
import { BenchmarkComparison } from './BenchmarkComparison'
import { BenchmarkingService } from '@/services/intelligence/benchmarking'
import { AlertCircle } from 'lucide-react'

interface BenchmarkGridProps {
  brandId: string
  industry?: string
  industryCode?: string
  companySize?: 'small' | 'medium' | 'large'
  currentMetrics?: {
    engagement_rate?: number
    follower_growth?: number
    ctr?: number
    conversion_rate?: number
    response_time?: number
  }
}

export function BenchmarkGrid({
  brandId,
  industry,
  industryCode,
  currentMetrics = {}
}: BenchmarkGridProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [benchmarks, setBenchmarks] = React.useState<any>(null)

  React.useEffect(() => {
    if (industry || industryCode) {
      loadBenchmarks()
    }
  }, [industry, industryCode, brandId])

  const loadBenchmarks = async () => {
    if (!industry && !industryCode) return

    setLoading(true)
    setError(null)
    setBenchmarks(null)
    try {
      const metrics = {
        engagement_rate: currentMetrics.engagement_rate || 0,
        follower_growth: currentMetrics.follower_growth || 0,
        ctr: currentMetrics.ctr || 0,
        conversion_rate: currentMetrics.conversion_rate || 0,
        response_time: currentMetrics.response_time || 0
      }

      const result = await BenchmarkingService.getBenchmarks(
        industry || industryCode || '',
        metrics
      )

      console.log('[BenchmarkGrid] Loaded benchmarks:', result)
      setBenchmarks(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Show clear error message
      setError(`Benchmarks unavailable: ${errorMessage}`)
      console.error('[BenchmarkGrid] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // If we have an error, show error state
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Benchmarks Unavailable</h4>
            <p className="text-xs text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              This feature requires configuration. Contact your administrator to set up industry benchmarking.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // NO MOCK DATA - if benchmarks not loaded, show nothing
  // This enforces real data or errors only
  if (!benchmarks) {
    return (
      <div className="rounded-lg border border-muted bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No benchmark data available. Configure industry benchmarking database.
        </p>
      </div>
    )
  }

  // Render real benchmarks from service
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {benchmarks.engagement_rate && (
        <BenchmarkComparison
          metricName="Engagement Rate"
          yourValue={currentMetrics.engagement_rate || 0}
          industryAvg={benchmarks.engagement_rate.industry_avg}
          topTenPercent={benchmarks.engagement_rate.top_10_percent}
          format="percentage"
        />
      )}
      {benchmarks.follower_growth && (
        <BenchmarkComparison
          metricName="Follower Growth Rate"
          yourValue={currentMetrics.follower_growth || 0}
          industryAvg={benchmarks.follower_growth.industry_avg}
          topTenPercent={benchmarks.follower_growth.top_10_percent}
          format="percentage"
        />
      )}
      {benchmarks.ctr && (
        <BenchmarkComparison
          metricName="Click-Through Rate"
          yourValue={currentMetrics.ctr || 0}
          industryAvg={benchmarks.ctr.industry_avg}
          topTenPercent={benchmarks.ctr.top_10_percent}
          format="percentage"
        />
      )}
      {benchmarks.conversion_rate && (
        <BenchmarkComparison
          metricName="Conversion Rate"
          yourValue={currentMetrics.conversion_rate || 0}
          industryAvg={benchmarks.conversion_rate.industry_avg}
          topTenPercent={benchmarks.conversion_rate.top_10_percent}
          format="percentage"
        />
      )}
      {benchmarks.response_time && (
        <BenchmarkComparison
          metricName="Average Response Time"
          yourValue={currentMetrics.response_time || 0}
          industryAvg={benchmarks.response_time.industry_avg}
          topTenPercent={benchmarks.response_time.top_10_percent}
          unit=" min"
        />
      )}
    </div>
  )
}
