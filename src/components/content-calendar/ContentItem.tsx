/**
 * ContentItem Component
 * Displays a content calendar item with preview, platform, status, and actions
 * Tasks 306-315
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Edit,
  Trash2,
  Copy,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  RefreshCw,
  Eye as ViewIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { ContentItem as ContentItemType, Platform } from '@/types/content-calendar.types';
import { VariantModal } from './VariantModal';
import { RegenerationModal } from './RegenerationModal';
import { ProvenanceModal } from './ProvenanceModal';
import { QualityRating, QualityBadge } from './QualityRating';
import type {
  ABTestGroup,
  RegenerationResult,
  ContentSection,
  ContentProvenance,
  SynapseContent,
  BusinessProfile,
} from '@/types/synapse/synapseContent.types';
import type { BreakthroughInsight } from '@/types/synapse/breakthrough.types';
import { VariantGenerator } from '@/services/synapse/generation/VariantGenerator';
import { SectionRegenerator } from '@/services/synapse/generation/SectionRegenerator';

interface ContentItemProps {
  item: ContentItemType;
  onEdit?: (item: ContentItemType) => void;
  onDelete?: (item: ContentItemType) => void;
  onDuplicate?: (item: ContentItemType) => void;
  onUpdate?: (item: ContentItemType) => void;
  onSchedule?: (item: ContentItemType, scheduledTime: string) => void;
  compact?: boolean;
}

/**
 * Platform icon components
 */
const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  tiktok: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  email: <Mail className="w-4 h-4" />,
  blog: <FileText className="w-4 h-4" />,
};

/**
 * Platform colors
 */
const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'bg-pink-500 text-white',
  twitter: 'bg-blue-400 text-white',
  linkedin: 'bg-blue-700 text-white',
  facebook: 'bg-blue-600 text-white',
  tiktok: 'bg-black text-white',
  email: 'bg-red-500 text-white',
  blog: 'bg-green-600 text-white',
};

/**
 * Status badge colors
 */
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  scheduled: 'bg-orange-100 text-orange-800 border-orange-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

export function ContentItem({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdate,
  onSchedule,
  compact = false,
}: ContentItemProps) {
  // State for modals
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [regenerationModalOpen, setRegenerationModalOpen] = useState(false);
  const [provenanceModalOpen, setProvenanceModalOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // State for scheduling
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // State for generation
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variants, setVariants] = useState<ABTestGroup | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<ContentSection | null>(null);
  const [regenerationResult, setRegenerationResult] = useState<RegenerationResult | null>(null);

  // Generators
  const variantGenerator = new VariantGenerator();
  const sectionRegenerator = new SectionRegenerator();
  /**
   * Format date/time for display
   */
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * Handle scheduling
   */
  const handleSchedule = () => {
    if (!onSchedule) return;

    // Set default to tomorrow at 10am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);
    setScheduledDateTime(item.scheduled_time?.slice(0, 16) || defaultDateTime);
    setScheduleDialogOpen(true);
  };

  /**
   * Confirm scheduling
   */
  const confirmSchedule = () => {
    if (!onSchedule || !scheduledDateTime) return;
    onSchedule(item, new Date(scheduledDateTime).toISOString());
    setScheduleDialogOpen(false);
  };

  /**
   * Get content preview
   */
  const getContentPreview = () => {
    const maxLength = compact ? 80 : 150;
    if (item.content_text.length <= maxLength) {
      return item.content_text;
    }
    return item.content_text.substring(0, maxLength) + '...';
  };

  /**
   * Get intelligence badge icon
   */
  const getIntelligenceBadgeIcon = (badge: string) => {
    if (badge.toLowerCase().includes('synapse')) return '🧠';
    if (badge.toLowerCase().includes('data')) return '📊';
    if (badge.toLowerCase().includes('high-performing')) return '🎯';
    return '✨';
  };

  /**
   * Generate A/B variants
   */
  const handleGenerateVariants = async () => {
    setGeneratingVariants(true);
    setVariantModalOpen(true);

    try {
      // Create mock SynapseContent from ContentItem
      // Note: This is a simplified version - in production you'd have the full SynapseContent
      const mockContent: SynapseContent = {
        id: item.id,
        insightId: 'mock-insight',
        format: 'hook-post',
        content: {
          headline: extractSection(item.content_text, 'headline') || item.content_text.substring(0, 100),
          hook: extractSection(item.content_text, 'hook') || '',
          body: extractSection(item.content_text, 'body') || item.content_text,
          cta: extractSection(item.content_text, 'cta') || ''
        },
        psychology: {
          principle: 'Curiosity Gap',
          trigger: { type: 'curiosity', strength: 0.8 },
          persuasionTechnique: 'Pattern Interrupt',
          expectedReaction: 'High engagement'
        },
        optimization: {
          powerWords: [],
          framingDevice: 'Standard',
          narrativeStructure: 'Hook → Story → Lesson',
          pacing: 'medium'
        },
        meta: {
          platform: [item.platform as any],
          targetAudience: 'General',
          tone: 'authoritative' as const
        },
        prediction: {
          engagementScore: 0.8,
          viralPotential: 0.6,
          leadGeneration: 0.7,
          brandImpact: 'positive',
          confidenceLevel: 0.8
        },
        metadata: {
          generatedAt: new Date(),
          model: 'claude-opus-4.1',
          iterationCount: 1
        }
      };

      const mockBusiness: BusinessProfile = {
        name: 'Business',
        industry: 'General',
        targetAudience: 'Professionals',
        brandVoice: 'professional',
        contentGoals: ['engagement']
      };

      const result = await variantGenerator.generateVariants(mockContent, mockBusiness);
      setVariants(result);
    } catch (error) {
      console.error('Failed to generate variants:', error);
      alert('Failed to generate variants. Please try again.');
    } finally {
      setGeneratingVariants(false);
    }
  };

  /**
   * Handle selecting a variant
   */
  const handleSelectVariant = (variant: SynapseContent) => {
    if (onUpdate) {
      const updatedItem: ContentItemType = {
        ...item,
        content_text: `${variant.content.headline}\n\n${variant.content.hook}\n\n${variant.content.body}\n\n${variant.content.cta}`
      };
      onUpdate(updatedItem);
    }
  };

  /**
   * Handle section regeneration
   */
  const handleRegenerateSection = async (section: ContentSection) => {
    setRegeneratingSection(section);
    setRegenerationModalOpen(true);

    try {
      // Create mock data for regeneration
      const mockContent: SynapseContent = {
        id: item.id,
        insightId: 'mock-insight',
        format: 'hook-post',
        content: {
          headline: extractSection(item.content_text, 'headline') || item.content_text.substring(0, 100),
          hook: extractSection(item.content_text, 'hook') || '',
          body: extractSection(item.content_text, 'body') || item.content_text,
          cta: extractSection(item.content_text, 'cta') || ''
        },
        psychology: {
          principle: 'Curiosity Gap',
          trigger: { type: 'curiosity', strength: 0.8 },
          persuasionTechnique: 'Pattern Interrupt',
          expectedReaction: 'High engagement'
        },
        optimization: {
          powerWords: [],
          framingDevice: 'Standard',
          narrativeStructure: 'Hook → Story → Lesson',
          pacing: 'medium'
        },
        meta: {
          platform: [item.platform as any],
          targetAudience: 'General',
          tone: 'authoritative' as const
        },
        prediction: {
          engagementScore: 0.8,
          viralPotential: 0.6,
          leadGeneration: 0.7,
          brandImpact: 'positive',
          confidenceLevel: 0.8
        },
        metadata: {
          generatedAt: new Date(),
          model: 'claude-opus-4.1',
          iterationCount: 1
        }
      };

      const mockBusiness: BusinessProfile = {
        name: 'Business',
        industry: 'General',
        targetAudience: 'Professionals',
        brandVoice: 'professional',
        contentGoals: ['engagement']
      };

      const mockInsight: BreakthroughInsight = {
        id: 'mock-insight',
        type: 'unexpected_connection',
        thinkingStyle: 'lateral',
        insight: 'Content insight',
        whyProfound: 'This insight is meaningful',
        whyNow: 'Timely and relevant',
        contentAngle: 'Engagement',
        expectedReaction: 'High engagement',
        evidence: ['Supporting data'],
        confidence: 0.85,
        metadata: {
          generatedAt: new Date(),
          model: 'mock-model'
        }
      };

      const result = await sectionRegenerator.regenerateSection(
        mockContent,
        section,
        mockBusiness,
        mockInsight
      );
      setRegenerationResult(result);
    } catch (error) {
      console.error('Failed to regenerate section:', error);
      alert('Failed to regenerate section. Please try again.');
      setRegenerationModalOpen(false);
    } finally {
      setRegeneratingSection(null);
    }
  };

  /**
   * Handle selecting regenerated option
   */
  const handleSelectRegeneration = (section: ContentSection, optionIndex: number) => {
    if (!regenerationResult || !onUpdate) return;

    const updatedContent: SynapseContent = {
      id: item.id,
      insightId: 'mock',
      format: 'hook-post',
      content: {
        headline: section === 'headline' ? regenerationResult.regenerated[optionIndex] : extractSection(item.content_text, 'headline') || '',
        hook: section === 'hook' ? regenerationResult.regenerated[optionIndex] : extractSection(item.content_text, 'hook') || '',
        body: section === 'body' ? regenerationResult.regenerated[optionIndex] : extractSection(item.content_text, 'body') || item.content_text,
        cta: section === 'cta' ? regenerationResult.regenerated[optionIndex] : extractSection(item.content_text, 'cta') || ''
      },
      psychology: { principle: 'Curiosity Gap', trigger: { type: 'curiosity', strength: 0.8 }, persuasionTechnique: 'Pattern Interrupt', expectedReaction: '' },
      optimization: { powerWords: [], framingDevice: '', narrativeStructure: 'Hook → Story → Lesson', pacing: 'medium' },
      meta: { platform: [item.platform as any], targetAudience: '', tone: 'authoritative' as const },
      prediction: { engagementScore: 0, viralPotential: 0, leadGeneration: 0, brandImpact: 'neutral', confidenceLevel: 0 },
      metadata: { generatedAt: new Date(), model: '', iterationCount: 0 }
    };

    const applied = sectionRegenerator.applyRegeneration(updatedContent, regenerationResult, optionIndex);

    const updatedItem: ContentItemType = {
      ...item,
      content_text: `${applied.content.headline}\n\n${applied.content.hook}\n\n${applied.content.body}\n\n${applied.content.cta}`
    };

    onUpdate(updatedItem);
    setRegenerationResult(null);
  };

  /**
   * Extract section from content text (simple heuristic)
   */
  const extractSection = (text: string, section: ContentSection): string | null => {
    const lines = text.split('\n').filter(l => l.trim());
    if (section === 'headline') return lines[0] || null;
    if (section === 'hook') return lines[1] || null;
    if (section === 'body') return lines.slice(2, -1).join('\n') || null;
    if (section === 'cta') return lines[lines.length - 1] || null;
    return null;
  };

  /**
   * Get provenance data (mock for now)
   */
  const getProvenance = (): ContentProvenance => {
    return {
      dataSourcesUsed: ['Google Reviews', 'Social Media'],
      psychologyTrigger: 'Curiosity Gap',
      frameworkStagesUsed: [
        { stage: 'Hook', sourceField: 'emotionalHook', content: 'Opening line...' },
        { stage: 'Story', sourceField: 'contentAngle', content: 'Main narrative...' }
      ],
      contentAssembly: {
        headline: { source: 'AI Generation', field: 'headline', preview: 'Preview...' },
        hook: { source: 'Psychology Engine', field: 'hook', preview: 'Preview...' },
        body: { source: 'Content Framework', field: 'body', preview: 'Preview...' },
        cta: { source: 'CTA Library', field: 'cta', preview: 'Preview...' }
      }
    };
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${compact ? 'p-3' : ''}`}>
      {/* Header: Platform and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Platform Badge */}
          <Badge className={`${PLATFORM_COLORS[item.platform]} px-2 py-1`}>
            <span className="flex items-center gap-1">
              {PLATFORM_ICONS[item.platform]}
              <span className="capitalize text-xs">{item.platform}</span>
            </span>
          </Badge>

          {/* Status Badge */}
          <Badge variant="outline" className={STATUS_COLORS[item.status]}>
            {item.status}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              title="Edit content"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(item)}
              title="Duplicate content"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
          {onSchedule && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSchedule}
              title="Schedule content"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              title="Delete content"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Visual Preview */}
      {item.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={item.image_url}
            alt="Generated visual"
            className="w-full h-auto object-cover transition-opacity duration-200"
            onLoad={(e) => {
              // Fade in when loaded
              const target = e.target as HTMLImageElement;
              target.style.opacity = '1';
            }}
            onError={(e) => {
              // Handle broken images gracefully
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                parent.style.display = 'none';
              }
            }}
            loading="lazy"
            style={{ opacity: 0 }}
          />
        </div>
      )}

      {/* Content Preview */}
      <div className="mb-3">
        <p className="text-sm text-foreground leading-relaxed">{getContentPreview()}</p>
      </div>

      {/* Intelligence Badges */}
      {item.intelligence_badges && item.intelligence_badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.intelligence_badges.map((badge, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
            >
              <span className="mr-1">{getIntelligenceBadgeIcon(badge)}</span>
              {badge}
            </Badge>
          ))}
        </div>
      )}

      {/* Quality Rating */}
      {item.synapse_score !== undefined && item.synapse_score > 0 && (
        <div className="mb-3">
          <QualityRating score={item.synapse_score} size="sm" showLabel={true} />
        </div>
      )}

      {/* Scheduled Time */}
      <div className="mb-3 text-sm text-muted-foreground">
        <span className="font-semibold">
          {item.status === 'published' ? 'Published: ' : 'Scheduled: '}
        </span>
        {formatDateTime(item.status === 'published' ? item.published_time : item.scheduled_time)}
      </div>

      {/* Engagement Metrics (if published) */}
      {item.status === 'published' && item.engagement_metrics && (
        <div className="flex items-center gap-4 pt-3 border-t">
          {item.engagement_metrics.likes > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{item.engagement_metrics.likes.toLocaleString()}</span>
            </div>
          )}
          {item.engagement_metrics.comments > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span>{item.engagement_metrics.comments.toLocaleString()}</span>
            </div>
          )}
          {item.engagement_metrics.shares > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Share2 className="w-4 h-4 text-green-500" />
              <span>{item.engagement_metrics.shares.toLocaleString()}</span>
            </div>
          )}
          {item.engagement_metrics.reach > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Eye className="w-4 h-4 text-purple-500" />
              <span>{item.engagement_metrics.reach.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message (if failed) */}
      {item.status === 'failed' && item.error_message && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <span className="font-semibold">Error: </span>
          {item.error_message}
        </div>
      )}

      {/* Synapse Enhancement Buttons */}
      {!compact && (item.generation_mode === 'synapse' || item.intelligence_badges?.some(b => b.includes('Synapse'))) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateVariants}
            disabled={generatingVariants}
            className="flex items-center gap-1 text-xs"
          >
            <TrendingUp className="w-3 h-3" />
            Generate Variants
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRegenerateSection('headline')}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate Headline
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRegenerateSection('body')}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate Body
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setProvenanceModalOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <ViewIcon className="w-3 h-3" />
            View Sources
          </Button>
        </div>
      )}

      {/* Modals */}
      <VariantModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        variants={variants}
        loading={generatingVariants}
        onSelectVariant={handleSelectVariant}
      />

      <RegenerationModal
        open={regenerationModalOpen}
        onClose={() => setRegenerationModalOpen(false)}
        section={regeneratingSection}
        result={regenerationResult}
        loading={!!regeneratingSection}
        onSelectOption={handleSelectRegeneration}
        onRegenerate={() => regeneratingSection && handleRegenerateSection(regeneratingSection)}
      />

      <ProvenanceModal
        open={provenanceModalOpen}
        onClose={() => setProvenanceModalOpen(false)}
        provenance={getProvenance()}
      />

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-datetime">Date and Time</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSchedule}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
