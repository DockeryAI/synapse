/**
 * Validation Mode Controls
 * UI controls for accepting/rejecting AI suggestions in UVP wizard
 *
 * Features:
 * - Accept/Reject/Edit actions for AI suggestions
 * - Validation statistics dashboard
 * - Progress tracking
 * - Bulk actions support
 *
 * Created: 2025-11-15
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AIBadge, AIBadgeWithEvidence } from './AIBadge'
import type { UVP } from '@/types/uvp-wizard'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ValidationAction {
  field: keyof UVP
  action: 'accept' | 'reject' | 'edit'
  previousValue?: string
  newValue?: string
}

export interface ValidationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  edited: number
}

export interface ValidationModeControlsProps {
  /** Field being validated */
  field: keyof UVP
  /** Current validation status */
  status: 'pending' | 'accepted' | 'rejected' | 'edited' | null
  /** Confidence score */
  confidence: number
  /** Data sources */
  sources?: string[]
  /** Supporting evidence */
  evidence?: string[]
  /** Accept callback */
  onAccept: () => void
  /** Reject callback */
  onReject: () => void
  /** Edit callback */
  onEdit?: () => void
  /** Custom className */
  className?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Validation Mode Controls
 * Shows accept/reject buttons for AI suggestions
 */
export const ValidationModeControls: React.FC<ValidationModeControlsProps> = ({
  field,
  status,
  confidence,
  sources = [],
  evidence = [],
  onAccept,
  onReject,
  onEdit,
  className = ''
}) => {
  if (status === null) {
    return null // Not an AI-suggested field
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* AI Badge with Evidence */}
      <AIBadgeWithEvidence
        confidence={confidence}
        sources={sources}
        evidence={evidence}
        validationStatus={status}
        showEvidence={false}
      />

      {/* Action Buttons */}
      {status === 'pending' && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAccept}
            className="text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
          >
            <span className="mr-1">✓</span>
            Accept
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <span className="mr-1">✗</span>
            Reject
          </Button>

          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <span className="mr-1">✏️</span>
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Status Message */}
      {status !== 'pending' && (
        <div className="text-xs text-muted-foreground">
          {status === 'accepted' && '✓ You accepted this AI suggestion'}
          {status === 'rejected' && '✗ You rejected this AI suggestion'}
          {status === 'edited' && '✏️ You edited this AI suggestion'}
        </div>
      )}
    </div>
  )
}

/**
 * Compact Validation Controls
 * Minimal inline version
 */
export const CompactValidationControls: React.FC<ValidationModeControlsProps> = ({
  status,
  onAccept,
  onReject,
  className = ''
}) => {
  if (status !== 'pending') {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        onClick={onAccept}
        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
        title="Accept AI suggestion"
      >
        ✓
      </button>
      <button
        onClick={onReject}
        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        title="Reject AI suggestion"
      >
        ✗
      </button>
    </div>
  )
}

// ============================================================================
// VALIDATION STATISTICS DASHBOARD
// ============================================================================

export interface ValidationStatsDashboardProps {
  stats: ValidationStats
  className?: string
}

/**
 * Validation Statistics Dashboard
 * Shows overall validation progress and stats
 */
export const ValidationStatsDashboard: React.FC<ValidationStatsDashboardProps> = ({
  stats,
  className = ''
}) => {
  const progressPercentage = stats.total > 0
    ? Math.round(((stats.accepted + stats.rejected + stats.edited) / stats.total) * 100)
    : 0

  return (
    <div className={cn('p-4 bg-muted/50 rounded-lg space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">AI Suggestion Review</h3>
        <Badge variant="outline" className="text-xs">
          {progressPercentage}% Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <StatCard
          label="Total"
          value={stats.total}
          className="bg-background"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        />
        <StatCard
          label="Reviewed"
          value={stats.rejected + stats.edited}
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        />
      </div>
    </div>
  )
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string
  value: number
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, className = '' }) => {
  return (
    <div className={cn('p-2 rounded-md', className)}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ============================================================================
// FIELD WRAPPER WITH VALIDATION
// ============================================================================

export interface ValidatedFieldWrapperProps {
  /** Field name */
  field: keyof UVP
  /** Field label */
  label: string
  /** Is this field AI-detected? */
  isAIDetected: boolean
  /** Confidence score */
  confidence?: number
  /** Data sources */
  sources?: string[]
  /** Evidence */
  evidence?: string[]
  /** Validation status */
  validationStatus?: 'pending' | 'accepted' | 'rejected' | 'edited' | null
  /** Accept handler */
  onAccept?: () => void
  /** Reject handler */
  onReject?: () => void
  /** Edit handler */
  onEdit?: () => void
  /** Children (field input) */
  children: React.ReactNode
  /** Custom className */
  className?: string
}

/**
 * Validated Field Wrapper
 * Wraps a wizard field with AI badge and validation controls
 */
export const ValidatedFieldWrapper: React.FC<ValidatedFieldWrapperProps> = ({
  field,
  label,
  isAIDetected,
  confidence = 0,
  sources = [],
  evidence = [],
  validationStatus = null,
  onAccept,
  onReject,
  onEdit,
  children,
  className = ''
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Field Label with AI Badge */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
        </label>

        {isAIDetected && (
          <AIBadge
            confidence={confidence}
            sources={sources}
            validationStatus={validationStatus || undefined}
            showDetails={false}
          />
        )}
      </div>

      {/* Field Input */}
      {children}

      {/* Validation Controls */}
      {isAIDetected && onAccept && onReject && (
        <ValidationModeControls
          field={field}
          status={validationStatus}
          confidence={confidence}
          sources={sources}
          evidence={evidence}
          onAccept={onAccept}
          onReject={onReject}
          onEdit={onEdit}
        />
      )}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ValidationModeControls
