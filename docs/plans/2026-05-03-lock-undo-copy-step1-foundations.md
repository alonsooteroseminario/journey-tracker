# Step 1 — Foundations (types + pure helpers)

**Depends on:** none
**Unblocks:** Steps 2, 3, 4, 5, 6
**Estimated session size:** small

## Goal

Add new optional fields to `Task` and `Substep` types, and ship two pure helper modules with full unit-test coverage. Zero UI changes. Zero behavior changes for existing data (defaults preserve current behavior).

## Files to touch

| File | Action |
|---|---|
| `src/types/index.ts` | edit — add `lockLevel`, `lockedAt` to `Task` and `Substep` |
| `src/lib/locks/lockGuards.ts` | new |
| `src/lib/locks/lockGuards.test.ts` | new |
| `src/lib/clipboard/taskToMarkdown.ts` | new |
| `src/lib/clipboard/taskToMarkdown.test.ts` | new |

## TODOs

1. Edit `src/types/index.ts` — add to **both** `Task` and `Substep` interfaces:
   ```ts
   lockLevel?: 'none' | 'soft' | 'hard';
   lockedAt?: string; // ISO date
   ```

2. Create `src/lib/locks/lockGuards.ts` with the helpers from §3.3 of the design spec:
   - `LockLevel` type
   - `Lockable` interface
   - `getLockLevel`, `canDelete`, `canEdit`, `canAddChild`, `canReorder`, `cycleLock`

3. Create `src/lib/locks/lockGuards.test.ts` covering:
   - `getLockLevel` returns `'none'` when `lockLevel` is `undefined`
   - `getLockLevel` returns each of `'none' | 'soft' | 'hard'` correctly
   - `canDelete` only true when `'none'`
   - `canEdit` / `canAddChild` / `canReorder` true unless `'hard'`
   - `cycleLock` cycles `none → soft → hard → none`

4. Create `src/lib/clipboard/taskToMarkdown.ts`:
   - Signature: `export function taskToMarkdown(task: Task): string`
   - Format per §4.2 of the design spec.

5. Create `src/lib/clipboard/taskToMarkdown.test.ts` covering:
   - Task with title only → `"## title"`
   - Task with title + description → heading, blank line, description
   - Task with completed substeps → `- [x]`
   - Task with not_started/in_progress substeps → `- [ ]`
   - Substep with notes → indented `↳` line below
   - Substep without notes → no extra line
   - Empty substeps array → just the heading + description
   - Stable order: substeps respect existing `order` field (or array index if missing)

## Acceptance criteria

- `npm run lint` clean.
- `npm run test src/lib/locks src/lib/clipboard` — all pass.
- No other test files touched. No component imports the new helpers yet (that happens in later steps).
- New types are optional; running the full `npm run test` suite still passes (no test should fail because old fixtures lack `lockLevel`).

## Test commands

```bash
npm run lint
npm run test src/lib/locks src/lib/clipboard
npm run test            # full suite must still pass
```

## Notes for next session

- After this step, both helpers are importable as `@/lib/locks/lockGuards` and `@/lib/clipboard/taskToMarkdown`.
- Update INDEX.md status row when starting and finishing.
