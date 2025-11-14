/**
 * ProvenanceViewer Component (Stub)
 * TODO: Implement provenance display
 */

import React from 'react';

interface ProvenanceViewerProps {
  provenance: {
    dataSources?: string[];
    generatedAt?: string;
    model?: string;
    psychologyTrigger?: string;
    [key: string]: any;
  };
}

export function ProvenanceViewer({ provenance }: ProvenanceViewerProps) {
  return (
    <div className="p-4 bg-gray-50 rounded text-sm space-y-2">
      <h4 className="font-semibold">Content Provenance</h4>
      {provenance.dataSources && (
        <div>
          <span className="text-muted-foreground">Sources:</span>{' '}
          {provenance.dataSources.join(', ')}
        </div>
      )}
      {provenance.psychologyTrigger && (
        <div>
          <span className="text-muted-foreground">Psychology:</span>{' '}
          {provenance.psychologyTrigger}
        </div>
      )}
      {provenance.model && (
        <div>
          <span className="text-muted-foreground">Model:</span> {provenance.model}
        </div>
      )}
    </div>
  );
}
