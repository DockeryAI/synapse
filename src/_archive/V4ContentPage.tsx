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
  Calendar,
  RefreshCw,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBrand } from '@/hooks/useBrand';
import { V4ContentGenerationPanel } from '@/components/v4/V4ContentGenerationPanel';
import { v4CalendarIntegration } from '@/services/v4';
import { getUVPByBrand, recoverDriversFromSession, scanBrandWebsiteForVoice } from '@/services/database/marba-uvp.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { GeneratedContent } from '@/services/v4/types';

export function V4ContentPage() {
  const navigate = useNavigate();
  const { currentBrand: brand, loading: brandLoading } = useBrand();
  const [uvp, setUvp] = useState<CompleteUVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [scanningVoice, setScanningVoice] = useState(false);
  const [voiceScanResult, setVoiceScanResult] = useState<{
    success: boolean;
    tone?: string[];
    storiesCount?: number;
    error?: string;
  } | null>(null);

  // Load UVP for current brand
  useEffect(() => {
    async function loadUVP() {
      // Wait for brand context to finish loading before checking
      if (brandLoading) {
        return; // Still loading, don't set error yet
      }

      if (!brand?.id) {
        setError('No brand selected');
        setLoading(false);
        return;
      }

      try {
        console.log('[V4ContentPage] Loading UVP for brand:', brand.id);

        // Use the marba-uvp service which properly reconstructs CompleteUVP from columns
        let uvpData = await getUVPByBrand(brand.id);

        if (!uvpData) {
          setError('No UVP found. Please complete the onboarding first.');
          setLoading(false);
          return;
        }

        // Check if drivers are missing and attempt recovery from session data
        const hasDrivers = (uvpData.targetCustomer?.emotionalDrivers?.length || 0) > 0 ||
                          (uvpData.transformationGoal?.emotionalDrivers?.length || 0) > 0;

        if (!hasDrivers) {
          console.log('[V4ContentPage] UVP missing drivers, attempting recovery from session...');
          const recoveryResult = await recoverDriversFromSession(brand.id);

          if (recoveryResult.updated) {
            console.log('[V4ContentPage] Drivers recovered:', {
              emotional: recoveryResult.emotionalDriversCount,
              functional: recoveryResult.functionalDriversCount
            });
            // Re-fetch UVP with recovered drivers
            uvpData = await getUVPByBrand(brand.id) || uvpData;
          } else {
            console.log('[V4ContentPage] No drivers found in session data');
          }
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
  }, [brand?.id, brandLoading]);

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

  // Handle brand voice scan
  const handleScanBrandVoice = async () => {
    if (!brand?.id) return;

    setScanningVoice(true);
    setVoiceScanResult(null);

    try {
      console.log('[V4ContentPage] Scanning brand website for voice...');
      const result = await scanBrandWebsiteForVoice(brand.id);

      if (result.success) {
        setVoiceScanResult({
          success: true,
          tone: result.brandVoice?.tone,
          storiesCount: result.customerStoriesCount
        });

        // Reload UVP to get the new brand voice
        const updatedUvp = await getUVPByBrand(brand.id);
        if (updatedUvp) {
          setUvp(updatedUvp);
        }
      } else {
        setVoiceScanResult({
          success: false,
          error: result.error
        });
      }
    } catch (err) {
      console.error('[V4ContentPage] Brand voice scan failed:', err);
      setVoiceScanResult({
        success: false,
        error: err instanceof Error ? err.message : 'Scan failed'
      });
    } finally {
      setScanningVoice(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Synapse Engine...</p>
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

      {/* UVP Summary Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-xs font-medium text-purple-200 mb-1">Your Value Proposition</p>
              <p className="text-sm font-medium line-clamp-2">
                {uvp.valuePropositionStatement}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Brand Voice Status/Scan Button */}
              {uvp.brandVoice ? (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-xs">{uvp.brandVoice.tone?.join(', ') || 'Detected'}</span>
                  <button
                    onClick={handleScanBrandVoice}
                    disabled={scanningVoice}
                    className="ml-1 hover:bg-white/20 rounded p-0.5"
                    title="Re-scan brand voice"
                  >
                    <RefreshCw className={`w-3 h-3 ${scanningVoice ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleScanBrandVoice}
                  disabled={scanningVoice}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs h-7"
                >
                  {scanningVoice ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 mr-1.5" />
                      Scan Brand Voice
                    </>
                  )}
                </Button>
              )}

              {/* Industry Badge */}
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {uvp.targetCustomer?.industry || 'General'}
              </span>
            </div>
          </div>

          {/* Voice Scan Result Toast */}
          {voiceScanResult && (
            <div className={`mt-3 text-xs px-3 py-2 rounded ${
              voiceScanResult.success
                ? 'bg-green-500/20 text-green-100'
                : 'bg-red-500/20 text-red-100'
            }`}>
              {voiceScanResult.success ? (
                <>
                  Brand voice detected: {voiceScanResult.tone?.join(', ')}
                  {voiceScanResult.storiesCount && voiceScanResult.storiesCount > 0 && (
                    <span className="ml-2">
                      + {voiceScanResult.storiesCount} customer stories
                    </span>
                  )}
                </>
              ) : (
                <span>Scan failed: {voiceScanResult.error}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <V4ContentGenerationPanel
            uvp={uvp}
            brandId={brand?.id}
            onContentGenerated={handleContentGenerated}
            onSaveToCalendar={handleSaveToCalendar}
          />
        </React.Suspense>
      </main>
    </div>
  );
}

export default V4ContentPage;
