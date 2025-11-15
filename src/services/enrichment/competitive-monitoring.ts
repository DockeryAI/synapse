/**
 * Competitive Monitoring Service - Monitors competitor activity and detects changes
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type {
  CompetitiveSnapshot,
  MessagingShift,
  CompetitiveGap,
} from '@/types/enrichment.types';

export class CompetitiveMonitoring {
  /**
   * Monitor competitor website changes
   */
  static async monitorWebsiteChanges(brandId: string): Promise<void> {
    try {
      // Get competitors for this brand
      const competitors = await this.getCompetitors(brandId);

      for (const competitor of competitors) {
        // Fetch current website data
        const currentSnapshot = await this.captureWebsiteSnapshot(
          competitor.website
        );

        // Get previous snapshot
        const previousSnapshot = await this.getPreviousSnapshot(
          brandId,
          competitor.name,
          'website'
        );

        // Detect changes
        const changes = this.detectWebsiteChanges(
          previousSnapshot?.data,
          currentSnapshot
        );

        if (changes.length > 0) {
          // Store new snapshot with detected changes
          await this.storeSnapshot(brandId, {
            competitor_name: competitor.name,
            snapshot_type: 'website',
            data: currentSnapshot,
            changes_detected: changes,
          });

          // Log the changes
          console.log(
            `Detected ${changes.length} changes for ${competitor.name}`
          );
        } else {
          // Store snapshot even with no changes (for tracking)
          await this.storeSnapshot(brandId, {
            competitor_name: competitor.name,
            snapshot_type: 'website',
            data: currentSnapshot,
            changes_detected: [],
          });
        }
      }
    } catch (error) {
      console.error('Error monitoring website changes:', error);
      throw error;
    }
  }

  /**
   * Monitor competitor social media activity
   */
  static async monitorSocialActivity(brandId: string): Promise<void> {
    try {
      const competitors = await this.getCompetitors(brandId);

      for (const competitor of competitors) {
        // Simulate social media monitoring (replace with real API later)
        const socialData = await this.captureSocialSnapshot(competitor.name);

        // Get previous social snapshot
        const previousSnapshot = await this.getPreviousSnapshot(
          brandId,
          competitor.name,
          'social'
        );

        // Detect changes in posting frequency, engagement, content types
        const changes = this.detectSocialChanges(
          previousSnapshot?.data,
          socialData
        );

        if (changes.length > 0) {
          await this.storeSnapshot(brandId, {
            competitor_name: competitor.name,
            snapshot_type: 'social',
            data: socialData,
            changes_detected: changes,
          });
        }
      }
    } catch (error) {
      console.error('Error monitoring social activity:', error);
      throw error;
    }
  }

  /**
   * Detect messaging shifts
   */
  static async detectMessagingShifts(brandId: string): Promise<MessagingShift[]> {
    const shifts: MessagingShift[] = [];

    try {
      const competitors = await this.getCompetitors(brandId);

      for (const competitor of competitors) {
        // Get recent messaging snapshots
        const snapshots = await this.getRecentSnapshots(
          brandId,
          competitor.name,
          'messaging',
          2
        );

        if (snapshots.length < 2) continue;

        const [current, previous] = snapshots;

        // Analyze messaging changes
        const shift = await this.analyzeMessagingShift(
          previous.data,
          current.data,
          competitor.name
        );

        if (shift) {
          shifts.push(shift);

          // Store the shift for future reference
          await this.storeMessagingShift(brandId, shift);
        }
      }
    } catch (error) {
      console.error('Error detecting messaging shifts:', error);
    }

    return shifts;
  }

  /**
   * Identify new competitors
   */
  static async detectNewCompetitors(brandId: string): Promise<string[]> {
    const newCompetitors: string[] = [];

    try {
      // Get brand industry
      const { data: brand } = await supabase
        .from('brands')
        .select('industry, business_name')
        .eq('id', brandId)
        .single();

      if (!brand) return newCompetitors;

      // Get existing competitors
      const existingCompetitors = await this.getCompetitors(brandId);
      const existingNames = new Set(
        existingCompetitors.map((c) => c.name.toLowerCase())
      );

      // Simulate competitor discovery (replace with real market research API)
      const discoveredCompetitors = await this.discoverCompetitors(
        brand.industry,
        brand.business_name
      );

      // Find new ones
      for (const competitor of discoveredCompetitors) {
        if (!existingNames.has(competitor.toLowerCase())) {
          newCompetitors.push(competitor);

          // Auto-add to monitoring list
          await this.addCompetitor(brandId, competitor);
        }
      }
    } catch (error) {
      console.error('Error detecting new competitors:', error);
    }

    return newCompetitors;
  }

  /**
   * Analyze competitive gaps
   */
  static async analyzeCompetitiveGaps(
    brandId: string
  ): Promise<CompetitiveGap[]> {
    const gaps: CompetitiveGap[] = [];

    try {
      // Get brand data
      const { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (!brand) return gaps;

      // Get all competitor snapshots
      const { data: snapshots } = await supabase
        .from('competitive_intelligence_snapshots')
        .select('*')
        .eq('brand_id', brandId)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (!snapshots || snapshots.length === 0) return gaps;

      // Analyze gaps in different areas
      const featureGaps = this.analyzeFeatureGaps(brand, snapshots);
      const messagingGaps = this.analyzeMessagingGaps(brand, snapshots);
      const channelGaps = this.analyzeChannelGaps(brand, snapshots);
      const audienceGaps = this.analyzeAudienceGaps(brand, snapshots);

      gaps.push(...featureGaps, ...messagingGaps, ...channelGaps, ...audienceGaps);

      // Store gap analysis
      for (const gap of gaps) {
        await this.storeGapAnalysis(brandId, gap);
      }
    } catch (error) {
      console.error('Error analyzing competitive gaps:', error);
    }

    return gaps;
  }

  // Helper methods

  private static async getCompetitors(
    brandId: string
  ): Promise<Array<{ name: string; website: string }>> {
    // Get competitors from database
    const { data } = await supabase
      .from('competitors')
      .select('name, website')
      .eq('brand_id', brandId)
      .eq('is_active', true);

    return data || [];
  }

  private static async captureWebsiteSnapshot(
    websiteUrl: string
  ): Promise<Record<string, any>> {
    // Simulate website scraping (replace with real scraping/API later)
    // In production, use Puppeteer, Playwright, or a web scraping service
    return {
      title: 'Example Competitor',
      description: 'Sample description',
      headlines: ['Headline 1', 'Headline 2'],
      products: ['Product A', 'Product B'],
      pricing: { basic: 99, pro: 199 },
      features: ['Feature 1', 'Feature 2'],
      captured_at: new Date().toISOString(),
    };
  }

  private static async captureSocialSnapshot(
    competitorName: string
  ): Promise<Record<string, any>> {
    // Simulate social media data collection
    return {
      platforms: {
        twitter: {
          followers: 10000,
          posts_last_week: 14,
          avg_engagement: 250,
        },
        linkedin: {
          followers: 5000,
          posts_last_week: 5,
          avg_engagement: 100,
        },
      },
      content_types: ['video', 'carousel', 'text'],
      top_topics: ['AI', 'automation', 'productivity'],
      captured_at: new Date().toISOString(),
    };
  }

  private static async getPreviousSnapshot(
    brandId: string,
    competitorName: string,
    snapshotType: string
  ): Promise<CompetitiveSnapshot | null> {
    const { data } = await supabase
      .from('competitive_intelligence_snapshots')
      .select('*')
      .eq('brand_id', brandId)
      .eq('competitor_name', competitorName)
      .eq('snapshot_type', snapshotType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  private static detectWebsiteChanges(
    previous: any,
    current: any
  ): string[] {
    const changes: string[] = [];

    if (!previous) return changes;

    // Compare key fields
    if (previous.title !== current.title) {
      changes.push(`Title changed from "${previous.title}" to "${current.title}"`);
    }

    if (previous.description !== current.description) {
      changes.push('Website description updated');
    }

    // Check for new features
    const newFeatures = current.features?.filter(
      (f: string) => !previous.features?.includes(f)
    );
    if (newFeatures && newFeatures.length > 0) {
      changes.push(`New features added: ${newFeatures.join(', ')}`);
    }

    // Check pricing changes
    if (JSON.stringify(previous.pricing) !== JSON.stringify(current.pricing)) {
      changes.push('Pricing updated');
    }

    return changes;
  }

  private static detectSocialChanges(previous: any, current: any): string[] {
    const changes: string[] = [];

    if (!previous) return changes;

    // Check posting frequency
    for (const platform in current.platforms) {
      if (previous.platforms?.[platform]) {
        const prevPosts = previous.platforms[platform].posts_last_week;
        const currPosts = current.platforms[platform].posts_last_week;

        if (currPosts > prevPosts * 1.5) {
          changes.push(`Increased posting frequency on ${platform}`);
        }

        const prevEng = previous.platforms[platform].avg_engagement;
        const currEng = current.platforms[platform].avg_engagement;

        if (currEng > prevEng * 1.3) {
          changes.push(`Higher engagement on ${platform}`);
        }
      }
    }

    return changes;
  }

  private static async getRecentSnapshots(
    brandId: string,
    competitorName: string,
    snapshotType: string,
    limit: number
  ): Promise<CompetitiveSnapshot[]> {
    const { data } = await supabase
      .from('competitive_intelligence_snapshots')
      .select('*')
      .eq('brand_id', brandId)
      .eq('competitor_name', competitorName)
      .eq('snapshot_type', snapshotType)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  private static async analyzeMessagingShift(
    previous: any,
    current: any,
    competitorName: string
  ): Promise<MessagingShift | null> {
    // Simplified messaging analysis
    // Real implementation would use NLP/LLM to detect tone and positioning changes

    const prevMessaging = previous.main_message || '';
    const currMessaging = current.main_message || '';

    if (prevMessaging !== currMessaging) {
      return {
        competitor: competitorName,
        previous_messaging: prevMessaging,
        new_messaging: currMessaging,
        shift_type: 'positioning',
        impact_assessment: 'Medium - competitor repositioning detected',
        recommended_action: 'Review our messaging to ensure differentiation',
      };
    }

    return null;
  }

  private static async storeSnapshot(
    brandId: string,
    snapshot: Omit<CompetitiveSnapshot, 'id' | 'created_at'>
  ): Promise<void> {
    await supabase.from('competitive_intelligence_snapshots').insert({
      brand_id: brandId,
      ...snapshot,
      created_at: new Date().toISOString(),
    });
  }

  private static async storeMessagingShift(
    brandId: string,
    shift: MessagingShift
  ): Promise<void> {
    await supabase.from('messaging_shifts').insert({
      brand_id: brandId,
      ...shift,
      created_at: new Date().toISOString(),
    });
  }

  private static async discoverCompetitors(
    industry: string,
    businessName: string
  ): Promise<string[]> {
    // Simulate competitor discovery
    // Real implementation would use market research APIs, Google searches, etc.
    return ['New Competitor A', 'New Competitor B'];
  }

  private static async addCompetitor(
    brandId: string,
    competitorName: string
  ): Promise<void> {
    await supabase.from('competitors').insert({
      brand_id: brandId,
      name: competitorName,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }

  private static analyzeFeatureGaps(
    brand: any,
    snapshots: CompetitiveSnapshot[]
  ): CompetitiveGap[] {
    // Simplified gap analysis
    return [
      {
        area: 'features',
        gap_description: 'Competitors offer AI-powered analytics',
        opportunity_size: 'large',
        effort_required: 'high',
        recommended_action: 'Consider adding AI analytics features',
      },
    ];
  }

  private static analyzeMessagingGaps(
    brand: any,
    snapshots: CompetitiveSnapshot[]
  ): CompetitiveGap[] {
    return [];
  }

  private static analyzeChannelGaps(
    brand: any,
    snapshots: CompetitiveSnapshot[]
  ): CompetitiveGap[] {
    return [];
  }

  private static analyzeAudienceGaps(
    brand: any,
    snapshots: CompetitiveSnapshot[]
  ): CompetitiveGap[] {
    return [];
  }

  private static async storeGapAnalysis(
    brandId: string,
    gap: CompetitiveGap
  ): Promise<void> {
    await supabase.from('competitive_gaps').insert({
      brand_id: brandId,
      ...gap,
      created_at: new Date().toISOString(),
    });
  }
}
