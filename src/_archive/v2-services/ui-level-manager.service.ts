/**
 * UI Level Manager Service
 * Manages progressive disclosure levels and user expertise detection
 */

import { supabase } from '@/lib/supabase';
import type {
  UILevel,
  UserExpertiseLevel,
  UserExpertiseProfile,
  UsageStats,
  UILevelConfig,
  UILevelTransition,
  ProgressiveDisclosureSettings,
  SimpleModeConfig,
  CustomModeConfig,
  PowerModeConfig,
  UpgradeHint,
  HintTriggerCondition,
  OnboardingTip,
  UILevelAnalytics
} from '@/types/v2';

export class UILevelManagerService {
  private static instance: UILevelManagerService;
  private currentProfile: UserExpertiseProfile | null = null;
  private settings: ProgressiveDisclosureSettings;

  private constructor() {
    this.settings = this.getDefaultSettings();
  }

  static getInstance(): UILevelManagerService {
    if (!UILevelManagerService.instance) {
      UILevelManagerService.instance = new UILevelManagerService();
    }
    return UILevelManagerService.instance;
  }

  /**
   * Get or create user expertise profile
   */
  async getUserProfile(userId: string): Promise<UserExpertiseProfile> {
    if (this.currentProfile && this.currentProfile.userId === userId) {
      return this.currentProfile;
    }

    const { data, error } = await supabase
      .from('user_expertise_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[UILevelManager] Error fetching profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      // Create new profile
      return this.createUserProfile(userId);
    }

    this.currentProfile = this.mapProfileFromDb(data);
    return this.currentProfile;
  }

