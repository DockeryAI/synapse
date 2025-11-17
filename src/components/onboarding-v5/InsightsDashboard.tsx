/**
 * InsightsDashboard Component
 *
 * Displays extracted business insights after data collection:
 * - Business Profile (name, specialization, location, customer types)
 * - Key Insights (services, value props, testimonials)
 * - Content Opportunities (suggested topics/angles)
 *
 * Clean visual design with stats and icons.
 * Transitions to SmartSuggestions via onContinue callback.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  TrendingUp,
  Star,
  MessageCircle,
  Lightbulb,
  Target,
  Award,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExtractedUVPData } from '@/types/smart-uvp.types';

interface WebsiteMessagingAnalysis {
  valuePropositions: string[];
  targetAudience: string[];
  customerProblems: string[];
  solutions: string[];
  proofPoints: string[];
  differentiators: string[];
  confidence: number;
}

interface RefinedBusinessData {
  businessName: string;
  specialization: string;
  location: string;
  selectedServices: string[];
  selectedCustomers: string[];
  selectedValueProps: string[];
  selectedTestimonials: string[];
}

export interface InsightsDashboardProps {
  refinedData: RefinedBusinessData;
  uvpData: ExtractedUVPData;
  websiteAnalysis: WebsiteMessagingAnalysis;
  specialization: string;
  onContinue: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  refinedData,
  uvpData,
  websiteAnalysis,
  specialization,
  onContinue,
}) => {
  // Calculate stats
  const servicesCount = refinedData.selectedServices.length;
  const customerTypesCount = refinedData.selectedCustomers.length;
  const valuePropsCount = refinedData.selectedValueProps.length;
  const testimonialsCount = refinedData.selectedTestimonials.length;
  const overallConfidence = Math.round(uvpData.overallConfidence * 100);

  // Generate content opportunities based on business data
  const contentOpportunities = [
    {
      title: 'Customer Success Stories',
      description: `Share real results from your ${refinedData.selectedCustomers[0] || 'customers'}`,
      icon: <Star className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500',
      relevance: testimonialsCount > 0 ? 'high' : 'medium',
    },
    {
      title: 'Service Spotlights',
      description: `Highlight your ${servicesCount} key services with benefits`,
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      relevance: 'high',
    },
    {
      title: 'Problem/Solution Posts',
      description: `Address ${websiteAnalysis.customerProblems.length} pain points you solve`,
      icon: <Target className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      relevance: websiteAnalysis.customerProblems.length > 0 ? 'high' : 'medium',
    },
    {
      title: 'Value Proposition Content',
      description: `Showcase what makes you unique with ${valuePropsCount} differentiators`,
      icon: <Award className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-500',
      relevance: valuePropsCount > 0 ? 'high' : 'medium',
    },
    {
      title: 'Community Engagement',
      description: `Ask questions to engage ${refinedData.selectedCustomers[0] || 'your audience'}`,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'from-indigo-500 to-violet-500',
      relevance: 'medium',
    },
  ];

  // Sort by relevance
  const sortedOpportunities = contentOpportunities.sort((a, b) => {
    const relevanceOrder = { high: 0, medium: 1, low: 2 };
    return relevanceOrder[a.relevance as keyof typeof relevanceOrder] - relevanceOrder[b.relevance as keyof typeof relevanceOrder];
  });

  const getRelevanceBadgeColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Data Collected • {overallConfidence}% Confidence
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Your Business Insights
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Here's what we learned about {refinedData.businessName}
          </p>
        </motion.div>

        {/* Section 1: Business Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Profile</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your core business details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name & Specialization */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Business Name
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {refinedData.businessName}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Specialization
                  </span>
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {refinedData.specialization || specialization}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Location
                  </span>
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {refinedData.location}
                </p>
              </div>
            </div>

            {/* Customer Types */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">
                  Target Customers ({customerTypesCount})
                </span>
              </div>
              <div className="space-y-2">
                {refinedData.selectedCustomers.slice(0, 5).map((customer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{customer}</span>
                  </div>
                ))}
                {customerTypesCount > 5 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium pl-2">
                    +{customerTypesCount - 5} more
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Key Insights</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                What makes your business unique
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {servicesCount}
              </div>
              <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                Key Services
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {valuePropsCount}
              </div>
              <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">
                Value Props
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {testimonialsCount}
              </div>
              <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                Testimonials
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {overallConfidence}%
              </div>
              <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                Confidence
              </div>
            </div>
          </div>

          {/* Top Services */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Top Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {refinedData.selectedServices.slice(0, 6).map((service, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {service}
                </span>
              ))}
              {servicesCount > 6 && (
                <span className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                  +{servicesCount - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Top Value Props */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Key Differentiators
            </h3>
            <div className="space-y-2">
              {refinedData.selectedValueProps.slice(0, 3).map((prop, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-900 dark:text-white">{prop}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Section 3: Content Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Content Opportunities
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suggested topics based on your business data
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOpportunities.map((opportunity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${opportunity.color} rounded-lg flex items-center justify-center text-white`}>
                    {opportunity.icon}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRelevanceBadgeColor(
                      opportunity.relevance
                    )}`}
                  >
                    {opportunity.relevance}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {opportunity.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {opportunity.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full py-6 sm:py-8 text-base sm:text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[56px]"
          >
            Continue to Smart Suggestions
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
