/**
 * V4 Power Mode Panel
 *
 * Matches V3 PowerMode layout exactly:
 * - Two columns: InsightGrid (80%) + YourMix preview (20%)
 * - Templates dropdown that auto-selects insights
 * - Filter tabs for insight types
 * - Click to select insights (no drag and drop)
 * - Live preview synthesizes with V4 engine
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 - Matched to V3 PowerMode layout
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, memo, startTransition, useDeferredValue } from 'react';
// Removed react-window Grid - using CSS grid for proper expansion handling
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Target,
  Heart,
  Lightbulb,
  Flame,
  MapPin,
  DollarSign,
  Rocket,
  BookOpen,
  Scale,
  Shield,
  Clock,
  BookOpenText,
  Layers,
  Users,
  HelpCircle,
  Compass,
  TrendingUp,
  RefreshCw,
  Brain,
  FileText,
  Mail,
  Newspaper,
  Globe,
  Loader2,
  AlertCircle,
  MessageSquare,
  Link2,
  ExternalLink,
  Quote,
  CheckCircle2,
  Package,
  Crown,
  Settings,
  Cpu,
  Megaphone,
  Calendar,
  FileEdit,
  LayoutTemplate,
  Plus,
  Lock,
  Star,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

import { useV4ContentGeneration } from '@/hooks/useV4ContentGeneration';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useCompetitorIntelligence } from '@/hooks/useCompetitorIntelligence';
import { useEarlyCompetitorDiscovery } from '@/hooks/useEarlyCompetitorDiscovery';
import { CompetitorGapsPanel } from './CompetitorGapsPanel';
import { CompetitorChipsBar } from './CompetitorChipsBar';
import { CompetitorIntelligencePanel } from './CompetitorIntelligencePanel';
import { StreamingGapIndicator, GapSkeletonGrid } from './GapSkeletonCards';
import { CompetitorScanProgress } from './CompetitorScanProgress';
import { TriggersPanelV2 } from './TriggersPanelV2';
import { ProofTab } from './ProofTab';
import { EnhancedCompetitorIntelligence } from './EnhancedCompetitorIntelligence';
import { dashboardPreloader } from '@/services/dashboard/dashboard-preloader.service';
import { trueProgressiveBuilder } from '@/services/intelligence/deepcontext-builder-progressive.service';
import { redditAPI } from '@/services/intelligence/reddit-apify-api';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// Feature branch cache - only applies to OpenDialog brand
import {
  CACHED_BRAND_ID,
  CACHED_DEEP_CONTEXT,
  CACHED_INSIGHTS,
  hasCachedData,
  getCachedData,
  type CachedInsight
} from '@/data/cache/brand-insights-cache';
import type {
  GeneratedContent,
  PsychologyFramework,
  FunnelStage
} from '@/services/v4/types';

// ============================================================================
// ONE-TIME CONVERSATION FETCHER (Set to true to fetch, then set back to false)
// Fetches from: LinkedIn (via Perplexity), Reddit, Industry Forums, Google Reviews
// ============================================================================
const FETCH_CONVERSATIONS_ONCE = false; // Set to false - conversations already cached
let conversationsFetched = false; // Module-level flag to prevent duplicate fetches

async function fetchAndCacheConversations(uvp: CompleteUVP, brandId: string): Promise<InsightCard[]> {
  if (!FETCH_CONVERSATIONS_ONCE || conversationsFetched) {
    return [];
  }
  conversationsFetched = true;

  console.log('[ConversationFetcher] 🔥 ONE-TIME: Fetching conversations from multiple sources...');

  // Extract pain point keywords from UVP
  const painPointKeywords: string[] = [];

  // From transformation goal
  if (uvp.transformationGoal?.statement) {
    painPointKeywords.push(uvp.transformationGoal.statement.slice(0, 50));
  }
  if (uvp.transformationGoal?.before) {
    painPointKeywords.push(uvp.transformationGoal.before);
  }
  // From emotional/functional drivers
  if (uvp.transformationGoal?.emotionalDrivers) {
    painPointKeywords.push(...uvp.transformationGoal.emotionalDrivers.slice(0, 2));
  }
  if (uvp.transformationGoal?.functionalDrivers) {
    painPointKeywords.push(...uvp.transformationGoal.functionalDrivers.slice(0, 2));
  }
  // From key benefit
  if (uvp.keyBenefit?.statement) {
    painPointKeywords.push(uvp.keyBenefit.statement.slice(0, 50));
  }

  // Fallback if no UVP data
  const uvpData = uvp as any;
  const industry = uvpData.industry || 'insurance';
  const customerSegment = uvp.targetCustomer?.statement || 'insurance professionals';

  if (painPointKeywords.length === 0) {
    painPointKeywords.push(
      `${industry} problems`,
      `${industry} frustrating`,
      `${industry} challenges`
    );
  }

  console.log('[ConversationFetcher] Keywords:', painPointKeywords.slice(0, 3));
  console.log('[ConversationFetcher] Customer segment:', customerSegment);

  const allInsights: InsightCard[] = [];

  // 1. LINKEDIN & INDUSTRY FORUMS (via Perplexity) - PRIORITY SOURCE for B2B
  try {
    console.log('[ConversationFetcher] 📍 Fetching LinkedIn/Forum discussions via Perplexity...');
    const perplexityConvos = await perplexityAPI.findIndustryConversations(industry, customerSegment);

    console.log(`[ConversationFetcher] ✅ Perplexity returned ${perplexityConvos.length} discussions`);

    perplexityConvos.forEach((convo, idx) => {
      allInsights.push({
        id: `linkedin-convo-${Date.now()}-${idx}`,
        type: 'conversations' as InsightType,
        title: convo.content.slice(0, 60) + '...',
        category: 'LinkedIn/Industry Discussion',
        confidence: convo.confidence || 0.85,
        isTimeSensitive: false,
        description: convo.content,
        evidence: [],
        sources: [{
          source: 'LinkedIn/Forums',
          quote: convo.content.slice(0, 100)
        }],
        rawData: {
          type: 'community_discussion',
          source: 'perplexity',
          metadata: {
            platform: 'linkedin',
            domain: 'community'
          }
        }
      });
    });
  } catch (error) {
    console.error('[ConversationFetcher] Perplexity error:', error);
  }

  // 2. PAIN POINT CONVERSATIONS (via Perplexity) - searches Reddit, forums, communities
  try {
    console.log('[ConversationFetcher] 📍 Fetching pain point conversations via Perplexity...');
    const painPointConvos = await perplexityAPI.findPainPointConversations(painPointKeywords, industry);

    console.log(`[ConversationFetcher] ✅ Pain point search returned ${painPointConvos.length} conversations`);

    painPointConvos.forEach((convo, idx) => {
      allInsights.push({
        id: `painpoint-convo-${Date.now()}-${idx}`,
        type: 'conversations' as InsightType,
        title: convo.content.slice(0, 60) + '...',
        category: 'Customer Pain Point',
        confidence: convo.confidence || 0.8,
        isTimeSensitive: false,
        description: convo.content,
        evidence: [],
        sources: [{
          source: 'Community Forums',
          quote: convo.content.slice(0, 100)
        }],
        rawData: {
          type: 'community_discussion',
          source: 'perplexity',
          metadata: {
            platform: 'forums',
            domain: 'community'
          }
        }
      });
    });
  } catch (error) {
    console.error('[ConversationFetcher] Pain point search error:', error);
  }

  // 3. REDDIT (via Apify) - direct Reddit scraping
  try {
    console.log('[ConversationFetcher] 📍 Fetching Reddit conversations via Apify...');
    const redditConvos = await redditAPI.mineConversations(
      painPointKeywords,
      industry,
      { limit: 10, timeFilter: 'month' }
    );

    console.log(`[ConversationFetcher] ✅ Reddit returned ${redditConvos.insights.length} conversations`);

    redditConvos.insights.forEach((insight, idx) => {
      allInsights.push({
        id: `reddit-convo-${Date.now()}-${idx}`,
        type: 'conversations' as InsightType,
        title: (insight.painPoint || insight.context || '').slice(0, 60) + '...',
        category: insight.subreddit ? `r/${insight.subreddit}` : 'Reddit Discussion',
        confidence: 0.8,
        isTimeSensitive: false,
        description: insight.context || insight.painPoint || '',
        evidence: insight.url ? [`Source: ${insight.url}`] : [],
        sources: [{
          source: 'Reddit',
          quote: insight.painPoint
        }],
        rawData: {
          type: 'community_discussion',
          source: 'reddit',
          metadata: {
            subreddit: insight.subreddit,
            upvotes: insight.upvotes,
            url: insight.url,
            platform: 'reddit',
            domain: 'community'
          }
        }
      });
    });
  } catch (error) {
    console.error('[ConversationFetcher] Reddit error:', error);
  }

  // 4. GOOGLE REVIEWS (from cached OutScraper data)
  try {
    console.log('[ConversationFetcher] 📍 Checking for cached Google Reviews...');
    const deepContextKey = `deepContext_${brandId}`;
    const cachedContextStr = localStorage.getItem(deepContextKey);

    if (cachedContextStr) {
      const cachedContext = JSON.parse(cachedContextStr) as any; // Use any for flexible access
      const reviews = cachedContext.customerIntel?.reviews || cachedContext.reviews || [];

      console.log(`[ConversationFetcher] ✅ Found ${reviews.length} cached reviews`);

      reviews.slice(0, 10).forEach((review: any, idx: number) => {
        if (review.text && review.text.length > 20) {
          allInsights.push({
            id: `review-convo-${Date.now()}-${idx}`,
            type: 'conversations' as InsightType,
            title: review.text.slice(0, 60) + '...',
            category: `Google Review (${review.rating || 5}★)`,
            confidence: 0.9,
            isTimeSensitive: false,
            description: review.text,
            evidence: [],
            sources: [{
              source: 'Google Reviews',
              quote: review.text.slice(0, 100)
            }],
            rawData: {
              type: 'community_discussion',
              source: 'outscraper',
              metadata: {
                rating: review.rating,
                platform: 'google',
                domain: 'community'
              }
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('[ConversationFetcher] Reviews error:', error);
  }

  // Save all conversations to localStorage cache
  const cacheKey = `conversations_${brandId}`;
  localStorage.setItem(cacheKey, JSON.stringify(allInsights));
  console.log(`[ConversationFetcher] ✅ TOTAL: Saved ${allInsights.length} conversations to localStorage`);
  console.log(`[ConversationFetcher] Breakdown: LinkedIn/Forums, Pain Points, Reddit, Reviews`);

  return allInsights;
}

// ============================================================================
// TYPES
// ============================================================================

// New Synapse-aligned insight categories (action-driven, not source-driven)
type InsightType = 'triggers' | 'proof' | 'trends' | 'conversations' | 'gaps';
type FilterType = 'all' | InsightType;

// Legacy type mapping for backward compatibility with existing data
const LEGACY_TYPE_MAP: Record<string, InsightType> = {
  'customer': 'conversations',  // Customer insights → what customers are saying
  'market': 'trends',           // Market insights → what's happening now
  'competition': 'gaps',        // Competition insights → where competitors fall short
  'local': 'trends',            // Local insights → timely local relevance
  'opportunity': 'gaps',        // Opportunity insights → unmet needs
};

// New Synapse insight type mapping - maps data sources to content-action categories
// This defines HOW data should be used for content creation
const SYNAPSE_TYPE_MAP = {
  // TRIGGERS: Psychological hooks that drive action
  emotionalTriggers: 'triggers' as InsightType,      // Emotional drivers from customer psychology
  painPoints: 'triggers' as InsightType,             // Frustrations and fears
  desires: 'triggers' as InsightType,                // What customers want to become/achieve
  objections: 'triggers' as InsightType,             // Barriers to conversion

  // PROOF: Validation and credibility signals
  testimonials: 'proof' as InsightType,              // Customer success stories
  metrics: 'proof' as InsightType,                   // Numbers and statistics
  caseStudies: 'proof' as InsightType,               // Detailed success examples
  reviews: 'proof' as InsightType,                   // Third-party validation
  competitorWeaknesses: 'proof' as InsightType,      // Why you're better

  // TRENDS: Timely relevance hooks
  industryTrends: 'trends' as InsightType,           // What's changing in the industry
  culturalMoments: 'trends' as InsightType,          // Current events, seasonal
  newsHooks: 'trends' as InsightType,                // Breaking news angles
  localEvents: 'trends' as InsightType,              // Location-specific timing

  // CONVERSATIONS: Voice of customer
  redditDiscussions: 'conversations' as InsightType, // Reddit threads
  forumPosts: 'conversations' as InsightType,        // Community discussions
  socialComments: 'conversations' as InsightType,    // Social media sentiment
  reviewQuotes: 'conversations' as InsightType,      // Actual customer language

  // GAPS: Opportunity spaces
  marketGaps: 'gaps' as InsightType,                 // Unmet market needs
  competitorBlindSpots: 'gaps' as InsightType,       // What competitors miss
  unarticuatedNeeds: 'gaps' as InsightType,          // Hidden customer desires
  contentGaps: 'gaps' as InsightType,                // Underserved topics
};

interface InsightSource {
  source: string;
  quote?: string;
  timestamp?: string;
  url?: string;
  author?: string;
  subreddit?: string;
  platform?: string;
}

interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  category: string;
  confidence: number;
  isTimeSensitive: boolean;
  description: string;
  actionableInsight?: string;
  evidence?: string[];
  sources?: InsightSource[];
  rawData?: any;
  uvpAlignment?: {
    component: 'target_customer' | 'key_benefit' | 'transformation' | 'unique_solution';
    matchScore: number;
  };
  contentPillars?: string[];
  correlatedSources?: string[];
}

// Source name mapper - convert API names to user-friendly names
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'apify-reddit': 'Reddit',
  'reddit': 'Reddit',
  'apify-twitter': 'Twitter/X',
  'twitter': 'Twitter/X',
  'apify-quora': 'Quora',
  'quora': 'Quora',
  'apify-g2': 'G2 Reviews',
  'g2': 'G2 Reviews',
  'apify-trustpilot': 'TrustPilot',
  'trustpilot': 'TrustPilot',
  'outscraper-reviews': 'Google Reviews',
  'google-reviews': 'Google Reviews',
  'perplexity': 'Web Research',
  'perplexity-api': 'Web Research',
  'serper': 'Google Search',
  'serper-api': 'Google Search',
  'semrush': 'SEO Analytics',
  'semrush-api': 'SEO Analytics',
  'youtube': 'YouTube',
  'youtube-api': 'YouTube',
  'linkedin': 'LinkedIn',
  'linkedin-api': 'LinkedIn',
  'news': 'News Articles',
  'website': 'Website Analysis',
  'website-analyzer': 'Website Analysis',
  'ai-synthesis': 'AI Analysis',
  'AI Synthesis': 'AI Analysis',
  'Pattern Recognition': 'Pattern Analysis',
  'Seasonal Calendar': 'Seasonal Trends',
  'Market Gap Analysis': 'Market Analysis',
  'Cultural Trends Analysis': 'Cultural Trends',
  'Local Events Data': 'Local Events',
};

function getDisplaySourceName(source: string): string {
  const lowerSource = source.toLowerCase();
  return SOURCE_DISPLAY_NAMES[lowerSource] || SOURCE_DISPLAY_NAMES[source] || source;
}

// ============================================================================
// FRAMEWORK & FUNNEL TOOLTIP DATA
// ============================================================================

const FRAMEWORK_TOOLTIPS: Record<string, { displayName: string; label: string; description: string }> = {
  AIDA: {
    displayName: 'Grab Attention → Drive Action',
    label: 'AIDA (Attention → Interest → Desire → Action)',
    description: 'Classic 4-step persuasion model. Best for: Sales pages, email sequences, ads. Guides readers from awareness to purchase decision.'
  },
  PAS: {
    displayName: 'Problem → Solution',
    label: 'PAS (Problem → Agitate → Solution)',
    description: 'Highlight pain, intensify it, then offer relief. Best for: Landing pages, sales copy. Very effective for problem-aware audiences.'
  },
  BAB: {
    displayName: 'Show Transformation',
    label: 'BAB (Before → After → Bridge)',
    description: 'Show transformation: current state → desired state → how to get there. Best for: Case studies, testimonials, transformation stories.'
  },
  PASTOR: {
    displayName: 'Story + Social Proof',
    label: 'PASTOR (Problem → Amplify → Story → Testimony → Offer → Response)',
    description: 'Comprehensive framework combining storytelling with social proof. Best for: Long-form sales pages, webinar scripts, high-ticket offers.'
  },
  StoryBrand: {
    displayName: 'Hero\'s Journey',
    label: 'StoryBrand (Hero\'s Journey)',
    description: 'Position customer as hero, brand as guide. Best for: Brand messaging, about pages, mission statements. Creates emotional connection.'
  },
  CuriosityGap: {
    displayName: 'Create Intrigue',
    label: 'Curiosity Gap',
    description: 'Create intrigue by hinting at valuable information. Best for: Headlines, email subjects, social hooks. Drives clicks and opens.'
  },
  PatternInterrupt: {
    displayName: 'Stop the Scroll',
    label: 'Pattern Interrupt',
    description: 'Break expectations to capture attention. Best for: Scroll-stopping content, ads, competitive markets. Cuts through noise.'
  },
  SocialProof: {
    displayName: 'Show Trust & Results',
    label: 'Social Proof',
    description: 'Leverage testimonials, numbers, and peer behavior. Best for: Trust-building, overcoming objections, conversion optimization.'
  },
  Scarcity: {
    displayName: 'Create Urgency',
    label: 'Scarcity & Urgency',
    description: 'Limited time/quantity creates action pressure. Best for: Promotions, launches, closing deals. Use authentically to maintain trust.'
  },
  Reciprocity: {
    displayName: 'Give Value First',
    label: 'Reciprocity',
    description: 'Give value first to create obligation. Best for: Lead magnets, free trials, relationship building. Builds goodwill and trust.'
  },
  LossAversion: {
    displayName: 'Fear of Missing Out',
    label: 'Loss Aversion',
    description: 'People fear losing more than they value gaining. Best for: Risk-reversal, guarantees, "what you\'re missing" messaging.'
  },
  Authority: {
    displayName: 'Build Credibility',
    label: 'Authority',
    description: 'Establish expertise and credibility. Best for: Thought leadership, B2B, professional services. Builds trust through competence.'
  },
  FAB: {
    displayName: 'Features → Benefits',
    label: 'FAB (Features → Advantages → Benefits)',
    description: 'Connect product features to customer outcomes. Best for: Product descriptions, feature announcements, comparison content.'
  }
};

const FUNNEL_TOOLTIPS: Record<string, { displayName: string; emoji: string; acronym: string; description: string }> = {
  TOFU: {
    displayName: 'Cold Audience',
    emoji: '❄️',
    acronym: 'TOFU - Top of Funnel',
    description: 'Strangers who don\'t know you yet. Focus on educational content, thought leadership, and brand awareness. Goal: Attract and inform without selling.'
  },
  MOFU: {
    displayName: 'Warm Leads',
    emoji: '🌡️',
    acronym: 'MOFU - Middle of Funnel',
    description: 'People actively considering options. Focus on case studies, comparisons, demos, and webinars. Goal: Build trust and differentiate from competitors.'
  },
  BOFU: {
    displayName: 'Hot Prospects',
    emoji: '🔥',
    acronym: 'BOFU - Bottom of Funnel',
    description: 'Ready-to-buy decision makers. Focus on pricing, testimonials, guarantees, and direct CTAs. Goal: Remove final objections and close the sale.'
  }
};

// Platform icons as inline SVG components
const PlatformIcons = {
  linkedin: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  instagram: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  twitter: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  tiktok: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
};

const PLATFORM_TOOLTIPS: Record<string, { label: string; description: string }> = {
  linkedin: {
    label: 'LinkedIn',
    description: 'Professional network. Best for: B2B, thought leadership, industry insights. Tone: Professional, value-driven. Optimal: 1,300 chars, weekday mornings.'
  },
  instagram: {
    label: 'Instagram',
    description: 'Visual-first platform. Best for: Brand personality, behind-scenes, lifestyle. Tone: Authentic, visual. Optimal: Carousels, Reels, Stories.'
  },
  twitter: {
    label: 'Twitter/X',
    description: 'Real-time conversation. Best for: Hot takes, threads, engagement. Tone: Concise, witty, timely. Optimal: 280 chars, high frequency.'
  },
  facebook: {
    label: 'Facebook',
    description: 'Community-focused. Best for: Groups, local business, community building. Tone: Conversational, relatable. Optimal: Longer posts, video.'
  },
  tiktok: {
    label: 'TikTok',
    description: 'Short-form video. Best for: Trends, entertainment, younger demos. Tone: Authentic, fun, trend-aware. Optimal: 15-60 sec videos, sounds.'
  }
};

interface InsightRecipe {
  id: string;
  name: string;
  description: string;
  emoji: string;
  insightTypes: InsightType[];
  minInsights: number;
  maxInsights: number;
  primaryFramework: PsychologyFramework;
  targetFunnelStage: FunnelStage;
  suggestedPlatforms: {
    b2b: ('linkedin' | 'twitter' | 'facebook')[];
    b2c: ('instagram' | 'tiktok' | 'facebook' | 'twitter')[];
  };
  compatibleTemplates: string[];
}

interface V4PowerModePanelProps {
  uvp: CompleteUVP;
  brandId?: string;
  context?: DeepContext;  // Optional - will load if not provided
  onContentGenerated?: (content: GeneratedContent) => void;
  onSaveToCalendar?: (content: GeneratedContent) => void;
  /** DEV MODE: Skip all external API calls, use cached/mock data only */
  skipApis?: boolean;
  /** Force fresh API calls, bypassing all caches (preloader, file cache, etc.) */
  forceApiRefresh?: boolean;
}

// ============================================================================
// TEMPLATE RECIPES (Same as V3)
// ============================================================================

