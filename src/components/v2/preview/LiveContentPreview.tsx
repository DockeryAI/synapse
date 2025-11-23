/**
 * LiveContentPreview - Real-time platform-specific content preview
 *
 * Features:
 * - Platform switcher (preview on different platforms)
 * - Character counter with warnings
 * - Hashtag highlighting
 * - Link card preview
 * - Mobile/desktop preview toggle
 * - Emoji support
 */

import React, { useMemo } from 'react';
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Mail,
  AlertTriangle,
  Hash,
  Link2,
  Smile,
} from 'lucide-react';
import type {
  PlatformType,
  PlatformPreviewData,
  PreviewDevice,
  PreviewWarning,
} from '../../../types/v2/preview.types';
import { PLATFORM_LIMITS } from '../../../types/v2/preview.types';

interface LiveContentPreviewProps {
  content: string;
  platform: PlatformType;
  device?: PreviewDevice;
  showMetrics?: boolean;
  className?: string;
}

export const LiveContentPreview: React.FC<LiveContentPreviewProps> = ({
  content,
  platform,
  device = 'desktop',
  showMetrics = true,
  className = '',
}) => {
  // Parse content for platform data
  const previewData = useMemo<PlatformPreviewData>(() => {
    const limits = PLATFORM_LIMITS[platform];

    // Extract hashtags
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    // Extract mentions
    const mentionRegex = /@\w+/g;
    const mentions = content.match(mentionRegex) || [];

    // Extract links
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const linkMatches = content.match(linkRegex) || [];
    const links = linkMatches.map((url) => ({
      url,
      title: 'Link Preview',
      description: 'Preview description would appear here',
      domain: new URL(url).hostname,
    }));

    // Check for warnings
    const warnings: PreviewWarning[] = [];

    if (content.length > limits.maxCharacters) {
      warnings.push({
        type: 'character_limit',
        message: `Content exceeds ${platform} character limit (${limits.maxCharacters})`,
        severity: 'error',
      });
    }

    if (hashtags.length > limits.maxHashtags) {
      warnings.push({
        type: 'hashtag_limit',
        message: `Too many hashtags (${hashtags.length}/${limits.maxHashtags})`,
        severity: 'warning',
      });
    }

    if (mentions.length > limits.maxMentions) {
      warnings.push({
        type: 'mention_limit',
        message: `Too many mentions (${mentions.length}/${limits.maxMentions})`,
        severity: 'warning',
      });
    }

    return {
      content,
      characterCount: content.length,
      characterLimit: limits.maxCharacters,
      hashtags,
      mentions,
      links,
      warnings,
    };
  }, [content, platform]);

  // Get platform icon
  const getPlatformIcon = () => {
    const iconClass = "w-5 h-5";
    switch (platform) {
      case 'facebook':
        return <Facebook className={iconClass} />;
      case 'instagram':
        return <Instagram className={iconClass} />;
      case 'linkedin':
        return <Linkedin className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'email':
        return <Mail className={iconClass} />;
      default:
        return null;
    }
  };

  // Get platform color
  const getPlatformColor = (): string => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-600';
      case 'instagram':
        return 'bg-pink-600';
      case 'linkedin':
        return 'bg-blue-700';
      case 'twitter':
        return 'bg-sky-500';
      case 'youtube':
        return 'bg-red-600';
      case 'email':
        return 'bg-gray-600';
      default:
        return 'bg-gray-500';
    }
  };

  // Render content with syntax highlighting
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Highlight hashtags
    const hashtagRegex = /#\w+/g;
    let match;

    const tempContent = content;
    const allMatches: Array<{ type: 'hashtag' | 'mention' | 'link'; index: number; text: string }> = [];

    // Find all hashtags
    while ((match = hashtagRegex.exec(tempContent)) !== null) {
      allMatches.push({ type: 'hashtag', index: match.index, text: match[0] });
    }

    // Find all mentions
    const mentionRegex = /@\w+/g;
    while ((match = mentionRegex.exec(tempContent)) !== null) {
      allMatches.push({ type: 'mention', index: match.index, text: match[0] });
    }

    // Find all links
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    while ((match = linkRegex.exec(tempContent)) !== null) {
      allMatches.push({ type: 'link', index: match.index, text: match[0] });
    }

    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);

    // Build highlighted content
    allMatches.forEach((item, idx) => {
      // Add text before this match
      if (item.index > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{tempContent.substring(lastIndex, item.index)}</span>
        );
      }

      // Add highlighted match
      const className =
        item.type === 'hashtag'
          ? 'text-blue-600 font-semibold'
          : item.type === 'mention'
          ? 'text-purple-600 font-semibold'
          : 'text-blue-500 underline';

      parts.push(
        <span key={`match-${idx}`} className={className}>
          {item.text}
        </span>
      );

      lastIndex = item.index + item.text.length;
    });

    // Add remaining text
    if (lastIndex < tempContent.length) {
      parts.push(<span key="text-end">{tempContent.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className={`live-content-preview ${className}`}>
      {/* Platform header */}
      <div className={`flex items-center gap-2 px-4 py-3 text-white ${getPlatformColor()}`}>
        {getPlatformIcon()}
        <span className="font-semibold capitalize">{platform} Preview</span>
        <span className="ml-auto text-xs opacity-75">{device}</span>
      </div>

      {/* Preview container */}
      <div className="bg-white border border-gray-200 rounded-b-lg">
        {/* Mock platform UI */}
        <div className="p-4">
          {/* User info (mock) */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-300" />
            <div>
              <div className="font-semibold text-gray-900">Your Business</div>
              <div className="text-xs text-gray-500">Just now • 🌐</div>
            </div>
          </div>

          {/* Content */}
          <div className="text-gray-900 whitespace-pre-wrap mb-3">{renderContent()}</div>

          {/* Link previews */}
          {previewData.links.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <Link2 className="w-12 h-12 text-gray-400" />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-gray-900">
                  {previewData.links[0].title}
                </div>
                <div className="text-xs text-gray-500">{previewData.links[0].description}</div>
                <div className="text-xs text-gray-400 mt-1">{previewData.links[0].domain}</div>
              </div>
            </div>
          )}

          {/* Mock engagement */}
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
            <span>❤️ 42</span>
            <span>💬 8</span>
            <span>↗️ 5</span>
          </div>
        </div>
      </div>

      {/* Metrics panel */}
      {showMetrics && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Content Metrics</h4>

          {/* Character count */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Character Count</span>
              <span
                className={
                  previewData.characterCount > previewData.characterLimit
                    ? 'text-red-600 font-semibold'
                    : previewData.characterCount > previewData.characterLimit * 0.9
                    ? 'text-orange-600'
                    : 'text-green-600'
                }
              >
                {previewData.characterCount} / {previewData.characterLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  previewData.characterCount > previewData.characterLimit
                    ? 'bg-red-500'
                    : previewData.characterCount > previewData.characterLimit * 0.9
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (previewData.characterCount / previewData.characterLimit) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Hashtags */}
          {previewData.hashtags.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Hash className="w-4 h-4" />
                <span>
                  Hashtags: {previewData.hashtags.length} /{' '}
                  {PLATFORM_LIMITS[platform].maxHashtags}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {previewData.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {previewData.links.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Link2 className="w-4 h-4" />
                <span>Links: {previewData.links.length}</span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {previewData.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {previewData.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 mb-2 ${
                    warning.severity === 'error'
                      ? 'text-red-600'
                      : warning.severity === 'warning'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{warning.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveContentPreview;
