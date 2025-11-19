/**
 * Transformation Goal Page - UVP Flow Step 3
 *
 * The MARBA critical question: "What Are They REALLY Trying to Achieve?"
 * Extracts emotional vs functional transformation goals from customer evidence
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Heart,
  Brain,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  X,
  Plus,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import type { TransformationGoal, CustomerQuote } from '@/types/uvp-flow.types';

interface TransformationGoalPageProps {
  businessName: string;
  isLoading?: boolean;
  customerQuotes?: CustomerQuote[];
  aiSuggestions?: TransformationGoal[];
  eqScore?: { emotional: number; rational: number; overall: number };
  onAccept: (goal: TransformationGoal) => void;
  onManualSubmit: (goal: Partial<TransformationGoal>) => void;
  onNext: () => void;
}

export function TransformationGoalPage({
  businessName,
  isLoading = false,
  customerQuotes = [],
  aiSuggestions = [],
  eqScore,
  onAccept,
  onManualSubmit,
  onNext
}: TransformationGoalPageProps) {
  // Quote carousel state
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Manual input state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualStatement, setManualStatement] = useState('');
  const [emotionalDrivers, setEmotionalDrivers] = useState<string[]>([]);
  const [functionalDrivers, setFunctionalDrivers] = useState<string[]>([]);
  const [newEmotionalDriver, setNewEmotionalDriver] = useState('');
  const [newFunctionalDriver, setNewFunctionalDriver] = useState('');

  // Selection state
  const [selectedGoal, setSelectedGoal] = useState<TransformationGoal | null>(null);

  // Quote carousel navigation
  const nextQuote = () => {
    if (currentQuoteIndex < customerQuotes.length - 1) {
      setCurrentQuoteIndex(currentQuoteIndex + 1);
    }
  };

  const prevQuote = () => {
    if (currentQuoteIndex > 0) {
      setCurrentQuoteIndex(currentQuoteIndex - 1);
    }
  };

  // Add emotional driver chip
  const addEmotionalDriver = () => {
    if (newEmotionalDriver.trim() && !emotionalDrivers.includes(newEmotionalDriver.trim())) {
      setEmotionalDrivers([...emotionalDrivers, newEmotionalDriver.trim()]);
      setNewEmotionalDriver('');
    }
  };

  // Add functional driver chip
  const addFunctionalDriver = () => {
    if (newFunctionalDriver.trim() && !functionalDrivers.includes(newFunctionalDriver.trim())) {
      setFunctionalDrivers([...functionalDrivers, newFunctionalDriver.trim()]);
      setNewFunctionalDriver('');
    }
  };

  // Remove chip
  const removeEmotionalDriver = (driver: string) => {
    setEmotionalDrivers(emotionalDrivers.filter(d => d !== driver));
  };

  const removeFunctionalDriver = (driver: string) => {
    setFunctionalDrivers(functionalDrivers.filter(d => d !== driver));
  };

  // Handle manual submit
  const handleManualSubmit = () => {
    if (!manualStatement.trim()) return;

    const manualGoal: Partial<TransformationGoal> = {
      statement: manualStatement,
      emotionalDrivers,
      functionalDrivers,
      isManualInput: true
    };

    onManualSubmit(manualGoal);
    setShowManualForm(false);
  };

  // Handle accept AI suggestion
  const handleAcceptSuggestion = (goal: TransformationGoal) => {
    setSelectedGoal(goal);
    onAccept(goal);
  };

  // Highlight emotional vs functional language in quotes
  const highlightQuoteLanguage = (text: string, emotionalWeight: number) => {
    // Simple heuristic: emotional words vs functional words
    const emotionalKeywords = ['feel', 'confident', 'peace of mind', 'stress', 'worry', 'relief', 'frustrated', 'overwhelmed', 'excited', 'proud'];
    const functionalKeywords = ['save', 'time', 'money', 'reduce', 'increase', 'improve', 'faster', 'efficient', 'cost', 'revenue'];

    let highlighted = text;

    // Highlight emotional words
    emotionalKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      highlighted = highlighted.replace(regex, match =>
        `<span class="emotional-highlight">${match}</span>`
      );
    });

    // Highlight functional words
    functionalKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      highlighted = highlighted.replace(regex, match =>
        `<span class="functional-highlight">${match}</span>`
      );
    });

    return highlighted;
  };

  const currentQuote = customerQuotes[currentQuoteIndex];
  const canProceed = selectedGoal !== null || (manualStatement.trim() && emotionalDrivers.length > 0 && functionalDrivers.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <style>{`
        .emotional-highlight {
          background: linear-gradient(120deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.3) 100%);
          border-bottom: 2px solid rgba(236, 72, 153, 0.6);
          font-weight: 600;
          padding: 0 2px;
        }
        .functional-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.3) 100%);
          border-bottom: 2px solid rgba(59, 130, 246, 0.6);
          font-weight: 600;
          padding: 0 2px;
        }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            UVP Step 3 of 6: Transformation Goal
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          What Are They REALLY Trying to Achieve?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Beyond the surface problem, what transformation are they seeking?
          Is it emotional, functional, or both?
        </p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      )}

      {/* EQ Score Visualization */}
      {!isLoading && eqScore && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Emotional Intelligence (EQ) Score
              </h3>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {Math.round(eqScore.overall)}%
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your customers' transformation is{' '}
              {eqScore.emotional > eqScore.rational ? (
                <span className="font-semibold text-pink-600 dark:text-pink-400">emotionally-driven</span>
              ) : eqScore.rational > eqScore.emotional ? (
                <span className="font-semibold text-blue-600 dark:text-blue-400">functionally-driven</span>
              ) : (
                <span className="font-semibold text-purple-600 dark:text-purple-400">balanced</span>
              )}
            </p>

            {/* Visual EQ Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emotional</span>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{Math.round(eqScore.emotional)}%</span>
                  </div>
                  <div className="h-3 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${eqScore.emotional}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-pink-500 to-pink-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Functional</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(eqScore.rational)}%</span>
                  </div>
                  <div className="h-3 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${eqScore.rational}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {eqScore.emotional > 70 && (
                  <>
                    <strong>High Emotional:</strong> Your customers are driven by feelings - confidence, peace of mind, status, belonging.
                    Lead with emotional benefits, use storytelling, and emphasize how they'll <em>feel</em> after transformation.
                  </>
                )}
                {eqScore.rational > 70 && (
                  <>
                    <strong>High Functional:</strong> Your customers are logic-driven - metrics, ROI, efficiency, cost savings.
                    Lead with data, use concrete numbers, and emphasize <em>measurable</em> outcomes.
                  </>
                )}
                {eqScore.emotional <= 70 && eqScore.rational <= 70 && (
                  <>
                    <strong>Balanced Approach:</strong> Your customers need both emotional and functional justification.
                    Use a dual approach: lead with emotion to hook them, then back it up with hard data to close the deal.
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Customer Quote Carousel */}
      {!isLoading && customerQuotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Customer Evidence
              </h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentQuoteIndex + 1} of {customerQuotes.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {currentQuote && (
              <motion.div
                key={currentQuoteIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Quote Text with Highlighting */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <p
                    className="text-lg text-gray-900 dark:text-white leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightQuoteLanguage(currentQuote.text, currentQuote.emotionalWeight)
                    }}
                  />
                </div>

                {/* Quote Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Emotional: {Math.round(currentQuote.emotionalWeight)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Relevance: {Math.round(currentQuote.relevanceScore)}%
                      </span>
                    </div>
                  </div>

                  {currentQuote.source && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {currentQuote.source.type}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={prevQuote}
              disabled={currentQuoteIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Quote Indicators */}
            <div className="flex items-center gap-2">
              {customerQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuoteIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentQuoteIndex
                      ? 'bg-purple-600 w-6'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextQuote}
              disabled={currentQuoteIndex === customerQuotes.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded emotional-highlight"></div>
                <span>Emotional Language</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded functional-highlight"></div>
                <span>Functional Language</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Suggestions */}
      {!isLoading && aiSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI-Detected Transformation Goals
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Custom
            </Button>
          </div>

          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => {
              const isSelected = selectedGoal?.id === suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-6 rounded-xl border-2 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }
                  `}
                  onClick={() => handleAcceptSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {suggestion.statement}
                        </p>
                      </div>

                      {/* Drivers */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Emotional Drivers */}
                        {suggestion.emotionalDrivers.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Emotional Drivers
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.emotionalDrivers.map((driver, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs rounded-full"
                                >
                                  {driver}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Functional Drivers */}
                        {suggestion.functionalDrivers.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Functional Drivers
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.functionalDrivers.map((driver, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                >
                                  {driver}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confidence */}
                      {suggestion.confidence && (
                        <div className="mt-2">
                          <ConfidenceMeter score={suggestion.confidence} compact />
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Manual Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Custom Transformation Goal
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
              {/* Statement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transformation Statement
                </label>
                <textarea
                  value={manualStatement}
                  onChange={(e) => setManualStatement(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="e.g., They want to feel confident they're making the right choice without wasting hours researching"
                />
              </div>

              {/* Emotional Drivers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emotional Drivers
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEmotionalDriver}
                      onChange={(e) => setNewEmotionalDriver(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEmotionalDriver()}
                      className="flex-1 p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Peace of mind"
                    />
                    <Button onClick={addEmotionalDriver} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emotionalDrivers.map((driver, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-sm rounded-full"
                      >
                        {driver}
                        <button
                          onClick={() => removeEmotionalDriver(driver)}
                          className="hover:text-pink-900 dark:hover:text-pink-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Functional Drivers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Functional Drivers
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFunctionalDriver}
                      onChange={(e) => setNewFunctionalDriver(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFunctionalDriver()}
                      className="flex-1 p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Save 10 hours per week"
                    />
                    <Button onClick={addFunctionalDriver} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {functionalDrivers.map((driver, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                      >
                        {driver}
                        <button
                          onClick={() => removeFunctionalDriver(driver)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualStatement.trim() || emotionalDrivers.length === 0 || functionalDrivers.length === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Transformation Goal
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
      {!isLoading && aiSuggestions.length === 0 && customerQuotes.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No transformation insights found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't extract transformation goals from your website.
            Create one manually to continue.
          </p>
          <Button onClick={() => setShowManualForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Transformation Goal
          </Button>
        </div>
      )}

      {/* Continue Button */}
      {!isLoading && canProceed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button
            onClick={onNext}
            size="lg"
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Continue to Unique Solution
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Data Sources */}
      {!isLoading && selectedGoal && selectedGoal.sources && selectedGoal.sources.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Data Sources
          </h3>
          <SourceCitation sources={selectedGoal.sources} />
        </div>
      )}
    </div>
  );
}
