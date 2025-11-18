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
import { motion, AnimatePresence } from 'framer-motion';
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
import { HelpCircle, ArrowRight, Sparkles, Zap } from 'lucide-react';

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
      <motion.div
        className="mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Choose Your Campaign Type
            </h2>
          </div>

          {/* Why this type? Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 dark:border-purple-700 dark:text-gray-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 dark:hover:border-purple-600 transition-colors w-full sm:w-auto min-h-[44px]"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Why these recommendations?</span>
                <span className="sm:hidden">Why these?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-gray-900 dark:text-white">
                  How We Recommend Campaign Types
                </DialogTitle>
                <DialogDescription className="space-y-4 pt-4">
                  <p className="text-base">
                    Our AI analyzes your business intelligence data to recommend
                    the best campaign type for your unique situation.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                      <h4 className="font-semibold mb-1 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Authority Builder
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have strong industry expertise,
                        competitive insights, or thought leadership opportunities.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <h4 className="font-semibold mb-1 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Social Proof
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have customer reviews, testimonials,
                        or strong local presence to leverage.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20">
                      <h4 className="font-semibold mb-1 text-violet-700 dark:text-violet-300 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Local Pulse
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Recommended when you have location data, weather patterns,
                        or local events to create timely campaigns.
                      </p>
                    </div>
                  </div>

                  {recommendedType && (
                    <motion.div
                      className="mt-4 p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg border border-purple-200 dark:border-purple-700"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">
                        For Your Business:
                      </h4>
                      <p className="text-sm">{reasoning}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Confidence: {Math.round(confidenceScore * 100)}%
                      </p>
                    </motion.div>
                  )}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Based on your business intelligence, we've analyzed the best campaign
          strategy for your goals. Select one to continue.
        </p>
      </motion.div>

      {/* Campaign Type Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {campaignTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <CampaignTypeCard
              type={type}
              selected={selectedType === type.id}
              onClick={() => handleTypeSelect(type.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Data Strength Indicator */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            className="mb-8 p-6 bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-violet-50/50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-violet-900/10 rounded-xl border border-purple-200/50 dark:border-purple-700/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-semibold mb-4 text-purple-700 dark:text-purple-300">
              Data Strength for Selected Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataStrengthBar
                label="Authority Data"
                score={campaignTypes.find(t => t.id === 'authority_builder')?.confidenceScore || 0}
                active={selectedType === 'authority_builder'}
              />
              <DataStrengthBar
                label="Social Proof Data"
                score={campaignTypes.find(t => t.id === 'trust_builder')?.confidenceScore || 0}
                active={selectedType === 'trust_builder'}
              />
              <DataStrengthBar
                label="Local Pulse Data"
                score={campaignTypes.find(t => t.id === 'community_champion')?.confidenceScore || 0}
                active={selectedType === 'community_champion'}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button
          size="lg"
          disabled={!selectedType}
          onClick={handleContinue}
          className="w-full sm:w-auto sm:min-w-[200px] min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="hidden sm:inline">
            Continue with{' '}
            {selectedType && campaignTypes.find(t => t.id === selectedType)?.name}
          </span>
          <span className="sm:hidden">
            Continue
          </span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
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
    <motion.div
      className={active ? 'opacity-100' : 'opacity-50'}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: active ? 1 : 0.5, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{label}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};
