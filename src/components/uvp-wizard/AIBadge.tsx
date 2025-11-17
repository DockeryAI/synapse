/**
 * AI Badge Component
 * Displays AI auto-population indicators for UVP wizard fields
 *
 * Features:
 * - Shows AI detection indicator
 * - Displays confidence level (high/medium/low)
 * - Shows data sources used
 * - Tooltips for evidence and transparency
 * - Validation status badges
 *
 * Created: 2025-11-15
 */

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AIBadgeProps {
  /** Confidence level (0-1) */
  confidence: number
  /** Data sources used */
  sources?: string[]
  /** Supporting evidence */
  evidence?: string[]
  /** Validation status */
  validationStatus?: 'pending' | 'accepted' | 'rejected' | 'edited'
  /** Custom className */
  className?: string
  /** Show full details */
  showDetails?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AI Badge - Full Version
 * Shows AI detection indicator with confidence and sources
 */
export const AIBadge: React.FC<AIBadgeProps> = ({
  confidence,
  sources = [],
  evidence = [],
  validationStatus,
  className = '',
  showDetails = false
}) => {
  const confidenceLevel = getConfidenceLevel(confidence)
  const confidenceColor = getConfidenceColor(confidenceLevel)
  const confidencePercentage = Math.round(confidence * 100)

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* AI Detection Badge */}
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-medium',
          confidenceColor.bg,
          confidenceColor.text,
          confidenceColor.border
        )}
        title={`AI-detected with ${confidencePercentage}% confidence`}
      >
        <span className="mr-1">✨</span>
        AI · {confidenceLevel.toUpperCase()}
      </Badge>

      {/* Confidence Score */}
      {showDetails && (
        <Badge
          variant="secondary"
          className="text-xs"
          title={`Confidence: ${confidencePercentage}%`}
        >
          <span className="mr-1">📊</span>
          {confidencePercentage}%
        </Badge>
      )}

      {/* Data Sources */}
      {showDetails && sources.length > 0 && (
        <Badge
          variant="secondary"
          className="text-xs"
          title={`Sources: ${sources.join(', ')}`}
        >
          <span className="mr-1">📚</span>
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </Badge>
      )}

      {/* Validation Status */}
      {validationStatus && validationStatus !== 'pending' && (
        <ValidationBadge status={validationStatus} />
      )}
    </div>
  )
}

/**
 * Compact AI Badge
 * Minimal version for tight spaces
 */
export const CompactAIBadge: React.FC<AIBadgeProps> = ({
  confidence,
  validationStatus,
  className = ''
}) => {
  const confidenceLevel = getConfidenceLevel(confidence)
  const confidenceColor = getConfidenceColor(confidenceLevel)

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        confidenceColor.bg,
        confidenceColor.text,
        confidenceColor.border,
        className
      )}
      title={`AI-detected (${Math.round(confidence * 100)}% confidence)`}
    >
      <span className="mr-1">✨</span>
      {validationStatus === 'accepted' && '✓ '}
      {validationStatus === 'rejected' && '✗ '}
      {validationStatus === 'edited' && '✏️ '}
      AI
    </Badge>
  )
}

/**
 * AI Badge with Evidence
 * Shows AI badge with expandable evidence list
 */
interface AIBadgeWithEvidenceProps extends AIBadgeProps {
  showEvidence?: boolean
}

export const AIBadgeWithEvidence: React.FC<AIBadgeWithEvidenceProps> = ({
  confidence,
  sources = [],
  evidence = [],
  validationStatus,
  className = '',
  showEvidence = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(showEvidence)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main Badge */}
      <div className="flex items-center gap-2">
        <AIBadge
          confidence={confidence}
          sources={sources}
          validationStatus={validationStatus}
          showDetails={true}
        />

        {/* Expand Evidence Button */}
        {evidence.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            title={isExpanded ? 'Hide evidence' : 'Show evidence'}
          >
            {isExpanded ? '▼' : '▶'} Evidence
          </button>
        )}
      </div>

      {/* Evidence List */}
      {isExpanded && evidence.length > 0 && (
        <div className="pl-4 space-y-1 border-l-2 border-muted">
          {evidence.map((item, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground"
            >
              • {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Validation Status Badge
 * Shows user validation status for AI suggestions (with dark mode support)
 */
const ValidationBadge: React.FC<{ status: 'accepted' | 'rejected' | 'edited' }> = ({ status }) => {
  const config = {
    accepted: {
      icon: '✓',
      label: 'Accepted',
      className: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
    },
    rejected: {
      icon: '✗',
      label: 'Rejected',
      className: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
    },
    edited: {
      icon: '✏️',
      label: 'Edited',
      className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
    }
  }[status]

  return (
    <Badge
      variant="outline"
      className={cn('text-xs', config.className)}
      title={`User ${config.label.toLowerCase()} this suggestion`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get confidence level label
 */
function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

/**
 * Get confidence level color classes (with dark mode support)
 */
function getConfidenceColor(level: 'high' | 'medium' | 'low') {
  const colors = {
    high: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-700'
    },
    medium: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-700'
    },
    low: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-700'
    }
  }

  return colors[level]
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIBadge
