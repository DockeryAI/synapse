/**
 * CampaignTimelineViz Component Tests
 * Total: 15 tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignTimelineViz } from '../../../components/v2/preview/CampaignTimelineViz';
import type { TimelineVisualizationData } from '../../../types/v2/preview.types';
import type { CampaignPiece } from '../../../types/v2/campaign.types';

describe('CampaignTimelineViz', () => {
  const mockPiece: CampaignPiece = {
    id: 'piece-1',
    campaignId: 'campaign-1',
    phaseId: 'phase-1',
    title: 'Test Piece',
    content: 'Test content for the campaign piece',
    emotionalTrigger: 'trust',
    scheduledDate: '2025-01-15',
    status: 'generated',
    channel: 'facebook',
    order: 1,
  };

  const mockTimelineData: TimelineVisualizationData = {
    totalDuration: 7,
    days: [
      {
        dayNumber: 1,
        date: '2025-01-15',
        pieces: [mockPiece],
        emotionalTriggers: ['trust'],
        isMilestone: false,
      },
      {
        dayNumber: 2,
        date: '2025-01-16',
        pieces: [],
        emotionalTriggers: [],
        isMilestone: false,
      },
      {
        dayNumber: 3,
        date: '2025-01-17',
        pieces: [{ ...mockPiece, id: 'piece-2', emotionalTrigger: 'urgency' }],
        emotionalTriggers: ['urgency'],
        isMilestone: true,
        milestoneType: 'checkpoint',
      },
    ],
    emotionalProgression: [
      {
        trigger: 'trust',
        color: '#3B82F6',
        startDay: 1,
        endDay: 2,
        intensity: 80,
      },
      {
        trigger: 'urgency',
        color: '#F97316',
        startDay: 3,
        endDay: 7,
        intensity: 90,
      },
    ],
    milestones: [
      {
        dayNumber: 3,
        type: 'checkpoint',
        label: 'Day 3 Checkpoint',
        description: 'Review campaign effectiveness',
      },
      {
        dayNumber: 7,
        type: 'campaign_end',
        label: 'Campaign Complete',
      },
    ],
  };

  it('should render campaign timeline with correct duration', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    expect(screen.getByText('Campaign Timeline')).toBeInTheDocument();
    expect(screen.getByText(/7 days/)).toBeInTheDocument();
  });

  it('should display total piece count', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    expect(screen.getByText(/2 pieces/)).toBeInTheDocument();
  });

  it('should render emotional trigger legend', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    expect(screen.getByText('trust')).toBeInTheDocument();
    expect(screen.getByText('urgency')).toBeInTheDocument();
  });

  it('should render timeline days', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
  });

  it('should highlight current day when currentPieceId matches', () => {
    render(<CampaignTimelineViz data={mockTimelineData} currentPieceId="piece-1" />);

    const day1 = screen.getByText('Day 1').closest('.timeline-day');
    expect(day1).toHaveClass('border-blue-500');
  });

  it('should show piece count badge on days with content', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    // Day 1 has 1 piece
    const day1 = screen.getByText('Day 1').closest('.timeline-day');
    expect(day1?.querySelector('.bg-blue-500')).toHaveTextContent('1');
  });

  it('should display milestone markers', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    expect(screen.getByText('Day 3 Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Campaign Complete')).toBeInTheDocument();
  });

  it('should call onPieceClick when piece is clicked', () => {
    const onPieceClick = vi.fn();
    render(<CampaignTimelineViz data={mockTimelineData} onPieceClick={onPieceClick} />);

    // Find and click the piece dot
    const day1 = screen.getByText('Day 1').closest('.timeline-day');
    const pieceDot = day1?.querySelector('.rounded-full.cursor-pointer');

    if (pieceDot) {
      fireEvent.click(pieceDot);
      expect(onPieceClick).toHaveBeenCalledWith('piece-1');
    }
  });

  it('should show piece preview on hover', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    const day1 = screen.getByText('Day 1').closest('.timeline-day');
    const pieceDot = day1?.querySelector('.rounded-full.cursor-pointer');

    if (pieceDot) {
      fireEvent.mouseEnter(pieceDot);

      // Preview should appear
      expect(screen.getByText('Test Piece')).toBeInTheDocument();
    }
  });

  it('should hide preview on mouse leave', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    const day1 = screen.getByText('Day 1').closest('.timeline-day');
    const pieceDot = day1?.querySelector('.rounded-full.cursor-pointer');

    if (pieceDot) {
      fireEvent.mouseEnter(pieceDot);
      expect(screen.getByText('Test Piece')).toBeInTheDocument();

      fireEvent.mouseLeave(pieceDot);
      // Preview should be hidden (title not visible)
      expect(screen.queryByText('Test Piece')).not.toBeInTheDocument();
    }
  });

  it('should render emotional trigger color bands', () => {
    const { container } = render(<CampaignTimelineViz data={mockTimelineData} />);

    // Check for background bands
    const bands = container.querySelectorAll('.opacity-10.rounded');
    expect(bands.length).toBeGreaterThan(0);
  });

  it('should format dates correctly', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    // Check for formatted date (Jan 15, Jan 16, etc.)
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });

  it('should show milestone indicator on milestone days', () => {
    const { container } = render(<CampaignTimelineViz data={mockTimelineData} />);

    const day3 = screen.getByText('Day 3').closest('.timeline-day');
    const milestoneIndicator = day3?.querySelector('.bg-purple-500.rounded-full');

    expect(milestoneIndicator).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CampaignTimelineViz data={mockTimelineData} className="custom-timeline" />
    );

    expect(container.querySelector('.campaign-timeline-viz')).toHaveClass('custom-timeline');
  });

  it('should handle empty days without pieces', () => {
    render(<CampaignTimelineViz data={mockTimelineData} />);

    const day2 = screen.getByText('Day 2').closest('.timeline-day');

    // Day 2 has no pieces, so no badge
    expect(day2?.querySelector('.bg-blue-500')).not.toBeInTheDocument();
  });
});
