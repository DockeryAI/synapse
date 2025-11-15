/**
 * CanvasEditor Component
 * Main canvas area with Fabric.js integration
 */

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { ZoomIn, ZoomOut, Maximize2, Grid, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasManager } from '@/services/design-studio';
import type { ToolType, ShapeType } from '@/types/design-studio.types';
import { cn } from '@/lib/utils';

interface CanvasEditorProps {
  width: number;
  height: number;
  canvasManager: CanvasManager | null;
  activeTool: ToolType;
  selectedShape?: ShapeType;
  onCanvasReady: (manager: CanvasManager) => void;
  onSelectionChange: (object: fabric.Object | null) => void;
  onCanvasChange?: () => void;
}

/**
 * Canvas editor component with Fabric.js
 */
export function CanvasEditor({
  width,
  height,
  canvasManager,
  activeTool,
  selectedShape,
  onCanvasReady,
  onSelectionChange,
  onCanvasChange,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /**
   * Initialize canvas
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new CanvasManager(canvasRef.current, width, height);
    onCanvasReady(manager);

    // Setup selection change listener
    manager.canvas.on('selection:created', (e) => {
      onSelectionChange(e.selected?.[0] || null);
      updateUndoRedoState(manager);
    });

    manager.canvas.on('selection:updated', (e) => {
      onSelectionChange(e.selected?.[0] || null);
      updateUndoRedoState(manager);
    });

    manager.canvas.on('selection:cleared', () => {
      onSelectionChange(null);
      updateUndoRedoState(manager);
    });

    manager.canvas.on('object:modified', () => {
      onCanvasChange?.();
      updateUndoRedoState(manager);
    });

    manager.canvas.on('object:added', () => {
      onCanvasChange?.();
      updateUndoRedoState(manager);
    });

    manager.canvas.on('object:removed', () => {
      onCanvasChange?.();
      updateUndoRedoState(manager);
    });

    // Cleanup
    return () => {
      manager.dispose();
    };
  }, [width, height]);

  /**
   * Update undo/redo button states
   */
  const updateUndoRedoState = (manager: CanvasManager) => {
    setCanUndo(manager.canUndo());
    setCanRedo(manager.canRedo());
  };

  /**
   * Handle tool changes
   */
  useEffect(() => {
    if (!canvasManager) return;

    const canvas = canvasManager.canvas;

    // Reset cursor and selection mode
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.selection = true;
    setIsPanning(false);

    switch (activeTool) {
      case 'select':
        canvas.defaultCursor = 'default';
        canvas.isDrawingMode = false;
        break;

      case 'text':
        canvas.defaultCursor = 'text';
        canvas.isDrawingMode = false;
        // Text will be added on click
        break;

      case 'image':
        canvas.defaultCursor = 'crosshair';
        canvas.isDrawingMode = false;
        break;

      case 'shape':
        canvas.defaultCursor = 'crosshair';
        canvas.isDrawingMode = false;
        break;

      case 'draw':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = '#000000';
        break;

      case 'hand':
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        setIsPanning(true);
        break;

      case 'zoom':
        canvas.defaultCursor = 'zoom-in';
        canvas.selection = false;
        break;

      default:
        canvas.defaultCursor = 'default';
        canvas.isDrawingMode = false;
    }
  }, [activeTool, canvasManager]);

  /**
   * Handle canvas click for adding objects
   */
  useEffect(() => {
    if (!canvasManager) return;

    const handleClick = (e: fabric.IEvent) => {
      if (!e.pointer) return;

      switch (activeTool) {
        case 'text':
          canvasManager.addText('Add Text', {
            left: e.pointer.x - 50,
            top: e.pointer.y - 20,
          });
          break;

        case 'shape':
          if (selectedShape) {
            canvasManager.addShape(selectedShape, {
              left: e.pointer.x - 50,
              top: e.pointer.y - 50,
            });
          }
          break;
      }
    };

    canvasManager.canvas.on('mouse:down', handleClick);

    return () => {
      canvasManager.canvas.off('mouse:down', handleClick);
    };
  }, [activeTool, selectedShape, canvasManager]);

  /**
   * Handle panning
   */
  useEffect(() => {
    if (!canvasManager || !isPanning) return;

    const canvas = canvasManager.canvas;
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseDown = (e: fabric.IEvent) => {
      if (!e.e) return;
      isDragging = true;
      canvas.selection = false;
      lastPosX = e.e.clientX;
      lastPosY = e.e.clientY;
      canvas.defaultCursor = 'grabbing';
    };

    const handleMouseMove = (e: fabric.IEvent) => {
      if (!isDragging || !e.e) return;

      const deltaX = e.e.clientX - lastPosX;
      const deltaY = e.e.clientY - lastPosY;

      canvas.relativePan({ x: deltaX, y: deltaY });

      lastPosX = e.e.clientX;
      lastPosY = e.e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      canvas.defaultCursor = 'grab';
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [isPanning, canvasManager]);

  /**
   * Handle zoom
   */
  const handleZoom = (delta: number) => {
    if (!canvasManager) return;
    const newZoom = Math.max(0.1, Math.min(4, zoom + delta));
    setZoom(newZoom);
    canvasManager.setZoom(newZoom);
  };

  /**
   * Fit to viewport
   */
  const handleFitToViewport = () => {
    if (!canvasManager || !containerRef.current) return;
    const container = containerRef.current;
    canvasManager.fitToViewport(
      container.clientWidth - 100,
      container.clientHeight - 100
    );
    setZoom(canvasManager.canvas.getZoom());
  };

  /**
   * Toggle grid
   */
  const handleToggleGrid = () => {
    if (!canvasManager) return;
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    canvasManager.setGrid(newShowGrid, 20);
  };

  /**
   * Handle undo
   */
  const handleUndo = async () => {
    if (!canvasManager) return;
    await canvasManager.undo();
    updateUndoRedoState(canvasManager);
    onCanvasChange?.();
  };

  /**
   * Handle redo
   */
  const handleRedo = async () => {
    if (!canvasManager) return;
    await canvasManager.redo();
    updateUndoRedoState(canvasManager);
    onCanvasChange?.();
  };

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasManager) return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Y, Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvasManager.getSelectedObject();
        if (activeObject && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          canvasManager.deleteSelected();
        }
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        canvasManager.duplicateSelected();
      }

      // Select All: Ctrl+A or Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        canvasManager.selectAll();
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        canvasManager.deselectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasManager]);

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(-0.1)}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="px-2 text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(0.1)}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitToViewport}
            title="Fit to Screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="icon"
          onClick={handleToggleGrid}
          title="Toggle Grid"
        >
          <Grid className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <div className="text-sm text-gray-600">
          {width} × {height}px
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-4"
      >
        <div className="relative" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
