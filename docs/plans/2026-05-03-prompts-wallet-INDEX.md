# Prompts Wallet — Implementation Tracker (INDEX)

> **Date opened:** 2026-05-03
> **Design:** `2026-05-03-prompts-wallet-design.md` (read this first in every fresh session)
> **Branch convention:** `feat/prompts-wallet-stepN-<slug>` (one branch per step, merged sequentially)
> **Test bar:** `npm run test` green; coverage ≥ 80%; `npm run lint` clean.

---

## How a Fresh Session Should Start

1. Read this INDEX top-to-bottom.
2. Read `2026-05-03-prompts-wallet-design.md` once.
3. Identify the next 🚧 step.
4. Read that step's plan file end-to-end.
5. Run `git status` + `npm run test` to confirm clean baseline.
6. Execute the step. Close out by ticking the row below.

---

## Step Status

| # | Step | Plan File | Status | Notes |
|---|------|-----------|--------|-------|
| 1 | Schema + types + ownership helper | `2026-05-03-prompts-wallet-step1-schema.md` | ✅ Done | Prisma models + `src/lib/prompts/ownership.ts` + tests. Run `npx prisma generate` from a WSL/Linux cwd (not `\\wsl$` UNC) so the client picks up new models; then `npm run test` + `npm run lint`. Commit on `feat/prompts-wallet-step1-schema` when git is available. |
| 2 | REST: prompt-wallets endpoints | `2026-05-03-prompts-wallet-step2-wallet-api.md` | ✅ Done | `GET/POST` `route.ts`, `PATCH/DELETE` `[id]/route.ts`, `[id]/duplicate`, `reorder`, `restore` + co-located tests |
| 3 | REST: prompt-groups + prompt-chunks | `2026-05-03-prompts-wallet-step3-group-chunk-api.md` | ✅ Done | 12 endpoints (6 groups + 6 chunks): `POST /api/prompt-groups`, `PATCH/DELETE /api/prompt-groups/[id]`, `[id]/duplicate`, `reorder`, `restore` — and mirror for `prompt-chunks`. 95 new tests. All on branch `feat/prompts-wallet` commit 85d1c4f. |
| 4 | RTK Query + composeSlice + mergeChunks | `2026-05-03-prompts-wallet-step4-store-and-merge.md` | ✅ Done | `src/store/slices/promptsSlice.ts` (19 endpoints), `composeSlice.ts` (7 actions + selectComposeRefs), `src/lib/prompts/mergeChunks.ts`; both registered in store/index.ts. 48 new tests. Commit 411d27d. |
| 5 | Leaf components: ChunkRow, ComposeChunkRow, MergedPreview | `2026-05-03-prompts-wallet-step5-leaf-components.md` | ✅ Done | `src/components/prompts/{ChunkRow,ComposeChunkRow,MergedPreview}.tsx` + tests. 28 new tests. Commit 4afb306. |
| 6 | Container components: GroupCard, ComposeDrawer, WalletDetail, WalletHeader | `2026-05-03-prompts-wallet-step6-container-components.md` | ✅ Done | All 4 containers in `src/components/prompts/`. 37 new tests. Commit 86fdeeb. |
| 7 | Top-level: WalletShell, WalletSidebar, WalletRow, /wallet page, nav entry | `2026-05-03-prompts-wallet-step7-page-and-nav.md` | ✅ Done | `src/app/wallet/page.tsx`, all 3 top-level components, Navigation.tsx edited, seedTemplates.ts. Build passes. 24 new tests. Commit e29baee. |
| 8 | E2E suite + empty-state seed templates + INDEX update | `2026-05-03-prompts-wallet-step8-e2e-and-seeds.md` | 🚧 Pending | Depends on Step 7 |

Legend: 🚧 Pending · 🔄 In Progress · ✅ Done · ⛔ Blocked

---

## Cross-Cutting Reminders

- Existing infra to reuse (do not re-build):
  - `src/lib/locks/lockGuards.ts` — `canEdit/canDelete/canAddChild/canReorder/cycleLock/getLockLevel`
  - `src/components/undo/UndoToastProvider.tsx` — `useUndoToast()`
  - `@dnd-kit/core` + `@dnd-kit/sortable` — see `TaskMiniCard` and `SubstepCard` for the canonical wiring
  - Auth: `auth()` from `@clerk/nextjs/server` + `getCurrentUser()` from `@/lib/auth`
- Test mocks required when mounting any prompts component (per MEMORY.md):
  - `vi.mock('@/components/undo/UndoToastProvider', ...)`
  - `vi.mock('@dnd-kit/sortable', ...)`
- ESLint:
  - No `console.log` (use `console.warn` / `console.error`)
  - Remove unused vars/imports — do NOT prefix with `_`
- Worktree hygiene: if any step uses parallel agents, `git worktree remove` all worktrees before running tests (Vitest picks up duplicate test files).

---

## Acceptance Criteria for Whole Feature

When **all 8 steps** are merged:

- [ ] User can create Wallet → Group → Chunk in <30s
- [ ] One-click copy of chunk content with checkmark
- [ ] Click Group → Compose populates with all chunks (replace/append confirmation if non-empty)
- [ ] Toggle/drag-reorder/Copy Merged works end-to-end
- [ ] Auto-save on blur + 600ms debounce; survives reload
- [ ] Delete Wallet/Group/Chunk → 6s undo restore works
- [ ] Lock cycle (`null → soft → hard → null`) gates edit/delete/reorder
- [ ] Duplicate works on all 3 levels
- [ ] Empty-state with 3 seed templates
- [ ] All tests green; coverage ≥80%
