/**
 * MobilePreview - Mobile device frame preview component
 *
 * Features:
 * - iPhone/Android frame rendering
 * - Accurate mobile dimensions
 * - Touch interaction simulation
 * - Platform-specific UI elements
 * - Device selector (iPhone 14, Galaxy S23, etc.)
 * - Orientation toggle (portrait/landscape)
 * - Safe area visualization
 */

import React, { useState } from 'react';
import { Smartphone, Rotate3D, Monitor } from 'lucide-react';
import type {
  MobileDevice,
  PreviewOrientation,
  PlatformType,
} from '../../../types/v2/preview.types';
import { MOBILE_DEVICE_SPECS } from '../../../types/v2/preview.types';
import LiveContentPreview from './LiveContentPreview';

interface MobilePreviewProps {
  content: string;
  platform: PlatformType;
  initialDevice?: MobileDevice;
  className?: string;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
  content,
  platform,
  initialDevice = 'iphone14',
  className = '',
}) => {
  const [selectedDevice, setSelectedDevice] = useState<MobileDevice>(initialDevice);
  const [orientation, setOrientation] = useState<PreviewOrientation>('portrait');
  const [showSafeArea, setShowSafeArea] = useState(false);

  const deviceSpec = MOBILE_DEVICE_SPECS[selectedDevice];

  // Calculate device dimensions based on orientation
  const deviceWidth = orientation === 'portrait' ? deviceSpec.screenWidth : deviceSpec.screenHeight;
  const deviceHeight = orientation === 'portrait' ? deviceSpec.screenHeight : deviceSpec.screenWidth;

  // Scale factor to fit preview
  const scaleFactor = 0.8;
  const displayWidth = deviceWidth * scaleFactor;
  const displayHeight = deviceHeight * scaleFactor;

  // Toggle orientation
  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  return (
    <div className={`mobile-preview ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Mobile Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Device selector */}
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value as MobileDevice)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(MOBILE_DEVICE_SPECS).map(([key, spec]) => (
              <option key={key} value={key}>
                {spec.name}
              </option>
            ))}
          </select>

          {/* Orientation toggle */}
          <button
            onClick={toggleOrientation}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Toggle orientation"
          >
            <Rotate3D className="w-4 h-4 text-gray-600" />
          </button>

          {/* Safe area toggle */}
          <button
            onClick={() => setShowSafeArea(!showSafeArea)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              showSafeArea
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Safe Area
          </button>
        </div>
      </div>

      {/* Device info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Device:</span>{' '}
            <span className="font-semibold text-gray-900">{deviceSpec.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Screen:</span>{' '}
            <span className="font-semibold text-gray-900">
              {deviceWidth} × {deviceHeight}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Orientation:</span>{' '}
            <span className="font-semibold text-gray-900 capitalize">{orientation}</span>
          </div>
        </div>
      </div>

      {/* Device frame container */}
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
        <div
          className="relative bg-black rounded-[2.5rem] shadow-2xl transition-all duration-300"
          style={{
            width: `${displayWidth + 20}px`,
            height: `${displayHeight + 20}px`,
            padding: '10px',
          }}
        >
          {/* Notch (iPhone style) */}
          {(selectedDevice === 'iphone14' || selectedDevice === 'iphone14pro') &&
            orientation === 'portrait' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20" />
            )}

          {/* Screen */}
          <div
            className="relative bg-white overflow-hidden rounded-[2rem]"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          >
            {/* Safe area overlay */}
            {showSafeArea && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Top safe area */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-20 border-b-2 border-red-500 border-dashed"
                  style={{
                    height: `${
                      orientation === 'portrait'
                        ? deviceSpec.safeAreaInsets.top * scaleFactor
                        : 0
                    }px`,
                  }}
                />

                {/* Bottom safe area */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-20 border-t-2 border-red-500 border-dashed"
                  style={{
                    height: `${
                      orientation === 'portrait'
                        ? deviceSpec.safeAreaInsets.bottom * scaleFactor
                        : 0
                    }px`,
                  }}
                />

                {/* Left safe area */}
                <div
                  className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-20 border-r-2 border-red-500 border-dashed"
                  style={{
                    width: `${deviceSpec.safeAreaInsets.left * scaleFactor}px`,
                  }}
                />

                {/* Right safe area */}
                <div
                  className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-20 border-l-2 border-red-500 border-dashed"
                  style={{
                    width: `${deviceSpec.safeAreaInsets.right * scaleFactor}px`,
                  }}
                />
              </div>
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
              <div className="text-xs font-semibold">9:41</div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-gray-400 rounded-sm">
                  <div className="w-2 h-full bg-gray-700 rounded-l-sm" />
                </div>
                <span className="text-xs">100%</span>
              </div>
            </div>

            {/* Content area */}
            <div
              className="overflow-y-auto"
              style={{
                height: `${displayHeight - 40}px`,
              }}
            >
              <LiveContentPreview
                content={content}
                platform={platform}
                device="mobile"
                showMetrics={false}
              />
            </div>
          </div>

          {/* Home indicator (iPhone style) */}
          {(selectedDevice === 'iphone14' || selectedDevice === 'iphone14pro') &&
            orientation === 'portrait' && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
            )}
        </div>
      </div>

      {/* Device specs */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="font-semibold">Pixel Ratio:</span> {deviceSpec.pixelRatio}x
          </div>
          <div>
            <span className="font-semibold">Safe Top:</span> {deviceSpec.safeAreaInsets.top}px
          </div>
          <div>
            <span className="font-semibold">Safe Bottom:</span> {deviceSpec.safeAreaInsets.bottom}px
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
