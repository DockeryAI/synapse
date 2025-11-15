/**
 * PropertyInspector Component
 * Property panel for editing selected object properties
 */

import React, { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_FONTS, GOOGLE_FONTS } from '@/types/design-studio.types';

interface PropertyInspectorProps {
  selectedObject: fabric.Object | null;
  onChange: (property: string, value: any) => void;
  onDelete?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
}

/**
 * Property inspector component
 */
export function PropertyInspector({
  selectedObject,
  onChange,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: PropertyInspectorProps) {
  const [properties, setProperties] = useState<any>({});
  const allFonts = [...DEFAULT_FONTS, ...GOOGLE_FONTS];

  // Update properties when object changes
  useEffect(() => {
    if (selectedObject) {
      setProperties({
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
        angle: Math.round(selectedObject.angle || 0),
        opacity: (selectedObject.opacity || 1) * 100,
        fill: (selectedObject as any).fill || '#000000',
        stroke: (selectedObject as any).stroke || '#000000',
        strokeWidth: (selectedObject as any).strokeWidth || 0,
        fontFamily: (selectedObject as any).fontFamily || 'Arial',
        fontSize: (selectedObject as any).fontSize || 16,
        fontWeight: (selectedObject as any).fontWeight || 'normal',
        textAlign: (selectedObject as any).textAlign || 'left',
        locked: selectedObject.lockMovementX || false,
        visible: selectedObject.visible !== false,
      });
    }
  }, [selectedObject]);

  /**
   * Handle property change
   */
  const handleChange = (property: string, value: any) => {
    setProperties((prev: any) => ({ ...prev, [property]: value }));
    onChange(property, value);
  };

  /**
   * Toggle lock
   */
  const toggleLock = () => {
    const newLocked = !properties.locked;
    handleChange('lockMovementX', newLocked);
    handleChange('lockMovementY', newLocked);
    handleChange('lockRotation', newLocked);
    handleChange('lockScalingX', newLocked);
    handleChange('lockScalingY', newLocked);
  };

  /**
   * Toggle visibility
   */
  const toggleVisibility = () => {
    handleChange('visible', !properties.visible);
  };

  if (!selectedObject) {
    return (
      <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">
          Select an object to edit properties
        </p>
      </div>
    );
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'text';
  const isImage = selectedObject.type === 'image';
  const isShape =
    selectedObject.type === 'rect' ||
    selectedObject.type === 'circle' ||
    selectedObject.type === 'triangle' ||
    selectedObject.type === 'polygon';

  return (
    <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Properties</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleLock}
              title={properties.locked ? 'Unlock' : 'Lock'}
            >
              {properties.locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleVisibility}
              title={properties.visible ? 'Hide' : 'Show'}
            >
              {properties.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Position & Size */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Position & Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="left" className="text-xs">
                X
              </Label>
              <Input
                id="left"
                type="number"
                value={properties.left}
                onChange={(e) => handleChange('left', parseInt(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="top" className="text-xs">
                Y
              </Label>
              <Input
                id="top"
                type="number"
                value={properties.top}
                onChange={(e) => handleChange('top', parseInt(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-xs">
                W
              </Label>
              <Input
                id="width"
                type="number"
                value={properties.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">
                H
              </Label>
              <Input
                id="height"
                type="number"
                value={properties.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label htmlFor="angle" className="text-xs font-semibold">
            Rotation
          </Label>
          <Input
            id="angle"
            type="number"
            value={properties.angle}
            onChange={(e) => handleChange('angle', parseInt(e.target.value))}
            min={0}
            max={360}
            className="h-8"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label htmlFor="opacity" className="text-xs font-semibold">
            Opacity: {properties.opacity}%
          </Label>
          <Slider
            id="opacity"
            value={[properties.opacity]}
            onValueChange={([value]) => handleChange('opacity', value / 100)}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <Separator />

        {/* Text Properties */}
        {isText && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fontFamily" className="text-xs font-semibold">
                Font Family
              </Label>
              <Select
                value={properties.fontFamily}
                onValueChange={(value) => handleChange('fontFamily', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allFonts.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize" className="text-xs font-semibold">
                Font Size
              </Label>
              <Input
                id="fontSize"
                type="number"
                value={properties.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                min={8}
                max={144}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Font Weight</Label>
              <div className="flex gap-2">
                <Button
                  variant={properties.fontWeight === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('fontWeight', 'normal')}
                  className="flex-1"
                >
                  Normal
                </Button>
                <Button
                  variant={properties.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('fontWeight', 'bold')}
                  className="flex-1"
                >
                  Bold
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Text Align</Label>
              <div className="flex gap-1">
                <Button
                  variant={properties.textAlign === 'left' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleChange('textAlign', 'left')}
                  className="flex-1"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={properties.textAlign === 'center' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleChange('textAlign', 'center')}
                  className="flex-1"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={properties.textAlign === 'right' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleChange('textAlign', 'right')}
                  className="flex-1"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  variant={properties.textAlign === 'justify' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleChange('textAlign', 'justify')}
                  className="flex-1"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fill" className="text-xs font-semibold">
                Text Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="fill"
                  type="color"
                  value={properties.fill}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={properties.fill}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="h-8 flex-1"
                />
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Shape Properties */}
        {isShape && (
          <>
            <div className="space-y-2">
              <Label htmlFor="shapeFill" className="text-xs font-semibold">
                Fill Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="shapeFill"
                  type="color"
                  value={properties.fill}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={properties.fill}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="h-8 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stroke" className="text-xs font-semibold">
                Stroke Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="stroke"
                  type="color"
                  value={properties.stroke}
                  onChange={(e) => handleChange('stroke', e.target.value)}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={properties.stroke}
                  onChange={(e) => handleChange('stroke', e.target.value)}
                  className="h-8 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strokeWidth" className="text-xs font-semibold">
                Stroke Width
              </Label>
              <Input
                id="strokeWidth"
                type="number"
                value={properties.strokeWidth}
                onChange={(e) => handleChange('strokeWidth', parseInt(e.target.value))}
                min={0}
                max={20}
                className="h-8"
              />
            </div>

            <Separator />
          </>
        )}

        {/* Layer Order */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Layer Order</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onBringToFront}>
              <ChevronsUp className="h-4 w-4 mr-1" />
              To Front
            </Button>
            <Button variant="outline" size="sm" onClick={onSendToBack}>
              <ChevronsDown className="h-4 w-4 mr-1" />
              To Back
            </Button>
            <Button variant="outline" size="sm" onClick={onBringForward}>
              <ChevronUp className="h-4 w-4 mr-1" />
              Forward
            </Button>
            <Button variant="outline" size="sm" onClick={onSendBackward}>
              <ChevronDown className="h-4 w-4 mr-1" />
              Backward
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
