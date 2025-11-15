/**
 * Competitive Intelligence Section
 * Discovers and analyzes competitors using SERP data
 * Shows competitor strengths, weaknesses, and messaging gaps
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Sparkles, TrendingUp, AlertCircle, Users, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CompetitiveAnalysisService } from '@/services/mirror/competitive-analysis'

interface CompetitiveIntelligenceSectionProps {
  brandId: string
  brandData?: any
  className?: string
}

export const CompetitiveIntelligenceSection: React.FC<CompetitiveIntelligenceSectionProps> = ({
  brandId,
  brandData,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [intelligence, setIntelligence] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    const industry = brandData?.industry || 'Technology'
    const brandName = brandData?.name || 'Your Brand'

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('[CompetitiveIntelligenceSection] Starting analysis...')
      const result = await CompetitiveAnalysisService.analyzeCompetition(
        brandName,
        industry
      )

      console.log('[CompetitiveIntelligenceSection] Analysis complete:', result)
      setIntelligence(result)
    } catch (err) {
      console.error('[CompetitiveIntelligenceSection] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when brand data is available
  React.useEffect(() => {
    if (brandData?.name && !intelligence && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [brandData?.name])

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Competitive Intelligence</h2>
            <p className="text-muted-foreground">
              Discover real competitors and analyze their messaging, positioning, and market presence
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : intelligence ? 'Refresh' : 'Discover Competitors'}
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

        {!intelligence && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Discover</h3>
              <p className="text-muted-foreground mb-4">
                Click "Discover Competitors" to find and analyze your market competition.
              </p>
              <Button onClick={handleAnalyze}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Discovery
              </Button>
            </div>
          </Card>
        )}

        {intelligence && (
          <>
            {/* Discovered Competitors */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Discovered Competitors</h3>
                <Badge>{intelligence.competitors.length} Found</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {intelligence.competitors.map((comp: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">{comp.domain}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Common Themes */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Common Themes</h3>
                <Badge variant="outline">What Everyone Says</Badge>
              </div>
              <div className="space-y-4">
                {intelligence.analysis.commonThemes.map((theme: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-green-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{theme.theme}</p>
                      <Badge variant="secondary">{theme.count} competitors</Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {theme.examples.map((ex: string, i: number) => (
                        <li key={i}>• {ex}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            {/* Unique Positions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Unique Positions</h3>
                <Badge variant="outline">What Only One Says</Badge>
              </div>
              <div className="space-y-3">
                {intelligence.analysis.uniquePositions.map((pos: any, idx: number) => (
                  <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <p className="font-medium text-purple-900 dark:text-purple-100">{pos.competitor}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{pos.position}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Gaps & Opportunities */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Messaging Gaps & Opportunities</h3>
              </div>
              {intelligence.analysis.gaps.map((gap: any, idx: number) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 mt-1">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{gap.gap}</h4>
                        <Badge
                          variant={gap.impact === 'high' ? 'destructive' : gap.impact === 'medium' ? 'default' : 'secondary'}
                        >
                          {gap.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-primary font-medium">
                        💡 Opportunity: {gap.opportunity}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            {intelligence.comparisonTable?.competitors?.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Competitive Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Competitor</th>
                        {intelligence.comparisonTable.dimensions.map((dim: string) => (
                          <th key={dim} className="text-left p-2">{dim}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {intelligence.comparisonTable.competitors.map((comp: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{comp.name}</td>
                          {intelligence.comparisonTable.dimensions.map((dim: string) => (
                            <td key={dim} className="p-2">
                              <div className="space-y-1">
                                <Progress value={comp.scores[dim]} className="h-2" />
                                <span className="text-xs text-muted-foreground">{comp.scores[dim]}/100</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Differentiation Recommendations</h3>
              <div className="space-y-4">
                {intelligence.analysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {rec.priority} priority
                      </Badge>
                      <span className="font-medium">{rec.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{rec.description}</p>
                    <p className="text-sm text-primary">Why: {rec.reasoning}</p>
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
