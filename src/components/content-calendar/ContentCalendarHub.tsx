/**
 * ContentCalendarHub Component
 * Main hub integrating all content calendar features
 * Integrates with Optimize section of MIRROR
 * Task 3.6 - Complete Content Calendar Hub Integration
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Grid,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Send,
  Lightbulb,
  Sparkles,
  Loader2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { OpportunityFeed } from './OpportunityFeed';
import { ContentGenerator } from './ContentGenerator';
import { BulkContentGenerator } from './BulkContentGenerator';
import { PublishingQueue } from './PublishingQueue';
import { CompetitiveInsights } from './CompetitiveInsights';
import { GenerationProgress, useGenerationProgress } from './GenerationProgress';
import { IndustrySelector } from './IndustrySelector';
import { ContentCalendarService } from '@/services/content-calendar.service';
import { analyticsService } from '@/services/analytics.service';
import { deepContextBuilder } from '@/services/intelligence/deepcontext-builder.service';
import { generateSynapses } from '@/services/synapse/SynapseGenerator';
import { SynapseContentGenerator } from '@/services/synapse/generation/SynapseContentGenerator';
import { supabase } from '@/lib/supabase';
import type { ContentItem, ContentPillar, Platform } from '@/types/content-calendar.types';
import type { SynapseContent } from '@/types/synapse/synapseContent.types';

interface ContentCalendarHubProps {
  brandId: string;
  userId: string;
  pillars?: ContentPillar[];
}

export function ContentCalendarHub({ brandId, userId, pillars = [] }: ContentCalendarHubProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'queue' | 'generator' | 'opportunities' | 'insights'>(
    'calendar'
  );
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isGeneratingMagic, setIsGeneratingMagic] = useState(false);
  const [brandIndustry, setBrandIndustry] = useState<string>('');
  const [brandUrl, setBrandUrl] = useState<string>('');
  const [generationFrequency, setGenerationFrequency] = useState<'post' | 'day' | 'week' | 'month'>('month');

  // Progress indicator
  const { progress, startProgress, updateProgress, completeProgress, closeProgress } =
    useGenerationProgress();

  // Filters and search
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    published: 0,
    pending: 0,
  });

  /**
   * Load stats
   */
  const loadStats = async () => {
    try {
      const items = await ContentCalendarService.getContentItems(
        brandId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      setStats({
        total: items.length,
        scheduled: items.filter(i => i.status === 'scheduled').length,
        published: items.filter(i => i.status === 'published').length,
        pending: items.filter(i => i.status === 'draft').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  /**
   * Load brand industry on mount
   */
  useEffect(() => {
    const loadBrandIndustry = async () => {
      try {
        const { data } = await supabase
          .from('brands')
          .select('industry')
          .eq('id', brandId)
          .single();

        if (data?.industry) {
          setBrandIndustry(data.industry);
        }
      } catch (error) {
        console.error('Failed to load brand industry:', error);
      }
    };

    loadBrandIndustry();
  }, [brandId]);

  /**
   * Load stats on mount and when refreshing
   */
  useEffect(() => {
    loadStats();
  }, [refreshKey, brandId]);

  /**
   * Handle content item click
   */
  const handleContentClick = (content: ContentItem) => {
    setSelectedContent(content);
    // Could open edit modal here
  };

  /**
   * Handle refresh after actions
   */
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadStats();
  };


  /**
   * Get count based on frequency selection
   */
  const getGenerationCount = () => {
    const count = (() => {
      switch (generationFrequency) {
        case 'post':
          return 1;
        case 'day':
          return 3;
        case 'week':
          return 7;
        case 'month':
          return 30;
        default:
          return 30;
      }
    })();
    console.log(`[Generation] Frequency: ${generationFrequency}, Count: ${count}`);
    return count;
  };

  /**
   * Get button text based on frequency
   */
  const getGenerationButtonText = () => {
    switch (generationFrequency) {
      case 'post':
        return 'Generate 1 Post';
      case 'day':
        return 'Generate Today (3 Posts)';
      case 'week':
        return 'Generate This Week (7 Posts)';
      case 'month':
        return 'Generate This Month (30 Posts)';
      default:
        return 'Generate Content';
    }
  };

  /**
   * Handle Magic Generation - Generate posts using Synapse breakthrough discovery
   */
  const handleMagicGeneration = async () => {
    if (isGeneratingMagic) return;

    if (!brandUrl || !brandIndustry) {
      alert('Please enter your business URL and select an industry to generate breakthrough content');
      return;
    }

    const count = getGenerationCount();
    console.log(`[Synapse Generation] Starting with count: ${count}`);
    const startTime = Date.now();
    setIsGeneratingMagic(true);
    startProgress(count);

    try {
      // Extract business name from URL
      const businessName = new URL(brandUrl).hostname.replace('www.', '').split('.')[0];

      // Step 1: Gather intelligence from multiple APIs
      updateProgress(0, 'Gathering intelligence from multiple APIs...');

      const result = await deepContextBuilder.buildDeepContext({
        brandId,
        brandData: {
          name: businessName,
          industry: brandIndustry,
          location: { city: 'New York', state: 'NY' }
        }
      });

      const intelligence = result.context;
      console.log(`[Synapse] Collected ${result.metadata.dataPointsCollected} data points from ${result.metadata.dataSourcesUsed.length} sources`);

      // Step 2: Discover breakthrough insights
      updateProgress(Math.floor(count * 0.3), 'Discovering breakthrough connections...');

      const insights = await generateSynapses({
        brandName: businessName,
        industry: brandIndustry,
        location: 'New York',
        deepContext: intelligence
      });

      console.log(`[Synapse] Found ${insights.length} breakthrough insights`);

      if (insights.length === 0) {
        closeProgress();
        alert('No breakthrough insights discovered. Try a different URL or industry.');
        return;
      }

      // Step 3: Generate content from ALL insights (use up to count)
      updateProgress(Math.floor(count * 0.5), 'Generating breakthrough content...');

      const contentGenerator = new SynapseContentGenerator();
      const allContent: SynapseContent[] = [];

      // Generate content from each insight until we have enough
      for (let i = 0; i < Math.min(insights.length, count); i++) {
        const insight = insights[i];
        const content = await contentGenerator.generateContent(insight, {
          formats: ['standard'],
          platforms: ['linkedin', 'twitter'],
          edginess: 0.7
        });

        allContent.push(...content);
        updateProgress(Math.floor(count * 0.5) + i, `Generated ${allContent.length} pieces...`);
      }

      console.log(`[Synapse] Generated ${allContent.length} content pieces`);

      // Step 4: Save to calendar with scheduling
      updateProgress(Math.floor(count * 0.9), 'Scheduling your content...');

      let savedCount = 0;
      const now = new Date();

      for (let i = 0; i < allContent.length; i++) {
        const item = allContent[i];

        // Map platform
        const platformMap: Record<string, Platform> = {
          'linkedin': 'linkedin',
          'twitter': 'twitter',
          'facebook': 'facebook',
          'instagram': 'instagram',
          'tiktok': 'tiktok',
        };

        const synapseplatform = item.meta.platform?.[0] || 'linkedin';
        const platform = platformMap[synapseplatform] || 'linkedin';

        // Combine content sections
        const contentText = [
          item.content.headline,
          item.content.hook,
          item.content.body,
          item.content.cta,
        ].filter(Boolean).join('\n\n');

        // Build intelligence badges
        const badges: string[] = [
          `Synapse Discovery`,
          `Engagement: ${Math.round(item.prediction.engagementScore * 100)}%`,
          `Viral Potential: ${Math.round(item.prediction.viralPotential * 100)}%`,
        ];

        if (item.provenance?.psychologyTrigger) {
          badges.push(`Psychology: ${item.provenance.psychologyTrigger}`);
        }

        // Calculate scheduled time (spread across next days)
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + i);
        scheduledDate.setHours(10, 0, 0, 0);

        await ContentCalendarService.createContentItem({
          brand_id: brandId,
          user_id: userId,
          platform,
          content_text: contentText,
          generation_mode: 'synapse',
          synapse_score: item.prediction.engagementScore,
          intelligence_badges: badges,
          hashtags: item.content.hashtags,
          status: 'scheduled',
          scheduled_time: scheduledDate.toISOString(),
        });

        savedCount++;
      }

      console.log(`[Synapse] Saved ${savedCount} posts to calendar`);

      // Track analytics
      analyticsService.trackContentGeneration({
        count: savedCount,
        industry: brandIndustry,
        duration: Date.now() - startTime,
        avgScore: allContent.reduce((sum, c) => sum + c.prediction.engagementScore, 0) / allContent.length,
        successCount: savedCount,
      });

      // Complete progress
      completeProgress();

      // Refresh calendar
      setTimeout(() => {
        handleRefresh();
      }, 2000);

    } catch (error) {
      console.error('Synapse generation failed:', error);

      analyticsService.trackError({
        type: 'synapse_generation_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        context: { brandId, industry: brandIndustry },
      });

      closeProgress();
      alert('Generation failed. Please check your URL and try again.');
    } finally {
      setIsGeneratingMagic(false);
    }
  };

  /**
   * Clear all content for this brand
   */
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL content? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content_calendar_items')
        .delete()
        .eq('brand_id', brandId);

      if (error) throw error;

      console.log('[ContentCalendarHub] Cleared all content for brand:', brandId);
      handleRefresh();
    } catch (error) {
      console.error('[ContentCalendarHub] Failed to clear content:', error);
      alert('Failed to clear content. Check console for details.');
    }
  };

  /**
   * Handle Synapse content generation from insights
   * Converts SynapseContent to ContentItem and saves to calendar
   */
  const handleSynapseContentGenerated = async (synapseContent: SynapseContent[]) => {
    console.log('[ContentCalendarHub] Processing Synapse content:', synapseContent.length, 'items');

    try {
      let savedCount = 0;
      const now = new Date();

      for (let i = 0; i < synapseContent.length; i++) {
        const item = synapseContent[i];

        // Map platform from Synapse format to ContentItem format
        const platformMap: Record<string, Platform> = {
          'linkedin': 'linkedin',
          'twitter': 'twitter',
          'facebook': 'facebook',
          'instagram': 'instagram',
          'tiktok': 'tiktok',
        };

        // Get the first platform or default to linkedin
        const synapseplatform = item.meta.platform?.[0] || 'linkedin';
        const platform = platformMap[synapseplatform] || 'linkedin';

        // Combine content sections into text
        const contentText = [
          item.content.headline,
          item.content.hook,
          item.content.body,
          item.content.cta,
        ].filter(Boolean).join('\n\n');

        // Build intelligence badges from provenance and predictions
        const badges: string[] = [
          `Synapse Discovery`,
          `Engagement Score: ${Math.round(item.prediction.engagementScore * 100)}%`,
          `Viral Potential: ${Math.round(item.prediction.viralPotential * 100)}%`,
        ];

        if (item.provenance?.psychologyTrigger) {
          badges.push(`Psychology: ${item.provenance.psychologyTrigger}`);
        }

        if (item.provenance?.dataSourcesUsed?.length) {
          badges.push(`Data Sources: ${item.provenance.dataSourcesUsed.length}`);
        }

        // Calculate scheduled time (spread across next 7 days)
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + i);
        scheduledDate.setHours(10, 0, 0, 0);

        // Save to database
        const savedItem = await ContentCalendarService.createContentItem({
          brand_id: brandId,
          user_id: userId,
          platform,
          content_text: contentText,
          generation_mode: 'synapse',
          synapse_score: item.prediction.engagementScore,
          intelligence_badges: badges,
          hashtags: item.content.hashtags,
          status: 'scheduled',
          scheduled_time: scheduledDate.toISOString(),
        });

        console.log('[ContentCalendarHub] Saved Synapse content:', savedItem.id);
        savedCount++;
      }

      console.log(`[ContentCalendarHub] Saved ${savedCount}/${synapseContent.length} Synapse content items`);

      // Track analytics
      analyticsService.trackContentGeneration({
        count: savedCount,
        industry: brandIndustry,
        duration: 0,
        avgScore: synapseContent.reduce((sum, c) => sum + c.prediction.engagementScore, 0) / synapseContent.length,
        successCount: savedCount,
      });

      // Refresh calendar
      handleRefresh();

      // Switch to calendar view to show new content
      setActiveTab('calendar');

    } catch (error) {
      console.error('[ContentCalendarHub] Failed to save Synapse content:', error);
      alert('Failed to save content. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Content Calendar</h1>
        <p className="text-muted-foreground mb-4">
          Plan, schedule, and publish content across all platforms
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Content</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1">Search Content</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by text, hashtags, or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Platform Filter */}
          <div className="w-full md:w-48">
            <Label className="text-xs text-muted-foreground mb-1">Platform</Label>
            <Select value={platformFilter} onValueChange={v => setPlatformFilter(v as Platform | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Business URL */}
          <div className="w-full md:w-64">
            <Label className="text-xs text-muted-foreground mb-1">Business URL</Label>
            <Input
              type="url"
              placeholder="https://yourbusiness.com"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
            />
          </div>

          {/* Industry Selector */}
          <div className="w-full md:w-56">
            <IndustrySelector
              brandId={brandId}
              value={brandIndustry}
              onChange={setBrandIndustry}
              autoSave={true}
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <div className="w-full md:w-40">
              <Label className="text-xs text-muted-foreground mb-1">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="w-full md:w-40">
              <Label className="text-xs text-muted-foreground mb-1">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons and Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Generate</Label>
            <Select
              value={generationFrequency}
              onValueChange={(v) => {
                console.log(`[Frequency] Changed to: ${v}`);
                setGenerationFrequency(v as 'post' | 'day' | 'week' | 'month');
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">One Post (1)</SelectItem>
                <SelectItem value="day">One Day (3 posts)</SelectItem>
                <SelectItem value="week">One Week (7 posts)</SelectItem>
                <SelectItem value="month">One Month (30 posts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground opacity-0">Action</Label>
            <Button
              size="lg"
              onClick={handleMagicGeneration}
              disabled={isGeneratingMagic}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGeneratingMagic ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {getGenerationButtonText()}
                </>
              )}
            </Button>
          </div>
          <Button onClick={() => setShowContentGenerator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Content
          </Button>
          <Button variant="outline" onClick={() => setShowBulkGenerator(true)}>
            <Grid className="w-4 h-4 mr-2" />
            Bulk Generate
          </Button>
          <Button variant="destructive" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={v =>
            setActiveTab(v as 'calendar' | 'queue' | 'generator' | 'opportunities' | 'insights')
          }
        >
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="queue">
              <Clock className="w-4 h-4 mr-2" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="generator">
              <Grid className="w-4 h-4 mr-2" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="opportunities">
              <Lightbulb className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Competitive Intel
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Area */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsContent value="calendar" className="mt-0">
          <CalendarView
            key={`calendar-${refreshKey}`}
            brandId={brandId}
            onEventClick={handleContentClick}
            onEventDrop={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="queue" className="mt-0">
          <PublishingQueue
            key={`queue-${refreshKey}`}
            brandId={brandId}
            days={7}
            enableApprovalWorkflow={false}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="generator" className="mt-0">
          <Card className="p-8 text-center">
            <Grid className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">Bulk Content Generator</h3>
            <p className="text-muted-foreground mb-6">
              Generate multiple posts at once across platforms and date ranges
            </p>
            <Button onClick={() => setShowBulkGenerator(true)} size="lg">
              <Grid className="w-4 h-4 mr-2" />
              Open Bulk Generator
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-0">
          <OpportunityFeed
            brandId={brandId}
            userId={userId}
            onGenerateFromOpportunity={() => {
              // Opportunity generator is handled within OpportunityFeed
            }}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <CompetitiveInsights
            brandId={brandId}
            brandDomain={brandUrl}
          />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0"
          onClick={() => setShowContentGenerator(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Content Generator Modal */}
      <ContentGenerator
        open={showContentGenerator}
        onClose={() => setShowContentGenerator(false)}
        brandId={brandId}
        userId={userId}
        pillars={pillars}
        onContentCreated={handleRefresh}
      />

      {/* Bulk Content Generator Modal */}
      <BulkContentGenerator
        open={showBulkGenerator}
        onClose={() => setShowBulkGenerator(false)}
        brandId={brandId}
        userId={userId}
        pillars={pillars}
        onContentCreated={handleRefresh}
      />

      {/* Generation Progress Indicator */}
      <GenerationProgress
        isOpen={progress.isOpen}
        current={progress.current}
        total={progress.total}
        currentStep={progress.currentStep}
        isComplete={progress.isComplete}
      />
    </div>
  );
}
