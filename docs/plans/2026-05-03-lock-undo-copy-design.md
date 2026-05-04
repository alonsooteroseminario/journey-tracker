# Lock / Undo / Copy — Design Spec

**Date:** 2026-05-03
**Topic:** `lock-undo-copy`
**Status:** Awaiting user review
**Author:** brainstormed via superpowers:brainstorming

---

## 1. Goals

Three independent quality-of-life features for tasks and substeps inside a Goal:

1. **Two-level lock** on tasks and substeps so users can protect items from edit/delete.
2. **Copy a full task as Markdown** to clipboard, including its substeps with status checkboxes.
3. **Undo toast** for task and substep deletes so accidental deletions are recoverable.

A fourth idea ("hide tabs and workflow on template/marketplace pages") was scoped out of this spec at user request.

## 2. Non-goals

- No goal-level lock (only task / substep).
- No persistent trash, no Cmd+Z stack — undo is a 6-second toast on the most recent delete only.
- No undo for goal delete, edit, or AI-agent-driven deletes in v1.
- No clipboard copy for cost or substep description fields.
- No DB schema migration — all new fields live inside the existing `Goal.tasks` JSON column.

---

## 3. Feature 1 — Two-Level Lock

### 3.1 Data model

Add to `Task` and `Substep` types in `src/types/index.ts`:

```ts
lockLevel?: 'none' | 'soft' | 'hard';
lockedAt?: string; // ISO date
```

Fields are optional. Missing/undefined is treated as `'none'` everywhere via the guard helpers (Section 3.3). Existing data continues to work without migration.

### 3.2 Behavior matrix

| Action | none | soft | hard |
|---|---|---|---|
| Edit title / notes / cost | ✅ | ✅ | ❌ |
| Status toggle (complete / in-progress) | ✅ | ✅ | ✅ |
| Add substep (task only) | ✅ | ✅ | ❌ |
| Reorder via drag | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Archive | ✅ | ✅ | ❌ |
| Change lock level | ✅ | ✅ | ✅ |

Status toggle stays allowed at hard-lock so streaks and progress continue to work.
Lock level itself is always changeable so users are never trapped.

**Parent ↔ child lock independence:** Locks are per-item. Locking a task does NOT automatically lock its substeps, and substep locks do NOT cascade to the parent task. A hard-locked task with unlocked substeps still allows substep edit/delete (because the substep itself is unlocked) — but `canAddChild(task) === false` still prevents *adding new* substeps to that task. Predictable and simple.

### 3.3 Lock guard helpers — `src/lib/locks/lockGuards.ts`

Pure functions, zero React/Prisma dependencies:

```ts
export type LockLevel = 'none' | 'soft' | 'hard';

interface Lockable { lockLevel?: LockLevel }

export const getLockLevel = (item: Lockable): LockLevel => item.lockLevel ?? 'none';
export const canDelete   = (item: Lockable): boolean => getLockLevel(item) === 'none';
export const canEdit     = (item: Lockable): boolean => getLockLevel(item) !== 'hard';
export const canAddChild = (item: Lockable): boolean => getLockLevel(item) !== 'hard';
export const canReorder  = (item: Lockable): boolean => getLockLevel(item) !== 'hard';

export const cycleLock = (current: LockLevel): LockLevel =>
  current === 'none' ? 'soft' : current === 'soft' ? 'hard' : 'none';
```

Unit-tested independently of UI.

### 3.4 UI

- **Lock button** appears in the hover-action row of `TaskMiniCard` and `SubstepCard` (next to Copy / Edit / Delete).
- Click cycles `none → soft → hard → none`.
- Tooltip shows current state, e.g. `"🔓 Unlocked — click to soft-lock"`.
- **Visual badge** at the left of the title:
  - none → no badge
  - soft → outline lock icon, gray
  - hard → filled lock icon, brand-primary
- **Disabled buttons** (delete, edit when hard) get reduced opacity + tooltip `"Locked"` rather than being hidden — users see *why* the action is unavailable.

### 3.5 MCP agent guard

