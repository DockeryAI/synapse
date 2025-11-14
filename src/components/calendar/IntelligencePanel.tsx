/**
 * Intelligence Panel Component
 *
 * Displays Synapse intelligence insights in the calendar interface.
 * Shows specialty detection, brand voice, customer insights, trending topics,
 * and competitive opportunities to help users understand content recommendations.
 *
 * Features:
 * - Mobile responsive design
 * - Accessible (ARIA labels)
 * - Collapsible sections
 * - Visual badges and indicators
 * - Integration with calendar system
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, Users, Target, MessageCircle } from 'lucide-react';
import { MappedIntelligence } from '../../services/intelligence-data-mapper.service';
import { SpecialtyDetection } from '../../services/synapse-calendar-bridge.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IntelligencePanelProps {
  intelligence: MappedIntelligence;
  specialty: SpecialtyDetection;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  intelligence,
  specialty,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['specialty', 'brandVoice']) // Default expanded sections
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isSectionExpanded = (section: string) => expandedSections.has(section);

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label="Intelligence Insights">
      {/* Specialty Detection */}
      <Card className="bg-white dark:bg-gray-800">
        <button
          onClick={() => toggleSection('specialty')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          aria-expanded={isSectionExpanded('specialty')}
          aria-controls="specialty-content"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Detected Specialty
            </h3>
          </div>
          {isSectionExpanded('specialty') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isSectionExpanded('specialty') && (
          <div id="specialty-content" className="px-4 pb-4 space-y-3">
            <Badge variant="primary" className="text-sm">
              {specialty.specialty}
            </Badge>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {specialty.reasoning}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${specialty.confidence}%` }}
                />
              </div>
              <span className="font-medium">{specialty.confidence}% confident</span>
            </div>
          </div>
        )}
      </Card>

      {/* Brand Voice */}
      <Card className="bg-white dark:bg-gray-800">
        <button
          onClick={() => toggleSection('brandVoice')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          aria-expanded={isSectionExpanded('brandVoice')}
          aria-controls="brandvoice-content"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Brand Voice
            </h3>
          </div>
          {isSectionExpanded('brandVoice') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isSectionExpanded('brandVoice') && (
          <div id="brandvoice-content" className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <Badge variant="secondary">{intelligence.brandVoice.tone}</Badge>
              <Badge variant="secondary">{intelligence.brandVoice.style}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Top Keywords:
              </p>
              <div className="flex flex-wrap gap-1">
                {intelligence.brandVoice.keywords.slice(0, 8).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Insights */}
      <Card className="bg-white dark:bg-gray-800">
        <button
          onClick={() => toggleSection('customerInsights')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          aria-expanded={isSectionExpanded('customerInsights')}
          aria-controls="customer-content"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Customer Insights
            </h3>
            <Badge variant="secondary" className="text-xs">
              {intelligence.customerSentiment.reviewCount} reviews
            </Badge>
          </div>
          {isSectionExpanded('customerInsights') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isSectionExpanded('customerInsights') && (
          <div id="customer-content" className="px-4 pb-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sentiment Score
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {Math.round(intelligence.customerSentiment.overallScore)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${intelligence.customerSentiment.overallScore}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Top Mentions:
              </p>
              <div className="flex flex-wrap gap-1">
                {intelligence.customerSentiment.topMentions.map((mention, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {mention}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Trending Topics */}
      <Card className="bg-white dark:bg-gray-800">
        <button
          onClick={() => toggleSection('trends')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          aria-expanded={isSectionExpanded('trends')}
          aria-controls="trends-content"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Trending Topics
            </h3>
          </div>
          {isSectionExpanded('trends') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isSectionExpanded('trends') && (
          <div id="trends-content" className="px-4 pb-4">
            <ul className="space-y-2">
              {intelligence.trendingTopics
                .filter(t => t.relevance > 70)
                .slice(0, 5)
                .map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">📈</span>
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-gray-100">{topic.topic}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{topic.relevance}% relevant</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">{topic.source}</span>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Opportunities */}
      <Card className="bg-white dark:bg-gray-800">
        <button
          onClick={() => toggleSection('opportunities')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
          aria-expanded={isSectionExpanded('opportunities')}
          aria-controls="opportunities-content"
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Content Opportunities
            </h3>
          </div>
          {isSectionExpanded('opportunities') ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {isSectionExpanded('opportunities') && (
          <div id="opportunities-content" className="px-4 pb-4">
            <ul className="space-y-2">
              {intelligence.competitiveGaps.differentiators.map((diff, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <span className="text-gray-900 dark:text-gray-100">{diff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Data Quality Indicator */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Data Quality: {intelligence.dataSources.length} sources
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {intelligence.qualityScore}% complete
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  className = ''
}) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
