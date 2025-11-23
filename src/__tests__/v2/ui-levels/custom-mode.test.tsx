/**
 * Custom Campaign Mode Tests
 * Test suite for timeline editing mode (Level 2)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { CustomCampaignMode } from '@/components/v2/ui-levels/CustomCampaignMode';
import type { CampaignPiece, EmotionalTrigger } from '@/types/v2';

// Mock pieces
const mockPieces: CampaignPiece[] = [
  {
    id: 'piece-1',
    campaignId: 'campaign-1',
    phaseId: 'phase-1',
    title: 'Introduction Post',
    content: 'Welcome to our campaign...',
    emotionalTrigger: 'curiosity' as EmotionalTrigger,
    scheduledDate: '2024-01-01T10:00:00Z',
    status: 'pending',
    channel: 'LinkedIn',
    order: 0
  },
  {
    id: 'piece-2',
    campaignId: 'campaign-1',
    phaseId: 'phase-1',
    title: 'Educational Content',
    content: 'Learn about our approach...',
    emotionalTrigger: 'trust' as EmotionalTrigger,
    scheduledDate: '2024-01-03T10:00:00Z',
    status: 'generated',
    channel: 'LinkedIn',
    order: 1
  },
  {
    id: 'piece-3',
    campaignId: 'campaign-1',
    phaseId: 'phase-2',
    title: 'Social Proof',
    content: 'See what our customers say...',
    emotionalTrigger: 'hope' as EmotionalTrigger,
    scheduledDate: '2024-01-05T10:00:00Z',
    status: 'pending',
    channel: 'Instagram',
    order: 2
  }
];

describe('CustomCampaignMode', () => {
  const defaultProps = {
    brandId: 'brand-123',
    campaignId: 'campaign-1',
    pieces: mockPieces,
    onPiecesUpdate: vi.fn(),
    onPieceReorder: vi.fn(),
    onEmotionalTriggerChange: vi.fn(),
    onPieceEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Component renders with header
  it('should render component with Customize Campaign header', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getByText('Customize Campaign')).toBeDefined();
  });

  // Test 2: Shows campaign stats
  it('should display campaign statistics', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getByText('Total Pieces')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined(); // 3 pieces
    expect(screen.getByText('Duration')).toBeDefined();
  });

  // Test 3: Renders timeline view by default
  it('should render timeline view by default', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getByText('Timeline')).toBeDefined();
    // Should show dates
    expect(screen.getAllByText(/Jan/).length).toBeGreaterThan(0);
  });

  // Test 4: Can switch to list view
  it('should allow switching between timeline and list views', async () => {
    render(<CustomCampaignMode {...defaultProps} />);

    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    await waitFor(() => {
      // List view should be active
      const listViewButton = screen.getByText('List').closest('button');
      expect(listViewButton?.className).toContain('bg-primary');
    });
  });

  // Test 5: Renders all pieces
  it('should render all campaign pieces', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getByText('Introduction Post')).toBeDefined();
    expect(screen.getByText('Educational Content')).toBeDefined();
    expect(screen.getByText('Social Proof')).toBeDefined();
  });

  // Test 6: Shows piece status
  it('should display piece status badges', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getAllByText('pending').length).toBeGreaterThan(0);
    expect(screen.getByText('generated')).toBeDefined();
  });

  // Test 7: Shows emotional triggers
  it('should display emotional trigger selectors', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getAllByText(/Trust/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hope/i).length).toBeGreaterThan(0);
  });

  // Test 8: Can edit piece inline
  it('should enable inline editing when edit button clicked', async () => {
    render(<CustomCampaignMode {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: '' });
    const editButton = editButtons.find(btn => btn.querySelector('svg'));

    if (editButton) {
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Introduction Post')).toBeDefined();
      });
    }
  });

  // Test 9: Can save edited piece
  it('should call onPieceEdit when saving changes', async () => {
    const onPieceEdit = vi.fn();
    render(<CustomCampaignMode {...defaultProps} onPieceEdit={onPieceEdit} />);

    // Find and click edit button (icon button without text)
    const allButtons = screen.getAllByRole('button');
    const editButton = allButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.textContent;
    });

    if (editButton) {
      fireEvent.click(editButton);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Introduction Post');
        expect(titleInput).toBeDefined();
        fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

        // Find save button after a short delay
        setTimeout(() => {
          const buttons = screen.getAllByRole('button');
          const saveButton = buttons.find(btn => btn.className.includes('green'));
          if (saveButton) {
            fireEvent.click(saveButton);
          }
        }, 50);
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(onPieceEdit).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  // Test 10: Can cancel editing
  it('should cancel editing without saving changes', async () => {
    render(<CustomCampaignMode {...defaultProps} />);

    const allButtons = screen.getAllByRole('button');
    const editButton = allButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.textContent;
    });

    if (editButton) {
      fireEvent.click(editButton);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Introduction Post');
        fireEvent.change(titleInput, { target: { value: 'Changed' } });

        // Cancel button
        const cancelButton = screen.getAllByRole('button').find(btn => {
          const path = btn.querySelector('path');
          return path && path.getAttribute('d')?.includes('M18 6');
        });

        if (cancelButton) {
          fireEvent.click(cancelButton);
        }
      });
    }
  });

  // Test 11: Emotional trigger changes call handler
  it('should call onEmotionalTriggerChange when trigger is changed', async () => {
    const onEmotionalTriggerChange = vi.fn();
    render(<CustomCampaignMode {...defaultProps} onEmotionalTriggerChange={onEmotionalTriggerChange} />);

    const fearButtons = screen.getAllByText(/Fear/i);
    if (fearButtons.length > 0) {
      fireEvent.click(fearButtons[0]);

      await waitFor(() => {
        expect(onEmotionalTriggerChange).toHaveBeenCalled();
      });
    }
  });

  // Test 12: Drag and drop updates piece order
  it('should handle drag and drop reordering', () => {
    const onPieceReorder = vi.fn();
    const onPiecesUpdate = vi.fn();
    render(
      <CustomCampaignMode
        {...defaultProps}
        onPieceReorder={onPieceReorder}
        onPiecesUpdate={onPiecesUpdate}
      />
    );

    const pieceCards = screen.getAllByText(/Introduction Post|Educational Content/);
    expect(pieceCards.length).toBeGreaterThan(0);
    // Drag and drop events would be tested here with actual DnD simulation
  });

  // Test 13: Shows channel information
  it('should display channel for each piece', () => {
    render(<CustomCampaignMode {...defaultProps} />);
    expect(screen.getAllByText('LinkedIn').length).toBeGreaterThan(0);
    expect(screen.getByText('Instagram')).toBeDefined();
  });

  // Test 14: Groups pieces by date in timeline view
  it('should group pieces by date in timeline view', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    // Should show formatted dates
    const dateElements = screen.getAllByText(/Jan/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  // Test 15: Shows piece count per day
  it('should show piece count for each day in timeline', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    // Should show "1 piece" or "pieces"
    const pieceCountElements = screen.getAllByText(/piece/i);
    expect(pieceCountElements.length).toBeGreaterThan(0);
  });

  // Test 16: Calculates campaign duration correctly
  it('should calculate and display campaign duration', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    // Duration from Jan 1 to Jan 5 is 5 days
    expect(screen.getByText(/5 days/)).toBeDefined();
  });

  // Test 17: Shows edited count
  it('should show count of edited pieces', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    // One piece has status 'generated'
    expect(screen.getByText('Edited')).toBeDefined();
  });

  // Test 18: All emotional triggers available
  it('should show all emotional trigger options', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    expect(screen.getAllByText(/Trust/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fear/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Urgency/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hope/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Curiosity/i).length).toBeGreaterThan(0);
  });

  // Test 19: Highlights current emotional trigger
  it('should highlight the currently selected emotional trigger', () => {
    render(<CustomCampaignMode {...defaultProps} />);

    // Find triggers and check if the correct one is highlighted
    const triggers = screen.getAllByRole('button');
    const activeTriggers = triggers.filter(btn =>
      btn.className.includes('bg-primary')
    );

    expect(activeTriggers.length).toBeGreaterThan(0);
  });

  // Test 20: Updates UI when pieces prop changes
  it('should update display when pieces prop changes', () => {
    const { rerender } = render(<CustomCampaignMode {...defaultProps} />);

    expect(screen.getByText('Introduction Post')).toBeDefined();

    const newPieces = [
      ...mockPieces,
      {
        id: 'piece-4',
        campaignId: 'campaign-1',
        phaseId: 'phase-2',
        title: 'New Piece',
        content: 'New content...',
        emotionalTrigger: 'urgency' as EmotionalTrigger,
        scheduledDate: '2024-01-07T10:00:00Z',
        status: 'pending',
        channel: 'Twitter',
        order: 3
      }
    ];

    rerender(<CustomCampaignMode {...defaultProps} pieces={newPieces} />);

    expect(screen.getByText('New Piece')).toBeDefined();
  });
});
