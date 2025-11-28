/**
 * SynthesisErrorBanner
 *
 * Displays synthesis errors with retry capability.
 * Used across all V3.2 synthesis-integrated components.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SynthesisErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function SynthesisErrorBanner({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  className = ''
}: SynthesisErrorBannerProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={`mb-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          Synthesis unavailable: {error}
        </span>
        <div className="flex items-center gap-2 ml-4">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
