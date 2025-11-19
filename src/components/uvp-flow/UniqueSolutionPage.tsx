/**
 * Unique Solution Page - UVP Flow Step 4
 *
 * Displays extracted differentiators and unique approaches
 * for user confirmation and refinement
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowRight,
  Zap,
  AlertCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Target,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import type { UniqueSolution, Differentiator } from '@/types/uvp-flow.types';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';

interface WebsiteExcerpt {
  text: string;
  url: string;
  confidence: number;
}

interface UniqueSolutionPageProps {
  businessName: string;
  isLoading?: boolean;
  websiteExcerpts?: WebsiteExcerpt[];
  aiSuggestions?: UniqueSolution[];
  onAccept: (solution: UniqueSolution) => void;
  onManualSubmit: (solution: Partial<UniqueSolution>) => void;
  onNext: () => void;
}

export function UniqueSolutionPage({
  businessName,
  isLoading = false,
  websiteExcerpts = [],
  aiSuggestions = [],
  onAccept,
  onManualSubmit,
  onNext
}: UniqueSolutionPageProps) {
  const [acceptedSuggestion, setAcceptedSuggestion] = useState<UniqueSolution | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual form state
  const [manualStatement, setManualStatement] = useState('');
  const [manualDifferentiators, setManualDifferentiators] = useState<string[]>(['']);
  const [manualMethodology, setManualMethodology] = useState('');
  const [manualProprietaryApproach, setManualProprietaryApproach] = useState('');

  const handleAcceptSuggestion = (suggestion: UniqueSolution) => {
    setAcceptedSuggestion(suggestion);
    onAccept(suggestion);
  };

  const handleRejectSuggestion = (id: string) => {
    const newRejected = new Set(rejectedIds);
    newRejected.add(id);
    setRejectedIds(newRejected);
  };

  const handleAddDifferentiator = () => {
    setManualDifferentiators([...manualDifferentiators, '']);
  };

  const handleRemoveDifferentiator = (index: number) => {
    const newDifferentiators = manualDifferentiators.filter((_, i) => i !== index);
    setManualDifferentiators(newDifferentiators);
  };

  const handleUpdateDifferentiator = (index: number, value: string) => {
    const newDifferentiators = [...manualDifferentiators];
    newDifferentiators[index] = value;
    setManualDifferentiators(newDifferentiators);
  };

  const handleManualSubmit = () => {
    if (!manualStatement.trim()) return;

    const differentiators: Differentiator[] = manualDifferentiators
      .filter(d => d.trim())
      .map((statement, index) => ({
        id: `manual-diff-${index}`,
        statement,
        evidence: 'User provided',
        source: {
          type: 'manual' as const,
          url: '',
          title: 'Manual Input',
          lastUpdated: new Date(),
        },
        strengthScore: 100,
      }));

    const solution: Partial<UniqueSolution> = {
      statement: manualStatement,
      differentiators,
      methodology: manualMethodology || undefined,
      proprietaryApproach: manualProprietaryApproach || undefined,
      isManualInput: true,
    };

    onManualSubmit(solution);
    setShowManualForm(false);
  };

  const visibleSuggestions = aiSuggestions.filter(s => !rejectedIds.has(s.id));
  const canProceed = acceptedSuggestion !== null || showManualForm;

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
            UVP Step 4 of 6: Unique Solution
          </span>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
          How Do You Solve It Differently?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          What's your unique approach compared to alternatives?
        </p>
      </motion.div>

      {/* Progress Summary */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Unique Solution Status
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {acceptedSuggestion ? 'Solution Accepted ✓' : 'Review Suggestions'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!acceptedSuggestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Your Own
                </Button>
              )}

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
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      )}

      {/* Website Excerpts Section */}
      {!isLoading && websiteExcerpts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Methodology & Approach Mentions
            </h2>
            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
              {websiteExcerpts.length}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We found these mentions of your unique approach on your website:
          </p>

          <div className="space-y-3">
            {websiteExcerpts.map((excerpt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                  "{excerpt.text}"
                </p>
                <div className="flex items-center justify-between text-xs">
                  <a
                    href={excerpt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View source
                  </a>
                  <span className="text-gray-500 dark:text-gray-500">
                    Confidence: {excerpt.confidence}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Suggestions */}
      {!isLoading && visibleSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI-Suggested Unique Solutions
            </h2>
          </div>

          <div className="space-y-4">
            {visibleSuggestions.map((suggestion, index) => {
              const isAccepted = acceptedSuggestion?.id === suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    bg-white dark:bg-slate-800 rounded-2xl border-2 p-6
                    ${isAccepted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-700'
                    }
                  `}
                >
                  {/* Solution Statement */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
                        {suggestion.statement}
                      </h3>
                      {isAccepted && (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 ml-2" />
                      )}
                    </div>

                    {suggestion.confidence && (
                      <ConfidenceMeter score={suggestion.confidence} compact />
                    )}
                  </div>

                  {/* Differentiators */}
                  {suggestion.differentiators.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Key Differentiators
                      </h4>
                      <div className="space-y-3">
                        {suggestion.differentiators.map((diff) => (
                          <div
                            key={diff.id}
                            className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-medium text-gray-900 dark:text-white flex-1">
                                {diff.statement}
                              </p>
                              <div className="ml-3 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-semibold text-purple-700 dark:text-purple-300">
                                {diff.strengthScore}% strong
                              </div>
                            </div>
                            {diff.evidence && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Evidence: {diff.evidence}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Methodology */}
                  {suggestion.methodology && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Methodology
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {suggestion.methodology}
                      </p>
                    </div>
                  )}

                  {/* Proprietary Approach */}
                  {suggestion.proprietaryApproach && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Proprietary Approach
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {suggestion.proprietaryApproach}
                      </p>
                    </div>
                  )}

                  {/* Sources */}
                  {suggestion.sources && suggestion.sources.length > 0 && (
                    <div className="mb-4">
                      <SourceCitation sources={suggestion.sources} compact />
                    </div>
                  )}

                  {/* Accept/Reject Buttons */}
                  {!isAccepted && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className="gap-2 bg-gradient-to-r from-green-600 to-green-700"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Accept This Solution
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectSuggestion(suggestion.id)}
                        className="gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Manual Input Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Your Own Unique Solution
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Unique Solution Statement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unique Solution Statement *
                </label>
                <textarea
                  value={manualStatement}
                  onChange={(e) => setManualStatement(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="How do you solve the problem differently than others? (e.g., 'We use a proprietary 5-step process that eliminates guesswork and delivers results in half the time')"
                />
              </div>

              {/* Differentiators */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Differentiators
                </label>
                <div className="space-y-2">
                  {manualDifferentiators.map((diff, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={diff}
                        onChange={(e) => handleUpdateDifferentiator(index, e.target.value)}
                        className="flex-1 p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        placeholder={`Differentiator ${index + 1} (e.g., 'Proprietary technology', 'Faster results', 'Lower risk')`}
                      />
                      {manualDifferentiators.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveDifferentiator(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddDifferentiator}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Differentiator
                  </Button>
                </div>
              </div>

              {/* Methodology (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Methodology (optional)
                </label>
                <textarea
                  value={manualMethodology}
                  onChange={(e) => setManualMethodology(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="Describe your unique methodology or process"
                />
              </div>

              {/* Proprietary Approach (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proprietary Approach (optional)
                </label>
                <textarea
                  value={manualProprietaryApproach}
                  onChange={(e) => setManualProprietaryApproach(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="Any proprietary or exclusive approaches you use"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualStatement.trim()}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Solution
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && visibleSuggestions.length === 0 && !showManualForm && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No unique solutions extracted
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find clear differentiators or unique approaches on {businessName}'s website.
            Create your own to continue.
          </p>
          <Button onClick={() => setShowManualForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Unique Solution
          </Button>
        </div>
      )}
    </div>
  );
}
