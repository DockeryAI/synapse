/**
 * V4 Content Generation Panel
 *
 * Main UI component for V4 Content Engine.
 * Provides both Easy Mode (one-click) and Power Mode (full control) interfaces.
 *
 * Created: 2025-11-27
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Settings2,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart3,
  Filter,
  AlertCircle
} from 'lucide-react';

import { useV4ContentGeneration } from '@/hooks/useV4ContentGeneration';
import { V4PowerModePanel } from './V4PowerModePanel';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  GeneratedContent,
  ContentPillar,
  PsychologyFramework,
  FunnelStage,
  CampaignTemplateType,
  ContentMixRule
} from '@/services/v4/types';
import { campaignTemplates } from '@/services/v4';

// ============================================================================
// PROPS
// ============================================================================

interface V4ContentGenerationPanelProps {
  uvp: CompleteUVP;
  brandId?: string;
  onContentGenerated?: (content: GeneratedContent[]) => void;
  onSaveToCalendar?: (content: GeneratedContent) => void;
}

// ============================================================================
// SCORE BADGE COMPONENT
// ============================================================================

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 85) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    if (score >= 70) return 'bg-green-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    return 'bg-gray-400 text-white';
  };

  const getLabel = () => {
    if (score >= 85) return 'Holy Shit';
    if (score >= 70) return 'Great';
    if (score >= 50) return 'Good';
    return 'Meh';
  };

  return (
    <Badge className={`${getColor()} font-bold`}>
      {score}/100 - {getLabel()}
    </Badge>
  );
}

// ============================================================================
// CONTENT ANALYTICS PANEL
// ============================================================================

function ContentAnalyticsPanel({ content }: { content: GeneratedContent[] }) {
  if (content.length === 0) return null;

  // Calculate funnel distribution
  const funnelCounts = { TOFU: 0, MOFU: 0, BOFU: 0 };
  const mixCounts: Record<string, number> = {};
  const frameworkCounts: Record<string, number> = {};

  content.forEach(c => {
    // Funnel
    funnelCounts[c.funnelStage]++;
    // Mix
    mixCounts[c.mixCategory] = (mixCounts[c.mixCategory] || 0) + 1;
    // Framework
    frameworkCounts[c.psychology.framework] = (frameworkCounts[c.psychology.framework] || 0) + 1;
  });

  const total = content.length;
  const funnelPercentages = {
    TOFU: Math.round((funnelCounts.TOFU / total) * 100),
    MOFU: Math.round((funnelCounts.MOFU / total) * 100),
    BOFU: Math.round((funnelCounts.BOFU / total) * 100),
  };

  // Ideal ratios
  const idealFunnel = { TOFU: 60, MOFU: 30, BOFU: 10 };

  // Mix category colors and labels
  const mixColors: Record<string, string> = {
    value: 'bg-blue-500',
    curated: 'bg-cyan-500',
    promo: 'bg-orange-500',
    personal: 'bg-pink-500',
    soft_sell: 'bg-yellow-500',
    hard_sell: 'bg-red-500',
  };

  const mixLabels: Record<string, string> = {
    value: 'Value',
    curated: 'Curated',
    promo: 'Promo',
    personal: 'Personal',
    soft_sell: 'Soft Sell',
    hard_sell: 'Hard Sell',
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          Content Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funnel Distribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Funnel Balance</span>
            <span className="text-xs text-gray-400">Target: 60/30/10</span>
          </div>
          <div className="space-y-2">
            {(['TOFU', 'MOFU', 'BOFU'] as const).map((stage) => {
              const actual = funnelPercentages[stage];
              const ideal = idealFunnel[stage];
              const diff = actual - ideal;
              const isBalanced = Math.abs(diff) <= 10;

              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="text-xs w-12 font-medium">{stage}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stage === 'TOFU' ? 'bg-green-500' :
                        stage === 'MOFU' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${actual}%` }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right">{actual}%</span>
                  <Badge
                    variant={isBalanced ? 'default' : 'destructive'}
                    className="text-[10px] h-4 px-1"
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Content Mix Distribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Content Mix</span>
            <span className="text-xs text-gray-400">{total} posts</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(mixCounts).map(([category, count]) => (
              <Badge
                key={category}
                variant="outline"
                className="text-[10px]"
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${mixColors[category] || 'bg-gray-400'}`} />
                {mixLabels[category] || category}: {count}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Framework Usage */}
        <div>
          <span className="text-xs font-medium text-gray-600 mb-2 block">Framework Usage</span>
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(frameworkCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([framework, count]) => (
                <div
                  key={framework}
                  className="text-center p-1 bg-white dark:bg-slate-700 rounded text-[10px]"
                >
                  <div className="font-bold text-purple-600">{count}</div>
                  <div className="text-gray-500 truncate">{framework}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(content.reduce((sum, c) => sum + c.score.total, 0) / total)}
            </div>
            <div className="text-[10px] text-gray-500">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {content.filter(c => c.score.total >= 80).length}
            </div>
            <div className="text-[10px] text-gray-500">High Performers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Object.keys(frameworkCounts).length}
            </div>
            <div className="text-[10px] text-gray-500">Frameworks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CAMPAIGN TEMPLATE SELECTOR
