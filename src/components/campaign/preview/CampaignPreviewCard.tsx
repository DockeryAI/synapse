/**
 * CAMPAIGN PREVIEW CARD COMPONENT
 *
 * Displays the campaign content for a specific platform with:
 * - Platform-specific formatting and preview
 * - Section-by-section breakdown (headline, hook, body, CTA, hashtags)
 * - Character count per section
 * - Warning indicators for over-limit sections
 * - Visual separator between sections
 * - Simulated social media post appearance
 *
 * Props:
 * - content: Platform-specific content to display
 * - platform: Which platform this is for
 * - editable: Whether edit buttons should be shown
 * - onEditSection: Callback when user wants to edit a section
 */

import React from 'react';
import {
  type SupportedPlatform,
  type PlatformPreviewContent,
  type ContentSection,
  PLATFORM_CONFIGS
} from '@/types/campaign-preview.types';

// ============================================================================
// CONTENT SECTION DISPLAY
// ============================================================================

interface ContentSectionDisplayProps {
  section: ContentSection;
  value: string | string[];
  characterCount: number;
  limit?: number;
  isOverLimit: boolean;
  editable: boolean;
  onEdit?: () => void;
}

const ContentSectionDisplay: React.FC<ContentSectionDisplayProps> = ({
  section,
  value,
  characterCount,
  limit,
  isOverLimit,
  editable,
  onEdit
}) => {
  const sectionLabels: Record<ContentSection, string> = {
    headline: 'Headline',
    hook: 'Hook',
    body: 'Body',
    cta: 'Call to Action',
    hashtags: 'Hashtags'
  };

  const renderValue = () => {
    if (section === 'hashtags' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-sm font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      );
    }

    return (
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {value as string}
      </p>
    );
  };

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-base text-gray-900 dark:text-white">
            {sectionLabels[section]}
          </h4>
          {editable && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {/* Character Count */}
        <div className="flex items-center gap-2">
          <span className={`
            text-xs font-medium
            ${isOverLimit
              ? 'text-red-600 dark:text-red-400'
              : characterCount > (limit || 0) * 0.9
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            {characterCount}{limit ? ` / ${limit}` : ''}
          </span>
          {isOverLimit && (
            <span className="text-red-500 text-xs">⚠️</span>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className={`
        p-3 rounded-lg border
        ${isOverLimit
          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }
      `}>
        {renderValue()}
      </div>
    </div>
  );
};

// ============================================================================
// SOCIAL MEDIA POST PREVIEW (Simulated)
// ============================================================================

interface SocialMediaPreviewProps {
  platform: SupportedPlatform;
  content: PlatformPreviewContent;
}

const SocialMediaPreview: React.FC<SocialMediaPreviewProps> = ({ platform, content }) => {
  const { sections } = content;

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Post Header (simulated) */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Your Business</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Just now · 🌐</p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* Headline (if exists) */}
        {sections.headline && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {sections.headline}
          </h3>
        )}

        {/* Hook */}
        {sections.hook && (
          <p className="text-base font-medium text-gray-800 dark:text-gray-200">
            {sections.hook}
          </p>
        )}

        {/* Body */}
        {sections.body && (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {sections.body}
          </p>
        )}

        {/* CTA */}
        {sections.cta && (
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {sections.cta}
          </p>
        )}

        {/* Hashtags */}
        {sections.hashtags && sections.hashtags.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {sections.hashtags.map(tag => `#${tag}`).join(' ')}
          </p>
        )}
      </div>

      {/* Media Placeholder (if applicable) */}
      {content.mediaUrls && content.mediaUrls.length > 0 && (
        <div className="bg-gray-200 dark:bg-gray-700 h-64 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">📷 Media Preview</span>
        </div>
      )}

      {/* Post Footer (simulated) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>👍</span>
            <span>Like</span>
          </button>
          <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>💬</span>
            <span>Comment</span>
          </button>
          <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>🔄</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGN PREVIEW CARD (Main Component)
// ============================================================================

interface CampaignPreviewCardProps {
  content: PlatformPreviewContent;
  platform: SupportedPlatform;
  editable: boolean;
  showSocialPreview?: boolean;
  onEditSection?: (section: ContentSection) => void;
}

export const CampaignPreviewCard: React.FC<CampaignPreviewCardProps> = ({
  content,
  platform,
  editable,
  showSocialPreview = true,
  onEditSection
}) => {
  const config = PLATFORM_CONFIGS[platform];
  const { sections, characterCounts, warnings } = content;

  const getSectionLimit = (section: ContentSection): number | undefined => {
    return config.characterLimits[section as keyof typeof config.characterLimits];
  };

  const isSectionOverLimit = (section: ContentSection): boolean => {
    const limit = getSectionLimit(section);
    if (!limit) return false;

    if (section === 'hashtags') {
      return sections.hashtags.length > limit;
    }

    const count = characterCounts[section as keyof typeof characterCounts] || 0;
    return count > limit;
  };

  return (
    <div className="w-full space-y-6">
      {/* Social Media Preview */}
      {showSocialPreview && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            📱 Social Media Preview
          </h3>
          <SocialMediaPreview platform={platform} content={content} />
        </div>
      )}

      {/* Detailed Section Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            📝 Content Breakdown
          </h3>
          {editable && (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Click ✏️ Edit buttons below to modify sections
            </span>
          )}
        </div>
        <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Headline (if exists) */}
          {sections.headline && (
            <ContentSectionDisplay
              section="headline"
              value={sections.headline}
              characterCount={characterCounts.headline || sections.headline.length}
              limit={getSectionLimit('headline')}
              isOverLimit={isSectionOverLimit('headline')}
              editable={editable}
              onEdit={() => onEditSection?.('headline')}
            />
          )}

          {/* Hook */}
          <ContentSectionDisplay
            section="hook"
            value={sections.hook}
            characterCount={characterCounts.hook}
            limit={getSectionLimit('hook')}
            isOverLimit={isSectionOverLimit('hook')}
            editable={editable}
            onEdit={() => onEditSection?.('hook')}
          />

          {/* Visual Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Body */}
          <ContentSectionDisplay
            section="body"
            value={sections.body}
            characterCount={characterCounts.body}
            limit={getSectionLimit('body')}
            isOverLimit={isSectionOverLimit('body')}
            editable={editable}
            onEdit={() => onEditSection?.('body')}
          />

          {/* Visual Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* CTA */}
          <ContentSectionDisplay
            section="cta"
            value={sections.cta}
            characterCount={sections.cta.length}
            limit={getSectionLimit('cta')}
            isOverLimit={isSectionOverLimit('cta')}
            editable={editable}
            onEdit={() => onEditSection?.('cta')}
          />

          {/* Hashtags */}
          {sections.hashtags && sections.hashtags.length > 0 && (
            <>
              {/* Visual Separator */}
              <div className="border-t border-gray-200 dark:border-gray-700" />

              <ContentSectionDisplay
                section="hashtags"
                value={sections.hashtags}
                characterCount={sections.hashtags.length}
                limit={getSectionLimit('hashtags')}
                isOverLimit={isSectionOverLimit('hashtags')}
                editable={editable}
                onEdit={() => onEditSection?.('hashtags')}
              />
            </>
          )}
        </div>
      </div>

      {/* Warning Summary */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-400 mb-2">
            ⚠️ Platform Warnings
          </h4>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400">
                <span className="font-medium">{warning.section}:</span> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
