/**
 * Simplified Journey Context
 * Manages state for the 4-step buyer journey wizard
 * Simpler, more focused than the full BuyerJourneyContext
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import {
  type CustomerPersona,
  type SimpleStageDetails,
  type FrictionPoint,
  type ActionItem,
  type SimplifiedJourneyMap,
  type SimplifiedWizardStep,
  SIMPLIFIED_JOURNEY_STAGES,
} from '@/types/buyer-journey'
import { supabase } from '@/lib/supabase'
import { buyerJourneyAI, type EnrichmentContext } from '@/services/buyer-journey-ai.service'
import { industryRegistry } from '@/data/industries'

// ============================================================================
// Context Type
// ============================================================================

interface SimplifiedJourneyContextType {
  // State
  currentStep: SimplifiedWizardStep
  selectedPersona: CustomerPersona | null
  stages: SimpleStageDetails[]
  frictionPoints: FrictionPoint[]
  actionItems: ActionItem[]
  isLoading: boolean
  error: string | null
  uvpData: any | null

  // Actions
  setPersona: (persona: CustomerPersona) => void
  updateStages: (stages: SimpleStageDetails[]) => void
  updateFrictionPoints: (frictionPoints: FrictionPoint[]) => void
  toggleActionItem: (itemId: string) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: SimplifiedWizardStep) => void

  // Persistence
  saveJourney: () => Promise<void>
  loadJourney: (brandId: string) => Promise<void>

  // Export
  downloadJourneyMap: () => void
}

const SimplifiedJourneyContext = createContext<SimplifiedJourneyContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface SimplifiedJourneyProviderProps {
  children: ReactNode
  brandId: string
}

export const SimplifiedJourneyProvider: React.FC<SimplifiedJourneyProviderProps> = ({
  children,
  brandId,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<SimplifiedWizardStep>('customer')
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null)
  const [stages, setStages] = useState<SimpleStageDetails[]>(
    SIMPLIFIED_JOURNEY_STAGES.map((s) => ({ ...s }))
  )
  const [frictionPoints, setFrictionPoints] = useState<FrictionPoint[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uvpData, setUVPData] = useState<any | null>(null)

  // Load UVP data on mount
  useEffect(() => {
    const loadUVPData = async () => {
      try {
        console.log('[SimplifiedJourney] Loading UVP data for brand:', brandId)

        // Load brand data
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('name, industry, website')
          .eq('id', brandId)
          .single()

        if (brandError) throw brandError

        // Load UVP data from brand_uvps table
        const { data: uvpRecord, error: uvpError } = await supabase
          .from('brand_uvps')
          .select('*')
          .eq('brand_id', brandId)
          .maybeSingle()

        // UVP record might not exist yet, that's ok
        if (uvpError && uvpError.code !== 'PGRST116') {
          console.error('[SimplifiedJourney] Error loading UVP:', uvpError)
        }

        if (uvpRecord) {
          // Combine brand data with UVP data
          const enrichedUVPData = {
            target_customer: uvpRecord.target_customer,
            customer_problem: uvpRecord.customer_problem,
            unique_solution: uvpRecord.unique_solution,
            key_benefit: uvpRecord.key_benefit,
            differentiation: uvpRecord.differentiation,
            brand_name: brandData?.name,
            website: brandData?.website,
            industry: brandData?.industry,
            website_analysis: uvpRecord.website_analysis,
          }
          setUVPData(enrichedUVPData)
          console.log('[SimplifiedJourney] UVP data loaded:', enrichedUVPData)
        } else {
          console.warn('[SimplifiedJourney] No UVP data found for brand - user needs to complete UVP wizard first')
        }
      } catch (err) {
        console.error('[SimplifiedJourney] Failed to load UVP data:', err)
      }
    }

    loadUVPData()
  }, [brandId])

  // ============================================================================
  // Actions
  // ============================================================================

  const setPersona = useCallback(async (persona: CustomerPersona) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[SimplifiedJourney] 🎯 setPersona called with:', persona.name)
    console.log('[SimplifiedJourney] Original persona pain points:', persona.pain_points)
    console.log('[SimplifiedJourney] Original persona goals:', persona.goals)
    console.log('[SimplifiedJourney] uvpData available?', !!uvpData)
    console.log('[SimplifiedJourney] uvpData:', uvpData)

    // IMMEDIATELY set the persona for instant UI feedback
    setSelectedPersona(persona)
    console.log('[SimplifiedJourney] ✅ Persona set immediately in state for UI feedback')

    // If we have UVP data, enhance the persona with brand-specific pain points
    if (uvpData) {
      try {
        setIsLoading(true)
        console.log('[SimplifiedJourney] 🔄 Now enhancing persona with UVP data in background...')

        const industry = uvpData.industry || 'Professional Services'
        const industryProfile = industryRegistry.getById(industry)

        const context: EnrichmentContext = {
          uvpData: {
            target_customer: uvpData.target_customer || '',
            customer_problem: uvpData.customer_problem || '',
            unique_solution: uvpData.unique_solution || '',
            key_benefit: uvpData.key_benefit || '',
            differentiation: uvpData.differentiation || '',
          },
          industry,
          industryProfile,
          websiteData: uvpData.website_analysis,
          brandData: {
            name: uvpData.brand_name || 'Your Brand',
            website: uvpData.website,
          },
        }

        // Generate brand-specific pain points
        console.log('[SimplifiedJourney] 🤖 Calling AI to generate brand-specific pain points...')
        const brandPainPoints = await buyerJourneyAI.generatePainPoints(context)
        console.log('[SimplifiedJourney] ✅ AI returned pain points:', brandPainPoints)

        console.log('[SimplifiedJourney] 🤖 Calling AI to generate brand-specific goals...')
        const brandGoals = await buyerJourneyAI.generateGoals(context)
        console.log('[SimplifiedJourney] ✅ AI returned goals:', brandGoals)

        // Create enhanced persona with brand-specific data
        const enhancedPersona: CustomerPersona = {
          ...persona,
          pain_points: brandPainPoints.length > 0 ? brandPainPoints : persona.pain_points,
          goals: brandGoals.length > 0 ? brandGoals : persona.goals,
        }

        console.log('[SimplifiedJourney] 📝 Setting enhanced persona in state...')
        console.log('[SimplifiedJourney] Enhanced persona object:', {
          name: enhancedPersona.name,
          pain_points: enhancedPersona.pain_points,
          goals: enhancedPersona.goals,
        })
        setSelectedPersona(enhancedPersona)
        console.log('[SimplifiedJourney] ✅ Persona enhanced and set in state!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Auto-generate friction points based on enhanced persona
        generateFrictionPointsForPersona(enhancedPersona)
      } catch (err) {
        console.error('[SimplifiedJourney] ❌ Failed to enhance persona:', err)
        console.error('[SimplifiedJourney] Error details:', err)
        // Fallback to original persona
        console.log('[SimplifiedJourney] ⚠️ Falling back to original template persona')
        setSelectedPersona(persona)
        generateFrictionPointsForPersona(persona)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      } finally {
        setIsLoading(false)
      }
    } else {
      // No UVP data, use persona as-is
      console.warn('[SimplifiedJourney] ⚠️ No UVP data available - cannot enhance persona')
      console.log('[SimplifiedJourney] Persona will show generic pain points/goals from template')
      console.log('[SimplifiedJourney] User needs to complete UVP wizard first for brand-specific content')
      setSelectedPersona(persona)
      generateFrictionPointsForPersona(persona)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
  }, [uvpData])

  const updateStages = useCallback((updatedStages: SimpleStageDetails[]) => {
    setStages(updatedStages)
  }, [])

  const updateFrictionPoints = useCallback((updatedFrictionPoints: FrictionPoint[]) => {
    setFrictionPoints(updatedFrictionPoints)
  }, [])

  const toggleActionItem = useCallback((itemId: string) => {
    setActionItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }, [])

  const nextStep = useCallback(() => {
    const steps: SimplifiedWizardStep[] = ['customer', 'journey', 'friction', 'action']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }, [currentStep])

  const previousStep = useCallback(() => {
    const steps: SimplifiedWizardStep[] = ['customer', 'journey', 'friction', 'action']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }, [currentStep])

  const goToStep = useCallback((step: SimplifiedWizardStep) => {
    setCurrentStep(step)
  }, [])

  // ============================================================================
  // Friction Point Generation (Mock for MVP)
  // ============================================================================

  const generateFrictionPointsForPersona = (persona: CustomerPersona) => {
    // Generate 5-7 friction points based on persona pain points
    const generatedFriction: FrictionPoint[] = persona.pain_points.slice(0, 3).map((pain, index) => ({
      id: `friction-${index}`,
      stage: ['discover', 'research', 'decide'][index] as any,
      description: pain,
      suggested_fix: `Address this by improving ${['discovery content', 'information clarity', 'trust signals'][index]}`,
      source: 'ai' as const,
      priority: 'uncategorized' as const,
    }))

    // Add a couple more generic ones
    generatedFriction.push(
      {
        id: 'friction-buy-process',
        stage: 'buy',
        description: 'Checkout process too complicated or time-consuming',
        suggested_fix: 'Simplify purchase flow and reduce steps',
        source: 'analytics',
        priority: 'uncategorized',
      },
      {
        id: 'friction-love-followup',
        stage: 'love',
        description: 'No follow-up or engagement after purchase',
        suggested_fix: 'Implement automated follow-up sequence',
        source: 'reviews',
        priority: 'uncategorized',
      }
    )

    setFrictionPoints(generatedFriction)
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  const saveJourney = useCallback(async () => {
    if (!selectedPersona) return

    setIsLoading(true)
    setError(null)

    try {
      const journeyMap: SimplifiedJourneyMap = {
        id: crypto.randomUUID(),
        brand_id: brandId,
        selected_persona: selectedPersona,
        stages,
        friction_points: frictionPoints,
        action_items: actionItems,
        is_complete: currentStep === 'action',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Check if a journey already exists for this brand
      const { data: existing, error: checkError } = await supabase
        .from('buyer_journeys')
        .select('id')
        .eq('brand_id', brandId)
        .maybeSingle()

      // Handle errors other than "not found"
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        // Update existing journey
        const { error: updateError } = await supabase
          .from('buyer_journeys')
          .update({
            journey_map: journeyMap,
            is_complete: journeyMap.is_complete,
            updated_at: new Date().toISOString(),
          })
          .eq('brand_id', brandId)

        if (updateError) throw updateError
        console.log('[SimplifiedJourney] Journey updated successfully')
      } else {
        // Insert new journey
        const { error: insertError } = await supabase
          .from('buyer_journeys')
          .insert({
            brand_id: brandId,
            journey_map: journeyMap,
            is_complete: journeyMap.is_complete,
          })

        if (insertError) throw insertError
        console.log('[SimplifiedJourney] Journey created successfully')
      }
    } catch (err) {
      console.error('[SimplifiedJourney] Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save journey')
    } finally {
      setIsLoading(false)
    }
  }, [brandId, selectedPersona, stages, frictionPoints, actionItems, currentStep])

  const loadJourney = useCallback(async (loadBrandId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: loadError } = await supabase
        .from('buyer_journeys')
        .select('journey_map')
        .eq('brand_id', loadBrandId)
        .single()

      if (loadError) throw loadError

      if (data?.journey_map) {
        const map = data.journey_map as SimplifiedJourneyMap
        setSelectedPersona(map.selected_persona)
        setStages(map.stages)
        setFrictionPoints(map.friction_points)
        setActionItems(map.action_items)
      }

      console.log('[SimplifiedJourney] Journey loaded successfully')
    } catch (err) {
      console.error('[SimplifiedJourney] Load failed:', err)
      // Not a critical error - just means no journey exists yet
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ============================================================================
  // Export
  // ============================================================================

  const downloadJourneyMap = useCallback(() => {
    if (!selectedPersona) return

    const journeyData = {
      customer: selectedPersona.name,
      description: selectedPersona.quick_description,
      journey_stages: stages.map((s) => ({
        stage: s.label,
        key_concern: s.key_concern,
      })),
      friction_points: frictionPoints.map((f) => ({
        stage: f.stage,
        problem: f.description,
        fix: f.suggested_fix,
        priority: f.priority,
      })),
      action_items: frictionPoints
        .filter((f) => f.priority === 'fix-now')
        .slice(0, 3)
        .map((f, i) => ({
          priority: i + 1,
          action: f.suggested_fix,
          stage: f.stage,
        })),
    }

    const blob = new Blob([JSON.stringify(journeyData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buyer-journey-${selectedPersona.name.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('[SimplifiedJourney] Journey map downloaded')
  }, [selectedPersona, stages, frictionPoints])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: SimplifiedJourneyContextType = {
    currentStep,
    selectedPersona,
    stages,
    frictionPoints,
    actionItems,
    isLoading,
    error,
    uvpData,
    setPersona,
    updateStages,
    updateFrictionPoints,
    toggleActionItem,
    nextStep,
    previousStep,
    goToStep,
    saveJourney,
    loadJourney,
    downloadJourneyMap,
  }

  return (
    <SimplifiedJourneyContext.Provider value={value}>
      {children}
    </SimplifiedJourneyContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export const useSimplifiedJourney = () => {
  const context = useContext(SimplifiedJourneyContext)
  if (!context) {
    throw new Error('useSimplifiedJourney must be used within SimplifiedJourneyProvider')
  }
  return context
}
