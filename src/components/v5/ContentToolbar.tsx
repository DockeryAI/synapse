/**
 * Content Toolbar Component - V5 Standalone Version
 *
 * Toolbar with platform, framework, and funnel stage selectors.
 * Matches V4 toolbar design with dropdown menus and rich tooltips.
 *
 * Features:
 * - Content Recipe dropdown (templates)
 * - Content Goal (Framework) dropdown with rich tooltips
 * - Audience (Funnel Stage) dropdown with tooltips
 * - Platform multi-select with tooltips
 *
 * Created: 2025-12-01
 * Updated: 2025-12-01 - Matched to V4 design with tooltips
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Check,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Music2,
  HelpCircle,
  Lock,
  Star,
  Zap,
  Loader2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

// ============================================================================
// TYPES
// ============================================================================

export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
export type PsychologyFramework = 'AIDA' | 'PAS' | 'BAB' | 'FAB' | '4Ps' | 'StoryBrand' | 'PASTOR' | 'QUEST' | 'ACCA' | 'Star-Story-Solution' | 'Hook-Story-Offer' | 'PPP';
export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export interface InsightRecipe {
  id: string;
  name: string;
  description: string;
  insightTypes: string[];
  maxInsights: number;
  primaryFramework: PsychologyFramework;
  targetFunnelStage: FunnelStage;
  suggestedPlatforms?: {
    b2b: Platform[];
    b2c: Platform[];
  };
}

// ============================================================================
// V4-STYLE TOOLTIP DATA
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
    description: 'Highlight pain, intensify it, then offer relief. Best for: Problem-aware audiences, consultants, service providers. Creates urgency.'
  },
  BAB: {
    displayName: 'Show Transformation',
    label: 'BAB (Before → After → Bridge)',
    description: 'Paint the contrast between current state and desired future. Best for: Case studies, testimonials, transformation stories.'
  },
  StoryBrand: {
    displayName: "Hero's Journey",
    label: "StoryBrand (Hero's Journey)",
    description: 'Position customer as the hero, your brand as the guide. Best for: Brand storytelling, about pages, mission statements.'
  },
  PASTOR: {
    displayName: 'Build Trust → Convert',
    label: 'PASTOR (Problem → Amplify → Story → Testimony → Offer → Response)',
    description: 'Extended framework for longer content. Best for: Sales letters, webinar scripts, detailed landing pages.'
  },
  QUEST: {
    displayName: 'Qualify → Educate → Sell',
    label: 'QUEST (Qualify → Understand → Educate → Stimulate → Transition)',
    description: 'Perfect for targeting specific segments. Best for: Niche markets, B2B content, qualification-heavy sales.'
  },
  ACCA: {
    displayName: 'Awareness → Action',
    label: 'ACCA (Awareness → Comprehension → Conviction → Action)',
    description: 'Focus on building understanding before asking for action. Best for: Complex products, educational content, technical audiences.'
  },
  '4Ps': {
    displayName: 'Picture → Push',
    label: '4Ps (Promise → Picture → Proof → Push)',
    description: 'Make a bold promise, visualize the outcome, prove it works, and push to action. Best for: High-converting ads, direct response.'
  },
  'Star-Story-Solution': {
    displayName: 'Story-Driven',
    label: 'Star-Story-Solution',
    description: 'Introduce a relatable star, tell their story, present your solution. Best for: Customer success stories, video scripts, podcasts.'
  },
  'Hook-Story-Offer': {
    displayName: 'Fast Conversion',
    label: 'Hook-Story-Offer',
    description: 'Grab attention fast, connect with a story, make an irresistible offer. Best for: Social media ads, short-form content, reels.'
  },
  PPP: {
    displayName: 'Problem → Promise → Proof',
    label: 'PPP (Problem → Promise → Proof)',
    description: 'Simple 3-step formula. Name the problem, make a promise, prove you can deliver. Best for: Quick posts, headlines, social proof.'
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
    description: "Strangers who don't know you yet. Focus on educational content, thought leadership, and brand awareness. Goal: Attract and inform without selling."
  },
  MOFU: {
    displayName: 'Warm Leads',
    emoji: '🌡️',
    acronym: 'MOFU - Middle of Funnel',
    description: 'People considering their options. Focus on comparison content, case studies, and differentiation. Goal: Build trust and demonstrate value.'
  },
  BOFU: {
    displayName: 'Hot Prospects',
    emoji: '🔥',
    acronym: 'BOFU - Bottom of Funnel',
    description: 'Ready-to-buy prospects. Focus on social proof, urgency, offers, and clear CTAs. Goal: Convert interest into action.'
  }
};

const PLATFORM_TOOLTIPS: Record<string, { label: string; description: string }> = {
  linkedin: {
    label: 'LinkedIn',
    description: 'Professional network. Best for: B2B, thought leadership, industry insights. Tone: Professional, value-driven. Optimal: 1,300 chars, weekday mornings.'
  },
  instagram: {
    label: 'Instagram',
    description: 'Visual-first platform. Best for: B2C, lifestyle brands, behind-the-scenes. Tone: Authentic, visual. Optimal: 125 chars, afternoons, weekends.'
  },
  twitter: {
    label: 'Twitter/X',
    description: 'Real-time conversations. Best for: News, hot takes, engagement. Tone: Concise, conversational. Optimal: 280 chars max, high frequency.'
  },
  facebook: {
    label: 'Facebook',
    description: 'Broad reach platform. Best for: Local businesses, community building, older demographics. Tone: Friendly, relatable. Optimal: 40-80 chars, evenings.'
  },
  tiktok: {
    label: 'TikTok',
    description: 'Short-form video. Best for: B2C, entertainment, trends. Tone: Fun, authentic, trendy. Optimal: 15-60 sec videos, trending sounds.'
  }
};

// Platform Icons - SVG components matching V4
const PlatformIcons: Record<Platform, React.FC> = {
  linkedin: () => (
    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  instagram: () => (
    <svg className="w-4 h-4 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitter: () => (
    <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: () => (
    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  tiktok: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
};

export interface ContentToolbarProps {
  selectedPlatforms: Set<Platform>;
  onPlatformChange: (platforms: Set<Platform>) => void;
  framework: PsychologyFramework;
  onFrameworkChange: (framework: PsychologyFramework) => void;
  funnelStage: FunnelStage;
  onFunnelStageChange: (stage: FunnelStage) => void;
  /** Optional recipe selection */
  recipes?: InsightRecipe[];
  selectedRecipe?: InsightRecipe | null;
  onSelectRecipe?: (recipe: InsightRecipe) => void;
  onClearRecipe?: () => void;
  /** Generate button */
  selectedInsightsCount?: number;
  onGenerate?: () => void;
  isGenerating?: boolean;
  /** B2B vs B2C mode */
  isB2B?: boolean;
}

