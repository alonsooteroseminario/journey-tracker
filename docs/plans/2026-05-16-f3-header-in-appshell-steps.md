# F3 — Header in AppShell · Step Plan

**Branch:** `feat/f3-header-in-appshell` · **Estimate:** 0.5-1 day

## Step 1 — Create `useHeaderStats` Hook

**Files:**
- `src/hooks/useHeaderStats.ts` (new)
- `src/hooks/useHeaderStats.test.ts` (new)

**TDD:** Mock RTK Query goals/streaks, assert progress = (sum of computeGoalProgress(g)) / count, default 0/0 when empty.

**Done when:** `vitest src/hooks/useHeaderStats` passes.

## Step 2 — Create `HeaderHost` Component

**Files:**
- `src/components/HeaderHost.tsx` (new)
- `src/components/HeaderHost.test.tsx` (new)

**TDD test cases:**
1. `isLoaded: false` → renders null
2. Signed-out + pathname=`/` → renders null
3. Signed-in + pathname=`/board` → renders `<Header>`
4. Pathname=`/sign-in` → null
5. Pathname=`/wallet/share/abc` → null
6. Pathname=`/wallet` → renders `<Header>` (key acceptance test)

**Mock:** `@clerk/nextjs` `useUser`, `next/navigation` `usePathname`, `@/hooks/useHeaderStats`, `./Header`.

**Done when:** Test file passes; component compiles.

## Step 3 — Wire HeaderHost Into AppShell

**Files:**
- `src/components/AppShell.tsx` — add `<HeaderHost />` above `{children}` inside `UndoToastProvider`

**Verify:** `npm run dev`, sign in, hit `/wallet` → header appears.

## Step 4 — Remove Per-Page Header

Run `grep -rn "<Header" src/app | grep -v Header.tsx`. For each page:
- Remove the `<Header ... />` JSX
- Remove the unused `import { Header } from ...`
- Remove unused `totalProgress`/`currentStreak` prop drilling
- Keep `<NotificationBanner>` and page-specific UI

Pages (verify list with grep first):
- `src/app/page.tsx`
- `src/app/board/page.tsx`
- `src/app/feed/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/templates/page.tsx` (and detail/edit if present)
- `src/app/admin/page.tsx`

Skip pages where header was already missing (e.g., `/wallet`).

**TDD:** Update tests for each page that asserted Header rendering — they should now assert `<HeaderHost>` is in the tree (mocked) or remove the assertion (since shell handles it).

**Done when:** `grep -rn "<Header[^H]" src/app` returns 0 matches; all page tests still pass.

## Step 5 — E2E Smoke Test

`e2e/wallet-with-header.spec.ts`:
1. Sign in.
2. Navigate to `/wallet`.
3. Assert `[data-testid="brand-logo"]` visible.
4. Assert nav links Home / Board / Feed / Wallet present.
5. Click user menu → assert "Sign out" appears.

**Done when:** Playwright passes.

## Step 6 — Verification

- `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e` all green
- Manual: hard-refresh on each route, check no double-header / no flicker
- Update `MEMORY.md` with F3 ✅

## Risk Bail-Outs

- If a page depends on a *different* header (e.g., admin uses a custom AdminHeader), HeaderHost path-checks must allow it. Add `pathname.startsWith('/admin')` → null and let admin render its own.
- If progress aggregation is expensive (many goals), memo'ed in `useHeaderStats`. If still slow, add `staleTime: 60_000` to the goals query.
