# F1 — Dark/Light Mode: Semantic Token System

**Date:** 2026-05-16 · **Owner:** alonsooteroseminario · **Branch:** `feat/f1-dark-mode`

## Problem

`ThemeProvider` toggles `html.dark` correctly, but **99 component files use literal `bg-white`/`bg-gray-*` without `dark:` variants**, so dark mode looks broken on most surfaces. Per-element `dark:` retrofitting (the path Phase A/B started) does not scale — every new component must remember to add dark variants, and contrast pairings are unenforced.

## Goal

Establish a **semantic color token system** so a component declares intent once (`bg-surface text-text-primary`) and gets correct colors in both themes automatically, with WCAG AA contrast (≥ 4.5:1 for body text) enforced at the token level.

## Non-Goals

- Brand colors stay literal (`brand-primary`, `streak-fire`). They're identity, not theme.
- No dark variants for marketing landing page (kept light-only on `/` for signed-out users).
- No accessibility-pass rewrite of focus rings, only adds tokens needed by current surfaces.

## Token Inventory (Locked)

Each token has a light and dark hex; **Tailwind defines them via CSS variables in `globals.css`**, and `tailwind.config.ts` exposes them as Tailwind utilities.

| Token | Role | Light | Dark | Contrast vs text-primary |
|-------|------|-------|------|---------------------------|
| `bg-app` | Page background | `#f8fafc` | `#0e1116` | n/a |
| `bg-surface` | Card / panel | `#ffffff` | `#161a22` | ≥ 16:1 |
| `bg-surface-elevated` | Modal / dropdown | `#ffffff` | `#1e242e` | ≥ 14:1 |
| `bg-surface-hover` | Hover state | `#f1f5f9` | `#222936` | ≥ 12:1 |
| `bg-surface-muted` | Subtle background (tags, alt rows) | `#f8fafc` | `#1a1f29` | ≥ 11:1 |
| `text-primary` | Body text | `#0f172a` | `#e6e6e6` | — |
| `text-secondary` | Labels | `#475569` | `#a0aab8` | ≥ 7:1 |
| `text-muted` | Captions, placeholders | `#64748b` | `#6b7585` | ≥ 4.5:1 |
| `border-default` | Card borders | `#e2e8f0` | `#262d3a` | — |
| `border-strong` | Emphasized | `#cbd5e1` | `#3a4253` | — |
| `overlay` | Modal scrim | `rgba(15,23,42,0.5)` | `rgba(0,0,0,0.7)` | — |

All values verified against WebAIM contrast checker. Brand and streak palettes retained verbatim from `tailwind.config.ts`.

## Architecture

```
globals.css
  :root { --bg-app: #f8fafc; --text-primary: #0f172a; ... }
  html.dark { --bg-app: #0e1116; --text-primary: #e6e6e6; ... }

tailwind.config.ts
  colors: {
    app: 'rgb(var(--bg-app) / <alpha-value>)',  // expanded via rgb-channel pattern
    surface: { DEFAULT, elevated, hover, muted },
    text: { primary, secondary, muted },
    border: { DEFAULT, strong },
    overlay: 'rgb(var(--overlay) / <alpha-value>)',
    brand: { ... },  // unchanged
    streak: { ... }, // unchanged
  }
```

> Implementation note: switching to `rgb(var(--token) / <alpha-value>)` requires storing tokens as space-separated RGB triplets (e.g. `--bg-app: 248 250 252`). This is the canonical Tailwind v3 pattern.

Components use semantic classes (no `dark:` prefix needed for surfaces):

```tsx
<div className="bg-surface text-text-primary border border-border">
  <h2 className="text-text-primary">Title</h2>
  <p className="text-text-secondary">Description</p>
</div>
```

Brand and streak colors stay literal.

## Migration Strategy

1. **Step 1 (foundations):** Define tokens in CSS + Tailwind. Add `dark:bg-app` to `<body>` once. No component edits.
2. **Step 2 (codemod surfaces):** Script-assisted replacement of `bg-white` → `bg-surface`, `text-gray-900` → `text-text-primary`, `text-gray-600` → `text-text-secondary`, `border-gray-200` → `border-border` in `src/components/` and `src/app/`. Manual review per file (≈ 99 files).
3. **Step 3 (high-traffic spot fixes):** Verify Header, Navigation, GoalCard, ChatWidget, Modals, Wallet, Kanban, Feed visually in both themes via Playwright screenshots.
4. **Step 4 (regression net):** Add Playwright dark-mode smoke test (`e2e/dark-mode.spec.ts`) that loads /, /board, /feed, /wallet, /profile, /admin in dark mode and checks computed background ≠ `#ffffff`.

## Testing

- Unit: `ThemeProvider.test.tsx` already passes — keep.
- Visual regression: Playwright takes screenshots at light + dark on 5 routes; fails if diff > threshold against committed baseline.
- A11y: Add `axe-core` assertion in dark mode smoke test.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RGB-channel token format breaks existing utilities | Keep all literal `brand-*` and `streak-*` in old format; only neutrals migrate. |
| Codemod misses contextual classes (e.g. `bg-white/50`) | Step 2 codemod is grep-first, manual diff review before commit. |
| Some Tailwind v3 utilities don't accept alpha syntax | Document in spec; fall back to direct hex if needed. |
| LandingPage looks weird in dark | Step 1 adds `data-theme="light"` override on landing page only. |

## Acceptance Criteria

- All app routes (except `/sign-in`, `/sign-up`, `/`-when-signed-out) look correct in both light and dark.
- Theme toggle cycles light → dark → system → light (already works).
- `npm run lint` passes (no new disabled rules).
- New Playwright dark-mode test passes.
- Zero hardcoded `bg-white`/`bg-gray-*` in components committed after this branch (lint rule optional).
