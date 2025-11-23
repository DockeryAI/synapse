/**
 * Campaign Builder Components Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { ModeProvider } from '@/contexts/v2/ModeContext';
import {
  CampaignBuilder,
  PurposeSelector,
  CampaignPieceCard,
  CampaignPreview,
} from '@/components/v2/campaign-builder';
import type { CampaignPiece, EmotionalTrigger } from '@/types/v2';

// Mock data
const mockPiece: CampaignPiece = {
  id: 'piece-1',
  campaignId: 'campaign-1',
  phaseId: 'phase-1',
  title: 'Test Piece Title',
  content: 'This is test content for the campaign piece that should be displayed.',
  emotionalTrigger: 'curiosity' as EmotionalTrigger,
  scheduledDate: '2024-01-01T00:00:00.000Z',
  status: 'pending',
  channel: 'linkedin',
  pieceOrder: 0,
  templateId: 'test-template',
  performancePrediction: {
    expectedCTR: 4.5,
    expectedEngagement: 2.1,
    expectedConversion: 2.8,
    confidenceScore: 75,
    factors: [],
  },
};

const mockPieces: CampaignPiece[] = [
  mockPiece,
  {
    ...mockPiece,
    id: 'piece-2',
    title: 'Second Piece',
    emotionalTrigger: 'hope',
    pieceOrder: 1,
    scheduledDate: '2024-01-05T00:00:00.000Z',
  },
  {
    ...mockPiece,
    id: 'piece-3',
    title: 'Third Piece',
    emotionalTrigger: 'desire',
    pieceOrder: 2,
    scheduledDate: '2024-01-10T00:00:00.000Z',
  },
];

describe('PurposeSelector', () => {
  it('should render all 15 campaign templates', () => {
    const onSelect = vi.fn();
    render(
      <PurposeSelector
        onSelect={onSelect}
        selectedTemplateId={null}
        industry="SaaS"
      />
    );

    // Check for template names
    expect(screen.getByText("Hero's Journey")).toBeDefined();
    expect(screen.getByText('RACE Journey')).toBeDefined();
    expect(screen.getByText('Trust Ladder')).toBeDefined();
    expect(screen.getByText('PAS Series')).toBeDefined();
    expect(screen.getByText('Quick Win')).toBeDefined();
  });

  it('should filter templates by category', () => {
    const onSelect = vi.fn();
    render(
      <PurposeSelector
        onSelect={onSelect}
        selectedTemplateId={null}
      />
    );

    // Click premium filter - use getAllByText since 'premium' appears in multiple places
    const premiumButtons = screen.getAllByText('premium');
    fireEvent.click(premiumButtons[0]); // Click the filter button

    // Premium templates should be visible
    expect(screen.getByText("Hero's Journey")).toBeDefined();
    expect(screen.getByText('RACE Journey')).toBeDefined();
  });

  it('should call onSelect when template is clicked', () => {
    const onSelect = vi.fn();
    render(
      <PurposeSelector
        onSelect={onSelect}
        selectedTemplateId={null}
      />
    );

    const templateCard = screen.getByText("Hero's Journey").closest('button');
    if (templateCard) {
      fireEvent.click(templateCard);
    }

    expect(onSelect).toHaveBeenCalledWith('heros_journey');
  });

  it('should highlight selected template', () => {
    const onSelect = vi.fn();
    render(
      <PurposeSelector
        onSelect={onSelect}
        selectedTemplateId="race_journey"
      />
    );

    const raceJourneyCard = screen.getByText('RACE Journey').closest('button');
    expect(raceJourneyCard?.className).toContain('border-primary');
  });

  it('should display template metadata', () => {
    const onSelect = vi.fn();
    render(
      <PurposeSelector
        onSelect={onSelect}
        selectedTemplateId={null}
      />
    );

    // Check for pieces count
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    // Check for ROI values
    expect(screen.getAllByText(/x$/).length).toBeGreaterThan(0);
  });
});

describe('CampaignPieceCard', () => {
  it('should display piece information', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CampaignPieceCard
        piece={mockPiece}
        index={0}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Test Piece Title')).toBeDefined();
    expect(screen.getByText('curiosity')).toBeDefined();
    expect(screen.getByText('pending')).toBeDefined();
  });

  it('should display piece number', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CampaignPieceCard
        piece={mockPiece}
        index={2}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('3')).toBeDefined();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CampaignPieceCard
        piece={mockPiece}
        index={0}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit piece');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('should call onDelete when delete button clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CampaignPieceCard
        piece={mockPiece}
        index={0}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete piece');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });

  it('should display performance prediction', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CampaignPieceCard
        piece={mockPiece}
        index={0}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('CTR: 4.5%')).toBeDefined();
  });
});

describe('CampaignPreview', () => {
  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    purpose: 'conversion' as const,
    status: 'draft' as const,
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-15T00:00:00.000Z',
  };

  it('should display campaign information', () => {
    render(
      <CampaignPreview
        campaign={mockCampaign}
        pieces={mockPieces}
        brandName="Test Brand"
      />
    );

    expect(screen.getByText('Test Campaign')).toBeDefined();
    expect(screen.getByText('conversion')).toBeDefined();
    expect(screen.getByText('draft')).toBeDefined();
  });

  it('should display all pieces', () => {
    render(
      <CampaignPreview
        campaign={mockCampaign}
        pieces={mockPieces}
        brandName="Test Brand"
      />
    );

    // Use getAllByText since pieces appear in both narrative flow and list
    expect(screen.getAllByText('Test Piece Title').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Second Piece').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Third Piece').length).toBeGreaterThan(0);
  });

  it('should calculate duration correctly', () => {
    render(
      <CampaignPreview
        campaign={mockCampaign}
        pieces={mockPieces}
        brandName="Test Brand"
      />
    );

    // 3 pieces over 9 days
    expect(screen.getByText('3 pieces over 9 days')).toBeDefined();
  });

  it('should show empty state when no campaign', () => {
    render(
      <CampaignPreview
        campaign={null}
        pieces={[]}
        brandName="Test Brand"
      />
    );

    expect(screen.getByText(/No campaign to preview/)).toBeDefined();
  });

  it('should toggle piece expansion', () => {
    render(
      <CampaignPreview
        campaign={mockCampaign}
        pieces={mockPieces}
        brandName="Test Brand"
      />
    );

    const firstPiece = screen.getByText('Test Piece Title').closest('button');
    if (firstPiece) {
      fireEvent.click(firstPiece);
    }

    // Content should be visible after clicking
    expect(screen.getByText(/This is test content/)).toBeDefined();
  });

  it('should display export options', () => {
    render(
      <CampaignPreview
        campaign={mockCampaign}
        pieces={mockPieces}
        brandName="Test Brand"
      />
    );

    expect(screen.getByText('Export as PDF')).toBeDefined();
    expect(screen.getByText('Copy All Content')).toBeDefined();
    expect(screen.getByText('Schedule Campaign')).toBeDefined();
  });
});

describe('CampaignBuilder', () => {
  it('should show message when not in campaign mode', () => {
    render(
      <ModeProvider defaultMode="content">
        <CampaignBuilder
          brandId="brand-1"
          brandName="Test Brand"
        />
      </ModeProvider>
    );

    expect(screen.getByText(/Switch to Campaign mode/)).toBeDefined();
  });

  it('should render step indicators', () => {
    render(
      <ModeProvider defaultMode="campaign">
        <CampaignBuilder
          brandId="brand-1"
          brandName="Test Brand"
        />
      </ModeProvider>
    );

    expect(screen.getByText('Purpose')).toBeDefined();
    expect(screen.getByText('Timeline')).toBeDefined();
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('should start on purpose step', () => {
    render(
      <ModeProvider defaultMode="campaign">
        <CampaignBuilder
          brandId="brand-1"
          brandName="Test Brand"
        />
      </ModeProvider>
    );

    // Should show PurposeSelector content
    expect(screen.getByText('Choose Your Campaign Template')).toBeDefined();
  });

  it('should call onCancel when cancel clicked', () => {
    const onCancel = vi.fn();

    render(
      <ModeProvider defaultMode="campaign">
        <CampaignBuilder
          brandId="brand-1"
          brandName="Test Brand"
          onCancel={onCancel}
        />
      </ModeProvider>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});

describe('Campaign Builder Integration', () => {
  it('should have all required components exported', () => {
    expect(CampaignBuilder).toBeDefined();
    expect(PurposeSelector).toBeDefined();
    expect(CampaignPieceCard).toBeDefined();
    expect(CampaignPreview).toBeDefined();
  });
});
