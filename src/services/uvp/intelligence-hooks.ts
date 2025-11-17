/**
 * Intelligence Integration Hooks for UVP Wizard
 *
 * React hooks for integrating AI-discovered business intelligence
 * into the UVP wizard, enabling auto-population and validation.
 *
 * Created: 2025-11-15
 */

import * as React from 'react'
import type { DeepContext } from '@/types/synapse/deepContext.types'
import type { UVP } from '@/types/uvp-wizard'
import {
  populateFromIntelligence,
  type UVPIntelligenceData,
  getConfidenceLevel,
  isFieldAutoPopulated,
  getFieldConfidence
} from './IntelligenceAutoPopulator'

/**
 * Hook to manage intelligence data state
 */
export function useIntelligenceData() {
  const [intelligenceData, setIntelligenceData] = React.useState<UVPIntelligenceData | null>(null)
  const [isApplyingIntelligence, setIsApplyingIntelligence] = React.useState(false)

  /**
   * Apply intelligence from DeepContext to populate UVP
   */
  const applyIntelligence = React.useCallback(async (
    context: DeepContext,
    onPopulated?: (uvp: Partial<UVP>) => void
  ) => {
    setIsApplyingIntelligence(true)

    try {
      console.log('[useIntelligenceData] Applying intelligence from DeepContext...')

      const data = await populateFromIntelligence(context)

      setIntelligenceData(data)

      // Notify parent with populated UVP
      if (onPopulated) {
        onPopulated(data.uvp)
      }

      console.log('[useIntelligenceData] Intelligence applied successfully')
      console.log('[useIntelligenceData] Populated fields:', Object.keys(data.uvp))

      return data
    } catch (error) {
      console.error('[useIntelligenceData] Failed to apply intelligence:', error)
      throw error
    } finally {
      setIsApplyingIntelligence(false)
    }
  }, [])

  /**
   * Clear auto-populated data
   */
  const clearAutoPopulated = React.useCallback(() => {
    console.log('[useIntelligenceData] Clearing auto-populated data')
    setIntelligenceData(null)
  }, [])

  /**
   * Check if a field is auto-populated
   */
  const isFieldAIDetected = React.useCallback((field: keyof UVP): boolean => {
    return isFieldAutoPopulated(intelligenceData, field)
  }, [intelligenceData])

  /**
   * Get confidence for a field
   */
  const getFieldConfidenceScore = React.useCallback((field: keyof UVP): number => {
    return getFieldConfidence(intelligenceData, field)
  }, [intelligenceData])

  /**
   * Get confidence level label
   */
  const getFieldConfidenceLevel = React.useCallback((field: keyof UVP): 'high' | 'medium' | 'low' => {
    const confidence = getFieldConfidence(intelligenceData, field)
    return getConfidenceLevel(confidence)
  }, [intelligenceData])

  return {
    intelligenceData,
    isApplyingIntelligence,
    applyIntelligence,
    clearAutoPopulated,
    isFieldAIDetected,
    getFieldConfidenceScore,
    getFieldConfidenceLevel
  }
}

/**
 * Hook for validation mode workflow
 */
export function useValidationMode(intelligenceData: UVPIntelligenceData | null) {
  const [validationState, setValidationState] = React.useState<Record<string, 'pending' | 'accepted' | 'rejected' | 'edited'>>({})

  /**
   * Accept an AI suggestion
   */
  const acceptSuggestion = React.useCallback((field: keyof UVP) => {
    setValidationState(prev => ({
      ...prev,
      [field]: 'accepted'
    }))
    console.log('[ValidationMode] Accepted:', field)
  }, [])

  /**
   * Reject an AI suggestion
   */
  const rejectSuggestion = React.useCallback((field: keyof UVP) => {
    setValidationState(prev => ({
      ...prev,
      [field]: 'rejected'
    }))
    console.log('[ValidationMode] Rejected:', field)
  }, [])

  /**
   * Mark field as edited by user
   */
  const markAsEdited = React.useCallback((field: keyof UVP) => {
    setValidationState(prev => ({
      ...prev,
      [field]: 'edited'
    }))
    console.log('[ValidationMode] Edited:', field)
  }, [])

  /**
   * Get validation status for field
   */
  const getValidationStatus = React.useCallback((field: keyof UVP): 'pending' | 'accepted' | 'rejected' | 'edited' | null => {
    if (!intelligenceData || !isFieldAutoPopulated(intelligenceData, field)) {
      return null
    }
    return validationState[field] || 'pending'
  }, [intelligenceData, validationState])

  /**
   * Get validation statistics
   */
  const getValidationStats = React.useCallback(() => {
    if (!intelligenceData) return null

    const autoPopulatedFields = Object.keys(intelligenceData.autoPopulated).filter(
      key => intelligenceData.autoPopulated[key as keyof typeof intelligenceData.autoPopulated]
    )

    const stats = {
      total: autoPopulatedFields.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      edited: 0
    }

    autoPopulatedFields.forEach(field => {
      const status = validationState[field] || 'pending'
      stats[status]++
    })

    return stats
  }, [intelligenceData, validationState])

  return {
    validationState,
    acceptSuggestion,
    rejectSuggestion,
    markAsEdited,
    getValidationStatus,
    getValidationStats
  }
}
