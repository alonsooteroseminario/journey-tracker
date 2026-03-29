# Technical Specification (Quick Spec): Multi-Provider LLM Credentials & Sync Routing

**Date:** 2026-03-29  
**Author:** alonsooteroseminario  
**Version:** 1.0  
**Project Type:** web-app  
**Project Level:** 4  
**Status:** Approved for implementation (Phase scope locked)  
**Workflow:** BMAD BMM — `bmad-bmm-quick-spec` output  

---

## Document Overview

This specification extends the Cost Tracker credential layer so users can store **multiple encrypted API credentials per provider** (e.g. several Anthropic or ElevenLabs keys with labels), routes **on-demand sync** to a **specific credential**, and defines optional later work for **Anthropic usage sync** (standard vs Admin API). It supersedes the implicit assumption of **one row per `(userId, provider)`** in `LLMCredential`.

**Related documents:**

| Document | Role |
|----------|------|
| `docs/tech-spec-cost-tracker-integration-2026-03-29.md` | Baseline Cost Tracker integration |
| `docs/product-brief-cost-tracker-integration-2026-03-29.md` | Product context |
| `docs/cost-tracker-credentials-guide.md` | End-user credential behavior (update after Phase 1) |

---

## Problem Statement

1. **Schema constraint:** `LLMCredential` uses `@@unique([userId, provider])`, so a user cannot save more than one Anthropic key and one ElevenLabs key.
2. **Sync routing:** `POST /api/cost-tracker/sync/[provider]` resolves at most one credential per provider; multi-key scenarios require a **credential id** (or equivalent) in the request body.
3. **Conceptual clarity:** In-app Anthropic **auto-logging** (`source: auto-anthropic` via `logAnthropicUsage`) is **orthogonal** to stored credentials unless we explicitly **attribute** usage to a `credentialId` in metadata (future). This spec locks **Phase 1–3** without requiring that attribution unless Phase 3 chooses Admin API mapping.

---

## Goals & Non-Goals

### Goals

- **G1:** Users can add, list, and delete **multiple** credentials per supported provider, each with a **human-readable label**.
- **G2:** Sync operations **target one credential** at a time and update **`lastSyncedAt`** on that row only.
- **G3:** Existing users with a single stored key per provider are **migrated** without data loss.
- **G4:** All API routes enforce **ownership**: credential `userId` must match the authenticated app user.

### Non-Goals (explicitly out of scope for this spec’s phases)

- **NG1:** Google Gemini / OAuth providers.
- **NG2:** Background cron sync (still on-demand only).
- **NG3:** Changing ElevenLabs’ **401** behavior — invalid keys remain a provider-side rejection.
- **NG4:** Multi-currency; USD only.

---

## Locked Phase Scope

### Phase 1 — Multi-credential vault (foundation) — **IN SCOPE**

| ID | Deliverable |
|----|-------------|
| P1.1 | **Prisma:** Remove `@@unique([userId, provider])`. Add `label` (string, required). Add `@@unique([userId, provider, label])` **or** `@@unique([userId, label])` with `label` unique per user across providers — **decision locked:** `@@unique([userId, provider, label])` so the same label text can exist on different providers if desired. |
| P1.2 | **Migration script or one-time migration:** For each existing `LLMCredential`, set `label` to `"Default"` (or `"Anthropic"` / `"ElevenLabs"` if collision with unique — use `"Default"` + provider suffix if needed). |
| P1.3 | **API:** `GET /api/cost-tracker/credentials` returns `{ id, provider, label, maskedKey, lastSyncedAt }[]`. |
| P1.4 | **API:** `POST /api/cost-tracker/credentials` accepts `{ provider, apiKey, label }` (`label` required, trimmed, 1–64 chars). Creates a **new** row (no upsert by provider alone). |
| P1.5 | **API:** `DELETE /api/cost-tracker/credentials/[id]` deletes by **credential document id**; 404 if not found; 403/404 if wrong user. **Deprecate** `DELETE .../credentials/[provider]` or keep as “delete Default for provider” only if needed for backward compatibility — **decision locked:** implement **`DELETE /api/cost-tracker/credentials/[id]`** as primary; remove or alias old route after UI ships. |
| P1.6 | **Client:** `useCostTracker` + Credentials tab UI: list **N cards** (one per credential), “Add” opens modal with **provider + label + key**. Sync/Remove per card. |
| P1.7 | **Encryption:** Reuse `encryptKey` / `decryptKey`; one IV + ciphertext blob per credential row (unchanged pattern). |
| P1.8 | **Tests:** Vitest for unique constraint behavior (mock Prisma or integration if project pattern allows); route tests for ownership on DELETE. |

**Schema sketch (authoritative detail in PR migration):**

```prisma
model LLMCredential {
  id           String    @id @default(auto()) @map("_id") @db.ObjectId
  userId       String    @db.ObjectId
  provider     String    // "anthropic" | "elevenlabs"
  label        String    // user-visible, e.g. "Work", "Personal"
  encryptedKey String
  iv           String
  maskedKey    String
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, provider, label])
  @@index([userId, provider])
  @@map("llm_credentials")
}
```

---

### Phase 2 — Sync routing by credential — **IN SCOPE**

