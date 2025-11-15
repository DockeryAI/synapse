# Worktree Task: Platform Auto-Formatting for Video

**Feature ID:** `platform-auto-formatting`
**Branch:** `feature/video-formatter`
**Estimated Time:** 30 hours
**Priority:** HIGH
**Phase:** 1C - Video Capabilities
**Dependencies:** Video Editor
**Worktree Path:** `../synapse-video-formatter`

---

## Context

Auto-format one video for all major platforms. Automatically crops/resizes to correct aspect ratios (9:16, 16:9, 1:1, 4:5), adds safe zones, and optimizes for each platform's specifications.

**7 Target Platforms:**
1. LinkedIn (16:9 or 1:1, 10 min max)
2. Instagram Feed (1:1, 60 sec)
3. Instagram Reel (9:16, 90 sec)
4. TikTok (9:16, 10 min)
5. YouTube Shorts (9:16, 60 sec)
6. Twitter (16:9, 2:20 min)
7. Facebook (1:1 or 16:9, 240 min)

**Auto-Formatting Features:**
- Aspect ratio conversion (smart crop or letterbox)
- Duration trimming (to platform limits)
- Safe zone overlays (platform-specific)
- Resolution optimization
- Batch export for all platforms
- Direct export to SocialPilot

---

## Setup

```bash
cd /Users/byronhudson/Projects/Synapse
git worktree add ../synapse-video-formatter feature/video-formatter
cd ../synapse-video-formatter
npm install

# Using same video libraries as editor
# @ffmpeg/ffmpeg already installed
```

---

## Task Checklist

### File: `src/services/video/platform-formatter.service.ts`

- [ ] Create PlatformFormatterService class
```typescript
interface PlatformSpec {
  platform: 'linkedin' | 'instagram_feed' | 'instagram_reel' | 'tiktok' | 'youtube_shorts' | 'twitter' | 'facebook'
  aspectRatio: string // '16:9', '9:16', '1:1', '4:5'
  width: number
  height: number
  maxDuration: number // seconds
  maxFileSize: number // MB
  recommendedBitrate: number
  safeZones: SafeZone
}

interface SafeZone {
  top: number // pixels
  bottom: number
  left: number
  right: number
}

interface FormattedVideo {
  platform: string
  url: string
  aspectRatio: string
  duration: number
  fileSize: number
  resolution: string
}
```

- [ ] Define platform specifications
```typescript
const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  linkedin: {
    platform: 'linkedin',
    aspectRatio: '16:9', // or 1:1
    width: 1920,
    height: 1080,
    maxDuration: 600, // 10 minutes
    maxFileSize: 200, // 200MB
    recommendedBitrate: 5000, // kbps
    safeZones: {top: 0, bottom: 100, left: 0, right: 0}
  },
  tiktok: {
    platform: 'tiktok',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 600,
    maxFileSize: 287,
    recommendedBitrate: 4000,
    safeZones: {top: 150, bottom: 250, left: 0, right: 0}
  },
  // ... define all 7 platforms
}
```

- [ ] Implement `formatForPlatform()` method
  - Load source video
  - Determine target aspect ratio
  - Apply smart crop or letterbox
  - Trim to max duration
  - Add safe zone overlays
  - Compress to file size limit
  - Export optimized video

- [ ] Implement `smartCrop()` method
  - Analyze video content (face detection optional)
  - Crop to target aspect ratio
  - Keep important content centered
  - Or use letterbox if requested

- [ ] Implement `trimToDuration()` method
  - If video exceeds platform limit
  - Intelligently select best portion
  - Or trim from end
  - Preserve key moments

- [ ] Implement `batchExport()` method
  - Format for all platforms simultaneously
  - Use Web Workers for parallel processing
  - Track progress per platform
  - Return all formatted videos

### File: `src/services/video/safe-zone-overlay.service.ts`

- [ ] Create SafeZoneOverlayService class
```typescript
interface SafeZoneOverlay {
  platform: string
  guides: OverlayGuide[]
  textSafeArea: Rectangle
}

interface OverlayGuide {
  type: 'line' | 'box'
  position: {x: number, y: number}
  dimensions: {width: number, height: number}
  color: string
  opacity: number
}
```

- [ ] Implement `generateSafeZoneOverlay()` method
  - Create visual guides for editor preview
  - Show caption safe zones
  - Show UI element safe zones
  - Platform-specific overlays

- [ ] Platform-specific safe zones
  - TikTok: Top (profile icon), bottom (captions, buttons)
  - Instagram Reels: Similar to TikTok
  - LinkedIn: Bottom third (captions)
  - Others: Minimal safe zones

### File: `src/services/video/aspect-ratio-converter.service.ts`

- [ ] Create AspectRatioConverterService class
```typescript
interface AspectRatioConversion {
  source: {width: number, height: number}
  target: {width: number, height: number}
  method: 'crop' | 'letterbox' | 'stretch'
  cropArea?: Rectangle
}
```

- [ ] Implement `convertAspectRatio()` method
  - Calculate source vs target ratio
  - Determine best conversion method
  - Apply crop or letterbox
  - Maintain video quality

