/**
 * Customer Understanding Section
 * Analyzes customer profiles, demographics, and psychographics
 * Uses Perplexity for public data research
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Sparkles, AlertCircle, Heart, Frown, TrendingUp, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CustomerResearchService } from '@/services/mirror/customer-research'

interface CustomerUnderstandingSectionProps {
  brandId: string
  brandData?: any
  className?: string
}

export const CustomerUnderstandingSection: React.FC<CustomerUnderstandingSectionProps> = ({
  brandId,
  brandData,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [insights, setInsights] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    const industry = brandData?.industry || 'Technology'
    const website = brandData?.website

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('[CustomerUnderstandingSection] Starting analysis...')
      const result = await CustomerResearchService.researchCustomers(industry, undefined, website)

      console.log('[CustomerUnderstandingSection] Analysis complete:', result)
      setInsights(result)
    } catch (err) {
      console.error('[CustomerUnderstandingSection] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when brand data is available
  React.useEffect(() => {
    if (brandData && !insights && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [brandData?.industry])

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Customer Understanding</h2>
            <p className="text-muted-foreground">
              Build customer profiles based on industry data, reviews, and public information
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : insights ? 'Refresh' : 'Analyze Customers'}
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Analysis Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {!insights && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Understand</h3>
              <p className="text-muted-foreground mb-4">
                Click "Analyze Customers" to research customer expectations and decision factors.
              </p>
              <Button onClick={handleAnalyze}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>
        )}

        {insights && (
          <>
            {/* Decision Factors */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Customer Decision Factors</h3>
                <Badge>Top 5</Badge>
              </div>
              <div className="space-y-4">
                {insights.decisionFactors.map((factor: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{factor.factor}</span>
                      <Badge variant="outline">{factor.importance}% important</Badge>
                    </div>
                    <Progress value={factor.importance} className="h-2 mb-1" />
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pain Points & Positive Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Frown className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">Pain Points</h3>
                </div>
                <div className="space-y-3">
                  {insights.painPoints.map((pain: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-red-500 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{pain.painPoint}</p>
                        <Badge
                          variant={pain.impact === 'high' ? 'destructive' : pain.impact === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {pain.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mentioned {pain.frequency}x in research
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Positive Drivers</h3>
                </div>
                <div className="space-y-3">
                  {insights.positiveDrivers.map((driver: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-green-500 pl-3">
                      <p className="font-medium text-sm mb-1">{driver.driver}</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {driver.examples.slice(0, 2).map((ex: string, i: number) => (
                          <li key={i}>• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Unexpected Priorities */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold">Unexpected Priorities</h3>
                <Badge variant="outline">Surprising Insights</Badge>
              </div>
              <div className="space-y-3">
                {insights.unexpectedPriorities.map((priority: any, idx: number) => (
                  <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">{priority.priority}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{priority.insight}</p>
                    <p className="text-xs text-muted-foreground mt-1">Why this matters: {priority.why}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Gap Analysis */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Priority vs. Emphasis Gap Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">What Customers Prioritize</h4>
                  <div className="space-y-2">
                    {insights.gapAnalysis.customerPriorities.map((priority: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="secondary">{idx + 1}</Badge>
                        <span className="text-sm">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">What Brands Emphasize</h4>
                  <div className="space-y-2">
                    {insights.gapAnalysis.brandEmphasis.map((emphasis: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="text-sm">{emphasis}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Identified Gaps & Recommendations</h4>
                {insights.gapAnalysis.gaps.map((gap: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {gap.priority}
                      </Badge>
                      <span className="font-medium text-sm">{gap.gap}</span>
                    </div>
                    <p className="text-sm text-primary">→ {gap.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
