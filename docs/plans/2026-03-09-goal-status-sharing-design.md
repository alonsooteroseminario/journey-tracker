# Goal Status Sharing — Design Document

**Date:** 2026-03-09
**Status:** Approved
**Epic:** EPIC-011

## Overview

Add a "Share Goal Status" button to GoalCard that generates a branded 1080×1080 PNG via `next/og` and lets users share their goal progress to X (Twitter) and Instagram. Follows the exact same pattern as EPIC-010 (streak sharing).

## Decisions

| Decision | Choice |
|----------|--------|
| Trigger | Manual button, visible only when `progress > 0%` |
| Placement | Title row, next to `ShareStreakButton` |
| Platforms | X + Instagram (Web Share API mobile / download desktop) |
| Output | Static PNG via `next/og` ImageResponse |
| Content | Goal icon + title + progress % + tasks done + streak + tagline — all toggleable |

## Architecture

### API Route: `/api/share/goal/route.tsx`

`next/og` ImageResponse, `runtime = "edge"`, `1080×1080` PNG.

**Query params:**
```
GET /api/share/goal?
  goalId=<id>
  showProgress=true
  showTasks=true
  showStreak=true
  showTagline=true
  showAppName=true
```

- Auth: `auth()` → 401 if unauthenticated
- Fetches `Goal` (tasks JSON field) + `GoalStreak` from Prisma
- Progress = `completedSubstepsOrTasks / total * 100` (mirrors client logic)
- Uses `computeGoalTier()` for streak tier

**Card design:**
- Dark gradient: `#2D1B8E` → `#5B50E8`
- Goal icon (emoji) + title
- Progress % (large number) + filled bar
- "X of Y tasks done"
- Streak count + tier badge (if active)
- Tagline: "Working towards my goal 🎯"
- Journey Tracker branding bottom

### Components

**`ShareGoalStatusButton`** (`src/components/ShareGoalStatusButton.tsx`)
- Props: `goalId`, `goalTitle`, `goalIcon`, `progress` (0–100)
- Hidden when `progress <= 0`
- On click: opens `ShareGoalStatusModal`

**`ShareGoalStatusModal`** (`src/components/ShareGoalStatusModal.tsx`)
- Live `<img>` preview pointing to `/api/share/goal?...`
- 5 toggle checkboxes: progress %, tasks count, streak, tagline, app name
- Share on X button, Share on Instagram button, Download PNG link

**Modified: `GoalCard.tsx`**
- Import `ShareGoalStatusButton`
- Add next to `ShareStreakButton` in title row
- Pass `progress` prop (already available in GoalCard)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unauthenticated | 401 JSON |
| Goal not found | Render fallback (0% progress, no title) |
| Prisma error | 500 JSON |
| Image load failure | Skeleton + "Could not load preview" |
| `navigator.share()` unsupported | Download button only |

## Testing

- `ShareGoalStatusButton.test.tsx` — hidden when progress=0, visible when progress>0, opens modal
- `ShareGoalStatusModal.test.tsx` — toggles update preview URL, X intent URL correct, download link present
- `route.test.ts` — 200 PNG for valid request, 401 for unauthenticated, fallback for missing goal

## Stories

```
EPIC-011: Goal Status Sharing

  STORY-035: Share goal status PNG API (/api/share/goal)
  STORY-036: ShareGoalStatusButton + ShareGoalStatusModal components
  STORY-037: GoalCard integration
```

STORY-035 and STORY-036 are independent → parallel branches.
STORY-037 depends on STORY-036.

## Brand Reference

```
brand-dark:    #2D1B8E
brand-primary: #5B50E8
brand-light:   #EAE8FF
```
