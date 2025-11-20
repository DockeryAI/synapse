/**
 * CalendarView Component
 * Full-featured calendar view with drag-and-drop, multiple views, and color-coding
 * Tasks 296-305
 */

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { ContentCalendarService } from '@/services/content-calendar.service';
import type { ContentItem, Platform, ContentStatus } from '@/types/content-calendar.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, List, Grid3x3, Clock } from 'lucide-react';

interface CalendarViewProps {
  brandId: string;
  onEventClick?: (contentItem: ContentItem) => void;
  onEventDrop?: (contentItem: ContentItem, newDate: string) => void;
}

/**
 * Platform color mapping (for color-coding)
 */
const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#E1306C', // Pink
  twitter: '#1DA1F2', // Blue
  linkedin: '#0A66C2', // Navy
  facebook: '#1877F2', // Dark blue
  tiktok: '#000000', // Black
  email: '#EA4335', // Red
  blog: '#34A853', // Green
};

/**
 * Status color mapping
 */
const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: '#6B7280', // Gray
  scheduled: '#F59E0B', // Orange
  published: '#10B981', // Green
  failed: '#EF4444', // Red
};

export function CalendarView({ brandId, onEventClick, onEventDrop }: CalendarViewProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  /**
   * Load content items
   */
  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      // Load all content items (no date filter to show drafts too)
      const items = await ContentCalendarService.getContentItems(brandId);
      setContentItems(items);

      // Convert to FullCalendar events
      const calendarEvents: EventInput[] = items
        .filter((item) => item.scheduled_time) // Only show scheduled items in calendar
        .map((item) => ({
          id: item.id,
          title: item.content_text.substring(0, 50) + '...',
          start: item.scheduled_time,
          backgroundColor: PLATFORM_COLORS[item.platform] || '#6B7280',
          borderColor: STATUS_COLORS[item.status] || '#6B7280',
          extendedProps: {
            contentItem: item,
          },
        }));

      console.log(`[CalendarView] Loaded ${items.length} items, ${calendarEvents.length} scheduled for calendar`);

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  /**
   * Load content on mount and when brand changes
   */
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  /**
   * Handle event click
   */
  const handleEventClick = (clickInfo: EventClickArg) => {
    const contentItem = clickInfo.event.extendedProps.contentItem as ContentItem;
    if (onEventClick) {
      onEventClick(contentItem);
    }
  };

  /**
   * Handle event drop (drag-and-drop rescheduling)
   */
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const contentItem = dropInfo.event.extendedProps.contentItem as ContentItem;
    const newDate = dropInfo.event.start?.toISOString();

    if (!newDate) {
      dropInfo.revert();
      return;
    }

    try {
      // Update the content item's scheduled time
      await ContentCalendarService.scheduleContent(contentItem.id, newDate);

      // Notify parent
      if (onEventDrop) {
        onEventDrop(contentItem, newDate);
      }

      // Reload content
      await loadContent();
    } catch (error: any) {
      console.error('Failed to reschedule content:', error);
      alert(`Failed to reschedule: ${error.message}`);
      dropInfo.revert();
    }
  };

  /**
   * Handle date range change
   */
  const handleDatesSet = (arg: any) => {
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  };

  /**
   * Change calendar view
   */
  const changeView = (newView: 'month' | 'week' | 'day' | 'list') => {
    console.log(`[CalendarView] Changing view to: ${newView}`);
    setView(newView);
  };

  /**
   * Get FullCalendar view name
   */
  const getFullCalendarView = () => {
    switch (view) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      case 'list':
        return 'listWeek';
      default:
        return 'dayGridMonth';
    }
  };

  /**
   * Event content renderer (for tooltips and previews)
   */
  const renderEventContent = (eventInfo: any) => {
    const contentItem = eventInfo.event.extendedProps.contentItem as ContentItem;

    return (
      <div
        className="px-1 py-0.5 text-xs overflow-hidden"
        title={`${contentItem.platform.toUpperCase()} - ${contentItem.status}\n\n${contentItem.content_text}`}
      >
        <div className="flex items-center gap-1">
          <span className="font-semibold truncate">{getPlatformIcon(contentItem.platform)}</span>
          <span className="truncate">{eventInfo.event.title}</span>
        </div>
      </div>
    );
  };

  /**
   * Get platform icon
   */
  const getPlatformIcon = (platform: Platform): string => {
    const icons: Record<Platform, string> = {
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      facebook: '👥',
      tiktok: '🎵',
      email: '📧',
      blog: '📝',
    };
    return icons[platform] || '📱';
  };

  return (
    <Card className="p-6">
      {/* View Controls */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Calendar</h2>

        <div className="flex gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('month')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('week')}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('day')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Day
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeView('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Platforms:</span>
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="capitalize">{platform}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Status:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2" style={{ borderColor: color }} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="calendar-container" key={`calendar-${view}`}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={getFullCalendarView()}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={events}
            editable={true}
            droppable={true}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height="auto"
            dayMaxEvents={3}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short',
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short',
            }}
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '09:00',
              endTime: '18:00',
            }}
          />
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-xs text-muted-foreground">
        <span className="font-semibold">Shortcuts:</span> Drag to reschedule • Click for details
        • Hover for preview
      </div>

      {/* Custom styles for FullCalendar */}
      <style>{`
        .fc {
          font-family: inherit;
        }
        .fc-event {
          cursor: pointer;
          transition: all 0.2s;
          border-width: 2px;
        }
        .fc-event:hover {
          opacity: 0.8;
          transform: scale(1.02);
        }
        .fc-daygrid-event {
          margin: 1px;
        }
        .fc-list-event:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .fc .fc-button {
          background-color: #7c3aed;
          border-color: #7c3aed;
        }
        .fc .fc-button:hover {
          background-color: #6d28d9;
        }
        .fc .fc-button:disabled {
          opacity: 0.5;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: #e5e7eb;
        }
        /* Fix visibility of calendar cells */
        .fc-daygrid-day {
          background-color: white;
          min-height: 80px;
        }
        .fc-daygrid-day-frame {
          padding: 4px;
        }
        .fc-col-header-cell {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .fc-day-today {
          background-color: #fef3c7 !important;
        }
        .fc-daygrid-day-number {
          color: #374151;
          font-weight: 500;
        }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .fc-daygrid-day {
            background-color: #1f2937;
          }
          .fc-col-header-cell {
            background-color: #111827;
          }
          .fc-day-today {
            background-color: #312e81 !important;
          }
          .fc-daygrid-day-number {
            color: #e5e7eb;
          }
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #374151;
          }
        }
      `}</style>
    </Card>
  );
}
