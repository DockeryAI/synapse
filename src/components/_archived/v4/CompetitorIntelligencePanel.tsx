/**
 * CompetitorIntelligencePanel - Stub Component
 *
 * Placeholder for competitor intelligence accordion UI.
 * Full implementation pending.
 */

import React from 'react';

interface CompetitorIntelligencePanelProps {
  competitors?: any[];
  gaps?: any[];
  enhancedInsights?: any[];
  customerVoiceByCompetitor?: Record<string, any>;
  isLoading?: boolean;
  isDiscovering?: boolean;
  isScanning?: boolean;
  brandName?: string;
  onSelectGap?: (gap: any) => void;
  onToggleCompetitor?: (id: string) => void;
  onRemoveCompetitor?: (id: string) => void;
  onRescanCompetitor?: (id: string) => void;
  onDiscoverCompetitors?: () => void;
  onAddCompetitor?: (name: string) => void;
  onIdentifyCompetitor?: (competitorId: string) => void;
}

export function CompetitorIntelligencePanel({
  competitors = [],
  gaps = [],
  isLoading = false,
  isDiscovering = false,
}: CompetitorIntelligencePanelProps) {
  if (isLoading || isDiscovering) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Loading competitor data...</p>
      </div>
    );
  }

  if (competitors.length === 0 && gaps.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No competitor data available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-sm text-gray-600">
        {competitors.length} competitors, {gaps.length} gaps detected
      </p>
    </div>
  );
}

export default CompetitorIntelligencePanel;
