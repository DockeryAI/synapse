/**
 * Auto-Caption Service
 *
 * Generates captions using OpenAI Whisper API and burns them into videos
 * Benefits: Accessibility + algorithm boost (85% watch without sound)
 */

import type {
  CaptionConfig,
  CaptionSegment,
  CaptionResult,
  CaptionFormat
} from '@/types/video.types';

// ============================================================================
// DEFAULT CAPTION CONFIGURATIONS
// ============================================================================

/**
 * Default caption styling for social media
 */
export const DEFAULT_CAPTION_CONFIG: CaptionConfig = {
  format: 'burned',
  language: 'en',

  // Styling (optimized for mobile)
  font: 'Inter Bold',
  fontSize: 48, // Large enough for mobile
  fontColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  position: 'bottom',

  // Timing
  maxCharsPerLine: 40,
  maxLinesPerCaption: 2,
  wordTiming: true // Word-by-word highlighting
};

/**
 * Platform-specific caption configurations
 */
export const PLATFORM_CAPTION_CONFIGS: Record<string, Partial<CaptionConfig>> = {
  tiktok: {
    font: 'Montserrat ExtraBold',
    fontSize: 52,
    fontColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    position: 'middle',
    maxCharsPerLine: 30,
    wordTiming: true
  },
  instagram_reels: {
    font: 'Inter Bold',
    fontSize: 48,
    fontColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    maxCharsPerLine: 35,
    wordTiming: true
  },
  youtube_shorts: {
    font: 'Roboto Bold',
    fontSize: 46,
    fontColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    maxCharsPerLine: 40,
    wordTiming: false // YouTube auto-generates word timing
  },
  facebook_reels: {
    font: 'Inter Bold',
    fontSize: 48,
    fontColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    maxCharsPerLine: 38,
    wordTiming: true
  }
};

// ============================================================================
// AUTO-CAPTION SERVICE
// ============================================================================

/**
 * Auto-Caption Service
 */
export class AutoCaptionService {
  private static readonly WHISPER_API_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

  /**
   * Generate captions from video using Whisper API
   */
  static async generateCaptions(
    videoFile: File | Blob,
    config: Partial<CaptionConfig> = {}
  ): Promise<CaptionResult> {
    const finalConfig = { ...DEFAULT_CAPTION_CONFIG, ...config };

    try {
      // Extract audio from video (if needed)
      const audioBlob = await this.extractAudio(videoFile);

      // Call Whisper API
      const transcription = await this.callWhisperAPI(audioBlob, finalConfig.language);

      // Process transcription into segments
      const segments = this.processTranscription(transcription, finalConfig);

      // Generate SRT/VTT content
      const srtContent = this.generateSRT(segments);
      const vttContent = this.generateVTT(segments);

      // Calculate average confidence
      const averageConfidence = segments.reduce((sum, seg) => sum + (seg.confidence || 0), 0) / segments.length;

      return {
        segments,
        language: finalConfig.language,
        duration: segments[segments.length - 1]?.endTime || 0,
        averageConfidence,
        srtContent,
        vttContent
      };
    } catch (error) {
      console.error('Caption generation failed:', error);
      throw new Error('Failed to generate captions');
    }
  }

  /**
   * Extract audio from video file
   */
  private static async extractAudio(videoFile: File | Blob): Promise<Blob> {
    // In production, use FFmpeg.wasm to extract audio
    // For now, return video file (Whisper can handle video files)
    return videoFile;
  }

