/**
 * ContentGenerator Component
 * Modal interface for generating content with MARBA or Synapse modes
 * Tasks 316-331
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Zap, Edit, Save, Info } from 'lucide-react';
import { ContentCalendarService } from '@/services/content-calendar.service';
import { EdginessSlider } from '@/components/synapse/EdginessSlider';
import { CharacterCountBadge } from '@/components/synapse/CharacterCountBadge';
import { CharacterValidator } from '@/services/synapse/validation/CharacterValidator';
import type {
  Platform,
  GenerationMode,
  ContentVariation,
  ContentPillar,
} from '@/types/content-calendar.types';
import type {
  EdginessLevel,
  CharacterValidation,
  SynapseContent,
} from '@/types/synapse/synapseContent.types';

interface ContentGeneratorProps {
  open: boolean;
  onClose: () => void;
  brandId: string;
  userId: string;
  opportunityId?: string;
  pillars?: ContentPillar[];
  onContentCreated?: (contentId: string) => void;
}

/**
 * Platform options
 */
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'email', label: 'Email' },
  { value: 'blog', label: 'Blog' },
];

export function ContentGenerator({
  open,
  onClose,
  brandId,
  userId,
  opportunityId,
  pillars = [],
  onContentCreated,
}: ContentGeneratorProps) {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [topic, setTopic] = useState('');
  const [pillarId, setPillarId] = useState<string | undefined>();
  const [mode, setMode] = useState<GenerationMode>('marba'); // Default to MARBA
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<ContentVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Synapse-specific states
  const [edginess, setEdginess] = useState<EdginessLevel>(50);
  const [characterValidation, setCharacterValidation] = useState<CharacterValidation | null>(null);

  // Character validator instance
  const characterValidator = new CharacterValidator();

  /**
   * Reset form when modal closes
   */
  useEffect(() => {
    if (!open) {
      setTopic('');
      setPillarId(undefined);
      setMode('marba');
      setVariations([]);
      setSelectedVariation(null);
      setEditedContent('');
      setEdginess(50);
      setCharacterValidation(null);
    }
  }, [open]);

  /**
   * Validate character count when content changes
   */
  useEffect(() => {
    if (editedContent && mode === 'synapse') {
      // Create mock SynapseContent for validation
      const mockContent: SynapseContent = {
        id: 'temp',
        insightId: 'temp',
        format: 'hook-post',
        content: {
          headline: editedContent.split('\n')[0] || '',
          hook: editedContent.split('\n')[1] || '',
          body: editedContent.split('\n').slice(2, -1).join('\n') || '',
          cta: editedContent.split('\n').slice(-1)[0] || ''
        },
        psychology: {
          principle: 'Curiosity Gap',
          trigger: { type: 'curiosity', strength: 0.8 },
          persuasionTechnique: 'Pattern Interrupt',
          expectedReaction: ''
        },
        optimization: {
          powerWords: [],
          framingDevice: '',
          narrativeStructure: 'Hook → Story → Lesson',
          pacing: 'medium'
        },
        meta: {
          platform: [platform as any],
          targetAudience: '',
          tone: 'professional'
        },
        prediction: {
          engagementScore: 0,
          viralPotential: 0,
          leadGeneration: 0,
          brandImpact: 'neutral',
          confidenceLevel: 0
        },
        metadata: {
          generatedAt: new Date(),
          model: '',
          iterationCount: 0
        }
      };

      const validation = characterValidator.validateContent(mockContent, [platform as any]);
      const totalValidation = validation.validations.find(v => v.section === 'total' && v.platform === platform);
      if (totalValidation) {
        setCharacterValidation(totalValidation);
      }
    }
  }, [editedContent, platform, mode]);

  /**
   * Generate content
   */
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setGenerating(true);
    setVariations([]);
    setSelectedVariation(null);

    try {
      const result = await ContentCalendarService.generateContent({
        brandId,
        platform,
        topic,
        pillarId,
        mode,
      });

      // Mock response for demo (replace with actual API response)
      const mockVariations: ContentVariation[] = [
        {
          id: '1',
          text: `🎯 ${topic}\n\nTransform your business with cutting-edge solutions. Our proven approach delivers real results. Ready to elevate your game?\n\n#innovation #business #growth`,
          synapse_analysis: {
            psychology_score: 85,
            power_words: ['Transform', 'cutting-edge', 'proven', 'real results', 'elevate'],
            emotional_triggers: ['aspiration', 'urgency', 'confidence'],
            connections_found: ['transformation → results', 'innovation → growth'],
            clarity_score: 90,
            engagement_prediction: 87,
            improvements: ['Consider adding specific metrics', 'Include a clear CTA'],
          },
          psychology_score: 85,
          benchmark_comparison: {
            industry_average: 65,
            your_score: 85,
            percentile: 78,
            comparison_text: 'Your content scores 31% higher than industry average',
          },
          why_this_works:
            'This post combines aspirational language with concrete promises, triggering both emotional and logical engagement. The power words create urgency while maintaining professionalism.',
          suggested_hashtags: ['#innovation', '#business', '#growth', '#transformation'],
        },
        {
          id: '2',
          text: `💡 ${topic}\n\nDiscover how leading companies are staying ahead. Join the revolution and unlock your potential today.\n\n✨ Learn more → [link]\n\n#leadership #success #future`,
          synapse_analysis: {
            psychology_score: 78,
            power_words: ['Discover', 'leading', 'revolution', 'unlock', 'potential'],
            emotional_triggers: ['curiosity', 'belonging', 'achievement'],
            connections_found: ['discovery → learning', 'leadership → success'],
            clarity_score: 85,
            engagement_prediction: 80,
            improvements: ['Make CTA more specific', 'Add social proof'],
          },
          psychology_score: 78,
          benchmark_comparison: {
            industry_average: 65,
            your_score: 78,
            percentile: 68,
            comparison_text: 'Your content scores 20% higher than industry average',
          },
          why_this_works:
            'Appeals to desire for belonging and staying competitive. The curiosity gap created by "Discover how" drives engagement.',
          suggested_hashtags: ['#leadership', '#success', '#future', '#innovation'],
        },
        {
          id: '3',
          text: `🚀 ${topic}\n\nWhat if you could 10x your results in half the time? Here's the secret successful brands don't want you to know.\n\n👉 Swipe to see the full strategy\n\n#productivity #marketing #strategy`,
          synapse_analysis: {
            psychology_score: 92,
            power_words: ['10x', 'secret', 'successful', 'strategy'],
            emotional_triggers: ['curiosity', 'exclusivity', 'urgency', 'achievement'],
            connections_found: ['efficiency → results', 'secrets → success'],
            clarity_score: 88,
            engagement_prediction: 91,
            improvements: ['Deliver on the promise in follow-up content'],
          },
          psychology_score: 92,
          benchmark_comparison: {
            industry_average: 65,
            your_score: 92,
            percentile: 89,
            comparison_text: 'Your content scores 42% higher than industry average',
          },
          why_this_works:
            'Uses curiosity gap and exclusivity psychology. The specific metric (10x) makes the promise tangible while maintaining intrigue.',
          suggested_hashtags: ['#productivity', '#marketing', '#strategy', '#businessgrowth'],
        },
      ];

      setVariations(
        mode === 'synapse'
          ? mockVariations
          : mockVariations.map((v) => ({
              ...v,
              synapse_analysis: undefined,
              psychology_score: undefined,
            }))
      );
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Select a variation
   */
  const handleSelectVariation = (variationId: string) => {
    setSelectedVariation(variationId);
    const variation = variations.find((v) => v.id === variationId);
    if (variation) {
      setEditedContent(variation.text);
    }
  };

  /**
   * Save to calendar
   */
  const handleSaveToCalendar = async () => {
    if (!editedContent.trim()) {
      alert('Please select and edit a variation');
      return;
    }

    setSaving(true);

    try {
      const selectedVar = variations.find((v) => v.id === selectedVariation);

      const contentItem = await ContentCalendarService.createContentItem({
        brand_id: brandId,
        user_id: userId,
        platform,
        content_text: editedContent,
        pillar_id: pillarId,
        generation_mode: mode,
        synapse_score: selectedVar?.psychology_score,
        intelligence_badges: mode === 'synapse' ? ['Synapse Enhanced', 'Data-driven'] : [],
        hashtags: selectedVar?.suggested_hashtags,
        status: 'draft',
      });

      if (onContentCreated) {
        onContentCreated(contentItem.id);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Content</DialogTitle>
          <DialogDescription>
            Create engaging content with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Selector */}
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pillar Selector */}
          {pillars.length > 0 && (
            <div>
              <Label>Message Pillar (Optional)</Label>
              <Select value={pillarId} onValueChange={setPillarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pillar..." />
                </SelectTrigger>
                <SelectContent>
                  {pillars.map((pillar) => (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      {pillar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Topic Input */}
          <div>
            <Label>Topic / Main Idea</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to talk about?"
              rows={3}
            />
          </div>

          {/* Generation Mode Toggle */}
          <div>
            <Label className="flex items-center gap-2">
              Generation Mode
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="MARBA = Fast generation with Claude Sonnet 3.5
Synapse = Enhanced with psychology optimization and deeper analysis"
              >
                <Info className="w-4 h-4" />
              </Button>
            </Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={mode === 'marba' ? 'default' : 'outline'}
                onClick={() => setMode('marba')}
                className="flex-1"
              >
                <Zap className="w-4 h-4 mr-2" />
                MARBA
                <Badge variant="secondary" className="ml-2 text-xs">
                  Fast
                </Badge>
              </Button>
              <Button
                variant={mode === 'synapse' ? 'default' : 'outline'}
                onClick={() => setMode('synapse')}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Synapse
                <Badge variant="secondary" className="ml-2 text-xs">
                  Enhanced
                </Badge>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'marba'
                ? 'Fast generation with Claude Sonnet 3.5'
                : 'Psychology-optimized content with deeper analysis'}
            </p>
          </div>

          {/* Edginess Slider (Synapse only) */}
          {mode === 'synapse' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <EdginessSlider value={edginess} onChange={setEdginess} />
            </div>
          )}

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating with {mode === 'marba' ? 'MARBA' : 'Synapse'}...
              </>
            ) : (
              <>
                {mode === 'marba' ? <Zap className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Content
              </>
            )}
          </Button>

          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Choose a Variation</h3>
              <Tabs value={selectedVariation || undefined} onValueChange={handleSelectVariation}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="1">Option 1</TabsTrigger>
                  <TabsTrigger value="2">Option 2</TabsTrigger>
                  <TabsTrigger value="3">Option 3</TabsTrigger>
                </TabsList>

                {variations.map((variation) => (
                  <TabsContent key={variation.id} value={variation.id} className="space-y-4">
                    {/* Content Preview */}
                    <Card className="p-4">
                      <p className="whitespace-pre-wrap text-sm">{variation.text}</p>
                    </Card>

                    {/* Synapse Analysis (if Synapse mode) */}
                    {mode === 'synapse' && variation.synapse_analysis && (
                      <Card className="p-4 bg-purple-50 border-purple-200">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold">Psychology Score</span>
                              <span className="text-sm font-bold">{variation.psychology_score}/100</span>
                            </div>
                            <div className="bg-white rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${variation.psychology_score}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-semibold block mb-1">Power Words</span>
                            <div className="flex flex-wrap gap-1">
                              {variation.synapse_analysis.power_words.map((word, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {word}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-semibold block mb-1">Emotional Triggers</span>
                            <div className="flex flex-wrap gap-1">
                              {variation.synapse_analysis.emotional_triggers.map((trigger, idx) => (
                                <Badge key={idx} className="text-xs bg-pink-100 text-pink-800">
                                  {trigger}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Benchmark Comparison */}
                    {variation.benchmark_comparison && (
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <h4 className="font-semibold mb-2 text-sm">Industry Benchmark</h4>
                        <p className="text-sm text-blue-900">{variation.benchmark_comparison.comparison_text}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span>Industry Avg: {variation.benchmark_comparison.industry_average}</span>
                          <span className="font-bold">Your Score: {variation.benchmark_comparison.your_score}</span>
                          <span>Percentile: {variation.benchmark_comparison.percentile}th</span>
                        </div>
                      </Card>
                    )}

                    {/* Why This Works */}
                    {variation.why_this_works && (
                      <Card className="p-4 bg-green-50 border-green-200">
                        <h4 className="font-semibold mb-2 text-sm">Why This Works</h4>
                        <p className="text-sm text-green-900">{variation.why_this_works}</p>
                      </Card>
                    )}

                    {/* Inline Editing */}
                    {selectedVariation === variation.id && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Content
                          </Label>
                          {mode === 'synapse' && characterValidation && (
                            <CharacterCountBadge validation={characterValidation} />
                          )}
                        </div>
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={6}
                          className="mt-2"
                        />
                        {mode === 'synapse' && characterValidation && characterValidation.status !== 'valid' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {characterValidation.message}
                          </p>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Save Button */}
              {selectedVariation && (
                <Button onClick={handleSaveToCalendar} disabled={saving} className="w-full mt-4">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save to Calendar
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
