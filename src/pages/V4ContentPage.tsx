/**
 * V4 Content Generation Page
 *
 * Main page for V4 Content Engine after UVP completion.
 * Provides full access to Easy Mode and Power Mode content generation.
 *
 * Created: 2025-11-27
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBrand } from '@/contexts/BrandContext';
import { V4ContentGenerationPanel } from '@/components/v4/V4ContentGenerationPanel';
import { v4CalendarIntegration } from '@/services/v4';
import { getUVPByBrand } from '@/services/database/marba-uvp.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { GeneratedContent } from '@/services/v4/types';

export function V4ContentPage() {
  const navigate = useNavigate();
  const { currentBrand: brand } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Load UVP for current brand
  useEffect(() => {
    async function loadUVP() {
      if (!brand?.id) {
        setError('No brand selected');
        setLoading(false);
        return;
      }

      try {
        console.log('[V4ContentPage] Loading UVP for brand:', brand.id);

        // Use the marba-uvp service which properly reconstructs CompleteUVP from columns
        const uvpData = await getUVPByBrand(brand.id);

        if (!uvpData) {
          setError('No UVP found. Please complete the onboarding first.');
          setLoading(false);
          return;
        }

        console.log('[V4ContentPage] UVP loaded successfully:', uvpData.valuePropositionStatement?.substring(0, 50) + '...');
        setUvp(uvpData);
        setLoading(false);
      } catch (err) {
        console.error('[V4ContentPage] Error loading UVP:', err);
        setError('Failed to load UVP data');
        setLoading(false);
      }
    }

    loadUVP();
  }, [brand?.id]);

  // Handle content save to calendar using V4 Calendar Integration
  const handleSaveToCalendar = async (content: GeneratedContent) => {
    if (!brand?.id) return;

    try {
      // Use the V4 Calendar Integration to save to content_calendar_items
      // This bridges V4 content to the existing calendar system
      await v4CalendarIntegration.saveToCalendar(content, brand.id, {
        status: 'draft',
      });

      setSavedCount(prev => prev + 1);
      console.log('[V4ContentPage] Content saved to calendar');
    } catch (err) {
      console.error('Error saving content to calendar:', err);
    }
  };

  // Handle content generated callback
  const handleContentGenerated = (content: GeneratedContent[]) => {
    console.log(`[V4ContentPage] ${content.length} pieces generated`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading V4 Content Engine...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !uvp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              UVP Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'Please complete the onboarding flow to create your UVP first.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate('/onboarding')}>
                Start Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  V4 Content Engine
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {savedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-sm text-green-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savedCount} saved
                </motion.div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/content-calendar')}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* UVP Summary Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-200 mb-1">Your Value Proposition</p>
              <p className="text-sm font-medium line-clamp-2">
                {uvp.valuePropositionStatement}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {uvp.targetCustomer?.industry || 'General'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <V4ContentGenerationPanel
          uvp={uvp}
          brandId={brand?.id}
          onContentGenerated={handleContentGenerated}
          onSaveToCalendar={handleSaveToCalendar}
        />
      </main>
    </div>
  );
}

export default V4ContentPage;
