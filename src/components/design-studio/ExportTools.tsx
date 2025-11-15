/**
 * ExportTools Component
 * Export functionality with platform presets
 */

import React, { useState } from 'react';
import { Download, Save, Copy, Image as ImageIcon, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ExportManager } from '@/services/design-studio';
import { PLATFORM_PRESETS } from '@/types/design-studio.types';
import type { ExportOptions } from '@/types/design-studio.types';
import type { CanvasManager } from '@/services/design-studio';
import { toast } from 'sonner';

interface ExportToolsProps {
  canvasManager: CanvasManager | null;
  contentItemId?: string;
  brandId: string;
  onSave?: () => void;
}

/**
 * Export tools component
 */
export function ExportTools({
  canvasManager,
  contentItemId,
  brandId,
  onSave,
}: ExportToolsProps) {
  const [format, setFormat] = useState<ExportOptions['format']>('png');
  const [quality, setQuality] = useState(90);
  const [multiplier, setMultiplier] = useState(1);
  const [withoutBackground, setWithoutBackground] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [loading, setLoading] = useState(false);

  /**
   * Get export options
   */
  const getExportOptions = (): ExportOptions => ({
    format,
    quality: quality / 100,
    multiplier,
    withoutBackground: withoutBackground && format === 'png',
  });

  /**
   * Download to device
   */
  const handleDownload = () => {
    if (!canvasManager) return;

    try {
      const options = getExportOptions();
      const filename = `design-${Date.now()}`;
      ExportManager.downloadFile(canvasManager.canvas, options, filename);
      toast.success('Design downloaded successfully');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download design');
    }
  };

  /**
   * Save to content calendar
   */
  const handleSaveToCalendar = async () => {
    if (!canvasManager || !contentItemId) return;

    setLoading(true);
    try {
      await ExportManager.saveToContentCalendar(
        contentItemId,
        canvasManager.canvas,
        brandId
      );
      toast.success('Design saved to content calendar');
      onSave?.();
    } catch (error) {
      console.error('Error saving to calendar:', error);
      toast.error('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save to brand assets
   */
  const handleSaveToBrandAssets = async () => {
    if (!canvasManager) return;

    setLoading(true);
    try {
      const name = prompt('Enter asset name:');
      if (!name) return;

      await ExportManager.saveToBrandAssets(brandId, canvasManager.canvas, name);
      toast.success('Design saved to brand assets');
    } catch (error) {
      console.error('Error saving to brand assets:', error);
      toast.error('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!canvasManager) return;

    try {
      await ExportManager.copyToClipboard(canvasManager.canvas);
      toast.success('Design copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy design');
    }
  };

  /**
   * Resize to preset
   */
  const handleResizeToPreset = () => {
    if (!canvasManager || !selectedPreset) return;

    try {
      ExportManager.resizeTo(canvasManager.canvas, selectedPreset as any);
      toast.success('Canvas resized to preset');
    } catch (error) {
      console.error('Error resizing:', error);
      toast.error('Failed to resize canvas');
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm">Export</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Platform Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Platform Preset</Label>
          <div className="flex gap-2">
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleResizeToPreset}
              disabled={!selectedPreset}
            >
              Resize
            </Button>
          </div>
          {selectedPreset && (
            <p className="text-xs text-gray-500">
              {PLATFORM_PRESETS[selectedPreset as keyof typeof PLATFORM_PRESETS].width} ×{' '}
              {PLATFORM_PRESETS[selectedPreset as keyof typeof PLATFORM_PRESETS].height}px
            </p>
          )}
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Format</Label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as ExportOptions['format'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quality (for JPG) */}
        {format === 'jpg' && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Quality: {quality}%</Label>
            <Slider
              value={[quality]}
              onValueChange={([value]) => setQuality(value)}
              min={10}
              max={100}
              step={5}
            />
          </div>
        )}

        {/* Resolution */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Resolution</Label>
          <Select
            value={multiplier.toString()}
            onValueChange={(value) => setMultiplier(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1x (Standard)</SelectItem>
              <SelectItem value="2">2x (Retina)</SelectItem>
              <SelectItem value="3">3x (High-res)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transparent Background (PNG only) */}
        {format === 'png' && (
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Transparent Background</Label>
            <Switch
              checked={withoutBackground}
              onCheckedChange={setWithoutBackground}
            />
          </div>
        )}

        {/* File Size Estimate */}
        {canvasManager && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">
              Estimated size:{' '}
              <span className="font-medium">
                ~
                {Math.round(
                  (canvasManager.canvas.width! *
                    canvasManager.canvas.height! *
                    multiplier *
                    multiplier *
                    (format === 'png' ? 4 : 3)) /
                    1024
                )}{' '}
                KB
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          className="w-full"
          onClick={handleDownload}
          disabled={!canvasManager}
        >
          <Download className="h-4 w-4 mr-2" />
          Download to Device
        </Button>

        {contentItemId && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleSaveToCalendar}
            disabled={!canvasManager || loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save to Content Calendar
          </Button>
        )}

        <Button
          className="w-full"
          variant="outline"
          onClick={handleSaveToBrandAssets}
          disabled={!canvasManager || loading}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Save to Brand Assets
        </Button>

        <Button
          className="w-full"
          variant="outline"
          onClick={handleCopyToClipboard}
          disabled={!canvasManager}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy to Clipboard
        </Button>
      </div>
    </div>
  );
}
