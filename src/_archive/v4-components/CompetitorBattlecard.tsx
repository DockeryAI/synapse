/**
 * Competitor Battlecard
 *
 * Auto-generated competitive intelligence card for sales enablement.
 * Shows key talking points, weaknesses to exploit, and win themes.
 *
 * Created: 2025-11-29
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sword,
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import type {
  CompetitorProfile,
  CompetitorGap,
  EnhancedCompetitorInsights,
  ThreatScore
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorBattlecardProps {
  competitor: CompetitorProfile;
  gaps: CompetitorGap[];
  insights?: Partial<EnhancedCompetitorInsights>;
  brandName?: string;
  onCopy?: (text: string) => void;
}

interface TalkingPoint {
  category: 'strength' | 'weakness' | 'opportunity';
  title: string;
  detail: string;
  icon: React.ElementType;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateTalkingPoints(
  competitor: CompetitorProfile,
  gaps: CompetitorGap[],
  insights?: Partial<EnhancedCompetitorInsights>
): TalkingPoint[] {
  const points: TalkingPoint[] = [];

  // Add weakness points from gaps
  const voidGaps = gaps.filter(g => g.gap_type === 'void').slice(0, 2);
  for (const gap of voidGaps) {
    points.push({
      category: 'weakness',
      title: `Missing: ${gap.title}`,
      detail: gap.description,
      icon: AlertCircle
    });
  }

  // Add opportunity points from demand gaps
  const demandGaps = gaps.filter(g => g.gap_type === 'demand').slice(0, 2);
  for (const gap of demandGaps) {
    points.push({
      category: 'opportunity',
      title: `Opportunity: ${gap.title}`,
      detail: gap.description,
      icon: Target
    });
  }

  // Add customer voice insights
  if (insights?.customer_voice) {
    const cv = insights.customer_voice;
    if (cv.pain_points.length > 0) {
      points.push({
        category: 'weakness',
        title: 'Customer Pain Point',
        detail: cv.pain_points[0],
        icon: Users
      });
    }
    if (cv.switching_triggers.length > 0) {
      points.push({
        category: 'opportunity',
        title: 'Switching Trigger',
        detail: cv.switching_triggers[0],
        icon: Zap
      });
    }
  }

  // Add feature velocity insight
  if (insights?.feature_velocity) {
    const fv = insights.feature_velocity;
    if (fv.momentum === 'decelerating') {
      points.push({
        category: 'weakness',
        title: 'Slowing Innovation',
        detail: `${competitor.name}'s release cadence is ${fv.cadence} and decelerating`,
        icon: TrendingDown
      });
    }
    if (fv.innovation_gaps && fv.innovation_gaps.length > 0) {
      points.push({
        category: 'opportunity',
        title: 'Innovation Gap',
        detail: fv.innovation_gaps[0],
        icon: Clock
      });
    }
  }

  // Add pricing insight
  if (insights?.pricing_intel) {
    const pi = insights.pricing_intel;
    if (pi.arbitrage_opportunity) {
      points.push({
        category: 'opportunity',
        title: 'Pricing Advantage',
        detail: pi.arbitrage_opportunity,
        icon: DollarSign
      });
    }
  }

  return points.slice(0, 6);
}

function calculateWinProbability(
  gaps: CompetitorGap[],
  insights?: Partial<EnhancedCompetitorInsights>
): number {
  let score = 50; // Base score

  // More gaps = higher win probability
  score += Math.min(20, gaps.length * 3);

  // Customer pain points increase win probability
  if (insights?.customer_voice?.pain_points.length) {
    score += Math.min(10, insights.customer_voice.pain_points.length * 2);
  }

  // Switching triggers are very valuable
  if (insights?.customer_voice?.switching_triggers.length) {
    score += Math.min(10, insights.customer_voice.switching_triggers.length * 3);
  }

  // Decelerating momentum is good for us
  if (insights?.feature_velocity?.momentum === 'decelerating') {
    score += 5;
  }

  return Math.min(95, Math.max(30, score));
}

// ============================================================================
// THREAT SCORE DISPLAY
// ============================================================================

interface ThreatScoreDisplayProps {
  threatScore?: ThreatScore;
}

const ThreatScoreDisplay = memo(function ThreatScoreDisplay({ threatScore }: ThreatScoreDisplayProps) {
  if (!threatScore) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-zinc-700/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">Threat Level</span>
        <span className={`text-lg font-bold ${getScoreColor(threatScore.overall)}`}>
          {threatScore.overall}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Market</span>
          <span className={getScoreColor(threatScore.breakdown.market_presence)}>
            {threatScore.breakdown.market_presence}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Velocity</span>
          <span className={getScoreColor(threatScore.breakdown.feature_velocity)}>
            {threatScore.breakdown.feature_velocity}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Satisfaction</span>
          <span className={getScoreColor(threatScore.breakdown.customer_satisfaction)}>
            {threatScore.breakdown.customer_satisfaction}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Pricing</span>
          <span className={getScoreColor(threatScore.breakdown.pricing_pressure)}>
            {threatScore.breakdown.pricing_pressure}%
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// TALKING POINT CARD
// ============================================================================

interface TalkingPointCardProps {
  point: TalkingPoint;
  index: number;
  onCopy?: (text: string) => void;
}

const TalkingPointCard = memo(function TalkingPointCard({
  point,
  index,
  onCopy
}: TalkingPointCardProps) {
  const Icon = point.icon;

  const categoryColors = {
    strength: 'border-green-500/30 bg-green-500/5',
    weakness: 'border-red-500/30 bg-red-500/5',
    opportunity: 'border-blue-500/30 bg-blue-500/5'
  };

  const iconColors = {
    strength: 'text-green-400',
    weakness: 'text-red-400',
    opportunity: 'text-blue-400'
  };

  const handleCopy = () => {
    const text = `${point.title}: ${point.detail}`;
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-3 rounded-lg border ${categoryColors[point.category]} group`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${iconColors[point.category]} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white truncate">{point.title}</h4>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-600/50 rounded"
              title="Copy to clipboard"
            >
              <Copy className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{point.detail}</p>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorBattlecard = memo(function CompetitorBattlecard({
  competitor,
  gaps,
  insights,
  brandName,
  onCopy
}: CompetitorBattlecardProps) {
  const talkingPoints = useMemo(
    () => generateTalkingPoints(competitor, gaps, insights),
    [competitor, gaps, insights]
  );

  const winProbability = useMemo(
    () => calculateWinProbability(gaps, insights),
    [gaps, insights]
  );

  const copyAllPoints = () => {
    const text = talkingPoints
      .map(p => `• ${p.title}: ${p.detail}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-zinc-800/80 px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <Sword className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Win Against {competitor.name}
              </h3>
              <p className="text-xs text-zinc-500">
                {gaps.length} gaps identified • {talkingPoints.length} talking points
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Win Probability</p>
              <p className={`text-lg font-bold ${
                winProbability >= 70 ? 'text-green-400' :
                winProbability >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {winProbability}%
              </p>
            </div>
            <button
              onClick={copyAllPoints}
              className="p-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg transition-colors"
              title="Copy all talking points"
            >
              <Copy className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">
              {gaps.filter(g => g.gap_type === 'void').length}
            </p>
            <p className="text-xs text-zinc-500">Weaknesses</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {gaps.filter(g => g.gap_type === 'demand').length}
            </p>
            <p className="text-xs text-zinc-500">Opportunities</p>
          </div>
          <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {insights?.customer_voice?.pain_points.length || 0}
            </p>
            <p className="text-xs text-zinc-500">Pain Points</p>
          </div>
        </div>

        {/* Threat Score */}
        {insights?.threat_score && (
          <ThreatScoreDisplay threatScore={insights.threat_score} />
        )}

        {/* Talking Points */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Key Talking Points
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {talkingPoints.map((point, index) => (
              <TalkingPointCard
                key={index}
                point={point}
                index={index}
                onCopy={onCopy}
              />
            ))}
          </div>
          {talkingPoints.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No talking points generated yet. Run a scan to identify competitive advantages.
            </p>
          )}
        </div>

        {/* Win Themes */}
        {brandName && talkingPoints.length > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              How {brandName} Wins
            </h4>
            <ul className="text-xs text-zinc-300 space-y-1">
              {gaps.filter(g => g.gap_type === 'void').slice(0, 3).map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>We deliver {gap.title.toLowerCase()} while {competitor.name} doesn't</span>
                </li>
              ))}
              {insights?.customer_voice?.switching_triggers.slice(0, 2).map((trigger, i) => (
                <li key={`trigger-${i}`} className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>Customers switch because: {trigger.substring(0, 80)}...</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default CompetitorBattlecard;
