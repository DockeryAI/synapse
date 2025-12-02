/**
 * SplitViewEditor Component Tests
 * Total: 12 tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SplitViewEditor } from '../../../components/v2/preview/SplitViewEditor';

describe('SplitViewEditor', () => {
  const mockEditorContent = <div>Editor Content</div>;
  const mockPreviewContent = <div>Preview Content</div>;

  it('should render with default 50/50 split ratio', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    expect(screen.getByText('Editor Content')).toBeInTheDocument();
    expect(screen.getByText('Preview Content')).toBeInTheDocument();
    expect(screen.getByText('Split View')).toBeInTheDocument();
  });

  it('should render with custom initial ratio', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
        initialRatio="40/60"
      />
    );

    const button40_60 = screen.getByText('40/60');
    expect(button40_60).toHaveClass('bg-blue-500');
  });

  it('should toggle sync scroll on button click', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const syncButton = screen.getByText('Sync: ON');
    expect(syncButton).toBeInTheDocument();

    fireEvent.click(syncButton);
    expect(screen.getByText('Sync: OFF')).toBeInTheDocument();
  });

  it('should change ratio with quick buttons', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const button60_40 = screen.getByText('60/40');
    fireEvent.click(button60_40);

    expect(button60_40).toHaveClass('bg-blue-500');
  });

  it('should collapse editor pane on left chevron click', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const editorPane = screen.getByText('Editor Content').closest('.editor-pane');
    expect(editorPane).not.toHaveAttribute('data-collapsed', 'true');

    const collapseButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('title') === 'Toggle editor pane'
    );

    if (collapseButton) {
      fireEvent.click(collapseButton);
      expect(editorPane).toHaveAttribute('data-collapsed', 'true');
    }
  });

  it('should collapse preview pane on right chevron click', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const previewPane = screen.getByText('Preview Content').closest('.preview-pane');
    expect(previewPane).not.toHaveAttribute('data-collapsed', 'true');

    const collapseButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('title') === 'Toggle preview pane'
    );

    if (collapseButton) {
      fireEvent.click(collapseButton);
      expect(previewPane).toHaveAttribute('data-collapsed', 'true');
    }
  });

  it('should toggle fullscreen mode', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const container = screen.getByText('Split View').closest('.split-view-editor');
    expect(container).not.toHaveAttribute('data-fullscreen', 'true');

    const fullscreenButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('title') === 'Toggle fullscreen'
    );

    if (fullscreenButton) {
      fireEvent.click(fullscreenButton);
      expect(container).toHaveAttribute('data-fullscreen', 'true');
    }
  });

  it('should call onRatioChange callback when ratio changes', () => {
    const onRatioChange = vi.fn();

    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
        onRatioChange={onRatioChange}
      />
    );

    const button60_40 = screen.getByText('60/40');
    fireEvent.click(button60_40);

    expect(onRatioChange).toHaveBeenCalled();
  });

  it('should hide divider when a pane is collapsed', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const divider = document.querySelector('.divider');
    expect(divider).toBeInTheDocument();

    const collapseButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('title') === 'Toggle editor pane'
    );

    if (collapseButton) {
      fireEvent.click(collapseButton);

      // Divider should be hidden when pane collapsed
      const dividerAfter = document.querySelector('.divider');
      expect(dividerAfter).not.toBeInTheDocument();
    }
  });

  it('should handle mouse down on divider to start dragging', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
      />
    );

    const divider = document.querySelector('.divider');
    expect(divider).toBeInTheDocument();

    if (divider) {
      fireEvent.mouseDown(divider);
      expect(divider).toHaveClass('bg-blue-500');
    }
  });

  it('should apply custom className', () => {
    const { container } = render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
        className="custom-class"
      />
    );

    const splitView = container.querySelector('.split-view-editor');
    expect(splitView).toHaveClass('custom-class');
  });

  it('should maintain pane widths based on ratio', () => {
    render(
      <SplitViewEditor
        editorContent={mockEditorContent}
        previewContent={mockPreviewContent}
        initialRatio="40/60"
      />
    );

    const editorPane = screen.getByText('Editor Content').closest('.editor-pane') as HTMLElement;
    const previewPane = screen.getByText('Preview Content').closest('.preview-pane') as HTMLElement;

    expect(editorPane.style.width).toBe('40%');
    expect(previewPane.style.width).toBe('60%');
  });
});
