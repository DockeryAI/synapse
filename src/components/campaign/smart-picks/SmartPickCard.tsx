/**
 * Smart Pick Card Component
 *
 * Displays a single AI-recommended campaign with:
 * - Headline and hook preview
 * - Confidence/quality indicators
 * - Data sources used
 * - Generate and Preview actions
 *
 * Created: 2025-11-15
 */

import React from 'react'
import { Sparkles, TrendingUp, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import type { SmartPick } from '@/types/smart-picks.types'

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
  MapPin: (props: any) => <span {...props}>📍</span>
}

export interface SmartPickCardProps {
  pick: SmartPick
  onGenerate: (pick: SmartPick) => void
  onPreview: (pick: SmartPick) => void
  rank?: number
}

export function SmartPickCard({ pick, onGenerate, onPreview, rank }: SmartPickCardProps) {
  // Format confidence as percentage
  const confidencePercent = Math.round(pick.confidence * 100)
  const overallScorePercent = Math.round(pick.overallScore * 100)

  // Determine badge color based on score
  const getBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Check if time-sensitive
  const isTimeSensitive = pick.timeliness > 0.7
  const isExpiring = pick.metadata.expiresAt && (
    pick.metadata.expiresAt.getTime() - Date.now() < 48 * 60 * 60 * 1000 // 48 hours
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 relative">
      {/* Rank badge (if provided) */}
      {rank && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {rank}
          </div>
        </div>
      )}

      {/* Header: Title and Campaign Type */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="text-purple-500 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {pick.title}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
              {pick.campaignType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      {pick.preview.headline && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="font-semibold text-gray-800 mb-1">
            {pick.preview.headline}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {pick.preview.hook}
          </p>
          <span className="inline-block mt-2 text-xs text-gray-500">
            Optimized for {pick.preview.platform}
          </span>
        </div>
      )}

      {/* Confidence and Quality Indicators */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Overall Score */}
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getBadgeColor(pick.overallScore)}`}>
          <CheckCircle2 size={12} />
          <span>{overallScorePercent}% Match</span>
        </div>

        {/* Confidence */}
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">
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
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs font-medium text-blue-900 mb-1">Expected Performance</p>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-600">Engagement:</span>{' '}
            <span className="font-medium text-blue-700 capitalize">{pick.expectedPerformance.engagement}</span>
          </div>
          <div>
            <span className="text-gray-600">Reach:</span>{' '}
            <span className="font-medium text-blue-700 capitalize">{pick.expectedPerformance.reach}</span>
          </div>
          <div>
            <span className="text-gray-600">Conversions:</span>{' '}
            <span className="font-medium text-blue-700 capitalize">{pick.expectedPerformance.conversions}</span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {pick.reasoning}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onGenerate(pick)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Generate This Campaign
        </button>
        <button
          onClick={() => onPreview(pick)}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
          title="See full preview"
        >
          <span>Preview</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
