# Technical Specification: Cost Tracker Integration

**Date:** 2026-03-29
**Author:** alonsooteroseminario
**Version:** 1.0
**Project Type:** web-app
**Project Level:** 4
**Status:** Draft

---

## Document Overview

This Technical Specification covers the full integration of the standalone Cost Tracker page into Journey Tracker: shared navigation, internal Prisma/MongoDB backend, encrypted credential storage, and automated Anthropic token cost logging.

**Related Documents:**
- Product Brief: `docs/product-brief-cost-tracker-integration-2026-03-29.md`
- Design Spec: `docs/superpowers/specs/2026-03-29-cost-tracker-integration-design.md`
- Implementation Plan: `docs/plans/2026-03-29-cost-tracker-integration-plan.md`

---

## Problem & Solution

### Problem Statement

The Cost Tracker is a standalone page with a custom green header, an external API dependency (`NEXT_PUBLIC_API_URL`), and no automatic cost capture. Every Anthropic token charge from the in-app AI agent is silently untracked. Provider API keys have no secure storage pattern. The page is visually inconsistent with the rest of the app.

### Proposed Solution

Five-phase integration: (1) move Cost Tracker into the shared navigation and remove its standalone header, (2) replace the external API with 11 internal Next.js API routes backed by Prisma/MongoDB, (3) add AES-256-GCM encrypted server-side credential storage, (4) instrument the agent route to auto-log Anthropic token usage and add on-demand ElevenLabs sync, (5) polish error/empty states and add targeted unit tests.

---

## Requirements

### What Needs to Be Built

- **R1 — Navigation Tab:** Add `💰 Cost Tracker` as the 6th tab in `Header.tsx` `navItems`. Active state matches existing brand-light/brand-primary pattern.

- **R2 — Layout Integration:** Remove the standalone green `<header>` from `cost-tracker/page.tsx`. Page renders inside the shared `AppShell` (same as all other pages). Page title + "Add Transaction" button move to the `<main>` content area. Internal tab row (Overview / Breakdown / Transactions / Alerts / Credentials) remains as a `<div>` inside the page.

- **R3 — Brand Rebrand:** Replace all `green-*`/`emerald-*` Tailwind classes with brand palette equivalents (`border-brand-primary`, `from-brand-primary to-brand-secondary`, `bg-brand-primary`, `bg-gray-50`).

- **R4 — Prisma Models:** Add three models to `prisma/schema.prisma`:
  - `CostTransaction` — per-charge record (`userId`, `amount`, `category`, `description`, `date`, `source`, `metadata`)
  - `Budget` — monthly limit + optional per-category limits per user
  - `LLMCredential` — encrypted provider API key with `maskedKey`, `iv`, `lastSyncedAt`

- **R5 — Internal API Routes:** 11 Next.js route handlers under `/api/cost-tracker/*` replacing the external API (see API Design section). All routes enforce Clerk `auth()` + `userId` ownership checks.

- **R6 — Hook Repoint:** Update `useCostTracker.ts` to call `/api/cost-tracker/*` instead of `${NEXT_PUBLIC_API_URL}/api/cost-tracker/*`. Remove `X-User-ID` header (Clerk session cookie handles auth).

- **R7 — Encryption Utility:** `src/lib/credentials/encrypt.ts` — AES-256-GCM encrypt/decrypt using `CREDENTIAL_ENCRYPTION_KEY` env var (32-byte hex). Throw at module load if env var is missing.

- **R8 — Credentials Tab:** New 5th internal tab in Cost Tracker. Provider cards (Anthropic, ElevenLabs, Cursor) showing masked key, last synced timestamp, Sync/Delete buttons. "Add API Key" modal with password input. Cursor shows "Subscription service — enter cost manually" (no API). "Test Connection" validates key without writing usage data.

- **R9 — Anthropic Auto-Logging:** Instrument `src/app/api/agent/chat/route.ts` to extract `response.usage.input_tokens` + `output_tokens` after each turn. Call `logAnthropicUsage()` non-blocking via `after()`. Static model→price map for Claude Opus 4.6, Sonnet 4.6, Haiku 4.5. Writes `CostTransaction` with `source: "auto-anthropic"`.

- **R10 — ElevenLabs Sync:** `syncElevenLabsUsage()` fetches `/v1/history` (paginated) and `/v1/user` (subscription tier for cost computation). Maps to `CostTransaction` records. Deduplicates by `metadata.historyItemId`. `POST /api/cost-tracker/sync/[provider]` route decrypts key and calls sync. Updates `lastSyncedAt`.

