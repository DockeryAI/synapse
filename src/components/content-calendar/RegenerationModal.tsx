/**
 * Regeneration Modal
 *
 * Modal for regenerating individual content sections
 * Displays 3-5 variations per section (headline, hook, body, CTA)
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
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import type {
  RegenerationResult,
  ContentSection,
} from '@/types/synapse/synapseContent.types';

interface RegenerationModalProps {
  open: boolean;
  onClose: () => void;
  section: ContentSection | null;
  result: RegenerationResult | null;
  loading: boolean;
  onSelectOption: (section: ContentSection, optionIndex: number) => void;
  onRegenerate?: () => void;
}

export function RegenerationModal({
  open,
  onClose,
  section,
  result,
  loading,
  onSelectOption,
  onRegenerate,
}: RegenerationModalProps) {
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getSectionLabel = (sec: ContentSection): string => {
    return sec.charAt(0).toUpperCase() + sec.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Regenerate {section ? getSectionLabel(section) : 'Section'}
          </DialogTitle>
          <DialogDescription>
            Choose a variation to replace the current {section}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-2">Generating variations...</span>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            {/* Original */}
            <Card className="p-4 bg-gray-50 border-2">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-gray-200">
                  Current {getSectionLabel(result.section)}
                </Badge>
                {onRegenerate && (
                  <Button variant="ghost" size="sm" onClick={onRegenerate}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate Again
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{result.original}</p>
            </Card>

            {/* Reasoning */}
            {result.reasoning && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-blue-900 mb-1">
                  Why Regenerate?
                </div>
                <div className="text-sm text-blue-700">{result.reasoning}</div>
              </div>
            )}

            {/* Regenerated Options */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700">
                Choose a Variation ({result.regenerated.length} options):
              </div>

              {result.regenerated.map((option, index) => (
                <Card
                  key={index}
                  className="p-4 border-2 hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => {
                    onSelectOption(result.section, index);
                    onClose();
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Option {index + 1}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(option);
                          }}
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOption(result.section, index);
                            onClose();
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Use This
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{option}</p>
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
