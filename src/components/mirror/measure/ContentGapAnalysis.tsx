/**
 * Content Gap Analysis Component
 * Shows content coverage gaps and revenue opportunities
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, DollarSign, FileText, Sparkles, TrendingUp } from 'lucide-react'
import { ContentGapAnalyzer, type ContentGapAnalysis as ContentGapAnalysisType } from '@/services/intelligence/content-gap-analyzer'

interface ContentGapAnalysisProps {
  brandData: any
  competitorAnalysis: any
  industryData: any
}

export function ContentGapAnalysis({
  brandData,
  competitorAnalysis,
  industryData,
}: ContentGapAnalysisProps) {
  const [analysis, setAnalysis] = useState<ContentGapAnalysisType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function analyzeGaps() {
      setIsLoading(true)
      try {
        const result = await ContentGapAnalyzer.analyzeGaps(
          brandData,
          competitorAnalysis,
          industryData
        )
        setAnalysis(result)
      } catch (error) {
        console.error('[ContentGapAnalysis] Error analyzing gaps:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (brandData && industryData) {
      analyzeGaps()
    }
  }, [brandData, competitorAnalysis, industryData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Analyzing content gaps...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis || !analysis.top_opportunity) {
    return null
  }

  const topOpportunity = analysis.top_opportunity

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Gap Analysis
            </CardTitle>
            <CardDescription>Discover untapped content opportunities</CardDescription>
          </div>
          <Badge variant="outline">
            Opportunity Score: {analysis.total_opportunity_score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Content Coverage */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">YOUR CONTENT COVERAGE</h4>
          <div className="space-y-2">
            {analysis.your_categories.map((category, index) => {
              const statusIcon =
                category.coverage >= 70 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : category.coverage >= 40 ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )

              const statusColor =
                category.coverage >= 70
                  ? 'text-green-600'
                  : category.coverage >= 40
                  ? 'text-yellow-600'
                  : 'text-red-600'

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <span>{category.name}</span>
                    </div>
                    <span className={`font-medium ${statusColor}`}>
                      {Math.round(category.coverage)}%
                    </span>
                  </div>
                  <Progress value={category.coverage} className="h-2" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Opportunity */}
        <div className="rounded-lg border-2 border-primary p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                TOP OPPORTUNITY: {topOpportunity.category}
              </h4>
              {topOpportunity.quick_win && (
                <Badge className="mt-2" variant="default">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Quick Win
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {topOpportunity.opportunity_score}/100
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Content Gap</div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(topOpportunity.gap_size)}% behind
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Search Volume</div>
              <div className="text-2xl font-bold">
                {topOpportunity.search_volume.toLocaleString()}/mo
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <h5 className="text-sm font-semibold">Expected Results:</h5>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Visits:</span>
                <span className="font-semibold">
                  {topOpportunity.estimated_monthly_visits.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Leads:</span>
                <span className="font-semibold">
                  {topOpportunity.estimated_monthly_leads.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. Monthly Revenue:</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {topOpportunity.estimated_monthly_revenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Competition Level: {topOpportunity.competition_level}% • Conversion Rate:{' '}
              {(topOpportunity.conversion_rate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Content needed: {topOpportunity.content_pieces_needed} pieces
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate All Content with Synapse
          </Button>
        </div>

        {/* Quick Wins */}
        {analysis.quick_wins.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              MORE QUICK WINS
            </h4>
            <div className="space-y-2">
              {analysis.quick_wins.slice(1, 4).map((gap, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{gap.category}</span>
                    <Badge variant="outline" className="text-xs">
                      {gap.opportunity_score}/100
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Gap:</span>{' '}
                      <span className="font-semibold text-red-600">
                        {Math.round(gap.gap_size)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>{' '}
                      <span className="font-semibold">{gap.search_volume}/mo</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>{' '}
                      <span className="font-semibold text-green-600">
                        ${(gap.estimated_monthly_revenue / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {analysis.all_gaps.filter(g => g.gap_size > 50).length}
              </div>
              <div className="text-xs text-muted-foreground">Major Gaps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {analysis.quick_wins.length}
              </div>
              <div className="text-xs text-muted-foreground">Quick Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                $
                {Math.round(
                  analysis.all_gaps.reduce((sum, g) => sum + g.estimated_monthly_revenue, 0) / 1000
                )}
                K
              </div>
              <div className="text-xs text-muted-foreground">Total Opportunity/mo</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
