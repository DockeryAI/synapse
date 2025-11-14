/**
 * Suggestion Panel Component
 *
 * Displays AI-generated and industry-based suggestions that users can drag
 * into their UVP wizard fields. Includes filtering, search, and generation controls.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw, Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DraggableItem } from './DraggableItem'
import { DraggableSuggestion, SuggestionType, SuggestionSource } from '@/types/uvp-wizard'

/**
 * SuggestionPanel component props
 */
interface SuggestionPanelProps {
  suggestions: DraggableSuggestion[]
  type: SuggestionType
  onSelect: (suggestion: DraggableSuggestion) => void
  onCustomize?: (suggestion: DraggableSuggestion) => void
  onGenerate: () => void
  isLoading?: boolean
  disabled?: boolean
  title?: string
  description?: string
  className?: string
}

/**
 * SuggestionPanel Component
 */
export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestions,
  type,
  onSelect,
  onCustomize,
  onGenerate,
  isLoading = false,
  disabled = false,
  title = 'Suggestions',
  description = 'Drag suggestions to your answer or click to select',
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sourceFilter, setSourceFilter] = React.useState<SuggestionSource | 'all'>('all')
  const [sortBy, setSortBy] = React.useState<'confidence' | 'recent'>('confidence')

  // Filter and sort suggestions
  const filteredSuggestions = React.useMemo(() => {
    console.log('[SuggestionPanel] Filtering:', {
      type,
      suggestions: suggestions.length,
      matchingType: suggestions.filter(s => s.type === type).length
    })
    let filtered = suggestions.filter((s) => s.type === type)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((s) => s.source === sourceFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'confidence') {
        return (b.confidence || 0) - (a.confidence || 0)
      }
      return 0 // 'recent' - already in order
    })

    return filtered
  }, [suggestions, type, searchQuery, sourceFilter, sortBy])

  // Get unique sources
  const availableSources = React.useMemo(() => {
    const sources = new Set(suggestions.map((s) => s.source))
    return Array.from(sources)
  }, [suggestions])

  return (
    <div className={cn('flex flex-col h-full bg-muted/20 rounded-lg border', className)}>
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerate}
            disabled={isLoading || disabled}
            className="ml-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suggestions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
              disabled={disabled}
            />
          </div>

          {availableSources.length > 1 && (
            <Select
              value={sourceFilter}
              onValueChange={(value) => setSourceFilter(value as SuggestionSource | 'all')}
              disabled={disabled}
            >
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {availableSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {formatSourceName(source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as 'confidence' | 'recent')}
            disabled={disabled}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confidence">Best Match</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">
              Generating AI-powered suggestions...
            </p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">No suggestions yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Click "Generate" to get AI-powered suggestions'}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={onGenerate} disabled={isLoading || disabled}>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate Suggestions
              </Button>
            )}
          </div>
        ) : (
          <>
            {filteredSuggestions.map((suggestion) => (
              <DraggableItem
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={onSelect}
                onCustomize={onCustomize}
                disabled={disabled}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {filteredSuggestions.length > 0 && (
        <div className="p-3 border-t bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredSuggestions.length}{' '}
              {filteredSuggestions.length === 1 ? 'suggestion' : 'suggestions'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={isLoading || disabled}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact Suggestion Panel (sidebar variant)
 */
interface CompactSuggestionPanelProps {
  suggestions: DraggableSuggestion[]
  type: SuggestionType
  onSelect: (suggestion: DraggableSuggestion) => void
  onGenerate: () => void
  isLoading?: boolean
  className?: string
}

export const CompactSuggestionPanel: React.FC<CompactSuggestionPanelProps> = ({
  suggestions,
  type,
  onSelect,
  onGenerate,
  isLoading = false,
  className,
}) => {
  const typeSuggestions = suggestions.filter((s) => s.type === type)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Suggestions</span>
          <Badge variant="secondary" className="text-xs">
            {typeSuggestions.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onGenerate}
          disabled={isLoading}
          className="h-7 px-2"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {typeSuggestions.slice(0, 3).map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className="w-full text-left p-3 bg-card border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all text-sm"
          >
            {suggestion.content}
          </button>
        ))}
        {typeSuggestions.length === 0 && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            className="w-full border-dashed"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Generate Suggestions
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Format source name for display
 */
function formatSourceName(source: SuggestionSource): string {
  switch (source) {
    case 'ai-generated':
      return 'AI Generated'
    case 'industry-profile':
      return 'Industry Data'
    case 'competitor-analysis':
      return 'Competitors'
    case 'user-custom':
      return 'Custom'
    default:
      return source
  }
}
