/**
 * Smart Picks Container Component
 *
 * Main component that:
 * - Generates smart picks from DeepContext
 * - Enhances picks with product recommendations
 * - Displays grid of SmartPickCards
 * - Handles pick selection and preview
 * - Provides fallback to Content Mixer
 *
 * Created: 2025-11-15
 * Updated: 2025-11-26 - Added product-enhanced picks
 */

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle, Lightbulb, Zap, Package, Eye, EyeOff, Target } from 'lucide-react'
import type { DeepContext } from '@/types/synapse/deepContext.types'
import type { SmartPick, CampaignType } from '@/types/smart-picks.types'
import type { CompleteUVP } from '@/types/uvp-flow.types'
import { generateSmartPicks } from '@/services/campaign/SmartPickGenerator'
import { enhanceSmartPicksWithProducts, type ProductEnhancedSmartPick } from '@/services/product-marketing/product-smart-pick-enhancer.service'
import { scorePicksAgainstUVP, filterByRelevance, type ScoredSmartPick } from '@/services/campaign/uvp-relevance-scorer'
import { SmartPickCard } from './SmartPickCard'
import { QuickPreview } from './QuickPreview'
import { Badge } from '@/components/ui/badge'

export interface SmartPicksProps {
  /** Deep context with business intelligence */
  context: DeepContext

  /** Brand ID for product recommendations */
  brandId?: string

  /** Optional filter by campaign type */
  campaignType?: CampaignType

  /** Callback when user wants to generate a campaign */
  onGenerateCampaign: (pick: SmartPick | ProductEnhancedSmartPick | ScoredSmartPick) => void

  /** Callback when user wants to use Content Mixer instead */
  onSwitchToMixer?: () => void

  /** Maximum number of picks to show */
  maxPicks?: number

  /** Enable product-enhanced picks */
  enableProductPicks?: boolean

  /** UVP data for relevance scoring (Phase D - Item #31) */
  uvp?: CompleteUVP | null

  /** Enable UVP-based filtering (<30% hidden) */
  enableUVPFiltering?: boolean

  /** Minimum relevance threshold (default 30%) */
  minRelevanceThreshold?: number
}

