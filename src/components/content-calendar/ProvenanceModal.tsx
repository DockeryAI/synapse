/**
 * Provenance Modal
 *
 * Modal for displaying content provenance
 * Shows data sources, psychology reasoning, and topic correlations
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProvenanceViewer } from '@/components/synapse/ProvenanceViewer';
import type { ContentProvenance } from '@/types/synapse/synapseContent.types';

interface ProvenanceModalProps {
  open: boolean;
  onClose: () => void;
  provenance: ContentProvenance | null;
}

export function ProvenanceModal({ open, onClose, provenance }: ProvenanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Provenance</DialogTitle>
          <DialogDescription>
            See how this content was built from data and insights
          </DialogDescription>
        </DialogHeader>

        {provenance ? (
          <ProvenanceViewer provenance={provenance} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No provenance data available for this content
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
