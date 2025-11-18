/**
 * Value Proposition Page - Onboarding V5
 *
 * First page of the 3-page onboarding flow
 * Displays AI-discovered value propositions with confidence scoring and source citations
 *
 * Created: 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Target
} from 'lucide-react';
import { ConfidenceMeter, type ConfidenceScore } from './ConfidenceMeter';
import { SourceCitation, type DataSource } from './SourceCitation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export interface ValueProposition {
  id: string;
  statement: string;
  category: 'core' | 'secondary' | 'aspirational';
  confidence: ConfidenceScore;
  sources: DataSource[];
  marketPosition: string; // e.g., "Premium specialist", "Budget leader"
  differentiators: string[]; // Key differentiators
  validated: boolean;
  userEdited?: boolean;
}

interface ValuePropositionPageProps {
  businessName: string;
  industry: string;
  isLoading?: boolean;
  propositions?: ValueProposition[];
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, newStatement: string) => void;
  onRegenerateAll: () => void;
  onNext: () => void;
}

export function ValuePropositionPage({
  businessName,
  industry,
  isLoading = false,
  propositions = [],
  onValidate,
  onReject,
  onEdit,
  onRegenerateAll,
  onNext
}: ValuePropositionPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ValueProposition['category']>('all');

  const validatedCount = propositions.filter(p => p.validated).length;
  const canProceed = validatedCount > 0;

  const filteredPropositions = selectedCategory === 'all'
    ? propositions
    : propositions.filter(p => p.category === selectedCategory);

  const handleEdit = (id: string) => {
    const prop = propositions.find(p => p.id === id);
    if (prop) {
      setEditingId(id);
      setEditValue(prop.statement);
    }
  };

  const handleSaveEdit = (id: string) => {
    onEdit(id, editValue);
    setEditingId(null);
    setEditValue('');
  };

  const getCategoryLabel = (category: ValueProposition['category']) => {
    switch (category) {
      case 'core':
        return { label: 'Core Value', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' };
      case 'secondary':
        return { label: 'Supporting Value', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' };
      case 'aspirational':
        return { label: 'Aspirational', color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Step 1 of 3: Value Discovery
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Your Value Propositions
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We've analyzed {businessName}'s digital presence across multiple sources to discover
          what makes you valuable to customers. Review and validate these findings.
        </p>
      </motion.div>

      {/* Progress Summary */}
      {!isLoading && propositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Validation Progress
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {validatedCount} of {propositions.length} validated
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateAll}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate All
              </Button>

              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 h-2 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(validatedCount / propositions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      {!isLoading && propositions.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All ({propositions.length})
          </Button>
          <Button
            variant={selectedCategory === 'core' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('core')}
          >
            Core ({propositions.filter(p => p.category === 'core').length})
          </Button>
          <Button
            variant={selectedCategory === 'secondary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('secondary')}
          >
            Supporting ({propositions.filter(p => p.category === 'secondary').length})
          </Button>
          <Button
            variant={selectedCategory === 'aspirational' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('aspirational')}
          >
            Aspirational ({propositions.filter(p => p.category === 'aspirational').length})
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-32 flex-1" />
                  <Skeleton className="h-32 flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Value Propositions */}
      <AnimatePresence mode="popLayout">
        {!isLoading && filteredPropositions.map((prop, index) => {
          const categoryInfo = getCategoryLabel(prop.category);
          const isEditing = editingId === prop.id;

          return (
            <motion.div
              key={prop.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all
                ${prop.validated
                  ? 'border-green-500 shadow-lg shadow-green-500/20'
                  : 'border-gray-200 dark:border-slate-700'
                }
              `}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      {prop.userEdited && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          Edited
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(prop.id)}>
                            Save Changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                        {prop.statement}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prop.id)}
                      className="ml-4"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Market Position & Differentiators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Target className="w-4 h-4" />
                      Market Position
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                      {prop.marketPosition}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Lightbulb className="w-4 h-4" />
                      Key Differentiators
                    </div>
                    <ul className="pl-6 space-y-1">
                      {prop.differentiators.map((diff, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                          • {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Confidence & Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Confidence Score
                    </h4>
                    <ConfidenceMeter score={prop.confidence} />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Data Sources
                    </h4>
                    <SourceCitation sources={prop.sources} compact />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {prop.validated ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Validated
                      </div>
                    ) : (
                      'Review this value proposition'
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!prop.validated ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(prop.id)}
                          className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onValidate(prop.id)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Validate
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(prop.id)}
                      >
                        Unvalidate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && propositions.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">🤔</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No value propositions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try regenerating or check your business data inputs
          </p>
          <Button onClick={onRegenerateAll} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Generate Value Propositions
          </Button>
        </div>
      )}
    </div>
  );
}
