# Campaign Preview & Approval Components

**Status:** ✅ Complete
**Feature:** Campaign Preview/Approval Workflow
**Worktree:** Parallel Track 4 (Week 1)

---

## Overview

Complete UI system for previewing, editing, and approving AI-generated campaign content across multiple social media platforms.

### Key Features

- **Multi-Platform Preview**: LinkedIn, Facebook, Instagram, X (Twitter), TikTok, YouTube
- **Platform Tabs**: Switch between platforms with visual indicators
- **Social Media Simulation**: Realistic post preview mimicking each platform's appearance
- **Inline Editing**: Edit any section (headline, hook, body, CTA, hashtags) with character validation
- **AI Regeneration**: Request AI to regenerate specific sections with alternatives
- **Approval Workflow**: Approve, reject, or request changes with feedback
- **Publishing Integration**: Placeholder for SocialPilot/Buffer/Hootsuite integration
- **Character Validation**: Real-time character count with platform-specific limits
- **Warning System**: Visual indicators for over-limit or problematic content

---

## Components

### 1. PlatformTabs
**File:** `PlatformTabs.tsx`

Displays tabs for switching between social media platforms.

```tsx
import { PlatformTabs } from '@/components/campaign/preview';

<PlatformTabs
  platforms={['linkedin', 'facebook', 'instagram']}
  activePlatform="linkedin"
  onPlatformChange={(platform) => console.log(platform)}
  platformContent={platformContent}
  mode="preview"
  onModeChange={(mode) => console.log(mode)}
/>
```

**Features:**
- Platform icons and names
- Active tab indicator
- Character count badges
- Warning indicators
- Preview/Edit mode toggle
- Platform capabilities display (images, video, aspect ratio)

---

### 2. CampaignPreviewCard
**File:** `CampaignPreviewCard.tsx`

Displays campaign content for a specific platform with detailed breakdown.

```tsx
import { CampaignPreviewCard } from '@/components/campaign/preview';

<CampaignPreviewCard
  content={platformContent}
  platform="linkedin"
  editable={true}
  showSocialPreview={true}
  onEditSection={(section) => console.log(`Editing: ${section}`)}
/>
```

**Features:**
- Social media post simulation
- Section-by-section breakdown
- Character count per section
- Over-limit warnings
- Visual separators
- Edit buttons per section

**Sections:**
- Headline (optional)
- Hook
- Body
- Call to Action (CTA)
- Hashtags

---

### 3. EditSection
**File:** `EditSection.tsx`

Inline editor for modifying campaign content sections.

```tsx
import { EditSection } from '@/components/campaign/preview';

<EditSection
  section="hook"
  value="Your current hook text"
  limit={150}
  onChange={(value) => console.log(value)}
  onSave={() => console.log('Saved')}
  onCancel={() => console.log('Cancelled')}
  onRegenerate={async (options) => {
    // Call AI regeneration service
    return {
      section: 'hook',
      alternatives: [
        { value: 'Alternative 1', characterCount: 120, reasoning: 'More engaging' },
        { value: 'Alternative 2', characterCount: 135, reasoning: 'Better hook' }
      ]
    };
  }}
/>
```

**Features:**
- Auto-resizing textarea
- Real-time character count
- AI regeneration button
- Alternative suggestions
- Save/Cancel actions
- Hashtag editor (for hashtags section)
- Character limit validation

---

### 4. CampaignPreview
**File:** `CampaignPreview.tsx`

Main container component orchestrating the entire preview workflow.

```tsx
import { CampaignPreview } from '@/components/campaign/preview';

<CampaignPreview
  campaignData={{
    campaignId: '123',
    campaignName: 'Q1 Authority Builder',
    campaignType: 'authority-builder',
    platforms: ['linkedin', 'facebook', 'instagram'],
    content: {
      linkedin: {
        platform: 'linkedin',
        sections: {
          hook: '...',
          body: '...',
          cta: '...',
          hashtags: ['marketing', 'business']
        },
        characterCounts: { hook: 120, body: 450, cta: 50, total: 620 },
        warnings: []
      }
      // ... other platforms
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }}
  onApprove={() => console.log('Approved')}
  onReject={() => console.log('Rejected')}
  onRegenerateAll={async () => {
    // Regenerate all content
  }}
  onSectionRegenerate={async (platform, section, options) => {
    // Regenerate specific section
    return {
      section,
      alternatives: [...]
    };
  }}
/>
```

**Features:**
- Campaign header with type badge
- Platform tabs
- Preview/Edit mode switching
- Social media preview
- Section editing
- Footer action buttons
- Loading states
- State management

