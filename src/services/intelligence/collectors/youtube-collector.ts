/**
 * YouTube Collector for Competitor Intelligence
 *
 * Analyzes competitor's YouTube presence, content strategy, and extracts
 * feature velocity signals from video announcements.
 *
 * Created: 2025-11-29
 */

import { YouTubeAPI } from '../youtube-api';
import type { YouTubeCollectorResult } from './types';
import type { FeatureVelocity } from '@/types/competitor-intelligence.types';

class YouTubeCollector {
  /**
   * Collect YouTube presence data for a competitor
   */
  async collect(
    competitorName: string,
    options?: {
      maxVideos?: number;
    }
  ): Promise<YouTubeCollectorResult> {
    console.log(`[YouTubeCollector] Collecting data for ${competitorName}`);

    try {
      // Search for competitor's videos
      const videos = await YouTubeAPI.searchVideos(
        [competitorName, `${competitorName} demo`, `${competitorName} tutorial`],
        options?.maxVideos || 20
      );

      // Analyze channel presence
      const channelPresence = this.analyzeChannelPresence(videos, competitorName);

      // Get recent videos
      const recentVideos = videos
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 10)
        .map(v => ({
          title: v.title,
          views: v.viewCount,
          likes: v.likeCount,
          published_at: v.publishedAt
        }));

      // Analyze content strategy
      const contentStrategy = this.analyzeContentStrategy(videos);

      // Extract feature velocity signals from video titles/descriptions
      const featureVelocitySignals = this.extractFeatureVelocitySignals(videos);

      return {
        success: true,
        source: 'youtube',
        timestamp: new Date().toISOString(),
        data: {
          channel_presence: channelPresence,
          recent_videos: recentVideos,
          content_strategy: contentStrategy,
          feature_velocity_signals: featureVelocitySignals
        }
      };
    } catch (error) {
      console.error('[YouTubeCollector] Error:', error);
      return {
        success: false,
        source: 'youtube',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          channel_presence: { has_channel: false },
          recent_videos: [],
          content_strategy: {
            posting_frequency: 'unknown',
            avg_views: 0,
            top_topics: []
          },
          feature_velocity_signals: {}
        }
      };
    }
  }

  /**
   * Analyze channel presence from search results
   */
  private analyzeChannelPresence(
    videos: Array<{ channelTitle: string; viewCount: number; likeCount: number }>,
    competitorName: string
  ): YouTubeCollectorResult['data']['channel_presence'] {
    // Find videos from the competitor's channel
    const competitorVideos = videos.filter(v =>
      v.channelTitle.toLowerCase().includes(competitorName.toLowerCase())
    );

    if (competitorVideos.length === 0) {
      return { has_channel: false };
    }

    const totalViews = competitorVideos.reduce((sum, v) => sum + v.viewCount, 0);

    return {
      has_channel: true,
      video_count: competitorVideos.length,
      total_views: totalViews
    };
  }

  /**
   * Analyze content strategy from videos
   */
  private analyzeContentStrategy(
    videos: Array<{ title: string; publishedAt: string; viewCount: number }>
  ): YouTubeCollectorResult['data']['content_strategy'] {
    if (videos.length === 0) {
      return {
        posting_frequency: 'unknown',
        avg_views: 0,
        top_topics: []
      };
    }

    // Calculate posting frequency
    const sortedDates = videos
      .map(v => new Date(v.publishedAt).getTime())
      .sort((a, b) => b - a);

    let frequency = 'unknown';
    if (sortedDates.length >= 2) {
      const avgGapDays = (sortedDates[0] - sortedDates[sortedDates.length - 1]) /
        (sortedDates.length - 1) / (1000 * 60 * 60 * 24);

      if (avgGapDays <= 7) frequency = 'weekly';
      else if (avgGapDays <= 14) frequency = 'bi-weekly';
      else if (avgGapDays <= 30) frequency = 'monthly';
      else frequency = 'occasional';
    }

    // Calculate average views
    const avgViews = Math.round(
      videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length
    );

    // Extract top topics from titles
    const topicWords: Record<string, number> = {};
    const stopWords = new Set(['the', 'and', 'for', 'with', 'how', 'what', 'why', 'this', 'that', 'from', 'your', 'our']);

    for (const video of videos) {
      const words = video.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        topicWords[word] = (topicWords[word] || 0) + 1;
      }
    }

    const topTopics = Object.entries(topicWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      posting_frequency: frequency,
      avg_views: avgViews,
      top_topics: topTopics
    };
  }

  /**
   * Extract feature velocity signals from video content
   */
  private extractFeatureVelocitySignals(
    videos: Array<{ title: string; description: string; publishedAt: string }>
  ): Partial<FeatureVelocity> {
    const recentReleases: string[] = [];
    const innovationGaps: string[] = [];

    // Patterns that indicate feature releases
    const releasePatterns = [
      /new feature/i,
      /introducing/i,
      /announcing/i,
      /now available/i,
      /launch/i,
      /release/i,
      /update/i,
      /version \d/i,
      /v\d+\.\d+/i
    ];

    // Patterns that indicate limitations or roadmap
    const limitationPatterns = [
      /coming soon/i,
      /roadmap/i,
      /future/i,
      /planned/i,
      /request/i,
      /feedback/i
    ];

    // Get videos from the last 6 months
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);

    for (const video of videos) {
      const videoDate = new Date(video.publishedAt).getTime();
      const text = `${video.title} ${video.description}`.toLowerCase();

      // Check for release patterns
      if (releasePatterns.some(p => p.test(text)) && videoDate > sixMonthsAgo) {
        recentReleases.push(video.title);
      }

      // Check for limitation patterns
      if (limitationPatterns.some(p => p.test(text))) {
        // Extract what's "coming soon" or requested
        const match = text.match(/(?:coming soon|planned|roadmap)[:\s]+([^.!?]+)/i);
        if (match) {
          innovationGaps.push(match[1].trim());
        }
      }
    }

    // Determine cadence based on release count
    let cadence: FeatureVelocity['cadence'] = 'quarterly';
    if (recentReleases.length >= 12) cadence = 'weekly';
    else if (recentReleases.length >= 6) cadence = 'monthly';
    else if (recentReleases.length >= 2) cadence = 'quarterly';
    else cadence = 'slowing';

    // Determine momentum
    const recentCount = videos.filter(v => {
      const date = new Date(v.publishedAt).getTime();
      return date > Date.now() - (90 * 24 * 60 * 60 * 1000);
    }).length;

    const olderCount = videos.filter(v => {
      const date = new Date(v.publishedAt).getTime();
      return date > sixMonthsAgo && date <= Date.now() - (90 * 24 * 60 * 60 * 1000);
    }).length;

    let momentum: FeatureVelocity['momentum'] = 'steady';
    if (recentCount > olderCount * 1.5) momentum = 'accelerating';
    else if (recentCount < olderCount * 0.5) momentum = 'decelerating';

    return {
      cadence,
      momentum,
      recent_releases: recentReleases.slice(0, 10),
      innovation_gaps: innovationGaps.slice(0, 5)
    };
  }
}

export const youtubeCollector = new YouTubeCollector();
