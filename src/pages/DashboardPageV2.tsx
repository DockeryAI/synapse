/**
 * Dashboard Page V2 - Streaming Architecture
 *
 * Uses EventEmitter-based progressive loading
 * Each API updates independently as it completes
 * Shows cached data immediately, then streams fresh data
 *
 * Created: 2025-11-25
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  X,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/hooks/useBrand';
import { useStreamingApiData } from '@/hooks/useStreamingApiData';
import { InsightDetailsModal } from '@/components/dashboard/InsightDetailsModal';
import { InsightsHub } from '@/components/dashboard/InsightsHub';
import { AiPicksPanel } from '@/components/dashboard/AiPicksPanel';
import { IntelligenceLibraryV2 } from '@/components/dashboard/IntelligenceLibraryV2';
import { SelectionBar } from '@/components/dashboard/SelectionBar';
import {
  ApiProgressBar,
  ApiStatusIndicator,
  YouTubeTrendingSkeleton,
  SEMrushDomainSkeleton,
  NewsBreakingSkeleton,
  GoogleMapsSkeleton,
  QuoraSkeleton,
  WeatherSkeleton,
  LinkedInSkeleton,
  PerplexitySkeleton,
  WebsiteAnalysisSkeleton,
  InstagramSkeleton,
} from '@/components/dashboard/SkeletonLoaders';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { hasPendingUVP, getPendingUVP } from '@/services/database/marba-uvp-migration.service';
import { insightsStorageService, type BusinessInsights } from '@/services/insights/insights-storage.service';

type ViewMode = 'dashboard' | 'insights_hub';

export function DashboardPageV2() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPick, setSelectedPick] = useState<SmartPick | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [insights, setInsights] = useState<BusinessInsights | null>(null);

  // Use the new streaming hook - each API updates independently
  const {
    data,
    loading,
    errors,
    statuses,
    totalApis,
    loadedApis,
    failedApis,
    percentComplete
  } = useStreamingApiData(brand);

  // Mock picks for now (TODO: Generate from streaming data)
  const campaignPicks: SmartPick[] = [
    {
      id: 'mock-1',
      title: 'Authority Building Campaign',
      description: 'Establish expertise in your industry',
      campaignType: 'authority-builder',
      confidence: 0.85,
      relevance: 0.9,
      timeliness: 0.75,
      evidenceQuality: 0.8,
      overallScore: 0.82,
      insights: [],
      dataSources: [],
      preview: {
        headline: 'Establish Your Industry Authority',
        hook: 'Build trust and credibility with your audience',
        platform: 'LinkedIn',
      },
      reasoning: 'Build trust and credibility',
      expectedPerformance: {
        engagement: 'high',
        reach: 'medium',
        conversions: 'medium',
      },
      metadata: {
        generatedAt: new Date(),
      },
    },
  ];

  const contentPicks: SmartPick[] = [
    {
      id: 'content-1',
      title: 'Value Proposition Post',
      description: 'Highlight your unique value',
      campaignType: 'single-post',
      confidence: 0.88,
      relevance: 0.92,
      timeliness: 0.8,
      evidenceQuality: 0.85,
      overallScore: 0.87,
      insights: [],
      dataSources: [],
      preview: {
        headline: 'Your Core Value Proposition',
        hook: 'Strong resonance with target audience',
        platform: 'LinkedIn',
      },
      reasoning: 'Strong resonance with target audience',
      expectedPerformance: {
        engagement: 'high',
        reach: 'high',
        conversions: 'high',
      },
      metadata: {
        generatedAt: new Date(),
      },
    },
  ];

  // Load backward-compatible insights data
  useEffect(() => {
    async function loadLegacyInsights() {
      if (brand?.id) {
        const data = await insightsStorageService.getInsights(brand.id);
        if (data) {
          setInsights(data);
        }
      }
    }
    loadLegacyInsights();
  }, [brand]);

  // Construct DeepContext from streaming data for backward compatibility
  const deepContext: DeepContext | null = React.useMemo(() => {
    if (!brand) return null;

    return {
      business: {
        profile: {
          id: brand.id,
          name: brand.name,
          industry: brand.industry || '',
          naicsCode: '',
          website: brand.website || '',
          location: {
            city: brand.location || '',
            state: '',
            country: 'USA',
          },
        },
      },
      industry: {
        trends: data.newsTrending || [],
        marketSize: null,
        growthRate: null,
        keyPlayers: data.semrushCompetitors || [],
        regulations: [],
      },
      customerPsychology: {
        emotional: data.youtubeComments?.patterns || [],
        functional: [],
        social: [],
        unarticulated: [],
        triggers: [],
        objections: [],
      },
      competitiveIntel: {
        directCompetitors: data.semrushCompetitors || [],
        indirectCompetitors: [],
        positioning: [],
        weaknesses: [],
        strengths: [],
        opportunities: [],
        threats: [],
        blindSpots: [],
      },
      cultural: {
        currentEvents: data.newsBreaking || [],
        socialMovements: [],
        generationalShifts: [],
        technologicalChanges: [],
      },
      synthesis: {
        keyInsights: [],
        hiddenPatterns: [],
        unusualConnections: [],
        contrarian: [],
        futureScenarios: [],
        recommendations: [],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        dataPoints: totalApis,
        confidence: percentComplete / 100,
        sources: Array.from(statuses.keys()),
      },
    };
  }, [brand, data, statuses, totalApis, percentComplete]);

  if (viewMode === 'insights_hub') {
    return (
      <InsightsHub
        onBack={() => setViewMode('dashboard')}
        deepContext={deepContext}
      />
    );
  }

  return (
    <>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Progress Bar - Always visible at top */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b p-4">
          <ApiProgressBar
            loaded={loadedApis}
            total={totalApis}
            failed={failedApis}
          />
        </div>

        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold">Intelligence Command Center</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time market intelligence and content recommendations
            </p>
          </motion.div>

          {/* Business Intelligence Summary - Shows immediately with cached data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Industry Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {data.newsTrending ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Industry Trends</h3>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                  <div className="space-y-2 text-sm">
                    {data.newsTrending.slice(0, 3).map((trend: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                        <span className="text-gray-700 dark:text-gray-300">{trend.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : loading.newsBreaking ? (
                <NewsBreakingSkeleton />
              ) : errors.newsBreaking ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to load trends</span>
                </div>
              ) : null}
            </div>

            {/* Customer Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {data.youtubeComments ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold">Customer Psychology</h3>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                  <div className="space-y-2 text-sm">
                    {data.youtubeComments.patterns?.slice(0, 3).map((pattern: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                        <span className="text-gray-700 dark:text-gray-300">{pattern.pattern}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : loading.youtubeComments ? (
                <YouTubeTrendingSkeleton />
              ) : errors.youtubeComments ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to load insights</span>
                </div>
              ) : null}
            </div>

            {/* Competitive Intel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {data.semrushCompetitors ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold">Competitive Edge</h3>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                  <div className="space-y-2 text-sm">
                    {data.semrushCompetitors.slice(0, 3).map((comp: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                        <span className="text-gray-700 dark:text-gray-300">{comp.domain}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : loading.semrushCompetitors ? (
                <SEMrushDomainSkeleton />
              ) : errors.semrushCompetitors ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to load competitors</span>
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Smart Picks Panel - Updates as APIs complete */}
          <AiPicksPanel
            campaignPicks={campaignPicks}
            contentPicks={contentPicks}
            onPickSelect={setSelectedPick}
            loading={loadedApis === 0}
          />

          {/* Intelligence Library - Shows data progressively */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">Intelligence Library</h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setViewMode('insights_hub')}
                className="flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* API Status Grid - Shows real-time status of each API */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              {Array.from(statuses.entries()).map(([type, status]) => (
                <ApiStatusIndicator
                  key={type}
                  name={type.replace(/-/g, ' ')}
                  status={status.status}
                  duration={status.duration}
                />
              ))}
            </div>

            {/* Data Grid - Shows skeletons then real data as it arrives */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* YouTube Insights */}
              {data.youtubeTrending || loading['youtube-trending'] ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  {data.youtubeTrending ? (
                    <div>
                      <h3 className="font-semibold mb-3">YouTube Trends</h3>
                      {/* Render actual data */}
                    </div>
                  ) : (
                    <YouTubeTrendingSkeleton />
                  )}
                </div>
              ) : null}

              {/* Google Maps Reviews */}
              {data.apifyReviews || loading['apify-reviews'] ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  {data.apifyReviews ? (
                    <div>
                      <h3 className="font-semibold mb-3">Customer Reviews</h3>
                      {/* Render actual data */}
                    </div>
                  ) : (
                    <GoogleMapsSkeleton />
                  )}
                </div>
              ) : null}

              {/* News Updates */}
              {data.newsBreaking || loading['news-breaking'] ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  {data.newsBreaking ? (
                    <div>
                      <h3 className="font-semibold mb-3">Breaking News</h3>
                      {/* Render actual data */}
                    </div>
                  ) : (
                    <NewsBreakingSkeleton />
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedPick && (
          <InsightDetailsModal
            insight={selectedPick}
            onClose={() => setSelectedPick(null)}
            brandId={brand?.id || ''}
          />
        )}
      </AnimatePresence>

      {/* Selection Bar */}
      {selectedInsights.length > 0 && (
        <SelectionBar
          selectedCount={selectedInsights.length}
          onClear={() => setSelectedInsights([])}
          onGenerateCampaign={() => {
            navigate('/campaigns/create', {
              state: { selectedInsights },
            });
          }}
        />
      )}
    </>
  );
}