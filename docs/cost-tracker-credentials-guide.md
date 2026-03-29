# Cost Tracker — Credentials & Security Guide

## Are API Keys Stored Securely?

**Yes.** API keys are never stored in plaintext. Every key is encrypted with **AES-256-GCM** before being written to MongoDB. The raw key is never retrievable from the database without the encryption master key.

---

## How Keys Are Stored — The Full Workflow

### Saving a key (POST `/api/cost-tracker/credentials`)

```
User submits API key in UI
        ↓
encryptKey(plaintext)          ← src/lib/credentials/encrypt.ts
  - generate 12-byte random IV
  - AES-256-GCM encrypt with CREDENTIAL_ENCRYPTION_KEY
  - append 16-byte auth tag to ciphertext
  - base64-encode both (encryptedKey, iv)
        ↓
Store in MongoDB (LLMCredential collection):
  {
    userId,
    provider,
    encryptedKey,   ← base64(ciphertext + authTag)
    iv,             ← base64(12-byte random IV)
    maskedKey,      ← "sk-ant-...XXXX" (last 4 chars only, for display)
    lastSyncedAt
  }
        ↓
Return to client: maskedKey only  ← raw key is NEVER sent back
```

### Reading credentials (GET `/api/cost-tracker/credentials`)

The API only returns `{ provider, maskedKey, lastSyncedAt }`. The encrypted blob and IV are **never exposed to the frontend**.

### Using a key to sync (POST `/api/cost-tracker/sync/[provider]`)

```
Server fetches LLMCredential row from MongoDB
        ↓
decryptKey(encryptedKey, iv)   ← AES-256-GCM decrypt + auth tag verification
        ↓
Call provider API with decrypted key (in-memory only)
        ↓
Store resulting CostTransaction rows
        ↓
Update lastSyncedAt
        ↓
Decrypted key is garbage-collected — never logged, never stored
```

### Deleting a key (DELETE `/api/cost-tracker/credentials/[provider]`)

Removes the entire `LLMCredential` row. No key material remains.

---

## Encryption Details

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key size | 256 bits (32 bytes) |
| IV | 12 bytes, randomly generated per encryption |
| Auth tag | 16 bytes (GCM integrity check — tampered data throws on decrypt) |
| Key source | `CREDENTIAL_ENCRYPTION_KEY` env var (64 hex chars = 32 bytes) |

The random IV means the same plaintext produces different ciphertext every time, so even if two users have the same API key, the stored blobs are different.

---

## Environment Variables

### Local development (`.env.local`)

Add this to your `.env.local`:

```bash
# Generate your own key — do NOT reuse this command output with others
CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

Or manually:
```
CREDENTIAL_ENCRYPTION_KEY=<output of: openssl rand -hex 32>
```

Example value (64 hex characters):
```
CREDENTIAL_ENCRYPTION_KEY=a3f8c2e1b4d9071a6e5f3c8b2d4a1e7f9c2b5d8a1e4f7c0b3d6a9e2f5c8b1d4
```

> **Important:** This key must be the same value in development and production, otherwise credentials encrypted in one environment cannot be decrypted in the other.

### Vercel (production)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `CREDENTIAL_ENCRYPTION_KEY`
   - **Value:** `<same value as your local .env.local>`
   - **Environment:** Production, Preview, Development (all three)
3. **Redeploy** the project after adding the variable

> **Critical:** If you rotate this key, all existing encrypted credentials in MongoDB become undecryptable. Users would need to re-enter their API keys.

---

## Is It Ready to Test? What Can You Pull Now?

### ✅ Anthropic — Works automatically, no setup needed

Claude API usage is logged **automatically** on every chat message in the AI agent. No credential setup required — it uses your existing `ANTHROPIC_API_KEY`.

- Every call to `messages.create()` in `src/app/api/agent/chat/route.ts` fires a background `logAnthropicUsage()` call
- Token counts (`input_tokens`, `output_tokens`) are read from the API response
- Cost is computed per model using current pricing:
  - `claude-opus-4-6`: $15/M input, $75/M output
  - `claude-sonnet-4-6`: $3/M input, $15/M output
  - `claude-haiku-4-5`: $0.80/M input, $4/M output
- Transactions appear in the **Transactions** tab with `source: "auto-anthropic"`

**To test:** Use the AI chat in the app, then open Cost Tracker → Transactions. You'll see entries appear automatically.

### ✅ ElevenLabs — Works after adding API key

1. Make sure `CREDENTIAL_ENCRYPTION_KEY` is set in `.env.local`
2. Open Cost Tracker → **Credentials** tab
3. Click "Add API Key" under ElevenLabs
4. Enter your ElevenLabs API key
5. Click "Sync Now"

The sync calls the ElevenLabs `/v1/history` endpoint and creates `CostTransaction` rows at `$0.0003/character`. Results deduplicate by `historyItemId` so re-syncing is safe.

### ⚠️ Cursor — Manual entry only

Cursor doesn't have a public usage API. You need to manually enter your monthly subscription cost:

1. Cost Tracker → click **"+ Add Transaction"**
2. Category: "Cursor Editor"
3. Amount: `20` (Cursor Pro is $20/month CAD)
4. A helper tip is shown in the form when you select the Cursor category

### Summary

| Provider | Auto or Manual | Needs Credential Setup? | Ready Now? |
|----------|---------------|------------------------|------------|
| Anthropic / Claude | Auto (background logging) | No | ✅ Yes |
| ElevenLabs | Manual sync (button) | Yes — add API key in Credentials tab | ✅ Yes (after setup) |
| Cursor | Manual entry | No | ✅ Yes (manual) |

---

## Quick Setup Checklist

- [ ] Run `openssl rand -hex 32` and copy the output
- [ ] Add `CREDENTIAL_ENCRYPTION_KEY=<value>` to `.env.local`
- [ ] Restart the dev server (`npm run dev`)
- [ ] Add the same `CREDENTIAL_ENCRYPTION_KEY` to Vercel dashboard environment variables
- [ ] Redeploy on Vercel
- [ ] Use the AI chat to generate some Anthropic transactions
- [ ] Add your ElevenLabs API key in Cost Tracker → Credentials → Sync Now
- [ ] Check Cost Tracker → Overview and Transactions to confirm data appears
