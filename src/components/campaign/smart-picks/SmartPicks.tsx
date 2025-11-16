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
import { Sparkles, Loader2, AlertCircle, Lightbulb } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative">
          <Loader2 className="text-purple-600 animate-spin" size={48} />
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400" size={24} />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-gray-900">
          Analyzing Your Business Intelligence...
        </h3>
        <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
          AI is reviewing {context.business.profile.name}'s data across 10+ sources
          to find the best campaign opportunities
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">✓ Industry trends</span>
          <span className="px-2 py-1 bg-gray-100 rounded">✓ Competitor gaps</span>
          <span className="px-2 py-1 bg-gray-100 rounded">✓ Customer psychology</span>
          <span className="px-2 py-1 bg-gray-100 rounded">✓ Local events</span>
          <span className="px-2 py-1 bg-gray-100 rounded">✓ Seasonal opportunities</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (picks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Lightbulb className="text-yellow-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Strong Recommendations Found
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          We couldn't find enough high-quality insights to make confident recommendations.
          Try using the Content Mixer to manually select insights instead.
        </p>
        {onSwitchToMixer && (
          <button
            onClick={onSwitchToMixer}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
          >
            Open Content Mixer
          </button>
        )}
      </div>
    )
  }

  // Main content
  return (
    <div className="py-8 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              AI-Recommended Campaigns
            </h2>
            <p className="text-sm text-gray-600">
              Based on {context.business.profile.name}'s intelligence data
            </p>
          </div>
        </div>

        {/* Explainer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>How this works:</strong> Our AI analyzed your business data across 10+ sources
            and scored {picks.length} campaign opportunities by relevance, timeliness, and evidence quality.
            The top picks are shown below, ranked by overall score.
          </p>
        </div>
      </div>

      {/* Grid of picks */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {picks.map((pick, idx) => (
          <SmartPickCard
            key={pick.id}
            pick={pick}
            rank={idx + 1}
            onGenerate={onGenerateCampaign}
            onPreview={setPreviewPick}
          />
        ))}
      </div>

      {/* Alternative option */}
      {onSwitchToMixer && (
        <div className="max-w-5xl mx-auto text-center">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 mb-4">
              Want more control over your campaign?
            </p>
            <button
              onClick={onSwitchToMixer}
              className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
            >
              Show Me More Options (Content Mixer)
            </button>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
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
    </div>
  )
}
