# F3 — Header in AppShell (Single Source of Truth)

**Date:** 2026-05-16 · **Owner:** alonsooteroseminario · **Branch:** `feat/f3-header-in-appshell`

## Problem

`/wallet` page renders `WalletShell` directly with no app header — missing brand logo, navigation, progress, streak, friends count, user menu. Today each page that wants a header renders `<Header>` independently and passes its own `totalProgress`/`currentStreak`. This is duplication waiting to drift.

## Goal

Render `<Header>` exactly once inside `AppShell`, supply progress/streak via Redux selectors, so every authenticated route gets a consistent app shell **including `/wallet`**. Landing page (signed-out `/`) and `/sign-in`, `/sign-up` skip the header.

## Architecture

### Current

```
layout.tsx (ClerkProvider)
  └ AppShell (ReduxProvider, ChatWidget)
      └ {children}                     ← each page renders its own <Header>
```

### Target

```
layout.tsx (ClerkProvider)
  └ AppShell (ReduxProvider, ChatWidget)
      ├ HeaderHost  ← conditionally renders <Header> based on pathname + auth
      └ {children}                     ← pages no longer render Header
```

### `HeaderHost`

`src/components/HeaderHost.tsx` (new client component):

```tsx
"use client";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "./Header";
import { useHeaderStats } from "@/hooks/useHeaderStats";

const NO_HEADER_PATHS = ["/sign-in", "/sign-up", "/wallet/share"];

export function HeaderHost() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const stats = useHeaderStats();

  if (!isLoaded) return null;                          // SSR hydration safe
  if (pathname === "/" && !isSignedIn) return null;    // landing page
  if (NO_HEADER_PATHS.some(p => pathname?.startsWith(p))) return null;

  return <Header totalProgress={stats.progress} currentStreak={stats.streak} />;
}
```

### `useHeaderStats`

`src/hooks/useHeaderStats.ts` (new):

```ts
export function useHeaderStats() {
  const { data: goals = [] } = useListGoalsQuery();
  const { data: streak } = useGetStreakDataQuery();

  const totalProgress = useMemo(() => {
    if (!goals.length) return 0;
    const sum = goals.reduce((acc, g) => acc + computeGoalProgress(g), 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  return { progress: totalProgress, streak: streak?.currentStreak ?? 0 };
}
```

Reuses existing RTK Query hooks; no new endpoints.

### Page Cleanup

Remove `<Header ... />` from each page that currently renders it. Pages affected (verify with grep before changing):
- `src/app/page.tsx` (home)
- `src/app/board/page.tsx`
- `src/app/feed/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/cost-tracker/page.tsx` (becomes redirect in F2, irrelevant)
- `src/app/templates/**/*.tsx`
- `src/app/admin/page.tsx`
- `src/app/settings/**` (any)
- `src/app/wallet/page.tsx` — currently no Header; after change auto-inherits via HeaderHost

`<main className="h-[calc(100vh-4rem)] overflow-hidden">` in `/wallet/page.tsx` already assumes a 64px header — confirmed correct.

## Edge Cases

- **Landing page**: rendered when signed-out at `/`. `HeaderHost` returns null. Already handled by the auth check.
- **Modals / fullscreen flows**: existing modals overlay on top; header is `z-30`, modals `z-50` — no conflict.
- **Mobile responsive**: `Header` already collapses to a hamburger / mobile shape; unchanged.
- **Hydration mismatch**: `useUser()` returns `isLoaded: false` on initial render → `HeaderHost` returns null on both server and first client render, then renders post-hydration. No mismatch.

## Testing

- Unit: `HeaderHost.test.tsx` — covers signed-in vs signed-out, landing path, share path, normal path.
- Unit: `useHeaderStats.test.ts` — mock RTK Query data, assert correct aggregate.
- E2E: `e2e/wallet-with-header.spec.ts` — sign in, go to `/wallet`, assert header logo + nav visible + user menu opens.

## Acceptance Criteria

- `/wallet`, `/board`, `/feed`, `/profile` all show identical header.
- `/sign-in`, `/sign-up`, signed-out `/` show no header.
- Wallet share page (F4, future `/wallet/share/<token>`) shows no header.
- No page renders `<Header>` directly — single import site is `HeaderHost`.
- Progress + streak numbers identical to current behavior (within 1pp tolerance).
