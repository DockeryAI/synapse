# Worktree Task: Multi-Platform Video Editor

**Feature ID:** `video-editor-multi-platform`
**Branch:** `feature/video-editor`
**Estimated Time:** 40 hours
**Priority:** HIGH
**Phase:** 1C - Video Capabilities
**Dependencies:** None
**Worktree Path:** `../synapse-video-editor`

---

## Context

Browser-based video editor with TikTok/Instagram parity. Trim, add text overlays, music, transitions, filters, auto-captions. Uses open-source stack (FFmpeg.wasm, Remotion, Whisper) for zero monthly costs.

**Key Features:**
- Video trimming and cutting
- Text overlays with animations
- Music/audio overlay
- Transitions (fade, slide, zoom)
- Filters and effects
- Speed control (slow-mo, time-lapse)
- Stickers and emojis
- Auto-generated captions (Whisper)

**Tech Stack:**
- FFmpeg.wasm (browser video processing)
- Remotion (React-based video creation)
- VideoJS (video player foundation)
- Canvas API (overlays and effects)
- Whisper API (auto-transcription)

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-video-editor feature/video-editor
cd ../synapse-video-editor
npm install

# Video processing libraries
npm install @ffmpeg/ffmpeg @ffmpeg/core
npm install remotion
npm install video.js
npm install @remotion/player

# Whisper for captions (OpenAI API)
# Already have OpenRouter
```

Add to `.env`:
```
VITE_OPENAI_API_KEY=sk-xxx # For Whisper API
```

---

## Task Checklist

### File: `src/services/video/video-processor.service.ts`

- [ ] Create VideoProcessorService class
```typescript
interface VideoProject {
  id: string
  name: string
  sourceVideo: VideoFile
  timeline: TimelineItem[]
  duration: number
  resolution: VideoResolution
  fps: number
}

interface TimelineItem {
  id: string
  type: 'video' | 'text' | 'audio' | 'image' | 'transition'
  startTime: number
  duration: number
  properties: any
  layer: number // z-index
}

interface VideoFile {
  url: string
  duration: number
  width: number
  height: number
  size: number
  format: string
}
```

- [ ] Implement `loadFFmpeg()` method
  - Initialize FFmpeg.wasm
  - Load WASM binary
  - Setup worker thread

- [ ] Implement `processVideo()` method
  - Trim video segments
  - Apply filters
  - Merge timeline items
  - Generate final video
  - Use FFmpeg commands

- [ ] Implement `extractAudio()` method
  - Separate audio track
  - Apply audio processing
  - Mix with overlay audio

- [ ] Implement `applyFilters()` method
  - Brightness, contrast, saturation
  - Blur, sharpen
  - Color grading presets
  - Use Canvas API for real-time preview

### File: `src/services/video/caption-generator.service.ts`

- [ ] Create CaptionGeneratorService class
```typescript
interface Caption {
  id: string
  text: string
  startTime: number
  endTime: number
  style: CaptionStyle
}

interface CaptionStyle {
  font: string
  size: number
  color: string
  backgroundColor: string
  position: 'top' | 'center' | 'bottom'
  animation?: 'fade' | 'slide' | 'typewriter'
}
```

- [ ] Implement `generateFromAudio()` method using Whisper
  - Extract audio from video
  - Call Whisper API for transcription
  - Parse timestamps
  - Generate caption objects
  - Auto-split long captions

- [ ] Implement `syncCaptions()` method
  - Align captions with audio
  - Adjust timing
  - Handle overlaps

- [ ] Implement `renderCaptions()` method
  - Burn captions into video (optional)
  - Or export as SRT/VTT file

### File: `src/services/video/text-overlay.service.ts`

- [ ] Create TextOverlayService class
```typescript
interface TextOverlay {
  id: string
  text: string
  startTime: number
  duration: number
  position: {x: number, y: number}
  style: TextStyle
  animation: TextAnimation
}

interface TextStyle {
  font: string
  size: number
  color: string
  stroke: {color: string, width: number}
  shadow: boolean
  backgroundColor?: string
  padding?: number
}

