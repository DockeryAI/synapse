/**
 * Transformation Goal Page - UVP Flow Step 3
 * SIMPLIFIED VERSION - Matches TargetCustomerPage-SIMPLE design
 *
 * Created: 2025-11-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Zap, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UVPMilestoneProgress, type UVPStep } from './UVPMilestoneProgress';
import type { TransformationGoal } from '@/types/uvp-flow.types';

/**
 * Format transformation statement from "Transform from X to Y" to "From X → To Y"
 */
function formatTransformationStatement(statement: string): React.ReactNode {
  // Match pattern: "Transform from X to Y" or "From X to Y"
  const transformMatch = statement.match(/(?:Transform\s+)?[Ff]rom\s+(.+?)\s+to\s+(.+)/i);

  if (transformMatch) {
    const [, fromPart, toPart] = transformMatch;
    return (
      <>
        <span className="text-gray-600 dark:text-gray-400">From</span>{' '}
        {fromPart.trim()}{' '}
        <span className="text-purple-600 dark:text-purple-400 mx-2">→</span>{' '}
        <span className="text-gray-600 dark:text-gray-400">to</span>{' '}
        {toPart.trim()}
      </>
    );
  }

  // Fallback: return as-is
  return statement;
}

interface TransformationGoalPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  preloadedData?: any;
  value?: string;
  onChange?: (value: string) => void;
  onGoalsSelected?: (goals: TransformationGoal[]) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
  completedSteps?: UVPStep[];
  onStepClick?: (step: UVPStep) => void;
}

