# Product Brief: Cost Tracker Integration

**Date:** 2026-03-29
**Author:** alonsooteroseminario
**Version:** 1.0
**Project Type:** web-app
**Project Level:** 4
**Source Docs:** `docs/superpowers/specs/2026-03-29-cost-tracker-integration-design.md`, `docs/plans/2026-03-29-cost-tracker-integration-plan.md`

---

## Executive Summary

We are integrating an existing standalone Cost Tracker page fully into Journey Tracker as a first-class navigation tab, replacing its external API dependency with an internal Prisma/MongoDB backend and adding automated real-time cost logging for LLM providers. It is for the Journey Tracker power user — a solo developer running an AI-heavy workflow (Anthropic agent, ElevenLabs TTS, Cursor IDE) — who needs a single place to monitor, categorize, and budget all AI and subscription spending without leaving the app.

---

## Problem Statement

### The Problem

The current Cost Tracker exists as an isolated page with its own custom green header, its own external API URL, and no authentication integration with the rest of the app. It is visually inconsistent, requires a separate backend, and offers no automatic cost capture: every Anthropic token charge from the in-app AI agent is silently lost unless the user manually enters it. Provider API keys needed for sync are stored unsafely in client-accessible environment variables.

**Concrete example:** A user runs 30 AI agent queries during a work session. None of those charges appear in Cost Tracker. The user has to visit the Anthropic dashboard separately, manually tally token usage, convert it to dollars, and re-enter it — a multi-step process that most users skip.

### Why Now?

The `feat/cost-tracker` branch already ships a standalone page. The feature is 40% built. Shipping it as-is (external API, green branding, no auto-logging) would create technical debt and a broken user experience. Completing the integration now, before any public release of the feature, avoids a future re-architecture.

### Impact if Unsolved

- Users continue to have no visibility into their AI spending from within the app
- The standalone page accumulates visual and architectural drift from the main app
- Anthropic auto-logging becomes harder to retrofit later once the agent route has been in production longer
- Provider keys remain unencrypted or in client-accessible env vars

---

## Target Audience

### Primary Users

**Solo developer / power user** — the same person who uses Journey Tracker's AI agent daily:
- Runs multiple AI agent sessions per day (Anthropic Claude)
- Uses ElevenLabs for TTS features
- Pays for Cursor Pro subscription
- Wants consolidated spending visibility without leaving the app
- Technical enough to understand tokens and pricing, but wants the math done for them

### Secondary Users

None. This is a single-user personal productivity tool embedded in a single-account app. There are no secondary user groups at this stage.

### User Needs

1. **Automatic cost capture** — Anthropic charges should appear without any user action
2. **Secure credential storage** — API keys for provider sync should be stored encrypted server-side, never visible in the browser
3. **Visual consistency** — Cost Tracker should feel like a native tab of Journey Tracker, not a bolted-on page

---

## Solution Overview

### Proposed Solution

A 5-phase integration that: (1) moves Cost Tracker into the main navigation and removes its standalone header, (2) replaces the external API with Next.js API routes backed by Prisma/MongoDB, (3) adds encrypted server-side credential storage for provider API keys, (4) instruments the agent route to auto-log Anthropic token usage and adds an on-demand ElevenLabs sync, and (5) polishes error/empty states and adds targeted unit tests.

### Key Features

- **Navigation integration** — `💰 Cost Tracker` as the 6th tab in `Header.tsx`, rendered inside the shared `AppShell` with brand-consistent styling
- **Internal backend** — 11 Next.js API routes replacing the external API dependency; data persisted in the same MongoDB instance via 3 new Prisma models (`CostTransaction`, `Budget`, `LLMCredential`)
- **Anthropic auto-logging** — zero-config: every AI agent turn automatically writes a `CostTransaction` with token counts, model name, and computed USD cost
- **ElevenLabs on-demand sync** — user adds API key once; "Sync Now" fetches generation history, maps to transactions, deduplicates
- **Cursor manual guidance** — preset category + helper text for fixed monthly subscription entry (no public API available)
- **Credentials tab** — new 5th internal tab with masked key display, "Test Connection", and delete/re-add flow
- **AES-256-GCM encryption** — provider keys encrypted at rest; `CREDENTIAL_ENCRYPTION_KEY` env var required; plaintext never returned to client

