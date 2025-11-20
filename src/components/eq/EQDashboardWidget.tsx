/**
 * EQ Dashboard Widget
 *
 * Displays calculated Emotional Quotient (EQ) score for a brand.
 * Shows emotional/rational breakdown, confidence, specialty context,
 * and actionable recommendations.
 *
 * Design matches Synapse purple/blue gradient pattern
 * Integrates with EQ Calculator v2.0
 *
 * Created: 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { eqStorage } from '@/services/eq-v2/eq-storage.service';
import { eqIntegration } from '@/services/eq-v2/eq-integration.service';
import type { EQCalculationResult, EQScore } from '@/types/eq-calculator.types';

export interface EQDashboardWidgetProps {
  /** Brand ID to load/calculate EQ for */
  brandId: string;

  /** Optional: Pre-calculated EQ result */
  preloadedResult?: EQCalculationResult;

  /** Optional: Show expanded view by default */
  defaultExpanded?: boolean;

  /** Optional: Enable recalculation */
  enableRecalculate?: boolean;

  /** Optional: Website content for recalculation */
  websiteContent?: string[];

  /** Optional: Business name for recalculation */
  businessName?: string;

  /** Optional: Specialty for recalculation */
  specialty?: string;

  /** Optional: Callback when EQ is recalculated */
  onRecalculate?: (result: EQCalculationResult) => void;

  className?: string;
}

export function EQDashboardWidget({
  brandId,
  preloadedResult,
  defaultExpanded = true,
  enableRecalculate = true,
  websiteContent = [],
  businessName = '',
  specialty,
  onRecalculate,
  className = '',
}: EQDashboardWidgetProps) {
  const [result, setResult] = useState<EQCalculationResult | null>(preloadedResult || null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(!preloadedResult);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Load EQ score on mount if not preloaded
  useEffect(() => {
    if (preloadedResult) {
      setResult(preloadedResult);
      setIsLoading(false);
      return;
    }

    async function loadEQ() {
      try {
        setIsLoading(true);
        const cachedResult = await eqStorage.loadEQScore(brandId);

        if (cachedResult) {
          setResult(cachedResult);
        }
      } catch (error) {
        console.error('[EQDashboardWidget] Failed to load EQ:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEQ();
  }, [brandId, preloadedResult]);

  // Handle recalculation
  const handleRecalculate = async () => {
    if (!websiteContent.length || !businessName) {
      console.warn('[EQDashboardWidget] Cannot recalculate: missing required data');
      return;
    }

    try {
      setIsRecalculating(true);

      const newResult = await eqIntegration.calculateEQ({
        businessName,
        websiteContent,
        specialty,
      });

      // Save to database
      await eqStorage.saveEQScore(brandId, newResult);

      setResult(newResult);

      if (onRecalculate) {
        onRecalculate(newResult);
      }
    } catch (error) {
      console.error('[EQDashboardWidget] Failed to recalculate EQ:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // Get EQ interpretation
  const getEQInterpretation = (eq: number): string => {
    if (eq >= 70) return 'Highly Emotional - Focus on storytelling, transformation, and emotional hooks';
    if (eq >= 50) return 'Balanced - Mix emotional resonance with functional benefits';
    if (eq >= 30) return 'Functional-Leaning - Emphasize results with some emotional connection';
    return 'Highly Rational - Focus on data, ROI, and measurable outcomes';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  // No EQ calculated yet
  if (!result) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
            <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">EQ Not Calculated</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Calculate your brand's Emotional Quotient to unlock personalized content recommendations
          </p>
          {enableRecalculate && websiteContent.length > 0 && businessName && (
            <Button onClick={handleRecalculate} disabled={isRecalculating}>
              {isRecalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Calculate EQ
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { eq_score, breakdown, specialty_context, recommendations } = result;
  const lastCalculated = breakdown.calculation_timestamp
    ? new Date(breakdown.calculation_timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* EQ Score Badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <div className="text-white">
                <div className="text-2xl font-bold">{Math.round(eq_score.overall)}</div>
                <div className="text-xs opacity-90">EQ</div>
              </div>
            </div>
            {/* Confidence indicator */}
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center ${getConfidenceColor(eq_score.confidence)}`}>
              {eq_score.confidence >= 80 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Title and Meta */}
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Emotional Quotient
              {specialty_context?.specialty && (
                <span className="text-xs font-normal px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full">
                  {specialty_context.specialty}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getConfidenceLabel(eq_score.confidence)} • Calculated {lastCalculated}
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-slate-700"
          >
            <div className="p-6 space-y-6">
              {/* Emotional vs Rational Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Emotional / Rational Balance
                </h4>

                <div className="space-y-3">
                  {/* Emotional Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-600" />
                        <span className="text-sm font-medium">Emotional</span>
                      </div>
                      <span className="text-sm font-semibold text-pink-600">
                        {Math.round(eq_score.emotional)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eq_score.emotional}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Rational Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Rational</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(eq_score.rational)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eq_score.rational}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* EQ Interpretation */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {getEQInterpretation(eq_score.overall)}
                </AlertDescription>
              </Alert>

              {/* Calculation Method */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>
                  Calculated using {eq_score.calculation_method.replace(/_/g, ' ')} method
                </span>
              </div>

              {/* Top Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Top Recommendations
                  </h4>
                  <div className="space-y-2">
                    {recommendations.slice(0, 3).map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {rec.recommendation}
                            </p>
                            {rec.rationale && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {rec.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recalculate Button */}
              {enableRecalculate && websiteContent.length > 0 && businessName && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    className="w-full"
                  >
                    {isRecalculating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recalculating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Recalculate EQ
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
