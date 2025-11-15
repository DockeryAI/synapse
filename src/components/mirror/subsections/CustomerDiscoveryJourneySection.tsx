/**
 * Customer Discovery Journey Section (JTBD Framework)
 * Post-UVP: Maps how customers discover and decide to hire you
 * Uses Jobs-to-be-Done framework with UVP context
 */

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Sparkles, Lock, AlertCircle, TrendingUp, Target, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JTBDAnalysisService } from '@/services/mirror/jtbd-analysis'
import { supabase } from '@/lib/supabase'

interface CustomerDiscoveryJourneySectionProps {
  brandId: string
  brandData?: any
  hasCompletedUVP: boolean
  className?: string
}

export const CustomerDiscoveryJourneySection: React.FC<CustomerDiscoveryJourneySectionProps> = ({
  brandId,
  brandData,
  hasCompletedUVP,
  className
}) => {
  const [isMapping, setIsMapping] = React.useState(false)
  const [journey, setJourney] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleMap = async () => {
    const websiteUrl = brandData?.website
    const industry = brandData?.industry || 'Technology'

    if (!websiteUrl) {
      setError('No website URL found. Please add a website to your brand profile.')
      return
    }

    setIsMapping(true)
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
        setIsMapping(false)
        return
      }

      console.log('[CustomerDiscoveryJourneySection] Starting journey mapping...')
      const result = await JTBDAnalysisService.analyzeCustomerJourney(
        brandId,
        websiteUrl,
        uvpData,
        industry
      )

      console.log('[CustomerDiscoveryJourneySection] Journey mapped:', result)
      setJourney(result)
    } catch (err) {
      console.error('[CustomerDiscoveryJourneySection] Mapping failed:', err)
      setError(err instanceof Error ? err.message : 'Journey mapping failed')
    } finally {
      setIsMapping(false)
    }
  }

  // Auto-analyze when UVP is completed and brand data is available
  React.useEffect(() => {
    if (hasCompletedUVP && brandData?.website && !journey && !isMapping && !error) {
      handleMap()
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
              Customer Discovery Journey mapping requires your Value Proposition to be defined.
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
            <h2 className="text-2xl font-bold mb-2">Customer Discovery Journey</h2>
            <p className="text-muted-foreground">
              Map how customers discover, research, and decide to work with you (JTBD Framework)
            </p>
          </div>
          <Button onClick={handleMap} disabled={isMapping}>
            <Sparkles className={`h-4 w-4 mr-2 ${isMapping ? 'animate-spin' : ''}`} />
            {isMapping ? 'Mapping...' : journey ? 'Refresh' : 'Map Journey'}
          </Button>
        </div>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Mapping Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {!journey && !isMapping && !error && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/20 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Map Journey</h3>
              <p className="text-muted-foreground mb-4">
                Click "Map Journey" to analyze your customer's discovery path using JTBD framework.
              </p>
              <Button onClick={handleMap}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Mapping
              </Button>
            </div>
          </Card>
        )}

        {journey && (
          <>
            {/* Job to Be Done */}
            {journey.desiredJourney?.jobToBeDone && (
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold">Customer's Job-to-be-Done</h3>
                </div>
                <p className="text-lg font-medium">{journey.desiredJourney.jobToBeDone}</p>
              </Card>
            )}

            {/* Current Journey Stages */}
            {journey.currentJourney?.stages && journey.currentJourney.stages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Discovery Journey</h3>
                <div className="space-y-3">
                  {journey.currentJourney.stages.map((stage: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge className="mt-1">{idx + 1}</Badge>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{stage.stage}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{stage.customerMindset}</p>
                          <div className="text-xs space-y-1">
                            <p><span className="font-medium">Search:</span> {stage.searchBehavior}</p>
                            <p><span className="font-medium">Touchpoints:</span> {stage.touchpoints?.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Desired Journey Stages */}
            {journey.desiredJourney?.stages && journey.desiredJourney.stages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">UVP-Aligned Journey</h3>
                <div className="space-y-3">
                  {journey.desiredJourney.stages.map((stage: any, idx: number) => (
                    <Card key={idx} className="p-4 border-primary">
                      <div className="flex items-start gap-3">
                        <Badge variant="default" className="mt-1">{idx + 1}</Badge>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{stage.stage}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{stage.customerMindset}</p>
                          <div className="text-xs space-y-1">
                            <p><span className="font-medium">Ideal Search:</span> {stage.searchBehavior}</p>
                            <p><span className="font-medium">Ideal Touchpoints:</span> {stage.touchpoints?.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Transformation Plan */}
            {journey.transformationPlan && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Transformation Roadmap</h3>

                {/* Content Gaps */}
                {journey.transformationPlan.contentGaps?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3">Content Gaps to Address</h4>
                    <div className="space-y-2">
                      {journey.transformationPlan.contentGaps.slice(0, 5).map((gap: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-orange-500 pl-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={gap.priority === 'high' ? 'destructive' : 'default'} className="text-xs">
                              {gap.priority}
                            </Badge>
                            <span className="font-medium text-sm">{gap.gap}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messaging Shifts */}
                {journey.transformationPlan.messagingShifts?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3">Messaging Shifts Needed</h4>
                    <div className="space-y-3">
                      {journey.transformationPlan.messagingShifts.map((shift: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-sm">
                            <p><span className="font-medium">From:</span> {shift.from}</p>
                            <p className="text-primary"><span className="font-medium">To:</span> {shift.to}</p>
                            <p className="text-xs text-muted-foreground mt-1">{shift.rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {journey.transformationPlan.timeline?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Implementation Timeline</h4>
                    <div className="space-y-2">
                      {journey.transformationPlan.timeline.map((phase: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{phase.phase}</span>
                            <Badge variant="outline">{phase.duration}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{phase.expectedOutcome}</p>
                          <div className="flex flex-wrap gap-1">
                            {phase.actions?.slice(0, 3).map((action: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{action}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
