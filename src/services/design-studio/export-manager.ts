/**
 * ExportManager Service
 * Handles export functionality for Design Studio
 */

import * as fabric from 'fabric';
import type { ExportOptions, DesignData, PLATFORM_PRESETS } from '@/types/design-studio.types';
import { supabase } from '@/lib/supabase';

/**
 * Export manager for canvas export operations
 */
export class ExportManager {
  /**
   * Export canvas to Blob file
   * @param canvas - Fabric canvas instance
   * @param options - Export options
   * @returns Blob file
   */
  static exportToFile(canvas: fabric.Canvas, options: ExportOptions): Blob {
    const dataURL = this.exportToDataURL(canvas, options);
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  /**
   * Export canvas to data URL
   * @param canvas - Fabric canvas instance
   * @param options - Export options
   * @returns Data URL string
   */
  static exportToDataURL(canvas: fabric.Canvas, options: ExportOptions): string {
    const {
      format = 'png',
      quality = 1,
      multiplier = 1,
      withoutBackground = false,
      backgroundColor,
    } = options;

    // Store original background
    const originalBg = canvas.backgroundColor;

    // Set transparent or custom background if needed
    if (withoutBackground && format === 'png') {
      canvas.backgroundColor = 'transparent';
    } else if (backgroundColor) {
      canvas.backgroundColor = backgroundColor;
    }

    const dataURL = canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality,
      multiplier,
    });

    // Restore original background
    canvas.backgroundColor = originalBg;
    canvas.renderAll();

