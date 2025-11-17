/**
 * Benchmark Dashboard
 * "What Good Looks Like" - Show performance vs industry benchmarks
 *
 * Features:
 * - Industry benchmark comparisons
 * - Visual indicators (below, on track, exceeding)
 * - Platform-specific performance
 * - Cost efficiency metrics
 * - Day 3 pivot recommendations
 * - Optimal scheduling insights
 */

import React, { useState, useEffect } from 'react';
import {
  BenchmarkDashboardData,
  VisualIndicator,
  PivotTrigger,
  PivotRecommendation,
  SocialPlatform,
} from '../../types/benchmarks.types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  DollarSign,
  Users,
  Target,
  Zap,
} from 'lucide-react';

interface BenchmarkDashboardProps {
  data: BenchmarkDashboardData;
  onApplyPivot?: (recommendation: PivotRecommendation) => void;
}

export const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({
  data,
  onApplyPivot,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | 'all'>('all');

  const getStatusColor = (status: 'below' | 'on_track' | 'exceeding'): string => {
    const colors = {
      below: 'text-red-600 bg-red-50 border-red-200',
      on_track: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      exceeding: 'text-green-600 bg-green-50 border-green-200',
    };
    return colors[status];
  };

  const getStatusIcon = (status: 'below' | 'on_track' | 'exceeding') => {
    const icons = {
      below: <XCircle className="w-5 h-5" />,
      on_track: <AlertTriangle className="w-5 h-5" />,
      exceeding: <CheckCircle className="w-5 h-5" />,
    };
    return icons[status];
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return <Minus className="w-4 h-4 text-gray-400" />;
    const icons = {
      up: <ArrowUp className="w-4 h-4 text-green-500" />,
      down: <ArrowDown className="w-4 h-4 text-red-500" />,
      stable: <Minus className="w-4 h-4 text-gray-400" />,
    };
    return icons[trend];
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      immediate: 'bg-red-600 text-white',
      suggested: 'bg-orange-600 text-white',
      consider: 'bg-blue-600 text-white',
    };
    return colors[priority] || 'bg-gray-600 text-white';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Performance Benchmarks</h1>
        <p className="text-xl text-gray-600">
          See how you stack up against {data.industry} industry standards
        </p>
        <div className="text-sm text-gray-500 mt-2">
          Period: {data.period.start.toLocaleDateString()} -{' '}
          {data.period.end.toLocaleDateString()}
        </div>
      </div>

      {/* Overall Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Engagement Rate"
          value={formatPercentage(data.performance.overall.engagementRate.actual)}
          benchmark={formatPercentage(data.performance.overall.engagementRate.benchmark.average)}
          status={data.performance.overall.engagementRate.status}
          change={data.performance.overall.engagementRate.gap}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Reach Rate"
          value={formatPercentage(data.performance.overall.reachRate.actual)}
          benchmark={formatPercentage(data.performance.overall.reachRate.benchmark.average)}
          status={data.performance.overall.reachRate.status}
          change={data.performance.overall.reachRate.gap}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        {data.performance.overall.conversionRate && (
          <MetricCard
            title="Conversion Rate"
            value={formatPercentage(data.performance.overall.conversionRate.actual)}
            benchmark={formatPercentage(data.performance.overall.conversionRate.benchmark.average)}
            status={data.performance.overall.conversionRate.status}
            change={data.performance.overall.conversionRate.gap}
            icon={<Target className="w-6 h-6" />}
          />
        )}
        {data.performance.overall.costEfficiency && (
          <MetricCard
            title="Cost Efficiency"
            value={`$${data.performance.overall.costEfficiency.actual.toFixed(2)}`}
            benchmark={`$${data.performance.overall.costEfficiency.benchmark.average.toFixed(2)}`}
            status={data.performance.overall.costEfficiency.status}
            change={data.performance.overall.costEfficiency.gap}
            icon={<DollarSign className="w-6 h-6" />}
          />
        )}
      </div>

      {/* What Good Looks Like */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-4">📊 What Good Looks Like ({data.industry})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm opacity-90">Engagement Rate</div>
            <div className="text-3xl font-bold">
              {formatPercentage(data.benchmarks.platforms[0]?.engagementRate.average || 0)}
            </div>
            <div className="text-sm opacity-75">Industry Average</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Video Boost</div>
            <div className="text-3xl font-bold">
              {data.benchmarks.platforms[0]?.videoBoost || 10}x
            </div>
            <div className="text-sm opacity-75">vs Static Posts</div>
          </div>
          <div>
            <div className="text-sm opacity-90">UGC Impact</div>
            <div className="text-3xl font-bold">
              +{data.benchmarks.platforms[0]?.ugcBoost || 30}%
            </div>
            <div className="text-sm opacity-75">Engagement Boost</div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.performance.byPlatform).map(([platform, comparison]) => (
            <div
              key={platform}
              className={`border rounded-lg p-4 ${getStatusColor(comparison.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold capitalize">{platform}</h3>
                {getStatusIcon(comparison.status)}
              </div>
              <div className="text-2xl font-bold mb-1">{formatPercentage(comparison.actual)}</div>
              <div className="text-sm opacity-75">
                Benchmark: {formatPercentage(comparison.benchmark.average)}
              </div>
              <div className="text-xs mt-2">
                {comparison.status === 'exceeding' && `+${formatPercentage(Math.abs(comparison.gap))} above`}
                {comparison.status === 'on_track' && 'On track'}
                {comparison.status === 'below' && `${formatPercentage(Math.abs(comparison.gap))} below`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Pivots */}
      {data.activePivots.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-2xl font-bold">⚠️ Performance Alerts</h2>
          </div>
          <div className="space-y-4">
            {data.activePivots.map((trigger) => (
              <div
                key={trigger.id}
                className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                          trigger.severity
                        )}`}
                      >
                        {trigger.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {trigger.reason.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      Engagement: {formatPercentage(trigger.currentMetrics.metrics.engagementRate)}{' '}
                      (Benchmark: {formatPercentage(trigger.benchmark.average)})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Triggered {Math.floor((Date.now() - trigger.triggeredAt.getTime()) / (1000 * 60 * 60))}h ago
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pivot Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold">💡 Recommended Pivots</h2>
          </div>
          <div className="space-y-4">
            {data.recommendations.map((rec, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="font-semibold">
                        {rec.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">{rec.expectedImpact}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Effort: {rec.effort}</span>
                      {rec.autoPivotAvailable && (
                        <span className="text-green-600 font-medium">✓ Auto-pivot available</span>
                      )}
                    </div>
                  </div>
                  {onApplyPivot && (
                    <button
                      onClick={() => onApplyPivot(rec)}
                      className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply Pivot
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduling Insights */}
      {data.schedulingInsights.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-2xl font-bold">⏰ Optimal Posting Times</h2>
          </div>
          <div className="space-y-6">
            {data.schedulingInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold capitalize mb-2">{insight.platform}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-600">Recommended Frequency</div>
                    <div className="text-lg font-bold">
                      {insight.frequency.recommended}x per week
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Max Daily Posts</div>
                    <div className="text-lg font-bold">{insight.frequency.maxDaily}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {insight.optimalSlots.slice(0, 3).map((slot, i) => (
                    <div
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.dayOfWeek]}{' '}
                      {slot.time}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-600">
                  {insight.reasoning.slice(0, 2).map((reason, i) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Summary */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📈 Key Insights</h2>
        <ul className="space-y-2">
          {data.performance.insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span className="text-gray-700">{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  benchmark: string;
  status: 'below' | 'on_track' | 'exceeding';
  change?: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  benchmark,
  status,
  change,
  icon,
}) => {
  const getStatusColor = (s: 'below' | 'on_track' | 'exceeding'): string => {
    const colors = {
      below: 'border-red-200 bg-red-50',
      on_track: 'border-yellow-200 bg-yellow-50',
      exceeding: 'border-green-200 bg-green-50',
    };
    return colors[s];
  };

  return (
    <div className={`border rounded-xl p-4 ${getStatusColor(status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-2">Benchmark: {benchmark}</div>
      {change !== undefined && (
        <div className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default BenchmarkDashboard;