export function TransformationGoalPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  preloadedData,
  value = '',
  onChange,
  onGoalsSelected,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 40,
  className = '',
  completedSteps = [],
  onStepClick
}: TransformationGoalPageProps) {
  const [goals, setGoals] = useState<TransformationGoal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<TransformationGoal[]>([]);
  // Start as loading if we don't have data yet
  const [isLoading, setIsLoading] = useState(!preloadedData || (preloadedData as any).loading === true);
  const hasLoadedPreloadedData = useRef(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransformationStatement, setNewTransformationStatement] = useState('');

  // Load preloaded data - ONLY use preloaded data, never auto-generate
  useEffect(() => {
    console.log('[TransformationGoalPage-SIMPLE] useEffect triggered', {
      hasPreloadedData: !!preloadedData,
      isLoading: preloadedData && (preloadedData as any).loading,
      hasGoals: preloadedData && (preloadedData.goals?.length || preloadedData.transformations?.length),
      goalsCount: goals.length,
      hasLoadedBefore: hasLoadedPreloadedData.current
    });

    // Check if data is still loading in background
    if (preloadedData && (preloadedData as any).loading) {
      console.log('[TransformationGoalPage-SIMPLE] ⏳ Data is loading in background...');
      setIsLoading(true);
      return;
    }

    // If we have pre-loaded data with goals AND haven't loaded it before
    // Check both 'goals' and 'transformations' properties for compatibility
    const preloadedGoals = preloadedData?.goals || preloadedData?.transformations;
    if (preloadedData && preloadedGoals && preloadedGoals.length > 0) {
      if (hasLoadedPreloadedData.current && goals.length > 0) {
        console.log('[TransformationGoalPage-SIMPLE] ✓ Data already loaded, skipping');
        return;
      }

      console.log('[TransformationGoalPage-SIMPLE] 📥 Loading pre-loaded data:', preloadedGoals.length, 'goals');
      console.log('[TransformationGoalPage-SIMPLE] Sample goal:', JSON.stringify(preloadedGoals[0], null, 2));
      setGoals(preloadedGoals);
      setIsLoading(false);
      hasLoadedPreloadedData.current = true;
      return;
    }

    // If no preloadedData yet, just wait - progressive loading will provide it
    if (!preloadedData) {
      console.log('[TransformationGoalPage-SIMPLE] ⏳ Waiting for progressive loading...');
      setIsLoading(true);
      return;
    }

    // If we get here, preloadedData exists but has no goals
    // IMPORTANT: Only show empty state if loading is explicitly complete
    // Check if there's a 'complete' or 'error' flag, otherwise keep loading
    const isExplicitlyComplete = (preloadedData as any).complete === true ||
                                  (preloadedData as any).error !== undefined;

    if (isExplicitlyComplete) {
      console.log('[TransformationGoalPage-SIMPLE] Loading complete, no goals found in preloaded data');
      setIsLoading(false);
    } else {
      console.log('[TransformationGoalPage-SIMPLE] ⏳ Preloaded data exists but incomplete, continuing to wait...');
      setIsLoading(true);
    }
  }, [preloadedData]);

  const handleSelectGoal = (goal: TransformationGoal) => {
    setSelectedGoals(prev => {
      const isAlreadySelected = prev.some(g => g.id === goal.id);

      const updated = isAlreadySelected
        ? prev.filter(g => g.id !== goal.id)
        : [...prev, goal];

      // Schedule callbacks for next tick to avoid setState during render
      setTimeout(() => {
        if (onChange) {
          onChange(updated.map(g => g.statement).join('; '));
        }
        if (onGoalsSelected) {
          onGoalsSelected(updated);
        }
      }, 0);

      return updated;
    });
  };

  const handleAddManualTransformation = () => {
    if (!newTransformationStatement.trim()) return;

    // Create new transformation goal
    const newGoal: TransformationGoal = {
      id: `manual-${Date.now()}`,
      statement: newTransformationStatement.trim(),
      emotionalDrivers: [],
      functionalDrivers: [],
      confidence: { overall: 100, dataQuality: 100, sourceCount: 1, modelAgreement: 100 },
      sources: [{
        id: `source-${Date.now()}`,
        type: 'manual-input' as const,
        name: 'Manual Input',
        url: '',
        extractedAt: new Date(),
        reliability: 100,
        dataPoints: 1
      }],
      customerQuotes: [],
      isManualInput: true
    };

    // Add to goals list
    setGoals(prev => [newGoal, ...prev]);

    // Auto-select it
    setSelectedGoals(prev => [newGoal, ...prev]);

    // Reset form
    setNewTransformationStatement('');
    setShowAddForm(false);
  };

  const handleContinue = () => {
    // Ensure parent has latest selections before proceeding
    if (onGoalsSelected) {
      onGoalsSelected(selectedGoals);
    }
    onNext();
  };

  const canProceed = selectedGoals.length > 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Milestone Progress */}
        <UVPMilestoneProgress
          currentStep="transformation"
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UVP Step 3 of 6: Transformation Goal
            </span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            What Are They REALLY Trying to Achieve?
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Beyond the surface problem, what transformation are your customers seeking? Is it emotional, functional, or both?
          </p>
        </motion.div>

      {/* Progress Summary */}
      {!isLoading && goals.length > 0 && (
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
                {selectedGoals.length} of {goals.length} selected
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
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Manually</span>
              </Button>

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
              animate={{ width: `${(selectedGoals.length / goals.length) * 100}%` }}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-500 dark:border-purple-400 p-6 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Transformation Goal
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transformation Statement
                </label>
                <textarea
                  value={newTransformationStatement}
                  onChange={(e) => setNewTransformationStatement(e.target.value)}
                  placeholder="e.g., From financial stress and uncertainty to peace of mind with a clear financial plan"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleAddManualTransformation();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Press ⌘+Enter to add
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddManualTransformation}
                  disabled={!newTransformationStatement.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Transformation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTransformationStatement('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Transformation Goals */}
      <AnimatePresence mode="popLayout">
        {!isLoading && goals.map((goal, index) => {
          const isSelected = selectedGoals.some(g => g.id === goal.id);

          return (
            <motion.div
              key={goal.id}
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
              onClick={() => handleSelectGoal(goal)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatTransformationStatement(goal.statement)}
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {goal.emotionalDrivers && goal.emotionalDrivers.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                          Emotional Drivers
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {goal.emotionalDrivers.slice(0, 3).map((driver, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                              {driver}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.functionalDrivers && goal.functionalDrivers.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                          Functional Drivers
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {goal.functionalDrivers.slice(0, 3).map((driver, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {driver}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {goal.eqScore && (
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Emotional: {goal.eqScore.emotional}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Rational: {goal.eqScore.rational}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500 font-semibold">
                          Overall: {goal.eqScore.overall}%
                        </span>
                      </div>
                    </div>
                  )}

                  {goal.customerQuotes && goal.customerQuotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                        Customer Quotes
                      </p>
                      {goal.customerQuotes.slice(0, 2).map((quote, idx) => (
                        <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 italic pl-3 border-l-2 border-gray-300 dark:border-slate-600">
                          "{typeof quote === 'string' ? quote : quote.text}"
                        </p>
                      ))}
                    </div>
                  )}

                  {goal.confidence && typeof goal.confidence === 'object' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Confidence: {goal.confidence.overall}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                <div className="flex-shrink-0">
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && goals.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Transformation Goals Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't identify specific transformation goals from your website.
            You can still proceed and define your goals manually.
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
