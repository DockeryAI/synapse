/**
 * ModeToggle Component
 * Toggle between Content and Campaign mode
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/v2/ModeContext';
import type { CampaignMode } from '@/types/v2';

interface ModeToggleProps {
  className?: string;
  onModeChange?: (mode: CampaignMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  className,
  onModeChange
}) => {
  const { mode, setMode } = useMode();

  const handleModeChange = (newMode: CampaignMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}>
      <button
        type="button"
        onClick={() => handleModeChange('content')}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
          mode === 'content'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={mode === 'content'}
      >
        <span className="flex items-center gap-2">
          <ContentIcon className="w-4 h-4" />
          Content
        </span>
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('campaign')}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
          mode === 'campaign'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={mode === 'campaign'}
      >
        <span className="flex items-center gap-2">
          <CampaignIcon className="w-4 h-4" />
          Campaign
        </span>
      </button>
    </div>
  );
};

// Simple icons
const ContentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CampaignIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export default ModeToggle;
