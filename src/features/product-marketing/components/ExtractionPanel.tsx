/**
 * ExtractionPanel Component
 *
 * UI for running and monitoring product extraction.
 * Shows progress, results, and allows product selection.
 */

import React from 'react';
import type {
  ExtractionProgress,
  ExtractedProduct,
  ExtractionSourcesConfig,
  ExtractionStats,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractionPanelProps {
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  extractedProducts: ExtractedProduct[];
  stats?: ExtractionStats | null;
  error: string | null;
  selectedProducts: Set<string>;
  availableSources: ExtractionSourcesConfig;
  onStartExtraction: (sources?: ExtractionSourcesConfig) => void;
  onStartQuickExtraction: (source: keyof ExtractionSourcesConfig) => void;
  onCancelExtraction: () => void;
  onToggleSelection: (tempId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSaveSelected: () => void;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const SourceButton: React.FC<{
  source: keyof ExtractionSourcesConfig;
  label: string;
  icon: string;
  enabled: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ source, label, icon, enabled, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled || !enabled}
    className={`
      flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
      ${enabled
        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-xs text-gray-600">{label}</span>
  </button>
);

const ProgressBar: React.FC<{ progress: ExtractionProgress }> = ({ progress }) => {
  const percentage = progress.totalSources > 0
    ? (progress.sourcesCompleted / progress.totalSources) * 100
    : 0;

  const statusColors: Record<string, string> = {
    running: 'bg-blue-500',
    merging: 'bg-purple-500',
    saving: 'bg-green-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {progress.status === 'running' && `Extracting from ${progress.currentSource}...`}
          {progress.status === 'merging' && 'Merging and deduplicating...'}
          {progress.status === 'saving' && 'Saving products...'}
          {progress.status === 'completed' && 'Extraction complete!'}
          {progress.status === 'failed' && 'Extraction failed'}
          {progress.status === 'cancelled' && 'Extraction cancelled'}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${statusColors[progress.status] || 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-sm text-gray-500">
        {progress.productsFound} products found
      </div>
    </div>
  );
};

const ExtractedProductCard: React.FC<{
  product: ExtractedProduct;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ product, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    className={`
      p-3 rounded-lg border cursor-pointer transition-all
      ${isSelected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
      }
    `}
  >
    <div className="flex items-start gap-3">
      <div className={`
        w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center
        ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
      `}>
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{product.name}</span>
          {product.isService && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              Service
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-sm text-gray-500 truncate mt-1">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="text-gray-400">from {product.source}</span>
          <span className={`
            ${product.confidence >= 0.7 ? 'text-green-600' : product.confidence >= 0.4 ? 'text-yellow-600' : 'text-red-600'}
          `}>
            {Math.round(product.confidence * 100)}% confident
          </span>
        </div>
      </div>
    </div>
  </div>
);

const StatsDisplay: React.FC<{ stats: ExtractionStats }> = ({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{stats.totalExtracted}</div>
      <div className="text-xs text-gray-500">Total Extracted</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{stats.uniqueProducts}</div>
      <div className="text-xs text-gray-500">Unique Products</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{stats.duplicatesRemoved}</div>
      <div className="text-xs text-gray-500">Duplicates Removed</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">
        {Math.round(stats.averageConfidence * 100)}%
      </div>
      <div className="text-xs text-gray-500">Avg Confidence</div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ExtractionPanel: React.FC<ExtractionPanelProps> = ({
  isExtracting,
  progress,
  extractedProducts,
  stats,
  error,
  selectedProducts,
  availableSources,
  onStartExtraction,
  onStartQuickExtraction,
  onCancelExtraction,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onSaveSelected,
  className = '',
}) => {
  const sourceCount = Object.values(availableSources).filter(Boolean).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Product Extraction</h2>
          <p className="text-sm text-gray-500">
            Extract products and services from various data sources
          </p>
        </div>
        {!isExtracting && extractedProducts.length === 0 && (
          <button
            onClick={() => onStartExtraction()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Full Extraction
          </button>
        )}
      </div>

      {/* Quick extraction buttons */}
      {!isExtracting && extractedProducts.length === 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Or extract from a single source:</p>
          <div className="flex gap-2">
            <SourceButton
              source="uvp"
              label="UVP Data"
              icon="📋"
              enabled={availableSources.uvp ?? false}
              onClick={() => onStartQuickExtraction('uvp')}
              disabled={isExtracting}
            />
            <SourceButton
              source="website"
              label="Website"
              icon="🌐"
              enabled={availableSources.website ?? false}
              onClick={() => onStartQuickExtraction('website')}
              disabled={isExtracting}
            />
            <SourceButton
              source="reviews"
              label="Reviews"
              icon="⭐"
              enabled={availableSources.reviews ?? false}
              onClick={() => onStartQuickExtraction('reviews')}
              disabled={isExtracting}
            />
            <SourceButton
              source="keywords"
              label="Keywords"
              icon="🔍"
              enabled={availableSources.keywords ?? false}
              onClick={() => onStartQuickExtraction('keywords')}
              disabled={isExtracting}
            />
          </div>
        </div>
      )}

      {/* Progress */}
      {isExtracting && progress && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <ProgressBar progress={progress} />
          <div className="mt-4 text-center">
            <button
              onClick={onCancelExtraction}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Extraction Error</span>
          </div>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats */}
      {stats && <StatsDisplay stats={stats} />}

      {/* Results */}
      {extractedProducts.length > 0 && (
        <div>
          {/* Selection controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.size} of {extractedProducts.length} selected
              </span>
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                Select all
              </button>
              {selectedProducts.size > 0 && (
                <button
                  onClick={onClearSelection}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            {selectedProducts.size > 0 && (
              <button
                onClick={onSaveSelected}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Product list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {extractedProducts.map((product) => (
              <ExtractedProductCard
                key={product.tempId}
                product={product}
                isSelected={selectedProducts.has(product.tempId)}
                onToggle={() => onToggleSelection(product.tempId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state after extraction */}
      {!isExtracting && progress?.status === 'completed' && extractedProducts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="text-gray-600">No products were found during extraction.</p>
          <p className="text-sm text-gray-500 mt-1">
            Try adding more data sources or check your brand configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExtractionPanel;
