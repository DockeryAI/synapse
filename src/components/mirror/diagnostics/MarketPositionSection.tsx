/**
 * Market Position Section
 * Deep dive into competitive reality and market standing
 */

import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertCircle, Target, Info, Database } from 'lucide-react'
import { type MarketPositionData } from '@/types/mirror-diagnostics'
import { KeywordDetailTable } from './KeywordDetailTable'

interface MarketPositionSectionProps {
  data: MarketPositionData
  hasCompletedUVP: boolean
  score: number // Added to show score calculation
}

export const MarketPositionSection: React.FC<MarketPositionSectionProps> = ({
  data,
  score,
}) => {
  // Calculate scoring breakdown for transparency
  const avgKeywordRank = Object.values(data.keyword_rankings).reduce((sum, rank) => sum + rank, 0) / Object.keys(data.keyword_rankings).length
  const keywordPenalty = avgKeywordRank > 10 ? 30 : avgKeywordRank > 5 ? 15 : 0
  const gapsPenalty = data.competitive_gaps.length * 5
  const rankPenalty = data.current_rank > 5 ? 20 : data.current_rank > 3 ? 10 : 0
  const calculatedScore = Math.max(0, Math.min(100, 100 - keywordPenalty - gapsPenalty - rankPenalty))

  return (
    <div className="space-y-4">{/* Compact spacing */}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 border rounded-lg bg-card">
          <div className="text-xs text-muted-foreground mb-1">Market Rank</div>
          <div className="text-xl font-bold">
            #{data.current_rank}
            <span className="text-sm text-muted-foreground ml-1">/ {data.total_competitors}</span>
          </div>
        </div>

        <div className="p-3 border rounded-lg bg-card">
          <div className="text-xs text-muted-foreground mb-1">Pricing</div>
          <div className="text-xl font-bold capitalize">{data.pricing_position.tier}</div>
        </div>

        <div className="p-3 border rounded-lg bg-card">
          <div className="text-xs text-muted-foreground mb-1">Competitors</div>
          <div className="text-xl font-bold">{data.total_competitors}</div>
        </div>
      </div>

      {/* Score Calculation Breakdown */}
      <Accordion type="single" collapsible className="border rounded-lg">
        <AccordionItem value="score-calc" className="border-none">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm">How This Score Was Calculated</span>
              <Badge variant="outline" className="ml-2">{score}/100</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              {/* Formula Explanation */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Scoring Formula
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Market Position Score starts at 100 and deducts points for various issues:
                </p>
                <div className="font-mono text-xs bg-white p-2 rounded border">
                  Score = 100 - Keyword Penalty - Gaps Penalty - Rank Penalty
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Starting Score</div>
                    <div className="text-xs text-muted-foreground mt-1">Base score before penalties</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">100</div>
                  </div>
                </div>

                {/* Keyword Rankings Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Keyword Rankings</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average rank: {avgKeywordRank.toFixed(1)}
                      {avgKeywordRank > 10 && ' (Poor - penalty: -30 points)'}
                      {avgKeywordRank > 5 && avgKeywordRank <= 10 && ' (Needs work - penalty: -15 points)'}
                      {avgKeywordRank <= 5 && ' (Good - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: SEMrush API (keyword rankings)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${keywordPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {keywordPenalty > 0 ? '-' : ''}{keywordPenalty}
                    </div>
                  </div>
                </div>

                {/* Competitive Gaps Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Competitive Gaps</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.competitive_gaps.length} opportunities identified (-5 points each)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity Web Search + OpenRouter AI Analysis
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${gapsPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {gapsPenalty > 0 ? '-' : ''}{gapsPenalty}
                    </div>
                  </div>
                </div>

                {/* Market Rank Penalty */}
                <div className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Market Rank Position</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Rank #{data.current_rank} of {data.total_competitors}
                      {data.current_rank > 5 && ' (Low visibility - penalty: -20 points)'}
                      {data.current_rank > 3 && data.current_rank <= 5 && ' (Middle tier - penalty: -10 points)'}
                      {data.current_rank <= 3 && ' (Top tier - no penalty)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Source: Perplexity competitor analysis + estimated position
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${rankPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {rankPenalty > 0 ? '-' : ''}{rankPenalty}
                    </div>
                  </div>
                </div>

                {/* Final Score */}
                <div className="flex items-start justify-between p-3 border-2 border-primary rounded-lg bg-primary/5">
                  <div className="flex-1">
                    <div className="font-bold text-base">Final Market Position Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      100 - {keywordPenalty} - {gapsPenalty} - {rankPenalty} = {calculatedScore}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                  </div>
                </div>
              </div>

              {/* Data Sources Summary */}
              <div className="p-3 bg-gray-50 border rounded-lg">
                <div className="font-semibold mb-2 text-xs">Data Sources Used</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">SEMrush</Badge>
                    <span>Keyword rankings and search volume data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Perplexity</Badge>
                    <span>Real-time web search for competitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">OpenRouter (Claude)</Badge>
                    <span>AI analysis of competitive positioning</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Keyword Rankings - Full Width Detailed Table */}
      {data.keyword_rankings_detailed && data.keyword_rankings_detailed.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Keyword Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <KeywordDetailTable
              keywords={data.keyword_rankings_detailed.map(kw => ({
                keyword: kw.keyword,
                position: kw.position,
                searchVolume: kw.searchVolume || 0,
                difficulty: kw.difficulty || 0,
                traffic: kw.traffic || 0,
                url: '',
                isBranded: false,
                trend: kw.trend,
              }))}
              maxRows={10}
            />
          </CardContent>
        </Card>
      ) : (
        /* Fallback to simple grid layout if detailed data not available */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Keyword Rankings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.keyword_rankings).slice(0, 10).map(([keyword, rank]) => (
              <div key={keyword} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{keyword}</span>
                <Badge variant={rank <= 3 ? 'default' : rank <= 10 ? 'secondary' : 'outline'} className="ml-2">
                  #{rank}
                </Badge>
              </div>
            ))}
            {Object.keys(data.keyword_rankings).length === 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Competitors - Separate Card Below */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Top Competitors</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>OutScraper (Google Maps)</span>
            </div>
          </div>
        </CardHeader>
          <CardContent className="space-y-3">
            {data.top_competitors.slice(0, 3).map((competitor, index) => (
              <div key={competitor.name} className="border rounded p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  <span className="font-semibold text-sm">{competitor.name}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{competitor.positioning}</p>
                <div className="flex flex-wrap gap-1">
                  {competitor.strengths.slice(0, 3).map((strength) => (
                    <Badge key={strength} variant="secondary" className="text-xs px-1 py-0">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {data.top_competitors.length === 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>

      {/* Competitive Gaps - Compact */}
      {data.competitive_gaps.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Competitive Gaps
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>AI Analysis (OutScraper + OpenRouter)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.competitive_gaps.map((gap, index) => (
              <div key={index} className="border rounded p-2 bg-white dark:bg-background space-y-1">
                <div className="font-semibold text-sm">{gap.gap}</div>
                <p className="text-xs text-muted-foreground">{gap.impact}</p>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Who:</span> {gap.competitors_doing.join(', ')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
