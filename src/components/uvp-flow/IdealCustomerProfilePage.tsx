/**
 * Ideal Customer Profile Page - Stub Component
 *
 * This is a temporary stub to enable integration.
 * Replace with full implementation when ready.
 */

import React from 'react';
import type { CustomerProfile } from '@/types/uvp-flow.types';

export interface CustomerWithDrivers {
  customer: {
    statement: string;
    industry?: string;
    companySize?: string;
    role?: string;
    confidence: number;
  };
  emotionalDrivers: Array<{ text: string }>;
  functionalDrivers: Array<{ text: string }>;
  combinedInsight?: string;
}

interface IdealCustomerProfilePageProps {
  businessName: string;
  industry: string;
  websiteUrl: string;
  websiteContent: string[];
  websiteUrls: string[];
  preloadedData?: {
    profiles: CustomerProfile[];
    loading: boolean;
  };
  value: string;
  onChange: (profiles: CustomerWithDrivers[]) => void;
  onNext: () => void;
  onBack: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  completedSteps?: string[];
  onStepClick?: (step: string) => void;
}

export const IdealCustomerProfilePage: React.FC<IdealCustomerProfilePageProps> = ({
  businessName,
  industry,
  websiteUrl,
  websiteContent,
  websiteUrls,
  preloadedData,
  value,
  onChange,
  onNext,
  onBack,
  showProgress,
  progressPercentage,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ideal Customer Profile (Coming Soon)
        </h1>
        <p className="text-gray-600 mb-8">
          This is a placeholder component. The full IdealCustomerProfilePage implementation is in progress.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business: {businessName}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry: {industry}
            </label>
          </div>

          <div className="flex justify-between gap-4 mt-8">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onNext}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
