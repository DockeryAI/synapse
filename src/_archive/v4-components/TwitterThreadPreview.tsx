/**
 * Twitter Thread Preview Component
 *
 * Displays Twitter/X threads with numbered tweets,
 * character counts, and copy-ready formatting.
 *
 * Created: 2025-11-30
 * Phase: Industry Profile 2.0 Integration - Phase 6
 */

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Twitter,
  Copy,
  Check,
  MessageCircle,
  Heart,
  Repeat2,
  BarChart2,
  Share,
  Hash,
  AtSign,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface TwitterThread {
  id: string;
  title: string;
  tweets: Tweet[];
  hashtags: string[];
  callToAction?: string;
}

export interface Tweet {
  id: string;
  number: number;
  content: string;
  hasMedia?: boolean;
  mediaDescription?: string;
  replyTo?: string;
}

interface TwitterThreadPreviewProps {
  thread: TwitterThread;
  onCopy?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_TWEET_LENGTH = 280;
const WARNING_THRESHOLD = 260;

// =============================================================================
// TWEET COMPONENT
// =============================================================================

interface TweetCardProps {
  tweet: Tweet;
  totalTweets: number;
  isFirst: boolean;
  isLast: boolean;
}

const TweetCard = memo(function TweetCard({ tweet, totalTweets, isFirst, isLast }: TweetCardProps) {
  const charCount = tweet.content.length;
  const isOverLimit = charCount > MAX_TWEET_LENGTH;
  const isNearLimit = charCount > WARNING_THRESHOLD && !isOverLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tweet.number * 0.05 }}
      className="relative"
    >
      {/* Connection Line */}
      {!isFirst && (
        <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-300 dark:bg-slate-600" />
      )}

      {/* Tweet Card */}
      <div className={`
        rounded-xl border bg-white dark:bg-slate-800 overflow-hidden
        ${isOverLimit
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-200 dark:border-slate-700'
        }
      `}>
        {/* Tweet Header */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {tweet.number}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white">Your Brand</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">@yourbrand</span>
              {isFirst && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  Thread Start
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tweet {tweet.number} of {totalTweets}
            </p>
          </div>

          {/* Character Count */}
          <div className={`text-sm font-mono ${
            isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-400'
          }`}>
            {charCount}/{MAX_TWEET_LENGTH}
            {isOverLimit && <AlertCircle className="w-4 h-4 inline ml-1" />}
          </div>
        </div>

        {/* Tweet Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {tweet.content}
          </p>

          {/* Media Placeholder */}
          {tweet.hasMedia && (
            <div className="mt-3 rounded-xl bg-gray-100 dark:bg-slate-700 p-4 border border-gray-200 dark:border-slate-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {tweet.mediaDescription || 'Attach image or video here'}
              </p>
            </div>
          )}
        </div>

        {/* Tweet Actions (Mock) */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-gray-500 dark:text-gray-400">
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Reply</span>
          </button>
          <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs">Repost</span>
          </button>
          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart className="w-4 h-4" />
            <span className="text-xs">Like</span>
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <BarChart2 className="w-4 h-4" />
            <span className="text-xs">Views</span>
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <Share className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-6 -bottom-3 w-0.5 h-3 bg-gray-300 dark:bg-slate-600" />
      )}
    </motion.div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TwitterThreadPreview = memo(function TwitterThreadPreview({
  thread,
  onCopy,
  onRegenerate,
  isRegenerating = false,
  className = ''
}: TwitterThreadPreviewProps) {
  const [copied, setCopied] = useState(false);

  const totalCharacters = thread.tweets.reduce((sum, t) => sum + t.content.length, 0);
  const hasOverLimit = thread.tweets.some(t => t.content.length > MAX_TWEET_LENGTH);

  const handleCopy = useCallback(() => {
    // Build copy-friendly text
    const lines = [
      `TWITTER THREAD: ${thread.title}`,
      `${thread.tweets.length} tweets`,
      '',
      ...thread.tweets.map(t =>
        `[Tweet ${t.number}/${thread.tweets.length}]\n${t.content}\n`
      ),
      thread.hashtags.length > 0 ? `Hashtags: ${thread.hashtags.join(' ')}` : '',
      thread.callToAction ? `CTA: ${thread.callToAction}` : ''
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [thread, onCopy]);

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Twitter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{thread.title}</h3>
            <p className="text-xs text-white/80">
              {thread.tweets.length} tweets • {totalCharacters} characters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasOverLimit && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-red-100 text-xs">
              <AlertCircle className="w-3 h-3" />
              Over limit
            </div>
          )}
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
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>

      {/* Thread Stats Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          <span>{thread.tweets.length} tweets</span>
        </div>
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          <span>{thread.hashtags.length} hashtags</span>
        </div>
        <div className="flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          <span>~{Math.ceil(totalCharacters / 280)} min read</span>
        </div>
      </div>

      {/* Tweets */}
      <div className="p-4 space-y-6">
        {thread.tweets.map((tweet, idx) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            totalTweets={thread.tweets.length}
            isFirst={idx === 0}
            isLast={idx === thread.tweets.length - 1}
          />
        ))}
      </div>

      {/* Footer - Hashtags & CTA */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 space-y-2">
        {/* Hashtags */}
        {thread.hashtags.length > 0 && (
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {thread.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {thread.callToAction && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Thread CTA:</span>
            <span>{thread.callToAction}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default TwitterThreadPreview;
