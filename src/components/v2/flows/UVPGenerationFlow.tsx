/**
 * UVP Generation Flow - Stub Component
 * TODO: Implement full UVP generation flow in future sprint
 */

import * as React from 'react';

export interface UVPResult {
  uvp: string;
  confidence: number;
  insights: string[];
}

interface UVPGenerationFlowProps {
  onComplete?: (result: UVPResult) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export const UVPGenerationFlow: React.FC<UVPGenerationFlowProps> = ({
  onComplete,
  onError,
  onCancel
}) => {
  return (
    <div className="p-8 text-center border rounded-lg bg-muted/50">
      <h3 className="text-lg font-semibold mb-2">UVP Generation Flow</h3>
      <p className="text-muted-foreground mb-4">
        This component will be implemented in a future sprint.
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => onComplete?.({
            uvp: 'Sample UVP',
            confidence: 0.85,
            insights: ['Insight 1', 'Insight 2']
          })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Simulate Complete
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UVPGenerationFlow;
