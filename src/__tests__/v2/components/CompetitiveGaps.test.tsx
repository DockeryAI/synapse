/**
 * CompetitiveGaps Component Tests
 *
 * Tests for the competitive gaps visualization component
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompetitiveGaps } from '@/components/dashboard/intelligence-v2/CompetitiveGaps';
import type { CompetitiveAnalysisResult } from '@/services/intelligence/competitive-analyzer.service';

const mockAnalysis: CompetitiveAnalysisResult = {
  competitors: [
    {
      url: 'https://competitor1.com',
      name: 'competitor1',
      scrapedAt: new Date(),
      pages: [],
      messagingThemes: [
        {
          theme: 'quality service',
          frequency: 5,
          examples: ['We provide quality service'],
          confidence: 0.8,
          emotionalTone: 'trust'
        }
      ],
      contentTopics: ['Service Quality', 'Customer Support'],
      positioning: 'Premium service provider',
      keyMessages: ['Quality first', 'Customer satisfaction']
    }
  ],
  whiteSpaces: [
    {
      gap: 'Sustainability focus',
      description: 'Competitors are not addressing sustainability',
      opportunity: 'Position as eco-friendly alternative',
      urgency: 'high',
      difficulty: 'medium',
      potentialImpact: 85
    },
    {
      gap: 'Local community engagement',
      description: 'Missing community connection',
      opportunity: 'Build local partnerships',
      urgency: 'medium',
      difficulty: 'easy',
      potentialImpact: 70
    }
  ],
  differentiationStrategies: [
    {
      strategy: 'Lead with sustainability',
      rationale: 'No competitors focus on eco-friendly practices',
      implementation: [
        'Highlight eco-friendly materials',
        'Showcase carbon-neutral delivery',
        'Feature recycling program'
      ],
      expectedOutcome: 'Attract environmentally conscious customers',
      competitorsDoingThis: [],
      competitorsNotDoingThis: ['competitor1']
    }
  ],
  themeComparison: {
    'quality service': { yours: 3, theirs: 5 },
    'sustainability': { yours: 8, theirs: 0 },
    'convenience': { yours: 4, theirs: 4 }
  },
  analysisDate: new Date('2025-11-23'),
  confidence: 0.85
};

describe('CompetitiveGaps', () => {
  it('renders without crashing', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Competitive Gaps & Opportunities/i)).toBeInTheDocument();
  });

  it('displays competitor count', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Based on analysis of 1 competitors/i)).toBeInTheDocument();
  });

  it('displays white spaces section', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Market White Spaces/i)).toBeInTheDocument();
  });

  it('renders white space cards', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText('Sustainability focus')).toBeInTheDocument();
    expect(screen.getByText('Local community engagement')).toBeInTheDocument();
  });

  it('shows urgency badges', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/high urgency/i)).toBeInTheDocument();
    expect(screen.getByText(/medium urgency/i)).toBeInTheDocument();
  });

  it('displays opportunity descriptions', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Position as eco-friendly alternative/i)).toBeInTheDocument();
  });

  it('shows potential impact percentages', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Impact: 85%/i)).toBeInTheDocument();
    expect(screen.getByText(/Impact: 70%/i)).toBeInTheDocument();
  });

  it('displays differentiation strategies', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Differentiation Strategies/i)).toBeInTheDocument();
    expect(screen.getByText('Lead with sustainability')).toBeInTheDocument();
  });

  it('expands strategy details on click', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);

    const strategyCard = screen.getByText('Lead with sustainability').closest('div');

    // Initially, implementation steps should not be visible
    expect(screen.queryByText('Highlight eco-friendly materials')).not.toBeInTheDocument();

    // Click to expand
    if (strategyCard) {
      fireEvent.click(strategyCard);
    }

    // Now implementation steps should be visible
    expect(screen.getByText('Highlight eco-friendly materials')).toBeInTheDocument();
    expect(screen.getByText('Showcase carbon-neutral delivery')).toBeInTheDocument();
  });

  it('shows expected outcomes when expanded', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);

    const strategyCard = screen.getByText('Lead with sustainability').closest('div');

    if (strategyCard) {
      fireEvent.click(strategyCard);
    }

    expect(screen.getByText('Attract environmentally conscious customers')).toBeInTheDocument();
  });

  it('displays theme comparison section', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Messaging Theme Comparison/i)).toBeInTheDocument();
  });

  it('shows theme counts', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText('quality service')).toBeInTheDocument();
    expect(screen.getByText(/You: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Them: 5/i)).toBeInTheDocument();
  });

  it('displays analysis metadata', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);
    expect(screen.getByText(/Confidence: 85%/i)).toBeInTheDocument();
  });

  it('handles empty white spaces', () => {
    const emptyAnalysis = {
      ...mockAnalysis,
      whiteSpaces: []
    };

    render(<CompetitiveGaps analysis={emptyAnalysis} />);
    expect(screen.queryByText(/Market White Spaces/i)).not.toBeInTheDocument();
  });

  it('handles empty differentiation strategies', () => {
    const emptyAnalysis = {
      ...mockAnalysis,
      differentiationStrategies: []
    };

    render(<CompetitiveGaps analysis={emptyAnalysis} />);
    expect(screen.queryByText(/Differentiation Strategies/i)).not.toBeInTheDocument();
  });

  it('handles empty theme comparison', () => {
    const emptyAnalysis = {
      ...mockAnalysis,
      themeComparison: {}
    };

    render(<CompetitiveGaps analysis={emptyAnalysis} />);
    expect(screen.queryByText(/Messaging Theme Comparison/i)).not.toBeInTheDocument();
  });

  it('applies correct urgency color classes', () => {
    const { container } = render(<CompetitiveGaps analysis={mockAnalysis} />);

    const highUrgencyBadge = screen.getByText(/high urgency/i);
    expect(highUrgencyBadge.className).toContain('border-red');

    const mediumUrgencyBadge = screen.getByText(/medium urgency/i);
    expect(mediumUrgencyBadge.className).toContain('border-orange');
  });

  it('toggles strategy expansion on multiple clicks', () => {
    render(<CompetitiveGaps analysis={mockAnalysis} />);

    const strategyCard = screen.getByText('Lead with sustainability').closest('div');

    // First click - expand
    if (strategyCard) {
      fireEvent.click(strategyCard);
    }
    expect(screen.getByText('Highlight eco-friendly materials')).toBeInTheDocument();

    // Second click - collapse
    if (strategyCard) {
      fireEvent.click(strategyCard);
    }
    expect(screen.queryByText('Highlight eco-friendly materials')).not.toBeInTheDocument();
  });
});
