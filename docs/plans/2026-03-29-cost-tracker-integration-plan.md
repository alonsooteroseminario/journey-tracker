# Cost Tracker Integration — Implementation Plan
**Date:** 2026-03-29
**Branch:** feat/cost-tracker
**Design:** `docs/superpowers/specs/2026-03-29-cost-tracker-integration-design.md`

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## Phase 1 — Navigation & Layout Integration
**Goal:** Cost Tracker accessible from the main nav, rendered inside the shared app shell.
**Estimated effort:** 1 session

### Step 1.1 — Add tab to Header.tsx
- [ ] Open `src/components/Header.tsx`
- [ ] Add `{ href: "/cost-tracker", label: "Cost Tracker", icon: "💰" }` to `navItems` array after Marketplace
- [ ] Verify `isActive("/cost-tracker")` works with `pathname.startsWith(href)` (already handles it)

### Step 1.2 — Remove standalone header from cost-tracker page
- [ ] Open `src/app/cost-tracker/page.tsx`
- [ ] Remove the entire `<header>` block (the green custom header with back button, title, "Add Transaction" button, and inner tab nav)
- [ ] Move the page-level title section (💰 icon, h1, subtitle) into the `<main>` content area as a page header row
- [ ] Keep the "Add Transaction" button in the page content area (top-right of main)
- [ ] Keep the internal tab buttons (Overview / Breakdown / Transactions / Alerts) as a `<div>` above the content — styled as a simple tab row inside the page, not in the sticky header

### Step 1.3 — Apply brand palette
- [ ] Replace `border-green-500 text-green-600` (active tab) → `border-brand-primary text-brand-primary`
- [ ] Replace `from-green-500 to-emerald-600` (Add button gradient) → `from-brand-primary to-brand-secondary`
- [ ] Replace `border-green-500 border-t-transparent` (spinner) → `border-brand-primary border-t-transparent`
- [ ] Replace `bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50` (page bg) → `bg-gray-50` (matches other pages)
- [ ] Update `src/app/cost-tracker/components/Overview.tsx` — replace green budget bar with `bg-brand-primary`
- [ ] Update `src/app/cost-tracker/components/Breakdown.tsx` — replace green progress bars with brand colors

---

## Phase 2 — Backend Foundation
**Goal:** Replace external API dependency with internal Next.js API routes + Prisma/MongoDB.
**Estimated effort:** 1–2 sessions

### Step 2.1 — Add Prisma models
- [ ] Open `prisma/schema.prisma`
- [ ] Add `CostTransaction` model (see design spec for full schema)
- [ ] Add `Budget` model
- [ ] Add `LLMCredential` model
- [ ] Run `npx prisma generate` to regenerate client

### Step 2.2 — Create API route: overview
- [ ] Create `src/app/api/cost-tracker/overview/route.ts`
- [ ] `GET`: auth check, aggregate `CostTransaction` for current month by userId, compute `total`, `percentUsed` vs Budget, return `OverviewData`

### Step 2.3 — Create API route: breakdown
- [ ] Create `src/app/api/cost-tracker/breakdown/route.ts`
- [ ] `GET`: group `CostTransaction` by `category` for current month, compute amounts + percentages

### Step 2.4 — Create API route: daily
- [ ] Create `src/app/api/cost-tracker/daily/route.ts`
- [ ] `GET`: group `CostTransaction` by date for last 30 days, return array of `{ date, total, breakdown }`

### Step 2.5 — Create API route: transactions
- [ ] Create `src/app/api/cost-tracker/transactions/route.ts`
- [ ] `GET`: paginated list (default last 50), sorted by date desc
- [ ] `POST`: validate body (`amount`, `category`, `description`, `date`), create `CostTransaction` with `source: "manual"`

### Step 2.6 — Create API route: transactions/[id]
- [ ] Create `src/app/api/cost-tracker/transactions/[id]/route.ts`
- [ ] `DELETE`: verify ownership (`transaction.userId === userId`), delete

### Step 2.7 — Create API route: budget
- [ ] Create `src/app/api/cost-tracker/budget/route.ts`
- [ ] `GET`: fetch or create default Budget for userId, compute alert status
- [ ] `PUT`: update `monthlyLimit` and optional `categoryLimits`

### Step 2.8 — Update useCostTracker hook
- [ ] Open `src/app/cost-tracker/hooks/useCostTracker.ts`
- [ ] Remove `NEXT_PUBLIC_API_URL` reference and external fetch pattern
- [ ] Change all `fetch(`${API_URL}/api/cost-tracker/...`)` → `fetch('/api/cost-tracker/...')`
- [ ] Remove `X-User-ID` header (auth now via Clerk session cookie, standard)

