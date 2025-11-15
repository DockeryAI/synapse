import * as React from 'react'
import { MirrorLayout } from '@/components/layouts/MirrorLayout'
import { MeasureSection } from '@/components/mirror/measure'
import { IntendSection } from '@/components/mirror/intend'
import { ReimagineSection } from '@/components/mirror/reimagine'
import { ReachSection } from '@/components/mirror/reach'
import { OptimizeSection } from '@/components/mirror/optimize'
import { ReflectSection } from '@/components/mirror/reflect'
import { ActionCenterWidget } from '@/components/action-center/ActionCenterWidget'
import { useMirror } from '@/contexts/MirrorContext'
import { useBrand } from '@/contexts/BrandContext'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Save, Check, AlertCircle, Lock, Zap, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export const MirrorPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { state, updateMeasure, updateIntend, updateReimagine, updateReach, updateOptimize, updateReflect, loading, error } = useMirror()

  const brandId = currentBrand?.id

  // Memoize brandData to prevent infinite re-renders
  const brandData = React.useMemo(() => {
    if (!currentBrand) return null

    console.log('[MirrorPage] Creating brandData from currentBrand:', {
      id: currentBrand.id,
      name: currentBrand.name,
      website: currentBrand.website,
      websiteType: typeof currentBrand.website,
      websiteIsArray: Array.isArray(currentBrand.website),
      hasFullProfileData: !!currentBrand.full_profile_data
    })

    // Ensure website is a string (might be stored as array in some cases)
    let websiteUrl = currentBrand.website
    if (Array.isArray(websiteUrl)) {
      console.warn('[MirrorPage] Website is an array, extracting first element:', websiteUrl)
      websiteUrl = websiteUrl[0] || ''
    }
    if (typeof websiteUrl !== 'string') {
      console.warn('[MirrorPage] Website is not a string, converting:', websiteUrl)
      websiteUrl = String(websiteUrl || '')
    }

    console.log('[MirrorPage] Cleaned website URL:', websiteUrl)

    return {
      id: currentBrand.id,
      name: currentBrand.name,
      industry: currentBrand.industry,
      founded: currentBrand.founded,
      size: currentBrand.size,
      competitors: currentBrand.competitors || [],
      website: websiteUrl,
      location: currentBrand.location,
      target_audience: currentBrand.target_audience,
      full_profile_data: currentBrand.full_profile_data,
      website_analysis: currentBrand.website_analysis,
      services: currentBrand.services,
      products: currentBrand.products,
    }
  }, [currentBrand?.id, currentBrand?.name, currentBrand?.industry, currentBrand?.founded, currentBrand?.size, currentBrand?.competitors, currentBrand?.website, currentBrand?.location, currentBrand?.target_audience, currentBrand?.full_profile_data])

  const [activeSection, setActiveSection] = React.useState('mirror')
  const [hasCompletedUVP, setHasCompletedUVP] = React.useState(false)

  // Check if UVP is completed - poll every 3 seconds to detect completion
  React.useEffect(() => {
    const checkUVPCompletion = async () => {
      if (!brandId) return

      // Check brand_uvps table for completion status
      const { data: uvpData, error: uvpError } = await supabase
        .from('brand_uvps')
        .select('id, is_complete, current_step')
        .eq('brand_id', brandId)
        .maybeSingle()

      // Also check value_statements table as fallback
      const { data: valueData, error: valueError } = await supabase
        .from('value_statements')
        .select('id, is_primary')
        .eq('brand_id', brandId)
        .eq('is_primary', true)
        .maybeSingle()

      // UVP is complete if either table has completed data
      const isComplete =
        (!uvpError && uvpData?.is_complete === true) ||
        (!uvpError && uvpData?.current_step === 'complete') ||
        (!valueError && !!valueData)

      console.log('[MirrorPage] UVP completion check:', {
        uvpData,
        valueData,
        isComplete
      })

      setHasCompletedUVP(isComplete)
    }

    // Check immediately
    checkUVPCompletion()

    // Then check every 3 seconds to detect when UVP is completed
    const intervalId = setInterval(checkUVPCompletion, 3000)

    // Cleanup on unmount
    return () => clearInterval(intervalId)
  }, [brandId])

  // Redirect to onboarding if no brand (with delay to avoid false positives during loading)
  React.useEffect(() => {
    if (!brandId || !brandData) {
      // Wait 500ms before redirecting to ensure it's not just a loading state
      const timeoutId = setTimeout(() => {
        if (!brandId || !brandData) {
          console.log('[MirrorPage] No brand data found after delay, redirecting to onboarding')
          window.location.href = '/onboarding'
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [brandId, brandData])

  // Extract data from context state
  const objectives = state.intend.objectives || []
  const strategy = state.reimagine || {}
  const tactics = state.reach.tactics || []
  const measureData = state.measure

  // Show error if no brand data
  if (!brandId || !brandData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Brand Selected</h2>
          <p className="text-muted-foreground mb-4">Please complete onboarding to continue</p>
          <a href="/onboarding" className="text-primary underline">Go to Onboarding</a>
        </div>
      </div>
    )
  }

  // Scroll to section when activeSection changes
  React.useEffect(() => {
    const element = document.getElementById(activeSection)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeSection])

  const sections = [
    {
      id: 'mirror',
      label: 'Mirror',
      tooltip: 'See where you are — your audience, market, and message today',
      color: 'blue',
      locked: false, // Always unlocked
      subsections: [
        { id: 'market', label: 'Market Position Reality Check' },
        { id: 'customer', label: 'Customer Truth Assessment' },
        { id: 'brand', label: 'Brand Clarity & Fit' },
      ],
    },
    {
      id: 'align',
      label: 'Align',
      tooltip: 'Set your direction — goals, results, and what success looks like',
      color: 'purple',
      locked: !hasCompletedUVP, // Locked until UVP complete
      subsections: [
        { id: 'wwh-framework', label: 'Why, What, How' },
        { id: 'goals', label: 'Goals' },
        { id: 'targets', label: 'Targets' },
      ],
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      tooltip: 'Plan how to get there — the channels, audience, and strategy',
      color: 'green',
      locked: false, // Always unlocked since UVP is inside
      subsections: [
        { id: 'uvp-flow', label: 'Value Proposition' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'channels', label: 'Channels' },
        { id: 'campaigns', label: 'Campaigns' },
        { id: 'content-pillars', label: 'Content Pillars' },
      ],
    },
    {
      id: 'broadcast',
      label: 'Broadcast',
      tooltip: 'Create and launch — your content, campaigns, and offers',
      color: 'orange',
      locked: !hasCompletedUVP, // Locked until UVP complete
      subsections: [
        { id: 'calendar', label: 'Content Calendar' },
        { id: 'campaigns', label: 'Campaign Manager' },
        { id: 'publishing', label: 'Publishing' },
      ],
    },
    {
      id: 'assess',
      label: 'Assess',
      tooltip: 'Reflect on results — measure, learn, and refine what works',
      color: 'teal',
      locked: !hasCompletedUVP, // Locked until UVP complete
      subsections: [
        { id: 'dashboard', label: 'Performance Dashboard' },
        { id: 'insights', label: 'Insights' },
        { id: 'optimization', label: 'Optimization' },
        { id: 'retrospective', label: 'Retrospective' },
      ],
    },
  ]

  // Calculate section completion (MARBA framework)
  const sectionCompletion = React.useMemo(() => ({
    mirror: Object.keys(state.measure).length > 0,
    align: hasCompletedUVP, // Align is complete when UVP is done
    roadmap: (Object.keys(state.reimagine).length > 0 || Object.keys(state.reach).length > 0) && hasCompletedUVP,
    broadcast: false, // Placeholder - will implement later
    assess: (Object.keys(state.optimize).length > 0 || Object.keys(state.reflect).length > 0) && hasCompletedUVP
  }), [state, hasCompletedUVP])

  const completedCount = Object.values(sectionCompletion).filter(Boolean).length

  return (
    <>
      {/* Floating UVP Button - Top Right */}
      {!hasCompletedUVP && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5 duration-500">
          <button
            onClick={() => {
              // Scroll directly to the roadmap section where UVP wizard is located
              const roadmapSection = document.getElementById('roadmap')
              if (roadmapSection) {
                roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-white shadow-2xl transition-all hover:shadow-purple-500/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 animate-pulse" />

            <div className="relative z-10 flex items-center gap-2">
              <Zap className="h-5 w-5 animate-pulse" />
              <div className="text-left">
                <div className="font-bold text-sm leading-tight">Complete Your UVP</div>
                <div className="text-xs opacity-90">5 mins • Unlocks everything</div>
              </div>
            </div>

            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-lg animate-ping opacity-20 bg-purple-400" style={{ animationDuration: '2s' }} />
          </button>
        </div>
      )}

      <MirrorLayout
        sections={sections}
        currentSection={activeSection}
        onSectionChange={setActiveSection}
      >
      <div className="space-y-0">
        {/* MIRROR - See where you are */}
        <section
          id="mirror"
          className="scroll-mt-24 pt-8 pb-16 bg-blue-50/30 dark:bg-blue-950/20"
          style={{ borderBottom: '12px solid rgb(59, 130, 246)' }}
        >
          <MeasureSection
            brandId={brandId}
            brandData={brandData}
            onDataUpdate={updateMeasure}
          />
        </section>

        {/* ALIGN - Set your direction */}
        <section
          id="align"
          className="relative scroll-mt-24 pt-8 pb-16 bg-purple-50/30 dark:bg-purple-950/20"
          style={{ borderBottom: '12px solid rgb(168, 85, 247)' }}
        >
          {/* Align section is always accessible since it contains the UVP wizard */}
          <IntendSection
            brandId={brandId}
            situationData={measureData}
            brandData={state.measure}
          />
        </section>

        {/* ROADMAP - Plan how to get there (combines Reimagine + Reach) */}
        <section
          id="roadmap"
          className="relative scroll-mt-24 pt-8 pb-16 bg-green-50/30 dark:bg-green-950/20"
          style={{ borderBottom: '12px solid rgb(34, 197, 94)' }}
        >
          <div className="space-y-12">
            {/* Strategy & Content Planning - UVP is now the first tab here */}
            <ReimagineSection
              brandId={brandId}
              brandData={brandData}
              objectives={objectives}
              situationAnalysis={measureData}
              competitors={brandData?.competitors || []}
            />

            {/* Channel & Campaign Planning */}
            <ReachSection
              brandId={brandId}
              strategy={strategy}
              objectives={objectives}
              budget={0}
              teamSize={0}
            />
          </div>
        </section>

        {/* BROADCAST - Create and launch (Placeholder) */}
        <section
          id="broadcast"
          className="relative scroll-mt-24 pt-8 pb-16 bg-orange-50/30 dark:bg-orange-950/20"
          style={{ borderBottom: '12px solid rgb(249, 115, 22)' }}
        >
          {!hasCompletedUVP && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-8 max-w-md">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Locked</h3>
                <p className="text-sm text-muted-foreground">Complete your Value Proposition to unlock</p>
              </div>
            </div>
          )}
          <div className={cn(!hasCompletedUVP && "pointer-events-none opacity-50")}>
            <div className="bg-card border rounded-lg p-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
                  <span className="text-3xl">📡</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Broadcast</h2>
                <p className="text-muted-foreground mb-4">
                  Create and launch — your content, campaigns, and offers
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 rounded-full text-sm font-medium">
                  <span>🚧</span>
                  <span>Coming Soon - Content Calendar & Publishing Workflow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ASSESS - Reflect on results (combines Optimize + Reflect) */}
        <section
          id="assess"
          className="relative scroll-mt-24 pt-8 pb-16 bg-teal-50/30 dark:bg-teal-950/20"
        >
          {!hasCompletedUVP && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-8 max-w-md">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Locked</h3>
                <p className="text-sm text-muted-foreground">Complete your Value Proposition to unlock</p>
              </div>
            </div>
          )}
          <div className={cn(!hasCompletedUVP && "pointer-events-none opacity-50")}>
            <div className="space-y-12">
              {/* Action Board & Optimization */}
              <OptimizeSection
                brandId={brandId}
                userId={brandId}
                tactics={tactics}
                pillars={[]}
                industry={state.measure?.industry}
                brandData={state.measure}
              />

              {/* Performance & Insights */}
              <ReflectSection
                objectives={objectives}
                brandId={brandId}
                brandHealth={state.measure.brandHealth}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Action Center Widget - Persistent across all sections */}
      <ActionCenterWidget />
    </MirrorLayout>
    </>
  )
}
