# F4 — Wallet Sharing · Step Plan

**Branch:** `feat/f4-wallet-sharing` · **Estimate:** 2 days

## Step 1 — Schema + Helper

**Files:**
- `prisma/schema.prisma` — add `shareToken: String? @unique`, `sharedAt: DateTime?` to `PromptWallet`
- `npx prisma generate`
- `src/lib/prompts/shareToken.ts` (new) — `generateShareToken()` using `crypto.randomBytes(16).toString("base64url")`
- `src/lib/prompts/shareToken.test.ts` (new) — assert length, character set, uniqueness across 1000 generations

**Done when:** Prisma client regenerated; tests pass.

## Step 2 — Owner-Side API

**Files:**
- `src/app/api/prompt-wallets/[id]/share/route.ts` (new) — `POST` mints token (404 if not owner; 200 with `{ url, token, sharedAt }`), `DELETE` revokes (returns 204)
- `src/app/api/prompt-wallets/[id]/share/rotate/route.ts` (new) — `POST` revokes + re-mints
- Tests for all three endpoints (ownership, 401, 404)

**Done when:** Vitest passes for `share/route.test.ts` + `share/rotate/route.test.ts`.

## Step 3 — Public Read API

**Files:**
- `src/app/api/prompt-wallets/shared/[token]/route.ts` (new) — `GET` returns `{ wallet, groups, chunks, ownerName }`; 404 if no match
- `src/lib/prompts/serializeShared.ts` (new) — strips `userId`/`shareToken`/internal fields
- Tests covering: valid → 200 with redacted shape; bogus token → 404; revoked → 404

**Done when:** API returns clean DTO; can `curl /api/prompt-wallets/shared/<token>` and see content.

## Step 4 — Public Clone API

**Files:**
- `src/app/api/prompt-wallets/shared/[token]/clone/route.ts` (new) — `POST` requires auth; loads source by token; creates owned wallet+groups+chunks; returns new wallet id
- Rate-limit middleware (reuse `src/lib/agent/security.ts` pattern); 10 req/min/user
- Tests: 401 if unauth, 404 if token invalid, 200 returns new id, structure preserved (verify via Prisma query in test)

**Done when:** Vitest passes; can clone via Postman-style call.

## Step 5 — Owner UI: Share Button + Modal

**Files:**
- `src/components/prompts/ShareWalletModal.tsx` (new) — radio Private/Public, copy URL, rotate, stop sharing
- `src/components/prompts/ShareWalletModal.test.tsx`
- `src/components/prompts/WalletHeader.tsx` — add `[Share]` icon button opening modal
- `src/store/slices/promptsSlice.ts` — add `useShareWalletMutation`, `useUnshareWalletMutation`, `useRotateShareMutation` endpoints (PromptWallet tag invalidation)

**Done when:** Owner can toggle sharing, see/copy link, rotate, revoke.

## Step 6 — Public Viewer Page

**Files:**
- `src/app/wallet/share/[token]/page.tsx` (new) — server component, fetches DTO, renders `<SharedWalletView>`; if 404 renders not-found UI
- `src/components/prompts/SharedWalletView.tsx` (new client) — read-only render of groups + chunks; "Copy as my own" button visible if signed-in
- `src/components/prompts/SharedWalletView.test.tsx`
- Update `HeaderHost.NO_HEADER_PATHS` to include `/wallet/share` (depends on F3 — coordinate ordering)
- Add `metadata: { robots: { index: false } }` export to page

**Done when:** Visiting share URL renders content; not-found URL renders friendly 404.

## Step 7 — E2E + Verification

`e2e/wallet-sharing.spec.ts` — full flow as designed.

Verification:
- `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e -- wallet-sharing` green
- Robot meta tag confirmed in DOM
- Update `MEMORY.md` with F4 ✅

## Risk Bail-Outs

- **MongoDB unique index on optional field:** Prisma allows `@unique` on nullable; verify MongoDB treats multiple nulls as distinct (yes — MongoDB sparse indexes). Add a partial unique index manually if needed.
- **Clone payload size:** If wallets get huge (100+ chunks × 5KB each), consider chunked write. For now assume ≤ 200 chunks.
- **F3 dependency on `NO_HEADER_PATHS`:** if F3 ships first, F4 just adds the path. If F4 ships first, render `<Header>` directly in share page (acceptable).
