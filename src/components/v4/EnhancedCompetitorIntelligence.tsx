/**
 * Enhanced Competitor Intelligence Panel
 *
 * Comprehensive competitor intelligence display including:
 * - Customer Voice Panel (pain points, desires, objections, switching triggers)
 * - Competitor Battlecard (win themes, talking points)
 * - Narrative Gap Alerts (marketing vs reality)
 * - Switching Trigger Content suggestions
 * - Quick Actions for weakness exploitation
 *
 * Created: 2025-11-29
 */

import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Sword,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  Zap,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  Briefcase,
  Copy,
  ExternalLink
} from 'lucide-react';
import { CustomerVoicePanel } from './CustomerVoicePanel';
import { CompetitorBattlecard } from './CompetitorBattlecard';
import type {
  CompetitorProfile,
  CompetitorGap,
  EnhancedCompetitorInsights,
  CustomerVoice
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface EnhancedCompetitorIntelligenceProps {
  competitor: CompetitorProfile;
  gaps: CompetitorGap[];
  insights?: Partial<EnhancedCompetitorInsights>;
  customerVoice?: CustomerVoice;
  brandName?: string;
  isLoading?: boolean;
  onGenerateContent?: (type: string, data: any) => void;
}

// ============================================================================
// NARRATIVE GAP ALERT
// ============================================================================

interface NarrativeGapAlertProps {
  competitorName: string;
  narrativeDissonance?: EnhancedCompetitorInsights['narrative_dissonance'];
}

const NarrativeGapAlert = memo(function NarrativeGapAlert({
  competitorName,
  narrativeDissonance
}: NarrativeGapAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!narrativeDissonance ||
      (narrativeDissonance.marketing_claims.length === 0 &&
       narrativeDissonance.user_reality.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Narrative Gap Detected
            </h3>
            <p className="text-xs text-amber-300/80">
              {competitorName}'s marketing vs user reality
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Marketing Claims */}
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  What They Claim
                </h4>
                <ul className="space-y-1">
                  {narrativeDissonance.marketing_claims.slice(0, 3).map((claim, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Reality */}
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  What Users Say
                </h4>
                <ul className="space-y-1">
                  {narrativeDissonance.user_reality.slice(0, 3).map((reality, i) => (
                    <li key={i} className="text-xs text-red-300 flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{reality}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exploitation Opportunity */}
              {narrativeDissonance.exploitation_opportunity && (
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <h4 className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Your Opportunity
                  </h4>
                  <p className="text-xs text-green-300">
                    {narrativeDissonance.exploitation_opportunity}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// SWITCHING TRIGGER CONTENT
// ============================================================================

interface SwitchingTriggerContentProps {
  competitorName: string;
  triggers: string[];
  onGenerateContent?: (trigger: string) => void;
}

const SwitchingTriggerContent = memo(function SwitchingTriggerContent({
  competitorName,
  triggers,
  onGenerateContent
}: SwitchingTriggerContentProps) {
  if (triggers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Switching Triggers
          </h3>
          <p className="text-xs text-cyan-300/80">
            Why users leave {competitorName}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {triggers.slice(0, 4).map((trigger, index) => (
          <div
            key={index}
            className="bg-zinc-800/50 rounded-lg p-3 flex items-start justify-between gap-3 group"
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-zinc-300 line-clamp-2">{trigger}</p>
            </div>
            {onGenerateContent && (
              <button
                onClick={() => onGenerateContent(trigger)}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded"
              >
                Create Content
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

// ============================================================================
// WEAKNESS QUICK ACTIONS
// ============================================================================

interface WeaknessQuickActionsProps {
  competitorName: string;
  strategicWeakness?: EnhancedCompetitorInsights['strategic_weakness'];
  gaps: CompetitorGap[];
  onGenerateContent?: (type: string, data: any) => void;
}

const WeaknessQuickActions = memo(function WeaknessQuickActions({
  competitorName,
  strategicWeakness,
  gaps,
  onGenerateContent
}: WeaknessQuickActionsProps) {
  // Get void gaps (competitor weaknesses)
  const voidGaps = gaps.filter(g => g.gap_type === 'void').slice(0, 3);

  if (!strategicWeakness && voidGaps.length === 0) return null;

  const contentTypes = [
    { id: 'attack-ad', label: 'Attack Ad', icon: Target, color: 'red' },
    { id: 'comparison', label: 'Comparison Guide', icon: TrendingUp, color: 'blue' },
    { id: 'case-study', label: 'Case Study', icon: Building2, color: 'green' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Sword className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Quick Attack Content
          </h3>
          <p className="text-xs text-zinc-400">
            Exploit {competitorName}'s weaknesses
          </p>
        </div>
      </div>

      {/* Core Vulnerability */}
      {strategicWeakness?.core_vulnerability && (
        <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <h4 className="text-xs font-medium text-red-400 mb-1">Core Vulnerability</h4>
          <p className="text-xs text-red-200">{strategicWeakness.core_vulnerability}</p>
          {strategicWeakness.attack_vector && (
            <p className="text-xs text-zinc-400 mt-2">
              <span className="text-red-300">Attack vector:</span> {strategicWeakness.attack_vector}
            </p>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-2">
        {contentTypes.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onGenerateContent?.(id, { competitorName, strategicWeakness, gaps: voidGaps })}
            className={`
              p-3 rounded-lg text-center transition-all
              bg-${color}-500/10 hover:bg-${color}-500/20
              border border-${color}-500/20 hover:border-${color}-500/40
            `}
          >
            <Icon className={`w-5 h-5 text-${color}-400 mx-auto mb-1`} />
            <span className={`text-xs font-medium text-${color}-300`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Top Weaknesses */}
      {voidGaps.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-medium text-zinc-400">Top Weaknesses to Exploit</h4>
          {voidGaps.map((gap, index) => (
            <div
              key={gap.id}
              className="flex items-center justify-between p-2 bg-zinc-700/30 rounded-lg"
            >
              <span className="text-xs text-zinc-300 truncate flex-1">{gap.title}</span>
              <button
                onClick={() => onGenerateContent?.('attack-ad', { gap, competitorName })}
                className="text-xs text-red-400 hover:text-red-300 px-2"
              >
                Attack
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// ============================================================================
// TALENT SIGNALS PANEL
// ============================================================================

interface TalentSignalsPanelProps {
  competitorName: string;
  talentSignals?: any;
}

const TalentSignalsPanel = memo(function TalentSignalsPanel({
  competitorName,
  talentSignals
}: TalentSignalsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!talentSignals || !talentSignals.hiring_trends?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Talent Signals
            </h3>
            <p className="text-xs text-zinc-400">
              {competitorName}'s hiring reveals strategy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            talentSignals.hiring_velocity === 'aggressive' ? 'bg-red-500/20 text-red-300' :
            talentSignals.hiring_velocity === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
            'bg-zinc-600 text-zinc-300'
          }`}>
            {talentSignals.hiring_velocity} hiring
          </span>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Hiring Trends */}
              {talentSignals.hiring_trends.map((trend: any, i: number) => (
                <div key={i} className="bg-zinc-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{trend.department}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      trend.intensity === 'aggressive' ? 'bg-red-500/20 text-red-300' :
                      trend.intensity === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-zinc-600 text-zinc-400'
                    }`}>
                      {trend.intensity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{trend.strategic_implication}</p>
                </div>
              ))}

              {/* Strategic Insights */}
              {talentSignals.strategic_insights?.length > 0 && (
                <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <h4 className="text-xs font-medium text-purple-400 mb-2">Strategic Insights</h4>
                  <ul className="space-y-1">
                    {talentSignals.strategic_insights.map((insight: string, i: number) => (
                      <li key={i} className="text-xs text-purple-200 flex items-start gap-2">
                        <span className="text-purple-400">→</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EnhancedCompetitorIntelligence = memo(function EnhancedCompetitorIntelligence({
  competitor,
  gaps,
  insights,
  customerVoice,
  brandName,
  isLoading,
  onGenerateContent
}: EnhancedCompetitorIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'battlecard' | 'voice'>('overview');

  // Filter gaps for this competitor
  const competitorGaps = useMemo(() =>
    gaps.filter(g => g.competitor_ids.includes(competitor.id)),
    [gaps, competitor.id]
  );

  // Get customer voice from insights or prop
  const voice = customerVoice || insights?.customer_voice;

  // Get switching triggers
  const switchingTriggers = voice?.switching_triggers || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'battlecard', label: 'Battlecard', icon: Sword },
    { id: 'voice', label: 'Customer Voice', icon: MessageSquare }
  ];

  return (
    <div className="space-y-4">
      {/* Competitor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{competitor.name}</h2>
            <p className="text-sm text-zinc-400">
              {competitorGaps.length} gaps • {switchingTriggers.length} switching triggers
            </p>
          </div>
        </div>
        {competitor.website_url && (
          <a
            href={competitor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-sm
              ${activeTab === id
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'}
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Narrative Gap Alert */}
            <NarrativeGapAlert
              competitorName={competitor.name}
              narrativeDissonance={insights?.narrative_dissonance}
            />

            {/* Switching Triggers */}
            <SwitchingTriggerContent
              competitorName={competitor.name}
              triggers={switchingTriggers}
              onGenerateContent={(trigger) => onGenerateContent?.('switching-trigger', { trigger, competitor })}
            />

            {/* Quick Actions */}
            <WeaknessQuickActions
              competitorName={competitor.name}
              strategicWeakness={insights?.strategic_weakness}
              gaps={competitorGaps}
              onGenerateContent={onGenerateContent}
            />

            {/* Talent Signals */}
            <TalentSignalsPanel
              competitorName={competitor.name}
              talentSignals={(insights as any)?.talent_signals}
            />
          </motion.div>
        )}

        {activeTab === 'battlecard' && (
          <motion.div
            key="battlecard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CompetitorBattlecard
              competitor={competitor}
              gaps={competitorGaps}
              insights={insights}
              brandName={brandName}
              onCopy={(text) => navigator.clipboard.writeText(text)}
            />
          </motion.div>
        )}

        {activeTab === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CustomerVoicePanel
              competitorName={competitor.name}
              customerVoice={voice}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default EnhancedCompetitorIntelligence;
