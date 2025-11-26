/**
 * Smart Pick Card Component
 *
 * Displays a single AI-recommended campaign with:
 * - Headline and hook preview
 * - Product badges for product-enhanced picks
 * - Confidence/quality indicators
 * - Data sources used
 * - Generate and Preview actions
 *
 * Created: 2025-11-15
 * Updated: 2025-11-26 - Added product-enhanced pick support
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Clock, CheckCircle2, ChevronRight, Zap, Package, ShoppingBag } from 'lucide-react'
import type { SmartPick } from '@/types/smart-picks.types'
import type { ProductEnhancedSmartPick } from '@/services/product-marketing/product-smart-pick-enhancer.service'

// Icon mapping for data sources
const SOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  Cloud: (props: any) => <span {...props}>☁️</span>,
  Star: (props: any) => <span {...props}>⭐</span>,
  TrendingUp: (props: any) => <TrendingUp {...props} size={16} />,
  Newspaper: (props: any) => <span {...props}>📰</span>,
  MessageCircle: (props: any) => <span {...props}>💬</span>,
  Video: (props: any) => <span {...props}>🎥</span>,
  Target: (props: any) => <span {...props}>🎯</span>,
  Building: (props: any) => <span {...props}>🏢</span>,
  MapPin: (props: any) => <span {...props}>📍</span>,
  Package: (props: any) => <Package {...props} size={16} />,
}

// Type guard to check if pick is product-enhanced
function isProductEnhancedPick(pick: SmartPick | ProductEnhancedSmartPick): pick is ProductEnhancedSmartPick {
  return 'isProductPick' in pick && pick.isProductPick === true
}

export interface SmartPickCardProps {
  pick: SmartPick | ProductEnhancedSmartPick
  onGenerate: (pick: SmartPick | ProductEnhancedSmartPick) => void
  onPreview: (pick: SmartPick | ProductEnhancedSmartPick) => void
  rank?: number
}

export function SmartPickCard({ pick, onGenerate, onPreview, rank }: SmartPickCardProps) {
  // Check if this is a product-enhanced pick
  const isProductPick = isProductEnhancedPick(pick)
  const productPick = isProductPick ? pick : null

  // Format confidence as percentage
  const confidencePercent = Math.round(pick.confidence * 100)
  const overallScorePercent = Math.round(pick.overallScore * 100)

  // Determine badge color based on score (purple/blue theme)
  const getBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300 dark:border-purple-700'
    if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }

  // Check if time-sensitive
  const isTimeSensitive = pick.timeliness > 0.7
  const isExpiring = pick.metadata.expiresAt && (
    pick.metadata.expiresAt.getTime() - Date.now() < 48 * 60 * 60 * 1000 // 48 hours
  )

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 shadow-lg hover:shadow-xl transition-all p-6 relative"
    >
      {/* Rank badge (if provided) */}
      {rank && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="absolute top-4 right-4"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {rank}
          </div>
        </motion.div>
      )}

      {/* Header: Title and Campaign Type */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {isProductPick ? (
              <ShoppingBag className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" size={20} />
            ) : (
              <Sparkles className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" size={20} />
            )}
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {pick.title}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/40 dark:to-blue-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                {pick.campaignType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
              {/* Product Badge */}
              {productPick?.product && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300 border border-green-200 dark:border-green-700">
                  <Package size={10} />
                  {productPick.product.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product-specific action statement */}
      {productPick?.actionStatement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 p-3 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-700"
        >
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            {productPick.actionStatement}
          </p>
          {productPick.suggestedTemplate && (
            <span className="inline-block mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Zap size={12} />
              Template: {productPick.suggestedTemplate}
            </span>
          )}
        </motion.div>
      )}

      {/* Preview Content */}
      {pick.preview.headline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 p-3 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-700 dark:via-slate-700 dark:to-slate-600 rounded-lg border border-purple-200 dark:border-purple-700"
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {pick.preview.headline}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {pick.preview.hook}
          </p>
          <span className="inline-block mt-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Zap size={12} />
            Optimized for {pick.preview.platform}
          </span>
        </motion.div>
      )}

      {/* Confidence and Quality Indicators */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Overall Score */}
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getBadgeColor(pick.overallScore)}`}>
          <CheckCircle2 size={12} />
          <span>{overallScorePercent}% Match</span>
        </div>

        {/* Confidence */}
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-xs font-medium text-purple-700 dark:text-purple-300">
          <TrendingUp size={12} />
          <span>{confidencePercent}% Confidence</span>
        </div>

        {/* Time-sensitive indicator */}
        {isTimeSensitive && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
            <Clock size={12} />
            <span>{isExpiring ? 'Expires Soon' : 'Time-Sensitive'}</span>
          </div>
        )}
      </div>

      {/* Data Sources */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Data Sources:</p>
        <div className="flex flex-wrap gap-2">
          {pick.dataSources.map((source, idx) => {
            const IconComponent = SOURCE_ICONS[source.icon] || SOURCE_ICONS.Building

            return (
              <div
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs text-gray-700"
                title={`${source.label} - ${source.freshness} updates`}
              >
                <IconComponent className="flex-shrink-0" />
                <span>{source.label}</span>
                {source.verified && (
                  <CheckCircle2 size={12} className="text-green-600" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expected Performance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4 p-3 bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-700 dark:via-slate-700 dark:to-slate-600 rounded-lg border border-purple-200 dark:border-purple-700"
      >
        <p className="text-xs font-medium text-purple-900 dark:text-purple-200 mb-1 flex items-center gap-1">
          <Zap size={12} className="text-purple-600 dark:text-purple-400" />
          Expected Performance
        </p>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Engagement:</span>{' '}
            <span className="font-medium text-purple-700 dark:text-purple-300 capitalize">{pick.expectedPerformance.engagement}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Reach:</span>{' '}
            <span className="font-medium text-blue-700 dark:text-blue-300 capitalize">{pick.expectedPerformance.reach}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Conversions:</span>{' '}
            <span className="font-medium text-purple-700 dark:text-purple-300 capitalize">{pick.expectedPerformance.conversions}</span>
          </div>
        </div>
      </motion.div>

      {/* Reasoning */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {pick.reasoning}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onGenerate(pick)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Generate This Campaign
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPreview(pick)}
          className="px-4 py-2.5 border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-1"
          title="See full preview"
        >
          <span>Preview</span>
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}
