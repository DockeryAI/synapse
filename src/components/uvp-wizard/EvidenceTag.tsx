/**
 * Evidence Tag Component
 * Displays evidence metadata for UVP suggestions
 *
 * Features:
 * - Shows evidence source (where it came from)
 * - Displays frequency count (how many times mentioned)
 * - Shows confidence percentage
 * - Tooltips for additional context
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface Evidence {
  source: string;
  frequency: number;
  confidence: number;
  quote: string;
}

interface EvidenceTagProps {
  evidence: Evidence;
  className?: string;
}

/**
 * EvidenceTag Component
 * Displays evidence metadata as small badges with icons
 */
export const EvidenceTag: React.FC<EvidenceTagProps> = ({ evidence, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Source Badge */}
      <Badge
        variant="secondary"
        className="text-xs"
        title={`Found in: ${evidence.source}`}
      >
        <span className="mr-1">📍</span>
        {evidence.source}
      </Badge>

      {/* Frequency Badge (only show if > 1) */}
      {evidence.frequency > 1 && (
        <Badge
          variant="secondary"
          className="text-xs"
          title={`Mentioned ${evidence.frequency} times`}
        >
          <span className="mr-1">🔄</span>
          {evidence.frequency}x
        </Badge>
      )}

      {/* Confidence Badge */}
      <Badge
        variant="secondary"
        className="text-xs"
        title={`${evidence.confidence}% confidence based on analysis`}
      >
        <span className="mr-1">✓</span>
        {evidence.confidence}%
      </Badge>
    </div>
  );
};

/**
 * Compact Evidence Tag
 * Minimal version for tight spaces
 */
export const CompactEvidenceTag: React.FC<EvidenceTagProps> = ({ evidence, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <span title={`Source: ${evidence.source}`}>
        📍 {evidence.source}
      </span>
      {evidence.frequency > 1 && (
        <span title={`Mentioned ${evidence.frequency} times`}>
          • {evidence.frequency}x
        </span>
      )}
      <span title={`${evidence.confidence}% confidence`}>
        • {evidence.confidence}%
      </span>
    </div>
  );
};

/**
 * Evidence Tag with Quote
 * Shows evidence quote below tags
 */
interface EvidenceTagWithQuoteProps extends EvidenceTagProps {
  showQuote?: boolean;
}

export const EvidenceTagWithQuote: React.FC<EvidenceTagWithQuoteProps> = ({
  evidence,
  className = '',
  showQuote = true
}) => {
  return (
    <div className={className}>
      <EvidenceTag evidence={evidence} />
      {showQuote && evidence.quote && (
        <div className="text-sm text-muted-foreground italic mt-2">
          "{evidence.quote}"
        </div>
      )}
    </div>
  );
};

export default EvidenceTag;
