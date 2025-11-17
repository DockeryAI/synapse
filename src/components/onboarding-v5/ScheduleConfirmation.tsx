/**
 * ScheduleConfirmation Component
 *
 * Shows success screen after campaign scheduling with:
 * - Summary stats (X posts scheduled over Y days)
 * - Platform breakdown
 * - Calendar preview of next 7 days
 * - Error list with retry option
 * - Actions: View Full Calendar, Schedule More Content
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Platform } from '@/services/socialpilot.service';
import type { ScheduleResult, ScheduledPost } from '@/services/publishing/auto-scheduler.service';

export interface ScheduleConfirmationProps {
  result: ScheduleResult;
  onViewCalendar: () => void;
  onScheduleMore: () => void;
  onRetryFailed?: () => void;
}

// Platform icons mapping
const PLATFORM_ICONS: Record<Platform, string> = {
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  instagram: '📸',
  tiktok: '🎵',
  pinterest: '📌',
  youtube: '▶️',
};

// Platform colors
const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: 'from-blue-500 to-blue-600',
  twitter: 'from-sky-400 to-sky-500',
  linkedin: 'from-blue-600 to-blue-700',
  instagram: 'from-pink-500 to-purple-500',
  tiktok: 'from-black to-gray-800',
  pinterest: 'from-red-500 to-red-600',
  youtube: 'from-red-600 to-red-700',
};

export const ScheduleConfirmation: React.FC<ScheduleConfirmationProps> = ({
  result,
  onViewCalendar,
  onScheduleMore,
  onRetryFailed,
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Calculate metrics
  const totalPosts = result.total;
  const scheduledPosts = result.scheduled;
  const failedPosts = result.failed;
  const successRate = result.successRate;

  // Get unique platforms
  const platforms = Array.from(
    new Set(result.schedule.map((post) => post.platforms[0]))
  );

  // Get platform breakdown
  const platformBreakdown = platforms.map((platform) => ({
    platform,
    scheduled: result.schedule.filter(
      (post) => post.platforms[0] === platform && post.status === 'scheduled'
    ).length,
    failed: result.schedule.filter(
      (post) => post.platforms[0] === platform && post.status === 'failed'
    ).length,
  }));

  // Get date range
  const scheduledDates = result.schedule
    .filter((post) => post.status === 'scheduled')
    .map((post) => post.scheduledTime);

  const startDate = scheduledDates.length > 0 ? new Date(Math.min(...scheduledDates.map(d => d.getTime()))) : new Date();
  const endDate = scheduledDates.length > 0 ? new Date(Math.max(...scheduledDates.map(d => d.getTime()))) : new Date();

  const daysDuration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Group posts by date for calendar preview
  const postsByDate: Record<string, ScheduledPost[]> = {};
  result.schedule
    .filter((post) => post.status === 'scheduled')
    .slice(0, 21) // Limit to first 21 posts (7 days × 3 platforms avg)
    .forEach((post) => {
      const dateKey = post.scheduledTime.toLocaleDateString();
      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = [];
      }
      postsByDate[dateKey].push(post);
    });

  // Sort dates
  const sortedDates = Object.keys(postsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Take first 7 days for preview
  const previewDates = sortedDates.slice(0, 7);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {failedPosts === 0 ? 'Campaign Scheduled! 🎉' : 'Scheduling Complete'}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {failedPosts === 0
              ? `All ${scheduledPosts} posts have been scheduled successfully over the next ${daysDuration} days.`
              : `${scheduledPosts} posts scheduled, ${failedPosts} failed. Review errors below.`}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
              {scheduledPosts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Posts Scheduled
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {daysDuration}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Days Duration
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {platforms.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Platforms
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 text-center">
            <div className={`text-3xl sm:text-4xl font-bold mb-1 ${successRate >= 95 ? 'text-green-600 dark:text-green-400' : successRate >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {successRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Success Rate
            </div>
          </div>
        </motion.div>

        {/* Platform Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Platform Breakdown
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformBreakdown.map((item) => (
              <div
                key={item.platform}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900/50 dark:to-slate-900/30 rounded-xl border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${PLATFORM_COLORS[item.platform]} rounded-lg flex items-center justify-center text-2xl`}>
                    {PLATFORM_ICONS[item.platform]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                      {item.platform}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.scheduled + item.failed} posts
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{item.scheduled} scheduled</span>
                  </div>
                  {item.failed > 0 && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{item.failed} failed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Calendar Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Next 7 Days Preview
            </h2>
          </div>

          <div className="space-y-3">
            {previewDates.map((dateKey, index) => {
              const posts = postsByDate[dateKey];
              const date = new Date(dateKey);

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {posts.length} post{posts.length !== 1 ? 's' : ''} scheduled
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {posts.map((post, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                      >
                        <span className="text-lg">
                          {PLATFORM_ICONS[post.platforms[0]]}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {post.scheduledTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Errors Section */}
        {result.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800 p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-bold text-red-900 dark:text-red-300">
                  Scheduling Errors ({result.errors.length})
                </h2>
              </div>
              <button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                {showErrorDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {showErrorDetails && (
              <div className="space-y-2">
                {result.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{PLATFORM_ICONS[error.platform]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Post {error.postId} - {error.platform}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {error.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onRetryFailed && (
              <Button
                onClick={onRetryFailed}
                variant="outline"
                className="w-full mt-4 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 min-h-[48px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Failed Posts
              </Button>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={onViewCalendar}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-h-[56px] text-base"
          >
            <Calendar className="w-5 h-5 mr-2" />
            View Full Calendar
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <Button
            onClick={onScheduleMore}
            variant="outline"
            className="flex-1 border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 min-h-[56px] text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Schedule More Content
          </Button>
        </motion.div>

        {/* Success Tip */}
        {failedPosts === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
          >
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                  Pro Tip
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Your posts are scheduled at optimal times based on your industry and platform best practices. Monitor performance in the Analytics dashboard to refine future campaigns.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
