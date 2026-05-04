# Prompts Wallet — Step 2: REST API for `prompt-wallets`

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Section 3)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step2-wallet-api`
> **Estimated session length:** medium (2–3h)
> **Depends on:** Step 1 (schema + ownership helper)
> **Unblocks:** Step 4 (RTK Query slice)

---

## Goal

Implement and test all wallet-level API routes. After this step, you can `curl` your way to a fully functional wallet CRUD without any UI.

---

## Endpoints to Implement

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/prompt-wallets` | List user's wallets, with groups + chunks, ordered by `wallet.order` then `group.order` then `chunk.order` |
| `POST` | `/api/prompt-wallets` | Create wallet from `{ title, icon?, description? }`; assign `order = (max + 1)` for this user |
| `PATCH` | `/api/prompt-wallets/[id]` | Update any of `title/icon/description/order/lockLevel` |
| `DELETE` | `/api/prompt-wallets/[id]` | Cascade-deletes groups + chunks |
| `POST` | `/api/prompt-wallets/[id]/duplicate` | Deep-copy wallet + groups + chunks. Title `"<source> (copy)"`. Order = max + 1. New IDs throughout. |
| `POST` | `/api/prompt-wallets/reorder` | Body `{ orderedIds: string[] }` — must contain exactly the user's wallet IDs. Bulk-update `order`. |
| `POST` | `/api/prompt-wallets/restore` | Body: full wallet snapshot `{ title, icon, description, lockLevel, groups: [{ title, description, lockLevel, chunks: [{ title, content, lockLevel }] }] }`. Re-create as new tree. |

---

## Pattern (every route)

```ts
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertWalletOwnership, OwnershipError } from '@/lib/prompts/ownership';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getCurrentUser(clerkId);

  try {
    // ... ownership check, body validation, prisma call ...
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof OwnershipError) return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Steps

1. Read `src/app/api/groups/route.ts` and `src/app/api/templates/route.ts` for the canonical pattern.
2. Implement endpoints in this order: `GET` → `POST` → `PATCH` → `DELETE` → `duplicate` → `reorder` → `restore`.
3. Body validation: lightweight type-guards (no Zod required — keep parity with existing routes). Reject empty `title`, oversized strings (`title > 200`, `description > 2000`).
4. **Duplicate logic:** fetch source with all relations; `prisma.promptWallet.create` with nested `groups: { create: [...] }` and within each `chunks: { create: [...] }`. Single transaction.
5. **Restore logic:** identical to duplicate but accepts the snapshot from the body and uses `lockLevel` exactly as snapshotted. Validate snapshot shape.
6. **Reorder logic:**
   ```ts
   await prisma.$transaction(
     orderedIds.map((id, i) =>
       prisma.promptWallet.update({ where: { id }, data: { order: i } })
     )
   );
   ```
   First, validate that every `id` in `orderedIds` belongs to the user (one query: `findMany({ where: { id: { in }, userId } })`, length must match).
7. Co-locate tests for each route file using the existing API test pattern (mock prisma, mock `auth()`, mock `getCurrentUser`). Cover:
   - Unauthorized (no clerkId)
   - Happy path
   - Cross-user (404)
   - Validation failure (400)
   - Server error (500)
8. `npm run lint` + `npm run test`.
9. Commit `feat(prompts-wallet/step2): wallet API + tests`.

---

## Verification Checklist

- [ ] All 7 wallet endpoints respond correctly to manual `curl` (or http test) for the happy path
- [ ] Cross-user 404 verified for `PATCH/DELETE/duplicate/restore`
- [ ] `reorder` rejects mismatched `orderedIds`
- [ ] All routes have co-located tests (≥5 cases each → ≥35 tests)
- [ ] `npm run lint` clean
- [ ] `npm run test` green; coverage hasn't dropped below 80%
- [ ] `npm run build` succeeds

## Out of Scope

- Group/chunk endpoints (Step 3)
- RTK Query slice (Step 4)
- Any UI

## Tracker

Tick row #2 in INDEX → ✅ Done with commit hash.
