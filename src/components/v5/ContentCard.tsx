/**
 * V5 Content Card Component
 *
 * Displays generated content with score, platform badge, and actions.
 *
 * Created: 2025-12-01
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { QualityBadge, QualityStars } from './QualityBadge';
import { ScoreDisplay, ScoreCircle } from './ScoreDisplay';
import type { V5GeneratedContent, Platform } from '@/services/v5/types';
import {
  Copy,
  Check,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';

export interface ContentCardProps {
  content: V5GeneratedContent;
  onRegenerate?: () => void;
  onSaveToCalendar?: () => void;
  onCopy?: (text: string) => void;
  isRegenerating?: boolean;
  showDetailedScore?: boolean;
  className?: string;
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  tiktok: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
};

const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  twitter: 'bg-sky-500',
  tiktok: 'bg-black',
};

export function ContentCard({
  content,
  onRegenerate,
  onSaveToCalendar,
  onCopy,
  isRegenerating = false,
  showDetailedScore = false,
  className,
}: ContentCardProps) {
  const [copied, setCopied] = useState(false);
  const [showScore, setShowScore] = useState(showDetailedScore);

  const fullContent = `${content.headline}\n\n${content.body}\n\n${content.cta}\n\n${content.hashtags.join(' ')}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullContent);
    setCopied(true);
    onCopy?.(fullContent);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Platform Badge */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-white text-xs font-medium',
              PLATFORM_COLORS[content.metadata.platform]
            )}
          >
            {PLATFORM_ICONS[content.metadata.platform]}
            <span className="capitalize">{content.metadata.platform}</span>
          </div>

          {/* Content Type */}
          <span className="text-xs text-gray-500 capitalize">
            {content.metadata.contentType}
          </span>
        </div>

        {/* Quality Badge */}
        <QualityBadge
          score={content.score.total}
          tier={content.score.tier}
          size="sm"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Headline */}
        <p className="font-semibold text-gray-900 leading-snug">
          {content.headline}
        </p>

        {/* Body */}
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {content.body}
        </p>

        {/* CTA */}
        {content.cta && (
          <p className="text-blue-600 font-medium text-sm">
            {content.cta}
          </p>
        )}

        {/* Hashtags */}
        {content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.hashtags.map((tag, i) => (
              <span
                key={i}
                className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Score Breakdown Toggle */}
      <button
        onClick={() => setShowScore(!showScore)}
        className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ScoreCircle score={content.score.total} size={32} />
          <span>Psychology Score</span>
        </div>
        {showScore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Score Details */}
      {showScore && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <ScoreDisplay
            score={content.score}
            variant="bars"
            showHints={!content.score.passed}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Save to Calendar */}
          {onSaveToCalendar && (
            <button
              onClick={onSaveToCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>
          )}
        </div>

        {/* Regenerate */}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
              isRegenerating
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRegenerating && 'animate-spin')} />
            <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        )}
      </div>

      {/* Metadata Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>{content.metadata.characterCount} chars</span>
        <span>{content.metadata.attempts} attempt{content.metadata.attempts !== 1 ? 's' : ''}</span>
        <span className="capitalize">{content.metadata.customerCategory}</span>
      </div>
    </div>
  );
}

export default ContentCard;
