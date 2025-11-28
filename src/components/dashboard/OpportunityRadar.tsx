/**
 * Opportunity Radar Component
 * Dashboard widget showing tiered content opportunities
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  X,
  Sparkles,
  Clock,
  Target,
  Zap,
  BellOff,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';
import type {
  OpportunityAlert,
  OpportunityTier,
  OpportunitySource
} from '@/types/v2/intelligence.types';
import { opportunityStateService } from '@/services/opportunity-state.service';

export interface OpportunityRadarProps {
  alerts: OpportunityAlert[];
  onDismiss?: (alertId: string) => void;
  onSnooze?: (alertId: string, durationMs?: number) => void;
  onCreateContent?: (alert: OpportunityAlert) => void;
  isSelected?: (alertId: string) => boolean;
  filter?: OpportunityTier | 'all';
  maxVisible?: number;
  hideHidden?: boolean; // Automatically filter out dismissed/snoozed
  className?: string;
}

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({
  alerts,
  onDismiss,
  onSnooze,
  onCreateContent,
  isSelected = () => false,
  filter = 'all',
  maxVisible = 200, // INCREASED from 10 to show all insights
  hideHidden = true,
  className,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<OpportunityTier | 'all'>(filter);

  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts;

    // Filter out hidden opportunities if enabled
    if (hideHidden) {
      filtered = filtered.filter(alert => !opportunityStateService.isHidden(alert.id));
    }

    // Filter by tier
    if (activeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.tier === activeFilter);
    }

    return filtered.slice(0, maxVisible);
  }, [alerts, activeFilter, maxVisible, hideHidden]);

  const tierCounts = React.useMemo(() => ({
    urgent: alerts.filter(a => a.tier === 'urgent').length,
    'high-value': alerts.filter(a => a.tier === 'high-value').length,
    evergreen: alerts.filter(a => a.tier === 'evergreen').length,
  }), [alerts]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Opportunity Radar
          </h3>
        </div>
        <Badge variant="outline">{alerts.length} opportunities</Badge>
      </div>

      {/* Tier Filters */}
      <div className="flex gap-2">
        <FilterButton
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          count={alerts.length}
        >
          All
        </FilterButton>
        <FilterButton
          active={activeFilter === 'urgent'}
          onClick={() => setActiveFilter('urgent')}
          count={tierCounts.urgent}
          variant="urgent"
        >
          Urgent
        </FilterButton>
        <FilterButton
          active={activeFilter === 'high-value'}
          onClick={() => setActiveFilter('high-value')}
          count={tierCounts['high-value']}
          variant="high-value"
        >
          High Value
        </FilterButton>
        <FilterButton
          active={activeFilter === 'evergreen'}
          onClick={() => setActiveFilter('evergreen')}
          count={tierCounts.evergreen}
          variant="evergreen"
        >
          Evergreen
        </FilterButton>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
              No opportunities found for this filter.
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
              onCreateContent={onCreateContent}
              isSelected={isSelected(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Filter Button Component
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: 'urgent' | 'high-value' | 'evergreen';
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  onClick,
  count,
  variant,
  children,
}) => {
  const variantStyles = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'high-value': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    evergreen: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : variant
          ? variantStyles[variant]
          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
      )}
    >
      {children}
      <span className={cn(
        'px-1.5 py-0.5 text-xs rounded-full',
        active ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'
      )}>
        {count}
      </span>
    </button>
  );
};

// Alert Card Component
interface AlertCardProps {
  alert: OpportunityAlert;
  onDismiss?: (alertId: string) => void;
  onSnooze?: (alertId: string, durationMs?: number) => void;
  onCreateContent?: (alert: OpportunityAlert) => void;
  isSelected?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onDismiss,
  onSnooze,
  onCreateContent,
  isSelected = false,
}) => {
  const tierConfig = {
    urgent: {
      icon: AlertTriangle,
      bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      iconColor: 'text-red-500',
    },
    'high-value': {
      icon: TrendingUp,
      bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      iconColor: 'text-amber-500',
    },
    evergreen: {
      icon: Calendar,
      bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      iconColor: 'text-green-500',
    },
  };

  const config = tierConfig[alert.tier];
  const Icon = config.icon;

  const sourceLabels: Record<OpportunitySource, string> = {
    'trending-topic': 'Trending',
    'weather-trigger': 'Weather',
    'seasonal': 'Seasonal',
    'competitor-gap': 'Competitor',
    'customer-pain': 'Customer Pain',
    'market-shift': 'Market',
    'news-event': 'News',
  };

  return (
    <div
      onClick={() => onCreateContent?.(alert)}
      className={cn(
        'w-full text-left border-2 rounded-lg transition-all hover:shadow-md cursor-pointer',
        config.bg,
        isSelected
          ? 'border-purple-500 dark:border-purple-400 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800'
          : 'border-transparent'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCreateContent?.(alert);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('mt-0.5', config.iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {alert.title}
                </h4>
                <Badge className={cn('text-xs capitalize', config.badge)}>
                  {alert.tier}
                </Badge>
                {isSelected && (
                  <div className="ml-auto flex-shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Gap: What competitors aren't saying */}
              <div className="mb-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded border-l-2 border-amber-500">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
                      Gap: Competitors Aren't Talking About This
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Angle: Differentiation opportunity */}
              <div className="mb-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded border-l-2 border-green-500">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">
                      Your Angle: Stand Out Here
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {alert.metadata?.reasoning ||
                       alert.metadata?.evidence?.[0] ||
                       `Capitalize on this gap to differentiate from competitors`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Evidence */}
              {alert.metadata?.evidence && alert.metadata.evidence.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded border-l-2 border-blue-500">
                  <div className="flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        Source Evidence
                        {alert.metadata?.sourceLabel && (
                          <span className="ml-1 font-normal text-blue-600 dark:text-blue-400">
                            • {alert.metadata.sourceLabel}
                          </span>
                        )}
                      </p>
                      <div className="space-y-1">
                        {alert.metadata.evidence.slice(0, 2).map((quote, idx) => (
                          <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 italic">
                            "{quote}"
                          </p>
                        ))}
                        {alert.metadata.evidence.length > 2 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            +{alert.metadata.evidence.length - 2} more data points
                          </p>
                        )}
                      </div>
                      {alert.metadata?.sourceDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Detected {new Date(alert.metadata.sourceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Urgency: {alert.urgencyScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Impact: {alert.potentialImpact}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{sourceLabels[alert.source]}</span>
                </div>
              </div>

              {/* Suggested Templates */}
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                  Compatible with:
                </span>
                {alert.suggestedTemplates.slice(0, 3).map(template => (
                  <span
                    key={template}
                    className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium"
                  >
                    {template}
                  </span>
                ))}
              </div>

              {/* Actions hint */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">
                  {isSelected ? '✓ Selected - Click again to deselect' : 'Click to select and combine with other insights'}
                </span>
                {alert.expiresAt && (
                  <span>
                    Expires: {new Date(alert.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            {onSnooze && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(alert.id, 24 * 60 * 60 * 1000);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Snooze alert for 24 hours"
                title="Snooze for 24 hours"
              >
                <BellOff className="w-4 h-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Dismiss alert"
                title="Dismiss permanently"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default OpportunityRadar;
