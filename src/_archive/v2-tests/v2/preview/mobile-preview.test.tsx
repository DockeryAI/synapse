/**
 * MobilePreview Component Tests
 * Total: 10 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobilePreview } from '../../../components/v2/preview/MobilePreview';

describe('MobilePreview', () => {
  const sampleContent = 'Mobile preview content #test';

  it('should render with default iPhone 14 device', () => {
    const { container } = render(<MobilePreview content={sampleContent} platform="instagram" />);

    expect(screen.getAllByText(/mobile.*preview/i)[0]).toBeInTheDocument();
    // Check for device spec
    const deviceInfo = container.querySelector('.text-gray-900');
    expect(deviceInfo?.textContent).toContain('iPhone 14');
  });

  it('should allow device selection', () => {
    const { container } = render(<MobilePreview content={sampleContent} platform="instagram" />);

    const deviceSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(deviceSelect, { target: { value: 'galaxys23' } });

    // Check that device info updated
    const deviceInfo = container.querySelector('.text-gray-900');
    expect(deviceInfo?.textContent).toContain('Galaxy S23');
  });

  it('should toggle orientation on button click', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    expect(screen.getByText(/portrait/i)).toBeInTheDocument();

    const orientationButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('title') === 'Toggle orientation'
    );

    if (orientationButton) {
      fireEvent.click(orientationButton);
      expect(screen.getByText(/landscape/i)).toBeInTheDocument();
    }
  });

  it('should display device screen dimensions', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    // iPhone 14 dimensions
    expect(screen.getByText(/390.*844/)).toBeInTheDocument();
  });

  it('should show safe area when toggled', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    const safeAreaButton = screen.getByText('Safe Area');
    expect(safeAreaButton).not.toHaveClass('bg-blue-500');

    fireEvent.click(safeAreaButton);
    expect(safeAreaButton).toHaveClass('bg-blue-500');
  });

  it('should render device frame with proper styling', () => {
    const { container } = render(<MobilePreview content={sampleContent} platform="instagram" />);

    const deviceFrame = container.querySelector('.bg-black.rounded-\\[2\\.5rem\\]');
    expect(deviceFrame).toBeInTheDocument();
  });

  it('should display status bar', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    expect(screen.getByText('9:41')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should show pixel ratio in device specs', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    expect(screen.getByText(/Pixel Ratio:/)).toBeInTheDocument();
    expect(screen.getByText(/3x/)).toBeInTheDocument();
  });

  it('should display safe area insets', () => {
    render(<MobilePreview content={sampleContent} platform="instagram" />);

    expect(screen.getByText(/Safe Top:/)).toBeInTheDocument();
    expect(screen.getByText(/47px/)).toBeInTheDocument();
    expect(screen.getByText(/Safe Bottom:/)).toBeInTheDocument();
    expect(screen.getByText(/34px/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MobilePreview content={sampleContent} platform="instagram" className="custom-mobile" />
    );

    expect(container.querySelector('.mobile-preview')).toHaveClass('custom-mobile');
  });
});
