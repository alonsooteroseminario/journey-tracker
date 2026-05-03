# Cost Tracker UX Improvements — Design Spec
**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Four parallel improvements to the Cost Tracker feature:

1. **ElevenLabs sync fix** — bug in character-count calculation + add validation Test button + pagination
2. **One-time charges UX** — dedicated "Log One-Time Charge" card in Transactions tab
3. **Budget Settings UI** — editable monthly limit card in the Alerts tab
4. **Credential Edit** — Edit modal to update label and/or API key for existing credentials

---

## Feature 1 — ElevenLabs Sync Fix

### Problem
- `character_count_change_from` is the character quota **before** generation; `character_count_change_to` is quota **after**. Characters used = `from - to`. The current code does `Math.abs(from)`, which returns the quota level (e.g. 50,000) instead of the actual usage (e.g. 500), inflating costs ~100×.
- `character_count_change_to` is missing from the `ElevenLabsHistoryItem` interface.
- No pagination: only the first 100 items are fetched.
- ElevenLabs credentials have no "Test" button (Anthropic does). A 401 gives a confusing error; "Test" before syncing would catch it earlier.

### Changes

**`src/lib/cost-tracking/elevenlabs.ts`**
- Add `character_count_change_to: number` to `ElevenLabsHistoryItem`
- Fix cost calculation: `chars = item.character_count_change_from - item.character_count_change_to`
- Add pagination loop: fetch pages with `page_size=100` + `start_after_history_item_id` until `has_more === false` (cap at 500 items total to avoid timeout)

**`src/app/api/cost-tracker/validate/[provider]/route.ts`**
- Add `elevenlabs` to `SUPPORTED_PROVIDERS`
- ElevenLabs validation: call `GET /v1/user/subscription` with `xi-api-key` header; 200 = valid, 401 = invalid key

**`src/app/cost-tracker/components/Credentials.tsx`**
- Set `validateSupported: true` on the ElevenLabs PROVIDERS entry
- "Test" button appears on ElevenLabs cards (same visual as Anthropic "Test")

---

## Feature 2 — One-Time Charges UX

### Problem
The "Add Transaction" button in the page header already handles one-time charges, but it's not discoverable. Users assume it's only for subscriptions. There is no labeled entry point for "I spent extra money on Claude/Cursor this month."

### Changes

**`src/app/cost-tracker/components/Transactions.tsx`**
- Add a "Log One-Time Charge" card at the top of the Transactions tab
- Card shows brief copy: "Record an ad-hoc spend — overage, one-off purchase, or anything not auto-synced"
- Clicking "Add Charge" opens the existing `TransactionForm` modal inline within the Transactions tab (same form, no new component)
- The modal passes `onSubmit` back to the parent `page.tsx` `handleAddTransaction`

**`src/app/cost-tracker/page.tsx`**
- Thread `onAddTransaction` prop into `<Transactions>` so the inline "Add Charge" button works

**No DB or API changes** — the existing `POST /api/cost-tracker/transactions` endpoint already handles one-time entries.

---

## Feature 3 — Budget Settings UI

### Problem
The monthly limit defaults to $100 (set in the API). There is no UI to view or change it. The PUT `/api/cost-tracker/budget` endpoint already accepts `{ monthlyLimit, categoryLimits }`.

### Changes

**`src/app/cost-tracker/components/BudgetAlerts.tsx`**
- Add a Budget Settings card at the top of the component (above the status card)
- Shows current monthly limit: `Monthly limit: $100.00`
- An "Edit" button reveals an inline form: a number input for `monthlyLimit` + a "Save" button
- On save: calls `onUpdateBudget({ monthlyLimit })` prop
- Error shown inline on validation failure

**`src/app/cost-tracker/hooks/useCostTracker.ts`**
- `updateBudget` already exists in the hook — no changes needed

**`src/app/cost-tracker/page.tsx`**
- Pass `onUpdateBudget={async (data) => { await updateBudget(data); await refreshData(); }}` prop to `<BudgetAlerts>`

**`BudgetAlertsProps` interface**
- Add `onUpdateBudget: (data: { monthlyLimit: number }) => Promise<void>`

---

## Feature 4 — Credential Edit Modal

### Problem
Users can only add or delete credentials. When an API key is rotated (e.g. ElevenLabs), they get a 401 and have no way to update the stored key — they must delete and re-add, losing context about the credential.

### Changes

**New API route: `src/app/api/cost-tracker/credentials/[provider]/route.ts`**
- Add `PATCH` handler (same file as the existing `DELETE` handler)
- Accepts `{ label?, apiKey? }` — both optional, at least one required
- Validates label with same `LABEL_REGEX` if provided
- If `apiKey` provided: re-encrypts, re-masks, re-detects `keyType`
- Returns updated `{ id, provider, label, maskedKey, keyType }`

**`src/app/cost-tracker/hooks/useCostTracker.ts`**
- Add `updateCredential(id: string, data: { label?: string; apiKey?: string }): Promise<CredentialItem>`
- PATCH to `/api/cost-tracker/credentials/${id}`

**`src/app/cost-tracker/components/Credentials.tsx`**
- Add "Edit" button to each credential card (pencil icon, next to "Remove")
- Clicking opens an edit modal pre-filled with current `label` and masked key
- API key field shows placeholder (masked current value) — blank = don't change the key
- On save: calls `onEdit(cred.id, { label?, apiKey? })`
- After save: `onEdit` resolves → parent calls `refreshData()`

**`CredentialsProps`**
- Add `onEdit: (id: string, data: { label?: string; apiKey?: string }) => Promise<void>`

---

## Data Flow

```
Edit credential:
  UI Edit modal → onEdit(id, {label?, apiKey?})
    → PATCH /api/cost-tracker/credentials/${id}
      → re-encrypt if apiKey provided
      → update label/maskedKey/keyType
    → 200 { id, provider, label, maskedKey, keyType }
  → refreshData() → GET /credentials

ElevenLabs validation:
  "Test" button → onValidate("elevenlabs", credId)
    → POST /api/cost-tracker/validate/elevenlabs { credentialId }
      → GET /v1/user/subscription (xi-api-key)
      → 200 { valid: true } or 422 { error }

ElevenLabs sync (fixed):
  pages = []
  loop: GET /v1/history?page_size=100&start_after=<last_id>
    pages.push(items)
    if !has_more || total >= 500: break
  chars_used = from - to (per item)
  cost = chars * $0.0003
```

---

## Acceptance Criteria

- [ ] ElevenLabs "Test" button validates key before sync attempt
- [ ] ElevenLabs sync character cost = `from - to` characters (not `abs(from)`)
- [ ] ElevenLabs sync fetches up to 500 history items across pages
- [ ] "Log One-Time Charge" card is visible at top of Transactions tab
- [ ] Clicking the card opens `TransactionForm` modal with all existing fields
- [ ] Budget Settings card shows current monthly limit at top of Alerts tab
- [ ] "Edit" on budget opens inline form; saving calls PUT `/api/cost-tracker/budget`
- [ ] Each credential card has an "Edit" button (pencil icon)
- [ ] Edit modal pre-fills label; empty API key field means "keep current key"
- [ ] PATCH `/api/cost-tracker/credentials/[id]` re-encrypts when `apiKey` provided
- [ ] All new API routes return 401 for unauthenticated requests
- [ ] Ownership check on PATCH (same pattern as DELETE)

---

## Out of Scope

- Category-level budget limits UI (only monthly limit for now)
- ElevenLabs pagination beyond 500 items (avoid serverless timeout)
- Recurring vs one-time transaction type field in DB (no schema change)
- Credential provider change (label + key only)
