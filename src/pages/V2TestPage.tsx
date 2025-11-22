/**
 * V2 UVP Generation Test Page
 *
 * Simple page for testing the V2 UVP generation flow with real data.
 * No V1 dependencies - pure V2 testing environment.
 */

import { UVPGenerationFlow } from '@/components/v2/flows/UVPGenerationFlow';
import type { UVPResult } from '@/components/v2/flows/UVPGenerationFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, CheckCircle, Sparkles } from 'lucide-react';

export function V2TestPage() {
  const handleComplete = (result: UVPResult) => {
    console.log('[V2TestPage] UVP Generation Complete:', result);
    alert('UVP Generation Complete! Check console for details.');
  };

  const handleError = (error: Error) => {
    console.error('[V2TestPage] Error:', error);
    alert(`Error: ${error.message}`);
  };

  const handleCancel = () => {
    console.log('[V2TestPage] User canceled');
    alert('Generation canceled');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="text-center py-8">
          <Badge className="mb-4 bg-purple-500">V2 Test Environment</Badge>
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            V2 <span className="text-primary">UVP Generator</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Next-generation value proposition engine powered by Opus AI
          </p>
        </section>

        {/* Feature Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-blue-500/30">
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-gray-900 dark:text-white">Real-time Scraping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Live website analysis with no mock data
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-purple-500/30">
              <CardHeader>
                <Target className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-gray-900 dark:text-white">AI Extraction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Multi-model intelligence pipeline
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-green-500/30">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-gray-900 dark:text-white">Opus Synthesis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Premium quality UVP generation
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Test Mode Info */}
        <section>
          <Card className="max-w-3xl mx-auto border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle className="text-gray-900 dark:text-white">Test Mode Active</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                This environment uses real CORS proxies to scrape live websites.
                Enter any URL to test the complete V2 pipeline.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500">Real scraping</Badge>
                <Badge className="bg-green-500">Live AI extraction</Badge>
                <Badge className="bg-green-500">Opus synthesis</Badge>
                <Badge className="bg-green-500">EQ v2 scoring</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Flow */}
        <section>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <UVPGenerationFlow
                onComplete={handleComplete}
                onError={handleError}
                onCancel={handleCancel}
                enablePersistence={true}
                enableAnalytics={false}
              />
            </CardContent>
          </Card>
        </section>

        {/* Debug Info */}
        <section>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            V2 isolation maintained • Zero V1 dependencies
          </p>
        </section>
      </div>
    </div>
  );
}

export default V2TestPage;
