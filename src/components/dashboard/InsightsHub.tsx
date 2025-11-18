/**
 * Insights Hub Component
 *
 * Displays all gathered intelligence from onboarding:
 * - Website analysis (UVPs, brand voice, services)
 * - Location and service area
 * - Services/Products
 * - Customer triggers and pain points
 * - Market trends
 * - Competitor data
 * - Brand voice analysis
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Package,
  Target,
  TrendingUp,
  Users,
  Mic,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { BusinessInsights } from '@/services/insights/insights-storage.service';

export interface InsightsHubProps {
  /** All gathered business insights */
  insights: BusinessInsights;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function Section({ title, icon, children, defaultExpanded = true }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg text-white">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 dark:border-slate-700 p-4"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export function InsightsHub({ insights }: InsightsHubProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Your Intelligence Hub
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All gathered insights and data from onboarding
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search insights..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Website Analysis */}
        {insights.websiteAnalysis && (
          <Section title="Website Analysis" icon={<Sparkles className="w-5 h-5" />}>
            <div className="space-y-4">
              {insights.websiteAnalysis.uvps && insights.websiteAnalysis.uvps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Unique Value Propositions
                  </h4>
                  <div className="space-y-2">
                    {insights.websiteAnalysis.uvps.map((uvp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg text-sm"
                      >
                        {uvp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.websiteAnalysis.brandVoice && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Brand Voice
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    {insights.websiteAnalysis.brandVoice}
                  </p>
                </div>
              )}

              {insights.websiteAnalysis.keyMessages && insights.websiteAnalysis.keyMessages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Key Messages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.websiteAnalysis.keyMessages.map((message, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300"
                      >
                        {message}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Location Data */}
        {insights.locationData && (
          <Section title="Location" icon={<MapPin className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.locationData.address && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    ADDRESS
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {insights.locationData.address}
                  </div>
                </div>
              )}
              {insights.locationData.city && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    CITY
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {insights.locationData.city}, {insights.locationData.state}
                  </div>
                </div>
              )}
              {insights.locationData.serviceArea && insights.locationData.serviceArea.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    SERVICE AREA
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.locationData.serviceArea.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full text-xs font-medium text-green-700 dark:text-green-300"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Services/Products */}
        {insights.servicesProducts && insights.servicesProducts.length > 0 && (
          <Section title="Services & Products" icon={<Package className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.servicesProducts.map((service, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {service.name}
                  </div>
                  {service.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {service.description}
                    </div>
                  )}
                  {service.category && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      {service.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Customer Triggers */}
        {insights.customerTriggers && insights.customerTriggers.length > 0 && (
          <Section title="Customer Triggers" icon={<Target className="w-5 h-5" />}>
            <div className="space-y-3">
              {insights.customerTriggers.map((trigger, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
                >
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        PAIN POINT
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {trigger.painPoint}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        DESIRE
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {trigger.desire}
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      Source: {trigger.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Market Trends */}
        {insights.marketTrends && insights.marketTrends.length > 0 && (
          <Section title="Market Trends" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="space-y-3">
              {insights.marketTrends.map((trend, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-700 rounded-lg"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">
                    {trend.trend}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {trend.description}
                  </div>
                  <div className="text-sm text-violet-700 dark:text-violet-300">
                    Relevance: {trend.relevance}
                  </div>
                  <div className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                    Source: {trend.source}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Competitor Data */}
        {insights.competitorData && insights.competitorData.length > 0 && (
          <Section title="Competitive Intelligence" icon={<Users className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.competitorData.map((competitor, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">
                    {competitor.name}
                  </div>
                  {competitor.strengths && competitor.strengths.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-red-900 dark:text-red-200 mb-1">
                        STRENGTHS
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {competitor.strengths.map((strength, sIdx) => (
                          <li key={sIdx}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {competitor.differentiators && competitor.differentiators.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-900 dark:text-red-200 mb-1">
                        YOUR DIFFERENTIATORS
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {competitor.differentiators.map((diff, dIdx) => (
                          <li key={dIdx}>• {diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Brand Voice */}
        {insights.brandVoice && (
          <Section title="Brand Voice Analysis" icon={<Mic className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.brandVoice.personality && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    PERSONALITY
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {insights.brandVoice.personality}
                  </div>
                </div>
              )}
              {insights.brandVoice.archetype && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    ARCHETYPE
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {insights.brandVoice.archetype}
                  </div>
                </div>
              )}
              {insights.brandVoice.tone && insights.brandVoice.tone.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    TONE
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.brandVoice.tone.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {insights.brandVoice.writingStyle && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    WRITING STYLE
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {insights.brandVoice.writingStyle}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
