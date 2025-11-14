/**
 * Buyer Journey Context
 * Manages state for the buyer journey wizard and journey map
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  type BuyerJourneyMap,
  type WizardStep,
  type WizardProgress,
  type IdealCustomerProfile,
  type JobsAnalysis,
  type Touchpoint,
  type PainPoint,
  type Opportunity,
  JOURNEY_STAGES,
} from '@/types/buyer-journey'
import { buyerJourneyAI, type EnrichmentContext } from '@/services/buyer-journey-ai.service'
import { industryRegistry } from '@/data/industries'
import { supabase } from '@/lib/supabase'

// ============================================================================
// Context Type
// ============================================================================

interface BuyerJourneyContextType {
  // State
  journeyMap: Partial<BuyerJourneyMap>
  wizardProgress: WizardProgress
  isLoading: boolean
  error: string | null
  uvpData: any | null

  // Journey Map Actions
  updateICP: (icp: IdealCustomerProfile) => void
  updateJobs: (jobs: JobsAnalysis) => void
  addTouchpoint: (touchpoint: Touchpoint) => void
  updateTouchpoint: (id: string, touchpoint: Partial<Touchpoint>) => void
  removeTouchpoint: (id: string) => void
  addPainPoint: (painPoint: PainPoint) => void
  updatePainPoint: (id: string, painPoint: Partial<PainPoint>) => void
  removePainPoint: (id: string) => void
  addOpportunity: (opportunity: Opportunity) => void
  updateOpportunity: (id: string, opportunity: Partial<Opportunity>) => void
  removeOpportunity: (id: string) => void

  // Wizard Flow Actions
  goToStep: (step: WizardStep) => void
  nextStep: () => void
  previousStep: () => void
  completeStep: (step: WizardStep) => void
  resetWizard: () => void

  // Persistence Actions
  saveJourney: () => Promise<void>
  loadJourney: (brandId: string) => Promise<void>

  // UVP Integration
  setUVPData: (data: any) => void
  prePopulateFromUVP: (uvpData: any) => void

  // AI Generation
  generateAISuggestions: (field: 'pain_points' | 'goals' | 'buying_triggers') => Promise<string[]>
  generateDemographics: () => Promise<{ segment_name: string; demographics: any }>
}

const BuyerJourneyContext = createContext<BuyerJourneyContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface BuyerJourneyProviderProps {
  children: ReactNode
  brandId: string
}

export const BuyerJourneyProvider: React.FC<BuyerJourneyProviderProps> = ({
  children,
  brandId,
}) => {
  // State
  const [journeyMap, setJourneyMap] = useState<Partial<BuyerJourneyMap>>({
    brand_id: brandId,
    stages: JOURNEY_STAGES,
    touchpoints: [],
    pain_points: [],
    opportunities: [],
    is_complete: false,
    completed_steps: [],
  })

  const [wizardProgress, setWizardProgress] = useState<WizardProgress>({
    current_step: 'customer-definition',
    completed_steps: [],
    step_data: {},
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uvpData, setUVPData] = useState<any | null>(null)

  // Auto-save timer ref
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Helper: Trigger debounced auto-save
  const triggerAutoSave = useCallback(() => {
    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Auto-save after 1 second of no changes
    saveTimerRef.current = setTimeout(async () => {
      console.log('[BuyerJourney] Auto-saving after field change')
      try {
        // Save to Supabase buyer_journeys table
        const { data: existing } = await supabase
          .from('buyer_journeys')
          .select('id')
          .eq('brand_id', brandId)
          .maybeSingle()

        const journeyRecord = {
          brand_id: brandId,
          journey_map: journeyMap,
          is_complete: journeyMap.is_complete || false,
          completed_steps: journeyMap.completed_steps || [],
        }

        if (existing) {
          await supabase.from('buyer_journeys').update(journeyRecord).eq('id', existing.id)
        } else {
          await supabase.from('buyer_journeys').insert(journeyRecord)
        }
      } catch (err) {
        console.error('[BuyerJourney] Auto-save failed:', err)
      }
    }, 1000)
  }, [brandId, journeyMap])

  // ============================================================================
  // Journey Map Actions
  // ============================================================================

  const updateICP = useCallback((icp: IdealCustomerProfile) => {
    setJourneyMap(prev => ({
      ...prev,
      ideal_customer_profile: icp,
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateJobs = useCallback((jobs: JobsAnalysis) => {
    setJourneyMap(prev => ({
      ...prev,
      jobs_analysis: jobs,
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const addTouchpoint = useCallback((touchpoint: Touchpoint) => {
    setJourneyMap(prev => ({
      ...prev,
      touchpoints: [...(prev.touchpoints || []), touchpoint],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateTouchpoint = useCallback((id: string, updates: Partial<Touchpoint>) => {
    setJourneyMap(prev => ({
      ...prev,
      touchpoints: prev.touchpoints?.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const removeTouchpoint = useCallback((id: string) => {
    setJourneyMap(prev => ({
      ...prev,
      touchpoints: prev.touchpoints?.filter(t => t.id !== id) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const addPainPoint = useCallback((painPoint: PainPoint) => {
    setJourneyMap(prev => ({
      ...prev,
      pain_points: [...(prev.pain_points || []), painPoint],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const updatePainPoint = useCallback((id: string, updates: Partial<PainPoint>) => {
    setJourneyMap(prev => ({
      ...prev,
      pain_points: prev.pain_points?.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const removePainPoint = useCallback((id: string) => {
    setJourneyMap(prev => ({
      ...prev,
      pain_points: prev.pain_points?.filter(p => p.id !== id) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const addOpportunity = useCallback((opportunity: Opportunity) => {
    setJourneyMap(prev => ({
      ...prev,
      opportunities: [...(prev.opportunities || []), opportunity],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateOpportunity = useCallback((id: string, updates: Partial<Opportunity>) => {
    setJourneyMap(prev => ({
      ...prev,
      opportunities: prev.opportunities?.map(o =>
        o.id === id ? { ...o, ...updates } : o
      ) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  const removeOpportunity = useCallback((id: string) => {
    setJourneyMap(prev => ({
      ...prev,
      opportunities: prev.opportunities?.filter(o => o.id !== id) || [],
    }))
    triggerAutoSave()
  }, [triggerAutoSave])

  // ============================================================================
  // Wizard Flow Actions
  // ============================================================================

  const STEP_ORDER: WizardStep[] = [
    'customer-definition',
    'jobs-to-be-done',
    'journey-stages',
    'touchpoints',
    'pain-points',
    'opportunities',
    'review',
  ]

  const goToStep = useCallback((step: WizardStep) => {
    setWizardProgress(prev => ({
      ...prev,
      current_step: step,
    }))
  }, [])

  const nextStep = useCallback(() => {
    setWizardProgress(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.current_step)
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1)
      return {
        ...prev,
        current_step: STEP_ORDER[nextIndex],
      }
    })
  }, [])

  const previousStep = useCallback(() => {
    setWizardProgress(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.current_step)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return {
        ...prev,
        current_step: STEP_ORDER[prevIndex],
      }
    })
  }, [])

  const completeStep = useCallback((step: WizardStep) => {
    setWizardProgress(prev => {
      const updatedCompletedSteps = prev.completed_steps.includes(step)
        ? prev.completed_steps
        : [...prev.completed_steps, step]

      return {
        ...prev,
        completed_steps: updatedCompletedSteps,
      }
    })

    setJourneyMap(prev => ({
      ...prev,
      completed_steps: [...(prev.completed_steps || []), step],
    }))
  }, [])

  const resetWizard = useCallback(() => {
    setJourneyMap({
      brand_id: brandId,
      stages: JOURNEY_STAGES,
      touchpoints: [],
      pain_points: [],
      opportunities: [],
      is_complete: false,
      completed_steps: [],
    })

    setWizardProgress({
      current_step: 'customer-definition',
      completed_steps: [],
      step_data: {},
    })

    setError(null)
  }, [brandId])

  // ============================================================================
  // Persistence Actions
  // ============================================================================

  const saveJourney = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Save to Supabase buyer_journeys table
      const { data: existing } = await supabase
        .from('buyer_journeys')
        .select('id')
        .eq('brand_id', brandId)
        .maybeSingle()

      const journeyRecord = {
        brand_id: brandId,
        journey_map: journeyMap,
        is_complete: journeyMap.is_complete || false,
        completed_steps: journeyMap.completed_steps || [],
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('buyer_journeys')
          .update(journeyRecord)
          .eq('id', existing.id)

        if (updateError) throw updateError
        console.log('[BuyerJourney] Updated journey in database:', existing.id)
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('buyer_journeys')
          .insert(journeyRecord)

        if (insertError) throw insertError
        console.log('[BuyerJourney] Created new journey in database')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save journey'
      setError(errorMessage)
      console.error('[BuyerJourney] Save failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [brandId, journeyMap])

  const loadJourney = useCallback(async (loadBrandId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Load from Supabase buyer_journeys table
      const { data, error } = await supabase
        .from('buyer_journeys')
        .select('*')
        .eq('brand_id', loadBrandId)
        .maybeSingle()

      if (error) throw error

      if (data?.journey_map) {
        setJourneyMap(data.journey_map)
        console.log('[BuyerJourney] Loaded from database:', loadBrandId)
      } else {
        console.log('[BuyerJourney] No saved journey found for:', loadBrandId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load journey'
      setError(errorMessage)
      console.error('[BuyerJourney] Load failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ============================================================================
  // UVP Pre-population
  // ============================================================================

  const prePopulateFromUVP = useCallback(async (data: any) => {
    if (!data) return

    console.log('[BuyerJourney] Pre-populating from UVP data...')

    // Extract industry with fallback
    const industry = data.industry || 'realtor'

    // Store UVP data for AI suggestions (with industry added)
    setUVPData({ ...data, industry })
    setIsLoading(true)

    try {
      // Use AI service to pre-populate
      const icpData = await buyerJourneyAI.prePopulateFromUVP(
        {
          target_customer: data.target_customer || '',
          customer_problem: data.customer_problem || '',
          unique_solution: data.unique_solution || '',
          key_benefit: data.key_benefit || '',
          differentiation: data.differentiation || '',
        },
        industry
      )

      setJourneyMap(prev => ({
        ...prev,
        ideal_customer_profile: {
          segment_name: icpData.segment_name || '',
          demographics: icpData.demographics || {
            age_range: '',
            income_range: '',
            location_type: '',
            occupation: '',
            household_size: '',
          },
          psychographics: icpData.psychographics || {
            values: [],
            personality_traits: [],
            lifestyle: [],
            interests: [],
          },
          pain_points: icpData.pain_points || [],
          goals: icpData.goals || [],
          buying_triggers: icpData.buying_triggers || [],
          decision_criteria: icpData.decision_criteria || [],
        },
      }))

      console.log('[BuyerJourney] Pre-population complete')
    } catch (error) {
      console.error('[BuyerJourney] Pre-population failed:', error)
      setError('Failed to pre-populate from UVP')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // AI Suggestion Generation
  const generateAISuggestions = useCallback(async (
    field: 'pain_points' | 'goals' | 'buying_triggers'
  ): Promise<string[]> => {
    if (!uvpData) {
      throw new Error('UVP data required for AI suggestions. Complete UVP wizard first.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const industry = uvpData.industry || 'realtor'
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
        websiteData: uvpData.website_analysis || uvpData.websiteData,
        brandData: {
          name: uvpData.brand_name || uvpData.name || 'Your Brand',
          website: uvpData.website,
          naicsCode: uvpData.naics_code || uvpData.naicsCode,
        },
      }

      console.log('[BuyerJourney] Generating AI suggestions with full context:', context)

      let suggestions: string[] = []

      switch (field) {
        case 'pain_points':
          suggestions = await buyerJourneyAI.generatePainPoints(context)
          break
        case 'goals':
          suggestions = await buyerJourneyAI.generateGoals(context)
          break
        case 'buying_triggers':
          suggestions = await buyerJourneyAI.generateBuyingTriggers(context)
          break
      }

      return suggestions
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI generation failed'
      setError(errorMessage)
      console.error('[BuyerJourney] AI generation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [uvpData])

  // Generate Demographics with AI
  const generateDemographics = useCallback(async (): Promise<{ segment_name: string; demographics: any }> => {
    if (!uvpData) {
      throw new Error('UVP data required for demographics generation. Complete UVP wizard first.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const industry = uvpData.industry || 'realtor'
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
        websiteData: uvpData.website_analysis || uvpData.websiteData,
        brandData: {
          name: uvpData.brand_name || uvpData.name || 'Your Brand',
          website: uvpData.website,
          naicsCode: uvpData.naics_code || uvpData.naicsCode,
        },
      }

      console.log('[BuyerJourney] Generating demographics with full context:', context)

      // Generate demographics
      const demographics = await buyerJourneyAI.generateDemographics(context)

      // Generate segment name based on target customer
      const targetCustomer = uvpData.target_customer || ''
      const segmentName = targetCustomer || industryProfile?.targetAudience?.split(',')[0]?.trim() || 'Primary Customer Segment'

      return {
        segment_name: segmentName,
        demographics: demographics || {},
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Demographics generation failed'
      setError(errorMessage)
      console.error('[BuyerJourney] Demographics generation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [uvpData])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: BuyerJourneyContextType = {
    // State
    journeyMap,
    wizardProgress,
    isLoading,
    error,
    uvpData,

    // Journey Map Actions
    updateICP,
    updateJobs,
    addTouchpoint,
    updateTouchpoint,
    removeTouchpoint,
    addPainPoint,
    updatePainPoint,
    removePainPoint,
    addOpportunity,
    updateOpportunity,
    removeOpportunity,

    // Wizard Flow Actions
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    resetWizard,

    // Persistence Actions
    saveJourney,
    loadJourney,

    // UVP Integration
    setUVPData,
    prePopulateFromUVP,

    // AI Generation
    generateAISuggestions,
    generateDemographics,
  }

  return (
    <BuyerJourneyContext.Provider value={value}>
      {children}
    </BuyerJourneyContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export const useBuyerJourney = () => {
  const context = useContext(BuyerJourneyContext)
  if (context === undefined) {
    throw new Error('useBuyerJourney must be used within a BuyerJourneyProvider')
  }
  return context
}
