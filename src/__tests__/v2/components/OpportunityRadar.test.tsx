import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpportunityRadar } from '@/components/dashboard/intelligence-v2/OpportunityRadar';
import type { Breakthrough } from '@/services/intelligence/breakthrough-generator.service';

describe('OpportunityRadar', () => {
  const mockBreakthrough: Breakthrough = {
    id: 'test-1',
    title: 'Test Breakthrough',
    description: 'Test description',
    score: 85,
    category: 'urgent',
    clusters: [],
    connections: [],
    dataPoints: [],
    validation: {
      clusterCount: 2,
      totalDataPoints: 10,
      sourceTypes: ['youtube', 'google'],
      validationStatement: 'Validated by 10 data points'
    },
    timing: {
      relevance: 0.9,
      urgency: true,
      seasonal: false
    },
    competitiveAdvantage: {
      hasGap: true,
      gapDescription: 'Competitor gap identified'
    },
    emotionalResonance: {
      eqScore: 75,
      dominantEmotion: 'excitement',
      triggers: ['urgent', 'opportunity']
    },
    suggestedAngles: ['Angle 1', 'Angle 2'],
    provenance: 'Based on: youtube + google'
  };

  it('renders without crashing', () => {
    render(<OpportunityRadar breakthroughs={[]} />);
    // Loading state doesn't show title, just shows pulse animation
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays loading state when no breakthroughs', () => {
    render(<OpportunityRadar breakthroughs={[]} />);
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays radar with breakthroughs', () => {
    render(<OpportunityRadar breakthroughs={[mockBreakthrough]} />);

    // Check for title
    expect(screen.getByText('Opportunity Radar')).toBeInTheDocument();

    // Check for SVG element
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check for legend (using getAllByText since text appears in both SVG and legend)
    expect(screen.getAllByText('Urgent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('High-Value').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Evergreen').length).toBeGreaterThan(0);
  });

  it('displays info text', () => {
    render(<OpportunityRadar breakthroughs={[mockBreakthrough]} />);
    expect(screen.getByText('Opportunity Radar')).toBeInTheDocument();
    expect(screen.getByText('Click blips for details')).toBeInTheDocument();
  });
});
