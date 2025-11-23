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
  Zap
} from 'lucide-react';
import type {
  OpportunityAlert,
  OpportunityTier,
  OpportunitySource
} from '@/types/v2/intelligence.types';

export interface OpportunityRadarProps {
  alerts: OpportunityAlert[];
  onDismiss?: (alertId: string) => void;
  onCreateContent?: (alert: OpportunityAlert) => void;
  filter?: OpportunityTier | 'all';
  maxVisible?: number;
  className?: string;
  loading?: boolean;
}

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({
  alerts,
  onDismiss,
  onCreateContent,
  filter = 'all',
  maxVisible = 10,
  className,
  loading = false,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<OpportunityTier | 'all'>(filter);

  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts;
    if (activeFilter !== 'all') {
      filtered = alerts.filter(alert => alert.tier === activeFilter);
    }
    return filtered.slice(0, maxVisible);
  }, [alerts, activeFilter, maxVisible]);

  const tierCounts = React.useMemo(() => ({
    urgent: alerts.filter(a => a.tier === 'urgent').length,
    'high-value': alerts.filter(a => a.tier === 'high-value').length,
    evergreen: alerts.filter(a => a.tier === 'evergreen').length,
  }), [alerts]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Opportunity Radar
            </h3>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 dark:bg-slate-800 rounded-lg h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Opportunity Radar
            </h3>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              No opportunities available yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Opportunities will appear here once intelligence analysis completes
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              onCreateContent={onCreateContent}
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
  onCreateContent?: (alert: OpportunityAlert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onDismiss,
  onCreateContent,
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
    <Card className={cn('border', config.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('mt-0.5', config.iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {alert.title}
                </h4>
                <Badge className={cn('text-xs capitalize', config.badge)}>
                  {alert.tier}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {alert.description}
              </p>

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
                {alert.suggestedTemplates.slice(0, 3).map(template => (
                  <span
                    key={template}
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {template}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onCreateContent && (
                  <button
                    onClick={() => onCreateContent(alert)}
                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Create Content
                  </button>
                )}
                {alert.expiresAt && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Expires: {new Date(alert.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityRadar;
