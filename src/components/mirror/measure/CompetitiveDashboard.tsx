/**
 * Competitive Dashboard Component
 * Displays discovered competitors categorized by market position
 * Shows psychology comparison and competitive intelligence
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Target, Zap, Building2, ExternalLink, Users, Award } from 'lucide-react'
import type { CompetitorAnalysis, Competitor } from '@/services/intelligence/competitor-discovery'

interface CompetitiveDashboardProps {
  analysis: CompetitorAnalysis | null
  brandAuthority?: number
  industryData?: any
}

export function CompetitiveDashboard({
  analysis,
  brandAuthority = 50,
  industryData,
}: CompetitiveDashboardProps) {
  if (!analysis || analysis.total_found === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Intelligence
          </CardTitle>
          <CardDescription>Discover your competitive landscape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No competitor data available yet. Competitor analysis will appear here once your brand is analyzed.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { market_leaders, primary_competitors, emerging_competitors } = analysis

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Competitive Intelligence
            </CardTitle>
            <CardDescription>
              Discovered {analysis.total_found} competitors across your market
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {analysis.total_found} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market-leaders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="market-leaders">
              <Award className="h-4 w-4 mr-2" />
              Market Leaders ({market_leaders.length})
            </TabsTrigger>
            <TabsTrigger value="primary">
              <Target className="h-4 w-4 mr-2" />
              Primary ({primary_competitors.length})
            </TabsTrigger>
            <TabsTrigger value="emerging">
              <TrendingUp className="h-4 w-4 mr-2" />
              Emerging ({emerging_competitors.length})
            </TabsTrigger>
          </TabsList>

          {/* Market Leaders Tab */}
          <TabsContent value="market-leaders" className="space-y-4 mt-4">
            {market_leaders.length > 0 ? (
              <>
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-3 mb-4">
                  <p className="text-xs text-yellow-900 dark:text-yellow-200">
                    <strong>Market Leaders</strong> have authority scores of 70+ and dominate search rankings.
                    Study their strategies and find gaps to differentiate.
                  </p>
                </div>
                <div className="grid gap-3">
                  {market_leaders.map((competitor, index) => (
                    <CompetitorCard
                      key={index}
                      competitor={competitor}
                      brandAuthority={brandAuthority}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No market leaders identified yet" />
            )}
          </TabsContent>

          {/* Primary Competitors Tab */}
          <TabsContent value="primary" className="space-y-4 mt-4">
            {primary_competitors.length > 0 ? (
              <>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 mb-4">
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    <strong>Primary Competitors</strong> are direct competitors with similar market positioning.
                    Monitor their content and messaging closely.
                  </p>
                </div>
                <div className="grid gap-3">
                  {primary_competitors.map((competitor, index) => (
                    <CompetitorCard
                      key={index}
                      competitor={competitor}
                      brandAuthority={brandAuthority}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No primary competitors identified yet" />
            )}
          </TabsContent>

          {/* Emerging Competitors Tab */}
          <TabsContent value="emerging" className="space-y-4 mt-4">
            {emerging_competitors.length > 0 ? (
              <>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 mb-4">
                  <p className="text-xs text-green-900 dark:text-green-200">
                    <strong>Emerging Competitors</strong> are newer players with growth potential.
                    Watch for innovative approaches and rapid growth.
                  </p>
                </div>
                <div className="grid gap-3">
                  {emerging_competitors.map((competitor, index) => (
                    <CompetitorCard
                      key={index}
                      competitor={competitor}
                      brandAuthority={brandAuthority}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No emerging competitors identified yet" />
            )}
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Authority</span>
                <span className="font-bold">{brandAuthority}</span>
              </div>
              <Progress value={brandAuthority} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Competitor Authority</span>
                <span className="font-bold">
                  {Math.round(
                    [...market_leaders, ...primary_competitors, ...emerging_competitors].reduce(
                      (acc, c) => acc + (c.authority_score || 50),
                      0
                    ) / analysis.total_found
                  )}
                </span>
              </div>
              <Progress
                value={Math.round(
                  [...market_leaders, ...primary_competitors, ...emerging_competitors].reduce(
                    (acc, c) => acc + (c.authority_score || 50),
                    0
                  ) / analysis.total_found
                )}
                className="h-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CompetitorCard({
  competitor,
  brandAuthority,
  rank,
}: {
  competitor: Competitor
  brandAuthority: number
  rank: number
}) {
  const authorityDiff = (competitor.authority_score || 50) - brandAuthority
  const isAhead = authorityDiff > 0

  return (
    <div className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">#{rank}</span>
            <h4 className="font-semibold">{competitor.name}</h4>
            <a
              href={`https://${competitor.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            <Badge variant="outline" className="ml-auto">
              {competitor.source}
            </Badge>
          </div>

          {/* Domain */}
          <p className="text-xs text-muted-foreground">{competitor.domain}</p>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Authority</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{competitor.authority_score || 'N/A'}</span>
                {competitor.authority_score && (
                  <span
                    className={`text-xs ${
                      isAhead ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {isAhead ? '+' : ''}
                    {authorityDiff}
                  </span>
                )}
              </div>
            </div>

            {competitor.organic_keywords !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Keywords</div>
                <div className="text-lg font-bold">
                  {competitor.organic_keywords >= 1000
                    ? `${Math.round(competitor.organic_keywords / 1000)}K`
                    : competitor.organic_keywords}
                </div>
              </div>
            )}

            {competitor.organic_traffic !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Traffic</div>
                <div className="text-lg font-bold">
                  {competitor.organic_traffic >= 1000000
                    ? `${(competitor.organic_traffic / 1000000).toFixed(1)}M`
                    : competitor.organic_traffic >= 1000
                    ? `${Math.round(competitor.organic_traffic / 1000)}K`
                    : competitor.organic_traffic}
                </div>
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{competitor.confidence}%</span>
            </div>
            <Progress value={competitor.confidence} className="h-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
