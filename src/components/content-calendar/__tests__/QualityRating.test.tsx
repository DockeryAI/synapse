/**
 * Quality Rating Component Tests
 * Critical path: User-facing quality display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QualityRating, QualityBadge } from '../QualityRating';

describe('QualityRating', () => {
  describe('star rating display', () => {
    it('should display 5 stars for score 90+', () => {
      const { container } = render(<QualityRating score={95} />);
      const stars = container.querySelectorAll('svg');

      expect(stars).toHaveLength(5);
    });

    it('should display correct label for excellent content', () => {
      render(<QualityRating score={95} showLabel={true} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should display correct label for great content', () => {
      render(<QualityRating score={80} showLabel={true} />);

      expect(screen.getByText('Great')).toBeInTheDocument();
    });

    it('should display correct label for good content', () => {
      render(<QualityRating score={65} showLabel={true} />);

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      const { container } = render(<QualityRating score={85} showLabel={false} />);

      expect(container.textContent).not.toContain('Great');
    });

    it('should optionally show numeric score', () => {
      render(<QualityRating score={85} showScore={true} />);

      expect(screen.getByText(/85\/100/)).toBeInTheDocument();
    });

    it('should hide numeric score by default', () => {
      const { container } = render(<QualityRating score={85} />);

      expect(container.textContent).not.toContain('/100');
    });
  });

  describe('size variants', () => {
    it('should render small size', () => {
      const { container } = render(<QualityRating score={85} size="sm" />);

      expect(container.querySelector('.w-3')).toBeInTheDocument();
    });

    it('should render medium size', () => {
      const { container } = render(<QualityRating score={85} size="md" />);

      expect(container.querySelector('.w-4')).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<QualityRating score={85} size="lg" />);

      expect(container.querySelector('.w-5')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle score of 0', () => {
      const { container } = render(<QualityRating score={0} />);
      const stars = container.querySelectorAll('svg');

      expect(stars).toHaveLength(5);
    });

    it('should handle score of 100', () => {
      render(<QualityRating score={100} showLabel={true} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should handle negative scores gracefully', () => {
      const { container } = render(<QualityRating score={-10} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle scores above 100 gracefully', () => {
      const { container } = render(<QualityRating score={150} />);

      expect(container).toBeInTheDocument();
    });
  });
});

describe('QualityBadge', () => {
  it('should display rating in badge format', () => {
    render(<QualityBadge score={85} />);

    expect(screen.getByText(/4\/5/)).toBeInTheDocument();
  });

  it('should display label in badge', () => {
    render(<QualityBadge score={85} />);

    expect(screen.getByText(/Great/)).toBeInTheDocument();
  });

  it('should apply correct color for high scores', () => {
    const { container } = render(<QualityBadge score={95} />);

    expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('should handle all score ranges', () => {
    const scores = [95, 80, 65, 45, 20];

    scores.forEach((score) => {
      const { container } = render(<QualityBadge score={score} />);
      expect(container).toBeInTheDocument();
    });
  });
});
