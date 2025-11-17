/**
 * Approval Workflow Service
 *
 * Handles the byzantine process of reviewing, editing, approving, and
 * rejecting content before it goes live to embarrass your brand
 *
 * Features:
 * - Individual post approval/rejection
 * - Bulk approval operations
 * - Edit tracking with revision history
 * - Validation before approval
 *
 * @author Roy (approval chain survivor since SharePoint 2007)
 */

import {
  CalendarPost,
  CampaignCalendar,
  ApprovalStatus,
  ApprovalRevision,
  BulkApprovalRequest,
  PostEditRequest,
  ContentEditRequest,
  TimingEditRequest,
  PlatformEditRequest,
} from '../../types/calendar.types';

export class ApprovalWorkflow {
  /**
   * Approve a single post
   */
  static approvePost(
    post: CalendarPost,
    approvedBy: string
  ): CalendarPost {
    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: approvedBy,
      changeType: 'status',
      changes: 'Approved post',
      previousValue: post.approval.status,
      newValue: 'approved',
    };

    return {
      ...post,
      approval: {
        ...post.approval,
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      status: 'approved',
      updatedAt: new Date(),
    };
  }

  /**
   * Reject a post with reason
   */
  static rejectPost(
    post: CalendarPost,
    rejectedBy: string,
    reason: string
  ): CalendarPost {
    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: rejectedBy,
      changeType: 'status',
      changes: `Rejected: ${reason}`,
      previousValue: post.approval.status,
      newValue: 'rejected',
    };

    return {
      ...post,
      approval: {
        ...post.approval,
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      status: 'rejected',
      updatedAt: new Date(),
    };
  }

  /**
   * Request revisions on a post
   */
  static requestRevision(
    post: CalendarPost,
    requestedBy: string,
    revisionRequest: string
  ): CalendarPost {
    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: requestedBy,
      changeType: 'status',
      changes: `Revision requested: ${revisionRequest}`,
      previousValue: post.approval.status,
      newValue: 'needs_revision',
    };

    return {
      ...post,
      approval: {
        ...post.approval,
        status: 'needs_revision',
        revisionRequested: revisionRequest,
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      status: 'draft',
      updatedAt: new Date(),
    };
  }

  /**
   * Bulk approve multiple posts
   */
  static bulkApprove(
    calendar: CampaignCalendar,
    request: BulkApprovalRequest
  ): CampaignCalendar {
    const updatedPosts = calendar.posts.map(post => {
      if (!request.postIds.includes(post.id)) {
        return post;
      }

      if (request.action === 'approve') {
        return this.approvePost(post, request.approvedBy);
      } else {
        return this.rejectPost(post, request.approvedBy, request.reason || 'Bulk rejection');
      }
    });

    // Recalculate statistics
    const approvedCount = updatedPosts.filter(p => p.approval.status === 'approved').length;
    const statistics = {
      ...calendar.statistics,
      approvalRate: (approvedCount / updatedPosts.length) * 100,
    };

    return {
      ...calendar,
      posts: updatedPosts,
      statistics,
      status: this.determineCalendarStatus(updatedPosts),
      updatedAt: new Date(),
    };
  }

  /**
   * Edit post content
   */
  static editContent(
    post: CalendarPost,
    request: ContentEditRequest
  ): CalendarPost {
    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: request.editedBy,
      changeType: 'content',
      changes: `Updated content fields: ${Object.keys(request.updates).join(', ')}`,
      previousValue: post.content,
      newValue: { ...post.content, ...request.updates },
    };

    return {
      ...post,
      content: {
        ...post.content,
        ...request.updates,
      },
      approval: {
        ...post.approval,
        status: 'pending', // Reset to pending after edit
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      status: 'draft',
      updatedAt: new Date(),
    };
  }

  /**
   * Edit post timing
   */
  static editTiming(
    post: CalendarPost,
    request: TimingEditRequest
  ): CalendarPost {
    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: request.editedBy,
      changeType: 'timing',
      changes: `Changed timing from ${post.scheduledDate.toISOString().split('T')[0]} ${post.scheduledTime} to ${request.newDate.toISOString().split('T')[0]} ${request.newTime}`,
      previousValue: { date: post.scheduledDate, time: post.scheduledTime },
      newValue: { date: request.newDate, time: request.newTime },
    };

