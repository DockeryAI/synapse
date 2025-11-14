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

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, Users, Target, MessageCircle } from 'lucide-react';
import { useSynapseCalendarBridge } from '../../hooks/useSynapseCalendarBridge';
import type { IntelligenceResult } from '../../services/parallel-intelligence.service';
import type { SpecialtyDetection } from '../../services/specialty-detection.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IntelligencePanelProps {
  /** Raw intelligence results from onboarding */
  intelligence: IntelligenceResult[];
  /** Detected specialty information */
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
    new Set(['specialty', 'pillars']) // Default expanded sections
  );

  // Use the bridge hook to transform intelligence data
  const { data: bridgedData, loading, error, transform } = useSynapseCalendarBridge();

  // Transform intelligence on mount or when data changes
  useEffect(() => {
    if (intelligence && specialty) {
      transform(intelligence, specialty);
    }
  }, [intelligence, specialty, transform]);

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

  // Show loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 text-center text-gray-500">
          Transforming intelligence data...
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 text-center text-red-500">
          Error: {error.message}
        </div>
      </div>
    );
  }

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

      {/* Content Pillars */}
      {bridgedData && bridgedData.pillars.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection('pillars')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
            aria-expanded={isSectionExpanded('pillars')}
            aria-controls="pillars-content"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Content Pillars
              </h3>
              <Badge variant="secondary" className="text-xs">
                {bridgedData.pillars.length}
              </Badge>
            </div>
            {isSectionExpanded('pillars') ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isSectionExpanded('pillars') && (
            <div id="pillars-content" className="px-4 pb-4 space-y-3">
              {bridgedData.pillars.map((pillar, idx) => (
                <div key={idx} className="border-l-2 border-purple-500 pl-3 py-2">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {pillar.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {pillar.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pillar.keywords.slice(0, 5).map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Target Audience */}
      {bridgedData && (
        <Card className="bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection('audience')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
            aria-expanded={isSectionExpanded('audience')}
            aria-controls="audience-content"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Target Audience
              </h3>
            </div>
            {isSectionExpanded('audience') ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isSectionExpanded('audience') && (
            <div id="audience-content" className="px-4 pb-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Interests:
                </p>
                <div className="flex flex-wrap gap-1">
                  {bridgedData.audience.interests.slice(0, 8).map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Pain Points:
                </p>
                <ul className="space-y-1">
                  {bridgedData.audience.painPoints.map((pain, idx) => (
                    <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                      • {pain}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Opportunities */}
      {bridgedData && bridgedData.opportunities.length > 0 && (
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
              <Badge variant="secondary" className="text-xs">
                {bridgedData.opportunities.length}
              </Badge>
            </div>
            {isSectionExpanded('opportunities') ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isSectionExpanded('opportunities') && (
            <div id="opportunities-content" className="px-4 pb-4 space-y-3">
              {bridgedData.opportunities.map((opp, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {opp.type === 'reddit-discussion' ? '💬' :
                       opp.type === 'customer-pain' ? '🔍' :
                       opp.type === 'seasonal' ? '🗓️' : '💡'}
                    </span>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {opp.title}
                    </h4>
                    <Badge
                      variant={opp.impact === 'high' ? 'success' : opp.impact === 'medium' ? 'warning' : 'secondary'}
                      className="text-xs"
                    >
                      {opp.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {opp.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    → {opp.action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Key Insights */}
      {bridgedData && bridgedData.insights.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection('insights')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
            aria-expanded={isSectionExpanded('insights')}
            aria-controls="insights-content"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Key Insights
              </h3>
            </div>
            {isSectionExpanded('insights') ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isSectionExpanded('insights') && (
            <div id="insights-content" className="px-4 pb-4">
              <ul className="space-y-2">
                {bridgedData.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">💡</span>
                    <span className="text-gray-900 dark:text-gray-100">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
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
