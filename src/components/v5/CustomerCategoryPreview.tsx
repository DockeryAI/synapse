/**
 * V5 Customer Category Preview
 *
 * Phase 6: Shows V5's auto-detected customer category (informational only)
 * - Small chip/badge showing detected category
 * - Updates dynamically as insights are selected
 * - Tooltip explains why category was chosen
 * - No dropdown needed - informational only
 *
 * Created: 2025-12-01
 */

import React, { useMemo, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  HelpCircle,
  Zap,
  Star,
  Shield,
  Gauge,
  DollarSign,
  Users,
  X
} from 'lucide-react';
import type { CustomerCategory } from '@/services/v5/types';
import type { SelectedInsight } from '@/hooks/useV5PowerModeGeneration';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerCategoryPreviewProps {
  selectedInsights: SelectedInsight[];
  eqScore?: number;
  className?: string;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  triggers: string[];
}

const CATEGORY_CONFIG: Record<CustomerCategory, CategoryConfig> = {
  'pain-driven': {
    label: 'Pain-Driven',
    icon: Zap,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    description: 'Targeting customers with immediate problems needing solutions',
    triggers: ['Pain triggers selected', 'Problem-focused insights', 'Urgency signals detected']
  },
  'aspiration-driven': {
    label: 'Aspiration-Driven',
    icon: Star,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Targeting customers seeking transformation and status',
    triggers: ['Goal-focused triggers', 'Transformation insights', 'Status/identity signals']
  },
  'trust-seeking': {
    label: 'Trust-Seeking',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Targeting customers who need validation before commitment',
    triggers: ['Proof points selected', 'Testimonial insights', 'Authority signals']
  },
  'convenience-driven': {
    label: 'Convenience-Driven',
    icon: Gauge,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Targeting customers who prefer the path of least resistance',
    triggers: ['How-to insights', 'Quick-win content', 'Simplicity focus']
  },
  'value-driven': {
    label: 'Value-Driven',
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    description: 'Targeting customers focused on ROI and outcomes',
    triggers: ['ROI-focused insights', 'Comparison data', 'Value proposition signals']
  },
  'community-driven': {
    label: 'Community-Driven',
    icon: Users,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    description: 'Targeting customers seeking belonging and shared identity',
    triggers: ['Local insights selected', 'Community events', 'Conversation insights']
  }
};

// ============================================================================
// CATEGORY DETECTION LOGIC
// ============================================================================