The four mutating tools (`deleteTask`, `deleteSubstep`, `updateTask`, `updateSubstep` — exact filenames in `src/lib/mcp/tools/`) call the guard helpers before mutating and return a clear error message. Example:

```ts
if (!canDelete(task)) {
  return { error: `Cannot delete task "${task.title}": it is locked. Unlock it first.` };
}
```

The error surfaces to the user via the SSE stream.

---

## 4. Feature 2 — Copy Full Task as Markdown

### 4.1 UI

- New **copy button** in `TaskMiniCard` hover-action row, leftmost in the group.
- Mirrors the existing `SubstepCard` pattern: same icon, same 1.5-second checkmark feedback via `copied` state.
- Calls `navigator.clipboard.writeText(taskToMarkdown(task))`.

### 4.2 Markdown format

```
## {task.title}
{task.description}                    ← optional, blank line below

- [x] {substep title}                 ← status === 'completed'
- [ ] {substep title}                 ← status !== 'completed'
  ↳ {substep notes}                   ← optional, indented child line
```

- Heading level `##` (works in Obsidian, GitHub, Notion).
- Substep `description` excluded (rarely set; keeps clipboard tight).
- Substep `notes` included (already surfaced in SubstepCard UI).
- Cost / dates / tags excluded by default to keep the paste-target output clean.
- Empty case (no substeps): copies just `## title` + description.

### 4.3 Helper — `src/lib/clipboard/taskToMarkdown.ts`

```ts
export function taskToMarkdown(task: Task): string { /* … */ }
```

Pure function, unit-tested. Reusable later by AI agent tools (e.g. agent `summarizeTask`).
SubstepCard's existing inline `writeText(substep.title)` stays as-is — single line, not worth abstracting.

---

## 5. Feature 3 — Undo Toast for Deletes

### 5.1 Scope

- Manual delete of a task → undo restores the task with all its substeps and original index.
- Manual delete of a substep → undo restores the substep with original index inside its parent task.
- Out of scope: goal delete, AI-agent deletes, edits, archives. (Future expansion is documented but not built.)

### 5.2 UX flow

1. User clicks delete on a task or substep.
2. Item disappears immediately (optimistic — already how RTK Query works).
3. Toast snackbar slides up bottom-center: `"Task deleted"` + **[Undo]** button + auto-dismiss progress bar.
4. Window: **6 seconds**. Hovering the toast pauses the timer.
5. Click **[Undo]** → restore item at its original index, dismiss toast.
6. Timer expires → toast fades out. Action committed. (Data was already mutated in step 2; "commit" just drops the snapshot.)
7. New delete during active toast → previous toast auto-commits and dismisses, new one replaces it. One toast at a time.

### 5.3 Architecture

**`UndoToastProvider`** — React Context provider mounted in `AppShell.tsx` (single client boundary, plays nicely with existing Redux Provider).

```ts
// src/components/undo/UndoToastProvider.tsx
interface ShowUndoToastArgs {
  message: string;
  onUndo: () => void;
  durationMs?: number; // default 6000
}

export const useUndoToast: () => { showUndoToast: (args: ShowUndoToastArgs) => void };
```

Deleting components capture a snapshot, perform the optimistic mutation, then call `showUndoToast`:

```ts
const snapshot = { task: deletedTask, originalIndex };
await deleteTask(taskId);
showUndoToast({
  message: `Task "${task.title}" deleted`,
  onUndo: () => restoreTask(snapshot),
});
```

**Restore helpers** live alongside the existing RTK mutations in `src/store/slices/goalsSlice.ts` (or a thin wrapper). They:

1. Read the current `Goal.tasks` array from the RTK Query client cache (the same source the UI is rendering from — no extra server round-trip).
2. Splice the snapshot back in at `originalIndex` (clamped to current array length in case other tasks were reordered/deleted in the interim).
3. Call existing `updateGoal` mutation (single Prisma write, per the read-modify-write rule in CLAUDE.md). RTK Query's `invalidatesTags` triggers the standard re-fetch.
4. Preserve the substep tree, lock state, and IDs from the snapshot (so external references like phase `taskIds` stay valid).

### 5.4 Accessibility

