/**
 * Comprehensive Keyword Ranking Table
 * Shows ALL tracked keywords with rankings, competitor data, and trends
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

interface KeywordRanking {
  keyword: string
  position: number
  previousPosition?: number
  searchVolume: number
  difficulty: number
  url: string
  competitors: CompetitorRanking[]
  trend: 'up' | 'down' | 'stable'
  changeAmount?: number
}

interface CompetitorRanking {
  domain: string
  position: number
  url: string
}

interface KeywordRankingTableProps {
  keywords: KeywordRanking[]
  isLoading?: boolean
  onGenerateContent?: (keyword: string) => void
}

export const KeywordRankingTable: React.FC<KeywordRankingTableProps> = ({
  keywords,
  isLoading = false,
  onGenerateContent,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'position' | 'volume' | 'difficulty'>('position')
  const [filterTrend, setFilterTrend] = React.useState<'all' | 'up' | 'down' | 'stable'>('all')

  // Filter and sort keywords
  const filteredKeywords = React.useMemo(() => {
    let filtered = keywords.filter(k =>
      k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (filterTrend !== 'all') {
      filtered = filtered.filter(k => k.trend === filterTrend)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'position':
          return a.position - b.position
        case 'volume':
          return b.searchVolume - a.searchVolume
        case 'difficulty':
          return a.difficulty - b.difficulty
        default:
          return 0
      }
    })
  }, [keywords, searchQuery, sortBy, filterTrend])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', change?: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          {change && <span className="text-xs">+{change}</span>}
        </div>
      )
    }
    if (trend === 'down') {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          {change && <span className="text-xs">-{change}</span>}
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="h-4 w-4" />
        <span className="text-xs">—</span>
      </div>
    )
  }

  const getPositionBadge = (position: number) => {
    if (position <= 3) return 'default'
    if (position <= 10) return 'secondary'
    if (position <= 20) return 'outline'
    return 'destructive'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keyword Rankings</CardTitle>
          <CardDescription>Loading keyword data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!keywords || keywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keyword Rankings</CardTitle>
          <CardDescription>No keyword rankings available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keyword rankings will appear here once SEO tracking is active.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Keyword Rankings</span>
          <Badge variant="outline">{keywords.length} tracked keywords</Badge>
        </CardTitle>
        <CardDescription>
          Track your keyword positions and compare with competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="position">Position</SelectItem>
              <SelectItem value="volume">Search Volume</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTrend} onValueChange={(v: any) => setFilterTrend(v)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trends</SelectItem>
              <SelectItem value="up">Improving</SelectItem>
              <SelectItem value="down">Declining</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredKeywords.length} of {keywords.length} keywords
          </div>
        )}

        {/* Keywords Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Keyword</TableHead>
                <TableHead className="text-center w-[100px]">Rank</TableHead>
                <TableHead className="text-center w-[100px]">Trend</TableHead>
                <TableHead className="text-right w-[120px]">Search Vol.</TableHead>
                <TableHead className="text-center w-[100px]">Difficulty</TableHead>
                <TableHead className="w-[200px]">Top Competitors</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No keywords match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeywords.map((keyword, index) => (
                  <TableRow key={`${keyword.keyword}-${keyword.position}-${index}`}>
                    {/* Keyword */}
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{keyword.keyword}</div>
                        {keyword.url && (
                          <a
                            href={keyword.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            View page <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Rank */}
                    <TableCell className="text-center">
                      <Badge variant={getPositionBadge(keyword.position)}>
                        #{keyword.position}
                      </Badge>
                    </TableCell>

                    {/* Trend */}
                    <TableCell className="text-center">
                      {getTrendIcon(keyword.trend, keyword.changeAmount)}
                    </TableCell>

                    {/* Search Volume */}
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {keyword.searchVolume.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </TableCell>

                    {/* Difficulty */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              keyword.difficulty > 70
                                ? 'bg-red-500'
                                : keyword.difficulty > 40
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${keyword.difficulty}%` }}
                          />
                        </div>
                        <span className="text-xs">{keyword.difficulty}%</span>
                      </div>
                    </TableCell>

                    {/* Competitors */}
                    <TableCell>
                      {keyword.competitors && keyword.competitors.length > 0 ? (
                        <div className="space-y-1 text-xs">
                          {keyword.competitors.slice(0, 3).map((comp) => (
                            <div key={comp.domain} className="flex items-center justify-between">
                              <span className="text-muted-foreground truncate max-w-[120px]">
                                {comp.domain}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                #{comp.position}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {onGenerateContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onGenerateContent(keyword.keyword)}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Generate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Top 3 Rankings</div>
            <div className="text-2xl font-bold">
              {keywords.filter(k => k.position <= 3).length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Page 1 Rankings</div>
            <div className="text-2xl font-bold">
              {keywords.filter(k => k.position <= 10).length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Improving</div>
            <div className="text-2xl font-bold text-green-600">
              {keywords.filter(k => k.trend === 'up').length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Declining</div>
            <div className="text-2xl font-bold text-red-600">
              {keywords.filter(k => k.trend === 'down').length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
