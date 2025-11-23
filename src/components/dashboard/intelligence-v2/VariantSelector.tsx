/**
 * Variant Selector Component
 *
 * Allows users to preview and select A/B test variants
 * Shows expected performance and test recommendations
 */

import React, { useState } from 'react';
import { Check, TrendingUp, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ABTestSetup, ContentVariant } from '@/services/v2/intelligence/variant-generator.service';

export interface VariantSelectorProps {
  testSetup: ABTestSetup;
  onSelectVariant: (variantId: string) => void;
}

export const VariantSelector = React.memo(function VariantSelector({ testSetup, onSelectVariant }: VariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const getStrategyColor = React.useCallback((strategy: string) => {
    switch (strategy) {
      case 'fomo-scarcity': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300';
      case 'social-proof': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300';
      case 'authority': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300';
      case 'urgency': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300';
    }
  }, []);

  const handleSelect = React.useCallback((variantId: string) => {
    setSelectedVariant(variantId);
    onSelectVariant(variantId);
  }, [onSelectVariant]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">
          A/B Test Variants
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {testSetup.testDuration}-day test • {testSetup.recommendedSplit.join('/')} split
        </div>
      </div>

      {/* Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testSetup.variants.map((variant, idx) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedVariant === variant.id
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
            }`}
            onClick={() => handleSelect(variant.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSelect(variant.id)}
            aria-label={`Select variant ${variant.variant}`}
          >
            {/* Variant Label */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  Variant {variant.variant}
                </span>
                {selectedVariant === variant.id && (
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded border ${getStrategyColor(variant.strategy)}`}>
                {variant.strategy}
              </span>
            </div>

            {/* Content Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 mb-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
              {variant.content}
            </div>

            {/* Performance Predictions */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-center">
                <div
                  className="text-green-700 dark:text-green-300 font-medium"
                  title="Expected engagement rate based on similar content"
                >
                  {variant.expectedPerformance.engagement}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Engagement
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center">
                <div
                  className="text-blue-700 dark:text-blue-300 font-medium"
                  title="Expected conversion rate based on similar content"
                >
                  {variant.expectedPerformance.conversion}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Conversion
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-center">
                <div
                  className="text-purple-700 dark:text-purple-300 font-medium"
                  title="Confidence level in this prediction"
                >
                  {Math.round(variant.expectedPerformance.confidence * 100)}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Confidence
                </div>
              </div>
            </div>

            {/* Test Hypothesis */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-400">
              <strong>Hypothesis:</strong> {variant.testHypothesis}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Test Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Test Recommendations
        </h5>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <Target className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>Split traffic {testSetup.recommendedSplit.join('/')} across variants</span>
          </li>
          <li className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>Run test for {testSetup.testDuration} days to reach statistical significance</span>
          </li>
          <li className="flex items-start gap-2">
            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>Measure {testSetup.successMetric} as primary success metric</span>
          </li>
        </ul>
      </div>
    </div>
  );
});