interface TextAnimation {
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'typewriter'
  duration: number
  easing: string
}
```

- [ ] Implement `addTextOverlay()` method
  - Position text on canvas
  - Apply styling
  - Render with animations

- [ ] Implement text animation presets
  - Fade in/out
  - Slide from edges
  - Zoom in/out
  - Bounce effect
  - Typewriter effect

### File: `src/services/video/audio-mixer.service.ts`

- [ ] Create AudioMixerService class
```typescript
interface AudioTrack {
  id: string
  url: string
  startTime: number
  duration: number
  volume: number // 0-100
  fadeIn?: number
  fadeOut?: number
}
```

- [ ] Implement `mixAudio()` method
  - Original video audio
  - Background music
  - Sound effects
  - Volume normalization
  - Crossfade between tracks

- [ ] Implement `adjustVolume()` method
  - Apply volume changes
  - Fade in/out
  - Ducking (lower music when speech)

### File: `src/services/video/transition.service.ts`

- [ ] Create TransitionService class
```typescript
interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve'
  duration: number // ms
  easing: string
}
```

- [ ] Implement transition effects
  - Fade (crossfade between clips)
  - Slide (left, right, up, down)
  - Zoom (zoom in/out transition)
  - Wipe (directional wipe)
  - Dissolve

### File: `src/components/video/VideoEditor.tsx`

- [ ] Create VideoEditor component
```typescript
interface VideoEditorProps {
  onSave: (video: VideoProject) => void
}
```

- [ ] UI Layout:
  - Video preview pane (center, large)
  - Timeline (bottom, scrub-able)
  - Tool palette (left sidebar)
  - Properties panel (right sidebar)
  - Top menu bar (file, edit, export)

- [ ] Implement video preview
  - Play/pause controls
  - Scrubber
  - Frame-by-frame navigation
  - Zoom timeline
  - Playback speed control

### File: `src/components/video/Timeline.tsx`

- [ ] Create Timeline component
- [ ] Multi-track timeline (video, audio, text, transitions)
- [ ] Drag-and-drop clips
- [ ] Trim handles
- [ ] Snap to grid
- [ ] Zoom in/out
- [ ] Split clip at playhead

### File: `src/components/video/ToolPalette.tsx`

- [ ] Create ToolPalette component
- [ ] Tools:
  - Trim/Cut
  - Text overlay
  - Stickers/Emojis
  - Filters
  - Transitions
  - Audio/Music
  - Captions
  - Speed control
  - Export

### File: `src/components/video/TextToolPanel.tsx`

- [ ] Create TextToolPanel component
- [ ] Text input
- [ ] Font selector (10+ fonts)
- [ ] Size slider
- [ ] Color picker
- [ ] Stroke/shadow toggle
- [ ] Position controls (drag on preview)
- [ ] Animation selector
- [ ] Duration controls

### File: `src/components/video/FilterPanel.tsx`

- [ ] Create FilterPanel component
- [ ] Filter presets (10+ filters)
  - Vibrant
  - Vintage
  - B&W
  - Warm
  - Cool
  - Dramatic
  - Soft
  - Sharp
  - High Contrast
  - Cinematic

- [ ] Manual adjustments:
  - Brightness
  - Contrast
  - Saturation
  - Blur
  - Vignette

### File: `src/components/video/ExportPanel.tsx`

- [ ] Create ExportPanel component
- [ ] Export settings:
  - Resolution (720p, 1080p, 4K)
  - Frame rate (24, 30, 60 fps)
  - Format (MP4, WebM)
  - Quality (low, medium, high)
  - Estimated file size

- [ ] Progress bar during export
- [ ] Preview before export
- [ ] Save to library
- [ ] Direct export to platform formatter

### Database: Add tables

```sql
-- Video projects
CREATE TABLE video_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  source_video_url TEXT,
  timeline JSONB NOT NULL,
  duration INTEGER, -- seconds
  resolution TEXT,
  fps INTEGER DEFAULT 30,
  status TEXT DEFAULT 'draft', -- draft, processing, complete
  output_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video assets (uploaded videos, music, images)
CREATE TABLE video_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  asset_type TEXT NOT NULL, -- video, audio, image
  url TEXT NOT NULL,
  filename TEXT,
  size INTEGER, -- bytes
  duration INTEGER, -- for video/audio
  width INTEGER, -- for video/image
  height INTEGER, -- for video/image
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video projects" ON video_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assets" ON video_assets
  FOR ALL USING (auth.uid() = user_id);
```

---

## Testing Checklist

- [ ] Upload and load video file (MP4)
- [ ] Trim video (start/end points)
- [ ] Add text overlay with animation
- [ ] Apply filter preset (test all 10)
- [ ] Add background music with volume control
- [ ] Generate auto-captions using Whisper
- [ ] Add transition between two clips
- [ ] Adjust playback speed (0.5x, 2x)
- [ ] Export video (1080p, MP4)
- [ ] Verify exported video plays correctly
- [ ] Test undo/redo functionality
- [ ] Test timeline scrubbing accuracy
- [ ] Verify memory usage (large files)

---

## Integration Points

1. **Video Formatter** - Pass edited video for platform-specific formatting
2. **Whisper API** - Auto-caption generation
3. **Supabase Storage** - Store uploaded videos and exports
4. **Campaign Content** - Integrate video into campaigns

---

## Success Criteria

- ✅ Can upload and edit video in browser
- ✅ Text overlays with 5+ animation types
- ✅ 10+ filter presets functional
- ✅ Auto-captions generated via Whisper
- ✅ Timeline editing smooth (60fps preview)
- ✅ Export video (720p, 1080p)
- ✅ TikTok/Instagram feature parity
- ✅ No crashes with 100MB+ video files

---

**Estimated Completion:** 40 hours (5-6 days)
