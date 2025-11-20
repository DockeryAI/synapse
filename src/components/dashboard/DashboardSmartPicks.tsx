/**
 * Dashboard Smart Picks Component
 *
 * Compact version of SmartPicks for dashboard display:
 * - Top 3 campaign recommendations
 * - Top 3 content ideas
 * - Click to see full details and generate
 *
 * Created: 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, FileText, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { SmartPick } from '@/types/smart-picks.types';
import { generateSmartPicks } from '@/services/campaign/SmartPickGenerator';
import { generateSynapses } from '@/services/synapse/SynapseGenerator';
import { synapseCache } from '@/services/cache/synapse-cache.service';

export interface DashboardSmartPicksProps {
  /** Deep context with business intelligence */
  context: DeepContext;

  /** Callback when user clicks on a pick */
  onPickClick?: (pick: SmartPick) => void;

  /** Callback when picks are generated/loaded */
  onPicksLoaded?: (campaignPicks: SmartPick[], contentPicks: SmartPick[]) => void;
}

export function DashboardSmartPicks({ context, onPickClick, onPicksLoaded }: DashboardSmartPicksProps) {
  const [campaignPicks, setCampaignPicks] = useState<SmartPick[]>([]);
  const [contentPicks, setContentPicks] = useState<SmartPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cacheMetadata, setCacheMetadata] = useState<any>(null);

  // Function to generate picks (shared between mount and manual refresh)
  async function generatePicks(forceRegenerate = false) {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless forcing regeneration)
      if (!forceRegenerate) {
        const cachedCampaignPicks = synapseCache.getCachedSmartPicks(context, 'multi-post');
        const cachedContentPicks = synapseCache.getCachedSmartPicks(context, 'single-post');
        const metadata = synapseCache.getCacheMetadata(context);

        if (cachedCampaignPicks && cachedContentPicks) {
          console.log('[DashboardSmartPicks] Using cached picks');
          const campaigns = cachedCampaignPicks.slice(0, 3);
          const contents = cachedContentPicks.slice(0, 3);
          setCampaignPicks(campaigns);
          setContentPicks(contents);
          setCacheMetadata(metadata);
          onPicksLoaded?.(campaigns, contents);
          setLoading(false);
          return;
        }
      } else {
        // Clear cache when forcing regeneration
        synapseCache.clearCache(context);
        console.log('[DashboardSmartPicks] Force regenerating picks (cache cleared)');
      }

      console.log('[DashboardSmartPicks] Generating new picks');

      // Try to use real Synapse generation
      try {
        // Check for cached synapses first
        let synapses = !forceRegenerate ? synapseCache.getCachedSynapses(context) : null;

        if (!synapses) {
          // Generate new Synapse insights
          const synapseResult = await generateSynapses({
            business: {
              name: context.business.profile.name || 'Your Business',
              industry: context.business.profile.industry || 'General',
              location: {
                city: context.business.profile.location?.city || '',
                state: context.business.profile.location?.state || ''
              }
            },
            intelligence: context
          });

          synapses = synapseResult.synapses;
          // Cache the synapses
          synapseCache.cacheSynapses(context, synapses);
          console.log('[DashboardSmartPicks] Generated and cached', synapses.length, 'Synapse insights');
        } else {
          console.log('[DashboardSmartPicks] Using cached Synapse insights');
        }

        // Use SmartPickGenerator with cached Synapse data
        const campaignResult = await generateSmartPicks(context, 'multi-post', {
          maxPicks: 3,
          minConfidence: 0.6,
          preferTimely: true,
          includePreview: false,
          cachedSynapses: synapses, // Pass cached synapses
        });

        const contentResult = await generateSmartPicks(context, 'single-post', {
          maxPicks: 3,
          minConfidence: 0.6,
          preferTimely: true,
          includePreview: false,
          cachedSynapses: synapses, // Pass cached synapses
        });

        // Cache the picks
        synapseCache.cacheSmartPicks(context, 'multi-post', campaignResult.picks);
        synapseCache.cacheSmartPicks(context, 'single-post', contentResult.picks);

        const campaigns = campaignResult.picks.slice(0, 3);
        const contents = contentResult.picks.slice(0, 3);
        setCampaignPicks(campaigns);
        setContentPicks(contents);
        setCacheMetadata(synapseCache.getCacheMetadata(context));
        onPicksLoaded?.(campaigns, contents);
      } catch (genError) {
        console.warn('[DashboardSmartPicks] Synapse generation failed, using fallback:', genError);

        // Fallback to template-based picks for localStorage sessions
        const fallbackCampaignPicks: SmartPick[] = [
          {
            id: 'fallback-1',
            title: 'Authority Building Campaign',
            description: 'Establish your expertise based on your unique solution',
            campaignType: 'authority-builder',
            confidence: 0.8,
            relevance: 0.9,
            timeliness: 0.7,
            evidenceQuality: 0.8,
            overallScore: 0.8,
            insights: context.synthesis.keyInsights || [],
            dataSources: [
              { source: 'uvp-analysis', dataPoints: context.synthesis.keyInsights?.length || 0 }
            ],
            trustIndicators: ['Based on your UVP', 'Industry aligned'],
            whyRecommended: 'Your unique solution provides strong authority positioning',
          },
          {
            id: 'fallback-2',
            title: 'Customer Transformation Story',
            description: 'Share customer success stories highlighting the transformation you provide',
            campaignType: 'social-proof',
            confidence: 0.75,
            relevance: 0.85,
            timeliness: 0.6,
            evidenceQuality: 0.7,
            overallScore: 0.75,
            insights: context.customerPsychology.emotional || [],
            dataSources: [
              { source: 'customer-analysis', dataPoints: 1 }
            ],
            trustIndicators: ['Transformation focused', 'Customer-centric'],
            whyRecommended: 'Highlight the transformation your customers experience',
          },
          {
            id: 'fallback-3',
            title: 'Problem-Solution Campaign',
            description: 'Address specific customer pain points with your solution',
            campaignType: 'authority-builder',
            confidence: 0.7,
            relevance: 0.8,
            timeliness: 0.65,
            evidenceQuality: 0.75,
            overallScore: 0.72,
            insights: context.industry.customerPain || [],
            dataSources: [
              { source: 'pain-point-analysis', dataPoints: 1 }
            ],
            trustIndicators: ['Solution-focused', 'Pain point addressing'],
            whyRecommended: 'Direct connection between customer needs and your solution',
          },
        ];

        const fallbackContentPicks: SmartPick[] = [
          {
            id: 'content-1',
            title: 'Key Benefit Spotlight',
            description: 'Highlight your primary value proposition',
            campaignType: 'single-post',
            confidence: 0.85,
            relevance: 0.9,
            timeliness: 0.8,
            evidenceQuality: 0.8,
            overallScore: 0.83,
            insights: context.business.uniqueAdvantages || [],
            dataSources: [
              { source: 'benefit-analysis', dataPoints: 1 }
            ],
            trustIndicators: ['Core value', 'Clear benefit'],
            whyRecommended: 'Your key benefit resonates strongly with target customers',
          },
          {
            id: 'content-2',
            title: 'Industry Insight Post',
            description: 'Share valuable industry knowledge',
            campaignType: 'single-post',
            confidence: 0.7,
            relevance: 0.75,
            timeliness: 0.7,
            evidenceQuality: 0.7,
            overallScore: 0.71,
            insights: ['Industry expertise'],
            dataSources: [
              { source: 'industry-knowledge', dataPoints: 1 }
            ],
            trustIndicators: ['Expert positioning'],
            whyRecommended: 'Position yourself as an industry thought leader',
          },
          {
            id: 'content-3',
            title: 'Customer Success Highlight',
            description: 'Feature a customer transformation story',
            campaignType: 'single-post',
            confidence: 0.72,
            relevance: 0.8,
            timeliness: 0.65,
            evidenceQuality: 0.7,
            overallScore: 0.72,
            insights: ['Customer success'],
            dataSources: [
              { source: 'success-stories', dataPoints: 1 }
            ],
            trustIndicators: ['Social proof'],
            whyRecommended: 'Build trust through customer success',
          },
        ];

        setCampaignPicks(fallbackCampaignPicks);
        setContentPicks(fallbackContentPicks);
        onPicksLoaded?.(fallbackCampaignPicks, fallbackContentPicks);
      }
    } catch (err) {
      console.error('[DashboardSmartPicks] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate picks');
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  } // End of generatePicks function

  // Generate picks on mount (from cache if available)
  useEffect(() => {
    generatePicks(false);
  }, [context]);

  // Handle manual refresh
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await generatePicks(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Analyzing your intelligence...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (campaignPicks.length === 0 && contentPicks.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No recommendations available yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Regenerate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {cacheMetadata?.smartPicksCache && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Generated {new Date(cacheMetadata.smartPicksCache.generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Regenerating...' : 'Refresh'}
        </button>
      </div>

      {/* Campaign Recommendations */}
      {campaignPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Campaign Ideas
            </h3>
          </div>
          <div className="space-y-3">
            {campaignPicks.map((pick, idx) => (
              <motion.button
                key={pick.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickClick?.(pick)}
                className="w-full text-left group bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {pick.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {pick.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {Math.round(pick.confidence * 100)}% confidence
                      </span>
                      {pick.opportunityScore && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Score: {pick.opportunityScore.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Content Ideas */}
      {contentPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Content Ideas
            </h3>
          </div>
          <div className="space-y-3">
            {contentPicks.map((pick, idx) => (
              <motion.button
                key={pick.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (campaignPicks.length + idx) * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickClick?.(pick)}
                className="w-full text-left group bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {pick.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {pick.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {Math.round(pick.confidence * 100)}% confidence
                      </span>
                      {pick.trustIndicators?.map((indicator, i) => (
                        <span key={i} className="text-xs text-gray-600 dark:text-gray-400">
                          • {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}