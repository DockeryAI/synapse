/**
 * Campaign Generation Page
 *
 * End-to-end campaign workflow:
 * 1. Campaign Type Selection (with AI recommendations)
 * 2. Content Selection (Smart Picks OR Content Mixer)
 * 3. Campaign Generation (auto-generates for all platforms)
 * 4. Preview & Approval (multi-platform preview with editing)
 * 5. Publishing (save to database, ready for SocialPilot)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { CampaignTypeSelector } from '../components/campaign/CampaignTypeSelector';
import { SmartPicks } from '../components/campaign/smart-picks/SmartPicks';
import { ContentMixer } from '../components/campaign/content-mixer/ContentMixer';
import { CampaignPreview } from '../components/campaign/preview/CampaignPreview';
import { campaignOrchestrator } from '../services/campaign';
import type { CampaignSession, CampaignState } from '../types/campaign-workflow.types';
import type { CampaignType } from '../types/campaign.types';
import type { SmartPick } from '../types/smart-picks.types';
import type { CategorizedInsight, InsightPool } from '../types/content-mixer.types';
import type { DeepContext } from '../types/synapse/deepContext.types';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function CampaignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId') || 'demo-business';

  // Campaign state
  const [session, setSession] = useState<CampaignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CampaignState>('IDLE');

  // Content selection mode
  const [selectionMode, setSelectionMode] = useState<'smart-picks' | 'mixer' | null>(null);

  // Mock data for demonstration (TODO: Replace with real DeepContext)
  const mockDeepContext: DeepContext = {
    business: {
      profile: {
        id: businessId,
        name: 'Acme Consulting',
        industry: 'Professional Services',
        naicsCode: '541611',
        website: 'https://acme-consulting.com',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          lat: 37.7749,
          lon: -122.4194
        },
        keywords: ['consulting', 'strategy', 'transformation'],
        competitors: ['Big Consulting Inc', 'Strategy Partners LLC']
      },
      brandVoice: {
        tone: ['professional', 'authoritative'],
        values: ['Excellence', 'Innovation', 'Integrity'],
        personality: ['Expert', 'Trusted Advisor'],
        avoidWords: ['cheap', 'easy'],
        signaturePhrases: ['Transforming businesses for tomorrow']
      },
      uniqueAdvantages: [
        '20 years of industry experience',
        'Proprietary transformation framework',
        '98% client satisfaction rate'
      ],
      goals: [
        {
          goal: 'Increase brand awareness among C-suite executives',
          priority: 'primary',
          timeframe: 'Q1 2025',
          metrics: ['LinkedIn engagement', 'Website traffic from executives']
        }
      ]
    },
    industry: {
      profile: null,
      trends: [
        {
          trend: 'Digital transformation acceleration',
          direction: 'rising',
          strength: 0.85,
          timeframe: '2025',
          impact: 'high',
          sources: ['Industry reports', 'Google Trends']
        }
      ],
      seasonality: [],
      competitiveLandscape: {
        topCompetitors: [],
        marketConcentration: 'moderate',
        barrierToEntry: 'high'
      },
      economicFactors: []
    },
    realTimeCultural: {
      weather: null,
      localEvents: [],
      trendingTopics: [],
      culturalMoments: [],
      seasonalContext: null,
      reviews: null
    },
    competitiveIntel: {
      blindSpots: [],
      mistakes: [],
      opportunities: [],
      contentGaps: [],
      positioningWeaknesses: []
    },
    customerPsychology: {
      unarticulated: [],
      emotional: [],
      behavioral: [],
      identityDesires: [],
      purchaseMotivations: [],
      objections: []
    },
    synthesis: {
      keyInsights: [
        'Digital transformation is the top priority for 78% of C-suite executives',
        'Companies struggle most with change management, not technology',
        'ROI demonstration is critical for executive buy-in'
      ],
      hiddenPatterns: [],
      opportunityScore: 82,
      recommendedAngles: [],
      confidenceLevel: 0.85,
      generatedAt: new Date()
    },
    metadata: {
      aggregatedAt: new Date(),
      dataSourcesUsed: ['Website Analysis', 'Industry Trends', 'Competitive Intelligence'],
      processingTimeMs: 5000,
      version: '1.0.0'
    }
  };

  // Mock insights for Content Mixer
  const mockInsightPool: InsightPool = {
    byCategory: {
      local: [],
      trending: [
        {
          id: 'trending-1',
          category: 'trending',
          insight: 'Digital transformation spending expected to reach $3.4 trillion in 2025',
          displayTitle: 'Digital Transformation Market Growth',
          confidence: 0.9,
          dataSource: 'IDC Research',
          timestamp: new Date(),
          metadata: { source: 'idc', credibility: 0.95 }
        }
      ],
      seasonal: [],
      industry: [
        {
          id: 'industry-1',
          category: 'industry',
          insight: 'Professional services firms seeing 40% increase in digital consulting demand',
          displayTitle: 'Consulting Demand Surge',
          confidence: 0.85,
          dataSource: 'Industry Analysis',
          timestamp: new Date(),
          metadata: { source: 'industry-reports', credibility: 0.9 }
        }
      ],
      reviews: [],
      competitive: []
    },
    all: []
  };

  // Initialize campaign session
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const newSession = await campaignOrchestrator.initialize({
          businessId,
          context: mockDeepContext
        });
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

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = campaignOrchestrator.onStateChange((updatedSession) => {
      setSession(updatedSession);
      setCurrentStep(updatedSession.state);
    });

    return unsubscribe;
  }, []);

  // Handle campaign type selection
  const handleCampaignTypeSelect = (campaignType: CampaignType) => {
    try {
      const updatedSession = campaignOrchestrator.selectCampaignType(campaignType.id);
      setSession(updatedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select campaign type');
    }
  };

  // Handle Smart Pick selection
  const handleSmartPickSelect = async (pick: SmartPick) => {
    try {
      // For demo, we'll simulate insights from the pick
      const mockInsights = pick.insights.slice(0, 3); // Use first 3 insights

      await campaignOrchestrator.selectSmartPick({
        smartPickId: pick.id,
        insights: mockInsights
      });

      // Generate campaign automatically
      await campaignOrchestrator.generateCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign from Smart Pick');
    }
  };

  // Handle Content Mixer generation
  const handleMixerGenerate = async (selectedInsights: CategorizedInsight[]) => {
    try {
      // Convert CategorizedInsight to BreakthroughInsight format
      const mockInsights = selectedInsights.map((insight, index) => ({
        id: insight.id,
        insight: insight.insight,
        confidence: insight.confidence,
        reasoning: `Selected from ${insight.category} category`,
        dataSource: insight.dataSource,
        timestamp: insight.timestamp,
        score: insight.confidence * 100,
        metadata: insight.metadata
      }));

      await campaignOrchestrator.selectCustomInsights(mockInsights);
      await campaignOrchestrator.generateCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    }
  };

  // Handle campaign approval
  const handleApprove = async () => {
    try {
      await campaignOrchestrator.approveCampaign();
      // Show success message and redirect
      alert('Campaign approved! Ready for publishing.');
      navigate('/content-calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve campaign');
    }
  };

  // Handle publishing
  const handlePublish = async (platforms: string[]) => {
    try {
      await campaignOrchestrator.publishCampaign(platforms);
      alert('Campaign published successfully!');
      navigate('/content-calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish campaign');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Initializing campaign workflow...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-8">
          <p className="text-gray-600">No active session</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Create Campaign
                  </h1>
                  <p className="text-sm text-gray-600">
                    {currentStep === 'IDLE' && 'Select a campaign type to get started'}
                    {currentStep === 'TYPE_SELECTED' && 'Choose how to build your campaign'}
                    {currentStep === 'CONTENT_SELECTED' && 'Generating campaign content...'}
                    {currentStep === 'GENERATING' && 'Generating campaign content...'}
                    {currentStep === 'PREVIEW' && 'Review and approve your campaign'}
                    {currentStep === 'APPROVED' && 'Campaign approved! Ready to publish'}
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  Progress: {session.progress}%
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step 1: Campaign Type Selection */}
          {currentStep === 'IDLE' && session.context && (
            <CampaignTypeSelector
              context={session.context}
              onSelectType={handleCampaignTypeSelect}
            />
          )}

          {/* Step 2: Content Selection Mode */}
          {currentStep === 'TYPE_SELECTED' && !selectionMode && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  How would you like to build your campaign?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Smart Picks Option */}
                  <button
                    onClick={() => setSelectionMode('smart-picks')}
                    className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="text-2xl mb-3">✨</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Smart Picks
                    </h3>
                    <p className="text-sm text-gray-600">
                      AI-curated campaign recommendations. Select one and go!
                    </p>
                    <span className="inline-block mt-3 text-sm font-medium text-blue-600">
                      Recommended for most users →
                    </span>
                  </button>

                  {/* Content Mixer Option */}
                  <button
                    onClick={() => setSelectionMode('mixer')}
                    className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="text-2xl mb-3">🎨</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Content Mixer
                    </h3>
                    <p className="text-sm text-gray-600">
                      Build your own campaign by selecting specific insights
                    </p>
                    <span className="inline-block mt-3 text-sm font-medium text-blue-600">
                      For custom campaigns →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2a: Smart Picks */}
          {currentStep === 'TYPE_SELECTED' && selectionMode === 'smart-picks' && session.context && session.selectedType && (
            <div>
              <button
                onClick={() => setSelectionMode(null)}
                className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to selection mode
              </button>
              <SmartPicks
                context={session.context}
                campaignType={session.selectedType}
                onSelectPick={handleSmartPickSelect}
              />
            </div>
          )}

          {/* Step 2b: Content Mixer */}
          {currentStep === 'TYPE_SELECTED' && selectionMode === 'mixer' && (
            <div>
              <button
                onClick={() => setSelectionMode(null)}
                className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to selection mode
              </button>
              <ContentMixer
                pool={mockInsightPool}
                onGenerate={handleMixerGenerate}
                maxInsights={5}
              />
            </div>
          )}

          {/* Step 3: Generating State */}
          {currentStep === 'GENERATING' && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Your Campaign
                </h2>
                <p className="text-gray-600">
                  Creating personalized content for all platforms...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Approval */}
          {(currentStep === 'PREVIEW' || currentStep === 'APPROVED') && session.generatedContent && (
            <CampaignPreview
              content={session.generatedContent}
              onApprove={handleApprove}
              onPublish={handlePublish}
              onEdit={(sectionId, newContent) => {
                console.log('Edit section:', sectionId, newContent);
                // TODO: Implement edit functionality
              }}
              onRegenerate={(sectionId) => {
                console.log('Regenerate section:', sectionId);
                // TODO: Implement regenerate functionality
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