  /**
   * Call OpenAI Whisper API
   */
  private static async callWhisperAPI(
    audioBlob: Blob,
    language: string
  ): Promise<any> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'verbose_json'); // Get timestamps
    formData.append('timestamp_granularities', 'word'); // Word-level timestamps

    const response = await fetch(this.WHISPER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Process Whisper transcription into caption segments
   */
  private static processTranscription(
    transcription: any,
    config: CaptionConfig
  ): CaptionSegment[] {
    const words = transcription.words || [];
    const segments: CaptionSegment[] = [];

    let currentSegment: string[] = [];
    let segmentStart = 0;
    let segmentId = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentSegment.push(word.word);

      const segmentText = currentSegment.join(' ');
      const shouldBreak =
        segmentText.length >= config.maxCharsPerLine ||
        i === words.length - 1 ||
        (word.word.endsWith('.') || word.word.endsWith('!') || word.word.endsWith('?'));

      if (shouldBreak) {
        segments.push({
          id: segmentId++,
          startTime: segmentStart,
          endTime: word.end,
          text: segmentText.trim(),
          confidence: transcription.confidence || 0.95
        });

        currentSegment = [];
        segmentStart = word.end;
      }
    }

    return segments;
  }

  /**
   * Generate SRT format captions
   */
  private static generateSRT(segments: CaptionSegment[]): string {
    return segments.map(segment => {
      const startTime = this.formatSRTTime(segment.startTime);
      const endTime = this.formatSRTTime(segment.endTime);

      return `${segment.id + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
  }

  /**
   * Generate VTT format captions
   */
  private static generateVTT(segments: CaptionSegment[]): string {
    const header = 'WEBVTT\n\n';

    const cues = segments.map(segment => {
      const startTime = this.formatVTTTime(segment.startTime);
      const endTime = this.formatVTTTime(segment.endTime);

      return `${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');

    return header + cues;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   */
  private static formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  /**
   * Burn captions into video
   */
  static async burnCaptionsIntoVideo(
    videoFile: File | Blob,
    captions: CaptionResult,
    config: CaptionConfig
  ): Promise<Blob> {
    // In production, use FFmpeg.wasm to burn captions
    // This is a placeholder for the actual implementation

    console.log('Burning captions with config:', config);
    console.log('Caption segments:', captions.segments.length);

    // TODO: Implement FFmpeg caption burning
    // ffmpeg -i input.mp4 -vf "subtitles=captions.srt:force_style='FontName=Inter Bold,FontSize=48'" output.mp4

    return videoFile;
  }

  /**
   * Get caption config for platform
   */
  static getCaptionConfigForPlatform(platform: string): CaptionConfig {
    const platformConfig = PLATFORM_CAPTION_CONFIGS[platform] || {};
    return { ...DEFAULT_CAPTION_CONFIG, ...platformConfig };
  }

  /**
   * Validate caption segments
   */
  static validateCaptions(captions: CaptionResult): {
    valid: boolean;
    issues: string[];
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const issues: string[] = [];

    // Check confidence scores
    if (captions.averageConfidence < 0.7) {
      issues.push('Low transcription confidence - audio quality may be poor');
    }

    // Check for very short segments
    const shortSegments = captions.segments.filter(seg => seg.text.length < 5);
    if (shortSegments.length > captions.segments.length * 0.3) {
      issues.push('Many very short caption segments - may be choppy');
    }

    // Check for very long segments
    const longSegments = captions.segments.filter(seg => seg.text.length > 80);
    if (longSegments.length > 0) {
      issues.push('Some captions are too long for mobile display');
    }

    // Check timing gaps
    for (let i = 1; i < captions.segments.length; i++) {
      const gap = captions.segments[i].startTime - captions.segments[i - 1].endTime;
      if (gap > 2) {
        issues.push('Large gaps detected between caption segments');
        break;
      }
    }

    // Determine quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (captions.averageConfidence >= 0.95 && issues.length === 0) {
      quality = 'excellent';
    } else if (captions.averageConfidence >= 0.85 && issues.length <= 1) {
      quality = 'good';
    } else if (captions.averageConfidence >= 0.7 && issues.length <= 2) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    return {
      valid: issues.length === 0,
      issues,
      quality
    };
  }

  /**
   * Fix common caption issues
   */
  static fixCaptionIssues(segments: CaptionSegment[]): CaptionSegment[] {
    return segments.map(segment => {
      let text = segment.text;

      // Capitalize first letter
      text = text.charAt(0).toUpperCase() + text.slice(1);

      // Remove extra spaces
      text = text.replace(/\s+/g, ' ').trim();

      // Fix common transcription errors
      text = text
        .replace(/\bum\b/gi, '')
        .replace(/\buh\b/gi, '')
        .replace(/\blike\b(?!\s+to)/gi, '') // Remove filler "like"
        .trim();

      return {
        ...segment,
        text
      };
    });
  }

  /**
   * Split long captions for better readability
   */
  static splitLongCaptions(
    segments: CaptionSegment[],
    maxChars: number = 40
  ): CaptionSegment[] {
    const result: CaptionSegment[] = [];
    let idCounter = 0;

    for (const segment of segments) {
      if (segment.text.length <= maxChars) {
        result.push({ ...segment, id: idCounter++ });
      } else {
        // Split at natural break points
        const words = segment.text.split(' ');
        let currentLine = '';
        let lineStart = segment.startTime;
        const duration = segment.endTime - segment.startTime;
        const wordsPerSecond = words.length / duration;

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? `${currentLine} ${word}` : word;

          if (testLine.length > maxChars && currentLine) {
            // Save current line
            const lineWords = currentLine.split(' ').length;
            const lineDuration = lineWords / wordsPerSecond;
            const lineEnd = lineStart + lineDuration;

            result.push({
              id: idCounter++,
              startTime: lineStart,
              endTime: lineEnd,
              text: currentLine,
              confidence: segment.confidence
            });

            currentLine = word;
            lineStart = lineEnd;
          } else {
            currentLine = testLine;
          }
        }

        // Add remaining text
        if (currentLine) {
          result.push({
            id: idCounter++,
            startTime: lineStart,
            endTime: segment.endTime,
            text: currentLine,
            confidence: segment.confidence
          });
        }
      }
    }

    return result;
  }

  /**
   * Get caption styling CSS for preview
   */
  static getCaptionCSS(config: CaptionConfig): string {
    return `
      font-family: ${config.font};
      font-size: ${config.fontSize}px;
      color: ${config.fontColor};
      background-color: ${config.backgroundColor};
      padding: 8px 16px;
      border-radius: 8px;
      max-width: 90%;
      text-align: center;
      line-height: 1.2;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    `;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Download captions as SRT file
 */
export function downloadSRT(captions: CaptionResult, filename: string): void {
  if (!captions.srtContent) return;

  const blob = new Blob([captions.srtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.srt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download captions as VTT file
 */
export function downloadVTT(captions: CaptionResult, filename: string): void {
  if (!captions.vttContent) return;

  const blob = new Blob([captions.vttContent], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.vtt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Estimate caption generation time
 */
export function estimateCaptionGenerationTime(videoDuration: number): number {
  // Whisper API typically processes at ~1.5x real-time
  // Add buffer for network and processing
  return Math.ceil((videoDuration / 1.5) + 5); // seconds
}

/**
 * Calculate caption reading speed (words per minute)
 */
export function calculateReadingSpeed(captions: CaptionResult): number {
  const totalWords = captions.segments.reduce(
    (sum, seg) => sum + seg.text.split(' ').length,
    0
  );
  const durationMinutes = captions.duration / 60;
  return Math.round(totalWords / durationMinutes);
}