| ID | Deliverable |
|----|-------------|
| P2.1 | **API contract (locked):** `POST /api/cost-tracker/sync/[provider]` body **must** include `{ credentialId: string }` (Mongo ObjectId string). Reject **400** if missing or invalid. |
| P2.2 | **Server:** Load `LLMCredential` by `id` + `userId`; verify `provider` matches URL segment; decrypt key; dispatch to provider sync (ElevenLabs today). |
| P2.3 | **ElevenLabs:** `syncElevenLabsUsage` accepts `userId` + `apiKey` (unchanged); optionally pass through `credentialId` into `CostTransaction.metadata.credentialId` for new rows — **decision locked:** **yes**, add `metadata.credentialId` for `source: sync-elevenlabs` rows created after this phase. |
| P2.4 | **Client:** `syncProvider(provider, credentialId)` or equivalent; each card passes its `id`. |
| P2.5 | **`SUPPORTED_PROVIDERS`:** Remains an allowlist of **provider strings** (`elevenlabs`, later `anthropic` when sync exists). Credential selection is **never** a new top-level URL segment; it stays in the JSON body. |

---

### Phase 3 — Anthropic sync & attribution (optional track) — **SCOPE LOCKED AS “CHOOSE ONE PATH”**

Implementation **does not start** until product picks **one** of the following:

| Track | Description | Prerequisite |
|-------|-------------|--------------|
| **3A — Validate-only (standard keys)** | Per credential: “Test” = minimal Anthropic API call with decrypted `sk-ant-api…` key; no org-wide usage report. | None beyond Phase 1–2. |
| **3B — Usage sync via Admin API** | Separate credential type or flag for **`sk-ant-admin…`**; call Anthropic **Usage & Cost Admin API** (e.g. messages usage report), filter by `api_key_id` where applicable. | Org account, Admin key in console, documented API version. |
| **3C — Defer Anthropic sync** | No `anthropic` in `SUPPORTED_PROVIDERS` for sync; UI copy: Anthropic costs come from **auto-anthropic** agent logging only. | None. |

**Locked decision for metadata:** If **3B** is implemented, `CostTransaction.metadata` SHOULD include `credentialId`, `apiKeyId` (from Anthropic), and date range of the synced bucket.

**Relationship to `logAnthropicUsage`:** Phase 3 **may** add optional `credentialId` to `logAnthropicUsage` **only if** the deployment model binds one server key to one stored credential — document that binding in a follow-up micro-spec; **not required** for Phase 1–2.

---

## API Summary (post Phase 1–2)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/cost-tracker/credentials` | List all credentials for user |
| POST | `/api/cost-tracker/credentials` | Create credential `{ provider, apiKey, label }` |
| DELETE | `/api/cost-tracker/credentials/[id]` | Delete by id |
| POST | `/api/cost-tracker/sync/[provider]` | Body `{ credentialId }`; sync using that key |

**Error codes (locked):** 400 (bad body / validation), 401 (unauthenticated), 404 (credential not found or wrong user), 401/402 from provider wrapped as JSON `{ error }` per existing CostSync pattern.

---

## UI / UX (Phase 1–2)

- Credentials tab shows a **flat list** of credentials (group by provider with subheadings optional).
- Each row: **Label**, masked key, last synced, **Sync** (if provider has sync — ElevenLabs), **Remove**.
- Anthropic: until Phase 3, **no Sync** **or** Track **3C** copy only (“Usage from AI agent is logged automatically”).
- Empty state: “No credentials yet” + Add.

---

## Security & Privacy

- Never return decrypted keys; `maskedKey` only.
- Rate-limit `POST sync` per user if abuse becomes an issue (future).
- Validate `credentialId` is a valid ObjectId format before Prisma query.

---

## Acceptance Criteria (Given / When / Then)

### Phase 1

1. **Given** a logged-in user with no credentials, **when** they POST a credential with `label: "Work"` and `provider: "elevenlabs"`, **then** GET returns one row with that label and a masked key.
2. **Given** two credentials with different labels for the same provider, **when** listed, **then** both appear with distinct `id`s.
3. **Given** an existing pre-migration single key, **when** migration runs, **then** exactly one row exists with `label` set and unique constraint satisfied.
4. **Given** another user’s credential id, **when** current user DELETEs by that id, **then** 404 and no row deleted.

### Phase 2

1. **Given** a valid ElevenLabs credential id, **when** POST sync with `{ credentialId }`, **then** sync runs and `lastSyncedAt` updates on **that** row only.
2. **Given** POST sync without `credentialId`, **then** 400.
3. **Given** new ElevenLabs transactions from sync, **when** inspected, **then** `metadata.credentialId` is present (for rows created after P2).

### Phase 3

- Acceptance criteria drafted **in a revision to this doc** when track 3A, 3B, or 3C is selected.

---

## Implementation Task Order (dependency order)

1. Prisma schema + migration + `prisma generate`.
2. Data migration for `label` on existing rows.
3. `GET`/`POST` credentials route changes; new `DELETE` by id.
4. Update `useCostTracker` + `Credentials.tsx` + any consumers.
5. Remove or redirect old `DELETE .../[provider]` after verification.
6. Sync route: require `credentialId`; wire ElevenLabs; metadata.
7. Documentation: `docs/cost-tracker-credentials-guide.md` + `.env.example` if new vars (Phase 3B only).

---

## Risks

| Risk | Mitigation |
|------|------------|
| Label collisions | Enforced by `@@unique([userId, provider, label])`; UI surfaces validation errors. |
| Large number of keys | Pagination on GET (future); v1 can cap at 20 per user in application logic if needed. |
| Anthropic Phase 3 ambiguity | Track 3A/3B/3C pick locked before engineering starts Phase 3. |

---

## Revision History

| Version | Date | Notes |
|---------|------|------|
| 1.0 | 2026-03-29 | Initial quick spec; Phase 1–3 scope locked |
