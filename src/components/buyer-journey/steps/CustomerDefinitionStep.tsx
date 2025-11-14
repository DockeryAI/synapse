/**
 * Customer Definition Step
 * Define Ideal Customer Profile (ICP)
 */

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Sparkles, Loader2, Check, Users } from 'lucide-react'
import { useBuyerJourney } from '@/contexts/BuyerJourneyContext'
import type { IdealCustomerProfile } from '@/types/buyer-journey'
import type { CustomerSegment } from '@/types/industry-profile.types'
import { industryRegistry } from '@/data/industries'
import { motion, AnimatePresence } from 'framer-motion'

export const CustomerDefinitionStep: React.FC = () => {
  const { journeyMap, updateICP, uvpData, generateAISuggestions, generateDemographics, isLoading } = useBuyerJourney()

  // Get customer segments from industry profile (defined early so we can use it in state initialization)
  const getCustomerSegments = (): CustomerSegment[] => {
    if (!uvpData?.industry) return []
    const industryProfile = industryRegistry.getById(uvpData.industry)
    return industryProfile?.customerSegments || []
  }

  const customerSegments = getCustomerSegments()

  const [icp, setIcp] = useState<IdealCustomerProfile>(
    journeyMap.ideal_customer_profile || {
      segment_name: '',
      demographics: {
        age_range: '',
        income_range: '',
        location_type: '',
        occupation: '',
        household_size: '',
      },
      psychographics: {
        values: [],
        personality_traits: [],
        lifestyle: [],
        interests: [],
      },
      pain_points: [],
      goals: [],
      buying_triggers: [],
      decision_criteria: [],
    }
  )

  const [hasAutoLoadedDemographics, setHasAutoLoadedDemographics] = useState(false)
  const [isLoadingDemographics, setIsLoadingDemographics] = useState(false)
  // Always show segment selector initially if we have segments available
  const [showSegmentSelector, setShowSegmentSelector] = useState(
    customerSegments.length > 0 && !journeyMap.ideal_customer_profile?.segment_name
  )

  // Update selector visibility when segments or journeyMap changes
  useEffect(() => {
    const shouldShow = customerSegments.length > 0 && !icp.segment_name
    console.log('[CustomerDefinitionStep] Segment selector check:', {
      customerSegmentsCount: customerSegments.length,
      currentSegmentName: icp.segment_name,
      shouldShowSelector: shouldShow,
      uvpIndustry: uvpData?.industry,
    })
    setShowSegmentSelector(shouldShow)
  }, [customerSegments.length, icp.segment_name, uvpData])

  // Auto-save on change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateICP(icp)
    }, 500)
    return () => clearTimeout(timer)
  }, [icp, updateICP])

  // Don't auto-load demographics - let user pick from segments instead
  // This is disabled in favor of the segment selector

  const handleGenerateDemographics = async () => {
    if (!generateDemographics) return

    setIsLoadingDemographics(true)
    try {
      const result = await generateDemographics()
      setIcp(prev => ({
        ...prev,
        segment_name: result.segment_name,
        demographics: {
          ...prev.demographics,
          ...result.demographics,
        },
      }))
    } catch (error) {
      console.error('[CustomerDefinitionStep] Demographics generation failed:', error)
    } finally {
      setIsLoadingDemographics(false)
    }
  }

  const handleSelectSegment = (segment: CustomerSegment) => {
    setIcp(prev => ({
      ...prev,
      segment_name: segment.name,
      demographics: {
        age_range: segment.demographics.ageRange,
        income_range: segment.demographics.incomeRange,
        location_type: segment.demographics.locationType,
        occupation: segment.demographics.occupation,
        household_size: '',
      },
      pain_points: segment.painPoints,
      goals: segment.goals,
      buying_triggers: segment.buyingTriggers,
    }))
    setShowSegmentSelector(false)
  }

  const addListItem = (field: keyof IdealCustomerProfile, value: string) => {
    if (!value.trim()) return
    const currentArray = icp[field] as string[]
    setIcp(prev => ({
      ...prev,
      [field]: [...currentArray, value],
    }))
  }

  const removeListItem = (field: keyof IdealCustomerProfile, index: number) => {
    const currentArray = icp[field] as string[]
    setIcp(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Segment Selector */}
      {showSegmentSelector && customerSegments.length > 0 && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Choose Your Customer Segment</h3>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Select the customer segment that best matches who you serve. We'll auto-fill demographics, pain points, goals, and buying triggers. You can customize everything after selection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customerSegments.map((segment, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectSegment(segment)}
                className="text-left p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{segment.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{segment.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">{segment.demographics.ageRange}</Badge>
                  <Badge variant="secondary" className="text-xs">{segment.demographics.incomeRange}</Badge>
                </div>
              </motion.button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSegmentSelector(false)}
            className="mt-4"
          >
            Skip - I'll define my own segment
          </Button>
        </Card>
      )}

      {/* Pre-defined Segments CTA */}
      {!showSegmentSelector && customerSegments.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Choose from {customerSegments.length} Pre-defined Customer Segments
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                We have industry-specific customer profiles with demographics, pain points, goals, and buying triggers already filled in.
              </p>
              {icp.segment_name && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Currently selected: <strong>{icp.segment_name}</strong>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Button
                type="button"
                onClick={() => setShowSegmentSelector(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                {icp.segment_name ? 'Change Segment' : 'View Segments'}
              </Button>
              {icp.segment_name && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIcp(prev => ({
                      ...prev,
                      segment_name: '',
                      demographics: { age_range: '', income_range: '', location_type: '', occupation: '', household_size: '' },
                      pain_points: [],
                      goals: [],
                      buying_triggers: [],
                    }))
                    setShowSegmentSelector(true)
                  }}
                  className="text-xs"
                >
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Segment Name */}
      {!showSegmentSelector && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="segment_name">Customer Segment Name</Label>
            {customerSegments.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSegmentSelector(true)}
                className="text-xs"
              >
                Change Segment
              </Button>
            )}
          </div>
          <Input
            id="segment_name"
            placeholder="e.g., Busy Homeowners, Growth-Stage Startups"
            value={icp.segment_name}
            onChange={e =>
              setIcp(prev => ({ ...prev, segment_name: e.target.value }))
            }
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Give this customer segment a memorable name
          </p>
        </div>
      )}

      {/* Demographics */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Demographics</h3>
          {uvpData && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateDemographics}
              disabled={isLoadingDemographics || isLoading}
              className="gap-2"
            >
              {isLoadingDemographics ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Suggest
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Describe who your ideal customer is
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age_range">Age Range</Label>
            <Input
              id="age_range"
              placeholder="e.g., 35-55"
              value={icp.demographics.age_range}
              onChange={e =>
                setIcp(prev => ({
                  ...prev,
                  demographics: { ...prev.demographics, age_range: e.target.value },
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="income_range">Income Range</Label>
            <Input
              id="income_range"
              placeholder="e.g., $60k-$100k"
              value={icp.demographics.income_range}
              onChange={e =>
                setIcp(prev => ({
                  ...prev,
                  demographics: {
                    ...prev.demographics,
                    income_range: e.target.value,
                  },
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="location_type">Location Type</Label>
            <Input
              id="location_type"
              placeholder="e.g., Suburban families"
              value={icp.demographics.location_type}
              onChange={e =>
                setIcp(prev => ({
                  ...prev,
                  demographics: {
                    ...prev.demographics,
                    location_type: e.target.value,
                  },
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              placeholder="e.g., Small business owners"
              value={icp.demographics.occupation}
              onChange={e =>
                setIcp(prev => ({
                  ...prev,
                  demographics: {
                    ...prev.demographics,
                    occupation: e.target.value,
                  },
                }))
              }
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Pain Points */}
      <ListInput
        label="Top Pain Points"
        description="What problems or frustrations do they have?"
        items={icp.pain_points}
        onAdd={value => addListItem('pain_points', value)}
        onRemove={index => removeListItem('pain_points', index)}
        placeholder="e.g., Not enough time to handle home maintenance"
        aiField="pain_points"
        generateAISuggestions={generateAISuggestions}
        hasUVPData={!!uvpData}
        isGenerating={isLoading}
      />

      {/* Goals */}
      <ListInput
        label="Goals & Desires"
        description="What are they trying to achieve?"
        items={icp.goals}
        onAdd={value => addListItem('goals', value)}
        onRemove={index => removeListItem('goals', index)}
        placeholder="e.g., Maintain property value without hassle"
        aiField="goals"
        generateAISuggestions={generateAISuggestions}
        hasUVPData={!!uvpData}
        isGenerating={isLoading}
      />

      {/* Buying Triggers */}
      <ListInput
        label="Buying Triggers"
        description="What prompts them to make a purchase?"
        items={icp.buying_triggers}
        onAdd={value => addListItem('buying_triggers', value)}
        onRemove={index => removeListItem('buying_triggers', index)}
        placeholder="e.g., Emergency situation, seasonal maintenance"
        aiField="buying_triggers"
        generateAISuggestions={generateAISuggestions}
        hasUVPData={!!uvpData}
        isGenerating={isLoading}
      />
    </div>
  )
}

// Helper component for list inputs with AI suggestions
const ListInput: React.FC<{
  label: string
  description: string
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
  aiField?: 'pain_points' | 'goals' | 'buying_triggers'
  generateAISuggestions?: (field: 'pain_points' | 'goals' | 'buying_triggers') => Promise<string[]>
  hasUVPData?: boolean
  isGenerating?: boolean
}> = ({
  label,
  description,
  items,
  onAdd,
  onRemove,
  placeholder,
  aiField,
  generateAISuggestions,
  hasUVPData,
  isGenerating
}) => {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input)
      setInput('')
    }
  }

  const handleGenerateAI = React.useCallback(async () => {
    if (!aiField || !generateAISuggestions) return

    setIsLoadingAI(true)
    setShowSuggestions(true)

    try {
      const aiSuggestions = await generateAISuggestions(aiField)
      setSuggestions(aiSuggestions)
    } catch (error) {
      console.error('[ListInput] AI generation failed:', error)
      setSuggestions(['❌ Failed to generate suggestions. Please add manually.'])
    } finally {
      setIsLoadingAI(false)
    }
  }, [aiField, generateAISuggestions])

  // Auto-load AI suggestions on mount
  React.useEffect(() => {
    if (aiField && hasUVPData && generateAISuggestions && !hasAutoLoaded && items.length === 0) {
      console.log('[ListInput] Auto-loading AI suggestions for:', aiField)
      setHasAutoLoaded(true)
      handleGenerateAI()
    }
  }, [aiField, hasUVPData, generateAISuggestions, hasAutoLoaded, items.length, handleGenerateAI])

  const handleSelectSuggestion = (suggestion: string) => {
    // Don't add error messages or items already in list
    if (suggestion.startsWith('❌') || items.includes(suggestion)) return

    onAdd(suggestion)
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s !== suggestion))
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">{label}</h3>
        {aiField && hasUVPData && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerateAI}
            disabled={isLoadingAI || isGenerating}
            className="gap-2"
          >
            {isLoadingAI ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </>
            )}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>

      {/* Manual Input */}
      <div className="flex gap-2 mb-3">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button type="button" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Suggestions
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSuggestions(false)
                  setSuggestions([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {suggestions.map((suggestion, index) => {
                const isError = suggestion.startsWith('❌')
                const isAdded = items.includes(suggestion)

                return (
                  <motion.button
                    key={index}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    disabled={isError || isAdded}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all text-sm
                      ${isError
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 cursor-not-allowed'
                        : isAdded
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-default'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={isError ? 'text-red-600 dark:text-red-400' : ''}>
                        {suggestion}
                      </span>
                      {isAdded && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
          >
            <span className="text-sm">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items added yet
          </p>
        )}
      </div>
    </Card>
  )
}
