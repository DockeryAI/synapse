/**
 * Campaign Calendar View Component
 *
 * Week 4 - Campaign Calendar V3
 * 5-14 day campaign calendar with platform orchestration
 */

import React, { useState } from 'react';
import { PlatformV3 } from '../../../types/campaign-v3.types';

interface CalendarPost {
  id: string;
  day: number;
  date: Date;
  platforms: PlatformV3[];
  title: string;
  content: string;
  imageUrl?: string;
  scheduledTime: string;
  storyArcPhase: 'hook' | 'build' | 'peak' | 'close';
  status: 'draft' | 'approved' | 'scheduled' | 'published';
}

interface CampaignCalendarViewProps {
  campaignName: string;
  duration: number; // 5-14 days
  posts: CalendarPost[];
  onEditPost?: (postId: string) => void;
  onApprovePost?: (postId: string) => void;
  onScheduleAll?: () => void;
}

const PHASE_COLORS = {
  hook: '#3B82F6', // blue
  build: '#10B981', // green
  peak: '#F59E0B', // orange
  close: '#8B5CF6'  // purple
};

const PHASE_LABELS = {
  hook: 'Hook Phase',
  build: 'Build Phase',
  peak: 'Peak Phase',
  close: 'Close Phase'
};

const PLATFORM_ICONS: Record<PlatformV3, string> = {
  facebook: '📘',
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎵',
  'youtube-shorts': '📹',
  'google-business': '📍'
};

export const CampaignCalendarView: React.FC<CampaignCalendarViewProps> = ({
  campaignName,
  duration,
  posts,
  onEditPost,
  onApprovePost,
  onScheduleAll
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const groupedByDay = posts.reduce((acc, post) => {
    if (!acc[post.day]) {
      acc[post.day] = [];
    }
    acc[post.day].push(post);
    return acc;
  }, {} as Record<number, CalendarPost[]>);

  const allApproved = posts.every(p => p.status === 'approved' || p.status === 'scheduled');
  const approvedCount = posts.filter(p => p.status === 'approved' || p.status === 'scheduled').length;
  const hasDay3Checkpoint = duration >= 3;

  return (
    <div className="campaign-calendar">
      <div className="campaign-calendar__header">
        <h2>{campaignName}</h2>
        <div className="campaign-calendar__meta">
          <span className="meta__item">{duration} days</span>
          <span className="meta__item">{posts.length} posts</span>
          <span className="meta__item">
            {approvedCount}/{posts.length} approved
          </span>
        </div>
      </div>

      <div className="campaign-calendar__legend">
        <h4>Story Arc Phases:</h4>
        <div className="legend__items">
          {Object.entries(PHASE_LABELS).map(([phase, label]) => (
            <div key={phase} className="legend__item">
              <span
                className="legend__color"
                style={{ backgroundColor: PHASE_COLORS[phase as keyof typeof PHASE_COLORS] }}
              />
              <span className="legend__label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="campaign-calendar__timeline">
        {Array.from({ length: duration }, (_, i) => i + 1).map((day) => {
          const dayPosts = groupedByDay[day] || [];
          const isSelected = selectedDay === day;
          const hasDay3Checkpoint = day === 3;

          return (
            <div
              key={day}
              className={`calendar-day ${isSelected ? 'calendar-day--selected' : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : day)}
            >
              <div className="calendar-day__header">
                <h3>Day {day}</h3>
                {hasDay3Checkpoint && (
                  <span className="badge badge--warning">Day 3 Checkpoint</span>
                )}
              </div>

              <div className="calendar-day__posts">
                {dayPosts.length === 0 ? (
                  <div className="calendar-day__empty">No posts scheduled</div>
                ) : (
                  dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className="post-card"
                      style={{ borderLeftColor: PHASE_COLORS[post.storyArcPhase] }}
                    >
                      <div className="post-card__header">
                        <div className="post-card__platforms">
                          {post.platforms.map(platform => (
                            <span key={platform} className="platform-icon" title={platform}>
                              {PLATFORM_ICONS[platform]}
                            </span>
                          ))}
                        </div>
                        <span className="post-card__time">{post.scheduledTime}</span>
                      </div>

                      <h4 className="post-card__title">{post.title}</h4>
                      <p className="post-card__preview">
                        {post.content.substring(0, 100)}...
                      </p>

                      <div className="post-card__footer">
                        <span className={`badge badge--${post.status}`}>
                          {post.status}
                        </span>
                        <div className="post-card__actions">
                          {onEditPost && (
                            <button
                              className="btn btn--sm btn--ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPost(post.id);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {onApprovePost && post.status === 'draft' && (
                            <button
                              className="btn btn--sm btn--primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApprovePost(post.id);
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasDay3Checkpoint && (
        <div className="campaign-calendar__info">
          <div className="info-box info-box--warning">
            <h4>Day 3 Checkpoint</h4>
            <p>
              We'll check campaign performance on Day 3. If engagement is below 2%,
              we'll suggest pivots: change hook, try video, adjust timing.
            </p>
          </div>
        </div>
      )}

      <div className="campaign-calendar__actions">
        <button
          className="btn btn--large btn--primary"
          disabled={!allApproved}
          onClick={onScheduleAll}
        >
          {allApproved ? 'Schedule Campaign to SocialPilot' : `Approve All Posts First (${approvedCount}/${posts.length})`}
        </button>
      </div>
    </div>
  );
};

export default CampaignCalendarView;
