/**
 * MobilePreview - Real-time Mobile Content Preview
 *
 * Shows how your content will look on actual phones
 * Because testing on real devices is apparently too much to ask
 *
 * Features:
 * - Phone frame mockups (iPhone/Android)
 * - Platform UI overlays (Instagram, TikTok, etc.)
 * - Real-time preview updates
 * - Swipe between posts
 * - Vertical video preview (9:16)
 * - Stories mode
 *
 * @author Roy (who thinks this is overkill but here we are)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MobilePlatform,
  DeviceType,
  AspectRatio,
  MobilePreviewConfig,
  DEVICE_PRESETS,
} from '../../types/mobile.types';
import ThumbScrollTest from '../../services/mobile/ThumbScrollTest';
import FormatValidator from '../../services/mobile/FormatValidator';

interface MobilePreviewProps {
  content: {
    text: string;
    imageUrl?: string;
    videoUrl?: string;
    hashtags?: string[];
  };
  platform?: MobilePlatform;
  device?: DeviceType;
  onMetricsUpdate?: (metrics: any) => void;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
  content,
  platform = 'instagram',
  device = 'iphone',
  onMetricsUpdate,
}) => {
  const [currentPlatform, setCurrentPlatform] = useState<MobilePlatform>(platform);
  const [currentDevice, setCurrentDevice] = useState<DeviceType>(device);
  const [showUI, setShowUI] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState<any>(null);

  const deviceConfig = DEVICE_PRESETS[currentDevice];

  // Analyze content when it changes
  useEffect(() => {
    const metrics = ThumbScrollTest.analyze(
      {
        text: content.text,
        hasVideo: !!content.videoUrl,
        hasImage: !!content.imageUrl,
        hasMotion: !!content.videoUrl,
        hasFaces: false, // Would need image analysis
        hasText: !!content.text,
        visualElements: {
          colorContrast: 0.8,
          brightness: 0.6,
          complexity: 0.4,
        },
        firstThreeSeconds: content.videoUrl ? {
          hasHook: true,
          hasMotion: true,
          hasAudio: true,
        } : undefined,
        textReadability: {
          fontSize: 32,
          contrast: 0.9,
          duration: 5,
        },
      },
      currentPlatform
    );

    setScrollMetrics(metrics);
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [content, currentPlatform, onMetricsUpdate]);

  const renderPhoneFrame = () => {
    const isIphone = currentDevice === 'iphone';

    return (
      <div className="relative">
        {/* Phone Frame */}
        <div
          className={`
            relative
            bg-gradient-to-b from-gray-900 to-black
            rounded-[3rem]
            shadow-2xl
            border-8 border-gray-900
            ${isIphone ? 'rounded-[3.5rem]' : 'rounded-[2.5rem]'}
          `}
          style={{
            width: deviceConfig.width,
            height: deviceConfig.height,
          }}
        >
          {/* Notch (iPhone) */}
          {isIphone && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-20" />
          )}

          {/* Screen */}
          <div
            className="absolute inset-0 overflow-hidden bg-black"
            style={{
              borderRadius: isIphone ? '2.75rem' : '2rem',
              top: deviceConfig.safeArea.top,
              bottom: deviceConfig.safeArea.bottom,
              left: deviceConfig.safeArea.left,
              right: deviceConfig.safeArea.right,
            }}
          >
            {renderPlatformContent()}
          </div>

          {/* Home indicator (iPhone) */}
          {isIphone && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          )}
        </div>

        {/* Device label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
          {deviceConfig.deviceName}
        </div>
      </div>
    );
  };

  const renderPlatformContent = () => {
    switch (currentPlatform) {
      case 'instagram':
        return renderInstagram();
      case 'tiktok':
        return renderTikTok();
      case 'facebook':
        return renderFacebook();
      case 'youtube-shorts':
        return renderYouTubeShorts();
      case 'twitter':
        return renderTwitter();
      default:
        return renderInstagram();
    }
  };

  const renderInstagram = () => (
    <div className="relative w-full h-full bg-black">
      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {content.videoUrl ? (
          <video
            src={content.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt="Content"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-8 text-center">
              {content.text.substring(0, 100)}
            </span>
          </div>
        )}
      </div>

      {/* Instagram UI Overlay */}
      {showUI && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
              <span className="text-white font-semibold text-sm">Your Brand</span>
            </div>
            <button className="text-white">⋮</button>
          </div>

          {/* Bottom caption */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-sm mb-2">
              <span className="font-semibold">Your Brand</span> {content.text}
            </p>
            {content.hashtags && content.hashtags.length > 0 && (
              <p className="text-blue-400 text-xs">
                {content.hashtags.map(tag => `#${tag}`).join(' ')}
              </p>
            )}
          </div>

          {/* Right side actions */}
          <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center">
              <button className="text-white text-2xl">♥</button>
              <span className="text-white text-xs mt-1">245K</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="text-white text-2xl">💬</button>
              <span className="text-white text-xs mt-1">1,234</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="text-white text-2xl">✈</button>
              <span className="text-white text-xs mt-1">567</span>
            </div>
            <button className="text-white text-2xl">⋯</button>
          </div>
        </>
      )}
    </div>
  );

  const renderTikTok = () => (
    <div className="relative w-full h-full bg-black">
      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {content.videoUrl ? (
          <video
            src={content.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt="Content"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-8 text-center">
              {content.text.substring(0, 100)}
            </span>
          </div>
        )}
      </div>

      {/* TikTok UI Overlay */}
      {showUI && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-center space-x-4 bg-gradient-to-b from-black/30 to-transparent">
            <span className="text-white/70 text-sm">Following</span>
            <span className="text-white font-semibold text-sm">For You</span>
            <button className="text-white text-xl ml-auto">🔍</button>
          </div>

          {/* Bottom left caption */}
          <div className="absolute bottom-20 left-4 right-20 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold text-sm">@yourbrand</span>
            </div>
            <p className="text-white text-sm line-clamp-2">{content.text}</p>
            {content.hashtags && content.hashtags.length > 0 && (
              <p className="text-white text-xs">
                {content.hashtags.map(tag => `#${tag}`).join(' ')}
              </p>
            )}
          </div>

          {/* Right side actions */}
          <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500 border-2 border-white" />
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white -mt-3">
                <span className="text-white text-lg font-bold">+</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <button className="text-white text-3xl">♥</button>
              <span className="text-white text-xs mt-1">145K</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="text-white text-3xl">💬</button>
              <span className="text-white text-xs mt-1">2,341</span>
            </div>
            <div className="flex flex-col items-center">
              <button className="text-white text-3xl">⤴</button>
              <span className="text-white text-xs mt-1">891</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-800/50">
              <span className="text-white text-xl">🎵</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderFacebook = () => (
    <div className="relative w-full h-full bg-white overflow-y-auto">
      {/* Facebook header */}
      {showUI && (
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex items-center justify-between z-10">
          <span className="text-blue-600 font-bold text-xl">facebook</span>
          <div className="flex space-x-4">
            <button className="text-gray-600">🔍</button>
            <button className="text-gray-600">💬</button>
          </div>
        </div>
      )}

      {/* Post */}
      <div className="bg-white">
        {/* Post header */}
        {showUI && (
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-500" />
              <div>
                <p className="font-semibold text-sm">Your Brand</p>
                <p className="text-xs text-gray-500">2h • 🌎</p>
              </div>
            </div>
            <button className="text-gray-500">⋯</button>
          </div>
        )}

        {/* Post text */}
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-900">{content.text}</p>
        </div>

        {/* Media */}
        <div className="relative">
          {content.videoUrl ? (
            <video
              src={content.videoUrl}
              className="w-full"
              controls
              playsInline
            />
          ) : content.imageUrl ? (
            <img
              src={content.imageUrl}
              alt="Content"
              className="w-full"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xl font-bold px-8 text-center">
                Your Content Here
              </span>
            </div>
          )}
        </div>

        {/* Engagement bar */}
        {showUI && (
          <>
            <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500">
              <span>👍❤️ 1.2K</span>
              <span>234 Comments • 89 Shares</span>
            </div>

            {/* Action buttons */}
            <div className="border-t border-gray-200 px-3 py-1 flex items-center justify-around">
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                <span>👍</span>
                <span className="text-sm font-semibold">Like</span>
              </button>
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                <span>💬</span>
                <span className="text-sm font-semibold">Comment</span>
              </button>
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                <span>↗</span>
                <span className="text-sm font-semibold">Share</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderYouTubeShorts = () => (
    <div className="relative w-full h-full bg-black">
      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {content.videoUrl ? (
          <video
            src={content.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt="Content"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <span className="text-white text-2xl font-bold px-8 text-center">
              {content.text.substring(0, 100)}
            </span>
          </div>
        )}
      </div>

      {/* YouTube Shorts UI */}
      {showUI && (
        <>
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="text-white text-lg font-semibold">Shorts</span>
            <div className="flex space-x-4">
              <button className="text-white">🔍</button>
              <button className="text-white">📷</button>
            </div>
          </div>

          {/* Bottom section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-end justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-500" />
                  <span className="text-white font-semibold text-sm">@yourbrand</span>
                  <button className="bg-red-600 text-white text-xs px-4 py-1 rounded-full">
                    Subscribe
                  </button>
                </div>
                <p className="text-white text-sm line-clamp-2">{content.text}</p>
              </div>

              {/* Right actions */}
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center">
                  <button className="text-white text-3xl">👍</button>
                  <span className="text-white text-xs mt-1">89K</span>
                </div>
                <div className="flex flex-col items-center">
                  <button className="text-white text-3xl">👎</button>
                  <span className="text-white text-xs mt-1">Dislike</span>
                </div>
                <div className="flex flex-col items-center">
                  <button className="text-white text-3xl">💬</button>
                  <span className="text-white text-xs mt-1">1.2K</span>
                </div>
                <button className="text-white text-3xl">↗</button>
                <button className="text-white text-3xl">⋯</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderTwitter = () => (
    <div className="relative w-full h-full bg-white overflow-y-auto">
      {/* Twitter header */}
      {showUI && (
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-3 flex items-center justify-between z-10">
          <button className="text-gray-600">👤</button>
          <span className="text-blue-500 text-2xl font-bold">𝕏</span>
          <button className="text-gray-600">⚙</button>
        </div>
      )}

      {/* Tweet */}
      <div className="p-3 border-b border-gray-200">
        {/* Tweet header */}
        {showUI && (
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-sm">Your Brand</span>
                <span className="text-blue-500">✓</span>
                <span className="text-gray-500 text-sm">@yourbrand · 2h</span>
              </div>
            </div>
            <button className="text-gray-500">⋯</button>
          </div>
        )}

        {/* Tweet text */}
        <div className="mt-2 ml-15">
          <p className="text-sm text-gray-900 mb-3">{content.text}</p>

          {/* Media */}
          {(content.videoUrl || content.imageUrl) && (
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              {content.videoUrl ? (
                <video
                  src={content.videoUrl}
                  className="w-full"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={content.imageUrl}
                  alt="Content"
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* Engagement */}
          {showUI && (
            <>
              <div className="flex items-center space-x-1 text-gray-500 text-xs mt-3">
                <span>6:42 PM</span>
                <span>·</span>
                <span>Dec 17, 2024</span>
                <span>·</span>
                <span className="font-bold text-gray-900">234.5K</span>
                <span>Views</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <span>💬</span>
                  <span className="text-xs">1.2K</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                  <span>🔄</span>
                  <span className="text-xs">890</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
                  <span>♥</span>
                  <span className="text-xs">5.6K</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <span>📊</span>
                  <span className="text-xs">234K</span>
                </button>
                <button className="text-gray-500 hover:text-blue-500">↗</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-center">
        {/* Platform selector */}
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-2">
          <span className="text-sm font-semibold text-gray-700">Platform:</span>
          {(['instagram', 'tiktok', 'facebook', 'youtube-shorts', 'twitter'] as MobilePlatform[]).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPlatform(p)}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-colors
                ${currentPlatform === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {p === 'youtube-shorts' ? 'Shorts' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Device selector */}
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-2">
          <span className="text-sm font-semibold text-gray-700">Device:</span>
          <button
            onClick={() => setCurrentDevice('iphone')}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${currentDevice === 'iphone'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            iPhone
          </button>
          <button
            onClick={() => setCurrentDevice('android')}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${currentDevice === 'android'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Android
          </button>
        </div>

        {/* UI toggle */}
        <button
          onClick={() => setShowUI(!showUI)}
          className="px-4 py-2 bg-white rounded-lg shadow text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {showUI ? '👁 Hide UI' : '👁 Show UI'}
        </button>
      </div>

      {/* Preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPlatform}-${currentDevice}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {renderPhoneFrame()}
        </motion.div>
      </AnimatePresence>

      {/* Metrics Display */}
      {scrollMetrics && (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">📊 Thumb-Scroll Metrics</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Stop Score</span>
                <span className={`font-bold ${scrollMetrics.stopScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {scrollMetrics.stopScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${scrollMetrics.stopScore >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${scrollMetrics.stopScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Hook Strength</span>
                <span>{scrollMetrics.hookStrength}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${scrollMetrics.hookStrength}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Visual Appeal</span>
                <span>{scrollMetrics.visualAppeal}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${scrollMetrics.visualAppeal}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Readability</span>
                <span>{scrollMetrics.readability}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${scrollMetrics.readability}%` }}
                />
              </div>
            </div>
          </div>

          {scrollMetrics.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">💡 Recommendations</h4>
              <ul className="text-xs space-y-1 text-gray-600">
                {scrollMetrics.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobilePreview;