const TEMPLATE_RECIPES: InsightRecipe[] = [
  {
    id: 'authority',
    name: 'Authority Builder',
    description: 'Build credibility and expertise with data-driven content',
    emoji: '🎯',
    insightTypes: ['trends', 'gaps', 'proof'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Authority Builder', 'Education First', 'Comparison Campaign'],
  },
  {
    id: 'trust',
    name: 'Trust Builder',
    description: 'Build customer confidence with social proof and stories',
    emoji: '🤝',
    insightTypes: ['conversations', 'proof'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'StoryBrand',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'facebook'], b2c: ['instagram', 'facebook'] },
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Hero\'s Journey'],
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Address pain points directly with PAS framework',
    emoji: '💡',
    insightTypes: ['triggers', 'conversations', 'gaps'],
    minInsights: 3,
    maxInsights: 6,
    primaryFramework: 'PAS',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['PAS Series', 'BAB Campaign', 'Quick Win'],
  },
  {
    id: 'viral',
    name: 'Viral Content',
    description: 'Trending and shareable content that spreads',
    emoji: '🚀',
    insightTypes: ['trends', 'gaps'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'CuriosityGap',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['twitter', 'linkedin'], b2c: ['tiktok', 'instagram'] },
    compatibleTemplates: ['Seasonal Urgency', 'Scarcity Sequence', 'Product Launch'],
  },
  {
    id: 'local',
    name: 'Local Champion',
    description: 'Community-focused content with local relevance',
    emoji: '📍',
    insightTypes: ['trends', 'conversations', 'gaps'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'BAB',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['facebook', 'linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Social Proof', 'Quick Win', 'PAS Series'],
  },
  {
    id: 'conversion',
    name: 'Conversion Driver',
    description: 'Direct response content optimized for action',
    emoji: '💰',
    insightTypes: ['triggers', 'conversations', 'gaps'],
    minInsights: 3,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'BOFU',
    suggestedPlatforms: { b2b: ['linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Value Stack', 'Scarcity Sequence', 'Objection Crusher'],
  },
  {
    id: 'launch',
    name: 'Product Launch',
    description: 'Create buzz and anticipation for new products',
    emoji: '🎉',
    insightTypes: ['trends', 'conversations', 'gaps'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['instagram', 'tiktok'] },
    compatibleTemplates: ['Product Launch', 'RACE Journey', 'Value Stack'],
  },
  {
    id: 'education',
    name: 'Education First',
    description: 'Lead with value and educate your audience',
    emoji: '📚',
    insightTypes: ['trends', 'conversations', 'proof'],
    minInsights: 2,
    maxInsights: 6,
    primaryFramework: 'PAS',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['linkedin'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Education First', 'Authority Builder', 'Trust Ladder'],
  },
  {
    id: 'comparison',
    name: 'Competitive Edge',
    description: 'Position against competitors with clear differentiation',
    emoji: '⚖️',
    insightTypes: ['gaps', 'trends', 'proof'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'AIDA',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['facebook', 'instagram'] },
    compatibleTemplates: ['Comparison Campaign', 'Authority Builder', 'Objection Crusher'],
  },
  {
    id: 'quick-win',
    name: 'Quick Wins',
    description: 'Fast results with minimal friction',
    emoji: '⚡',
    insightTypes: ['triggers', 'conversations'],
    minInsights: 1,
    maxInsights: 4,
    primaryFramework: 'BAB',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'twitter'], b2c: ['instagram', 'facebook'] },
    compatibleTemplates: ['Quick Win', 'PAS Series', 'BAB Campaign'],
  },
  {
    id: 'social-proof',
    name: 'Social Proof Engine',
    description: 'Leverage testimonials and case studies',
    emoji: '👥',
    insightTypes: ['proof', 'conversations'],
    minInsights: 2,
    maxInsights: 5,
    primaryFramework: 'SocialProof',
    targetFunnelStage: 'MOFU',
    suggestedPlatforms: { b2b: ['linkedin', 'facebook'], b2c: ['instagram', 'facebook'] },
    compatibleTemplates: ['Social Proof', 'Trust Ladder', 'Authority Builder'],
  },
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Hook attention with knowledge gaps',
    emoji: '🤔',
    insightTypes: ['trends', 'gaps', 'triggers'],
    minInsights: 2,
    maxInsights: 4,
    primaryFramework: 'CuriosityGap',
    targetFunnelStage: 'TOFU',
    suggestedPlatforms: { b2b: ['twitter', 'linkedin'], b2c: ['tiktok', 'instagram'] },
    compatibleTemplates: ['RACE Journey', 'Education First', 'Authority Builder'],
  },
];

// ============================================================================
// INSIGHT TYPE CONFIG
// ============================================================================

// New Synapse-aligned tab configuration
const typeConfig: Record<InsightType, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}> = {
  triggers: {
    label: 'Triggers',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Psychological hooks, emotional drivers, pain points',
    icon: Heart,
    gradient: 'from-red-500 to-rose-600'
  },
  proof: {
    label: 'Proof',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Social proof, testimonials, metrics, case studies',
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-600'
  },
  trends: {
    label: 'Trends',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Timely topics, industry shifts, cultural moments',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-600'
  },
  conversations: {
    label: 'Conversations',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'What customers are saying - Reddit, reviews, forums',
    icon: MessageSquare,
    gradient: 'from-purple-500 to-violet-600'
  },
  gaps: {
    label: 'Competitors',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Competitor intelligence, gaps, and opportunities',
    icon: Target,
    gradient: 'from-orange-500 to-amber-600'
  },
};

// ============================================================================
// HELPER FUNCTIONS (Same as V3)
// ============================================================================

function extractPlatform(sourceText: string): string {
  const platforms = ['Reddit', 'Google Reviews', 'YouTube', 'LinkedIn', 'Twitter', 'Perplexity', 'News'];
  for (const p of platforms) {
    if (sourceText.toLowerCase().includes(p.toLowerCase())) return p;
  }
  return sourceText.split(/[,;]/)[0].trim() || 'Analysis';
}

function extractQuote(evidence: string | string[] | undefined): string | undefined {
  if (!evidence) return undefined;
  const text = Array.isArray(evidence) ? evidence[0] : evidence;
  if (!text) return undefined;
  const quoteMatch = text.match(/"([^"]+)"|'([^']+)'/);
  return quoteMatch ? quoteMatch[1] || quoteMatch[2] : undefined;
}

function formatTimestamp(ts: string | undefined): string | undefined {
  if (!ts) return undefined;
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return ts;
  }
}

// ============================================================================
// INSIGHT MEMOIZATION CACHE - Prevents recreating objects for unchanged data
// ============================================================================

// Cache to store previously created insight objects
const insightCache = new Map<string, InsightCard>();