// ============================================================================

function CampaignTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onLaunchCampaign,
  isGenerating
}: {
  selectedTemplate: CampaignTemplateType | null;
  onSelectTemplate: (template: CampaignTemplateType) => void;
  onLaunchCampaign: (template: CampaignTemplateType) => void;
  isGenerating: boolean;
}) {
  const templates = campaignTemplates.getAll();

  const templateIcons: Record<CampaignTemplateType, string> = {
    product_launch: '🚀',
    evergreen: '🌲',
    awareness_burst: '💥',
    authority_builder: '👑',
    engagement_drive: '💬',
  };

  const templateColors: Record<CampaignTemplateType, string> = {
    product_launch: 'from-orange-500 to-red-500',
    evergreen: 'from-green-500 to-emerald-500',
    awareness_burst: 'from-purple-500 to-pink-500',
    authority_builder: 'from-blue-500 to-indigo-500',
    engagement_drive: 'from-yellow-500 to-amber-500',
  };

  return (
    <Card className="mt-6 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="w-5 h-5 text-purple-500" />
          Campaign Templates
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          Choose a pre-built campaign structure for maximum impact
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => (
            <button
              key={template.type}
              onClick={() => onSelectTemplate(template.type)}
              className={`
                p-4 rounded-xl text-left transition-all border-2 shadow-sm hover:shadow-md
                ${selectedTemplate === template.type
                  ? 'border-purple-500 bg-white dark:bg-slate-800 shadow-lg ring-2 ring-purple-500/20'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-500'}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{templateIcons[template.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{template.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <span>{template.durationWeeks} weeks</span>
                    <span>•</span>
                    <span>{template.contentMixRule}</span>
                  </div>
                </div>
              </div>
              {selectedTemplate === template.type && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">
                  {template.description}
                </p>
              )}
            </button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="pt-2">
            <Button
              onClick={() => onLaunchCampaign(selectedTemplate)}
              disabled={isGenerating}
              className={`w-full h-12 bg-gradient-to-r ${templateColors[selectedTemplate]} hover:opacity-90`}
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <span className="text-lg mr-2">{templateIcons[selectedTemplate]}</span>
              )}
              Launch {campaignTemplates.get(selectedTemplate).name}
            </Button>

            {/* Show weekly structure preview */}
            <div className="mt-3 p-2 bg-white rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Weekly Structure:</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {campaignTemplates.get(selectedTemplate).weeklyStructure.map((week) => (
                  <div
                    key={week.week}
                    className="flex-shrink-0 px-2 py-1 bg-gray-50 rounded text-[10px] text-center"
                  >
                    <div className="font-bold">W{week.week}</div>
                    <div className="text-gray-500 truncate max-w-[60px]">{week.theme}</div>
                    <Badge variant="outline" className="text-[8px] mt-1">
                      {week.funnelStage}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTENT CARD COMPONENT
// ============================================================================

function ContentCard({
  content,
  onRegenerate,
  onCopy,
  onSave,
  isRegenerating
}: {
  content: GeneratedContent;
  onRegenerate: () => void;
  onCopy: () => void;
  onSave?: () => void;
  isRegenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    const fullText = [content.hook, content.body, content.cta].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 hover:border-purple-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2">{content.headline}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <ScoreBadge score={content.score.total} />
              <Badge variant="outline" className="text-xs">
                {content.psychology.framework}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {content.funnelStage}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {content.mixCategory}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Hook */}
        <div>
          <p className="text-sm font-medium text-purple-600 mb-1">Hook</p>
          <p className="text-sm">{content.hook}</p>
        </div>

        {/* Body (collapsible) */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Body
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded && (
            <p className="text-sm mt-1 whitespace-pre-wrap">{content.body}</p>
          )}
        </div>

        {/* CTA */}
        <div>
          <p className="text-sm font-medium text-green-600 mb-1">Call to Action</p>
          <p className="text-sm">{content.cta}</p>
        </div>

        {/* Hashtags */}
        {content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.hashtags.map((tag, i) => (
              <span key={i} className="text-xs text-blue-600">#{tag}</span>
            ))}
          </div>
        )}

        <Separator />

        {/* Score breakdown */}
        <div className="grid grid-cols-5 gap-1 text-xs">
          <div className="text-center">
            <div className="font-bold text-purple-600">{content.score.breakdown.unexpectedness}</div>
            <div className="text-gray-500">Unexpected</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600">{content.score.breakdown.truthfulness}</div>
            <div className="text-gray-500">Truthful</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{content.score.breakdown.actionability}</div>
            <div className="text-gray-500">Actionable</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-600">{content.score.breakdown.uniqueness}</div>
            <div className="text-gray-500">Unique</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-pink-600">{content.score.breakdown.virality}</div>
            <div className="text-gray-500">Viral</div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex-1"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={onSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function V4ContentGenerationPanel({
  uvp,
  brandId,
  onContentGenerated,
  onSaveToCalendar
}: V4ContentGenerationPanelProps) {
  const [mode, setMode] = useState<'easy' | 'power'>('easy');
  const [platform, setPlatform] = useState<'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok'>('linkedin');
  const [selectedFramework, setSelectedFramework] = useState<PsychologyFramework>('AIDA');
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelStage>('TOFU');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplateType | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const {
    isGenerating,
    error,
    generatedContent,
    pillars,
    generateQuickPost,
    generateFullCampaign,
    generateWithControl,
    generateABVariations,
    getFrameworkOptions,
    regenerateContent,
    clearError,
    clearContent
  } = useV4ContentGeneration({ uvp, mode });

  // Notify parent when content is generated
  useEffect(() => {
    if (generatedContent.length > 0 && onContentGenerated) {
      onContentGenerated(generatedContent);
    }
  }, [generatedContent, onContentGenerated]);

  // Handlers
  const handleQuickPost = async () => {
    try {
      await generateQuickPost(platform);
    } catch (err) {
      console.error('Quick post failed:', err);
    }
  };

  const handleFullCampaign = async () => {
    try {
      await generateFullCampaign({ platform, weeks: 4, postsPerWeek: 5 });
    } catch (err) {
      console.error('Campaign generation failed:', err);
    }
  };

  const handleLaunchCampaign = async (template: CampaignTemplateType) => {
    try {
      const templateConfig = campaignTemplates.get(template);
      await generateFullCampaign({
        platform,
        weeks: templateConfig.durationWeeks,
        postsPerWeek: 5,
      });
    } catch (err) {
      console.error('Template campaign generation failed:', err);
    }
  };

  const handlePowerGenerate = async () => {
    try {
      await generateWithControl({
        platform,
        framework: selectedFramework,
        funnelStage: selectedFunnel
      });
    } catch (err) {
      console.error('Power mode generation failed:', err);
    }
  };

  const handleABTest = async () => {
    try {
      await generateABVariations(['AIDA', 'PAS', 'CuriosityGap', 'PatternInterrupt']);
    } catch (err) {
      console.error('A/B test generation failed:', err);
    }
  };

  const handleRegenerate = async (content: GeneratedContent) => {
    setRegeneratingId(content.id);
    try {
      await regenerateContent(content);
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const frameworks = getFrameworkOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-6 h-6 text-purple-500" />
            V4 Content Engine
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Generate high-impact content powered by your UVP
          </p>
        </div>

        {generatedContent.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearContent} className="text-gray-700 dark:text-gray-300">
            Clear All
          </Button>
        )}
      </div>

      {/* Error display - Enhanced with helpful recovery options */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">Generation Failed</h4>
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearError}
                    className="text-red-600 border-red-200 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearError();
                      // Retry with same settings
                      if (mode === 'easy') handleQuickPost();
                      else handlePowerGenerate();
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-100"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
                <p className="text-xs text-red-400 mt-2">
                  Tip: If errors persist, try a different platform or framework.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'easy' | 'power')}>
        <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-gray-200 dark:bg-slate-800 rounded-xl">
          <TabsTrigger
            value="easy"
            className="flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Zap className="w-4 h-4" />
            Easy Mode
          </TabsTrigger>
          <TabsTrigger
            value="power"
            className="flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Settings2 className="w-4 h-4" />
            Power Mode
          </TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="mt-6">
          <Card className="border border-gray-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                One-Click Content Generation
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Let V4 automatically create optimized content based on your UVP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform:</label>
                <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                  <SelectTrigger className="w-44 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleQuickPost}
                  disabled={isGenerating}
                  className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <Zap className="w-7 h-7" />
                  )}
                  <span className="text-base">Quick Post</span>
                </button>

                <button
                  onClick={handleFullCampaign}
                  disabled={isGenerating}
                  className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <Calendar className="w-7 h-7" />
                  )}
                  <span className="text-base">4-Week Campaign</span>
                </button>
              </div>

              {/* Pillars preview */}
              {pillars.length > 0 && (
                <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Your Content Pillars:</p>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map((pillar) => (
                      <Badge key={pillar.id} variant="secondary" className="text-sm px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-slate-600 font-medium">
                        {pillar.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Templates Section */}
          <CampaignTemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onLaunchCampaign={handleLaunchCampaign}
            isGenerating={isGenerating}
          />
        </TabsContent>

        {/* Power Mode - Full integrated panel with V3 content mixer UI */}
        <TabsContent value="power" className="mt-6 -mx-4">
          <div className="h-[700px] border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <V4PowerModePanel
              uvp={uvp}
              brandId={brandId}
              onContentGenerated={(content) => {
                // Notify parent of new content
                onContentGenerated?.([content]);
              }}
              onSaveToCalendar={onSaveToCalendar}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Loading state */}
      {isGenerating && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-purple-600 font-medium">Generating content with V4 Engine...</p>
            <p className="text-purple-400 text-sm mt-1">
              Applying psychology frameworks and scoring...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated content */}
      {generatedContent.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Generated Content ({generatedContent.length})
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Avg Score:</span>
              <ScoreBadge
                score={Math.round(
                  generatedContent.reduce((sum, c) => sum + c.score.total, 0) /
                    generatedContent.length
                )}
              />
            </div>
          </div>

          {/* Content Analytics Panel - Shows Mix/Funnel balance */}
          <ContentAnalyticsPanel content={generatedContent} />

          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4">
              {generatedContent.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onRegenerate={() => handleRegenerate(content)}
                  onCopy={() => console.log('Copied:', content.id)}
                  onSave={onSaveToCalendar ? () => onSaveToCalendar(content) : undefined}
                  isRegenerating={regeneratingId === content.id}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default V4ContentGenerationPanel;
