# Step 3 — SubstepCard lock + undo wiring

**Depends on:** Steps 1, 2
**Can run in parallel with:** Step 4, Step 6
**Estimated session size:** small

## Goal

Add the lock button + visual badge to `SubstepCard`, and wire its delete to call the undo toast with a restore callback prop.

## Files to touch

| File | Action |
|---|---|
| `src/components/SubstepCard.tsx` | edit |
| `src/components/SubstepCard.test.tsx` | edit — add new mocks + new test cases |

## TODOs

1. **Props API additions:**
   ```ts
   interface SubstepCardProps {
     // …existing…
     onUpdateLock?: (lockLevel: LockLevel) => void;  // optional for backward compat
   }
   ```
   `onDelete` already exists — no new prop. Restore is handled by parent (Step 5).

2. **Imports:**
   ```ts
   import { canDelete, canEdit, getLockLevel, cycleLock } from '@/lib/locks/lockGuards';
   import { useUndoToast } from '@/components/undo/UndoToastProvider';
   ```

3. **Lock button** — new button in the hover-action row, placed immediately before the Delete button. Icon: lock-open / lock-closed SVG. `onClick={() => onUpdateLock?.(cycleLock(getLockLevel(substep)))}`.

4. **Visual badge** — small lock icon to the LEFT of the title `<p>` element. Show only if `getLockLevel(substep) !== 'none'`. Outline if soft, filled brand-primary if hard.

5. **Edit gating** — `canEdit(substep)` controls whether the edit button is enabled. When disabled: `opacity-40 cursor-not-allowed`, tooltip `"Locked"`.

6. **Delete gating + undo wiring**:
   - If `!canDelete(substep)`: button disabled with `"Locked"` tooltip.
   - If allowed: clicking calls `onDelete()` (parent does optimistic mutation), THEN calls `useUndoToast().showUndoToast({ message: \`Substep "${substep.title}" deleted\`, onUndo: () => onRestore() })`.
   - `onRestore` is added as a new optional prop:
     ```ts
     onRestore?: () => void;
     ```
     If parent doesn't pass it, the toast still shows but `[Undo]` is hidden / disabled. Default behavior: show the toast with undo only when both `onDelete` and `onRestore` are provided. Step 5 wires `onRestore` end-to-end.

7. **Status toggle (existing)** stays untouched — works at all lock levels per §3.2.

8. **Drag handle gating** — apply `canReorder(substep)` to the dnd-kit listeners. When false, omit `{...listeners}` from the drag handle (or render the handle disabled).

## Tests

Add to `SubstepCard.test.tsx`:

- New mock at top:
  ```ts
  vi.mock('@/components/undo/UndoToastProvider', () => ({
    useUndoToast: () => ({ showUndoToast: vi.fn() }),
    UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
  ```
- Lock badge appears when `lockLevel === 'soft'` or `'hard'`.
- No badge when `lockLevel` undefined.
- Click lock button calls `onUpdateLock` with cycled value (`undefined → 'soft'`, `'soft' → 'hard'`, `'hard' → 'none'`).
- Soft-locked: edit button enabled, delete button has `"Locked"` title.
- Hard-locked: both edit and delete disabled with `"Locked"` title.
- Delete (when unlocked) calls both `onDelete` and `showUndoToast`.

## Acceptance criteria

- `npm run lint` clean.
- `npm run test src/components/SubstepCard` — all pass.
- `npm run test` full suite still passes (callers that don't pass `onUpdateLock` / `onRestore` continue to work).
- Manual smoke: in the app, open a goal, expand a task, the substep row shows lock button on hover; cycling works; delete still works (toast shown but undo no-op until Step 5).

## Test commands

```bash
npm run lint
npm run test src/components/SubstepCard
npm run test
npm run dev
```

## Notes for next session

- `onUpdateLock` and `onRestore` are still optional. Step 5 will make them work end-to-end via TaskList → TaskMiniCard → SubstepCard.
- Update INDEX.md status row.