export function SmartPicks({
  context,
  brandId,
  campaignType,
  onGenerateCampaign,
  onSwitchToMixer,
  maxPicks = 5,
  enableProductPicks = true,
  uvp = null,
  enableUVPFiltering = true,
  minRelevanceThreshold = 30
}: SmartPicksProps) {
  const [picks, setPicks] = useState<(SmartPick | ProductEnhancedSmartPick)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewPick, setPreviewPick] = useState<SmartPick | ProductEnhancedSmartPick | ScoredSmartPick | null>(null)
  const [showAllPicks, setShowAllPicks] = useState(false) // "Show all" toggle for power users

  // Score picks against UVP and filter
  const { scoredPicks, relevantPicks, filteredPicks } = useMemo(() => {
    if (!uvp || !enableUVPFiltering) {
      // No UVP or filtering disabled - show all picks
      return {
        scoredPicks: picks.map(p => ({ ...p, uvpRelevance: { pickId: p.id, relevanceScore: 100, reasoning: [], matchedAspects: { targetCustomer: 100, painPoints: 100, transformation: 100, uniqueSolution: 100, keyBenefit: 100 }, isRelevant: true } })) as ScoredSmartPick[],
        relevantPicks: picks as any[],
        filteredPicks: [] as ScoredSmartPick[],
      }
    }

    const scored = scorePicksAgainstUVP(picks as SmartPick[], uvp)
    const { relevant, filtered } = filterByRelevance(scored, minRelevanceThreshold)

    return {
      scoredPicks: scored,
      relevantPicks: relevant,
      filteredPicks: filtered,
    }
  }, [picks, uvp, enableUVPFiltering, minRelevanceThreshold])

  // Get the picks to display based on show all toggle
  const displayPicks = showAllPicks ? scoredPicks : relevantPicks

  // Generate picks on mount
  useEffect(() => {
    async function generate() {
      try {
        setLoading(true)
        setError(null)

        console.log('[SmartPicks] Generating picks for:', context.business.profile.name)

        const result = await generateSmartPicks(context, campaignType, {
          maxPicks,
          minConfidence: 0.6,
          preferTimely: true,
          includePreview: true
        })

        console.log(`[SmartPicks] Generated ${result.picks.length} picks in ${result.metadata.generationTimeMs}ms`)

        // Enhance with product recommendations if enabled and brandId is available
        if (enableProductPicks && brandId) {
          console.log('[SmartPicks] Enhancing with product recommendations...')
          const enhancedPicks = await enhanceSmartPicksWithProducts(brandId, result.picks, context)
          console.log(`[SmartPicks] Enhanced to ${enhancedPicks.length} picks with product recommendations`)
          setPicks(enhancedPicks)
        } else {
          setPicks(result.picks)
        }
      } catch (err) {
        console.error('[SmartPicks] Generation failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate picks')
      } finally {
        setLoading(false)
      }
    }

    generate()
  }, [context, brandId, campaignType, maxPicks, enableProductPicks])

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="relative">
          <Loader2 className="text-purple-600 animate-spin" size={48} />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400" size={24} />
          </motion.div>
        </div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
        >
          Analyzing Your Business Intelligence...
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center max-w-md"
        >
          AI is reviewing {context.business.profile.name}'s data across 10+ sources
          to find the best campaign opportunities
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-600 dark:text-gray-400"
        >
          {['Industry trends', 'Competitor gaps', 'Customer psychology', 'Local events', 'Seasonal opportunities'].map((item, idx) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="px-2 py-1 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border border-purple-200 dark:border-purple-700 rounded"
            >
              ✓ {item}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    )
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
        >
          <AlertCircle className="text-red-600" size={32} />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          {error}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg"
        >
          Try Again
        </motion.button>
      </motion.div>
    )
  }

  // Empty state - no picks at all
  if (picks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mb-4"
        >
          <Lightbulb className="text-yellow-600 dark:text-yellow-400" size={32} />
        </motion.div>
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          No Strong Recommendations Found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          We couldn't find enough high-quality insights to make confident recommendations.
          Try using the Content Mixer to manually select insights instead.
        </p>
        {onSwitchToMixer && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSwitchToMixer}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg"
          >
            <span className="flex items-center gap-2">
              <Zap size={18} />
              Open Content Mixer
            </span>
          </motion.button>
        )}
      </motion.div>
    )
  }

  // All picks filtered out by UVP relevance
  if (displayPicks.length === 0 && filteredPicks.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-4"
        >
          <Target className="text-purple-600 dark:text-purple-400" size={32} />
        </motion.div>
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          No Highly Relevant Picks Found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-2">
          {filteredPicks.length} suggestion{filteredPicks.length !== 1 ? 's' : ''} scored below {minRelevanceThreshold}% relevance to your UVP.
        </p>
        <p className="text-xs text-gray-500 text-center max-w-md mb-6">
          These may still be valuable - click below to see all suggestions.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllPicks(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg text-sm"
          >
            <span className="flex items-center gap-2">
              <Eye size={16} />
              Show All Suggestions
            </span>
          </motion.button>
          {onSwitchToMixer && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSwitchToMixer}
              className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all font-medium text-sm"
            >
              Content Mixer
            </motion.button>
          )}
        </div>
      </motion.div>
    )
  }

  // Main content
  return (
    <div className="py-8 px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg"
          >
            <Sparkles className="text-white" size={24} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Recommended Campaigns
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on {context.business.profile.name}'s intelligence data
            </p>
          </div>
        </div>

        {/* Explainer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-lg"
        >
          <p className="text-sm text-purple-900 dark:text-purple-200">
            <strong className="flex items-center gap-2">
              <Zap size={16} className="text-purple-600" />
              How this works:
            </strong> Our AI analyzed your business data across 10+ sources
            and scored {picks.length} campaign opportunities by relevance, timeliness, and evidence quality.
            {uvp && enableUVPFiltering && (
              <> Picks are also scored against your UVP for relevance.</>
            )}
          </p>
        </motion.div>

        {/* UVP Filtering Status & Toggle (Phase D - Item #31) */}
        {uvp && enableUVPFiltering && filteredPicks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-4 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Target size={16} className="text-purple-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{displayPicks.length}</strong> of {picks.length} picks shown
                {!showAllPicks && (
                  <span className="text-gray-500">
                    {' '}({filteredPicks.length} below {minRelevanceThreshold}% UVP relevance)
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => setShowAllPicks(!showAllPicks)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              {showAllPicks ? (
                <>
                  <EyeOff size={14} />
                  Hide Low Relevance
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Show All
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Grid of picks */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayPicks.map((pick, idx) => {
          const isScored = 'uvpRelevance' in pick
          const relevanceScore = isScored ? (pick as ScoredSmartPick).uvpRelevance.relevanceScore : null

          return (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {/* UVP Relevance Badge */}
              {relevanceScore !== null && uvp && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge
                    variant={relevanceScore >= 70 ? 'default' : relevanceScore >= 30 ? 'secondary' : 'destructive'}
                    className="text-xs px-2 py-0.5"
                  >
                    {relevanceScore}% UVP
                  </Badge>
                </div>
              )}
              <SmartPickCard
                pick={pick}
                rank={idx + 1}
                onGenerate={onGenerateCampaign}
                onPreview={setPreviewPick}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Alternative option */}
      {onSwitchToMixer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-5xl mx-auto text-center"
        >
          <div className="border-t border-purple-200 dark:border-purple-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Want more control over your campaign?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSwitchToMixer}
              className="px-6 py-3 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all font-medium shadow-lg"
            >
              Show Me More Options (Content Mixer)
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Quick Preview Modal */}
      <AnimatePresence>
        {previewPick && (
          <QuickPreview
            pick={previewPick}
            context={context}
            onClose={() => setPreviewPick(null)}
            onGenerate={() => {
              setPreviewPick(null)
              onGenerateCampaign(previewPick)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
