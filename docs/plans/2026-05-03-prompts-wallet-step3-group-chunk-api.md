# Prompts Wallet — Step 3: REST API for `prompt-groups` + `prompt-chunks`

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Section 3)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step3-group-chunk-api`
> **Estimated session length:** medium (2–3h)
> **Depends on:** Step 1 (schema)
> **Unblocks:** Step 4 (RTK Query slice)
> **Can run in parallel with Step 2** if branched off the same base — no overlap in files.

---

## Goal

Mirror Step 2's pattern for groups and chunks. After this step, the entire prompts data model is exercisable via REST.

---

## Endpoints

### Groups

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/prompt-groups` | Create `{ walletId, title, description? }`; ownership via `walletId`; `order = max + 1` within wallet |
| `PATCH` | `/api/prompt-groups/[id]` | Update `title/description/order/lockLevel` |
| `DELETE` | `/api/prompt-groups/[id]` | Cascade-deletes chunks |
| `POST` | `/api/prompt-groups/[id]/duplicate` | Deep-copy group + chunks within same wallet |
| `POST` | `/api/prompt-groups/reorder` | Body `{ walletId, orderedIds }`; ownership via `walletId` + each id |
| `POST` | `/api/prompt-groups/restore` | Body snapshot `{ walletId, title, description, lockLevel, chunks: [...] }` |

### Chunks

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/prompt-chunks` | Create `{ groupId, title, content }`; `order = max + 1` |
| `PATCH` | `/api/prompt-chunks/[id]` | Update `title/content/order/lockLevel` — **the auto-save target** |
| `DELETE` | `/api/prompt-chunks/[id]` | Plain delete |
| `POST` | `/api/prompt-chunks/[id]/duplicate` | Same group, appended |
| `POST` | `/api/prompt-chunks/reorder` | Body `{ groupId, orderedIds }` |
| `POST` | `/api/prompt-chunks/restore` | Body snapshot `{ groupId, title, content, lockLevel }` |

---

## Steps

1. Mirror the route file structure in `src/app/api/prompt-groups/` and `src/app/api/prompt-chunks/`.
2. Use `assertGroupOwnership` / `assertChunkOwnership` from Step 1's helper.
3. **For PATCH on chunks** — this is the auto-save endpoint. Make it cheap: only update fields that are present in the body. Don't do read-then-write; let `prisma.update` handle it atomically.
4. **For reorder on chunks/groups** — same transaction pattern as Step 2 with parent-ownership validation:
   ```ts
   await assertGroupOwnership(groupId, user.id); // for chunk reorder
   const found = await prisma.promptChunk.findMany({
     where: { id: { in: orderedIds }, groupId },
     select: { id: true },
   });
   if (found.length !== orderedIds.length) return 400;
   ```
5. **For restore on chunks** — re-fetch parent group to confirm it still exists, otherwise return 404 with `{ error: 'Parent group missing' }`.
6. Co-locate tests for every route. Same coverage matrix as Step 2.
7. `npm run lint` + `npm run test`.
8. Commit `feat(prompts-wallet/step3): group + chunk APIs + tests`.

---

## Verification Checklist

- [ ] All 12 endpoints (6 groups + 6 chunks) respond on the happy path
- [ ] Cross-user 404 verified for `PATCH/DELETE/duplicate` on group + chunk
- [ ] `reorder` rejects mismatched parent or mismatched ids
- [ ] `restore` returns 404 when parent has been deleted
- [ ] Tests co-located (~60 tests total here)
- [ ] `npm run lint` clean
- [ ] `npm run test` green; coverage holds ≥80%

## Out of Scope

- RTK Query (Step 4)
- UI

## Tracker

Tick row #3 → ✅ Done.
