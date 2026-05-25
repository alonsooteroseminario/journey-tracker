# docs/plans — Compaction Library & Status Tracker

> This file is the **living index** of all plans and implementation status.
> Use it as memory between sessions — update status as work completes.
> Last updated: 2026-05-24

---

## How To Use This Index

Each session: read this file first to orient yourself. Check **Status** and **Notes** columns before starting work.

---

## Current Project State (2026-05-24)

- **App name**: Cadence (renamed from Journey Tracker)
- **Branch**: `main` — all features merged
- **Tests**: 1444 total, ~1429 passing (15 pre-existing failures in agent/chat route, prompt-wallet title-length validation, daily-reminders cron)
- **Coverage**: ~80%+ statements on src/lib/ and src/app/api/
- **Deployment**: Vercel, auto-deploys from main

### Known Pre-Existing Test Failures (do not fix unless tasked)
- `src/app/api/agent/chat/route.test.ts` — 2 tests
- `src/app/api/prompt-wallets/route.test.ts`, `prompt-groups/`, `prompt-chunks/` — title-length 400 tests
- `src/app/api/cron/daily-reminders/route.test.ts` — 3 tests
- `src/components/chat/ChatWidget.test.tsx` — 1 test

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
| `2026-02-26-chat-header-splitview-plan.md` | Chat Header + Split View | ✅ Done | Chat trigger in Header, floating/split panel |
| `2026-03-08-social-sharing-plan.md` | Social Streak Sharing | ✅ Done | next/og 1080×1080 PNG, ShareStreakModal, Web Share API |
| `2026-03-09-goal-status-sharing-design.md` | Goal Status Sharing | ✅ Done | next/og goal card image, ShareGoalStatusModal |
| `2026-03-08-substep-copy-ci-disable-plan.md` | Substep copy + CI disable | ✅ Done | 1-click copy title, CI triggers commented out |
| `2026-03-29-cost-tracker-integration-plan.md` | Cost Tracker Integration | ✅ Done | BYOK Anthropic key, LLMCredential model, logAnthropicUsage |
| `2026-05-03-lock-undo-copy-INDEX.md` | Lock / Undo / Copy | ✅ Done | lockGuards, UndoToastProvider, SubstepCard+TaskMiniCard wiring, MCP guards |
| `2026-05-03-prompts-wallet-INDEX.md` | Prompts Wallet | ✅ Done | 3-tier snippet manager (Wallet→Group→Chunk), compose drawer, seed templates. Route: /wallet |
| `2026-05-10-wallet-copy-title-plan.md` | Wallet copy-title fix | ✅ Done | ChunkRow copy button copies chunk title (commit cd0daf9) |
| `2026-05-10-enable-github-actions-plan.md` | Re-enable GitHub Actions CI | ✅ Done | Triggers uncommented + prisma generate + build step (commit c9bc5f9) |
| `2026-05-10-hide-templates-marketplace-plan.md` | Hide Templates+Marketplace nav | ✅ Done | Nav links hidden; routes preserved (commit 29c12bd) |
| `2026-05-10-goalcard-tabs-audit-plan.md` | GoalCard conditional tabs | ✅ Done | Tabs render conditionally on data (commit 82f9409) |
| `2026-05-10-dark-mode-toggle-plan.md` | Dark mode Phase A+B | ✅ Done | CSS variables + semantic tokens. Phase A: infra. Phase B: high-traffic surfaces |
| `2026-05-16-f1-dark-mode-steps.md` | Dark mode full migration (F1) | ✅ Done | Semantic token system, full codebase codemod (3 phases), LandingPage pinned to light |
| `2026-05-16-f2-agent-api-key-steps.md` | BYOK Agent API Key (F2) | ✅ Done | Settings page, validateKey endpoint, cost-tracking redirect, chat gate. 23 tests |
| `2026-05-16-f3-header-in-appshell-steps.md` | Header in AppShell (F3) | ✅ Done | HeaderHost renders Header in AppShell; per-page Header imports removed |
| `2026-05-16-f4-wallet-sharing-steps.md` | Wallet Sharing (F4) | ✅ Done | shareToken field, owner share API (POST/DELETE/rotate), public read + clone API, SharedWalletView |
| `2026-05-16-f5-mcp-rest-api-steps.md` | MCP REST API (F5) | ✅ Done | External MCP endpoints: /api/mcp/tools, /api/mcp/skills, /api/mcp/health. Shared Zod handler |
| _(no plan file)_ | Email reminders — task digest | ✅ Done | Bell toggle on tasks/substeps, hourly cron, 2hr interval per `reminderStartTime`. `src/app/api/cron/task-reminders/` |
| _(no plan file)_ | Email reminders — streak-protect | ✅ Done | Hourly cron warns before streak loss, daily dedup via `streakProtectLastSentDate`. `src/app/api/cron/streak-protect/` |
| _(no plan file)_ | AI context in reminder emails | ✅ Done | `generateAiContext()` (BYOK Haiku) inserts personalized motivational sentence into both reminder emails |
| _(no plan file)_ | App renamed Cadence | ✅ Done | Journey Tracker → Cadence (commit 302e8a5). Landing page redesigned. |

