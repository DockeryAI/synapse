/**
 * OnboardingFlow Component
 *
 * Single URL input landing page with progressive status indicators.
 * Auto-detects business data and transitions to smart confirmation.
 *
 * CORE PRINCIPLES:
 * - Single URL input (no manual forms)
 * - Progressive status updates during detection
 * - Auto-transition when complete
 * - Mobile-first with thumb-friendly targets
 * - Source verification from website data
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, Users, TrendingUp, CheckCircle, Loader2, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndustrySelector, type IndustryOption } from './IndustrySelector';
import { Link } from 'react-router-dom';
import type { DetectedBusinessData } from '@/pages/OnboardingPageV5';

interface OnboardingFlowProps {
  onComplete?: (businessData: DetectedBusinessData) => void;
  onUrlSubmit?: (url: string, industry: IndustryOption) => void;
  error?: string | null;
  websiteUrl?: string;
  selectedIndustry?: IndustryOption | null;
}

type DetectionStatus =
  | 'idle'
  | 'analyzing'
  | 'finding_services'
  | 'identifying_customers'
  | 'analyzing_competitors'
  | 'complete';

interface StatusStep {
  id: DetectionStatus;
  label: string;
  icon: React.ReactNode;
}

const DETECTION_STEPS: StatusStep[] = [
  { id: 'analyzing', label: 'Analyzing website...', icon: <Globe className="w-5 h-5" /> },
  { id: 'finding_services', label: 'Finding services...', icon: <Search className="w-5 h-5" /> },
  {
    id: 'identifying_customers',
    label: 'Identifying customers...',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'analyzing_competitors',
    label: 'Analyzing competitors...',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  { id: 'complete', label: 'Detection complete!', icon: <CheckCircle className="w-5 h-5" /> },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onUrlSubmit,
  error: propError,
  websiteUrl: initialUrl = '',
  selectedIndustry: initialIndustry = null
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryOption | null>(initialIndustry);
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [localError, setLocalError] = useState<string | null>(null);

  // Debug: Log what we receive from parent
  React.useEffect(() => {
    console.log('[OnboardingFlow] Mounted with props:', {
      initialUrl,
      initialIndustry: initialIndustry?.displayName,
      urlState: url,
      industryState: selectedIndustry?.displayName
    });
  }, []);

  // Restore from parent if provided
  React.useEffect(() => {
    if (initialUrl && !url) {
      console.log('[OnboardingFlow] Restoring URL from prop:', initialUrl);
      setUrl(initialUrl);
    }
    if (initialIndustry && !selectedIndustry) {
      console.log('[OnboardingFlow] Restoring industry from prop:', initialIndustry.displayName);
      setSelectedIndustry(initialIndustry);
    }
  }, [initialUrl, initialIndustry]);

  // Use prop error if provided, otherwise use local error
  const error = propError || localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setLocalError('Please enter your website URL');
      return;
    }

    if (!selectedIndustry) {
      setLocalError('Please select your business type');
      return;
    }

    // Validate URL format
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
      new URL(fullUrl);
    } catch {
      setLocalError('Please enter a valid website URL');
      return;
    }

    setLocalError(null);

    // If onUrlSubmit is provided, use that (new flow with real extraction)
    if (onUrlSubmit) {
      onUrlSubmit(fullUrl, selectedIndustry);
      return;
    }

    // Otherwise fall back to legacy simulation
    await runDetection(fullUrl);
  };

  const runDetection = async (websiteUrl: string) => {
    // Simulate progressive detection with status updates
    const steps: DetectionStatus[] = [
      'analyzing',
      'finding_services',
      'identifying_customers',
      'analyzing_competitors',
      'complete',
    ];

    for (const step of steps) {
      setStatus(step);

      // Simulate detection time (in production, this would be real API calls)
      await new Promise((resolve) => setTimeout(resolve, step === 'analyzing' ? 1500 : 1000));
    }

    // Mock detected data (in production, this comes from SmartUVPExtractor)
    const detectedData: DetectedBusinessData = {
      url: websiteUrl,
      businessName: 'Acme Business',
      industry: 'Professional Services',
      industryCode: '541990',
      specialization: 'Business Consulting',
      location: 'San Francisco, CA',
      services: ['Service A', 'Service B', 'Service C'],
      competitors: ['Competitor 1', 'Competitor 2'],
      sources: {
        website: websiteUrl,
        verified: true,
      },
    };

    // Wait a moment to show complete state
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Auto-transition to next step
    onComplete(detectedData);
  };

  const currentStepIndex = DETECTION_STEPS.findIndex((step) => step.id === status);
  const isDetecting = status !== 'idle' && status !== 'complete';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Welcome to Synapse
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto px-4">
            Let's create content that drives results. Just enter your website URL to get started.
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 border border-gray-200 dark:border-slate-700"
        >
          <AnimatePresence mode="wait">
            {status === 'idle' ? (
              // URL Input Form
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Large URL Input */}
                  <div>
                    <label
                      htmlFor="website-url"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center"
                    >
                      What's your website URL?
                    </label>
                    <Input
                      id="website-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="www.yourbusiness.com"
                      className="text-center text-lg sm:text-xl py-6 sm:py-8 px-4 rounded-xl border-2 border-gray-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
                      autoFocus
                      disabled={isDetecting}
                    />
                  </div>

                  {/* Industry Selector */}
                  <div>
                    <IndustrySelector
                      websiteUrl={url}
                      defaultSelectedIndustry={selectedIndustry}
                      onIndustrySelected={(industry, skipScanning) => {
                        setSelectedIndustry(industry);
                        setLocalError(null);

                        // If skipScanning is true, profile is ready - proceed immediately
                        // This happens when:
                        // 1. Profile generation completes (DetailedResearchAnimation already shown)
                        // 2. Cached profile found (no generation needed)
                        if (skipScanning && onUrlSubmit) {
                          const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                          // Proceed immediately - no timeout needed since profile is ready
                          onUrlSubmit(fullUrl, industry);
                        }
                      }}
                      className="industry-selector-inline"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 dark:text-red-400 text-sm mt-2 text-center"
                    >
                      {error}
                    </motion.p>
                  )}


                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full py-6 sm:py-8 text-base sm:text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[56px]"
                    disabled={isDetecting}
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Resume Sessions Link */}
                  <div className="mt-4 text-center">
                    <Link to="/sessions">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        <History className="w-4 h-4" />
                        Resume Previous Sessions
                      </Button>
                    </Link>
                  </div>
                </form>

                {/* Trust Indicators */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        AI-Powered
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Intelligent analysis
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        14+ Sources
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Deep intelligence
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">
                        Real Insights
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Data-driven content
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Detection Progress
              <motion.div
                key="detection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Progress Steps */}
                <div className="space-y-4">
                  {DETECTION_STEPS.map((step, index) => {
                    const isActive = status === step.id;
                    const isComplete = index < currentStepIndex;
                    const isPending = index > currentStepIndex;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                          ${isActive ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500' : ''}
                          ${isComplete ? 'bg-green-50 dark:bg-green-900/20' : ''}
                          ${isPending ? 'opacity-40' : ''}
                        `}
                      >
                        {/* Icon */}
                        <div
                          className={`
                          flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors
                          ${isActive ? 'bg-purple-500 text-white animate-pulse' : ''}
                          ${isComplete ? 'bg-green-500 text-white' : ''}
                          ${isPending ? 'bg-gray-200 dark:bg-slate-700 text-gray-400' : ''}
                        `}
                        >
                          {isActive ? (
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                          ) : (
                            step.icon
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={`
                          text-sm sm:text-base font-medium
                          ${isActive ? 'text-purple-700 dark:text-purple-300' : ''}
                          ${isComplete ? 'text-green-700 dark:text-green-300' : ''}
                          ${isPending ? 'text-gray-500 dark:text-gray-400' : ''}
                        `}
                        >
                          {step.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="relative pt-2">
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((currentStepIndex + 1) / DETECTION_STEPS.length) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 mt-3">
                    {Math.round(((currentStepIndex + 1) / DETECTION_STEPS.length) * 100)}% complete
                  </p>
                </div>

                {/* Detected URL */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Analyzing
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                    {url}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 sm:mt-8"
        >
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            All data sourced from your website. No fabrication. Ever.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
