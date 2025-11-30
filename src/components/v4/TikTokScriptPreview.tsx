/**
 * TikTok Script Preview Component
 *
 * Displays TikTok video scripts with timing markers,
 * visual cues, and copy-ready formatting.
 *
 * Created: 2025-11-30
 * Phase: Industry Profile 2.0 Integration - Phase 6
 */

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Clock,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  Music,
  Hash,
  MessageCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface TikTokScript {
  id: string;
  title: string;
  totalDuration: number; // seconds
  sections: TikTokSection[];
  hooks: string[];
  hashtags: string[];
  soundSuggestion?: string;
  captionStyle?: 'bold' | 'minimal' | 'animated';
}

export interface TikTokSection {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  script: string;
  visualCue?: string;
  onScreenText?: string;
  transition?: string;
}

interface TikTokScriptPreviewProps {
  script: TikTokScript;
  onCopy?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

// =============================================================================
// SECTION COLORS
// =============================================================================

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  hook: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300' },
  reveal: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
  explanation: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
  cta: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
  default: { bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-800', text: 'text-gray-700 dark:text-gray-300' },
};

// =============================================================================
// TIME FORMATTER
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
}

function formatTimeRange(start: number, end: number): string {
  return `[${formatTime(start)}-${formatTime(end)}]`;
}

// =============================================================================
// SECTION COMPONENT
// =============================================================================

interface ScriptSectionProps {
  section: TikTokSection;
  index: number;
}

const ScriptSection = memo(function ScriptSection({ section, index }: ScriptSectionProps) {
  const sectionType = section.name.toLowerCase().includes('hook') ? 'hook'
    : section.name.toLowerCase().includes('reveal') ? 'reveal'
    : section.name.toLowerCase().includes('explanation') || section.name.toLowerCase().includes('body') ? 'explanation'
    : section.name.toLowerCase().includes('cta') || section.name.toLowerCase().includes('call') ? 'cta'
    : 'default';

  const colors = SECTION_COLORS[sectionType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg border-2 ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {/* Section Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-inherit">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-xs font-mono font-bold ${colors.text}`}>
            {formatTimeRange(section.startTime, section.endTime)}
          </span>
          <span className={`text-sm font-semibold ${colors.text} uppercase tracking-wide`}>
            {section.name}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {section.endTime - section.startTime}s
        </span>
      </div>

      {/* Section Content */}
      <div className="p-4 space-y-3">
        {/* Script */}
        <div>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            "{section.script}"
          </p>
        </div>

        {/* Visual Cue */}
        {section.visualCue && (
          <div className="flex items-start gap-2">
            <Video className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Visual: {section.visualCue}
            </p>
          </div>
        )}

        {/* On-Screen Text */}
        {section.onScreenText && (
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="px-2 py-1 bg-black/80 rounded text-white text-xs font-medium">
              {section.onScreenText}
            </div>
          </div>
        )}

        {/* Transition */}
        {section.transition && (
          <div className="text-xs text-gray-400 italic">
            Transition: {section.transition}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TikTokScriptPreview = memo(function TikTokScriptPreview({
  script,
  onCopy,
  onRegenerate,
  isRegenerating = false,
  className = ''
}: TikTokScriptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Build copy-friendly text
    const lines = [
      `TIKTOK SCRIPT: ${script.title}`,
      `Duration: ${script.totalDuration} seconds`,
      '',
      ...script.sections.map(s =>
        `${formatTimeRange(s.startTime, s.endTime)} ${s.name.toUpperCase()}\n"${s.script}"${s.onScreenText ? `\n[On Screen: ${s.onScreenText}]` : ''}`
      ),
      '',
      `Hashtags: ${script.hashtags.join(' ')}`,
      script.soundSuggestion ? `Sound: ${script.soundSuggestion}` : ''
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [script, onCopy]);

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{script.title}</h3>
            <p className="text-xs text-white/80">
              {script.totalDuration}s • {script.sections.length} sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-1 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700">
          {script.sections.map((section, idx) => {
            const width = ((section.endTime - section.startTime) / script.totalDuration) * 100;
            const sectionType = section.name.toLowerCase().includes('hook') ? 'hook'
              : section.name.toLowerCase().includes('reveal') ? 'reveal'
              : section.name.toLowerCase().includes('explanation') ? 'explanation'
              : section.name.toLowerCase().includes('cta') ? 'cta'
              : 'default';

            const bgColors: Record<string, string> = {
              hook: 'bg-red-400',
              reveal: 'bg-purple-400',
              explanation: 'bg-blue-400',
              cta: 'bg-green-400',
              default: 'bg-gray-400',
            };

            return (
              <div
                key={section.id}
                className={`h-full ${bgColors[sectionType]} flex items-center justify-center`}
                style={{ width: `${width}%` }}
                title={`${section.name}: ${formatTimeRange(section.startTime, section.endTime)}`}
              >
                <span className="text-[10px] font-bold text-white truncate px-1">
                  {section.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3">
        {script.sections.map((section, idx) => (
          <ScriptSection key={section.id} section={section} index={idx} />
        ))}
      </div>

      {/* Footer - Hashtags & Sound */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 space-y-2">
        {/* Hashtags */}
        {script.hashtags.length > 0 && (
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {script.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sound Suggestion */}
        {script.soundSuggestion && (
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Suggested sound: {script.soundSuggestion}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default TikTokScriptPreview;
