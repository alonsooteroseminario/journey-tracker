# docs/plans — Compaction Library & Status Tracker

> This file is the **living index** of all plans and implementation status.
> Use it as memory between sessions — update status as work completes.
> Date: 2026-02-26

---

## How To Use This Index

Each session: read this file first to orient yourself. Check **Status** and **Notes** columns before starting work.

---

## Plan Index

### Completed ✅

| File | Feature | Status | Notes |
|------|---------|--------|-------|
| `2026-02-10-ui-consistency-improvements.md` | UI consistency pass | ✅ Done | Header, cards, mobile |
| `2026-02-10-sync-clerk-user-data.md` | Clerk→Prisma user sync | ✅ Done | Auto-sync on every auth check |
| `2026-02-18-kanban-feed-visibility-plan.md` | Kanban + Feed visibility | ✅ Done | isPublic flag on goals |
| `2026-02-20-fix-streak-calculation.md` | Streak calculation fix | ✅ Done | UTC→local date bug fixed |
| `2026-02-25-board-ux-plan.md` | Board UX (Round 1) | ✅ Done | Substep filtering, breadcrumbs, drag handle, Done Today filter |
| `2026-02-25-goal-groups-plan.md` | Goal Groups | ✅ Done | CRUD, filter on Home + Board |
| `2026-02-25-template-crud-plan.md` | Template CRUD | ✅ Done | 12 action mutations, TemplateEditor |
| `2026-02-25-board-archive-plan.md` | Board Archive | ✅ Done | isArchived/archivedAt, Show Archived toggle |
| `2026-02-25-streak-tiers-plan.md` | Streak Tiers | ✅ Done | GoalStreak model, Bronze/Silver/Gold, StreakBadge |
| `2026-02-25-inline-goal-edit-plan.md` | Inline Goal Edit | ✅ Done | Click-to-edit title/desc/icon in GoalCard |
| `2026-02-25-archive-only-filter-plan.md` | Archive-Only Filter | ✅ Done | Toggle shows ONLY archived (not mixed) |
| `2026-02-25-drag-handle-goalcard-plan.md` | GoalCard Drag Handle | ✅ Done | Always visible on left edge |
| `2026-02-25-profile-timezone-plan.md` | Profile Timezone | ✅ Done | Timezone dropdown + "Saved!" indicator |
| `2026-02-25-auto-hide-completed-plan.md` | Auto-Hide Completed | ✅ Done | hideCompletedAfterDays pref + GoalCard filter |
| `2026-02-26-brand-identity-plan.md` | Brand Identity Rebrand | ✅ Done | All 3 sessions merged to main (commit 1958c0d) |
| `2026-02-26-chat-header-splitview-plan.md` | Chat Header + Split View | ✅ Done | Chat trigger in Header, floating/split panel. 7 commits (6d2b9e0→2b4fb5f) |

### Pending / In Progress 🚧

| File | Feature | Status | Priority | Notes |
|------|---------|--------|----------|-------|
| `2026-02-21-remaining-stories.md` | STORY-021/008/022 | 🚧 Pending | HIGH | Health check, Feed dedup, Coverage ≥80% |

---

## Architecture Quick Reference

### Tech Stack
- **Framework**: Next.js 15 App Router (src/app/)
- **Auth**: Clerk (`@clerk/nextjs`) — middleware in `src/middleware.ts`
- **DB**: Prisma + MongoDB (`prisma/schema.prisma`)
- **State**: Redux Toolkit + RTK Query (`src/store/`)
- **Styling**: Tailwind CSS (`tailwind.config.ts`, `src/app/globals.css`)
- **AI Agent**: MCP tools in `src/lib/mcp/tools/`, skills in `src/lib/mcp/skills/`
- **Tests**: Vitest (unit, `src/**/*.test.ts`), Playwright (e2e, `e2e/`)

### Key File Locations
```
src/app/layout.tsx              ← Root layout, metadata, body classes
src/app/globals.css             ← CSS variables, base styles, animations
tailwind.config.ts              ← Color tokens, animation, screens
src/components/Header.tsx       ← App header (logo, nav, user)
src/components/Navigation.tsx   ← Desktop top-nav + mobile bottom-nav
src/components/GoalCard.tsx     ← Main goal card (home page)
src/components/LandingPage.tsx  ← Unauthenticated landing
src/components/AppShell.tsx     ← Root client wrapper
src/lib/auth.ts                 ← getCurrentUser() — Clerk→Prisma sync
src/lib/mcp/                    ← AI agent tools and skills
```

### Test Status (as of 2026-02-26)
- **813 tests, 104 files** — all passing
- Coverage: ~79% (target ≥80% in STORY-022)

### Uncommitted Changes (from last session)
- `next.config.mjs` — serverExternalPackages fix
- `src/components/Root.tsx` — `as any` type fix
- health route default import fix
- `src/components/GoalCard.test.tsx` — mock fixes
- `src/lib/streaks/goalStreakUpdater.ts` — UTC→local timezone fix
- All docs/plans files from Round 2

---

## Common Patterns

### Adding a new color token (Tailwind)
Edit `tailwind.config.ts` → `theme.extend.colors`

### API route pattern
```ts
// src/app/api/[resource]/route.ts
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth';
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getCurrentUser(userId);
  // ...
}
```

### Test mock for RTK Query hooks
```ts
vi.mock('@/store/slices/goalsSlice', () => ({
  useUpdateGoalMutation: () => [vi.fn(), { isLoading: false }],
}));
```

### MCP Tool pattern
```ts
// src/lib/mcp/tools/myTool.ts
export const toolDefinition = { name: 'my_tool', description: '...', inputSchema: {...} };
export async function executeMyTool(args: MyArgs, userId: string | undefined) {
  if (!userId) return { success: false, error: 'Unauthorized' };
  // ... prisma calls ...
  return { success: true, data: result };
}
```
