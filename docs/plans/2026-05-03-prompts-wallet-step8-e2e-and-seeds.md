# Prompts Wallet — Step 8: E2E Suite + Seed Templates + Final Polish

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Sections 5 + 8)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step8-e2e-and-seeds`
> **Estimated session length:** medium (2–3h)
> **Depends on:** Step 7 (feature is end-to-end usable)
> **Unblocks:** ship 🚀

---

## Goal

Lock down the feature with end-to-end browser tests, finalize the empty-state seed template content, do one last polish pass, and update the INDEX + main MEMORY.md.

---

## Steps

### 1. Seed templates — `src/lib/prompts/seedTemplates.ts`

Three pre-built templates the user can one-click-create:

```ts
export interface SeedWallet {
  title: string;
  icon: string;
  description: string;
  groups: { title: string; description?: string; chunks: { title: string; content: string }[] }[];
}

export const SEED_TEMPLATES: SeedWallet[] = [
  {
    title: 'Coding Prompts',
    icon: '🧠',
    description: 'Reusable system prompts and review snippets for coding tasks',
    groups: [
      { title: 'System role', chunks: [
        { title: 'Senior engineer', content: 'You are a senior software engineer with 15+ years of experience. Be precise, terse, and pragmatic.' },
        { title: 'TDD-first', content: 'Write the failing test first. Then the smallest implementation that passes. Then refactor.' },
      ]},
      { title: 'Code review', chunks: [
        { title: 'Review for safety', content: 'Review the diff for: SQL safety, input validation, error handling at boundaries, and trust boundaries between user input and external calls.' },
        { title: 'Review for clarity', content: 'Review the diff for naming, function size, and whether each unit has one clear purpose.' },
      ]},
    ],
  },
  {
    title: 'Email Templates',
    icon: '✉️',
    description: 'Common professional email scaffolds',
    groups: [/* … */],
  },
  {
    title: 'Marketing Copy',
    icon: '📣',
    description: 'Reusable marketing copy chunks',
    groups: [/* … */],
  },
];
```

Wire into `WalletShell`'s empty-state seed buttons.

### 2. E2E tests — `e2e/wallet.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('Prompts Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wallet');
    // existing auth helper / Clerk test session — match repo pattern
  });

  test('create wallet → group → chunk → copy chunk content', async ({ page, context }) => { /* … */ });
  test('Group-as-recipe replaces compose', async ({ page }) => { /* … */ });
  test('inline edit chunk → reload → persists', async ({ page }) => { /* … */ });
  test('delete wallet → undo restores wallet + groups + chunks', async ({ page }) => { /* … */ });
  test('lock chunk → edit/delete buttons disabled', async ({ page }) => { /* … */ });
  test('duplicate group preserves chunk count', async ({ page }) => { /* … */ });
  test('empty-state seed creates Coding Prompts wallet', async ({ page }) => { /* … */ });
});
```

Read `e2e/` folder for the repo's existing fixtures and auth helpers. Reuse them.

### 3. Polish pass

- Run `npm run dev` and click through every flow on mobile viewport (375px). Fix any layout breaks.
- Confirm dark-mode (if applicable in this repo — check globals.css).
- Confirm all icon buttons have `title` attributes for tooltips.
- Confirm copy-with-fallback works on `localhost` (sometimes Clipboard API is restricted on http://localhost — verify).

### 4. Update MEMORY.md

Append a section to the project's auto-memory:

```md
## May 3, 2026 — Prompts Wallet ✅ COMPLETE
Plan: `docs/plans/2026-05-03-prompts-wallet-{design,INDEX}.md`

**Schema:** PromptWallet → PromptGroup → PromptChunk (3 separate Prisma models) — chosen for per-chunk auto-save granularity vs JSON-blob.
**Routes:** /wallet (3-pane). All API routes under /api/prompt-{wallets,groups,chunks}/{...}.
**State:** promptsSlice (RTK Query) + composeSlice (plain Redux, client-only).
**Reuse:** lockGuards, UndoToastProvider, @dnd-kit patterns from SubstepCard/TaskMiniCard.
**Test mocks:** must mock useUndoToast and useSortable per existing patterns.
```

### 5. Update INDEX

Tick row #8 → ✅ Done. Add a "Completed ✅" row to the master `docs/plans/INDEX.md` for the whole feature with the merge commit hash.

### 6. Commit

`feat(prompts-wallet/step8): E2E + seeds + polish`

Then merge `feat/prompts-wallet-step8-e2e-and-seeds` into `main` (PR-flow per repo convention) — feature is done.

---

## Verification Checklist

- [ ] `npm run test` — all unit tests green
- [ ] `npm run test:e2e` — all 7 E2E tests green
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Coverage ≥ 80%
- [ ] Manual mobile (375px) walk-through passes
- [ ] Empty-state seed buttons create real wallets with correct content
- [ ] MEMORY.md and INDEX.md updated
- [ ] All 8 step branches merged

## Out of Scope (officially Phase 2)

Per design doc Section 10: variables, search, MCP agent tools, tags, cross-group/cross-wallet drag, sharing, version history, per-Group separator override, Compose persistence, optimistic concurrency control.
