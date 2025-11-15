/**
 * Competitive Positioning Canvas Section
 * Post-UVP: Visual positioning map showing you vs. competitors
 * Based on key differentiation dimensions from UVP
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Grid3x3, Sparkles, Lock, AlertCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PositioningAnalysisService } from '@/services/mirror/positioning-analysis'
import { supabase } from '@/lib/supabase'

interface CompetitivePositioningCanvasSectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const CompetitivePositioningCanvasSection: React.FC<CompetitivePositioningCanvasSectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [canvas, setCanvas] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleGenerate = async () => {
    const industry = brandData?.industry || 'Technology'
    const brandName = brandData?.name || 'Your Brand'
    const brandWebsite = brandData?.website

    setIsGenerating(true)
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
        setIsGenerating(false)
        return
      }

      console.log('[CompetitivePositioningCanvasSection] Generating canvas...')
      const result = await PositioningAnalysisService.generatePositioningCanvas(
        uvpData,
        industry,
        brandName,
        brandWebsite
      )

      console.log('[CompetitivePositioningCanvasSection] Canvas generated:', result)
      setCanvas(result)
    } catch (err) {
      console.error('[CompetitivePositioningCanvasSection] Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Canvas generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate when UVP is completed and brand data is available
  React.useEffect(() => {
    if (hasCompletedUVP && brandData?.name && !canvas && !isGenerating && !error) {
      handleGenerate()
    }
  }, [hasCompletedUVP, brandData?.name])

  if (!hasCompletedUVP) {
    return (
      <div className={className}>
        <div className="container py-6 px-6">
          <Card className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Complete Your UVP First</h3>
            <p className="text-muted-foreground">
              Positioning Canvas requires your Value Proposition to be defined.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Positioning Canvas</h2>
            <p className="text-muted-foreground">
              Visual 2x2 map showing your competitive positioning
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : canvas ? 'Refresh' : 'Generate Canvas'}
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {!canvas && !isGenerating && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Grid3x3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Map</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate Canvas" to create your positioning map.
              </p>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Generation
              </Button>
            </div>
          </Card>
        )}

        {canvas && (
          <>
            {/* Positioning Axes */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Positioning Dimensions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Badge className="mb-2">X-Axis</Badge>
                  <h4 className="font-medium mb-1">{canvas.axes?.x?.dimension}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{canvas.axes?.x?.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{canvas.axes?.x?.lowLabel}</span>
                    <span>→</span>
                    <span className="text-muted-foreground">{canvas.axes?.x?.highLabel}</span>
                  </div>
                </div>
                <div>
                  <Badge className="mb-2">Y-Axis</Badge>
                  <h4 className="font-medium mb-1">{canvas.axes?.y?.dimension}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{canvas.axes?.y?.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{canvas.axes?.y?.lowLabel}</span>
                    <span>→</span>
                    <span className="text-muted-foreground">{canvas.axes?.y?.highLabel}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Simplified Positioning Display */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Brand Position</h3>
              {canvas.brandPosition && (
                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">{canvas.brandPosition.name}</h4>
                    <Badge>Your Position</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{canvas.brandPosition.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">{canvas.axes?.x?.dimension}:</span>{' '}
                      <Badge variant="outline">{canvas.brandPosition.xValue}/100</Badge>
                    </div>
                    <div>
                      <span className="font-medium">{canvas.axes?.y?.dimension}:</span>{' '}
                      <Badge variant="outline">{canvas.brandPosition.yValue}/100</Badge>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Competitors */}
            {canvas.competitors && canvas.competitors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Competitor Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {canvas.competitors.slice(0, 6).map((comp: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <h4 className="font-medium mb-2">{comp.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{comp.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <Badge variant="secondary">{canvas.axes?.x?.dimension}: {comp.xValue}</Badge>
                        <Badge variant="secondary">{canvas.axes?.y?.dimension}: {comp.yValue}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* White Space Opportunities */}
            {canvas.whiteSpace && canvas.whiteSpace.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">White Space Opportunities</h3>
                <div className="space-y-3">
                  {canvas.whiteSpace.map((space: any, idx: number) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">{space.zone}</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">{space.description}</p>
                      <div className="text-xs space-y-1">
                        <p><span className="font-medium">Opportunity:</span> {space.opportunity}</p>
                        {space.risk && <p><span className="font-medium">Risk:</span> {space.risk}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Strategic Insights */}
            {canvas.strategicInsights && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Strategic Insights</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Current Position:</p>
                    <p className="text-sm text-muted-foreground">{canvas.strategicInsights.currentPosition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">UVP Alignment:</p>
                    <p className="text-sm text-muted-foreground">{canvas.strategicInsights.uvpAlignment}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Competitive Advantage:</p>
                    <p className="text-sm text-muted-foreground">{canvas.strategicInsights.competitiveAdvantage}</p>
                  </div>
                  {canvas.strategicInsights.recommendations && canvas.strategicInsights.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {canvas.strategicInsights.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
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
