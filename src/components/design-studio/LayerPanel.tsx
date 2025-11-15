/**
 * LayerPanel Component
 * Layer management panel for canvas objects
 */

import React, { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LayerPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onSelectObject: (object: fabric.Object) => void;
  onDeleteObject: (object: fabric.Object) => void;
  onDuplicateObject: (object: fabric.Object) => void;
  onRefresh?: () => void;
}

interface LayerItem {
  id: string;
  object: fabric.Object;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

/**
 * Layer panel component
 */
export function LayerPanel({
  canvas,
  selectedObject,
  onSelectObject,
  onDeleteObject,
  onDuplicateObject,
  onRefresh,
}: LayerPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);

  /**
   * Update layers when canvas changes
   */
  useEffect(() => {
    if (!canvas) return;

    updateLayers();

    // Listen to canvas events
    const handleObjectAdded = () => updateLayers();
    const handleObjectRemoved = () => updateLayers();
    const handleObjectModified = () => updateLayers();

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
    };
  }, [canvas]);

  /**
   * Update layers list
   */
  const updateLayers = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layerItems: LayerItem[] = objects.map((obj, index) => {
      const id = (obj as any).id || `layer-${index}`;
      const type = obj.type || 'unknown';
      const name = getObjectName(obj, index);

      return {
        id,
        object: obj,
        name,
        type,
        visible: obj.visible !== false,
        locked: obj.lockMovementX || false,
      };
    });

    // Reverse to show top layer first
    setLayers(layerItems.reverse());
  };

  /**
   * Get object name
   */
  const getObjectName = (obj: fabric.Object, index: number): string => {
    const type = obj.type || 'Object';

    switch (type) {
      case 'i-text':
      case 'text':
        const text = (obj as fabric.IText).text || '';
        return text.substring(0, 20) + (text.length > 20 ? '...' : '');

      case 'image':
        return `Image ${index + 1}`;

      case 'rect':
        return `Rectangle ${index + 1}`;

      case 'circle':
        return `Circle ${index + 1}`;

      case 'triangle':
        return `Triangle ${index + 1}`;

      case 'line':
        return `Line ${index + 1}`;

      case 'polygon':
        return `Shape ${index + 1}`;

      default:
        return `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`;
    }
  };

  /**
   * Toggle layer visibility
   */
  const toggleVisibility = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    layer.object.visible = !layer.object.visible;
    canvas?.renderAll();
    updateLayers();
  };

  /**
   * Toggle layer lock
   */
  const toggleLock = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const locked = !layer.locked;
    layer.object.lockMovementX = locked;
    layer.object.lockMovementY = locked;
    layer.object.lockRotation = locked;
    layer.object.lockScalingX = locked;
    layer.object.lockScalingY = locked;
    layer.object.selectable = !locked;
    canvas?.renderAll();
    updateLayers();
  };

  /**
   * Handle layer click
   */
  const handleLayerClick = (layer: LayerItem) => {
    onSelectObject(layer.object);
  };

  /**
   * Handle delete
   */
  const handleDelete = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteObject(layer.object);
  };

  /**
   * Handle duplicate
   */
  const handleDuplicate = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateObject(layer.object);
  };

  /**
   * Get layer icon
   */
  const getLayerIcon = (type: string): string => {
    switch (type) {
      case 'i-text':
      case 'text':
        return 'T';
      case 'image':
        return '🖼️';
      case 'rect':
        return '□';
      case 'circle':
        return '○';
      case 'triangle':
        return '△';
      case 'line':
        return '━';
      case 'polygon':
        return '⬟';
      default:
        return '◇';
    }
  };

  if (!canvas) {
    return (
      <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">No canvas available</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm">Layers</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No layers yet
            </p>
          ) : (
            layers.map((layer) => {
              const isSelected = selectedObject === layer.object;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'group flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors',
                    isSelected && 'bg-blue-50 hover:bg-blue-100'
                  )}
                  onClick={() => handleLayerClick(layer)}
                >
                  {/* Layer icon/thumbnail */}
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">{getLayerIcon(layer.type)}</span>
                  </div>

                  {/* Layer name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{layer.name}</p>
                  </div>

                  {/* Layer controls */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => toggleVisibility(layer, e)}
                      title={layer.visible ? 'Hide' : 'Show'}
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => toggleLock(layer, e)}
                      title={layer.locked ? 'Unlock' : 'Lock'}
                    >
                      {layer.locked ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDuplicate(layer, e)}
                      title="Duplicate"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600"
                      onClick={(e) => handleDelete(layer, e)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
