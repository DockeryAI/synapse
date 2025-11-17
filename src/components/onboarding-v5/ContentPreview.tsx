/**
 * ContentPreview Component
 *
 * Displays generated content (campaign OR single post) with SOURCE ATTRIBUTION.
 * Critical: All content shows sources - "All facts verified" badge.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Calendar,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentSource {
  url: string;
  title: string;
  type: 'website' | 'testimonial' | 'review' | 'case_study' | 'user_input';
}

interface GeneratedContent {
  type: 'campaign' | 'single_post';
  content: string;
  platform?: string;
  sources: ContentSource[];
  posts?: Array<{
    day: number;
    content: string;
    platform: string;
  }>;
}

interface ContentPreviewProps {
  content: GeneratedContent;
  onCopy: () => void;
  onSaveToCalendar: () => void;
  onEmailCapture?: (email: string) => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onCopy,
  onSaveToCalendar,
  onEmailCapture,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  const handleSave = () => {
    setShowEmailCapture(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && onEmailCapture) {
      onEmailCapture(email);
      onSaveToCalendar();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              All Facts Verified
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {content.type === 'campaign' ? 'Your Campaign is Ready!' : 'Your Post is Ready!'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            {content.type === 'campaign'
              ? 'Review your campaign calendar below'
              : 'Copy and post now, or save to your calendar'}
          </p>
        </div>

        {/* Content Display */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
          {content.type === 'single_post' ? (
            // Single Post View
            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-6 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 whitespace-pre-wrap">
                  {content.content}
                </div>
              </div>

              {content.platform && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Platform:</span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    {content.platform}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Campaign Calendar View
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  7-Day Campaign Calendar
                </h3>
              </div>

              <div className="space-y-4">
                {content.posts?.map((post, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {post.day}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Day {post.day}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{post.platform}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Source Attribution Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <h3 className="font-bold text-gray-900 dark:text-white">Sources ({content.sources.length})</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All content verified from these sources
                </p>
              </div>
            </div>
            {showSources ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="space-y-3">
                {content.sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {source.title}
                      </p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline truncate block"
                      >
                        {source.url}
                      </a>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-200 dark:bg-slate-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                        {source.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        {!showEmailCapture ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 min-h-[56px]"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy & Post Now
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-h-[56px]"
            >
              <Save className="w-5 h-5 mr-2" />
              Save to Calendar
            </Button>
          </div>
        ) : (
          // Email Capture Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">One Last Step!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get full calendar access
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none min-h-[48px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 min-h-[56px]"
              >
                Access Full Calendar
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              We'll never spam you. Just your calendar access + occasional tips.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
