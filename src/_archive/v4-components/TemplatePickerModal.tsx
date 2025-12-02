/**
 * Template Picker Modal
 *
 * Modal for browsing and selecting industry-specific templates.
 * Shows hooks library, content templates, and campaign templates
 * organized by category with preview and selection.
 *
 * Created: 2025-11-30
 * Phase: Industry Profile 2.0 Integration - Phase 3
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  MessageSquare,
  FileText,
  Zap,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Linkedin,
  Instagram,
  Twitter,
  Video,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import type { EnhancedIndustryProfile } from '@/types/industry-profile.types';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import {
  templateAlignmentScorerService,
  type AlignmentScore
} from '@/services/industry/template-alignment-scorer.service';

// =============================================================================
// TYPES
// =============================================================================

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EnhancedIndustryProfile | null;
  uvp?: CompleteUVP | null;
  onSelectTemplate: (template: SelectedTemplate) => void;
}

export interface SelectedTemplate {
  type: 'hook' | 'headline' | 'content' | 'campaign';
  category?: string;
  platform?: string;
  template: string;
  context?: string;
  fullTemplate?: {
    hook?: string;
    body?: string;
    cta?: string;
  };
}

type TabType = 'hooks' | 'headlines' | 'content' | 'campaigns';

interface HookCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  hooks: string[];
}

// =============================================================================
// HOOK CATEGORY CONFIG
// =============================================================================

const HOOK_CATEGORIES: { id: string; label: string; icon: React.ElementType; color: string; key: keyof EnhancedIndustryProfile['hook_library'] }[] = [
  { id: 'number', label: 'Number Hooks', icon: Zap, color: 'text-blue-500', key: 'number_hooks' },
  { id: 'question', label: 'Question Hooks', icon: HelpCircle, color: 'text-purple-500', key: 'question_hooks' },
  { id: 'story', label: 'Story Hooks', icon: BookOpen, color: 'text-green-500', key: 'story_hooks' },
  { id: 'fear', label: 'Fear Hooks', icon: AlertTriangle, color: 'text-red-500', key: 'fear_hooks' },
  { id: 'howto', label: 'How-To Hooks', icon: Lightbulb, color: 'text-amber-500', key: 'howto_hooks' },
];

const PLATFORM_CONFIG = {
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  twitter: { icon: Twitter, label: 'Twitter/X', color: 'text-sky-500' },
  tiktok: { icon: Video, label: 'TikTok', color: 'text-black dark:text-white' },
};

const CAMPAIGN_TYPES = [
  { id: 'awareness', label: 'Awareness Campaign', icon: Target, color: 'text-purple-500', description: '4 weeks to build brand recognition' },
  { id: 'engagement', label: 'Engagement Campaign', icon: Users, color: 'text-blue-500', description: '3 weeks to grow community' },
  { id: 'conversion', label: 'Conversion Campaign', icon: TrendingUp, color: 'text-green-500', description: '2 weeks to drive sales' },
];

// =============================================================================
// TEMPLATE ITEM COMPONENT
// =============================================================================

interface TemplateItemProps {
  template: string;
  context?: string;
  alignmentScore?: AlignmentScore | null;
  onSelect: () => void;
  onCopy: () => void;
}

// Alignment score badge component
const AlignmentBadge = memo(function AlignmentBadge({ score }: { score: AlignmentScore }) {
  const percentage = Math.round(score.overall * 100);
  let bgColor: string;
  let textColor: string;

  if (score.confidenceLevel === 'high') {
    bgColor = 'bg-green-100 dark:bg-green-900/30';
    textColor = 'text-green-700 dark:text-green-300';
  } else if (score.confidenceLevel === 'medium') {
    bgColor = 'bg-amber-100 dark:bg-amber-900/30';
    textColor = 'text-amber-700 dark:text-amber-300';
  } else {
    bgColor = 'bg-red-100 dark:bg-red-900/30';
    textColor = 'text-red-700 dark:text-red-300';
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${bgColor} ${textColor}`}>
      <span className="text-xs font-medium">{percentage}%</span>
      {score.confidenceLevel === 'high' && <Check className="w-3 h-3" />}
      {score.needsRefinement && (
        <span className="text-[10px] opacity-70">needs refine</span>
      )}
    </div>
  );
});

const TemplateItem = memo(function TemplateItem({ template, context, alignmentScore, onSelect, onCopy }: TemplateItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  }, [template, onCopy]);

  return (
    <div
      onClick={onSelect}
      className="group p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
          "{template}"
        </p>
        {alignmentScore && <AlignmentBadge score={alignmentScore} />}
      </div>
      {context && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {context}
        </p>
      )}
      {alignmentScore?.refinementHints && alignmentScore.refinementHints.length > 0 && alignmentScore.needsRefinement && (
        <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
          Tip: {alignmentScore.refinementHints[0]}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
        >
          <Sparkles className="w-3 h-3" />
          Use Template
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// HOOKS TAB
// =============================================================================

interface HooksTabProps {
  profile: EnhancedIndustryProfile;
  uvp?: CompleteUVP | null;
  onSelect: (template: SelectedTemplate) => void;
  searchQuery: string;
}

const HooksTab = memo(function HooksTab({ profile, uvp, onSelect, searchQuery }: HooksTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('number');

  // Score hooks against UVP
  const hookScores = useMemo(() => {
    if (!uvp) return new Map<string, AlignmentScore>();

    const scores = new Map<string, AlignmentScore>();
    const signals = templateAlignmentScorerService.extractUVPSignals(uvp);

    Object.entries(profile.hook_library || {}).forEach(([, hooks]) => {
      if (Array.isArray(hooks)) {
        hooks.forEach(hook => {
          const score = templateAlignmentScorerService.scoreTemplate(hook, signals, 'hook');
          scores.set(hook, score);
        });
      }
    });

    return scores;
  }, [profile.hook_library, uvp]);

  const categories = useMemo(() => {
    return HOOK_CATEGORIES.map(cat => ({
      ...cat,
      hooks: (profile.hook_library[cat.key] || []).filter(
        hook => !searchQuery || hook.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.hooks.length > 0);
  }, [profile.hook_library, searchQuery]);

  return (
    <div className="space-y-3">
      {categories.map(category => {
        const Icon = category.icon;
        const isExpanded = expandedCategory === category.id;

        return (
          <div key={category.id} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${category.color}`} />
                <span className="font-medium text-gray-800 dark:text-gray-200">{category.label}</span>
                <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-600 rounded-full">
                  {category.hooks.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                    {category.hooks.map((hook, idx) => (
                      <TemplateItem
                        key={idx}
                        template={hook}
                        alignmentScore={hookScores.get(hook)}
                        onSelect={() => onSelect({
                          type: 'hook',
                          category: category.id,
                          template: hook
                        })}
                        onCopy={() => {}}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hooks found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
});

// =============================================================================
// HEADLINES TAB
// =============================================================================

interface HeadlinesTabProps {
  profile: EnhancedIndustryProfile;
  onSelect: (template: SelectedTemplate) => void;
  searchQuery: string;
}

const HeadlinesTab = memo(function HeadlinesTab({ profile, onSelect, searchQuery }: HeadlinesTabProps) {
  const headlines = useMemo(() => {
    return profile.headline_templates.filter(
      h => !searchQuery ||
        h.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.context.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profile.headline_templates, searchQuery]);

  return (
    <div className="space-y-3">
      {headlines.map((headline, idx) => (
        <TemplateItem
          key={idx}
          template={headline.template}
          context={headline.context}
          onSelect={() => onSelect({
            type: 'headline',
            template: headline.template,
            context: headline.context
          })}
          onCopy={() => {}}
        />
      ))}

      {headlines.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No headlines found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
});

// =============================================================================
// CONTENT TEMPLATES TAB
// =============================================================================

interface ContentTabProps {
  profile: EnhancedIndustryProfile;
  onSelect: (template: SelectedTemplate) => void;
  searchQuery: string;
}

const ContentTab = memo(function ContentTab({ profile, onSelect, searchQuery }: ContentTabProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'instagram' | 'tiktok' | 'twitter'>('linkedin');

  const templates = useMemo(() => {
    const platformTemplates = profile.content_templates?.[selectedPlatform];
    if (!platformTemplates) return [];

    return Object.entries(platformTemplates)
      .filter(([_, template]) => template && typeof template === 'object')
      .map(([type, template]) => ({
        type,
        template: template as { hook?: string; body?: string; cta?: string }
      }))
      .filter(({ template }) =>
        !searchQuery ||
        (template.hook?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (template.body?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [profile.content_templates, selectedPlatform, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-700">
        {(Object.keys(PLATFORM_CONFIG) as Array<keyof typeof PLATFORM_CONFIG>).map(platform => {
          const config = PLATFORM_CONFIG[platform];
          const Icon = config.icon;
          const hasTemplates = !!profile.content_templates?.[platform];

          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              disabled={!hasTemplates}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                selectedPlatform === platform
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : hasTemplates
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{config.label}</span>
              {!hasTemplates && <span className="text-xs">(none)</span>}
            </button>
          );
        })}
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {templates.map(({ type, template }) => (
          <div
            key={type}
            onClick={() => onSelect({
              type: 'content',
              platform: selectedPlatform,
              category: type,
              template: template.hook || '',
              fullTemplate: template
            })}
            className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                {type.replace('_', ' ')}
              </span>
            </div>

            {template.hook && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hook:</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">"{template.hook}"</p>
              </div>
            )}

            {template.body && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Body:</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{template.body}</p>
              </div>
            )}

            {template.cta && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CTA:</p>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{template.cta}</p>
              </div>
            )}
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No {selectedPlatform} templates available
          </div>
        )}
      </div>
    </div>
  );
});

// =============================================================================
// CAMPAIGNS TAB
// =============================================================================

interface CampaignsTabProps {
  profile: EnhancedIndustryProfile;
  onSelect: (template: SelectedTemplate) => void;
}

const CampaignsTab = memo(function CampaignsTab({ profile, onSelect }: CampaignsTabProps) {
  const campaignTemplates = profile.campaign_templates;

  return (
    <div className="space-y-4">
      {CAMPAIGN_TYPES.map(campaign => {
        const Icon = campaign.icon;
        const templates = campaignTemplates?.[campaign.id as keyof typeof campaignTemplates];
        const samplePosts = (templates as any)?.sample_posts || [];

        return (
          <div
            key={campaign.id}
            onClick={() => onSelect({
              type: 'campaign',
              category: campaign.id,
              template: campaign.label,
              context: campaign.description
            })}
            className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${campaign.color}`} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{campaign.label}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.description}</p>
              </div>
            </div>

            {samplePosts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sample posts:</p>
                <div className="space-y-1">
                  {samplePosts.slice(0, 2).map((post: any, idx: number) => (
                    <p key={idx} className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                      • {typeof post === 'string' ? post : post.hook || post.content}
                    </p>
                  ))}
                  {samplePosts.length > 2 && (
                    <p className="text-xs text-gray-400">+{samplePosts.length - 2} more posts</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// =============================================================================
// MAIN MODAL COMPONENT
// =============================================================================

export const TemplatePickerModal = memo(function TemplatePickerModal({
  isOpen,
  onClose,
  profile,
  uvp,
  onSelectTemplate
}: TemplatePickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hooks');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = useCallback((template: SelectedTemplate) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'hooks', label: 'Hooks', icon: Zap },
    { id: 'headlines', label: 'Headlines', icon: MessageSquare },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Target },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Industry Templates
                </h2>
                {profile && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {profile.industry_name} • {profile.category}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!profile ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No industry profile loaded</p>
                  <p className="text-sm mt-2">Select a brand with a matching industry to see templates</p>
                </div>
              ) : (
                <>
                  {activeTab === 'hooks' && (
                    <HooksTab profile={profile} uvp={uvp} onSelect={handleSelect} searchQuery={searchQuery} />
                  )}
                  {activeTab === 'headlines' && (
                    <HeadlinesTab profile={profile} onSelect={handleSelect} searchQuery={searchQuery} />
                  )}
                  {activeTab === 'content' && (
                    <ContentTab profile={profile} onSelect={handleSelect} searchQuery={searchQuery} />
                  )}
                  {activeTab === 'campaigns' && (
                    <CampaignsTab profile={profile} onSelect={handleSelect} />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default TemplatePickerModal;
