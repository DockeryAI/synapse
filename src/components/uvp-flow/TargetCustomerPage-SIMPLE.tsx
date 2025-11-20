/**
 * Target Customer Page - UVP Flow Step 2
 * SIMPLIFIED VERSION - Matches ProductServiceDiscoveryPage design
 *
 * Created: 2025-11-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Sparkles, CheckCircle2, AlertCircle, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UVPMilestoneProgress, type UVPStep } from './UVPMilestoneProgress';
import type { CustomerProfile } from '@/types/uvp-flow.types';
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';

interface TargetCustomerPageProps {
  businessName: string;
  industry?: string;
  websiteUrl?: string;
  websiteContent?: string[];
  websiteUrls?: string[];
  preloadedData?: any;
  value?: string;
  onChange?: (value: string) => void;
  onProfilesSelected?: (profiles: CustomerProfile[]) => void;
  onNext: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  className?: string;
  completedSteps?: UVPStep[];
  onStepClick?: (step: UVPStep) => void;
}

export function TargetCustomerPage({
  businessName,
  industry = '',
  websiteUrl = '',
  websiteContent = [],
  websiteUrls = [],
  preloadedData,
  value = '',
  onChange,
  onProfilesSelected,
  onNext,
  onBack,
  showProgress = true,
  progressPercentage = 20,
  className = '',
  completedSteps = [],
  onStepClick
}: TargetCustomerPageProps) {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<CustomerProfile[]>([]);
  // Start as loading if we don't have data yet
  const [isLoading, setIsLoading] = useState(!preloadedData || (preloadedData as any).loading === true);
  const hasLoadedPreloadedData = useRef(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerSegment, setNewCustomerSegment] = useState('');

  // Load preloaded data - ONLY use preloaded data, never auto-generate
  useEffect(() => {
    console.log('[TargetCustomerPage-SIMPLE] useEffect triggered', {
      hasPreloadedData: !!preloadedData,
      isLoading: preloadedData && (preloadedData as any).loading,
      hasProfiles: preloadedData && preloadedData.profiles && preloadedData.profiles.length,
      profilesCount: profiles.length,
      hasLoadedBefore: hasLoadedPreloadedData.current
    });

    // Check if data is still loading in background
    if (preloadedData && (preloadedData as any).loading) {
      console.log('[TargetCustomerPage-SIMPLE] ⏳ Data is loading in background...');
      setIsLoading(true);
      return;
    }

    // If we have pre-loaded data with profiles AND haven't loaded it before
    if (preloadedData && preloadedData.profiles && preloadedData.profiles.length > 0) {
      if (hasLoadedPreloadedData.current && profiles.length > 0) {
        console.log('[TargetCustomerPage-SIMPLE] ✓ Data already loaded, skipping');
        return;
      }

      console.log('[TargetCustomerPage-SIMPLE] 📥 Loading pre-loaded data:', preloadedData.profiles.length, 'profiles');
      setProfiles(preloadedData.profiles);
      setIsLoading(false);
      hasLoadedPreloadedData.current = true;
      return;
    }

    // If no preloadedData yet, just wait - progressive loading will provide it
    if (!preloadedData) {
      console.log('[TargetCustomerPage-SIMPLE] ⏳ Waiting for progressive loading...');
      setIsLoading(true);
      return;
    }

    // If we get here, preloadedData exists but has no profiles - show empty state
    console.log('[TargetCustomerPage-SIMPLE] No profiles found in preloaded data');
    setIsLoading(false);
  }, [preloadedData]);

  const handleExtractProfiles = async () => {
    setIsLoading(true);

    try {
      const result = await extractTargetCustomer(
        websiteContent,
        [],
        [],
        businessName
      );

      console.log('[TargetCustomerPage-SIMPLE] Extraction complete:', result.profiles.length);
      setProfiles(result.profiles as CustomerProfile[]);
    } catch (error) {
      console.error('[TargetCustomerPage-SIMPLE] Extraction failed:', error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (profile: CustomerProfile) => {
    setSelectedProfiles(prev => {
      const isAlreadySelected = prev.some(p => p.id === profile.id);

      const updated = isAlreadySelected
        ? prev.filter(p => p.id !== profile.id)
        : [...prev, profile];

      // Schedule callbacks for next tick to avoid setState during render
      setTimeout(() => {
        if (onChange) {
          onChange(updated.map(p => p.statement).join('; '));
        }
        if (onProfilesSelected) {
          onProfilesSelected(updated);
        }
      }, 0);

      return updated;
    });
  };

  const handleAddManualCustomer = () => {
    if (!newCustomerSegment.trim()) return;

    // Create new customer profile
    const newProfile: CustomerProfile = {
      id: `manual-${Date.now()}`,
      statement: newCustomerSegment.trim(),
      confidence: { overall: 100, dataQuality: 100, sourceCount: 1, modelAgreement: 100 },
      sources: [{
        id: `source-${Date.now()}`,
        type: 'manual-input' as const,
        name: 'Manual Input',
        url: '',
        extractedAt: new Date(),
        reliability: 100,
        dataPoints: 1
      }],
      evidenceQuotes: [],
      isManualInput: true
    };

    // Add to profiles list
    setProfiles(prev => [newProfile, ...prev]);

    // Auto-select it
    setSelectedProfiles(prev => [newProfile, ...prev]);

    // Reset form
    setNewCustomerSegment('');
    setShowAddForm(false);
  };

  const handleContinue = () => {
    // Ensure parent has latest selections before proceeding
    if (onProfilesSelected) {
      onProfilesSelected(selectedProfiles);
    }
    onNext();
  };

  const canProceed = selectedProfiles.length > 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Milestone Progress */}
        <UVPMilestoneProgress
          currentStep="customer"
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              UVP Step 2 of 6: Target Customer
            </span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Who is Your Target Customer?
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We've identified these potential customer segments for {businessName}.
            Select all profiles that match your target audience.
          </p>
        </motion.div>

      {/* Progress Summary */}
      {!isLoading && profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Selection Progress
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProfiles.length} of {profiles.length} selected
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Manually</span>
              </Button>

              <Button
                onClick={handleContinue}
                disabled={!canProceed}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(selectedProfiles.length / profiles.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-800 dark:via-purple-900/10 dark:to-blue-900/10 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
              <p className="font-medium text-gray-900 dark:text-white">
                Analyzing customer profiles from your website...
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We're extracting and categorizing your target audiences to understand who you serve best.
            </p>
          </div>

          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </motion.div>
      )}

      {/* Add Manual Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-500 dark:border-purple-400 p-6 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Customer Segment
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Segment Description
                </label>
                <textarea
                  value={newCustomerSegment}
                  onChange={(e) => setNewCustomerSegment(e.target.value)}
                  placeholder="e.g., Classic car collectors and enthusiasts with valuable vintage vehicles"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleAddManualCustomer();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Press ⌘+Enter to add
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddManualCustomer}
                  disabled={!newCustomerSegment.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCustomerSegment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Profiles */}
      <AnimatePresence mode="popLayout">
        {!isLoading && profiles.map((profile, index) => {
          const isSelected = selectedProfiles.some(p => p.id === profile.id);

          return (
            <motion.div
              key={profile.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className={`
                bg-white dark:bg-slate-800 rounded-xl border-2 p-6 shadow-md cursor-pointer transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                }
              `}
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.statement}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    {profile.industry && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                          Industry
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {profile.industry}
                        </p>
                      </div>
                    )}

                    {profile.companySize && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                          Company Size
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {profile.companySize}
                        </p>
                      </div>
                    )}

                    {profile.role && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                          Role
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {profile.role}
                        </p>
                      </div>
                    )}
                  </div>

                  {profile.evidenceQuotes && profile.evidenceQuotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                        Evidence
                      </p>
                      {profile.evidenceQuotes.slice(0, 2).map((quote, idx) => (
                        <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 italic pl-3 border-l-2 border-gray-300 dark:border-slate-600">
                          "{quote}"
                        </p>
                      ))}
                    </div>
                  )}

                  {profile.confidence && typeof profile.confidence === 'object' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Confidence: {profile.confidence.overall}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && profiles.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Customer Profiles Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't identify specific customer segments from your website.
            You can still proceed and define your target customer manually.
          </p>
          <Button onClick={onNext} className="gap-2">
            Continue Anyway
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
