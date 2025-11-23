import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceDashboard, transformPerformancePredictions } from '@/components/dashboard/intelligence-v2/PerformanceDashboard';

describe('PerformanceDashboard', () => {
  const mockPredictions = [
    {
      metric: 'Engagement',
      predicted: 1.8,
      industryAverage: 1.3,
      confidenceMin: 1.4,
      confidenceMax: 2.2,
      unit: '%'
    },
    {
      metric: 'Conversion',
      predicted: 2.2,
      industryAverage: 1.5,
      confidenceMin: 1.8,
      confidenceMax: 2.6,
      unit: '%'
    }
  ];

  it('renders without crashing', () => {
    render(<PerformanceDashboard predictions={[]} />);
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays dashboard with predictions', () => {
    render(<PerformanceDashboard predictions={mockPredictions} />);

    expect(screen.getByText('Performance Predictions')).toBeInTheDocument();
    expect(screen.getByText('Your Performance vs Industry Average')).toBeInTheDocument();
  });

  it('displays metric cards', () => {
    render(<PerformanceDashboard predictions={mockPredictions} />);

    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Conversion')).toBeInTheDocument();
  });

  it('displays ROI estimate when provided', () => {
    const roiEstimate = {
      investment: 1000,
      predictedReturn: 3.5,
      timeframe: '90 days'
    };

    render(
      <PerformanceDashboard
        predictions={mockPredictions}
        roiEstimate={roiEstimate}
      />
    );

    expect(screen.getByText('ROI Projection')).toBeInTheDocument();
    expect(screen.getByText('3.5x')).toBeInTheDocument();
    expect(screen.getByText('90 days')).toBeInTheDocument();
  });

  it('transforms performance predictor output correctly', () => {
    const mockPredictorOutput = {
      prediction: {
        expectedEngagement: 1.8,
        expectedConversion: 2.2,
        expectedCTR: 3.5,
        expectedROI: 4.2
      },
      benchmark: {
        avgEngagement: 1.3,
        avgConversion: 1.5,
        avgCTR: 2.2,
        avgROI: 3.0
      }
    };

    const transformed = transformPerformancePredictions(mockPredictorOutput);

    expect(transformed).toHaveLength(4);
    expect(transformed[0].metric).toBe('Engagement');
    expect(transformed[0].predicted).toBe(1.8);
    expect(transformed[0].industryAverage).toBe(1.3);
  });

  it('handles empty predictor output', () => {
    const transformed = transformPerformancePredictions(null);

    // Should return empty array for null input
    expect(transformed).toHaveLength(0);
  });
});
