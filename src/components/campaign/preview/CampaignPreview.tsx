/**
 * CAMPAIGN PREVIEW CONTAINER
 *
 * Main container component that orchestrates the entire campaign preview and editing workflow.
 *
 * Features:
 * - Header with campaign name and type badge
 * - Platform tabs for switching between platforms
 * - Preview card per platform
 * - Inline editing with EditSection component
 * - Footer actions: "Edit", "Approve", "Regenerate All"
 * - Loading states
 * - Integration with content generators for regeneration
 *
 * Props:
 * - campaignData: The campaign content to preview
 * - onApprove: Callback when user approves campaign
 * - onReject: Callback when user rejects campaign
 * - onRegenerateAll: Callback to regenerate all content
 * - onSectionRegenerate: Callback to regenerate a specific section
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import {
  type SupportedPlatform,
  type PreviewMode,
  type ContentSection,
  type CampaignPreviewData,
  type RegenerationResult,
  type RegenerationOptions
} from '@/types/campaign-preview.types';
import { PlatformTabs } from './PlatformTabs';
import { CampaignPreviewCard } from './CampaignPreviewCard';
import { EditSection } from './EditSection';

// ============================================================================
// CAMPAIGN TYPE BADGE
// ============================================================================

interface CampaignTypeBadgeProps {
  type: 'authority-builder' | 'social-proof' | 'local-pulse';
}

const CampaignTypeBadge: React.FC<CampaignTypeBadgeProps> = ({ type }) => {
  const badgeConfig = {
    'authority-builder': {
      label: '🎓 Authority Builder',
      className: 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
    },
    'social-proof': {
      label: '⭐ Social Proof',
      className: 'bg-gradient-to-r from-green-100 to-blue-100 text-green-700 dark:from-green-900/30 dark:to-blue-900/30 dark:text-green-400 border border-green-200 dark:border-green-700'
    },
    'local-pulse': {
      label: '📍 Local Pulse',
      className: 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
    }
  };

  const config = badgeConfig[type];

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${config.className}`}
    >
      {config.label}
    </motion.span>
  );
};

// ============================================================================
// CAMPAIGN PREVIEW HEADER
// ============================================================================

interface CampaignPreviewHeaderProps {
  campaignName: string;
  campaignType: 'authority-builder' | 'social-proof' | 'local-pulse';
  createdAt: Date;
}

const CampaignPreviewHeader: React.FC<CampaignPreviewHeaderProps> = ({
  campaignName,
  campaignType,
  createdAt
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-b border-purple-200 dark:border-purple-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {campaignName}
          </h1>
          <div className="flex items-center gap-3">
            <CampaignTypeBadge type={campaignType} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Created {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Campaign Status Indicator */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-yellow-500 rounded-full"
          />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Awaiting Approval
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CAMPAIGN PREVIEW ACTIONS
// ============================================================================

interface CampaignPreviewActionsProps {
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRegenerateAll: () => void;
  isEditing: boolean;
  isLoading: boolean;
}

const CampaignPreviewActions: React.FC<CampaignPreviewActionsProps> = ({
  onEdit,
  onApprove,
  onReject,
  onRegenerateAll,
  isEditing,
  isLoading
}) => {
  return (
    <div className="sticky bottom-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-t border-purple-200 dark:border-purple-700 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-3">
          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              👁️ Back to Preview
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRegenerateAll}
            disabled={isLoading}
            className="px-4 py-2 border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.span>
                Regenerating...
              </>
            ) : (
              <>
                <Zap size={16} />
                Regenerate All
              </>
            )}
          </motion.button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="px-6 py-2 border-2 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-lg"
          >
            ❌ Reject
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onApprove}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Sparkles size={18} />
            Approve & Publish
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGN PREVIEW (Main Container)
// ============================================================================

