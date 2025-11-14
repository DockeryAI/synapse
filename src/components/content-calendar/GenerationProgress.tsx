/**
 * Generation Progress Component
 * Shows real-time progress during content generation
 * Task 12 - Production Ready Implementation
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';

export interface GenerationProgressProps {
  isOpen: boolean;
  current: number;
  total: number;
  currentStep: string;
  isComplete?: boolean;
}

export function GenerationProgress({
  isOpen,
  current,
  total,
  currentStep,
  isComplete = false,
}: GenerationProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generation Complete!
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-blue-500" />
                Creating Your Content
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? `Successfully generated ${total} professional posts!`
              : 'Your brand-specific content is being generated...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={percentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {current} of {total} posts
              </span>
              <span>{percentage}%</span>
            </div>
          </div>

          {/* Current Step */}
          {!isComplete && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-muted-foreground">{currentStep}</span>
            </div>
          )}

          {/* Encouraging Messages */}
          {isComplete && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300">
              <p className="font-medium mb-1">Your content is ready!</p>
              <p className="text-xs">
                All posts have been enhanced with AI and scored for quality. Review and schedule
                them now.
              </p>
            </div>
          )}

          {!isComplete && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
              <p className="text-xs">
                Each post is being personalized with your brand voice and optimized for engagement.
                This typically takes 45-60 seconds.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage generation progress state
 */
export function useGenerationProgress() {
  const [progress, setProgress] = React.useState({
    isOpen: false,
    current: 0,
    total: 30,
    currentStep: '',
    isComplete: false,
  });

  const startProgress = (total: number = 30) => {
    setProgress({
      isOpen: true,
      current: 0,
      total,
      currentStep: 'Loading your brand data...',
      isComplete: false,
    });
  };

  const updateProgress = (current: number, step: string) => {
    setProgress((prev) => ({
      ...prev,
      current,
      currentStep: step,
    }));
  };

  const completeProgress = () => {
    setProgress((prev) => ({
      ...prev,
      current: prev.total,
      currentStep: '',
      isComplete: true,
    }));

    // Auto-close after 2 seconds
    setTimeout(() => {
      closeProgress();
    }, 2000);
  };

  const closeProgress = () => {
    setProgress({
      isOpen: false,
      current: 0,
      total: 30,
      currentStep: '',
      isComplete: false,
    });
  };

  return {
    progress,
    startProgress,
    updateProgress,
    completeProgress,
    closeProgress,
  };
}
