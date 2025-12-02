/**
 * Simple Campaign Mode - Level 1: AI Suggestions
 * One-click campaign generation with smart recommendations
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Calendar, Target, ChevronRight, Edit, Check, Loader2 } from 'lucide-react';
import type {
  CampaignSuggestion,
  QuickEditModalData,
  SimpleModeConfig
} from '@/types/v2';
import { uiLevelManager } from '@/services/v2/ui-level-manager.service';

export interface SimpleCampaignModeProps {
  brandId: string;
  brandName: string;
  industry?: string;
  suggestions?: CampaignSuggestion[];
  onGenerateCampaign: (suggestionId: string, edits?: QuickEditModalData) => Promise<void>;
  onLoadSuggestions?: () => Promise<CampaignSuggestion[]>;
  className?: string;
}

export const SimpleCampaignMode: React.FC<SimpleCampaignModeProps> = ({
  brandId,
  brandName,
  industry,
  suggestions: initialSuggestions,
  onGenerateCampaign,
  onLoadSuggestions,
  className,
}) => {
  const [suggestions, setSuggestions] = React.useState<CampaignSuggestion[]>(initialSuggestions || []);
  const [loading, setLoading] = React.useState(false);
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [editModalData, setEditModalData] = React.useState<QuickEditModalData | null>(null);
  const [config] = React.useState<SimpleModeConfig>(uiLevelManager.getSimpleModeConfig());

  // Load suggestions on mount if not provided
  React.useEffect(() => {
    if (suggestions.length === 0 && onLoadSuggestions) {
      loadSuggestions();
    }
  }, []);

  const loadSuggestions = async () => {
    if (!onLoadSuggestions) return;

    setLoading(true);
    try {
      const loadedSuggestions = await onLoadSuggestions();
      setSuggestions(loadedSuggestions.slice(0, config.maxSuggestedCampaigns));
    } catch (error) {
      console.error('[SimpleCampaignMode] Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = (suggestion: CampaignSuggestion) => {
    if (config.allowQuickEdit) {
      setEditModalData({
        suggestionId: suggestion.id,
        editableFields: {
          title: suggestion.campaignName,
          startDate: new Date().toISOString().split('T')[0],
          targetAudience: ''
        }
      });
    } else {
      handleConfirmGenerate(suggestion.id);
    }
  };

  const handleConfirmGenerate = async (suggestionId: string, edits?: QuickEditModalData) => {
    setGenerating(suggestionId);
    try {
      await onGenerateCampaign(suggestionId, edits);

      // Track usage
      await uiLevelManager.updateUsageStats(brandId, {
        totalCampaigns: 1
      } as any);
    } catch (error) {
      console.error('[SimpleCampaignMode] Error generating campaign:', error);
    } finally {
      setGenerating(null);
      setEditModalData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditModalData(null);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading AI-powered campaign suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">AI-Recommended Campaigns</h2>
        </div>
        <p className="text-muted-foreground">
          Based on your business analysis, we recommend these campaigns for {brandName}
        </p>
      </div>

      {/* Suggestions Grid */}
      {suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              generating={generating === suggestion.id}
              onGenerate={() => handleGenerateClick(suggestion)}
              showPreview={config.showPreviewCards}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed rounded-lg">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
          <p className="text-muted-foreground mb-4">
            Complete your business profile to get personalized campaign recommendations
          </p>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editModalData && (
        <QuickEditModal
          data={editModalData}
          onSave={(edits) => handleConfirmGenerate(editModalData.suggestionId!, edits)}
          onCancel={handleCancelEdit}
          config={config}
        />
      )}
    </div>
  );
};

/**
 * Suggestion Card Component
 */
interface SuggestionCardProps {
  suggestion: CampaignSuggestion;
  generating: boolean;
  onGenerate: () => void;
  showPreview: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  generating,
  onGenerate,
  showPreview,
}) => {
  const confidenceColor = suggestion.confidenceScore >= 80
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    : suggestion.confidenceScore >= 60
    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  const sourceLabel = {
    opportunity_radar: 'Opportunity',
    competitive_analysis: 'Competitive',
    seasonal: 'Seasonal',
    ai_generated: 'AI Suggested'
  }[suggestion.source];

  return (
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow bg-card">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold line-clamp-2">{suggestion.campaignName}</h3>
          <span className={cn('text-xs px-2 py-1 rounded-full whitespace-nowrap', confidenceColor)}>
            {suggestion.confidenceScore}% Match
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{suggestion.purpose}</p>
      </div>

      {/* Description */}
      <p className="text-sm line-clamp-3">{suggestion.description}</p>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{suggestion.estimatedDuration} days</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{suggestion.estimatedPieces} pieces</span>
        </div>
        <span className="px-2 py-0.5 bg-muted rounded">
          {sourceLabel}
        </span>
      </div>

      {/* Preview */}
      {showPreview && suggestion.previewText && (
        <div className="text-sm bg-muted p-3 rounded-md">
          <p className="text-muted-foreground italic line-clamp-2">
            "{suggestion.previewText}"
          </p>
        </div>
      )}

      {/* Key Themes */}
      {suggestion.metadata.keyThemes && suggestion.metadata.keyThemes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestion.metadata.keyThemes.slice(0, 3).map((theme, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors',
          generating
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Campaign...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate Campaign</span>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Quick Edit Modal Component
 */
interface QuickEditModalProps {
  data: QuickEditModalData;
  onSave: (data: QuickEditModalData) => void;
  onCancel: () => void;
  config: SimpleModeConfig;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({
  data,
  onSave,
  onCancel,
  config,
}) => {
  const [formData, setFormData] = React.useState(data.editableFields);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...data,
      editableFields: formData
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quick Edit</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Customize these details before generating your campaign
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.editableFields.includes('title') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter campaign title"
                required
              />
            </div>
          )}

          {config.editableFields.includes('startDate') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          )}

          {config.editableFields.includes('endDate') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          {config.editableFields.includes('targetAudience') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience (Optional)</label>
              <input
                type="text"
                value={formData.targetAudience || ''}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Small business owners"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
