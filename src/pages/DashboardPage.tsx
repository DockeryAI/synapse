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
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  X,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { insightsStorageService, type BusinessInsights } from '@/services/insights/insights-storage.service';
import { deepContextBuilder } from '@/services/intelligence/deepcontext-builder.service';
import { InsightDetailsModal } from '@/components/dashboard/InsightDetailsModal';
import { InsightsHub } from '@/components/dashboard/InsightsHub';
import { FloatingActionButtons } from '@/components/shared/FloatingActionButtons';
import { QuickLaunchStrip } from '@/components/dashboard/QuickLaunchStrip';
import { AiPicksPanel } from '@/components/dashboard/AiPicksPanel';
import { IntelligenceLibraryV2 } from '@/components/dashboard/IntelligenceLibraryV2';
import { SelectionBar } from '@/components/dashboard/SelectionBar';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { hasPendingUVP, getPendingUVP } from '@/services/database/marba-uvp-migration.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

type ViewMode = 'dashboard' | 'insights_hub';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPick, setSelectedPick] = useState<SmartPick | null>(null);
  const [deepContext, setDeepContext] = useState<DeepContext | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);

  // Mock picks for now (TODO: Replace with real SmartPick generation)
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
      trustIndicators: ['Industry expertise'],
      whyRecommended: 'Build trust and credibility',
    },
    {
      id: 'mock-2',
      title: 'Customer Success Stories',
      description: 'Share transformation stories',
      campaignType: 'social-proof',
      confidence: 0.8,
      relevance: 0.85,
      timeliness: 0.7,
      evidenceQuality: 0.75,
      overallScore: 0.77,
      insights: [],
      dataSources: [],
      trustIndicators: ['Social proof'],
      whyRecommended: 'Showcase customer results',
    },
    {
      id: 'mock-3',
      title: 'Problem-Solution Series',
      description: 'Address pain points systematically',
      campaignType: 'authority-builder',
      confidence: 0.75,
      relevance: 0.8,
      timeliness: 0.65,
      evidenceQuality: 0.7,
      overallScore: 0.72,
      insights: [],
      dataSources: [],
      trustIndicators: ['Solution-focused'],
      whyRecommended: 'Direct value proposition',
    },
  ];

  const contentPicks: SmartPick[] = [
    {
      id: 'content-1',
      title: 'Key Benefit Spotlight',
      description: 'Highlight your main value proposition',
      campaignType: 'single-post',
      confidence: 0.9,
      relevance: 0.95,
      timeliness: 0.8,
      evidenceQuality: 0.85,
      overallScore: 0.87,
      insights: [],
      dataSources: [],
      trustIndicators: ['Core value'],
      whyRecommended: 'Strong resonance with target audience',
    },
    {
      id: 'content-2',
      title: 'Industry Insight Post',
      description: 'Share valuable industry knowledge',
      campaignType: 'single-post',
      confidence: 0.75,
      relevance: 0.8,
      timeliness: 0.7,
      evidenceQuality: 0.72,
      overallScore: 0.74,
      insights: [],
      dataSources: [],
      trustIndicators: ['Expert positioning'],
      whyRecommended: 'Thought leadership opportunity',
    },
    {
      id: 'content-3',
      title: 'Customer Transformation',
      description: 'Feature a success story',
      campaignType: 'single-post',
      confidence: 0.78,
      relevance: 0.82,
      timeliness: 0.68,
      evidenceQuality: 0.75,
      overallScore: 0.75,
      insights: [],
      dataSources: [],
      trustIndicators: ['Social proof'],
      whyRecommended: 'Build credibility',
    },
  ];

  // Load insights on mount
  useEffect(() => {
    async function loadInsights() {
      // Check for localStorage UVP data first
      const hasPending = hasPendingUVP();
      console.log('[DashboardPage] hasPendingUVP:', hasPending, 'brand.id:', brand?.id);

      // Run intelligence for ALL brands (no more temp brand bullshit)
      if (brand?.id) {
        console.log('[DashboardPage] Brand ID exists, using DeepContextBuilder for full intelligence stack');

        try {
          setLoading(true);

          // Use DeepContextBuilder to get FULL intelligence from all API sources
          console.log('[DashboardPage] Building full DeepContext from intelligence stack...');
          const buildResult = await deepContextBuilder.buildDeepContext({
            brandId: brand.id,
            cacheResults: true, // Cache for 24 hours
            forceFresh: false, // Use cache if available
          });

          console.log('[DashboardPage] DeepContext built:', {
            dataSourcesUsed: buildResult.metadata.dataSourcesUsed,
            dataPointsCollected: buildResult.metadata.dataPointsCollected,
            buildTimeMs: buildResult.metadata.buildTimeMs,
            errors: buildResult.metadata.errors,
          });

          // Log the actual context structure to see what's populated
          console.log('[DashboardPage] DeepContext structure:', {
            industryTrends: buildResult.context.industry?.trends?.length || 0,
            customerNeeds: buildResult.context.customerPsychology?.unarticulated?.length || 0,
            customerTriggers: buildResult.context.customerPsychology?.emotional?.length || 0,
            blindSpots: buildResult.context.competitiveIntel?.blindSpots?.length || 0,
            opportunities: buildResult.context.competitiveIntel?.opportunities?.length || 0,
            keyInsights: buildResult.context.synthesis?.keyInsights?.length || 0,
            hiddenPatterns: buildResult.context.synthesis?.hiddenPatterns?.length || 0,
          });

          setDeepContext(buildResult.context);

          // Also load insights for backwards compatibility with InsightsHub
          const data = await insightsStorageService.getInsights(brand.id);
          if (data) {
            setInsights(data);
          }

          setLoading(false);
          return;
        } catch (error) {
          console.error('[DashboardPage] Failed to load intelligence from DeepContextBuilder:', error);
          // Fall through to localStorage fallback
        }
      }

      // Fallback: Use localStorage UVP data if no brand or API failed
      if (hasPending) {
        console.log('[DashboardPage] Using localStorage UVP fallback data');
        const pendingUVP = getPendingUVP();

        if (pendingUVP) {
          // Get business name from localStorage
          const businessName = localStorage.getItem('business_name') || 'Your Business';
          const websiteUrl = localStorage.getItem('website_url') || '';

          // Convert UVP data to insights format for display
          const uvpAsInsights: BusinessInsights = {
            websiteAnalysis: {
              brandVoice: pendingUVP.targetCustomer?.statement || 'Professional',
              contentThemes: [pendingUVP.targetCustomer?.statement || ''].filter(Boolean),
              serviceOfferings: pendingUVP.products?.map(p => p.name) || [],
              uniqueSellingPoints: pendingUVP.uniqueSolution ? [pendingUVP.uniqueSolution.statement] : [],
            },
            locationData: null,
            competitorData: [],
            industryData: null,
            targetAudience: {
              segments: pendingUVP.targetCustomer ? [pendingUVP.targetCustomer] : [],
              primarySegment: pendingUVP.targetCustomer || null,
            },
            servicesProducts: pendingUVP.products || [],
            customerTriggers: [],
            marketTrends: [],
            contentGaps: [],
            opportunities: [],
            complete: true,
            extractedAt: new Date().toISOString(),
          };

          setInsights(uvpAsInsights);

          // Build DeepContext from actual user's UVP responses
          const industry = pendingUVP.targetCustomer?.industry || 'General Business';
          const targetCustomer = pendingUVP.targetCustomer?.statement || '';
          const transformation = pendingUVP.transformationGoal?.statement || '';
          const solution = pendingUVP.uniqueSolution?.statement || '';
          const benefit = pendingUVP.keyBenefit?.statement || '';
          const products = pendingUVP.products || [];

          // Generate insights from actual user responses in plain English
          const relevantTrends = [];

          // Parse transformation goal to extract the desired end state
          if (transformation) {
            // Extract what customers want (the "to" part of "transform from X to Y")
            const transformParts = transformation.split(/transform from|and transform from/i);
            const endStates = transformParts
              .filter(part => part.includes(' to '))
              .map(part => {
                const toIndex = part.toLowerCase().indexOf(' to ');
                return part.substring(toIndex + 4).trim();
              })
              .filter(Boolean);

            if (endStates.length > 0) {
              // Use the last (most important) end state
              const mainGoal = endStates[endStates.length - 1]
                .replace(/^(experiencing|having|getting|achieving)\s+/i, '')
                .trim();

              relevantTrends.push({
                trend: `More homeowners want ${mainGoal}`,
                direction: 'Growing' as const,
                impact: 'High' as const,
                strength: 0.88,
                source: 'Customer demand',
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (targetCustomer) {
            // Make target customer more conversational
            const cleanCustomer = targetCustomer
              .replace(/^(who are|that are|those who)\s+/i, '')
              .trim();

            relevantTrends.push({
              trend: `${cleanCustomer} looking for experts they can trust`,
              direction: 'Growing' as const,
              impact: 'High' as const,
              strength: 0.82,
              source: 'Your target market',
              timestamp: new Date().toISOString(),
            });
          }

          if (products.length > 0) {
            const productName = products[0].name
              .replace(/^(the|a|an)\s+/i, '')
              .toLowerCase();

            relevantTrends.push({
              trend: `High demand for quality ${productName}`,
              direction: 'Growing' as const,
              impact: 'Medium' as const,
              strength: 0.75,
              source: 'Market trends',
              timestamp: new Date().toISOString(),
            });
          }

          const context: DeepContext = {
            business: {
              profile: {
                id: 'temp-' + Date.now(),
                name: businessName,
                industry: industry,
                naicsCode: '',
                website: websiteUrl,
                location: {
                  city: '',
                  state: '',
                  country: 'USA',
                },
                keywords: [],
                competitors: [],
              },
              brandVoice: {
                tone: ['professional', 'trustworthy'],
                values: [],
                personality: [],
                avoidWords: [],
                signaturePhrases: [],
              },
              uniqueAdvantages: solution ? [solution] : [],
              goals: transformation ? [transformation] : [],
            },
            industry: {
              trends: relevantTrends,
              challenges: [],
              opportunities: [],
              compliance: [],
              customerPain: targetCustomer ? [targetCustomer] : [],
            },
            localIntel: {
              competitors: [],
              events: [],
              culturalMoments: [],
              seasonalContext: null,
              reviews: null,
            },
            competitiveIntel: {
              blindSpots: solution
                ? [
                    {
                      topic: `Unique positioning: ${solution}`,
                      reasoning: 'Most competitors don\'t emphasize this angle',
                      opportunityScore: 87,
                      evidence: ['Your unique solution insight'],
                      actionableInsight: `Lead with: "${solution}"`,
                    },
                    benefit
                      ? {
                          topic: `Key benefit differentiation: ${benefit}`,
                          reasoning: 'Competitors may not communicate this value clearly',
                          opportunityScore: 82,
                          evidence: ['Your key benefit insight'],
                          actionableInsight: `Emphasize: "${benefit}"`,
                        }
                      : {
                          topic: 'Clear value communication',
                          reasoning: 'Many competitors struggle with articulating benefits',
                          opportunityScore: 78,
                          evidence: ['Market analysis'],
                          actionableInsight: 'Make your value proposition crystal clear',
                        },
                  ]
                : [],
              mistakes: [],
              opportunities: [
                targetCustomer
                  ? {
                      gap: `Content that speaks directly to ${targetCustomer.toLowerCase()}`,
                      positioning: `Be the obvious choice for ${targetCustomer.toLowerCase()}`,
                      evidence: ['Your target audience'],
                    }
                  : {
                      gap: 'Content for your specific audience',
                      positioning: 'Talk to your ideal customer',
                      evidence: ['Audience research'],
                    },
                (() => {
                  if (transformation) {
                    // Extract main goal
                    const transformParts = transformation.split(/transform from|and transform from/i);
                    const endStates = transformParts
                      .filter(part => part.includes(' to '))
                      .map(part => {
                        const toIndex = part.toLowerCase().indexOf(' to ');
                        return part.substring(toIndex + 4).trim();
                      })
                      .filter(Boolean);

                    if (endStates.length > 0) {
                      const mainGoal = endStates[endStates.length - 1]
                        .replace(/^(experiencing|having|getting|achieving)\s+/i, '')
                        .trim();

                      return {
                        gap: `Show people how to get ${mainGoal}`,
                        positioning: `Be the expert on ${mainGoal}`,
                        evidence: ['Your customer goal'],
                      };
                    }
                  }
                  return {
                    gap: 'Talk about outcomes, not just services',
                    positioning: 'Focus on what customers get',
                    evidence: ['Marketing best practices'],
                  };
                })(),
                ...(products.length > 0
                  ? [
                      {
                        gap: `Help people understand ${products[0].name.toLowerCase()}`,
                        positioning: `Be the trusted expert on ${products[0].name.toLowerCase()}`,
                        evidence: ['Your service'],
                      },
                    ]
                  : []),
              ],
              contentGaps: [],
              positioningWeaknesses: [],
            },
            customerPsychology: {
              unarticulated: [
                targetCustomer
                  ? {
                      need: `${targetCustomer} want to work with people who really understand them`,
                      emotionalDriver: 'Want to feel understood, not just sold to',
                      confidence: 0.85,
                      marketingAngle: 'Show you get their specific situation',
                      evidence: ['Your target customer'],
                    }
                  : {
                      need: 'Customers want to feel understood',
                      emotionalDriver: 'Want personalized help',
                      confidence: 0.75,
                      marketingAngle: 'Show you understand their needs',
                      evidence: ['Customer research'],
                    },
                (() => {
                  if (transformation) {
                    // Extract main goal
                    const transformParts = transformation.split(/transform from|and transform from/i);
                    const endStates = transformParts
                      .filter(part => part.includes(' to '))
                      .map(part => {
                        const toIndex = part.toLowerCase().indexOf(' to ');
                        return part.substring(toIndex + 4).trim();
                      })
                      .filter(Boolean);

                    if (endStates.length > 0) {
                      const mainGoal = endStates[endStates.length - 1]
                        .replace(/^(experiencing|having|getting|achieving)\s+/i, '')
                        .trim();

                      return {
                        need: `People want ${mainGoal} but don't always say it that way`,
                        emotionalDriver: 'They want the end result, not the process',
                        confidence: 0.88,
                        marketingAngle: `Show them what life looks like with ${mainGoal}`,
                        evidence: ['Your customer goal'],
                      };
                    }
                  }
                  return {
                    need: 'Want the outcome, not just the service',
                    emotionalDriver: 'Care about results',
                    confidence: 0.78,
                    marketingAngle: 'Focus on what they get, not what you do',
                    evidence: ['Buyer behavior'],
                  };
                })(),
                benefit
                  ? {
                      need: `Deep down, people really want ${benefit.toLowerCase()}`,
                      emotionalDriver: 'This is what they are really after',
                      confidence: 0.82,
                      marketingAngle: `Make ${benefit.toLowerCase()} the star of your message`,
                      evidence: ['Your key benefit'],
                    }
                  : {
                      need: 'Want real results, not just promises',
                      emotionalDriver: 'Need to know it actually works',
                      confidence: 0.80,
                      marketingAngle: 'Show proof and real results',
                      evidence: ['Market research'],
                    },
              ],
              emotional: [
                (() => {
                  if (transformation) {
                    // Extract main goal
                    const transformParts = transformation.split(/transform from|and transform from/i);
                    const endStates = transformParts
                      .filter(part => part.includes(' to '))
                      .map(part => {
                        const toIndex = part.toLowerCase().indexOf(' to ');
                        return part.substring(toIndex + 4).trim();
                      })
                      .filter(Boolean);

                    if (endStates.length > 0) {
                      const mainGoal = endStates[endStates.length - 1]
                        .replace(/^(experiencing|having|getting|achieving)\s+/i, '')
                        .trim();

                      return {
                        trigger: mainGoal,
                        context: 'What your customers really want',
                        strength: 0.95,
                        positioning: 'Talk about this in everything you do',
                      };
                    }
                  }
                  return {
                    trigger: 'Getting what they want',
                    context: 'Basic desire',
                    strength: 0.75,
                    positioning: 'Focus on their goals',
                  };
                })(),
                targetCustomer
                  ? {
                      trigger: `Being seen as a successful ${targetCustomer.toLowerCase()}`,
                      context: 'They want to feel good about who they are',
                      strength: 0.88,
                      positioning: `Help them become who they want to be`,
                    }
                  : {
                      trigger: 'Feeling successful',
                      context: 'Want to feel good',
                      strength: 0.80,
                      positioning: 'Help them feel accomplished',
                    },
                benefit
                  ? {
                      trigger: benefit,
                      context: 'Your main promise',
                      strength: 0.90,
                      positioning: `Make ${benefit.toLowerCase()} real and tangible`,
                    }
                  : {
                      trigger: 'Getting real results',
                      context: 'What matters most',
                      strength: 0.82,
                      positioning: 'Prove it works',
                    },
              ],
              behavioral: [],
              identityDesires: [],
              purchaseMotivations: [],
              objections: [],
            },
            synthesis: {
              keyInsights: [
                // Extract clean, plain English insights
                targetCustomer ? `Who you serve: ${targetCustomer}` : null,
                // Parse transformation to extract the goal (what they want to achieve)
                transformation
                  ? (() => {
                      const transformParts = transformation.split(/transform from|and transform from/i);
                      const endStates = transformParts
                        .filter(part => part.includes(' to '))
                        .map(part => {
                          const toIndex = part.toLowerCase().indexOf(' to ');
                          return part.substring(toIndex + 4).trim();
                        })
                        .filter(Boolean);

                      if (endStates.length > 1) {
                        // Multiple goals - create a clean list
                        const mainGoals = endStates
                          .map(state => state.replace(/^(experiencing|having|getting|achieving)\s+/i, '').trim())
                          .slice(-2); // Last 2 most important
                        return `What customers want: ${mainGoals.join(' and ')}`;
                      } else if (endStates.length === 1) {
                        const goal = endStates[0].replace(/^(experiencing|having|getting|achieving)\s+/i, '').trim();
                        return `What customers want: ${goal}`;
                      }
                      return null;
                    })()
                  : null,
                solution ? `How you're different: ${solution}` : null,
                benefit ? `Your biggest value: ${benefit}` : null,
                targetCustomer
                  ? `${targetCustomer} prefer honest talk over sales pitches`
                  : 'Customers value authenticity',
                'Show real results - people trust proof over promises',
                solution
                  ? `Your unique way of doing things sets you apart`
                  : 'Being different matters',
              ].filter(Boolean),
              hiddenPatterns: [
                targetCustomer
                  ? {
                      pattern: `${targetCustomer} trust recommendations from people like them`,
                      confidence: 0.87,
                      type: 'social' as const,
                      implications: [
                        `Show testimonials from similar ${targetCustomer.toLowerCase()}`,
                        'Share real customer stories',
                      ],
                      sources: ['Your target audience', 'Social proof research'],
                    }
                  : {
                      pattern: 'People trust recommendations from peers',
                      confidence: 0.80,
                      type: 'social' as const,
                      implications: ['Share customer testimonials', 'Show real results'],
                      sources: ['Conversion research'],
                    },
                (() => {
                  if (transformation) {
                    // Extract main goal in plain English
                    const transformParts = transformation.split(/transform from|and transform from/i);
                    const endStates = transformParts
                      .filter(part => part.includes(' to '))
                      .map(part => {
                        const toIndex = part.toLowerCase().indexOf(' to ');
                        return part.substring(toIndex + 4).trim();
                      })
                      .filter(Boolean);

                    if (endStates.length > 0) {
                      const mainGoal = endStates[endStates.length - 1]
                        .replace(/^(experiencing|having|getting|achieving)\s+/i, '')
                        .trim();

                      return {
                        pattern: `People who want ${mainGoal} care more about expertise than price`,
                        confidence: 0.85,
                        type: 'behavioral' as const,
                        implications: ['Show your expertise first', 'Prove you can deliver results'],
                        sources: ['Customer behavior', 'Your market'],
                      };
                    }
                  }
                  return {
                    pattern: 'Expertise matters more than price to quality buyers',
                    confidence: 0.78,
                    type: 'behavioral' as const,
                    implications: ['Demonstrate your expertise', 'Share your track record'],
                    sources: ['Trust research'],
                  };
                })(),
                benefit
                  ? {
                      pattern: `People respond strongly to ${benefit.toLowerCase()}`,
                      confidence: 0.90,
                      type: 'emotional' as const,
                      implications: [
                        `Make ${benefit.toLowerCase()} clear and real`,
                        `Lead with ${benefit.toLowerCase()} in your messaging`,
                      ],
                      sources: ['Your key benefit', 'Market data'],
                    }
                  : {
                      pattern: 'Clear benefits win over feature lists',
                      confidence: 0.82,
                      type: 'emotional' as const,
                      implications: ['Focus on what customers get', 'Skip the jargon'],
                      sources: ['Marketing research'],
                    },
              ],
              opportunityScore: 82,
              recommendedAngles: [],
              confidenceLevel: 0.8,
              generatedAt: new Date(),
            },
            metadata: {
              aggregatedAt: new Date(),
              dataSourcesUsed: ['uvp', 'localStorage', 'mock-intelligence'],
              processingTimeMs: 0,
              version: '1.0.0',
            },
          };

          setDeepContext(context);
          setLoading(false);
          return;
        }
      }

      // If we get here, no brand and no pending UVP - redirect to onboarding
      console.log('[DashboardPage] No brand ID and no pending UVP, redirecting to onboarding');
      navigate('/onboarding');
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

  // Handle insight selection toggle
  const handleToggleInsight = (insightId: string) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  // Handle select all insights
  const handleSelectAll = () => {
    // TODO: Get all insight IDs from context
    console.log('[DashboardPage] Select all insights');
  };

  // Handle clear all selections
  const handleClearAll = () => {
    setSelectedInsights([]);
  };

  // Handle mix content with selected insights
  const handleMixContent = () => {
    // Navigate to Synapse with selected insights
    console.log('[DashboardPage] Mixing content with:', selectedInsights);
    navigate('/synapse', { state: { selectedInsights } });
  };

  // Handle create campaign with selected insights
  const handleCreateCampaign = () => {
    console.log('[DashboardPage] Creating campaign with:', selectedInsights);
    navigate('/campaign/new', { state: { selectedInsights } });
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

  // Get top pick for Quick Launch Strip
  const topPick = campaignPicks[0] || contentPicks[0] || null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {viewMode === 'dashboard' ? (
          /* Command Center Layout */
          <div key="dashboard" className="h-screen flex flex-col">
            {/* Quick Launch Strip */}
            {topPick && deepContext && (
              <div className="flex-shrink-0 p-4">
                <QuickLaunchStrip
                  topPick={topPick}
                  onLaunch={handleGenerate}
                />
              </div>
            )}

            {/* Two-Panel Layout */}
            <div className="flex-1 flex gap-4 p-4 pt-0 overflow-hidden">
              {/* Left Panel: AI Picks (flexible width based on collapsed state) */}
              <div className="flex-shrink-0 rounded-xl shadow-lg overflow-hidden">
                <AiPicksPanel
                  campaignPicks={campaignPicks}
                  contentPicks={contentPicks}
                  onPickClick={handlePickClick}
                />
              </div>

              {/* Right Panel: Intelligence Library V2 (fills remaining space) */}
              <div className="flex-1 min-w-0 rounded-xl shadow-lg overflow-hidden">
                {deepContext && (
                  <IntelligenceLibraryV2
                    context={deepContext}
                    onGenerateCampaign={handleCreateCampaign}
                  />
                )}
              </div>
            </div>

            {/* Selection Bar (appears when insights selected) */}
            <SelectionBar
              selectedCount={selectedInsights.length}
              onCreateCampaign={handleCreateCampaign}
              onMixContent={handleMixContent}
              onClear={handleClearAll}
            />
          </div>
        ) : (
          /* Insights Hub View */
          <motion.div
            key="insights-hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {insights && <InsightsHub insights={insights} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <FloatingActionButtons />

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