### Nothing Pending

All planned and tracked work is complete as of 2026-05-24. Next features should start from a new plan.

---

## Architecture Quick Reference

### Tech Stack
- **Framework**: Next.js 15 App Router (`src/app/`)
- **Auth**: Clerk (`@clerk/nextjs`) — middleware in `src/middleware.ts`
- **DB**: Prisma + MongoDB (`prisma/schema.prisma`)
- **State**: Redux Toolkit + RTK Query (`src/store/`)
- **Styling**: Tailwind CSS with semantic dark-mode tokens (`tailwind.config.ts`, `globals.css`)
- **AI Agent**: MCP tools in `src/lib/mcp/tools/`, skills in `src/lib/mcp/skills/`; BYOK Anthropic key via `getUserAgentKey(clerkId)`
- **Email**: Resend + React Email (`src/lib/email/`); crons at `src/app/api/cron/`
- **Tests**: Vitest + happy-dom (unit), Playwright (e2e `e2e/`)

### Key File Locations
```
src/app/layout.tsx                    ← Root layout, metadata, body classes
src/app/globals.css                   ← CSS variables incl. dark mode tokens
tailwind.config.ts                    ← Color tokens (semantic: brand-*, surface-*, text-*)
src/components/AppShell.tsx           ← Root client boundary; mounts Header + ChatWidget + UndoToastProvider
src/components/Header.tsx             ← App header (BrandLogo, Navigation, user controls, ThemeToggle)
src/components/Navigation.tsx         ← Desktop top-nav + mobile bottom-nav
src/components/GoalCard.tsx           ← Main goal card (home page)
src/components/LandingPage.tsx        ← Unauthenticated landing (pinned light theme)
src/components/prompts/               ← Wallet feature components (WalletShell, WalletDetail, etc.)
src/app/wallet/page.tsx               ← /wallet route
src/app/api/cron/task-reminders/      ← 2-hr task reminder cron
src/app/api/cron/streak-protect/      ← Hourly streak-at-risk warning cron
src/app/api/cron/daily-reminders/     ← Morning digest cron (overdue tasks)
src/app/api/mcp/                      ← External MCP REST API (tools, skills, health)
src/lib/auth.ts                       ← getCurrentUser() — Clerk→Prisma sync
src/lib/email/generateAiContext.ts    ← BYOK Haiku call for email personalization
src/lib/email/templates/              ← React Email templates
src/lib/mcp/                          ← AI agent tools and skills
src/lib/locks/lockGuards.ts           ← Lock/canEdit/canDelete guards for tasks+substeps
src/components/undo/UndoToastProvider.tsx ← Undo toast context (6s, hover-pause)
src/store/slices/promptsSlice.ts      ← RTK Query for wallets/groups/chunks (19 endpoints)
src/store/slices/composeSlice.ts      ← Client-only compose drawer state
```

### Dark Mode Architecture
- All colors use semantic Tailwind tokens: `bg-surface-primary`, `text-primary`, `border-subtle`, etc.
- Tokens defined in `tailwind.config.ts` → `theme.extend.colors` with `.dark:` variants
- `ThemeToggle` component in Header persists choice to `localStorage`
- `LandingPage` is pinned to light via `data-theme="light"` — dark mode does not apply there

### Email / Cron Architecture
- All cron routes require `Authorization: Bearer ${CRON_SECRET}` header
- `?force=true` bypasses time/dedup checks for manual testing
- `reminderLastSentAt` (EmailPreferences) — 15-min cooldown prevents Vercel retry duplicates
- `streakProtectLastSentDate` (EmailPreferences) — daily dedup for streak warnings
- `generateAiContext(clerkId, prompt)` — uses BYOK key → Haiku, 5s timeout, returns `null` on failure; email still sends without it

### BYOK Agent Key Flow
```
Settings page → POST /api/agent/settings → encrypt → LLMCredential (Prisma)
                                                          ↓
Agent chat route / cron → getUserAgentKey(clerkId) → decrypt → Anthropic client
```

### Test Patterns
```ts
// Prisma mock (already global in src/test/setup.ts — do NOT re-declare)
vi.mocked(prisma.goal.findUnique).mockResolvedValue({ ... });

// RTK Query hook mock
vi.mock('@/store/slices/goalsSlice', () => ({
  useUpdateGoalMutation: () => [vi.fn(), { isLoading: false }],
}));

// UndoToastProvider mock (required for any component using useUndoToast)
vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: vi.fn() }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// DnD kit mock
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }),
}));

// generateAiContext mock (for cron route tests)
vi.mock('@/lib/email/generateAiContext', () => ({
  generateAiContext: vi.fn().mockResolvedValue(null),
}));
```

### API Route Pattern
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

### MCP Tool Pattern
```ts
// src/lib/mcp/tools/myTool.ts
export const toolDefinition = { name: 'my_tool', description: '...', inputSchema: {...} };
export async function executeMyTool(args: MyArgs, userId: string | undefined) {
  if (!userId) return { success: false, error: 'Unauthorized' };
  // ... prisma calls ...
  return { success: true, data: result };
}
```
