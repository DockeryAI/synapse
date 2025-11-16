/**
 * CampaignTypeSelector Component
 *
 * Container component that:
 * - Accepts DeepContext intelligence data
 * - Uses AI recommender to suggest best campaign type
 * - Displays 3 campaign type options in grid
 * - Auto-selects recommended type
 * - Allows manual selection override
 * - Provides continue button when selection made
 */

import React, { useState, useEffect } from 'react';
import { DeepContext } from '../../types/synapse/deepContext.types';
import { CampaignType, CampaignTypeId } from '../../types/campaign.types';
import { campaignRecommender } from '../../services/campaign/CampaignRecommender';
import { CampaignTypeCard } from './CampaignTypeCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, ArrowRight } from 'lucide-react';

export interface CampaignTypeSelectorProps {
  context: DeepContext;
  onContinue: (selectedType: CampaignTypeId) => void;
  className?: string;
}

export const CampaignTypeSelector: React.FC<CampaignTypeSelectorProps> = ({
  context,
  onContinue,
  className = ''
}) => {
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [selectedType, setSelectedType] = useState<CampaignTypeId | null>(null);
  const [recommendedType, setRecommendedType] = useState<CampaignTypeId | null>(null);
  const [reasoning, setReasoning] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  // Run AI recommendation on mount
  useEffect(() => {
    const result = campaignRecommender.recommendCampaignType(context);

    setCampaignTypes(result.all);
    setRecommendedType(result.recommended.id);
    setSelectedType(result.recommended.id); // Auto-select recommended
    setReasoning(result.reasoning);
    setConfidenceScore(result.confidenceScore);
  }, [context]);

  // Handle selection change
  const handleTypeSelect = (typeId: CampaignTypeId) => {
    setSelectedType(typeId);
  };

  // Handle continue
  const handleContinue = () => {
    if (selectedType) {
      onContinue(selectedType);
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Choose Your Campaign Type
          </h2>

          {/* Why this type? Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Why these recommendations?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How We Recommend Campaign Types</DialogTitle>
                <DialogDescription className="space-y-4 pt-4">
                  <p>
                    Our AI analyzes your business intelligence data to recommend
                    the best campaign type for your unique situation.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">Authority Builder</h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have strong industry expertise,
                        competitive insights, or thought leadership opportunities.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1">Social Proof</h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have customer reviews, testimonials,
                        or strong local presence to leverage.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1">Local Pulse</h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have location data, weather patterns,
                        or local events to create timely campaigns.
                      </p>
                    </div>
                  </div>

                  {recommendedType && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">
                        For Your Business:
                      </h4>
                      <p className="text-sm">{reasoning}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Confidence: {Math.round(confidenceScore * 100)}%
                      </p>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-muted-foreground text-lg">
          Based on your business intelligence, we've analyzed the best campaign
          strategy for your goals. Select one to continue.
        </p>
      </div>

      {/* Campaign Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {campaignTypes.map((type) => (
          <CampaignTypeCard
            key={type.id}
            type={type}
            selected={selectedType === type.id}
            onClick={() => handleTypeSelect(type.id)}
          />
        ))}
      </div>

      {/* Data Strength Indicator */}
      {selectedType && (
        <div className="mb-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-4">Data Strength for Selected Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataStrengthBar
              label="Authority Data"
              score={campaignTypes.find(t => t.id === 'authority_builder')?.confidenceScore || 0}
              active={selectedType === 'authority_builder'}
            />
            <DataStrengthBar
              label="Social Proof Data"
              score={campaignTypes.find(t => t.id === 'social_proof')?.confidenceScore || 0}
              active={selectedType === 'social_proof'}
            />
            <DataStrengthBar
              label="Local Pulse Data"
              score={campaignTypes.find(t => t.id === 'local_pulse')?.confidenceScore || 0}
              active={selectedType === 'local_pulse'}
            />
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!selectedType}
          onClick={handleContinue}
          className="min-w-[200px]"
        >
          Continue with{' '}
          {selectedType && campaignTypes.find(t => t.id === selectedType)?.name}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Data Strength Bar Component
 * Shows confidence score for each campaign type's available data
 */
interface DataStrengthBarProps {
  label: string;
  score: number;
  active: boolean;
}

const DataStrengthBar: React.FC<DataStrengthBarProps> = ({
  label,
  score,
  active
}) => {
  const percentage = Math.round(score * 100);

  return (
    <div className={active ? 'opacity-100' : 'opacity-50'}>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
