/**
 * CanvasManager Service
 * Manages Fabric.js canvas operations for Design Studio
 */

import * as fabric from 'fabric';
import type {
  CanvasState,
  ShapeType,
  ImageFilter,
} from '@/types/design-studio.types';

/**
 * Maximum history states to maintain
 */
const MAX_HISTORY_SIZE = 50;

/**
 * CanvasManager class for managing all canvas operations
 */
export class CanvasManager {
  public canvas: fabric.Canvas;
  private history: CanvasState[] = [];
  private historyIndex: number = -1;
  private isRedoing: boolean = false;
  private isUndoing: boolean = false;

  /**
   * Initialize canvas manager
   * @param canvasElement - HTML canvas element
   * @param width - Canvas width
   * @param height - Canvas height
   */
  constructor(canvasElement: HTMLCanvasElement, width: number = 1080, height: number = 1080) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    // Enable object selection
    this.canvas.selection = true;

    // Setup event listeners for history
    this.setupHistoryListeners();

    // Save initial state
    this.saveState();
  }

  /**
   * Setup event listeners for history tracking
   */
  private setupHistoryListeners(): void {
    // Track object modifications
    this.canvas.on('object:added', () => {
      if (!this.isRedoing && !this.isUndoing) {
        this.saveState();
      }
    });

    this.canvas.on('object:modified', () => {
      if (!this.isRedoing && !this.isUndoing) {
        this.saveState();
      }
    });

    this.canvas.on('object:removed', () => {
      if (!this.isRedoing && !this.isUndoing) {
        this.saveState();
      }
    });
  }

  /**
   * Add text to canvas
   * @param text - Text content
   * @param options - Text options
   * @returns Created text object
   */
  addText(text: string = 'Add Text', options?: Partial<fabric.ITextOptions>): fabric.IText {
    const textObject = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
      ...options,
    });

    this.canvas.add(textObject);
    this.canvas.setActiveObject(textObject);
    this.canvas.renderAll();

    return textObject;
  }

  /**
   * Add image to canvas from URL
   * @param url - Image URL
   * @param options - Image options
   * @returns Promise resolving to image object
   */
  async addImage(url: string, options?: Partial<fabric.IImageOptions>): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        url,
        (img) => {
          if (!img) {
            reject(new Error('Failed to load image'));
            return;
          }

          // Scale image to fit canvas if too large
          const maxWidth = this.canvas.width! * 0.8;
          const maxHeight = this.canvas.height! * 0.8;

          if (img.width! > maxWidth || img.height! > maxHeight) {
            const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
            img.scale(scale);
          }

          img.set({
            left: 50,
            top: 50,
            ...options,
          });

          this.canvas.add(img);
          this.canvas.setActiveObject(img);
          this.canvas.renderAll();

          resolve(img);
        },
        { crossOrigin: 'anonymous' }
      );
    });
  }

  /**
   * Add shape to canvas
   * @param type - Shape type
   * @param options - Shape options
   * @returns Created shape object
   */
  addShape(type: ShapeType, options?: any): fabric.Object {
    let shape: fabric.Object;

    const defaultOptions = {
      left: 100,
      top: 100,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      ...options,
    };

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          width: 200,
          height: 150,
          ...defaultOptions,
        });
        break;

      case 'circle':
        shape = new fabric.Circle({
          radius: 75,
          ...defaultOptions,
        });
        break;

      case 'triangle':
        shape = new fabric.Triangle({
          width: 150,
          height: 150,
          ...defaultOptions,
        });
        break;

      case 'line':
        shape = new fabric.Line([50, 50, 250, 50], {
          stroke: defaultOptions.stroke,
          strokeWidth: defaultOptions.strokeWidth,
        });
        break;

      case 'star':
        // Create star using polygon
        const points = this.createStarPoints(5, 75, 35);
        shape = new fabric.Polygon(points, {
          ...defaultOptions,
        });
        break;

      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }

    this.canvas.add(shape);
    this.canvas.setActiveObject(shape);
    this.canvas.renderAll();

    return shape;
  }

  /**
   * Create star points for polygon
   * @param numPoints - Number of star points
   * @param outerRadius - Outer radius
   * @param innerRadius - Inner radius
   * @returns Array of points
   */
  private createStarPoints(
    numPoints: number,
    outerRadius: number,
    innerRadius: number
  ): fabric.Point[] {
    const points: fabric.Point[] = [];
    const angle = Math.PI / numPoints;

    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(i * angle - Math.PI / 2) * radius;
      const y = Math.sin(i * angle - Math.PI / 2) * radius;
      points.push(new fabric.Point(x, y));
    }

    return points;
  }

  /**
   * Get currently selected object
   * @returns Selected object or null
   */
  getSelectedObject(): fabric.Object | null {
    return this.canvas.getActiveObject() || null;
  }

  /**
   * Select an object
   * @param object - Object to select
   */
  selectObject(object: fabric.Object): void {
    this.canvas.setActiveObject(object);
    this.canvas.renderAll();
  }

  /**
   * Deselect all objects
   */
  deselectAll(): void {
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  /**
   * Move object to position
   * @param object - Object to move
   * @param x - X position
   * @param y - Y position
   */
  moveObject(object: fabric.Object, x: number, y: number): void {
    object.set({ left: x, top: y });
    this.canvas.renderAll();
  }

  /**
   * Resize object
   * @param object - Object to resize
   * @param width - New width
   * @param height - New height
   */
  resizeObject(object: fabric.Object, width: number, height: number): void {
    object.set({
      width,
      height,
      scaleX: 1,
      scaleY: 1,
    });
    this.canvas.renderAll();
  }

  /**
   * Rotate object
   * @param object - Object to rotate
   * @param angle - Rotation angle in degrees
   */
  rotateObject(object: fabric.Object, angle: number): void {
    object.set({ angle });
    this.canvas.renderAll();
  }

  /**
   * Bring object to front
   * @param object - Object to move
   */
  bringToFront(object: fabric.Object): void {
    this.canvas.bringToFront(object);
    this.canvas.renderAll();
  }

  /**
   * Send object to back
   * @param object - Object to move
   */
  sendToBack(object: fabric.Object): void {
    this.canvas.sendToBack(object);
    this.canvas.renderAll();
  }

  /**
   * Bring object forward one layer
   * @param object - Object to move
   */
  bringForward(object: fabric.Object): void {
    this.canvas.bringForward(object);
    this.canvas.renderAll();
  }

  /**
   * Send object backward one layer
   * @param object - Object to move
   */
  sendBackward(object: fabric.Object): void {
    this.canvas.sendBackward(object);
    this.canvas.renderAll();
  }

  /**
   * Delete selected object(s)
   */
  deleteSelected(): void {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => this.canvas.remove(obj));
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
    }
  }

  /**
   * Duplicate selected object(s)
   */
  duplicateSelected(): void {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      this.canvas.add(cloned);
      this.canvas.setActiveObject(cloned);
      this.canvas.renderAll();
    });
  }

  /**
   * Center object on canvas
   * @param object - Object to center
   */
  centerObject(object: fabric.Object): void {
    this.canvas.centerObject(object);
    this.canvas.renderAll();
  }

  /**
   * Apply filter to image object
   * @param image - Image object
   * @param filterType - Filter type
   */
  applyImageFilter(image: fabric.Image, filterType: ImageFilter): void {
    if (!image.filters) {
      image.filters = [];
    }

    let filter;
    switch (filterType) {
      case 'grayscale':
        filter = new fabric.Image.filters.Grayscale();
        break;
      case 'sepia':
        filter = new fabric.Image.filters.Sepia();
        break;
      case 'brightness':
        filter = new fabric.Image.filters.Brightness({ brightness: 0.2 });
        break;
      case 'contrast':
        filter = new fabric.Image.filters.Contrast({ contrast: 0.2 });
        break;
      case 'blur':
        filter = new fabric.Image.filters.Blur({ blur: 0.5 });
        break;
    }

    if (filter) {
      image.filters.push(filter);
      image.applyFilters();
      this.canvas.renderAll();
    }
  }

  /**
   * Clear all image filters
   * @param image - Image object
   */
  clearImageFilters(image: fabric.Image): void {
    image.filters = [];
    image.applyFilters();
    this.canvas.renderAll();
  }

  /**
   * Save current canvas state to history
   */
  saveState(): void {
    if (this.isRedoing || this.isUndoing) return;

    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add new state
    const state: CanvasState = {
      json: this.canvas.toJSON(),
      timestamp: Date.now(),
    };

    this.history.push(state);

    // Limit history size
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Undo last action
   */
  async undo(): Promise<void> {
    if (this.historyIndex <= 0) return;

    this.isUndoing = true;
    this.historyIndex--;

    await this.loadFromJSON(this.history[this.historyIndex].json);
    this.isUndoing = false;
  }

  /**
   * Redo last undone action
   */
  async redo(): Promise<void> {
    if (this.historyIndex >= this.history.length - 1) return;

    this.isRedoing = true;
    this.historyIndex++;

    await this.loadFromJSON(this.history[this.historyIndex].json);
    this.isRedoing = false;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Set canvas dimensions
   * @param width - Canvas width
   * @param height - Canvas height
   */
  setDimensions(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
    this.canvas.renderAll();
  }

  /**
   * Set canvas zoom level
   * @param zoom - Zoom level (1 = 100%)
   */
  setZoom(zoom: number): void {
    this.canvas.setZoom(zoom);
    this.canvas.renderAll();
  }

  /**
   * Fit canvas to viewport
   */
  fitToViewport(containerWidth: number, containerHeight: number): void {
    const scaleX = containerWidth / this.canvas.width!;
    const scaleY = containerHeight / this.canvas.height!;
    const zoom = Math.min(scaleX, scaleY, 1);
    this.setZoom(zoom);
  }

  /**
   * Export canvas to data URL
   * @param format - Export format
   * @param quality - Quality (0-1) for JPG
   * @returns Data URL
   */
  toDataURL(format: 'png' | 'jpg' = 'png', quality: number = 1): string {
    return this.canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality,
      multiplier: 1,
    });
  }

  /**
   * Export canvas to JSON
   * @returns Canvas JSON representation
   */
  toJSON(): object {
    return this.canvas.toJSON();
  }

  /**
   * Load canvas from JSON
   * @param json - Canvas JSON
   */
  async loadFromJSON(json: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.canvas.loadFromJSON(json, () => {
        this.canvas.renderAll();
        resolve();
      }, (error: any) => {
        reject(error);
      });
    });
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.renderAll();
  }

  /**
   * Get all objects on canvas
   * @returns Array of objects
   */
  getAllObjects(): fabric.Object[] {
    return this.canvas.getObjects();
  }

  /**
   * Remove object from canvas
   * @param object - Object to remove
   */
  removeObject(object: fabric.Object): void {
    this.canvas.remove(object);
    this.canvas.renderAll();
  }

  /**
   * Select all objects
   */
  selectAll(): void {
    const allObjects = this.canvas.getObjects();
    if (allObjects.length === 0) return;

    const selection = new fabric.ActiveSelection(allObjects, {
      canvas: this.canvas,
    });
    this.canvas.setActiveObject(selection);
    this.canvas.renderAll();
  }

  /**
   * Set canvas background color
   * @param color - Background color
   */
  setBackgroundColor(color: string): void {
    this.canvas.backgroundColor = color;
    this.canvas.renderAll();
  }

  /**
   * Enable/disable grid
   * @param enabled - Enable grid
   * @param gridSize - Grid size in pixels
   */
  setGrid(enabled: boolean, gridSize: number = 20): void {
    if (enabled) {
      // Create grid pattern
      const grid = this.createGridPattern(gridSize);
      this.canvas.setBackgroundColor(
        {
          source: grid,
          repeat: 'repeat',
        } as any,
        () => {
          this.canvas.renderAll();
        }
      );
    } else {
      this.canvas.backgroundColor = '#ffffff';
      this.canvas.renderAll();
    }
  }

  /**
   * Create grid pattern
   * @param gridSize - Grid size
   * @returns Canvas element with grid
   */
  private createGridPattern(gridSize: number): HTMLCanvasElement {
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridSize;
    gridCanvas.height = gridSize;
    const ctx = gridCanvas.getContext('2d')!;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gridSize, 0);
    ctx.lineTo(gridSize, gridSize);
    ctx.lineTo(0, gridSize);
    ctx.stroke();

    return gridCanvas;
  }

  /**
   * Dispose canvas and cleanup
   */
  dispose(): void {
    this.canvas.dispose();
    this.history = [];
    this.historyIndex = -1;
  }
}
