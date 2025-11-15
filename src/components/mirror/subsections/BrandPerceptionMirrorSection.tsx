/**
 * Brand Perception Mirror Section
 * Post-UVP: Before/After comparison of brand perception
 * Shows current state vs. UVP-aligned target state
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Sparkles, Lock, AlertCircle, ArrowRight, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PerceptionAnalysisService } from '@/services/mirror/perception-analysis'
import { supabase } from '@/lib/supabase'

interface BrandPerceptionMirrorSectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const BrandPerceptionMirrorSection: React.FC<BrandPerceptionMirrorSectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [mirror, setMirror] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleAnalyze = async () => {
    const brandName = brandData?.name || 'Your Brand'
    const websiteUrl = brandData?.website
    const industry = brandData?.industry || 'Technology'

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

      console.log('[BrandPerceptionMirrorSection] Starting perception analysis...')
      const result = await PerceptionAnalysisService.analyzeBrandPerceptionGap(
        brandName,
        websiteUrl,
        uvpData,
        industry
      )

      console.log('[BrandPerceptionMirrorSection] Analysis complete:', result)
      setMirror(result)
    } catch (err) {
      console.error('[BrandPerceptionMirrorSection] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Perception analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when UVP is completed and brand data is available
  React.useEffect(() => {
    if (hasCompletedUVP && brandData?.website && !mirror && !isAnalyzing && !error) {
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
              Brand Perception Mirror requires your Value Proposition to be defined.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  const getGapColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
      case 'large': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      default: return 'bg-gray-50 dark:bg-gray-950/20'
    }
  }

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Brand Perception Mirror</h2>
            <p className="text-muted-foreground">
              See your brand before and after UVP alignment — current reality vs. target positioning
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : mirror ? 'Refresh' : 'Analyze Perception'}
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

        {!mirror && !isAnalyzing && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-cyan-100 dark:bg-cyan-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Eye className="h-10 w-10 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Reflect</h3>
              <p className="text-muted-foreground mb-4">
                Click "Analyze Perception" to see your current vs. desired brand perception.
              </p>
              <Button onClick={handleAnalyze}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>
        )}

        {mirror && (
          <>
            {/* Current vs Desired Perception */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Perception */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Perception</h3>
                {mirror.currentPerception && (
                  <Card className="p-6 border-red-200 dark:border-red-800">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Positioning</p>
                        <p className="font-medium">{mirror.currentPerception.positioning}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Emotional Tone</p>
                        <Badge variant="outline">{mirror.currentPerception.emotionalTone}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Top Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {mirror.currentPerception.keywords?.slice(0, 8).map((kw: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                      {mirror.currentPerception.themes?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Key Themes</p>
                          <div className="space-y-2">
                            {mirror.currentPerception.themes.slice(0, 3).map((theme: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{theme.theme}</span>
                                <Badge variant="outline" className="ml-2 text-xs">{theme.sentiment}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Desired Perception */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Desired Perception</h3>
                </div>
                {mirror.desiredPerception && (
                  <Card className="p-6 border-primary">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Target Positioning</p>
                        <p className="font-medium text-primary">{mirror.desiredPerception.positioning}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Target Emotional Tone</p>
                        <Badge className="bg-primary">{mirror.desiredPerception.emotionalTone}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Target Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {mirror.desiredPerception.keywords?.slice(0, 8).map((kw: string, idx: number) => (
                            <Badge key={idx} className="text-xs bg-primary">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                      {mirror.desiredPerception.themes?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Target Themes</p>
                          <div className="space-y-2">
                            {mirror.desiredPerception.themes.slice(0, 3).map((theme: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{theme.theme}</span>
                                <Badge className="ml-2 text-xs bg-primary">{theme.sentiment}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Perception Gaps */}
            {mirror.perceptionGaps && mirror.perceptionGaps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Perception Gaps</h3>
                <div className="space-y-3">
                  {mirror.perceptionGaps.map((gap: any, idx: number) => (
                    <Card key={idx} className={`p-4 border ${getGapColor(gap.size)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{gap.gap}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{gap.size}</Badge>
                          <Badge variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                            {gap.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-xs text-muted-foreground">Current State:</span>
                          <p className="text-xs">{gap.currentState}</p>
                        </div>
                        <div>
                          <span className="font-medium text-xs text-muted-foreground">Desired State:</span>
                          <p className="text-xs">{gap.desiredState}</p>
                        </div>
                        {gap.rootCause && (
                          <div>
                            <span className="font-medium text-xs text-muted-foreground">Root Cause:</span>
                            <p className="text-xs">{gap.rootCause}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline" className="text-xs">Difficulty: {gap.difficultyToChange}</Badge>
                          {gap.impactIfUnchanged && (
                            <span className="text-xs text-muted-foreground">{gap.impactIfUnchanged}</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 90-Day Transformation Plan */}
            {mirror.transformationPlan && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">90-Day Transformation Plan</h3>
                </div>

                {/* Quick Wins */}
                {mirror.transformationPlan.quickWins?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="text-sm font-medium">Quick Wins (Week 1-2)</h4>
                    </div>
                    <div className="space-y-2">
                      {mirror.transformationPlan.quickWins.map((win: any, idx: number) => (
                        <div key={idx} className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                          <p className="font-medium text-sm mb-1">{win.action}</p>
                          <p className="text-xs text-muted-foreground">{win.expectedImpact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Phases */}
                <div className="space-y-4">
                  {mirror.transformationPlan.phase1 && (
                    <div>
                      <Badge className="mb-2">Month 1</Badge>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{mirror.transformationPlan.phase1.focus}</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {mirror.transformationPlan.phase1.actions?.map((action: string, idx: number) => (
                            <li key={idx} className="text-xs">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {mirror.transformationPlan.phase2 && (
                    <div>
                      <Badge className="mb-2">Month 2</Badge>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{mirror.transformationPlan.phase2.focus}</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {mirror.transformationPlan.phase2.actions?.map((action: string, idx: number) => (
                            <li key={idx} className="text-xs">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {mirror.transformationPlan.phase3 && (
                    <div>
                      <Badge className="mb-2">Month 3</Badge>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{mirror.transformationPlan.phase3.focus}</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {mirror.transformationPlan.phase3.actions?.map((action: string, idx: number) => (
                            <li key={idx} className="text-xs">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Long-term Shifts */}
                {mirror.transformationPlan.longTermShifts?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium mb-3">Long-term Shifts (6-12 Months)</h4>
                    <div className="space-y-1">
                      {mirror.transformationPlan.longTermShifts.map((shift: string, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {shift}</p>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Progress Tracking */}
            {mirror.progressTracking && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Progress Tracking Framework</h3>
                <div className="space-y-4">
                  {mirror.progressTracking.leadingIndicators?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Leading Indicators (Track Weekly)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mirror.progressTracking.leadingIndicators.map((indicator: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                            <span className="font-medium">{indicator.metric}:</span> {indicator.target}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mirror.progressTracking.laggingIndicators?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Lagging Indicators (Track Monthly)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mirror.progressTracking.laggingIndicators.map((indicator: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                            <span className="font-medium">{indicator.metric}:</span> {indicator.target}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mirror.progressTracking.milestones?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Key Milestones</p>
                      <div className="space-y-1">
                        {mirror.progressTracking.milestones.map((milestone: string, idx: number) => (
                          <p key={idx} className="text-xs text-muted-foreground">• {milestone}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
