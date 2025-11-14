/**
 * SYNAPSE SMB PLATFORM - Enhanced SynapsePage
 * Complete intelligence gathering and content generation interface
 *
 * User Flow:
 * 1. Enter business URL
 * 2. Click "Analyze Business"
 * 3. See 30-second intelligence gathering progress
 * 4. Review detected specialty and intelligence
 * 5. Build Value Proposition with UVP wizard
 * 6. Generate 30-day content calendar
 * 7. Save to calendar and redirect
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { IntelligenceDisplay } from '@/components/synapse/IntelligenceDisplay';
import { ContentPreview } from '@/components/synapse/ContentPreview';
import { EnhancedUVPWizard } from '@/components/uvp-wizard/EnhancedUVPWizard';
import { useOnboarding, getStepName, getStepDescription } from '@/hooks/useOnboarding';

// Import types (these will be defined or exist already)
type ParsedURL = {
  normalized: string;
  domain: string;
  isValid: boolean;
};

type IntelligenceResult = {
  source: string;
  success: boolean;
  duration: number;
  data: any;
};

type SpecialtyDetection = {
  specialty: string;
  confidence: number;
  reasoning: string;
  targetMarket: string;
  nicheKeywords: string[];
};

type ContentIdea = {
  id: string;
  topic: string;
  scheduledDate: string;
  contentType: 'educational' | 'promotional' | 'engagement';
  platform: string;
  specialty: string;
  reasoning: string;
};

type Step = 'url-input' | 'analyzing' | 'specialty-review' | 'uvp-building' | 'content-preview';

export function SynapsePage() {
  const [step, setStep] = useState<Step>('url-input');
  const [url, setUrl] = useState('');
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[] | null>(null);
  const [mockLoading, setMockLoading] = useState(false); // For mock calendar generation

  // Use the real onboarding hook
  const {
    data: onboardingData,
    loading,
    currentStep,
    error: onboardingError,
    execute,
    progress
  } = useOnboarding();

  // Extract data from onboarding result
  const parsedURL = onboardingData?.parsedUrl || null;
  const intelligence = onboardingData?.intelligence || null;
  const specialty = onboardingData?.specialty || null;
  const error = onboardingError?.message || null;

  /**
   * Handle URL analysis using real onboarding hook
   */
  const handleAnalyze = async () => {
    if (!url.trim()) {
      return;
    }

    setStep('analyzing');

    try {
      // Execute the real onboarding flow
      const result = await execute(url);

      // On success, move to specialty review
      setStep('specialty-review');
    } catch (err: any) {
      console.error('Analysis error:', err);
      // Error is handled by the hook, just reset to input
      setStep('url-input');
    }
  };

  /**
   * Handle proceeding to UVP building
   */
  const handleProceedToUVP = () => {
    setStep('uvp-building');
  };

  /**
   * Handle UVP completion and generate calendar
   */
  const handleGenerateCalendar = async () => {
    if (!specialty || !intelligence) return;

    setMockLoading(true);
    setStep('content-preview');

    try {
      // Simulate calendar generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate 30 sample content ideas
      const ideas: ContentIdea[] = Array.from({ length: 30 }, (_, i) => ({
        id: `idea-${i + 1}`,
        topic: i % 3 === 0
          ? `${specialty.specialty} Tips for Beginners`
          : i % 3 === 1
          ? `Behind the Scenes: ${specialty.specialty} Process`
          : `Customer Success Story: ${specialty.specialty}`,
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        contentType: i % 3 === 0 ? 'educational' : i % 3 === 1 ? 'engagement' : 'promotional',
        platform: ['LinkedIn', 'Instagram', 'Facebook', 'Twitter'][i % 4],
        specialty: specialty.specialty,
        reasoning: 'Generated based on specialty analysis and audience targeting'
      }));

      setContentIdeas(ideas);
      setMockLoading(false);
    } catch (err: any) {
      console.error('Calendar generation error:', err);
      setMockLoading(false);
    }
  };

  /**
   * Handle saving to calendar
   */
  const handleSaveToCalendar = async () => {
    if (!contentIdeas) return;

    // Save to database (simulated)
    console.log('Saving', contentIdeas.length, 'content ideas to calendar');

    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Redirect to calendar
    window.location.href = '/content-calendar';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Synapse SMB Platform</h1>
          <p className="text-lg text-muted-foreground">
            Fast, intelligent SMB onboarding with automated content generation
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="text-red-800">{error}</div>
          </Card>
        )}

        {/* Step 1: URL Input */}
        {step === 'url-input' && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Enter Your Business URL</h2>
            <p className="text-muted-foreground mb-6">
              We'll analyze your website and generate 30 days of optimized content in minutes.
            </p>

            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                size="lg"
              >
                Analyze Business
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">16</div>
                <div className="text-sm text-muted-foreground">Data Sources</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">30s</div>
                <div className="text-sm text-muted-foreground">Analysis Time</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">30</div>
                <div className="text-sm text-muted-foreground">Content Ideas</div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">
              {parsedURL?.domain ? `Analyzing ${parsedURL.domain}...` : 'Analyzing...'}
            </h2>

            <div className="space-y-4">
              <Progress value={progress} className="w-full" />

              <div className="text-center text-muted-foreground">
                <div className="font-semibold">{getStepName(currentStep)}</div>
                <div className="text-sm mt-1">{getStepDescription(currentStep)}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                {['Apify', 'OutScraper', 'Serper', 'SEMrush', 'YouTube', 'News', 'Weather', 'Maps'].map((source, i) => (
                  <div
                    key={source}
                    className={`p-2 rounded text-center text-sm ${
                      progress > i * 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Specialty Review */}
        {step === 'specialty-review' && specialty && intelligence && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Business Intelligence</h2>

              {/* Use IntelligenceDisplay Component */}
              <IntelligenceDisplay
                intelligence={intelligence}
                specialty={specialty}
              />
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('url-input')}
              >
                ← Start Over
              </Button>
              <Button
                onClick={handleProceedToUVP}
                size="lg"
              >
                Build Value Proposition →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: UVP Building */}
        {step === 'uvp-building' && specialty && intelligence && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Value Proposition Builder</h2>

              {/* Use EnhancedUVPWizard Component */}
              <EnhancedUVPWizard
                intelligence={intelligence}
                specialty={specialty}
                onComplete={handleGenerateCalendar}
              />
            </Card>
          </div>
        )}

        {/* Step 5: Content Preview */}
        {step === 'content-preview' && contentIdeas && specialty && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">30-Day Content Calendar</h2>
              <p className="text-muted-foreground mb-6">
                Generated {contentIdeas.length} content ideas optimized for your {specialty.specialty} specialty.
              </p>

              {/* Use ContentPreview Component */}
              <ContentPreview
                ideas={contentIdeas}
                specialty={specialty}
              />

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('specialty-review')}
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSaveToCalendar}
                  size="lg"
                >
                  Save to Calendar →
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
