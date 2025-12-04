/**
 * Campaign Preview Modal
 *
 * Phase 9: Shows generated 4-week campaign plan with:
 * - Per-post scores and platform breakdown
 * - Individual post editing before save
 * - Save to Calendar functionality
 *
 * Created: 2025-12-01
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Save,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Loader2,
  BarChart3,
  Target,
  Clock,
  Copy
} from 'lucide-react';
import type { CampaignPost } from '@/types/ai-commands.types';
import { ContentCalendarService } from '@/services/content-calendar.service';
import type { Platform } from '@/types/content-calendar.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CampaignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignPost[];
  brandId: string;
  onSaveComplete?: (savedCount: number) => void;
}

// Extended interface for local editing state
interface EditablePost extends CampaignPost {
  isEditing?: boolean;
  editedContent?: string;
}

// ============================================================================
// PLATFORM ICONS/COLORS
// ============================================================================

const PLATFORM_CONFIG: Record<string, { color: string; bgColor: string }> = {
  linkedin: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  instagram: { color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  twitter: { color: 'text-sky-500', bgColor: 'bg-sky-100 dark:bg-sky-900/30' },
  facebook: { color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  tiktok: { color: 'text-black dark:text-white', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  educational: 'Educational',
  promotional: 'Promotional',
  community: 'Community',
  authority: 'Authority',
  engagement: 'Engagement',
};

// ============================================================================
// POST CARD COMPONENT
// ============================================================================

interface PostCardProps {
  post: EditablePost;
  onEdit: (id: string) => void;
  onSaveEdit: (id: string, content: string) => void;
  onCancelEdit: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
}

function PostCard({ post, onEdit, onSaveEdit, onCancelEdit, onContentChange }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const platformConfig = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.linkedin;
  const score = post.content?.score?.total || 0;
  const postId = `${post.week}-${post.day}-${post.platform}`;

  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBgColor = score >= 75 ? 'bg-green-100 dark:bg-green-900/30' : score >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30';

  const contentText = post.editedContent ?? post.content?.headline ?? '';

  return (
    <motion.div
      layout
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
        onClick={() => !post.isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${platformConfig.bgColor} ${platformConfig.color}`}>
            {post.platform}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Week {post.week}, Day {post.day}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {CONTENT_TYPE_LABELS[post.contentType] || post.contentType}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-bold ${scoreBgColor} ${scoreColor}`}>
            {score}
          </div>
          {!post.isEditing && (
            isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {(isExpanded || post.isEditing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-slate-700"
          >
            <div className="p-3">
              {post.isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={contentText}
                    onChange={(e) => onContentChange(postId, e.target.value)}
                    className="w-full h-32 p-3 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Edit your post content..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onCancelEdit(postId)}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onSaveEdit(postId, contentText)}
                      className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Headline */}
                  {post.content?.headline && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.content.headline}
                      </p>
                    </div>
                  )}

                  {/* Body Preview */}
                  {post.content?.body && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {post.content.body}
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  {post.content?.cta && (
                    <div className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-medium text-purple-700 dark:text-purple-400">
                      {post.content.cta}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(postId);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(post.content?.body || post.content?.headline || '');
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export function CampaignPreviewModal({
  isOpen,
  onClose,
  campaign,
  brandId,
  onSaveComplete
}: CampaignPreviewModalProps) {
  const [posts, setPosts] = useState<EditablePost[]>(() =>
    campaign.map(p => ({ ...p, isEditing: false, editedContent: undefined }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [activeWeek, setActiveWeek] = useState(1);

  // Calculate stats
  const stats = useMemo(() => {
    const totalScore = posts.reduce((sum, p) => sum + (p.content?.score?.total || 0), 0);
    const avgScore = posts.length > 0 ? Math.round(totalScore / posts.length) : 0;
    const platforms = new Set(posts.map(p => p.platform)).size;
    const weeks = Math.max(...posts.map(p => p.week), 0);

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    posts.forEach(p => {
      platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
    });

    // Content type breakdown
    const typeCounts: Record<string, number> = {};
    posts.forEach(p => {
      typeCounts[p.contentType] = (typeCounts[p.contentType] || 0) + 1;
    });

    return { totalPosts: posts.length, avgScore, platforms, weeks, platformCounts, typeCounts };
  }, [posts]);

  // Filter posts by week
  const weekPosts = useMemo(() => {
    return posts.filter(p => p.week === activeWeek);
  }, [posts, activeWeek]);

  // Edit handlers
  const handleEdit = useCallback((id: string) => {
    setPosts(prev => prev.map(p => {
      const postId = `${p.week}-${p.day}-${p.platform}`;
      if (postId === id) {
        return { ...p, isEditing: true, editedContent: p.content?.headline || '' };
      }
      return p;
    }));
  }, []);

  const handleSaveEdit = useCallback((id: string, content: string) => {
    setPosts(prev => prev.map(p => {
      const postId = `${p.week}-${p.day}-${p.platform}`;
      if (postId === id) {
        return {
          ...p,
          isEditing: false,
          editedContent: content,
          content: p.content ? { ...p.content, headline: content } : undefined
        };
      }
      return p;
    }));
  }, []);

  const handleCancelEdit = useCallback((id: string) => {
    setPosts(prev => prev.map(p => {
      const postId = `${p.week}-${p.day}-${p.platform}`;
      if (postId === id) {
        return { ...p, isEditing: false, editedContent: undefined };
      }
      return p;
    }));
  }, []);

  const handleContentChange = useCallback((id: string, content: string) => {
    setPosts(prev => prev.map(p => {
      const postId = `${p.week}-${p.day}-${p.platform}`;
      if (postId === id) {
        return { ...p, editedContent: content };
      }
      return p;
    }));
  }, []);

  // Save to calendar
  const handleSaveToCalendar = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedCount(0);

    try {
      let saved = 0;

      for (const post of posts) {
        try {
          // Calculate scheduled date (starting from today)
          const startDate = new Date();
          const scheduledDate = new Date(startDate);
          scheduledDate.setDate(startDate.getDate() + ((post.week - 1) * 7) + (post.day - 1));

          // Get optimal time for platform
          const dateStr = scheduledDate.toISOString().split('T')[0];
          const optimalTimes = await ContentCalendarService.getOptimalTimes(
            post.platform as Platform,
            dateStr,
            brandId
          );

          const scheduledTime = optimalTimes.length > 0
            ? optimalTimes[0].time
            : `${dateStr}T12:00:00`;

          // Create content item
          await ContentCalendarService.createContentItem({
            brand_id: brandId,
            platform: post.platform as Platform,
            content_text: post.editedContent || post.content?.body || post.content?.headline || '',
            scheduled_time: scheduledTime,
            status: 'scheduled',
            generation_mode: 'synapse',
            synapse_score: post.content?.score?.total,
            intelligence_badges: ['V5 Easy Mode', `Score: ${post.content?.score?.total || 0}`],
          });

          saved++;
          setSavedCount(saved);
        } catch (err) {
          console.error(`Failed to save post:`, err);
          // Continue with other posts
        }
      }

      if (saved === posts.length) {
        onSaveComplete?.(saved);
        onClose();
      } else if (saved > 0) {
        setSaveError(`Saved ${saved} of ${posts.length} posts. Some posts failed to save.`);
      } else {
        setSaveError('Failed to save posts. Please check your calendar settings.');
      }
    } catch (err: any) {
      console.error('Save to calendar failed:', err);
      setSaveError(err.message || 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Campaign Preview</h2>
                <p className="text-xs text-gray-500">Review and edit before saving to calendar</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.totalPosts} Posts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avg Score: {stats.avgScore}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.platforms} Platforms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.weeks} Weeks
                  </span>
                </div>
              </div>

              {/* Platform pills */}
              <div className="flex items-center gap-1">
                {Object.entries(stats.platformCounts).map(([platform, count]) => {
                  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.linkedin;
                  return (
                    <div
                      key={platform}
                      className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${config.bgColor} ${config.color}`}
                    >
                      {platform}: {count}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Week Tabs */}
          <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-slate-700">
            {[1, 2, 3, 4].map(week => (
              <button
                key={week}
                onClick={() => setActiveWeek(week)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeWeek === week
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                Week {week}
                <span className="ml-2 text-xs text-gray-400">
                  ({posts.filter(p => p.week === week).length} posts)
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {weekPosts.length > 0 ? (
                weekPosts.map((post) => (
                  <PostCard
                    key={`${post.week}-${post.day}-${post.platform}`}
                    post={post}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onContentChange={handleContentChange}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No posts for Week {activeWeek}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            {saveError && (
              <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {isSaving && (
                  <span className="text-sm text-gray-500">
                    Saving {savedCount}/{posts.length}...
                  </span>
                )}
                <button
                  onClick={handleSaveToCalendar}
                  disabled={isSaving || posts.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save to Calendar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CampaignPreviewModal;