- [ ] Implement conversion methods
  - **Crop:** Remove edges, keep center
  - **Letterbox:** Add bars (top/bottom or sides)
  - **Stretch:** Not recommended, but available

### File: `src/components/video/PlatformFormatter.tsx`

- [ ] Create PlatformFormatter component
```typescript
interface PlatformFormatterProps {
  sourceVideo: VideoProject
  onExport: (videos: FormattedVideo[]) => void
}
```

- [ ] UI Elements:
  - Source video preview
  - Platform selector (checkboxes for all 7)
  - Aspect ratio visualization per platform
  - Safe zone toggle
  - Conversion method selector (crop vs letterbox)
  - Export all platforms button
  - Individual export buttons
  - Progress tracking (per platform)

### File: `src/components/video/PlatformPreview.tsx`

- [ ] Create PlatformPreview component
- [ ] Side-by-side comparison
  - Source video
  - Formatted preview for selected platform
- [ ] Safe zone overlay toggle
- [ ] Switch between platforms quickly
- [ ] Show specs (resolution, duration, file size)

### File: `src/components/video/BatchExporter.tsx`

- [ ] Create BatchExporter component
```typescript
interface BatchExporterProps {
  video: VideoProject
  selectedPlatforms: string[]
  onComplete: (exports: FormattedVideo[]) => void
}
```

- [ ] UI Elements:
  - Platform checklist
  - Export settings per platform
  - Start batch export button
  - Progress bars (overall + per platform)
  - Estimated time remaining
  - Cancel option
  - Results list with download links
  - Direct push to SocialPilot option

### File: `src/components/video/SafeZoneVisualizer.tsx`

- [ ] Create SafeZoneVisualizer component
- [ ] Overlay on video preview
- [ ] Toggle visibility
- [ ] Color-coded zones
  - Red: UI overlap areas
  - Yellow: Caption safe zone
  - Green: Fully visible area
- [ ] Platform selector (shows different zones per platform)

### Database: Add tables

```sql
-- Platform formatted videos
CREATE TABLE formatted_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  source_video_id UUID REFERENCES video_projects(id),
  platform TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER,
  file_size INTEGER,
  resolution TEXT,
  status TEXT DEFAULT 'processing', -- processing, complete, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch export jobs
CREATE TABLE video_export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  source_video_id UUID REFERENCES video_projects(id),
  platforms TEXT[], -- array of platform names
  status TEXT DEFAULT 'pending', -- pending, processing, complete, failed
  progress INTEGER DEFAULT 0, -- 0-100
  formatted_videos UUID[], -- array of formatted_videos.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE formatted_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own formatted videos" ON formatted_videos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own export jobs" ON video_export_jobs
  FOR ALL USING (auth.uid() = user_id);
```

---

## Platform Specifications Table

| Platform | Aspect Ratio | Resolution | Max Duration | Max File Size | Safe Zones |
|----------|--------------|------------|--------------|---------------|------------|
| **LinkedIn** | 16:9 or 1:1 | 1920x1080 | 10 min | 200MB | Bottom 100px |
| **Instagram Feed** | 1:1 | 1080x1080 | 60 sec | 100MB | None |
| **Instagram Reel** | 9:16 | 1080x1920 | 90 sec | 100MB | Top 150px, Bottom 250px |
| **TikTok** | 9:16 | 1080x1920 | 10 min | 287MB | Top 150px, Bottom 250px |
| **YouTube Shorts** | 9:16 | 1080x1920 | 60 sec | 256MB | Bottom 100px |
| **Twitter** | 16:9 | 1920x1080 | 2:20 min | 512MB | None |
| **Facebook** | 1:1 or 16:9 | 1080x1080 | 240 min | 4GB | None |

---

## Testing Checklist

- [ ] Format 16:9 video to all 7 platforms
- [ ] Test smart crop (center-focused)
- [ ] Test letterbox mode
- [ ] Verify duration trimming (test with 5 min video)
- [ ] Check file size compliance (all platforms)
- [ ] Verify safe zone overlays display correctly
- [ ] Test batch export (all 7 platforms simultaneously)
- [ ] Verify progress tracking accurate
- [ ] Test cancel mid-export
- [ ] Export to SocialPilot directly
- [ ] Verify quality maintained after formatting
- [ ] Test with various source aspect ratios (16:9, 9:16, 1:1, 4:5)
- [ ] Verify all platform specs met

---

## Integration Points

1. **Video Editor** - Source edited videos
2. **FFmpeg** - Video processing
3. **SocialPilot** - Direct publishing
4. **Supabase Storage** - Store formatted videos
5. **Campaign Generator** - Attach videos to campaigns

---

## Success Criteria

- ✅ One video → 7 platform-optimized versions
- ✅ Aspect ratios correct for each platform
- ✅ Duration limits enforced
- ✅ File sizes within platform limits
- ✅ Safe zones accurately displayed
- ✅ Batch export functional (parallel processing)
- ✅ Smart crop keeps important content visible
- ✅ Export to SocialPilot working
- ✅ Processing time <5 min for all 7 platforms

---

**Estimated Completion:** 30 hours (4-5 days)
