/**
 * Measure Section (Mirror)
 * Redesigned with 3 core diagnostics instead of 9 subsections
 */

import * as React from 'react'
import { MirrorSectionHeader } from '@/components/layouts/MirrorLayout'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// New diagnostic components
import { MirrorHealthDashboard } from '../diagnostics/MirrorHealthDashboard'
import { MarketPositionSection } from '../diagnostics/MarketPositionSection'
import { CustomerTruthSection } from '../diagnostics/CustomerTruthSection'
import { BrandFitSection } from '../diagnostics/BrandFitSection'
import { MirrorMomentSummary } from '../diagnostics/MirrorMomentSummary'

// Services
import { MirrorOrchestratorService } from '@/services/mirror/mirror-orchestrator.service'
import { type MirrorDiagnostic, type BrandData } from '@/types/mirror-diagnostics'

interface MeasureSectionProps {
  brandId: string
  brandData?: any
  onDataUpdate?: (data: any) => void
  className?: string
}

export const MeasureSection: React.FC<MeasureSectionProps> = ({
  brandId,
  brandData,
  onDataUpdate,
  className,
}) => {
  const [diagnostic, setDiagnostic] = React.useState<MirrorDiagnostic | null>(null)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeSection, setActiveSection] = React.useState<string | undefined>(undefined)

  // Auto-analyze ONLY if no existing diagnostic is found
  const [hasCheckedExisting, setHasCheckedExisting] = React.useState(false)

  // Auto-expand Customer Truth Assessment if buyer journey not completed
  React.useEffect(() => {
    if (diagnostic && !(diagnostic as any).has_buyer_journey && !activeSection) {
      console.log('[MeasureSection] Auto-expanding Customer Truth Assessment - no buyer journey')
      setActiveSection('customer')
    }
  }, [diagnostic])

  // Try to load existing diagnostic on mount FIRST
  React.useEffect(() => {
    const checkAndLoad = async () => {
      if (brandId && !diagnostic && !isAnalyzing && !hasCheckedExisting) {
        console.log('[MeasureSection] Checking for existing diagnostic...')
        setHasCheckedExisting(true)

        // Try to load existing diagnostic
        const existingFound = await loadExistingDiagnostic()

        // Only auto-run if no existing diagnostic was found
        if (!existingFound && brandData?.name && brandData?.industry) {
          console.log('[MeasureSection] No existing diagnostic - auto-running for new brand...')
          setTimeout(() => {
            runDiagnostic()
          }, 500)
        }
      }
    }

    checkAndLoad()
  }, [brandId, brandData?.name, brandData?.industry, hasCheckedExisting])

  const loadExistingDiagnostic = async () => {
    try {
      const existing = await MirrorOrchestratorService.loadLatestDiagnostic(brandId)
      if (existing) {
        console.log('[MeasureSection] Loaded existing diagnostic from:', existing.analyzed_at)
        setDiagnostic(existing)
        setHasCheckedExisting(true)
        return true
      }
      return false
    } catch (err) {
      console.error('[MeasureSection] Failed to load existing diagnostic:', err)
      return false
    }
  }

  const runDiagnostic = async () => {
    if (!brandData?.name || !brandData?.industry) {
      setError('Brand name and industry are required to run diagnostic')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Clean up brand data - remove extra whitespace and newlines
      const brandDataForAnalysis: BrandData = {
        name: brandData.name?.trim().replace(/\s+/g, ' ') || '',
        industry: brandData.industry?.trim().replace(/\s+/g, ' ') || '',
        location: brandData.location?.trim() || undefined,
        website: brandData.website?.trim() || undefined,
        competitors: brandData.competitors,
        target_audience: brandData.target_audience,
      }

      console.log('[MeasureSection] Running full diagnostic...')
      const result = await MirrorOrchestratorService.runFullDiagnostic(
        brandId,
        brandDataForAnalysis
      )

      setDiagnostic(result)
      onDataUpdate?.(result)

      console.log('[MeasureSection] Diagnostic complete:', result)

      // Auto-save session after diagnostic completes
      if (brandData?.name) {
        const { SessionService } = await import('@/services/session/session.service')
        const sessionName = brandData.name
        const urlSlug = brandData.website?.replace(/https?:\/\//, '').replace(/\//g, '-') || brandData.name.toLowerCase().replace(/\s+/g, '-')

        await SessionService.saveSession({
          brandId,
          sessionName,
          urlSlug,
          mirrorState: result,
          uvpState: null,
        })
        console.log('[MeasureSection] Session auto-saved:', sessionName)
      }
    } catch (err) {
      console.error('[MeasureSection] Diagnostic failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze brand. Please try again.'
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRefresh = () => {
    setDiagnostic(null)
    runDiagnostic()
  }

  const handleViewSection = (section: 'market' | 'customer' | 'brand') => {
    setActiveSection(section)
  }

  // Listen for section changes from sidebar
  React.useEffect(() => {
    const handleSidebarClick = (e: CustomEvent) => {
      const sectionId = e.detail.sectionId
      if (['market', 'customer', 'brand'].includes(sectionId)) {
        setActiveSection(sectionId)
      }
    }

    window.addEventListener('mirrorSubsectionClick' as any, handleSidebarClick)
    return () => {
      window.removeEventListener('mirrorSubsectionClick' as any, handleSidebarClick)
    }
  }, [])

  return (
    <div className={className}>
      <MirrorSectionHeader
        title="Mirror"
        description="The honest truth about where you stand — 3 diagnostics that matter"
        badge={<span className="text-xs">AI-Powered Reality Check</span>}
        actions={
          diagnostic && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          )
        }
      />

      <div className="container max-w-7xl mx-auto px-6 mt-6 space-y-6">
        {/* Loading State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div className="text-lg font-semibold">Analyzing Your Brand...</div>
                <p className="text-sm text-muted-foreground max-w-md">
                  We're discovering your competitors, mining customer reviews, analyzing your
                  market position, and checking messaging consistency across all touchpoints.
                </p>
                <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isAnalyzing && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-900">Analysis Failed</div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={runDiagnostic}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Data State - manual trigger required */}
        {!diagnostic && !isAnalyzing && !error && brandData?.name && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-lg font-semibold mb-2">Ready to Analyze Your Brand</div>
              <p className="text-sm text-muted-foreground mb-4">
                Run your first Mirror diagnostic to discover your competitive position, customer truth, and brand clarity.
              </p>
              <Button onClick={runDiagnostic} size="lg">
                Run Brand Diagnostic
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Waiting for brand data */}
        {!diagnostic && !isAnalyzing && !error && !brandData?.name && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-lg font-semibold mb-2">Waiting for Brand Information</div>
              <p className="text-sm text-muted-foreground">
                Please provide your brand name and industry in the onboarding to continue.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Diagnostic Results */}
        {diagnostic && !isAnalyzing && (
          <>
            {/* Health Dashboard */}
            <MirrorHealthDashboard diagnostic={diagnostic} onViewSection={handleViewSection} />

            {/* Three Core Diagnostics */}
            <Accordion
              type="single"
              collapsible
              value={activeSection}
              onValueChange={setActiveSection}
              className="space-y-4"
            >
              <AccordionItem id="market" value="market" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-lg font-semibold">Market Position Reality Check</div>
                      <div className="text-sm text-muted-foreground">
                        Where you stand vs competitors
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-6 pb-4">
                  <MarketPositionSection
                    data={diagnostic.market_position_data}
                    score={diagnostic.market_position_score}
                    hasCompletedUVP={diagnostic.has_completed_uvp}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem id="customer" value="customer" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-lg font-semibold">Customer Truth Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        Who really buys and why
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-6 pb-4">
                  <CustomerTruthSection
                    data={diagnostic.customer_truth_data}
                    score={diagnostic.customer_match_score}
                    hasCompletedUVP={diagnostic.has_completed_uvp}
                    hasBuyerJourney={(diagnostic as any).has_buyer_journey}
                    brandId={brandId}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem id="brand" value="brand" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-lg font-semibold">Brand Clarity & Fit</div>
                      <div className="text-sm text-muted-foreground">
                        Message consistency & clarity
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-6 pb-4">
                  <BrandFitSection
                    data={diagnostic.brand_fit_data}
                    score={diagnostic.brand_clarity_score}
                    hasCompletedUVP={diagnostic.has_completed_uvp}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Critical Gaps Summary */}
            <MirrorMomentSummary gaps={diagnostic.critical_gaps} />
          </>
        )}
      </div>
    </div>
  )
}
