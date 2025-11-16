/**
 * Live Preview Component
 *
 * Right column showing real-time campaign preview
 * Updates debounced (500ms) as insights are selected
 */

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Eye, RefreshCw } from 'lucide-react';
import type { CategorizedInsight, CampaignPreview } from '@/types/content-mixer.types';

interface LivePreviewProps {
  selectedInsights: CategorizedInsight[];
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok';
  onPlatformChange: (platform: LivePreviewProps['platform']) => void;
  onGenerate?: () => void;
}

const platforms = [
  { id: 'linkedin' as const, name: 'LinkedIn', emoji: '💼' },
  { id: 'facebook' as const, name: 'Facebook', emoji: '👍' },
  { id: 'instagram' as const, name: 'Instagram', emoji: '📸' },
  { id: 'twitter' as const, name: 'Twitter', emoji: '🐦' },
  { id: 'tiktok' as const, name: 'TikTok', emoji: '🎵' }
];

export function LivePreview({
  selectedInsights,
  platform,
  onPlatformChange,
  onGenerate
}: LivePreviewProps) {
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Debounced preview generation
  const generatePreview = useCallback(async () => {
    if (selectedInsights.length === 0) {
      setPreview(null);
      return;
    }

    setIsLoading(true);

    // Simulate preview generation (replace with actual API call)
    setTimeout(() => {
      const mockPreview: CampaignPreview = {
        headline: `${selectedInsights.length} Powerful Insights Combined`,
        hook: selectedInsights[0]?.displayTitle || 'Building your campaign...',
        bodyPreview: selectedInsights.map(i => i.insight.substring(0, 80) + '...').join('\n\n'),
        fullBody: selectedInsights.map(i => i.insight).join('\n\n'),
        cta: 'Learn more',
        hashtags: ['#Marketing', '#Business', '#Growth'],
        engagementScore: Math.round(selectedInsights.reduce((acc, i) => acc + i.confidence, 0) / selectedInsights.length * 100),
        platform,
        isLoading: false
      };

      setPreview(mockPreview);
      setIsLoading(false);
    }, 500); // 500ms delay to simulate API call
  }, [selectedInsights, platform]);

  // Debounce updates (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [updateTrigger, generatePreview]);

  // Trigger update when insights or platform changes
  useEffect(() => {
    setUpdateTrigger(prev => prev + 1);
  }, [selectedInsights, platform]);

  const hasInsights = selectedInsights.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </h2>
          {preview && (
            <button
              onClick={() => setUpdateTrigger(prev => prev + 1)}
              className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Platform Selector */}
        <div className="flex gap-1 overflow-x-auto">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => onPlatformChange(p.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap
                ${platform === p.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-1">{p.emoji}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasInsights ? (
          /* Empty State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No preview yet
              </h3>
              <p className="text-sm text-gray-600">
                Select insights to see a live preview of your campaign content
              </p>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Generating preview...
              </p>
            </div>
          </div>
        ) : preview ? (
          /* Preview */
          <div className="space-y-4">
            {/* Engagement Score */}
            {preview.engagementScore !== undefined && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Estimated Engagement
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {preview.engagementScore}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${preview.engagementScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* Headline */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Headline
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {preview.headline}
              </p>
            </div>

            {/* Hook */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Hook
              </label>
              <p className="text-sm text-gray-700 leading-relaxed">
                {preview.hook}
              </p>
            </div>

            {/* Body Preview */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Body Preview
              </label>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-3">
                {preview.bodyPreview}
                <p className="text-xs text-gray-500 mt-2 italic">
                  ... (full content will be generated)
                </p>
              </div>
            </div>

            {/* CTA */}
            {preview.cta && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Call to Action
                </label>
                <div className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">
                  {preview.cta}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {preview.hashtags && preview.hashtags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-2">
                  {preview.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-sm text-blue-600 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer - Generate Button */}
      {hasInsights && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 rounded-lg font-medium transition-colors
              ${isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Full Campaign'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
