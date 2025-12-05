/**
 * MIGRATION BRIDGE: Legacy → Streaming Service
 *
 * This file redirects legacy imports to use the new StreamingDeepContextBuilder
 * which includes business purpose detection fixes for VoC query targeting.
 *
 * All UI components using the old service will now automatically get
 * business purpose-aware queries instead of generic industry terms.
 */

import { streamingDeepContextBuilder } from './streaming-deepcontext-builder.service';

// Export streaming service under legacy name for backwards compatibility
export const deepContextBuilder = streamingDeepContextBuilder;

// Legacy method aliases - FORCE FRESH DATA to get business purpose-aware queries
// Returns wrapper object { context, metadata } to match legacy API
export const buildDeepContext = async (config: any) => {
  const startTime = Date.now();
  const context = await streamingDeepContextBuilder.buildStreaming({ ...config, forceFresh: true }, () => {});
  return {
    context,
    metadata: {
      dataPointsCollected: context?.rawDataPoints?.length || 0,
      dataSourcesUsed: context?.metadata?.dataSourcesUsed || [],
      processingTimeMs: Date.now() - startTime
    }
  };
};

export const buildStreamingContext = (config: any, onProgress: any) =>
  streamingDeepContextBuilder.buildStreaming({ ...config, forceFresh: true }, onProgress);

// Export types for compatibility
export type { DeepContext } from '@/types/synapse/deepContext.types';
export type { StreamingConfig, StreamingProgress } from './streaming-deepcontext-builder.service';