/**
 * SEO Health Card Component
 * Displays SEMrush SEO metrics including authority score, keywords, traffic, and opportunities
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Search, Link2, BarChart3, Award } from 'lucide-react'
import type { SEOMetrics } from '@/services/intelligence/semrush-api'

interface SEOHealthCardProps {
  seoMetrics: SEOMetrics | null
}

export function SEOHealthCard({ seoMetrics }: SEOHealthCardProps) {
  if (!seoMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Health
          </CardTitle>
          <CardDescription>
            SEO metrics unavailable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable SEMrush integration to see SEO health metrics.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { overview, healthScore } = seoMetrics

  // Determine health status color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Health
        </CardTitle>
        <CardDescription>
          Powered by SEMrush
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall SEO Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall SEO Health</span>
            <Badge variant={healthScore >= 60 ? 'default' : 'destructive'}>
              {getHealthLabel(healthScore)}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={healthScore} className="flex-1" />
            <span className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}
            </span>
          </div>
        </div>

        {/* Authority Score - Most Prominent */}
        <div className="rounded-lg bg-primary/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="font-medium">Authority Score</span>
            </div>
            <span className="text-3xl font-bold text-primary">
              {overview.authority_score}
            </span>
          </div>
          <Progress value={overview.authority_score} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Domain authority based on backlink profile and rankings
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Organic Keywords */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Organic Keywords</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(overview.organic_keywords)}
            </div>
          </div>

          {/* Organic Traffic */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Monthly Traffic</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(overview.organic_traffic)}
            </div>
          </div>

          {/* Backlinks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <span>Backlinks</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(overview.backlinks)}
            </div>
          </div>

          {/* Paid Keywords */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Paid Keywords</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(overview.paid_keywords)}
            </div>
          </div>
        </div>

        {/* Rankings Summary */}
        {seoMetrics.rankings && seoMetrics.rankings.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">Keyword Rankings</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-50 p-2">
                <div className="text-2xl font-bold text-green-600">
                  {seoMetrics.rankings.filter(r => r.position <= 3).length}
                </div>
                <div className="text-xs text-muted-foreground">Top 3</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <div className="text-2xl font-bold text-blue-600">
                  {seoMetrics.rankings.filter(r => r.position <= 10).length}
                </div>
                <div className="text-xs text-muted-foreground">Top 10</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-2">
                <div className="text-2xl font-bold text-yellow-600">
                  {seoMetrics.rankings.filter(r => r.position > 10 && r.position <= 20).length}
                </div>
                <div className="text-xs text-muted-foreground">11-20</div>
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Count */}
        {seoMetrics.opportunities && seoMetrics.opportunities.length > 0 && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">
                {seoMetrics.opportunities.length} keyword opportunities found
              </span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Quick wins, high-value keywords, and long-term plays identified
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
