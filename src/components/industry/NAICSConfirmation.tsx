/**
 * NAICS CONFIRMATION COMPONENT
 *
 * Displays detected NAICS code and allows user to confirm or select alternative
 * Integrates with NAICSDetector and NAICSMapping services
 */

import React, { useState } from 'react';
import { type NAICSCandidate } from '@/types/industry-profile.types';
import { Building2, CheckCircle, ChevronDown, Search, AlertCircle } from 'lucide-react';

interface NAICSConfirmationProps {
  detected: NAICSCandidate;
  alternatives?: NAICSCandidate[];
  onConfirm: (naicsCode: string, displayName: string) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function NAICSConfirmation({
  detected,
  alternatives = [],
  onConfirm,
  onReject,
  isLoading = false
}: NAICSConfirmationProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selected, setSelected] = useState<NAICSCandidate>(detected);

  const confidenceColor = getConfidenceColor(detected.confidence);
  const confidenceLabel = getConfidenceLabel(detected.confidence);

  const handleConfirm = () => {
    onConfirm(selected.naics_code, selected.display_name);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Confirm Your Industry
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We detected your industry classification. Please confirm or select a different option.
        </p>
      </div>

      {/* Detected Industry Card */}
      <div className="mb-6">
        <div
          className={`p-5 rounded-lg border-2 transition-all ${
            selected.naics_code === detected.naics_code
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
          }`}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {detected.display_name}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  NAICS {detected.naics_code}
                </span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {detected.category}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceColor}`}>
                  {confidenceLabel} ({Math.round(detected.confidence * 100)}%)
                </span>
              </div>

              {detected.reasoning && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {detected.reasoning}
                </p>
              )}

              {detected.keywords && detected.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detected.keywords.slice(0, 5).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {keyword}
                    </span>
                  ))}
                  {detected.keywords.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{detected.keywords.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Selection Indicator */}
            {selected.naics_code === detected.naics_code && (
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alternatives Toggle */}
      {alternatives.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900/70 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>View {alternatives.length} Alternative Option{alternatives.length > 1 ? 's' : ''}</span>
            </span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                showAlternatives ? 'transform rotate-180' : ''
              }`}
            />
          </button>

          {/* Alternatives List */}
          {showAlternatives && (
            <div className="mt-3 space-y-2">
              {alternatives.map((alternative) => (
                <button
                  key={alternative.naics_code}
                  onClick={() => setSelected(alternative)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selected.naics_code === alternative.naics_code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {alternative.display_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {alternative.naics_code}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {alternative.category} • {Math.round(alternative.confidence * 100)}% match
                      </div>
                    </div>
                    {selected.naics_code === alternative.naics_code && (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low Confidence Warning */}
      {detected.confidence < 0.6 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Lower Confidence Detection
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                The industry detection has moderate confidence. Please review the alternatives or provide a more specific industry description.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between space-x-3">
        <button
          onClick={onReject}
          disabled={isLoading}
          className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Try Different Industry
        </button>

        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Confirm & Generate Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
        This will generate a comprehensive industry profile with 40+ data points tailored to your business.
      </p>
    </div>
  );
}

// Helper functions
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  } else if (confidence >= 0.6) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  } else {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  }
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Moderate';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}
