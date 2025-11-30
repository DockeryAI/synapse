/**
 * Customer Voice Panel
 *
 * Displays customer voice data extracted from Reddit and reviews:
 * - Pain points (what frustrates customers)
 * - Desires (what they wish existed)
 * - Objections (why they hesitate)
 * - Switching triggers (why they leave)
 *
 * Created: 2025-11-29
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ThumbsDown,
  Heart,
  AlertTriangle,
  ArrowRightLeft,
  Quote,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { CustomerVoice } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface CustomerVoicePanelProps {
  competitorName: string;
  customerVoice?: CustomerVoice;
  isLoading?: boolean;
  compact?: boolean;
}

// ============================================================================
// VOICE SECTION COMPONENT
// ============================================================================

interface VoiceSectionProps {
  title: string;
  icon: React.ElementType;
  items: string[];
  color: string;
  bgColor: string;
  compact?: boolean;
}

const VoiceSection = memo(function VoiceSection({
  title,
  icon: Icon,
  items,
  color,
  bgColor,
  compact
}: VoiceSectionProps) {
  if (items.length === 0) return null;

  const displayItems = compact ? items.slice(0, 2) : items.slice(0, 5);

  return (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm font-medium ${color}`}>{title}</span>
        <span className="text-xs text-zinc-500">({items.length})</span>
      </div>
      <ul className="space-y-1.5">
        {displayItems.map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-xs text-zinc-300 flex items-start gap-2"
          >
            <ChevronRight className={`w-3 h-3 ${color} mt-0.5 flex-shrink-0`} />
            <span className="line-clamp-2">{item}</span>
          </motion.li>
        ))}
      </ul>
      {items.length > displayItems.length && (
        <p className="text-xs text-zinc-500 mt-2">
          +{items.length - displayItems.length} more
        </p>
      )}
    </div>
  );
});

// ============================================================================
// SOURCE QUOTES COMPONENT
// ============================================================================

interface SourceQuotesProps {
  quotes: CustomerVoice['source_quotes'];
  compact?: boolean;
}

const SourceQuotes = memo(function SourceQuotes({ quotes, compact }: SourceQuotesProps) {
  if (quotes.length === 0) return null;

  const displayQuotes = compact ? quotes.slice(0, 1) : quotes.slice(0, 3);

  return (
    <div className="mt-3 pt-3 border-t border-zinc-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Quote className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-400">Source Quotes</span>
      </div>
      <div className="space-y-2">
        {displayQuotes.map((quote, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 }}
            className={`
              p-2 rounded-lg text-xs italic
              ${quote.sentiment === 'negative' ? 'bg-red-500/10 border border-red-500/20' :
                quote.sentiment === 'positive' ? 'bg-green-500/10 border border-green-500/20' :
                'bg-zinc-700/30 border border-zinc-600/30'}
            `}
          >
            <p className="text-zinc-300 line-clamp-2">"{quote.quote}"</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-zinc-500 text-[10px]">{quote.source}</span>
              <span className={`text-[10px] ${
                quote.sentiment === 'negative' ? 'text-red-400' :
                quote.sentiment === 'positive' ? 'text-green-400' :
                'text-zinc-400'
              }`}>
                {quote.sentiment}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// LOADING SKELETON
// ============================================================================

const CustomerVoiceSkeleton = memo(function CustomerVoiceSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-700/30 rounded-lg p-3">
            <div className="h-4 w-24 bg-zinc-600/50 rounded mb-2" />
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-zinc-600/30 rounded" />
              <div className="h-3 w-4/5 bg-zinc-600/30 rounded" />
              {!compact && <div className="h-3 w-3/4 bg-zinc-600/30 rounded" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CustomerVoicePanel = memo(function CustomerVoicePanel({
  competitorName,
  customerVoice,
  isLoading,
  compact
}: CustomerVoicePanelProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Customer Voice</h3>
          <span className="text-xs text-zinc-500">• {competitorName}</span>
        </div>
        <CustomerVoiceSkeleton compact={compact} />
      </div>
    );
  }

  if (!customerVoice) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Customer Voice</h3>
          <span className="text-xs text-zinc-500">• {competitorName}</span>
        </div>
        <p className="text-sm text-zinc-500 text-center py-4">
          No customer voice data available yet
        </p>
      </div>
    );
  }

  const hasData = customerVoice.pain_points.length > 0 ||
    customerVoice.desires.length > 0 ||
    customerVoice.objections.length > 0 ||
    customerVoice.switching_triggers.length > 0;

  if (!hasData) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Customer Voice</h3>
          <span className="text-xs text-zinc-500">• {competitorName}</span>
        </div>
        <p className="text-sm text-zinc-500 text-center py-4">
          No customer insights found for this competitor
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800/50 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Customer Voice</h3>
          <span className="text-xs text-zinc-500">• {competitorName}</span>
        </div>
        {!compact && (
          <span className="text-xs text-zinc-500">
            From Reddit & Reviews
          </span>
        )}
      </div>

      {/* Voice Sections Grid */}
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-3`}>
        <VoiceSection
          title="Pain Points"
          icon={ThumbsDown}
          items={customerVoice.pain_points}
          color="text-red-400"
          bgColor="bg-red-500/10"
          compact={compact}
        />
        <VoiceSection
          title="Desires"
          icon={Heart}
          items={customerVoice.desires}
          color="text-pink-400"
          bgColor="bg-pink-500/10"
          compact={compact}
        />
        <VoiceSection
          title="Objections"
          icon={AlertTriangle}
          items={customerVoice.objections}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          compact={compact}
        />
        <VoiceSection
          title="Switching Triggers"
          icon={ArrowRightLeft}
          items={customerVoice.switching_triggers}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
          compact={compact}
        />
      </div>

      {/* Source Quotes */}
      {!compact && customerVoice.source_quotes && (
        <SourceQuotes quotes={customerVoice.source_quotes} compact={compact} />
      )}
    </motion.div>
  );
});

export default CustomerVoicePanel;
