# F4 — Shareable Wallet URLs (Unlisted Link, View-Only)

**Date:** 2026-05-16 · **Owner:** alonsooteroseminario · **Branch:** `feat/f4-wallet-sharing`

## Problem

Wallets are powerful prompt libraries today — but locked to the owner. Users want to share a wallet (full groups + chunks tree) via a URL, with no friend-graph complexity.

## Goal

Owner can toggle a wallet "shareable" and get a copy-paste URL like:

```
https://journey-tracker.app/wallet/share/x9K2pM4qY7sLnVbR
```

Anyone with the link sees a **read-only** view of the wallet. A signed-in viewer also sees a **"Copy as my own"** button that clones the wallet into their account.

## Non-Goals

- No friend-graph gating (option deferred).
- No public listing / discovery of shared wallets.
- No edit-permission sharing.
- No analytics (view counts) — could be a v2.
- Chunk-level lock (`lockLevel`) is **ignored** for share clones (locks are owner-scoped; the clone gets fresh unlocked copies).

## Architecture

### Schema Change

Add to `PromptWallet`:

```prisma
model PromptWallet {
  // ... existing fields ...
  shareToken   String?   @unique  // null = not shared; present = shareable
  sharedAt     DateTime?
  // ...
}
```

`shareToken` generated server-side via `crypto.randomBytes(16).toString("base64url")` (≈22 chars, ~128 bits entropy → effectively unguessable).

### API Routes

**Owner-side:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/prompt-wallets/[id]/share` | Generate `shareToken` + return URL |
| DELETE | `/api/prompt-wallets/[id]/share` | Revoke (set token to null) |
| POST | `/api/prompt-wallets/[id]/share/rotate` | Revoke + regenerate (in case link leaks) |

**Viewer-side (public, no auth required):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/prompt-wallets/shared/[token]` | Return wallet + groups + chunks (read-only DTO) |
| POST | `/api/prompt-wallets/shared/[token]/clone` | Authenticated → clone into viewer's account |

### Pages

**`src/app/wallet/share/[token]/page.tsx`** (new) — server component:
- Fetches wallet via token; 404 if revoked
- Renders a stripped-down read-only `<SharedWalletView>`
- **No `<Header>`** (handled by `HeaderHost` `NO_HEADER_PATHS`)
- Top bar: `[Journey Tracker logo]`, `Shared by {ownerName}`, on the right: `[Copy as my own]` (if signed in) or `[Sign in to save]` (if not)
- Content: read-only chunks with copy buttons (clipboard works for everyone)

### Owner UI

`WalletDetail` / `WalletHeader` gets a new **`[Share]`** button next to existing icon edit:

Clicking opens `ShareWalletModal`:

```
┌─ Share "My Coding Prompts" ────────────────────┐
│                                                │
│  ◯ Private (default)                           │
│  ⦿ Anyone with the link can view               │
│                                                │
│  https://journey-tracker.app/wallet/share/x9…  │
│  [Copy Link]                                   │
│                                                │
│  ⚠ Anyone with this link sees all your groups  │
│  and chunks. They cannot edit.                 │
│                                                │
│  [Rotate link]     [Stop sharing]              │
└────────────────────────────────────────────────┘
```

State:
- "Private" → no token; rotating from this state mints one
- "Anyone with link" → token exists; switching to Private deletes it

### Clone Flow

`POST /api/prompt-wallets/shared/[token]/clone`:
1. Auth required (return 401 if not signed in).
2. Load source wallet (read-only).
3. Create new `PromptWallet` owned by viewer:
   - `title: "Copy of " + source.title`
   - same icon/description
   - new `id`, fresh `shareToken: null`
4. For each group: `create({ walletId: newWallet.id, title, description })`.
5. For each chunk: same — content preserved, all `lockLevel`/`title` copied except `lockLevel` reset to null.
6. Return `{ walletId: newId }` → viewer redirected to `/wallet?selected=newId`.

## Security

- **Token = capability.** Anyone with the token gets read access. Treat it as a bearer credential. Logged at info level when minted/rotated.
- **Constant-time lookup**: `prisma.findUnique({ where: { shareToken } })`. With ≥ 128 bits of entropy, brute force is infeasible.
- **No PII leakage**: shared DTO excludes `userId`, includes `ownerName` (Clerk display name) and that's it.
- **CORS/Index**: Add `<meta name="robots" content="noindex,nofollow">` to share page. Add `X-Robots-Tag: noindex` header.
- **Rate limit** clone endpoint to 10/min/IP to prevent scraping.
- **Soft-block**: if owner is suspended/deleted, share page returns 404.
- **Token rotation**: existing token becomes invalid the instant rotate fires.

## Testing

- Unit:
  - `share/route.test.ts` — POST mints token, DELETE removes it, ownership enforced
  - `shared/[token]/route.test.ts` — valid token returns wallet, invalid returns 404, revoked returns 404
  - `shared/[token]/clone/route.test.ts` — 401 unauth, success creates new wallet for caller, structure preserved
- E2E `e2e/wallet-sharing.spec.ts`:
  1. User A creates wallet, clicks Share, copies link
  2. Open link in incognito → sees wallet read-only, no share button
  3. Sign in as User B → "Copy as my own" button appears
  4. Click → ends up on `/wallet` with the cloned wallet selected
  5. As User A, click "Stop sharing" → link returns 404

## Acceptance Criteria

- Owner can mint, copy, rotate, revoke share link.
- Read-only viewer sees same content (groups + chunks + copy buttons).
- Signed-in viewer can clone; clone is independent (editing it does not affect source).
- Public viewer page is `noindex`.
- All routes auth-tested.
- `npm run lint`, `npm run test`, `npm run test:e2e -- wallet-sharing` green.