// Simple hash function for cache key generation
function hashInsightData(id: string, data: any): string {
  const dataStr = JSON.stringify(data || {});
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${id}-${hash}`;
}

// Get or create cached insight
function getCachedInsight(id: string, rawData: any, createFn: () => InsightCard): InsightCard {
  const cacheKey = hashInsightData(id, rawData);
  const cached = insightCache.get(cacheKey);
  if (cached) return cached;

  const insight = createFn();
  insightCache.set(cacheKey, insight);

  // Limit cache size to prevent memory leaks
  if (insightCache.size > 500) {
    const firstKey = insightCache.keys().next().value;
    if (firstKey) insightCache.delete(firstKey);
  }

  return insight;
}

// ============================================================================
// FREEZE FIX: Yield helper to break up long tasks
// This prevents main thread blocking by yielding control back to the browser
// ============================================================================

const yieldToMain = (): Promise<void> => {
  return new Promise(resolve => {
    // Use scheduler.yield() if available (Chrome 115+), fall back to setTimeout
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      (window as any).scheduler.yield().then(resolve);
    } else if (typeof requestIdleCallback !== 'undefined') {
      // requestIdleCallback is better than setTimeout for yielding
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      // Fallback to setTimeout(0) which still yields to event loop
      setTimeout(resolve, 0);
    }
  });
};

// Track extraction to prevent concurrent runs
let extractionInProgress = false;
let extractionAborted = false;
let currentExtractionId = 0;

// ============================================================================
// EXTRACT INSIGHTS FROM DEEPCONTEXT - ASYNC CHUNKED VERSION
// Yields to main thread between each section to prevent freeze
// ============================================================================

async function extractInsightsFromDeepContextAsync(
  context: DeepContext,
  uvp: CompleteUVP,
  onProgress?: (insights: InsightCard[], section: string) => void
): Promise<InsightCard[]> {
  const extractionId = ++currentExtractionId;

  // DEBUG: Log what data we're receiving
  console.log('[extractInsightsAsync] INPUT DATA COUNTS:', {
    trends: context?.industry?.trends?.length || 0,
    unarticulated: context?.customerPsychology?.unarticulated?.length || 0,
    emotional: context?.customerPsychology?.emotional?.length || 0,
    blindSpots: context?.competitiveIntel?.blindSpots?.length || 0,
    opportunities: context?.competitiveIntel?.opportunities?.length || 0,
    rawDataPoints: context?.rawDataPoints?.length || 0,
    correlatedInsights: context?.correlatedInsights?.length || 0,
    breakthroughs: context?.synthesis?.breakthroughs?.length || 0,
    keyInsights: context?.synthesis?.keyInsights?.length || 0,
    hiddenPatterns: context?.synthesis?.hiddenPatterns?.length || 0,
  });

  // If extraction is already in progress, abort and return early
  if (extractionInProgress) {
    console.log('[extractInsights] Aborting previous extraction');
    extractionAborted = true;
    await yieldToMain(); // Let previous extraction finish its current chunk
  }

  extractionInProgress = true;
  extractionAborted = false;

  const insights: InsightCard[] = [];

  const checkAborted = () => {
    if (extractionAborted || currentExtractionId !== extractionId) {
      throw new Error('EXTRACTION_ABORTED');
    }
  };

  try {
    // ============================================================================
    // CHUNK 1: INDUSTRY TRENDS
    // ============================================================================
    context.industry?.trends?.forEach((trend: any, idx: number) => {
      const insightId = `trend-${idx}`;
      insights.push(getCachedInsight(insightId, trend, () => {
        const title = (trend.trend || '').split(/[,.]|and |but /)[0].trim() || 'Market Trend';
        const evidenceArray = trend.evidence
          ? (Array.isArray(trend.evidence) ? trend.evidence : trend.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
          : [];

        return {
          id: insightId,
          type: 'trends' as InsightType, // Synapse: Industry trends → Trends tab
          title,
          category: 'Industry Trend',
          confidence: trend.strength || 0.75,
          isTimeSensitive: true, // Trends are time-sensitive
          description: trend.trend || 'Industry trend',
          evidence: evidenceArray,
          sources: [{
            source: extractPlatform(trend.source || 'Industry Analysis'),
            quote: extractQuote(trend.evidence),
            timestamp: formatTimestamp(trend.timestamp),
          }],
          rawData: trend,
        };
      }));
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'trends');

    // ============================================================================
    // CHUNK 2: CUSTOMER PSYCHOLOGY - UNARTICULATED NEEDS
    // ============================================================================
    context.customerPsychology?.unarticulated?.forEach((need: any, idx: number) => {
      const title = (need.need || '').split(/[,.]|and |but /)[0].trim() || 'Customer Need';
      const evidenceArray = need.evidence
        ? (Array.isArray(need.evidence) ? need.evidence : need.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `customer-need-${idx}`,
        type: 'gaps' as InsightType, // Synapse: Unarticulated needs → Gaps tab (hidden desires)
        title,
        category: 'Unarticulated Need',
        confidence: need.confidence || 0.8,
        isTimeSensitive: false,
        description: need.need || 'Customer need',
        actionableInsight: need.marketingAngle,
        evidence: evidenceArray,
        sources: [{
          source: extractPlatform(need.source || 'Customer Research'),
          quote: extractQuote(need.evidence) || need.emotionalDriver,
          timestamp: formatTimestamp(need.timestamp),
        }],
        rawData: need,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'customer-needs');

    // ============================================================================
    // CHUNK 3: CUSTOMER PSYCHOLOGY - EMOTIONAL TRIGGERS
    // ============================================================================
    context.customerPsychology?.emotional?.forEach((trigger: any, idx: number) => {
      const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
      const title = triggerText?.split(/[,.]|and |but /)[0].trim() || 'Emotional Trigger';

      insights.push({
        id: `customer-trigger-${idx}`,
        type: 'triggers' as InsightType, // Synapse: Emotional triggers → Triggers tab (psychological hooks)
        title,
        category: 'Emotional Trigger',
        confidence: typeof trigger === 'object' ? trigger.strength : 0.85,
        isTimeSensitive: false,
        description: triggerText,
        sources: [{
          source: typeof trigger === 'object' && trigger.context
            ? trigger.context.replace(/^From\s+/i, '').trim()
            : 'Customer Psychology',
          quote: typeof trigger === 'object' ? trigger.leverage : undefined,
        }],
        rawData: trigger,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'triggers');

    // ============================================================================
    // CHUNK 4: COMPETITIVE INTELLIGENCE - BLIND SPOTS
    // ============================================================================
    context.competitiveIntel?.blindSpots?.forEach((blindspot: any, idx: number) => {
      const title = (blindspot.topic || '').split(/[,.]|and |but /)[0].trim() || 'Competitor Blindspot';
      const evidenceArray = blindspot.evidence
        ? (Array.isArray(blindspot.evidence) ? blindspot.evidence : blindspot.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `competition-blindspot-${idx}`,
        type: 'gaps' as InsightType, // Synapse: Competitor blindspots → Gaps tab (competitive opportunities)
        title,
        category: 'Competitor Blindspot',
        confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
        isTimeSensitive: false,
        description: blindspot.topic || 'Competitive gap',
        evidence: evidenceArray,
        actionableInsight: blindspot.actionableInsight,
        sources: [{
          source: extractPlatform(blindspot.source || 'Competitive Analysis'),
          quote: extractQuote(blindspot.evidence) || blindspot.reasoning,
          timestamp: formatTimestamp(blindspot.timestamp),
        }],
        rawData: blindspot,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'blindspots');

    // ============================================================================
    // CHUNK 5: COMPETITIVE INTELLIGENCE - MARKET GAPS/OPPORTUNITIES
    // ============================================================================
    context.competitiveIntel?.opportunities?.forEach((gap: any, idx: number) => {
      const title = (gap.gap || '').split(/[,.]|and |but /)[0].trim() || 'Market Gap';
      const evidenceArray = gap.evidence
        ? (Array.isArray(gap.evidence) ? gap.evidence : gap.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      insights.push({
        id: `opportunity-gap-${idx}`,
        type: 'gaps' as InsightType, // Synapse: Market gaps → Gaps tab (opportunity spaces)
        title,
        category: 'Market Gap',
        confidence: gap.confidence || 0.85,
        isTimeSensitive: false,
        description: gap.gap || 'Market opportunity',
        evidence: evidenceArray,
        actionableInsight: gap.positioning,
        sources: [{
          source: extractPlatform(gap.source || 'Market Gap Analysis'),
          quote: extractQuote(gap.evidence),
          timestamp: formatTimestamp(gap.timestamp),
        }],
        rawData: gap,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'opportunities');

    // ============================================================================
    // CHUNK 6: LOCAL INTELLIGENCE - EVENTS
    // ============================================================================
    (context.realTimeCultural?.events as any[])?.forEach((event: any, idx: number) => {
      const eventName = event.name || event.title || String(event);
      const title = eventName.split(/[,.]|during |in /)[0].trim();

      insights.push({
        id: `local-event-${idx}`,
        type: 'trends' as InsightType,
        title,
        category: 'Local Event',
        confidence: 0.85,
        isTimeSensitive: true,
        description: eventName,
        sources: [{
          source: 'Local Events Data',
          timestamp: event.date,
        }],
        rawData: event,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'events');

    // ============================================================================
    // CHUNK 7: LOCAL INTELLIGENCE - CULTURAL MOMENTS
    // ============================================================================
    (context.realTimeCultural?.moments as any[])?.forEach((moment: any, idx: number) => {
      const momentText = typeof moment === 'string' ? moment : moment.description || 'Cultural Moment';
      const title = momentText.split(/[,.]|where |during /)[0].trim();

      insights.push({
        id: `local-moment-${idx}`,
        type: 'trends' as InsightType,
        title,
        category: 'Cultural Moment',
        confidence: 0.8,
        isTimeSensitive: true,
        description: momentText,
        sources: [{
          source: 'Cultural Trends Analysis',
        }],
        rawData: moment,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'moments');

    // ============================================================================
    // CHUNK 8: SYNTHESIS - KEY INSIGHTS
    // ============================================================================
    context.synthesis?.keyInsights?.forEach((insight: any, idx: number) => {
      if (typeof insight === 'string') {
        const title = insight.split(/[,.]|that |which /)[0].trim();

        insights.push({
          id: `synthesis-${idx}`,
          type: 'gaps' as InsightType,
          title,
          category: 'Key Insight',
          confidence: context.synthesis?.confidenceLevel || 0.8,
          isTimeSensitive: false,
          description: insight,
          sources: [{
            source: 'AI Synthesis',
          }],
        });
      }
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'synthesis');

    // ============================================================================
    // CHUNK 9: SYNTHESIS - HIDDEN PATTERNS
    // ============================================================================
    context.synthesis?.hiddenPatterns?.forEach((pattern: any, idx: number) => {
      const title = pattern.pattern?.split(/[,.]|where |when /)[0].trim() || 'Hidden Pattern';

      insights.push({
        id: `pattern-${idx}`,
        type: 'gaps' as InsightType,
        title,
        category: `${pattern.type?.charAt(0).toUpperCase() + pattern.type?.slice(1)} Pattern`,
        confidence: pattern.confidence || 0.8,
        isTimeSensitive: false,
        description: pattern.pattern,
        evidence: pattern.evidence || [],
        sources: [{
          source: 'Pattern Recognition',
          quote: pattern.implication,
        }],
        rawData: pattern,
      });
    });

    checkAborted();
    await yieldToMain();
    onProgress?.(insights, 'patterns');

    // ============================================================================
    // CHUNK 10: RAW DATA POINTS (largest section - process in smaller batches)
    // ============================================================================
    const rawDataPoints = context.rawDataPoints || [];
    const BATCH_SIZE = 25; // Process 25 items at a time

    for (let i = 0; i < rawDataPoints.length; i += BATCH_SIZE) {
      const batch = rawDataPoints.slice(i, i + BATCH_SIZE);

      batch.forEach((dp: any, batchIdx: number) => {
        const idx = i + batchIdx;
        const typeMap: Record<string, InsightType> = {
          'pain_point': 'triggers',
          'unarticulated_need': 'conversations',
          'customer_trigger': 'triggers',
          'trending_topic': 'trends',
          'competitive_gap': 'gaps',
          'timing': 'trends',
          'market_signal': 'trends',
          'opportunity': 'gaps',
          'community_discussion': 'conversations', // Reddit conversations from UVP pain point mining
        };

        const insightType: InsightType = typeMap[dp.type] || 'gaps';

        let category = 'Intelligence Data';
        if (dp.type === 'community_discussion') {
          // Special category for Reddit conversations from pain point mining
          const subreddit = dp.metadata?.subreddit;
          category = subreddit ? `r/${subreddit} Discussion` : 'Community Discussion';
        } else if (dp.metadata?.triggerCategory) {
          const triggerCategoryMap: Record<string, string> = {
            'pain_point': 'Pain Point',
            'fear': 'Fear-Based Trigger',
            'aspiration': 'Aspiration',
            'opportunity': 'Opportunity Signal',
            'social_proof': 'Social Proof',
            'urgency': 'Urgent Need',
          };
          category = triggerCategoryMap[dp.metadata.triggerCategory] || 'Intelligence Data';
        } else if (dp.source) {
          category = `${dp.source.charAt(0).toUpperCase() + dp.source.slice(1)} Data`;
        }

        const content = dp.content || '';
        const title = content.length > 60
          ? content.substring(0, 60).split(/[,.]|that |which /)[0].trim() + '...'
          : content.split(/[,.]|that |which /)[0].trim();

        if (title.length < 3) return;

        insights.push({
          id: `raw-${dp.id || idx}`,
          type: insightType,
          title,
          category,
          confidence: dp.metadata?.confidence || 0.75,
          isTimeSensitive: dp.metadata?.urgency === 'immediate',
          description: content,
          evidence: dp.metadata?.uvpMatch ? [`Validates UVP: ${dp.metadata.uvpMatch}`] : [],
          sources: [{
            source: extractPlatform(dp.source || 'Data Analysis'),
            quote: dp.metadata?.emotion ? `Detected emotion: ${dp.metadata.emotion}` : undefined,
          }],
          rawData: dp,
        });
      });

      // Yield after each batch to prevent blocking
      checkAborted();
      await yieldToMain();
    }
    console.log(`[extractInsightsAsync] After raw-data: ${insights.length} total insights (input had ${rawDataPoints.length} raw data points)`);
    onProgress?.(insights, 'raw-data');

    // ============================================================================
    // CHUNK 11: CORRELATED INSIGHTS
    // ============================================================================
    const correlatedCount = context.correlatedInsights?.length || 0;
    context.correlatedInsights?.forEach((ci: any, idx: number) => {
      const typeMap: Record<string, InsightType> = {
        'validated_pain': 'triggers',
        'psychological_breakthrough': 'triggers',
        'competitive_gap': 'gaps',
        'timing_opportunity': 'trends',
        'hidden_pattern': 'gaps',
      };

      const insightType: InsightType = typeMap[ci.type] || 'gaps';

      const categoryMap: Record<string, string> = {
        'validated_pain': '✓ Validated Pain Point',
        'psychological_breakthrough': '🧠 Psychological Breakthrough',
        'competitive_gap': '🎯 Competitive Gap',
        'timing_opportunity': '⏰ Timing Opportunity',
        'hidden_pattern': '🔍 Hidden Pattern',
      };
      const category = categoryMap[ci.type] || 'Correlated Insight';

      const evidenceList = ci.sources?.map((s: any) =>
        `${s.source}: "${s.content?.substring(0, 80)}..." (${Math.round(s.confidence * 100)}% confidence)`
      ) || [];

      insights.push({
        id: `correlated-${ci.id || idx}`,
        type: insightType,
        title: ci.title,
        category,
        confidence: ci.breakthroughScore / 100,
        isTimeSensitive: ci.timeSensitive,
        description: ci.description,
        actionableInsight: ci.actionableInsight,
        evidence: evidenceList,
        sources: ci.sources?.map((s: any) => ({
          source: extractPlatform(s.source),
          quote: s.content?.substring(0, 100),
        })) || [],
        rawData: ci,
      });
    });

    checkAborted();
    await yieldToMain();
    console.log(`[extractInsightsAsync] After correlated: ${insights.length} total insights (input had ${correlatedCount} correlated)`);
    onProgress?.(insights, 'correlated');

    // ============================================================================
    // CHUNK 12: BREAKTHROUGH OPPORTUNITIES
    // ============================================================================
    const breakthroughCount = context.synthesis?.breakthroughs?.length || 0;
    context.synthesis?.breakthroughs?.forEach((bt: any, idx: number) => {
      let insightType: InsightType = 'gaps';
      if (bt.uvpValidation) {
        insightType = 'triggers';
      } else if (bt.competitive) {
        insightType = 'gaps';
      } else if (bt.timing?.isTimeSensitive) {
        insightType = 'trends';
      }

      const stars = '⭐'.repeat(bt.confidenceStars || 0);
      const connectionBadge = bt.connectionType === '5-way' ? '🔥 5-WAY' :
                              bt.connectionType === '4-way' ? '💎 4-WAY' :
                              bt.connectionType === '3-way' ? '✨ 3-WAY' : '';
      const category = `${connectionBadge} Breakthrough ${stars}`;

      const evidenceList: string[] = [];
      if (bt.uvpValidation) {
        evidenceList.push(`✓ UVP VALIDATED: "${bt.uvpValidation.painPoint}" (${bt.uvpValidation.matchScore}% match)`);
        bt.uvpValidation.evidence?.forEach((e: string) => evidenceList.push(`  └ ${e}`));
      }
      if (bt.psychology) {
        evidenceList.push(`Psychology: ${bt.psychology.triggerCategory} trigger, ${bt.psychology.emotion} emotion`);
      }
      evidenceList.push(`Sources: ${bt.sources?.join(', ')} (${bt.sources?.length || 0} independent sources)`);
      if (bt.timing?.isTimeSensitive) {
        evidenceList.push(`⏰ TIME SENSITIVE: ${bt.timing.reason || 'Act now'}`);
      }
      if (bt.competitive?.gap) {
        evidenceList.push(`🎯 COMPETITOR GAP: ${bt.competitive.gap}`);
      }
      if (bt.eqScore) {
        evidenceList.push(`EQ Score: ${bt.eqScore}/100 | Urgency: ${bt.psychology?.urgency?.toUpperCase() || 'NORMAL'}`);
      }

      insights.push({
        id: `breakthrough-${bt.id || idx}`,
        type: insightType,
        title: bt.title,
        category,
        confidence: (bt.score || 80) / 100,
        isTimeSensitive: bt.timing?.isTimeSensitive || bt.psychology?.urgency === 'critical',
        description: bt.hook,
        actionableInsight: bt.actionPlan,
        evidence: evidenceList,
        sources: bt.sources?.map((s: string) => ({
          source: extractPlatform(s),
        })) || [],
        rawData: bt,
      });
    });

    checkAborted();
    await yieldToMain();
    console.log(`[extractInsightsAsync] After breakthroughs: ${insights.length} total insights (input had ${breakthroughCount} breakthroughs)`);
    onProgress?.(insights, 'breakthroughs');

    // ============================================================================
    // CHUNK 13: UVP-BASED INSIGHTS (Always include)
    // ============================================================================
    if (uvp) {
      if (uvp.targetCustomer) {
        insights.push({
          id: 'uvp-target',
          type: 'conversations' as InsightType,
          title: `Target: ${uvp.targetCustomer.industry || 'Ideal Customer'}`,
          category: 'Customer Profile',
          confidence: 0.95,
          isTimeSensitive: false,
          description: uvp.targetCustomer.statement || 'Your ideal customer from UVP',
          sources: [{ source: 'UVP Analysis' }],
        });
      }

      // Transformation insight removed - focusing on Emotional/Functional Drivers instead

      if (uvp.keyBenefit) {
        const benefitMetrics = uvp.keyBenefit.metrics?.map(m => `${m.metric}: ${m.value}`).join(', ');
        insights.push({
          id: 'uvp-benefit',
          type: 'gaps' as InsightType,
          title: 'Key Differentiator',
          category: 'Value Proposition',
          confidence: 0.92,
          isTimeSensitive: false,
          description: `${uvp.keyBenefit.statement || 'Your unique value'}${benefitMetrics ? `. Proof: ${benefitMetrics}` : ''}`,
          sources: [{ source: 'UVP Analysis' }],
        });
      }

      if (uvp.uniqueSolution) {
        insights.push({
          id: 'uvp-solution',
          type: 'gaps' as InsightType,
          title: 'Unique Approach',
          category: 'Competitive Edge',
          confidence: 0.88,
          isTimeSensitive: false,
          description: uvp.uniqueSolution.statement || 'Your unique solution',
          sources: [{ source: 'UVP Framework' }],
        });
      }
    }

    console.log(`[extractInsightsAsync] Complete: ${insights.length} insights extracted without blocking`);
    return insights;

  } catch (error) {
    if ((error as Error).message === 'EXTRACTION_ABORTED') {
      console.log('[extractInsightsAsync] Extraction aborted - newer extraction started');
      return [];
    }
    throw error;
  } finally {
    extractionInProgress = false;
  }
}

// ============================================================================
// LEGACY SYNC VERSION - DEPRECATED, use async version
// Kept for fallback compatibility only
// ============================================================================

function extractInsightsFromDeepContext(context: DeepContext, uvp: CompleteUVP): InsightCard[] {
  const insights: InsightCard[] = [];

  // ============================================================================
  // INDUSTRY TRENDS
  // ============================================================================
  context.industry?.trends?.forEach((trend: any, idx: number) => {
    const insightId = `trend-${idx}`;
    insights.push(getCachedInsight(insightId, trend, () => {
      const title = (trend.trend || '').split(/[,.]|and |but /)[0].trim() || 'Market Trend';
      const evidenceArray = trend.evidence
        ? (Array.isArray(trend.evidence) ? trend.evidence : trend.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
        : [];

      return {
        id: insightId,
        type: 'trends' as InsightType,
        title,
        category: 'Market Trend',
        confidence: trend.strength || 0.75,
        isTimeSensitive: false,
        description: trend.trend || 'Industry trend',
        evidence: evidenceArray,
        sources: [{
          source: extractPlatform(trend.source || 'Industry Analysis'),
          quote: extractQuote(trend.evidence),
          timestamp: formatTimestamp(trend.timestamp),
        }],
        rawData: trend,
      };
    }));
  });

  // ============================================================================
  // CUSTOMER PSYCHOLOGY - UNARTICULATED NEEDS
  // ============================================================================
  context.customerPsychology?.unarticulated?.forEach((need: any, idx: number) => {
    const title = (need.need || '').split(/[,.]|and |but /)[0].trim() || 'Customer Need';
    const evidenceArray = need.evidence
      ? (Array.isArray(need.evidence) ? need.evidence : need.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `customer-need-${idx}`,
      type: 'conversations' as InsightType,
      title,
      category: 'Customer Need',
      confidence: need.confidence || 0.8,
      isTimeSensitive: false,
      description: need.need || 'Customer need',
      actionableInsight: need.marketingAngle,
      evidence: evidenceArray,
      sources: [{
        source: extractPlatform(need.source || 'Customer Research'),
        quote: extractQuote(need.evidence) || need.emotionalDriver,
        timestamp: formatTimestamp(need.timestamp),
      }],
      rawData: need,
    });
  });

  // ============================================================================
  // CUSTOMER PSYCHOLOGY - EMOTIONAL TRIGGERS
  // ============================================================================
  context.customerPsychology?.emotional?.forEach((trigger: any, idx: number) => {
    const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger;
    const title = triggerText?.split(/[,.]|and |but /)[0].trim() || 'Emotional Trigger';

    insights.push({
      id: `customer-trigger-${idx}`,
      type: 'conversations' as InsightType,
      title,
      category: 'Emotional Trigger',
      confidence: typeof trigger === 'object' ? trigger.strength : 0.85,
      isTimeSensitive: false,
      description: triggerText,
      sources: [{
        source: typeof trigger === 'object' && trigger.context
          ? trigger.context.replace(/^From\s+/i, '').trim()
          : 'Customer Psychology',
        quote: typeof trigger === 'object' ? trigger.leverage : undefined,
      }],
      rawData: trigger,
    });
  });

  // ============================================================================
  // COMPETITIVE INTELLIGENCE - BLIND SPOTS
  // ============================================================================
  context.competitiveIntel?.blindSpots?.forEach((blindspot: any, idx: number) => {
    const title = (blindspot.topic || '').split(/[,.]|and |but /)[0].trim() || 'Competitor Blindspot';
    const evidenceArray = blindspot.evidence
      ? (Array.isArray(blindspot.evidence) ? blindspot.evidence : blindspot.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `competition-blindspot-${idx}`,
      type: 'gaps' as InsightType,
      title,
      category: 'Competitor Blindspot',
      confidence: blindspot.opportunityScore ? blindspot.opportunityScore / 100 : 0.8,
      isTimeSensitive: false,
      description: blindspot.topic || 'Competitive gap',
      evidence: evidenceArray,
      actionableInsight: blindspot.actionableInsight,
      sources: [{
        source: extractPlatform(blindspot.source || 'Competitive Analysis'),
        quote: extractQuote(blindspot.evidence) || blindspot.reasoning,
        timestamp: formatTimestamp(blindspot.timestamp),
      }],
      rawData: blindspot,
    });
  });

  // ============================================================================
  // COMPETITIVE INTELLIGENCE - MARKET GAPS/OPPORTUNITIES
  // ============================================================================
  context.competitiveIntel?.opportunities?.forEach((gap: any, idx: number) => {
    const title = (gap.gap || '').split(/[,.]|and |but /)[0].trim() || 'Market Gap';
    const evidenceArray = gap.evidence
      ? (Array.isArray(gap.evidence) ? gap.evidence : gap.evidence.split(';').map((e: string) => e.trim()).filter(Boolean))
      : [];

    insights.push({
      id: `opportunity-gap-${idx}`,
      type: 'gaps' as InsightType,
      title,
      category: 'Market Gap',
      confidence: gap.confidence || 0.85,
      isTimeSensitive: false,
      description: gap.gap || 'Market opportunity',
      evidence: evidenceArray,
      actionableInsight: gap.positioning,
      sources: [{
        source: extractPlatform(gap.source || 'Market Gap Analysis'),
        quote: extractQuote(gap.evidence),
        timestamp: formatTimestamp(gap.timestamp),
      }],
      rawData: gap,
    });
  });

  // ============================================================================
  // LOCAL INTELLIGENCE - EVENTS
  // ============================================================================
  (context.realTimeCultural?.events as any[])?.forEach((event: any, idx: number) => {
    const eventName = event.name || event.title || String(event);
    const title = eventName.split(/[,.]|during |in /)[0].trim();

    insights.push({
      id: `local-event-${idx}`,
      type: 'trends' as InsightType,
      title,
      category: 'Local Event',
      confidence: 0.85,
      isTimeSensitive: true,
      description: eventName,
      sources: [{
        source: 'Local Events Data',
        timestamp: event.date,
      }],
      rawData: event,
    });
  });

  // ============================================================================
  // LOCAL INTELLIGENCE - CULTURAL MOMENTS
  // ============================================================================
  (context.realTimeCultural?.moments as any[])?.forEach((moment: any, idx: number) => {
    const momentText = typeof moment === 'string' ? moment : moment.description || 'Cultural Moment';
    const title = momentText.split(/[,.]|where |during /)[0].trim();

    insights.push({
      id: `local-moment-${idx}`,
      type: 'trends' as InsightType,
      title,
      category: 'Cultural Moment',
      confidence: 0.8,
      isTimeSensitive: true,
      description: momentText,
      sources: [{
        source: 'Cultural Trends Analysis',
      }],
      rawData: moment,
    });
  });

  // ============================================================================
  // SYNTHESIS - KEY INSIGHTS
  // ============================================================================
  context.synthesis?.keyInsights?.forEach((insight: any, idx: number) => {
    if (typeof insight === 'string') {
      const title = insight.split(/[,.]|that |which /)[0].trim();

      insights.push({
        id: `synthesis-${idx}`,
        type: 'gaps' as InsightType,
        title,
        category: 'Key Insight',
        confidence: context.synthesis?.confidenceLevel || 0.8,
        isTimeSensitive: false,
        description: insight,
        sources: [{
          source: 'AI Synthesis',
        }],
      });
    }
  });

  // ============================================================================
  // SYNTHESIS - HIDDEN PATTERNS
  // ============================================================================
  context.synthesis?.hiddenPatterns?.forEach((pattern: any, idx: number) => {
    const title = pattern.pattern?.split(/[,.]|where |when /)[0].trim() || 'Hidden Pattern';

    insights.push({
      id: `pattern-${idx}`,
      type: 'gaps' as InsightType,
      title,
      category: `${pattern.type?.charAt(0).toUpperCase() + pattern.type?.slice(1)} Pattern`,
      confidence: pattern.confidence || 0.8,
      isTimeSensitive: false,
      description: pattern.pattern,
      evidence: pattern.evidence || [],
      sources: [{
        source: 'Pattern Recognition',
        quote: pattern.implication,
      }],
      rawData: pattern,
    });
  });

  // ============================================================================
  // RAW DATA POINTS - Display ALL collected data points directly
  // ============================================================================
  context.rawDataPoints?.forEach((dp: any, idx: number) => {
    const typeMap: Record<string, InsightType> = {
      'pain_point': 'triggers',
      'unarticulated_need': 'conversations',
      'customer_trigger': 'triggers',
      'trending_topic': 'trends',
      'competitive_gap': 'gaps',
      'timing': 'trends',
      'market_signal': 'trends',
      'opportunity': 'gaps',
    };

    const insightType: InsightType = typeMap[dp.type] || 'gaps';

    let category = 'Intelligence Data';
    if (dp.metadata?.triggerCategory) {
      const triggerCategoryMap: Record<string, string> = {
        'pain_point': 'Pain Point',
        'fear': 'Fear-Based Trigger',
        'aspiration': 'Aspiration',
        'opportunity': 'Opportunity Signal',
        'social_proof': 'Social Proof',
        'urgency': 'Urgent Need',
      };
      category = triggerCategoryMap[dp.metadata.triggerCategory] || 'Intelligence Data';
    } else if (dp.source) {
      category = `${dp.source.charAt(0).toUpperCase() + dp.source.slice(1)} Data`;
    }

    const content = dp.content || '';
    const title = content.length > 60
      ? content.substring(0, 60).split(/[,.]|that |which /)[0].trim() + '...'
      : content.split(/[,.]|that |which /)[0].trim();

    if (title.length < 3) return;

    insights.push({
      id: `raw-${dp.id || idx}`,
      type: insightType,
      title,
      category,
      confidence: dp.metadata?.confidence || 0.75,
      isTimeSensitive: dp.metadata?.urgency === 'immediate',
      description: content,
      evidence: dp.metadata?.uvpMatch ? [`Validates UVP: ${dp.metadata.uvpMatch}`] : [],
      sources: [{
        source: extractPlatform(dp.source || 'Data Analysis'),
        quote: dp.metadata?.emotion ? `Detected emotion: ${dp.metadata.emotion}` : undefined,
      }],
      rawData: dp,
    });
  });

  // ============================================================================
  // CORRELATED INSIGHTS - High-value cross-source validated insights
  // ============================================================================
  context.correlatedInsights?.forEach((ci: any, idx: number) => {
    const typeMap: Record<string, InsightType> = {
      'validated_pain': 'triggers',
      'psychological_breakthrough': 'triggers',
      'competitive_gap': 'gaps',
      'timing_opportunity': 'trends',
      'hidden_pattern': 'gaps',
    };

    const insightType: InsightType = typeMap[ci.type] || 'gaps';

    const categoryMap: Record<string, string> = {
      'validated_pain': '✓ Validated Pain Point',
      'psychological_breakthrough': '🧠 Psychological Breakthrough',
      'competitive_gap': '🎯 Competitive Gap',
      'timing_opportunity': '⏰ Timing Opportunity',
      'hidden_pattern': '🔍 Hidden Pattern',
    };
    const category = categoryMap[ci.type] || 'Correlated Insight';

    const evidenceList = ci.sources?.map((s: any) =>
      `${s.source}: "${s.content?.substring(0, 80)}..." (${Math.round(s.confidence * 100)}% confidence)`
    ) || [];

    insights.push({
      id: `correlated-${ci.id || idx}`,
      type: insightType,
      title: ci.title,
      category,
      confidence: ci.breakthroughScore / 100,
      isTimeSensitive: ci.timeSensitive,
      description: ci.description,
      actionableInsight: ci.actionableInsight,
      evidence: evidenceList,
      sources: ci.sources?.map((s: any) => ({
        source: extractPlatform(s.source),
        quote: s.content?.substring(0, 100),
      })) || [],
      rawData: ci,
    });
  });

  // ============================================================================
  // BREAKTHROUGH OPPORTUNITIES - Rich multi-source validated insights
  // ============================================================================
  context.synthesis?.breakthroughs?.forEach((bt: any, idx: number) => {
    let insightType: InsightType = 'gaps';
    if (bt.uvpValidation) {
      insightType = 'triggers';
    } else if (bt.competitive) {
      insightType = 'gaps';
    } else if (bt.timing?.isTimeSensitive) {
      insightType = 'trends';
    }

    const stars = '⭐'.repeat(bt.confidenceStars || 0);
    const connectionBadge = bt.connectionType === '5-way' ? '🔥 5-WAY' :
                            bt.connectionType === '4-way' ? '💎 4-WAY' :
                            bt.connectionType === '3-way' ? '✨ 3-WAY' : '';
    const category = `${connectionBadge} Breakthrough ${stars}`;

    const evidenceList: string[] = [];
    if (bt.uvpValidation) {
      evidenceList.push(`✓ UVP VALIDATED: "${bt.uvpValidation.painPoint}" (${bt.uvpValidation.matchScore}% match)`);
      bt.uvpValidation.evidence?.forEach((e: string) => evidenceList.push(`  └ ${e}`));
    }
    if (bt.psychology) {
      evidenceList.push(`Psychology: ${bt.psychology.triggerCategory} trigger, ${bt.psychology.emotion} emotion`);
    }
    evidenceList.push(`Sources: ${bt.sources?.join(', ')} (${bt.sources?.length || 0} independent sources)`);
    if (bt.timing?.isTimeSensitive) {
      evidenceList.push(`⏰ TIME SENSITIVE: ${bt.timing.reason || 'Act now'}`);
    }
    if (bt.competitive?.gap) {
      evidenceList.push(`🎯 COMPETITOR GAP: ${bt.competitive.gap}`);
    }
    if (bt.eqScore) {
      evidenceList.push(`EQ Score: ${bt.eqScore}/100 | Urgency: ${bt.psychology?.urgency?.toUpperCase() || 'NORMAL'}`);
    }

    insights.push({
      id: `breakthrough-${bt.id || idx}`,
      type: insightType,
      title: bt.title,
      category,
      confidence: (bt.score || 80) / 100,
      isTimeSensitive: bt.timing?.isTimeSensitive || bt.psychology?.urgency === 'critical',
      description: bt.hook,
      actionableInsight: bt.actionPlan,
      evidence: evidenceList,
      sources: bt.sources?.map((s: string) => ({
        source: extractPlatform(s),
      })) || [],
      rawData: bt,
    });
  });

  // ============================================================================
  // UVP-BASED INSIGHTS (Always include)
  // ============================================================================
  if (uvp) {
    if (uvp.targetCustomer) {
      insights.push({
        id: 'uvp-target',
        type: 'conversations' as InsightType,
        title: `Target: ${uvp.targetCustomer.industry || 'Ideal Customer'}`,
        category: 'Customer Profile',
        confidence: 0.95,
        isTimeSensitive: false,
        description: uvp.targetCustomer.statement || 'Your ideal customer from UVP',
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    // Transformation insight removed - focusing on Emotional/Functional Drivers instead

    if (uvp.keyBenefit) {
      const benefitMetrics = uvp.keyBenefit.metrics?.map(m => `${m.metric}: ${m.value}`).join(', ');
      insights.push({
        id: 'uvp-benefit',
        type: 'gaps' as InsightType,
        title: 'Key Differentiator',
        category: 'Value Proposition',
        confidence: 0.92,
        isTimeSensitive: false,
        description: `${uvp.keyBenefit.statement || 'Your unique value'}${benefitMetrics ? `. Proof: ${benefitMetrics}` : ''}`,
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    if (uvp.uniqueSolution) {
      insights.push({
        id: 'uvp-solution',
        type: 'gaps' as InsightType,
        title: 'Unique Approach',
        category: 'Competitive Edge',
        confidence: 0.88,
        isTimeSensitive: false,
        description: uvp.uniqueSolution.statement || 'Your unique solution approach',
        sources: [{ source: 'UVP Analysis' }],
      });
    }

    if (uvp.valuePropositionStatement) {
      insights.push({
        id: 'uvp-statement',
        type: 'gaps' as InsightType,
        title: 'Value Proposition',
        category: 'Core Message',
        confidence: 0.95,
        isTimeSensitive: false,
        description: uvp.valuePropositionStatement,
        sources: [{ source: 'UVP Synthesis' }],
      });
    }
  }

  // ============================================================================
  // SEASONAL INSIGHTS
  // ============================================================================
  const now = new Date();
  const month = now.getMonth();

  if (month >= 9 && month <= 11) {
    insights.push({
      id: 'seasonal-q4',
      type: 'trends' as InsightType,
      title: 'Q4 Budget Season',
      category: 'Seasonal Opportunity',
      confidence: 0.9,
      isTimeSensitive: true,
      description: 'End-of-year budget decisions. Great time for ROI-focused content.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
    insights.push({
      id: 'seasonal-holiday',
      type: 'trends' as InsightType,
      title: 'Holiday Marketing Window',
      category: 'Seasonal Trend',
      confidence: 0.88,
      isTimeSensitive: true,
      description: 'Peak engagement period. Emotional, gratitude-focused content performs well.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
  }

  if (month >= 0 && month <= 2) {
    insights.push({
      id: 'seasonal-newyear',
      type: 'trends' as InsightType,
      title: 'New Year Fresh Start',
      category: 'Seasonal Opportunity',
      confidence: 0.9,
      isTimeSensitive: true,
      description: 'Fresh start mentality. Resolution and transformation content resonates.',
      sources: [{ source: 'Seasonal Calendar' }],
    });
  }

  console.log(`[V4PowerMode] Extracted ${insights.length} insights from DeepContext`);
  return insights;
}

// ============================================================================
// INSIGHT CARD COMPONENT (EXPANDABLE WITH PROVENANCE)
// ============================================================================

interface InsightCardComponentProps {
  insight: InsightCard;
  isSelected: boolean;
  onToggle: () => void;
}

// Extract raw quotes from rawData
function extractRawQuotes(rawData: any): { text: string; author?: string; source?: string }[] {
  if (!rawData) return [];

  const quotes: { text: string; author?: string; source?: string }[] = [];

  // Reddit posts
  if (rawData.selftext || rawData.title) {
    quotes.push({
      text: rawData.selftext || rawData.title,
      author: rawData.author ? `u/${rawData.author}` : undefined,
      source: rawData.subreddit ? `r/${rawData.subreddit}` : 'Reddit'
    });
  }

  // Reddit comments
  if (rawData.body) {
    quotes.push({
      text: rawData.body,
      author: rawData.author ? `u/${rawData.author}` : undefined,
      source: rawData.subreddit ? `r/${rawData.subreddit}` : 'Reddit'
    });
  }

  // Google/G2/TrustPilot reviews
  if (rawData.text || rawData.review || rawData.reviewText) {
    quotes.push({
      text: rawData.text || rawData.review || rawData.reviewText,
      author: rawData.reviewer || rawData.author || rawData.name,
      source: rawData.platform || 'Review'
    });
  }

  // Twitter/X posts
  if (rawData.tweet || rawData.full_text) {
    quotes.push({
      text: rawData.tweet || rawData.full_text,
      author: rawData.username ? `@${rawData.username}` : undefined,
      source: 'Twitter/X'
    });
  }

  // LinkedIn posts
  if (rawData.content && typeof rawData.content === 'string') {
    quotes.push({
      text: rawData.content,
      author: rawData.author,
      source: 'LinkedIn'
    });
  }

  // Generic content field
  if (rawData.content && !quotes.length) {
    const content = typeof rawData.content === 'string' ? rawData.content : JSON.stringify(rawData.content);
    if (content.length > 10) {
      quotes.push({ text: content, source: rawData.source || 'Data' });
    }
  }

  return quotes.filter(q => q.text && q.text.length > 10);
}

// Determine UVP alignment from insight
function determineUVPAlignment(insight: InsightCard): { component: string; label: string } | null {
  const desc = (insight.description + ' ' + insight.title).toLowerCase();
  const category = insight.category.toLowerCase();

  if (desc.includes('pain') || desc.includes('frustrat') || desc.includes('struggle') || category.includes('pain')) {
    return { component: 'target_customer', label: 'Target Customer Pain' };
  }
  if (desc.includes('benefit') || desc.includes('value') || desc.includes('result') || category.includes('benefit')) {
    return { component: 'key_benefit', label: 'Key Benefit' };
  }
  if (desc.includes('transform') || desc.includes('change') || desc.includes('journey')) {
    return { component: 'transformation', label: 'Transformation Story' };
  }
  if (desc.includes('unique') || desc.includes('different') || desc.includes('gap') || category.includes('gap')) {
    return { component: 'unique_solution', label: 'Unique Differentiator' };
  }

  return null;
}

// Determine content pillars from insight
function determineContentPillars(insight: InsightCard): string[] {
  const pillars: string[] = [];
  const desc = (insight.description + ' ' + insight.title + ' ' + insight.category).toLowerCase();

  if (desc.includes('authority') || desc.includes('expert') || desc.includes('leader') || desc.includes('trend')) {
    pillars.push('Authority');
  }
  if (desc.includes('trust') || desc.includes('proof') || desc.includes('review') || desc.includes('testimonial')) {
    pillars.push('Trust');
  }
  if (desc.includes('problem') || desc.includes('pain') || desc.includes('challenge') || desc.includes('frustrat')) {
    pillars.push('Problem-Solution');
  }
  if (desc.includes('story') || desc.includes('journey') || desc.includes('transform')) {
    pillars.push('Story');
  }
  if (desc.includes('education') || desc.includes('how to') || desc.includes('guide') || desc.includes('tip')) {
    pillars.push('Education');
  }
  if (desc.includes('community') || desc.includes('local') || desc.includes('event')) {
    pillars.push('Community');
  }

  return pillars.length > 0 ? pillars : ['General'];
}

// Synthesize better titles for gap insights - extracts the key actionable insight
function synthesizeGapTitle(insight: InsightCard): string {
  const { title, description, category, rawData } = insight;
  const lowerDesc = description.toLowerCase();
  const lowerCat = category.toLowerCase();

  // For unarticulated needs - extract what customers secretly want
  if (lowerCat.includes('unarticulated') || lowerCat.includes('need')) {
    // Try to find the core desire/need
    const patterns = [
      /want[s]?\s+(to\s+)?(.{10,50}?)(?:\.|,|but|because)/i,
      /need[s]?\s+(to\s+)?(.{10,50}?)(?:\.|,|but|because)/i,
      /desire[s]?\s+(to\s+)?(.{10,50}?)(?:\.|,|but|because)/i,
      /looking\s+for\s+(.{10,50}?)(?:\.|,|but|because)/i,
    ];
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const extracted = match[2] || match[1];
        return `Customers secretly want: ${extracted.trim()}`;
      }
    }
    // Fallback: use first meaningful phrase
    if (description.length > 15) {
      const firstPhrase = description.split(/[.!?]|\band\b|\bbut\b/)[0].trim();
      if (firstPhrase.length > 10 && firstPhrase.length < 80) {
        return `Hidden need: ${firstPhrase}`;
      }
    }
  }

  // For competitor blindspots - highlight the competitive opportunity
  if (lowerCat.includes('blindspot') || lowerCat.includes('competitor')) {
    const patterns = [
      /competitor[s]?\s+(don't|aren't|fail|miss|ignore|overlook)(.{10,50}?)(?:\.|,|but|because)/i,
      /gap\s+in\s+(.{10,50}?)(?:\.|,|but|because)/i,
      /missing\s+(.{10,50}?)(?:\.|,|but|because)/i,
      /overlooked?\s+(.{10,50}?)(?:\.|,|but|because)/i,
    ];
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const extracted = match[2] || match[1];
        return `Competitors miss: ${extracted.trim()}`;
      }
    }
    // Fallback for blindspots
    if (rawData?.topic) {
      return `Blindspot: ${rawData.topic.substring(0, 60)}`;
    }
    if (description.length > 15) {
      return `Untapped opportunity: ${description.substring(0, 60)}...`;
    }
  }

  // For market gaps - highlight the opportunity space
  if (lowerCat.includes('market') || lowerCat.includes('gap') || lowerCat.includes('opportunity')) {
    const patterns = [
      /opportunity\s+(to|for|in)\s+(.{10,50}?)(?:\.|,|but|because)/i,
      /gap\s+(in|for|around)\s+(.{10,50}?)(?:\.|,|but|because)/i,
      /underserved\s+(.{10,50}?)(?:\.|,|but|because)/i,
      /unmet\s+(need|demand)\s+(for\s+)?(.{10,50}?)(?:\.|,|but|because)/i,
    ];
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const extracted = match[3] || match[2] || match[1];
        return `Opportunity: ${extracted.trim()}`;
      }
    }
    // Fallback for market gaps
    if (rawData?.gap) {
      return `Market gap: ${rawData.gap.substring(0, 60)}`;
    }
  }

  // Default: clean up the existing title
  if (title && title.length > 5 && title !== 'Customer Need' && title !== 'Market Gap' && title !== 'Competitor Blindspot') {
    return title;
  }

  // Last resort: truncate description
  return description.substring(0, 70) + (description.length > 70 ? '...' : '');
}

// Extract provenance info for gaps - returns structured source data
function extractGapProvenance(insight: InsightCard): {
  summary: string;
  sourcePlatform: string;
  sourceIcon: string;
  quotes: Array<{ text: string; author?: string; platform?: string }>;
} {
  const { description, category, sources, rawData, evidence } = insight;

  // Determine the primary source platform
  let sourcePlatform = 'AI Analysis';
  let sourceIcon = '🤖';

  if (sources && sources.length > 0) {
    const firstSource = sources[0].source?.toLowerCase() || '';
    if (firstSource.includes('reddit')) {
      sourcePlatform = 'Reddit';
      sourceIcon = '🔴';
    } else if (firstSource.includes('linkedin')) {
      sourcePlatform = 'LinkedIn';
      sourceIcon = '💼';
    } else if (firstSource.includes('twitter') || firstSource.includes('x')) {
      sourcePlatform = 'Twitter/X';
      sourceIcon = '🐦';
    } else if (firstSource.includes('review') || firstSource.includes('g2') || firstSource.includes('trustpilot')) {
      sourcePlatform = 'Customer Reviews';
      sourceIcon = '⭐';
    } else if (firstSource.includes('perplexity') || firstSource.includes('web')) {
      sourcePlatform = 'Web Research';
      sourceIcon = '🌐';
    } else if (firstSource.includes('competitor') || firstSource.includes('competitive')) {
      sourcePlatform = 'Competitive Intelligence';
      sourceIcon = '🎯';
    } else if (firstSource.includes('customer')) {
      sourcePlatform = 'Customer Research';
      sourceIcon = '👥';
    }
  }

  // Build concise summary based on category
  let summary = description;
  const lowerCat = category.toLowerCase();

  if (lowerCat.includes('unarticulated')) {
    summary = `This gap reveals an unspoken customer need that isn't being addressed by current market offerings. ${rawData?.emotionalDriver ? `Emotional driver: ${rawData.emotionalDriver}` : ''}`;
  } else if (lowerCat.includes('blindspot')) {
    summary = `Competitors are overlooking this area, creating a strategic opportunity for differentiation. ${rawData?.reasoning ? rawData.reasoning : ''}`;
  } else if (lowerCat.includes('market') || lowerCat.includes('gap')) {
    summary = `Market analysis identified this as an underserved space with high potential. ${rawData?.positioning ? `Position: ${rawData.positioning}` : ''}`;
  }

  // Extract quotes from evidence, sources, and rawData
  const quotes: Array<{ text: string; author?: string; platform?: string }> = [];

  // From evidence array
  if (evidence && evidence.length > 0) {
    evidence.forEach(ev => {
      if (typeof ev === 'string' && ev.length > 20) {
        quotes.push({ text: ev, platform: sourcePlatform });
      }
    });
  }

  // From sources with quotes
  if (sources) {
    sources.forEach(s => {
      if (s.quote && s.quote.length > 20) {
        quotes.push({
          text: s.quote,
          platform: getDisplaySourceName(s.source) || sourcePlatform
        });
      }
    });
  }

  // From rawData
  if (rawData) {
    if (rawData.evidence && typeof rawData.evidence === 'string' && rawData.evidence.length > 20) {
      quotes.push({ text: rawData.evidence, platform: sourcePlatform });
    }
    if (rawData.post || rawData.comment) {
      quotes.push({
        text: rawData.post || rawData.comment,
        author: rawData.author || rawData.username,
        platform: rawData.subreddit ? `r/${rawData.subreddit}` : sourcePlatform
      });
    }
  }

  return {
    summary: summary.substring(0, 300),
    sourcePlatform,
    sourceIcon,
    quotes: quotes.slice(0, 5) // Limit to 5 quotes
  };
}

