/**
 * Session Manager Page
 *
 * Displays all saved UVP sessions for the current brand
 * Allows users to resume or delete sessions
 *
 * Created: 2025-11-20
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Trash2,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sessionManager } from '@/services/uvp/session-manager.service';
import { useBrand } from '@/contexts/BrandContext';
import type { SessionListItem } from '@/types/session.types';

export function SessionManagerPage() {
  const navigate = useNavigate();
  const { currentBrand } = useBrand();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    if (!currentBrand?.id) {
      setError('No brand selected');
      setIsLoading(false);
      return;
    }

    loadSessions();
  }, [currentBrand?.id]);

  const loadSessions = async () => {
    if (!currentBrand?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionManager.listSessions(currentBrand.id);

      if (result.success && result.sessions) {
        setSessions(result.sessions);
      } else {
        setError(result.error || 'Failed to load sessions');
      }
    } catch (err) {
      console.error('[SessionManagerPage] Error loading sessions:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    // Navigate to onboarding page with session ID to restore state
    navigate(`/onboarding-v5?sessionId=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    setDeletingSessionId(sessionId);

    try {
      const result = await sessionManager.deleteSession(sessionId);

      if (result.success) {
        // Remove from local state
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        alert(`Failed to delete session: ${result.error}`);
      }
    } catch (err) {
      console.error('[SessionManagerPage] Error deleting session:', err);
      alert(`Error deleting session: ${err}`);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getStepLabel = (step: string): string => {
    const labels: Record<string, string> = {
      products: 'Products & Services',
      customer: 'Target Customer',
      transformation: 'Transformation Goal',
      solution: 'Unique Solution',
      benefit: 'Key Benefit',
      synthesis: 'Complete Story',
    };
    return labels[step] || step;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your UVP Sessions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Resume where you left off or start fresh
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Failed to Load Sessions
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Sessions Grid */}
        {!isLoading && !error && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                >
                  {/* Session Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {session.session_name}
                      </h3>
                      <a
                        href={session.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        {session.website_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Progress
                        </span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {session.progress_percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                          style={{ width: `${session.progress_percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Current Step: <span className="font-medium">{getStepLabel(session.current_step)}</span>
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        Last accessed {formatDate(session.last_accessed)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(session.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-2">
                      <Button
                        onClick={() => handleResumeSession(session.id)}
                        className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </Button>
                      <Button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        variant="outline"
                        size="icon"
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Sessions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven't started any UVP sessions yet. Begin by entering your website URL to discover your unique value proposition.
            </p>
            <Button
              onClick={() => navigate('/onboarding-v5')}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Play className="w-4 h-4" />
              Start New Session
            </Button>
          </motion.div>
        )}

        {/* Stats Summary (if sessions exist) */}
        {!isLoading && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-6"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {sessions.length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Sessions
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {sessions.filter(s => s.progress_percentage === 100).length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sessions.filter(s => s.progress_percentage > 0 && s.progress_percentage < 100).length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
