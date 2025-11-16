/**
 * Smart Picks Container Component
 *
 * Main component that:
 * - Generates smart picks from DeepContext
 * - Displays grid of SmartPickCards
 * - Handles pick selection and preview
 * - Provides fallback to Content Mixer
 *
 * Created: 2025-11-15
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle, Lightbulb, Zap } from 'lucide-react'
import type { DeepContext } from '@/types/synapse/deepContext.types'
import type { SmartPick, CampaignType } from '@/types/smart-picks.types'
import { generateSmartPicks } from '@/services/campaign/SmartPickGenerator'
import { SmartPickCard } from './SmartPickCard'
import { QuickPreview } from './QuickPreview'

export interface SmartPicksProps {
  /** Deep context with business intelligence */
  context: DeepContext

  /** Optional filter by campaign type */
  campaignType?: CampaignType

  /** Callback when user wants to generate a campaign */
  onGenerateCampaign: (pick: SmartPick) => void

  /** Callback when user wants to use Content Mixer instead */
  onSwitchToMixer?: () => void

  /** Maximum number of picks to show */
  maxPicks?: number
}

export function SmartPicks({
  context,
  campaignType,
  onGenerateCampaign,
  onSwitchToMixer,
  maxPicks = 5
}: SmartPicksProps) {
  const [picks, setPicks] = useState<SmartPick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewPick, setPreviewPick] = useState<SmartPick | null>(null)

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

        setPicks(result.picks)
      } catch (err) {
        console.error('[SmartPicks] Generation failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate picks')
      } finally {
        setLoading(false)
      }
    }

    generate()
  }, [context, campaignType, maxPicks])

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

  // Empty state
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
            The top picks are shown below, ranked by overall score.
          </p>
        </motion.div>
      </motion.div>

      {/* Grid of picks */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {picks.map((pick, idx) => (
          <motion.div
            key={pick.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <SmartPickCard
              pick={pick}
              rank={idx + 1}
              onGenerate={onGenerateCampaign}
              onPreview={setPreviewPick}
            />
          </motion.div>
        ))}
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