---

## Phase 3 — Credentials Management
**Goal:** Secure storage and management of provider API keys.
**Estimated effort:** 1 session

### Step 3.1 — Encryption utility
- [ ] Create `src/lib/credentials/encrypt.ts`
  - Export `encryptKey(plaintext: string): { encryptedKey: string, iv: string }`
  - Export `decryptKey(encryptedKey: string, iv: string): string`
  - Uses Node.js `crypto` module, AES-256-GCM
  - Reads `CREDENTIAL_ENCRYPTION_KEY` from env (throw if missing)
- [ ] Add `CREDENTIAL_ENCRYPTION_KEY` to `.env.local` (generate 32-byte hex with `openssl rand -hex 32`)
- [ ] Add `CREDENTIAL_ENCRYPTION_KEY` to `.env.example` with a note

### Step 3.2 — Create API route: credentials
- [ ] Create `src/app/api/cost-tracker/credentials/route.ts`
  - `GET`: list credentials for user (return `{ provider, maskedKey, lastSyncedAt }` — NO plaintext key)
  - `POST`: receive `{ provider, apiKey }`, encrypt, store `LLMCredential`
- [ ] Create `src/app/api/cost-tracker/credentials/[provider]/route.ts`
  - `DELETE`: remove credential by provider

### Step 3.3 — Credentials UI tab
- [ ] Add `"credentials"` to the `Tab` type in `cost-tracker/page.tsx`
- [ ] Add Credentials tab button to the tab row
- [ ] Create `src/app/cost-tracker/components/Credentials.tsx`:
  - Cards for each provider: Anthropic, ElevenLabs, Cursor (Cursor shows "Manual — no API" message)
  - Each connected provider card shows: provider icon, name, masked key, last synced timestamp, "Sync Now" + "Delete" buttons
  - "Add API Key" modal: provider dropdown + password input + "Save" button
  - "Test Connection" triggers `POST /api/cost-tracker/sync/[provider]` with `{ test: true }` to validate key without storing usage
- [ ] Pass credentials data into the Credentials component from `useCostTracker`

---

## Phase 4 — Provider Sync
**Goal:** Automated cost ingestion from Anthropic (auto) and ElevenLabs (on-demand).
**Estimated effort:** 1–2 sessions

### Step 4.1 — Anthropic auto-logging (instrument agent route)
- [ ] Open `src/app/api/agent/chat/route.ts`
- [ ] After each complete Anthropic API call, extract `response.usage.input_tokens` + `output_tokens`
- [ ] Create `src/lib/cost-tracking/anthropic.ts`:
  - Export `logAnthropicUsage({ userId, model, inputTokens, outputTokens, date })`
  - Contains static model price map: `{ "claude-opus-4-6": { input: 15, output: 75 }, "claude-sonnet-4-6": { input: 3, output: 15 }, ... }` (prices per 1M tokens in USD)
  - Computes cost and writes `CostTransaction` with `source: "auto-anthropic"` and metadata
- [ ] Call `logAnthropicUsage(...)` in the agent route after each turn (non-blocking: fire-and-forget with `after()`)
- [ ] Note: No credential needed — app already has its own Anthropic key in env

### Step 4.2 — ElevenLabs sync
- [ ] Create `src/lib/cost-tracking/elevenlabs.ts`:
  - Export `syncElevenLabsUsage({ userId, apiKey })` function
  - Calls `GET https://api.elevenlabs.io/v1/history` (paginated) with `xi-api-key` header
  - Maps history items to `CostTransaction`: `{ category: "elevenlabs", source: "sync-elevenlabs", metadata: { historyItemId, voiceId, modelId, characters } }`
  - ElevenLabs charges per character — compute cost from subscription tier (fetch from `/v1/user`)
  - Deduplicates by `metadata.historyItemId` before inserting
- [ ] Create `src/app/api/cost-tracker/sync/[provider]/route.ts`:
  - `POST`: look up `LLMCredential` for userId + provider, decrypt key, call provider sync function
  - Return `{ synced: number, total: number }` (records added vs already existed)
  - Handles `{ test: true }` flag to validate key without writing
- [ ] Update `LLMCredential.lastSyncedAt` after successful sync

### Step 4.3 — Cursor manual guidance
- [ ] Add "Cursor Subscription" as a preset in the `TransactionForm.tsx` category dropdown
- [ ] When Cursor category is selected: show a helper text "Cursor Pro is $20/month — set a fixed monthly amount"
- [ ] No API sync — purely manual entry
- [ ] In the Credentials UI, Cursor card shows "Subscription service — enter cost manually" with a button that opens the transaction form pre-filled with category=cursor

