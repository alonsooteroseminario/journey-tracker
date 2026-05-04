# Prompts Wallet — Step 1: Schema + Types + Ownership Helper

> **Plan-of-record:** `2026-05-03-prompts-wallet-design.md` (Section 2)
> **Tracker:** `2026-05-03-prompts-wallet-INDEX.md`
> **Branch:** `feat/prompts-wallet-step1-schema`
> **Estimated session length:** small (1–2h)
> **Depends on:** nothing
> **Unblocks:** Steps 2 & 3 (API endpoints)

---

## Goal

Add the three Prisma models (`PromptWallet`, `PromptGroup`, `PromptChunk`), wire them into `User`, generate the client, expose the matching TypeScript types, and ship the shared ownership helper that every API route in Steps 2 & 3 will use.

**No UI, no API routes in this step.** Just data layer + types + one helper.

---

## Steps

1. **Read for context** — `prisma/schema.prisma`, `src/types.ts` (Goal/Task/Substep section), `src/lib/locks/lockGuards.ts`.
2. **Prisma schema** — append the three models per design doc Section 2. Add `promptWallets PromptWallet[]` to `User`. Map names: `prompt_wallets`, `prompt_groups`, `prompt_chunks`.
3. **Run `npx prisma generate`** — confirm types compile.
4. **MongoDB note** — no migration needed (MongoDB is schemaless). Just regenerate the client.
5. **Types** — append `PromptWallet`, `PromptGroup`, `PromptChunk`, `LockLevel` interfaces to `src/types.ts` per design doc Section 2.
6. **Ownership helper** — create `src/lib/prompts/ownership.ts`:
   ```ts
   import { prisma } from '@/lib/prisma';

   export class OwnershipError extends Error {
     status = 404;
     constructor(message = 'Not found') { super(message); }
   }

   export async function assertWalletOwnership(walletId: string, userId: string): Promise<void> {
     const wallet = await prisma.promptWallet.findFirst({
       where: { id: walletId, userId },
       select: { id: true },
     });
     if (!wallet) throw new OwnershipError();
   }

   export async function assertGroupOwnership(groupId: string, userId: string): Promise<void> {
     const group = await prisma.promptGroup.findFirst({
       where: { id: groupId, wallet: { userId } },
       select: { id: true },
     });
     if (!group) throw new OwnershipError();
   }

   export async function assertChunkOwnership(chunkId: string, userId: string): Promise<void> {
     const chunk = await prisma.promptChunk.findFirst({
       where: { id: chunkId, group: { wallet: { userId } } },
       select: { id: true },
     });
     if (!chunk) throw new OwnershipError();
   }
   ```
7. **Tests** — `src/lib/prompts/ownership.test.ts`. Use `vi.mock('@/lib/prisma', ...)` to mock the prisma client. Cover:
   - `assertWalletOwnership` resolves on hit, throws `OwnershipError` (status 404) on miss
   - same for group + chunk
   - cross-user assertion: wallet of user A is not visible to user B
8. **Lint + test** — `npm run lint` and `npm run test` both clean.
9. **Commit** — single commit, message `feat(prompts-wallet/step1): add schema, types, ownership helper`.

---

## Verification Checklist

- [ ] `npx prisma generate` succeeds; `node_modules/.prisma/client` updated
- [ ] `import type { PromptWallet, PromptGroup, PromptChunk, LockLevel } from '@/types'` compiles
- [ ] `assertWalletOwnership/assertGroupOwnership/assertChunkOwnership` exported from `@/lib/prompts/ownership`
- [ ] Unit tests pass (≥3 cases per assertion → 9 total minimum)
- [ ] `npm run lint` clean — no unused imports, no `console.log`
- [ ] `npm run build` succeeds (catches type errors that vitest may miss)
- [ ] Commit created on branch `feat/prompts-wallet-step1-schema`

## Out of Scope for Step 1

- API routes (Steps 2 & 3)
- RTK Query (Step 4)
- Any component files (Steps 5–7)
- E2E (Step 8)

## Tracker

When done, edit `2026-05-03-prompts-wallet-INDEX.md` row #1 → ✅ Done with the commit hash and any notes.
