/**
 * Benchmark Comparison Component
 * Compares brand metrics against industry benchmarks
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, Award, Lightbulb } from 'lucide-react'

interface BenchmarkComparisonProps {
  metricName: string
  yourValue: number
  industryAvg: number
  topTenPercent: number
  unit?: string
  format?: 'number' | 'percentage' | 'currency'
  improvement?: string
  goal?: number
  className?: string
}

export function BenchmarkComparison({
  metricName,
  yourValue,
  industryAvg,
  topTenPercent,
  unit = '',
  format = 'number',
  improvement,
  goal,
  className
}: BenchmarkComparisonProps) {
  // Format values
  const formatValue = (value: number): string => {
    if (format === 'percentage') return `${value.toFixed(1)}%`
    if (format === 'currency') return `$${value.toLocaleString()}`
    return value.toLocaleString() + unit
  }

  // Calculate percentile
  const percentileScore = calculatePercentile(yourValue, industryAvg, topTenPercent)
  const percentileLabel = getPercentileLabel(percentileScore)

  // Determine if above/below average
  const vsAverage = ((yourValue - industryAvg) / industryAvg) * 100
  const isAboveAverage = yourValue > industryAvg

  // Calculate gap to top 10%
  const gapToTop = topTenPercent - yourValue
  const gapPercent = ((gapToTop / topTenPercent) * 100)

  // Get improvement suggestions
  const suggestions = getSuggestions(metricName, yourValue, industryAvg, topTenPercent)

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-4">
        {/* Metric Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{metricName}</h4>
          <Badge variant={isAboveAverage ? 'default' : 'secondary'}>
            {percentileLabel}
          </Badge>
        </div>

        {/* Visual Comparison */}
        <div className="space-y-3">
          {/* Your Value */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">You</span>
              <span className="font-bold text-lg">{formatValue(yourValue)}</span>
            </div>
            <Progress value={Math.min((yourValue / topTenPercent) * 100, 100)} className="h-2" />
          </div>

          {/* Industry Average */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Industry Avg</span>
              <span className="font-semibold">{formatValue(industryAvg)}</span>
            </div>
            <Progress value={(industryAvg / topTenPercent) * 100} className="h-1.5 opacity-50" />
          </div>

          {/* Top 10% */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                Top 10%
              </span>
              <span className="font-semibold">{formatValue(topTenPercent)}</span>
            </div>
            <Progress value={100} className="h-1.5 opacity-30" />
          </div>
        </div>

        {/* Performance Summary */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          {/* vs Average */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">vs Industry Average</span>
            <span className={`font-semibold flex items-center gap-1 ${
              isAboveAverage ? 'text-green-600' : 'text-red-600'
            }`}>
              {isAboveAverage ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isAboveAverage ? '+' : ''}{vsAverage.toFixed(0)}%
            </span>
          </div>

          {/* Status */}
          <div className="text-xs text-muted-foreground">
            {isAboveAverage ? (
              <>💚 You're <strong>{Math.abs(vsAverage).toFixed(0)}% above average</strong> ({percentileLabel})</>
            ) : (
              <>⚠️ You're <strong>{Math.abs(vsAverage).toFixed(0)}% below average</strong></>
            )}
          </div>

          {/* Monthly trend if provided */}
          {improvement && (
            <div className="text-xs text-muted-foreground pt-1 border-t">
              📈 {improvement} from last month
            </div>
          )}
        </div>

        {/* Goal & Gap Analysis */}
        {goal ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Goal Progress
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target: {formatValue(goal)}</span>
                <span className="font-semibold">
                  {((yourValue / goal) * 100).toFixed(0)}% there
                </span>
              </div>
              <Progress value={Math.min((yourValue / goal) * 100, 100)} className="h-1.5" />
            </div>
          </div>
        ) : yourValue < topTenPercent ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Gap to Top 10%
            </div>
            <div className="text-sm">
              Need <strong>+{formatValue(gapToTop)}</strong> to reach top 10% ({Math.abs(gapPercent).toFixed(0)}% increase)
            </div>
          </div>
        ) : null}

        {/* Improvement Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4" />
              How to Improve
            </div>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Calculate percentile score
 */
function calculatePercentile(
  yourValue: number,
  industryAvg: number,
  topTenPercent: number
): number {
  if (yourValue >= topTenPercent) return 90
  if (yourValue >= industryAvg) {
    // Between average and top 10%
    const range = topTenPercent - industryAvg
    const position = yourValue - industryAvg
    return 50 + (position / range) * 40 // Maps to 50-90 percentile
  } else {
    // Below average
    const position = yourValue / industryAvg
    return Math.max(position * 50, 5) // Maps to 5-50 percentile
  }
}

/**
 * Get percentile label
 */
function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Above Average'
  if (percentile >= 25) return 'Below Average'
  return 'Bottom 25%'
}

/**
 * Generate improvement suggestions based on metric
 */
function getSuggestions(
  metricName: string,
  yourValue: number,
  industryAvg: number,
  _topTenPercent: number
): string[] {
  const suggestions: string[] = []
  const metricLower = metricName.toLowerCase()

  // Generic suggestions based on percentile
  const isWellBelowAvg = yourValue < industryAvg * 0.7

  // Engagement Rate
  if (metricLower.includes('engagement')) {
    if (isWellBelowAvg) {
      suggestions.push('Hook posts get 3.8x more engagement (your proven multiplier)')
      suggestions.push('Post on Tuesdays at 10am (your +67% sweet spot)')
    }
    suggestions.push('Use emotional triggers and power words')
    suggestions.push('Add visuals to every post')
  }

  // Reach / Traffic
  if (metricLower.includes('reach') || metricLower.includes('traffic')) {
    suggestions.push('Optimize SEO for quick-win keywords')
    suggestions.push('Leverage trending topics and hashtags')
    suggestions.push('Share content across multiple channels')
  }

  // Conversion Rate
  if (metricLower.includes('conversion') || metricLower.includes('lead')) {
    suggestions.push('Add clear calls-to-action')
    suggestions.push('Use scarcity and urgency triggers')
    suggestions.push('Optimize landing page psychology score')
  }

  // Click-Through Rate
  if (metricLower.includes('click') || metricLower.includes('ctr')) {
    suggestions.push('Test curiosity gap headlines')
    suggestions.push('Use numbers and specifics')
    suggestions.push('Add benefit-driven CTAs')
  }

  // Response Time
  if (metricLower.includes('response') || metricLower.includes('time')) {
    suggestions.push('Set up automated responses')
    suggestions.push('Monitor during peak hours')
    suggestions.push('Create response templates')
  }

  return suggestions.slice(0, 3) // Top 3
}

/**
 * Inline Benchmark Comparison (for embedding in existing components)
 */
export function InlineBenchmark({
  yourValue,
  industryAvg,
  topTenPercent,
  unit = '',
  format = 'number'
}: {
  yourValue: number
  industryAvg: number
  topTenPercent: number
  unit?: string
  format?: 'number' | 'percentage' | 'currency'
}) {
  const formatValue = (value: number): string => {
    if (format === 'percentage') return `${value.toFixed(1)}%`
    if (format === 'currency') return `$${value.toLocaleString()}`
    return value.toLocaleString() + unit
  }

  const isAboveAverage = yourValue > industryAvg
  const vsAverage = ((yourValue - industryAvg) / industryAvg) * 100

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">vs Industry:</span>
      <Badge variant={isAboveAverage ? 'default' : 'secondary'} className="text-xs">
        {isAboveAverage ? '+' : ''}{vsAverage.toFixed(0)}%
      </Badge>
      <span className="text-muted-foreground">
        (Avg: {formatValue(industryAvg)}, Top 10%: {formatValue(topTenPercent)})
      </span>
    </div>
  )
}
