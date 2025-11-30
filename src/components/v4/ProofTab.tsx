/**
 * ProofTab Component
 *
 * Proof 2.0 tab for V4 Content Generation Panel.
 * Displays consolidated proof points from multiple sources.
 * Allows selection of proof for content generation.
 *
 * Created: 2025-11-29
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { profileDetectionService, BusinessProfileType } from '@/services/triggers/profile-detection.service';
import {
  proofConsolidationService,
  ConsolidatedProof,
  ProofConsolidationResult,
  ProofType
} from '@/services/proof/proof-consolidation.service';
import {
  Zap,
  Trash2,
  CheckCircle,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  Heart,
  Shield,
  Award,
  BarChart3,
  Star,
  ExternalLink,
  Quote,
  Building,
  Calendar,
  ThumbsUp,
  Sparkles,
  SortDesc,
  BadgeCheck,
  Loader2,
  RefreshCw,
  Download,
  Globe
} from 'lucide-react';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import { OutScraperAPI } from '@/services/intelligence/outscraper-api';
import { WebsiteAnalyzerService } from '@/services/intelligence/website-analyzer.service';
import { reviewPlatformScraperService, ReviewPlatformResult } from '@/services/proof/review-platform-scraper.service';
import { pressNewsScraperService, PressResult } from '@/services/proof/press-news-scraper.service';
import { deepTestimonialScraperService, DeepTestimonialResult } from '@/services/proof/deep-testimonial-scraper.service';
import { clientLogoExtractorService, ClientLogoResult } from '@/services/proof/client-logo-extractor.service';
import { socialProofScraperService, SocialProofResult } from '@/services/proof/social-proof-scraper.service';

// ============================================================================
// SHARED CACHE KEYS
// ============================================================================

const PROOF_CACHE_KEY = 'proofTab_deepContext_v1';

function loadCachedDeepContext(): DeepContext | null {
  try {
    const cached = localStorage.getItem(PROOF_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[ProofTab] Failed to load cached data:', err);
  }
  return null;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

type FilterType = 'all' | 'rating' | 'testimonial' | 'metric' | 'certification' | 'review' | 'press' | 'social' | 'logo';

const FILTER_CONFIG: Record<FilterType, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All', icon: BarChart3, color: 'purple' },
  rating: { label: 'Ratings', icon: Star, color: 'yellow' },
  testimonial: { label: 'Testimonials', icon: Quote, color: 'blue' },
  metric: { label: 'Metrics', icon: TrendingUp, color: 'green' },
  certification: { label: 'Credentials', icon: Shield, color: 'purple' },
  review: { label: 'Reviews', icon: MessageSquare, color: 'orange' },
  press: { label: 'Press', icon: Sparkles, color: 'indigo' },
  social: { label: 'Social', icon: Users, color: 'pink' },
  logo: { label: 'Logos', icon: Building, color: 'slate' }
};

// ============================================================================
// PROOF CARD COMPONENT
// ============================================================================

interface ProofCardProps {
  proof: ConsolidatedProof;
  isSelected: boolean;
  onToggle: () => void;
}

function ProofCard({ proof, isSelected, onToggle }: ProofCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeIcons: Record<ProofType, React.ElementType> = {
    rating: Star,
    testimonial: Quote,
    metric: TrendingUp,
    certification: Shield,
    social: Users,
    logo: Building,
    press: Sparkles,
    award: Award,
    review: MessageSquare,
    years: Calendar
  };

  const typeColors: Record<ProofType, string> = {
    rating: 'from-yellow-500 to-amber-500',
    testimonial: 'from-blue-500 to-cyan-500',
    metric: 'from-green-500 to-emerald-500',
    certification: 'from-purple-500 to-violet-500',
    social: 'from-pink-500 to-rose-500',
    logo: 'from-slate-500 to-gray-500',
    press: 'from-indigo-500 to-purple-500',
    award: 'from-amber-500 to-yellow-500',
    review: 'from-orange-500 to-red-500',
    years: 'from-gray-500 to-slate-500'
  };

  const Icon = typeIcons[proof.type] || Award;

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = proof.fullQuote || proof.value;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <div className="p-4 cursor-pointer" onClick={handleCardClick}>
        {/* Top row: Selection checkbox + Quality Score */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={handleSelect}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            {isSelected && <CheckCircle className="w-3 h-3" />}
          </button>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getQualityColor(proof.qualityScore)}`}>
            {proof.qualityScore}
          </span>
        </div>

        {/* Icon and type badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[proof.type] || typeColors.metric} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {proof.type}
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {proof.title}
            </h3>
          </div>
        </div>

        {/* Value */}
        <p className={`text-sm text-gray-700 dark:text-gray-300 mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {isExpanded ? (proof.fullQuote || proof.value) : proof.value}
        </p>

        {/* Quick stats row */}
        {!isExpanded && (
          <>
            <div className="flex gap-1 mb-2 flex-wrap">
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                Auth: {proof.authorityScore}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                Spec: {proof.specificityScore}
              </span>
              {proof.isVerified && (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded flex items-center gap-0.5">
                  <BadgeCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{proof.source}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                proof.profileRelevance >= 70 ? 'bg-green-100 text-green-700' :
                proof.profileRelevance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {proof.profileRelevance}% relevant
              </span>
            </div>

            <div className="mt-2 text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Click to expand</span>
            </div>
          </>
        )}
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-gray-200 dark:border-slate-700"
          >
            {/* Source URL */}
            {proof.sourceUrl && (
              <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700/70 rounded-lg flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <a
                  href={proof.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
                >
                  {proof.sourceUrl}
                </a>
                <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </div>
            )}

            {/* Case Study Sections */}
            {proof.isCaseStudy && proof.caseStudy && (
              <div className="mt-4 space-y-3">
                {proof.caseStudy.industry && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                      {proof.caseStudy.industry}
                    </span>
                  </div>
                )}

                {proof.caseStudy.execSummary && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Executive Summary</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.execSummary}</p>
                  </div>
                )}

                {proof.caseStudy.challenge && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">The Challenge</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.challenge}</p>
                  </div>
                )}

                {proof.caseStudy.solution && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">The Solution</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.solution}</p>
                  </div>
                )}

                {proof.caseStudy.outcome && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">The Outcome</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.outcome}</p>
                  </div>
                )}

                {proof.caseStudy.metrics && proof.caseStudy.metrics.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                    <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2">Key Results</h4>
                    <div className="flex flex-wrap gap-2">
                      {proof.caseStudy.metrics.map((metric, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-sm font-semibold text-indigo-700 dark:text-indigo-400 rounded-full shadow-sm border border-indigo-200 dark:border-indigo-800">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Author details */}
            {!proof.isCaseStudy && (proof.authorName || proof.authorCompany || proof.authorRole) && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {proof.authorPhoto && (
                    <img
                      src={proof.authorPhoto}
                      alt={proof.authorName || 'Author'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    {proof.authorName && (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {proof.authorName}
                      </p>
                    )}
                    {(proof.authorRole || proof.authorCompany) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {proof.authorRole}{proof.authorRole && proof.authorCompany && ' at '}{proof.authorCompany}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed scores */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{proof.authorityScore}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-500">Authority</p>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{proof.specificityScore}</p>
                <p className="text-[10px] text-green-600 dark:text-green-500">Specificity</p>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{proof.recencyScore}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-500">Recency</p>
              </div>
              <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{proof.verificationScore}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500">Verification</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCopyQuote}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Quote className="w-4 h-4" />
                Copy Quote
              </button>
              {proof.sourceUrl && (
                <a
                  href={proof.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original
                </a>
              )}
              <button
                onClick={handleSelect}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {isSelected ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>

            <button
              onClick={handleCardClick}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Click to collapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// PROPS
// ============================================================================

interface ProofTabProps {
  uvp: CompleteUVP;
  brandId?: string;
  onSelectProofs?: (proofs: ConsolidatedProof[]) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProofTab({ uvp, brandId, onSelectProofs }: ProofTabProps) {
  const { currentBrand } = useBrand();
  const [selectedProofs, setSelectedProofs] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'quality' | 'relevance'>('quality');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveLoadingStatus, setLiveLoadingStatus] = useState('');
  const [cachedContext, setCachedContext] = useState<DeepContext | null>(() => loadCachedDeepContext());

  // Detect business profile
  const profileType = useMemo(() => {
    if (uvp) {
      const profile = profileDetectionService.detectProfile(uvp);
      return profile.profileType;
    }
    return 'national-saas-b2b' as BusinessProfileType;
  }, [uvp]);

  const brand = currentBrand;
  const brandName = brand?.name || 'Brand';

  // Live fetch handler
  const handleFetchLiveProof = useCallback(async () => {
    if (!brand) {
      console.warn('[ProofTab] No brand selected');
      return;
    }

    setLiveLoading(true);
    setLiveLoadingStatus('Starting live proof fetch...');
    console.log('[ProofTab] Starting live proof fetch for:', brand.name);

    const results: {
      googleReviews?: any[];
      websiteProof?: any;
      reviewPlatforms?: ReviewPlatformResult;
      pressMentions?: PressResult;
      deepTestimonials?: DeepTestimonialResult;
      clientLogos?: ClientLogoResult;
      socialProof?: SocialProofResult;
    } = {};

    try {
      setLiveLoadingStatus('Fetching from multiple sources...');
      const fetchPromises: Promise<void>[] = [];

      // Google Reviews
      fetchPromises.push((async () => {
        try {
          const reviews = await OutScraperAPI.scrapeGoogleReviews({
            business_name: brand.name,
            location: brand.location || undefined,
            limit: 20
          });
          results.googleReviews = reviews;
        } catch (err) {
          console.warn('[ProofTab] Google Reviews fetch failed:', err);
        }
      })());

      // Review Platforms
      fetchPromises.push((async () => {
        try {
          const platformReviews = await reviewPlatformScraperService.scrapeAllPlatforms(brand.name);
          results.reviewPlatforms = platformReviews;
        } catch (err) {
          console.warn('[ProofTab] Review platforms fetch failed:', err);
        }
      })());

      // Press Mentions
      fetchPromises.push((async () => {
        try {
          const pressMentions = await pressNewsScraperService.scrapePressMentions(brand.name);
          results.pressMentions = pressMentions;
        } catch (err) {
          console.warn('[ProofTab] Press mentions fetch failed:', err);
        }
      })());

      // Deep Testimonials
      fetchPromises.push((async () => {
        try {
          const deepTestimonials = await deepTestimonialScraperService.scrapeTestimonials(
            brand.name,
            brand.website || undefined
          );
          results.deepTestimonials = deepTestimonials;
        } catch (err) {
          console.warn('[ProofTab] Deep testimonials fetch failed:', err);
        }
      })());

      // Client Logos
      fetchPromises.push((async () => {
        try {
          const clientLogos = await clientLogoExtractorService.extractClientLogos(
            brand.name,
            brand.website || undefined
          );
          results.clientLogos = clientLogos;
        } catch (err) {
          console.warn('[ProofTab] Client logos fetch failed:', err);
        }
      })());

      // Social Proof
      fetchPromises.push((async () => {
        try {
          const socialProof = await socialProofScraperService.scrapeSocialProof(brand.name);
          results.socialProof = socialProof;
        } catch (err) {
          console.warn('[ProofTab] Social proof fetch failed:', err);
        }
      })());

      // Website Analysis
      if (brand.website) {
        fetchPromises.push((async () => {
          try {
            const websiteAnalyzer = new WebsiteAnalyzerService();
            const websiteAnalysis = await websiteAnalyzer.analyzeWebsite(brand.website!);
            results.websiteProof = websiteAnalysis;
          } catch (err) {
            console.warn('[ProofTab] Website analysis failed:', err);
          }
        })());
      }

      await Promise.all(fetchPromises);

      // Update context
      const updatedContext: DeepContext = {
        ...(cachedContext || {}),
        googleReviews: results.googleReviews || cachedContext?.googleReviews,
        websiteAnalysis: results.websiteProof || cachedContext?.websiteAnalysis,
        business: {
          ...(cachedContext?.business || {}),
          websiteAnalysis: results.websiteProof || cachedContext?.business?.websiteAnalysis,
        },
        reviewPlatforms: results.reviewPlatforms || (cachedContext as any)?.reviewPlatforms,
        pressMentions: results.pressMentions || (cachedContext as any)?.pressMentions,
        deepTestimonials: results.deepTestimonials || (cachedContext as any)?.deepTestimonials,
        clientLogos: results.clientLogos || (cachedContext as any)?.clientLogos,
        socialProof: results.socialProof || (cachedContext as any)?.socialProof,
      } as DeepContext;

      localStorage.setItem(PROOF_CACHE_KEY, JSON.stringify(updatedContext));
      setCachedContext(updatedContext);

      const reviewCount = (results.googleReviews?.length || 0) + (results.reviewPlatforms?.allReviews.length || 0);
      const pressCount = results.pressMentions?.totalFound || 0;
      const testimonialCount = results.deepTestimonials?.totalFound || 0;
      setLiveLoadingStatus(`Done! ${reviewCount} reviews, ${testimonialCount} testimonials, ${pressCount} press`);

    } catch (err) {
      console.error('[ProofTab] Live fetch error:', err);
      setLiveLoadingStatus('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLiveLoading(false);
      setTimeout(() => setLiveLoadingStatus(''), 5000);
    }
  }, [brand, cachedContext]);

  // Consolidate proofs
  const consolidationResult = useMemo((): ProofConsolidationResult | null => {
    if (!cachedContext && !uvp) return null;
    return proofConsolidationService.consolidate(cachedContext, uvp, profileType);
  }, [cachedContext, uvp, profileType]);

  // Get filtered and sorted proofs
  const displayProofs = useMemo(() => {
    if (!consolidationResult) return [];

    let proofs = [...consolidationResult.proofs];

    if (activeFilter !== 'all') {
      proofs = proofs.filter(p => p.type === activeFilter);
    }

    if (sortBy === 'quality') {
      proofs.sort((a, b) => b.qualityScore - a.qualityScore);
    } else {
      proofs.sort((a, b) => b.profileRelevance - a.profileRelevance);
    }

    return proofs;
  }, [consolidationResult, activeFilter, sortBy]);

  // Get counts per filter
  const filterCounts = useMemo(() => {
    if (!consolidationResult) return { all: 0, rating: 0, testimonial: 0, metric: 0, certification: 0, review: 0, press: 0, social: 0, logo: 0 };

    const counts: Record<FilterType, number> = {
      all: consolidationResult.proofs.length,
      rating: 0,
      testimonial: 0,
      metric: 0,
      certification: 0,
      review: 0,
      press: 0,
      social: 0,
      logo: 0
    };

    consolidationResult.proofs.forEach(p => {
      if (p.type in counts) {
        counts[p.type as FilterType]++;
      }
    });

    return counts;
  }, [consolidationResult]);

  const handleToggle = (proofId: string) => {
    setSelectedProofs(prev => {
      const newSelection = prev.includes(proofId)
        ? prev.filter(x => x !== proofId)
        : [...prev, proofId];

      // Notify parent of selection change
      if (onSelectProofs && consolidationResult) {
        const selectedProofObjects = consolidationResult.proofs.filter(p => newSelection.includes(p.id));
        onSelectProofs(selectedProofObjects);
      }

      return newSelection;
    });
  };

  const dataStatus = cachedContext ? 'cached' : 'empty';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex flex-col gap-3">
          {/* Top row: Title and stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Proof Points</h3>
                <p className="text-xs text-gray-500">
                  {consolidationResult ? (
                    <span className="text-green-600">
                      {consolidationResult.proofs.length} proofs | Avg quality: {consolidationResult.avgQualityScore}
                    </span>
                  ) : (
                    <span>No data loaded</span>
                  )}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 text-xs rounded ${dataStatus === 'cached' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {dataStatus === 'cached' ? 'Cached' : 'No Data'}
            </span>
            <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
              {profileType}
            </span>
          </div>

          {/* Bottom row: Action buttons - always visible */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* FETCH PROOF BUTTON - Primary action */}
            <button
              onClick={handleFetchLiveProof}
              disabled={liveLoading || !brand}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                liveLoading
                  ? 'bg-blue-100 text-blue-600 cursor-wait'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg'
              }`}
            >
              {liveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {liveLoading ? liveLoadingStatus : 'Fetch Proof'}
            </button>

            {/* Clear cache */}
            <button
              onClick={() => {
                localStorage.removeItem(PROOF_CACHE_KEY);
                setCachedContext(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>

            {/* Sort control */}
            <button
              onClick={() => setSortBy(sortBy === 'quality' ? 'relevance' : 'quality')}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200"
            >
              <SortDesc className="w-3 h-3" />
              {sortBy === 'quality' ? 'Quality' : 'Relevance'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(Object.keys(FILTER_CONFIG) as FilterType[]).map((filter) => {
            const config = FILTER_CONFIG[filter];
            const Icon = config.icon;
            const count = filterCounts[filter] || 0;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Proof Grid */}
        <div className="flex-1 overflow-auto p-4">
          {displayProofs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Proof Points Yet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
                {!cachedContext
                  ? 'Click "Fetch Proof" to scrape proof points from reviews, testimonials, and press mentions.'
                  : 'No proof points found for this filter. Try selecting "All".'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayProofs.map((proof) => (
                <ProofCard
                  key={proof.id}
                  proof={proof}
                  isSelected={selectedProofs.includes(proof.id)}
                  onToggle={() => handleToggle(proof.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selection Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Selected</h4>
            {consolidationResult && consolidationResult.proofs.length > 0 && (
              <button
                onClick={() => {
                  const topProofs = [...consolidationResult.proofs]
                    .sort((a, b) => b.qualityScore - a.qualityScore)
                    .slice(0, 5)
                    .map(p => p.id);
                  setSelectedProofs(topProofs);
                  if (onSelectProofs) {
                    const selectedProofObjects = consolidationResult.proofs.filter(p => topProofs.includes(p.id));
                    onSelectProofs(selectedProofObjects);
                  }
                }}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Auto-select best
              </button>
            )}
          </div>

          {selectedProofs.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
              <Award className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No proofs selected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProofs.map((id) => {
                const proof = consolidationResult?.proofs.find(p => p.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="text-xs text-blue-900 dark:text-blue-100 truncate block">
                        {proof?.title || id}
                      </span>
                      <span className="text-[10px] text-blue-600">
                        Quality: {proof?.qualityScore || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle(id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium text-sm flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Use in Content
              </button>

              <button
                onClick={() => {
                  setSelectedProofs([]);
                  if (onSelectProofs) onSelectProofs([]);
                }}
                className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Stats */}
          {consolidationResult && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Stats</h4>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{consolidationResult.totalExtracted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Quality:</span>
                  <span className="font-medium">{consolidationResult.avgQualityScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Types:</span>
                  <span>{consolidationResult.topProofTypes.slice(0, 2).join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProofTab;
