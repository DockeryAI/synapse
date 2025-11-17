/**
 * Smart Confirmation Component
 *
 * Displays extracted UVP data in collapsible sections with source links.
 * Users can confirm, skip, or add custom items.
 * EVERY item shows "View Source" link for transparency.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Plus, Check, AlertCircle } from 'lucide-react';
import type {
  ExtractedUVPData,
  CustomerType,
  ServiceProduct,
  ProblemSolved,
  Testimonial,
  Differentiator,
  UserConfirmationState,
  getConfidenceColor,
  getConfidenceLevel,
} from '@/types/smart-uvp.types';

interface SmartConfirmationProps {
  extractedData: ExtractedUVPData;
  onConfirm: (state: UserConfirmationState) => void;
  onSkip: () => void;
}

export function SmartConfirmation({ extractedData, onConfirm, onSkip }: SmartConfirmationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['customers', 'services', 'problems'])
  );

  const [confirmationState, setConfirmationState] = useState<UserConfirmationState>({
    confirmedCustomerTypes: [],
    confirmedServices: [],
    confirmedProblems: [],
    confirmedTestimonials: [],
    confirmedDifferentiators: [],
    customCustomerTypes: [],
    customServices: [],
    customProblems: [],
    customTestimonials: [],
    customDifferentiators: [],
    skippedSections: [],
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleItem = (section: keyof UserConfirmationState, itemId: string) => {
    const currentArray = confirmationState[section] as string[];
    const newArray = currentArray.includes(itemId)
      ? currentArray.filter((id) => id !== itemId)
      : [...currentArray, itemId];

    setConfirmationState({
      ...confirmationState,
      [section]: newArray,
    });
  };

  const skipSection = (section: 'customers' | 'services' | 'problems' | 'testimonials' | 'differentiators') => {
    setConfirmationState({
      ...confirmationState,
      skippedSections: [...confirmationState.skippedSections, section],
    });
  };

  const handleConfirm = () => {
    onConfirm(confirmationState);
  };

  const getConfidenceBadge = (confidence: number) => {
    const level = getConfidenceLevel(confidence);
    const color = getConfidenceColor(confidence);
    const percentage = (confidence * 100).toFixed(0);

    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClasses[color]}`}>
        {percentage}% {level}
      </span>
    );
  };

  const SourceLink = ({ sourceUrl, sourceContext }: { sourceUrl: string; sourceContext: string }) => (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
      title={sourceContext}
    >
      <ExternalLink size={14} />
      View Source
    </a>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Business Details</h2>
        <p className="text-gray-600 mb-4">
          We've extracted this information from your website. Review each section and confirm what's accurate.
        </p>

        {/* Quality Metrics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Overall Confidence</div>
            <div className="text-2xl font-bold text-gray-900">
              {(extractedData.overallConfidence * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Verified Sources</div>
            <div className="text-2xl font-bold text-green-600">
              {(extractedData.verificationRate * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Completeness</div>
            <div className="text-2xl font-bold text-gray-900">
              {(extractedData.completeness * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Warnings */}
        {extractedData.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 mt-0.5" size={16} />
              <div>
                <div className="text-sm font-medium text-yellow-900">Attention Needed</div>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  {extractedData.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Types Section */}
      <CollapsibleSection
        title="Who You Serve"
        count={extractedData.customerTypes.length}
        isExpanded={expandedSections.has('customers')}
        onToggle={() => toggleSection('customers')}
        onSkip={() => skipSection('customers')}
      >
        <div className="space-y-3">
          {extractedData.customerTypes.map((customer, index) => (
            <ItemCard
              key={index}
              id={`customer-${index}`}
              text={customer.text}
              confidence={customer.confidence}
              sourceUrl={customer.source.sourceUrl}
              sourceContext={customer.source.sourceContext}
              isChecked={confirmationState.confirmedCustomerTypes.includes(`customer-${index}`)}
              onToggle={() => toggleItem('confirmedCustomerTypes', `customer-${index}`)}
              badge={customer.category}
            />
          ))}
        </div>
        <AddCustomButton section="customers" />
      </CollapsibleSection>

      {/* Services Section */}
      <CollapsibleSection
        title="Your Services/Products"
        count={extractedData.services.length}
        isExpanded={expandedSections.has('services')}
        onToggle={() => toggleSection('services')}
        onSkip={() => skipSection('services')}
      >
        <div className="space-y-3">
          {extractedData.services.map((service, index) => (
            <ItemCard
              key={index}
              id={`service-${index}`}
              text={service.text}
              confidence={service.confidence}
              sourceUrl={service.source.sourceUrl}
              sourceContext={service.source.sourceContext}
              isChecked={confirmationState.confirmedServices.includes(`service-${index}`)}
              onToggle={() => toggleItem('confirmedServices', `service-${index}`)}
              badge={service.type}
              category={service.category}
            />
          ))}
        </div>
        <AddCustomButton section="services" />
      </CollapsibleSection>

      {/* Problems Solved Section */}
      <CollapsibleSection
        title="Problems You Solve"
        count={extractedData.problemsSolved.length}
        isExpanded={expandedSections.has('problems')}
        onToggle={() => toggleSection('problems')}
        onSkip={() => skipSection('problems')}
      >
        <div className="space-y-3">
          {extractedData.problemsSolved.map((problem, index) => (
            <ItemCard
              key={index}
              id={`problem-${index}`}
              text={problem.text}
              confidence={problem.confidence}
              sourceUrl={problem.source.sourceUrl}
              sourceContext={problem.source.sourceContext}
              isChecked={confirmationState.confirmedProblems.includes(`problem-${index}`)}
              onToggle={() => toggleItem('confirmedProblems', `problem-${index}`)}
              badge={problem.severity}
            />
          ))}
        </div>
        <AddCustomButton section="problems" />
      </CollapsibleSection>

      {/* Testimonials Section */}
      {extractedData.testimonials.length > 0 && (
        <CollapsibleSection
          title="Customer Testimonials"
          count={extractedData.testimonials.length}
          isExpanded={expandedSections.has('testimonials')}
          onToggle={() => toggleSection('testimonials')}
          onSkip={() => skipSection('testimonials')}
        >
          <div className="space-y-3">
            {extractedData.testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                id={`testimonial-${index}`}
                testimonial={testimonial}
                isChecked={confirmationState.confirmedTestimonials.includes(`testimonial-${index}`)}
                onToggle={() => toggleItem('confirmedTestimonials', `testimonial-${index}`)}
              />
            ))}
          </div>
          <AddCustomButton section="testimonials" />
        </CollapsibleSection>
      )}

      {/* Differentiators Section */}
      {extractedData.differentiators.length > 0 && (
        <CollapsibleSection
          title="What Makes You Different"
          count={extractedData.differentiators.length}
          isExpanded={expandedSections.has('differentiators')}
          onToggle={() => toggleSection('differentiators')}
          onSkip={() => skipSection('differentiators')}
        >
          <div className="space-y-3">
            {extractedData.differentiators.map((diff, index) => (
              <ItemCard
                key={index}
                id={`diff-${index}`}
                text={diff.text}
                confidence={diff.confidence}
                sourceUrl={diff.source.sourceUrl}
                sourceContext={diff.source.sourceContext}
                isChecked={confirmationState.confirmedDifferentiators.includes(`diff-${index}`)}
                onToggle={() => toggleItem('confirmedDifferentiators', `diff-${index}`)}
                badge={diff.category}
                highlight={diff.isQuantifiable ? diff.quantification : undefined}
              />
            ))}
          </div>
          <AddCustomButton section="differentiators" />
        </CollapsibleSection>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={onSkip}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Skip This Step
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Check size={16} />
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  count,
  isExpanded,
  onToggle,
  onSkip,
  children,
}: {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({count} found)</span>
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-50"
        >
          Skip Section
        </button>
      </div>

      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
}

// Item Card Component
function ItemCard({
  id,
  text,
  confidence,
  sourceUrl,
  sourceContext,
  isChecked,
  onToggle,
  badge,
  category,
  highlight,
}: {
  id: string;
  text: string;
  confidence: number;
  sourceUrl: string;
  sourceContext: string;
  isChecked: boolean;
  onToggle: () => void;
  badge?: string;
  category?: string;
  highlight?: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        isChecked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      } hover:shadow-sm transition-all cursor-pointer`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-900 font-medium">{text}</p>
            {getConfidenceBadge(confidence)}
          </div>

          {(badge || category || highlight) && (
            <div className="flex items-center gap-2 mt-2">
              {badge && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {badge}
                </span>
              )}
              {category && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                  {category}
                </span>
              )}
              {highlight && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-semibold">
                  {highlight}
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span title={sourceContext}>{sourceContext}</span>
            <SourceLink sourceUrl={sourceUrl} sourceContext={sourceContext} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  id,
  testimonial,
  isChecked,
  onToggle,
}: {
  id: string;
  testimonial: Testimonial;
  isChecked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        isChecked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      } hover:shadow-sm transition-all cursor-pointer`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-900 italic">"{testimonial.text}"</p>
            {getConfidenceBadge(testimonial.confidence)}
          </div>

          {(testimonial.customerName || testimonial.customerRole || testimonial.customerCompany) && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-medium">{testimonial.customerName}</span>
              {testimonial.customerRole && <span>, {testimonial.customerRole}</span>}
              {testimonial.customerCompany && <span> at {testimonial.customerCompany}</span>}
            </div>
          )}

          {testimonial.hasMetrics && testimonial.metrics && (
            <div className="mt-2 flex gap-2">
              {testimonial.metrics.map((metric, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-semibold"
                >
                  {metric.text}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span title={testimonial.source.sourceContext}>{testimonial.source.sourceContext}</span>
            <SourceLink
              sourceUrl={testimonial.source.sourceUrl}
              sourceContext={testimonial.source.sourceContext}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Custom Button Component
function AddCustomButton({ section }: { section: string }) {
  return (
    <button className="mt-3 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
      <Plus size={16} />
      Add Custom {section.charAt(0).toUpperCase() + section.slice(1)}
    </button>
  );
}

// Helper Functions
function getConfidenceBadge(confidence: number) {
  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(confidence);
  const percentage = (confidence * 100).toFixed(0);

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClasses[color]}`}>
      {percentage}% {level}
    </span>
  );
}

function SourceLink({ sourceUrl, sourceContext }: { sourceUrl: string; sourceContext: string }) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
      title={sourceContext}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink size={14} />
      View Source
    </a>
  );
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

function getConfidenceColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 0.8) return 'green';
  if (score >= 0.6) return 'yellow';
  return 'red';
}
