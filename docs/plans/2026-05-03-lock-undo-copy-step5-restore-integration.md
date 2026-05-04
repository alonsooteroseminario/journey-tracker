# Step 5 — Restore callbacks + GoalCard/TaskList integration

**Depends on:** Steps 3, 4
**Estimated session size:** medium

## Goal

End-to-end wire-up:
- New `restoreTask` and `restoreSubstep` helpers that splice a snapshot back into `Goal.tasks` and call the existing `updateGoal` mutation.
- `onUpdateLock` and `onRestore` props piped from `GoalCard` → `TaskList` → `TaskMiniCard` (and through to `SubstepCard`).
- Update `GoalCard.test.tsx` mocks to include the undo provider mock.

## Files to touch

| File | Action |
|---|---|
| `src/components/GoalCard.tsx` | edit |
| `src/components/GoalCard.test.tsx` | edit — add `useUndoToast` mock |
| `src/components/TaskList.tsx` | edit — accept and pipe new props |
| (optionally) `src/store/slices/goalsSlice.ts` | edit — colocate restore helpers, OR keep them inline in GoalCard |

## TODOs

### A. Restore helpers (in GoalCard.tsx, or extract if reused)

```ts
type TaskSnapshot   = { task: Task; originalIndex: number };
type SubstepSnapshot = { substep: Substep; parentTaskId: string; originalIndex: number };

function restoreTask(goal: Goal, snap: TaskSnapshot, updateGoal: UpdateGoalMutation) {
  const tasks = [...(goal.tasks ?? [])];
  const idx = Math.min(snap.originalIndex, tasks.length);
  tasks.splice(idx, 0, snap.task);
  return updateGoal({ id: goal.id, tasks });
}

function restoreSubstep(goal: Goal, snap: SubstepSnapshot, updateGoal: UpdateGoalMutation) {
  const tasks = (goal.tasks ?? []).map(t => {
    if (t.id !== snap.parentTaskId) return t;
    const subs = [...(t.substeps ?? [])];
    const idx = Math.min(snap.originalIndex, subs.length);
    subs.splice(idx, 0, snap.substep);
    return { ...t, substeps: subs };
  });
  return updateGoal({ id: goal.id, tasks });
}
```

(Use the actual mutation hook signature from `goalsSlice` — adjust the function signatures accordingly.)

### B. Capture snapshot before delete

In `GoalCard`'s existing `handleDeleteTask` and `handleDeleteSubstep`:
1. Find the item in `goal.tasks` and record `{ item, originalIndex }` (for substep, also `parentTaskId`).
2. Call existing delete logic (read-modify-write `updateGoal`).
3. Pass the snapshot via the `onRestore` callback prop on `TaskMiniCard` / `SubstepCard`. The card's delete handler invokes `showUndoToast({ message, onUndo: () => onRestore?.() })`.

Cleanest split: `GoalCard` builds the `onDelete` and `onRestore` closures and passes both down through `TaskList`.

### C. Lock update wiring

Add `handleUpdateTaskLock(taskId, lockLevel)` and `handleUpdateSubstepLock(taskId, substepId, lockLevel)` in `GoalCard`. Both:
- Read `goal.tasks`, mutate the matching item's `lockLevel` and `lockedAt = new Date().toISOString()` (or clear `lockedAt` when going to `'none'`).
- Call `updateGoal({ id, tasks })`.

Pipe these through `TaskList` to `TaskMiniCard` (and from `TaskMiniCard` to `SubstepCard` for substep locks).

### D. TaskList pass-through

`src/components/TaskList.tsx` — add to `TaskListProps`:
```ts
onUpdateTaskLock?: (taskId: string, lockLevel: LockLevel) => void;
onRestoreTask?: (snapshot: TaskSnapshot) => void;
onUpdateSubstepLock?: (taskId: string, substepId: string, lockLevel: LockLevel) => void;
onRestoreSubstep?: (snapshot: SubstepSnapshot) => void;
```
Pipe straight through to `TaskMiniCard`.

### E. Test mock updates in `GoalCard.test.tsx`

Add at the top of the file alongside existing mocks:
```ts
vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: vi.fn() }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

Add new test cases:
- Deleting a task triggers the toast with `onUndo` callback.
- Calling that `onUndo` triggers the `useUpdateGoalMutation` mock with the task spliced back at its index.
- Soft-locking a task disables its delete button.
- Hard-locking a task disables its edit button.

## Acceptance criteria

- `npm run lint` clean.
- `npm run test` full suite passes.
- Manual smoke:
  1. Delete a task → toast appears → click Undo → task reappears at original position with substeps intact.
  2. Same for a substep.
  3. Lock a task soft → delete button greyed out with "Locked" tooltip.
  4. Lock hard → edit button also disabled, "+ Add substep" hidden/disabled.
  5. Cycle lock back to none → all controls re-enable.

## Test commands

```bash
npm run lint
npm run test
npm run dev
```

## Notes for next session

- Step 6 (agent guards) can run in parallel with this if not already done.
- Step 7 is the final QA pass.
- Update INDEX.md status row.