---

### 5. Approval Workflow
**File:** `ApprovalWorkflow.tsx`

Components and service for campaign approval process.

```tsx
import {
  ApprovalModal,
  RejectionModal,
  ApprovalHistory,
  CampaignApprovalService
} from '@/components/campaign/preview';

// Approval Modal
<ApprovalModal
  campaignData={campaignData}
  isOpen={showApprovalModal}
  onClose={() => setShowApprovalModal(false)}
  onConfirm={(platforms, scheduleType) => {
    // Handle approval
    CampaignApprovalService.approveCampaign(
      campaignId,
      platforms,
      scheduleType
    );
  }}
/>

// Rejection Modal
<RejectionModal
  campaignName="Q1 Authority Builder"
  isOpen={showRejectionModal}
  onClose={() => setShowRejectionModal(false)}
  onConfirm={(feedback) => {
    CampaignApprovalService.rejectCampaign(campaignId, feedback);
  }}
/>

// Approval History
<ApprovalHistory
  history={[
    {
      timestamp: new Date(),
      action: 'submitted',
      user: 'john@example.com',
      details: 'Campaign submitted for review'
    }
  ]}
/>
```

**Features:**
- Platform selection for publishing
- Schedule type (immediate/scheduled)
- Campaign summary
- Rejection feedback collection
- Approval history timeline
- Publishing integration placeholders

---

## Type Definitions

**File:** `src/types/campaign-preview.types.ts`

### Core Types

```typescript
// Supported platforms
type SupportedPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube';

// Content sections
type ContentSection = 'headline' | 'hook' | 'body' | 'cta' | 'hashtags';

// Preview mode
type PreviewMode = 'preview' | 'edit';

// Approval status
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
```

### Campaign Preview Data

```typescript
interface CampaignPreviewData {
  campaignId: string;
  campaignName: string;
  campaignType: 'authority-builder' | 'social-proof' | 'local-pulse';
  platforms: SupportedPlatform[];
  content: Record<SupportedPlatform, PlatformPreviewContent>;
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformPreviewContent {
  platform: SupportedPlatform;
  sections: {
    headline?: string;
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  characterCounts: {
    headline?: number;
    hook: number;
    body: number;
    cta: number;
    total: number;
  };
  warnings: ContentWarning[];
  mediaUrls?: string[];
}
```

---

## Platform Configurations

Platform-specific character limits and capabilities:

| Platform | Headline | Hook | Body | CTA | Hashtags | Video | Images |
|----------|----------|------|------|-----|----------|-------|--------|
| LinkedIn | 120 | 150 | 3000 | 100 | 5 | ✅ | ✅ |
| Facebook | - | 120 | 63206 | 100 | 30 | ✅ | ✅ |
| Instagram | - | 125 | 2200 | 80 | 30 | ✅ | ✅ |
| X (Twitter) | - | 280 | 280 | 100 | 2 | ✅ | ✅ |
| TikTok | - | 100 | 2200 | 80 | 5 | ✅ | ❌ |
| YouTube | 100 | 100 | 5000 | 100 | 15 | ✅ | ✅ |

---

## Integration Points

### 1. Content Generation Service
Connect `onSectionRegenerate` to `SynapseContentGenerator`:

```typescript
import { SynapseContentGenerator } from '@/services/synapse/generation/SynapseContentGenerator';

const generator = new SynapseContentGenerator();

const handleSectionRegenerate = async (
  platform: SupportedPlatform,
  section: ContentSection,
  options?: RegenerationOptions
): Promise<RegenerationResult> => {
  // Use the existing regenerateSection method
  const result = await generator.regenerateSection(
    currentContent,
    section,
    businessProfile,
    insight,
    options?.focus
  );

  return {
    section,
    alternatives: result.alternatives.map(alt => ({
      value: alt.newValue,
      characterCount: alt.newValue.length,
      reasoning: alt.reasoning
    }))
  };
};
```

### 2. Campaign Orchestrator
Integrate with `CampaignOrchestrator` for state management:

```typescript
import { CampaignOrchestrator } from '@/services/campaign/CampaignOrchestrator';

// When user approves campaign
const orchestrator = new CampaignOrchestrator(businessId);
await orchestrator.transitionTo('APPROVED');

// When user rejects campaign
await orchestrator.transitionTo('ERROR', {
  error: {
    code: 'USER_REJECTED',
    message: feedback
  }
});
```

### 3. Publishing Service (SocialPilot)
**TODO:** Implement SocialPilot API integration

