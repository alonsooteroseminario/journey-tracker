# Step 7 — End-to-end verification

**Depends on:** all prior steps
**Estimated session size:** small

## Goal

Final QA gate. Walk the manual test plan, run the full automated suite, confirm nothing regressed, and prepare for merge.

## Manual test plan

### Lock — task

1. Create or pick a goal. Expand it. Pick a task with substeps.
2. Hover the task → click lock button → tooltip shows `"🔓 Unlocked → click to soft-lock"` (or current state). Click once: badge appears (outline lock).
3. Try to delete: button is greyed out, tooltip shows `"Locked"`.
4. Try to edit title: still allowed.
5. Click lock again → badge becomes filled (hard).
6. Try to edit title: button greyed.
7. Try to add a substep: `+` button hidden or greyed.
8. Drag the task: cannot drag (cursor stays default).
9. Toggle status to "completed" via the status button: still works ✅.
10. Click lock again → badge disappears, all actions re-enabled.

### Lock — substep

Repeat steps 1–10 with a substep instead.

### Lock — independence

1. Soft-lock a task. Substep inside it should still be deletable / editable.
2. Hard-lock a substep inside an unlocked task. Other substeps unaffected.

### Copy task as Markdown

1. Pick a task with at least one substep with notes, one without notes, one completed.
2. Hover task → click Copy button → checkmark appears for ~1.5s.
3. Paste into Notion / Obsidian / any markdown editor.
4. Verify:
   - Heading rendered as H2.
   - Substeps render as a checklist with correct check states.
   - Notes appear as indented `↳` line under their substep.
5. Pick a task with no substeps and no description → paste shows just the heading line.

### Undo — task delete

1. Delete a task. Toast appears bottom-center: `Task "X" deleted [Undo]` with progress bar.
2. Click Undo → task reappears at the same position with all substeps intact.
3. Delete another task. Wait 6+ seconds → toast fades, no auto-restore.
4. Delete a task. Hover toast → progress bar pauses. Move away → resumes.
5. Delete task A, then within 6s delete task B → previous toast replaced; only B can be undone.

### Undo — substep delete

Same checklist with a substep.

### Lock × Undo interaction

1. Soft- or hard-locked task: delete should be impossible (button disabled). No toast should appear.

### Agent guards

1. Soft-lock a task in the UI.
2. Open chat → "delete the task called X".
3. Agent responds with the refusal message that mentions the lock.
4. Unlock the task → ask the agent again → succeeds.
5. Hard-lock a task → ask the agent to "rename the task X to Y" → refusal.
6. Ask the agent to "mark X as completed" → succeeds (status-only is allowed).

## Automated checks

```bash
npm run lint
npm run test
npm run test:e2e   # optional in this step but recommended
```

## Performance / data-size sanity

- Open Prisma Studio (`npx prisma studio`) and inspect a goal that has been heavily mutated. The added `lockLevel` and `lockedAt` fields should appear only on items the user actually locked. Other items unchanged.
- `Goal.tasks` JSON should not have grown noticeably (two short keys per locked item).

## Bug log template

If anything fails, log it in this file under a new `## Issues found` section with:
- Step number that failed
- Repro steps
- Expected vs actual
- Owner / next-session note

## Acceptance criteria

- All manual test sections pass.
- `npm run test` and `npm run lint` clean.
- INDEX.md fully ✅ for steps 1–6.
- This step's INDEX.md row updated to ✅ with completion date.

## After this step

- Mark INDEX.md fully done.
- Open a PR titled `feat: lock unlock copy undo for tasks and substeps`.
- Reference the design spec in the PR body.
- Update `MEMORY.md` with the new helper locations (`@/lib/locks/lockGuards`, `@/lib/clipboard/taskToMarkdown`, `@/components/undo/UndoToastProvider`) and the test mock pattern for `useUndoToast`.
