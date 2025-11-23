/**
 * Breakthrough Score Card Component
 * Visual display of 11-factor breakthrough score with radar chart
 */

import React from 'react';
import {
  BreakthroughScoreCardProps,
  ScoringFactorId,
  RadarChartData,
} from '../../../types/v2/scoring.types';
import { breakthroughScorerService } from '../../../services/v2/intelligence/breakthrough-scorer.service';

// Grade colors
const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  B: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  D: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  F: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

// Score tier colors
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

const getProgressColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const BreakthroughScoreCard: React.FC<BreakthroughScoreCardProps> = ({
  score,
  showRadar = true,
  showSuggestions = true,
  compact = false,
  onFactorClick,
}) => {
  // Loading state
  if (!score) {
    return compact ? (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-200 rounded mt-2" />
      </div>
    ) : (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="text-right">
              <div className="h-10 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
          </div>
          <div className="h-4 w-full bg-gray-200 rounded mt-3" />
        </div>
      </div>
    );
  }

  const { breakdown } = score;
  const gradeColors = GRADE_COLORS[breakdown.grade];
  const suggestions = breakthroughScorerService.getImprovementSuggestions(score);
  const radarData = showRadar ? breakthroughScorerService.generateRadarChartData(score) : null;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-3xl font-bold ${getScoreColor(breakdown.totalScore)}`}>
              {breakdown.totalScore}
            </span>
            <span className="text-gray-500 text-sm ml-1">/ 100</span>
          </div>
          <div className={`px-3 py-1 rounded-full ${gradeColors.bg} ${gradeColors.text} font-semibold`}>
            Grade {breakdown.grade}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{breakdown.overallExplanation}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Breakthrough Score</h3>
            <p className="text-sm text-gray-500">11-factor analysis</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(breakdown.totalScore)}`}>
              {breakdown.totalScore}
            </div>
            <div className={`inline-block px-3 py-1 rounded-full ${gradeColors.bg} ${gradeColors.text} font-semibold text-sm mt-1`}>
              Grade {breakdown.grade}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">{breakdown.overallExplanation}</p>
      </div>

      {/* Radar Chart Placeholder */}
      {showRadar && radarData && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Multi-Dimensional View</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <RadarChartPlaceholder data={radarData} />
          </div>
        </div>
      )}

      {/* Factor Breakdown */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Factor Breakdown</h4>
        <div className="space-y-3">
          {breakdown.factors.map((factor) => (
            <div
              key={factor.id}
              className={`${onFactorClick ? 'cursor-pointer hover:bg-gray-50' : ''} rounded-lg p-2 -mx-2`}
              onClick={() => onFactorClick?.(factor.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                <span className={`text-sm font-semibold ${getScoreColor(factor.score)}`}>
                  {factor.score}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(factor.score)}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{factor.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
            {breakdown.strengths.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {breakdown.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-1">✓</span>
                    {strength.split(':')[0]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No major strengths identified</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2">Areas to Improve</h4>
            {breakdown.weaknesses.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {breakdown.weaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-red-500 mr-1">!</span>
                    {weakness.split(':')[0]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No major weaknesses identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Improvements</h4>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion, i) => (
              <div key={i} className="flex items-start bg-blue-50 rounded-lg p-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold mr-3">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{suggestion.factor}</div>
                  <p className="text-xs text-gray-600">{suggestion.suggestion}</p>
                  <span className="text-xs text-blue-600">
                    Potential gain: +{suggestion.potentialGain} points
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Calculated in {score.metadata.calculationTimeMs}ms</span>
          <span>v{score.metadata.scoringVersion}</span>
        </div>
      </div>
    </div>
  );
};

// Simple radar chart placeholder (actual implementation would use a chart library)
const RadarChartPlaceholder: React.FC<{ data: RadarChartData }> = ({ data }) => {
  const centerX = 150;
  const centerY = 120;
  const maxRadius = 80;
  const numAxes = data.labels.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Calculate points for the data polygon
  const dataPoints = data.datasets[0].data.map((value, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width="300" height="240" className="mx-auto">
      {/* Grid circles */}
      {[20, 40, 60, 80, 100].map((level) => (
        <circle
          key={level}
          cx={centerX}
          cy={centerY}
          r={(level / 100) * maxRadius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines and labels */}
      {data.labels.map((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 20;
        return (
          <g key={label}>
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + maxRadius * Math.cos(angle)}
              y2={centerY + maxRadius * Math.sin(angle)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={centerX + labelRadius * Math.cos(angle)}
              y={centerY + labelRadius * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
              fontSize="8"
            >
              {label.length > 8 ? label.substring(0, 8) + '...' : label}
            </text>
          </g>
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(99, 102, 241, 0.3)"
        stroke="rgba(99, 102, 241, 1)"
        strokeWidth="2"
      />

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="rgba(99, 102, 241, 1)"
        />
      ))}
    </svg>
  );
};

export default BreakthroughScoreCard;
