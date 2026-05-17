# F1 — Dark/Light Mode · Step Plan

**Branch:** `feat/f1-dark-mode` · **Estimate:** 1-1.5 days

## Step 1 — Token Foundations (RED→GREEN)

**Files touched:**
- `tailwind.config.ts` — add `app`, `surface`, `text`, `border`, `overlay` semantic colors using `rgb(var(--token) / <alpha-value>)` pattern
- `src/app/globals.css` — add CSS variable definitions in `:root` and `html.dark` (RGB triplets, not hex)
- `src/app/layout.tsx` — verify `<body className="bg-app text-text-primary">` (replaces existing `body` styles)

**TDD:**
- Add `tailwind.config.test.ts` (new) — imports config, asserts `surface.DEFAULT` resolves correctly
- `npm run dev`, hit `/`, eyeball: `body` background = `#f8fafc` light, `#0e1116` dark

**Done when:** Tokens defined, body adopts theme, no component edits yet, `npm run build` passes.

## Step 2 — Codemod High-Traffic Components

Targeted manual edits (no batch sed). Files (priority order):
1. `src/components/Header.tsx` (line ~40-end) — `bg-white` → `bg-surface`, `text-gray-900` → `text-text-primary`, etc.
2. `src/components/Navigation.tsx`
3. `src/components/GoalCard.tsx`
4. `src/components/TaskMiniCard.tsx`
5. `src/components/TaskList.tsx`
6. `src/components/EditTaskModal.tsx`
7. `src/components/Calendar.tsx`
8. `src/components/AutoMigration.tsx`
9. `src/components/GoalGroupManager.tsx`
10. `src/components/NotificationBanner.tsx`
11. `src/components/StreakCounter.tsx`, `StreakBadge.tsx`

**TDD:** Render each in light + dark via Storybook-like ad-hoc test page (or Playwright smoke). Per-file commit.

**Done when:** Visual diff on each route shows no white blocks in dark mode for the 11 components.

## Step 3 — Codemod Remaining Components

Remaining ≈ 88 files. Split into batches of 10-15, commit per batch:
- `src/components/prompts/*` (Wallet)
- `src/components/kanban/*`
- `src/components/chat/*`
- `src/components/feed/*`
- `src/components/templates/*`
- `src/components/admin/*`
- `src/components/social/*`
- Page files in `src/app/**/page.tsx`

Skip `LandingPage.tsx` — apply `data-theme="light"` override instead.

**Done when:** `grep -rE "bg-(white|gray-50|gray-100|gray-200)" src/components src/app | grep -v dark: | grep -v LandingPage | wc -l` returns near-zero (allow ≤ 5 intentional exceptions, documented).

## Step 4 — Landing Page Exemption

- `src/app/page.tsx` or `src/components/LandingPage.tsx` — wrap in `<div data-theme="light" className="bg-white text-gray-900">` with CSS override: `[data-theme="light"] { color-scheme: light; }`.
- Confirm theme toggle still works after navigating away from landing.

**Done when:** Landing always shows light; toggle works on `/board`, etc.

## Step 5 — Regression Tests

- `e2e/dark-mode.spec.ts` — Playwright: sign in via test user, visit `/`, `/board`, `/feed`, `/wallet`, `/profile`. Take screenshots in light + dark. Use `axe-core` to check contrast.
- `vitest` snapshot for ThemeProvider already exists — extend if needed.

**Done when:** `npm run test:e2e -- dark-mode` passes.

## Step 6 — Verification & Merge

Per `superpowers:verification-before-completion`:
- `npm run lint` ✓
- `npm run build` ✓
- `npm run test` ✓ (no new failures)
- `npm run test:e2e -- dark-mode` ✓
- Manual: cycle theme on every route, look for white flashes

**Merge target:** `main` via PR with screenshots before/after.

## Risk Bail-Outs

- If RGB-channel pattern breaks existing brand utilities → revert to dual-keyword tokens (`bg-surface-light`, `bg-surface-dark`) and switch via `html.dark .bg-surface-light { display: none }`-style CSS (last-resort, ugly).
- If codemod scope balloons past 1.5 days → ship Steps 1-2 + Header/Nav/GoalCard only. Remaining files become a follow-up branch.
