/**
 * Purchase Stage Indicator Component
 * Visual display of buyer journey stage with funnel visualization
 */

import React, { useState, useEffect } from 'react';
import type {
  PurchaseStage,
  PurchaseStageScore,
  SegmentMatchInput,
} from '@/types/v2';
import {
  purchaseStageScorerService,
  StageContentGuidelines,
} from '@/services/v2/purchase-stage-scorer.service';

export interface PurchaseStageIndicatorProps {
  content?: SegmentMatchInput;
  score?: PurchaseStageScore;
  showFunnel?: boolean;
  showGuidelines?: boolean;
  onStageChange?: (stage: PurchaseStage) => void;
  compact?: boolean;
}

export const PurchaseStageIndicator: React.FC<PurchaseStageIndicatorProps> = ({
  content,
  score: providedScore,
  showFunnel = true,
  showGuidelines = true,
  onStageChange,
  compact = false,
}) => {
  const [score, setScore] = useState<PurchaseStageScore | null>(providedScore || null);
  const [selectedStage, setSelectedStage] = useState<PurchaseStage | null>(null);
  const [guidelines, setGuidelines] = useState<StageContentGuidelines[]>([]);

  useEffect(() => {
    if (content && !providedScore) {
      const newScore = purchaseStageScorerService.scoreContent(content);
      setScore(newScore);
    } else if (providedScore) {
      setScore(providedScore);
    }
  }, [content, providedScore]);

  useEffect(() => {
    if (showGuidelines) {
      const allGuidelines = purchaseStageScorerService.getAllGuidelines();
      setGuidelines(allGuidelines);
    }
  }, [showGuidelines]);

  if (!score) {
    return <div className="text-gray-500">No stage data available</div>;
  }

  const handleStageClick = (stage: PurchaseStage) => {
    setSelectedStage(selectedStage === stage ? null : stage);
    onStageChange?.(stage);
  };

  const getStageColor = (stage: PurchaseStage, isActive: boolean = false): string => {
    const colors: Record<PurchaseStage, { bg: string; text: string; border: string }> = {
      awareness: {
        bg: isActive ? 'bg-blue-100' : 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-500',
      },
      consideration: {
        bg: isActive ? 'bg-purple-100' : 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-500',
      },
      decision: {
        bg: isActive ? 'bg-green-100' : 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-500',
      },
    };

    const colorSet = colors[stage];
    return `${colorSet.bg} ${colorSet.text} ${isActive ? `border-2 ${colorSet.border}` : 'border border-gray-300'}`;
  };

  const getScoreBarColor = (stageScore: number): string => {
    if (stageScore >= 70) return 'bg-green-500';
    if (stageScore >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Purchase Stage:</span>
          <div className={`px-3 py-1 rounded-full ${getStageColor(score.detectedStage, true)}`}>
            <span className="text-sm font-semibold capitalize">{score.detectedStage}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.stageScores[score.detectedStage])}`}
              style={{ width: `${score.stageScores[score.detectedStage]}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {Math.round(score.confidence)}% confident
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Purchase Stage</h3>
            <p className="text-sm text-gray-500">Buyer journey position</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-4 py-2 rounded-lg ${getStageColor(score.detectedStage, true)}`}>
              <span className="text-xl font-bold capitalize">{score.detectedStage}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(score.confidence)}% confidence
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      {showFunnel && (
        <div className="p-6">
          <div className="space-y-4">
            {/* Awareness Stage */}
            <div
              onClick={() => handleStageClick('awareness')}
              className={`cursor-pointer rounded-lg p-4 transition-all ${getStageColor('awareness', selectedStage === 'awareness')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="font-semibold">Awareness</span>
                  {score.detectedStage === 'awareness' && (
                    <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <span className="font-bold">{Math.round(score.stageScores.awareness)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBarColor(score.stageScores.awareness)}`}
                  style={{ width: `${score.stageScores.awareness}%` }}
                />
              </div>
              {selectedStage === 'awareness' && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-gray-700">
                    Educational, problem-focused content for prospects discovering their needs.
                  </p>
                </div>
              )}
            </div>

            {/* Consideration Stage */}
            <div
              onClick={() => handleStageClick('consideration')}
              className={`cursor-pointer rounded-lg p-4 transition-all ${getStageColor('consideration', selectedStage === 'consideration')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="font-semibold">Consideration</span>
                  {score.detectedStage === 'consideration' && (
                    <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <span className="font-bold">{Math.round(score.stageScores.consideration)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBarColor(score.stageScores.consideration)}`}
                  style={{ width: `${score.stageScores.consideration}%` }}
                />
              </div>
              {selectedStage === 'consideration' && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-sm text-gray-700">
                    Solution-focused content comparing options and highlighting benefits.
                  </p>
                </div>
              )}
            </div>

            {/* Decision Stage */}
            <div
              onClick={() => handleStageClick('decision')}
              className={`cursor-pointer rounded-lg p-4 transition-all ${getStageColor('decision', selectedStage === 'decision')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="font-semibold">Decision</span>
                  {score.detectedStage === 'decision' && (
                    <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <span className="font-bold">{Math.round(score.stageScores.decision)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBarColor(score.stageScores.decision)}`}
                  style={{ width: `${score.stageScores.decision}%` }}
                />
              </div>
              {selectedStage === 'decision' && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-700">
                    Action-oriented content with pricing, social proof, and clear CTAs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicators */}
      {score.indicators.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Stage Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {score.indicators.slice(0, 6).map((indicator, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 text-xs rounded-full ${getStageColor(indicator.stage)}`}
              >
                {indicator.indicator}
              </span>
            ))}
            {score.indicators.length > 6 && (
              <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                +{score.indicators.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-3">
            {score.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${rec.currentStage === score.detectedStage ? 'bg-blue-600' : 'bg-gray-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{rec.suggestion}</p>
                    {rec.examples.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rec.examples.map((example, exIdx) => (
                          <span
                            key={exIdx}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      {showGuidelines && selectedStage && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
            {selectedStage} Stage Guidelines
          </h4>
          {guidelines
            .filter(g => g.stage === selectedStage)
            .map((guideline, idx) => (
              <div key={idx} className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Content Types:</span>
                  <ul className="mt-1 ml-4 list-disc text-gray-600">
                    {guideline.contentTypes.map((type, typeIdx) => (
                      <li key={typeIdx}>{type}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Recommended CTAs:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {guideline.callToActions.map((cta, ctaIdx) => (
                      <span
                        key={ctaIdx}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {cta}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-red-700">Avoid:</span>
                  <ul className="mt-1 ml-4 list-disc text-red-600 text-xs">
                    {guideline.avoidances.map((avoidance, avoidIdx) => (
                      <li key={avoidIdx}>{avoidance}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
