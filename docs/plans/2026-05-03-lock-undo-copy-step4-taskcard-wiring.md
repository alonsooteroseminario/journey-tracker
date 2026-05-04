# Step 4 — TaskMiniCard lock + copy + undo wiring

**Depends on:** Steps 1, 2
**Can run in parallel with:** Step 3, Step 6
**Estimated session size:** medium

## Goal

Add to `TaskMiniCard`:
- Lock button + visual badge (mirrors SubstepCard).
- Copy-as-Markdown button (uses `taskToMarkdown` helper).
- Delete wiring with undo toast.

## Files to touch

| File | Action |
|---|---|
| `src/components/TaskMiniCard.tsx` | edit |
| `src/components/TaskMiniCard.test.tsx` | new (if not present) — test the new buttons |

## TODOs

1. **Props additions:**
   ```ts
   interface TaskMiniCardProps {
     // …existing…
     onUpdateLock?: (lockLevel: LockLevel) => void;
     onRestore?: () => void;  // optional; toast hides Undo when missing
   }
   ```

2. **Imports:**
   ```ts
   import { canDelete, canEdit, canAddChild, getLockLevel, cycleLock } from '@/lib/locks/lockGuards';
   import { taskToMarkdown } from '@/lib/clipboard/taskToMarkdown';
   import { useUndoToast } from '@/components/undo/UndoToastProvider';
   ```

3. **Lock button** — new button in hover-action row, before Delete. Same SVG/styles as SubstepCard for visual consistency. `onClick={() => onUpdateLock?.(cycleLock(getLockLevel(task)))}`.

4. **Lock badge** — left of the task title, same outline/filled styling as SubstepCard.

5. **Copy button** — new button in hover-action row, leftmost in the group:
   ```ts
   const [copied, setCopied] = useState(false);
   const handleCopy = async () => {
     await navigator.clipboard.writeText(taskToMarkdown(task));
     setCopied(true);
     setTimeout(() => setCopied(false), 1500);
   };
   ```
   Icon: identical to SubstepCard's copy button (clipboard SVG); checkmark on `copied`.

6. **Edit gating** — `canEdit(task)` controls the edit button enabled state.
7. **Add-substep gating** — `canAddChild(task)` controls whether the "+ Add substep" button is shown/enabled.
8. **Delete gating + undo** — same pattern as Step 3:
   - `!canDelete(task)` → disabled + tooltip `"Locked"`.
   - Allowed: call `onDelete()` then `showUndoToast({ message: \`Task "${task.title}" deleted\`, onUndo: onRestore ?? noop })`. If `onRestore` missing, hide undo button (Step 2 should already support this).

9. **Drag handle gating** — `canReorder(task)`: when false, omit listeners from the drag handle.

## Tests

Create `src/components/TaskMiniCard.test.tsx` (or add to existing if present):

- Mocks at top:
  ```ts
  vi.mock('@/components/undo/UndoToastProvider', () => ({
    useUndoToast: () => ({ showUndoToast: vi.fn() }),
    UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
  vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }),
    SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
  }));
  ```

- Copy button click → `navigator.clipboard.writeText` called with markdown output (mock clipboard).
- Copy button shows checkmark for ~1.5s after click.
- Lock badge present when `lockLevel === 'soft'` / `'hard'`.
- Lock button cycles via `onUpdateLock`.
- Hard-locked: edit disabled, delete disabled, "+ Add substep" hidden/disabled.
- Soft-locked: only delete disabled.
- Delete (unlocked) calls `onDelete` + `showUndoToast`.

## Acceptance criteria

- `npm run lint` clean.
- `npm run test src/components/TaskMiniCard` — all pass.
- `npm run test` full suite still passes.
- Manual smoke: in the app, hover a task → see Copy / Lock / Edit / Delete buttons. Copy paste into a markdown editor renders correctly with substep checkboxes.

## Test commands

```bash
npm run lint
npm run test src/components/TaskMiniCard
npm run test
npm run dev
```

## Notes for next session

- Step 5 wires the actual `onUpdateLock` / `onRestore` callbacks from `GoalCard` → `TaskList` → `TaskMiniCard` and `SubstepCard`.
- Update INDEX.md status row.
