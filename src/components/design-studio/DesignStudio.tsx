/**
 * DesignStudio Component
 * Main container for the visual content creation tool
 */

import React, { useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  X,
  Save,
  Layout,
  Layers,
  Settings,
  Palette,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolPalette } from './ToolPalette';
import { CanvasEditor } from './CanvasEditor';
import { PropertyInspector } from './PropertyInspector';
import { LayerPanel } from './LayerPanel';
import { TemplateLibrary } from './TemplateLibrary';
import { BrandAssets } from './BrandAssets';
import { ExportTools } from './ExportTools';
import { CanvasManager, TemplateManager } from '@/services/design-studio';
import type {
  ToolType,
  ShapeType,
  Template,
  DesignData,
} from '@/types/design-studio.types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DesignStudioProps {
  /** Content item ID if opened from content calendar */
  contentItemId?: string;
  /** Brand ID for loading brand assets */
  brandId: string;
  /** User ID */
  userId: string;
  /** Display mode */
  mode?: 'modal' | 'full-screen';
  /** Initial width */
  initialWidth?: number;
  /** Initial height */
  initialHeight?: number;
  /** Callback when design is saved */
  onSave?: (designData: DesignData) => void;
  /** Callback when studio is closed */
  onClose?: () => void;
}

/**
 * Design Studio main container component
 */
