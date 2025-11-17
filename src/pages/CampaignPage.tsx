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
import type { CampaignSession, CampaignState, GeneratedCampaignContent } from '../types/campaign-workflow.types';
import type { SmartPick } from '../types/smart-picks.types';
import type { CategorizedInsight, InsightPool } from '../types/content-mixer.types';
import type { DeepContext } from '../types/synapse/deepContext.types';
import type { CampaignPreviewData, PlatformPreviewContent, SupportedPlatform } from '../types/campaign-preview.types';
import { ArrowLeft, Loader2, Sparkles, CheckCircle, Zap } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Helper function to convert underscore IDs to hyphenated format for SmartPicks
const convertCampaignTypeId = (id: string): string => {
  return id.replace(/_/g, '-');
};

// Helper function to convert GeneratedCampaignContent to CampaignPreviewData
const convertToPreviewData = (generated: GeneratedCampaignContent, session: CampaignSession): CampaignPreviewData => {
  // Map platform names (convert 'twitter' to 'x')
  const platforms = generated.platforms.map((p) =>
    p.platform === 'twitter' ? 'x' : p.platform
  ) as SupportedPlatform[];

  // Build the content record indexed by platform
  const contentRecord: Record<SupportedPlatform, PlatformPreviewContent> = {} as any;

  generated.platforms.forEach((platformData) => {
    const platformKey = (platformData.platform === 'twitter' ? 'x' : platformData.platform) as SupportedPlatform;

    contentRecord[platformKey] = {
      platform: platformKey,
      sections: {
        headline: platformData.content.headline,
        hook: platformData.content.hook,
        body: platformData.content.body,
        cta: platformData.content.cta,
        hashtags: platformData.content.hashtags || []
      },
      characterCounts: {
        headline: platformData.content.headline?.length,
        hook: platformData.content.hook.length,
        body: platformData.content.body.length,
        cta: platformData.content.cta.length,
        total: platformData.characterCount
      },
      warnings: [],
      mediaUrls: platformData.mediaUrls
    };
  });

  // Convert campaign type from underscore to hyphen format
  const campaignType = generated.campaignType.replace(/_/g, '-') as 'authority-builder' | 'social-proof' | 'local-pulse';

  return {
    campaignId: generated.campaignId,
    campaignName: `${session.selectedType?.replace(/_/g, '-')} Campaign - ${new Date().toLocaleDateString()}`,
    campaignType,
    platforms,
    content: contentRecord,
    createdAt: generated.metadata.generatedAt,
    updatedAt: new Date()
  };
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
      local: [
        {
          id: 'local-1',
          category: 'local',
          type: 'cultural_moment',
          thinkingStyle: 'cultural',
          insight: 'Major tech conference happening downtown this week with 5,000+ attendees',
          displayTitle: 'Local Tech Conference - Perfect Timing',
          whyProfound: 'Conference attendees are in peak decision-making mode, actively seeking solutions',
          whyNow: 'Event starts in 3 days - capture attention before they commit to other vendors',
          contentAngle: 'Position as the local expert they can meet face-to-face, unlike remote competitors',
          expectedReaction: 'Relief at finding a local partner who understands their specific market challenges',
          evidence: ['Event registration shows 78% are decision-makers', 'Local businesses get 3x more meetings at regional conferences'],
          confidence: 0.95,
          dataSource: 'Event Calendar',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 450 }
        },
        {
          id: 'local-2',
          category: 'local',
          type: 'predictive_opportunity',
          thinkingStyle: 'analytical',
          insight: 'New business district opening brings 50+ companies to area',
          displayTitle: 'Business District Expansion Wave',
          whyProfound: 'New businesses are in setup mode - they NEED services like yours right now',
          whyNow: 'Companies moving in within 60 days - be first to welcome them before competition',
          contentAngle: 'Be the "official" welcome partner who helps them hit the ground running',
          expectedReaction: 'Gratitude for proactive outreach during their stressful transition period',
          evidence: ['Opening announcements in local business journal', '12 companies already confirmed moves'],
          confidence: 0.88,
          dataSource: 'City Planning',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 420 }
        },
        {
          id: 'local-3',
          category: 'local',
          type: 'unexpected_connection',
          thinkingStyle: 'lateral',
          insight: 'Local university announcing new tech partnership program',
          displayTitle: 'University Partnership Opportunity',
          whyProfound: 'Educational partnerships create long-term credibility and talent pipeline',
          whyNow: 'Program launches next month - early partners get featured in launch materials',
          contentAngle: 'Position as the bridge between academia and real-world business success',
          expectedReaction: 'Trust from association with respected educational institution',
          evidence: ['University press release', 'Program director seeking industry partners'],
          confidence: 0.82,
          dataSource: 'Local News',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 380 }
        }
      ],
      trending: [
        {
          id: 'trending-1',
          category: 'trending',
          type: 'hidden_pattern',
          thinkingStyle: 'analytical',
          insight: 'Digital transformation spending expected to reach $3.4T',
          displayTitle: 'Digital Transformation Gold Rush',
          whyProfound: 'Businesses feel existential fear of being left behind - powerful emotional driver',
          whyNow: '$3.4T market means competitors are already investing heavily - create urgency',
          contentAngle: 'Frame your service as the smart, affordable entry point vs expensive enterprise solutions',
          expectedReaction: 'Fear of missing out mixed with hope they can still catch up',
          evidence: ['IDC Research Report Q4 2024', 'CEO surveys show digital transformation as #1 priority'],
          confidence: 0.9,
          dataSource: 'IDC Research',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 520 }
        },
        {
          id: 'trending-2',
          category: 'trending',
          type: 'hidden_pattern',
          thinkingStyle: 'analytical',
          insight: 'AI adoption in business increased 270% in past 4 years',
          displayTitle: 'AI Adoption Explosion',
          whyProfound: '270% growth triggers bandwagon effect - nobody wants to be the last one without AI',
          whyNow: 'Early AI adopters gaining massive competitive advantage - late adopters feeling pressure',
          contentAngle: 'Position as the guide who makes AI accessible without the hype or complexity',
          expectedReaction: 'Mix of excitement about possibilities and anxiety about implementation',
          evidence: ['Gartner AI Report 2024', 'McKinsey study showing 15% productivity gains'],
          confidence: 0.92,
          dataSource: 'Gartner',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 510 }
        },
        {
          id: 'trending-3',
          category: 'trending',
          type: 'strategic_implication',
          thinkingStyle: 'creative',
          insight: 'Remote work policies becoming permanent at 74% of companies',
          displayTitle: 'Permanent Remote Work Reality',
          whyProfound: 'Fundamental shift in how business operates - creates need for new tools and processes',
          whyNow: 'Companies finalizing permanent policies NOW - window to influence their choices',
          contentAngle: 'Show how your service solves unique remote/hybrid challenges',
          expectedReaction: 'Relief that someone understands their new operational reality',
          evidence: ['LinkedIn Workforce Report', 'Slack Future Forum survey of 10K workers'],
          confidence: 0.87,
          dataSource: 'LinkedIn Survey',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 490 }
        },
        {
          id: 'trending-4',
          category: 'trending',
          type: 'strategic_implication',
          thinkingStyle: 'creative',
          insight: 'Cybersecurity concerns at all-time high as attacks increase 38%',
          displayTitle: 'Cybersecurity Crisis Mode',
          whyProfound: 'Fear is the strongest motivator - 38% increase means everyone knows someone who got hit',
          whyNow: 'Attacks accelerating during holiday season - businesses are scared RIGHT NOW',
          contentAngle: 'Position your service as part of their security strategy, not just a nice-to-have',
          expectedReaction: 'Heightened risk awareness, urgency to act before they become the next victim',
          evidence: ['FBI Internet Crime Report', 'Average breach cost now $4.45M per incident'],
          confidence: 0.91,
          dataSource: 'Security Report',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 540 }
        }
      ],
      seasonal: [
        {
          id: 'seasonal-1',
          category: 'seasonal',
          type: 'predictive_opportunity',
          thinkingStyle: 'analytical',
          insight: 'Q4 planning season: 89% of businesses finalizing budgets now',
          displayTitle: 'Budget Season - Use It or Lose It',
          whyProfound: '"Use it or lose it" budget mentality creates buying urgency in Q4',
          whyNow: 'Next 30 days determine next year\'s budgets - miss this window, wait 12 months',
          contentAngle: 'Frame as "get it approved before year-end" opportunity with budget justification',
          expectedReaction: 'Urgency to secure budget allocation before fiscal year closes',
          evidence: ['CFO survey: 89% finalize Q1 budgets in November-December', 'Q4 spending typically 40% higher'],
          confidence: 0.86,
          dataSource: 'Business Trends',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 470 }
        },
        {
          id: 'seasonal-2',
          category: 'seasonal',
          type: 'predictive_opportunity',
          thinkingStyle: 'analytical',
          insight: 'Year-end hiring surge: Companies adding 30% more staff',
          displayTitle: 'Year-End Hiring Frenzy',
          whyProfound: 'New employees need training, tools, onboarding - creates immediate service demand',
          whyNow: 'Companies hiring NOW to start fresh in January - brief window to capture attention',
          contentAngle: 'Position as the onboarding accelerator that gets new hires productive faster',
          expectedReaction: 'Relief at finding support during chaotic hiring period',
          evidence: ['Indeed hiring data: 30% spike Nov-Dec', 'HR departments report overwhelm'],
          confidence: 0.84,
          dataSource: 'HR Analytics',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 460 }
        },
        {
          id: 'seasonal-3',
          category: 'seasonal',
          type: 'strategic_implication',
          thinkingStyle: 'cultural',
          insight: 'Holiday shopping season starts earlier each year',
          displayTitle: 'Extended Holiday Consumer Behavior',
          whyProfound: 'Early shopping means extended attention window - more opportunities to engage',
          whyNow: 'Halloween is the new Black Friday - holiday campaigns must start NOW',
          contentAngle: 'Tap into holiday spirit and gift-giving psychology for B2C businesses',
          expectedReaction: 'Recognition that traditional holiday timing is outdated',
          evidence: ['Retail sales data: 22% of holiday shopping done by Halloween', 'Google Trends showing earlier search spikes'],
          confidence: 0.79,
          dataSource: 'Retail Insights',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 440 }
        }
      ],
      industry: [
        {
          id: 'industry-1',
          category: 'industry',
          type: 'hidden_pattern',
          thinkingStyle: 'analytical',
          insight: 'Professional services seeing 40% increase in demand',
          displayTitle: 'Consulting Boom - Capacity Crisis',
          whyProfound: 'High demand + limited supply = clients desperate for quality providers',
          whyNow: '40% surge means your competitors are drowning in work - chance to steal market share',
          contentAngle: 'Show you have capacity and quick onboarding when others are turning clients away',
          expectedReaction: 'Relief at finding available expert who can start immediately',
          evidence: ['IBISWorld industry report', 'Average wait time for consultants up 3x'],
          confidence: 0.85,
          dataSource: 'Industry Analysis',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 480 }
        },
        {
          id: 'industry-2',
          category: 'industry',
          type: 'hidden_pattern',
          thinkingStyle: 'analytical',
          insight: 'SaaS market projected to reach $700B by 2028',
          displayTitle: 'SaaS Gold Rush Validated',
          whyProfound: '$700B projection legitimizes SaaS as default buying behavior - not a trend, a paradigm shift',
          whyNow: 'Early SaaS adopters in your industry will dominate - be early or be irrelevant',
          contentAngle: 'Position as SaaS-native solution riding the wave vs legacy competitors',
          expectedReaction: 'Confidence that SaaS investment is sound long-term decision',
          evidence: ['Gartner SaaS forecast', 'Fortune 500: 78% shifting to SaaS-first strategy'],
          confidence: 0.89,
          dataSource: 'Market Research',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 500 }
        },
        {
          id: 'industry-3',
          category: 'industry',
          type: 'strategic_implication',
          thinkingStyle: 'creative',
          insight: 'B2B buyer journey now 83% complete before sales contact',
          displayTitle: 'Silent Research - Invisible Buyers',
          whyProfound: 'Buyers ghost-shopping you right now - you never know they existed until decision is made',
          whyNow: 'Traditional sales is dead - your content IS your sales team for 83% of the journey',
          contentAngle: 'Create content that answers every question before they even ask sales',
          expectedReaction: 'Realization they need to rethink entire go-to-market strategy',
          evidence: ['Forrester B2B buyer research', 'Buyers consume 13 pieces of content before contact'],
          confidence: 0.91,
          dataSource: 'Sales Intelligence',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 530 }
        },
        {
          id: 'industry-4',
          category: 'industry',
          type: 'hidden_pattern',
          thinkingStyle: 'analytical',
          insight: 'Marketing automation adoption up 150% in SMB sector',
          displayTitle: 'SMB Marketing Tech Revolution',
          whyProfound: 'SMBs finally have enterprise tools - democratization of marketing power',
          whyNow: '150% adoption means this is mainstream, not early adopter phase - laggards will lose',
          contentAngle: 'Show how your service integrates with their new marketing stack',
          expectedReaction: 'Excitement about competitive parity with larger competitors',
          evidence: ['HubSpot SMB adoption report', 'Average SMB now uses 6+ marketing tools'],
          confidence: 0.83,
          dataSource: 'MarTech Report',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 490 }
        }
      ],
      reviews: [
        {
          id: 'reviews-1',
          category: 'reviews',
          type: 'deep_psychology',
          thinkingStyle: 'creative',
          insight: 'Customers praise your fast response time and expertise',
          displayTitle: 'Speed + Expertise Combo',
          whyProfound: 'Customers value responsiveness MORE than perfection - speed signals care',
          whyNow: 'In age of slow customer service, speed is unfair competitive advantage',
          contentAngle: 'Lead with "same-day response guaranteed" messaging backed by review proof',
          expectedReaction: 'Trust from seeing real customers validate both speed and quality',
          evidence: ['Google Reviews: "response time" mentioned 47 times', 'Average review rating: 4.9/5 for service speed'],
          confidence: 0.94,
          dataSource: 'Google Reviews',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 510 }
        },
        {
          id: 'reviews-2',
          category: 'reviews',
          type: 'deep_psychology',
          thinkingStyle: 'creative',
          insight: 'Clients highlight ROI improvements averaging 180%',
          displayTitle: '180% ROI - Quantified Success',
          whyProfound: 'Specific numbers crush vague promises - 180% is believable AND impressive',
          whyNow: 'CFOs demand ROI proof - competitors making vague claims will lose to your data',
          contentAngle: 'Feature "$1 invested = $2.80 returned" angle with case study proof',
          expectedReaction: 'Shift from "sounds good" to "I need to calculate this for my business"',
          evidence: ['Client testimonials analysis: avg 180% ROI across 23 case studies', 'Lowest ROI reported: 142%'],
          confidence: 0.88,
          dataSource: 'Client Testimonials',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 520 }
        },
        {
          id: 'reviews-3',
          category: 'reviews',
          type: 'deep_psychology',
          thinkingStyle: 'creative',
          insight: '4.9/5 star rating across all platforms with 200+ reviews',
          displayTitle: 'Near-Perfect Social Proof',
          whyProfound: '200+ reviews proves consistency - not cherry-picked feedback',
          whyNow: '4.9 rating is "too good to ignore" threshold - triggers investigation from prospects',
          contentAngle: 'Make reviews your hero - social proof as main trust-building mechanism',
          expectedReaction: 'Instinctive trust - 200 people can\'t all be wrong',
          evidence: ['Review aggregation across Google, Yelp, Facebook', '4.9/5 puts you in top 2% of industry'],
          confidence: 0.96,
          dataSource: 'Review Aggregator',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 500 }
        }
      ],
      competitive: [
        {
          id: 'competitive-1',
          category: 'competitive',
          type: 'predictive_opportunity',
          thinkingStyle: 'analytical',
          insight: 'Competitors lack integrated solution - market gap identified',
          displayTitle: 'Integration Gap - Blue Ocean',
          whyProfound: 'Customers forced to duct-tape 3-4 vendors together - massive pain point',
          whyNow: 'First to market with integrated solution wins category - window closing fast',
          contentAngle: '"One platform vs. four vendors" positioning - simplicity wins',
          expectedReaction: 'Exhale of relief - "finally, someone gets it"',
          evidence: ['Competitor website analysis: all require 3rd party integrations', 'Reddit threads complaining about integration hell'],
          confidence: 0.87,
          dataSource: 'Competitor Analysis',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 510 }
        },
        {
          id: 'competitive-2',
          category: 'competitive',
          type: 'strategic_implication',
          thinkingStyle: 'analytical',
          insight: 'Your pricing is 25% more competitive for mid-market',
          displayTitle: '25% Price Advantage - Sweet Spot',
          whyProfound: '25% savings is enough to matter but not so cheap it signals low quality',
          whyNow: 'Mid-market businesses squeezed by enterprise pricing - you\'re the relief valve',
          contentAngle: '"Enterprise quality, mid-market pricing" narrative',
          expectedReaction: 'Excitement that they don\'t have to compromise quality for budget',
          evidence: ['Pricing analysis of top 5 competitors', 'Mid-market avg budget: $X, competitor avg: $Y, yours: $Z'],
          confidence: 0.82,
          dataSource: 'Market Comparison',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 490 }
        },
        {
          id: 'competitive-3',
          category: 'competitive',
          type: 'strategic_implication',
          thinkingStyle: 'creative',
          insight: 'Industry average response time is 3x slower than yours',
          displayTitle: '3x Faster - Speed Kills Competition',
          whyProfound: 'In competitive deals, faster responder usually wins - speed = caring',
          whyNow: 'Slow competitors creating opening for you to swoop in and close deals',
          contentAngle: '"While they take 3 days, we\'ll have your answer in 8 hours"',
          expectedReaction: 'Frustration with slow competitors transforms into hope',
          evidence: ['Industry benchmark: 72hr avg response', 'Your avg: 24hr response', 'Sales data: fast response = 3x close rate'],
          confidence: 0.90,
          dataSource: 'Benchmark Study',
          metadata: { generatedAt: new Date(), model: 'claude-sonnet-4', tokensUsed: 520 }
        }
      ]
    },
    totalCount: 24,
    countByCategory: {
      local: 3,
      trending: 4,
      seasonal: 3,
      industry: 4,
      reviews: 3,
      competitive: 3
    }
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
      // Convert underscore format to hyphen format for orchestrator
      const hyphenatedId = campaignTypeId.replace(/_/g, '-') as 'authority-builder' | 'social-proof' | 'local-pulse';
      const updatedSession = campaignOrchestrator.selectCampaignType(hyphenatedId);
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
      setLoading(true);
      const mockInsights = selectedInsights.map((insight) => ({
        id: insight.id,
        insight: insight.insight,
        confidence: insight.confidence,
        reasoning: `From ${insight.category}`,
        dataSource: insight.dataSource,
        score: insight.confidence * 100,
        metadata: insight.metadata
      }));

      await campaignOrchestrator.selectCustomInsights(mockInsights as any);
      await campaignOrchestrator.generateCampaign();
    } catch (err) {
      console.error('[CampaignPage] Error generating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    } finally {
      setLoading(false);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-purple-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Campaign Builder
                  </h1>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  {currentStep === 'IDLE' && 'Select your campaign type'}
                  {currentStep === 'TYPE_SELECTED' && 'Choose how to build your campaign'}
                  {currentStep === 'GENERATING' && 'Creating your campaign content...'}
                  {currentStep === 'PREVIEW' && 'Review and approve your campaign'}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {session.progress}% Complete
              </span>
              <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
        {/* Step 1: Campaign Type Selection */}
        {currentStep === 'IDLE' && session.context && (
          <div>
            <CampaignTypeSelector
              context={session.context}
              onContinue={handleCampaignTypeSelect}
            />
          </div>
        )}

        {/* Step 2: Content Selection Mode */}
        {currentStep === 'TYPE_SELECTED' && !selectionMode && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                How would you like to build your campaign?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setSelectionMode('smart-picks')}
                  className="group text-left p-6 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  <Zap className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Smart Picks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    AI-curated campaign recommendations. Select one and go!
                  </p>
                  <span className="inline-block mt-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                    Recommended →
                  </span>
                </button>

                <button
                  onClick={() => setSelectionMode('mixer')}
                  className="group text-left p-6 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Content Mixer
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Build custom campaigns by selecting specific insights
                  </p>
                  <span className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                    For custom campaigns →
                  </span>
                </button>
              </div>
            </Card>
          </div>
        )}

        <AnimatePresence mode="wait">

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
          {(currentStep === 'PREVIEW' || currentStep === 'APPROVED') && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {session.generatedContent ? (
                <CampaignPreview
                  campaignData={convertToPreviewData(session.generatedContent, session)}
                  onApprove={handleApprove}
                  onReject={() => console.log('Reject clicked')}
                  onRegenerateAll={async () => { console.log('Regenerate all clicked'); }}
                  onSectionRegenerate={async (platform, section, options) => {
                    console.log('Regenerate section:', platform, section, options);
                    return { section, alternatives: [] };
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400">Error: Campaign content not generated</p>
                  <pre className="mt-4 text-left bg-gray-100 dark:bg-slate-800 p-4 rounded overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
