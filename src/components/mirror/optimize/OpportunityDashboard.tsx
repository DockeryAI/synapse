/**
 * Opportunity Dashboard Component
 * Displays real-time marketing opportunities with countdown timers
 * Integrates weather, trends, news, competitor moves, and seasonal events
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Zap,
  TrendingUp,
  Cloud,
  Newspaper,
  Target,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'
import type { OpportunityInsight } from '@/types/intelligence.types'
import { OpportunityDetector } from '@/services/intelligence/opportunity-detector'

interface OpportunityDashboardProps {
  brandId: string
  industry?: string
  brandData?: any
}

export function OpportunityDashboard({
  brandId,
  industry,
  brandData,
}: OpportunityDashboardProps) {
  const [opportunities, setOpportunities] = React.useState<OpportunityInsight[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<string>('all')

  React.useEffect(() => {
    loadOpportunities()
    // Refresh every 5 minutes
    const interval = setInterval(loadOpportunities, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [brandId, industry])

  const loadOpportunities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const opps = await OpportunityDetector.detectOpportunities({
        brandId,
        industry: industry || brandData?.industry,
        keywords: brandData?.uvps || [],
      })
      setOpportunities(opps)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Provide clear, user-friendly error messages
      if (errorMessage.includes('not implemented')) {
        setError('Opportunity detection is not fully configured yet. This feature requires API integrations for weather, trends, news, and competitor monitoring.')
      } else if (errorMessage.includes('API')) {
        setError('Unable to connect to external data sources. Please check your API configuration.')
      } else {
        setError(`Failed to load opportunities: ${errorMessage}`)
      }

      console.error('[OpportunityDashboard] Error loading opportunities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (opportunityId: string, action: string) => {
    // TODO: Implement action handling
    console.log(`Action ${action} for opportunity ${opportunityId}`)
  }

  const handleDismiss = (opportunityId: string) => {
    setOpportunities(opps => opps.filter(o => o.id !== opportunityId))
  }

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return true
    if (filter === 'critical') return opp.urgency === 'critical'
    if (filter === 'high') return opp.urgency === 'high'
    return opp.type === filter
  })

  // Count by type
  const counts = {
    all: opportunities.length,
    critical: opportunities.filter(o => o.urgency === 'critical').length,
    high: opportunities.filter(o => o.urgency === 'high').length,
    weather_based: opportunities.filter(o => o.type === 'weather_based').length,
    trending_topic: opportunities.filter(o => o.type === 'trending_topic').length,
    competitor_move: opportunities.filter(o => o.type === 'competitor_move').length,
    seasonal_event: opportunities.filter(o => o.type === 'seasonal_event').length,
    local_news: opportunities.filter(o => o.type === 'local_news').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Opportunity Dashboard
            </CardTitle>
            <CardDescription>
              Real-time marketing opportunities detected from multiple signals
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {opportunities.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </Button>
          {counts.critical > 0 && (
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              className="text-red-600"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Critical ({counts.critical})
            </Button>
          )}
          {counts.high > 0 && (
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high')}
            >
              High Priority ({counts.high})
            </Button>
          )}
          <Button
            variant={filter === 'weather_based' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('weather_based')}
          >
            <Cloud className="h-3 w-3 mr-1" />
            Weather ({counts.weather_based})
          </Button>
          <Button
            variant={filter === 'trending_topic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('trending_topic')}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Trends ({counts.trending_topic})
          </Button>
          <Button
            variant={filter === 'local_news' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('local_news')}
          >
            <Newspaper className="h-3 w-3 mr-1" />
            News ({counts.local_news})
          </Button>
        </div>

        {/* Opportunities List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>Scanning for opportunities...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-2">Opportunity Detection Unavailable</h4>
                <p className="text-xs text-muted-foreground mb-3">{error}</p>
                <p className="text-xs text-muted-foreground">
                  This feature requires configuration. Contact your administrator to enable:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 ml-4 space-y-1">
                  <li>• Weather API integration</li>
                  <li>• Google Trends API</li>
                  <li>• News monitoring service</li>
                  <li>• Competitor tracking</li>
                </ul>
              </div>
            </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No opportunities found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onAction={handleAction}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {opportunities.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{counts.critical}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{counts.high}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    opportunities.reduce((acc, o) => acc + o.impact_score, 0) /
                      opportunities.length
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Avg Impact</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    opportunities.reduce((acc, o) => acc + o.confidence, 0) /
                      opportunities.length
                  )}
                  %
                </div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OpportunityCard({
  opportunity,
  onAction,
  onDismiss,
}: {
  opportunity: OpportunityInsight
  onAction: (id: string, action: string) => void
  onDismiss: (id: string) => void
}) {
  const [timeLeft, setTimeLeft] = React.useState<string>('')

  // Calculate time remaining
  React.useEffect(() => {
    if (!opportunity.expires_at) return

    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(opportunity.expires_at!)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}d ${hours % 24}h`)
      } else {
        setTimeLeft(`${hours}h ${minutes}m`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [opportunity.expires_at])

  const urgencyColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  }

  const typeIcons = {
    weather_based: Cloud,
    trending_topic: TrendingUp,
    competitor_move: Target,
    seasonal_event: Calendar,
    local_news: Newspaper,
    keyword_opportunity: Zap,
    review_response: CheckCircle,
    industry_shift: TrendingUp,
    audience_behavior: Target,
    platform_update: AlertCircle,
  }

  const TypeIcon = typeIcons[opportunity.type] || Zap

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        urgencyColors[opportunity.urgency]
      } space-y-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="rounded-full bg-white dark:bg-gray-800 p-2 shadow-sm">
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{opportunity.title}</h4>
              <Badge variant="outline" className="text-xs">
                {opportunity.urgency}
              </Badge>
              {opportunity.expires_at && timeLeft && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {opportunity.description}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Impact Score</div>
          <Progress value={opportunity.impact_score} className="h-2" />
          <div className="text-xs font-medium mt-1">{opportunity.impact_score}/100</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Confidence</div>
          <Progress value={opportunity.confidence} className="h-2" />
          <div className="text-xs font-medium mt-1">{opportunity.confidence}%</div>
        </div>
      </div>

      {/* Suggested Actions */}
      {opportunity.suggested_actions && opportunity.suggested_actions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium">Suggested Actions:</div>
          <div className="flex flex-wrap gap-2">
            {opportunity.suggested_actions.slice(0, 3).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onAction(opportunity.id, action.action_type)}
                className="text-xs"
              >
                {action.description}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(opportunity.id)}
          className="text-muted-foreground"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
        <div className="text-xs text-muted-foreground">
          Source: {opportunity.source}
        </div>
      </div>
    </div>
  )
}
