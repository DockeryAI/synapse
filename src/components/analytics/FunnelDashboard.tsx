/**
 * Funnel Dashboard Component
 *
 * Visualizes conversion funnels for onboarding, campaign generation, and publishing.
 * Shows:
 * - Overall conversion rates
 * - Step-by-step metrics
 * - Drop-off points with priority
 * - Time-to-complete metrics
 * - Session summaries
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FunnelTracker,
  FunnelMetrics,
  type FunnelEventType,
  formatDuration,
  getConversionRateColor,
} from '@/services/analytics/funnel-tracker.service';

interface FunnelDashboardProps {
  brandId?: string;
  timeframe?: '7d' | '30d' | '90d';
}

export const FunnelDashboard: React.FC<FunnelDashboardProps> = ({
  brandId,
  timeframe = '30d',
}) => {
  const [onboardingMetrics, setOnboardingMetrics] = useState<FunnelMetrics | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<FunnelMetrics | null>(null);
  const [publishingMetrics, setPublishingMetrics] = useState<FunnelMetrics | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelEventType>('onboarding');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMetrics();
  }, [brandId, timeframe]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [onboarding, campaign, publishing] = await Promise.all([
        FunnelTracker.getFunnelMetrics('onboarding', brandId, timeframe),
        FunnelTracker.getFunnelMetrics('campaign', brandId, timeframe),
        FunnelTracker.getFunnelMetrics('publishing', brandId, timeframe),
      ]);

      setOnboardingMetrics(onboarding);
      setCampaignMetrics(campaign);
      setPublishingMetrics(publishing);
    } catch (error) {
      console.error('[FunnelDashboard] Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStep = (step: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(step)) {
      newExpanded.delete(step);
    } else {
      newExpanded.add(step);
    }
    setExpandedSteps(newExpanded);
  };

  const getSelectedMetrics = (): FunnelMetrics | null => {
    switch (selectedFunnel) {
      case 'onboarding':
        return onboardingMetrics;
      case 'campaign':
        return campaignMetrics;
      case 'publishing':
        return publishingMetrics;
    }
  };

  const metrics = getSelectedMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Funnel Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track conversion rates and identify optimization opportunities
        </p>
      </div>

      {/* Funnel Selector */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setSelectedFunnel('onboarding')}
          variant={selectedFunnel === 'onboarding' ? 'default' : 'outline'}
          className="min-h-[44px]"
        >
          <Users className="w-4 h-4 mr-2" />
          Onboarding
        </Button>
        <Button
          onClick={() => setSelectedFunnel('campaign')}
          variant={selectedFunnel === 'campaign' ? 'default' : 'outline'}
          className="min-h-[44px]"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Campaign Generation
        </Button>
        <Button
          onClick={() => setSelectedFunnel('publishing')}
          variant={selectedFunnel === 'publishing' ? 'default' : 'outline'}
          className="min-h-[44px]"
        >
          <Activity className="w-4 h-4 mr-2" />
          Publishing
        </Button>
      </div>

      {!metrics || metrics.totalSessions === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No {selectedFunnel} events tracked in the last {timeframe}.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Sessions"
              value={metrics.totalSessions.toLocaleString()}
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="Conversion Rate"
              value={`${metrics.overallConversionRate.toFixed(1)}%`}
              icon={
                metrics.overallConversionRate >= 50 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )
              }
              color={getConversionRateColor(metrics.overallConversionRate)}
            />
            <StatCard
              label="Avg. Time to Complete"
              value={formatDuration(metrics.averageTimeToComplete)}
              icon={<Clock className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              label="Drop-Off Points"
              value={metrics.dropOffPoints.length.toString()}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={metrics.dropOffPoints.length > 3 ? 'red' : 'gray'}
            />
          </div>

          {/* Funnel Visualization */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Funnel Steps
            </h2>

            <div className="space-y-3">
              {metrics.stepMetrics.map((step, index) => {
                const isExpanded = expandedSteps.has(step.step);
                const conversionColor = getConversionRateColor(step.conversionRate);

                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="w-full text-left p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      {/* Step Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {step.step.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {step.entered.toLocaleString()} entered
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold text-${conversionColor}-600 dark:text-${conversionColor}-400`}>
                              {step.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              conversion
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500`}
                          initial={{ width: 0 }}
                          animate={{ width: `${step.conversionRate}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        />
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">Entered</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {step.entered.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">Completed</div>
                              <div className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                {step.completed.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">Dropped Off</div>
                              <div className="font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                {(step.entered - step.completed).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400 mb-1">Avg. Time</div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatDuration(step.averageTimeSpent)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Drop-Off Points */}
          {metrics.dropOffPoints.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Drop-Off Points
              </h2>

              <div className="space-y-3">
                {metrics.dropOffPoints.map((dropOff, index) => (
                  <motion.div
                    key={`${dropOff.fromStep}-${dropOff.toStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border-2 ${
                      dropOff.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : dropOff.priority === 'medium'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              dropOff.priority === 'high'
                                ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-200'
                                : dropOff.priority === 'medium'
                                ? 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-200'
                                : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {dropOff.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white mb-1">
                          <span className="font-medium">
                            {dropOff.fromStep.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          {' → '}
                          <span className="font-medium">
                            {dropOff.toStep.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {dropOff.dropOffCount.toLocaleString()} users ({dropOff.dropOffRate.toFixed(1)}% drop-off)
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            dropOff.priority === 'high'
                              ? 'text-red-600 dark:text-red-400'
                              : dropOff.priority === 'medium'
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {dropOff.dropOffRate.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

//=============================================================================
// StatCard Component
//=============================================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-600 dark:text-blue-400',
    green: 'from-green-500 to-emerald-500 text-green-600 dark:text-green-400',
    yellow: 'from-yellow-500 to-orange-500 text-yellow-600 dark:text-yellow-400',
    orange: 'from-orange-500 to-red-500 text-orange-600 dark:text-orange-400',
    red: 'from-red-500 to-pink-500 text-red-600 dark:text-red-400',
    purple: 'from-purple-500 to-pink-500 text-purple-600 dark:text-purple-400',
    gray: 'from-gray-400 to-gray-500 text-gray-600 dark:text-gray-400',
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass.split(' ')[0]} ${gradientClass.split(' ')[1]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
      </div>
      <div className={`text-3xl font-bold ${gradientClass.split(' ').slice(2).join(' ')}`}>
        {value}
      </div>
    </div>
  );
};
