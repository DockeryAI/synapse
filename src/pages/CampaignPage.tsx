/**
 * Campaign Generation Page - Synapse Style
 *
 * Beautiful, modern campaign workflow matching Synapse's design language:
 * - Purple/Blue gradients
 * - Framer Motion animations
 * - Clean card-based layout
 * - Sparkles and visual delight
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CampaignTypeSelector } from '../components/campaign/CampaignTypeSelector';
import { SmartPicks } from '../components/campaign/smart-picks/SmartPicks';
import { ContentMixer } from '../components/campaign/content-mixer/ContentMixer';
import { CampaignPreview } from '../components/campaign/preview/CampaignPreview';
import { campaignOrchestrator } from '../services/campaign';
import type { CampaignSession, CampaignState, CampaignType } from '../types/campaign-workflow.types';
import type { SmartPick } from '../types/smart-picks.types';
import type { CategorizedInsight, InsightPool } from '../types/content-mixer.types';
import type { DeepContext } from '../types/synapse/deepContext.types';
import { ArrowLeft, Loader2, Sparkles, CheckCircle, Zap } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Helper function to convert underscore IDs to hyphenated format for SmartPicks
const convertCampaignTypeId = (id: string): string => {
  return id.replace(/_/g, '-');
};

export function CampaignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId') || 'demo-business';

  // Campaign state
  const [session, setSession] = useState<CampaignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CampaignState>('IDLE');
  const [selectionMode, setSelectionMode] = useState<'smart-picks' | 'mixer' | null>(null);

  // Mock DeepContext (replace with real data)
  const mockDeepContext: DeepContext = {
    business: {
      profile: {
        id: businessId,
        name: 'Acme Consulting',
        industry: 'Professional Services',
        naicsCode: '541611',
        website: 'https://acme-consulting.com',
        location: { city: 'San Francisco', state: 'CA', country: 'USA', lat: 37.7749, lon: -122.4194 },
        keywords: ['consulting', 'strategy', 'transformation'],
        competitors: ['Big Consulting Inc']
      },
      brandVoice: { tone: ['professional', 'authoritative'], values: ['Excellence'], personality: ['Expert'], avoidWords: [], signaturePhrases: [] },
      uniqueAdvantages: ['20 years experience'],
      goals: [{ goal: 'Increase brand awareness', priority: 'primary', timeframe: 'Q1 2025', metrics: [] }]
    },
    industry: { profile: null, trends: [{ trend: 'Digital transformation', direction: 'rising', strength: 0.85, timeframe: '2025', impact: 'high', sources: [] }], seasonality: [], competitiveLandscape: { topCompetitors: [], marketConcentration: 'moderate', barrierToEntry: 'high' }, economicFactors: [] },
    realTimeCultural: { weather: null, localEvents: [], trendingTopics: [], culturalMoments: [], seasonalContext: null, reviews: null },
    competitiveIntel: { blindSpots: [], mistakes: [], opportunities: [], contentGaps: [], positioningWeaknesses: [] },
    customerPsychology: { unarticulated: [], emotional: [], behavioral: [], identityDesires: [], purchaseMotivations: [], objections: [] },
    synthesis: { keyInsights: ['Digital transformation is top priority', 'Change management critical'], hiddenPatterns: [], opportunityScore: 82, recommendedAngles: [], confidenceLevel: 0.85, generatedAt: new Date() },
    metadata: { aggregatedAt: new Date(), dataSourcesUsed: ['Website'], processingTimeMs: 5000, version: '1.0.0' }
  };

  const mockInsightPool: InsightPool = {
    byCategory: {
      local: [],
      trending: [{ id: 'trending-1', type: 'predictive_opportunity', thinkingStyle: 'analytical', category: 'trending', insight: 'Digital transformation spending expected to reach $3.4T', whyProfound: 'Massive market shift', whyNow: 'Post-pandemic acceleration', contentAngle: 'Industry leadership', expectedReaction: 'High engagement', evidence: ['IDC Research'], displayTitle: 'Digital Transformation Growth', confidence: 0.9, dataSource: 'IDC Research', metadata: { generatedAt: new Date(), model: 'mock' } }],
      seasonal: [],
      industry: [{ id: 'industry-1', type: 'strategic_implication', thinkingStyle: 'analytical', category: 'industry', insight: 'Professional services seeing 40% increase in demand', whyProfound: 'Sustained growth trend', whyNow: 'Economic recovery', contentAngle: 'Market opportunity', expectedReaction: 'Business interest', evidence: ['Industry Analysis'], displayTitle: 'Consulting Demand Surge', confidence: 0.85, dataSource: 'Industry Analysis', metadata: { generatedAt: new Date(), model: 'mock' } }],
      reviews: [],
      competitive: []
    },
    totalCount: 2,
    countByCategory: { local: 0, trending: 1, seasonal: 0, industry: 1, reviews: 0, competitive: 0 }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const newSession = await campaignOrchestrator.initialize({ businessId, context: mockDeepContext });
        setSession(newSession);
        setCurrentStep(newSession.state);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize campaign');
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [businessId]);

  useEffect(() => {
    const unsubscribe = campaignOrchestrator.onStateChange((updatedSession) => {
      setSession(updatedSession);
      setCurrentStep(updatedSession.state);
    });
    return unsubscribe;
  }, []);

  const handleCampaignTypeSelect = (campaignTypeId: string) => {
    try {
      const updatedSession = campaignOrchestrator.selectCampaignType(campaignTypeId as CampaignType);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select campaign type');
    }
  };

  const handleSmartPickSelect = async (pick: SmartPick) => {
    try {
      const mockInsights = pick.insights.slice(0, 3);
      await campaignOrchestrator.selectSmartPick({ smartPickId: pick.id, insights: mockInsights });
      await campaignOrchestrator.generateCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    }
  };

  const handleMixerGenerate = async (selectedInsights: CategorizedInsight[]) => {
    try {
      // Convert CategorizedInsight to SynapseInsight by passing the original insights
      // which already have all required properties
      await campaignOrchestrator.selectCustomInsights(selectedInsights);
      await campaignOrchestrator.generateCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    }
  };

  const handleApprove = async () => {
    try {
      await campaignOrchestrator.approveCampaign();
      navigate('/content-calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve campaign');
    }
  };

  const handlePublish = async (platforms: string[]) => {
    try {
      await campaignOrchestrator.publishCampaign(platforms);
      navigate('/content-calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish campaign');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Initializing Campaign Workflow
          </h2>
          <p className="text-gray-600 dark:text-slate-400">Preparing your intelligent campaign builder...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Error</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!session) {
    console.log('[CampaignPage] No session, returning null');
    return null;
  }

  console.log('[CampaignPage] Rendering with state:', currentStep, 'selectionMode:', selectionMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-purple-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    Campaign Builder
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-1">
                  {currentStep === 'IDLE' && 'Select your campaign type'}
                  {currentStep === 'TYPE_SELECTED' && 'Choose how to build your campaign'}
                  {currentStep === 'GENERATING' && 'Creating your campaign content...'}
                  {currentStep === 'PREVIEW' && 'Review and approve your campaign'}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 whitespace-nowrap">
                {session.progress}% Complete
              </span>
              <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${session.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Campaign Type Selection */}
          {currentStep === 'IDLE' && session.context && (
            <motion.div
              key="type-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CampaignTypeSelector
                context={session.context}
                onContinue={handleCampaignTypeSelect}
              />
            </motion.div>
          )}

          {/* Step 2: Content Selection Mode */}
          {currentStep === 'TYPE_SELECTED' && !selectionMode && (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-8 bg-white dark:bg-slate-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  How would you like to build your campaign?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <button
                    onClick={() => setSelectionMode('smart-picks')}
                    className="group text-left p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all min-h-[160px]"
                  >
                    <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Smart Picks
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      AI-curated campaign recommendations. Select one and go!
                    </p>
                    <span className="inline-block mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                      Recommended →
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectionMode('mixer')}
                    className="group text-left p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all min-h-[160px]"
                  >
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Content Mixer
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Build custom campaigns by selecting specific insights
                    </p>
                    <span className="inline-block mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                      For custom campaigns →
                    </span>
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2a: Smart Picks */}
          {currentStep === 'TYPE_SELECTED' && selectionMode === 'smart-picks' && session.context && session.selectedType && (
            <motion.div
              key="smart-picks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button
                variant="ghost"
                onClick={() => setSelectionMode(null)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <SmartPicks
                context={session.context}
                campaignType={session.selectedType ? convertCampaignTypeId(session.selectedType) as any : undefined}
                onGenerateCampaign={handleSmartPickSelect}
                onSwitchToMixer={() => setSelectionMode('mixer')}
              />
            </motion.div>
          )}

          {/* Step 2b: Content Mixer */}
          {currentStep === 'TYPE_SELECTED' && selectionMode === 'mixer' && (
            <motion.div
              key="content-mixer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button
                variant="ghost"
                onClick={() => setSelectionMode(null)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <ContentMixer
                pool={mockInsightPool}
                onGenerate={handleMixerGenerate}
                maxInsights={5}
              />
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {currentStep === 'GENERATING' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center space-y-4">
                <Loader2 className="h-20 w-20 animate-spin text-purple-600 mx-auto" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Generating Your Campaign
                </h2>
                <p className="text-gray-600 dark:text-slate-400">
                  Creating personalized content for all platforms...
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {(currentStep === 'PREVIEW' || currentStep === 'APPROVED') && session.generatedContent && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CampaignPreview
                campaignData={{
                  ...session.generatedContent,
                  campaignId: session.generatedContent.campaignId || session.id,
                  campaignName: session.generatedContent.campaignName || 'New Campaign',
                  campaignType: session.generatedContent.campaignType || session.selectedType || 'authority-builder',
                  platforms: (session.generatedContent.platforms?.map(p => p.platform) || ['linkedin']) as any,
                  content: session.generatedContent.platforms?.reduce((acc, p) => {
                    acc[p.platform] = {
                      platform: p.platform,
                      sections: {
                        headline: p.content.headline,
                        hook: p.content.hook,
                        body: p.content.body,
                        cta: p.content.cta,
                        hashtags: p.content.hashtags || []
                      },
                      characterCounts: {
                        headline: p.content.headline?.length || 0,
                        hook: p.content.hook.length,
                        body: p.content.body.length,
                        cta: p.content.cta.length,
                        total: p.characterCount
                      },
                      warnings: [],
                      mediaUrls: p.mediaUrls
                    };
                    return acc;
                  }, {} as any) || {},
                  createdAt: new Date(session.createdAt),
                  updatedAt: new Date(session.updatedAt),
                }}
                onApprove={handleApprove}
                onReject={() => console.log('Rejected')}
                onRegenerateAll={async () => console.log('Regenerate all')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