### Step 4.4 — UI: sync status + "Sync Now"
- [ ] Add `syncProvider(provider: string)` to `useCostTracker` hook
- [ ] Credentials tab: "Sync Now" button triggers sync + shows loading spinner + success/error toast
- [ ] Overview tab: show small "Last synced: X min ago" badge per provider near the breakdown section

---

## Phase 5 — Final Polish & Testing
**Estimated effort:** 0.5 session

### Step 5.1 — Error states
- [ ] `cost-tracker/page.tsx`: if backend returns 503/connection error, show friendly "Backend not available" state (not raw error message)
- [ ] Credentials form: show inline validation for API key format before submission

### Step 5.2 — Empty states
- [ ] Overview with no transactions: "No spending logged yet — add your first transaction or sync a provider"
- [ ] Transactions tab with no data: empty state illustration + "Add Transaction" CTA

### Step 5.3 — Tests
- [ ] Unit test `src/lib/credentials/encrypt.ts` — encrypt/decrypt round-trip
- [ ] Unit test `src/lib/cost-tracking/anthropic.ts` — price calculation for each model
- [ ] API route tests: ownership enforcement on transactions DELETE

---

## Environment Variables Required

```bash
# Required for Phase 3+
CREDENTIAL_ENCRYPTION_KEY=<32-byte hex from: openssl rand -hex 32>
```

Already required (existing):
```bash
ANTHROPIC_API_KEY=<...>        # Used by agent, auto-logging piggybacks on this
DATABASE_URL=<MongoDB Atlas>
NEXT_PUBLIC_CLERK_*            # Clerk auth
```

---

## Files Created/Modified Summary

| File | Action | Phase |
|------|--------|-------|
| `src/components/Header.tsx` | Modify — add navItem | 1.1 |
| `src/app/cost-tracker/page.tsx` | Modify — remove standalone header, rebrand | 1.2, 1.3 |
| `src/app/cost-tracker/components/Overview.tsx` | Modify — brand colors | 1.3 |
| `src/app/cost-tracker/components/Breakdown.tsx` | Modify — brand colors | 1.3 |
| `src/app/cost-tracker/components/Credentials.tsx` | Create — new tab | 3.3 |
| `src/app/cost-tracker/hooks/useCostTracker.ts` | Modify — internal API, add sync | 2.8, 4.4 |
| `prisma/schema.prisma` | Modify — 3 new models | 2.1 |
| `src/app/api/cost-tracker/overview/route.ts` | Create | 2.2 |
| `src/app/api/cost-tracker/breakdown/route.ts` | Create | 2.3 |
| `src/app/api/cost-tracker/daily/route.ts` | Create | 2.4 |
| `src/app/api/cost-tracker/transactions/route.ts` | Create | 2.5 |
| `src/app/api/cost-tracker/transactions/[id]/route.ts` | Create | 2.6 |
| `src/app/api/cost-tracker/budget/route.ts` | Create | 2.7 |
| `src/app/api/cost-tracker/credentials/route.ts` | Create | 3.2 |
| `src/app/api/cost-tracker/credentials/[provider]/route.ts` | Create | 3.2 |
| `src/app/api/cost-tracker/sync/[provider]/route.ts` | Create | 4.2 |
| `src/lib/credentials/encrypt.ts` | Create | 3.1 |
| `src/lib/cost-tracking/anthropic.ts` | Create | 4.1 |
| `src/lib/cost-tracking/elevenlabs.ts` | Create | 4.2 |
| `src/app/api/agent/chat/route.ts` | Modify — add auto-logging | 4.1 |

---

## Session Breakdown (how to execute step by step)

Each session below is a self-contained prompt you can execute independently.

**Session 1:** Execute Phase 1 (Steps 1.1–1.3) — Navigation + Layout + Rebrand
**Session 2:** Execute Phase 2, Steps 2.1–2.4 — Prisma models + overview/breakdown/daily API routes
**Session 3:** Execute Phase 2, Steps 2.5–2.8 — transactions/budget API routes + update hook
**Session 4:** Execute Phase 3 (Steps 3.1–3.3) — Credentials encryption + API routes + UI tab
**Session 5:** Execute Phase 4, Steps 4.1–4.2 — Anthropic auto-logging + ElevenLabs sync
**Session 6:** Execute Phase 4, Steps 4.3–4.4 + Phase 5 — Cursor guidance + polish + tests
