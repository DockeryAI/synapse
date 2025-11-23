/**
 * Campaign Builder - Main Container Component
 * Orchestrates the campaign creation flow with step-based wizard
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/v2/ModeContext';
import { PurposeSelector } from './PurposeSelector';
import { TimelineVisualizer } from './TimelineVisualizer';
import { CampaignPreview } from './CampaignPreview';
import { CampaignArcGeneratorService } from '@/services/v2/campaign-arc-generator.service';
import { CampaignStorageService } from '@/services/v2/campaign-storage.service';
import type { Campaign, CampaignPiece, CampaignPurpose } from '@/types/v2';

export type CampaignBuilderStep = 'purpose' | 'timeline' | 'preview';

export interface CampaignBuilderState {
  step: CampaignBuilderStep;
  selectedTemplateId: string | null;
  campaign: Partial<Campaign> | null;
  pieces: CampaignPiece[];
  targetAudience: string;
  startDate: Date;
  isGenerating: boolean;
  error: string | null;
}

export interface CampaignBuilderProps {
  brandId: string;
  brandName: string;
  industry?: string;
  onComplete?: (campaign: Campaign, pieces: CampaignPiece[]) => void;
  onCancel?: () => void;
  className?: string;
}

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({
  brandId,
  brandName,
  industry,
  onComplete,
  onCancel,
  className,
}) => {
  const { mode } = useMode();
  const [state, setState] = React.useState<CampaignBuilderState>({
    step: 'purpose',
    selectedTemplateId: null,
    campaign: null,
    pieces: [],
    targetAudience: '',
    startDate: new Date(),
    isGenerating: false,
    error: null,
  });

  const campaignGenerator = React.useMemo(() => new CampaignArcGeneratorService(), []);
  const campaignStorage = React.useMemo(() => new CampaignStorageService(), []);

  const handleTemplateSelect = async (templateId: string) => {
    setState(prev => ({
      ...prev,
      selectedTemplateId: templateId,
      isGenerating: true,
      error: null,
    }));

    try {
      // Generate campaign arc
      const result = campaignGenerator.generateArc(
        templateId,
        {
          brandId,
          brandName,
          industry: industry || 'general',
          targetAudience: state.targetAudience || 'General audience',
        },
        {
          startDate: state.startDate,
          targetAudience: state.targetAudience || 'General audience',
          primaryGoal: 'engagement',
          industryCode: industry,
        }
      );

      // Use the generated campaign and pieces
      const campaign = result.campaign;
      const pieces = result.pieces;

      setState(prev => ({
        ...prev,
        campaign,
        pieces,
        step: 'timeline',
        isGenerating: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate campaign',
        isGenerating: false,
      }));
    }
  };

  const handleRetry = () => {
    if (state.selectedTemplateId) {
      handleTemplateSelect(state.selectedTemplateId);
    }
  };

  const handlePiecesUpdate = (pieces: CampaignPiece[]) => {
    setState(prev => ({
      ...prev,
      pieces,
    }));
  };

  const handlePiecesReorder = (newOrder: CampaignPiece[]) => {
    setState(prev => ({
      ...prev,
      pieces: newOrder,
    }));
  };

  const handleContinueToPreview = () => {
    setState(prev => ({
      ...prev,
      step: 'preview',
    }));
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      step: prev.step === 'preview' ? 'timeline' : 'purpose',
    }));
  };

  const handleSave = async () => {
    if (!state.campaign) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Save campaign to database
      const savedCampaign = await campaignStorage.createCampaign({
        brandId,
        name: state.campaign!.name || 'Untitled Campaign',
        purpose: state.campaign!.purpose || 'product_launch',
        templateId: state.selectedTemplateId!,
        startDate: state.startDate.toISOString(),
        targetAudience: state.targetAudience || 'General audience',
      });

      // Save campaign pieces
      const piecesToSave = state.pieces.map(piece => ({
        title: piece.title,
        content: piece.content,
        emotionalTrigger: piece.emotionalTrigger,
        scheduledDate: piece.scheduledDate,
        channel: piece.channel,
        order: piece.order,
        status: 'pending' as const,
        phaseId: piece.phaseId,
      }));

      await campaignStorage.addCampaignPieces(savedCampaign.id, piecesToSave);

      setState(prev => ({ ...prev, isGenerating: false }));

      // Notify parent
      if (onComplete) {
        onComplete(savedCampaign, state.pieces);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save campaign',
        isGenerating: false,
      }));
    }
  };

  const handleTargetAudienceChange = (audience: string) => {
    setState(prev => ({
      ...prev,
      targetAudience: audience,
    }));
  };

  const handleStartDateChange = (date: Date) => {
    setState(prev => ({
      ...prev,
      startDate: date,
    }));
  };

  // Don't render if not in campaign mode
  if (mode !== 'campaign') {
    return (
      <div className={cn('p-8 text-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg', className)}>
        <p className="text-gray-600 dark:text-gray-300">
          Switch to Campaign mode to use the Campaign Builder.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <StepIndicator
          step={1}
          label="Purpose"
          active={state.step === 'purpose'}
          completed={state.step !== 'purpose'}
        />
        <div className="w-8 h-px bg-gray-300 dark:bg-slate-600" />
        <StepIndicator
          step={2}
          label="Timeline"
          active={state.step === 'timeline'}
          completed={state.step === 'preview'}
        />
        <div className="w-8 h-px bg-gray-300 dark:bg-slate-600" />
        <StepIndicator
          step={3}
          label="Preview"
          active={state.step === 'preview'}
          completed={false}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading State */}
        {state.isGenerating && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 dark:text-gray-300">Generating campaign...</p>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
              <p className="text-red-800 dark:text-red-200 text-sm">{state.error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Normal Content */}
        {!state.isGenerating && !state.error && state.step === 'purpose' && (
          <PurposeSelector
            onSelect={handleTemplateSelect}
            selectedTemplateId={state.selectedTemplateId}
            industry={industry}
          />
        )}

        {!state.isGenerating && !state.error && state.step === 'timeline' && state.selectedTemplateId && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Target Audience</label>
                <input
                  type="text"
                  value={state.targetAudience}
                  onChange={(e) => handleTargetAudienceChange(e.target.value)}
                  placeholder="e.g., Small business owners"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Start Date</label>
                <input
                  type="date"
                  value={state.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleStartDateChange(new Date(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <TimelineVisualizer
              pieces={state.pieces}
              onReorder={handlePiecesReorder}
              onPieceUpdate={handlePiecesUpdate}
            />
          </div>
        )}

        {!state.isGenerating && !state.error && state.step === 'preview' && (
          <CampaignPreview
            campaign={state.campaign}
            pieces={state.pieces}
            brandName={brandName}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <button
          onClick={state.step === 'purpose' ? onCancel : handleBack}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium"
        >
          {state.step === 'purpose' ? 'Cancel' : 'Back'}
        </button>

        {state.step === 'timeline' && (
          <button
            onClick={handleContinueToPreview}
            disabled={state.pieces.length === 0}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Continue to Preview
          </button>
        )}

        {state.step === 'preview' && (
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Save Campaign
          </button>
        )}
      </div>
    </div>
  );
};

// Step Indicator Component
interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  label,
  active,
  completed,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          active && 'bg-primary text-primary-foreground',
          completed && 'bg-green-500 dark:bg-green-600 text-white',
          !active && !completed && 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
        )}
      >
        {completed ? '✓' : step}
      </div>
      <span
        className={cn(
          'text-sm',
          active && 'font-medium text-gray-900 dark:text-white',
          !active && 'text-gray-500 dark:text-gray-400'
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default CampaignBuilder;
