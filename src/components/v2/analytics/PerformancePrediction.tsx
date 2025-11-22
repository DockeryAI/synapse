/**
 * Performance Prediction Component
 * Displays template performance predictions with industry benchmark comparisons
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  performancePredictor,
  type AggregatedPrediction,
  type PerformanceFactor,
} from '@/services/v2/performance-predictor.service';

export interface PerformancePredictionProps {
  templateId: string;
  templateType: 'content' | 'campaign';
  industryCode?: string;
  className?: string;
  showFactors?: boolean;
  showBenchmark?: boolean;
  compact?: boolean;
}

export const PerformancePrediction: React.FC<PerformancePredictionProps> = ({
  templateId,
  templateType,
  industryCode,
  className,
  showFactors = true,
  showBenchmark = true,
  compact = false,
}) => {
  const [prediction, setPrediction] = React.useState<AggregatedPrediction | null>(null);

  React.useEffect(() => {
    const result = performancePredictor.getAggregatedPrediction(
      templateId,
      templateType,
      industryCode
    );
    setPrediction(result);
  }, [templateId, templateType, industryCode]);

  if (!prediction) {
    return (
      <div className={cn('animate-pulse bg-muted rounded-lg h-32', className)} />
    );
  }

  const { prediction: perf, benchmark, comparison, overallScore, recommendation } = prediction;

  if (compact) {
    return (
      <CompactView
        prediction={perf}
        overallScore={overallScore}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Score */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h4 className="font-semibold text-sm">Performance Score</h4>
          <p className="text-xs text-muted-foreground">{recommendation}</p>
        </div>
        <ScoreRing score={overallScore} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Expected CTR"
          value={`${perf.expectedCTR}%`}
          comparison={comparison.ctrVsBenchmark}
          benchmark={benchmark.avgCTR}
          showBenchmark={showBenchmark}
        />
        <MetricCard
          label="Engagement"
          value={`${perf.expectedEngagement}%`}
          comparison={comparison.engagementVsBenchmark}
          benchmark={benchmark.avgEngagement}
          showBenchmark={showBenchmark}
        />
        <MetricCard
          label="Conversion"
          value={`${perf.expectedConversion}%`}
          comparison={comparison.conversionVsBenchmark}
          benchmark={benchmark.avgConversion}
          showBenchmark={showBenchmark}
        />
        {perf.expectedROI !== undefined && (
          <MetricCard
            label="Expected ROI"
            value={`${perf.expectedROI}x`}
            comparison={comparison.roiVsBenchmark}
            benchmark={benchmark.avgROI}
            showBenchmark={showBenchmark}
          />
        )}
      </div>

      {/* Confidence Score */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Confidence:</span>
        <ConfidenceBar score={perf.confidenceScore} />
        <span className="font-medium">{perf.confidenceScore}%</span>
      </div>

      {/* Factors */}
      {showFactors && perf.factors.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Performance Factors</h5>
          <div className="space-y-1">
            {perf.factors.map((factor, idx) => (
              <FactorItem key={idx} factor={factor} />
            ))}
          </div>
        </div>
      )}

      {/* Benchmark Info */}
      {showBenchmark && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Compared against {benchmark.industryName} industry benchmarks
        </div>
      )}
    </div>
  );
};

// Sub-components

interface ScoreRingProps {
  score: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 65) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={getScoreColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{score}</span>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  comparison: number;
  benchmark: number;
  showBenchmark: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  comparison,
  benchmark,
  showBenchmark,
}) => {
  const isPositive = comparison >= 0;

  return (
    <div className="p-3 bg-background rounded-lg border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        <span
          className={cn(
            'text-xs font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isPositive ? '+' : ''}{comparison}%
        </span>
        {showBenchmark && (
          <span className="text-xs text-muted-foreground">
            vs {benchmark}% avg
          </span>
        )}
      </div>
    </div>
  );
};

interface ConfidenceBarProps {
  score: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ score }) => {
  return (
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          score >= 80 ? 'bg-green-500' :
          score >= 60 ? 'bg-blue-500' :
          score >= 40 ? 'bg-yellow-500' :
          'bg-red-500'
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  );
};

interface FactorItemProps {
  factor: PerformanceFactor;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor }) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]',
          factor.positive ? 'bg-green-500' : 'bg-red-500'
        )}
      >
        {factor.positive ? '+' : '-'}
      </span>
      <span className="flex-1">{factor.name}</span>
      <span className={cn(
        'font-medium',
        factor.positive ? 'text-green-600' : 'text-red-600'
      )}>
        {factor.positive ? '+' : '-'}{factor.impact}%
      </span>
    </div>
  );
};

interface CompactViewProps {
  prediction: AggregatedPrediction['prediction'];
  overallScore: number;
  className?: string;
}

const CompactView: React.FC<CompactViewProps> = ({
  prediction,
  overallScore,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3 p-2 bg-muted/50 rounded-lg', className)}>
      <ScoreRing score={overallScore} />
      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">CTR</div>
          <div className="font-medium">{prediction.expectedCTR}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Engage</div>
          <div className="font-medium">{prediction.expectedEngagement}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Conv</div>
          <div className="font-medium">{prediction.expectedConversion}%</div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePrediction;