```typescript
// Placeholder in ApprovalWorkflow.tsx
static async publishCampaign(request: PublishRequest): Promise<PublishResult> {
  // TODO: Call SocialPilot API
  const response = await fetch('/api/socialpilot/publish', {
    method: 'POST',
    body: JSON.stringify(request)
  });

  return await response.json();
}
```

---

## Usage Example (Full Flow)

```tsx
import React, { useState } from 'react';
import { CampaignPreview } from '@/components/campaign/preview';
import { SynapseContentGenerator } from '@/services/synapse/generation/SynapseContentGenerator';

function CampaignPreviewPage() {
  const [campaignData, setCampaignData] = useState<CampaignPreviewData>({
    // ... campaign data
  });

  const generator = new SynapseContentGenerator();

  const handleApprove = async () => {
    // Mark campaign as approved
    await updateCampaignStatus(campaignData.campaignId, 'approved');

    // Navigate to publishing
    router.push(`/campaigns/${campaignData.campaignId}/publish`);
  };

  const handleReject = async () => {
    await updateCampaignStatus(campaignData.campaignId, 'rejected');
    router.push('/campaigns');
  };

  const handleRegenerateAll = async () => {
    // Regenerate all platforms
    const newContent = await regenerateAllPlatforms(
      campaignData.campaignId
    );
    setCampaignData({ ...campaignData, content: newContent });
  };

  const handleSectionRegenerate = async (
    platform: SupportedPlatform,
    section: ContentSection,
    options?: RegenerationOptions
  ) => {
    // Use existing generator
    const result = await generator.regenerateSection(
      currentContent,
      section,
      businessProfile,
      insight,
      options?.focus
    );

    return {
      section,
      alternatives: result.alternatives.map(alt => ({
        value: alt.newValue,
        characterCount: alt.newValue.length,
        reasoning: alt.reasoning
      }))
    };
  };

  return (
    <CampaignPreview
      campaignData={campaignData}
      onApprove={handleApprove}
      onReject={handleReject}
      onRegenerateAll={handleRegenerateAll}
      onSectionRegenerate={handleSectionRegenerate}
    />
  );
}
```

---

## Testing Checklist

- [x] Platform tabs switch correctly
- [x] Character counts update in real-time
- [x] Warning indicators appear for over-limit content
- [x] Edit mode activates when clicking "Edit" on sections
- [x] Auto-resize textarea works in EditSection
- [x] Hashtag editor adds/removes tags correctly
- [x] AI regeneration button triggers callback
- [x] Alternative suggestions display correctly
- [x] Save/Cancel buttons work in edit mode
- [x] Approval modal shows campaign summary
- [x] Platform selection checkboxes work
- [x] Rejection modal collects feedback
- [x] Approval history displays timeline
- [x] Social media preview renders correctly

---

## Next Steps (Integration)

1. **Connect to Campaign Orchestrator**
   - Hook up to `CampaignOrchestrator` for state management
   - Implement `onApprove` to transition to `APPROVED` state

2. **Integrate Content Generator**
   - Connect `onSectionRegenerate` to `SynapseContentGenerator.regenerateSection()`
   - Connect `onRegenerateAll` to full campaign regeneration

3. **Database Integration**
   - Save approval decisions to `campaigns` table
   - Save approval history to `campaign_approvals` table
   - Update campaign status on approve/reject

4. **Publishing Integration**
   - Implement SocialPilot API calls in `CampaignApprovalService.publishCampaign()`
   - Add scheduling functionality
   - Handle publishing errors

5. **User Testing**
   - Test with real campaign data
   - Validate character limits across platforms
   - Ensure regeneration produces quality alternatives

---

## File Structure

```
src/
├── types/
│   └── campaign-preview.types.ts         # Type definitions
├── components/
│   └── campaign/
│       └── preview/
│           ├── index.ts                  # Exports
│           ├── README.md                 # This file
│           ├── PlatformTabs.tsx          # Platform tabs component
│           ├── CampaignPreviewCard.tsx   # Preview card component
│           ├── EditSection.tsx           # Inline editor component
│           ├── CampaignPreview.tsx       # Main container
│           └── ApprovalWorkflow.tsx      # Approval workflow components
```

---

## Dependencies

- React
- TypeScript
- Tailwind CSS
- Existing Synapse types (`campaign-workflow.types`, `synapseContent.types`)
- Existing services (`SynapseContentGenerator`, `CampaignOrchestrator`)

---

## Author

Built with Claude Code (Sonnet 4.5)
Worktree 4: Campaign Preview/Approval
Completion Date: 2025-11-15

---

## License

Part of the Synapse platform - Proprietary