export function DesignStudio({
  contentItemId,
  brandId,
  userId,
  mode = 'modal',
  initialWidth = 1080,
  initialHeight = 1080,
  onSave,
  onClose,
}: DesignStudioProps) {
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rect');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(initialWidth);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [rightPanel, setRightPanel] = useState<'properties' | 'layers' | 'assets' | 'export'>(
    'properties'
  );
  const [showTemplates, setShowTemplates] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);

  /**
   * Load existing design if contentItemId provided
   */
  useEffect(() => {
    if (contentItemId && canvasManager) {
      loadExistingDesign();
    }
  }, [contentItemId, canvasManager]);

  /**
   * Setup auto-save
   */
  useEffect(() => {
    if (!canvasManager) return;

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
    }, 30000);

    setAutoSaveInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [canvasManager, hasUnsavedChanges]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [autoSaveInterval]);

  /**
   * Load existing design from content calendar
   */
  const loadExistingDesign = async () => {
    if (!contentItemId || !canvasManager) return;

    try {
      const { data, error } = await supabase
        .from('content_calendar_items')
        .select('design_data')
        .eq('id', contentItemId)
        .single();

      if (error) throw error;

      if (data?.design_data) {
        const designData = data.design_data as DesignData;

        // Set canvas dimensions
        setCanvasWidth(designData.metadata.width);
        setCanvasHeight(designData.metadata.height);

        // Load design to canvas
        await canvasManager.loadFromJSON(designData.canvas);
        toast.success('Design loaded successfully');
      }
    } catch (error) {
      console.error('Error loading design:', error);
      toast.error('Failed to load design');
    }
  };

  /**
   * Auto-save design
   */
  const handleAutoSave = async () => {
    if (!canvasManager || !contentItemId) return;

    try {
      const designData: DesignData = {
        version: '1.0',
        canvas: canvasManager.toJSON(),
        metadata: {
          width: canvasWidth,
          height: canvasHeight,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const { error } = await supabase
        .from('content_calendar_items')
        .update({
          design_data: designData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentItemId);

      if (error) throw error;

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  /**
   * Handle canvas ready
   */
  const handleCanvasReady = useCallback((manager: CanvasManager) => {
    setCanvasManager(manager);
  }, []);

  /**
   * Handle selection change
   */
  const handleSelectionChange = useCallback((object: fabric.Object | null) => {
    setSelectedObject(object);
  }, []);

  /**
   * Handle canvas change
   */
  const handleCanvasChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Handle property change
   */
  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedObject || !canvasManager) return;

    // Special handling for certain properties
    if (property === 'width' || property === 'height') {
      const currentWidth = (selectedObject.width || 0) * (selectedObject.scaleX || 1);
      const currentHeight = (selectedObject.height || 0) * (selectedObject.scaleY || 1);

      if (property === 'width') {
        selectedObject.scaleX = value / (selectedObject.width || 1);
      } else {
        selectedObject.scaleY = value / (selectedObject.height || 1);
      }
    } else if (property === 'opacity') {
      selectedObject.set('opacity', value);
    } else {
      selectedObject.set(property as any, value);
    }

    selectedObject.setCoords();
    canvasManager.canvas.renderAll();
    handleCanvasChange();
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = async (template: Template) => {
    if (!canvasManager) return;

    try {
      await TemplateManager.loadTemplateToCanvas(template.id, canvasManager.canvas);
      setCanvasWidth(template.width);
      setCanvasHeight(template.height);
      setShowTemplates(false);
      toast.success('Template loaded successfully');
      handleCanvasChange();
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  /**
   * Handle brand asset selection
   */
  const handleColorSelect = (color: string) => {
    if (!selectedObject || !canvasManager) return;

    if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
      handlePropertyChange('fill', color);
    } else {
      handlePropertyChange('fill', color);
    }
  };

  const handleFontSelect = (font: string) => {
    if (!selectedObject || !canvasManager) return;
    if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
      handlePropertyChange('fontFamily', font);
    }
  };

  const handleImageSelect = async (url: string) => {
    if (!canvasManager) return;

    try {
      await canvasManager.addImage(url);
      handleCanvasChange();
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
    }
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    if (!canvasManager) return;

    const designData: DesignData = {
      version: '1.0',
      canvas: canvasManager.toJSON(),
      metadata: {
        width: canvasWidth,
        height: canvasHeight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    onSave?.(designData);
    setHasUnsavedChanges(false);
    toast.success('Design saved successfully');
  };

  /**
   * Handle close with unsaved changes check
   */
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'r':
            setActiveTool('shape');
            break;
          case 'i':
            setActiveTool('image');
            break;
          case 'p':
            setActiveTool('draw');
            break;
          case 'h':
            setActiveTool('hand');
            break;
          case 'z':
            setActiveTool('zoom');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col bg-gray-100',
        mode === 'full-screen' ? 'h-screen' : 'h-[90vh]'
      )}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Design Studio</h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-600">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Layout className="h-4 w-4 mr-2" />
            Templates
          </Button>

          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <ToolPalette
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onShapeSelect={setSelectedShape}
        />

        {/* Canvas Area */}
        <CanvasEditor
          width={canvasWidth}
          height={canvasHeight}
          canvasManager={canvasManager}
          activeTool={activeTool}
          selectedShape={selectedShape}
          onCanvasReady={handleCanvasReady}
          onSelectionChange={handleSelectionChange}
          onCanvasChange={handleCanvasChange}
        />

        {/* Right Sidebar - Tabs */}
        <Tabs value={rightPanel} onValueChange={(v) => setRightPanel(v as any)} className="w-auto">
          <div className="bg-white border-l border-gray-200">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="properties" className="text-xs">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs">
                <Palette className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs">
                <FileDown className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="properties" className="mt-0">
            <PropertyInspector
              selectedObject={selectedObject}
              onChange={handlePropertyChange}
              onDelete={() => canvasManager?.deleteSelected()}
              onBringForward={() => {
                if (selectedObject) canvasManager?.bringForward(selectedObject);
              }}
              onSendBackward={() => {
                if (selectedObject) canvasManager?.sendBackward(selectedObject);
              }}
              onBringToFront={() => {
                if (selectedObject) canvasManager?.bringToFront(selectedObject);
              }}
              onSendToBack={() => {
                if (selectedObject) canvasManager?.sendToBack(selectedObject);
              }}
            />
          </TabsContent>

          <TabsContent value="layers" className="mt-0">
            <LayerPanel
              canvas={canvasManager?.canvas || null}
              selectedObject={selectedObject}
              onSelectObject={(obj) => {
                canvasManager?.selectObject(obj);
                handleSelectionChange(obj);
              }}
              onDeleteObject={(obj) => {
                canvasManager?.removeObject(obj);
                handleCanvasChange();
              }}
              onDuplicateObject={() => {
                canvasManager?.duplicateSelected();
                handleCanvasChange();
              }}
            />
          </TabsContent>

          <TabsContent value="assets" className="mt-0">
            <BrandAssets
              brandId={brandId}
              onColorSelect={handleColorSelect}
              onFontSelect={handleFontSelect}
              onImageSelect={handleImageSelect}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportTools
              canvasManager={canvasManager}
              contentItemId={contentItemId}
              brandId={brandId}
              onSave={handleSave}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Library Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col">
            <TemplateLibrary
              onTemplateSelect={handleTemplateSelect}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
