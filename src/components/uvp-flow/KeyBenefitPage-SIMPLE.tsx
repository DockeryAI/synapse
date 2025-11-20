/**
 * Key Benefit Page - UVP Flow Step 5
 * SIMPLIFIED VERSION - Matches other SIMPLE pages design
 *
 * Created: 2025-11-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, CheckCircle2, AlertCircle, TrendingUp, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeyBenefit } from '@/types/uvp-flow.types';

interface KeyBenefitPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  preloadedData?: any;
  value?: string;
  onChange?: (value: string) => void;
  onBenefitsSelected?: (benefits: KeyBenefit[]) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function KeyBenefitPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  preloadedData,
  value = '',
  onChange,
  onBenefitsSelected,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 80,
  className = ''
}: KeyBenefitPageProps) {
  const [benefits, setBenefits] = useState<KeyBenefit[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<KeyBenefit[]>([]);
  // Start as loading if we don't have data yet
  const [isLoading, setIsLoading] = useState(!preloadedData || (preloadedData as any).loading === true);
  const hasLoadedPreloadedData = useRef(false);

  // Load preloaded data - ONLY use preloaded data, never auto-generate
  useEffect(() => {
    console.log('[KeyBenefitPage-SIMPLE] useEffect triggered', {
      hasPreloadedData: !!preloadedData,
      isLoading: preloadedData && (preloadedData as any).loading,
      hasBenefits: preloadedData && preloadedData.benefits && preloadedData.benefits.length,
      benefitsCount: benefits.length,
      hasLoadedBefore: hasLoadedPreloadedData.current
    });

    // Check if data is still loading in background
    if (preloadedData && (preloadedData as any).loading) {
      console.log('[KeyBenefitPage-SIMPLE] ⏳ Data is loading in background...');
      setIsLoading(true);
      return;
    }

    // If we have pre-loaded data with benefits AND haven't loaded it before
    if (preloadedData && preloadedData.benefits && preloadedData.benefits.length > 0) {
      if (hasLoadedPreloadedData.current && benefits.length > 0) {
        console.log('[KeyBenefitPage-SIMPLE] ✓ Data already loaded, skipping');
        return;
      }

      console.log('[KeyBenefitPage-SIMPLE] 📥 Loading pre-loaded data:', preloadedData.benefits.length, 'benefits');
      setBenefits(preloadedData.benefits);
      setIsLoading(false);
      hasLoadedPreloadedData.current = true;
      return;
    }

    // If no preloadedData yet, just wait - progressive loading will provide it
    if (!preloadedData) {
      console.log('[KeyBenefitPage-SIMPLE] ⏳ Waiting for progressive loading...');
      setIsLoading(true);
      return;
    }

    // If we get here, preloadedData exists but has no benefits - show empty state
    console.log('[KeyBenefitPage-SIMPLE] No benefits found in preloaded data');
    setIsLoading(false);
  }, [preloadedData]);

  const handleSelectBenefit = (benefit: KeyBenefit) => {
    setSelectedBenefits(prev => {
      const isAlreadySelected = prev.some(b => b.id === benefit.id);

      const updated = isAlreadySelected
        ? prev.filter(b => b.id !== benefit.id)
        : [...prev, benefit];

      // Schedule callbacks for next tick to avoid setState during render
      setTimeout(() => {
        if (onChange) {
          onChange(updated.map(b => b.statement).join('; '));
        }
        if (onBenefitsSelected) {
          onBenefitsSelected(updated);
        }
      }, 0);

      return updated;
    });
  };

  const handleContinue = () => {
    // Ensure parent has latest selections before proceeding
    if (onBenefitsSelected) {
      onBenefitsSelected(selectedBenefits);
    }
    onNext();
  };

  const canProceed = selectedBenefits.length > 0;

  // Determine icon based on outcome type
  const getBenefitIcon = (outcomeType?: string) => {
    switch (outcomeType) {
      case 'qualitative':
        return Heart;
      case 'quantifiable':
        return TrendingUp;
      case 'mixed':
      default:
        return Zap;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UVP Step 5 of 6: Key Benefit
            </span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What's the Key Benefit?
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            What's the primary outcome or transformation your customers will experience?
            Select all the key benefits that apply.
          </p>
        </motion.div>

      {/* Progress Summary */}
      {!isLoading && benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Selection Progress
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedBenefits.length} of {benefits.length} selected
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </Button>
              )}

              <Button
                onClick={handleContinue}
                disabled={!canProceed}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(selectedBenefits.length / benefits.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Key Benefits */}
      <AnimatePresence mode="popLayout">
        {!isLoading && benefits.map((benefit, index) => {
          const isSelected = selectedBenefits.some(b => b.id === benefit.id);
          const BenefitIcon = getBenefitIcon(benefit.outcomeType);

          return (
            <motion.div
              key={benefit.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className={`
                bg-white dark:bg-slate-800 rounded-xl border-2 p-6 shadow-md cursor-pointer transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                }
              `}
              onClick={() => handleSelectBenefit(benefit)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <BenefitIcon className={`w-5 h-5 ${
                        isSelected
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                      {benefit.statement}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Outcome Type Badge */}
                  {benefit.outcomeType && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        benefit.outcomeType === 'qualitative'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                          : benefit.outcomeType === 'quantifiable'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {benefit.outcomeType === 'qualitative' ? '❤️ Qualitative' :
                         benefit.outcomeType === 'quantifiable' ? '📊 Quantifiable' :
                         '⚡ Mixed'}
                      </span>
                    </div>
                  )}

                  {/* Metrics */}
                  {benefit.metrics && benefit.metrics.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                        Measurable Outcomes
                      </p>
                      <div className="space-y-1">
                        {benefit.metrics.map((metric, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {typeof metric === 'string' ? metric :
                               typeof metric === 'object' && metric.metric ? `${metric.metric}: ${metric.value}${metric.timeframe ? ` (${metric.timeframe})` : ''}` :
                               JSON.stringify(metric)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EQ Framing */}
                  {benefit.eqFraming && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Framing: <span className="text-gray-700 dark:text-gray-300 font-medium">{benefit.eqFraming}</span>
                      </span>
                    </div>
                  )}

                  {benefit.confidence && typeof benefit.confidence === 'number' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Confidence: {benefit.confidence}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && benefits.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Key Benefits Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't identify specific benefits from your website.
            You can still proceed and define your benefits manually.
          </p>
          <Button onClick={onNext} className="gap-2">
            Continue Anyway
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
