/**
 * Segment Performance Component
 * Dashboard for viewing segment analytics and performance metrics
 */

import React, { useState, useEffect } from 'react';
import type {
  SegmentAnalyticsSummary,
  SegmentPerformanceData,
  CustomerPersona,
} from '@/types/v2';
import {
  segmentAnalyticsService,
  TriggerPerformance,
  GapAnalysisResult,
} from '@/services/v2/segment-analytics.service';
import { personaMappingService } from '@/services/v2/persona-mapping.service';

export interface SegmentPerformanceProps {
  brandId: string;
  timeRange?: { start: string; end: string };
  selectedPersonaId?: string;
  onPersonaSelect?: (personaId: string) => void;
}

export const SegmentPerformance: React.FC<SegmentPerformanceProps> = ({
  brandId,
  timeRange,
  selectedPersonaId,
  onPersonaSelect,
}) => {
  const [summary, setSummary] = useState<SegmentAnalyticsSummary | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null);
  const [personaPerformance, setPersonaPerformance] = useState<SegmentPerformanceData | null>(null);
  const [triggerPerformance, setTriggerPerformance] = useState<TriggerPerformance[]>([]);
  const [gaps, setGaps] = useState<GapAnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'gaps' | 'triggers'>('overview');

  const defaultTimeRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };

  const currentTimeRange = timeRange || defaultTimeRange;

  useEffect(() => {
    loadAnalytics();
    loadGaps();
  }, [brandId, timeRange]);

  useEffect(() => {
    if (selectedPersonaId) {
      loadPersonaData(selectedPersonaId);
    }
  }, [selectedPersonaId]);

  const loadAnalytics = () => {
    const analyticsData = segmentAnalyticsService.getAnalyticsSummary(brandId, currentTimeRange);
    setSummary(analyticsData);
  };

  const loadGaps = () => {
    const gapData = segmentAnalyticsService.identifyUnderservedPersonas(2);
    setGaps(gapData);
  };

  const loadPersonaData = (personaId: string) => {
    const persona = personaMappingService.getPersona(personaId);
    setSelectedPersona(persona);

    const perfData = segmentAnalyticsService.getPerformanceData(personaId, currentTimeRange);
    setPersonaPerformance(perfData);

    const triggerData = segmentAnalyticsService.getTriggerPerformance(personaId);
    setTriggerPerformance(triggerData);
  };

  const handlePersonaClick = (personaId: string) => {
    setSelectedPersona(personaMappingService.getPersona(personaId));
    loadPersonaData(personaId);
    onPersonaSelect?.(personaId);
  };

  if (!summary) {
    return <div className="text-gray-500">Loading analytics...</div>;
  }

  const getPerformanceColor = (rate: number): string => {
    if (rate >= 0.05) return 'text-green-600';
    if (rate >= 0.03) return 'text-blue-600';
    if (rate >= 0.02) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend?: 'improving' | 'declining' | 'stable'): string => {
    if (trend === 'improving') return '↗';
    if (trend === 'declining') return '↘';
    return '→';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Segment Performance</h3>
        <p className="text-sm text-gray-500">
          Analytics for {summary.totalPersonas} personas, {summary.totalPieces} total pieces
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {(['overview', 'heatmap', 'gaps', 'triggers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Avg Engagement Rate</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(summary.overallPerformance.avgEngagementRate)}`}>
                  {(summary.overallPerformance.avgEngagementRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Avg Conversion Rate</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(summary.overallPerformance.avgConversionRate)}`}>
                  {(summary.overallPerformance.avgConversionRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Content Pieces</div>
                <div className="text-2xl font-bold text-gray-900">{summary.totalPieces}</div>
              </div>
            </div>

            {/* Top/Bottom Personas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">Best Performing Persona</div>
                <div className="text-lg font-semibold text-green-900 mt-1">
                  {summary.overallPerformance.bestPerformingPersona}
                </div>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800">Needs Attention</div>
                <div className="text-lg font-semibold text-red-900 mt-1">
                  {summary.overallPerformance.worstPerformingPersona}
                </div>
              </div>
            </div>

            {/* Recent Performance Data */}
            {selectedPersona && personaPerformance && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {selectedPersona.name} - Detailed Performance
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Total Pieces</div>
                    <div className="text-lg font-semibold">{personaPerformance.metrics.totalPieces}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Engagement</div>
                    <div className={`text-lg font-semibold ${getPerformanceColor(personaPerformance.metrics.avgEngagementRate)}`}>
                      {(personaPerformance.metrics.avgEngagementRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Conversion</div>
                    <div className={`text-lg font-semibold ${getPerformanceColor(personaPerformance.metrics.avgConversionRate)}`}>
                      {(personaPerformance.metrics.avgConversionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">CTR</div>
                    <div className={`text-lg font-semibold ${getPerformanceColor(personaPerformance.metrics.avgCTR)}`}>
                      {(personaPerformance.metrics.avgCTR * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Platform Breakdown */}
                {personaPerformance.platformBreakdown.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Platform Performance</div>
                    <div className="space-y-2">
                      {personaPerformance.platformBreakdown.map((platform, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-700">{platform.platform}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">{platform.pieceCount} pieces</span>
                            <span className={getPerformanceColor(platform.engagementRate)}>
                              {(platform.engagementRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Performance heatmap showing engagement by persona and emotional trigger
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pieces</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.performanceHeatmap.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.personaName}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 capitalize">{item.trigger}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{item.pieceCount}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={getPerformanceColor(item.engagementRate)}>
                          {(item.engagementRate * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Personas that need more content attention
            </p>
            {summary.gapAnalysis.map((gap, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${gap.daysSinceLastContent > 14 ? 'border-red-300 bg-red-50' : gap.daysSinceLastContent > 7 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}
                onClick={() => handlePersonaClick(gap.personaId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{gap.personaName}</h4>
                    <p className="text-sm text-gray-600 mt-1">{gap.recommendedAction}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {gap.daysSinceLastContent}
                    </div>
                    <div className="text-xs text-gray-500">days ago</div>
                  </div>
                </div>
              </div>
            ))}
            {summary.gapAnalysis.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No gaps detected! All personas are receiving regular content.
              </div>
            )}
          </div>
        )}

        {activeTab === 'triggers' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Emotional trigger effectiveness analysis
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.triggerEffectiveness.slice(0, 12).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 capitalize">{item.trigger}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{item.usageCount}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={getPerformanceColor(item.avgEngagement)}>
                          {(item.avgEngagement * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={getPerformanceColor(item.avgConversion)}>
                          {(item.avgConversion * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${item.recommendation === 'increase' ? 'bg-green-100 text-green-800' : item.recommendation === 'decrease' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
