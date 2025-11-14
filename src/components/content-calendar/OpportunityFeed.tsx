/**
 * OpportunityFeed Component
 * Display intelligence opportunities with countdown timers and quick actions
 * Tasks 361-367
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { OpportunityDetectorService } from '@/services/opportunity-detector.service';
import { ContentGenerator } from './ContentGenerator';
import type { Opportunity } from '@/types/content-calendar.types';

interface OpportunityFeedProps {
  brandId: string;
  userId: string;
  onGenerateFromOpportunity?: (opportunityId: string) => void;
  autoRefreshInterval?: number; // In milliseconds, default 5 minutes
}

export function OpportunityFeed({
  brandId,
  userId,
  onGenerateFromOpportunity,
  autoRefreshInterval = 5 * 60 * 1000,
}: OpportunityFeedProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  /**
   * Load opportunities
   */
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await OpportunityDetectorService.getActiveOpportunities(brandId);
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load opportunities on mount and set up auto-refresh
   */
  useEffect(() => {
    loadOpportunities();

    const interval = setInterval(loadOpportunities, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [brandId, autoRefreshInterval]);

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render to update countdown timers
      setOpportunities((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Dismiss opportunity
   */
  const handleDismiss = async (opportunityId: string) => {
    setDismissing((prev) => new Set(prev).add(opportunityId));

    try {
      await OpportunityDetectorService.dismissOpportunity(opportunityId);
      setOpportunities((prev) => prev.filter((opp) => opp.id !== opportunityId));
    } catch (error) {
      console.error('Failed to dismiss opportunity:', error);
      alert('Failed to dismiss opportunity');
    } finally {
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(opportunityId);
        return next;
      });
    }
  };

  /**
   * Open content generator for opportunity
   */
  const handleGeneratePost = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId);
    setShowGenerator(true);

    if (onGenerateFromOpportunity) {
      onGenerateFromOpportunity(opportunityId);
    }
  };

  /**
   * Get countdown text
   */
  const getCountdownText = (opportunity: Opportunity): string => {
    const timing = OpportunityDetectorService.getTimeUntilExpiration(opportunity);

    if (timing.expired) {
      return 'Expired';
    }

    if (!opportunity.expires_at) {
      return 'No deadline';
    }

    if (timing.hours < 1) {
      return `${timing.minutes}m left`;
    } else if (timing.hours < 24) {
      return `${timing.hours}h ${timing.minutes}m left`;
    } else {
      const days = Math.floor(timing.hours / 24);
      return `${days}d ${timing.hours % 24}h left`;
    }
  };

  /**
   * Get countdown color
   */
  const getCountdownColor = (opportunity: Opportunity): string => {
    const timing = OpportunityDetectorService.getTimeUntilExpiration(opportunity);

    if (timing.expired) return 'text-red-600';
    if (timing.hours < 6) return 'text-red-600';
    if (timing.hours < 24) return 'text-orange-600';
    return 'text-blue-600';
  };

  if (loading && opportunities.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading opportunities...</p>
        </div>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active opportunities right now</p>
          <p className="text-xs text-muted-foreground mt-1">
            We'll notify you when new opportunities arise
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">Intelligence Opportunities</h2>
            <Badge variant="secondary" className="ml-2">
              {opportunities.length} Active
            </Badge>
          </div>

          <Button variant="outline" size="sm" onClick={loadOpportunities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Opportunities List */}
        <div className="space-y-3">
          {opportunities.map((opportunity) => {
            const icon = OpportunityDetectorService.getOpportunityIcon(opportunity.type);
            const typeLabel = OpportunityDetectorService.getOpportunityTypeLabel(opportunity.type);
            const urgencyColor = OpportunityDetectorService.getUrgencyColor(opportunity.urgency);
            const countdownText = getCountdownText(opportunity);
            const countdownColor = getCountdownColor(opportunity);

            return (
              <Card key={opportunity.id} className="p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">{icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Badges */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{opportunity.title}</h3>
                          <Badge variant="outline" className={urgencyColor}>
                            {opportunity.urgency}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100 text-gray-700">
                            {typeLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.description}
                        </p>
                      </div>

                      {/* Dismiss Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(opportunity.id)}
                        disabled={dismissing.has(opportunity.id)}
                        className="flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Suggested Actions */}
                    {opportunity.suggested_actions && opportunity.suggested_actions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Suggested Actions:
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {opportunity.suggested_actions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-purple-600">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer: Countdown and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        {/* Countdown Timer */}
                        {opportunity.expires_at && (
                          <div className={`flex items-center gap-1 font-semibold ${countdownColor}`}>
                            <Clock className="w-3 h-3" />
                            {countdownText}
                          </div>
                        )}

                        {/* Impact Score */}
                        {opportunity.impact_score !== undefined && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertTriangle className="w-3 h-3" />
                            Impact: {opportunity.impact_score}/100
                          </div>
                        )}
                      </div>

                      {/* Generate Post Button */}
                      <Button size="sm" onClick={() => handleGeneratePost(opportunity.id)}>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate Post
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Auto-refreshes every {autoRefreshInterval / 60000} minutes
        </div>
      </Card>

      {/* Content Generator Modal */}
      {showGenerator && selectedOpportunity && (
        <ContentGenerator
          open={showGenerator}
          onClose={() => {
            setShowGenerator(false);
            setSelectedOpportunity(null);
          }}
          brandId={brandId}
          userId={userId}
          opportunityId={selectedOpportunity}
        />
      )}
    </>
  );
}
