/**
 * Value Delivery Analysis Section
 * Post-UVP: Analyzes how well you deliver on your Value Proposition
 * Compares promised value vs. perceived delivery
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Sparkles, Lock, AlertCircle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ValueAnalysisService } from '@/services/mirror/value-analysis'
import { supabase } from '@/lib/supabase'

interface ValueDeliveryAnalysisSectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const ValueDeliveryAnalysisSection: React.FC<ValueDeliveryAnalysisSectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [audit, setAudit] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    const websiteUrl = brandData?.website

    if (!websiteUrl) {
      setError('No website URL found. Please add a website to your brand profile.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Get UVP data
      const { data: uvpData } = await supabase
        .from('value_statements')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_primary', true)
        .maybeSingle()

      if (!uvpData) {
        setError('No UVP found. Please complete your Value Proposition first.')
        setIsAnalyzing(false)
        return
      }

      console.log('[ValueDeliveryAnalysisSection] Starting value delivery analysis...')
      const result = await ValueAnalysisService.analyzeValueDelivery(
        websiteUrl,
        uvpData,
        brandId
      )

      console.log('[ValueDeliveryAnalysisSection] Analysis complete:', result)
      setAudit(result)
    } catch (err) {
      console.error('[ValueDeliveryAnalysisSection] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Value delivery analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when UVP is completed and brand data is available
  React.useEffect(() => {
    if (hasCompletedUVP && brandData?.website && !audit && !isAnalyzing && !error) {
      handleAnalyze()
    }
  }, [hasCompletedUVP, brandData?.website])

  if (!hasCompletedUVP) {
    return (
      <div className={className}>
        <div className="container py-6 px-6">
          <Card className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complete Your UVP First</h3>
            <p className="text-muted-foreground">
              Value Delivery Analysis requires your Value Proposition to be defined.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Value Delivery Analysis</h2>
            <p className="text-muted-foreground">
              Assess how well you deliver on your promised Value Proposition
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : audit ? 'Refresh' : 'Analyze Delivery'}
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

        {!audit && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
              <p className="text-muted-foreground mb-4">
                Click "Analyze Delivery" to assess UVP-to-website alignment.
              </p>
              <Button onClick={handleAnalyze}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>
        )}

        {audit && (
          <>
            {/* Overall Score */}
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Overall Alignment Score</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(audit.overallScore)}`}>
                    {audit.overallScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              <Progress value={audit.overallScore} className="h-3 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Target Customer</p>
                  <Badge variant={getScoreBadge(audit.scoreBreakdown?.targetCustomer || 0)}>
                    {audit.scoreBreakdown?.targetCustomer || 0}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Problem Solved</p>
                  <Badge variant={getScoreBadge(audit.scoreBreakdown?.problemSolved || 0)}>
                    {audit.scoreBreakdown?.problemSolved || 0}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Solution</p>
                  <Badge variant={getScoreBadge(audit.scoreBreakdown?.uniqueSolution || 0)}>
                    {audit.scoreBreakdown?.uniqueSolution || 0}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Key Benefit</p>
                  <Badge variant={getScoreBadge(audit.scoreBreakdown?.keyBenefit || 0)}>
                    {audit.scoreBreakdown?.keyBenefit || 0}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Differentiation</p>
                  <Badge variant={getScoreBadge(audit.scoreBreakdown?.differentiation || 0)}>
                    {audit.scoreBreakdown?.differentiation || 0}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Component Analysis */}
            {audit.componentAnalysis && audit.componentAnalysis.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">UVP Component Alignment</h3>
                <div className="space-y-3">
                  {audit.componentAnalysis.map((component: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {component.alignmentScore >= 70 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{component.component}</h4>
                            <Badge variant={getScoreBadge(component.alignmentScore)}>
                              {component.alignmentScore}/100
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">UVP Promise:</span>
                              <p className="text-muted-foreground">{component.uvpPromise}</p>
                            </div>
                            <div>
                              <span className="font-medium">Website Delivery:</span>
                              <p className="text-muted-foreground">{component.websiteDelivery}</p>
                            </div>
                            {component.gap && (
                              <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                                <span className="font-medium text-orange-900 dark:text-orange-100">Gap:</span>
                                <p className="text-sm text-orange-700 dark:text-orange-300">{component.gap}</p>
                              </div>
                            )}
                            {component.recommendation && (
                              <div className="p-2 bg-primary/10 rounded">
                                <span className="font-medium">Recommendation:</span>
                                <p className="text-sm">{component.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {audit.quickWins && audit.quickWins.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Quick Wins</h3>
                  <Badge>High Impact</Badge>
                </div>
                <div className="space-y-4">
                  {audit.quickWins.slice(0, 5).map((win: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{win.win}</span>
                        <Badge variant="outline" className="text-xs">+{win.estimatedScoreGain} pts</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-1">Current State:</p>
                          <p className="text-red-600 dark:text-red-400">{win.currentState}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-1">Desired State:</p>
                          <p className="text-green-600 dark:text-green-400">{win.desiredState}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <Badge variant={win.effort === 'low' ? 'default' : win.effort === 'medium' ? 'secondary' : 'destructive'}>
                          Effort: {win.effort}
                        </Badge>
                        <Badge variant={win.impact === 'high' ? 'default' : 'secondary'}>
                          Impact: {win.impact}
                        </Badge>
                      </div>
                      {win.specificActions && win.specificActions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Actions:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {win.specificActions.slice(0, 3).map((action: string, i: number) => (
                              <li key={i}>• {action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Score Projection */}
            {audit.scoreProjection && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Score Improvement Projection</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground mb-1">With Quick Wins</p>
                    <p className="text-2xl font-bold text-green-600">{audit.scoreProjection.withQuickWins}</p>
                    <p className="text-xs text-muted-foreground">+{audit.scoreProjection.withQuickWins - audit.overallScore} points</p>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground mb-1">After 3 Months</p>
                    <p className="text-2xl font-bold text-blue-600">{audit.scoreProjection.with3MonthPlan}</p>
                    <p className="text-xs text-muted-foreground">+{audit.scoreProjection.with3MonthPlan - audit.overallScore} points</p>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground mb-1">After 6 Months</p>
                    <p className="text-2xl font-bold text-purple-600">{audit.scoreProjection.with6MonthPlan}</p>
                    <p className="text-xs text-muted-foreground">+{audit.scoreProjection.with6MonthPlan - audit.overallScore} points</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Before/After Preview */}
            {audit.beforeAfterPreview && audit.beforeAfterPreview.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Before/After Preview</h3>
                <div className="space-y-3">
                  {audit.beforeAfterPreview.map((preview: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{preview.component}</h4>
                        <Badge className="bg-green-600">{preview.improvement}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">Before:</p>
                          <p className="text-sm text-red-700 dark:text-red-300">{preview.before}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                          <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">After:</p>
                          <p className="text-sm text-green-700 dark:text-green-300">{preview.after}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
