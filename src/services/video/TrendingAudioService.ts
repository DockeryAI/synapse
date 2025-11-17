/**
 * Trending Audio Service
 *
 * Manages curated licensed audio library for video content
 * Platforms: TikTok, Instagram Reels, YouTube Shorts
 * Features: Trend scores, genre classification, campaign type matching
 */

import type {
  TrendingAudio,
  AudioPlatform,
  AudioGenre,
  AudioSuggestion
} from '@/types/video.types';

// ============================================================================
// CURATED TRENDING AUDIO LIBRARY
// ============================================================================

/**
 * Curated trending audio tracks (licensed for commercial use)
 * Note: In production, integrate with music licensing API (Epidemic Sound, Artlist, etc.)
 */
export const TRENDING_AUDIO_LIBRARY: TrendingAudio[] = [
  {
    id: 'audio_001',
    title: 'Upbeat Corporate',
    artist: 'Production Music',

    licensed: true,
    licenseType: 'royalty_free',

    platforms: ['instagram_reels', 'youtube_shorts', 'tiktok'],
    trendScore: 85,

    genre: 'upbeat',
    duration: 30,
    bpm: 128,

    usageCount: 12500,
    lastTrendingDate: '2025-01-10',

    audioUrl: '/audio/upbeat-corporate.mp3',
    previewUrl: '/audio/previews/upbeat-corporate-preview.mp3'
  },
  {
    id: 'audio_002',
    title: 'Chill Vibes',
    artist: 'Lo-Fi Beats',

    licensed: true,
    licenseType: 'royalty_free',

    platforms: ['instagram_reels', 'tiktok'],
    trendScore: 78,

    genre: 'chill',
    duration: 45,
    bpm: 90,

    usageCount: 8200,
    lastTrendingDate: '2025-01-12',

    audioUrl: '/audio/chill-vibes.mp3',
    previewUrl: '/audio/previews/chill-vibes-preview.mp3'
  },
  {
    id: 'audio_003',
    title: 'Dramatic Build',
    artist: 'Epic Music',

    licensed: true,
    licenseType: 'commercial',

    platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],
    trendScore: 92,

    genre: 'dramatic',
    duration: 20,
    bpm: 140,

    usageCount: 15800,
    lastTrendingDate: '2025-01-15',

    audioUrl: '/audio/dramatic-build.mp3',
    previewUrl: '/audio/previews/dramatic-build-preview.mp3'
  },
  {
    id: 'audio_004',
    title: 'Inspirational Journey',
    artist: 'Motivational Tracks',

    licensed: true,
    licenseType: 'royalty_free',

    platforms: ['instagram_reels', 'youtube_shorts'],
    trendScore: 88,

    genre: 'inspirational',
    duration: 60,
    bpm: 120,

    usageCount: 10200,
    lastTrendingDate: '2025-01-14',

    audioUrl: '/audio/inspirational-journey.mp3',
    previewUrl: '/audio/previews/inspirational-journey-preview.mp3'
  },
  {
    id: 'audio_005',
    title: 'Comedy Gold',
    artist: 'Funny Sounds',

    licensed: true,
    licenseType: 'royalty_free',

    platforms: ['tiktok', 'instagram_reels'],
    trendScore: 95,

    genre: 'funny',
    duration: 15,
    bpm: 150,

    usageCount: 18500,
    lastTrendingDate: '2025-01-16',

    audioUrl: '/audio/comedy-gold.mp3',
    previewUrl: '/audio/previews/comedy-gold-preview.mp3'
  },
  {
    id: 'audio_006',
    title: 'Viral Beat Drop',
    artist: 'Trending Sounds',

    licensed: true,
    licenseType: 'commercial',

    platforms: ['tiktok', 'instagram_reels'],
    trendScore: 98,

    genre: 'trending',
    duration: 12,
    bpm: 160,

    usageCount: 25000,
    lastTrendingDate: '2025-01-17',

    audioUrl: '/audio/viral-beat-drop.mp3',
    previewUrl: '/audio/previews/viral-beat-drop-preview.mp3'
  }
];

