# F2 — Agent API Key in Settings (BYO Anthropic Key)

**Date:** 2026-05-16 · **Owner:** alonsooteroseminario · **Branch:** `feat/f2-agent-api-key`

## Problem

The agent currently reads `process.env.ANTHROPIC_API_KEY` from server env, meaning the platform pays for every user's tokens and there's no way to ship without a platform-wide key. The Cost Tracker page exposes complex multi-provider sync the user no longer wants surfaced. We need a focused **bring-your-own-key (BYOK)** flow that's the only path to chat.

## Goal

User goes to `/settings/ai-key`, pastes Anthropic API key, and now the chat agent uses their key — stored encrypted in DB. Without a key, chat is gated with a clear CTA. Existing `LLMCredential` model is reused (already encrypted) but only the **Anthropic single-key path** is exposed to users.

## Non-Goals

- No multi-provider UI. (Multi-provider tech-spec at `docs/tech-spec-multi-provider-llm-credentials-2026-03-29.md` stays for future re-enable, no destructive migration of `LLMCredential`.)
- No usage logging, billing, or cost-tracker UI in this round.
- Admin route (`/api/admin/agent/chat`) keeps env-var fallback for internal/QA only.
- `pickGoalIcon` (used for AI-suggested goal icons in CreateGoalModal) is **bonus**: prefer user's key when available, fall back to env. If env unavailable AND no user key, function returns null and the icon picker offers manual selection.

## Architecture

### Data Layer

Reuse `LLMCredential` model unchanged (already has encryption, `encryptedKey` + `iv`, `maskedKey`, `lastSyncedAt`).

Add a helper `getUserAgentKey(userId)`:

```ts
// src/lib/agent/getUserAgentKey.ts
export async function getUserAgentKey(userId: string): Promise<string | null> {
  const cred = await prisma.lLMCredential.findFirst({
    where: { userId, provider: 'anthropic' },
    orderBy: { updatedAt: 'desc' },
  });
  if (!cred) return null;
  return decryptKey(cred.encryptedKey, cred.iv);
}
```

(Picks the most-recently-updated; future multi-key UI uses a `selectedCredentialId` field.)

### Settings Page

New route: **`/settings/ai-key/page.tsx`**

```
┌─ Settings · AI Key ─────────────────────────────────┐
│  Anthropic API Key                                  │
│  Your key is encrypted and used only by your        │
│  chat agent.                                        │
│                                                     │
│  ●●●●●●●●●●●●●…XKL2          [Replace]  [Remove]    │
│                                                     │
│  Status: ✓ Valid · last verified 5 min ago          │
│                                                     │
│  [Validate now]                                     │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Don't have a key?                                  │
│  Sign up at console.anthropic.com → Settings →      │
│  API Keys → Create.                                 │
└─────────────────────────────────────────────────────┘
```

When **no key set**:

```
┌─ Settings · AI Key ─────────────────────────────────┐
│  ⚠ You need an Anthropic API key to chat with      │
│  your agent.                                        │
│                                                     │
│  [_______________________________]                  │
│  [Save Key]                                         │
│                                                     │
│  Need help? Click here for setup instructions →     │
└─────────────────────────────────────────────────────┘
```

Submitting the form `POST`s to `/api/settings/ai-key` which:
1. Verifies the key by hitting Anthropic's `/v1/messages` with a 1-token test prompt.
2. On 200 → encrypts + persists. On 401 → returns "Invalid key" error.

### Chat Gate

Modify `src/app/api/agent/chat/route.ts`:

```ts
const user = await getCurrentUser();
const apiKey = await getUserAgentKey(user.id);
if (!apiKey) {
  return NextResponse.json({
    error: "NO_AGENT_KEY",
    message: "Set your Anthropic API key in Settings to chat.",
    settingsUrl: "/settings/ai-key",
  }, { status: 403 });
}
const client = new Anthropic({ apiKey });
```

ChatWidget catches `403 NO_AGENT_KEY` and shows:
```
🔑 Add your Anthropic API key to chat
    [Go to Settings]
```

### Routes Hidden

- Remove `{ href: "/cost-tracker", ... }` from `Header.tsx` nav items.
- `/cost-tracker/page.tsx` redirects → `/settings/ai-key` (one-line change).
- All `/api/cost-tracker/*` routes remain (still used by `LLMCredential` DB writes via the new settings page; the multi-provider sync routes get no UI but the endpoints stay until F2.5 cleanup).

## Security

- AES-256-GCM via `crypto.subtle` (existing `encryptKey`/`decryptKey` already use this; verify the implementation).
- `ENCRYPTION_KEY` env var documented in `.env.example`.
- Never log decrypted key. Never return it to client. Show only `maskedKey` (last 4 chars).
- Rate limit `POST /api/settings/ai-key` to 5/min per user (reuse existing `src/lib/agent/security.ts` rate limiter).
- CSRF: Clerk session cookie already handles this for same-origin POST.

## Testing

- Unit: `getUserAgentKey.test.ts`, `route.test.ts` for both endpoints.
- Vitest: gate test (`route.test.ts`) — when no credential exists, agent returns 403 with `NO_AGENT_KEY`.
- E2E: `e2e/byok.spec.ts` — sign-in fresh user, hit `/board`, open chat, expect gate message. Go to `/settings/ai-key`, paste a mock key (mock Anthropic validation), chat now works.

## Migration & Backward Compat

- Existing users with `LLMCredential` rows already pre-pass the gate.
- Existing env-var-based chat for QA: admin route (`/api/admin/agent/chat`) keeps env fallback.
- No Prisma migration needed — `LLMCredential` schema unchanged.

## Acceptance Criteria

- New user signs in → opens chat → sees "Add your Anthropic API key" gate → goes to settings → pastes valid key → chat works.
- Invalid key returns clear error and is not persisted.
- "Replace" rotates encryption (new IV); "Remove" deletes the row.
- `/cost-tracker` no longer in nav.
- `npm run lint` + `npm run test` + `npm run test:e2e -- byok` green.
