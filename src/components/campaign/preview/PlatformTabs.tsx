/**
 * PLATFORM TABS COMPONENT
 *
 * Displays tabs for switching between different social media platforms
 * in the campaign preview interface.
 *
 * Features:
 * - Platform logos and names
 * - Active tab indicator
 * - Character count per platform
 * - Preview/Edit mode toggle
 * - Platform warnings (over limit)
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  type SupportedPlatform,
  type PreviewMode,
  type PlatformPreviewContent,
  PLATFORM_CONFIGS
} from '@/types/campaign-preview.types';

// ============================================================================
// PLATFORM ICONS (Simple SVG placeholders - replace with actual icons)
// ============================================================================

const PlatformIcon: React.FC<{ platform: SupportedPlatform; className?: string }> = ({
  platform,
  className = 'w-5 h-5'
}) => {
  // In production, use actual SVG icons from a library like lucide-react or heroicons
  const iconMap: Record<SupportedPlatform, string> = {
    linkedin: '💼',
    facebook: '📘',
    instagram: '📸',
    x: '✖️',
    tiktok: '🎵',
    youtube: '▶️'
  };

  return (
    <span className={`${className} flex items-center justify-center text-lg`}>
      {iconMap[platform]}
    </span>
  );
};

// ============================================================================
// PLATFORM TAB COMPONENT
// ============================================================================

interface PlatformTabProps {
  platform: SupportedPlatform;
  isActive: boolean;
  characterCount: number;
  hasWarnings: boolean;
  onClick: () => void;
}

const PlatformTab: React.FC<PlatformTabProps> = ({
  platform,
  isActive,
  characterCount,
  hasWarnings,
  onClick
}) => {
  const config = PLATFORM_CONFIGS[platform];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg transition-all shadow-lg min-h-[44px] flex-shrink-0
        ${isActive
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Platform Icon */}
      <PlatformIcon platform={platform} className="w-4 h-4 sm:w-5 sm:h-5" />

      {/* Platform Name */}
      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
        {config.displayName}
      </span>

      {/* Character Count Badge */}
      <span className={`
        px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap
        ${hasWarnings
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
          : isActive
          ? 'bg-white/20 text-white border-white/40'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700'
        }
      `}>
        {characterCount}
      </span>

      {/* Warning Indicator */}
      {hasWarnings && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"
        />
      )}
    </motion.button>
  );
};

// ============================================================================
// PLATFORM TABS COMPONENT
// ============================================================================

interface PlatformTabsProps {
  platforms: SupportedPlatform[];
  activePlatform: SupportedPlatform;
  onPlatformChange: (platform: SupportedPlatform) => void;
  platformContent: Record<SupportedPlatform, PlatformPreviewContent>;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
  platforms,
  activePlatform,
  onPlatformChange,
  platformContent,
  mode,
  onModeChange
}) => {
  return (
    <div className="w-full border-b border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-3 sm:px-4 py-2">
        {/* Platform Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          {platforms.map((platform) => {
            const content = platformContent[platform];
            const hasWarnings = content?.warnings && content.warnings.length > 0;
            const characterCount = content?.characterCounts?.total || 0;

            return (
              <PlatformTab
                key={platform}
                platform={platform}
                isActive={activePlatform === platform}
                characterCount={characterCount}
                hasWarnings={hasWarnings}
                onClick={() => onPlatformChange(platform)}
              />
            );
          })}
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onModeChange('preview')}
            className={`
              flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-lg min-h-[44px] sm:min-h-0
              ${mode === 'preview'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
              }
            `}
          >
            <span className="hidden sm:inline">👁️ Preview</span>
            <span className="sm:hidden">👁️</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onModeChange('edit')}
            className={`
              flex-1 sm:flex-none px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-lg min-h-[44px] sm:min-h-0
              ${mode === 'edit'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
              }
            `}
          >
            <span className="hidden sm:inline">✏️ Edit</span>
            <span className="sm:hidden">✏️</span>
          </motion.button>
        </div>
      </div>

      {/* Active Platform Info */}
      <div className="px-3 sm:px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-t border-purple-200 dark:border-purple-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <span className="font-medium">Total Characters:</span>
            <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {platformContent[activePlatform]?.characterCounts?.total || 0}
            </span>
          </div>

          {/* Platform Capabilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-hide">
            {PLATFORM_CONFIGS[activePlatform].supportsImages && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 whitespace-nowrap flex-shrink-0">
                🖼️ <span className="hidden sm:inline">Images</span>
              </span>
            )}
            {PLATFORM_CONFIGS[activePlatform].supportsVideo && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 whitespace-nowrap flex-shrink-0">
                🎥 <span className="hidden sm:inline">Video</span>
              </span>
            )}
            <span className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 whitespace-nowrap flex-shrink-0">
              📐 {PLATFORM_CONFIGS[activePlatform].recommendedAspectRatio}
            </span>
          </div>
        </div>

        {/* Warnings Summary */}
        {platformContent[activePlatform]?.warnings && platformContent[activePlatform].warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg"
          >
            <div className="flex items-start gap-2">
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-red-500"
              >
                ⚠️
              </motion.span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {platformContent[activePlatform].warnings.length} warning(s) for this platform
                </p>
                <ul className="mt-1 space-y-1">
                  {platformContent[activePlatform].warnings.map((warning, idx) => (
                    <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                      {warning.section}: {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
