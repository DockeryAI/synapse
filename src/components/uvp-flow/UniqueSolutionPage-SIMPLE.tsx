/**
 * Unique Solution Page - UVP Flow Step 4
 * SIMPLIFIED VERSION - Matches TargetCustomerPage-SIMPLE design
 *
 * Created: 2025-11-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { UniqueSolution } from '@/types/uvp-flow.types';

interface UniqueSolutionPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  competitorInfo?: string[];
  preloadedData?: any;
  value?: string;
  onChange?: (value: string) => void;
  onSolutionsSelected?: (solutions: UniqueSolution[]) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
}

export function UniqueSolutionPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  competitorInfo = [],
  preloadedData,
  value = '',
  onChange,
  onSolutionsSelected,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 60,
  className = ''
}: UniqueSolutionPageProps) {
  const [solutions, setSolutions] = useState<UniqueSolution[]>([]);
  const [selectedSolutions, setSelectedSolutions] = useState<UniqueSolution[]>([]);
  // Start as loading if we don't have data yet
  const [isLoading, setIsLoading] = useState(!preloadedData || (preloadedData as any).loading === true);
  const hasLoadedPreloadedData = useRef(false);

  // Manual input state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSolutionStatement, setNewSolutionStatement] = useState('');

  // Load preloaded data - ONLY use preloaded data, never auto-generate
  useEffect(() => {
    console.log('[UniqueSolutionPage-SIMPLE] useEffect triggered', {
      hasPreloadedData: !!preloadedData,
      isLoading: preloadedData && (preloadedData as any).loading,
      hasSolutions: preloadedData && preloadedData.solutions && preloadedData.solutions.length,
      solutionsCount: solutions.length,
      hasLoadedBefore: hasLoadedPreloadedData.current
    });

    // Check if data is still loading in background
    if (preloadedData && (preloadedData as any).loading) {
      console.log('[UniqueSolutionPage-SIMPLE] ⏳ Data is loading in background...');
      setIsLoading(true);
      return;
    }

    // If we have pre-loaded data with solutions AND haven't loaded it before
    if (preloadedData && preloadedData.solutions && preloadedData.solutions.length > 0) {
      if (hasLoadedPreloadedData.current && solutions.length > 0) {
        console.log('[UniqueSolutionPage-SIMPLE] ✓ Data already loaded, skipping');
        return;
      }

      console.log('[UniqueSolutionPage-SIMPLE] 📥 Loading pre-loaded data:', preloadedData.solutions.length, 'solutions');
      console.log('[UniqueSolutionPage-SIMPLE] Sample solution:', JSON.stringify(preloadedData.solutions[0], null, 2));
      setSolutions(preloadedData.solutions);
      setIsLoading(false);
      hasLoadedPreloadedData.current = true;
      return;
    }

    // If no preloadedData yet, just wait - progressive loading will provide it
    if (!preloadedData) {
      console.log('[UniqueSolutionPage-SIMPLE] ⏳ Waiting for progressive loading...');
      setIsLoading(true);
      return;
    }

    // If we get here, preloadedData exists but has no solutions - show empty state
    console.log('[UniqueSolutionPage-SIMPLE] No solutions found in preloaded data');
    setIsLoading(false);
  }, [preloadedData]);

  const handleSelectSolution = (solution: UniqueSolution) => {
    setSelectedSolutions(prev => {
      const isAlreadySelected = prev.some(s => s.id === solution.id);

      const updated = isAlreadySelected
        ? prev.filter(s => s.id !== solution.id)
        : [...prev, solution];

      // Schedule callbacks for next tick to avoid setState during render
      setTimeout(() => {
        if (onChange) {
          onChange(updated.map(s => s.statement || s.methodology || '').join('; '));
        }
        if (onSolutionsSelected) {
          onSolutionsSelected(updated);
        }
      }, 0);

      return updated;
    });
  };

  const handleContinue = () => {
    // Ensure parent has latest selections before proceeding
    if (onSolutionsSelected) {
      onSolutionsSelected(selectedSolutions);
    }
    onNext();
  };

  const handleAddManualSolution = () => {
    if (!newSolutionStatement.trim()) return;

    const newSolution: UniqueSolution = {
      id: `manual-${Date.now()}`,
      statement: newSolutionStatement.trim(),
      methodology: '',
      differentiators: [],
      proprietaryApproach: '',
      confidence: {
        overall: 100,
        dataQuality: 100,
        sourceCount: 1,
        modelAgreement: 100,
        reasoning: 'Manual input'
      },
      sources: [{
        id: `source-${Date.now()}`,
        type: 'manual-input' as const,
        name: 'Manual Input',
        url: '',
        extractedAt: new Date(),
        reliability: 100,
        dataPoints: 1
      }],
      isManualInput: true
    };

    setSolutions(prev => [newSolution, ...prev]);
    setSelectedSolutions(prev => [newSolution, ...prev]);
    setNewSolutionStatement('');
    setShowAddForm(false);
  };

  const canProceed = selectedSolutions.length > 0;

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
            <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UVP Step 4 of 6: Unique Solution
            </span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            How Do You Solve It Differently?
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            What's your unique approach, methodology, or proprietary process that sets you apart from alternatives?
          </p>
        </motion.div>

      {/* Progress Summary */}
      {!isLoading && solutions.length > 0 && (
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
                {selectedSolutions.length} of {solutions.length} selected
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Manually</span>
              </Button>

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
              animate={{ width: `${(selectedSolutions.length / solutions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </motion.div>
      )}

      {/* Manual Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-500 dark:border-purple-600 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Your Unique Solution
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Textarea
              placeholder="Describe your unique approach, methodology, or proprietary process..."
              value={newSolutionStatement}
              onChange={(e) => setNewSolutionStatement(e.target.value)}
              className="mb-4 min-h-[100px]"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAddManualSolution}
                disabled={!newSolutionStatement.trim()}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Solution
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewSolutionStatement('');
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Unique Solutions */}
      <AnimatePresence mode="popLayout">
        {!isLoading && solutions.map((solution, index) => {
          const isSelected = selectedSolutions.some(s => s.id === solution.id);

          return (
            <motion.div
              key={solution.id}
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
              onClick={() => handleSelectSolution(solution)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {solution.statement || solution.methodology || 'Unique Solution'}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  {solution.methodology && solution.methodology !== solution.statement && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {solution.methodology}
                    </p>
                  )}

                  {solution.differentiators && solution.differentiators.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                        Key Differentiators
                      </p>
                      <div className="space-y-1">
                        {solution.differentiators.slice(0, 3).map((diff, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {typeof diff === 'string' ? diff : diff.statement}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {solution.proprietaryApproach && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                        Proprietary Approach
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {solution.proprietaryApproach}
                      </p>
                    </div>
                  )}

                  {solution.confidence && typeof solution.confidence === 'object' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Confidence: {solution.confidence.overall}%
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
      {!isLoading && solutions.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Unique Solutions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't identify specific unique solutions from your website.
            You can still proceed and define your solution manually.
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
