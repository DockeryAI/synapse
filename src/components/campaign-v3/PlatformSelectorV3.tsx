/**
 * Platform Selector V3
 *
 * Enforces 2-3 platform maximum with smart recommendations.
 * No more selecting every social network under the sun.
 */

import React, { useState, useEffect } from 'react';
import { PlatformSelector } from '../../services/campaign-v3/PlatformSelector';
import type { PlatformV3, BusinessType, CampaignTypeV3 } from '../../types/campaign-v3.types';

interface PlatformSelectorV3Props {
  businessType: BusinessType;
  campaignType: CampaignTypeV3;
  selectedPlatforms: PlatformV3[];
  onSelectPlatforms: (platforms: PlatformV3[]) => void;
}

export const PlatformSelectorV3: React.FC<PlatformSelectorV3Props> = ({
  businessType,
  campaignType,
  selectedPlatforms,
  onSelectPlatforms,
}) => {
  const [validation, setValidation] = useState<ReturnType<typeof PlatformSelector.validateSelection>>();
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Get recommendations
  const recommendation = PlatformSelector.getRecommendations(businessType, campaignType);
  const allPlatforms = PlatformSelector.getAllPlatforms();

  // Validate on change
  useEffect(() => {
    const result = PlatformSelector.validateSelection(selectedPlatforms);
    setValidation(result);
  }, [selectedPlatforms]);

  const handleTogglePlatform = (platformId: PlatformV3) => {
    if (selectedPlatforms.includes(platformId)) {
      // Remove platform
      onSelectPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      // Add platform (if under max)
      if (selectedPlatforms.length < PlatformSelector.MAX_PLATFORMS) {
        onSelectPlatforms([...selectedPlatforms, platformId]);
      }
    }
  };

  const handleSelectRecommended = () => {
    onSelectPlatforms(recommendation.recommended.slice(0, 3));
    setShowRecommendations(false);
  };

  const isPlatformSelected = (platformId: PlatformV3): boolean => {
    return selectedPlatforms.includes(platformId);
  };

  const isPlatformRecommended = (platformId: PlatformV3): boolean => {
    return recommendation.recommended.includes(platformId);
  };

  const isPlatformDisabled = (platformId: PlatformV3): boolean => {
    return (
      !isPlatformSelected(platformId) &&
      selectedPlatforms.length >= PlatformSelector.MAX_PLATFORMS
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Select Platforms
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose 2-3 platforms for maximum impact. Quality over quantity!
        </p>
      </div>

      {/* Recommendation Banner */}
      {showRecommendations && recommendation.recommended.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                💡 Recommended for you
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                {recommendation.rationale}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendation.recommended.slice(0, 3).map((platformId) => {
                  const platform = PlatformSelector.getPlatform(platformId);
                  return (
                    <span
                      key={platformId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                    >
                      {platform?.icon} {platform?.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleSelectRecommended}
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Use These
            </button>
          </div>
        </div>
      )}

      {/* Platform Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allPlatforms.map((platform) => {
          const isSelected = isPlatformSelected(platform.id);
          const isRecommended = isPlatformRecommended(platform.id);
          const isDisabled = isPlatformDisabled(platform.id);

          return (
            <button
              key={platform.id}
              onClick={() => handleTogglePlatform(platform.id)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30'
                  : isDisabled
                  ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {/* Recommended Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Top Pick
                  </span>
                </div>
              )}

              {/* Icon and Name */}
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{platform.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {platform.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Requirements */}
              {platform.requirements && platform.requirements.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Requires: {platform.requirements.join(', ')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Counter */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected:
          </span>
          <span
            className={`text-sm font-bold ${
              validation?.valid
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {selectedPlatforms.length} / {PlatformSelector.MAX_PLATFORMS}
          </span>
        </div>
        {selectedPlatforms.length === PlatformSelector.MAX_PLATFORMS && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Maximum reached. Deselect to change.
          </span>
        )}
      </div>

      {/* Validation Errors */}
      {validation && !validation.valid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
            ⚠️ Platform Selection Issues
          </h3>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-400">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validation && validation.warnings && validation.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">
            💭 Things to Consider
          </h3>
          <ul className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-400">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Platform Requirements Summary */}
      {selectedPlatforms.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📋 You'll need:
          </h3>
          <ul className="space-y-1">
            {PlatformSelector.getPlatformRequirements(selectedPlatforms).map(
              (requirement, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {requirement}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlatformSelectorV3;