- Toast has `role="alert"` and `aria-live="polite"`.
- Undo button is keyboard-focusable; `Esc` while toast is focused dismisses early without undoing.
- Reduced motion: respect `prefers-reduced-motion` for the slide-up.

### 5.5 Edge cases

- **Page refresh during 6s window** → undo opportunity lost. Acceptable for v1; matches Gmail.
- **Locked items** → can't be deleted (Section 3), so no interaction conflict.
- **AI agent deletes** → no toast in v1. Documented as future work.
- **Concurrent deletes from another tab/device** → restore may fail if the goal has been mutated; surface a friendly `"Couldn't restore — goal changed"` toast and drop the snapshot.

---

## 6. File map

| Area | File | Status |
|---|---|---|
| Types | `src/types/index.ts` | edit — add lock fields |
| Lock helper | `src/lib/locks/lockGuards.ts` | new |
| Lock helper test | `src/lib/locks/lockGuards.test.ts` | new |
| Markdown helper | `src/lib/clipboard/taskToMarkdown.ts` | new |
| Markdown helper test | `src/lib/clipboard/taskToMarkdown.test.ts` | new |
| Undo provider | `src/components/undo/UndoToastProvider.tsx` | new |
| Undo provider test | `src/components/undo/UndoToastProvider.test.tsx` | new |
| AppShell | `src/components/AppShell.tsx` | edit — wrap children |
| TaskMiniCard | `src/components/TaskMiniCard.tsx` | edit — lock + copy + undo |
| TaskMiniCard test | new alongside | new |
| SubstepCard | `src/components/SubstepCard.tsx` | edit — lock + undo |
| SubstepCard test | `src/components/SubstepCard.test.tsx` | edit — add new mocks |
| TaskList | `src/components/TaskList.tsx` | edit — pipe restore callbacks |
| GoalCard | `src/components/GoalCard.tsx` | edit — wire restoreTask/restoreSubstep |
| GoalCard test | `src/components/GoalCard.test.tsx` | edit — add useUndoToast mock |
| MCP tools | `src/lib/mcp/tools/{deleteTask,deleteSubstep,updateTask,updateSubstep}.ts` | edit — lock guards |
| MCP tool tests | alongside each | edit |

No DB migration. No new dependencies.

---

## 7. Test mock additions

Add to any test file that mounts a component using the undo toast (per existing GoalCard.test.tsx pattern):

```ts
vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: vi.fn() }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

---

## 8. Step decomposition

Seven self-contained steps, each picked up by a fresh Claude session reading only its own track doc + this design.

| Step | Title | Depends on | Track file |
|---|---|---|---|
| 1 | Foundations — types + pure helpers | — | `2026-05-03-lock-undo-copy-step1-foundations.md` |
| 2 | UndoToastProvider — UI infra | 1 | `2026-05-03-lock-undo-copy-step2-undo-provider.md` |
| 3 | SubstepCard wiring | 1, 2 | `2026-05-03-lock-undo-copy-step3-substep-wiring.md` |
| 4 | TaskMiniCard wiring + copy button | 1, 2 | `2026-05-03-lock-undo-copy-step4-taskcard-wiring.md` |
| 5 | restoreTask/restoreSubstep + GoalCard integration | 3, 4 | `2026-05-03-lock-undo-copy-step5-restore-integration.md` |
| 6 | MCP agent tool guards | 1 | `2026-05-03-lock-undo-copy-step6-agent-guards.md` |
| 7 | End-to-end verification | all | `2026-05-03-lock-undo-copy-step7-verification.md` |

A rolling index at `docs/plans/2026-05-03-lock-undo-copy-INDEX.md` tracks each step's status (pending / in-progress / done) so any fresh session can find the next task.

Steps 3 and 4 can run in parallel after Step 2. Step 6 can run in parallel with Steps 2–5 (only depends on Step 1).

---

## 9. Open decisions

None. All four user choices captured:
- Lock scope: D — two levels (soft + hard)
- Copy format: B — Markdown
- Undo: A + i — toast snackbar, deletes only
- Hide tabs/workflow: deferred / out of scope
