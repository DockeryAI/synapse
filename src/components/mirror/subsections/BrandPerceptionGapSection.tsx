/**
 * Brand Perception Gap Section
 * Shows gap between current brand perception and desired positioning
 * Pre-UVP: Basic analysis from public data
 * Post-UVP: Enhanced analysis with UVP alignment
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingDown,
  AlertCircle,
  Sparkles,
  Target,
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BrandPerceptionService } from '@/services/mirror/brand-perception'

interface BrandPerceptionGapSectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP?: boolean
  className?: string
}

export const BrandPerceptionGapSection: React.FC<BrandPerceptionGapSectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP = false,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!brandData?.website) {
      setError('No website URL found. Please ensure your brand profile includes a website.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('[BrandPerceptionGapSection] Starting analysis...')
      const result = await BrandPerceptionService.analyzeBrand(
        brandId,
        brandData.website,
        brandData.industry || 'Technology'
      )

      console.log('[BrandPerceptionGapSection] Analysis complete:', result)
      setAnalysis(result)
    } catch (err) {
      console.error('[BrandPerceptionGapSection] Analysis failed:', err)
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

  // Get icon for insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'gap':
        return <TrendingDown className="h-5 w-5 text-orange-600" />
      case 'strength':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'opportunity':
        return <Target className="h-5 w-5 text-blue-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  // Get color for impact level
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Brand Perception Gap</h2>
            <p className="text-muted-foreground">
              {hasCompletedUVP
                ? 'See how your current brand perception aligns with your Value Proposition'
                : 'Understand how customers currently perceive your brand vs. how you present yourself'
              }
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !brandData?.website}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : analysis ? 'Refresh' : 'Analyze'}
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
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground mb-4">
                Click "Analyze" to scan your website and understand how customers perceive your brand.
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
            {/* Clarity & Jargon Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clarity Score</h3>
                    <p className="text-2xl font-bold">{analysis.clarity.score}/100</p>
                  </div>
                </div>
                <Progress value={analysis.clarity.score} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {analysis.clarity.score >= 80 ? 'Excellent clarity' :
                   analysis.clarity.score >= 60 ? 'Good clarity with room for improvement' :
                   'Needs clarity improvements'}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Jargon Density</h3>
                    <p className="text-2xl font-bold">{analysis.jargon.density}/100</p>
                  </div>
                </div>
                <Progress value={analysis.jargon.density} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {analysis.jargon.density >= 70 ? 'High jargon usage' :
                   analysis.jargon.density >= 40 ? 'Moderate jargon usage' :
                   'Plain language communication'}
                </p>
              </Card>
            </div>

            {/* Content Emphasis */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Content Emphasis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Features vs Benefits</span>
                    <span className="text-sm text-muted-foreground">
                      {analysis.contentEmphasis.featureVsBenefitRatio >= 60 ? 'Benefit-focused' :
                       analysis.contentEmphasis.featureVsBenefitRatio >= 40 ? 'Balanced' : 'Feature-focused'}
                    </span>
                  </div>
                  <Progress value={analysis.contentEmphasis.featureVsBenefitRatio} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Emotional vs Rational</span>
                    <span className="text-sm text-muted-foreground">
                      {analysis.contentEmphasis.emotionalVsRational >= 60 ? 'Emotional' :
                       analysis.contentEmphasis.emotionalVsRational >= 40 ? 'Balanced' : 'Rational'}
                    </span>
                  </div>
                  <Progress value={analysis.contentEmphasis.emotionalVsRational} className="h-2" />
                </div>
              </div>
            </Card>

            {/* Key Insights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Insights</h3>
              {analysis.insights.map((insight: any, idx: number) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-sm font-medium text-primary">
                        ✓ {insight.actionable}
                      </p>
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
                    <p className="text-sm text-muted-foreground mb-1">{rec.reasoning}</p>
                    <p className="text-sm text-primary">Expected: {rec.estimatedImpact}</p>
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
