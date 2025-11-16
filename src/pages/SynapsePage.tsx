/**
 * MARBA SYNAPSE - BREAKTHROUGH CONTENT ENGINE
 *
 * The complete synapse system with real intelligence integration.
 * This page provides the full demo with all features:
 * - Auto-location detection from URL
 * - Smart industry selection (300+ NAICS codes)
 * - Real data from 14+ intelligence sources (Serper 8 endpoints, Website Analyzer, YouTube, Perplexity, OutScraper, Weather, SEMrush)
 * - Connection discovery via OpenAI embeddings
 * - Multi-format content generation
 * - Psychological optimization
 * - Humor enhancement with edginess control
 * - Provenance tracking
 * - Performance timing tracking
 *
 * Created: 2025-11-13
 * Updated: 2025-11-15 (Added timer, disabled NewsAPI/Reddit)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, AlertCircle, CheckCircle, Copy, Link as LinkIcon, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SynapseLoadingScreen } from '@/components/synapse/SynapseLoadingScreen';
import { Badge } from '@/components/ui/badge';
import { IndustrySelector } from '@/components/onboarding-v5/IndustrySelector';
import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { deepContextBuilder } from '@/services/intelligence/deepcontext-builder.service';
import { generateSynapses } from '@/services/synapse/SynapseGenerator';
import { SynapseContentGenerator } from '@/services/synapse/generation/SynapseContentGenerator';
import { ProvenanceViewer } from '@/components/synapse/ProvenanceViewer';
import { EdginessSlider } from '@/components/synapse/EdginessSlider';
import { ContentEnhancements } from '@/components/synapse/ContentEnhancements';
import { HumorOptimizer } from '@/services/synapse/generation/HumorOptimizer';
import type { SynapseInsight } from '@/types/synapse.types';
import type { SynapseContent, HumorEnhancementResult, EdginessLevel, Platform } from '@/types/synapseContent.types';

export function SynapsePage() {
  // Form inputs
  const [testUrl, setTestUrl] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  const [detectedLocation, setDetectedLocation] = useState<any>(null); // Full LocationResult with allLocations
  const [selectedLocations, setSelectedLocations] = useState<Array<{ city: string; state: string }>>([]); // User's choices (multiple)
  const [manualLocationCity, setManualLocationCity] = useState('');
  const [manualLocationState, setManualLocationState] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['linkedin', 'facebook']); // Default platforms
  const [viewingPlatform, setViewingPlatform] = useState<Platform>('linkedin'); // Platform currently being viewed in results

  // State
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SynapseInsight[] | null>(null);
  const [generatedContent, setGeneratedContent] = useState<SynapseContent[] | null>(null);

  // Timer state
  const [timings, setTimings] = useState<{
    total: number;
    intelligence: number;
    synapse: number;
    content: number;
  } | null>(null);
  const [runStartTime, setRunStartTime] = useState<number | null>(null);

  // Humor enhancement state
  const [humorEnhancements, setHumorEnhancements] = useState<Record<string, HumorEnhancementResult>>({});
  const [edginessLevels, setEdginessLevels] = useState<Record<string, EdginessLevel>>({});
  const [enhancingContent, setEnhancingContent] = useState<string | null>(null);

  /**
   * Toggle location selection
   */
  const toggleLocationSelection = (location: { city: string; state: string }) => {
    setSelectedLocations(prev => {
      const isSelected = prev.some(loc => loc.city === location.city && loc.state === location.state);
      if (isSelected) {
        return prev.filter(loc => !(loc.city === location.city && loc.state === location.state));
      } else {
        return [...prev, location];
      }
    });
  };

  /**
   * Toggle select all locations
   */
  const toggleSelectAll = () => {
    if (!detectedLocation?.allLocations) return;

    const allSelected = selectedLocations.length === detectedLocation.allLocations.length;
    if (allSelected) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations([...detectedLocation.allLocations]);
    }
  };

  /**
   * Check if location is selected
   */
  const isLocationSelected = (location: { city: string; state: string }) => {
    return selectedLocations.some(loc => loc.city === location.city && loc.state === location.state);
  };

  /**
   * Add manual location
   */
  const addManualLocation = () => {
    if (!manualLocationCity.trim() || !manualLocationState.trim()) {
      alert('Please enter both city and state');
      return;
    }

    const newLocation = {
      city: manualLocationCity.trim(),
      state: manualLocationState.trim().toUpperCase()
    };

    // Check if already exists
    if (selectedLocations.some(loc => loc.city === newLocation.city && loc.state === newLocation.state)) {
      alert('This location is already in the list');
      return;
    }

    setSelectedLocations([...selectedLocations, newLocation]);
    setManualLocationCity('');
    setManualLocationState('');
  };

  /**
   * Remove location
   */
  const removeLocation = (location: { city: string; state: string }) => {
    setSelectedLocations(prev => prev.filter(loc => !(loc.city === location.city && loc.state === location.state)));
  };

  /**
   * Update URL immediately without triggering detection
   */
  const handleUrlChange = (url: string) => {
    setTestUrl(url);
    if (url.length < 10) {
      setDetectedLocation(null);
      setSelectedLocations([]);
    }
  };

  /**
   * Debounced location detection - runs 800ms after user stops typing
   */
  useEffect(() => {
    if (testUrl.length < 10) return;

    const timeoutId = setTimeout(async () => {
      setDetectingLocation(true);
      try {
        const location = await locationDetectionService.detectLocation(
          testUrl,
          selectedIndustry?.displayName
        );

        if (location && location.confidence > 0.5) {
          setDetectedLocation(location); // Store full result
          // Auto-select all locations by default
          if (!location.hasMultipleLocations) {
            setSelectedLocations([{
              city: location.city,
              state: location.state
            }]);
          } else {
            // Select all locations by default
            setSelectedLocations(location.allLocations || [{
              city: location.city,
              state: location.state
            }]);
          }
          console.log('[Synapse] Auto-detected location:', location);
        } else {
          console.log('[Synapse] Location detection returned no results (CORS blocked or not found)');
        }
      } catch (error) {
        console.error('[Synapse] Location detection failed:', error);
      } finally {
        setDetectingLocation(false);
      }
    }, 800); // 800ms debounce

    // Cleanup function - cancel timeout if user keeps typing
    return () => clearTimeout(timeoutId);
  }, [testUrl, selectedIndustry]);

  /**
   * Run complete Synapse discovery with REAL intelligence
   */
  const runSynapseDiscovery = async () => {
    if (!testUrl || !selectedIndustry) {
      alert('Please enter a URL and select an industry');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setGeneratedContent(null);
    setTimings(null);

    // Start timer
    const startTime = Date.now();
    setRunStartTime(startTime);

    try {
      console.log('[Synapse] Starting breakthrough content discovery...');
      console.log('[Synapse] URL:', testUrl);
      console.log('[Synapse] Industry:', selectedIndustry.displayName);
      console.log('[Synapse] Selected Locations:', selectedLocations);
      console.log('[Synapse] Target Platforms:', selectedPlatforms);

      // Use first selected location for demo (full multi-location support coming soon)
      const primaryLocation = selectedLocations[0] || { city: 'New York', state: 'NY' };

      // Step 1: Build DeepContext with ALL intelligence sources
      console.log('[Synapse] Step 1/4: Gathering intelligence from 16+ sources...');
      const intelligenceStartTime = Date.now();

      // Create synthetic brand data for demo mode (no database lookup required)
      // Normalize URL to ensure it has https:// protocol
      const normalizedUrl = testUrl.match(/^https?:\/\//i) ? testUrl : `https://${testUrl}`;

      const syntheticBrand = {
        id: 'demo',
        name: new URL(normalizedUrl).hostname.split('.')[0] || 'Demo Business',
        website: normalizedUrl,
        industry: selectedIndustry.displayName,
        location: {
          city: primaryLocation.city,
          state: primaryLocation.state
        },
        keywords: selectedIndustry.keywords || [selectedIndustry.displayName],
        description: `${selectedIndustry.displayName} business in ${primaryLocation.city}, ${primaryLocation.state}`,
        created_at: new Date().toISOString()
      };

      const deepContextResult = await deepContextBuilder.buildDeepContext({
        brandId: 'demo',
        brandData: syntheticBrand, // Pass brand data directly (demo mode, no database lookup)
        includeYouTube: true,
        includeOutScraper: true,
        includeNews: false, // DISABLED: NewsAPI.ai has insufficient data coverage
        includeWeather: true,
        includeSerper: true, // Now uses all 8 Serper endpoints (Search, News, Trends, Autocomplete, Places, Images, Videos, Shopping)
        includeSemrush: true,
        includeWebsiteAnalysis: true, // NEW: Claude AI-powered website messaging extraction
        includeReddit: false, // DISABLED: OAuth errors, not critical
        includePerplexity: true, // NEW: Perplexity local event intelligence
        cacheResults: true,
        forceFresh: true // ALWAYS gather fresh intelligence to understand customer offerings and specialization
      });

      const intelligenceEndTime = Date.now();
      const intelligenceTime = Math.round((intelligenceEndTime - intelligenceStartTime) / 1000);

      console.log('[Synapse] ✅ Intelligence gathered:', {
        dataPoints: deepContextResult.metadata.dataPointsCollected,
        sources: deepContextResult.metadata.dataSourcesUsed,
        buildTime: `${deepContextResult.metadata.buildTimeMs}ms`,
        totalTime: `${intelligenceTime}s`
      });

      // Step 2: Pass FULL DeepContext to Synapse Generator (includes website analysis!)
      console.log('[Synapse] Step 2/4: Discovering breakthrough connections...');
      console.log('[Synapse] Passing DeepContext with', deepContextResult.metadata.dataPointsCollected, 'data points');
      const synapseStartTime = Date.now();

      const synapseResult = await generateSynapses({
        business: {
          name: new URL(normalizedUrl).hostname.split('.')[0] || 'Business',
          industry: selectedIndustry.displayName,
          location: {
            city: selectedLocations[0]?.city || 'New York',
            state: selectedLocations[0]?.state || 'NY'
          }
        },
        intelligence: deepContextResult.context, // PASS THE FULL DEEPCONTEXT!
        detailedDataPoints: deepContextResult.metadata.detailedDataPoints // PASS RAW DATA POINTS FOR PROVENANCE!
      });

      const synapseEndTime = Date.now();
      const synapseTime = Math.round((synapseEndTime - synapseStartTime) / 1000);

      console.log('[Synapse] ✅ Synapses discovered:', synapseResult.synapses.length, `(${synapseTime}s)`);
      setResults(synapseResult.synapses);

      // Step 4: Generate content from breakthrough insights
      if (synapseResult.synapses.length > 0) {
        console.log('[Synapse] Step 3/4: Generating breakthrough content...');
        const contentStartTime = Date.now();
        const contentGenerator = new SynapseContentGenerator();

        const businessProfile = {
          name: new URL(normalizedUrl).hostname.split('.')[0] || 'Business',
          industry: selectedIndustry.displayName,
          targetAudience: selectedLocations.length > 1
            ? `${selectedIndustry.displayName} customers in ${selectedLocations.length} locations`
            : `${selectedIndustry.displayName} customers in ${selectedLocations[0]?.city || 'the area'}`,
          brandVoice: 'professional' as const,
          contentGoals: ['engagement', 'lead-generation', 'thought-leadership'] as const
        };

        // Generate content for ALL selected platforms
        const contentResult = await contentGenerator.generate(
          synapseResult.synapses,
          businessProfile,
          {
            maxContent: 15,
            multiFormat: false,
            minImpactScore: 0.6,
            channel: 'all',
            platform: selectedPlatforms[0] || 'linkedin' as 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'generic',
            platforms: selectedPlatforms, // Pass all selected platforms
            useFrameworks: true
          }
        );

        const contentEndTime = Date.now();
        const contentTime = Math.round((contentEndTime - contentStartTime) / 1000);

        console.log('[Synapse] ✅ Content generated:', contentResult.content.length, `pieces (${contentTime}s)`);
        setGeneratedContent(contentResult.content);

        // Set final timings
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        setTimings({
          intelligence: intelligenceTime,
          synapse: synapseTime,
          content: contentTime,
          total: totalTime
        });
        console.log('[Synapse] ⏱️ Timing breakdown:', {
          intelligence: `${intelligenceTime}s`,
          synapse: `${synapseTime}s`,
          content: `${contentTime}s`,
          total: `${totalTime}s`
        });
      } else {
        // No synapses generated, set partial timings
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        setTimings({
          intelligence: intelligenceTime,
          synapse: synapseTime,
          content: 0,
          total: totalTime
        });
      }

      console.log('[Synapse] 🎉 Discovery complete!');
      setLoading(false);

    } catch (err) {
      console.error('[Synapse] Discovery failed:', err);
      console.error('[Synapse] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('[Synapse] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };

  /**
   * Add humor to content
   */
  const handleAddHumor = async (content: SynapseContent) => {
    try {
      setEnhancingContent(content.id);

      const edginess = edginessLevels[content.id] || 50;
      const optimizer = new HumorOptimizer();

      const normalizedUrl = testUrl.match(/^https?:\/\//i) ? testUrl : `https://${testUrl}`;
      const businessProfile = {
        name: new URL(normalizedUrl).hostname.split('.')[0] || 'Business',
        industry: selectedIndustry?.displayName || 'General',
        targetAudience: `${selectedIndustry?.displayName} customers`,
        brandVoice: 'professional' as const,
        contentGoals: ['engagement'] as const
      };

      const result = await optimizer.enhance(content, businessProfile, edginess);

      setHumorEnhancements(prev => ({
        ...prev,
        [content.id]: result
      }));

      console.log('[Synapse] Humor enhancement complete:', result);
    } catch (err) {
      console.error('[Synapse] Humor enhancement error:', err);
      alert(`Failed to add humor: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEnhancingContent(null);
    }
  };

  // Show loading screen during analysis
  if (loading) {
    return <SynapseLoadingScreen contentCount={15} platformCount={selectedPlatforms.length} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🧠 MARBA Synapse
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              Breakthrough Content Discovery with 14+ Intelligence Sources
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              Serper 8x • Website AI • YouTube • Perplexity • OutScraper • Weather • SEMrush
            </p>
          </motion.div>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Business Information
          </h2>

          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Website URL
              </label>
              <div className="relative">
                <Input
                  type="url"
                  value={testUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.yourwebsite.com"
                  className="w-full h-12 text-lg pl-10"
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                {detectingLocation && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 animate-spin" />
                )}
              </div>
            </div>

            {/* Industry Selector */}
            <div>
              <IndustrySelector
                websiteUrl={testUrl}
                onIndustrySelected={(industry) => {
                  console.log('[Synapse] Industry selected:', industry);
                  setSelectedIndustry(industry);
                }}
                className="w-full"
              />
            </div>

            {/* Location Display - Auto-detected + Manual */}
            {(detectedLocation || selectedLocations.length > 0 || testUrl.length >= 10) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-4"
              >
                {/* Detection failed - Manual entry required */}
                {!detectedLocation && !detectingLocation && testUrl.length >= 10 && selectedLocations.length === 0 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Could not auto-detect location
                      </span>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Please manually enter the business location(s) below
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-detected locations */}
                {detectedLocation && detectedLocation.hasMultipleLocations && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                          Multiple Locations Detected
                        </span>
                        <span className="text-xs text-green-700 dark:text-green-300">
                          ({selectedLocations.length} of {detectedLocation.allLocations?.length || 0} selected)
                        </span>
                      </div>
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline"
                      >
                        {selectedLocations.length === detectedLocation.allLocations?.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {detectedLocation.allLocations?.map((loc: any, idx: number) => (
                        <label
                          key={idx}
                          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={isLocationSelected(loc)}
                            onChange={() => toggleLocationSelection(loc)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                            {loc.city}, {loc.state}
                          </span>
                          <button
                            onClick={(e) => { e.preventDefault(); removeLocation(loc); }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove location"
                          >
                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single auto-detected location */}
                {detectedLocation && !detectedLocation.hasMultipleLocations && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {detectedLocation.city}, {detectedLocation.state}
                      </span>
                    </div>
                    <button
                      onClick={() => removeLocation({ city: detectedLocation.city, state: detectedLocation.state })}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Remove location"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}

                {/* Manual location entry */}
                <div className="space-y-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-green-700 dark:text-green-300" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Add Location Manually
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="City (e.g., Dallas)"
                      value={manualLocationCity}
                      onChange={(e) => setManualLocationCity(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      onKeyPress={(e) => e.key === 'Enter' && addManualLocation()}
                    />
                    <input
                      type="text"
                      placeholder="State (e.g., TX)"
                      value={manualLocationState}
                      onChange={(e) => setManualLocationState(e.target.value)}
                      maxLength={2}
                      className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 uppercase"
                      onKeyPress={(e) => e.key === 'Enter' && addManualLocation()}
                    />
                    <button
                      onClick={addManualLocation}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Show selected locations list if any exist */}
                {selectedLocations.length > 0 && !detectedLocation?.hasMultipleLocations && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Selected Locations ({selectedLocations.length}):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedLocations.map((loc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {loc.city}, {loc.state}
                          </span>
                          <button
                            onClick={() => removeLocation(loc)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove location"
                          >
                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Platform Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                Target Platforms
                <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">(Select at least one)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['linkedin', 'facebook', 'instagram', 'x', 'tiktok', 'youtube'] as Platform[]).map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  const platformConfig = {
                    linkedin: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      ),
                      label: 'LinkedIn',
                      color: 'blue'
                    },
                    facebook: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ),
                      label: 'Facebook',
                      color: 'indigo'
                    },
                    instagram: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                        </svg>
                      ),
                      label: 'Instagram',
                      color: 'pink'
                    },
                    x: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      ),
                      label: 'X',
                      color: 'slate'
                    },
                    tiktok: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      ),
                      label: 'TikTok',
                      color: 'purple'
                    },
                    youtube: {
                      icon: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      ),
                      label: 'YouTube',
                      color: 'red'
                    }
                  }[platform];

                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => {
                        setSelectedPlatforms(prev =>
                          prev.includes(platform)
                            ? prev.filter(p => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                      className={`
                        px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex flex-col items-center gap-2
                        ${isSelected
                          ? `border-${platformConfig.color}-500 bg-${platformConfig.color}-50 dark:bg-${platformConfig.color}-900/20 text-${platformConfig.color}-700 dark:text-${platformConfig.color}-300`
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      {platformConfig.icon}
                      {platformConfig.label}
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Please select at least one platform to generate optimized content
                </p>
              )}
            </div>

            {/* Run Button */}
            <Button
              onClick={runSynapseDiscovery}
              disabled={loading || !testUrl || !selectedIndustry || selectedPlatforms.length === 0}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Discovering Breakthroughs...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run Synapse Discovery
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Timer Display */}
        {timings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Run Time: {timings.total}s
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Performance breakdown
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Intelligence Gathering
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {timings.intelligence}s
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {Math.round((timings.intelligence / timings.total) * 100)}% of total
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Synapse Discovery
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {timings.synapse}s
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {Math.round((timings.synapse / timings.total) * 100)}% of total
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Content Generation
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {timings.content}s
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {timings.content > 0 ? Math.round((timings.content / timings.total) * 100) : 0}% of total
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Discovery Failed
                </h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Synapse Insights Display */}
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Breakthrough Insights ({results.length})
              </h2>
            </div>

            <div className="grid gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-800"
                >
                  <div className="space-y-4">
                    {/* Confidence Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {result.thinkingStyle.toUpperCase()}
                      </Badge>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>

                    {/* Insight Content */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {result.insight}
                      </h3>
                      <p className="text-gray-600 dark:text-slate-400">
                        {result.whyProfound}
                      </p>
                    </div>

                    {/* Why Now */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Why Now
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {result.whyNow}
                      </p>
                    </div>

                    {/* Content Angle */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Content Angle
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {result.contentAngle}
                      </p>
                    </div>

                    {/* Expected Reaction */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Expected Reaction
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {result.expectedReaction}
                      </p>
                    </div>

                    {/* Evidence */}
                    {result.evidence && result.evidence.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                          Evidence
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {result.evidence.map((ev, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-slate-400">
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Generated Content Display */}
        {generatedContent && generatedContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Generated Content ({generatedContent.length} pieces)
                </h2>
              </div>

              {/* Platform Switcher */}
              <div className="flex gap-2">
                {(['linkedin', 'facebook', 'instagram', 'x', 'tiktok', 'youtube'] as Platform[]).map((platform) => {
                  const platformConfig = {
                    linkedin: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      ),
                      label: 'LinkedIn',
                      color: 'blue'
                    },
                    facebook: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ),
                      label: 'Facebook',
                      color: 'indigo'
                    },
                    instagram: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      ),
                      label: 'Instagram',
                      color: 'pink'
                    },
                    x: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      ),
                      label: 'X',
                      color: 'slate'
                    },
                    tiktok: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      ),
                      label: 'TikTok',
                      color: 'purple'
                    },
                    youtube: {
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      ),
                      label: 'YouTube',
                      color: 'red'
                    }
                  }[platform];

                  const isActive = viewingPlatform === platform;

                  return (
                    <button
                      key={platform}
                      onClick={() => setViewingPlatform(platform)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive
                          ? `bg-${platformConfig.color}-100 dark:bg-${platformConfig.color}-900/30 text-${platformConfig.color}-700 dark:text-${platformConfig.color}-300 border-2 border-${platformConfig.color}-500`
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {platformConfig.icon}
                      <span className="text-sm">{platformConfig.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6">
              {generatedContent.map((content) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-800"
                >
                  <div className="space-y-4">
                    {/* Header: Format and Scores */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {content.format.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {content.meta.tone}
                        </span>
                        {/* Platform badges */}
                        <div className="flex gap-2">
                          {selectedPlatforms.map((platform) => {
                            const platformConfig = {
                              linkedin: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                ),
                                label: 'LinkedIn'
                              },
                              facebook: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                ),
                                label: 'Facebook'
                              },
                              instagram: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                                  </svg>
                                ),
                                label: 'Instagram'
                              },
                              x: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                ),
                                label: 'X'
                              },
                              tiktok: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                  </svg>
                                ),
                                label: 'TikTok'
                              },
                              youtube: {
                                icon: (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                ),
                                label: 'YouTube'
                              }
                            }[platform];
                            return (
                              <Badge
                                key={platform}
                                variant="outline"
                                className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 flex items-center gap-1"
                              >
                                {platformConfig.icon} {platformConfig.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-slate-400">Engagement</div>
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {Math.round(content.prediction.engagementScore * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-slate-400">Viral</div>
                          <div className="font-bold text-purple-600 dark:text-purple-400">
                            {Math.round(content.prediction.viralPotential * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-slate-400">Lead Gen</div>
                          <div className="font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(content.prediction.leadGeneration * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="space-y-3">
                      {(() => {
                        // Get platform-specific content or fall back to default
                        const platformContent = (content as any).platformVariants?.[viewingPlatform] || content.content;

                        // Debug logging
                        console.log('[SynapsePage] Content object:', content);
                        console.log('[SynapsePage] Viewing platform:', viewingPlatform);
                        console.log('[SynapsePage] Platform variants:', (content as any).platformVariants);
                        console.log('[SynapsePage] Platform content:', platformContent);

                        return (
                          <>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                Headline
                              </h4>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {platformContent.headline}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                Hook
                              </h4>
                              <p className="text-gray-700 dark:text-slate-300">
                                {platformContent.hook}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                Body
                              </h4>
                              <p className="text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                                {platformContent.body}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                Call to Action
                              </h4>
                              <p className="text-gray-700 dark:text-slate-300 font-semibold">
                                {platformContent.cta}
                              </p>
                            </div>

                            {platformContent.hashtags && platformContent.hashtags.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {platformContent.hashtags.map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-sm text-blue-600 dark:text-blue-400"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Psychology Section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        🧠 Psychology & Strategy
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-slate-400">
                            Principle:
                          </span>
                          <span className="ml-2 text-gray-800 dark:text-slate-200">
                            {content.psychology.principle}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-slate-400">
                            Trigger:
                          </span>
                          <span className="ml-2 text-gray-800 dark:text-slate-200">
                            {content.psychology.trigger.type} ({Math.round(content.psychology.trigger.strength * 100)}%)
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-slate-400">
                            Technique:
                          </span>
                          <span className="ml-2 text-gray-800 dark:text-slate-200">
                            {content.psychology.persuasionTechnique}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600 dark:text-slate-400">
                            Pacing:
                          </span>
                          <span className="ml-2 text-gray-800 dark:text-slate-200">
                            {content.optimization.pacing}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="font-semibold text-gray-600 dark:text-slate-400">
                          Expected Reaction:
                        </span>
                        <p className="text-gray-700 dark:text-slate-300 mt-1">
                          {content.psychology.expectedReaction}
                        </p>
                      </div>
                    </div>

                    {/* Provenance Tracking */}
                    {content.provenance && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <ProvenanceViewer provenance={content.provenance} />
                      </div>
                    )}

                    {/* Content Enhancements */}
                    {results && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                          🎯 Content Enhancements
                        </h4>
                        <ContentEnhancements
                          content={content}
                          business={{
                            name: (testUrl.match(/^https?:\/\//i) ? new URL(testUrl) : new URL(`https://${testUrl}`)).hostname.split('.')[0] || 'Business',
                            industry: selectedIndustry?.displayName || 'General',
                            targetAudience: `${selectedIndustry?.displayName} customers`,
                            brandVoice: 'professional' as const,
                            contentGoals: ['engagement'] as const
                          }}
                          insight={results.find(r => r.id === content.insightId) || results[0]}
                          onContentUpdate={(updated) => {
                            setGeneratedContent(prev =>
                              prev ? prev.map(c => c.id === updated.id ? updated : c) : null
                            );
                          }}
                        />
                      </div>
                    )}

                    {/* Humor Enhancement Section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            😄 Add Professional Humor
                          </h4>
                          {humorEnhancements[content.id] && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              ✓ Enhanced
                            </Badge>
                          )}
                        </div>

                        {/* Edginess Slider */}
                        <EdginessSlider
                          value={edginessLevels[content.id] || 50}
                          onChange={(value) => setEdginessLevels(prev => ({ ...prev, [content.id]: value }))}
                        />

                        {/* Add Humor Button */}
                        <Button
                          onClick={() => handleAddHumor(content)}
                          disabled={enhancingContent === content.id}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {enhancingContent === content.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding Humor...
                            </>
                          ) : (
                            <>
                              😄 {humorEnhancements[content.id] ? 'Refresh' : 'Add'} Humor
                            </>
                          )}
                        </Button>

                        {/* Show Enhanced Content */}
                        {humorEnhancements[content.id] && (
                          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <h5 className="font-bold text-purple-900 dark:text-purple-100">
                                Humor-Enhanced Version
                              </h5>
                            </div>

                            <div className="space-y-3 text-sm">
                              <div>
                                <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                  Headline
                                </div>
                                <div className="text-purple-900 dark:text-purple-100">
                                  {humorEnhancements[content.id].enhanced.headline}
                                </div>
                              </div>

                              <div>
                                <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                  Hook
                                </div>
                                <div className="text-purple-900 dark:text-purple-100">
                                  {humorEnhancements[content.id].enhanced.hook}
                                </div>
                              </div>

                              <div>
                                <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                  Body
                                </div>
                                <div className="text-purple-900 dark:text-purple-100 whitespace-pre-wrap">
                                  {humorEnhancements[content.id].enhanced.body}
                                </div>
                              </div>

                              <div>
                                <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                  CTA
                                </div>
                                <div className="text-purple-900 dark:text-purple-100 font-semibold">
                                  {humorEnhancements[content.id].enhanced.cta}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                                <div className="text-xs text-purple-700 dark:text-purple-300">
                                  <strong>Enhancements Applied:</strong>
                                  <ul className="list-disc list-inside mt-1">
                                    {humorEnhancements[content.id].enhancementsApplied.map((enhancement, idx) => (
                                      <li key={idx}>{enhancement}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const fullText = `${content.content.headline}\n\n${content.content.hook}\n\n${content.content.body}\n\n${content.content.cta}${content.content.hashtags ? '\n\n' + content.content.hashtags.map(t => '#' + t).join(' ') : ''}`;
                        navigator.clipboard.writeText(fullText);
                      }}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Full Content
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && !results && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Discover Breakthroughs
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Enter a URL and select an industry above to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