// ============================================================================
// TRENDING AUDIO SERVICE
// ============================================================================

/**
 * Trending Audio Service
 */
export class TrendingAudioService {
  /**
   * Get all trending audio tracks
   */
  static getAllAudio(): TrendingAudio[] {
    return TRENDING_AUDIO_LIBRARY;
  }

  /**
   * Get audio by ID
   */
  static getAudioById(id: string): TrendingAudio | undefined {
    return TRENDING_AUDIO_LIBRARY.find(audio => audio.id === id);
  }

  /**
   * Get audio by platform
   */
  static getAudioByPlatform(platform: AudioPlatform): TrendingAudio[] {
    return TRENDING_AUDIO_LIBRARY.filter(audio =>
      audio.platforms.includes(platform)
    );
  }

  /**
   * Get audio by genre
   */
  static getAudioByGenre(genre: AudioGenre): TrendingAudio[] {
    return TRENDING_AUDIO_LIBRARY.filter(audio => audio.genre === genre);
  }

  /**
   * Get top trending audio (sorted by trend score)
   */
  static getTopTrending(limit: number = 10): TrendingAudio[] {
    return [...TRENDING_AUDIO_LIBRARY]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  }

  /**
   * Suggest audio for campaign type (V3)
   */
  static suggestAudioForCampaign(campaignTypeId: string): AudioSuggestion[] {
    const genreMap: Record<string, AudioGenre[]> = {
      authority_builder: ['inspirational', 'upbeat'],
      community_champion: ['chill', 'upbeat'],
      trust_builder: ['inspirational', 'chill'],
      revenue_rush: ['upbeat', 'dramatic'],
      viral_spark: ['trending', 'funny']
    };

    const preferredGenres = genreMap[campaignTypeId] || ['upbeat'];

    const suggestions = TRENDING_AUDIO_LIBRARY
      .filter(audio => preferredGenres.includes(audio.genre))
      .map(audio => ({
        audio,
        reason: this.getAudioRecommendationReason(campaignTypeId, audio.genre),
        matchScore: this.calculateMatchScore(audio, campaignTypeId),
        campaignTypeId
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return suggestions;
  }

  /**
   * Calculate match score for audio and campaign type
   */
  private static calculateMatchScore(
    audio: TrendingAudio,
    campaignTypeId: string
  ): number {
    let score = audio.trendScore;

    // Boost score for viral spark campaigns
    if (campaignTypeId === 'viral_spark' && audio.genre === 'trending') {
      score += 10;
    }

    // Boost score for revenue rush campaigns with dramatic audio
    if (campaignTypeId === 'revenue_rush' && audio.genre === 'dramatic') {
      score += 8;
    }

    // Boost score for trust builder with inspirational audio
    if (campaignTypeId === 'trust_builder' && audio.genre === 'inspirational') {
      score += 7;
    }

    return Math.min(score, 100);
  }

  /**
   * Get audio recommendation reason
   */
  private static getAudioRecommendationReason(
    campaignTypeId: string,
    genre: AudioGenre
  ): string {
    const reasons: Record<string, Record<AudioGenre, string>> = {
      authority_builder: {
        inspirational: 'Inspirational music reinforces your expert positioning',
        upbeat: 'Upbeat tempo keeps viewers engaged with your content',
        chill: 'Professional and approachable tone',
        dramatic: 'Emphasizes importance of your insights',
        funny: 'Makes expertise more relatable',
        trending: 'Reaches more potential clients'
      },
      community_champion: {
        chill: 'Relaxed vibe matches local, friendly atmosphere',
        upbeat: 'Energetic music shows community spirit',
        inspirational: 'Highlights positive local impact',
        dramatic: 'Emphasizes community importance',
        funny: 'Shows authentic, fun local culture',
        trending: 'Connects with local audience trends'
      },
      trust_builder: {
        inspirational: 'Emotional connection builds trust quickly',
        chill: 'Calm, trustworthy tone',
        upbeat: 'Positive results deserve uplifting music',
        dramatic: 'Emphasizes transformation story',
        funny: 'Makes testimonials more engaging',
        trending: 'Social proof through popularity'
      },
      revenue_rush: {
        upbeat: 'Creates excitement for immediate purchase',
        dramatic: 'Build-up to irresistible offer reveal',
        trending: 'Viral reach drives traffic to shop',
        inspirational: 'Emotional appeal increases conversions',
        chill: 'Reduces purchase anxiety',
        funny: 'Memorable = more sales'
      },
      viral_spark: {
        trending: 'Maximum reach - riding current viral wave',
        funny: 'Humor spreads fast on social',
        upbeat: 'High energy = high shares',
        dramatic: 'Surprising moments get shared',
        inspirational: 'Emotional content goes viral',
        chill: 'Stands out in feed of high-energy content'
      }
    };

    return reasons[campaignTypeId]?.[genre] || 'Great fit for your campaign';
  }

  /**
   * Suggest audio for video duration
   */
  static suggestAudioByDuration(
    targetDuration: number,
    tolerance: number = 5
  ): TrendingAudio[] {
    return TRENDING_AUDIO_LIBRARY.filter(audio =>
      Math.abs(audio.duration - targetDuration) <= tolerance
    );
  }

  /**
   * Get audio by BPM range (for matching video pacing)
   */
  static getAudioByBPM(minBPM: number, maxBPM: number): TrendingAudio[] {
    return TRENDING_AUDIO_LIBRARY.filter(audio =>
      audio.bpm >= minBPM && audio.bpm <= maxBPM
    );
  }

  /**
   * Get fast-paced audio (for quick-cut videos)
   */
  static getFastPacedAudio(): TrendingAudio[] {
    return this.getAudioByBPM(130, 180);
  }

  /**
   * Get slow-paced audio (for storytelling)
   */
  static getSlowPacedAudio(): TrendingAudio[] {
    return this.getAudioByBPM(60, 100);
  }

  /**
   * Get medium-paced audio (versatile)
   */
  static getMediumPacedAudio(): TrendingAudio[] {
    return this.getAudioByBPM(100, 130);
  }

  /**
   * Search audio by keywords
   */
  static searchAudio(query: string): TrendingAudio[] {
    const lowerQuery = query.toLowerCase();

    return TRENDING_AUDIO_LIBRARY.filter(audio =>
      audio.title.toLowerCase().includes(lowerQuery) ||
      audio.artist.toLowerCase().includes(lowerQuery) ||
      audio.genre.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get recently trending audio (last 7 days)
   */
  static getRecentlyTrending(): TrendingAudio[] {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return TRENDING_AUDIO_LIBRARY.filter(audio => {
      const lastTrending = new Date(audio.lastTrendingDate);
      return lastTrending >= sevenDaysAgo;
    }).sort((a, b) => b.trendScore - a.trendScore);
  }

  /**
   * Get most used audio (popularity)
   */
  static getMostUsed(limit: number = 10): TrendingAudio[] {
    return [...TRENDING_AUDIO_LIBRARY]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Validate audio for commercial use
   */
  static validateCommercialUse(audio: TrendingAudio): {
    allowed: boolean;
    licenseType: string;
    requiresAttribution: boolean;
    restrictions?: string;
  } {
    const requiresAttribution = audio.licenseType === 'attribution';

    return {
      allowed: audio.licensed,
      licenseType: audio.licenseType,
      requiresAttribution,
      restrictions: requiresAttribution
        ? 'Credit required: Include artist name and track title in caption or description'
        : undefined
    };
  }

  /**
   * Get audio attribution text
   */
  static getAttributionText(audio: TrendingAudio): string | null {
    if (audio.licenseType !== 'attribution') {
      return null;
    }

    return `Music: "${audio.title}" by ${audio.artist}`;
  }

  /**
   * Track audio usage (for analytics)
   */
  static async trackUsage(audioId: string, campaignId: string): Promise<void> {
    // In production, log to analytics service
    console.log(`Audio used: ${audioId} in campaign: ${campaignId}`);

    // Update usage count (in production, this would be a database update)
    const audio = this.getAudioById(audioId);
    if (audio) {
      audio.usageCount++;
    }
  }

  /**
   * Get audio mixing suggestions
   */
  static getAudioMixingSuggestions(videoDuration: number): {
    fadeIn: number;
    fadeOut: number;
    volume: number;
  } {
    return {
      fadeIn: 0.5, // 500ms fade in
      fadeOut: 1.0, // 1 second fade out
      volume: 0.7 // 70% volume (leave room for voiceover)
    };
  }

  /**
   * Recommend audio based on time of day (engagement patterns)
   */
  static getAudioForTimeOfDay(hour: number): AudioGenre {
    if (hour >= 6 && hour < 12) {
      return 'upbeat'; // Morning: energetic
    } else if (hour >= 12 && hour < 17) {
      return 'inspirational'; // Afternoon: productive
    } else if (hour >= 17 && hour < 21) {
      return 'trending'; // Evening: prime social media time
    } else {
      return 'chill'; // Night: relaxed
    }
  }

  /**
   * Get platform-specific audio recommendations
   */
  static getPlatformSpecificAudio(platform: AudioPlatform): {
    recommended: TrendingAudio[];
    tips: string[];
  } {
    const audio = this.getAudioByPlatform(platform);

    const tips: Record<AudioPlatform, string[]> = {
      tiktok: [
        'Use currently trending sounds for maximum reach',
        'Shorter audio (10-20s) performs best',
        'Match beat drops to visual transitions',
        'Check TikTok Creative Center for latest trends'
      ],
      instagram_reels: [
        'Use Instagram\'s trending audio section',
        'Audio from Instagram library gets algorithm boost',
        'Match music to your brand aesthetic',
        '15-30 second clips are optimal'
      ],
      youtube_shorts: [
        'Longer audio clips work (up to 60s)',
        'Original audio can help you stand out',
        'Lower volume to prioritize narration',
        'Copyright-free music is safest'
      ]
    };

    return {
      recommended: audio.slice(0, 10),
      tips: tips[platform]
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate audio sync points for video editing
 */
export function calculateBeatMarkers(bpm: number, duration: number): number[] {
  const beatInterval = 60 / bpm; // Time between beats in seconds
  const markers: number[] = [];

  for (let time = 0; time < duration; time += beatInterval) {
    markers.push(Math.round(time * 100) / 100);
  }

  return markers;
}

/**
 * Suggest cut points based on audio beats
 */
export function suggestCutPoints(audio: TrendingAudio, targetCuts: number): number[] {
  const beatMarkers = calculateBeatMarkers(audio.bpm, audio.duration);
  const interval = Math.floor(beatMarkers.length / targetCuts);

  return Array.from({ length: targetCuts }, (_, i) => beatMarkers[i * interval]);
}

/**
 * Match video pacing to audio BPM
 */
export function matchVideoToAudio(
  videoDuration: number,
  audio: TrendingAudio
): {
  suggestedCuts: number;
  cutInterval: number;
  pacing: 'fast' | 'medium' | 'slow';
} {
  const beatsPerSecond = audio.bpm / 60;
  const totalBeats = videoDuration * beatsPerSecond;

  let pacing: 'fast' | 'medium' | 'slow';
  if (audio.bpm >= 130) {
    pacing = 'fast';
  } else if (audio.bpm >= 100) {
    pacing = 'medium';
  } else {
    pacing = 'slow';
  }

  return {
    suggestedCuts: Math.floor(totalBeats / 4), // Cut every 4 beats
    cutInterval: 4 / beatsPerSecond,
    pacing
  };
}

/**
 * Preview audio in browser
 */
export function playAudioPreview(audio: TrendingAudio): void {
  const audioElement = new Audio(audio.previewUrl);
  audioElement.volume = 0.7;
  audioElement.play();
}

/**
 * Download audio file
 */
export async function downloadAudio(audio: TrendingAudio): Promise<Blob> {
  const response = await fetch(audio.audioUrl);
  return response.blob();
}
