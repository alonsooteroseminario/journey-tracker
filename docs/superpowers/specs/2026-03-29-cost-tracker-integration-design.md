# Cost Tracker Integration — Design Spec
**Date:** 2026-03-29
**Branch:** feat/cost-tracker
**Status:** Design approved, ready for implementation planning

---

## Overview

Integrate the existing standalone Cost Tracker page fully into the Journey Tracker app: shared navigation, shared layout, an internal backend (Prisma + MongoDB), and automated real-time cost sync for LLM providers (Anthropic, ElevenLabs) plus manual-entry support for subscription services (Cursor).

---

## Goals

1. Cost Tracker feels like a first-class tab in the app — not a separate page
2. Data is persisted in the same MongoDB instance via Prisma (no external service)
3. Anthropic token costs are automatically logged every time the AI agent runs
4. ElevenLabs character usage is syncable on-demand (and scheduled)
5. Cursor subscription is manually entered as a fixed monthly cost
6. Provider API keys are stored encrypted server-side, never exposed to the client

---

## Sub-Problems & Scope

### A — Navigation & Layout Integration *(fast)*
- Add `💰 Cost Tracker` as the 6th tab in `Header.tsx` `navItems`
- Remove the standalone custom header from `cost-tracker/page.tsx`
- The page renders inside `AppShell` (same as all other pages) — the app's sticky `Header` is already present via the root layout

### B — Backend Foundation *(medium)*
- Prisma models: `CostTransaction`, `Budget`, `LLMCredential`
- Internal Next.js API routes at `/api/cost-tracker/*`
- `useCostTracker` hook repointed from `NEXT_PUBLIC_API_URL` to `/api/cost-tracker/*`

### C — Credentials Management *(medium)*
- Encrypted storage of provider API keys in MongoDB
- Server-side-only decryption; client never sees plaintext key
- UI: masked key display, "Test Connection" button, delete + re-add flow

### D — Provider Sync *(larger)*
- **Anthropic**: Instrument `src/app/api/agent/chat/route.ts` to auto-log token usage after each AI turn
- **ElevenLabs**: Sync endpoint + UI button that polls ElevenLabs `/v1/user` and `/v1/history`
- **Cursor**: Manual fixed monthly subscription entry (no public API)
- Optional: background cron job for scheduled ElevenLabs sync

---

## Architecture

### Data Models (Prisma)

```prisma
model CostTransaction {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  amount      Float                      // USD
  category    String                     // "anthropic" | "elevenlabs" | "cursor" | "other"
  description String?
  date        DateTime
  source      String                     // "manual" | "auto-anthropic" | "sync-elevenlabs"
  metadata    Json?                      // token counts, character counts, model name, etc.
  createdAt   DateTime @default(now())

  @@index([userId, date])
  @@map("cost_transactions")
}

model Budget {
  id              String              @id @default(auto()) @map("_id") @db.ObjectId
  userId          String              @unique @db.ObjectId
  monthlyLimit    Float               @default(100)
  categoryLimits  Json?               // Record<category, limit>
  updatedAt       DateTime            @updatedAt
  @@map("budgets")
}

model LLMCredential {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  provider     String                 // "anthropic" | "elevenlabs"
  encryptedKey String                 // AES-256-GCM encrypted, base64
  iv           String                 // encryption IV, base64
  maskedKey    String                 // e.g. "sk-ant-...••••••••"
  lastSyncedAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, provider])
  @@map("llm_credentials")
}
```

