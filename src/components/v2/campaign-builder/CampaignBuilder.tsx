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
import type { Campaign, CampaignPiece, CampaignPurpose } from '@/types/v2';

export type CampaignBuilderStep = 'purpose' | 'timeline' | 'preview';

export interface CampaignBuilderState {
  step: CampaignBuilderStep;
  selectedTemplateId: string | null;
  campaign: Partial<Campaign> | null;
  pieces: CampaignPiece[];
  targetAudience: string;
  startDate: Date;
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
  });

  const handleTemplateSelect = (templateId: string) => {
    setState(prev => ({
      ...prev,
      selectedTemplateId: templateId,
      step: 'timeline',
    }));
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

  const handleSave = () => {
    if (state.campaign && onComplete) {
      onComplete(state.campaign as Campaign, state.pieces);
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
      <div className={cn('p-8 text-center', className)}>
        <p className="text-muted-foreground">
          Switch to Campaign mode to use the Campaign Builder.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 p-4 border-b">
        <StepIndicator
          step={1}
          label="Purpose"
          active={state.step === 'purpose'}
          completed={state.step !== 'purpose'}
        />
        <div className="w-8 h-px bg-border" />
        <StepIndicator
          step={2}
          label="Timeline"
          active={state.step === 'timeline'}
          completed={state.step === 'preview'}
        />
        <div className="w-8 h-px bg-border" />
        <StepIndicator
          step={3}
          label="Preview"
          active={state.step === 'preview'}
          completed={false}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-4">
        {state.step === 'purpose' && (
          <PurposeSelector
            onSelect={handleTemplateSelect}
            selectedTemplateId={state.selectedTemplateId}
            industry={industry}
          />
        )}

        {state.step === 'timeline' && state.selectedTemplateId && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <input
                  type="text"
                  value={state.targetAudience}
                  onChange={(e) => handleTargetAudienceChange(e.target.value)}
                  placeholder="e.g., Small business owners"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={state.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleStartDateChange(new Date(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
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

        {state.step === 'preview' && (
          <CampaignPreview
            campaign={state.campaign}
            pieces={state.pieces}
            brandName={brandName}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t">
        <button
          onClick={state.step === 'purpose' ? onCancel : handleBack}
          className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
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
          completed && 'bg-green-500 text-white',
          !active && !completed && 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? '✓' : step}
      </div>
      <span
        className={cn(
          'text-sm',
          active && 'font-medium',
          !active && 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default CampaignBuilder;
