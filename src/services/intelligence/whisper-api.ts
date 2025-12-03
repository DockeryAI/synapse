/**
 * Whisper Video Transcription Service
 *
 * Uses OpenAI's Whisper API to transcribe video content
 * for psychological insight extraction.
 *
 * Created: November 21, 2025
 */

import type { DataPoint, DataSource, DataPointType } from '@/types/connections.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  duration: number;
  language: string;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface VideoInsight {
  topic: string;
  timestamp: number;
  content: string;
  type: 'problem' | 'solution' | 'testimonial' | 'feature' | 'benefit';
  confidence: number;
}

class WhisperAPI {
  /**
   * Transcribe audio/video file via Supabase Edge Function
   */
  async transcribe(audioUrl: string): Promise<TranscriptionResult | null> {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('[WhisperAPI] No Supabase config - skipping transcription');
        return null;
      }

      console.log('[WhisperAPI] Transcribing:', audioUrl);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/whisper-transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          response_format: 'verbose_json',
          timestamp_granularities: ['segment']
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WhisperAPI] Transcription failed:', response.status, errorText);
        return null;
      }

      const data = await response.json();

      return {
        text: data.text,
        segments: data.segments || [],
        duration: data.duration || 0,
        language: data.language || 'en'
      };

    } catch (error) {
      console.error('[WhisperAPI] Error:', error);
      return null;
    }
  }

  /**
   * Extract psychological insights from transcription
   */
  async extractInsights(transcription: TranscriptionResult): Promise<VideoInsight[]> {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return this.fallbackInsightExtraction(transcription);
      }

      console.log('[WhisperAPI] Extracting insights from transcription...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [{
            role: 'system',
            content: `You are an expert at extracting psychological insights from business video transcriptions.

Identify key moments that reveal:
- Customer problems and pain points
- Solutions and benefits offered
- Testimonials or social proof
- Feature descriptions
- Emotional triggers

For each insight, determine:
- Topic: Short description
- Type: problem, solution, testimonial, feature, or benefit
- Content: The relevant quote or summary
- Confidence: 0-1 based on clarity

Return JSON array of insights.`
          }, {
            role: 'user',
            content: `Extract psychological insights from this video transcription:\n\n${transcription.text.substring(0, 4000)}\n\nReturn JSON array: [{"topic": "...", "type": "...", "content": "...", "confidence": 0.8}]`
          }],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.warn('[WhisperAPI] AI extraction failed, using fallback');
        return this.fallbackInsightExtraction(transcription);
      }

      const data = await response.json();
      const contentText = data.choices[0].message.content;

      // Parse JSON response
      let content = contentText;
      if (contentText.includes('```json')) {
        content = contentText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      }

      const insights = JSON.parse(content);

      return insights.map((insight: any) => ({
        topic: insight.topic,
        timestamp: 0, // Would need segment matching for accurate timestamps
        content: insight.content,
        type: insight.type,
        confidence: insight.confidence || 0.7
      }));

    } catch (error) {
      console.error('[WhisperAPI] Insight extraction error:', error);
      return this.fallbackInsightExtraction(transcription);
    }
  }

  /**
   * Fallback insight extraction using pattern matching
   */
  private fallbackInsightExtraction(transcription: TranscriptionResult): VideoInsight[] {
    const insights: VideoInsight[] = [];
    const text = transcription.text.toLowerCase();

    // Problem patterns
    const problemPatterns = [
      /(?:the problem is|our challenge|we struggled with|customers face|pain point)[^.]*\./gi,
      /(?:frustrating|difficult|challenging|hard to)[^.]*\./gi
    ];

    // Solution patterns
    const solutionPatterns = [
      /(?:we solve|our solution|we help|we provide)[^.]*\./gi,
      /(?:that's why we|which is why)[^.]*\./gi
    ];

    // Benefit patterns
    const benefitPatterns = [
      /(?:you'll get|you can|allows you to|enables you to)[^.]*\./gi,
      /(?:save time|save money|increase|improve|reduce)[^.]*\./gi
    ];

    // Extract problems
    for (const pattern of problemPatterns) {
      const matches = transcription.text.match(pattern) || [];
      for (const match of matches.slice(0, 3)) {
        insights.push({
          topic: 'Customer Problem',
          timestamp: 0,
          content: match.trim(),
          type: 'problem',
          confidence: 0.6
        });
      }
    }

    // Extract solutions
    for (const pattern of solutionPatterns) {
      const matches = transcription.text.match(pattern) || [];
      for (const match of matches.slice(0, 3)) {
        insights.push({
          topic: 'Solution Offered',
          timestamp: 0,
          content: match.trim(),
          type: 'solution',
          confidence: 0.6
        });
      }
    }

    // Extract benefits
    for (const pattern of benefitPatterns) {
      const matches = transcription.text.match(pattern) || [];
      for (const match of matches.slice(0, 3)) {
        insights.push({
          topic: 'Customer Benefit',
          timestamp: 0,
          content: match.trim(),
          type: 'benefit',
          confidence: 0.6
        });
      }
    }

    return insights;
  }

  /**
   * Transcribe video and extract insights as data points
   */
  async transcribeAndExtract(videoUrl: string): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // Transcribe video
    const transcription = await this.transcribe(videoUrl);

    if (!transcription) {
      console.warn('[WhisperAPI] No transcription available for:', videoUrl);
      return dataPoints;
    }

    // Add transcription as data point
    dataPoints.push({
      id: `whisper-transcript-${Date.now()}`,
      source: 'whisper' as DataSource,
      type: 'customer_trigger' as DataPointType,
      content: transcription.text.substring(0, 500),
      metadata: {
        platform: 'video',
        type: 'transcription',
        duration: transcription.duration,
        language: transcription.language
      },
      createdAt: new Date(),
      embedding: undefined
    });

    // Extract insights
    const insights = await this.extractInsights(transcription);

    // Convert insights to data points
    for (const insight of insights) {
      dataPoints.push({
        id: `whisper-insight-${Date.now()}-${insight.topic.replace(/\s+/g, '-')}`,
        source: 'whisper' as DataSource,
        type: insight.type === 'problem' ? 'pain_point' as DataPointType :
              insight.type === 'benefit' ? 'customer_trigger' as DataPointType :
              'trending_topic' as DataPointType,
        content: `[${insight.type.toUpperCase()}] ${insight.topic}: ${insight.content}`,
        metadata: {
          platform: 'video',
          type: insight.type,
          confidence: insight.confidence,
          timestamp: insight.timestamp,
          domain: 'psychology' as const
        },
        createdAt: new Date(),
        embedding: undefined
      });
    }

    console.log(`[WhisperAPI] ✅ Extracted ${dataPoints.length} data points from video`);
    return dataPoints;
  }

  /**
   * Process multiple videos from YouTube search results
   */
  async processVideos(videoUrls: string[]): Promise<DataPoint[]> {
    console.log(`[WhisperAPI] Processing ${videoUrls.length} videos...`);

    const allDataPoints: DataPoint[] = [];

    // Process videos sequentially to avoid rate limits
    for (const url of videoUrls.slice(0, 3)) { // Limit to 3 videos
      try {
        const dataPoints = await this.transcribeAndExtract(url);
        allDataPoints.push(...dataPoints);
      } catch (error) {
        console.warn(`[WhisperAPI] Failed to process video: ${url}`, error);
      }
    }

    console.log(`[WhisperAPI] ✅ Total extracted: ${allDataPoints.length} data points from ${videoUrls.length} videos`);
    return allDataPoints;
  }
}

export const whisperAPI = new WhisperAPI();
