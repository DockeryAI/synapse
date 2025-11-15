/**
 * Competitive Monitoring Component
 *
 * Tracks competitor activity, messaging shifts, and identifies competitive gaps
 * with suggested immediate responses.
 *
 * Tasks: 476-484
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsService } from '@/services/analytics/analytics.service'
import type { CompetitiveActivity, CompetitiveGap } from '@/types/analytics.types'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Globe,
  MessageSquare,
  Package,
  Star,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react'

interface CompetitiveMonitoringProps {
  brandId: string
  className?: string
}

export const CompetitiveMonitoring: React.FC<CompetitiveMonitoringProps> = ({ brandId, className }) => {
  const [activities, setActivities] = React.useState<CompetitiveActivity[]>([])
  const [gaps, setGaps] = React.useState<CompetitiveGap[]>([])

  React.useEffect(() => {
    loadCompetitiveData()
  }, [brandId])

  const loadCompetitiveData = async () => {
    try {
      const [activityData, gapData] = await Promise.all([
        AnalyticsService.getCompetitiveActivityFeed(brandId),
        AnalyticsService.getCompetitiveGaps(brandId),
      ])
      setActivities(activityData.length > 0 ? activityData : generateSampleActivities())
      setGaps(gapData.length > 0 ? gapData : generateSampleGaps())
    } catch (error) {
      console.error('Error loading competitive data:', error)
      setActivities(generateSampleActivities())
      setGaps(generateSampleGaps())
    }
  }

  const getActivityIcon = (type: CompetitiveActivity['activityType']) => {
    switch (type) {
      case 'website_change': return <Globe className="h-5 w-5" />
      case 'new_content': return <MessageSquare className="h-5 w-5" />
      case 'product_launch': return <Package className="h-5 w-5" />
      case 'messaging_shift': return <MessageSquare className="h-5 w-5" />
      case 'reputation_change': return <Star className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getImpactColor = (impact: CompetitiveActivity['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-100 border-red-300 text-red-900'
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-900'
    }
  }

  return (
    <div className={`${className} space-y-6`}>
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="gaps">Competitive Gaps</TabsTrigger>
        </TabsList>

        {/* Activity Feed */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Competitor Activity</CardTitle>
              <CardDescription>Stay informed about competitor actions and market shifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 rounded-lg border-2 ${getImpactColor(activity.impact)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{activity.competitorName}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.activityType.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant={
                            activity.impact === 'high'
                              ? 'destructive'
                              : activity.impact === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {activity.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{activity.description}</p>
                      {activity.suggestedResponse && (
                        <div className="mt-3 p-3 rounded-lg bg-white/50 border">
                          <div className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-purple-900 mb-1">
                                Suggested Response
                              </p>
                              <p className="text-xs text-purple-700">{activity.suggestedResponse}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Generate Content
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(activity.detectedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {activities.filter((a) => a.impact === 'high').length}
                  </div>
                  <div className="text-xs text-muted-foreground">High Impact</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {new Set(activities.map((a) => a.competitorId)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">Competitors Tracked</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
                  <div className="text-xs text-muted-foreground">Total Activities</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitive Gaps */}
        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Gap Analysis</CardTitle>
              <CardDescription>Opportunities to differentiate and gain advantage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gaps.map((gap) => (
                <div key={gap.id} className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{gap.type}</Badge>
                        <Badge
                          variant={
                            gap.priority === 'high'
                              ? 'destructive'
                              : gap.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {gap.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{gap.description}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {gap.competitors.length} competitor(s) have advantage
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Effort</div>
                      <Badge variant="secondary">{gap.estimatedEffort}</Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border mb-3">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-green-900 mb-1">Opportunity</p>
                        <p className="text-xs text-green-700">{gap.opportunity}</p>
                      </div>
                    </div>
                  </div>

                  {gap.actionItems && gap.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {gap.actionItems.map((item, index) => (
                          <li key={index} className="text-xs flex items-start gap-2">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sample data generators
function generateSampleActivities(): CompetitiveActivity[] {
  return [
    {
      id: '1',
      competitorId: 'comp1',
      competitorName: 'Competitor A',
      activityType: 'product_launch',
      description: 'Launched new AI-powered analytics feature targeting enterprise customers',
      impact: 'high',
      suggestedResponse:
        'Consider highlighting your existing AI capabilities and superior customer support',
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      competitorId: 'comp2',
      competitorName: 'Competitor B',
      activityType: 'messaging_shift',
      description: 'Shifted messaging to emphasize sustainability and eco-friendly practices',
      impact: 'medium',
      suggestedResponse:
        'Review your sustainability initiatives and consider amplifying your environmental impact',
      detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      competitorId: 'comp3',
      competitorName: 'Competitor C',
      activityType: 'new_content',
      description: 'Increased content publishing frequency by 40% this week',
      impact: 'medium',
      detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

function generateSampleGaps(): CompetitiveGap[] {
  return [
    {
      id: '1',
      type: 'platform',
      description: "You're not on TikTok, but 3 competitors are actively posting",
      competitors: [
        { id: 'c1', name: 'Competitor A', advantage: '50K+ followers, high engagement' },
        { id: 'c2', name: 'Competitor B', advantage: '30K followers' },
        { id: 'c3', name: 'Competitor C', advantage: '25K followers, viral content' },
      ],
      opportunity: 'Tap into younger demographic and trending content formats',
      priority: 'high',
      estimatedEffort: 'medium',
      estimatedImpact: 'high',
      actionItems: [
        'Research TikTok content strategy for your industry',
        'Identify potential brand ambassadors or content creators',
        'Develop short-form video content plan',
      ],
    },
    {
      id: '2',
      type: 'content',
      description: 'Competitors publish 2x more video content than you',
      competitors: [
        { id: 'c1', name: 'Competitor A', advantage: 'Daily video posts' },
      ],
      opportunity: 'Video content drives 3x higher engagement in your industry',
      priority: 'high',
      estimatedEffort: 'medium',
      estimatedImpact: 'high',
      actionItems: [
        'Invest in video production capabilities',
        'Repurpose existing content into video format',
        'Test short-form vs long-form video performance',
      ],
    },
    {
      id: '3',
      type: 'keyword',
      description: 'Competitors rank for 15 keywords you don\'t target',
      competitors: [
        { id: 'c2', name: 'Competitor B', advantage: 'Strong SEO presence' },
      ],
      opportunity: 'White space identified in "AI automation" and "workflow optimization" topics',
      priority: 'medium',
      estimatedEffort: 'low',
      estimatedImpact: 'medium',
      actionItems: [
        'Create content targeting identified keyword gaps',
        'Optimize existing content for better SEO',
        'Build backlink strategy',
      ],
    },
  ]
}
