/**
 * Quick Refinement Modal
 *
 * Fast 10-second modal for refining key UVP components:
 * - #1 Customer priority
 * - Top differentiator
 * - Best success story
 *
 * All fields optional and pre-populated from extracted data.
 */

import { useState } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import type {
  QuickRefinementData,
  CustomerType,
  Differentiator,
  Testimonial,
  ExtractedUVPData,
} from '@/types/smart-uvp.types';

interface QuickRefinementProps {
  extractedData: ExtractedUVPData;
  onComplete: (data: QuickRefinementData) => void;
  onSkip: () => void;
}

export function QuickRefinement({ extractedData, onComplete, onSkip }: QuickRefinementProps) {
  // Pre-select top items from extracted data
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | undefined>(
    extractedData.customerTypes[0]
  );

  const [selectedDifferentiator, setSelectedDifferentiator] = useState<Differentiator | undefined>(
    extractedData.differentiators[0]
  );

  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | undefined>(
    extractedData.testimonials[0]
  );

  // AI-generated differentiator suggestions (would come from AI service)
  const [aiDifferentiators] = useState<Differentiator[]>(
    generateAISuggestions(extractedData)
  );

  const [customDifferentiator, setCustomDifferentiator] = useState('');
  const [customSuccessStory, setCustomSuccessStory] = useState('');

  const handleComplete = () => {
    const data: QuickRefinementData = {
      primaryCustomer: selectedCustomer,
      topDifferentiator: customDifferentiator
        ? createCustomDifferentiator(customDifferentiator)
        : selectedDifferentiator,
      bestSuccessStory: customSuccessStory
        ? createCustomTestimonial(customSuccessStory)
        : selectedTestimonial,
    };

    onComplete(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-green-600" size={24} />
              Quick Refinement
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Polish your UVP in under 10 seconds
            </p>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Priority Customer */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Who is your #1 customer?
            </label>
            <div className="space-y-2">
              {extractedData.customerTypes.slice(0, 4).map((customer, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCustomer === customer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="customer"
                    checked={selectedCustomer === customer}
                    onChange={() => setSelectedCustomer(customer)}
                    className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{customer.text}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <span>{customer.source.sourceContext}</span>
                      <a
                        href={customer.source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                        Source
                      </a>
                    </div>
                  </div>
                  <ConfidenceBadge confidence={customer.confidence} />
                </label>
              ))}
            </div>
          </div>

          {/* Top Differentiator */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              What makes you different?
            </label>

            {/* AI Suggestions */}
            {aiDifferentiators.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-green-600" />
                  AI-Generated Suggestions
                </div>
                <div className="space-y-2">
                  {aiDifferentiators.map((diff, index) => (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedDifferentiator === diff
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="differentiator"
                        checked={selectedDifferentiator === diff}
                        onChange={() => {
                          setSelectedDifferentiator(diff);
                          setCustomDifferentiator('');
                        }}
                        className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="text-gray-900">{diff.text}</div>
                        {diff.isQuantifiable && (
                          <div className="text-xs text-green-600 font-semibold mt-1">
                            {diff.quantification}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input */}
            <div>
              <div className="text-xs text-gray-600 mb-2">Or write your own:</div>
              <input
                type="text"
                value={customDifferentiator}
                onChange={(e) => {
                  setCustomDifferentiator(e.target.value);
                  if (e.target.value) {
                    setSelectedDifferentiator(undefined);
                  }
                }}
                placeholder="e.g., 24/7 emergency service with 2-hour response guarantee"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Success Story */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Best success story or testimonial (optional)
            </label>

            {/* Pre-filled from extracted testimonials */}
            {extractedData.testimonials.length > 0 && (
              <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm italic text-gray-900 mb-2">
                  "{extractedData.testimonials[0].text}"
                </div>
                {extractedData.testimonials[0].customerName && (
                  <div className="text-xs text-gray-600">
                    - {extractedData.testimonials[0].customerName}
                    {extractedData.testimonials[0].customerCompany &&
                      ` (${extractedData.testimonials[0].customerCompany})`}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <span>{extractedData.testimonials[0].source.sourceContext}</span>
                  <a
                    href={extractedData.testimonials[0].source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <ExternalLink size={12} />
                    Source
                  </a>
                </div>
                <button
                  onClick={() => setSelectedTestimonial(extractedData.testimonials[0])}
                  className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Use This Testimonial
                </button>
              </div>
            )}

            {/* Quick text input */}
            <div>
              <div className="text-xs text-gray-600 mb-2">Or add a quick story:</div>
              <textarea
                value={customSuccessStory}
                onChange={(e) => {
                  setCustomSuccessStory(e.target.value);
                  if (e.target.value) {
                    setSelectedTestimonial(undefined);
                  }
                }}
                placeholder="e.g., Helped 500+ local businesses increase revenue by 40% through targeted social campaigns"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Skip This Step
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Complete Refinement
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = (confidence * 100).toFixed(0);
  const color = confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'yellow' : 'red';

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClasses[color]}`}>
      {percentage}%
    </span>
  );
}

// Helper Functions
function generateAISuggestions(data: ExtractedUVPData): Differentiator[] {
  // Take top 3 differentiators from extracted data
  const extracted = data.differentiators.slice(0, 3);

  // If we have enough, return them
  if (extracted.length >= 3) {
    return extracted;
  }

  // Otherwise, generate some based on other data
  const suggestions: Differentiator[] = [...extracted];

  // Generate from services if available
  if (data.services.length > 0 && suggestions.length < 3) {
    const topService = data.services[0];
    suggestions.push({
      text: `Specialized in ${topService.text}`,
      confidence: 0.7,
      category: 'expertise',
      isQuantifiable: false,
      source: topService.source,
      isVerified: true,
    });
  }

  return suggestions;
}

function createCustomDifferentiator(text: string): Differentiator {
  return {
    text,
    confidence: 1.0, // User input is always 100% confident
    category: 'other',
    isQuantifiable: false,
    source: {
      sourceUrl: window.location.href,
      sourceContext: 'User-provided custom differentiator',
      extractedAt: new Date(),
    },
    isVerified: true,
    isUserConfirmed: true,
  };
}

function createCustomTestimonial(text: string): Testimonial {
  return {
    text,
    confidence: 1.0,
    hasMetrics: false,
    source: {
      sourceUrl: window.location.href,
      sourceContext: 'User-provided success story',
      extractedAt: new Date(),
    },
    isVerified: true,
    isUserConfirmed: true,
  };
}