  /**
   * Create a new user expertise profile
   */
  private async createUserProfile(userId: string): Promise<UserExpertiseProfile> {
    const profile: UserExpertiseProfile = {
      id: crypto.randomUUID(),
      userId,
      currentLevel: 'simple',
      expertiseLevel: 'beginner',
      usageStats: {
        totalCampaigns: 0,
        totalPiecesEdited: 0,
        advancedFeaturesUsed: 0,
        daysActive: 0,
        lastActiveDate: new Date().toISOString(),
        preferredLevel: 'simple',
        levelSwitchCount: 0
      },
      levelHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_expertise_profiles')
      .insert({
        id: profile.id,
        user_id: profile.userId,
        current_level: profile.currentLevel,
        expertise_level: profile.expertiseLevel,
        usage_stats: profile.usageStats,
        level_history: profile.levelHistory,
        created_at: profile.createdAt,
        updated_at: profile.updatedAt
      })
      .select()
      .single();

    if (error) {
      console.error('[UILevelManager] Error creating profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    this.currentProfile = this.mapProfileFromDb(data);
    return this.currentProfile;
  }

  /**
   * Detect appropriate UI level based on user expertise
   */
  detectOptimalLevel(profile: UserExpertiseProfile): UILevel {
    const { usageStats } = profile;

    // Beginner: Simple mode
    if (usageStats.totalCampaigns < 3) {
      return 'simple';
    }

    // Expert: Power mode
    if (
      usageStats.totalCampaigns >= 15 &&
      usageStats.advancedFeaturesUsed >= 10 &&
      usageStats.totalPiecesEdited >= 50
    ) {
      return 'power';
    }

    // Intermediate: Custom mode
    if (
      usageStats.totalCampaigns >= 3 &&
      usageStats.totalPiecesEdited >= 10
    ) {
      return 'custom';
    }

    return 'simple';
  }

  /**
   * Update UI level for user
   */
  async updateUILevel(
    userId: string,
    newLevel: UILevel,
    trigger: 'auto' | 'manual' | 'hint'
  ): Promise<UserExpertiseProfile> {
    const profile = await this.getUserProfile(userId);

    const transition: UILevelTransition = {
      fromLevel: profile.currentLevel,
      toLevel: newLevel,
      trigger,
      timestamp: new Date().toISOString(),
      userConfirmed: trigger === 'manual'
    };

    const updatedProfile: UserExpertiseProfile = {
      ...profile,
      currentLevel: newLevel,
      usageStats: {
        ...profile.usageStats,
        levelSwitchCount: profile.usageStats.levelSwitchCount + 1,
        preferredLevel: trigger === 'manual' ? newLevel : profile.usageStats.preferredLevel
      },
      levelHistory: [
        ...profile.levelHistory,
        {
          level: profile.currentLevel,
          switchedAt: new Date().toISOString(),
          reason: trigger,
          duration: this.calculateLevelDuration(profile)
        }
      ],
      updatedAt: new Date().toISOString()
    };

    await this.saveProfile(updatedProfile);
    this.currentProfile = updatedProfile;

    return updatedProfile;
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats(
    userId: string,
    updates: Partial<UsageStats>
  ): Promise<UserExpertiseProfile> {
    const profile = await this.getUserProfile(userId);

    const updatedProfile: UserExpertiseProfile = {
      ...profile,
      usageStats: {
        ...profile.usageStats,
        ...updates,
        lastActiveDate: new Date().toISOString()
      },
      expertiseLevel: this.calculateExpertiseLevel({
        ...profile.usageStats,
        ...updates
      }),
      updatedAt: new Date().toISOString()
    };

    await this.saveProfile(updatedProfile);
    this.currentProfile = updatedProfile;

    // Auto-detect if level should change
    if (this.settings.autoDetectLevel) {
      const optimalLevel = this.detectOptimalLevel(updatedProfile);
      if (optimalLevel !== updatedProfile.currentLevel) {
        return this.updateUILevel(userId, optimalLevel, 'auto');
      }
    }

    return updatedProfile;
  }

  /**
   * Calculate user expertise level
   */
  private calculateExpertiseLevel(stats: UsageStats): UserExpertiseLevel {
    const score =
      stats.totalCampaigns * 2 +
      stats.totalPiecesEdited * 0.5 +
      stats.advancedFeaturesUsed * 3;

    if (score >= 100) return 'expert';
    if (score >= 30) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate duration spent at current level
   */
  private calculateLevelDuration(profile: UserExpertiseProfile): number {
    const lastSwitch = profile.levelHistory[profile.levelHistory.length - 1];
    if (!lastSwitch) {
      const createdAt = new Date(profile.createdAt).getTime();
      const now = new Date().getTime();
      return Math.floor((now - createdAt) / 1000);
    }

    const switchedAt = new Date(lastSwitch.switchedAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - switchedAt) / 1000);
  }

  /**
   * Get UI level configuration
   */
  getUILevelConfig(level: UILevel): UILevelConfig {
    const configs: Record<UILevel, UILevelConfig> = {
      simple: {
        level: 'simple',
        displayName: 'AI Suggestions',
        description: 'One-click campaign generation with smart AI recommendations',
        features: {
          aiSuggestions: true,
          oneClickGeneration: true,
          quickEdit: true,
          inlineEditing: false,
          dragDropReordering: false,
          emotionalTriggerSelection: false,
          timelineVisualization: false,
          platformSelection: false,
          manualPhaseCreation: false,
          connectionBuilder: false,
          customEmotionalProgression: false,
          advancedScheduling: false,
          competitiveInsights: false,
          breakthroughScoreTuning: false,
          fullArcEditor: false,
          eqTriggerMatrix: false
        },
        onboardingTips: this.getSimpleModeOnboardingTips(),
        upgradeHints: this.getSimpleModeUpgradeHints(),
        requiredExpertise: 'beginner'
      },
      custom: {
        level: 'custom',
        displayName: 'Customization',
        description: 'Fine-tune campaigns with timeline editing and emotional triggers',
        features: {
          aiSuggestions: true,
          oneClickGeneration: true,
          quickEdit: true,
          inlineEditing: true,
          dragDropReordering: true,
          emotionalTriggerSelection: true,
          timelineVisualization: true,
          platformSelection: true,
          manualPhaseCreation: false,
          connectionBuilder: false,
          customEmotionalProgression: false,
          advancedScheduling: false,
          competitiveInsights: false,
          breakthroughScoreTuning: false,
          fullArcEditor: false,
          eqTriggerMatrix: false
        },
        onboardingTips: this.getCustomModeOnboardingTips(),
        upgradeHints: this.getCustomModeUpgradeHints(),
        requiredExpertise: 'intermediate'
      },
      power: {
        level: 'power',
        displayName: 'Power User',
        description: 'Full control with advanced connection builder and analytics',
        features: {
          aiSuggestions: true,
          oneClickGeneration: true,
          quickEdit: true,
          inlineEditing: true,
          dragDropReordering: true,
          emotionalTriggerSelection: true,
          timelineVisualization: true,
          platformSelection: true,
          manualPhaseCreation: true,
          connectionBuilder: true,
          customEmotionalProgression: true,
          advancedScheduling: true,
          competitiveInsights: true,
          breakthroughScoreTuning: true,
          fullArcEditor: true,
          eqTriggerMatrix: true
        },
        onboardingTips: this.getPowerModeOnboardingTips(),
        upgradeHints: [],
        requiredExpertise: 'expert'
      }
    };

    return configs[level];
  }

  /**
   * Get Simple mode configuration
   */
  getSimpleModeConfig(): SimpleModeConfig {
    return {
      maxSuggestedCampaigns: 3,
      showPreviewCards: true,
      allowQuickEdit: true,
      editableFields: ['title', 'startDate', 'endDate', 'targetAudience']
    };
  }

  /**
   * Get Custom mode configuration
   */
  getCustomModeConfig(): CustomModeConfig {
    return {
      enableDragDrop: true,
      showTimeline: true,
      enableInlineEdit: true,
      showEmotionalTriggers: true,
      realtimePreview: true,
      maxEditablePieces: 50
    };
  }

  /**
   * Get Power mode configuration
   */
  getPowerModeConfig(): PowerModeConfig {
    return {
      showAllControls: true,
      enableManualConnections: true,
      showCompetitiveData: true,
      enableBreakthroughTuning: true,
      showAdvancedAnalytics: true,
      maxCustomPhases: 20
    };
  }

  /**
   * Check if upgrade hint should be shown
   */
  shouldShowUpgradeHint(
    profile: UserExpertiseProfile,
    hint: UpgradeHint
  ): boolean {
    if (hint.shown && hint.dismissedAt) {
      const dismissedDate = new Date(hint.dismissedAt);
      const daysSinceDismissal =
        (new Date().getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < this.settings.hintDismissalDuration) {
        return false;
      }
    }

    return this.evaluateHintTrigger(profile, hint.triggerCondition);
  }

  /**
   * Evaluate hint trigger condition
   */
  private evaluateHintTrigger(
    profile: UserExpertiseProfile,
    condition: HintTriggerCondition
  ): boolean {
    const { usageStats } = profile;

    switch (condition.type) {
      case 'usage_count':
        if (condition.metric === 'campaigns') {
          return usageStats.totalCampaigns >= condition.threshold;
        }
        if (condition.metric === 'pieces_edited') {
          return usageStats.totalPiecesEdited >= condition.threshold;
        }
        return false;

      case 'feature_attempt':
        return usageStats.advancedFeaturesUsed >= condition.threshold;

      case 'time_based':
        return usageStats.daysActive >= condition.threshold;

      case 'performance':
        // Would check campaign performance metrics
        return false;

      default:
        return false;
    }
  }

  /**
   * Track analytics event
   */
  async trackAnalytics(
    userId: string,
    event: {
      level: UILevel;
      feature: string;
      duration?: number;
    }
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);

    await supabase.from('ui_level_analytics').insert({
      user_id: userId,
      ui_level: event.level,
      feature_used: event.feature,
      session_duration: event.duration || 0,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Save profile to database
   */
  private async saveProfile(profile: UserExpertiseProfile): Promise<void> {
    const { error } = await supabase
      .from('user_expertise_profiles')
      .update({
        current_level: profile.currentLevel,
        expertise_level: profile.expertiseLevel,
        usage_stats: profile.usageStats,
        level_history: profile.levelHistory,
        updated_at: profile.updatedAt
      })
      .eq('id', profile.id);

    if (error) {
      console.error('[UILevelManager] Error saving profile:', error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }

  /**
   * Map profile from database
   */
  private mapProfileFromDb(data: any): UserExpertiseProfile {
    return {
      id: data.id,
      userId: data.user_id,
      currentLevel: data.current_level,
      expertiseLevel: data.expertise_level,
      usageStats: data.usage_stats,
      levelHistory: data.level_history || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): ProgressiveDisclosureSettings {
    return {
      autoDetectLevel: true,
      allowManualSwitch: true,
      showUpgradeHints: true,
      showOnboardingTips: true,
      rememberPreference: true,
      hintDismissalDuration: 7 // days
    };
  }

  /**
   * Onboarding tips for Simple mode
   */
  private getSimpleModeOnboardingTips(): OnboardingTip[] {
    return [
      {
        id: 'simple-1',
        title: 'AI-Powered Suggestions',
        description: 'We analyze your business and suggest the best campaigns for you',
        order: 1,
        completed: false
      },
      {
        id: 'simple-2',
        title: 'One-Click Generation',
        description: 'Just click Generate and we create a complete campaign',
        order: 2,
        completed: false
      },
      {
        id: 'simple-3',
        title: 'Quick Edits',
        description: 'Adjust title and dates before generating your campaign',
        order: 3,
        completed: false
      }
    ];
  }

  /**
   * Upgrade hints for Simple mode
   */
  private getSimpleModeUpgradeHints(): UpgradeHint[] {
    return [
      {
        id: 'simple-upgrade-1',
        title: 'Ready for more control?',
        description: 'Try Custom mode to edit individual posts and adjust timing',
        triggerCondition: {
          type: 'usage_count',
          threshold: 3,
          metric: 'campaigns'
        },
        targetLevel: 'custom',
        shown: false
      }
    ];
  }

  /**
   * Onboarding tips for Custom mode
   */
  private getCustomModeOnboardingTips(): OnboardingTip[] {
    return [
      {
        id: 'custom-1',
        title: 'Timeline View',
        description: 'See your entire campaign laid out over time',
        order: 1,
        completed: false
      },
      {
        id: 'custom-2',
        title: 'Drag & Drop',
        description: 'Reorder posts by dragging them on the timeline',
        order: 2,
        completed: false
      },
      {
        id: 'custom-3',
        title: 'Emotional Triggers',
        description: 'Adjust the emotional tone of each post',
        order: 3,
        completed: false
      }
    ];
  }

  /**
   * Upgrade hints for Custom mode
   */
  private getCustomModeUpgradeHints(): UpgradeHint[] {
    return [
      {
        id: 'custom-upgrade-1',
        title: 'Unlock Power Mode',
        description: 'Access advanced features like connection builder and competitive insights',
        triggerCondition: {
          type: 'usage_count',
          threshold: 15,
          metric: 'campaigns'
        },
        targetLevel: 'power',
        shown: false
      }
    ];
  }

  /**
   * Onboarding tips for Power mode
   */
  private getPowerModeOnboardingTips(): OnboardingTip[] {
    return [
      {
        id: 'power-1',
        title: 'Connection Builder',
        description: 'Create custom causal relationships between campaign pieces',
        order: 1,
        completed: false
      },
      {
        id: 'power-2',
        title: 'Competitive Insights',
        description: 'See how your campaign compares to competitors',
        order: 2,
        completed: false
      },
      {
        id: 'power-3',
        title: 'Breakthrough Score Tuning',
        description: 'Fine-tune the 11-factor scoring algorithm',
        order: 3,
        completed: false
      }
    ];
  }
}

export const uiLevelManager = UILevelManagerService.getInstance();
