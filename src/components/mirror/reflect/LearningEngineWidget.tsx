/**
 * Learning Engine Widget
 * Displays what the AI has learned about content performance patterns
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendingUp, TrendingDown, TestTube, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { PatternAnalyzerService } from '@/services/intelligence/pattern-analyzer'
import type { ContentPattern } from '@/types/intelligence.types'

interface LearningEngineWidgetProps {
  brandId?: string
  className?: string
}

interface PatternDisplay {
  pattern: string
  multiplier?: number
  impact?: number
  potential?: number
  confidence: number
  description: string
}

export function LearningEngineWidget({ brandId, className }: LearningEngineWidgetProps) {
  const [patterns, setPatterns] = React.useState<ContentPattern[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date())

  React.useEffect(() => {
    if (brandId) {
      loadPatterns()
    }
  }, [brandId])

  const loadPatterns = async () => {
    if (!brandId) return

    setLoading(true)
    setError(null)
    try {
      const detectedPatterns = await PatternAnalyzerService.getActivePatterns(brandId)
      setPatterns(detectedPatterns)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Check if it's a "not implemented" error
      if (errorMessage.includes('not implemented') || errorMessage.includes('failed to retrieve')) {
        setError('Pattern analysis requires historical content data. Please ensure content posts are being tracked.')
      } else {
        setError(`Failed to load patterns: ${errorMessage}`)
      }
      console.error('[LearningEngineWidget] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Transform patterns into display format
  const categorizePatterns = () => {
    const provenWinners: PatternDisplay[] = []
    const avoidThese: PatternDisplay[] = []
    const testing: PatternDisplay[] = []

    patterns.forEach((pattern) => {
      const improvement = pattern.performance_metrics.improvement_percentage
      const confidence = Math.round(pattern.confidence_score * 100)

      if (confidence >= 75) {
        if (improvement > 0) {
          provenWinners.push({
            pattern: pattern.title,
            multiplier: 1 + improvement / 100,
            confidence,
            description: pattern.description
          })
        } else if (improvement < 0) {
          avoidThese.push({
            pattern: pattern.title,
            impact: improvement,
            confidence,
            description: pattern.description
          })
        }
      } else if (confidence >= 30) {
        testing.push({
          pattern: pattern.title,
          potential: Math.abs(improvement),
          confidence,
          description: pattern.description
        })
      }
    })

    return { provenWinners, avoidThese, testing }
  }

  const { provenWinners, avoidThese, testing } = categorizePatterns()

  // Generate auto-adjustments from patterns
  const autoAdjustments = {
    contentMix: provenWinners.length > 0 ? [
      { type: provenWinners[0]?.pattern || 'High-performing content', percentage: 60 },
      { type: 'Supporting content', percentage: 30 },
      { type: 'Experimental', percentage: 10 }
    ] : [],
    schedule: patterns
      .filter(p => p.pattern_category === 'timing')
      .flatMap(p => p.actionable_insights)
      .slice(0, 3),
    format: patterns
      .filter(p => p.pattern_category === 'format')
      .map(p => p.actionable_insights[0])
      .join(', ') || 'Optimize based on performance data'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              What I've Learned
            </CardTitle>
            <CardDescription>
              AI-detected patterns from your content performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>Analyzing your content patterns...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Pattern Analysis Unavailable</h4>
                <p className="text-xs text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This feature requires configuration. Contact your administrator or ensure your content tracking is set up correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && patterns.length === 0 && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No patterns detected yet</p>
            <p className="text-xs text-muted-foreground">
              Keep posting content and the AI will learn what works best for your audience.
            </p>
          </div>
        )}

        {/* Patterns Display - Only show if we have data */}
        {!loading && !error && patterns.length > 0 && (
          <>
        {/* Proven Winners */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold">PROVEN WINNERS</h4>
          </div>
          <div className="space-y-2">
            {provenWinners.map((winner, index) => (
              <div
                key={index}
                className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{winner.pattern}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">
                      {winner.multiplier}x
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {winner.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{winner.description}</p>
                <Progress value={winner.confidence} className="h-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Avoid These */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold">AVOID THESE</h4>
          </div>
          <div className="space-y-2">
            {avoidThese.map((avoid, index) => (
              <div
                key={index}
                className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{avoid.pattern}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {avoid.impact}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {avoid.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{avoid.description}</p>
                <Progress value={avoid.confidence} className="h-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Testing Now */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold">TESTING NOW</h4>
          </div>
          <div className="space-y-2">
            {testing.map((test, index) => (
              <div
                key={index}
                className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{test.pattern}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      +{test.potential}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {test.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{test.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={test.confidence} className="h-1 flex-1" />
                  <span className="text-xs text-muted-foreground">Early data</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Adjusting Strategy */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">AUTO-ADJUSTING STRATEGY</h4>
          </div>

          <div className="rounded-lg bg-primary/5 p-4 space-y-3">
            {/* Content Mix */}
            <div>
              <div className="text-sm font-medium mb-2">Content Mix</div>
              <div className="space-y-2">
                {autoAdjustments.contentMix.map((mix, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{mix.type}</span>
                      <span className="font-semibold">{mix.percentage}%</span>
                    </div>
                    <Progress value={mix.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <div className="text-sm font-medium mb-2">Optimal Schedule</div>
              <div className="flex flex-wrap gap-2">
                {autoAdjustments.schedule.map((time, index) => (
                  <Badge key={index} variant="outline">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <div className="text-sm font-medium mb-1">Format</div>
              <p className="text-xs text-muted-foreground">{autoAdjustments.format}</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{provenWinners.length}</div>
              <div className="text-xs text-muted-foreground">Proven Winners</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{avoidThese.length}</div>
              <div className="text-xs text-muted-foreground">Patterns to Avoid</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{testing.length}</div>
              <div className="text-xs text-muted-foreground">Active Tests</div>
            </div>
          </div>
        </div>

        {/* Learning Note */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          The AI continuously learns from your content performance and automatically adjusts recommendations.
          Confidence increases as more data is collected.
        </div>
        </>
        )}
      </CardContent>
    </Card>
  )
}