- **R11 — Cursor Manual Guidance:** "Cursor Subscription" preset in `TransactionForm.tsx` category dropdown. When selected: helper text "Cursor Pro is $20/month — set a fixed monthly amount". Credentials tab Cursor card has a button that opens the transaction form pre-filled.

- **R12 — Error & Empty States:** "Backend not available" friendly state on connection error. Empty state for Overview and Transactions tabs. Inline API key format validation in Credentials form.

- **R13 — Unit Tests:** (3) encrypt/decrypt round-trip; Anthropic price calculation per model; transactions DELETE ownership enforcement.

### What This Does NOT Include

- Google Gemini integration (OAuth complexity — future)
- Historical CSV/JSON import from provider dashboards
- Multi-currency support (USD only)
- Email budget threshold alerts (email preferences system exists, not wired here)
- Background cron job for scheduled ElevenLabs sync

---

## Technical Approach

### Technology Stack

- **Framework:** Next.js 15 App Router (existing)
- **Database:** MongoDB via Prisma 5 (existing instance)
- **Auth:** Clerk (`auth()` from `@clerk/nextjs/server`) (existing)
- **Encryption:** Node.js built-in `crypto` module — AES-256-GCM
- **Styling:** Tailwind CSS with brand palette tokens (existing `tailwind.config.ts`)
- **Testing:** Vitest + happy-dom (existing setup)
- **Runtime:** Node.js 24 (Vercel Functions / Next.js server)

### Architecture Overview

```
Browser
  └── cost-tracker/page.tsx (client component)
        └── useCostTracker hook
              └── fetch('/api/cost-tracker/*')
                    └── Next.js Route Handlers
                          ├── auth() — Clerk session
                          ├── Prisma → MongoDB (CostTransaction, Budget)
                          └── encrypt.ts (credentials only)

Agent Route (src/app/api/agent/chat/route.ts)
  └── [after each Anthropic turn]
        └── after() — non-blocking
              └── logAnthropicUsage()
                    └── Prisma → CostTransaction (source: "auto-anthropic")

Sync Route (POST /api/cost-tracker/sync/[provider])
  └── LLMCredential (decrypt key)
        └── ElevenLabs API (external)
              └── Prisma → CostTransaction (source: "sync-elevenlabs")
```

### Data Model

```prisma
model CostTransaction {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  amount      Float                      // USD
  category    String                     // "anthropic" | "elevenlabs" | "cursor" | "other"
  description String?
  date        DateTime
  source      String                     // "manual" | "auto-anthropic" | "sync-elevenlabs"
  metadata    Json?                      // token counts, character counts, model name, historyItemId
  createdAt   DateTime @default(now())

  @@index([userId, date])
  @@map("cost_transactions")
}

model Budget {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @unique @db.ObjectId
  monthlyLimit    Float    @default(100)
  categoryLimits  Json?    // Record<category, limit>
  updatedAt       DateTime @updatedAt
  @@map("budgets")
}

model LLMCredential {
  id           String    @id @default(auto()) @map("_id") @db.ObjectId
  userId       String    @db.ObjectId
  provider     String                  // "anthropic" | "elevenlabs"
  encryptedKey String                  // AES-256-GCM encrypted, base64
  iv           String                  // encryption IV, base64
  maskedKey    String                  // e.g. "sk-ant-...••••••••"
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, provider])
  @@map("llm_credentials")
}
```

