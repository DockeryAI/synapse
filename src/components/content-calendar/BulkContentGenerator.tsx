/**
 * BulkContentGenerator Component
 * Generate multiple content pieces at once with distribution settings
 * Tasks 332-340
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { ContentCalendarService } from '@/services/content-calendar.service';
import { ContentItem } from './ContentItem';
import type {
  Platform,
  GenerationMode,
  ContentPillar,
  ContentItem as ContentItemType,
} from '@/types/content-calendar.types';

interface BulkContentGeneratorProps {
  open: boolean;
  onClose: () => void;
  brandId: string;
  userId: string;
  pillars?: ContentPillar[];
  onContentCreated?: () => void;
}

/**
 * Platform options for selection
 */
const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
];

export function BulkContentGenerator({
  open,
  onClose,
  brandId,
  userId,
  pillars = [],
  onContentCreated,
}: BulkContentGeneratorProps) {
  const [step, setStep] = useState<'config' | 'review' | 'complete'>('config');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'facebook']);
  const [mode, setMode] = useState<GenerationMode>('marba');
  const [pillarDistribution, setPillarDistribution] = useState<
    { pillarId: string; percentage: number }[]
  >([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentItemType[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [scheduling, setScheduling] = useState(false);

  /**
   * Initialize pillar distribution when pillars change
   */
  React.useEffect(() => {
    if (pillars.length > 0 && pillarDistribution.length === 0) {
      const equalPercentage = Math.floor(100 / pillars.length);
      setPillarDistribution(
        pillars.map((pillar, index) => ({
          pillarId: pillar.id,
          percentage: index === 0 ? 100 - equalPercentage * (pillars.length - 1) : equalPercentage,
        }))
      );
    }
  }, [pillars, pillarDistribution.length]);

  /**
   * Toggle platform selection
   */
  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  /**
   * Update pillar percentage
   */
  const updatePillarPercentage = (pillarId: string, percentage: number) => {
    setPillarDistribution((prev) =>
      prev.map((p) => (p.pillarId === pillarId ? { ...p, percentage } : p))
    );
  };

  /**
   * Generate bulk content
   */
  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    const total = pillarDistribution.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(total - 100) > 1) {
      alert('Pillar percentages must total 100%');
      return;
    }

    setGenerating(true);

    try {
      const result = await ContentCalendarService.generateBulkContent({
        brandId,
        dateRange,
        platforms: selectedPlatforms,
        pillarDistribution,
        mode,
        postsPerDay: 1,
      });

      setGeneratedContent(result.items);
      setSelectedItems(new Set(result.items.map((item) => item.id)));
      setStep('review');
    } catch (error) {
      console.error('Failed to generate bulk content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Toggle item selection
   */
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  /**
   * Schedule all selected items
   */
  const handleScheduleAll = async () => {
    const itemsToSchedule = generatedContent.filter((item) => selectedItems.has(item.id));

    if (itemsToSchedule.length === 0) {
      alert('Please select at least one item to schedule');
      return;
    }

    setScheduling(true);

    try {
      await ContentCalendarService.bulkSchedule(itemsToSchedule, 'optimal_times');
      setStep('complete');

      if (onContentCreated) {
        onContentCreated();
      }
    } catch (error) {
      console.error('Failed to schedule content:', error);
      alert('Failed to schedule some items. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  /**
   * Calculate days covered
   */
  const getDaysCovered = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Reset and close
   */
  const handleClose = () => {
    setStep('config');
    setGeneratedContent([]);
    setSelectedItems(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Content Generation</DialogTitle>
          <DialogDescription>
            Generate multiple posts across platforms and date ranges
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Step */}
        {step === 'config' && (
          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 inline mr-1" />
              {getDaysCovered()} days
            </div>

            {/* Platform Selection */}
            <div>
              <Label>Select Platforms</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {PLATFORMS.map((platform) => (
                  <Card
                    key={platform.value}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPlatforms.includes(platform.value)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => togglePlatform(platform.value)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedPlatforms.includes(platform.value)} />
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="font-medium">{platform.label}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Generation Mode */}
            <div>
              <Label>Generation Mode</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={mode === 'marba' ? 'default' : 'outline'}
                  onClick={() => setMode('marba')}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  MARBA (Fast)
                </Button>
                <Button
                  variant={mode === 'synapse' ? 'default' : 'outline'}
                  onClick={() => setMode('synapse')}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Synapse (Enhanced)
                </Button>
              </div>
            </div>

            {/* Pillar Distribution */}
            {pillars.length > 0 && (
              <div>
                <Label>Content Mix (Pillar Distribution)</Label>
                <div className="space-y-3 mt-2">
                  {pillarDistribution.map((dist) => {
                    const pillar = pillars.find((p) => p.id === dist.pillarId);
                    if (!pillar) return null;

                    return (
                      <div key={dist.pillarId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{pillar.name}</span>
                          <span className="text-sm font-bold">{dist.percentage}%</span>
                        </div>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={dist.percentage}
                          onChange={(e) =>
                            updatePillarPercentage(dist.pillarId, parseInt(e.target.value))
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="text-xs text-muted-foreground">
                    Total:{' '}
                    {pillarDistribution.reduce((sum, p) => sum + p.percentage, 0)}%
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating {selectedPlatforms.length * getDaysCovered()} posts...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Generation Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Posts:</span>
                  <span className="font-bold ml-2">{generatedContent.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Platforms:</span>
                  <span className="font-bold ml-2">{selectedPlatforms.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Days:</span>
                  <span className="font-bold ml-2">{getDaysCovered()}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === generatedContent.length}
                  onCheckedChange={(checked) => {
                    setSelectedItems(
                      checked ? new Set(generatedContent.map((item) => item.id)) : new Set()
                    );
                  }}
                />
                <Label>
                  Select All ({selectedItems.size} of {generatedContent.length})
                </Label>
              </div>

              <Button onClick={handleScheduleAll} disabled={scheduling || selectedItems.size === 0}>
                {scheduling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule {selectedItems.size} Posts
                  </>
                )}
              </Button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
              {generatedContent.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                  </div>
                  <ContentItem item={item} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Content Scheduled Successfully!</h3>
            <p className="text-muted-foreground mb-6">
              {selectedItems.size} posts have been scheduled across {selectedPlatforms.length}{' '}
              platforms for the next {getDaysCovered()} days.
            </p>

            <div className="flex gap-2 justify-center">
              <Button onClick={handleClose}>Close</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('config');
                  setGeneratedContent([]);
                  setSelectedItems(new Set());
                }}
              >
                Generate More
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
