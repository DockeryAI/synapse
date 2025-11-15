/**
 * Search Visibility Section
 * Analyzes SEO health, keyword rankings, and search presence
 * Uses SERP API for keyword and competitor data
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Sparkles, AlertCircle, Trophy, Target, TrendingUp, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchAnalysisService } from '@/services/mirror/search-analysis'

interface SearchVisibilitySectionProps {
  brandId: string
  brandData?: any
  className?: string
}

export const SearchVisibilitySection: React.FC<SearchVisibilitySectionProps> = ({
  brandId,
  brandData,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    const domain = brandData?.website
    const industry = brandData?.industry || 'Technology'
    const brandName = brandData?.name || 'Your Brand'

    if (!domain) {
      setError('No website URL found. Please ensure your brand profile includes a website.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('[SearchVisibilitySection] Starting analysis...')
      const result = await SearchAnalysisService.analyzeSearchVisibility(domain, industry, brandName)

      console.log('[SearchVisibilitySection] Analysis complete:', result)
      setAnalysis(result)
    } catch (err) {
      console.error('[SearchVisibilitySection] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when brand data is available
  React.useEffect(() => {
    if (brandData?.website && !analysis && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [brandData?.website])

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Search Visibility</h2>
            <p className="text-muted-foreground">
              Understand how customers find you through search and identify keyword opportunities
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !brandData?.website}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : analysis ? 'Refresh' : 'Analyze Visibility'}
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

        {!analysis && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground mb-4">
                Click "Analyze Visibility" to check your keyword rankings and discover opportunities.
              </p>
              <Button onClick={handleAnalyze} disabled={!brandData?.website}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>
        )}

        {analysis && (
          <>
            {/* Owned Keywords */}
            {analysis.ownedKeywords && analysis.ownedKeywords.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">Keywords You Own</h3>
                  <Badge>{analysis.ownedKeywords.length} in Top 10</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.ownedKeywords.map((kw: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{kw.keyword}</span>
                        <Badge variant="secondary">#{kw.position}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{kw.searchVolume} searches/mo</span>
                        <span>•</span>
                        <span>Difficulty: {kw.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Opportunity Keywords */}
            {analysis.opportunityKeywords && analysis.opportunityKeywords.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Opportunity Keywords</h3>
                  <Badge variant="outline">High Potential</Badge>
                </div>
                <div className="space-y-3">
                  {analysis.opportunityKeywords.map((kw: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{kw.keyword}</span>
                        <Badge variant={kw.opportunity === 'high' ? 'destructive' : 'default'}>
                          {kw.opportunity} opportunity
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{kw.searchVolume} searches/mo</span>
                        <span>Difficulty: {kw.difficulty}/100</span>
                        {kw.position && <span>Current: #{kw.position}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Competitor Dominance */}
            {analysis.competitorDominance && analysis.competitorDominance.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">Competitor Dominance</h3>
                  <Badge variant="outline">Where They Win</Badge>
                </div>
                <div className="space-y-2">
                  {analysis.competitorDominance.map((comp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{comp.keyword}</p>
                        <p className="text-xs text-muted-foreground">{comp.dominantCompetitor}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">#{comp.theirPosition}</Badge>
                        <span className="text-xs text-muted-foreground">
                          vs {comp.ourPosition ? `#${comp.ourPosition}` : 'not ranking'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Keyword Gaps */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Keyword Gaps & Opportunities</h3>
              </div>
              {analysis.keywordGaps.map((gap: any, idx: number) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 mt-1">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{gap.gap}</h4>
                        <Badge
                          variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {gap.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{gap.reasoning}</p>
                      {gap.keywords && gap.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gap.keywords.map((kw: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Prioritized Recommendations</h3>
              <div className="space-y-4">
                {analysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {rec.priority} priority
                      </Badge>
                      <span className="font-medium">{rec.action}</span>
                    </div>
                    <p className="text-sm text-primary mb-2">Expected: {rec.estimatedImpact}</p>
                    {rec.keywords && rec.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rec.keywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    )}
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