### API Design

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/cost-tracker/overview` | Monthly totals, budget %, current month |
| GET | `/api/cost-tracker/breakdown` | Per-category totals + percentages |
| GET | `/api/cost-tracker/daily` | Daily spending array for chart (last 30 days) |
| GET | `/api/cost-tracker/transactions` | Paginated list, sorted date desc (default 50) |
| POST | `/api/cost-tracker/transactions` | Create manual transaction |
| DELETE | `/api/cost-tracker/transactions/[id]` | Delete — ownership check required |
| GET | `/api/cost-tracker/budget` | Get budget + alert status (create default if missing) |
| PUT | `/api/cost-tracker/budget` | Update `monthlyLimit` + `categoryLimits` |
| GET | `/api/cost-tracker/credentials` | List `{ provider, maskedKey, lastSyncedAt }` — no plaintext key |
| POST | `/api/cost-tracker/credentials` | Encrypt + store `LLMCredential` |
| DELETE | `/api/cost-tracker/credentials/[provider]` | Remove credential |
| POST | `/api/cost-tracker/sync/[provider]` | Trigger on-demand sync; `{ test: true }` for key validation |

**Credential encryption contract:**
```
CREDENTIAL_ENCRYPTION_KEY  — 32-byte hex in env (generate: openssl rand -hex 32)
Algorithm                  — AES-256-GCM
Storage                    — { encryptedKey (base64), iv (base64) } in MongoDB
Client exposure            — maskedKey only (e.g. "sk-ant-...••••••••")
```

**Anthropic price map (static, USD per 1M tokens):**
```typescript
const MODEL_PRICES = {
  "claude-opus-4-6":    { input: 15,  output: 75 },
  "claude-sonnet-4-6":  { input: 3,   output: 15 },
  "claude-haiku-4-5":   { input: 0.8, output: 4  },
}
```

---

## Implementation Plan

### Stories

1. **Navigation & Layout** — Cost Tracker tab in Header; standalone header removed; page renders in AppShell
2. **Brand Rebrand** — All `green-*`/`emerald-*` classes replaced with brand palette in cost-tracker module
3. **Prisma Models** — `CostTransaction`, `Budget`, `LLMCredential` added to schema; client regenerated
4. **Read API Routes** — `/overview`, `/breakdown`, `/daily` routes with Prisma aggregations
5. **Write API Routes** — `/transactions` (GET/POST/DELETE), `/budget` (GET/PUT)
6. **Hook Repoint** — `useCostTracker` calls internal API; `NEXT_PUBLIC_API_URL` dependency removed
7. **Encryption Utility** — AES-256-GCM `encrypt.ts`; `CREDENTIAL_ENCRYPTION_KEY` env var setup
8. **Credentials API** — `/credentials` (GET/POST) + `/credentials/[provider]` (DELETE)
9. **Credentials UI Tab** — Provider cards, masked key display, "Add API Key" modal, "Test Connection"
10. **Anthropic Auto-Logging** — Agent route instrumented; `logAnthropicUsage()` via `after()`
11. **ElevenLabs Sync** — `syncElevenLabsUsage()`; `/sync/[provider]` route; deduplication
12. **Cursor Guidance** — Category preset + helper text in `TransactionForm`; Credentials card CTA
13. **Polish & Tests** — Error/empty states; 3 unit tests (encrypt, price calc, DELETE ownership)

### Development Phases

**Session 1 — Phase 1:** Stories 1–2 (Navigation + Rebrand)
**Session 2 — Phase 2a:** Stories 3–4 (Prisma models + read API routes)
**Session 3 — Phase 2b:** Stories 5–6 (write API routes + hook repoint)
**Session 4 — Phase 3:** Stories 7–9 (Encryption + Credentials API + Credentials UI)
**Session 5 — Phase 4a:** Stories 10–11 (Anthropic auto-logging + ElevenLabs sync)
**Session 6 — Phase 4b + 5:** Stories 12–13 (Cursor guidance + polish + tests)

---

## Acceptance Criteria

- [ ] `💰 Cost Tracker` tab appears in `Header.tsx` nav and correctly highlights on `/cost-tracker` routes
- [ ] No standalone green `<header>` rendered on the cost-tracker page
- [ ] Zero `green-*` or `emerald-*` Tailwind classes remain in `src/app/cost-tracker/`
- [ ] `npx prisma generate` succeeds with `CostTransaction`, `Budget`, `LLMCredential` models
- [ ] All 11 API routes return 401 for unauthenticated requests and 403 for wrong-user requests
- [ ] `GET /api/cost-tracker/credentials` never returns `encryptedKey`, `iv`, or any plaintext key
- [ ] Running the AI agent writes at least one `CostTransaction` with `source: "auto-anthropic"` to MongoDB — no user action required
- [ ] ElevenLabs "Sync Now" in Credentials tab creates `CostTransaction` records and updates `lastSyncedAt`
- [ ] Re-syncing ElevenLabs does not create duplicate records (deduplication by `historyItemId`)
- [ ] AES-256-GCM encrypt → decrypt round-trip test passes
- [ ] Anthropic price calculation test passes for all 3 models
- [ ] `DELETE /api/cost-tracker/transactions/[id]` returns 403 when `userId` doesn't match
- [ ] All 885 existing tests continue to pass

---

## Non-Functional Requirements

### Performance

- Anthropic auto-logging is strictly non-blocking — uses `after()` so agent SSE streaming is unaffected
- ElevenLabs sync is user-initiated (on-demand); no sync happens in the critical path
- Prisma aggregation queries indexed on `[userId, date]` for sub-100ms overview/breakdown responses

### Security

- `CREDENTIAL_ENCRYPTION_KEY` read at module load; server throws `Error: CREDENTIAL_ENCRYPTION_KEY env var is required` if missing
- No plaintext provider key ever leaves the server — `GET /credentials` returns `maskedKey` only
- All cost-tracker API routes call `const { userId } = await auth()` and return 401 if null
- `DELETE /transactions/[id]` fetches transaction first and verifies `transaction.userId === userId` before deleting
- Sync routes extend the existing `src/lib/agent/security.ts` rate-limiting pattern

### Other

- Tailwind brand palette tokens must be used (not hardcoded hex); `brand-primary`, `brand-secondary`, `brand-light`, `brand-dark` defined in `tailwind.config.ts`
- No new npm packages required beyond what's already installed (crypto is Node.js built-in)
- `.env.example` updated with `CREDENTIAL_ENCRYPTION_KEY` placeholder and setup note

---

## Dependencies

- `prisma/schema.prisma` — must be updated and `npx prisma generate` run before any API route can use the new models
- `CREDENTIAL_ENCRYPTION_KEY` — must be set in `.env.local` before Phase 3 work can be tested locally
- Existing `src/lib/agent/security.ts` — rate-limiting pattern used by sync routes
- `src/app/api/agent/chat/route.ts` — Anthropic SDK response shape must include `usage.input_tokens` / `output_tokens` (standard Anthropic SDK behavior, no change needed)
- ElevenLabs external API — `GET /v1/user` and `GET /v1/history` endpoints; user must have an ElevenLabs account + API key to test Phase 4

---

## Risks & Mitigation

- **Risk:** ElevenLabs API response shape differs from documented schema
  - **Mitigation:** Log raw response to metadata; treat unknown fields gracefully; zero-cost entry fallback rather than crash

- **Risk:** Anthropic `after()` write fails silently (e.g., DB unreachable)
  - **Mitigation:** Wrap in try/catch inside `after()`; log warning via `console.warn`; never throw to the agent response stream

- **Risk:** `CREDENTIAL_ENCRYPTION_KEY` not set in Vercel production env at deploy time
  - **Mitigation:** Throw at module load with clear message; document in `.env.example`; add to deployment checklist

- **Risk:** Header.tsx navItems change breaks existing Header tests
  - **Mitigation:** Adding a navItem is additive; verify `Header.test.tsx` assertions don't count navItems

- **Risk:** Prisma schema syntax error causes `prisma generate` failure in CI
  - **Mitigation:** Run `npx prisma generate` locally before committing schema changes; validate against existing working models

---

## Timeline

**Target Completion:** End of current sprint (branch `feat/cost-tracker` → merge to `main`)

**Milestones:**
- Session 1 (Day 1): Navigation tab live, standalone header removed, brand colors applied
- Session 2 (Day 2): Prisma models generated, read API routes working
- Session 3 (Day 2–3): Write API routes + hook repointed — full CRUD functional internally
- Session 4 (Day 3–4): Credentials encryption, API, and UI tab complete
- Session 5 (Day 4–5): Anthropic auto-logging active, ElevenLabs sync working
- Session 6 (Day 5): Cursor guidance, error/empty states, tests — ready for merge

---

## Approval

**Reviewed By:**
- [ ] alonsooteroseminario (Author)
- [ ] Technical Lead
- [ ] Product Owner

---

## Next Steps

### Phase 4: Implementation

This project is Level 4. Recommended path:

1. Execute **Session 1** — `src/components/Header.tsx`, `src/app/cost-tracker/page.tsx`, `Overview.tsx`, `Breakdown.tsx`
2. Execute **Session 2** — `prisma/schema.prisma` + overview/breakdown/daily API routes
3. Execute **Session 3** — transactions/budget routes + `useCostTracker.ts`
4. Execute **Session 4** — `src/lib/credentials/encrypt.ts` + credentials routes + `Credentials.tsx`
5. Execute **Session 5** — `src/lib/cost-tracking/anthropic.ts` + agent route instrumentation + ElevenLabs sync
6. Execute **Session 6** — Cursor guidance + polish + 3 unit tests

---

**This document was created using BMAD Method v6 - Phase 2 (Planning)**

*To continue: Run `/workflow-status` to see your progress and next recommended workflow.*
