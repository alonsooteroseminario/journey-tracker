# Lock / Undo / Copy — Rolling Index

**Design spec:** [`2026-05-03-lock-undo-copy-design.md`](./2026-05-03-lock-undo-copy-design.md)
**Started:** 2026-05-03

A fresh Claude session can pick up at the next `pending` step by reading:
1. The design spec.
2. This index (to find next step + see what's already done).
3. The step's own track file.

## Status

| # | Step | Status | Track file |
|---|---|---|---|
| 1 | Foundations — types + pure helpers | ✅ done | [step1-foundations.md](./2026-05-03-lock-undo-copy-step1-foundations.md) · Done: 2026-05-03 · commit `675eba2` |
| 2 | UndoToastProvider — UI infra | ✅ done | [step2-undo-provider.md](./2026-05-03-lock-undo-copy-step2-undo-provider.md) · Done: 2026-05-03 · commit `e38b35f` |
| 3 | SubstepCard wiring | ⬜ pending | [step3-substep-wiring.md](./2026-05-03-lock-undo-copy-step3-substep-wiring.md) |
| 4 | TaskMiniCard wiring + copy button | ⬜ pending | [step4-taskcard-wiring.md](./2026-05-03-lock-undo-copy-step4-taskcard-wiring.md) |
| 5 | restoreTask/restoreSubstep + GoalCard integration | ⬜ pending | [step5-restore-integration.md](./2026-05-03-lock-undo-copy-step5-restore-integration.md) |
| 6 | MCP agent tool guards | ⬜ pending | [step6-agent-guards.md](./2026-05-03-lock-undo-copy-step6-agent-guards.md) |
| 7 | End-to-end verification | ⬜ pending | [step7-verification.md](./2026-05-03-lock-undo-copy-step7-verification.md) |

**Status legend:** ⬜ pending · 🟡 in-progress · ✅ done · ❌ blocked

## Dependency graph

```
1 ─┬─→ 2 ─┬─→ 3 ─┐
   │     └─→ 4 ─┴─→ 5 ─→ 7
   └────────────────→ 6 ─→ 7
```

- Steps 3 and 4 can run in parallel after Step 2.
- Step 6 can run in parallel with Steps 2–5 (only depends on Step 1).
- Step 7 is the final gate.

## How to update this file

When a step starts: change ⬜ → 🟡, add a "Started: YYYY-MM-DD" line under that step's row.
When a step finishes: change 🟡 → ✅, add a "Done: YYYY-MM-DD · commit `<sha>`" line.
If blocked: change to ❌ and write a one-liner explaining the blocker.

## Cross-step rules (always apply)

- Mutations to `Goal.tasks` are read-modify-write on the full array (per CLAUDE.md).
- New fields on Task/Substep are optional; missing values default via guard helpers.
- No DB migration. No new dependencies.
- Run `npm run lint && npm run test` before marking any step ✅.
