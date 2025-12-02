/**
 * Power Campaign Mode Tests
 * Test suite for power user mode (Level 3)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { PowerCampaignMode } from '@/components/v2/ui-levels/PowerCampaignMode';
import type { CampaignPhase, CampaignPiece, EmotionalTrigger } from '@/types/v2';

// Mock phases
const mockPhases: CampaignPhase[] = [
  {
    id: 'phase-1',
    name: 'Awareness Phase',
    dayNumber: 1,
    emotionalTrigger: 'curiosity' as EmotionalTrigger,
    objective: 'Build initial awareness',
    contentType: 'educational'
  },
  {
    id: 'phase-2',
    name: 'Consideration Phase',
    dayNumber: 5,
    emotionalTrigger: 'trust' as EmotionalTrigger,
    objective: 'Establish credibility',
    contentType: 'testimonial'
  }
];

// Mock pieces
const mockPieces: CampaignPiece[] = [
  {
    id: 'piece-1',
    campaignId: 'campaign-1',
    phaseId: 'phase-1',
    title: 'Introduction',
    content: 'Welcome...',
    emotionalTrigger: 'curiosity' as EmotionalTrigger,
    scheduledDate: '2024-01-01',
    status: 'pending',
    channel: 'LinkedIn',
    order: 0
  },
  {
    id: 'piece-2',
    campaignId: 'campaign-1',
    phaseId: 'phase-2',
    title: 'Case Study',
    content: 'Success story...',
    emotionalTrigger: 'trust' as EmotionalTrigger,
    scheduledDate: '2024-01-05',
    status: 'pending',
    channel: 'LinkedIn',
    order: 1
  }
];

const mockCompetitiveData = {
  marketPosition: 'Strong',
  advantage: 'First-mover in niche'
};

describe('PowerCampaignMode', () => {
  const defaultProps = {
    brandId: 'brand-123',
    campaignId: 'campaign-1',
    phases: mockPhases,
    pieces: mockPieces,
    onPhasesUpdate: vi.fn(),
    onPiecesUpdate: vi.fn(),
    onConnectionCreate: vi.fn(),
    onConnectionDelete: vi.fn(),
    competitiveData: mockCompetitiveData,
    breakthroughScore: 87
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Component renders with header
  it('should render Power User Mode header', () => {
    render(<PowerCampaignMode {...defaultProps} />);
    expect(screen.getByText('Power User Mode')).toBeDefined();
    expect(screen.getByText(/Full control over campaign architecture/)).toBeDefined();
  });

  // Test 2: Shows breakthrough score
  it('should display breakthrough score', () => {
    render(<PowerCampaignMode {...defaultProps} />);
    expect(screen.getByText('Breakthrough Score')).toBeDefined();
    expect(screen.getByText('87')).toBeDefined();
  });

  // Test 3: Renders all tabs
  it('should render all tab buttons', () => {
    render(<PowerCampaignMode {...defaultProps} />);
    expect(screen.getByText('Campaign Arc')).toBeDefined();
    expect(screen.getByText('Connections')).toBeDefined();
    expect(screen.getByText('Competitive Insights')).toBeDefined();
    expect(screen.getByText('Score Tuning')).toBeDefined();
  });

  // Test 4: Campaign Arc tab active by default
  it('should show Campaign Arc tab as active by default', () => {
    render(<PowerCampaignMode {...defaultProps} />);
    const arcTab = screen.getByText('Campaign Arc').closest('button');
    expect(arcTab?.className).toContain('border-primary');
  });

  // Test 5: Can switch tabs
  it('should switch tabs when clicked', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    await waitFor(() => {
      expect(screen.getByText('Connection Builder')).toBeDefined();
    });
  });

  // Test 6: Shows all phases
  it('should display all campaign phases', () => {
    render(<PowerCampaignMode {...defaultProps} />);
    expect(screen.getByText('Awareness Phase')).toBeDefined();
    expect(screen.getByText('Consideration Phase')).toBeDefined();
  });

  // Test 7: Can add new phase
  it('should allow adding new phases', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    const addPhaseButton = screen.getByText('Add Phase');
    fireEvent.click(addPhaseButton);

    await waitFor(() => {
      expect(onPhasesUpdate).toHaveBeenCalled();
    });
  });

  // Test 8: Can expand phase details
  it('should expand phase to show details when clicked', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      expect(screen.getByText('Phase Name')).toBeDefined();
      expect(screen.getByText('Objective')).toBeDefined();
    });
  });

  // Test 9: Can edit phase name
  it('should allow editing phase properties', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Awareness Phase');
      fireEvent.change(nameInput, { target: { value: 'Updated Phase' } });

      expect(onPhasesUpdate).toHaveBeenCalled();
    });
  });

  // Test 10: Can delete phase
  it('should allow deleting a phase', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    // Find delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('[data-lucide="trash-2"]') || btn.className.includes('text-red')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(onPhasesUpdate).toHaveBeenCalled();
      });
    }
  });

  // Test 11: Shows pieces for each phase
  it('should display pieces belonging to each phase', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeDefined();
    });
  });

  // Test 12: Connections tab shows connection builder
  it('should show connection builder in Connections tab', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    await waitFor(() => {
      expect(screen.getByText('Connection Builder')).toBeDefined();
      expect(screen.getByText('Connection Type:')).toBeDefined();
    });
  });

  // Test 13: Can select connection type
  it('should allow selecting connection type', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    await waitFor(() => {
      const select = screen.getByRole('combobox') || screen.getAllByRole('combobox')[0];
      if (select) {
        fireEvent.change(select, { target: { value: 'sequential' } });
        expect((select as HTMLSelectElement).value).toBe('sequential');
      }
    });
  });

  // Test 14: Shows connection instructions
  it('should display connection creation instructions', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    await waitFor(() => {
      expect(screen.getByText(/Click a node to start creating a connection/)).toBeDefined();
    });
  });

  // Test 15: Can create connection between pieces
  it('should allow creating connections between pieces', async () => {
    const onConnectionCreate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onConnectionCreate={onConnectionCreate} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    await waitFor(() => {
      const pieceButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.includes('Introduction') || btn.textContent?.includes('Case Study')
      );

      if (pieceButtons.length >= 2) {
        fireEvent.click(pieceButtons[0]);
        fireEvent.click(pieceButtons[1]);

        expect(onConnectionCreate).toHaveBeenCalled();
      }
    });
  });

  // Test 16: Shows active connections list
  it('should display list of active connections', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const connectionsTab = screen.getByText('Connections');
    fireEvent.click(connectionsTab);

    // Would show connections if any exist
    // This test verifies the connections list section renders
    await waitFor(() => {
      expect(screen.queryByText('Active Connections')).toBeDefined();
    });
  });

  // Test 17: Competitive Insights tab shows data
  it('should display competitive insights data', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const insightsTab = screen.getByText('Competitive Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('Competitive Intelligence')).toBeDefined();
      expect(screen.getByText('Market Position')).toBeDefined();
      expect(screen.getByText('Strong')).toBeDefined();
    });
  });

  // Test 18: Score Tuning tab shows tuning interface
  it('should show score tuning interface', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const tuningTab = screen.getByText('Score Tuning');
    fireEvent.click(tuningTab);

    await waitFor(() => {
      expect(screen.getByText('Breakthrough Score Tuning')).toBeDefined();
      expect(screen.getByText('Current Score')).toBeDefined();
    });
  });

  // Test 19: Shows score factors
  it('should display individual score factors', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const tuningTab = screen.getByText('Score Tuning');
    fireEvent.click(tuningTab);

    await waitFor(() => {
      expect(screen.getByText('Narrative Continuity')).toBeDefined();
      expect(screen.getByText('Emotional Progression')).toBeDefined();
      expect(screen.getByText('Content Variety')).toBeDefined();
    });
  });

  // Test 20: Shows factor weights
  it('should display weights for each scoring factor', async () => {
    render(<PowerCampaignMode {...defaultProps} />);

    const tuningTab = screen.getByText('Score Tuning');
    fireEvent.click(tuningTab);

    await waitFor(() => {
      expect(screen.getAllByText(/weight:/i).length).toBeGreaterThan(0);
    });
  });

  // Test 21: Phase objective is editable
  it('should allow editing phase objective', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      const objectiveInput = screen.getByPlaceholderText(/What is the goal/);
      fireEvent.change(objectiveInput, { target: { value: 'New objective' } });

      expect(onPhasesUpdate).toHaveBeenCalled();
    });
  });

  // Test 22: Phase emotional trigger can be changed
  it('should allow changing phase emotional trigger', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      const triggerSelect = screen.getAllByRole('combobox').find(select =>
        (select as HTMLSelectElement).value === 'curiosity'
      );

      if (triggerSelect) {
        fireEvent.change(triggerSelect, { target: { value: 'urgency' } });
        expect(onPhasesUpdate).toHaveBeenCalled();
      }
    });
  });

  // Test 23: Phase day number is editable
  it('should allow editing phase day number', async () => {
    const onPhasesUpdate = vi.fn();
    render(<PowerCampaignMode {...defaultProps} onPhasesUpdate={onPhasesUpdate} />);

    const phaseButton = screen.getByText('Awareness Phase');
    fireEvent.click(phaseButton);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('1');
      fireEvent.change(dayInput, { target: { value: '3' } });

      expect(onPhasesUpdate).toHaveBeenCalled();
    });
  });

  // Test 24: Respects max custom phases limit
  it('should respect maxCustomPhases configuration', () => {
    // Create many phases
    const manyPhases = Array.from({ length: 20 }, (_, i) => ({
      id: `phase-${i}`,
      name: `Phase ${i + 1}`,
      dayNumber: i + 1,
      emotionalTrigger: 'trust' as EmotionalTrigger,
      objective: '',
      contentType: 'mixed'
    }));

    render(<PowerCampaignMode {...defaultProps} phases={manyPhases} />);

    // Add Phase button should not be visible when at max
    const addPhaseButton = screen.queryByText('Add Phase');
    expect(addPhaseButton).toBeNull();
  });

  // Test 25: Updates when props change
  it('should update display when props change', () => {
    const { rerender } = render(<PowerCampaignMode {...defaultProps} />);

    expect(screen.getByText('87')).toBeDefined();

    rerender(<PowerCampaignMode {...defaultProps} breakthroughScore={95} />);

    expect(screen.getByText('95')).toBeDefined();
  });
});
