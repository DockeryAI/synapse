import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampaignTimeline, transformCampaignForTimeline } from '@/components/dashboard/intelligence-v2/CampaignTimeline';

describe('CampaignTimeline', () => {
  const mockCampaign = {
    pieces: [
      {
        id: '1',
        title: 'Introduce the problem',
        phase: 'awareness' as const,
        emotionalTone: 'empathy',
        emotionalIntensity: 3,
        expectedEngagement: 65,
        dayNumber: 1
      },
      {
        id: '2',
        title: 'Share customer story',
        phase: 'consideration' as const,
        emotionalTone: 'connection',
        emotionalIntensity: 5,
        expectedEngagement: 72,
        dayNumber: 2
      }
    ],
    emotionalProgression: [3, 5]
  };

  it('renders without crashing', () => {
    render(<CampaignTimeline campaign={{ pieces: [], emotionalProgression: [] }} />);
    // Loading state doesn't show title, just shows pulse animation
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays loading state when no pieces', () => {
    render(<CampaignTimeline campaign={{ pieces: [], emotionalProgression: [] }} />);
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays timeline with campaign pieces', () => {
    render(<CampaignTimeline campaign={mockCampaign} />);

    // Check for piece count
    expect(screen.getByText('2 pieces')).toBeInTheDocument();

    // Check for SVG element
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check for phase legend (using getAllByText since text appears in both SVG and legend)
    expect(screen.getAllByText('Awareness').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Consideration').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Decision').length).toBeGreaterThan(0);
  });

  it('transforms campaign generator output correctly', () => {
    const mockGeneratedCampaign = {
      pieces: [
        {
          id: 'p1',
          title: 'Test Piece',
          hook: 'Test Hook',
          purpose: 'awareness',
          eqScore: 60,
          day: 1
        }
      ]
    };

    const transformed = transformCampaignForTimeline(mockGeneratedCampaign);

    expect(transformed.pieces).toHaveLength(1);
    expect(transformed.pieces[0].title).toBe('Test Hook');
    expect(transformed.pieces[0].phase).toBe('awareness');
    expect(transformed.emotionalProgression).toHaveLength(1);
  });

  it('handles empty campaign data', () => {
    const transformed = transformCampaignForTimeline(null);

    expect(transformed.pieces).toHaveLength(0);
    expect(transformed.emotionalProgression).toHaveLength(0);
  });
});
