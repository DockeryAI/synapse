/**
 * ToolPalette Component
 * Vertical toolbar for selecting design tools
 */

import React from 'react';
import {
  MousePointer,
  Type,
  Square,
  Image,
  Pencil,
  Crop,
  Hand,
  ZoomIn,
  Circle,
  Triangle,
  Minus,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ToolType, ShapeType } from '@/types/design-studio.types';

interface ToolPaletteProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onShapeSelect?: (shape: ShapeType) => void;
}

interface Tool {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
  hasSubmenu?: boolean;
}

const tools: Tool[] = [
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'shape', icon: Square, label: 'Shape', shortcut: 'R', hasSubmenu: true },
  { id: 'image', icon: Image, label: 'Image', shortcut: 'I' },
  { id: 'draw', icon: Pencil, label: 'Draw', shortcut: 'P' },
  { id: 'crop', icon: Crop, label: 'Crop', shortcut: '' },
  { id: 'hand', icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', shortcut: 'Z' },
];

const shapes: Array<{ type: ShapeType; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { type: 'rect', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'triangle', icon: Triangle, label: 'Triangle' },
  { type: 'line', icon: Minus, label: 'Line' },
  { type: 'star', icon: Star, label: 'Star' },
];

/**
 * Tool palette component with vertical toolbar
 */
export function ToolPalette({
  activeTool,
  onToolChange,
  onShapeSelect,
}: ToolPaletteProps) {
  /**
   * Handle tool click
   */
  const handleToolClick = (toolId: ToolType) => {
    onToolChange(toolId);
  };

  /**
   * Handle shape selection
   */
  const handleShapeClick = (shape: ShapeType) => {
    onToolChange('shape');
    onShapeSelect?.(shape);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1 p-2 bg-white border-r border-gray-200">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          // Shape tool with submenu
          if (tool.hasSubmenu && tool.id === 'shape') {
            return (
              <DropdownMenu key={tool.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="icon"
                        className="w-10 h-10"
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      {tool.label}
                      {tool.shortcut && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({tool.shortcut})
                        </span>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent side="right" align="start">
                  {shapes.map((shape) => {
                    const ShapeIcon = shape.icon;
                    return (
                      <DropdownMenuItem
                        key={shape.type}
                        onClick={() => handleShapeClick(shape.type)}
                      >
                        <ShapeIcon className="h-4 w-4 mr-2" />
                        {shape.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          // Regular tool
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  className="w-10 h-10"
                  onClick={() => handleToolClick(tool.id)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>
                  {tool.label}
                  {tool.shortcut && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({tool.shortcut})
                    </span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
