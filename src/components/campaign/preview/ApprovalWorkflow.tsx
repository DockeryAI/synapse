/**
 * APPROVAL WORKFLOW COMPONENT
 *
 * Handles campaign approval, rejection, and publishing workflow.
 *
 * Features:
 * - Approval confirmation modal
 * - Campaign summary before approval
 * - Platform selection for publishing
 * - Publishing integration (SocialPilot, Buffer, etc.)
 * - Approval history tracking
 * - Rejection feedback collection
 *
 * Components:
 * - ApprovalModal: Confirmation modal with summary
 * - RejectionModal: Feedback collection
 * - PublishingOptions: Choose platforms and schedule
 * - ApprovalHistory: Display approval/rejection history
 */

import React, { useState } from 'react';
import {
  type SupportedPlatform,
  type CampaignPreviewData,
  type ApprovalDecision,
  type CampaignApprovalRecord,
  type PublishRequest,
  type PublishResult
} from '@/types/campaign-preview.types';

// ============================================================================
// APPROVAL MODAL
// ============================================================================

interface ApprovalModalProps {
  campaignData: CampaignPreviewData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPlatforms: SupportedPlatform[], scheduleType: 'immediate' | 'scheduled') => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  campaignData,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SupportedPlatform[]>(campaignData.platforms);
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');

  if (!isOpen) return null;

  const togglePlatform = (platform: SupportedPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedPlatforms, scheduleType);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ✅ Approve Campaign
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Review and confirm campaign approval before publishing
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Campaign Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Campaign Name:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {campaignData.campaignName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Campaign Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {campaignData.campaignType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Platforms:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {campaignData.platforms.length}
                </span>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Select Platforms to Publish
            </h3>
            <div className="space-y-2">
              {campaignData.platforms.map((platform) => (
                <label
                  key={platform}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="capitalize font-medium text-gray-900 dark:text-gray-100">
                    {platform}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {campaignData.content[platform].characterCounts.total} chars
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Publishing Schedule */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Publishing Schedule
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'immediate'}
                  onChange={() => setScheduleType('immediate')}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Publish Immediately
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send to SocialPilot for immediate publication
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'scheduled'}
                  onChange={() => setScheduleType('scheduled')}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Schedule for Later
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose specific dates/times for each platform
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 <strong>Note:</strong> Approving this campaign will mark it as ready and enable
              publishing to your connected social media accounts via SocialPilot.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all"
          >
            ✅ Approve & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REJECTION MODAL
// ============================================================================

interface RejectionModalProps {
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  campaignName,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(feedback);
    setFeedback('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ❌ Reject Campaign
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please provide feedback on why you're rejecting "{campaignName}"
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What needs to be improved? (Optional)"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ❌ Reject Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// APPROVAL HISTORY
// ============================================================================

interface ApprovalHistoryProps {
  history: CampaignApprovalRecord['history'];
}

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({ history }) => {
  const actionIcons = {
    submitted: '📤',
    approved: '✅',
    rejected: '❌',
    changes_requested: '🔄',
    regenerated: '✨'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        📋 Approval History
      </h3>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No approval history yet
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="text-xl">{actionIcons[entry.action]}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {entry.action.replace('_', ' ')}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.user && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    By: {entry.user}
                  </p>
                )}
                {entry.details && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {entry.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CAMPAIGN APPROVAL SERVICE (Placeholder for integration)
// ============================================================================

export class CampaignApprovalService {
  /**
   * Approve campaign and prepare for publishing
   */
  static async approveCampaign(
    campaignId: string,
    selectedPlatforms: SupportedPlatform[],
    scheduleType: 'immediate' | 'scheduled'
  ): Promise<ApprovalDecision> {
    // TODO: Integrate with backend API
    console.log('[CampaignApprovalService] Approving campaign:', {
      campaignId,
      selectedPlatforms,
      scheduleType
    });

    return {
      status: 'approved',
      approvedPlatforms: selectedPlatforms,
      approvedAt: new Date(),
      approvedBy: 'current-user' // TODO: Get from auth context
    };
  }

  /**
   * Reject campaign with feedback
   */
  static async rejectCampaign(
    campaignId: string,
    feedback: string
  ): Promise<ApprovalDecision> {
    // TODO: Integrate with backend API
    console.log('[CampaignApprovalService] Rejecting campaign:', {
      campaignId,
      feedback
    });

    return {
      status: 'rejected',
      feedback
    };
  }

  /**
   * Publish campaign to SocialPilot (or other platforms)
   */
  static async publishCampaign(request: PublishRequest): Promise<PublishResult> {
    // TODO: Integrate with SocialPilot API
    console.log('[CampaignApprovalService] Publishing campaign:', request);

    // Placeholder - simulate success
    return {
      success: true,
      publishedPlatforms: request.platforms,
      failedPlatforms: [],
      publishedAt: new Date()
    };
  }

  /**
   * Get approval history for campaign
   */
  static async getApprovalHistory(campaignId: string): Promise<CampaignApprovalRecord> {
    // TODO: Integrate with backend API
    console.log('[CampaignApprovalService] Getting approval history:', campaignId);

    // Placeholder data
    return {
      campaignId,
      decision: {
        status: 'pending'
      },
      history: []
    };
  }
}
