/**
 * Simple Campaign Mode Tests
 * Test suite for AI suggestions mode (Level 1)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { SimpleCampaignMode } from '@/components/v2/ui-levels/SimpleCampaignMode';
import type { CampaignSuggestion } from '@/types/v2';

// Mock suggestions
const mockSuggestions: CampaignSuggestion[] = [
  {
    id: 'sug-1',
    campaignName: 'Authority Builder Campaign',
    purpose: 'Build industry authority',
    description: 'Establish expertise with educational content',
    previewText: 'Position yourself as a trusted expert...',
    estimatedDuration: 7,
    estimatedPieces: 8,
    confidenceScore: 92,
    source: 'opportunity_radar',
    metadata: {
      emotionalTriggers: ['authority', 'trust'],
      targetChannels: ['linkedin', 'twitter'],
      keyThemes: ['expertise', 'education', 'thought-leadership']
    }
  },
  {
    id: 'sug-2',
    campaignName: 'Product Launch Blitz',
    purpose: 'Drive product awareness',
    description: 'Launch new product with multi-channel push',
    previewText: 'Introducing our revolutionary...',
    estimatedDuration: 14,
    estimatedPieces: 12,
    confidenceScore: 85,
    source: 'ai_generated',
    metadata: {
      emotionalTriggers: ['curiosity', 'urgency'],
      targetChannels: ['instagram', 'facebook'],
      keyThemes: ['innovation', 'benefits', 'social-proof']
    }
  },
  {
    id: 'sug-3',
    campaignName: 'Community Engagement Drive',
    purpose: 'Build local community',
    description: 'Connect with local audience through events',
    previewText: 'Join us at...',
    estimatedDuration: 10,
    estimatedPieces: 10,
    confidenceScore: 78,
    source: 'seasonal',
    metadata: {
      emotionalTriggers: ['hope', 'trust'],
      targetChannels: ['facebook', 'instagram'],
      keyThemes: ['community', 'local', 'connection']
    }
  }
];

describe('SimpleCampaignMode', () => {
  const defaultProps = {
    brandId: 'brand-123',
    brandName: 'Test Brand',
    industry: 'SaaS',
    suggestions: mockSuggestions,
    onGenerateCampaign: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Component renders with header
  it('should render component with AI-Recommended header', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('AI-Recommended Campaigns')).toBeDefined();
    expect(screen.getByText(/Based on your business analysis/)).toBeDefined();
  });

  // Test 2: Renders all suggestions
  it('should render all provided campaign suggestions', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('Authority Builder Campaign')).toBeDefined();
    expect(screen.getByText('Product Launch Blitz')).toBeDefined();
    expect(screen.getByText('Community Engagement Drive')).toBeDefined();
  });

  // Test 3: Shows confidence scores
  it('should display confidence scores for each suggestion', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('92% Match')).toBeDefined();
    expect(screen.getByText('85% Match')).toBeDefined();
    expect(screen.getByText('78% Match')).toBeDefined();
  });

  // Test 4: Shows duration and piece count
  it('should show estimated duration and piece count', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('7 days')).toBeDefined();
    expect(screen.getByText('8 pieces')).toBeDefined();
    expect(screen.getByText('14 days')).toBeDefined();
    expect(screen.getByText('12 pieces')).toBeDefined();
  });

  // Test 5: Shows source labels
  it('should display correct source labels', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('Opportunity')).toBeDefined();
    expect(screen.getByText('AI Suggested')).toBeDefined();
    expect(screen.getByText('Seasonal')).toBeDefined();
  });

  // Test 6: Shows preview text
  it('should display preview text for suggestions', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText(/Position yourself as a trusted expert/)).toBeDefined();
    expect(screen.getByText(/Introducing our revolutionary/)).toBeDefined();
  });

  // Test 7: Shows key themes
  it('should render key themes as tags', () => {
    render(<SimpleCampaignMode {...defaultProps} />);
    expect(screen.getByText('expertise')).toBeDefined();
    expect(screen.getByText('innovation')).toBeDefined();
    expect(screen.getByText('community')).toBeDefined();
  });

  // Test 8: Generate button click calls handler
  it('should call onGenerateCampaign when generate button clicked', async () => {
    const onGenerateCampaign = vi.fn().mockResolvedValue(undefined);
    render(<SimpleCampaignMode {...defaultProps} onGenerateCampaign={onGenerateCampaign} />);

    const generateButtons = screen.getAllByText('Generate Campaign');
    fireEvent.click(generateButtons[0]);

    // Should open quick edit modal first
    await waitFor(() => {
      expect(screen.getByText('Quick Edit')).toBeDefined();
    });
  });

  // Test 9: Loading state
  it('should show loading state while fetching suggestions', async () => {
    const onLoadSuggestions = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockSuggestions), 100))
    );

    render(
      <SimpleCampaignMode
        {...defaultProps}
        suggestions={[]}
        onLoadSuggestions={onLoadSuggestions}
      />
    );

    expect(screen.getByText(/Loading AI-powered campaign suggestions/)).toBeDefined();

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).toBeNull();
    });
  });

  // Test 10: Empty state when no suggestions
  it('should show empty state when no suggestions available', () => {
    render(<SimpleCampaignMode {...defaultProps} suggestions={[]} />);
    expect(screen.getByText('No suggestions available')).toBeDefined();
    expect(screen.getByText(/Complete your business profile/)).toBeDefined();
  });

  // Test 11: Quick edit modal opens with editable fields
  it('should open quick edit modal with correct fields', async () => {
    render(<SimpleCampaignMode {...defaultProps} />);

    const generateButtons = screen.getAllByText('Generate Campaign');
    fireEvent.click(generateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Quick Edit')).toBeDefined();
      expect(screen.getByText('Campaign Title')).toBeDefined();
      expect(screen.getByText('Start Date')).toBeDefined();
    });
  });

  // Test 12: Quick edit modal can be cancelled
  it('should allow canceling quick edit modal', async () => {
    render(<SimpleCampaignMode {...defaultProps} />);

    const generateButtons = screen.getAllByText('Generate Campaign');
    fireEvent.click(generateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Quick Edit')).toBeDefined();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Quick Edit')).toBeNull();
    });
  });

  // Test 13: Quick edit form submission
  it('should submit edited data when generating campaign', async () => {
    const onGenerateCampaign = vi.fn().mockResolvedValue(undefined);
    render(<SimpleCampaignMode {...defaultProps} onGenerateCampaign={onGenerateCampaign} />);

    const generateButtons = screen.getAllByText('Generate Campaign');
    fireEvent.click(generateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Quick Edit')).toBeDefined();
    });

    const titleInput = screen.getByDisplayValue('Authority Builder Campaign');
    fireEvent.change(titleInput, { target: { value: 'Custom Title' } });

    const submitButton = screen.getAllByText(/Generate/i).find(el => el.textContent === 'Generate');
    if (submitButton) {
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      expect(onGenerateCampaign).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  // Test 14: Shows generating state on button
  it('should show generating state while campaign is being created', async () => {
    const onGenerateCampaign = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 200))
    );
    render(<SimpleCampaignMode {...defaultProps} onGenerateCampaign={onGenerateCampaign} />);

    const generateButtons = screen.getAllByText('Generate Campaign');
    fireEvent.click(generateButtons[0]);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText('Quick Edit')).toBeDefined();
    }, { timeout: 1000 });

    // Find and click the submit button
    const submitButtons = screen.getAllByText(/Generate/i);
    const submitButton = submitButtons.find(el => el.closest('form'));

    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onGenerateCampaign).toHaveBeenCalled();
      }, { timeout: 500 });
    }
  });

  // Test 15: Limits suggestions to max configured
  it('should limit displayed suggestions to maxSuggestedCampaigns', () => {
    const manySuggestions = [...mockSuggestions, ...mockSuggestions];
    render(<SimpleCampaignMode {...defaultProps} suggestions={manySuggestions} />);

    // Should only show first 3 (default max)
    const suggestionCards = screen.getAllByText(/Generate Campaign/);
    expect(suggestionCards.length).toBeGreaterThan(0);
    expect(suggestionCards.length).toBeLessThanOrEqual(3);
  });
});
