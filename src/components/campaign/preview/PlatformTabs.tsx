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
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 transition-all
        ${isActive
          ? 'bg-white dark:bg-gray-800 border-blue-500 text-blue-600 dark:text-blue-400'
          : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Platform Icon */}
      <PlatformIcon platform={platform} />

      {/* Platform Name */}
      <span className="font-medium text-sm">
        {config.displayName}
      </span>

      {/* Character Count Badge */}
      <span className={`
        ml-2 px-2 py-0.5 rounded-full text-xs font-medium
        ${hasWarnings
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }
      `}>
        {characterCount}
      </span>

      {/* Warning Indicator */}
      {hasWarnings && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
      )}
    </button>
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
    <div className="w-full border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Platform Tabs */}
        <div className="flex gap-1 overflow-x-auto">
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
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onModeChange('preview')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${mode === 'preview'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            👁️ Preview
          </button>
          <button
            onClick={() => onModeChange('edit')}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${mode === 'edit'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Active Platform Info */}
      <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>Total Characters:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {platformContent[activePlatform]?.characterCounts?.total || 0}
            </span>
          </div>

          {/* Platform Capabilities */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {PLATFORM_CONFIGS[activePlatform].supportsImages && (
              <span className="flex items-center gap-1">
                🖼️ Images
              </span>
            )}
            {PLATFORM_CONFIGS[activePlatform].supportsVideo && (
              <span className="flex items-center gap-1">
                🎥 Video
              </span>
            )}
            <span className="flex items-center gap-1">
              📐 {PLATFORM_CONFIGS[activePlatform].recommendedAspectRatio}
            </span>
          </div>
        </div>

        {/* Warnings Summary */}
        {platformContent[activePlatform]?.warnings && platformContent[activePlatform].warnings.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
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
          </div>
        )}
      </div>
    </div>
  );
};