### API Routes (internal, Next.js)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/cost-tracker/overview` | Monthly totals, budget %, current month |
| GET | `/api/cost-tracker/breakdown` | Per-category totals + percentages |
| GET | `/api/cost-tracker/daily` | Daily spending array for chart |
| GET | `/api/cost-tracker/transactions` | Paginated transaction list |
| POST | `/api/cost-tracker/transactions` | Add manual transaction |
| DELETE | `/api/cost-tracker/transactions/[id]` | Remove transaction |
| GET | `/api/cost-tracker/budget` | Get current budget + alert status |
| PUT | `/api/cost-tracker/budget` | Update monthly limit |
| GET | `/api/cost-tracker/credentials` | List providers + masked keys + last synced |
| POST | `/api/cost-tracker/credentials` | Save new credential (encrypted) |
| DELETE | `/api/cost-tracker/credentials/[provider]` | Remove credential |
| POST | `/api/cost-tracker/sync/[provider]` | Trigger on-demand sync for a provider |

### Credential Encryption

```
Key material: CREDENTIAL_ENCRYPTION_KEY (env var, 32-byte hex)
Algorithm: AES-256-GCM
Storage: { encryptedKey, iv } in MongoDB
Server only: encrypt on write, decrypt on sync — never returned to client
```

### Anthropic Auto-Logging

The agent route at `src/app/api/agent/chat/route.ts` already streams responses. Each Anthropic API response includes `usage.input_tokens` and `usage.output_tokens`. After each complete turn, we:
1. Compute cost: `(input_tokens / 1M) * input_price + (output_tokens / 1M) * output_price` using a static model→price map
2. Write a `CostTransaction` row with `source: "auto-anthropic"` and `metadata: { model, input_tokens, output_tokens }`

This is zero-config for the user — no credential needed since the app already has its own Anthropic key.

### ElevenLabs Sync

1. User adds ElevenLabs API key via Credentials UI
2. "Sync Now" triggers `POST /api/cost-tracker/sync/elevenlabs`
3. Server decrypts key, calls `GET https://api.elevenlabs.io/v1/user` for subscription data
4. Calls `GET https://api.elevenlabs.io/v1/history` for generation history
5. Maps history items to `CostTransaction` records (deduplicated by external ID)
6. Updates `LLMCredential.lastSyncedAt`

### Cursor

Cursor has no public API. The user enters a fixed monthly subscription amount manually. It appears as a `CostTransaction` with `category: "cursor"` and `source: "manual"`. The UI guides this with a "Add subscription" shortcut in the form.

---

## UI Design

### Navigation
- `navItems` in `Header.tsx` gains: `{ href: "/cost-tracker", label: "Cost Tracker", icon: "💰" }`
- Active state matches existing brand-light/brand-primary pattern

### Page Layout
- Remove standalone green header from `cost-tracker/page.tsx`
- The page title + "Add Transaction" button move to the main content area (below the shared header)
- Internal tabs (Overview / Breakdown / Transactions / Alerts) remain — add a 5th tab: **Credentials**

### Color Theme
- Replace all `green-*` / `emerald-*` classes with brand palette equivalents:
  - Active tab: `border-brand-primary text-brand-primary`
  - Budget bar fill: `bg-brand-primary`
  - Add button: `bg-gradient-to-r from-brand-primary to-brand-secondary`
  - Card backgrounds: `bg-white`, subtle `brand-light` accents
  - Alert colors stay semantic: red=critical, yellow=warning, green=on-track

### Credentials Tab (new)
- Cards per provider: icon, name, masked key, "Last synced: X ago", Sync/Delete buttons
- "Add Provider" button opens a modal with provider selector + API key input
- Key field uses `type="password"` input, never shown in plaintext after save

---

## Security Considerations

- Credentials never returned to client in API responses
- All cost-tracker API routes validate `auth()` and enforce `userId` ownership
- `CREDENTIAL_ENCRYPTION_KEY` must be set in env; server throws on missing key at startup
- Sync routes are rate-limited (extend existing `src/lib/agent/security.ts` pattern)

---

## What's NOT in scope

- Google Gemini (OAuth complexity — future feature)
- Historical import from provider dashboards (CSV upload — future feature)
- Multi-currency support (USD only for now)
- Email alerts for budget thresholds (future, email preferences system exists)

---

## Implementation Order

See `docs/plans/2026-03-29-cost-tracker-integration-plan.md` for step-by-step tasks.
