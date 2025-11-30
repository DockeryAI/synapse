/**
 * useCompetitorAlerts Hook
 *
 * Phase 5 - Gap Tab 2.0
 * React hook for managing competitor alerts.
 * Provides state management, real-time updates, and notification badge counts.
 *
 * Created: 2025-11-28
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  competitorAlertService,
  type AlertStats
} from '@/services/intelligence/competitor-alert.service';
import type {
  CompetitorAlert,
  AlertType,
  AlertSeverity
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface UseCompetitorAlertsOptions {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  unreadOnly?: boolean;
  limit?: number;
}

interface UseCompetitorAlertsResult {
  // Data
  alerts: CompetitorAlert[];
  stats: AlertStats | null;
  unreadCount: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  markAsActioned: (alertId: string) => Promise<void>;

  // Filters
  filterByType: (types: AlertType[] | null) => void;
  filterBySeverity: (severities: AlertSeverity[] | null) => void;
  filteredAlerts: CompetitorAlert[];

  // Grouping
  alertsByCompetitor: Map<string, CompetitorAlert[]>;
  alertsByType: Map<AlertType, CompetitorAlert[]>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCompetitorAlerts(
  brandId: string | null,
  options: UseCompetitorAlertsOptions = {}
): UseCompetitorAlertsResult {
  const {
    autoRefresh = false,
    refreshIntervalMs = 5 * 60 * 1000, // 5 minutes default
    unreadOnly = false,
    limit = 50
  } = options;

  // State
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<AlertType[] | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity[] | null>(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (!brandId) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [alertsData, statsData] = await Promise.all([
        competitorAlertService.getAlerts(brandId, { unreadOnly, limit }),
        competitorAlertService.getAlertStats(brandId)
      ]);

      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(message);
      console.error('[useCompetitorAlerts] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [brandId, unreadOnly, limit]);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !brandId) return;

    const interval = setInterval(() => {
      fetchAlerts(true);
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalMs, brandId, fetchAlerts]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchAlerts(true);
  }, [fetchAlerts]);

  // Mark as read
  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await competitorAlertService.markAsRead(alertId);

      // Optimistic update
      setAlerts(prev =>
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      );
      setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    } catch (err) {
      console.error('[useCompetitorAlerts] Mark as read error:', err);
      // Refresh to get correct state
      await fetchAlerts(true);
    }
  }, [fetchAlerts]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!brandId) return;

    try {
      await competitorAlertService.markAllAsRead(brandId);

      // Optimistic update
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setStats(prev => prev ? { ...prev, unread: 0 } : null);
    } catch (err) {
      console.error('[useCompetitorAlerts] Mark all as read error:', err);
      await fetchAlerts(true);
    }
  }, [brandId, fetchAlerts]);

  // Dismiss alert
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await competitorAlertService.dismissAlert(alertId);

      // Optimistic update
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setStats(prev => prev ? { ...prev, total: prev.total - 1 } : null);
    } catch (err) {
      console.error('[useCompetitorAlerts] Dismiss error:', err);
      await fetchAlerts(true);
    }
  }, [fetchAlerts]);

  // Mark as actioned
  const markAsActioned = useCallback(async (alertId: string) => {
    try {
      await competitorAlertService.markAsActioned(alertId);

      // Optimistic update
      setAlerts(prev =>
        prev.map(a => a.id === alertId ? { ...a, is_actioned: true, is_read: true } : a)
      );
    } catch (err) {
      console.error('[useCompetitorAlerts] Mark as actioned error:', err);
      await fetchAlerts(true);
    }
  }, [fetchAlerts]);

  // Filter functions
  const filterByType = useCallback((types: AlertType[] | null) => {
    setTypeFilter(types);
  }, []);

  const filterBySeverity = useCallback((severities: AlertSeverity[] | null) => {
    setSeverityFilter(severities);
  }, []);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (typeFilter && typeFilter.length > 0) {
      result = result.filter(a => typeFilter.includes(a.alert_type));
    }

    if (severityFilter && severityFilter.length > 0) {
      result = result.filter(a => severityFilter.includes(a.severity));
    }

    return result;
  }, [alerts, typeFilter, severityFilter]);

  // Group by competitor
  const alertsByCompetitor = useMemo(() => {
    const map = new Map<string, CompetitorAlert[]>();

    for (const alert of alerts) {
      const key = alert.competitor_id || 'general';
      const existing = map.get(key) || [];
      map.set(key, [...existing, alert]);
    }

    return map;
  }, [alerts]);

  // Group by type
  const alertsByType = useMemo(() => {
    const map = new Map<AlertType, CompetitorAlert[]>();

    for (const alert of alerts) {
      const existing = map.get(alert.alert_type) || [];
      map.set(alert.alert_type, [...existing, alert]);
    }

    return map;
  }, [alerts]);

  // Unread count
  const unreadCount = useMemo(() => {
    return stats?.unread || alerts.filter(a => !a.is_read).length;
  }, [stats, alerts]);

  return {
    // Data
    alerts,
    stats,
    unreadCount,

    // Loading states
    isLoading,
    isRefreshing,
    error,

    // Actions
    refresh,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    markAsActioned,

    // Filters
    filterByType,
    filterBySeverity,
    filteredAlerts,

    // Grouping
    alertsByCompetitor,
    alertsByType
  };
}

export default useCompetitorAlerts;
