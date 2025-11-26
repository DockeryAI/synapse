/**
 * DeepContext Builder - TRUE Progressive Loading WITH REALTIME UPDATES
 *
 * Netflix-style streaming architecture:
 * - All APIs fire simultaneously
 * - Each API updates UI independently when complete
 * - First data visible in <5 seconds
 * - No API blocks another
 */

import { DeepContext } from '@/types/synapse/deepContext.types';
import {
  streamingDeepContextBuilder,
  StreamingProgress,
  StreamingConfig
} from './streaming-deepcontext-builder.service';

export type ProgressCallback = (
  context: DeepContext,
  metadata: {
    dataSourcesUsed: string[];
    dataPointsCollected: number;
    buildTimeMs: number;
    completedApis: string[];
    pendingApis: string[];
  }
) => void;

export class TrueProgressiveDeepContextBuilder {
  /**
   * Build DeepContext with TRUE progressive loading
   * Each API updates UI immediately when complete
   */
  async buildTrueProgressive(
    config: {
      brandId: string;
      businessType?: 'local' | 'b2b-national' | 'b2b-global';
      cacheResults?: boolean;
      forceFresh?: boolean;
      includeOutScraper?: boolean;
      includeSerper?: boolean;
      includeWebsiteAnalysis?: boolean;
      includeYouTube?: boolean;
      includeSEMrush?: boolean;
      includeNews?: boolean;
      includeWeather?: boolean;
      includeLinkedIn?: boolean;
      includePerplexity?: boolean;
      includeApify?: boolean;
    },
    onProgress?: ProgressCallback
  ): Promise<{ context: DeepContext; metadata: any }> {
    console.log('[TrueProgressive] Starting Netflix-style streaming build...');

    const streamingConfig: StreamingConfig = {
      brandId: config.brandId,
      businessType: config.businessType,
      cacheResults: config.cacheResults,
      forceFresh: config.forceFresh
    };

    // Streaming callback adapter
    const streamingCallback = (progress: StreamingProgress) => {
      if (onProgress) {
        console.log(`[TrueProgressive] Progress: ${progress.completedApis.length} APIs done, ${progress.dataPointsCollected} data points`);

        onProgress(progress.context, {
          dataSourcesUsed: progress.completedApis,
          dataPointsCollected: progress.dataPointsCollected,
          buildTimeMs: progress.buildTimeMs,
          completedApis: progress.completedApis,
          pendingApis: progress.pendingApis
        });
      }
    };

    // Use the new streaming builder
    const finalContext = await streamingDeepContextBuilder.buildStreaming(
      streamingConfig,
      streamingCallback
    );

    return {
      context: finalContext,
      metadata: {
        buildTimeMs: finalContext.metadata.processingTimeMs,
        dataSourcesUsed: finalContext.metadata.dataSourcesUsed,
        dataPointsCollected: 0, // Will be filled by streaming
        errors: []
      }
    };
  }
}

// Export singleton instance
export const trueProgressiveBuilder = new TrueProgressiveDeepContextBuilder();
