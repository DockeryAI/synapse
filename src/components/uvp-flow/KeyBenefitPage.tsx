/**
 * Key Benefit Page - UVP Flow Step 5
 *
 * Displays industry benchmarks, outcome evidence, and EQ-informed framing
 * for the key benefit user's business delivers
 *
 * Created: 2025-11-18
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
  Target,
  Brain,
  Heart,
  BarChart3,
  Quote,
  Minus,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import type {
  KeyBenefit,
  BenefitMetric,
  IndustryBenchmark
} from '@/types/uvp-flow.types';

interface KeyBenefitPageProps {
  businessName: string;
  isLoading?: boolean;
  industryBenchmark?: IndustryBenchmark;
  outcomeEvidence?: BenefitMetric[];
  eqRecommendation?: 'emotional' | 'rational' | 'balanced';
  aiSuggestions?: KeyBenefit[];
  onAccept: (benefit: KeyBenefit) => void;
  onManualSubmit: (benefit: Partial<KeyBenefit>) => void;
  onNext: () => void;
}

export function KeyBenefitPage({
  businessName,
  isLoading = false,
  industryBenchmark,
  outcomeEvidence = [],
  eqRecommendation = 'balanced',
  aiSuggestions = [],
  onAccept,
  onManualSubmit,
  onNext
}: KeyBenefitPageProps) {
  // State for manual input
  const [showManualForm, setShowManualForm] = useState(false);
  const [benefitStatement, setBenefitStatement] = useState('');
  const [outcomeType, setOutcomeType] = useState<'quantifiable' | 'qualitative' | 'mixed'>('quantifiable');
  const [selectedFraming, setSelectedFraming] = useState<'emotional' | 'rational' | 'balanced'>(eqRecommendation);
  const [metrics, setMetrics] = useState<Array<{
    id: string;
    metric: string;
    value: string;
    timeframe: string;
  }>>([]);

  // State for AI suggestions
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Add new metric
  const addMetric = () => {
    setMetrics([
      ...metrics,
      {
        id: `metric-${Date.now()}`,
        metric: '',
        value: '',
        timeframe: ''
      }
    ]);
  };

  // Remove metric
  const removeMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
  };

  // Update metric
  const updateMetric = (id: string, field: 'metric' | 'value' | 'timeframe', value: string) => {
    setMetrics(metrics.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // Handle AI suggestion acceptance
  const handleAcceptSuggestion = (suggestion: KeyBenefit) => {
    setSelectedSuggestionId(suggestion.id);
    onAccept(suggestion);
  };

  // Handle AI suggestion rejection
  const handleRejectSuggestion = (id: string) => {
    setRejectedIds(new Set([...rejectedIds, id]));
  };

  // Handle manual submission
  const handleManualSubmit = () => {
    if (!benefitStatement.trim()) return;

    onManualSubmit({
      statement: benefitStatement,
      outcomeType,
      eqFraming: selectedFraming,
      metrics: metrics.filter(m => m.metric && m.value).map(m => ({
        id: m.id,
        metric: m.metric,
        value: m.value,
        timeframe: m.timeframe,
        source: {
          id: `source-${m.id}`,
          type: 'manual' as const,
          name: 'User Input',
          url: '',
          extractedAt: new Date(),
          reliability: 100,
          dataPoints: 1
        }
      })),
      isManualInput: true
    });

    // Reset form
    setBenefitStatement('');
    setMetrics([]);
    setShowManualForm(false);
  };

  // Generate framing preview
  const generateFramingPreview = (framing: 'emotional' | 'rational' | 'balanced') => {
    const statement = benefitStatement || 'Achieve better results for your business';

    switch (framing) {
      case 'emotional':
        return `Feel the confidence that comes from ${statement.toLowerCase()}`;
      case 'rational':
        return `Measurably ${statement.toLowerCase()} through proven methods`;
      case 'balanced':
        return `${statement} while gaining peace of mind`;
      default:
        return statement;
    }
  };

  // Prepare benchmark chart data
  const benchmarkData = useMemo(() => {
    if (!industryBenchmark) return [];

    // Parse results to numbers for comparison
    const parseValue = (val: string) => {
      const match = val.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    return [
      {
        name: 'Industry Average',
        value: parseValue(industryBenchmark.averageResult),
        label: industryBenchmark.averageResult
      },
      {
        name: 'Your Result',
        value: parseValue(industryBenchmark.yourResult),
        label: industryBenchmark.yourResult
      }
    ];
  }, [industryBenchmark]);

  const visibleSuggestions = aiSuggestions.filter(s => !rejectedIds.has(s.id));
  const canProceed = selectedSuggestionId !== null || (benefitStatement.trim().length > 0);

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
            UVP Step 5 of 6: Key Benefit
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          What's the Key Benefit?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          The #1 measurable outcome your customers achieve
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

      {/* Industry Benchmark Comparison */}
      {!isLoading && industryBenchmark && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Industry Benchmark Comparison
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number, name: string, props: any) => [props.payload.label, 'Result']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {benchmarkData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#9333ea' : industryBenchmark.isAboveAverage ? '#10b981' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Result
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {industryBenchmark.yourResult}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Industry Average ({industryBenchmark.industry})
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {industryBenchmark.averageResult}
                </div>
              </div>

              {industryBenchmark.percentile && (
                <div className={`rounded-xl p-4 ${
                  industryBenchmark.isAboveAverage
                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${
                      industryBenchmark.isAboveAverage
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                    <div>
                      <div className="text-sm font-semibold">
                        {industryBenchmark.percentile}th Percentile
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {industryBenchmark.isAboveAverage ? 'Above' : 'Below'} industry average
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Outcome Evidence */}
      {!isLoading && outcomeEvidence.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Outcome Evidence
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {outcomeEvidence.map((evidence) => (
              <div
                key={evidence.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {evidence.metric}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 my-1">
                      {evidence.value}
                    </div>
                    {evidence.timeframe && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        in {evidence.timeframe}
                      </div>
                    )}
                    {evidence.source && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Source: {evidence.source.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* EQ-Informed Framing Toggle */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Message Framing
            </h3>
            <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
              Recommended: {eqRecommendation}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose how to frame your key benefit based on your audience's decision-making style
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {/* Emotional */}
            <button
              onClick={() => setSelectedFraming('emotional')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedFraming === 'emotional'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className={`w-5 h-5 ${
                  selectedFraming === 'emotional' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Emotional
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Focus on feelings, relief, and emotional outcomes
              </p>
            </button>

            {/* Rational */}
            <button
              onClick={() => setSelectedFraming('rational')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedFraming === 'rational'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={`w-5 h-5 ${
                  selectedFraming === 'rational' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Rational
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Focus on data, metrics, and quantifiable results
              </p>
            </button>

            {/* Balanced */}
            <button
              onClick={() => setSelectedFraming('balanced')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedFraming === 'balanced'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className={`w-5 h-5 ${
                  selectedFraming === 'balanced' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Balanced
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Mix of emotional appeal and rational proof
              </p>
            </button>
          </div>

          {/* Preview */}
          {benefitStatement && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Preview with {selectedFraming} framing:
              </div>
              <div className="text-sm italic text-gray-900 dark:text-white">
                "{generateFramingPreview(selectedFraming)}"
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Suggestions */}
      {!isLoading && visibleSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              AI-Suggested Benefits
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your Own
            </Button>
          </div>

          <div className="space-y-3">
            {visibleSuggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestionId === suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-2">
                        {suggestion.statement}
                      </div>

                      {suggestion.metrics && suggestion.metrics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {suggestion.metrics.map((metric) => (
                            <div
                              key={metric.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full text-xs"
                            >
                              <span className="font-semibold text-blue-700 dark:text-blue-300">
                                {metric.value}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {metric.metric}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                          {suggestion.outcomeType}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                          {suggestion.eqFraming} framing
                        </span>
                        {suggestion.confidence && (
                          <ConfidenceMeter score={suggestion.confidence} compact />
                        )}
                      </div>
                    </div>

                    {!isSelected && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          className="gap-1 bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectSuggestion(suggestion.id)}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 ml-4" />
                    )}
                  </div>

                  {/* Source citations */}
                  {suggestion.sources && suggestion.sources.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                      <SourceCitation sources={suggestion.sources} />
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
            className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Define Your Key Benefit
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
              {/* Benefit Statement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Benefit Statement
                </label>
                <textarea
                  value={benefitStatement}
                  onChange={(e) => setBenefitStatement(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="e.g., Increase revenue by 40% in the first 6 months"
                />
              </div>

              {/* Outcome Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Outcome Type
                </label>
                <div className="flex gap-2">
                  {(['quantifiable', 'qualitative', 'mixed'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOutcomeType(type)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                        outcomeType === type
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Metrics (optional)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMetric}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Metric
                  </Button>
                </div>

                {metrics.length > 0 && (
                  <div className="space-y-3">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="grid grid-cols-12 gap-2 items-start"
                      >
                        <input
                          type="text"
                          value={metric.metric}
                          onChange={(e) => updateMetric(metric.id, 'metric', e.target.value)}
                          className="col-span-4 p-2 border-2 border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                          placeholder="Metric name"
                        />
                        <input
                          type="text"
                          value={metric.value}
                          onChange={(e) => updateMetric(metric.id, 'value', e.target.value)}
                          className="col-span-3 p-2 border-2 border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                          placeholder="Value"
                        />
                        <input
                          type="text"
                          value={metric.timeframe}
                          onChange={(e) => updateMetric(metric.id, 'timeframe', e.target.value)}
                          className="col-span-4 p-2 border-2 border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                          placeholder="Timeframe"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetric(metric.id)}
                          className="col-span-1"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleManualSubmit}
                  disabled={!benefitStatement.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Benefit
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

      {/* Continue Button */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Continue to Final Step
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && visibleSuggestions.length === 0 && !showManualForm && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No AI suggestions available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Define your key benefit manually to continue.
          </p>
          <Button onClick={() => setShowManualForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Key Benefit
          </Button>
        </div>
      )}
    </div>
  );
}