    return dataURL;
  }

  /**
   * Download canvas as file
   * @param canvas - Fabric canvas instance
   * @param options - Export options
   * @param filename - Output filename
   */
  static downloadFile(
    canvas: fabric.Canvas,
    options: ExportOptions,
    filename: string
  ): void {
    const blob = this.exportToFile(canvas, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${options.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Save design to content calendar item
   * @param contentItemId - Content calendar item ID
   * @param canvas - Fabric canvas instance
   * @param brandId - Brand ID for storage
   */
  static async saveToContentCalendar(
    contentItemId: string,
    canvas: fabric.Canvas,
    brandId: string
  ): Promise<void> {
    try {
      // Export as PNG
      const blob = this.exportToFile(canvas, {
        format: 'png',
        quality: 1,
        multiplier: 2, // High resolution
      });

      // Upload to Supabase storage
      const filename = `${contentItemId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(`${brandId}/${filename}`, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content-images')
        .getPublicUrl(uploadData.path);

      // Save design data and image URL to content calendar item
      const designData: DesignData = {
        version: '1.0',
        canvas: canvas.toJSON(),
        metadata: {
          width: canvas.width!,
          height: canvas.height!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const { error: updateError } = await supabase
        .from('content_calendar_items')
        .update({
          design_data: designData,
          media_urls: [urlData.publicUrl],
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentItemId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error saving to content calendar:', error);
      throw error;
    }
  }

  /**
   * Save design to brand assets
   * @param brandId - Brand ID
   * @param canvas - Fabric canvas instance
   * @param name - Asset name
   * @returns Public URL of saved asset
   */
  static async saveToBrandAssets(
    brandId: string,
    canvas: fabric.Canvas,
    name: string
  ): Promise<string> {
    try {
      // Export as PNG
      const blob = this.exportToFile(canvas, {
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      // Upload to Supabase storage
      const filename = `${name}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(`${brandId}/${filename}`, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(uploadData.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error saving to brand assets:', error);
      throw error;
    }
  }

  /**
   * Copy canvas image to clipboard
   * @param canvas - Fabric canvas instance
   */
  static async copyToClipboard(canvas: fabric.Canvas): Promise<void> {
    try {
      const blob = this.exportToFile(canvas, {
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      if (navigator.clipboard && ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } else {
        // Fallback: copy data URL
        const dataURL = this.exportToDataURL(canvas, {
          format: 'png',
          quality: 1,
        });
        await navigator.clipboard.writeText(dataURL);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw error;
    }
  }

  /**
   * Resize canvas to platform preset
   * @param canvas - Fabric canvas instance
   * @param presetId - Platform preset ID
   */
  static resizeTo(
    canvas: fabric.Canvas,
    presetId: keyof typeof PLATFORM_PRESETS
  ): void {
    const preset = (PLATFORM_PRESETS as any)[presetId];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    // Calculate scale factor
    const scaleX = preset.width / canvas.width!;
    const scaleY = preset.height / canvas.height!;

    // Scale all objects
    canvas.getObjects().forEach((obj) => {
      obj.scaleX = (obj.scaleX || 1) * scaleX;
      obj.scaleY = (obj.scaleY || 1) * scaleY;
      obj.left = (obj.left || 0) * scaleX;
      obj.top = (obj.top || 0) * scaleY;
      obj.setCoords();
    });

    // Resize canvas
    canvas.setDimensions({
      width: preset.width,
      height: preset.height,
    });

    canvas.renderAll();
  }

  /**
   * Export canvas to SVG
   * @param canvas - Fabric canvas instance
   * @returns SVG string
   */
  static exportToSVG(canvas: fabric.Canvas): string {
    return canvas.toSVG();
  }

  /**
   * Export canvas to PDF (using SVG as intermediate)
   * Note: This requires a PDF library like jsPDF for full implementation
   * @param canvas - Fabric canvas instance
   * @returns Base64 PDF string
   */
  static async exportToPDF(canvas: fabric.Canvas): Promise<string> {
    // For now, return SVG wrapped in data URL
    // In production, integrate jsPDF or similar library
    const svg = this.exportToSVG(canvas);
    const base64 = btoa(svg);
    return `data:application/pdf;base64,${base64}`;
  }

  /**
   * Create thumbnail from canvas
   * @param canvas - Fabric canvas instance
   * @param maxWidth - Maximum thumbnail width
   * @param maxHeight - Maximum thumbnail height
   * @returns Thumbnail data URL
   */
  static createThumbnail(
    canvas: fabric.Canvas,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): string {
    const scale = Math.min(
      maxWidth / canvas.width!,
      maxHeight / canvas.height!,
      1
    );

    return canvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: scale,
    });
  }

  /**
   * Batch export canvas to multiple formats
   * @param canvas - Fabric canvas instance
   * @param formats - Array of formats to export
   * @returns Map of format to data URL
   */
  static batchExport(
    canvas: fabric.Canvas,
    formats: ExportOptions['format'][]
  ): Map<string, string> {
    const results = new Map<string, string>();

    formats.forEach((format) => {
      const dataURL = this.exportToDataURL(canvas, {
        format,
        quality: format === 'jpg' ? 0.9 : 1,
      });
      results.set(format, dataURL);
    });

    return results;
  }

  /**
   * Export canvas with watermark
   * @param canvas - Fabric canvas instance
   * @param watermarkText - Watermark text
   * @param options - Export options
   * @returns Data URL with watermark
   */
  static exportWithWatermark(
    canvas: fabric.Canvas,
    watermarkText: string,
    options: ExportOptions
  ): string {
    // Add watermark text
    const watermark = new fabric.Text(watermarkText, {
      left: canvas.width! - 150,
      top: canvas.height! - 50,
      fontSize: 14,
      fill: 'rgba(0, 0, 0, 0.3)',
      fontFamily: 'Arial',
      selectable: false,
    });

    canvas.add(watermark);
    const dataURL = this.exportToDataURL(canvas, options);
    canvas.remove(watermark);
    canvas.renderAll();

    return dataURL;
  }

  /**
   * Get file size of exported canvas
   * @param canvas - Fabric canvas instance
   * @param options - Export options
   * @returns File size in bytes
   */
  static getExportSize(canvas: fabric.Canvas, options: ExportOptions): number {
    const blob = this.exportToFile(canvas, options);
    return blob.size;
  }

  /**
   * Optimize export for web (balance quality and file size)
   * @param canvas - Fabric canvas instance
   * @returns Optimized data URL
   */
  static optimizeForWeb(canvas: fabric.Canvas): string {
    return this.exportToDataURL(canvas, {
      format: 'jpg',
      quality: 0.85,
      multiplier: 1,
    });
  }

  /**
   * Export for print (high resolution)
   * @param canvas - Fabric canvas instance
   * @returns High-res data URL
   */
  static exportForPrint(canvas: fabric.Canvas): string {
    return this.exportToDataURL(canvas, {
      format: 'png',
      quality: 1,
      multiplier: 3,
    });
  }
}
