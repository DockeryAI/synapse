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
import { X, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Campaign Preview</h2>
              <p className="text-sm text-gray-600">{pick.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="border-b border-gray-200 px-6 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${selectedPlatform === platform.id
                    ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className="mr-1">{platform.emoji}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview Card (simulates social media post) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            {/* Post Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {context.business.profile.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{context.business.profile.name}</p>
                <p className="text-xs text-gray-500">
                  {context.business.profile.location.city}, {context.business.profile.location.state}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">{preview.headline}</h3>
              <p className="text-gray-800 leading-relaxed">{preview.hook}</p>
              <p className="text-gray-700">{preview.body}</p>
              <p className="font-medium text-purple-600">{preview.cta}</p>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {preview.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-sm text-blue-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-600" size={16} />
                <span className="text-sm font-medium text-blue-900">Performance Score</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {Math.round(pick.overallScore * 100)}%
              </p>
              <p className="text-xs text-blue-600 mt-1">Relevance + Timeliness + Evidence</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={16} />
                <span className="text-sm font-medium text-green-900">Confidence</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {Math.round(pick.confidence * 100)}%
              </p>
              <p className="text-xs text-green-600 mt-1">AI model confidence</p>
            </div>
          </div>

          {/* Why This Works */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Why This Campaign Works</h4>
            <p className="text-sm text-purple-800">{pick.reasoning}</p>
          </div>

          {/* Data Sources */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Powered by {pick.dataSources.length} data sources:</p>
            <div className="flex flex-wrap gap-2">
              {pick.dataSources.map((source, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                >
                  {source.label}
                  {source.verified && (
                    <CheckCircle2 size={12} className="text-green-600" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Generate Full Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
