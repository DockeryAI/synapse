/**
 * UI Level Selector - Progressive Disclosure Orchestrator
 * Manages switching between Simple, Custom, and Power modes
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Edit3,
  Zap,
  ChevronRight,
  Info,
  X,
  TrendingUp,
  Check
} from 'lucide-react';
import type {
  UILevel,
  UserExpertiseProfile,
  UILevelConfig,
  UpgradeHint,
  OnboardingTip,
  CampaignSuggestion,
  CampaignPhase,
  CampaignPiece,
  TimelineReorderEvent,
  EmotionalTriggerAdjustment,
  ConnectionBuilderEdge,
  QuickEditModalData
} from '@/types/v2';
import { uiLevelManager } from '@/services/v2/ui-level-manager.service';
import { SimpleCampaignMode } from './SimpleCampaignMode';
import { CustomCampaignMode } from './CustomCampaignMode';
import { PowerCampaignMode } from './PowerCampaignMode';

export interface UILevelSelectorProps {
  brandId: string;
  brandName: string;
  industry?: string;
  userId: string;

  // Simple mode props
  suggestions?: CampaignSuggestion[];
  onLoadSuggestions?: () => Promise<CampaignSuggestion[]>;
  onGenerateCampaign?: (suggestionId: string, edits?: QuickEditModalData) => Promise<void>;

  // Custom mode props
  campaignId?: string;
  pieces?: CampaignPiece[];
  onPiecesUpdate?: (pieces: CampaignPiece[]) => void;
  onPieceReorder?: (event: TimelineReorderEvent) => void;
  onEmotionalTriggerChange?: (adjustment: EmotionalTriggerAdjustment) => void;
  onPieceEdit?: (pieceId: string, updates: Partial<CampaignPiece>) => void;

  // Power mode props
  phases?: CampaignPhase[];
  onPhasesUpdate?: (phases: CampaignPhase[]) => void;
  onConnectionCreate?: (edge: ConnectionBuilderEdge) => void;
  onConnectionDelete?: (edgeId: string) => void;
  competitiveData?: any;
  breakthroughScore?: number;

  // Control props
  initialLevel?: UILevel;
  allowManualSwitch?: boolean;
  showOnboarding?: boolean;
  className?: string;
}

export const UILevelSelector: React.FC<UILevelSelectorProps> = ({
  brandId,
  brandName,
  industry,
  userId,
  suggestions,
  onLoadSuggestions,
  onGenerateCampaign,
  campaignId,
  pieces = [],
  onPiecesUpdate,
  onPieceReorder,
  onEmotionalTriggerChange,
  onPieceEdit,
  phases = [],
  onPhasesUpdate,
  onConnectionCreate,
  onConnectionDelete,
  competitiveData,
  breakthroughScore,
  initialLevel,
  allowManualSwitch = true,
  showOnboarding = true,
  className,
}) => {
  const [profile, setProfile] = React.useState<UserExpertiseProfile | null>(null);
  const [currentLevel, setCurrentLevel] = React.useState<UILevel>(initialLevel || 'simple');
  const [upgradeHint, setUpgradeHint] = React.useState<UpgradeHint | null>(null);
  const [onboardingTips, setOnboardingTips] = React.useState<OnboardingTip[]>([]);
  const [showLevelSwitcher, setShowLevelSwitcher] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Load user profile on mount
  React.useEffect(() => {
    loadProfile();
  }, [userId]);

  // Check for upgrade hints
  React.useEffect(() => {
    if (profile && showOnboarding) {
      checkForUpgradeHints();
      loadOnboardingTips();
    }
  }, [profile, currentLevel]);

  const loadProfile = async () => {
    try {
      const userProfile = await uiLevelManager.getUserProfile(userId);
      setProfile(userProfile);
      setCurrentLevel(userProfile.currentLevel);

      // Auto-detect optimal level if enabled
      const detectedLevel = uiLevelManager.detectOptimalLevel(userProfile);
      if (detectedLevel !== userProfile.currentLevel && !initialLevel) {
        // Show hint to upgrade
        const config = uiLevelManager.getUILevelConfig(detectedLevel);
        setUpgradeHint({
          id: 'auto-upgrade',
          title: `Ready for ${config.displayName}?`,
          description: `Based on your activity, you might enjoy ${config.displayName} mode`,
          triggerCondition: { type: 'usage_count', threshold: 0, metric: 'auto' },
          targetLevel: detectedLevel,
          shown: true
        });
      }
    } catch (error) {
      console.error('[UILevelSelector] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpgradeHints = () => {
    if (!profile) return;

    const config = uiLevelManager.getUILevelConfig(currentLevel);
    const hints = config.upgradeHints;

    for (const hint of hints) {
      if (uiLevelManager.shouldShowUpgradeHint(profile, hint)) {
        setUpgradeHint(hint);
        break;
      }
    }
  };

  const loadOnboardingTips = () => {
    const config = uiLevelManager.getUILevelConfig(currentLevel);
    setOnboardingTips(config.onboardingTips.filter(tip => !tip.completed));
  };

  const handleLevelChange = async (newLevel: UILevel, trigger: 'auto' | 'manual' | 'hint') => {
    if (!profile) return;

    try {
      const updatedProfile = await uiLevelManager.updateUILevel(userId, newLevel, trigger);
      setProfile(updatedProfile);
      setCurrentLevel(newLevel);
      setUpgradeHint(null);
      setShowLevelSwitcher(false);

      // Track analytics
      await uiLevelManager.trackAnalytics(userId, {
        level: newLevel,
        feature: 'level_switch',
        duration: 0
      });
    } catch (error) {
      console.error('[UILevelSelector] Error changing level:', error);
    }
  };

  const handleDismissHint = async () => {
    if (upgradeHint) {
      setUpgradeHint({
        ...upgradeHint,
        shown: false,
        dismissedAt: new Date().toISOString()
      });
    }
  };

  const handleAcceptHint = () => {
    if (upgradeHint) {
      handleLevelChange(upgradeHint.targetLevel, 'hint');
    }
  };

  const handleDismissTip = (tipId: string) => {
    setOnboardingTips(onboardingTips.filter(tip => tip.id !== tipId));
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <div className="text-center">
          <div className="text-muted-foreground">Loading campaign builder...</div>
        </div>
      </div>
    );
  }

  const levelConfigs: Record<UILevel, UILevelConfig> = {
    simple: uiLevelManager.getUILevelConfig('simple'),
    custom: uiLevelManager.getUILevelConfig('custom'),
    power: uiLevelManager.getUILevelConfig('power')
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Level Switcher Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LevelBadge level={currentLevel} config={levelConfigs[currentLevel]} />
          {allowManualSwitch && (
            <button
              onClick={() => setShowLevelSwitcher(!showLevelSwitcher)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Switch Mode
              <ChevronRight className={cn(
                'w-4 h-4 transition-transform',
                showLevelSwitcher && 'rotate-90'
              )} />
            </button>
          )}
        </div>

        {/* Expertise Indicator */}
        {profile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{profile.expertiseLevel.charAt(0).toUpperCase() + profile.expertiseLevel.slice(1)}</span>
            <span>•</span>
            <span>{profile.usageStats.totalCampaigns} campaigns</span>
          </div>
        )}
      </div>

      {/* Level Switcher Panel */}
      {showLevelSwitcher && allowManualSwitch && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <h3 className="font-semibold">Choose Your Experience</h3>
          <div className="grid grid-cols-3 gap-3">
            <LevelOption
              level="simple"
              config={levelConfigs.simple}
              active={currentLevel === 'simple'}
              onClick={() => handleLevelChange('simple', 'manual')}
            />
            <LevelOption
              level="custom"
              config={levelConfigs.custom}
              active={currentLevel === 'custom'}
              onClick={() => handleLevelChange('custom', 'manual')}
            />
            <LevelOption
              level="power"
              config={levelConfigs.power}
              active={currentLevel === 'power'}
              onClick={() => handleLevelChange('power', 'manual')}
            />
          </div>
        </div>
      )}

      {/* Upgrade Hint */}
      {upgradeHint && upgradeHint.shown && (
        <UpgradeHintBanner
          hint={upgradeHint}
          onAccept={handleAcceptHint}
          onDismiss={handleDismissHint}
        />
      )}

      {/* Onboarding Tips */}
      {showOnboarding && onboardingTips.length > 0 && (
        <div className="space-y-2">
          {onboardingTips.slice(0, 1).map(tip => (
            <OnboardingTipBanner
              key={tip.id}
              tip={tip}
              onDismiss={() => handleDismissTip(tip.id)}
            />
          ))}
        </div>
      )}

      {/* Current Level Content */}
      <div className="border rounded-lg p-6 bg-card">
        {currentLevel === 'simple' && (
          <SimpleCampaignMode
            brandId={brandId}
            brandName={brandName}
            industry={industry}
            suggestions={suggestions}
            onLoadSuggestions={onLoadSuggestions}
            onGenerateCampaign={onGenerateCampaign || (async () => {})}
          />
        )}

        {currentLevel === 'custom' && (
          <CustomCampaignMode
            brandId={brandId}
            campaignId={campaignId}
            pieces={pieces}
            onPiecesUpdate={onPiecesUpdate || (() => {})}
            onPieceReorder={onPieceReorder || (() => {})}
            onEmotionalTriggerChange={onEmotionalTriggerChange || (() => {})}
            onPieceEdit={onPieceEdit || (() => {})}
          />
        )}

        {currentLevel === 'power' && (
          <PowerCampaignMode
            brandId={brandId}
            campaignId={campaignId}
            phases={phases}
            pieces={pieces}
            onPhasesUpdate={onPhasesUpdate || (() => {})}
            onPiecesUpdate={onPiecesUpdate || (() => {})}
            onConnectionCreate={onConnectionCreate || (() => {})}
            onConnectionDelete={onConnectionDelete || (() => {})}
            competitiveData={competitiveData}
            breakthroughScore={breakthroughScore}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Level Badge Component
 */
interface LevelBadgeProps {
  level: UILevel;
  config: UILevelConfig;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, config }) => {
  const icons = {
    simple: <Sparkles className="w-4 h-4" />,
    custom: <Edit3 className="w-4 h-4" />,
    power: <Zap className="w-4 h-4" />
  };

  const colors = {
    simple: 'bg-blue-100 text-blue-800 border-blue-200',
    custom: 'bg-purple-100 text-purple-800 border-purple-200',
    power: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border', colors[level])}>
      {icons[level]}
      <span className="font-medium text-sm">{config.displayName}</span>
    </div>
  );
};

/**
 * Level Option Component
 */
interface LevelOptionProps {
  level: UILevel;
  config: UILevelConfig;
  active: boolean;
  onClick: () => void;
}

const LevelOption: React.FC<LevelOptionProps> = ({ level, config, active, onClick }) => {
  const icons = {
    simple: <Sparkles className="w-5 h-5" />,
    custom: <Edit3 className="w-5 h-5" />,
    power: <Zap className="w-5 h-5" />
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative border-2 rounded-lg p-4 text-left transition-all hover:shadow-md',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
    >
      {active && (
        <div className="absolute top-2 right-2">
          <Check className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          {icons[level]}
          <span className="font-semibold">{config.displayName}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {config.description}
        </p>
      </div>
    </button>
  );
};

/**
 * Upgrade Hint Banner Component
 */
interface UpgradeHintBannerProps {
  hint: UpgradeHint;
  onAccept: () => void;
  onDismiss: () => void;
}

const UpgradeHintBanner: React.FC<UpgradeHintBannerProps> = ({
  hint,
  onAccept,
  onDismiss
}) => {
  return (
    <div className="border-2 border-primary/50 rounded-lg p-4 bg-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{hint.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{hint.description}</p>
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Try It Now
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Onboarding Tip Banner Component
 */
interface OnboardingTipBannerProps {
  tip: OnboardingTip;
  onDismiss: () => void;
}

const OnboardingTipBanner: React.FC<OnboardingTipBannerProps> = ({ tip, onDismiss }) => {
  return (
    <div className="border rounded-lg p-3 bg-muted/30 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
          {tip.order}
        </div>
        <div className="space-y-1">
          <h5 className="font-medium text-sm">{tip.title}</h5>
          <p className="text-sm text-muted-foreground">{tip.description}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
