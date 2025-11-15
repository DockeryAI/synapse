/**
 * Keyword Detail Table Component
 * Displays keyword rankings with volume, difficulty, and trend data
 */

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react'
import { type KeywordRanking } from '@/services/intelligence/semrush-api'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface KeywordDetailTableProps {
  keywords: KeywordRanking[]
  brandName?: string
  className?: string
  maxRows?: number
}

export const KeywordDetailTable: React.FC<KeywordDetailTableProps> = ({
  keywords,
  brandName,
  className,
  maxRows = 10,
}) => {
  const [sortField, setSortField] = React.useState<'position' | 'volume' | 'difficulty'>('position')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  // Sort keywords
  const sortedKeywords = React.useMemo(() => {
    const sorted = [...keywords].sort((a, b) => {
      let aVal = 0
      let bVal = 0

      switch (sortField) {
        case 'position':
          aVal = a.position
          bVal = b.position
          break
        case 'volume':
          aVal = a.searchVolume
          bVal = b.searchVolume
          break
        case 'difficulty':
          aVal = a.difficulty
          bVal = b.difficulty
          break
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted.slice(0, maxRows)
  }, [keywords, sortField, sortDirection, maxRows])

  const handleSort = (field: 'position' | 'volume' | 'difficulty') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'position' ? 'asc' : 'desc') // Position ascending by default, others descending
    }
  }

  const getTrendIcon = (trend?: 'rising' | 'stable' | 'declining') => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty >= 80) return 'text-red-600'
    if (difficulty >= 60) return 'text-orange-600'
    if (difficulty >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty >= 80) return 'Very Hard'
    if (difficulty >= 60) return 'Hard'
    if (difficulty >= 40) return 'Medium'
    return 'Easy'
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 10000) return `${(volume / 1000).toFixed(1)}k`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`
    return volume.toString()
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: 'position' | 'volume' | 'difficulty'
    children: React.ReactNode
  }) => (
    <button
      className="flex items-center gap-1 hover:text-primary transition-colors"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      )}
    </button>
  )

  if (sortedKeywords.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        No keyword data available
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {/* Data Source Badge */}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>Source: SEMrush API (real-time keyword rankings)</span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  Keyword
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="position">Position</SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="volume">Volume</SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="difficulty">Difficulty</SortButton>
                </TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-right">Traffic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedKeywords.map((keyword) => (
                <TableRow key={keyword.keyword}>
                  {/* Keyword */}
                  <TableCell className="font-medium">
                    <div className="truncate max-w-[300px]" title={keyword.keyword}>
                      {keyword.keyword}
                    </div>
                  </TableCell>

                  {/* Position */}
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        keyword.position <= 3
                          ? 'default'
                          : keyword.position <= 10
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      #{keyword.position}
                    </Badge>
                  </TableCell>

                  {/* Volume */}
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-semibold text-sm cursor-help">
                          {formatVolume(keyword.searchVolume)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {keyword.searchVolume.toLocaleString()} monthly searches
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Difficulty */}
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 cursor-help">
                          <div className={`text-xs font-semibold ${getDifficultyColor(keyword.difficulty)}`}>
                            {getDifficultyLabel(keyword.difficulty)}
                          </div>
                          <Progress value={keyword.difficulty} className="h-1" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Difficulty: {keyword.difficulty}/100
                          <br />
                          Based on search volume and competition
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Trend */}
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center cursor-help">
                          {getTrendIcon(keyword.trend)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {keyword.trend === 'rising' && 'Rising - Good position for keyword difficulty'}
                          {keyword.trend === 'declining' && 'Declining - Poor position for keyword difficulty'}
                          {keyword.trend === 'stable' && 'Stable - Consistent performance'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Traffic */}
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm font-medium cursor-help">
                          {keyword.traffic > 0 ? keyword.traffic.toLocaleString() : '-'}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Estimated monthly organic traffic from this keyword
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
          <div className="p-2 border rounded-lg">
            <div className="text-muted-foreground">Avg. Position</div>
            <div className="text-lg font-bold">
              #
              {(
                sortedKeywords.reduce((sum, k) => sum + k.position, 0) /
                sortedKeywords.length
              ).toFixed(1)}
            </div>
          </div>
          <div className="p-2 border rounded-lg">
            <div className="text-muted-foreground">Total Volume</div>
            <div className="text-lg font-bold">
              {formatVolume(
                sortedKeywords.reduce((sum, k) => sum + k.searchVolume, 0)
              )}
              /mo
            </div>
          </div>
          <div className="p-2 border rounded-lg">
            <div className="text-muted-foreground">Est. Traffic</div>
            <div className="text-lg font-bold">
              {sortedKeywords
                .reduce((sum, k) => sum + k.traffic, 0)
                .toLocaleString()}
              /mo
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
