# Design Studio

A browser-based visual content creation tool integrated with the Content Calendar. Build platform-optimized social media graphics using a powerful canvas-based editor.

## Overview

The Design Studio is MARBA's Phase 12 feature that enables users to create professional visual content directly in the browser. It uses Fabric.js for canvas manipulation and provides a complete design workflow from templates to export.

## Features

### Core Functionality
- **Canvas Editor**: Full-featured canvas with Fabric.js integration
- **Template Library**: 15 pre-designed templates across 5 platforms
- **Brand Assets**: Integration with brand colors, fonts, logos, and images
- **Export Tools**: Multiple format export (PNG, JPG, SVG, PDF) with platform presets
- **Auto-save**: Automatic saving every 30 seconds
- **Undo/Redo**: 50-step history for all canvas operations

### Design Tools
- **Selection Tool (V)**: Select and move objects
- **Text Tool (T)**: Add and edit text with full typography controls
- **Shape Tool (R)**: Rectangle, circle, triangle, line, star shapes
- **Image Tool (I)**: Upload and manipulate images
- **Draw Tool (P)**: Freehand drawing
- **Crop Tool**: Crop images
- **Pan Tool (H)**: Navigate large canvases
- **Zoom Tool (Z)**: Zoom in/out

### Object Manipulation
- Move, resize, rotate any object
- Layer management (bring to front, send to back)
- Lock/unlock objects
- Show/hide layers
- Duplicate objects (Ctrl+D)
- Group selection
- Alignment guides

### Text Features
- Font family selection (50+ fonts including Google Fonts)
- Font size (8-144px)
- Font weight (normal, bold)
- Text color picker
- Text alignment (left, center, right, justify)
- Line height adjustment
- Letter spacing

### Image Features
- Upload from device
- Load from URL
- Drag-and-drop
- Resize and crop
- Filters: grayscale, sepia, brightness, contrast, blur
- Opacity control
- Flip horizontal/vertical

### Shape Features
- Fill color picker
- Stroke color and width
- Corner radius (rectangles)
- Opacity control

## Components

### DesignStudio.tsx
Main container component that orchestrates all sub-components.

```tsx
import { DesignStudio } from '@/components/design-studio';

<DesignStudio
  contentItemId="optional-content-id"
  brandId="brand-id"
  userId="user-id"
  mode="modal" // or "full-screen"
  initialWidth={1080}
  initialHeight={1080}
  onSave={(designData) => console.log('Saved:', designData)}
  onClose={() => console.log('Closed')}
/>
```

### CanvasEditor.tsx
Canvas area with Fabric.js integration and toolbar controls.

### ToolPalette.tsx
Vertical toolbar with all design tools and keyboard shortcuts.

### PropertyInspector.tsx
Right panel for editing selected object properties.

### LayerPanel.tsx
Layer management with visibility, lock, and reordering.

### TemplateLibrary.tsx
Template browser with 15 built-in templates, filtering, and favorites.

### BrandAssets.tsx
Brand colors, fonts, logos, uploaded images, and Unsplash integration.

### ExportTools.tsx
Export controls with format, quality, resolution, and platform presets.

## Services

### CanvasManager
Core service for all canvas operations:
- Object manipulation (add, move, resize, rotate)
- History management (undo/redo)
- Export to JSON/Data URL
- Load from JSON

### TemplateManager
Template CRUD operations:
- Get templates (with filtering)
- Load template to canvas
- Save custom templates
- Built-in template library (15 templates)

### ExportManager
Export functionality:
- Export to file (PNG, JPG, SVG, PDF)
- Download to device
- Save to Content Calendar
- Save to Brand Assets
- Copy to clipboard
- Platform preset resizing

## Templates

The system includes 15 pre-designed templates:

### Instagram (5)
1. Quote Card (1080×1080) - Inspirational quote with gradient
2. Product Showcase (1080×1080) - Clean product display
3. Story Announcement (1080×1920) - Bold vertical announcement
4. Behind the Scenes (1080×1920) - BTS story template
5. Tips & Tricks (1080×1080) - Educational carousel

### Facebook (5)
1. Event Promo (1200×630) - Event promotion
2. Brand Header (820×312) - Cover photo
3. Lead Gen Ad (1200×628) - Lead generation
4. Flash Sale (1080×1920) - Urgent sale promotion
5. Community Cover (1640×856) - Group cover

### LinkedIn (5)
1. Professional Quote (1200×627)
2. Thought Leadership (1200×627)
3. B2B Offer (1200×627)
4. Company Profile (1584×396)
5. Presentation Slide (1280×720)

## Keyboard Shortcuts

