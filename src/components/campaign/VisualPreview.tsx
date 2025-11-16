/**
 * VISUAL PREVIEW COMPONENT
 *
 * Displays generated campaign visuals with platform-specific aspect ratios
 * Supports regeneration, download, and loading states
 *
 * Philosophy: "Show, don't tell - let visuals speak for themselves"
 */

import React, { useState } from 'react';
import { Download, RefreshCw, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import type { GeneratedVisual } from '../../types/campaign-visual.types';
import { PLATFORM_SPECS } from '../../config/bannerbear.config';

// ============================================================================
// TYPES
// ============================================================================

export interface VisualPreviewProps {
  /** Generated visual to display */
  visual: GeneratedVisual | null;

  /** Loading state */
  isLoading?: boolean;

  /** Regenerate callback */
  onRegenerate?: () => void;

  /** Download callback */
  onDownload?: () => void;

  /** Show action buttons */
  showActions?: boolean;

  /** Custom className */
  className?: string;
}

// ============================================================================
// VISUAL PREVIEW COMPONENT
// ============================================================================

export function VisualPreview({
  visual,
  isLoading = false,
  onRegenerate,
  onDownload,
  showActions = true,
  className = '',
}: VisualPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get aspect ratio for styling
  const aspectRatio = visual?.metadata.aspectRatio || '16:9';
  const [width, height] = aspectRatio.split(':').map(Number);
  const aspectRatioPercent = (height / width) * 100;

  // Handle download
  const handleDownload = async () => {
    if (!visual?.imageUrl) return;

    try {
      const response = await fetch(visual.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${visual.campaignType}_${visual.platform}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className={`visual-preview ${className}`}>
      {/* Preview Container */}
      <div className="preview-container bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Aspect Ratio Wrapper */}
        <div
          className="relative w-full"
          style={{ paddingBottom: `${aspectRatioPercent}%` }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600 font-medium">Generating visual...</p>
              <p className="text-xs text-gray-400 mt-1">This may take 10-30 seconds</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && visual?.status === 'failed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-sm text-red-700 font-medium">Generation failed</p>
              <p className="text-xs text-red-500 mt-1 px-4 text-center">
                {visual.error || 'Unable to generate visual'}
              </p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !visual && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No visual generated</p>
              <p className="text-xs text-gray-400 mt-1">Generate a visual to see preview</p>
            </div>
          )}

          {/* Visual Image */}
          {!isLoading && visual?.status === 'completed' && visual.imageUrl && (
            <div className="absolute inset-0">
              {/* Loading placeholder while image loads */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}

              {/* Image */}
              <img
                src={visual.imageUrl}
                alt={`${visual.campaignType} visual for ${visual.platform}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Image Load Error */}
              {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Failed to load image</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      {visual && (
        <div className="mt-3 space-y-2">
          {/* Platform & Format */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 capitalize">{visual.platform}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 capitalize">{visual.format}</span>
            </div>
            {visual.metadata.dimensions.width > 0 && (
              <span className="text-xs text-gray-400">
                {visual.metadata.dimensions.width} × {visual.metadata.dimensions.height}
              </span>
            )}
          </div>

          {/* Generation Info */}
          {visual.status === 'completed' && (
            <div className="text-xs text-gray-400">
              Generated in {(visual.metadata.generationTime / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && visual?.status === 'completed' && visual.imageUrl && (
        <div className="flex gap-2 mt-4">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Regenerate</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MULTI-PLATFORM PREVIEW
// ============================================================================

export interface MultiPlatformPreviewProps {
  /** Array of generated visuals */
  visuals: GeneratedVisual[];

  /** Loading state */
  isLoading?: boolean;

  /** Regenerate callback with platform */
  onRegenerate?: (platform: string) => void;

  /** Download callback with platform */
  onDownload?: (platform: string) => void;

  /** Custom className */
  className?: string;
}

/**
 * Display previews for multiple platforms in a grid
 */
export function MultiPlatformPreview({
  visuals,
  isLoading = false,
  onRegenerate,
  onDownload,
  className = '',
}: MultiPlatformPreviewProps) {
  return (
    <div className={`multi-platform-preview ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Platform Visuals</h3>
        <p className="text-sm text-gray-500 mt-1">
          {visuals.length} platform{visuals.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visuals.map((visual) => (
          <div key={`${visual.platform}-${visual.format}`}>
            <VisualPreview
              visual={visual}
              isLoading={isLoading}
              onRegenerate={onRegenerate ? () => onRegenerate(visual.platform) : undefined}
              onDownload={onDownload ? () => onDownload(visual.platform) : undefined}
              showActions={true}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {visuals.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 font-medium">No visuals generated yet</p>
          <p className="text-xs text-gray-400 mt-2">
            Generate visuals to see previews for all platforms
          </p>
        </div>
      )}
    </div>
  );
}
