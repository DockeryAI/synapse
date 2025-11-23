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
import { AiPicksPanel } from '@/components/dashboard/AiPicksPanel';
import { IntelligenceLibraryV2 } from '@/components/dashboard/IntelligenceLibraryV2';
import { SelectionBar } from '@/components/dashboard/SelectionBar';
import type { SmartPick } from '@/types/smart-picks.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import { hasPendingUVP, getPendingUVP } from '@/services/database/marba-uvp-migration.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import { industryCustomizationService } from '@/services/v2/industry-customization.service';
import { useSessionAutoSave } from '@/hooks/useSessionAutoSave';

type ViewMode = 'dashboard' | 'insights_hub';

// Helper function to map category names to campaign types
function mapCampaignType(category: string): SmartPick['campaignType'] {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('seasonal')) return 'multi-post';
  if (categoryLower.includes('educational') || categoryLower.includes('education')) return 'authority-builder';
  if (categoryLower.includes('competitive')) return 'authority-builder';
  if (categoryLower.includes('authority')) return 'authority-builder';
  if (categoryLower.includes('social') || categoryLower.includes('proof')) return 'social-proof';
  if (categoryLower.includes('local')) return 'local-pulse';

  return 'multi-post'; // Default
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loadingProgress, setLoadingProgress] = useState<string>('Starting intelligence gathering...');
  const [dataPointsCollected, setDataPointsCollected] = useState<number>(0);
  const [layersCompleted, setLayersCompleted] = useState<string[]>([]);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [connectionsFound, setConnectionsFound] = useState<{twoWay: number; threeWay: number; fourWay: number}>({twoWay: 0, threeWay: 0, fourWay: 0});
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPick, setSelectedPick] = useState<SmartPick | null>(null);
  const [deepContext, setDeepContext] = useState<DeepContext | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);

  // Session auto-save - mark session as complete when dashboard loads
  const sessionId = localStorage.getItem('current_session_id');
  const { saveImmediately } = useSessionAutoSave({
    sessionId,
    currentStep: 'dashboard',
  });

  // Real smart picks from orchestration (populated after intelligence loads)
  const [campaignPicks, setCampaignPicks] = useState<SmartPick[]>([]);
  const [contentPicks, setContentPicks] = useState<SmartPick[]>([]);

  // Clusters and breakthroughs for display
  const [clusters, setClusters] = useState<any[]>([]);
  const [breakthroughs, setBreakthroughs] = useState<any[]>([]);

  // Mark session as complete when dashboard loads
  useEffect(() => {
    if (sessionId && brand?.id) {
      console.log('[DashboardPage] Marking session as complete (dashboard reached)');
      saveImmediately({
        current_step: 'dashboard',
        progress_percentage: 100,
        completed_steps: ['welcome', 'products', 'customer', 'transformation', 'solution', 'benefit', 'confirmation'],
      });
    }
  }, [sessionId, brand?.id, saveImmediately]);

  // Load insights on mount
  useEffect(() => {
    async function loadInsights() {
      // Check for localStorage UVP data first
      const hasPending = hasPendingUVP();
      console.log('[DashboardPage] hasPendingUVP:', hasPending, 'brand.id:', brand?.id);

      // Trigger industry research in background if needed
      if (brand?.industry && brand?.naicsCode) {
        const status = industryCustomizationService.getIndustryStatus(brand.industry);
        if (status === 'pending') {
          console.log('[DashboardPage] Triggering background industry research for:', brand.industry);
          // Fire and forget - don't await
          industryCustomizationService.triggerBackgroundResearch(
            brand.naicsCode,
            brand.industry
          ).catch(err => console.error('[DashboardPage] Industry research failed:', err));
        }
      }

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
            onProgress: (progress) => {
              // Update loading state with progress
              setCurrentPhase(progress.phase);
              setLoadingProgress(progress.message);
              setDataPointsCollected(progress.dataPointsCollected);
              if (progress.layersCompleted) setLayersCompleted(progress.layersCompleted);
              if (progress.discoveries) setDiscoveries(progress.discoveries);
              if (progress.connectionsFound) setConnectionsFound(progress.connectionsFound);

              // Update DeepContext as partial results come in
              if (progress.partialContext) {
                setDeepContext(progress.partialContext);
                // Turn off loading overlay once Phase 2 starts (pattern discovery)
                if (progress.phase >= 2) {
                  setLoading(false);
                }
              }

              console.log(`[DashboardPage] Phase ${progress.phase}:`, progress.stage, progress.message);
            }
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

          // Extract clusters and breakthroughs from orchestration
          if (buildResult.orchestration) {
            console.log('[DashboardPage] Orchestration results:', {
              clusters: buildResult.orchestration.clusters?.length || 0,
              realBreakthroughs: buildResult.orchestration.realBreakthroughs?.length || 0,
              smartPicks: {
                campaigns: buildResult.orchestration.smartPicks?.campaigns?.length || 0,
                content: buildResult.orchestration.smartPicks?.content?.length || 0
              }
            });

            // Store clusters
            if (buildResult.orchestration.clusters) {
              setClusters(buildResult.orchestration.clusters);
              console.log('[DashboardPage] Clusters with validation:', buildResult.orchestration.clusters.map(c => ({
                theme: c.theme,
                size: c.size,
                validation: c.validationStatement
              })));
            }

            // Store breakthroughs
            if (buildResult.orchestration.realBreakthroughs) {
              setBreakthroughs(buildResult.orchestration.realBreakthroughs);
              console.log('[DashboardPage] Real breakthroughs:', buildResult.orchestration.realBreakthroughs.map(b => ({
                title: b.title,
                score: b.score,
                category: b.category,
                validation: b.validation.validationStatement
              })));
            }
          }

          // Extract and transform Smart Picks from orchestration
          if (buildResult.orchestration?.smartPicks) {
            const { campaigns, content } = buildResult.orchestration.smartPicks;

            console.log('[DashboardPage] Smart Picks found:', {
              campaigns: campaigns?.length || 0,
              content: content?.length || 0
            });

            // Transform orchestration smart picks to UI SmartPick format
            const transformedCampaigns: SmartPick[] = (campaigns || []).map((pick: any) => ({
              id: pick.id,
              title: pick.title,
              description: pick.description,
              campaignType: mapCampaignType(pick.category),
              confidence: pick.confidence / 100, // Convert 0-100 to 0-1
              relevance: pick.confidence / 100,
              timeliness: pick.urgency === 'critical' ? 1.0 : pick.urgency === 'high' ? 0.8 : 0.6,
              evidenceQuality: pick.provenance?.length ? Math.min(1.0, pick.provenance.length / 5) : 0.7,
              overallScore: pick.confidence / 100,
              insights: [],
              dataSources: pick.provenance || [],
              preview: pick.data ? {
                headline: pick.data.name || pick.title,
                hook: pick.data.pieces?.[0]?.hook || pick.description,
                platform: pick.data.pieces?.[0]?.channel || 'Blog',
              } : undefined,
              reasoning: pick.reasoning,
              expectedPerformance: pick.expectedPerformance ? {
                engagement: pick.expectedPerformance[0]?.value || 'medium',
                reach: 'medium',
                conversions: pick.expectedPerformance[2]?.value || 'medium',
              } : undefined,
              urgencyLevel: pick.urgency,
              performanceMetrics: pick.expectedPerformance,
              campaignData: pick.data,
              metadata: {
                generatedAt: new Date(),
              },
            }));

            const transformedContent: SmartPick[] = (content || []).map((pick: any) => ({
              id: pick.id,
              title: pick.title,
              description: pick.description,
              campaignType: 'single-post' as const,
              confidence: pick.confidence / 100,
              relevance: pick.confidence / 100,
              timeliness: pick.urgency === 'critical' ? 1.0 : pick.urgency === 'high' ? 0.8 : 0.6,
              evidenceQuality: pick.provenance?.length ? Math.min(1.0, pick.provenance.length / 5) : 0.7,
              overallScore: pick.confidence / 100,
              insights: [],
              dataSources: pick.provenance || [],
              preview: {
                headline: pick.title,
                hook: pick.description,
                platform: 'Blog',
              },
              reasoning: pick.reasoning,
              expectedPerformance: pick.expectedPerformance ? {
                engagement: pick.expectedPerformance[0]?.value || 'medium',
                reach: 'medium',
                conversions: 'medium',
              } : undefined,
              urgencyLevel: pick.urgency,
              performanceMetrics: pick.expectedPerformance,
              breakthroughData: pick.data,
              metadata: {
                generatedAt: new Date(),
              },
            }));

            setCampaignPicks(transformedCampaigns);
            setContentPicks(transformedContent);

            console.log('[DashboardPage] Transformed smart picks:', {
              campaigns: transformedCampaigns.length,
              content: transformedContent.length
            });
          }

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
              services: [], // CompleteUVP doesn't have products directly
              uvps: pendingUVP.uniqueSolution ? [pendingUVP.uniqueSolution.statement] : [],
              keyMessages: [],
            },
            servicesProducts: [],
            customerTriggers: [],
            marketTrends: [],
            competitorData: [],
          };

          setInsights(uvpAsInsights);

          // Build DeepContext from actual user's UVP responses
          const industry = pendingUVP.targetCustomer?.industry || 'General Business';
          const targetCustomer = pendingUVP.targetCustomer?.statement || '';
          const transformation = pendingUVP.transformationGoal?.statement || '';
          const solution = pendingUVP.uniqueSolution?.statement || '';
          const benefit = pendingUVP.keyBenefit?.statement || '';

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
                direction: 'rising' as const,
                impact: 'high' as const,
                strength: 0.88,
                timeframe: 'current',
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
              direction: 'rising' as const,
              impact: 'high' as const,
              strength: 0.82,
              timeframe: 'current',
              source: 'Your target market',
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
                tone: ['professional', 'authoritative'],
                values: [],
                personality: [],
                avoidWords: [],
                signaturePhrases: [],
              },
              uniqueAdvantages: solution ? [solution] : [],
              goals: transformation ? [{
                goal: transformation,
                priority: 'primary' as const,
                timeframe: 'ongoing',
                metrics: [],
              }] : [],
            },
            industry: {
              profile: null,
              trends: relevantTrends,
              seasonality: [],
              competitiveLandscape: {
                topCompetitors: [],
                marketConcentration: 'fragmented' as const,
                barrierToEntry: 'medium' as const,
              },
              economicFactors: [],
            },
            realTimeCultural: {
              trends: [],
              moments: [],
              signals: [],
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
                        leverage: 'Talk about this in everything you do',
                      };
                    }
                  }
                  return {
                    trigger: 'Getting what they want',
                    context: 'Basic desire',
                    strength: 0.75,
                    leverage: 'Focus on their goals',
                  };
                })(),
                targetCustomer
                  ? {
                      trigger: `Being seen as a successful ${targetCustomer.toLowerCase()}`,
                      context: 'They want to feel good about who they are',
                      strength: 0.88,
                      leverage: `Help them become who they want to be`,
                    }
                  : {
                      trigger: 'Feeling successful',
                      context: 'Want to feel good',
                      strength: 0.80,
                      leverage: 'Help them feel accomplished',
                    },
                benefit
                  ? {
                      trigger: benefit,
                      context: 'Your main promise',
                      strength: 0.90,
                      leverage: `Make ${benefit.toLowerCase()} real and tangible`,
                    }
                  : {
                      trigger: 'Getting real results',
                      context: 'What matters most',
                      strength: 0.82,
                      leverage: 'Prove it works',
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
                      type: 'correlation' as const,
                      significance: 0.87,
                      implication: `Show testimonials from similar ${targetCustomer.toLowerCase()} and share real customer stories`,
                      evidence: ['Your target audience', 'Social proof research'],
                    }
                  : {
                      pattern: 'People trust recommendations from peers',
                      confidence: 0.80,
                      type: 'correlation' as const,
                      significance: 0.80,
                      implication: 'Share customer testimonials and show real results',
                      evidence: ['Conversion research'],
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
                        type: 'causal' as const,
                        significance: 0.85,
                        implication: 'Show your expertise first and prove you can deliver results',
                        evidence: ['Customer behavior', 'Your market'],
                      };
                    }
                  }
                  return {
                    pattern: 'Expertise matters more than price to quality buyers',
                    confidence: 0.78,
                    type: 'causal' as const,
                    significance: 0.78,
                    implication: 'Demonstrate your expertise and share your track record',
                    evidence: ['Trust research'],
                  };
                })(),
                benefit
                  ? {
                      pattern: `People respond strongly to ${benefit.toLowerCase()}`,
                      confidence: 0.90,
                      type: 'emerging' as const,
                      significance: 0.90,
                      implication: `Make ${benefit.toLowerCase()} clear and real, and lead with it in your messaging`,
                      evidence: ['Your key benefit', 'Market data'],
                    }
                  : {
                      pattern: 'Clear benefits win over feature lists',
                      confidence: 0.82,
                      type: 'emerging' as const,
                      significance: 0.82,
                      implication: 'Focus on what customers get and skip the jargon',
                      evidence: ['Marketing research'],
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
  if (loading && !deepContext) {
    const phaseNames = ['Data Extraction', 'Pattern Discovery', 'Connection Engine', 'Enhancement', 'Synthesis'];
    const phaseProgress = (currentPhase - 1) / 5 * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Phase Indicator */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Phase {currentPhase}/5: {phaseNames[currentPhase - 1]}
              </span>
            </div>
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">{loadingProgress}</p>
          </div>

          {/* Phase Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2 text-xs text-gray-600 dark:text-gray-400">
              {phaseNames.map((name, idx) => (
                <span key={idx} className={idx < currentPhase ? 'text-purple-600 dark:text-purple-400 font-medium' : ''}>
                  {idx + 1}
                </span>
              ))}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Data Points</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dataPointsCollected}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Layers Complete</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{layersCompleted.length}/4</div>
            </div>
          </div>

          {/* Discoveries Feed */}
          {discoveries.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Latest Discoveries</div>
              <div className="space-y-2">
                {discoveries.slice(-3).map((discovery, idx) => (
                  <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="mt-0.5">→</span>
                    <span>{discovery}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    clusters={clusters}
                    breakthroughs={breakthroughs}
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

            {/* Floating Loading Indicator (shows when still loading in background) */}
            {currentPhase < 5 && deepContext && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border border-purple-200 dark:border-purple-800 max-w-sm z-50"
              >
                <div className="flex items-start gap-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Phase {currentPhase}/5
                      </p>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {['Extracting', 'Discovering', 'Connecting', 'Enhancing', 'Synthesizing'][currentPhase - 1]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                      {loadingProgress}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mb-2">
                      <span>{dataPointsCollected} data points</span>
                      {currentPhase >= 3 && connectionsFound.threeWay > 0 && (
                        <>
                          <span>•</span>
                          <span>{connectionsFound.threeWay} connections</span>
                        </>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all duration-300"
                        style={{ width: `${(currentPhase / 5) * 100}%` }}
                      />
                    </div>
                    {discoveries.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 truncate">
                        {discoveries[discoveries.length - 1]}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
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
