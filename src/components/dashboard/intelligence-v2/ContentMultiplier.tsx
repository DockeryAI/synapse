/**
 * Content Multiplier Display
 *
 * Shows how 1 breakthrough becomes multiple content pieces:
 * Breakthrough → 3-5 Angles → 5 Platform Variants each → 15-25 ready-to-use pieces
 *
 * Users can:
 * - Expand to see all angles
 * - View platform-specific variants
 * - Copy content to clipboard
 * - See weekly calendar
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Calendar } from 'lucide-react';
import type { MultipliedContent } from '@/services/intelligence/content-multiplier.service';

export interface ContentMultiplierProps {
  multipliedContent: MultipliedContent[];
}

export function ContentMultiplier({ multipliedContent }: ContentMultiplierProps) {
  const [expandedBreakthrough, setExpandedBreakthrough] = useState<string | null>(null);
  const [expandedAngle, setExpandedAngle] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!multipliedContent || multipliedContent.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No multiplied content available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Content Multiplication
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {multipliedContent.length} breakthroughs × 3-5 angles × 5 platforms
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Each breakthrough becomes multiple content pieces ready to publish
      </p>

      {/* Multiplied Content List */}
      <div className="space-y-3">
        {multipliedContent.map(mc => (
          <div
            key={mc.breakthroughId}
            className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            {/* Breakthrough Header */}
            <button
              onClick={() => setExpandedBreakthrough(
                expandedBreakthrough === mc.breakthroughId ? null : mc.breakthroughId
              )}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white text-left">
                {mc.originalTitle}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mc.angles.length} angles, {Object.keys(mc.platformVariants).length * 5} pieces
                </span>
                {expandedBreakthrough === mc.breakthroughId ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* Expanded Angles */}
            {expandedBreakthrough === mc.breakthroughId && (
              <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                {mc.angles.map(angle => (
                  <div
                    key={angle.id}
                    className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden"
                  >
                    {/* Angle Header */}
                    <button
                      onClick={() => setExpandedAngle(expandedAngle === angle.id ? null : angle.id)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {angle.angle}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {angle.hook}
                        </div>
                      </div>
                      {expandedAngle === angle.id ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Platform Variants */}
                    {expandedAngle === angle.id && (
                      <div className="border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 p-3 space-y-2">
                        {mc.platformVariants[angle.id]?.map(variant => (
                          <div
                            key={`${angle.id}-${variant.platform}`}
                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3"
                          >
                            {/* Platform Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                                  {variant.platform}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {variant.format}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(variant.content, `${angle.id}-${variant.platform}`)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                              >
                                {copiedId === `${angle.id}-${variant.platform}` ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Email Subject (if email) */}
                            {variant.subject && (
                              <div className="mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                                <div className="text-xs text-gray-500 mb-1">Subject:</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {variant.subject}
                                </div>
                              </div>
                            )}

                            {/* Content */}
                            <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {variant.content}
                            </div>

                            {/* Hashtags (if any) */}
                            {variant.hashtags && variant.hashtags.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                <div className="flex flex-wrap gap-1">
                                  {variant.hashtags.map(tag => (
                                    <span
                                      key={tag}
                                      className="text-xs text-purple-600 dark:text-purple-400"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Character Count */}
                            <div className="mt-2 text-xs text-gray-500">
                              {variant.characterCount} characters
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Weekly Calendar Preview */}
                {mc.weeklyCalendar && mc.weeklyCalendar.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Weekly Calendar
                    </h4>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {mc.weeklyCalendar.map((day, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded p-1"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {day.day.substring(0, 3)}
                          </div>
                          <div className="text-purple-600 dark:text-purple-400">
                            {day.platform}
                          </div>
                          <div className="text-gray-500">
                            {day.timeSlot}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
