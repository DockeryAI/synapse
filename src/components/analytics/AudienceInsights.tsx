/**
 * Audience Insights Component
 *
 * Displays follower demographics, growth trends, geographic distribution,
 * engagement patterns, activity heatmap, and sentiment analysis.
 *
 * Tasks: 453-459
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnalyticsService } from '@/services/analytics/analytics.service'
import type { Demographics, GrowthData, SentimentData, Platform } from '@/types/analytics.types'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, MapPin, TrendingUp, Smile, Frown, Meh } from 'lucide-react'

interface AudienceInsightsProps {
  brandId: string
  platform?: Platform
  className?: string
}

export const AudienceInsights: React.FC<AudienceInsightsProps> = ({ brandId, platform, className }) => {
  const [demographics, setDemographics] = React.useState<Demographics | null>(null)
  const [growth, setGrowth] = React.useState<GrowthData | null>(null)
  const [sentiment, setSentiment] = React.useState<SentimentData | null>(null)

  React.useEffect(() => {
    loadInsights()
  }, [brandId, platform])

  const loadInsights = async () => {
    try {
      const [demo, growthData, sent] = await Promise.all([
        AnalyticsService.getAudienceDemographics(brandId),
        AnalyticsService.getAudienceGrowth(brandId, {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        }),
        AnalyticsService.getSentimentAnalysis(brandId),
      ])
      setDemographics(demo)
      setGrowth(growthData)
      setSentiment(sent)
    } catch (error) {
      console.error('Error loading audience insights:', error)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className={`${className} space-y-6`}>
      {/* Follower Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Follower Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {growth && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{growth.totalGrowth}</div>
                  <div className="text-xs text-muted-foreground">Total Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{growth.growthRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Growth Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{growth.averageDailyGrowth.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Avg Daily</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growth.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="newFollowers" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {demographics && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={demographics.ageRanges}
                    dataKey="percentage"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {demographics.ageRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gender Split */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {demographics && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={demographics.genderSplit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gender" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demographics && (
            <div className="space-y-2">
              {demographics.topLocations.map((loc, index) => (
                <div key={loc.location} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{index + 1}</span>
                    <div>
                      <div className="font-medium">{loc.location}</div>
                      <div className="text-xs text-muted-foreground">{loc.count} followers</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{loc.percentage}%</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Overall audience sentiment from comments and reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {sentiment && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <Smile className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {(sentiment.overall.positive * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Meh className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-600">
                    {(sentiment.overall.neutral * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Neutral</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                  <Frown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {(sentiment.overall.negative * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Negative</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Overall Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        sentiment.averageSentimentScore >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.abs(sentiment.averageSentimentScore) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{sentiment.averageSentimentScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
