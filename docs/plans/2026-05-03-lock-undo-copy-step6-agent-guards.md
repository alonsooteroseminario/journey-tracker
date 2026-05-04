# Step 6 — MCP agent tool guards

**Depends on:** Step 1
**Can run in parallel with:** Steps 2, 3, 4, 5
**Estimated session size:** small

## Goal

Make the AI agent respect lock levels: refuse to delete locked items and refuse to edit hard-locked items. Surface clear error messages back through the SSE stream so the user sees *why* the action was refused.

## Files to touch

| File | Action |
|---|---|
| `src/lib/mcp/tools/deleteTask.ts` | edit |
| `src/lib/mcp/tools/deleteSubstep.ts` | edit |
| `src/lib/mcp/tools/updateTask.ts` | edit |
| `src/lib/mcp/tools/updateSubstep.ts` | edit |
| Test file alongside each | edit — add lock guard tests |

(Verify exact filenames in `src/lib/mcp/tools/index.ts` — if names differ, update this list.)

## TODOs

1. In each of the four tools, after fetching the goal and locating the target item, add a guard:
   ```ts
   import { canDelete, canEdit } from '@/lib/locks/lockGuards';

   // delete tools:
   if (!canDelete(targetTask)) {
     return { error: `Cannot delete task "${targetTask.title}": it is locked. Ask the user to unlock it first.` };
   }

   // update tools:
   if (!canEdit(targetTask)) {
     return { error: `Cannot edit task "${targetTask.title}": it is hard-locked.` };
   }
   ```

2. Update each tool's `description` field (visible to Claude) to mention the lock behavior, e.g. append: `"Refuses to delete tasks that are soft- or hard-locked."` This helps the agent reason about the failure rather than retrying blindly.

3. Status changes via `updateTask` (e.g. setting `status: 'completed'`): allowed even when hard-locked per §3.2. If the only mutation in the update payload is `status`, skip the `canEdit` check. Implementation:
   ```ts
   const isStatusOnly =
     Object.keys(updates).length === 1 && Object.keys(updates)[0] === 'status';
   if (!isStatusOnly && !canEdit(targetTask)) { return { error: ... }; }
   ```
   Apply the same logic to `updateSubstep`.

4. Lock changes via the agent: out of scope for v1. The agent has no `lockTask` / `lockSubstep` tool yet. Don't add one — keep agent surface focused.

## Tests

In each tool's test file, add cases:

- `delete*` tool with `lockLevel: 'soft'` → returns error, no mutation.
- `delete*` tool with `lockLevel: 'hard'` → returns error, no mutation.
- `delete*` tool with `lockLevel: undefined` or `'none'` → succeeds.
- `update*` tool with `lockLevel: 'hard'` and field updates → returns error.
- `update*` tool with `lockLevel: 'hard'` and status-only update → succeeds.
- `update*` tool with `lockLevel: 'soft'` and field updates → succeeds.

## Acceptance criteria

- `npm run lint` clean.
- `npm run test src/lib/mcp/tools` — all pass including new lock cases.
- `npm run test` full suite still passes.
- Manual smoke (optional in this step, covered in Step 7):
  - Lock a task in the UI, then ask the agent to delete it via chat — agent reports the lock-refusal message.

## Test commands

```bash
npm run lint
npm run test src/lib/mcp/tools
npm run test
```

## Notes for next session

- If new tools are added later (e.g. `lockTask`), revisit guards.
- Update INDEX.md status row.
