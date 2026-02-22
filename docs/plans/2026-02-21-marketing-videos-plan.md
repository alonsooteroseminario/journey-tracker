# Marketing Video Generation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up the infrastructure for CLI-driven marketing video generation using Remotion, so Claude Code can write compositions from prompts and render them to MP4 in `/videos/`.

**Architecture:** Remotion compositions live in `src/remotion/marketing/`. Each composition is a React component accepting a `format` prop for responsive layouts. The `Root.tsx` entry point registers all compositions. Rendering is done via `npx remotion render` CLI. Output goes to `/videos/` at project root (gitignored).

**Tech Stack:** Remotion 4.0.234, React, TypeScript, `npx remotion render` CLI

---

### Task 1: Create output directory and gitignore

**Files:**
- Create: `videos/.gitkeep`
- Modify: `.gitignore`

**Step 1: Create the `/videos/` directory**

```bash
mkdir -p videos
touch videos/.gitkeep
```

**Step 2: Add `/videos/` to `.gitignore`**

Add to `.gitignore` after the existing entries:

```
# Rendered marketing videos
/videos/*.mp4
```

We keep `.gitkeep` so the directory is tracked, but all rendered `.mp4` files are ignored.

**Step 3: Commit**

```bash
git add videos/.gitkeep .gitignore
git commit -m "chore: add /videos output directory for marketing video renders"
```

---

### Task 2: Create marketing compositions directory with example composition

**Files:**
- Create: `src/remotion/marketing/index.ts`
- Create: `src/remotion/marketing/ExamplePromo.tsx`

**Step 1: Create the marketing directory and index**

Create `src/remotion/marketing/index.ts`:

```ts
// Re-export all marketing compositions
// Add new compositions here as they are created
export { ExamplePromo } from "./ExamplePromo";
```

**Step 2: Create the example marketing composition**

Create `src/remotion/marketing/ExamplePromo.tsx`:

```tsx
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

export type VideoFormat = "landscape" | "square" | "vertical";

interface ExamplePromoProps {
  headline: string;
  subtext: string;
  format: VideoFormat;
}

export const ExamplePromo: React.FC<ExamplePromoProps> = ({
  headline,
  subtext,
  format,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVertical = format === "vertical";

  // Animations
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headlineSlide = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });

  const subtextSlide = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15 },
  });

  const ctaScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.15), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.1), transparent 60%)",
          opacity: fadeIn,
        }}
      />

      <div
        style={{
          textAlign: "center",
          padding: isVertical ? 40 : 60,
          maxWidth: isVertical ? "90%" : "80%",
          opacity: fadeIn,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: isVertical ? 56 : 72,
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: isVertical ? 24 : 40,
            lineHeight: 1.2,
            transform: `translateY(${(1 - headlineSlide) * 40}px)`,
            opacity: headlineSlide,
          }}
        >
          {headline}
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: isVertical ? 28 : 36,
            color: "#94a3b8",
            marginBottom: isVertical ? 40 : 60,
            lineHeight: 1.5,
            transform: `translateY(${(1 - subtextSlide) * 30}px)`,
            opacity: subtextSlide,
          }}
        >
          {subtext}
        </p>

        {/* CTA button */}
        <div
          style={{
            transform: `scale(${ctaScale})`,
            opacity: ctaScale,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "16px 48px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: 12,
              fontSize: isVertical ? 24 : 28,
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            Try Journey Tracker
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 60 : 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: isVertical ? 22 : 28,
          color: "#6b7280",
          opacity: fadeIn,
        }}
      >
        Journey Tracker
      </div>
    </AbsoluteFill>
  );
};
```

**Step 3: Commit**

```bash
git add src/remotion/marketing/
git commit -m "feat: add marketing compositions directory with ExamplePromo template"
```

---

### Task 3: Register marketing compositions in Root.tsx

**Files:**
- Modify: `src/remotion/Root.tsx`

**Step 1: Update Root.tsx to include marketing compositions**

Replace the contents of `src/remotion/Root.tsx` with:

