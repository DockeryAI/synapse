/**
 * Dashboard / Command Center Page
 *
 * Fully integrated central hub displaying:
 * - Business intelligence summary
 * - Top 3 campaign + Top 3 content recommendations (DashboardSmartPicks)
 * - Quick actions (insights hub, content mixer, calendar)
 * - Insight details modal with generation flow
 * - Floating calendar access
 *
 * Created: 2025-11-18
 * Updated: 2025-11-18 - Full integration with all components
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { insightsStorageService, type BusinessInsights } from '@/services/insights/insights-storage.service';
import { DashboardSmartPicks } from '@/components/dashboard/DashboardSmartPicks';
import { InsightDetailsModal } from '@/components/dashboard/InsightDetailsModal';
import { InsightsHub } from '@/components/dashboard/InsightsHub';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

type ViewMode = 'dashboard' | 'insights_hub';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPick, setSelectedPick] = useState<SmartPick | null>(null);
  const [deepContext, setDeepContext] = useState<DeepContext | null>(null);

  // Load insights on mount
  useEffect(() => {
    async function loadInsights() {
      if (!brand?.id) {
        console.log('[DashboardPage] No brand ID, redirecting to onboarding');
        navigate('/onboarding');
        return;
      }

      try {
        setLoading(true);
        const data = await insightsStorageService.getInsights(brand.id);

        if (!data || !data.websiteAnalysis) {
          console.log('[DashboardPage] No insights found, redirecting to onboarding');
          navigate('/onboarding');
          return;
        }

        setInsights(data);

        // Build DeepContext for SmartPicks generation
        // This is a simplified conversion - in production you'd have a proper converter
        const context: DeepContext = {
          business: {
            profile: {
              id: brand.id,
              name: brand.name || data.websiteAnalysis.brandVoice || 'Your Business',
              industry: data.websiteAnalysis.contentThemes?.[0] || 'General',
              naicsCode: '',
              website: brand.website || '',
              location: {
                city: data.locationData?.city || '',
                state: data.locationData?.state || '',
                country: data.locationData?.country || 'USA',
              },
              keywords: data.websiteAnalysis?.contentThemes || [],
              competitors: data.competitorData?.map(c => c.name) || [],
            },
            brandVoice: {
              tone: ['professional'],
              values: [],
              personality: [],
              avoidWords: [],
              signaturePhrases: [],
            },
            uniqueAdvantages: [],
            goals: [],
          },
          industry: {
            profile: null,
            trends: [],
            seasonality: [],
            competitiveLandscape: {
              topCompetitors: [],
              marketConcentration: 'moderate',
              barrierToEntry: 'medium',
            },
            economicFactors: [],
          },
          realTimeCultural: {
            weather: null,
            localEvents: [],
            trendingTopics: [],
            culturalMoments: [],
            seasonalContext: null,
            reviews: null,
          },
          competitiveIntel: {
            blindSpots: [],
            mistakes: [],
            opportunities: [],
            contentGaps: [],
            positioningWeaknesses: [],
          },
          customerPsychology: {
            unarticulated: [],
            emotional: [],
            behavioral: [],
            identityDesires: [],
            purchaseMotivations: [],
            objections: [],
          },
          synthesis: {
            keyInsights: [],
            hiddenPatterns: [],
            opportunityScore: 70,
            recommendedAngles: [],
            confidenceLevel: 0.7,
            generatedAt: new Date(),
          },
          metadata: {
            aggregatedAt: new Date(),
            dataSourcesUsed: ['website'],
            processingTimeMs: 0,
            version: '1.0.0',
          },
        };

        setDeepContext(context);
      } catch (error) {
        console.error('[DashboardPage] Failed to load insights:', error);
        navigate('/onboarding');
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [brand, navigate]);

  // Handle pick selection
  const handlePickClick = (pick: SmartPick) => {
    console.log('[DashboardPage] Pick selected:', pick);
    setSelectedPick(pick);
  };

  // Handle generate campaign/content
  const handleGenerate = async (pick: SmartPick) => {
    console.log('[DashboardPage] Generating for pick:', pick);
    // TODO: Wire to actual campaign generator
    // For now, just navigate to campaign page
    navigate('/campaign/new');
  };

  // Handle schedule
  const handleSchedule = (pick: SmartPick) => {
    console.log('[DashboardPage] Scheduling pick:', pick);
    navigate('/content-calendar');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your command center...</p>
        </div>
      </div>
    );
  }

  const businessName = brand?.name || insights?.websiteAnalysis?.brandVoice || 'Your Business';
  const servicesCount = insights?.servicesProducts?.length || 0;
  const triggersCount = insights?.customerTriggers?.length || 0;
  const trendsCount = insights?.marketTrends?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-purple-200 dark:border-slate-700 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Command Center
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {businessName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === 'insights_hub' && (
                <Button
                  onClick={() => setViewMode('dashboard')}
                  size="sm"
                  variant="outline"
                  className="border-2"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              )}
              <Button
                onClick={() => navigate('/content-calendar')}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Welcome Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-600 via-blue-600 to-violet-600 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl text-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                        Welcome back!
                      </h2>
                      <p className="text-purple-100 text-sm sm:text-base mb-4">
                        Your AI-powered content engine is ready. Let's create something amazing today.
                      </p>
                    </motion.div>

                    {/* Intelligence Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap gap-4 mt-6"
                    >
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">{servicesCount} Services</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-sm font-medium">{triggersCount} Triggers</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{trendsCount} Trends</span>
                      </div>
                    </motion.div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="hidden sm:block"
                  >
                    <Sparkles className="w-12 h-12 text-purple-200" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
              >
                {/* View All Insights */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode('insights_hub')}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    View All Insights
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Explore all gathered intelligence and data
                  </p>
                </motion.button>

                {/* Content Mixer */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/campaign/new')}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Content Mixer
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Build custom content with your insights
                  </p>
                </motion.button>

                {/* Calendar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/content-calendar')}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-violet-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                      <Calendar className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Content Calendar
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View and schedule your content
                  </p>
                </motion.button>
              </motion.div>

              {/* Smart Recommendations Section */}
              {deepContext && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        AI Recommendations
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Top opportunities based on your intelligence
                      </p>
                    </div>
                  </div>

                  {/* Dashboard Smart Picks Component */}
                  <DashboardSmartPicks
                    context={deepContext}
                    onPickClick={handlePickClick}
                  />
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Insights Hub View */
            <motion.div
              key="insights-hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {insights && <InsightsHub insights={insights} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Calendar Button (Mobile) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/content-calendar')}
        className="sm:hidden fixed bottom-6 right-6 p-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-2xl z-50"
        aria-label="Open calendar"
      >
        <Calendar className="w-6 h-6" />
      </motion.button>

      {/* Insight Details Modal */}
      {selectedPick && deepContext && (
        <InsightDetailsModal
          pick={selectedPick}
          context={deepContext}
          onClose={() => setSelectedPick(null)}
          onGenerate={handleGenerate}
          onSchedule={handleSchedule}
        />
      )}
    </div>
  );
}
