import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar, Grid, List } from 'lucide-react'

type ViewMode = 'calendar' | 'list' | 'grid'
type FilterOption = { label: string; value: string }

interface CalendarLayoutProps {
  children: React.ReactNode
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  filters?: {
    platforms?: FilterOption[]
    status?: FilterOption[]
    pillar?: FilterOption[]
  }
  selectedFilters?: {
    platform?: string
    status?: string
    pillar?: string
  }
  onFilterChange?: (filter: string, value: string) => void
  actions?: React.ReactNode
  className?: string
}

export const CalendarLayout: React.FC<CalendarLayoutProps> = ({
  children,
  viewMode = 'calendar',
  onViewModeChange,
  filters,
  selectedFilters,
  onFilterChange,
  actions,
  className,
}) => {
  return (
    <div className="space-y-4">
      {/* Header with Filters and View Mode */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filters?.platforms && filters.platforms.length > 0 && (
            <Select
              value={selectedFilters?.platform}
              onValueChange={(value) => onFilterChange?.('platform', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {filters.platforms.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters?.status && filters.status.length > 0 && (
            <Select
              value={selectedFilters?.status}
              onValueChange={(value) => onFilterChange?.('status', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filters.status.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters?.pillar && filters.pillar.length > 0 && (
            <Select
              value={selectedFilters?.pillar}
              onValueChange={(value) => onFilterChange?.('pillar', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Pillars" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {filters.pillar.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Mode and Actions */}
        <div className="flex items-center gap-2">
          {actions}

          {onViewModeChange && (
            <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4" />
                  <span className="sr-only">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4" />
                  <span className="sr-only">List</span>
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <Grid className="h-4 w-4" />
                  <span className="sr-only">Grid</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={cn('min-h-[600px]', className)}>{children}</div>
    </div>
  )
}

// Calendar Grid Component
interface CalendarGridProps {
  children: React.ReactNode
  className?: string
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

// Calendar List Component
interface CalendarListProps {
  children: React.ReactNode
  className?: string
}

export const CalendarList: React.FC<CalendarListProps> = ({
  children,
  className,
}) => {
  return <div className={cn('space-y-2', className)}>{children}</div>
}