const InsightCardComponent = memo(function InsightCardComponent({ insight, isSelected, onToggle }: InsightCardComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'sources' | 'uvp' | 'pillars' | 'provenance' | null>(null);
  const config = typeConfig[insight.type];
  const isGapInsight = insight.type === 'gaps';

  const rawQuotes = useMemo(() => extractRawQuotes(insight.rawData), [insight.rawData]);
  const uvpAlignment = useMemo(() => determineUVPAlignment(insight), [insight]);
  const contentPillars = useMemo(() => determineContentPillars(insight), [insight]);

  // For gap insights: synthesized title and provenance
  const gapTitle = useMemo(() => isGapInsight ? synthesizeGapTitle(insight) : insight.title, [insight, isGapInsight]);
  const gapProvenance = useMemo(() => isGapInsight ? extractGapProvenance(insight) : null, [insight, isGapInsight]);

  // Get unique sources
  const displaySources = useMemo(() => {
    const sources = insight.sources?.map(s => getDisplaySourceName(s.source)) || [];
    if (insight.rawData?.source) {
      sources.push(getDisplaySourceName(insight.rawData.source));
    }
    return [...new Set(sources)].filter(s => s && s !== 'undefined');
  }, [insight.sources, insight.rawData]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (isExpanded) setExpandedSection(null);
  };

  const toggleSection = (section: 'sources' | 'uvp' | 'pillars' | 'provenance', e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div
      className={`
        w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 hover:shadow-md'}
      `}
    >
      {/* Main Card Content - Clickable for selection */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
              {insight.isTimeSensitive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                  ⏰ Time-Sensitive
                </span>
              )}
              {displaySources.slice(0, 2).map((source, i) => (
                <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {source}
                </span>
              ))}
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {isGapInsight ? gapTitle : insight.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {insight.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {insight.category}
              </span>
              <span className="text-xs font-bold text-purple-600">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {isSelected && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Expand Button */}
      <div className="px-4 pb-2">
        <button
          onClick={handleExpandClick}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'Show Provenance'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Provenance Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-200 dark:border-slate-700"
          >
            <div className="p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">

              {/* Gap Provenance Section - Only for gap insights */}
              {isGapInsight && gapProvenance && (
                <div className="rounded-lg border border-orange-200 dark:border-orange-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('provenance', e)}
                    className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{gapProvenance.sourceIcon}</span>
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Gap Provenance
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200">
                        {gapProvenance.sourcePlatform}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-orange-400 transition-transform ${expandedSection === 'provenance' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'provenance' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-3 bg-white dark:bg-slate-800">
                          {/* Gap Summary */}
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800">
                            <h5 className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1 uppercase tracking-wide">
                              Gap Summary
                            </h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {gapProvenance.summary}
                            </p>
                          </div>

                          {/* Source Platform */}
                          <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <span className="text-lg">{gapProvenance.sourceIcon}</span>
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">Primary Source</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{gapProvenance.sourcePlatform}</span>
                            </div>
                          </div>

                          {/* Evidence Quotes */}
                          {gapProvenance.quotes.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Supporting Evidence ({gapProvenance.quotes.length})
                              </h5>
                              {gapProvenance.quotes.map((quote, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border-l-4 border-orange-400">
                                  <div className="flex items-start gap-2">
                                    <Quote className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                        "{quote.text.substring(0, 400)}{quote.text.length > 400 ? '...' : ''}"
                                      </p>
                                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        {quote.author && <span className="font-medium">{quote.author}</span>}
                                        {quote.platform && <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">{quote.platform}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* No quotes fallback */}
                          {gapProvenance.quotes.length === 0 && (
                            <div className="text-center py-3 text-xs text-gray-500 dark:text-gray-400 italic">
                              No direct quotes available. This gap was identified through pattern analysis.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Sources Section */}
              {(displaySources.length > 0 || rawQuotes.length > 0) && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('sources', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Sources ({displaySources.length})
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'sources' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'sources' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 space-y-2">
                          {/* Source badges */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {displaySources.map((source, i) => (
                              <span key={i} className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {source}
                              </span>
                            ))}
                          </div>

                          {/* Raw quotes */}
                          {rawQuotes.length > 0 && (
                            <div className="space-y-2">
                              {rawQuotes.slice(0, 3).map((quote, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400">
                                  <div className="flex items-start gap-2">
                                    <Quote className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-4">
                                        "{quote.text.substring(0, 300)}{quote.text.length > 300 ? '...' : ''}"
                                      </p>
                                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        {quote.author && <span className="font-medium">{quote.author}</span>}
                                        {quote.source && <span>• {quote.source}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Fallback if no quotes but has sources */}
                          {rawQuotes.length === 0 && insight.sources?.some(s => s.quote) && (
                            <div className="space-y-2">
                              {insight.sources.filter(s => s.quote).slice(0, 3).map((source, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-blue-400">
                                  <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                    "{source.quote}"
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">— {getDisplaySourceName(source.source)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* UVP Alignment Section */}
              {uvpAlignment && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={(e) => toggleSection('uvp', e)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        UVP Alignment
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'uvp' ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSection === 'uvp' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0">
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                              {uvpAlignment.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            This insight aligns with your UVP's {uvpAlignment.component.replace('_', ' ')} component.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Content Pillars Section */}
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={(e) => toggleSection('pillars', e)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Content Pillars ({contentPillars.length})
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'pillars' ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedSection === 'pillars' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0">
                        <div className="flex flex-wrap gap-2">
                          {contentPillars.map((pillar, i) => (
                            <span key={i} className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {pillar}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Best suited for {contentPillars.join(', ')} content strategies.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Evidence/Correlated Sources */}
              {insight.evidence && insight.evidence.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Correlated Evidence
                    </span>
                  </div>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    {insight.evidence.slice(0, 3).map((ev, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-500">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// SIDEBAR SECTION COMPONENT - Collapsible section for sidebar
// ============================================================================

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}

const SidebarSection = memo(function SidebarSection({
  title,
  icon,
  defaultExpanded = false,
  badgeCount,
  children
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 dark:border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-500">{icon}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{title}</span>
          {badgeCount !== undefined && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {badgeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'visible' }}
          >
            <div className="p-2 pt-0 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// EXPANDABLE CUSTOMER PROFILE CARD - Shows UVP customer profile details
// ============================================================================

// Role type categories for grouping profiles
type RoleCategory = 'C-Suite' | 'Operations' | 'Technology' | 'Sales & Marketing' | 'Other';

interface ParsedCustomerProfile {
  title: string;
  description: string;
  roleCategory: RoleCategory;
}

// Classify a role title into a category
function classifyRole(title: string): RoleCategory {
  const lowerTitle = title.toLowerCase();

  // C-Suite roles
  if (/\b(ceo|cfo|cto|cmo|coo|cio|cpo|chief|president|founder|owner|principal|partner)\b/i.test(lowerTitle)) {
    return 'C-Suite';
  }

  // Operations roles
  if (/\b(operations|ops|process|supply chain|logistics|procurement|quality|compliance|risk)\b/i.test(lowerTitle)) {
    return 'Operations';
  }

  // Technology roles
  if (/\b(technology|tech|it|digital|data|software|engineer|developer|architect|transformation)\b/i.test(lowerTitle)) {
    return 'Technology';
  }

  // Sales & Marketing roles
  if (/\b(sales|marketing|growth|revenue|business development|account|customer success)\b/i.test(lowerTitle)) {
    return 'Sales & Marketing';
  }

  return 'Other';
}

// Parse UVP statement to extract individual customer profiles with role categories
function parseCustomerProfiles(statement: string): ParsedCustomerProfile[] {
  if (!statement) return [];

  // Split by semicolons to get individual profiles
  const profiles = statement.split(';').map(s => s.trim()).filter(Boolean);

  return profiles.map(profile => {
    // Extract title - look for role/title pattern at the start
    // Common patterns: "Insurance Operations Director seeking...", "Digital Transformation Leader in..."
    const titleMatch = profile.match(/^([A-Z][^,;.]*?(?:Director|Manager|Leader|Owner|Principal|Officer|COO|CEO|CFO|CTO|CMO|VP|Head|Executive|Specialist|Analyst|Consultant|Agent|Broker)[^,;.]*?)(?:\s+(?:seeking|looking|responsible|needing|frustrated|in\s|who|that))/i);

    if (titleMatch) {
      const title = titleMatch[1].trim();
      return {
        title,
        description: profile,
        roleCategory: classifyRole(title)
      };
    }

    // Fallback: use first few words as title
    const words = profile.split(' ').slice(0, 4).join(' ');
    const title = words.length > 30 ? words.slice(0, 30) + '...' : words;
    return {
      title,
      description: profile,
      roleCategory: classifyRole(title)
    };
  });
}

// Group profiles by role category
function groupProfilesByRole(profiles: ParsedCustomerProfile[]): Map<RoleCategory, ParsedCustomerProfile[]> {
  const grouped = new Map<RoleCategory, ParsedCustomerProfile[]>();
  const order: RoleCategory[] = ['C-Suite', 'Operations', 'Technology', 'Sales & Marketing', 'Other'];

  // Initialize all categories
  order.forEach(cat => grouped.set(cat, []));

  // Group profiles
  profiles.forEach(profile => {
    const category = grouped.get(profile.roleCategory) || [];
    category.push(profile);
    grouped.set(profile.roleCategory, category);
  });

  // Remove empty categories
  order.forEach(cat => {
    if (grouped.get(cat)?.length === 0) {
      grouped.delete(cat);
    }
  });

  return grouped;
}

// Role category styling
const roleCategoryStyles: Record<RoleCategory, { icon: string; color: string; bg: string; border: string }> = {
  'C-Suite': {
    icon: 'crown',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700/50'
  },
  'Operations': {
    icon: 'cog',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700/50'
  },
  'Technology': {
    icon: 'cpu',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-700/50'
  },
  'Sales & Marketing': {
    icon: 'megaphone',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700/50'
  },
  'Other': {
    icon: 'users',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-600'
  }
};

// Role Category Group Component - Expandable group header
interface RoleCategoryGroupProps {
  category: RoleCategory;
  profiles: ParsedCustomerProfile[];
  emotionalDrivers: string[];
  functionalDrivers: string[];
  onSelectItem: (item: { type: string; text: string }) => void;
}

const RoleCategoryGroup = memo(function RoleCategoryGroup({
  category,
  profiles,
  emotionalDrivers,
  functionalDrivers,
  onSelectItem
}: RoleCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed
  const style = roleCategoryStyles[category];

  // Get icon component based on category
  const IconComponent = {
    'C-Suite': Crown,
    'Operations': Settings,
    'Technology': Cpu,
    'Sales & Marketing': Megaphone,
    'Other': Users
  }[category] || Users;

  return (
    <div className={`rounded-lg border ${style.border} overflow-hidden`}>
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-2 ${style.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <IconComponent className={`w-3.5 h-3.5 ${style.color}`} />
          <span className={`text-[11px] font-semibold ${style.color} uppercase tracking-wide`}>
            {category}
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded ${style.bg} ${style.color} border ${style.border}`}>
            {profiles.length}
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 ${style.color} transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Profiles in this category */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2 space-y-2 bg-white/50 dark:bg-slate-800/30">
              {profiles.map((profile, index) => (
                <CustomerProfileCard
                  key={`${category}-profile-${index}`}
                  title={profile.title}
                  description={profile.description}
                  emotionalDrivers={emotionalDrivers}
                  functionalDrivers={functionalDrivers}
                  onSelectItem={onSelectItem}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface CustomerProfileCardProps {
  title: string;
  description: string;
  emotionalDrivers?: string[];
  functionalDrivers?: string[];
  onSelectItem: (item: { type: string; text: string }) => void;
}

const CustomerProfileCard = memo(function CustomerProfileCard({
  title,
  description,
  emotionalDrivers,
  functionalDrivers,
  onSelectItem
}: CustomerProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmotional, setShowEmotional] = useState(false);
  const [showFunctional, setShowFunctional] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
      {/* Card Header - Title only */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-left truncate">
            {title}
          </span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 space-y-2 bg-white dark:bg-slate-800/50">
              {/* Description - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'conversations' as InsightType, text: description })}
                className="w-full text-left p-2 text-[11px] rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {description}
              </button>

              {/* Emotional Drivers - Expandable Box (Orange/Amber like UVP) */}
              {emotionalDrivers && emotionalDrivers.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowEmotional(!showEmotional)}
                    className="w-full flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Emotional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300">
                        {emotionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-amber-500 transition-transform ${showEmotional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showEmotional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-amber-25 dark:bg-amber-900/10">
                          {emotionalDrivers.map((driver, i) => (
                            <button
                              key={`emotional-${i}`}
                              onClick={() => onSelectItem({ type: 'emotional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-amber-100/50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 transition-colors flex items-start gap-1.5"
                            >
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Functional Drivers - Expandable Box (Blue like UVP) */}
              {functionalDrivers && functionalDrivers.length > 0 && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowFunctional(!showFunctional)}
                    className="w-full flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Functional Drivers
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300">
                        {functionalDrivers.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-blue-500 transition-transform ${showFunctional ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showFunctional && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1 bg-blue-25 dark:bg-blue-900/10">
                          {functionalDrivers.map((driver, i) => (
                            <button
                              key={`functional-${i}`}
                              onClick={() => onSelectItem({ type: 'functional', text: driver })}
                              className="w-full text-left p-1.5 text-[10px] rounded bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-200 transition-colors flex items-start gap-1.5"
                            >
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{driver}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// DIFFERENTIATOR CARD COMPONENT - Expandable card showing full UVP data
// ============================================================================

interface DifferentiatorCardProps {
  statement: string;
  evidence?: string;
  strengthScore?: number;
  source?: string;
  type: 'uvp' | 'website';
  onSelectItem: (item: { type: string; text: string }) => void;
}

const DifferentiatorCard = memo(function DifferentiatorCard({
  statement,
  evidence,
  strengthScore,
  source,
  type,
  onSelectItem
}: DifferentiatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = evidence || strengthScore !== undefined || source;

  // Color scheme based on type (green for UVP, teal for website)
  const isUvp = type === 'uvp';
  const colors = isUvp ? {
    border: 'border-emerald-200 dark:border-emerald-700/50',
    bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
    hoverBg: 'hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30',
    icon: 'text-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
    badge: 'bg-emerald-200 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300'
  } : {
    border: 'border-teal-200 dark:border-teal-700/50',
    bg: 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
    hoverBg: 'hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30',
    icon: 'text-teal-500',
    text: 'text-teal-800 dark:text-teal-200',
    badge: 'bg-teal-200 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300'
  };

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Card Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'differentiator', text: statement })}
        className={`w-full flex items-center justify-between p-2.5 ${colors.bg} ${colors.hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Shield className={`w-3.5 h-3.5 ${colors.icon} flex-shrink-0`} />
          <span className={`text-xs font-medium ${colors.text} text-left line-clamp-2`}>
            {statement}
          </span>
        </div>
        {hasDetails && (
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 space-y-2 bg-white dark:bg-slate-800/50">
              {/* Statement - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'differentiator', text: statement })}
                className="w-full text-left p-2 text-[11px] rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                <span className="text-gray-500 dark:text-gray-400 mr-1">💡</span>
                {statement}
              </button>

              {/* Evidence Section */}
              {evidence && (
                <div className="rounded-lg border border-purple-200 dark:border-purple-700/50 overflow-hidden">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Quote className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                        Evidence
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectItem({ type: 'evidence', text: evidence })}
                      className="w-full text-left p-1.5 text-[10px] rounded bg-purple-100/50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-200 transition-colors italic"
                    >
                      "{evidence}"
                    </button>
                  </div>
                </div>
              )}

              {/* Strength Score & Source Row */}
              {(strengthScore !== undefined || source) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {strengthScore !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Strength: {strengthScore}/100
                      </span>
                    </div>
                  )}
                  {source && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
                      <Globe className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
                        {source}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// KEY BENEFIT CARD COMPONENT - Expandable card showing full benefit data
// ============================================================================

interface BenefitCardProps {
  statement: string;
  outcomeStatement?: string;
  outcomeType?: 'quantifiable' | 'qualitative' | 'mixed';
  eqFraming?: 'emotional' | 'rational' | 'balanced';
  metrics?: Array<{ metric: string; value: string; improvement?: string }>;
  source?: string;
  type: 'uvp' | 'website';
  onSelectItem: (item: { type: string; text: string }) => void;
}

const BenefitCard = memo(function BenefitCard({
  statement,
  outcomeStatement,
  outcomeType,
  eqFraming,
  metrics,
  source,
  type,
  onSelectItem
}: BenefitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = outcomeStatement || outcomeType || eqFraming || (metrics && metrics.length > 0) || source;

  // Color scheme based on type (rose/pink for UVP, coral for website)
  const isUvp = type === 'uvp';
  const colors = isUvp ? {
    border: 'border-rose-200 dark:border-rose-700/50',
    bg: 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
    hoverBg: 'hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/30 dark:hover:to-pink-900/30',
    icon: 'text-rose-500',
    text: 'text-rose-800 dark:text-rose-200',
    badge: 'bg-rose-200 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300'
  } : {
    border: 'border-orange-200 dark:border-orange-700/50',
    bg: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    hoverBg: 'hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30',
    icon: 'text-orange-500',
    text: 'text-orange-800 dark:text-orange-200',
    badge: 'bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300'
  };

  // EQ framing badge colors
  const eqColors = {
    emotional: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700/50',
    rational: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
    balanced: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50'
  };

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Card Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'benefit', text: statement })}
        className={`w-full flex items-center justify-between p-2.5 ${colors.bg} ${colors.hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Heart className={`w-3.5 h-3.5 ${colors.icon} flex-shrink-0`} />
          <span className={`text-xs font-medium ${colors.text} text-left line-clamp-2`}>
            {statement}
          </span>
        </div>
        {hasDetails && (
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 space-y-2 bg-white dark:bg-slate-800/50">
              {/* Statement - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'benefit', text: statement })}
                className="w-full text-left p-2 text-[11px] rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                <span className="text-rose-500 mr-1">💎</span>
                {statement}
              </button>

              {/* Outcome Statement */}
              {outcomeStatement && (
                <div className="rounded-lg border border-green-200 dark:border-green-700/50 overflow-hidden">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Rocket className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                        Outcome
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectItem({ type: 'outcome', text: outcomeStatement })}
                      className="w-full text-left p-1.5 text-[10px] rounded bg-green-100/50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-800 dark:text-green-200 transition-colors"
                    >
                      {outcomeStatement}
                    </button>
                  </div>
                </div>
              )}

              {/* Metrics Section */}
              {metrics && metrics.length > 0 && (
                <div className="rounded-lg border border-indigo-200 dark:border-indigo-700/50 overflow-hidden">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                        Metrics
                      </span>
                    </div>
                    <div className="space-y-1">
                      {metrics.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => onSelectItem({ type: 'metric', text: `${m.metric}: ${m.value}${m.improvement ? ` (${m.improvement})` : ''}` })}
                          className="w-full text-left p-1.5 text-[10px] rounded bg-indigo-100/50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 transition-colors flex items-center gap-1.5"
                        >
                          <span className="text-indigo-500">📊</span>
                          <span className="font-medium">{m.metric}:</span>
                          <span>{m.value}</span>
                          {m.improvement && <span className="text-green-600 dark:text-green-400">({m.improvement})</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Outcome Type, EQ Framing & Source Row */}
              {(outcomeType || eqFraming || source) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {outcomeType && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700/50">
                      <Scale className="w-3 h-3 text-cyan-500" />
                      <span className="text-[10px] font-medium text-cyan-700 dark:text-cyan-300 capitalize">
                        {outcomeType}
                      </span>
                    </div>
                  )}
                  {eqFraming && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${eqColors[eqFraming]}`}>
                      <Brain className="w-3 h-3" />
                      <span className="text-[10px] font-medium capitalize">
                        {eqFraming}
                      </span>
                    </div>
                  )}
                  {source && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <Globe className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {source}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// VALUE PROPOSITION CARD - Expandable card with variations and statements
// ============================================================================

interface ValuePropositionCardProps {
  statement: string;
  variations?: Array<{ uvp: string; style: string; wordCount: number }>;
  whyStatement?: string;
  whatStatement?: string;
  howStatement?: string;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const ValuePropositionCard = memo(function ValuePropositionCard({
  statement,
  variations,
  whyStatement,
  whatStatement,
  howStatement,
  onSelectItem
}: ValuePropositionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const hasDetails = (variations && variations.length > 0) || whyStatement || whatStatement || howStatement;

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-700/50 overflow-hidden">
      {/* Main Statement Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'uvp', text: statement })}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Target className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span className="text-xs font-medium text-purple-800 dark:text-purple-200 text-left">
            {statement}
          </span>
        </div>
        {hasDetails && (
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-3 space-y-2.5 bg-white dark:bg-slate-800/50">
              {/* Main Statement - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'uvp', text: statement })}
                className="w-full text-left p-2.5 text-xs rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 transition-colors"
              >
                <span className="text-purple-500 mr-1">✨</span>
                {statement}
              </button>

              {/* Why/What/How Statements */}
              {(whyStatement || whatStatement || howStatement) && (
                <div className="space-y-1.5">
                  {whyStatement && (
                    <button
                      onClick={() => onSelectItem({ type: 'why', text: whyStatement })}
                      className="w-full text-left p-2 text-[11px] rounded bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 transition-colors"
                    >
                      <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1">WHY:</span>
                      {whyStatement}
                    </button>
                  )}
                  {whatStatement && (
                    <button
                      onClick={() => onSelectItem({ type: 'what', text: whatStatement })}
                      className="w-full text-left p-2 text-[11px] rounded bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 transition-colors"
                    >
                      <span className="font-semibold text-blue-600 dark:text-blue-400 mr-1">WHAT:</span>
                      {whatStatement}
                    </button>
                  )}
                  {howStatement && (
                    <button
                      onClick={() => onSelectItem({ type: 'how', text: howStatement })}
                      className="w-full text-left p-2 text-[11px] rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200 transition-colors"
                    >
                      <span className="font-semibold text-green-600 dark:text-green-400 mr-1">HOW:</span>
                      {howStatement}
                    </button>
                  )}
                </div>
              )}

              {/* UVP Variations - Expandable */}
              {variations && variations.length > 0 && (
                <div className="rounded-lg border border-violet-200 dark:border-violet-700/50 overflow-hidden">
                  <button
                    onClick={() => setShowVariations(!showVariations)}
                    className="w-full flex items-center justify-between p-2 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                      <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                        UVP Variations
                      </span>
                      <span className="px-1 py-0.5 text-[9px] rounded bg-violet-200 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300">
                        {variations.length}
                      </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-violet-500 transition-transform ${showVariations ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showVariations && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="p-2 space-y-1.5 bg-violet-25 dark:bg-violet-900/10">
                          {variations.map((v, i) => (
                            <button
                              key={i}
                              onClick={() => onSelectItem({ type: 'uvp-variation', text: v.uvp })}
                              className="w-full text-left p-2 text-[10px] rounded bg-violet-100/50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-800 dark:text-violet-200 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-1.5 py-0.5 text-[9px] rounded bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 capitalize">
                                  {v.style}
                                </span>
                                <span className="text-[9px] text-violet-500 dark:text-violet-400">
                                  {v.wordCount} words
                                </span>
                              </div>
                              <p className="leading-relaxed">{v.uvp}</p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// PRODUCT CARD COMPONENT - Expandable card for product/service
// ============================================================================

interface ProductCardProps {
  name: string;
  description: string;
  category: string;
  confidence: number;
  source: 'website' | 'manual';
  sourceExcerpt?: string;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const ProductCard = memo(function ProductCard({
  name,
  description,
  category,
  confidence,
  source,
  sourceExcerpt,
  onSelectItem
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = description || sourceExcerpt || confidence > 0;

  return (
    <div className="rounded-lg border border-sky-200 dark:border-sky-700/50 overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => hasDetails ? setIsExpanded(!isExpanded) : onSelectItem({ type: 'product', text: name })}
        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 hover:from-sky-100 hover:to-cyan-100 dark:hover:from-sky-900/30 dark:hover:to-cyan-900/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          <span className="text-xs font-medium text-sky-800 dark:text-sky-200 text-left truncate">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {category && (
            <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-200 dark:bg-sky-800/50 text-sky-700 dark:text-sky-300">
              {category}
            </span>
          )}
          {hasDetails && (
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-2.5 space-y-2 bg-white dark:bg-slate-800/50">
              {/* Name - clickable */}
              <button
                onClick={() => onSelectItem({ type: 'product', text: name })}
                className="w-full text-left p-2 text-[11px] rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
              >
                <span className="text-sky-500 mr-1">📦</span>
                {name}
              </button>

              {/* Description */}
              {description && (
                <button
                  onClick={() => onSelectItem({ type: 'product-description', text: description })}
                  className="w-full text-left p-2 text-[10px] rounded bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 text-sky-800 dark:text-sky-200 transition-colors leading-relaxed"
                >
                  {description}
                </button>
              )}

              {/* Source Excerpt */}
              {sourceExcerpt && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Quote className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Source
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 italic">
                      "{sourceExcerpt}"
                    </p>
                  </div>
                </div>
              )}

              {/* Confidence & Source Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {confidence > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-medium text-green-700 dark:text-green-300">
                      {confidence}% confident
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Globe className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {source}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// UVP BUILDING BLOCKS COMPONENT - Shows UVP data as clickable items
// ============================================================================

interface UVPBuildingBlocksProps {
  uvp: CompleteUVP;
  deepContext?: DeepContext | null;
  onSelectItem: (item: { type: string; text: string }) => void;
}

const UVPBuildingBlocks = memo(function UVPBuildingBlocks({ uvp, deepContext, onSelectItem }: UVPBuildingBlocksProps) {
  // Debug log websiteAnalysis and UVP data
  useEffect(() => {
    const wsAnalysis = deepContext?.business?.websiteAnalysis;
    const dcUvp = deepContext?.business?.uvp as any;
    // Count total products across all categories
    let totalProducts = 0;
    const productNames: string[] = [];
    if (uvp?.productsServices?.categories) {
      uvp.productsServices.categories.forEach((cat: any) => {
        if (cat?.items?.length) {
          totalProducts += cat.items.length;
          cat.items.forEach((p: any) => productNames.push(p.name));
        }
      });
    }

    // Count benefits (handling semicolon-separated)
    const benefitCount = uvp?.keyBenefit?.statement?.includes(';')
      ? uvp.keyBenefit.statement.split(';').filter((s: string) => s.trim()).length
      : (uvp?.keyBenefit?.statement ? 1 : 0);

    // Count customer profiles (handling semicolon-separated)
    const customerCount = uvp?.targetCustomer?.statement?.includes(';')
      ? uvp.targetCustomer.statement.split(';').filter((s: string) => s.trim()).length
      : (uvp?.targetCustomer?.statement ? 1 : 0);

    console.log('[UVPBuildingBlocks] Data received:', {
      // UVP structure - CompleteUVP type
      uvp_productsServices_categories: uvp?.productsServices?.categories?.length || 0,
      uvp_productsServices_totalProducts: totalProducts,
      uvp_productsServices_names: productNames.slice(0, 5).join(', ') || 'none',
      uvp_targetCustomer_count: customerCount,
      uvp_targetCustomer_preview: uvp?.targetCustomer?.statement?.slice(0, 50) || 'none',
      uvp_emotionalDrivers: uvp?.targetCustomer?.emotionalDrivers?.length || 0,
      uvp_functionalDrivers: uvp?.targetCustomer?.functionalDrivers?.length || 0,
      uvp_transformation_emotionalDrivers: uvp?.transformationGoal?.emotionalDrivers?.length || 0,
      uvp_transformation_functionalDrivers: uvp?.transformationGoal?.functionalDrivers?.length || 0,
      uvp_transformationBefore: uvp?.transformationGoal?.before?.slice(0, 30) || 'none',
      uvp_transformationAfter: uvp?.transformationGoal?.after?.slice(0, 30) || 'none',
      uvp_differentiators: uvp?.uniqueSolution?.differentiators?.length || 0,
      uvp_keyBenefits_count: benefitCount,
      uvp_keyBenefit_preview: uvp?.keyBenefit?.statement?.slice(0, 50) || 'none',
      // DeepContext UVP (different structure)
      dc_uvp_emotionalDrivers: dcUvp?.emotionalDrivers?.length || 0,
      dc_uvp_functionalDrivers: dcUvp?.functionalDrivers?.length || 0,
      // Website analysis
      ws_testimonials: wsAnalysis?.testimonials?.length || 0,
      ws_proofPoints: wsAnalysis?.proofPoints?.length || 0,
      ws_metaTags: Object.keys(wsAnalysis?.metaTags || {}).length,
      ws_valuePropositions: wsAnalysis?.valuePropositions?.length || 0,
      ws_differentiators: wsAnalysis?.differentiators?.length || 0,
      ws_targetAudience: wsAnalysis?.targetAudience?.length || 0,
      ws_customerProblems: wsAnalysis?.customerProblems?.length || 0
    });
  }, [deepContext?.business?.websiteAnalysis, deepContext?.business?.uvp, uvp]);

  // Defensive check - uvp might be incomplete during session restore
  if (!uvp) {
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
        Loading UVP data...
      </div>
    );
  }

  // Extract UVP components into clickable items
  const customerItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];
    const wsAnalysis = deepContext?.business?.websiteAnalysis;

    // Target Customer - CustomerProfile object with statement
    // Handle semicolon-separated customer profiles (common in UVP data)
    if (uvp?.targetCustomer?.statement) {
      const customerStatements = uvp.targetCustomer.statement.includes(';')
        ? uvp.targetCustomer.statement.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [uvp.targetCustomer.statement];

      customerStatements.forEach((statement: string, i: number) => {
        items.push({ id: `customer-${i}`, text: statement, type: 'conversations' as InsightType });
      });
    }

    // Emotional Drivers - nested under targetCustomer in CompleteUVP
    if (Array.isArray(uvp?.targetCustomer?.emotionalDrivers)) {
      uvp.targetCustomer.emotionalDrivers.forEach((driver: string, i: number) => {
        if (driver) items.push({ id: `emotional-${i}`, text: driver, type: 'emotional' });
      });
    }

    // Functional Drivers - nested under targetCustomer in CompleteUVP
    if (Array.isArray(uvp?.targetCustomer?.functionalDrivers)) {
      uvp.targetCustomer.functionalDrivers.forEach((driver: string, i: number) => {
        if (driver) items.push({ id: `functional-${i}`, text: driver, type: 'functional' });
      });
    }

    // ALWAYS add websiteAnalysis targetAudience (complement UVP data)
    if (wsAnalysis?.targetAudience?.length) {
      wsAnalysis.targetAudience.forEach((audience: string, i: number) => {
        if (audience) items.push({ id: `ws-audience-${i}`, text: audience, type: 'audience' });
      });
    }

    // ALWAYS add websiteAnalysis customerProblems (these are emotional/functional driver surrogates)
    if (wsAnalysis?.customerProblems?.length) {
      wsAnalysis.customerProblems.forEach((problem: string, i: number) => {
        if (problem) items.push({ id: `ws-problem-${i}`, text: problem, type: 'problem' });
      });
    }

    // Also add valuePropositions as customer benefits (they're customer-facing value statements)
    if (wsAnalysis?.valuePropositions?.length) {
      wsAnalysis.valuePropositions.forEach((vp: string, i: number) => {
        if (vp) items.push({ id: `ws-vp-${i}`, text: vp, type: 'value' });
      });
    }

    return items;
  }, [uvp?.targetCustomer, deepContext?.business?.websiteAnalysis]);

  // Full differentiator data for expandable cards
  const differentiatorData = useMemo(() => {
    const items: {
      id: string;
      statement: string;
      evidence?: string;
      strengthScore?: number;
      source?: string;
      type: 'uvp' | 'website';
    }[] = [];

    // From UVP - full data
    if (uvp?.uniqueSolution?.differentiators && Array.isArray(uvp.uniqueSolution.differentiators)) {
      uvp.uniqueSolution.differentiators
        .filter((d: any) => d?.statement)
        .forEach((d: any, i: number) => {
          items.push({
            id: `diff-${i}`,
            statement: d.statement,
            evidence: d.evidence,
            strengthScore: d.strengthScore,
            source: d.source?.type || d.source?.url || 'UVP Analysis',
            type: 'uvp'
          });
        });
    }

    // ALWAYS add websiteAnalysis differentiators (complement UVP data)
    if (deepContext?.business?.websiteAnalysis?.differentiators?.length) {
      deepContext.business.websiteAnalysis.differentiators.forEach((diff: string, i: number) => {
        if (diff) items.push({
          id: `ws-diff-${i}`,
          statement: diff,
          source: 'Website Analysis',
          type: 'website'
        });
      });
    }

    return items;
  }, [uvp?.uniqueSolution, deepContext?.business?.websiteAnalysis?.differentiators]);

  // Legacy format for backward compatibility
  const differentiatorItems = useMemo(() => {
    return differentiatorData.map(d => ({ id: d.id, text: d.statement, type: 'differentiator' }));
  }, [differentiatorData]);

  // Full benefit data for expandable cards
  const benefitData = useMemo(() => {
    const items: {
      id: string;
      statement: string;
      outcomeStatement?: string;
      outcomeType?: 'quantifiable' | 'qualitative' | 'mixed';
      eqFraming?: 'emotional' | 'rational' | 'balanced';
      metrics?: Array<{ metric: string; value: string; improvement?: string }>;
      source?: string;
      type: 'uvp' | 'website';
    }[] = [];

    // Primary: keyBenefit from UVP with full data
    // Handle semicolon-separated benefits (common in UVP data)
    if (uvp?.keyBenefit?.statement) {
      const benefitStatements = uvp.keyBenefit.statement.includes(';')
        ? uvp.keyBenefit.statement.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [uvp.keyBenefit.statement];

      benefitStatements.forEach((statement: string, i: number) => {
        items.push({
          id: `benefit-${i}`,
          statement: statement,
          outcomeStatement: i === 0 ? uvp.keyBenefit.outcomeStatement : undefined,
          outcomeType: uvp.keyBenefit.outcomeType,
          eqFraming: uvp.keyBenefit.eqFraming,
          metrics: i === 0 ? uvp.keyBenefit.metrics?.map((m: any) => ({
            metric: m.metric,
            value: m.value,
            improvement: m.improvement
          })) : undefined,
          source: 'UVP Analysis',
          type: 'uvp'
        });
      });
    }

    // Support array of benefits (keyBenefits) - additional format
    if (Array.isArray((uvp as any)?.keyBenefits)) {
      (uvp as any).keyBenefits.forEach((benefit: string, i: number) => {
        if (benefit && !items.some(item => item.statement === benefit)) {
          items.push({
            id: `benefit-${i}`,
            statement: benefit,
            source: 'UVP Analysis',
            type: 'uvp'
          });
        }
      });
    }

    // Add websiteAnalysis valuePropositions as additional benefits
    if (deepContext?.business?.websiteAnalysis?.valuePropositions?.length) {
      deepContext.business.websiteAnalysis.valuePropositions.forEach((vp: string, i: number) => {
        if (vp && !items.some(item => item.statement === vp)) {
          items.push({
            id: `ws-vp-${i}`,
            statement: vp,
            source: 'Website Analysis',
            type: 'website'
          });
        }
      });
    }

    return items;
  }, [uvp?.keyBenefit, (uvp as any)?.keyBenefits, deepContext?.business?.websiteAnalysis?.valuePropositions]);

  // Legacy format for backward compatibility
  const benefitItems = useMemo(() => {
    return benefitData.map(b => ({ id: b.id, text: b.statement, type: 'benefit' }));
  }, [benefitData]);

  // Products/Services - Full data from UVP productsServices
  const productsData = useMemo(() => {
    const items: {
      id: string;
      name: string;
      description: string;
      category: string;
      confidence: number;
      source: 'website' | 'manual';
      sourceExcerpt?: string;
    }[] = [];

    // Primary source: UVP productsServices (confirmed by user in onboarding flow)
    if (uvp?.productsServices?.categories?.length) {
      uvp.productsServices.categories.forEach((cat: any) => {
        if (cat?.items?.length) {
          cat.items.forEach((product: any, i: number) => {
            if (product?.name) {
              items.push({
                id: `product-${cat.name || 'default'}-${i}`,
                name: product.name,
                description: product.description || '',
                category: cat.name || product.category || 'General',
                confidence: product.confidence || 0,
                source: product.source || 'website',
                sourceExcerpt: product.sourceExcerpt,
              });
            }
          });
        }
      });
    }

    // Fallback: websiteAnalysis solutions (if no UVP products)
    if (items.length === 0 && deepContext?.business?.websiteAnalysis?.solutions?.length) {
      deepContext.business.websiteAnalysis.solutions.forEach((sol: string, i: number) => {
        if (sol) {
          items.push({
            id: `ws-product-${i}`,
            name: sol,
            description: '',
            category: 'Service',
            confidence: 0,
            source: 'website',
          });
        }
      });
    }

    return items;
  }, [uvp?.productsServices, deepContext?.business?.websiteAnalysis?.solutions]);

  // Legacy productItems for backward compatibility
  const productItems = useMemo(() => {
    return productsData.map(p => ({ id: p.id, text: p.name, type: 'product' }));
  }, [productsData]);

  const transformationItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    if (uvp?.transformationGoal?.before) {
      items.push({ id: 'before', text: `Before: ${uvp.transformationGoal.before}`, type: 'transformation' });
    }
    if (uvp?.transformationGoal?.after) {
      items.push({ id: 'after', text: `After: ${uvp.transformationGoal.after}`, type: 'transformation' });
    }
    if (uvp?.transformationGoal?.statement) {
      items.push({ id: 'goal', text: uvp.transformationGoal.statement, type: 'transformation' });
    }

    // FALLBACK: Use websiteAnalysis customerProblems as "before" state
    if (items.length === 0 && deepContext?.business?.websiteAnalysis?.customerProblems?.length) {
      deepContext.business.websiteAnalysis.customerProblems.slice(0, 3).forEach((problem: string, i: number) => {
        if (problem) items.push({ id: `ws-problem-${i}`, text: `Pain: ${problem}`, type: 'transformation' });
      });
    }

    return items;
  }, [uvp?.transformationGoal, deepContext?.business?.websiteAnalysis?.customerProblems]);

  // Extract keywords from DeepContext business profile, with fallbacks from UVP data and websiteAnalysis
  const keywordItems = useMemo(() => {
    const keywords: string[] = [];
    const wsAnalysis = deepContext?.business?.websiteAnalysis;

    // Primary source: DeepContext business profile
    if (deepContext?.business?.profile?.keywords?.length) {
      keywords.push(...deepContext.business.profile.keywords);
    }

    // Secondary source: websiteAnalysis keywords
    if (wsAnalysis?.keywords?.length) {
      keywords.push(...wsAnalysis.keywords);
    }

    // Fallback: Extract keywords from UVP components when DeepContext unavailable
    if (keywords.length === 0) {
      // Extract key terms from UVP value proposition statement
      if (uvp?.valuePropositionStatement) {
        // Extract significant words (3+ characters, not common words)
        const stopWords = ['the', 'and', 'for', 'with', 'that', 'from', 'your', 'are', 'who', 'our', 'you', 'can', 'will', 'their', 'they', 'this', 'into', 'not'];
        const words = uvp.valuePropositionStatement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 4 && !stopWords.includes(w));
        keywords.push(...words.slice(0, 5));
      }

      // Add industry-related keywords from unique solution statement
      if (uvp?.uniqueSolution?.statement) {
        const solutionWords = uvp.uniqueSolution.statement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 5);
        keywords.push(...solutionWords.slice(0, 3));
      }

      // Add target customer keywords - targetCustomer.statement is a string
      if (uvp?.targetCustomer?.statement) {
        const customerWords = uvp.targetCustomer.statement
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length >= 5);
        keywords.push(...customerWords.slice(0, 3));
      }
    }

    // Deduplicate and limit
    const uniqueKeywords = [...new Set(keywords)].slice(0, 12);

    return uniqueKeywords.map((kw, i) => ({
      id: `keyword-${i}`,
      text: kw,
      type: 'keyword'
    }));
  }, [deepContext?.business?.profile?.keywords, deepContext?.business?.websiteAnalysis?.keywords, uvp?.valuePropositionStatement, uvp?.uniqueSolution?.statement, uvp?.targetCustomer?.statement]);

  // Extract case studies from competitive intelligence and synthesis
  const caseStudyItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Look for case studies in synthesis key insights
    deepContext?.synthesis?.keyInsights?.forEach((insight: any, i) => {
      if (typeof insight === 'string' &&
        (insight.toLowerCase().includes('case study') ||
         insight.toLowerCase().includes('success story') ||
         insight.toLowerCase().includes('testimonial') ||
         insight.toLowerCase().includes('achieved') ||
         insight.toLowerCase().includes('increased by'))) {
        items.push({ id: `case-${i}`, text: insight, type: 'case_study' });
      }
    });

    // Look for social proof in competitive intel
    deepContext?.competitiveIntel?.opportunities?.forEach((opp: any, i) => {
      if (opp.gap && opp.gap.toLowerCase().includes('proof')) {
        items.push({ id: `proof-${i}`, text: opp.gap, type: 'social_proof' });
      }
    });

    return items;
  }, [deepContext?.synthesis, deepContext?.competitiveIntel]);

  // Extract customer testimonials from website analysis
  const testimonialItems = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Check deepContext for website testimonials
    const websiteTestimonials = deepContext?.business?.websiteAnalysis?.testimonials || [];
    websiteTestimonials.forEach((testimonial: string, i: number) => {
      if (testimonial && testimonial.length > 20) {
        items.push({ id: `testimonial-${i}`, text: testimonial, type: 'testimonial' });
      }
    });

    // Include ALL proof points from website analysis (these are credibility signals)
    const proofPoints = deepContext?.business?.websiteAnalysis?.proofPoints || [];
    proofPoints.forEach((proof: string, i: number) => {
      if (proof && proof.length > 10) {
        items.push({ id: `proof-point-${i}`, text: proof, type: 'proof_point' });
      }
    });

    return items;
  }, [deepContext?.business?.websiteAnalysis]);

  // Extract meta tag keywords from website
  const metaKeywords = useMemo(() => {
    const items: { id: string; text: string; type: string }[] = [];

    // Get meta tag keywords from website analysis
    const metaTags = deepContext?.business?.websiteAnalysis?.metaTags || {};
    const keywordsString = metaTags['keywords'] || metaTags['Keywords'] || '';

    if (keywordsString) {
      keywordsString.split(',').forEach((kw: string, i: number) => {
        const trimmed = kw.trim();
        if (trimmed && trimmed.length > 2) {
          items.push({ id: `meta-kw-${i}`, text: trimmed, type: 'meta_keyword' });
        }
      });
    }

    // Extract og:title, og:description for context
    const ogTitle = metaTags['og:title'];
    const ogDescription = metaTags['og:description'];
    const description = metaTags['description'];
    const twitterTitle = metaTags['twitter:title'];
    const twitterDescription = metaTags['twitter:description'];

    if (ogTitle) {
      items.push({ id: 'og-title', text: ogTitle, type: 'meta_og' });
    }
    if (ogDescription) {
      items.push({ id: 'og-desc', text: ogDescription.length > 150 ? ogDescription.substring(0, 150) + '...' : ogDescription, type: 'meta_og' });
    }
    if (description && description !== ogDescription) {
      items.push({ id: 'meta-desc', text: description.length > 150 ? description.substring(0, 150) + '...' : description, type: 'meta_description' });
    }
    if (twitterTitle && twitterTitle !== ogTitle) {
      items.push({ id: 'twitter-title', text: twitterTitle, type: 'meta_twitter' });
    }
    if (twitterDescription && twitterDescription !== ogDescription && twitterDescription !== description) {
      items.push({ id: 'twitter-desc', text: twitterDescription.length > 150 ? twitterDescription.substring(0, 150) + '...' : twitterDescription, type: 'meta_twitter' });
    }

    return items;
  }, [deepContext?.business?.websiteAnalysis?.metaTags]);

  const renderClickableItem = (item: { id: string; text: string; type: string }) => (
    <button
      key={item.id}
      onClick={() => onSelectItem({ type: item.type, text: item.text })}
      className="w-full text-left p-2 text-xs rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-slate-600 transition-colors line-clamp-2 text-gray-800 dark:text-gray-100"
    >
      {item.text}
    </button>
  );

  // Parse customer profiles from UVP statement
  const parsedProfiles = useMemo(() => {
    if (!uvp?.targetCustomer?.statement) return [];
    return parseCustomerProfiles(uvp.targetCustomer.statement);
  }, [uvp?.targetCustomer?.statement]);

  // Group profiles by role category
  const groupedProfiles = useMemo(() => {
    return groupProfilesByRole(parsedProfiles);
  }, [parsedProfiles]);

  // Get drivers from UVP - check multiple sources
  const emotionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.emotionalDrivers ||
      uvp?.targetCustomer?.emotionalDrivers ||
      (deepContext?.business?.uvp as any)?.emotionalDrivers ||
      [];
    return drivers;
  }, [uvp, deepContext]);

  const functionalDrivers = useMemo(() => {
    const drivers =
      uvp?.transformationGoal?.functionalDrivers ||
      uvp?.targetCustomer?.functionalDrivers ||
      (deepContext?.business?.uvp as any)?.functionalDrivers ||
      [];
    return drivers;
  }, [uvp, deepContext]);

  // Convert grouped map to array for rendering
  const groupedProfilesArray = useMemo(() => {
    const order: RoleCategory[] = ['C-Suite', 'Operations', 'Technology', 'Sales & Marketing', 'Other'];
    return order
      .filter(cat => groupedProfiles.has(cat))
      .map(cat => ({ category: cat, profiles: groupedProfiles.get(cat) || [] }));
  }, [groupedProfiles]);

  return (
    <>
      {/* Customer Profile - Grouped by Role Type */}
      {parsedProfiles.length > 0 && (
        <SidebarSection
          title="Customer Profile"
          icon={<Users className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={parsedProfiles.length}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {/* Render grouped profiles by role category */}
            {groupedProfilesArray.map(({ category, profiles }) => (
              <RoleCategoryGroup
                key={category}
                category={category}
                profiles={profiles}
                emotionalDrivers={emotionalDrivers}
                functionalDrivers={functionalDrivers}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Products & Services - Right after Customer Profile */}
      {productsData.length > 0 && (
        <SidebarSection
          title="Products & Services"
          icon={<Package className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={productsData.length}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {productsData.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                description={product.description}
                category={product.category}
                confidence={product.confidence}
                source={product.source}
                sourceExcerpt={product.sourceExcerpt}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Differentiators - Expandable Cards with UVP Data */}
      {differentiatorData.length > 0 && (
        <SidebarSection
          title="Differentiators"
          icon={<Shield className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={differentiatorData.length}
        >
          <div className="space-y-2">
            {differentiatorData.map((diff) => (
              <DifferentiatorCard
                key={diff.id}
                statement={diff.statement}
                evidence={diff.evidence}
                strengthScore={diff.strengthScore}
                source={diff.source}
                type={diff.type}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Key Benefits - Expandable Cards with UVP Data */}
      {benefitData.length > 0 && (
        <SidebarSection
          title="Key Benefits"
          icon={<Heart className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={benefitData.length}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {benefitData.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                statement={benefit.statement}
                outcomeStatement={benefit.outcomeStatement}
                outcomeType={benefit.outcomeType}
                eqFraming={benefit.eqFraming}
                metrics={benefit.metrics}
                source={benefit.source}
                type={benefit.type}
                onSelectItem={onSelectItem}
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Value Proposition - Expandable Card with Variations & Statements */}
      {uvp.valuePropositionStatement && (
        <SidebarSection
          title="Value Proposition"
          icon={<Target className="w-4 h-4" />}
          defaultExpanded={false}
        >
          <ValuePropositionCard
            statement={uvp.valuePropositionStatement}
            variations={uvp.variations}
            whyStatement={uvp.whyStatement}
            whatStatement={uvp.whatStatement}
            howStatement={uvp.howStatement}
            onSelectItem={onSelectItem}
          />
        </SidebarSection>
      )}

      {/* Keywords (SEO) */}
      {keywordItems.length > 0 && (
        <SidebarSection
          title="Keywords (SEO)"
          icon={<Globe className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={keywordItems.length}
        >
          <div className="flex flex-wrap gap-1.5">
            {keywordItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem({ type: item.type, text: item.text })}
                className="px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                {item.text}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Customer Testimonials */}
      {testimonialItems.length > 0 && (
        <SidebarSection
          title="Customer Testimonials"
          icon={<Quote className="w-4 h-4" />}
          defaultExpanded={true}
          badgeCount={testimonialItems.length}
        >
          <div className="space-y-1.5">
            {testimonialItems.slice(0, 5).map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Meta Tags & SEO */}
      {metaKeywords.length > 0 && (
        <SidebarSection
          title="Meta Tags & SEO"
          icon={<Globe className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={metaKeywords.length}
        >
          <div className="space-y-1.5">
            {metaKeywords.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}

      {/* Website Value Props - from website analysis */}
      {deepContext?.business?.websiteAnalysis?.valuePropositions?.length > 0 && (
        <SidebarSection
          title="Website Value Props"
          icon={<Lightbulb className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={deepContext.business.websiteAnalysis.valuePropositions.length}
        >
          <div className="space-y-1.5">
            {deepContext.business.websiteAnalysis.valuePropositions.slice(0, 5).map((vp: string, i: number) => (
              <button
                key={`ws-vp-${i}`}
                onClick={() => onSelectItem({ type: 'value_proposition', text: vp })}
                className="w-full text-left p-2 text-xs rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 transition-colors line-clamp-2"
              >
                {vp}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Website Differentiators - from website analysis */}
      {deepContext?.business?.websiteAnalysis?.differentiators?.length > 0 && (
        <SidebarSection
          title="Website Differentiators"
          icon={<Shield className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={deepContext.business.websiteAnalysis.differentiators.length}
        >
          <div className="space-y-1.5">
            {deepContext.business.websiteAnalysis.differentiators.slice(0, 5).map((diff: string, i: number) => (
              <button
                key={`ws-diff-${i}`}
                onClick={() => onSelectItem({ type: 'differentiator', text: diff })}
                className="w-full text-left p-2 text-xs rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700 transition-colors line-clamp-2"
              >
                {diff}
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Case Studies / Social Proof */}
      {caseStudyItems.length > 0 && (
        <SidebarSection
          title="Case Studies"
          icon={<BookOpen className="w-4 h-4" />}
          defaultExpanded={false}
          badgeCount={caseStudyItems.length}
        >
          <div className="space-y-1.5">
            {caseStudyItems.map(renderClickableItem)}
          </div>
        </SidebarSection>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to detect websiteAnalysis changes
  const prevWs = prevProps.deepContext?.business?.websiteAnalysis;
  const nextWs = nextProps.deepContext?.business?.websiteAnalysis;

  // If websiteAnalysis changed, re-render
  if (prevWs !== nextWs) return false;
  if ((prevWs?.valuePropositions?.length || 0) !== (nextWs?.valuePropositions?.length || 0)) return false;
  if ((prevWs?.differentiators?.length || 0) !== (nextWs?.differentiators?.length || 0)) return false;
  if ((prevWs?.testimonials?.length || 0) !== (nextWs?.testimonials?.length || 0)) return false;
  if (Object.keys(prevWs?.metaTags || {}).length !== Object.keys(nextWs?.metaTags || {}).length) return false;

  // Default shallow compare for other props
  return prevProps.uvp === nextProps.uvp && prevProps.onSelectItem === nextProps.onSelectItem;
});

// ============================================================================
// CSS GRID INSIGHT GRID - V3 style with proper expansion (no react-window)
// ============================================================================

interface CSSGridInsightGridProps {
  insights: InsightCard[];
  selectedInsights: string[];
  onToggle: (id: string) => void;
}

const CSSGridInsightGrid = memo(function CSSGridInsightGrid({
  insights,
  selectedInsights,
  onToggle
}: CSSGridInsightGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-3 p-1">
        {insights.map((insight, idx) => {
          const isSelected = selectedInsights.includes(insight.id);
          const isExpanded = expandedCard === insight.id;
          const Icon = typeConfig[insight.type]?.icon || TrendingUp;
          const gradientColor = typeConfig[insight.type]?.gradient || 'from-gray-500 to-gray-600';

          // Card classes - expanded cards span both columns
          const cardClasses = `relative rounded-lg border-2 transition-all ${
            isExpanded ? 'col-span-2' : ''
          } ${
            isSelected
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
          }`;

          // V3 FIX: Use regular div instead of motion.div for better performance
          // Staggered animations on 50+ cards causes freezing
          return (
            <div
              key={insight.id}
              className={cardClasses}
            >
              {/* Card Content - Clickable to select */}
              <button
                onClick={() => onToggle(insight.id)}
                className="w-full p-3 text-left"
              >
                {/* Confidence Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r ${gradientColor} rounded-full`}>
                  <span className="text-xs font-bold text-white">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>

                {/* Type Icon */}
                <div className={`inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br ${gradientColor} rounded-lg mb-2`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white pr-8 line-clamp-2">
                  {insight.title}
                </h4>

                {/* Category & Source */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${typeConfig[insight.type]?.bgColor} ${typeConfig[insight.type]?.color}`}>
                    {insight.category}
                  </span>
                  {insight.sources && insight.sources.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.sources[0].source}
                    </span>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>

              {/* Expand Button */}
              <button
                onClick={(e) => toggleExpand(insight.id, e)}
                className="absolute bottom-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Expanded Details - CSS-based, no AnimatePresence inside loop */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3">
                  {/* Description */}
                  {insight.description && (
                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase">Overview</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.description}</p>
                    </div>
                  )}

                  {/* Actionable Insight */}
                  {insight.actionableInsight && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 uppercase">What To Do</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.actionableInsight}</p>
                    </div>
                  )}

                  {/* Evidence */}
                  {insight.evidence && insight.evidence.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 uppercase">Evidence</h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {insight.evidence.slice(0, 3).map((ev, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-amber-500">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources */}
                  {insight.sources && insight.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Sources:</span>
                      {insight.sources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded">
                          {src.source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// YOUR MIX PREVIEW COMPONENT
// ============================================================================

interface YourMixPreviewProps {
  selectedInsights: InsightCard[];
  generatedContent: GeneratedContent | null;
  isGenerating: boolean;
  framework: PsychologyFramework;
  onRemove: (id: string) => void;
  onClear: () => void;
  onGenerate: () => void;
  onSave?: () => void;
}

function YourMixPreview({
  selectedInsights,
  generatedContent,
  isGenerating,
  framework,
  onRemove,
  onClear,
  onGenerate,
  onSave
}: YourMixPreviewProps) {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const hasSelection = selectedInsights.length > 0;

  const avgConfidence = hasSelection
    ? selectedInsights.reduce((sum, i) => sum + i.confidence, 0) / selectedInsights.length
    : 0;

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Your Mix
          </h3>
          {hasSelection && (
            <button
              onClick={onClear}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {selectedInsights.length} selected
          </p>
          <span className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
            {framework}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence>
            {!hasSelection ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select insights or choose a template
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Generation Loading */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Generating with V4 Engine...</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Synthesizing {selectedInsights.length} insights
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Generated Content Preview */}
                {generatedContent && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            Live Preview
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            generatedContent.score.total >= 80
                              ? 'bg-green-100 text-green-700'
                              : generatedContent.score.total >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {generatedContent.score.total}/100
                          </span>
                          <button
                            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded"
                          >
                            {isPreviewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                        {generatedContent.headline}
                      </p>
                    </div>

                    <AnimatePresence>
                      {isPreviewExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-blue-200 dark:border-blue-700"
                        >
                          <div className="p-4 space-y-3">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h5 className="text-xs font-bold text-purple-700 mb-1 uppercase">Hook</h5>
                              <p className="text-sm italic text-gray-700 dark:text-gray-300">{generatedContent.hook}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase">Body</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{generatedContent.body}</p>
                            </div>
                            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center">
                              <p className="text-sm font-bold">{generatedContent.cta}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Selected Insights List */}
                <div className="space-y-2">
                  {selectedInsights.map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative group"
                    >
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                        <button
                          onClick={() => onRemove(insight.id)}
                          className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-gray-600" />
                        </button>
                        <p className="text-xs font-medium text-gray-900 dark:text-white pr-6 mb-1">
                          {insight.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{insight.category}</span>
                          <span className="text-xs font-bold text-purple-600">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        {hasSelection && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Avg. Confidence</span>
            <span className="font-bold text-purple-600">{Math.round(avgConfidence * 100)}%</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onGenerate}
            disabled={!hasSelection || isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate</>
            )}
          </Button>
          {generatedContent && onSave && (
            <Button variant="outline" onClick={onSave}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function V4PowerModePanel({
  uvp,
  brandId,
  context: providedContext,
  onContentGenerated,
  onSaveToCalendar,
  skipApis = false,  // DEV MODE: Set to true to skip all external API calls
  forceApiRefresh = false  // ONE-TIME: Set to true to force fresh API calls
}: V4PowerModePanelProps) {
  // State
  const [allInsights, setAllInsights] = useState<InsightCard[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [templateSidebarCollapsed, setTemplateSidebarCollapsed] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<InsightRecipe | null>(null);
  const [activeFramework, setActiveFramework] = useState<PsychologyFramework>('AIDA');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok'>>(new Set(['linkedin']));
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [frameworkDropdownOpen, setFrameworkDropdownOpen] = useState(false);
  const [funnelDropdownOpen, setFunnelDropdownOpen] = useState(false);
  // Derived: Primary platform for single-platform APIs (first selected)
  const activePlatform = Array.from(selectedPlatforms)[0] || 'linkedin';
  const [activeFunnelStage, setActiveFunnelStage] = useState<FunnelStage>('TOFU');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [deepContext, setDeepContext] = useState<DeepContext | null>(providedContext || null);
  const [livePreviewContent, setLivePreviewContent] = useState<GeneratedContent | null>(null);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);

  // FREEZE FIX: Pagination state - never render 100+ items at once
  const INSIGHTS_PER_PAGE = 20;
  const [visibleCount, setVisibleCount] = useState(INSIGHTS_PER_PAGE);

  // Refs for debouncing and cancellation
  const lastInsightExtractionRef = useRef<number>(0);
  const insightExtractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const livePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deepContextLoadedRef = useRef<boolean>(false); // Guard against duplicate loads
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false); // Disabled by default to prevent freeze
  const [isRefreshingApis, setIsRefreshingApis] = useState(false); // Track API refresh state
  const [recipeDropdownOpen, setRecipeDropdownOpen] = useState(false); // Recipe dropdown state

  // Detect B2B vs B2C from UVP for platform suggestions
  const isB2B = useMemo(() => {
    // Check target customer for B2B indicators
    const targetStatement = uvp?.targetCustomer?.statement?.toLowerCase() || '';
    const industry = (uvp as any)?.industry?.toLowerCase() || '';

    const b2bIndicators = [
      'business', 'enterprise', 'b2b', 'company', 'companies', 'organization',
      'corporate', 'professional', 'saas', 'software', 'agency', 'firm',
      'service provider', 'vendor', 'client', 'consultant', 'insurance agent',
      'broker', 'carrier', 'underwriter'
    ];

    const hasB2BIndicator = b2bIndicators.some(indicator =>
      targetStatement.includes(indicator) || industry.includes(indicator)
    );

    return hasB2BIndicator;
  }, [uvp]);

  // V4 Hook
  const {
    isGenerating,
    error,
    generateWithControl,
    clearError
  } = useV4ContentGeneration({ uvp, brandId, mode: 'power' });

  // Business Profile Hook - provides competitor-aware gaps, industry hooks, and segment features
  const {
    profile: businessProfile,
    gaps: competitorAwareGaps,
    competitors: discoveredCompetitors,
    hooks: industryHooks,
    features: segmentFeatures,
    segmentLabel,
    isLoading: isLoadingProfile,
    refresh: refreshBusinessProfile
  } = useBusinessProfile(deepContext, uvp);

  // NEW: Competitor Intelligence Hook - provides real competitor data from Gap Tab 2.0 system
  const {
    competitors: realCompetitorChips,
    gaps: realCompetitorGaps,
    filteredGaps,
    // Enhanced intelligence data
    enhancedInsights,
    customerVoiceByCompetitor,
    isLoading: isLoadingCompetitors,
    isDiscovering,
    isScanning,
    isAnalyzing,
    // Phase tracking for enhanced progress UI
    scanPhase,
    phaseLabel,
    overallProgress,
    competitorStatuses,
    elapsedSeconds,
    toggleCompetitor,
    identifyCompetitor,
    addCompetitor,
    removeCompetitor,
    rescanCompetitor,
    rescanAll,
    runDiscovery,
    dismissGap,
    toggleGapStar,
    error: competitorError
  } = useCompetitorIntelligence(brandId, deepContext, { autoLoad: true, autoDiscover: true });

  // Early competitor discovery hook - triggers at 30% progress during DeepContext build (Task 6.7)
  const {
    state: earlyDiscoveryState,
    triggerDiscovery: triggerEarlyDiscovery,
    startFullAnalysis: startFullCompetitorAnalysis,
    hasRunForBrand: hasEarlyDiscoveryRun
  } = useEarlyCompetitorDiscovery({ triggerAtProgress: 30 });

  // Ref to track if early discovery has been triggered during this session
  const earlyDiscoveryTriggeredRef = useRef(false);

  // Expose refresh functions to window for dev testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__refreshGaps = refreshBusinessProfile;
      (window as any).__runDiscovery = runDiscovery;
      (window as any).__rescanAll = rescanAll; // Rescan existing competitors + extract gaps → saves to Supabase

      // Add competitor manually - usage: window.__addCompetitor('Tidio', 'https://tidio.com')
      (window as any).__addCompetitor = async (name: string, website?: string) => {
        if (!name) {
          console.error('Usage: window.__addCompetitor("Competitor Name", "https://website.com")');
          return;
        }
        console.log(`[Dev] Adding competitor: ${name}`);
        const competitor = {
          name,
          website: website || `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
          confidence: 0.8,
          reason: 'Manually added for testing'
        };
        await addCompetitor(competitor, (stage, progress) => {
          console.log(`[Dev] ${name}: ${stage} (${progress}%)`);
        });
        console.log(`[Dev] ✅ ${name} added successfully!`);
      };

      console.log('[V4PowerMode] Dev helpers available:');
      console.log('  - window.__refreshGaps() - Refresh business profile');
      console.log('  - window.__runDiscovery() - Run full competitor discovery');
      console.log('  - window.__rescanAll() - Rescan gaps only (uses existing competitors, saves to cache)');
      console.log('  - window.__addCompetitor("Name", "https://url") - Add single competitor & scan');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__refreshGaps;
        delete (window as any).__runDiscovery;
        delete (window as any).__rescanAll;
        delete (window as any).__addCompetitor;
      }
    };
  }, [refreshBusinessProfile, runDiscovery, rescanAll, addCompetitor]);

  // Log business profile when resolved
  useEffect(() => {
    if (businessProfile) {
      console.log('[V4PowerMode] Business profile resolved:', {
        segment: businessProfile.segmentLabel,
        industry: businessProfile.industryProfile?.industry,
        gapsCount: competitorAwareGaps.length,
        competitorsCount: discoveredCompetitors.length,
        hasHooks: Object.keys(industryHooks).length > 0,
        features: segmentFeatures
      });
    }
  }, [businessProfile, competitorAwareGaps, discoveredCompetitors, industryHooks, segmentFeatures]);

  // Load DeepContext if not provided
  useEffect(() => {
    async function loadDeepContext() {
      if (!brandId) {
        setIsLoading(false);
        return;
      }

      // PERFORMANCE FIX: Prevent duplicate loads which cause freeze
      if (deepContextLoadedRef.current) {
        console.log('[V4PowerMode] Skipping duplicate DeepContext load');
        return;
      }
      deepContextLoadedRef.current = true;

      // If context was provided, use it directly (unless forcing refresh)
      if (providedContext && !forceApiRefresh) {
        console.log('[V4PowerMode] Using provided DeepContext');
        setDeepContext(providedContext);
        // FREEZE FIX: Use async chunked extraction with yield points
        const insights = await extractInsightsFromDeepContextAsync(providedContext, uvp, (partialInsights, section) => {
          console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights (${section})`);
        });
        setAllInsights(insights);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // ONE-TIME API REFRESH: Skip all caches and go straight to API calls
      if (forceApiRefresh) {
        console.log('[V4PowerMode] 🔄 FORCE API REFRESH: Bypassing all caches...');
        setLoadingStatus('Force refresh: Running all APIs...');
        // Skip directly to API calls below
      } else {
        setLoadingStatus('Checking for preloaded intelligence...');

        try {
          // Check for preloaded context from UVP flow
          const preloadedContext = dashboardPreloader.getPreloadedContext(brandId);

          if (preloadedContext) {
            console.log('[V4PowerMode] ✅ Using PRELOADED context from UVP flow');
            setDeepContext(preloadedContext);
            // FREEZE FIX: Use async chunked extraction with yield points
            const insights = await extractInsightsFromDeepContextAsync(preloadedContext, uvp, (partialInsights, section) => {
              console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights (${section})`);
            });
            setAllInsights(insights);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[V4PowerMode] Preload check failed:', e);
        }
      }

      try {
        // FEATURE BRANCH CACHE: Check for cached data for this specific brand (unless forcing refresh)
        if (!forceApiRefresh && hasCachedData(brandId)) {
          console.log('[V4PowerMode] 🗃️ Using CACHED data from feature branch cache');
          setLoadingStatus('Loading cached intelligence...');
          const cachedData = getCachedData(brandId);
          if (cachedData?.deepContext) {
            setDeepContext(cachedData.deepContext);
            // Use cached insights directly if available, otherwise extract from context
            if (cachedData.insights && cachedData.insights.length > 0) {
              console.log(`[V4PowerMode] Using ${cachedData.insights.length} pre-categorized cached insights`);
              const convertedInsights: InsightCard[] = cachedData.insights.map(ci => ({
                id: ci.id,
                type: ci.type,
                title: ci.title,
                category: ci.category,
                confidence: ci.confidence,
                isTimeSensitive: ci.isTimeSensitive,
                description: ci.description,
                actionableInsight: ci.actionableInsight,
                evidence: ci.evidence,
                sources: ci.sources,
                rawData: ci.rawData,
              }));
              setAllInsights(convertedInsights);
            } else {
              const insights = await extractInsightsFromDeepContextAsync(cachedData.deepContext, uvp, (partialInsights, section) => {
                console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights from cache (${section})`);
              });
              setAllInsights(insights);
            }
            setIsLoading(false);
            return;
          }
        }

        // DEV MODE: Skip ALL API calls - use cached data from localStorage if available
        if (skipApis && !forceApiRefresh) {
          // First, check localStorage for cached DeepContext from previous API run
          const cacheKey = `deepContext_${brandId}`;
          const cachedContextStr = localStorage.getItem(cacheKey);

          if (cachedContextStr) {
            try {
              const cachedContext = JSON.parse(cachedContextStr) as DeepContext;
              console.log('[V4PowerMode] 🔧 DEV MODE: Using CACHED DeepContext from localStorage');
              setLoadingStatus('Loading cached intelligence...');
              setDeepContext(cachedContext);
              let insights = await extractInsightsFromDeepContextAsync(cachedContext, uvp, (partialInsights, section) => {
                console.log(`[V4PowerMode] Extracted ${partialInsights.length} insights from cache (${section})`);
              });

              // ONE-TIME: Fetch Reddit conversations and merge
              if (FETCH_CONVERSATIONS_ONCE && !conversationsFetched) {
                setLoadingStatus('Fetching Reddit conversations...');
                const conversationInsights = await fetchAndCacheConversations(uvp, brandId);
                if (conversationInsights.length > 0) {
                  insights = [...insights, ...conversationInsights];
                  console.log(`[V4PowerMode] ✅ Merged ${conversationInsights.length} conversation insights`);
                }
              } else {
                // Check for cached conversations from previous fetch
                const convoCacheKey = `conversations_${brandId}`;
                const cachedConvos = localStorage.getItem(convoCacheKey);
                if (cachedConvos) {
                  try {
                    const parsedConvos = JSON.parse(cachedConvos) as InsightCard[];
                    insights = [...insights, ...parsedConvos];
                    console.log(`[V4PowerMode] ✅ Loaded ${parsedConvos.length} cached conversation insights`);
                  } catch (e) {
                    console.warn('[V4PowerMode] Failed to parse cached conversations');
                  }
                }
              }

              setAllInsights(insights);
              setIsLoading(false);
              return;
            } catch (e) {
              console.warn('[V4PowerMode] Failed to parse cached context:', e);
            }
          }

          console.log('[V4PowerMode] 🔧 DEV MODE: No cached data - using UVP data only');
          setLoadingStatus('Loading UVP data...');
          // Cast to any to access extended properties that might exist at runtime
          const uvpData = uvp as any;
          // Load brand from localStorage (one-time read, no hook dependency)
          let storedBrand: { name?: string; industry?: string; website?: string } | null = null;
          try {
            const stored = localStorage.getItem('currentBrand');
            if (stored) storedBrand = JSON.parse(stored);
          } catch (e) { /* ignore parse errors */ }
          const brandName = storedBrand?.name || uvpData.brandName || 'Brand';
          const brandIndustry = storedBrand?.industry || uvpData.industry || 'General';
          console.log('[V4PowerMode] Using brand info for context:', { brandName, brandIndustry });
          const minimalContext: DeepContext = {
            business: {
              profile: {
                id: brandId,
                name: brandName,
                industry: brandIndustry,
                website: storedBrand?.website || uvpData.websiteUrl || '',
                location: { city: '', state: '', country: '' },
                keywords: []
              },
              brandVoice: {
                tone: ['professional'],
                values: [],
                personality: [],
                avoidWords: [],
                signaturePhrases: []
              },
              uniqueAdvantages: [],
              goals: [],
              uvp: {
                targetCustomer: uvp.targetCustomer?.statement || '',
                customerProblem: uvpData.customerProblem?.statement || '',
                desiredOutcome: uvp.transformationGoal?.statement || '',
                uniqueSolution: uvp.uniqueSolution?.statement || '',
                keyBenefit: uvp.keyBenefit?.statement || '',
                emotionalDrivers: uvp.transformationGoal?.emotionalDrivers || [],
                functionalDrivers: uvp.transformationGoal?.functionalDrivers || []
              }
            },
            industry: {
              profile: null,
              trends: [],
              seasonality: [],
              competitiveLandscape: { topCompetitors: [], marketConcentration: 'moderate', barrierToEntry: 'medium' },
              economicFactors: []
            },
            realTimeCultural: {},
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
              keyInsights: [],
              hiddenPatterns: [],
              opportunityScore: 0,
              recommendedAngles: [],
              confidenceLevel: 0,
              generatedAt: new Date()
            },
            rawDataPoints: [],
            correlatedInsights: [],
            metadata: {
              aggregatedAt: new Date(),
              dataSourcesUsed: ['uvp_only'],
              processingTimeMs: 0,
              version: 'dev-mode'
            }
          };
          setDeepContext(minimalContext);
          const insights = await extractInsightsFromDeepContextAsync(minimalContext, uvp, () => {});
          setAllInsights(insights);
          setIsLoading(false);
          return;
        }

        // PROGRESSIVE RENDERING: Extract and show insights AS APIs complete
        // Don't wait for AI synthesis - render local insights immediately
        console.log('[V4PowerMode] Building DeepContext with PROGRESSIVE rendering...');
        setLoadingStatus('Building intelligence context...');

        let lastExtractTime = 0;
        const EXTRACT_THROTTLE_MS = 2000; // Extract insights every 2 seconds max

        const buildResult = await trueProgressiveBuilder.buildTrueProgressive({
          brandId,
          cacheResults: true,
          forceFresh: false,
          includeYouTube: true,
          includeOutScraper: true,
          includeSerper: true,
          includeWebsiteAnalysis: true,
          includeSEMrush: true,
          includeNews: true,
          includeWeather: true,
          includeLinkedIn: true,
          includePerplexity: true,
          includeApify: true,
        }, async (context, metadata) => {
          // PROGRESSIVE RENDERING: Extract and render insights as data arrives
          const now = Date.now();
          setLoadingStatus(`Loading... ${metadata.completedApis.length} APIs complete (${metadata.dataPointsCollected} data points)`);

          // TASK 6.7: Early competitor discovery trigger at ~30% progress
          // Trigger when we have business profile data (usually ~3 APIs complete)
          const hasBusinessProfile = context.business?.profile?.name && context.business?.profile?.industry;
          const atEarlyDiscoveryThreshold = metadata.completedApis.length >= 3;

          if (hasBusinessProfile && atEarlyDiscoveryThreshold && !earlyDiscoveryTriggeredRef.current) {
            earlyDiscoveryTriggeredRef.current = true;
            console.log('[V4PowerMode] 🚀 EARLY DISCOVERY: Triggering competitor discovery at ~30% progress');

            // Non-blocking: Fire and forget - discovery runs in parallel with UVP extraction
            triggerEarlyDiscovery(brandId, context).catch(err => {
              console.warn('[V4PowerMode] Early discovery failed (non-blocking):', err);
            });
          }

          // Throttle extraction to prevent freeze - extract every 2 seconds
          if (now - lastExtractTime > EXTRACT_THROTTLE_MS && metadata.dataPointsCollected > 10) {
            lastExtractTime = now;
            setDeepContext(context);
            setIsLoading(false); // Show content early

            // Quick sync extraction for speed (async would be too slow for progressive)
            try {
              const partialInsights = extractInsightsFromDeepContext(context, uvp);
              if (partialInsights.length > 0) {
                console.log(`[V4PowerMode] PROGRESSIVE: ${partialInsights.length} insights from ${metadata.completedApis.length} APIs`);
                setAllInsights(partialInsights);
              }
            } catch (e) {
              // Ignore extraction errors during progressive load
            }
          }
        });

        console.log('[V4PowerMode] DeepContext built:', {
          dataSourcesUsed: buildResult.metadata.dataSourcesUsed,
          dataPointsCollected: buildResult.metadata.dataPointsCollected,
          buildTimeMs: buildResult.metadata.buildTimeMs,
        });

        // Final extraction with complete context
        setDeepContext(buildResult.context);
        setIsLoading(false);

        // Cache context to localStorage for DEV MODE
        try {
          const cacheKey = `deepContext_${brandId}`;
          localStorage.setItem(cacheKey, JSON.stringify(buildResult.context));
          console.log('[V4PowerMode] 💾 Cached DeepContext to localStorage for dev mode');
        } catch (e) {
          // localStorage might be full or unavailable
          console.warn('[V4PowerMode] Failed to cache context:', e);
        }

        const insights = await extractInsightsFromDeepContextAsync(buildResult.context, uvp, (partialInsights, section) => {
          if (partialInsights.length > 0) {
            setAllInsights([...partialInsights]);
          }
        });
        setAllInsights(insights);

      } catch (err) {
        console.error('[V4PowerMode] Failed to load DeepContext:', err);
        // Fallback to UVP-only insights - graceful degradation with async extraction
        console.log('[V4PowerMode] Using UVP-only insights as fallback');
        const fallbackInsights = await extractInsightsFromDeepContextAsync({} as DeepContext, uvp);
        setAllInsights(fallbackInsights);
        setLoadingStatus('Loaded UVP insights (API context unavailable)');
        // Don't leave in loading state on error
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadDeepContext();
    // PERMANENT FIX: Only use primitive/stable dependencies
    // - brandId: primitive string, stable
    // - uvp?.valuePropositionStatement: primitive string, stable
    // - providedContext removed: object reference changes each parent render
    // Using ref guard (deepContextLoadedRef) prevents re-runs regardless of dep changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // Filter insights
  // FREEZE FIX: Use deferred value for non-urgent computations (filter counts)
  const deferredInsights = useDeferredValue(allInsights);

  // Filter insights by type
  const filteredInsights = useMemo(() => {
    if (activeFilter === 'all') return allInsights;
    return allInsights.filter(i => i.type === activeFilter);
  }, [allInsights, activeFilter]);

  // FREEZE FIX: Paginated insights - only render visibleCount items
  // This prevents rendering 100+ items at once which causes the freeze
  const paginatedInsights = useMemo(() => {
    return filteredInsights.slice(0, visibleCount);
  }, [filteredInsights, visibleCount]);

  // FREEZE FIX: Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(INSIGHTS_PER_PAGE);
  }, [activeFilter]);

  // FREEZE FIX: Load more handler
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + INSIGHTS_PER_PAGE);
  }, []);

  // Check if there are more items to load
  const hasMoreInsights = filteredInsights.length > visibleCount;

  // Get selected insight objects
  const selectedInsightObjects = useMemo(() => {
    return allInsights.filter(i => selectedInsights.includes(i.id));
  }, [allInsights, selectedInsights]);

  // Toggle insight selection
  const handleToggleInsight = useCallback((insightId: string) => {
    setSelectedInsights(prev =>
      prev.includes(insightId)
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  }, []);

  // Handle recipe selection - sets framework, funnelStage, and suggested platforms
  const handleSelectRecipe = useCallback((recipe: InsightRecipe) => {
    // Filter insights that match the recipe types
    const matchingInsights = allInsights.filter(insight =>
      recipe.insightTypes.includes(insight.type)
    );

    // Sort by confidence and take the top N
    const sortedByConfidence = matchingInsights.sort((a, b) => b.confidence - a.confidence);
    const selected = sortedByConfidence.slice(0, recipe.maxInsights);

    setSelectedInsights(selected.map(i => i.id));
    setActiveFramework(recipe.primaryFramework);
    setActiveFunnelStage(recipe.targetFunnelStage);

    // Set suggested platforms based on B2B/B2C detection
    const suggestedPlatforms = isB2B
      ? recipe.suggestedPlatforms.b2b
      : recipe.suggestedPlatforms.b2c;
    setSelectedPlatforms(new Set(suggestedPlatforms as any[]));

    setSelectedRecipe(recipe);
    setRecipeDropdownOpen(false);
    setShowTemplateDropdown(false);
  }, [allInsights, isB2B]);

  // ==========================================================================
  // CLEAR CACHE AND CALL APIS HANDLERS
  // ==========================================================================

  // Clear all cached data from localStorage for triggers, proof, trends, gaps
  const handleClearCache = useCallback(() => {
    const keysToDelete = [
      'triggersPanel_deepContext_v1',
      'triggersPanel_triggers_v1',
      `conversations_${brandId}`,
      'proofPanel_data_v1',
      'trendsPanel_data_v1',
      'gapsPanel_data_v1',
      'deepContext_cache',
      `competitor_intelligence_${brandId}`,
      `competitor_gaps_${brandId}`,
    ];

    let clearedCount = 0;
    keysToDelete.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`[ClearCache] Removed: ${key}`);
      }
    });

    // Also clear any brand-specific keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (brandId && key.includes(brandId)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`[ClearCache] Removed brand key: ${key}`);
      }
    });

    // Reset trigger count state
    setCachedTriggerCount(0);

    console.log(`[ClearCache] Cleared ${clearedCount} cached items`);
    alert(`Cache cleared! Removed ${clearedCount} cached items. Click "Call APIs" to refresh data.`);
  }, [brandId]);

  // Call all APIs to refresh data for triggers, proof, trends, competitors
  const handleCallApis = useCallback(async () => {
    if (!brandId || !uvp) {
      console.warn('[CallApis] Missing brandId or uvp');
      return;
    }

    setIsRefreshingApis(true);
    console.log('[CallApis] Starting fresh API calls...');

    try {
      // Call dashboardPreloader to refresh DeepContext
      setLoadingStatus('Refreshing intelligence data...');

      // Clear existing preloaded data
      dashboardPreloader.clearPreloadedData();

      // Start fresh preload
      dashboardPreloader.startPreload(uvp, brandId);

      // Subscribe to progress updates
      const unsubscribe = dashboardPreloader.subscribeToProgress((progress, status) => {
        setLoadingStatus(`${status} (${Math.round(progress)}%)`);
        console.log(`[CallApis] Progress: ${progress}% - ${status}`);
      });

      // Wait for preload to complete (with timeout)
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes max
      while (attempts < maxAttempts) {
        const preloadedContext = dashboardPreloader.getPreloadedContext();
        if (preloadedContext) {
          setDeepContext(preloadedContext);
          console.log('[CallApis] DeepContext refreshed successfully');

          // Trigger insight extraction with fresh data
          const freshInsights = await extractInsightsFromDeepContextAsync(
            preloadedContext,
            uvp,
            (insights, section) => {
              console.log(`[CallApis] Extracted ${insights.length} insights from ${section}`);
            }
          );

          setAllInsights(freshInsights);
          console.log(`[CallApis] Total ${freshInsights.length} insights extracted`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      unsubscribe();

      // Also rescan competitors if available
      if (rescanAll) {
        setLoadingStatus('Rescanning competitor intelligence...');
        await rescanAll();
      }

      setLoadingStatus('All data refreshed!');
      setTimeout(() => setLoadingStatus(''), 2000);

    } catch (err) {
      console.error('[CallApis] Error refreshing data:', err);
      setLoadingStatus('Error refreshing data');
    } finally {
      setIsRefreshingApis(false);
    }
  }, [brandId, uvp, rescanAll]);

  // Handle UVP item selection - finds related insights or creates a synthetic insight
  const handleUVPItemSelect = useCallback((item: { type: string; text: string }) => {
    console.log('[V4PowerMode] UVP item selected:', item);

    // Find insights that contain similar text or match the type
    const relatedInsights = allInsights.filter(insight => {
      // Check if insight description contains any words from the UVP item
      const itemWords = item.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const descriptionMatch = itemWords.some(word =>
        insight.description?.toLowerCase().includes(word) ||
        insight.title?.toLowerCase().includes(word)
      );

      // Also match by category type mapping
      const typeMapping: Record<string, string[]> = {
        'customer': ['customer'],
        'emotional': ['customer'],
        'functional': ['customer'],
        'transformation': ['opportunity'],
        'differentiator': ['competition', 'opportunity'],
        'benefit': ['market', 'opportunity'],
        'metric': ['market'],
        'uvp': ['opportunity', 'customer']
      };

      const matchingTypes = typeMapping[item.type] || [];
      const typeMatch = matchingTypes.includes(insight.type);

      return descriptionMatch || typeMatch;
    });

    if (relatedInsights.length > 0) {
      // Select the most relevant insights (up to 3)
      const toSelect = relatedInsights.slice(0, 3).map(i => i.id);
      setSelectedInsights(prev => {
        const combined = [...new Set([...prev, ...toSelect])];
        return combined;
      });
    }
  }, [allInsights]);

  // Generate content with V4 engine
  const handleGenerate = useCallback(async () => {
    try {
      clearError();
      const content = await generateWithControl({
        platform: activePlatform,
        framework: activeFramework,
        funnelStage: activeFunnelStage,
        tone: 'professional'
      });

      setGeneratedContent(content);
      onContentGenerated?.(content);
    } catch (err) {
      console.error('V4 Power Mode generation failed:', err);
    }
  }, [generateWithControl, activeFramework, activePlatform, activeFunnelStage, clearError, onContentGenerated]);

  // Handle save
  const handleSave = useCallback(() => {
    if (generatedContent && onSaveToCalendar) {
      onSaveToCalendar(generatedContent);
    }
  }, [generatedContent, onSaveToCalendar]);

  // FREEZE FIX: Count insights by type using deferred value (non-blocking)
  // This uses deferredInsights so counts update AFTER main render completes
  const insightCounts = useMemo(() => ({
    all: deferredInsights.length,
    triggers: deferredInsights.filter(i => i.type === 'triggers').length,
    proof: deferredInsights.filter(i => i.type === 'proof').length,
    trends: deferredInsights.filter(i => i.type === 'trends').length,
    conversations: deferredInsights.filter(i => i.type === 'conversations').length,
    gaps: deferredInsights.filter(i => i.type === 'gaps').length,
  }), [deferredInsights]);

  // Auto-generate live preview when selection changes (debounced) - DISABLED BY DEFAULT
  useEffect(() => {
    if (selectedInsights.length === 0) {
      setLivePreviewContent(null);
      return;
    }

    // Skip auto-generation if disabled (prevents page freeze on template select)
    if (!autoGenerateEnabled) {
      console.log('[V4PowerMode] Auto-generation disabled - use Generate button');
      return;
    }

    // Clear any pending generation
    if (livePreviewTimeoutRef.current) {
      clearTimeout(livePreviewTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce by 2000ms (increased from 800ms) to avoid generating on rapid selection changes
    livePreviewTimeoutRef.current = setTimeout(async () => {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLiveGenerating(true);
      try {
        const content = await generateWithControl({
          platform: activePlatform,
          framework: activeFramework,
          funnelStage: activeFunnelStage,
          tone: 'professional'
        });

        // Only set content if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLivePreviewContent(content);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[V4PowerMode] Generation cancelled');
          return;
        }
        console.error('[V4PowerMode] Live preview generation failed:', err);
      } finally {
        setIsLiveGenerating(false);
      }
    }, 2000);

    return () => {
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedInsights, activeFramework, activePlatform, activeFunnelStage, generateWithControl, autoGenerateEnabled]);

  // Cleanup timeouts and abort controller on unmount
  useEffect(() => {
    return () => {
      if (insightExtractionTimeoutRef.current) {
        clearTimeout(insightExtractionTimeoutRef.current);
      }
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual generate function (for explicit Generate button clicks)
  const handleManualGenerate = useCallback(async () => {
    if (selectedInsights.length === 0) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLiveGenerating(true);
    try {
      const content = await generateWithControl({
        platform: activePlatform,
        framework: activeFramework,
        funnelStage: activeFunnelStage,
        tone: 'professional'
      });

      if (!abortControllerRef.current?.signal.aborted) {
        setLivePreviewContent(content);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[V4PowerMode] Generation cancelled');
        return;
      }
      console.error('[V4PowerMode] Manual generation failed:', err);
    } finally {
      setIsLiveGenerating(false);
    }
  }, [selectedInsights, activePlatform, activeFramework, activeFunnelStage, generateWithControl]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 relative">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
        {/* Content Recipe Dropdown */}
        <TooltipProvider delayDuration={100}>
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Content Recipe
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                  <p className="font-medium text-sm mb-1">One-Click Content Strategy</p>
                  <p className="text-xs text-gray-300">Select a recipe to auto-select relevant insights and configure optimal settings for your content goal.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <button
              onClick={() => {
                setRecipeDropdownOpen(!recipeDropdownOpen);
                setFrameworkDropdownOpen(false);
                setFunnelDropdownOpen(false);
                setPlatformDropdownOpen(false);
              }}
              className={`flex items-center justify-between w-48 h-8 px-3 text-sm rounded-md transition-colors ${
                selectedRecipe
                  ? 'bg-green-800 border border-green-600 text-green-100 hover:bg-green-700'
                  : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              <span className="text-sm truncate flex items-center gap-2">
                {selectedRecipe ? (
                  <>
                    <span>{selectedRecipe.emoji}</span>
                    <span>{selectedRecipe.name}</span>
                  </>
                ) : (
                  <>
                    <LayoutTemplate className="w-4 h-4" />
                    <span>Select Recipe...</span>
                  </>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${recipeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Recipe Dropdown Menu with Tooltips */}
            {recipeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Clear Recipe Option */}
                  {selectedRecipe && (
                    <button
                      onClick={() => {
                        setSelectedRecipe(null);
                        setSelectedInsights([]);
                        setActiveFramework('AIDA');
                        setActiveFunnelStage('TOFU');
                        setRecipeDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 cursor-pointer text-left border-b border-slate-600 text-gray-400"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm">Clear Recipe</span>
                    </button>
                  )}
                  {TEMPLATE_RECIPES.map((recipe) => {
                    const matchCount = allInsights.filter(i =>
                      recipe.insightTypes.includes(i.type)
                    ).length;
                    return (
                      <Tooltip key={recipe.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSelectRecipe(recipe)}
                            className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                              selectedRecipe?.id === recipe.id ? 'bg-green-900/30 border-l-2 border-green-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-white flex items-center gap-2">
                                <span>{recipe.emoji}</span>
                                <span>{recipe.name}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 bg-slate-700 px-1.5 py-0.5 rounded">
                                {matchCount} insights
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5">{recipe.description}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3 z-[60]">
                          <p className="font-medium text-sm mb-2">{recipe.name}</p>
                          <div className="space-y-1 text-xs text-gray-300">
                            <p><span className="text-gray-400">Framework:</span> {FRAMEWORK_TOOLTIPS[recipe.primaryFramework]?.displayName}</p>
                            <p><span className="text-gray-400">Funnel Stage:</span> {FUNNEL_TOOLTIPS[recipe.targetFunnelStage]?.displayName}</p>
                            <p><span className="text-gray-400">Best for {isB2B ? 'B2B' : 'B2C'}:</span> {(isB2B ? recipe.suggestedPlatforms.b2b : recipe.suggestedPlatforms.b2c).map(p => PLATFORM_TOOLTIPS[p]?.label || p).join(', ')}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {/* Scroll indicator */}
                <div className="flex justify-center py-1 border-t border-slate-700 bg-slate-800/90">
                  <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />

        {/* Framework & Funnel Selectors with Titles */}
        <TooltipProvider delayDuration={100}>
          <div className="flex items-start gap-3">
            {/* Content Goal (Framework) Custom Dropdown with Tooltips */}
            <div className="flex flex-col gap-1 relative">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Content Goal
                </label>
                {selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="w-3 h-3 text-green-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="text-xs text-gray-300">Locked by {selectedRecipe.name} recipe. Clear recipe to change.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {!selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-300 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="font-medium text-sm mb-1">What should this content do?</p>
                      <p className="text-xs text-gray-300">Choose a messaging framework that matches your goal - from grabbing attention to driving conversions.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <button
                onClick={() => {
                  if (selectedRecipe) return; // Don't open if recipe is selected
                  setFrameworkDropdownOpen(!frameworkDropdownOpen);
                  setFunnelDropdownOpen(false);
                  setPlatformDropdownOpen(false);
                }}
                className={`flex items-center justify-between w-44 h-8 px-3 text-sm rounded-md transition-colors ${
                  selectedRecipe
                    ? 'bg-slate-700 border border-green-600/50 text-green-100 cursor-not-allowed'
                    : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
                }`}
              >
                <span className="text-sm truncate flex items-center gap-1">
                  {selectedRecipe && <Lock className="w-3 h-3 text-green-500" />}
                  {FRAMEWORK_TOOLTIPS[activeFramework]?.displayName || activeFramework}
                </span>
                {!selectedRecipe && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${frameworkDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>

              {/* Framework Dropdown Menu with Tooltips */}
              {frameworkDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                  <div
                    className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    {Object.entries(FRAMEWORK_TOOLTIPS).map(([key, { displayName, description }]) => (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setActiveFramework(key as PsychologyFramework);
                              setFrameworkDropdownOpen(false);
                            }}
                            className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                              activeFramework === key ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
                            }`}
                          >
                            <span className="text-sm text-white">{displayName}</span>
                            <span className="text-[10px] text-gray-400">{key}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3 z-[60]">
                          <p className="text-xs text-gray-300">{description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  {/* Scroll indicator */}
                  <div className="flex justify-center py-1 border-t border-slate-700 bg-slate-800/90">
                    <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Audience Stage (Funnel) Custom Dropdown with Tooltips */}
            <div className="flex flex-col gap-1 relative">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Audience
                </label>
                {selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="w-3 h-3 text-green-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="text-xs text-gray-300">Locked by {selectedRecipe.name} recipe. Clear recipe to change.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {!selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-300 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="font-medium text-sm mb-1">Who is this content for?</p>
                      <p className="text-xs text-gray-300">Cold = strangers who don't know you. Warm = people considering options. Hot = ready-to-buy prospects.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <button
                onClick={() => {
                  if (selectedRecipe) return; // Don't open if recipe is selected
                  setFunnelDropdownOpen(!funnelDropdownOpen);
                  setFrameworkDropdownOpen(false);
                  setPlatformDropdownOpen(false);
                }}
                className={`flex items-center justify-between w-44 h-8 px-3 text-sm rounded-md transition-colors ${
                  selectedRecipe
                    ? 'bg-slate-700 border border-green-600/50 text-green-100 cursor-not-allowed'
                    : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
                }`}
              >
                <span className="text-sm flex items-center gap-1">
                  {selectedRecipe && <Lock className="w-3 h-3 text-green-500" />}
                  {FUNNEL_TOOLTIPS[activeFunnelStage]?.emoji} {FUNNEL_TOOLTIPS[activeFunnelStage]?.displayName}
                </span>
                {!selectedRecipe && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${funnelDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>

              {/* Funnel Dropdown Menu with Tooltips */}
              {funnelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                  {Object.entries(FUNNEL_TOOLTIPS).map(([key, { displayName, emoji, acronym, description }]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveFunnelStage(key as FunnelStage);
                            setFunnelDropdownOpen(false);
                          }}
                          className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                            activeFunnelStage === key ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
                          }`}
                        >
                          <span className="text-sm text-white">{emoji} {displayName}</span>
                          <span className="text-[10px] text-gray-400">{acronym}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3 z-[60]">
                        <p className="text-xs text-gray-300">{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Multi-Select Dropdown */}
            <div className="flex flex-col gap-1 relative">
              <div className="flex items-center gap-1">
                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Platforms
                </label>
                {selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="text-xs text-gray-300">Recommended by {selectedRecipe.name} recipe for {isB2B ? 'B2B' : 'B2C'}. You can change these selections.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {!selectedRecipe && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-300 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                      <p className="font-medium text-sm mb-1">Where will this be posted?</p>
                      <p className="text-xs text-gray-300">Select one or more platforms. Content will be optimized for each platform's best practices.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <button
                onClick={() => {
                  setPlatformDropdownOpen(!platformDropdownOpen);
                  setFrameworkDropdownOpen(false);
                  setFunnelDropdownOpen(false);
                }}
                className="flex items-center justify-between w-44 h-8 px-3 text-sm bg-slate-800 border border-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {Array.from(selectedPlatforms).slice(0, 3).map((p) => {
                    const Icon = PlatformIcons[p];
                    return <Icon key={p} />;
                  })}
                  {selectedPlatforms.size > 3 && (
                    <span className="text-xs text-gray-400">+{selectedPlatforms.size - 3}</span>
                  )}
                  {selectedPlatforms.size === 5 && (
                    <span className="text-xs text-gray-300 ml-1">All</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${platformDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Platform Dropdown Menu */}
              {platformDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                  {/* Select All */}
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-600">
                    <Checkbox
                      checked={selectedPlatforms.size === 5}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlatforms(new Set(['linkedin', 'instagram', 'twitter', 'facebook', 'tiktok']));
                        } else {
                          setSelectedPlatforms(new Set(['linkedin']));
                        }
                      }}
                      className="h-4 w-4 border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <span className="text-sm text-white font-medium">Select All</span>
                  </label>

                  {/* Individual Platforms */}
                  {(['linkedin', 'instagram', 'twitter', 'facebook', 'tiktok'] as const).map((platform) => {
                    const Icon = PlatformIcons[platform];
                    const isRecommended = selectedRecipe && (
                      isB2B
                        ? selectedRecipe.suggestedPlatforms.b2b.includes(platform as any)
                        : selectedRecipe.suggestedPlatforms.b2c.includes(platform as any)
                    );
                    return (
                      <Tooltip key={platform}>
                        <TooltipTrigger asChild>
                          <label className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-700 cursor-pointer ${
                            isRecommended ? 'bg-yellow-900/20' : ''
                          }`}>
                            <Checkbox
                              checked={selectedPlatforms.has(platform)}
                              onCheckedChange={(checked) => {
                                const newPlatforms = new Set(selectedPlatforms);
                                if (checked) {
                                  newPlatforms.add(platform);
                                } else {
                                  newPlatforms.delete(platform);
                                  if (newPlatforms.size === 0) {
                                    newPlatforms.add('linkedin');
                                  }
                                }
                                setSelectedPlatforms(newPlatforms);
                              }}
                              className="h-4 w-4 border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <div className="flex items-center gap-2 text-white flex-1">
                              <Icon />
                              <span className="text-sm">{PLATFORM_TOOLTIPS[platform].label}</span>
                              {isRecommended && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 ml-auto" />
                              )}
                            </div>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3 z-[60]">
                          <p className="text-xs text-gray-300">{PLATFORM_TOOLTIPS[platform].description}</p>
                          {isRecommended && (
                            <p className="text-xs text-yellow-400 mt-1">⭐ Recommended for {selectedRecipe?.name}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Generate Button - Primary action */}
        <button
          onClick={handleManualGenerate}
          disabled={selectedInsights.length === 0 || isLiveGenerating || isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedInsights.length === 0 || isLiveGenerating || isGenerating
              ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLiveGenerating || isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate
            </>
          )}
        </button>

        {/* Right side: insights count */}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedInsights.length} insights selected
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={clearError} className="text-xs text-red-500 hover:underline mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Three Columns */}
      <div className="flex-1 flex gap-0 overflow-hidden relative">
        {/* Sidebar Toggle Button (Edge of sidebar) */}
        <button
          onClick={() => setTemplateSidebarCollapsed(!templateSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-r-md shadow-md transition-all ${
            templateSidebarCollapsed ? 'left-0' : 'left-[280px]'
          }`}
          title={templateSidebarCollapsed ? 'Show UVP Sidebar' : 'Hide UVP Sidebar'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${templateSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* UVP Sidebar (Collapsible Left) */}
        <AnimatePresence initial={false}>
          {!templateSidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="w-[280px] h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {/* UVP Building Blocks - Templates moved to toolbar dropdown */}
                  <UVPBuildingBlocks uvp={uvp} deepContext={deepContext} onSelectItem={handleUVPItemSelect} />

                  {/* NOTE: Removed sidebar Competitive Gaps section - gaps now ONLY come from real
                       competitor intelligence in the Gaps tab, no fallback dummy data */}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Middle: Insight Grid */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          {/* Filter Tabs - Synapse-aligned categories */}
          <div className="flex-shrink-0 flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'triggers', 'proof', 'trends', 'gaps'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                }`}
              >
                {filter === 'all' ? 'All' : typeConfig[filter as InsightType].label}
                <span className="ml-1.5 text-xs opacity-70">
                  {insightCounts[filter as keyof typeof insightCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Insights Grid - Virtualized for Performance */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{loadingStatus}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {allInsights.length > 0 && `${allInsights.length} insights loaded so far...`}
                </p>
              </div>
            ) : activeFilter === 'gaps' ? (
              /* NEW: Gap Tab Phase 12 - Competitor-Centric UI with accordions */
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* DEV ONLY: Force Fresh Scan Button */}
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs text-yellow-700 dark:text-yellow-400 flex-1">
                      DEV: Force fresh competitor discovery + gap extraction
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          console.log('[GAPS TAB] Starting Force Fresh Scan...');
                          await runDiscovery(true);
                          console.log('[GAPS TAB] Force Fresh Scan complete!');
                        } catch (err) {
                          console.error('[GAPS TAB] Force Fresh Scan failed:', err);
                        }
                      }}
                      disabled={isDiscovering || isScanning}
                      className="gap-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 border-yellow-300 text-yellow-800 dark:text-yellow-200"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${(isDiscovering || isScanning) ? 'animate-spin' : ''}`} />
                      {isDiscovering ? 'Discovering...' : isScanning ? 'Scanning...' : 'Force Fresh Scan'}
                    </Button>
                  </div>

                  {/* Enhanced Scan Progress */}
                  <CompetitorScanProgress
                    isActive={isScanning || isDiscovering || isAnalyzing}
                    phase={scanPhase}
                    phaseLabel={phaseLabel}
                    competitorsFound={realCompetitorChips.length}
                    competitorsScanned={realCompetitorChips.filter(c => !c.is_scanning).length}
                    totalCompetitors={realCompetitorChips.length}
                    gapsExtracted={filteredGaps.length}
                    competitorStatuses={competitorStatuses}
                    elapsedSeconds={elapsedSeconds}
                    error={competitorError || undefined}
                  />

                  {/* Skeleton Cards while scanning */}
                  {isScanning && filteredGaps.length === 0 && (
                    <GapSkeletonGrid
                      count={realCompetitorChips.length * 2}
                      competitorNames={realCompetitorChips.map(c => c.name)}
                      isScanning={isScanning}
                    />
                  )}

                  {/* NEW: Competitor Intelligence Panel - Accordion-based UI */}
                  <CompetitorIntelligencePanel
                    competitors={realCompetitorChips}
                    gaps={filteredGaps}
                    enhancedInsights={enhancedInsights}
                    customerVoiceByCompetitor={customerVoiceByCompetitor}
                    isLoading={isLoadingCompetitors || isLoadingProfile}
                    isDiscovering={isDiscovering}
                    isScanning={isScanning}
                    brandName={uvp?.brandId || businessProfile?.name}
                    onSelectGap={(gap) => {
                      // Add gap to selected insights for content generation
                      const gapInsight: InsightCard = {
                        id: gap.id,
                        type: 'gaps',
                        title: gap.title,
                        description: `${gap.the_void} → ${gap.your_angle}`,
                        category: 'competitive-gap',
                        confidence: gap.confidence_score,
                        isTimeSensitive: false,
                        sources: [{ source: gap.primary_source }],
                        rawData: gap
                      };
                      handleToggleInsight(gapInsight.id);
                    }}
                    onToggleCompetitor={toggleCompetitor}
                    onRemoveCompetitor={removeCompetitor}
                    onRescanCompetitor={rescanCompetitor}
                    onDiscoverCompetitors={() => runDiscovery(true)}
                    onAddCompetitor={addCompetitor}
                    onIdentifyCompetitor={identifyCompetitor}
                  />
                </div>
              </ScrollArea>
            ) : activeFilter === 'triggers' ? (
              /* Triggers 2.0 - Consolidated view with evidence nested under triggers */
              <ScrollArea className="h-full">
                <div className="p-4">
                  <TriggersPanelV2
                    deepContext={deepContext}
                    uvp={uvp}
                    brandData={{ name: uvp?.brandId, industry: 'Auto-detected' }}
                    selectedTriggers={selectedInsights}
                    isLoading={isLoading}
                    loadingStatus={loadingStatus}
                    onToggle={handleToggleInsight}
                  />
                </div>
              </ScrollArea>
            ) : activeFilter === 'proof' ? (
              /* Proof 2.0 Panel - Consolidated proof points with selection */
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ProofTab
                    uvp={uvp}
                    brandId={uvp?.id}
                  />
                </div>
              </ScrollArea>
            ) : filteredInsights.length > 0 ? (
              <>
                {/* FREEZE FIX: Use paginatedInsights (max 20 at a time) instead of all filteredInsights */}
                <CSSGridInsightGrid
                  insights={paginatedInsights}
                  selectedInsights={selectedInsights}
                  onToggle={handleToggleInsight}
                />
                {/* Load More Button - only show if there are more insights to load */}
                {hasMoreInsights && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                    >
                      Load More ({filteredInsights.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No insights found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Your Mix Preview */}
        <div className="w-80 flex-shrink-0 p-4 pl-0">
          <YourMixPreview
            selectedInsights={selectedInsightObjects}
            generatedContent={generatedContent}
            isGenerating={isGenerating}
            framework={activeFramework}
            onRemove={handleToggleInsight}
            onClear={() => setSelectedInsights([])}
            onGenerate={handleGenerate}
            onSave={onSaveToCalendar ? handleSave : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default V4PowerModePanel;

// Export UVPBuildingBlocks for reuse in other pages (e.g., TriggersDevPage)
export { UVPBuildingBlocks, SidebarSection };
