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
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    },
    'social-proof': {
      label: '⭐ Social Proof',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    },
    'local-pulse': {
      label: '📍 Local Pulse',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
  };

  const config = badgeConfig[type];

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {campaignName}
          </h1>
          <div className="flex items-center gap-3">
            <CampaignTypeBadge type={campaignType} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Created {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Campaign Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Awaiting Approval
          </span>
        </div>
      </div>
    </div>
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
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        {/* Left Actions */}
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ✏️ Edit Content
            </button>
          ) : (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              👁️ Back to Preview
            </button>
          )}

          <button
            onClick={onRegenerateAll}
            disabled={isLoading}
            className="px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⚙️ Regenerating...' : '🔄 Regenerate All'}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReject}
            className="px-6 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            ❌ Reject
          </button>
          <button
            onClick={onApprove}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
          >
            ✅ Approve & Publish
          </button>
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
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
        {mode === 'preview' ? (
          // Preview Mode
          <CampaignPreviewCard
            content={currentPlatformContent}
            platform={activePlatform}
            editable={true}
            showSocialPreview={true}
            onEditSection={handleEditSection}
          />
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Current Preview */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
              <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Click "Edit" on any section above to start editing
                </p>
              </div>
            )}
          </div>
        )}
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
