/**
 * Competitor Chips Bar
 *
 * Horizontal bar showing competitor chips for the Gap Tab 2.0.
 * Features:
 * - Selectable chips to filter gaps by competitor
 * - Add new competitor button with verification
 * - Remove competitors
 * - Scanning progress indicator
 * - Gap count badges
 *
 * Created: 2025-11-28
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Loader2,
  Building2,
  RefreshCw,
  Check,
  AlertCircle,
  Search,
  Sparkles,
  Globe,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import type { CompetitorChipState, DiscoveredCompetitor } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorChipsBarProps {
  competitors: CompetitorChipState[];
  isDiscovering?: boolean;
  onToggleCompetitor: (competitorId: string) => void;
  onRemoveCompetitor: (competitorId: string) => void;
  onAddCompetitor: (competitor: DiscoveredCompetitor, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
  onIdentifyCompetitor: (name: string, website?: string) => Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }>;
  onRescanCompetitor: (competitorId: string) => void;
  onDiscoverCompetitors?: () => void;
}

// ============================================================================
// ADD COMPETITOR DIALOG - 3-STEP FLOW
// Step 1: Enter name/website
// Step 2: Confirm identified competitor
// Step 3: Scanning progress
// ============================================================================

type AddCompetitorStep = 'input' | 'confirm' | 'scanning';

interface AddCompetitorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentify: (name: string, website?: string) => Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }>;
  onAdd: (competitor: DiscoveredCompetitor, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
}

const AddCompetitorDialog = memo(function AddCompetitorDialog({
  isOpen,
  onClose,
  onIdentify,
  onAdd
}: AddCompetitorDialogProps) {
  // Step state
  const [step, setStep] = useState<AddCompetitorStep>('input');

  // Input state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  // Identification state
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifiedCompetitor, setIdentifiedCompetitor] = useState<DiscoveredCompetitor | null>(null);
  const [alternatives, setAlternatives] = useState<DiscoveredCompetitor[]>([]);

  // Scanning state
  const [scanStage, setScanStage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setStep('input');
    setName('');
    setWebsite('');
    setIdentifiedCompetitor(null);
    setAlternatives([]);
    setScanStage('');
    setScanProgress(0);
    setError(null);
    setIsIdentifying(false);
    onClose();
  }, [onClose]);

  // Step 1: Identify the competitor
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Competitor name is required');
      return;
    }

    setIsIdentifying(true);
    setError(null);

    try {
      const result = await onIdentify(name.trim(), website.trim() || undefined);

      if (result.found && result.competitor) {
        setIdentifiedCompetitor(result.competitor);
        setAlternatives(result.alternatives || []);
        setStep('confirm');
      } else {
        setError(result.error || 'Could not identify this competitor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to identify competitor');
    } finally {
      setIsIdentifying(false);
    }
  };

  // Step 2: Select a competitor (main or alternative)
  const handleSelectCompetitor = (competitor: DiscoveredCompetitor) => {
    setIdentifiedCompetitor(competitor);
  };

  // Step 2 -> 3: Confirm and start scanning
  const handleConfirmAndScan = async () => {
    if (!identifiedCompetitor) return;

    setStep('scanning');
    setScanProgress(0);
    setScanStage('Starting...');

    try {
      await onAdd(identifiedCompetitor, (stage, progress) => {
        setScanStage(stage);
        setScanProgress(progress);
      });

      // Success - close dialog after brief delay to show completion
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
      setStep('confirm'); // Go back to confirm step on error
    }
  };

  // Go back to input step
  const handleBack = () => {
    setStep('input');
    setIdentifiedCompetitor(null);
    setAlternatives([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        {/* Step 1: Input */}
        {step === 'input' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Competitor
            </h3>

            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Competitor Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Salesforce"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                  disabled={isIdentifying}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://competitor.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isIdentifying}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isIdentifying}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIdentifying || !name.trim()}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isIdentifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Identifying...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find Competitor
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && identifiedCompetitor && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Competitor
              </h3>
            </div>

            <div className="space-y-4">
              {/* Main identified competitor */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  identifiedCompetitor === identifiedCompetitor
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {identifiedCompetitor.name}
                    </h4>
                    {identifiedCompetitor.website && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {identifiedCompetitor.website}
                      </div>
                    )}
                    {identifiedCompetitor.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {identifiedCompetitor.description}
                      </p>
                    )}
                    {identifiedCompetitor.reason && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        {identifiedCompetitor.reason}
                      </p>
                    )}
                  </div>
                  <Check className="w-5 h-5 text-purple-600" />
                </div>
              </div>

              {/* Alternatives if any */}
              {alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Did you mean one of these instead?
                  </p>
                  {alternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectCompetitor(alt)}
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {alt.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAndScan}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Add & Scan
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Scanning */}
        {step === 'scanning' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Scanning Competitor
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {identifiedCompetitor?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {scanStage}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <motion.div
                  className="bg-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {Math.round(scanProgress)}% complete
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
});

