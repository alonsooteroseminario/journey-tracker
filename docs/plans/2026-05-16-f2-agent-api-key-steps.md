# F2 — Agent API Key · Step Plan

**Branch:** `feat/f2-agent-api-key` · **Estimate:** 1-1.5 days

## Step 1 — Helper + Tests (TDD-first)

**Files:**
- `src/lib/agent/getUserAgentKey.ts` (new) — query Prisma, decrypt
- `src/lib/agent/getUserAgentKey.test.ts` (new) — covers: no credential → null, valid credential → decrypted string, decryption failure → null + console.warn

**TDD:** Write failing test → minimal impl → green.

**Done when:** `vitest src/lib/agent/getUserAgentKey` passes.

## Step 2 — Settings Page + API

**Files:**
- `src/app/settings/ai-key/page.tsx` (new) — server component → fetches existing credential, renders form
- `src/components/settings/AgentKeyForm.tsx` (new client) — handles paste, save, replace, remove, validate
- `src/app/api/settings/ai-key/route.ts` (new) — `GET` (returns `{ hasKey, maskedKey, lastValidated }`), `POST` (validates against Anthropic, encrypts, persists), `DELETE` (removes)
- `src/lib/anthropic/validateKey.ts` (new) — POSTs to `https://api.anthropic.com/v1/messages` with `claude-haiku-4-5` and `max_tokens: 1`; treats `200 + content` as valid, `401` as invalid

**TDD:**
- `route.test.ts` mocks Prisma + fetch; covers: no auth (401), invalid key shape (400), Anthropic rejects (422), valid (200 + persisted row), replace (delete old + insert new), delete (404 if none, 200 if existed).
- `AgentKeyForm.test.tsx` covers: paste → submit → success state, paste → submit → error state, "Remove" confirm modal.

**Done when:** Form works in browser; API tests pass.

## Step 3 — Chat Gate

**Files:**
- `src/app/api/agent/chat/route.ts` — replace `process.env.ANTHROPIC_API_KEY` with `await getUserAgentKey(user.id)`; return 403 `NO_AGENT_KEY` if absent
- `src/app/api/admin/agent/chat/route.ts` — keep env-var fallback (admin only)
- `src/lib/agent/pickGoalIcon.ts` — prefer user key, fall back to env, return null if neither
- `src/components/chat/ChatWidget.tsx` (or `useChat.ts`) — handle 403 `NO_AGENT_KEY` → show "Add key" CTA
- `src/components/chat/AddKeyCTA.tsx` (new) — small banner with `[Go to Settings]` link

**TDD:**
- `route.test.ts` (chat) — when no key, returns 403 with correct body shape
- `useChat.test.ts` — when SSE response is 403 NO_AGENT_KEY, hook surfaces `needsKey: true`
- Manual: chat without key, see gate; add key, refresh, chat works.

**Done when:** Fresh user hits gate; gate cleared by setting key.

## Step 4 — Hide Cost Tracker Nav + Redirect

**Files:**
- `src/components/Header.tsx` — remove `Cost Tracker` entry from `navItems`
- `src/app/cost-tracker/page.tsx` — replace with `redirect('/settings/ai-key')`
- Keep `/api/cost-tracker/*` routes untouched (data still readable via DB for future re-enable)

**TDD:**
- `Header.test.tsx` — assert "Cost Tracker" not in rendered nav
- `e2e/cost-tracker-redirect.spec.ts` — visit `/cost-tracker` → ends up on `/settings/ai-key`

**Done when:** No Cost Tracker tab visible; old URL redirects.

## Step 5 — End-to-End Flow Test

`e2e/byok.spec.ts`:
1. Sign in as test user with no credential.
2. Open chat widget → assert "Add your Anthropic API key" CTA.
3. Click "Go to Settings" → land on `/settings/ai-key`.
4. Paste a mock key (mock `validateKey` to return valid).
5. Submit → see success state.
6. Return to home, open chat → message succeeds.
7. Click "Remove" → confirm → chat gates again.

**Done when:** Playwright passes.

## Step 6 — Documentation + Verification

- Update `docs/cost-tracker-credentials-guide.md` with a "DEPRECATED: see Settings → AI Key" header.
- Update `CLAUDE.md` to note that chat requires user-provided key.
- Run `superpowers:verification-before-completion`: lint + build + test + e2e.
- Update `MEMORY.md` with new entry (F2 ✅ shipped).

**Done when:** PR ready, screenshots attached, `_bmad-output/implementation-artifacts/` updated.

## Risk Bail-Outs

- If Anthropic validation hits rate limits during tests → mock at the network layer (already pattern in `e2e/`).
- If decryption fails for any existing user's credential → log + return 403 with `INVALID_KEY` (force re-enter).
- If `ENCRYPTION_KEY` env var changes between deploys → user must re-paste. Document.