    return {
      ...post,
      scheduledDate: request.newDate,
      scheduledTime: request.newTime,
      approval: {
        ...post.approval,
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Edit post platforms
   */
  static editPlatforms(
    post: CalendarPost,
    request: PlatformEditRequest
  ): CalendarPost {
    let newPlatforms = [...post.platforms];

    if (request.action === 'add' && !newPlatforms.includes(request.platform)) {
      newPlatforms.push(request.platform);
    } else if (request.action === 'remove') {
      newPlatforms = newPlatforms.filter(p => p !== request.platform);
    }

    const revision: ApprovalRevision = {
      version: post.approval.revisionHistory.length + 1,
      timestamp: new Date(),
      changedBy: request.editedBy,
      changeType: 'platform',
      changes: `${request.action === 'add' ? 'Added' : 'Removed'} platform: ${request.platform}`,
      previousValue: post.platforms,
      newValue: newPlatforms,
    };

    return {
      ...post,
      platforms: newPlatforms,
      approval: {
        ...post.approval,
        status: 'pending', // Reset to pending after platform change
        revisionHistory: [...post.approval.revisionHistory, revision],
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Validate post before approval
   * Checks for common issues that would prevent successful posting
   */
  static validateBeforeApproval(post: CalendarPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check content
    if (!post.content.hook || post.content.hook.trim().length === 0) {
      errors.push('Post must have a hook');
    }

    if (!post.content.body || post.content.body.trim().length === 0) {
      errors.push('Post must have body content');
    }

    if (!post.content.cta || post.content.cta.trim().length === 0) {
      warnings.push('Post should have a call-to-action');
    }

    // Check platforms
    if (post.platforms.length === 0) {
      errors.push('Post must have at least one platform selected');
    }

    // Check scheduling
    const now = new Date();
    const postTime = new Date(post.scheduledDate);
    const [hours, minutes] = post.scheduledTime.split(':').map(Number);
    postTime.setHours(hours, minutes);

    if (postTime < now) {
      errors.push('Post is scheduled in the past');
    }

    // Check media for video/image posts
    if (['video', 'image', 'carousel'].includes(post.contentType)) {
      if (!post.content.mediaUrls || post.content.mediaUrls.length === 0) {
        warnings.push(`${post.contentType} post should include media`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canApprove: errors.length === 0,
    };
  }

  /**
   * Get approval progress for calendar
   */
  static getApprovalProgress(calendar: CampaignCalendar): ApprovalProgress {
    const total = calendar.posts.length;
    const pending = calendar.posts.filter(p => p.approval.status === 'pending').length;
    const approved = calendar.posts.filter(p => p.approval.status === 'approved').length;
    const rejected = calendar.posts.filter(p => p.approval.status === 'rejected').length;
    const needsRevision = calendar.posts.filter(p => p.approval.status === 'needs_revision').length;

    return {
      total,
      pending,
      approved,
      rejected,
      needsRevision,
      percentageApproved: (approved / total) * 100,
      isComplete: approved === total,
      canSchedule: approved > 0,
    };
  }

  /**
   * Get posts ready for scheduling
   */
  static getSchedulablePost(calendar: CampaignCalendar): CalendarPost[] {
    return calendar.posts.filter(
      post => post.approval.status === 'approved' && !post.scheduling.isScheduled
    );
  }

  /**
   * Determine calendar status based on post statuses
   */
  private static determineCalendarStatus(posts: CalendarPost[]): CampaignCalendar['status'] {
    const approvedCount = posts.filter(p => p.approval.status === 'approved').length;
    const scheduledCount = posts.filter(p => p.scheduling.isScheduled).length;

    if (approvedCount === posts.length) {
      if (scheduledCount === posts.length) {
        return 'scheduled';
      }
      return 'approved';
    }

    if (approvedCount > 0) {
      return 'in_review';
    }

    return 'draft';
  }

  /**
   * Auto-approve posts that meet quality threshold
   * For the brave souls who trust the AI
   */
  static autoApprove(
    calendar: CampaignCalendar,
    minQualityScore: number = 85
  ): CampaignCalendar {
    const updatedPosts = calendar.posts.map(post => {
      // Only auto-approve pending posts
      if (post.approval.status !== 'pending') {
        return post;
      }

      // Check validation
      const validation = this.validateBeforeApproval(post);
      if (!validation.isValid) {
        return post;
      }

      // Check quality score
      const qualityScore = post.metadata.qualityScore || 0;
      if (qualityScore < minQualityScore) {
        return post;
      }

      // Auto-approve
      return this.approvePost(post, 'system-auto-approval');
    });

    return {
      ...calendar,
      posts: updatedPosts,
      updatedAt: new Date(),
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canApprove: boolean;
}

interface ApprovalProgress {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  percentageApproved: number;
  isComplete: boolean;
  canSchedule: boolean;
}

export default ApprovalWorkflow;
