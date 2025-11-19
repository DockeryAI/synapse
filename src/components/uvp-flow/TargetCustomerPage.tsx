/**
 * Target Customer Page - UVP Flow Step 2
 *
 * Displays AI-extracted customer profiles or manual input form
 * Question: "Who is Your Target Customer?"
 *
 * Created: 2025-11-18
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  AlertCircle,
  Edit3,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceMeter } from '@/components/onboarding-v5/ConfidenceMeter';
import { SourceCitation } from '@/components/onboarding-v5/SourceCitation';
import type { CustomerProfile } from '@/types/uvp-flow.types';

interface TargetCustomerPageProps {
  businessName: string;
  isLoading?: boolean;
  aiSuggestions?: CustomerProfile[];
  onAccept: (profile: CustomerProfile) => void;
  onManualSubmit: (profile: Partial<CustomerProfile>) => void;
  onNext: () => void;
}

export function TargetCustomerPage({
  businessName,
  isLoading = false,
  aiSuggestions = [],
  onAccept,
  onManualSubmit,
  onNext
}: TargetCustomerPageProps) {
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>(aiSuggestions.length > 0 ? 'ai' : 'manual');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Manual input state
  const [customerDescription, setCustomerDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [role, setRole] = useState('');

  const handleAcceptProfile = (profile: CustomerProfile) => {
    setSelectedProfileId(profile.id);
    onAccept(profile);
  };

  const handleManualSubmit = () => {
    if (!customerDescription.trim()) return;

    onManualSubmit({
      statement: customerDescription,
      industry: industry || undefined,
      companySize: companySize || undefined,
      role: role || undefined,
      isManualInput: true
    });
  };

  const canProceed = selectedProfileId !== null || customerDescription.trim().length > 0;
  const hasAISuggestions = aiSuggestions.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            UVP Step 2 of 6: Target Customer
          </span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Who is Your Target Customer?
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Be specific: Industry, company size, role
        </p>
      </motion.div>

      {/* Toggle between AI and Manual */}
      {hasAISuggestions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant={inputMode === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('ai')}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Suggestions
          </Button>
          <Button
            variant={inputMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('manual')}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Manual Input
          </Button>
        </motion.div>
      )}

      {/* Continue Button (always visible when can proceed) */}
      {canProceed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            onClick={onNext}
            size="lg"
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-700 p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-24 flex-1" />
                <Skeleton className="h-24 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Suggestions View */}
      {!isLoading && inputMode === 'ai' && hasAISuggestions && (
        <AnimatePresence mode="popLayout">
          {aiSuggestions.map((profile, index) => {
            const isSelected = selectedProfileId === profile.id;

            return (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 transition-all
                  ${isSelected
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-gray-200 dark:border-slate-700'
                  }
                `}
              >
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Customer Profile {index + 1}
                    </h2>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>

                {/* Profile Statement */}
                <div className="mb-6">
                  <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                    {profile.statement}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {profile.industry && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Industry
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {profile.industry}
                      </p>
                    </div>
                  )}
                  {profile.companySize && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Company Size
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {profile.companySize}
                      </p>
                    </div>
                  )}
                  {profile.role && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Role
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {profile.role}
                      </p>
                    </div>
                  )}
                </div>

                {/* Evidence Quotes */}
                {profile.evidenceQuotes && profile.evidenceQuotes.length > 0 && (
                  <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Quote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Supporting Evidence
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {profile.evidenceQuotes.map((quote, i) => (
                        <p key={i} className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{quote}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Score & Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Confidence Score
                    </h4>
                    <ConfidenceMeter score={profile.confidence} compact />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Data Sources
                    </h4>
                    <SourceCitation sources={profile.sources} compact />
                  </div>
                </div>

                {/* Accept Button */}
                <div className="flex justify-end">
                  {!isSelected ? (
                    <Button
                      onClick={() => handleAcceptProfile(profile)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Select This Profile
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProfileId(null)}
                    >
                      Deselect
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Manual Input View */}
      {!isLoading && inputMode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-200 dark:border-purple-700 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Define Your Target Customer
            </h2>
          </div>

          <div className="space-y-6">
            {/* Customer Description (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Customer Description *
              </label>
              <textarea
                value={customerDescription}
                onChange={(e) => setCustomerDescription(e.target.value)}
                className="w-full p-4 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                rows={4}
                placeholder="e.g., Mid-sized B2B SaaS companies with 50-200 employees, typically led by VPs of Marketing or Growth who are struggling to scale their content operations..."
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Be as specific as possible about who your ideal customer is
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Industry (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry (optional)
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g., SaaS, Healthcare"
                />
              </div>

              {/* Company Size (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Size (optional)
                </label>
                <input
                  type="text"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g., 50-200 employees"
                />
              </div>

              {/* Role (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (optional)
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  placeholder="e.g., VP of Marketing"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleManualSubmit}
                disabled={!customerDescription.trim()}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Customer Profile
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State (No AI data, not in manual mode) */}
      {!isLoading && !hasAISuggestions && inputMode === 'ai' && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No customer profiles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't extract target customer information from {businessName}'s website.
            Switch to manual input to define your target customer.
          </p>
          <Button
            onClick={() => setInputMode('manual')}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Enter Manually
          </Button>
        </div>
      )}
    </div>
  );
}
