/**
 * SplitViewEditor - Resizable split-view interface for campaign editing
 * Left pane: Campaign editor | Right pane: Live preview
 *
 * Features:
 * - Adjustable split ratio (40/60, 50/50, 60/40)
 * - Collapse/expand either pane
 * - Full-screen preview mode
 * - Sync scroll between editor and preview
 * - Responsive: Stack vertically on mobile
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SplitViewConfig, SplitViewRatio, SplitViewPane } from '../../../types/v2/preview.types';

interface SplitViewEditorProps {
  editorContent: React.ReactNode;
  previewContent: React.ReactNode;
  initialRatio?: SplitViewRatio;
  onRatioChange?: (ratio: number) => void;
  className?: string;
}

export const SplitViewEditor: React.FC<SplitViewEditorProps> = ({
  editorContent,
  previewContent,
  initialRatio = '50/50',
  onRatioChange,
  className = '',
}) => {
  const [config, setConfig] = useState<SplitViewConfig>({
    ratio: initialRatio,
    fullScreenMode: false,
    syncScroll: true,
    dividerPosition: parseRatio(initialRatio),
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Parse ratio string to percentage
  function parseRatio(ratio: SplitViewRatio): number {
    const [left] = ratio.split('/').map(Number);
    return (left / 100) * 100;
  }

  // Convert percentage to ratio string
  function percentageToRatio(percentage: number): SplitViewRatio {
    if (percentage < 45) return '40/60';
    if (percentage > 55) return '60/40';
    return '50/50';
  }

  // Handle mouse down on divider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move (resize)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - container.left) / container.width) * 100;

      // Clamp between 20% and 80%
      const clampedPosition = Math.max(20, Math.min(80, newPosition));

      setConfig((prev) => ({
        ...prev,
        dividerPosition: clampedPosition,
        ratio: percentageToRatio(clampedPosition),
      }));

      onRatioChange?.(clampedPosition);
    },
    [isDragging, onRatioChange]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle pane collapse
  const toggleCollapsePane = (pane: SplitViewPane) => {
    setConfig((prev) => ({
      ...prev,
      collapsedPane: prev.collapsedPane === pane ? undefined : pane,
    }));
  };

  // Handle full-screen toggle
  const toggleFullScreen = () => {
    setConfig((prev) => ({
      ...prev,
      fullScreenMode: !prev.fullScreenMode,
    }));
  };

  // Handle sync scroll toggle
  const toggleSyncScroll = () => {
    setConfig((prev) => ({
      ...prev,
      syncScroll: !prev.syncScroll,
    }));
  };

  // Sync scroll between panes
  const handleEditorScroll = useCallback(() => {
    if (!config.syncScroll || !editorRef.current || !previewRef.current) return;

    const editorElement = editorRef.current;
    const previewElement = previewRef.current;

    const scrollPercentage =
      editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);

    previewElement.scrollTop =
      scrollPercentage * (previewElement.scrollHeight - previewElement.clientHeight);
  }, [config.syncScroll]);

  // Quick ratio presets
  const setQuickRatio = (ratio: SplitViewRatio) => {
    const position = parseRatio(ratio);
    setConfig((prev) => ({
      ...prev,
      ratio,
      dividerPosition: position,
    }));
    onRatioChange?.(position);
  };

  // Calculate pane widths
  const editorWidth = config.collapsedPane === 'editor'
    ? '0%'
    : config.collapsedPane === 'preview'
    ? '100%'
    : `${config.dividerPosition}%`;

  const previewWidth = config.collapsedPane === 'preview'
    ? '0%'
    : config.collapsedPane === 'editor'
    ? '100%'
    : `${100 - config.dividerPosition}%`;

  return (
    <div
      ref={containerRef}
      className={`split-view-editor relative h-full w-full overflow-hidden bg-gray-50 ${className}`}
      data-fullscreen={config.fullScreenMode}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Split View</span>

          {/* Quick ratio buttons */}
          <div className="flex gap-1 ml-4">
            {(['40/60', '50/50', '60/40'] as SplitViewRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setQuickRatio(ratio)}
                className={`px-2 py-1 text-xs rounded ${
                  config.ratio === ratio
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync scroll toggle */}
          <button
            onClick={toggleSyncScroll}
            className={`px-3 py-1 text-xs rounded ${
              config.syncScroll
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {config.syncScroll ? 'Sync: ON' : 'Sync: OFF'}
          </button>

          {/* Collapse buttons */}
          <button
            onClick={() => toggleCollapsePane('editor')}
            className="p-1 rounded hover:bg-gray-100"
            title="Toggle editor pane"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleCollapsePane('preview')}
            className="p-1 rounded hover:bg-gray-100"
            title="Toggle preview pane"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Full-screen toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-1 rounded hover:bg-gray-100"
            title="Toggle fullscreen"
          >
            {config.fullScreenMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Split panes container */}
      <div className="flex h-[calc(100%-3rem)] w-full">
        {/* Editor pane */}
        <div
          ref={editorRef}
          className="editor-pane h-full overflow-y-auto transition-all duration-300 ease-in-out"
          style={{ width: editorWidth }}
          onScroll={handleEditorScroll}
          data-collapsed={config.collapsedPane === 'editor'}
        >
          {config.collapsedPane !== 'editor' && (
            <div className="p-4">
              {editorContent}
            </div>
          )}
        </div>

        {/* Resizable divider */}
        {!config.collapsedPane && (
          <div
            className={`divider relative w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors ${
              isDragging ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full" />
          </div>
        )}

        {/* Preview pane */}
        <div
          ref={previewRef}
          className="preview-pane h-full overflow-y-auto bg-white transition-all duration-300 ease-in-out"
          style={{ width: previewWidth }}
          data-collapsed={config.collapsedPane === 'preview'}
        >
          {config.collapsedPane !== 'preview' && (
            <div className="p-4">
              {previewContent}
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive: show stack message */}
      <div className="md:hidden absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Split view is best experienced on larger screens.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            On mobile, editor and preview are stacked vertically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplitViewEditor;