interface CampaignPreviewProps {
  campaignData: CampaignPreviewData;
  onApprove: () => void;
  onReject: () => void;
  onRegenerateAll: () => Promise<void>;
  onSectionRegenerate?: (
    platform: SupportedPlatform,
    section: ContentSection,
    options?: RegenerationOptions
  ) => Promise<RegenerationResult>;
}

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  campaignData,
  onApprove,
  onReject,
  onRegenerateAll,
  onSectionRegenerate
}) => {
  const [activePlatform, setActivePlatform] = useState<SupportedPlatform>(campaignData.platforms[0]);
  const [mode, setMode] = useState<PreviewMode>('preview');
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [editedContent, setEditedContent] = useState<CampaignPreviewData>(campaignData);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeChange = (newMode: PreviewMode) => {
    setMode(newMode);
    if (newMode === 'preview') {
      setEditingSection(null);
    }
  };

  const handleEditSection = (section: ContentSection) => {
    setEditingSection(section);
    setMode('edit');
  };

  const handleSaveSection = () => {
    setEditingSection(null);
    setMode('preview');
  };

  const handleCancelEdit = () => {
    // Revert changes
    setEditedContent(campaignData);
    setEditingSection(null);
    setMode('preview');
  };

  const handleSectionValueChange = (value: string | string[]) => {
    if (!editingSection) return;

    setEditedContent((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [activePlatform]: {
          ...prev.content[activePlatform],
          sections: {
            ...prev.content[activePlatform].sections,
            [editingSection]: value
          }
        }
      }
    }));
  };

  const handleRegenerateAll = async () => {
    setIsLoading(true);
    try {
      await onRegenerateAll();
    } catch (error) {
      console.error('Failed to regenerate all:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionRegenerate = async (options?: RegenerationOptions): Promise<RegenerationResult> => {
    if (!editingSection || !onSectionRegenerate) {
      throw new Error('Section regeneration not available');
    }

    return await onSectionRegenerate(activePlatform, editingSection, options);
  };

  const currentPlatformContent = editedContent.content[activePlatform];
  const currentSectionValue = editingSection
    ? currentPlatformContent.sections[editingSection]
    : '';

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <CampaignPreviewHeader
        campaignName={editedContent.campaignName}
        campaignType={editedContent.campaignType}
        createdAt={editedContent.createdAt}
      />

      {/* Platform Tabs */}
      <PlatformTabs
        platforms={editedContent.platforms}
        activePlatform={activePlatform}
        onPlatformChange={setActivePlatform}
        platformContent={editedContent.content}
        mode={mode}
        onModeChange={handleModeChange}
      />

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {mode === 'preview' ? (
            // Preview Mode
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CampaignPreviewCard
                content={currentPlatformContent}
                platform={activePlatform}
                editable={true}
                showSocialPreview={true}
                onEditSection={handleEditSection}
              />
            </motion.div>
          ) : (
            // Edit Mode
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Preview */}
              <div className="bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-violet-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 p-4 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                  <Sparkles size={16} />
                  Current Preview
                </h3>
                <CampaignPreviewCard
                  content={currentPlatformContent}
                  platform={activePlatform}
                  editable={false}
                  showSocialPreview={false}
                  onEditSection={handleEditSection}
                />
              </div>

              {/* Editor */}
              {editingSection ? (
                <EditSection
                  section={editingSection}
                  value={currentSectionValue}
                  limit={currentPlatformContent.characterCounts[editingSection as keyof typeof currentPlatformContent.characterCounts]}
                  onChange={handleSectionValueChange}
                  onSave={handleSaveSection}
                  onCancel={handleCancelEdit}
                  onRegenerate={onSectionRegenerate ? handleSectionRegenerate : undefined}
                />
              ) : (
                <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 text-center shadow-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    Click "Edit" on any section above to start editing
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <CampaignPreviewActions
        onEdit={() => handleModeChange(mode === 'preview' ? 'edit' : 'preview')}
        onApprove={onApprove}
        onReject={onReject}
        onRegenerateAll={handleRegenerateAll}
        isEditing={mode === 'edit'}
        isLoading={isLoading}
      />
    </div>
  );
};