// ============================================================================
// COMPETITOR CHIP
// ============================================================================

interface CompetitorChipProps {
  competitor: CompetitorChipState;
  onToggle: () => void;
  onRemove: () => void;
  onRescan: () => void;
}

const CompetitorChip = memo(function CompetitorChip({
  competitor,
  onToggle,
  onRemove,
  onRescan
}: CompetitorChipProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={onToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(true);
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 border-2
          ${competitor.is_selected
            ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 text-purple-800 dark:text-purple-200'
            : 'bg-gray-100 dark:bg-slate-700 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'
          }
          ${competitor.is_scanning ? 'animate-pulse' : ''}
        `}
      >
        {/* Logo or Icon */}
        {competitor.logo_url ? (
          <img
            src={competitor.logo_url}
            alt={competitor.name}
            className="w-4 h-4 rounded-full object-cover"
          />
        ) : (
          <Building2 className="w-4 h-4" />
        )}

        {/* Name */}
        <span className="max-w-[120px] truncate">{competitor.name}</span>

        {/* Scanning indicator */}
        {competitor.is_scanning && (
          <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
        )}

        {/* Gap count badge */}
        {!competitor.is_scanning && competitor.gap_count > 0 && (
          <span className={`
            px-1.5 py-0.5 text-xs rounded-full
            ${competitor.is_selected
              ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
              : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
            }
          `}>
            {competitor.gap_count}
          </span>
        )}

        {/* Remove button (on selected) - using span to avoid button nesting */}
        {competitor.is_selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onRemove();
              }
            }}
            className="ml-1 p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </motion.button>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 min-w-[140px]"
            >
              <button
                onClick={() => {
                  onRescan();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Rescan
              </button>
              <button
                onClick={() => {
                  onRemove();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorChipsBar = memo(function CompetitorChipsBar({
  competitors,
  isDiscovering,
  onToggleCompetitor,
  onRemoveCompetitor,
  onAddCompetitor,
  onIdentifyCompetitor,
  onRescanCompetitor,
  onDiscoverCompetitors
}: CompetitorChipsBarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedCount = competitors.filter(c => c.is_selected).length;

  return (
    <>
      <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Competitors
            </span>
            {competitors.length > 0 && (
              <span className="text-xs text-gray-500">
                ({selectedCount} of {competitors.length} selected)
              </span>
            )}
          </div>

          {/* Discover button */}
          {onDiscoverCompetitors && competitors.length === 0 && (
            <button
              onClick={onDiscoverCompetitors}
              disabled={isDiscovering}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  Auto-discover
                </>
              )}
            </button>
          )}
        </div>

        {/* Chips Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Competitor Chips */}
          {competitors.map((competitor) => (
            <CompetitorChip
              key={competitor.id}
              competitor={competitor}
              onToggle={() => onToggleCompetitor(competitor.id)}
              onRemove={() => onRemoveCompetitor(competitor.id)}
              onRescan={() => onRescanCompetitor(competitor.id)}
            />
          ))}

          {/* Discovering indicator */}
          {isDiscovering && competitors.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Discovering competitors...</span>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>

          {/* Empty state */}
          {competitors.length === 0 && !isDiscovering && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Sparkles className="w-4 h-4" />
              <span>Add competitors to discover market gaps</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Competitor Dialog */}
      <AddCompetitorDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onIdentify={onIdentifyCompetitor}
        onAdd={onAddCompetitor}
      />
    </>
  );
});

export default CompetitorChipsBar;
