/**
 * UI Level Manager Service Tests
 * Test suite for progressive disclosure management service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UILevelManagerService } from '@/services/v2/ui-level-manager.service';
import type {
  UILevel,
  UserExpertiseProfile,
  UsageStats,
  UpgradeHint
} from '@/types/v2';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null
            })
          )
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProfile,
              error: null
            })
          )
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: mockProfile,
            error: null
          })
        )
      }))
    }))
  }
}));

const mockUsageStats: UsageStats = {
  totalCampaigns: 5,
  totalPiecesEdited: 20,
  advancedFeaturesUsed: 3,
  daysActive: 10,
  lastActiveDate: new Date().toISOString(),
  preferredLevel: 'custom',
  levelSwitchCount: 2
};

const mockProfile: UserExpertiseProfile = {
  id: 'profile-123',
  userId: 'user-123',
  currentLevel: 'custom',
  expertiseLevel: 'intermediate',
  usageStats: mockUsageStats,
  levelHistory: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('UILevelManagerService', () => {
  let service: UILevelManagerService;

  beforeEach(() => {
    service = UILevelManagerService.getInstance();
    vi.clearAllMocks();
  });

  // Test 1: Singleton instance
  it('should return same instance for getInstance calls', () => {
    const instance1 = UILevelManagerService.getInstance();
    const instance2 = UILevelManagerService.getInstance();
    expect(instance1).toBe(instance2);
  });

  // Test 2: Get UI level config for simple mode
  it('should return simple mode configuration', () => {
    const config = service.getUILevelConfig('simple');

    expect(config.level).toBe('simple');
    expect(config.displayName).toBe('AI Suggestions');
    expect(config.features.aiSuggestions).toBe(true);
    expect(config.features.manualPhaseCreation).toBe(false);
  });

  // Test 3: Get UI level config for custom mode
  it('should return custom mode configuration', () => {
    const config = service.getUILevelConfig('custom');

    expect(config.level).toBe('custom');
    expect(config.displayName).toBe('Customization');
    expect(config.features.inlineEditing).toBe(true);
    expect(config.features.dragDropReordering).toBe(true);
  });

  // Test 4: Get UI level config for power mode
  it('should return power mode configuration', () => {
    const config = service.getUILevelConfig('power');

    expect(config.level).toBe('power');
    expect(config.displayName).toBe('Power User');
    expect(config.features.manualPhaseCreation).toBe(true);
    expect(config.features.connectionBuilder).toBe(true);
    expect(config.features.breakthroughScoreTuning).toBe(true);
  });

  // Test 5: Simple mode has upgrade hints
  it('should provide upgrade hints for simple mode', () => {
    const config = service.getUILevelConfig('simple');

    expect(config.upgradeHints.length).toBeGreaterThan(0);
    expect(config.upgradeHints[0].targetLevel).toBe('custom');
  });

  // Test 6: Power mode has no upgrade hints
  it('should have no upgrade hints for power mode', () => {
    const config = service.getUILevelConfig('power');

    expect(config.upgradeHints.length).toBe(0);
  });

  // Test 7: Get simple mode config
  it('should return simple mode specific configuration', () => {
    const config = service.getSimpleModeConfig();

    expect(config.maxSuggestedCampaigns).toBe(3);
    expect(config.showPreviewCards).toBe(true);
    expect(config.allowQuickEdit).toBe(true);
    expect(config.editableFields).toContain('title');
    expect(config.editableFields).toContain('startDate');
  });

  // Test 8: Get custom mode config
  it('should return custom mode specific configuration', () => {
    const config = service.getCustomModeConfig();

    expect(config.enableDragDrop).toBe(true);
    expect(config.showTimeline).toBe(true);
    expect(config.enableInlineEdit).toBe(true);
    expect(config.realtimePreview).toBe(true);
  });

  // Test 9: Get power mode config
  it('should return power mode specific configuration', () => {
    const config = service.getPowerModeConfig();

    expect(config.showAllControls).toBe(true);
    expect(config.enableManualConnections).toBe(true);
    expect(config.showCompetitiveData).toBe(true);
    expect(config.enableBreakthroughTuning).toBe(true);
  });

  // Test 10: Detect optimal level for beginner
  it('should detect simple level for beginner users', () => {
    const beginnerProfile: UserExpertiseProfile = {
      ...mockProfile,
      usageStats: {
        ...mockUsageStats,
        totalCampaigns: 1,
        totalPiecesEdited: 2,
        advancedFeaturesUsed: 0
      }
    };

    const level = service.detectOptimalLevel(beginnerProfile);
    expect(level).toBe('simple');
  });

  // Test 11: Detect optimal level for intermediate
  it('should detect custom level for intermediate users', () => {
    const intermediateProfile: UserExpertiseProfile = {
      ...mockProfile,
      usageStats: {
        ...mockUsageStats,
        totalCampaigns: 5,
        totalPiecesEdited: 15,
        advancedFeaturesUsed: 2
      }
    };

    const level = service.detectOptimalLevel(intermediateProfile);
    expect(level).toBe('custom');
  });

  // Test 12: Detect optimal level for expert
  it('should detect power level for expert users', () => {
    const expertProfile: UserExpertiseProfile = {
      ...mockProfile,
      usageStats: {
        ...mockUsageStats,
        totalCampaigns: 20,
        totalPiecesEdited: 60,
        advancedFeaturesUsed: 15
      }
    };

    const level = service.detectOptimalLevel(expertProfile);
    expect(level).toBe('power');
  });

  // Test 13: Evaluate usage count trigger
  it('should evaluate usage_count hint trigger correctly', () => {
    const hint: UpgradeHint = {
      id: 'hint-1',
      title: 'Upgrade',
      description: 'Time to upgrade',
      triggerCondition: {
        type: 'usage_count',
        threshold: 3,
        metric: 'campaigns'
      },
      targetLevel: 'custom',
      shown: false
    };

    const result = service.shouldShowUpgradeHint(mockProfile, hint);
    expect(result).toBe(true); // mockProfile has 5 campaigns
  });

  // Test 14: Evaluate feature attempt trigger
  it('should evaluate feature_attempt hint trigger correctly', () => {
    const hint: UpgradeHint = {
      id: 'hint-2',
      title: 'Upgrade',
      description: 'Time to upgrade',
      triggerCondition: {
        type: 'feature_attempt',
        threshold: 5,
        metric: 'advanced_features'
      },
      targetLevel: 'power',
      shown: false
    };

    const result = service.shouldShowUpgradeHint(mockProfile, hint);
    expect(result).toBe(false); // mockProfile has only 3 advanced features
  });

  // Test 15: Evaluate time-based trigger
  it('should evaluate time_based hint trigger correctly', () => {
    const hint: UpgradeHint = {
      id: 'hint-3',
      title: 'Upgrade',
      description: 'Time to upgrade',
      triggerCondition: {
        type: 'time_based',
        threshold: 7,
        metric: 'days_active'
      },
      targetLevel: 'custom',
      shown: false
    };

    const result = service.shouldShowUpgradeHint(mockProfile, hint);
    expect(result).toBe(true); // mockProfile has 10 days active
  });

  // Test 16: Onboarding tips for simple mode
  it('should provide onboarding tips for simple mode', () => {
    const config = service.getUILevelConfig('simple');

    expect(config.onboardingTips.length).toBeGreaterThan(0);
    expect(config.onboardingTips[0].title).toBeDefined();
    expect(config.onboardingTips[0].description).toBeDefined();
    expect(config.onboardingTips[0].order).toBeDefined();
  });

  // Test 17: Onboarding tips for custom mode
  it('should provide onboarding tips for custom mode', () => {
    const config = service.getUILevelConfig('custom');

    expect(config.onboardingTips.length).toBeGreaterThan(0);
    expect(config.onboardingTips.some(tip => tip.title.includes('Timeline'))).toBe(true);
  });

  // Test 18: Onboarding tips for power mode
  it('should provide onboarding tips for power mode', () => {
    const config = service.getUILevelConfig('power');

    expect(config.onboardingTips.length).toBeGreaterThan(0);
    expect(config.onboardingTips.some(tip => tip.title.includes('Connection'))).toBe(true);
  });
});
