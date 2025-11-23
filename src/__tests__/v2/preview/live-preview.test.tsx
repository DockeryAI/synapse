/**
 * LiveContentPreview Component Tests
 * Total: 20 tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveContentPreview } from '../../../components/v2/preview/LiveContentPreview';

describe('LiveContentPreview', () => {
  const sampleContent = 'Check out our amazing product! #marketing #socialmedia @customer https://example.com';

  it('should render platform preview with Facebook', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    expect(screen.getByText(/facebook.*preview/i)).toBeInTheDocument();
  });

  it('should render platform preview with Instagram', () => {
    render(<LiveContentPreview content={sampleContent} platform="instagram" />);

    expect(screen.getByText(/instagram.*preview/i)).toBeInTheDocument();
  });

  it('should render platform preview with LinkedIn', () => {
    render(<LiveContentPreview content={sampleContent} platform="linkedin" />);

    expect(screen.getByText(/linkedin.*preview/i)).toBeInTheDocument();
  });

  it('should render platform preview with Twitter', () => {
    render(<LiveContentPreview content={sampleContent} platform="twitter" />);

    expect(screen.getByText(/twitter.*preview/i)).toBeInTheDocument();
  });

  it('should extract and highlight hashtags', () => {
    const { container } = render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    // Check that hashtag exists and has proper styling
    const hashtag = container.querySelector('.text-blue-600.font-semibold');
    expect(hashtag).toBeInTheDocument();
    expect(hashtag?.textContent).toMatch(/#marketing|#socialmedia/);
  });

  it('should extract and highlight mentions', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    const contentArea = screen.getByText(/@customer/);
    expect(contentArea).toHaveClass('text-purple-600');
  });

  it('should extract and highlight links', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    const contentArea = screen.getByText('https://example.com');
    expect(contentArea).toHaveClass('text-blue-500');
  });

  it('should display character count metrics', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" showMetrics={true} />);

    expect(screen.getByText('Character Count')).toBeInTheDocument();
    // Content length is 87 characters
    expect(screen.getByText(new RegExp(String(sampleContent.length)))).toBeInTheDocument();
  });

  it('should hide metrics when showMetrics is false', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" showMetrics={false} />);

    expect(screen.queryByText('Content Metrics')).not.toBeInTheDocument();
  });

  it('should show hashtag count in metrics', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" showMetrics={true} />);

    expect(screen.getByText(/Hashtags: 2/)).toBeInTheDocument();
  });

  it('should display extracted hashtags as badges', () => {
    const { container } = render(<LiveContentPreview content={sampleContent} platform="facebook" showMetrics={true} />);

    // Check for hashtag badges in the metrics section
    const hashtagBadges = container.querySelectorAll('.bg-blue-100.text-blue-700');
    expect(hashtagBadges.length).toBeGreaterThan(0);
  });

  it('should show link count in metrics', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" showMetrics={true} />);

    expect(screen.getByText(/Links: 1/)).toBeInTheDocument();
  });

  it('should display link preview card', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    expect(screen.getByText('Link Preview')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('should show character limit warning when exceeded', () => {
    const longContent = 'a'.repeat(300);
    render(<LiveContentPreview content={longContent} platform="twitter" showMetrics={true} />);

    // Twitter has 280 char limit
    const warning = screen.getByText(/exceeds.*character limit/i);
    expect(warning).toBeInTheDocument();
  });

  it('should show character count progress bar', () => {
    render(<LiveContentPreview content={sampleContent} platform="twitter" showMetrics={true} />);

    const progressBar = document.querySelector('.h-2.bg-gray-200.rounded-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('should use green color for safe character count', () => {
    render(<LiveContentPreview content="Short content" platform="twitter" showMetrics={true} />);

    const progressFill = document.querySelector('.bg-green-500');
    expect(progressFill).toBeInTheDocument();
  });

  it('should use red color when character limit exceeded', () => {
    const longContent = 'a'.repeat(300);
    render(<LiveContentPreview content={longContent} platform="twitter" showMetrics={true} />);

    const progressFill = document.querySelector('.bg-red-500');
    expect(progressFill).toBeInTheDocument();
  });

  it('should show device type in header', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" device="mobile" />);

    expect(screen.getByText('mobile')).toBeInTheDocument();
  });

  it('should display mock engagement metrics', () => {
    render(<LiveContentPreview content={sampleContent} platform="facebook" />);

    expect(screen.getByText(/❤️ 42/)).toBeInTheDocument();
    expect(screen.getByText(/💬 8/)).toBeInTheDocument();
    expect(screen.getByText(/↗️ 5/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LiveContentPreview content={sampleContent} platform="facebook" className="custom-preview" />
    );

    expect(container.querySelector('.live-content-preview')).toHaveClass('custom-preview');
  });
});
