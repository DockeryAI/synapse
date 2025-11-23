/**
 * Segment EQ Adjuster Component
 * Interface for adjusting emotional triggers per customer segment
 */

import React, { useState, useEffect } from 'react';
import type {
  SegmentEQMapping,
  CustomerPersona,
  SegmentPerformanceData,
} from '@/types/v2';
import type { EmotionalTrigger } from '@/types/v2';
import {
  segmentEQOptimizerService,
  EQAdjustmentRecommendation,
} from '@/services/v2/segment-eq-optimizer.service';

export interface SegmentEQAdjusterProps {
  persona: CustomerPersona;
  performanceData?: SegmentPerformanceData;
  onMappingChange?: (mapping: SegmentEQMapping) => void;
  showRecommendations?: boolean;
  allowTesting?: boolean;
}

export const SegmentEQAdjuster: React.FC<SegmentEQAdjusterProps> = ({
  persona,
  performanceData,
  onMappingChange,
  showRecommendations = true,
  allowTesting = false,
}) => {
  const [mapping, setMapping] = useState<SegmentEQMapping | null>(null);
  const [recommendations, setRecommendations] = useState<EQAdjustmentRecommendation[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [intensityMode, setIntensityMode] = useState<'subtle' | 'balanced' | 'strong'>('balanced');

  useEffect(() => {
    loadMapping();
    if (showRecommendations && performanceData) {
      loadRecommendations();
    }
  }, [persona.id, performanceData]);

  const loadMapping = () => {
    let existingMapping = segmentEQOptimizerService.getEQMapping(persona.id);

    if (!existingMapping) {
      existingMapping = segmentEQOptimizerService.createEQMapping(
        persona.id,
        persona,
        performanceData
      );
    }

    setMapping(existingMapping);

    // Set intensity mode based on modifier
    if (existingMapping.intensityModifier >= 1.2) {
      setIntensityMode('strong');
    } else if (existingMapping.intensityModifier <= 0.8) {
      setIntensityMode('subtle');
    } else {
      setIntensityMode('balanced');
    }
  };

  const loadRecommendations = () => {
    const recs = segmentEQOptimizerService.getRecommendations(persona.id, performanceData);
    setRecommendations(recs);
  };

  const handleTriggerWeightChange = (trigger: EmotionalTrigger, weight: number) => {
    const updated = segmentEQOptimizerService.updateTriggerWeight(persona.id, trigger, weight);
    if (updated) {
      setMapping(updated);
      onMappingChange?.(updated);
    }
  };

  const handleIntensityChange = (mode: 'subtle' | 'balanced' | 'strong') => {
    setIntensityMode(mode);
    const modifierMap = {
      subtle: 0.7,
      balanced: 1.0,
      strong: 1.3,
    };

    const updated = segmentEQOptimizerService.updateIntensityModifier(
      persona.id,
      modifierMap[mode]
    );

    if (updated) {
      setMapping(updated);
      onMappingChange?.(updated);
    }
  };

  const handleApplyRecommendation = (rec: EQAdjustmentRecommendation) => {
    handleTriggerWeightChange(rec.trigger, rec.recommendedWeight);
    setRecommendations(recommendations.filter(r => r.trigger !== rec.trigger));
  };

  const handleApplyAllRecommendations = () => {
    const updated = segmentEQOptimizerService.applyRecommendations(persona.id, recommendations);
    if (updated) {
      setMapping(updated);
      onMappingChange?.(updated);
      setRecommendations([]);
    }
  };

  if (!mapping) {
    return <div>Loading...</div>;
  }

  const getWeightColor = (weight: number): string => {
    if (weight >= 80) return 'bg-green-500';
    if (weight >= 60) return 'bg-blue-500';
    if (weight >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getTriggerWeights = (): [EmotionalTrigger, number][] => {
    if (selectedPlatform === 'all') {
      return Object.entries(mapping.triggerWeights) as [EmotionalTrigger, number][];
    }

    // Apply platform adjustments
    const adjusted: Record<string, number> = { ...mapping.triggerWeights };
    const platformAdj = mapping.platformAdjustments?.[selectedPlatform];

    if (platformAdj) {
      Object.entries(platformAdj).forEach(([trigger, adjustment]) => {
        adjusted[trigger] = (adjusted[trigger] || 50) + (adjustment || 0);
      });
    }

    return Object.entries(adjusted) as [EmotionalTrigger, number][];
  };

  const sortedTriggers = getTriggerWeights().sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              EQ Triggers: {persona.name}
            </h3>
            <p className="text-sm text-gray-500">
              Adjust emotional triggers for this segment
            </p>
          </div>

          {/* Intensity Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Intensity:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleIntensityChange('subtle')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${intensityMode === 'subtle' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}
                `}
              >
                Subtle
              </button>
              <button
                onClick={() => handleIntensityChange('balanced')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${intensityMode === 'balanced' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}
                `}
              >
                Balanced
              </button>
              <button
                onClick={() => handleIntensityChange('strong')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${intensityMode === 'strong' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}
                `}
              >
                Strong
              </button>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Platform View:</span>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Platforms (Default)</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-900">
              Optimization Recommendations ({recommendations.length})
            </h4>
            <button
              onClick={handleApplyAllRecommendations}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Apply All
            </button>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white p-3 rounded border border-blue-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm capitalize">{rec.trigger}</span>
                    <span className="text-xs text-gray-500">
                      {rec.currentWeight} → {rec.recommendedWeight}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      +{rec.expectedImpact}% impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                </div>
                <button
                  onClick={() => handleApplyRecommendation(rec)}
                  className="ml-3 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Matrix */}
      <div className="p-4">
        <div className="space-y-3">
          {sortedTriggers.map(([trigger, weight]) => {
            const normalizedWeight = Math.max(0, Math.min(100, weight));

            return (
              <div key={trigger} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {trigger}
                  </label>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(normalizedWeight)}%
                  </span>
                </div>

                {/* Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={normalizedWeight}
                    onChange={(e) => handleTriggerWeightChange(trigger, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${getWeightColor(normalizedWeight)} ${normalizedWeight}%, #e5e7eb ${normalizedWeight}%)`,
                    }}
                  />
                </div>

                {/* Performance indicator */}
                {performanceData && (
                  <div className="flex items-center gap-2 text-xs">
                    {performanceData.metrics.bestPerformingTrigger === trigger && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        Top Performer
                      </span>
                    )}
                    {performanceData.metrics.worstPerformingTrigger === trigger && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded">
                        Needs Improvement
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Performance */}
      {mapping.historicalPerformance.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Historical Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mapping.historicalPerformance.map((perf, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                <div className="text-xs font-medium text-gray-500 capitalize">{perf.trigger}</div>
                <div className="mt-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Engagement:</span>
                    <span className="font-semibold">{(perf.avgEngagement * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversion:</span>
                    <span className="font-semibold">{(perf.avgConversion * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Sample size:</span>
                    <span>{perf.sampleSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
