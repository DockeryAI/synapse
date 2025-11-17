/**
 * Onboarding Single Post Preview
 *
 * Simplified post preview for the onboarding flow.
 * Shows a single generated post with full details.
 *
 * Created: Nov 17, 2025 - Week 1 Workstream A
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Copy,
  Download,
} from 'lucide-react';
import type { GeneratedPost } from '@/types/campaign-generation.types';

interface OnboardingSinglePostPreviewProps {
  post: GeneratedPost;
  onSchedule: () => void;
  onBack: () => void;
}

export const OnboardingSinglePostPreview: React.FC<OnboardingSinglePostPreviewProps> = ({
  post,
  onSchedule,
  onBack,
}) => {
  const handleCopy = async () => {
    const fullText = [
      post.content.headline,
      post.content.hook,
      post.content.body,
      post.content.hashtags.join(' '),
      post.content.callToAction,
    ]
      .filter(Boolean)
      .join('\n\n');

    await navigator.clipboard.writeText(fullText);
    // Could add a toast notification here
  };

  const getPostTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      customer_success: '⭐',
      service_spotlight: '💼',
      problem_solution: '🎯',
      value_proposition: '✨',
      behind_the_scenes: '👀',
      community_engagement: '🤝',
      educational: '📚',
      promotional: '🚀',
    };

    return icons[type] || '📝';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-600',
      facebook: 'bg-blue-500',
      instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
      twitter: 'bg-sky-500',
      google_business: 'bg-red-500',
      tiktok: 'bg-gray-900',
      youtube: 'bg-red-600',
    };

    return colors[platform] || 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Post Ready!
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Post is Ready to Publish
          </h1>

          {/* Post Type Badge */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <span className="text-2xl">{getPostTypeIcon(post.type)}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {post.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2 ${getPlatformColor(
                post.platform
              )} text-white rounded-full shadow-sm`}
            >
              <span className="text-sm font-medium">
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Post Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden mb-6"
        >
          {/* Post Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Preview</h2>
                {post.metadata.impactScore && (
                  <p className="text-sm opacity-90">
                    Predicted Impact: {(post.metadata.impactScore * 100).toFixed(0)}%
                  </p>
                )}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy</span>
              </button>
            </div>
          </div>

          {/* Post Body */}
          <div className="p-6 space-y-6">
            {/* Headline */}
            {post.content.headline && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Headline
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {post.content.headline}
                </div>
              </div>
            )}

            {/* Hook */}
            {post.content.hook && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Hook
                </div>
                <div className="text-lg text-gray-800 dark:text-gray-200 italic font-medium">
                  {post.content.hook}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Content
              </div>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                {post.content.body}
              </div>
            </div>

            {/* CTA */}
            {post.content.callToAction && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase mb-1">
                  Call to Action
                </div>
                <div className="text-purple-900 dark:text-purple-300 font-semibold text-lg">
                  {post.content.callToAction}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {post.content.hashtags.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Hashtags
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.content.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visuals */}
            {post.visuals.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Generated Visuals
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.visuals.map((visual) => (
                    <a
                      key={visual.id}
                      href={visual.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                    >
                      <img
                        src={visual.url}
                        alt={visual.altText || 'Generated visual'}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <ExternalLink className="w-6 h-6 text-white" />
                        <Download className="w-6 h-6 text-white" />
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {visual.altText || 'Click to view full size'}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
            {/* Psychology Triggers */}
            {post.metadata.psychologyTriggers && post.metadata.psychologyTriggers.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Psychology Triggers Used
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.metadata.psychologyTriggers.map((trigger, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {post.sources.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Content Sources
                </div>
                <div className="space-y-1">
                  {post.sources.map((source, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">•</span>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {source.type}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{source.type}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        ({(source.confidence * 100).toFixed(0)}% confidence)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suggestions
          </button>

          <button
            onClick={onSchedule}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg font-medium"
          >
            <Calendar className="w-5 h-5" />
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
};
