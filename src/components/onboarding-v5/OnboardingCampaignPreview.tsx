/**
 * Onboarding Campaign Preview
 *
 * Simplified campaign preview for the onboarding flow.
 * Shows generated campaign with all posts in a scrollable list.
 *
 * Created: Nov 17, 2025 - Week 1 Workstream A
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import type { GeneratedCampaign, GeneratedPost } from '@/types/campaign-generation.types';

interface OnboardingCampaignPreviewProps {
  campaign: GeneratedCampaign;
  onSchedule: () => void;
  onBack: () => void;
}

export const OnboardingCampaignPreview: React.FC<OnboardingCampaignPreviewProps> = ({
  campaign,
  onSchedule,
  onBack,
}) => {
  const [expandedPost, setExpandedPost] = useState<string | null>(campaign.posts[0]?.id || null);

  const getCampaignTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      trust_builder: 'from-green-500 to-emerald-500',
      authority_builder: 'from-purple-500 to-blue-500',
      problem_solver: 'from-orange-500 to-red-500',
      differentiator: 'from-blue-500 to-cyan-500',
      engagement_driver: 'from-pink-500 to-purple-500',
    };

    return colors[type] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Campaign Ready!
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {campaign.name}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-4">{campaign.description}</p>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700 dark:text-gray-300">
                {campaign.totalPosts} posts generated
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 dark:text-gray-300">
                {campaign.estimatedDuration} day campaign
              </span>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4 mb-8">
          {campaign.posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              isExpanded={expandedPost === post.id}
              onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
            />
          ))}
        </div>

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
            Schedule Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// POST CARD COMPONENT
// ============================================================================

interface PostCardProps {
  post: GeneratedPost;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, index, isExpanded, onToggle }) => {
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
      linkedin: 'text-blue-600',
      facebook: 'text-blue-500',
      instagram: 'text-pink-500',
      twitter: 'text-sky-500',
      google_business: 'text-red-500',
      tiktok: 'text-gray-900',
      youtube: 'text-red-600',
    };

    return colors[platform] || 'text-gray-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700"
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getPostTypeIcon(post.type)}</span>

          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              Post {index + 1}: {post.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span className={getPlatformColor(post.platform)}>
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </span>

              {post.metadata.impactScore && (
                <>
                  <span>•</span>
                  <span>Impact: {(post.metadata.impactScore * 100).toFixed(0)}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>

      {/* Card Content (Expandable) */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 dark:border-slate-700"
        >
          <div className="p-6 space-y-4">
            {/* Headline */}
            {post.content.headline && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Headline
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {post.content.headline}
                </div>
              </div>
            )}

            {/* Hook */}
            {post.content.hook && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Hook
                </div>
                <div className="text-gray-800 dark:text-gray-200 italic">
                  {post.content.hook}
                </div>
              </div>
            )}

            {/* Body */}
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Content
              </div>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {post.content.body}
              </div>
            </div>

            {/* CTA */}
            {post.content.callToAction && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Call to Action
                </div>
                <div className="text-purple-600 dark:text-purple-400 font-medium">
                  {post.content.callToAction}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {post.content.hashtags.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Hashtags
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.content.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded"
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
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Visuals
                </div>
                <div className="grid grid-cols-2 gap-3">
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

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {post.metadata.psychologyTriggers && post.metadata.psychologyTriggers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Psychology Triggers
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
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
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
      )}
    </motion.div>
  );
};