### Value Proposition

One app, one tab, zero manual overhead for AI cost tracking. The user's biggest cost source (Anthropic agent) is captured automatically; other providers sync on demand; the UI matches the rest of the app.

---

## Business Objectives

### Goals

- Complete the Cost Tracker integration so the feature can ship from the `feat/cost-tracker` branch without creating a separate backend or exposing unencrypted credentials
- Eliminate manual Anthropic cost entry entirely via auto-logging
- Achieve full brand palette consistency (remove all `green-*`/`emerald-*` classes from the cost-tracker module)
- All cost-tracker API routes enforce ownership (`userId`) and authentication via Clerk

### Success Metrics

- Anthropic `CostTransaction` rows are written automatically after every AI agent turn (0 manual entry required)
- No provider API key is ever returned to the client in any API response
- Cost Tracker tab loads and navigates identically to other main navigation tabs
- All existing 885 tests continue to pass after integration; 3 new unit tests added (encrypt round-trip, price calculation, DELETE ownership)
- Zero `green-*`/`emerald-*` Tailwind classes remain in `src/app/cost-tracker/`

### Business Value

Reduces context-switching for the developer by consolidating AI spend monitoring into the same app used for goal and task tracking. Prevents billing surprises by surfacing token costs in real time. Establishes a secure credential management pattern that can be reused for future provider integrations.

---

## Scope

### In Scope

- Navigation tab addition to `Header.tsx`
- Removal of the standalone green custom header from `cost-tracker/page.tsx`
- Brand palette rebrand (`brand-primary`/`brand-secondary` replacing `green-*`/`emerald-*`)
- 3 new Prisma models: `CostTransaction`, `Budget`, `LLMCredential`
- 11 internal Next.js API routes under `/api/cost-tracker/*`
- `useCostTracker` hook repointed from `NEXT_PUBLIC_API_URL` to internal routes
- AES-256-GCM encryption utility (`src/lib/credentials/encrypt.ts`)
- Credentials tab UI (provider cards, masked keys, add/delete flow, sync button)
- Anthropic auto-logging via instrumented `src/app/api/agent/chat/route.ts`
- ElevenLabs on-demand sync (`src/lib/cost-tracking/elevenlabs.ts`)
- Cursor manual entry guidance (category preset + helper text in `TransactionForm`)
- Error states (backend unavailable), empty states (no transactions yet)
- 3 targeted unit tests

### Out of Scope

- Google Gemini integration (requires OAuth flow — future feature)
- Historical import from provider dashboards via CSV upload
- Multi-currency support (USD only)
- Email alerts for budget threshold breaches (email preferences system exists but not wired here)
- Background cron job for scheduled ElevenLabs sync (optional stretch goal, not in plan)
- Any changes to the AI agent's core logic beyond token usage extraction

### Future Considerations

- Google Gemini credential + sync (once OAuth complexity is addressed)
- CSV/JSON historical import from Anthropic/ElevenLabs dashboards
- Email budget alerts (hook into existing `EmailPreferences` model)
- Scheduled ElevenLabs sync via `vercel.json` cron job
- Multi-currency display

---

## Key Stakeholders

- **alonsooteroseminario (Developer/Owner)** — High influence. Sole developer and primary user; defines requirements, executes implementation, validates output.

---

## Constraints and Assumptions

### Constraints

- Must use the existing MongoDB instance (no new database or external service)
- Must use Clerk session cookies for authentication (no separate auth layer for cost-tracker API routes)
- `CREDENTIAL_ENCRYPTION_KEY` must be added to `.env.local` and production env; server throws if missing
- No Cursor public API exists — manual entry only
- Vercel timeout of 120s applies to the agent route (auto-logging must be non-blocking via `after()`)
- Implementation is split into 6 sessions to match the plan's session breakdown