```tsx
import React from "react";
import { Composition } from "remotion";
import { GoalProgressVideo } from "./GoalProgressVideo";
import { StreakMilestoneVideo } from "./StreakMilestoneVideo";
import { ExamplePromo } from "./marketing/ExamplePromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Existing data-driven compositions */}
      <Composition
        id="goal-progress"
        component={GoalProgressVideo as any}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          goalTitle: "Learn TypeScript",
          progress: 75,
          tasksCompleted: 15,
          totalTasks: 20,
          userName: "John Doe",
        }}
      />
      <Composition
        id="streak-milestone"
        component={StreakMilestoneVideo as any}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          userName: "John Doe",
          streakCount: 30,
          milestone: 30,
        }}
      />

      {/* Marketing compositions — landscape */}
      <Composition
        id="example-promo-landscape"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "landscape" as const,
        }}
      />
      {/* Marketing compositions — square */}
      <Composition
        id="example-promo-square"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "square" as const,
        }}
      />
      {/* Marketing compositions — vertical (Stories/Reels) */}
      <Composition
        id="example-promo-vertical"
        component={ExamplePromo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          headline: "Track Your Goals",
          subtext: "The journey of a thousand miles begins with a single step.",
          format: "vertical" as const,
        }}
      />
    </>
  );
};
```

**Step 2: Verify compositions are registered**

```bash
npx remotion compositions src/remotion/Root.tsx
```

Expected: Should list `goal-progress`, `streak-milestone`, `example-promo-landscape`, `example-promo-square`, `example-promo-vertical`.

**Step 3: Commit**

```bash
git add src/remotion/Root.tsx
git commit -m "feat: register ExamplePromo marketing compositions in Root.tsx (3 formats)"
```

---

### Task 4: Test render the example composition

**Files:** None (verification only)

**Step 1: Render the landscape version**

```bash
npx remotion render src/remotion/Root.tsx example-promo-landscape videos/example-promo-1920x1080.mp4
```

Expected: Renders successfully, creates `videos/example-promo-1920x1080.mp4`.

**Step 2: Render the square version**

```bash
npx remotion render src/remotion/Root.tsx example-promo-square videos/example-promo-1080x1080.mp4
```

Expected: Renders successfully, creates `videos/example-promo-1080x1080.mp4`.

**Step 3: Render the vertical version**

```bash
npx remotion render src/remotion/Root.tsx example-promo-vertical videos/example-promo-1080x1920.mp4
```

Expected: Renders successfully, creates `videos/example-promo-1080x1920.mp4`.

**Step 4: Verify output files exist**

```bash
ls -la videos/*.mp4
```

Expected: Three MP4 files with non-zero size.

**Note:** If rendering fails due to missing Chromium/browser, run:
```bash
npx remotion browser ensure
```

---

### Task 5: Add render helper script

**Files:**
- Modify: `package.json` (add scripts)

**Step 1: Add convenience scripts to package.json**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "video:studio": "remotion studio src/remotion/Root.tsx",
    "video:render": "remotion render src/remotion/Root.tsx"
  }
}
```

Usage:
- `npm run video:studio` — opens the Remotion Studio for live preview
- `npm run video:render -- <composition-id> videos/<output>.mp4` — renders a single video

**Step 2: Test the studio script**

```bash
npm run video:studio
```

Expected: Opens Remotion Studio in browser with all 5 compositions listed. Close after verifying.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add video:studio and video:render convenience scripts"
```

---

## Summary

After completing all 5 tasks, the infrastructure is ready:

- `/videos/` directory exists and is gitignored (except `.gitkeep`)
- `src/remotion/marketing/` directory with an example composition
- All compositions registered in `Root.tsx` with 3 social media formats
- Render scripts in `package.json` for convenience
- Example renders verified in all 3 formats

### Creating New Marketing Videos (Future Workflow)

When prompted to create a marketing video, Claude Code should:

1. Create a new file in `src/remotion/marketing/<slug>.tsx` following the `ExamplePromo` pattern
2. Export it from `src/remotion/marketing/index.ts`
3. Register 3 `<Composition>` entries in `Root.tsx` (landscape, square, vertical)
4. Render desired formats: `npm run video:render -- <id> videos/<slug>-<WxH>.mp4`
5. Verify the output file exists and has non-zero size
