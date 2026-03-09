# Social Streak Sharing — Design Document

**Date:** 2026-03-08
**Status:** Approved
**Epic:** EPIC-010

## Overview

Allow users to share their streak progress to X (Twitter) and Instagram via a manual "Share Streak" button. Generates a branded static PNG image (1080×1080) using Next.js `ImageResponse` (`next/og`). User controls what appears on the image via toggles in a preview modal before sharing.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger | Manual button only | No notifications; user-initiated at any time |
| Platforms | X + Instagram | Web Share API (mobile) + download fallback (desktop) |
| Output format | Static PNG | Faster than video; `next/og` is purpose-built for this |
| Placement | GoalCard + Profile page | Per-goal and global aggregate |
| Content control | Preview modal with toggles | User controls what appears before sharing |

## Architecture

### API Route: `/api/share/streak/route.tsx`

Next.js `ImageResponse` route returning a `1080×1080` PNG.

**Query params:**
```
GET /api/share/streak?
  goalId=<id>        # optional — omit for global card
  showTitle=true     # toggle: show goal title
  showTier=true      # toggle: show tier badge (🥉🥈🥇)
  showTagline=true   # toggle: show "Day X on my journey 🔥"
  showAppName=true   # toggle: show "Journey Tracker" branding
```

**Auth:** Calls `auth()` from `@clerk/nextjs/server`. Returns 401 if unauthenticated.

**Data fetch:** Fetches `GoalStreak` from Prisma using `goalId` (or aggregates across all goals for global card).

**Render:** Returns `ImageResponse` with a React JSX card component using inline styles and brand palette.

### Share Flow

```
User clicks "Share Streak" button
  ↓
ShareStreakModal opens
  - Live <img> preview pointing to /api/share/streak?...
  - Toggle checkboxes → query params update → preview auto-refreshes
  ↓
"Share on X"
  → window.open("https://twitter.com/intent/tweet?text=<encoded-message>")
  → "Download image" button so they can attach the PNG manually

"Share on Instagram"
  → Mobile: fetch PNG blob → navigator.share({ files: [blob] }) → OS share sheet
  → Desktop: download button + "Open Instagram" link

"Download PNG" — always available as fallback
```

## Components

### New: `ShareStreakButton` (`src/components/ShareStreakButton.tsx`)
- Small share icon button (↗)
- Props: `goalId?: string`, `goalTitle?: string`, `streakCount: number`, `tier: StreakTier`
- Only renders when `streakCount > 0`
- On click: opens `ShareStreakModal`

### New: `ShareStreakModal` (`src/components/ShareStreakModal.tsx`)
- Modal overlay (reuses existing modal pattern)
- Live image preview (`<img>` src auto-updates on toggle change)
- 4 toggle checkboxes: goal title, tier badge, tagline, app name
- Buttons: Share on X, Share on Instagram, Download PNG
- Loading/error states for image preview

### New: `/api/share/streak/route.tsx`
- Next.js ImageResponse PNG generator
- Card design (Duolingo-inspired):
  - Dark gradient background: `#2D1B8E` → `#5B50E8`
  - Large streak number in brand-primary `#5B50E8` on white
  - Fire emoji 🔥 + tier badge icon (🥉🥈🥇)
  - Goal title (conditional)
  - "Journey Tracker" wordmark + brand icon at bottom
  - Size: `1080×1080` (square — optimal for X feed + Instagram)

### Modified: `GoalCard.tsx`
- Add `<ShareStreakButton>` next to `<StreakBadge>` in header row
- Only shown when `currentStreak > 0`

### Modified: Profile page
- Add "Share my streak" section
- Uses aggregate data: total goals on streak, best tier across all goals
- `<ShareStreakButton>` with no `goalId` (global card mode)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unauthenticated API request | 401 JSON response |
| Invalid/missing goalId | Render fallback card (streak = 0, no title) |
| Prisma error | 500 JSON response |
| Image load failure in modal | Skeleton placeholder + "Could not load preview" |
| `navigator.share()` unsupported | Show download button only (silent) |
| User cancels native share | Silent catch |

## Testing

**Unit tests (Vitest + happy-dom):**
- `ShareStreakButton.test.tsx` — only renders when streakCount > 0, opens modal on click
- `ShareStreakModal.test.tsx` — toggles update preview URL, X button generates correct intent URL, download link present
- `/api/share/streak/route.test.tsx` — 200 PNG for valid request, 401 for unauthenticated

**No E2E tests** — `ImageResponse` and `navigator.share()` are not testable in Playwright; unit coverage sufficient.

## Epics & Stories

```
EPIC-010: Social Streak Sharing

  STORY-030: Share card image API (next/og PNG endpoint)
              Files: src/app/api/share/streak/route.tsx
                     src/app/api/share/streak/route.test.tsx

  STORY-031: ShareStreakButton + ShareStreakModal components
              Files: src/components/ShareStreakButton.tsx
                     src/components/ShareStreakButton.test.tsx
                     src/components/ShareStreakModal.tsx
                     src/components/ShareStreakModal.test.tsx

  STORY-032: GoalCard integration
              Files: src/components/GoalCard.tsx (modified)
                     src/components/GoalCard.test.tsx (modified)

  STORY-033: Profile page global share section
              Files: src/app/profile/page.tsx (modified)

  STORY-034: Integration tests + coverage verification
```

**Parallelization:**
- STORY-030 and STORY-031 are fully independent → parallel branches
- STORY-032 and STORY-033 depend on STORY-031 → sequential after merge
- STORY-034 done alongside each story (TDD)

## Dependencies

Already installed:
- `next` 15 — `ImageResponse` from `next/og` built-in
- `@clerk/nextjs` — auth
- `prisma` — streak data

No new packages required.

## Brand Reference

```
brand-primary:   #5B50E8
brand-secondary: #7B6FFF
brand-light:     #EAE8FF
brand-dark:      #2D1B8E
brand-accent:    #F08080
Brand icon:      /public/brand-icon.png
```

## Tier Icons

```
bronze: 🥉  (1+ days streak)
silver: 🥈  (7+ days streak)
gold:   🥇  (all goals active)
```
