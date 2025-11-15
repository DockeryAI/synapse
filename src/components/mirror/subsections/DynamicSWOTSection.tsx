/**
 * Dynamic SWOT Analysis Section
 * Post-UVP: AI-generated SWOT using all intelligence gathered
 * Updates dynamically as new data becomes available
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutGrid, Sparkles, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SWOTGeneratorService } from '@/services/mirror/swot-generator'
import { supabase } from '@/lib/supabase'

interface DynamicSWOTSectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const DynamicSWOTSection: React.FC<DynamicSWOTSectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [swot, setSwot] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleGenerate = async () => {
    const websiteUrl = brandData?.website
    const industry = brandData?.industry || 'Technology'

    if (!websiteUrl) {
      setError('No website URL found. Please add a website to your brand profile.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Get UVP data (optional for SWOT)
      const { data: uvpData } = await supabase
        .from('value_statements')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_primary', true)
        .maybeSingle()

      console.log('[DynamicSWOTSection] Generating SWOT...')
      const result = await SWOTGeneratorService.generateSWOT(
        brandId,
        websiteUrl,
        industry,
        uvpData || undefined
      )

      console.log('[DynamicSWOTSection] SWOT generated:', result)
      setSwot(result)
    } catch (err) {
      console.error('[DynamicSWOTSection] Generation failed:', err)
      setError(err instanceof Error ? err.message : 'SWOT generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate when UVP is completed and brand data is available
  React.useEffect(() => {
    if (hasCompletedUVP && brandData?.website && !swot && !isGenerating && !error) {
      handleGenerate()
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
              SWOT Analysis is enhanced with your Value Proposition context.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'weakness': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      case 'opportunity': return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      case 'threat': return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
      default: return 'bg-gray-50 dark:bg-gray-950/20'
    }
  }

  return (
    <div className={className}>
      <div className="container py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">SWOT Analysis</h2>
            <p className="text-muted-foreground">
              AI-generated analysis using all gathered intelligence
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : swot ? 'Refresh' : 'Generate SWOT'}
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

        {!swot && !isGenerating && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <LayoutGrid className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate SWOT" to create comprehensive analysis.
              </p>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Generation
              </Button>
            </div>
          </Card>
        )}

        {swot && (
          <>
            {/* Summary */}
            {swot.summary && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <h3 className="font-semibold mb-4">Executive Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300 mb-2">Top Strengths:</p>
                    <ul className="space-y-1">
                      {swot.summary.topStrengths?.map((s: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Biggest Opportunities:</p>
                    <ul className="space-y-1">
                      {swot.summary.biggestOpportunities?.map((o: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground">• {o}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* SWOT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>💪</span> Strengths
                  <Badge>{swot.strengths?.length || 0}</Badge>
                </h3>
                <div className="space-y-3">
                  {swot.strengths?.slice(0, 5).map((item: any, idx: number) => (
                    <Card key={idx} className={`p-4 border ${getCategoryColor('strength')}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <Badge variant="outline" className="text-xs">P{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      {item.impact && (
                        <Badge variant="secondary" className="text-xs">{item.impact} impact</Badge>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>⚠️</span> Weaknesses
                  <Badge>{swot.weaknesses?.length || 0}</Badge>
                </h3>
                <div className="space-y-3">
                  {swot.weaknesses?.slice(0, 5).map((item: any, idx: number) => (
                    <Card key={idx} className={`p-4 border ${getCategoryColor('weakness')}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <Badge variant="outline" className="text-xs">P{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex gap-2">
                        {item.impact && <Badge variant="secondary" className="text-xs">{item.impact} impact</Badge>}
                        {item.effort && <Badge variant="outline" className="text-xs">{item.effort} effort</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>🎯</span> Opportunities
                  <Badge>{swot.opportunities?.length || 0}</Badge>
                </h3>
                <div className="space-y-3">
                  {swot.opportunities?.slice(0, 5).map((item: any, idx: number) => (
                    <Card key={idx} className={`p-4 border ${getCategoryColor('opportunity')}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <Badge variant="outline" className="text-xs">P{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      {item.impact && (
                        <Badge variant="secondary" className="text-xs">{item.impact} impact</Badge>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Threats */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>⚡</span> Threats
                  <Badge>{swot.threats?.length || 0}</Badge>
                </h3>
                <div className="space-y-3">
                  {swot.threats?.slice(0, 5).map((item: any, idx: number) => (
                    <Card key={idx} className={`p-4 border ${getCategoryColor('threat')}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <Badge variant="outline" className="text-xs">P{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex gap-2">
                        {item.impact && <Badge variant="secondary" className="text-xs">{item.impact} impact</Badge>}
                        {item.urgency && <Badge variant="destructive" className="text-xs">{item.urgency} urgency</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            {swot.strategicRecommendations && swot.strategicRecommendations.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Strategic Recommendations</h3>
                <div className="space-y-4">
                  {swot.strategicRecommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rec.priority === 'high' ? 'default' : 'secondary'}>{rec.priority}</Badge>
                        <span className="font-medium">{rec.recommendation}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.rationale}</p>
                      {rec.timeframe && (
                        <p className="text-xs text-muted-foreground">Timeframe: {rec.timeframe}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
