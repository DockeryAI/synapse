/**
 * CONFIRM CODE DETECTION DIALOG
 *
 * Shows after Opus detects NAICS code for free-form input
 * User must confirm the detection is correct before proceeding
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Edit3, Info, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

export interface ConfirmCodeDetectionDialogProps {
  open: boolean;
  userInput: string;
  detectedIndustry: string;
  naicsCode: string;
  confidence: number;
  reasoning: string;
  category?: string;
  keywords?: string[];
  onConfirm: () => void;
  onCorrect: () => void; // Let user choose different industry
}

export const ConfirmCodeDetectionDialog: React.FC<ConfirmCodeDetectionDialogProps> = ({
  open,
  userInput,
  detectedIndustry,
  naicsCode,
  confidence,
  reasoning,
  category,
  keywords,
  onConfirm,
  onCorrect,
}) => {
  const confidencePercentage = Math.round(confidence * 100);
  const confidenceColor =
    confidence >= 0.9
      ? 'text-green-600 dark:text-green-400'
      : confidence >= 0.7
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCorrect()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Industry Detection</DialogTitle>
              <DialogDescription className="mt-1">
                We found a match for your industry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Input */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">You entered:</div>
            <div className="font-medium text-lg">"{userInput}"</div>
          </div>

          {/* Detection Result */}
          <motion.div
            className="rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-4"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                  We detected:
                </div>
                <div className="font-bold text-xl text-purple-900 dark:text-purple-100">
                  {detectedIndustry}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  NAICS Code
                </div>
                <div className="font-mono font-semibold text-purple-900 dark:text-purple-100">
                  {naicsCode}
                </div>
              </div>
              {category && (
                <div>
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Category
                  </div>
                  <div className="font-semibold text-purple-900 dark:text-purple-100">
                    {category}
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Score */}
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Confidence Score
                </span>
                <span className={`text-lg font-bold ${confidenceColor}`}>
                  {confidencePercentage}%
                </span>
              </div>
              <div className="mt-2 w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2">
                <motion.div
                  className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercentage}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </div>
          </motion.div>

          {/* AI Reasoning */}
          <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Why we think this matches:
              </h4>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {reasoning}
            </p>
          </div>

          {/* Keywords (if available) */}
          {keywords && keywords.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Related terms:
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 6).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Question */}
          <div className="pt-2">
            <p className="text-sm font-medium text-center text-slate-900 dark:text-slate-100">
              Is this correct?
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCorrect}
            className="flex-1 sm:flex-initial"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            No, let me choose
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Yes, that's right
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
