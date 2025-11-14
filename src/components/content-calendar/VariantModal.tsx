/**
 * Variant Modal
 *
 * Modal for displaying and selecting A/B test variants
 * Shows all variant strategies (Scarcity, FOMO, Exclusivity, Urgency, Social Proof)
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Loader2 } from 'lucide-react';
import type { ABTestGroup, ContentVariant, SynapseContent } from '@/types/synapse/synapseContent.types';

interface VariantModalProps {
  open: boolean;
  onClose: () => void;
  variants: ABTestGroup | null;
  loading: boolean;
  onSelectVariant: (variant: SynapseContent) => void;
}

export function VariantModal({
  open,
  onClose,
  variants,
  loading,
  onSelectVariant,
}: VariantModalProps) {
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getFullText = (variant: ContentVariant): string => {
    const content = variant.content.content;
    return `${content.headline}\n\n${content.hook}\n\n${content.body}\n\n${content.cta}`;
  };

  const getStrategyColor = (strategy: string): string => {
    switch (strategy) {
      case 'scarcity':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'fomo':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'exclusivity':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'urgency':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'social-proof':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>A/B Test Variants</DialogTitle>
          <DialogDescription>
            Select a variant to use or compare strategies
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-2">Generating variants...</span>
          </div>
        )}

        {!loading && variants && (
          <div className="space-y-4">
            {/* Recommended Test */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-semibold text-blue-900 mb-1">
                Recommended Testing Order
              </div>
              <div className="text-sm text-blue-700">{variants.recommendedTest}</div>
            </div>

            {/* Variants */}
            <div className="space-y-4">
              {variants.variants.map((variant) => (
                <Card key={variant.id} className="p-4 border-2 hover:border-purple-300 transition-colors">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-600">
                          Variant {variant.variantLetter}
                        </span>
                        <Badge
                          variant="outline"
                          className={getStrategyColor(variant.strategy)}
                        >
                          {variant.strategy.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(getFullText(variant))}
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            onSelectVariant(variant.content);
                            onClose();
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Use This Variant
                        </Button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-600">Headline:</span>
                        <p className="text-sm mt-1">{variant.content.content.headline}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600">Hook:</span>
                        <p className="text-sm mt-1">{variant.content.content.hook}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600">Body:</span>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {variant.content.content.body}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600">CTA:</span>
                        <p className="text-sm mt-1">{variant.content.content.cta}</p>
                      </div>
                    </div>

                    {/* Differences */}
                    <div className="bg-purple-50 rounded p-2">
                      <div className="text-xs font-semibold text-purple-700 mb-1">
                        Changes from Original:
                      </div>
                      <ul className="text-xs text-purple-600 space-y-0.5">
                        {variant.differenceFromOriginal.map((diff, idx) => (
                          <li key={idx}>• {diff}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
