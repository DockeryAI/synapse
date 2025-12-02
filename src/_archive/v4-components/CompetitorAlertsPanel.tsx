/**
 * CompetitorAlertsPanel Component
 *
 * Phase 5 - Gap Tab 2.0
 * Displays competitor intelligence alerts with filtering,
 * read/unread status, and action buttons.
 *
 * Created: 2025-11-28
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Megaphone,
  Target,
  Newspaper,
  Sparkles,
  X,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import type {
  CompetitorAlert,
  AlertType,
  AlertSeverity
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitorAlertsPanelProps {
  alerts: CompetitorAlert[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onMarkAsRead: (alertId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDismiss: (alertId: string) => Promise<void>;
  onAction: (alertId: string) => Promise<void>;
  onFilterChange?: (types: AlertType[] | null) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALERT_TYPE_CONFIG: Record<AlertType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  'new-complaint': {
    label: 'New Complaint',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  'new-ad-campaign': {
    label: 'Ad Campaign',
    icon: <Megaphone className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  'positioning-change': {
    label: 'Positioning',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  'new-feature': {
    label: 'New Feature',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  'news-mention': {
    label: 'News',
    icon: <Newspaper className="w-4 h-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  'gap-opportunity': {
    label: 'Gap Found',
    icon: <Target className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  }
};

const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  high: {
    label: 'High',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  }
};

// ============================================================================
// ALERT CARD COMPONENT
// ============================================================================

interface AlertCardProps {
  alert: CompetitorAlert;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onAction: () => void;
}

const AlertCard = memo(function AlertCard({
  alert,
  onMarkAsRead,
  onDismiss,
  onAction
}: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type];
  const severityConfig = SEVERITY_CONFIG[alert.severity];

  const timeAgo = getTimeAgo(alert.detected_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        rounded-lg border transition-all duration-200
        ${alert.is_read
          ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }
      `}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!alert.is_read) onMarkAsRead();
        }}
      >
        {/* Type Icon */}
        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
          <span className={typeConfig.color}>{typeConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${severityConfig.bgColor} ${severityConfig.color}`}>
              {severityConfig.label}
            </span>
            {!alert.is_read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>

          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
            {alert.title}
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {timeAgo}
          </p>
        </div>

        {/* Expand/Collapse */}
        <button className="p-1 text-gray-400 hover:text-gray-600">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {alert.description}
              </p>

              {/* Evidence */}
              {alert.evidence?.quotes && alert.evidence.quotes.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Evidence</span>
                  <div className="mt-1 space-y-1">
                    {alert.evidence.quotes.slice(0, 2).map((quote, i) => (
                      <div
                        key={i}
                        className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 p-2 rounded italic"
                      >
                        "{quote.quote}"
                        <span className="text-gray-400 not-italic"> - {quote.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {alert.related_gap_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Gap
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompetitorAlertsPanel = memo(function CompetitorAlertsPanel({
  alerts,
  unreadCount,
  isLoading,
  isRefreshing,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction,
  onFilterChange,
  className = ''
}: CompetitorAlertsPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<AlertType[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter alerts
  const filteredAlerts = selectedTypes
    ? alerts.filter(a => selectedTypes.includes(a.alert_type))
    : alerts;

  // Handle filter toggle
  const handleTypeToggle = (type: AlertType) => {
    const current = selectedTypes || [];
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];

    const result = newTypes.length === 0 ? null : newTypes;
    setSelectedTypes(result);
    onFilterChange?.(result);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters || selectedTypes
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500'
            }`}
            title="Filter alerts"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              {(Object.keys(ALERT_TYPE_CONFIG) as AlertType[]).map(type => {
                const config = ALERT_TYPE_CONFIG[type];
                const isSelected = selectedTypes?.includes(type);

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                      ${isSelected
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-purple-500`
                        : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }
                    `}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}

              {selectedTypes && (
                <button
                  onClick={() => {
                    setSelectedTypes(null);
                    onFilterChange?.(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <BellOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {selectedTypes ? 'No alerts match your filters' : 'No alerts yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            We'll notify you when competitors make changes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkAsRead={() => onMarkAsRead(alert.id)}
                onDismiss={() => onDismiss(alert.id)}
                onAction={() => onAction(alert.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CompetitorAlertsPanel;
