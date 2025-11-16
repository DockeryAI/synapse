/**
 * Quick Preview Modal Component
 *
 * Shows full content preview for one platform before generating
 * Allows user to:
 * - See complete content preview
 * - Switch between platform previews
 * - Generate full campaign or close
 *
 * Created: 2025-11-15
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle2, TrendingUp, Zap } from 'lucide-react'
import type { SmartPick } from '@/types/smart-picks.types'
import type { DeepContext } from '@/types/synapse/deepContext.types'

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼' },
  { id: 'facebook', name: 'Facebook', emoji: '👥' },
  { id: 'instagram', name: 'Instagram', emoji: '📸' },
  { id: 'twitter', name: 'Twitter/X', emoji: '🐦' }
]

export interface QuickPreviewProps {
  pick: SmartPick
  context: DeepContext
  onClose: () => void
  onGenerate: () => void
}

export function QuickPreview({ pick, context, onClose, onGenerate }: QuickPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(pick.preview.platform.toLowerCase())

  // Simulate platform-specific preview (in real implementation, this would call generator)
  const generatePlatformPreview = (platform: string) => {
    // For now, use the existing preview
    return {
      headline: pick.preview.headline,
      hook: pick.preview.hook,
      body: pick.insights[0].insight,
      cta: `Learn more about ${context.business.profile.name}`,
      hashtags: generateHashtags(platform)
    }
  }

  const generateHashtags = (platform: string) => {
    const industry = context.business.profile.industry.toLowerCase().replace(/\s+/g, '')
    const city = context.business.profile.location.city.toLowerCase().replace(/\s+/g, '')

    const baseTags = [`#${industry}`, `#${city}`]

    if (platform === 'linkedin') {
      return [...baseTags, '#BusinessGrowth', '#ThoughtLeadership']
    }
    if (platform === 'instagram') {
      return [...baseTags, '#SmallBusiness', '#LocalBusiness', '#Entrepreneur']
    }
    if (platform === 'twitter') {
      return [...baseTags, '#Business', '#Marketing']
    }
    if (platform === 'facebook') {
      return [...baseTags, '#Community', '#LocalBusiness']
    }

    return baseTags
  }

  const preview = generatePlatformPreview(selectedPlatform)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-200 dark:border-purple-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Preview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{pick.title}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="Close preview"
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Platform Tabs */}
        <div className="border-b border-purple-200 dark:border-purple-700 px-6 pt-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
          <div className="flex gap-2 overflow-x-auto">
            {PLATFORMS.map(platform => (
              <motion.button
                key={platform.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-all
                  ${selectedPlatform === platform.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }
                `}
              >
                <span className="mr-1">{platform.emoji}</span>
                {platform.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          {/* Preview Card (simulates social media post) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-700 rounded-xl p-6 mb-6 shadow-lg"
          >
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              >
                {context.business.profile.name.charAt(0)}
              </motion.div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{context.business.profile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {context.business.profile.location.city}, {context.business.profile.location.state}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {preview.headline}
              </h3>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{preview.hook}</p>
              <p className="text-gray-700 dark:text-gray-300">{preview.body}</p>
              <p className="font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Zap size={16} />
                {preview.cta}
              </p>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {preview.hashtags.map((tag, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-sm text-purple-600 dark:text-purple-400 font-medium"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-violet-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={16} />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Performance Score</span>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round(pick.overallScore * 100)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Relevance + Timeliness + Evidence</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 via-purple-50 to-violet-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-violet-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={16} />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Confidence</span>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {Math.round(pick.confidence * 100)}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">AI model confidence</p>
            </motion.div>
          </div>

          {/* Why This Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-lg"
          >
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
              <Zap size={16} className="text-purple-600 dark:text-purple-400" />
              Why This Campaign Works
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-300">{pick.reasoning}</p>
          </motion.div>

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Powered by {pick.dataSources.length} data sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {pick.dataSources.map((source, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 text-xs text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-700"
                >
                  {source.label}
                  {source.verified && (
                    <CheckCircle2 size={12} className="text-purple-600 dark:text-purple-400" />
                  )}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all font-medium shadow-lg"
          >
            Close
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles size={18} />
            Generate Full Campaign
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
