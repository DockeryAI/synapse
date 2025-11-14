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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // State for intelligence data
  const [parsedURL, setParsedURL] = useState<ParsedURL | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceResult[] | null>(null);
  const [specialty, setSpecialty] = useState<SpecialtyDetection | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle URL analysis
   * Simulates intelligence gathering from multiple sources
   */
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('analyzing');
    setProgress(0);

    try {
      // Step 1: Parse URL (10%)
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate URL parsing
      const parsed: ParsedURL = {
        normalized: url.startsWith('http') ? url : `https://${url}`,
        domain: url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
        isValid: true
      };
      setParsedURL(parsed);

      if (!parsed.isValid) {
        throw new Error('Invalid URL format');
      }

      // Step 2: Gather Intelligence (10% → 70%)
      // Simulate progress during intelligence gathering
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 70));
      }, 2000);

      // Simulate intelligence gathering from multiple sources
      await new Promise(resolve => setTimeout(resolve, 8000));

      const intelligenceData: IntelligenceResult[] = [
        { source: 'apify', success: true, duration: 3200, data: { aboutPage: 'We specialize in custom woodworking...' } },
        { source: 'outscraper-business', success: true, duration: 2800, data: { name: 'Example Business' } },
        { source: 'outscraper-reviews', success: true, duration: 3100, data: { reviews: [] } },
        { source: 'serper-search', success: true, duration: 1500, data: { results: [] } },
        { source: 'serper-news', success: true, duration: 1200, data: { articles: [] } },
        { source: 'youtube-search', success: true, duration: 1800, data: { videos: [] } },
        { source: 'weather', success: true, duration: 800, data: { temp: 72 } },
        { source: 'maps', success: true, duration: 900, data: { location: {} } }
      ];

      clearInterval(progressInterval);
      setProgress(70);
      setIntelligence(intelligenceData);

      // Step 3: Detect Specialty (70% → 85%)
      setProgress(85);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const detectedSpecialty: SpecialtyDetection = {
        specialty: 'Custom Furniture & Woodworking',
        confidence: 87,
        reasoning: 'Based on website content analysis and service pages, this business focuses on custom-made furniture with specialty in reclaimed wood projects.',
        targetMarket: 'Homeowners seeking unique, handcrafted furniture',
        nicheKeywords: ['custom furniture', 'reclaimed wood', 'handcrafted', 'bespoke carpentry', 'artisan woodwork']
      };
      setSpecialty(detectedSpecialty);

      // Step 4: Complete (85% → 100%)
      setProgress(100);

      // Move to specialty review
      setTimeout(() => {
        setStep('specialty-review');
        setLoading(false);
      }, 500);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze business');
      setLoading(false);
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

    setLoading(true);
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
      setLoading(false);
    } catch (err: any) {
      console.error('Calendar generation error:', err);
      setError('Failed to generate calendar');
      setLoading(false);
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
            <h2 className="text-2xl font-semibold mb-4">Analyzing {parsedURL?.domain}...</h2>

            <div className="space-y-4">
              <Progress value={progress} className="w-full" />

              <div className="text-center text-muted-foreground">
                {progress < 10 && 'Parsing URL...'}
                {progress >= 10 && progress < 70 && 'Gathering business intelligence from 16 sources...'}
                {progress >= 70 && progress < 85 && 'Detecting business specialty...'}
                {progress >= 85 && 'Finalizing analysis...'}
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

              {/* Specialty Detection */}
              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">Detected Specialty</div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">
                    {specialty.specialty}
                  </div>
                  <Badge variant="secondary">
                    {specialty.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {specialty.reasoning}
                </p>
              </div>

              {/* Intelligence Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Card className="p-4 text-center bg-gray-50">
                  <div className="text-2xl font-bold text-green-600">
                    {intelligence.filter(i => i.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Data Sources
                  </div>
                </Card>

                <Card className="p-4 text-center bg-gray-50">
                  <div className="text-2xl font-bold text-blue-600">
                    {specialty.confidence}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence
                  </div>
                </Card>

                <Card className="p-4 text-center bg-gray-50">
                  <div className="text-2xl font-bold text-purple-600">
                    {specialty.nicheKeywords.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Keywords Found
                  </div>
                </Card>

                <Card className="p-4 text-center bg-gray-50">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(intelligence.reduce((sum, i) => sum + i.duration, 0) / 1000)}s
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Analysis Time
                  </div>
                </Card>
              </div>

              {/* Keywords */}
              <div className="mt-6">
                <div className="text-sm text-muted-foreground mb-2">Niche Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {specialty.nicheKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
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

              {/* Simplified UVP section - full wizard will be in Task 2 */}
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  Based on analysis of your website and {intelligence.length} data sources,
                  we've identified key value propositions for your {specialty.specialty} business.
                </p>

                <div className="space-y-3">
                  <Card className="p-4 border-2 border-primary cursor-pointer">
                    <div className="font-medium mb-2">Specialized in {specialty.specialty}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <Badge variant="secondary" className="mr-2">AI Analysis</Badge>
                      <Badge variant="secondary" className="mr-2">{specialty.confidence}% confidence</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      "{specialty.reasoning}"
                    </div>
                  </Card>

                  <Card className="p-4 hover:border-gray-300 cursor-pointer">
                    <div className="font-medium mb-2">Expert craftsmen with decades of experience</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <Badge variant="secondary" className="mr-2">Website Content</Badge>
                      <Badge variant="secondary" className="mr-2">85% confidence</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      "Mentioned 12 times across service pages"
                    </div>
                  </Card>

                  <Card className="p-4 hover:border-gray-300 cursor-pointer">
                    <div className="font-medium mb-2">Sustainable materials and eco-friendly practices</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <Badge variant="secondary" className="mr-2">Customer Reviews</Badge>
                      <Badge variant="secondary" className="mr-2">78% confidence</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      "Customers mentioned 'sustainability' in 23 reviews"
                    </div>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateCalendar}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Generating...' : 'Generate 30-Day Calendar →'}
                </Button>
              </div>
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

              {/* Content Preview Grid */}
              <div className="space-y-6">
                {[1, 2, 3, 4].map(week => {
                  const weekIdeas = contentIdeas.slice((week - 1) * 7, week * 7);
                  return (
                    <div key={week}>
                      <h3 className="font-semibold mb-3">Week {week}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weekIdeas.map(idea => (
                          <Card key={idea.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium mb-1">{idea.topic}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(idea.scheduledDate).toLocaleDateString()}
                                </div>
                              </div>

                              <Badge variant={
                                idea.contentType === 'educational' ? 'default' :
                                idea.contentType === 'promotional' ? 'secondary' :
                                'outline'
                              }>
                                {idea.contentType}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="outline" className="text-xs">
                                {idea.platform}
                              </Badge>

                              <Badge variant="secondary" className="text-xs">
                                🎯 Specialty-focused
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

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