### Tools
- `V` - Select tool
- `T` - Text tool
- `R` - Shape tool
- `I` - Image tool
- `P` - Draw tool
- `H` - Pan tool
- `Z` - Zoom tool

### Edit Operations
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Shift+Z` - Redo
- `Ctrl+C` / `Cmd+C` - Copy
- `Ctrl+V` / `Cmd+V` - Paste
- `Ctrl+D` / `Cmd+D` - Duplicate
- `Ctrl+A` / `Cmd+A` - Select All
- `Delete` / `Backspace` - Delete
- `Escape` - Deselect

### Layer Operations
- `Ctrl+]` / `Cmd+]` - Bring Forward
- `Ctrl+[` / `Cmd+[` - Send Backward
- `Ctrl+Shift+]` / `Cmd+Shift+]` - Bring to Front
- `Ctrl+Shift+[` / `Cmd+Shift+[` - Send to Back

### Save
- `Ctrl+S` / `Cmd+S` - Save

## Database Schema

### design_templates
Stores design templates.

```sql
- id: UUID
- brand_id: UUID (optional, for custom templates)
- name: TEXT
- description: TEXT
- category: TEXT (Social Post, Story, Ad, Banner, Thumbnail, Infographic)
- platform: TEXT (instagram, facebook, linkedin, twitter, tiktok)
- width: INTEGER
- height: INTEGER
- thumbnail: TEXT
- design_data: JSONB (Fabric.js canvas JSON)
- is_premium: BOOLEAN
- is_custom: BOOLEAN
- created_by: UUID
- tags: TEXT[]
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### content_calendar_items (enhanced)
Enhanced with design data fields.

```sql
- design_data: JSONB (Design Studio canvas data)
- image_url: TEXT (deprecated - use media_urls)
- media_urls: TEXT[] (array of image/video URLs)
- hashtags: TEXT[]
```

## Storage Buckets

### content-images
Stores exported designs attached to content calendar items.
- Path: `{brandId}/{filename}`
- Public: Yes

### brand-assets
Stores user-uploaded brand assets.
- Path: `{brandId}/{filename}`
- Public: Yes

## Integration with Content Calendar

The Design Studio is integrated into the ContentCalendarHub:

1. **"Design Studio" button** - Opens blank canvas
2. **Content item context** - Opens with existing design data
3. **Auto-save** - Saves to content_calendar_items.design_data
4. **Export** - Exports and attaches to content_calendar_items.media_urls

## Usage Example

```tsx
import { DesignStudio } from '@/components/design-studio';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function MyComponent() {
  const [showDesignStudio, setShowDesignStudio] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDesignStudio(true)}>
        Create Visual
      </Button>

      <Dialog open={showDesignStudio} onOpenChange={setShowDesignStudio}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0">
          <DesignStudio
            brandId="brand-123"
            userId="user-123"
            mode="modal"
            onSave={(designData) => {
              console.log('Design saved:', designData);
              setShowDesignStudio(false);
            }}
            onClose={() => setShowDesignStudio(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Platform Presets

Pre-configured canvas sizes for each platform:

| Preset | Platform | Dimensions | Description |
|--------|----------|------------|-------------|
| instagram-post | Instagram | 1080×1080 | Square post |
| instagram-story | Instagram | 1080×1920 | Vertical story |
| facebook-post | Facebook | 1200×630 | Standard post |
| facebook-cover | Facebook | 820×312 | Cover photo |
| linkedin-post | LinkedIn | 1200×627 | Feed post |
| linkedin-banner | LinkedIn | 1584×396 | Profile banner |
| twitter-post | Twitter | 1600×900 | Post image |
| twitter-header | Twitter | 1500×500 | Profile header |
| tiktok-video | TikTok | 1080×1920 | Video thumbnail |

## Type Safety

All components and services are fully typed with TypeScript:

```typescript
import type {
  ToolType,
  ShapeType,
  Template,
  DesignData,
  ExportOptions,
  PlatformPreset,
} from '@/types/design-studio.types';
```

## Future Enhancements

Potential future additions:
- [ ] Unsplash API integration (requires API key)
- [ ] More templates (user-contributed)
- [ ] AI-powered design suggestions
- [ ] Collaborative editing
- [ ] Animation support
- [ ] Video thumbnail creation
- [ ] Brand kit presets
- [ ] Smart object alignment
- [ ] Design version history
- [ ] A/B testing variants

## Dependencies

- **fabric**: ^5.3.0 - Canvas manipulation library
- **lucide-react**: Icons
- **@radix-ui/***: UI components
- **sonner**: Toast notifications

## License

Part of MARBA Mirror platform.
