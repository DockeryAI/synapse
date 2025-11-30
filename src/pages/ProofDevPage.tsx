/**
 * Proof Dev Page - Dashboard Mirror
 *
 * Isolated testing page for Proof tab development.
 * Uses useStreamingProof hook for progressive proof loading.
 * Shares cached DeepContext with TriggersDevPage.
 *
 * Created: 2025-11-29
 * Updated: 2025-11-29 - Integrated streaming hook
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UVPBuildingBlocks } from '@/components/v4/V4PowerModePanel';
import { useBrand } from '@/hooks/useBrand';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import { profileDetectionService, BusinessProfileType } from '@/services/triggers/profile-detection.service';
import {
  proofConsolidationService,
  ConsolidatedProof,
  ProofConsolidationResult,
  ProofType
} from '@/services/proof/proof-consolidation.service';
import { useStreamingProof } from '@/hooks/useStreamingProof';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  Trash2,
  CheckCircle,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
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
  Database,
  Sparkles,
  Filter,
  SortDesc,
  BadgeCheck,
  Loader2,
  RefreshCw,
  Download,
  Globe,
  Search
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
// SHARED CACHE KEYS - Same as TriggersDevPage so we can share data
// ============================================================================

const TRIGGERS_DEV_CACHE_KEY = 'triggersDevPage_deepContext_v3';
const API_DISABLED_KEY = 'triggersDevPage_apiDisabled_v3';

function loadCachedDeepContext(): DeepContext | null {
  try {
    const cached = localStorage.getItem(TRIGGERS_DEV_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('[ProofDevPage] Loaded cached DeepContext');
      return parsed;
    }
  } catch (err) {
    console.warn('[ProofDevPage] Failed to load cached data:', err);
  }
  return null;
}

function isApiDisabled(): boolean {
  return localStorage.getItem(API_DISABLED_KEY) === 'true';
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
// PROOF CARD COMPONENT - Enhanced with Quality Score
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

  // Quality score color
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  // Copy quote to clipboard
  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = proof.fullQuote || proof.value;
    navigator.clipboard.writeText(textToCopy);
    // Could add toast notification here
  };

  // Handle card click - expand/collapse, separate from selection
  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking the expand area, toggle expand
    setIsExpanded(!isExpanded);
  };

  // Handle selection checkbox
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
      } ${isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-2' : ''}`}
    >
      {/* Collapsed View - Always visible */}
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

        {/* Value - truncated when collapsed, full when expanded */}
        <p className={`text-sm text-gray-700 dark:text-gray-300 mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {isExpanded ? (proof.fullQuote || proof.value) : proof.value}
        </p>

        {/* Collapsed: Quick stats row */}
        {!isExpanded && (
          <>
            <div className="flex gap-1 mb-2 flex-wrap">
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                Auth: {proof.authorityScore}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                Spec: {proof.specificityScore}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                Recent: {proof.recencyScore}
              </span>
              {proof.isVerified && (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded flex items-center gap-0.5">
                  <BadgeCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {proof.source}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                proof.profileRelevance >= 70 ? 'bg-green-100 text-green-700' :
                proof.profileRelevance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {proof.profileRelevance}% relevant
              </span>
            </div>

            {/* Expand hint */}
            <div className="mt-2 text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Click to expand</span>
            </div>
          </>
        )}
      </div>

      {/* Expanded View - Full details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-gray-200 dark:border-slate-700"
          >
            {/* Source URL - Always show at top */}
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
                {/* Industry badge */}
                {proof.caseStudy.industry && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                      {proof.caseStudy.industry}
                    </span>
                  </div>
                )}

                {/* Executive Summary */}
                {proof.caseStudy.execSummary && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Executive Summary</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.execSummary}</p>
                  </div>
                )}

                {/* Challenge */}
                {proof.caseStudy.challenge && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">The Challenge</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.challenge}</p>
                  </div>
                )}

                {/* Solution */}
                {proof.caseStudy.solution && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">The Solution</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.solution}</p>
                  </div>
                )}

                {/* Outcome */}
                {proof.caseStudy.outcome && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">The Outcome</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{proof.caseStudy.outcome}</p>
                  </div>
                )}

                {/* Key Metrics */}
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

                {/* Testimonial Quote */}
                {proof.caseStudy.testimonialQuote && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-gray-400">
                    <Quote className="w-4 h-4 text-gray-400 mb-1" />
                    <p className="text-sm italic text-gray-600 dark:text-gray-400">"{proof.caseStudy.testimonialQuote}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Author/Source Details (for non-case-studies or as fallback) */}
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

            {/* Full Quote for non-case-studies */}
            {!proof.isCaseStudy && proof.fullQuote && proof.fullQuote !== proof.value && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Full Quote</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{proof.fullQuote}</p>
              </div>
            )}

            {/* Publication info for press mentions */}
            {proof.publicationName && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-600 dark:text-gray-400">Published in</span>
                <span className="font-medium text-gray-900 dark:text-white">{proof.publicationName}</span>
              </div>
            )}

            {/* Review date */}
            {proof.reviewDate && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(proof.reviewDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
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

            {/* Collapse button */}
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
// ERROR BOUNDARY
// ============================================================================

class ProofDevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ProofDevPage] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <pre className="text-left bg-red-100 p-4 rounded text-sm overflow-auto max-w-2xl">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ProofDevPageInner() {
  const { currentBrand } = useBrand();
  const [selectedProofs, setSelectedProofs] = useState<string[]>([]);
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [uvpLoading, setUvpLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<'quality' | 'relevance'>('quality');
  const [streamingEnabled, setStreamingEnabled] = useState(false);

  // Live fetch state
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveLoadingStatus, setLiveLoadingStatus] = useState('');
  const [liveProofData, setLiveProofData] = useState<{
    googleReviews?: any[];
    websiteProof?: any;
    reviewPlatforms?: ReviewPlatformResult;
    pressMentions?: PressResult;
    deepTestimonials?: DeepTestimonialResult;
    clientLogos?: ClientLogoResult;
    socialProof?: SocialProofResult;
  } | null>(null);

  // Detect business profile
  const [profileType, setProfileType] = useState<BusinessProfileType>('national-saas-b2b');

  // Load UVP from database
  useEffect(() => {
    async function loadUVP() {
      if (!currentBrand?.id) {
        setUvpLoading(false);
        return;
      }

      try {
        const uvpData = await getUVPByBrand(currentBrand.id);
        if (uvpData) {
          setUvp(uvpData);

          // Detect profile type from UVP
          const profile = profileDetectionService.detectProfile(uvpData);
          setProfileType(profile.profileType);
          console.log('[ProofDevPage] Detected profile:', profile.profileType);
        }
      } catch (err) {
        console.error('[ProofDevPage] Failed to load UVP:', err);
      } finally {
        setUvpLoading(false);
      }
    }

    loadUVP();
  }, [currentBrand?.id]);

  // Cached deep context (fallback when streaming not active)
  const [cachedContext, setCachedContext] = useState<DeepContext | null>(() => loadCachedDeepContext());
  const [apiDisabled] = useState(() => isApiDisabled());
  const brandName = currentBrand?.name || 'Brand';

  // ==========================================================================
  // LIVE FETCH - Manual button to fetch fresh proof from APIs
  // ==========================================================================
  const handleFetchLiveProof = useCallback(async () => {
    if (!currentBrand) {
      console.warn('[ProofDevPage] No brand selected');
      return;
    }

    setLiveLoading(true);
    setLiveLoadingStatus('Starting live proof fetch...');
    console.log('[ProofDevPage] 🔄 Starting live proof fetch for:', currentBrand.name);

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
      // Fire all proof sources in parallel for speed
      setLiveLoadingStatus('Fetching from multiple sources...');

      const fetchPromises: Promise<void>[] = [];

      // 1. Google Reviews via OutScraper
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Fetching Google Reviews...');
          const reviews = await OutScraperAPI.scrapeGoogleReviews({
            business_name: currentBrand.name,
            location: currentBrand.location || undefined,
            limit: 20
          });
          results.googleReviews = reviews;
          console.log('[ProofDevPage] ✅ Got', reviews.length, 'Google Reviews');
        } catch (reviewErr) {
          console.warn('[ProofDevPage] Google Reviews fetch failed:', reviewErr);
        }
      })());

      // 2. Review Platforms (G2, Capterra, TrustRadius, Clutch)
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Scraping review platforms...');
          const platformReviews = await reviewPlatformScraperService.scrapeAllPlatforms(currentBrand.name);
          results.reviewPlatforms = platformReviews;
          console.log('[ProofDevPage] ✅ Review platforms:', {
            g2: platformReviews.g2?.found,
            capterra: platformReviews.capterra?.found,
            trustradius: platformReviews.trustradius?.found,
            clutch: platformReviews.clutch?.found,
            totalReviews: platformReviews.allReviews.length
          });
        } catch (platformErr) {
          console.warn('[ProofDevPage] Review platforms fetch failed:', platformErr);
        }
      })());

      // 3. Press & News Mentions
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Searching press mentions...');
          const pressMentions = await pressNewsScraperService.scrapePressMentions(currentBrand.name);
          results.pressMentions = pressMentions;
          console.log('[ProofDevPage] ✅ Press mentions:', {
            total: pressMentions.totalFound,
            major: pressMentions.majorPublicationCount,
            trade: pressMentions.tradePublicationCount
          });
        } catch (pressErr) {
          console.warn('[ProofDevPage] Press mentions fetch failed:', pressErr);
        }
      })());

      // 4. Deep Testimonials (dedicated testimonial/case-study pages)
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Scraping deep testimonials...');
          const deepTestimonials = await deepTestimonialScraperService.scrapeTestimonials(
            currentBrand.name,
            currentBrand.website || undefined
          );
          results.deepTestimonials = deepTestimonials;
          console.log('[ProofDevPage] ✅ Deep testimonials:', {
            testimonials: deepTestimonials.testimonials.length,
            caseStudies: deepTestimonials.caseStudies.length
          });
        } catch (testErr) {
          console.warn('[ProofDevPage] Deep testimonials fetch failed:', testErr);
        }
      })());

      // 5. Client Logos ("Trusted By" sections)
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Extracting client logos...');
          const clientLogos = await clientLogoExtractorService.extractClientLogos(
            currentBrand.name,
            currentBrand.website || undefined
          );
          results.clientLogos = clientLogos;
          console.log('[ProofDevPage] ✅ Client logos:', {
            total: clientLogos.totalCount,
            recognizable: clientLogos.recognizableCount,
            fortune500: clientLogos.fortune500Count
          });
        } catch (logoErr) {
          console.warn('[ProofDevPage] Client logos fetch failed:', logoErr);
        }
      })());

      // 6. Social Proof Metrics (LinkedIn, Twitter, YouTube)
      fetchPromises.push((async () => {
        try {
          console.log('[ProofDevPage] Scraping social proof...');
          const socialProof = await socialProofScraperService.scrapeSocialProof(currentBrand.name);
          results.socialProof = socialProof;
          console.log('[ProofDevPage] ✅ Social proof:', {
            platforms: socialProof.metrics.length,
            totalFollowers: socialProof.totalFollowers
          });
        } catch (socialErr) {
          console.warn('[ProofDevPage] Social proof fetch failed:', socialErr);
        }
      })());

      // 7. Website analysis
      if (currentBrand.website) {
        fetchPromises.push((async () => {
          try {
            console.log('[ProofDevPage] Analyzing website:', currentBrand.website);
            const websiteAnalyzer = new WebsiteAnalyzerService();
            const websiteAnalysis = await websiteAnalyzer.analyzeWebsite(currentBrand.website!);
            results.websiteProof = websiteAnalysis;
            console.log('[ProofDevPage] ✅ Website analysis complete');
          } catch (webErr) {
            console.warn('[ProofDevPage] Website analysis failed:', webErr);
          }
        })());
      }

      // Wait for all parallel fetches
      await Promise.all(fetchPromises);

      // Store results
      setLiveProofData(results);

      // Merge into cached context so consolidation picks it up
      setLiveLoadingStatus('Consolidating proof...');
      const updatedContext: DeepContext = {
        ...(cachedContext || {}),
        googleReviews: results.googleReviews || cachedContext?.googleReviews,
        // Store at top level for direct access
        websiteAnalysis: results.websiteProof || cachedContext?.websiteAnalysis,
        // Also store in business.websiteAnalysis where consolidation looks
        business: {
          ...(cachedContext?.business || {}),
          websiteAnalysis: results.websiteProof || cachedContext?.business?.websiteAnalysis,
        },
        // Store review platforms data
        reviewPlatforms: results.reviewPlatforms || (cachedContext as any)?.reviewPlatforms,
        // Store press mentions
        pressMentions: results.pressMentions || (cachedContext as any)?.pressMentions,
        // Store deep testimonials
        deepTestimonials: results.deepTestimonials || (cachedContext as any)?.deepTestimonials,
        // Store client logos
        clientLogos: results.clientLogos || (cachedContext as any)?.clientLogos,
        // Store social proof
        socialProof: results.socialProof || (cachedContext as any)?.socialProof,
      } as DeepContext;

      // Update cache
      localStorage.setItem(TRIGGERS_DEV_CACHE_KEY, JSON.stringify(updatedContext));
      setCachedContext(updatedContext);

      // Summary
      const reviewCount = (results.googleReviews?.length || 0) + (results.reviewPlatforms?.allReviews.length || 0);
      const pressCount = results.pressMentions?.totalFound || 0;
      const testimonialCount = (results.deepTestimonials?.totalFound || 0);
      const logoCount = results.clientLogos?.totalCount || 0;
      const socialCount = results.socialProof?.metrics.length || 0;
      setLiveLoadingStatus(`Done! ${reviewCount} reviews, ${testimonialCount} testimonials, ${pressCount} press, ${logoCount} logos, ${socialCount} social`);
      console.log('[ProofDevPage] ✅ Live proof fetch complete');

    } catch (err) {
      console.error('[ProofDevPage] Live fetch error:', err);
      setLiveLoadingStatus('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLiveLoading(false);
      // Clear status after a delay
      setTimeout(() => setLiveLoadingStatus(''), 5000);
    }
  }, [currentBrand, cachedContext]);

  // Use streaming hook for progressive proof loading
  const {
    proofs: streamingProofs,
    consolidationResult: streamingConsolidation,
    deepContext: streamingContext,
    isLoading: streamingLoading,
    loadingStatus,
    loadedSources,
    totalSources,
    percentComplete,
    error: streamingError
  } = useStreamingProof(currentBrand, uvp, streamingEnabled, profileType);

  // Use streaming results if available, otherwise fall back to cached consolidation
  const deepContext = streamingContext || cachedContext;

  // Consolidate proofs using the service (for cached data when not streaming)
  const cachedConsolidation = useMemo((): ProofConsolidationResult | null => {
    // If streaming is enabled and has results, use those instead
    if (streamingEnabled && streamingConsolidation) return null;
    if (!cachedContext && !uvp) return null;

    console.log('[ProofDevPage] Running consolidation with profile:', profileType);
    return proofConsolidationService.consolidate(cachedContext, uvp, profileType);
  }, [cachedContext, uvp, profileType, streamingEnabled, streamingConsolidation]);

  // Use streaming consolidation if available, otherwise use cached
  const consolidationResult = streamingConsolidation || cachedConsolidation;

  // Get filtered and sorted proofs
  const displayProofs = useMemo(() => {
    if (!consolidationResult) return [];

    let proofs = [...consolidationResult.proofs];

    // Filter by type
    if (activeFilter !== 'all') {
      proofs = proofs.filter(p => p.type === activeFilter);
    }

    // Sort
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
    setSelectedProofs(prev =>
      prev.includes(proofId)
        ? prev.filter(x => x !== proofId)
        : [...prev, proofId]
    );
  };

  // Status - accounts for streaming
  const getDataStatus = () => {
    if (streamingLoading) return 'streaming';
    if (streamingEnabled && streamingContext) return 'streamed';
    if (apiDisabled && cachedContext) return 'cached';
    if (cachedContext) return 'fresh';
    return 'empty';
  };
  const dataStatus = getDataStatus();
  const statusConfig: Record<string, { color: string; label: string }> = {
    empty: { color: 'bg-gray-100 text-gray-700', label: 'No Data' },
    cached: { color: 'bg-blue-100 text-blue-700', label: 'Cached' },
    fresh: { color: 'bg-green-100 text-green-700', label: 'Fresh' },
    streaming: { color: 'bg-yellow-100 text-yellow-700', label: 'Loading...' },
    streamed: { color: 'bg-purple-100 text-purple-700', label: 'Streamed' }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Proof 2.0 Dev</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {uvpLoading ? (
                    <span className="text-yellow-600">Loading UVP...</span>
                  ) : !uvp ? (
                    <span className="text-red-600">No UVP found</span>
                  ) : consolidationResult ? (
                    <span className="text-green-600">
                      {consolidationResult.proofs.length} proofs | Avg quality: {consolidationResult.avgQualityScore}
                    </span>
                  ) : (
                    <span>Run Triggers page first to cache data</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Brand:</span>
              <span className="font-medium text-gray-900 dark:text-white">{brandName}</span>
              <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${statusConfig[dataStatus].color}`}>
                {streamingLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusConfig[dataStatus].label}
                {streamingLoading && ` (${percentComplete}%)`}
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                {profileType}
              </span>
            </div>
          </div>

          {/* Right: Streaming toggle + Sort control */}
          <div className="flex items-center gap-4">
            {/* Streaming toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  streamingEnabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                }`}
              >
                {streamingLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {streamingEnabled ? 'Streaming ON' : 'Enable Streaming'}
              </button>
              {streamingEnabled && loadedSources.length > 0 && (
                <span className="text-xs text-gray-500">
                  {loadedSources.length}/{totalSources} sources
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />

            {/* FETCH LIVE PROOF BUTTON */}
            <button
              onClick={handleFetchLiveProof}
              disabled={liveLoading || !currentBrand}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                liveLoading
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 cursor-wait'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-md'
              }`}
            >
              {liveLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {liveLoading ? liveLoadingStatus : 'Fetch Live Proof'}
            </button>

            {/* CLEAR CACHE BUTTON */}
            <button
              onClick={() => {
                // Clear all proof-related cache keys
                localStorage.removeItem(TRIGGERS_DEV_CACHE_KEY);
                localStorage.removeItem('proofDevPage_deepContext_v1');
                localStorage.removeItem('proofDevPage_proofs_v1');
                // Force page reload to reset state
                window.location.reload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cache
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />

            {/* Sort control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort by:</span>
              <button
                onClick={() => setSortBy(sortBy === 'quality' ? 'relevance' : 'quality')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200"
              >
                <SortDesc className="w-3 h-3" />
                {sortBy === 'quality' ? 'Quality' : 'Relevance'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - UVP Building Blocks */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {uvp && (
                    <UVPBuildingBlocks
                      uvp={uvp}
                      deepContext={deepContext}
                      onSelectItem={(item) => {
                        console.log('[ProofDevPage] UVP item selected:', item);
                      }}
                    />
                  )}
                  {!uvp && uvpLoading && (
                    <div className="p-4 text-sm text-gray-500">Loading UVP data...</div>
                  )}
                  {!uvp && !uvpLoading && (
                    <div className="p-4 text-sm text-red-500">No UVP found. Complete onboarding first.</div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex-shrink-0 w-6 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center border-r border-gray-200 dark:border-slate-700"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Middle: Filter Tabs + Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Filter Tabs */}
          <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {(Object.keys(FILTER_CONFIG) as FilterType[]).map((filter) => {
                const config = FILTER_CONFIG[filter];
                const Icon = config.icon;
                const count = filterCounts[filter] || 0;

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {displayProofs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Proof Points Yet
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
                  {!cachedContext
                    ? 'Run the Triggers page first (/triggers-dev) to fetch and cache DeepContext data.'
                    : 'No proof points found for this filter. Try selecting "All".'}
                </p>
                {!cachedContext && (
                  <a
                    href="/triggers-dev"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Go to Triggers Page
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>

        {/* Right: Selected Proofs Panel */}
        <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Selected Proof</h3>
            {/* Auto-select best button (Phase 5.3) */}
            {consolidationResult && consolidationResult.proofs.length > 0 && (
              <button
                onClick={() => {
                  // Auto-select top 5 highest quality proofs
                  const topProofs = [...consolidationResult.proofs]
                    .sort((a, b) => b.qualityScore - a.qualityScore)
                    .slice(0, 5)
                    .map(p => p.id);
                  setSelectedProofs(topProofs);
                  console.log('[ProofDevPage] Auto-selected top 5 proofs');
                }}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded hover:bg-purple-200 transition-colors"
              >
                Auto-select best
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Click proof points to select for content
          </p>

          {selectedProofs.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 text-center">
              <Award className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No proof points selected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProofs.map((id) => {
                const proof = displayProofs.find(p => p.id === id) || consolidationResult?.proofs.find(p => p.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="text-xs text-blue-900 dark:text-blue-100 truncate block">
                        {proof?.title || id}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-300">
                        Quality: {proof?.qualityScore || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle(id)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Use in Content
              </button>

              <button
                onClick={() => setSelectedProofs([])}
                className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Streaming Status */}
          {streamingEnabled && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Streaming Status
              </h4>
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{loadingStatus}</p>

                {/* Loaded sources */}
                {loadedSources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {loadedSources.map((source) => (
                      <span
                        key={source}
                        className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}

                {/* Error display */}
                {streamingError && (
                  <p className="text-xs text-red-500 mt-2">{streamingError}</p>
                )}
              </div>
            </div>
          )}

          {/* Consolidation Stats */}
          {consolidationResult && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Stats</h4>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Extracted:</span>
                  <span>{consolidationResult.totalExtracted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deduplicated:</span>
                  <span>{consolidationResult.deduplicatedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Quality:</span>
                  <span className="font-medium">{consolidationResult.avgQualityScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Types:</span>
                  <span>{consolidationResult.topProofTypes.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap with error boundary
export function ProofDevPage() {
  return (
    <ProofDevErrorBoundary>
      <ProofDevPageInner />
    </ProofDevErrorBoundary>
  );
}

export default ProofDevPage;