function detectCategoryFromInsights(insights: SelectedInsight[]): {
  category: CustomerCategory;
  confidence: number;
  reasons: string[];
} {
  if (insights.length === 0) {
    return {
      category: 'value-driven',
      confidence: 0.5,
      reasons: ['Default category (no insights selected)']
    };
  }

  const scores: Record<CustomerCategory, { score: number; reasons: string[] }> = {
    'pain-driven': { score: 0, reasons: [] },
    'aspiration-driven': { score: 0, reasons: [] },
    'trust-seeking': { score: 0, reasons: [] },
    'convenience-driven': { score: 0, reasons: [] },
    'value-driven': { score: 0, reasons: [] },
    'community-driven': { score: 0, reasons: [] }
  };

  for (const insight of insights) {
    switch (insight.type) {
      case 'trigger':
        // Check if pain or aspiration based on category/title
        if (insight.category === 'pain' || insight.title.toLowerCase().includes('problem') || insight.title.toLowerCase().includes('struggle')) {
          scores['pain-driven'].score += 3;
          scores['pain-driven'].reasons.push(`Pain trigger: "${insight.title.slice(0, 30)}..."`);
        } else if (insight.category === 'aspiration' || insight.title.toLowerCase().includes('goal') || insight.title.toLowerCase().includes('dream')) {
          scores['aspiration-driven'].score += 3;
          scores['aspiration-driven'].reasons.push(`Aspiration trigger: "${insight.title.slice(0, 30)}..."`);
        } else {
          scores['pain-driven'].score += 1;
          scores['pain-driven'].reasons.push(`Trigger insight selected`);
        }
        break;

      case 'proof':
        scores['trust-seeking'].score += 3;
        scores['trust-seeking'].reasons.push(`Proof point: "${insight.title.slice(0, 30)}..."`);
        break;

      case 'trend':
        scores['value-driven'].score += 2;
        scores['value-driven'].reasons.push(`Trend insight: "${insight.title.slice(0, 30)}..."`);
        break;

      case 'conversation':
        scores['community-driven'].score += 2;
        scores['community-driven'].reasons.push(`Conversation insight selected`);
        // Also boosts pain if conversation contains pain language
        if (insight.data?.sentiment === 'negative') {
          scores['pain-driven'].score += 1;
        }
        break;

      case 'competitor':
        scores['value-driven'].score += 2;
        scores['value-driven'].reasons.push(`Competitor analysis selected`);
        break;

      case 'local':
        scores['community-driven'].score += 3;
        scores['community-driven'].reasons.push(`Local insight: "${insight.title.slice(0, 30)}..."`);
        break;

      case 'weather':
        scores['convenience-driven'].score += 1;
        scores['convenience-driven'].reasons.push(`Weather context added`);
        break;
    }
  }

  // Find highest scoring category
  let maxCategory: CustomerCategory = 'value-driven';
  let maxScore = 0;

  for (const [cat, data] of Object.entries(scores)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      maxCategory = cat as CustomerCategory;
    }
  }

  // Calculate confidence based on score differential
  const totalScore = Object.values(scores).reduce((sum, d) => sum + d.score, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, 0.5 + (maxScore / totalScore) * 0.5) : 0.5;

  return {
    category: maxCategory,
    confidence,
    reasons: scores[maxCategory].reasons.slice(0, 3) // Top 3 reasons
  };
}

function detectCategoryFromEQ(eqScore: number): CustomerCategory {
  // High EQ (emotional) → pain-driven or aspiration-driven
  // Low EQ (rational) → value-driven or trust-seeking
  if (eqScore >= 80) return 'pain-driven';
  if (eqScore >= 65) return 'aspiration-driven';
  if (eqScore >= 50) return 'community-driven';
  if (eqScore >= 35) return 'value-driven';
  return 'trust-seeking';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CustomerCategoryPreview = memo(function CustomerCategoryPreview({
  selectedInsights,
  eqScore,
  className = ''
}: CustomerCategoryPreviewProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Detect category from insights
  const detection = useMemo(() => {
    return detectCategoryFromInsights(selectedInsights);
  }, [selectedInsights]);

  // If no insights but have EQ score, use that
  const finalCategory = useMemo(() => {
    if (selectedInsights.length === 0 && eqScore !== undefined) {
      return detectCategoryFromEQ(eqScore);
    }
    return detection.category;
  }, [selectedInsights.length, eqScore, detection.category]);

  const config = CATEGORY_CONFIG[finalCategory];
  const Icon = config.icon;

  const confidenceLabel = detection.confidence >= 0.8 ? 'High' : detection.confidence >= 0.6 ? 'Medium' : 'Low';

  return (
    <div className={`relative ${className}`}>
      {/* Main Badge */}
      <motion.button
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <Target className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-xs font-bold ${config.color}`}>
          Targeting: {config.label}
        </span>
        <HelpCircle className="w-3 h-3 text-gray-400" />
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 z-50 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg"
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-3 border-b ${config.borderColor}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <span className={`text-sm font-bold ${config.color}`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <span className={`text-xs font-medium ${
                      confidenceLabel === 'High' ? 'text-green-600' :
                      confidenceLabel === 'Medium' ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {confidenceLabel} ({Math.round(detection.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Description */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>

            {/* Reasons */}
            <div className="p-3">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Why this category?
              </div>
              {detection.reasons.length > 0 ? (
                <ul className="space-y-1">
                  {detection.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span className={config.color}>•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  {eqScore !== undefined
                    ? `Based on EQ score (${eqScore})`
                    : 'Default category - select insights to refine'}
                </p>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-400 italic">
                This is auto-detected. Content will be optimized for this audience.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CustomerCategoryPreview;
