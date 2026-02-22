# Marketing Video Generation — Design Document

**Date:** 2026-02-21
**Status:** Approved

## Overview

CLI-driven marketing video generation for X (Twitter) and Instagram using Remotion. Claude Code writes custom Remotion compositions from natural language prompts and renders them to MP4 files.

## Workflow

1. User prompts Claude Code with a video description
2. Claude writes a Remotion composition in `src/remotion/marketing/<slug>.tsx`
3. Claude registers it in `src/remotion/Root.tsx`
4. Claude renders it via `npx remotion render <composition-id> /videos/<slug>.mp4`
5. Video lands in `/videos/` at project root, ready for social media upload

## Architecture

### Directory Structure

```
src/remotion/
  Root.tsx                          # Registers all compositions
  GoalProgressVideo.tsx             # Existing data-driven template
  StreakMilestoneVideo.tsx           # Existing data-driven template
  marketing/                        # Generated marketing compositions
    <slug>.tsx                      # One file per video concept

/videos/                            # Rendered output (gitignored)
  <slug>-1920x1080.mp4              # Landscape
  <slug>-1080x1080.mp4              # Square
  <slug>-1080x1920.mp4              # Vertical
```

### Social Media Format Presets

| Format     | Dimensions | Use Case                    |
|------------|------------|-----------------------------|
| landscape  | 1920x1080  | X feed, YouTube             |
| square     | 1080x1080  | X/Instagram feed            |
| vertical   | 1080x1920  | Instagram Stories/Reels     |

### Composition Pattern

Each marketing video follows this convention:

- Accepts a `format` prop (`"landscape" | "square" | "vertical"`) to adapt layout
- Uses inline styles (Remotion requirement — no Tailwind)
- Brand colors: `#3b82f6` (blue), `#8b5cf6` (purple), `#10b981` (green)
- Bottom branding bar: "Journey Tracker"
- Duration: 5-15 seconds (150-450 frames at 30fps)
- All animations use Remotion primitives (`interpolate`, `spring`, `Sequence`)

### Rendering

- `npx remotion render <composition-id> /videos/<filename>.mp4 --width=W --height=H`
- Multi-format: same composition rendered 3 times with different dimensions
- Output naming: `<slug>-<WxH>.mp4`

## Changes Required

1. Create `/videos/` directory at project root
2. Add `/videos/` to `.gitignore`
3. Create `src/remotion/marketing/` directory
4. Install `@remotion/bundler` if not already available via `@remotion/cli`
5. No changes to admin UI, API routes, Prisma schema, or existing compositions

## Content Type

General marketing videos: product promos, feature announcements, app demos. Not tied to specific user data.

## Dependencies

Already installed:
- `remotion` 4.0.234
- `@remotion/cli` 4.0.234
- `@remotion/renderer` 4.0.234

May need:
- `@remotion/bundler` 4.0.234 (check if CLI provides bundling)
