/**
 * Synapse Content Discovery for Content Calendar
 * Streamlined breakthrough content discovery integrated into calendar workflow
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, TrendingUp, MapPin, Building2, Zap } from 'lucide-react';
import { IndustrySelector } from './IndustrySelector';
import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { deepContextBuilder } from '@/services/intelligence/deepcontext-builder.service';
import { generateSynapses } from '@/services/synapse-v6/SynapseGenerator';
import { SynapseContentGenerator } from '@/services/synapse-v6/generation/SynapseContentGenerator';
import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { SynapseContent } from '@/types/synapse/synapseContent.types';
import type { LocationResult } from '@/services/intelligence/location-detection.service';

interface SynapseContentDiscoveryProps {
  brandId: string;
  onContentGenerated: (content: SynapseContent[]) => void;
  onClose?: () => void;
}

export function SynapseContentDiscovery({
  brandId,
  onContentGenerated,
  onClose
}: SynapseContentDiscoveryProps) {
  // Form state
  const [url, setUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState<LocationResult | null>(null);

  // Discovery state
  const [step, setStep] = useState<'input' | 'gathering' | 'insights' | 'generating'>('input');
  const [progress, setProgress] = useState('');
  const [insights, setInsights] = useState<SynapseInsight[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Detect location from URL
   */
  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setError(null);

    if (value.startsWith('http')) {
      try {
        const detected = await locationDetectionService.detectLocation(value, industry);
        setLocation(detected);
      } catch (err) {
        console.error('Location detection failed:', err);
      }
    }
  };

  /**
   * Step 2: Discover breakthrough insights
   */
  const handleDiscoverInsights = async () => {
    if (!url || !industry) {
      setError('Please enter a URL and select an industry');
      return;
    }

    try {
      setStep('gathering');
      setError(null);

      // Extract business name from URL
      const businessName = new URL(url).hostname.replace('www.', '').split('.')[0];

      // Step 2.1: Gather intelligence
      setProgress('Gathering intelligence from 5 APIs...');

      const result = await deepContextBuilder.buildDeepContext({
        brandId, // Use real brand ID to get actual UVP data for business purpose detection
        brandData: {
          name: businessName,
          industry,
          location: location || { city: 'New York', state: 'NY' }
        }
      });

      const intelligence = result.context;
      setProgress(`Collected intelligence data`);

      // Step 2.2: Generate breakthrough insights
      setStep('insights');
      setProgress('Discovering breakthrough connections...');

      const discoveredInsights = await generateSynapses({
        business: {
          name: businessName,
          industry,
          location: location || { city: 'New York', state: 'NY' }
        },
        intelligence: intelligence,
        uvpData: intelligence?.uvpData // PHASE 15 FIX: Pass UVP data for business purpose detection
      });

      if (discoveredInsights.synapses.length === 0) {
        setError('No breakthrough insights discovered. Try a different URL or industry.');
        setStep('input');
        return;
      }

      setInsights(discoveredInsights.synapses);
      setProgress(`Found ${discoveredInsights.synapses.length} breakthrough insights!`);

    } catch (err) {
      console.error('Discovery failed:', err);
      setError(err instanceof Error ? err.message : 'Discovery failed');
      setStep('input');
    }
  };

  /**
   * Step 3: Generate content from selected insights
   */
  const handleGenerateContent = async () => {
    if (selectedInsights.size === 0) {
      setError('Please select at least one insight to generate content');
      return;
    }

    try {
      setStep('generating');
      setError(null);
      setProgress('Generating breakthrough content...');

      // Extract business name from URL
      const businessName = new URL(url).hostname.replace('www.', '').split('.')[0];

      const selectedInsightObjects = insights.filter(i => selectedInsights.has(i.id));

      const contentGenerator = new SynapseContentGenerator();
      const generatedContent: SynapseContent[] = [];

      for (const insight of selectedInsightObjects) {
        const result = await contentGenerator.generate([insight], {
          name: businessName,
          industry: industry,
          targetAudience: 'business owners',
          brandVoice: 'professional',
          contentGoals: ['engagement']
        }, {
          maxContent: 2,
          formats: ['hook-post'],
          platform: 'linkedin'
        });

        generatedContent.push(...result.content);
      }

      setProgress(`Generated ${generatedContent.length} content pieces!`);

      // Pass content to calendar
      onContentGenerated(generatedContent);

    } catch (err) {
      console.error('Content generation failed:', err);
      setError(err instanceof Error ? err.message : 'Content generation failed');
      setStep('insights');
    }
  };

  /**
   * Toggle insight selection
   */
  const toggleInsightSelection = (insightId: string) => {
    const newSelection = new Set(selectedInsights);
    if (newSelection.has(insightId)) {
      newSelection.delete(insightId);
    } else {
      newSelection.add(insightId);
    }
    setSelectedInsights(newSelection);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Discover Breakthrough Content</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered insights from real-time market intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Enter a business URL to discover breakthrough content opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Business URL</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Detected: {location.city}, {location.state} ({Math.round(location.confidence * 100)}% confidence)
                  </span>
                </div>
              )}
            </div>

            {/* Industry Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <IndustrySelector
                brandId={brandId}
                value={industry}
                onChange={setIndustry}
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Discover Button */}
            <Button
              onClick={handleDiscoverInsights}
              disabled={!url || !industry}
              className="w-full"
              size="lg"
            >
              <Zap className="mr-2 h-4 w-4" />
              Discover Breakthrough Insights
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Gathering Intelligence */}
      {step === 'gathering' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">{progress}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzing YouTube, News, Weather, Trends, and Competitors...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Insights */}
      {step === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Breakthrough Insights</h3>
              <p className="text-sm text-muted-foreground">
                Select insights to generate content ({selectedInsights.size} selected)
              </p>
            </div>
            <Button
              onClick={handleGenerateContent}
              disabled={selectedInsights.size === 0}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Content
            </Button>
          </div>

          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={`cursor-pointer transition-all ${
                selectedInsights.has(insight.id) ? 'border-purple-500 bg-purple-500/5' : ''
              }`}
              onClick={() => toggleInsightSelection(insight.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{insight.insight}</CardTitle>
                    <CardDescription className="mt-2">{insight.whyProfound}</CardDescription>
                  </div>
                  <Badge variant={selectedInsights.has(insight.id) ? 'default' : 'outline'}>
                    {selectedInsights.has(insight.id) ? 'Selected' : 'Select'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{insight.contentAngle}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 4: Generating Content */}
      {step === 'generating' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <div className="text-center">
                <p className="text-lg font-medium">{progress}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creating platform-optimized content...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