// ============================================================================
// PLATFORM CONFIG - Simple list for Select All logic
// ============================================================================

const ALL_PLATFORMS: Platform[] = ['linkedin', 'instagram', 'twitter', 'facebook', 'tiktok'];

// ============================================================================
// MAIN COMPONENT - V4 Design with Dark Slate Dropdowns and Tooltips
// ============================================================================

export const ContentToolbar = memo(function ContentToolbar({
  selectedPlatforms,
  onPlatformChange,
  framework,
  onFrameworkChange,
  funnelStage,
  onFunnelStageChange,
  recipes = [],
  selectedRecipe,
  onSelectRecipe,
  onClearRecipe,
  selectedInsightsCount = 0,
  onGenerate,
  isGenerating = false,
  isB2B = true,
}: ContentToolbarProps) {
  const [recipeDropdownOpen, setRecipeDropdownOpen] = useState(false);
  const [frameworkDropdownOpen, setFrameworkDropdownOpen] = useState(false);
  const [funnelDropdownOpen, setFunnelDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);

  // Close other dropdowns when one opens
  const openDropdown = (dropdown: 'recipe' | 'framework' | 'funnel' | 'platform') => {
    setRecipeDropdownOpen(dropdown === 'recipe' ? !recipeDropdownOpen : false);
    setFrameworkDropdownOpen(dropdown === 'framework' ? !frameworkDropdownOpen : false);
    setFunnelDropdownOpen(dropdown === 'funnel' ? !funnelDropdownOpen : false);
    setPlatformDropdownOpen(dropdown === 'platform' ? !platformDropdownOpen : false);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        {/* Recipe Dropdown (Content Recipe) */}
        {recipes.length > 0 && onSelectRecipe && (
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
                  <p className="font-medium text-sm mb-1">What content do you want to create?</p>
                  <p className="text-xs text-gray-300">Recipes auto-select insights and configure framework + funnel for specific content goals.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <button
              onClick={() => openDropdown('recipe')}
              className="flex items-center justify-between w-44 h-8 px-3 text-sm bg-slate-800 border border-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm truncate flex items-center gap-1">
                {selectedRecipe && <Lock className="w-3 h-3 text-green-500" />}
                {selectedRecipe?.name || 'Select Recipe'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${recipeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Recipe Dropdown Menu */}
            {recipeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRecipeDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
                  {selectedRecipe && onClearRecipe && (
                    <button
                      onClick={() => { onClearRecipe(); setRecipeDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 border-b border-slate-600"
                    >
                      Clear Recipe
                    </button>
                  )}
                  {recipes.map((recipe) => (
                    <Tooltip key={recipe.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { onSelectRecipe(recipe); setRecipeDropdownOpen(false); }}
                          className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                            selectedRecipe?.id === recipe.id ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
                          }`}
                        >
                          <span className="text-sm text-white">{recipe.name}</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1">{recipe.description}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3 z-[60]">
                        <p className="font-medium text-sm mb-2">{recipe.name}</p>
                        <div className="space-y-1 text-xs text-gray-300">
                          <p><span className="text-gray-400">Framework:</span> {FRAMEWORK_TOOLTIPS[recipe.primaryFramework]?.displayName || recipe.primaryFramework}</p>
                          <p><span className="text-gray-400">Funnel Stage:</span> {FUNNEL_TOOLTIPS[recipe.targetFunnelStage]?.displayName || recipe.targetFunnelStage}</p>
                          {recipe.suggestedPlatforms && (
                            <p><span className="text-gray-400">Best for {isB2B ? 'B2B' : 'B2C'}:</span> {(isB2B ? recipe.suggestedPlatforms.b2b : recipe.suggestedPlatforms.b2c).map(p => PLATFORM_TOOLTIPS[p]?.label || p).join(', ')}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />

        {/* Content Goal (Framework) Dropdown */}
        <div className="flex flex-col gap-1 relative">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Content Goal
            </label>
            {selectedRecipe ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="w-3 h-3 text-green-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                  <p className="text-xs text-gray-300">Locked by {selectedRecipe.name} recipe. Clear recipe to change.</p>
                </TooltipContent>
              </Tooltip>
            ) : (
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
            onClick={() => { if (!selectedRecipe) openDropdown('framework'); }}
            className={`flex items-center justify-between w-44 h-8 px-3 text-sm rounded-md transition-colors ${
              selectedRecipe
                ? 'bg-slate-700 border border-green-600/50 text-green-100 cursor-not-allowed'
                : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-sm truncate flex items-center gap-1">
              {selectedRecipe && <Lock className="w-3 h-3 text-green-500" />}
              {FRAMEWORK_TOOLTIPS[framework]?.displayName || framework}
            </span>
            {!selectedRecipe && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${frameworkDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>

          {/* Framework Dropdown Menu */}
          {frameworkDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFrameworkDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-52 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {Object.entries(FRAMEWORK_TOOLTIPS).map(([key, { displayName, description }]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { onFrameworkChange(key as PsychologyFramework); setFrameworkDropdownOpen(false); }}
                          className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                            framework === key ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
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
                <div className="flex justify-center py-1 border-t border-slate-700 bg-slate-800/90">
                  <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Audience (Funnel Stage) Dropdown */}
        <div className="flex flex-col gap-1 relative">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Audience
            </label>
            {selectedRecipe ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="w-3 h-3 text-green-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                  <p className="text-xs text-gray-300">Locked by {selectedRecipe.name} recipe. Clear recipe to change.</p>
                </TooltipContent>
              </Tooltip>
            ) : (
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
            onClick={() => { if (!selectedRecipe) openDropdown('funnel'); }}
            className={`flex items-center justify-between w-44 h-8 px-3 text-sm rounded-md transition-colors ${
              selectedRecipe
                ? 'bg-slate-700 border border-green-600/50 text-green-100 cursor-not-allowed'
                : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-sm flex items-center gap-1">
              {selectedRecipe && <Lock className="w-3 h-3 text-green-500" />}
              {FUNNEL_TOOLTIPS[funnelStage]?.emoji} {FUNNEL_TOOLTIPS[funnelStage]?.displayName || funnelStage}
            </span>
            {!selectedRecipe && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${funnelDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>

          {/* Funnel Dropdown Menu */}
          {funnelDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFunnelDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                {Object.entries(FUNNEL_TOOLTIPS).map(([key, { displayName, emoji, acronym, description }]) => (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { onFunnelStageChange(key as FunnelStage); setFunnelDropdownOpen(false); }}
                        className={`w-full flex flex-col items-start px-3 py-2 hover:bg-slate-700 cursor-pointer text-left ${
                          funnelStage === key ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
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
            </>
          )}
        </div>

        {/* Platform Multi-Select Dropdown */}
        <div className="flex flex-col gap-1 relative">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Platforms
            </label>
            {selectedRecipe ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-slate-900 border-slate-700 text-white p-3">
                  <p className="text-xs text-gray-300">Recommended by {selectedRecipe.name} recipe for {isB2B ? 'B2B' : 'B2C'}. You can change these selections.</p>
                </TooltipContent>
              </Tooltip>
            ) : (
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
            onClick={() => openDropdown('platform')}
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
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPlatformDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-50">
                {/* Select All */}
                <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-600">
                  <Checkbox
                    checked={selectedPlatforms.size === 5}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onPlatformChange(new Set(ALL_PLATFORMS));
                      } else {
                        onPlatformChange(new Set(['linkedin']));
                      }
                    }}
                    className="h-4 w-4 border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <span className="text-sm text-white font-medium">Select All</span>
                </label>

                {/* Individual Platforms */}
                {ALL_PLATFORMS.map((platform) => {
                  const Icon = PlatformIcons[platform];
                  const isRecommended = selectedRecipe?.suggestedPlatforms && (
                    isB2B
                      ? selectedRecipe.suggestedPlatforms.b2b.includes(platform)
                      : selectedRecipe.suggestedPlatforms.b2c.includes(platform)
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
                              onPlatformChange(newPlatforms);
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
                          <p className="text-xs text-yellow-400 mt-1">Recommended for {selectedRecipe?.name}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Generate Button */}
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={selectedInsightsCount === 0 || isGenerating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedInsightsCount === 0 || isGenerating
                ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isGenerating ? (
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
        )}

        {/* Right side: insights count */}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedInsightsCount} insights selected
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

export default ContentToolbar;
