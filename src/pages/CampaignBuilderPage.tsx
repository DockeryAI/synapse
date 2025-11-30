/**
 * Campaign Builder Page - V2
 *
 * Full campaign builder interface with mode toggle,
 * template selection, and timeline visualization.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '@/hooks/useBrand';
import { ModeProvider } from '@/contexts/v2/ModeContext';
import { CampaignBuilder } from '@/components/v2/campaign-builder';
import { ModeToggle } from '@/components/v2/ModeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function CampaignBuilderPage() {
  const navigate = useNavigate();
  const { currentBrand } = useBrand();

  const handleComplete = (campaignId: string) => {
    console.log('[CampaignBuilderPage] Campaign created:', campaignId);
    navigate(`/dashboard?campaign=${campaignId}`);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (!currentBrand) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Please select or create a brand first to build campaigns.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Go to Onboarding
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ModeProvider defaultMode="campaign">
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        {/* Header */}
        <div className="border-b bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-muted rounded-md"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Campaign Builder
                    </h1>
                    <Badge className="bg-purple-500">V2</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentBrand.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Info Banner */}
          <Card className="mb-6 border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">AI-Powered Campaign Generation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose from 15 proven campaign templates, customize for your industry,
                and let AI generate a complete narrative arc with emotional progression.
              </p>
            </CardContent>
          </Card>

          {/* Campaign Builder */}
          <CampaignBuilder
            brandId={currentBrand.id}
            brandName={currentBrand.name}
            industry={currentBrand.industry}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </ModeProvider>
  );
}

export default CampaignBuilderPage;