### Assumptions

- The existing `src/app/api/agent/chat/route.ts` Anthropic responses already expose `response.usage.input_tokens` and `response.usage.output_tokens` (standard Anthropic SDK behavior)
- ElevenLabs `/v1/history` API is paginated and includes sufficient metadata (voice ID, model ID, character count) to compute cost
- The static model→price map for Anthropic pricing is acceptable; no dynamic pricing lookup needed
- `npx prisma generate` after schema changes is sufficient; no migration runner required (MongoDB, schemaless)
- Rate limiting for sync routes can extend the existing `src/lib/agent/security.ts` pattern without a new library

---

## Success Criteria

- Cost Tracker tab is indistinguishable in navigation behavior and visual style from Goals, Board, Friends, and Profile tabs
- A developer running the AI agent sees `CostTransaction` rows with `source: "auto-anthropic"` appear in the Transactions tab without any manual action
- An ElevenLabs API key can be saved, tested, and used to sync history — with the key never appearing in any network response payload
- Deleting a `CostTransaction` via the API rejects requests from a different `userId` with 403
- The encrypt/decrypt round-trip test passes for any 32-byte hex `CREDENTIAL_ENCRYPTION_KEY`
- All 885 existing tests continue to pass

---

## Timeline and Milestones

### Target Launch

End of current sprint (branch: `feat/cost-tracker` → merge to `main`)

### Key Milestones

- **Session 1:** Phase 1 complete — nav tab visible, standalone header removed, brand palette applied
- **Session 2:** Phase 2 (partial) — Prisma models generated, overview/breakdown/daily API routes live
- **Session 3:** Phase 2 complete — transactions/budget API routes + `useCostTracker` hook repointed to internal API
- **Session 4:** Phase 3 complete — encryption utility, credentials API routes, Credentials UI tab
- **Session 5:** Phase 4 (partial) — Anthropic auto-logging live, ElevenLabs sync endpoint + UI
- **Session 6:** Phase 4 + 5 complete — Cursor guidance, polish, 3 new unit tests, branch ready for merge

---

## Risks and Mitigation

- **Risk:** ElevenLabs API response shape differs from documented schema, causing sync failures
  - **Likelihood:** Medium
  - **Mitigation:** Treat unknown fields gracefully; log raw response to metadata; fall back to zero-cost entry rather than crashing

- **Risk:** Anthropic token auto-logging adds latency to agent responses
  - **Likelihood:** Low
  - **Mitigation:** Use Next.js `after()` for fire-and-forget writes; logging is strictly non-blocking

- **Risk:** `CREDENTIAL_ENCRYPTION_KEY` missing in production env causes startup failure
  - **Likelihood:** Low (documented in plan)
  - **Mitigation:** Throw a clear error at module load time with env var name; add to `.env.example` with setup instructions

- **Risk:** Prisma MongoDB `generate` fails due to schema syntax errors in new models
  - **Likelihood:** Low
  - **Mitigation:** Validate schema against existing working models before running generate; test locally before committing

- **Risk:** Existing 885 tests break due to Header.tsx navItems change
  - **Likelihood:** Low
  - **Mitigation:** Header tests mock `usePathname`; adding a navItem is additive. Check `Header.test.tsx` after Step 1.1.

---

## Next Steps

1. Execute Phase 1 (Session 1) — Navigation + Layout + Rebrand
2. Execute Phase 2 (Sessions 2–3) — Backend Foundation
3. Execute Phase 3 (Session 4) — Credentials Management
4. Execute Phases 4–5 (Sessions 5–6) — Provider Sync + Polish

Run `/workflow-status` to see overall project progress.

---

**This document was created using BMAD Method v6 - Phase 1 (Analysis)**
**Source context:** Design spec + implementation plan dated 2026-03-29

*To continue: Run `/prd` to create a full Product Requirements Document, or proceed directly to `/tech-spec` for implementation-focused planning.*
