# Cost Tracker UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ElevenLabs sync bug, add one-time charges UX, budget settings UI, and credential edit modal.

**Architecture:** Four independent, additive changes to the Cost Tracker feature. No schema migrations. Each task touches at most 2-3 files and is independently committable. Backend changes (API routes, lib) before frontend changes for each feature.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma + MongoDB, Vitest (unit tests), AES-256-GCM credential encryption, Tailwind CSS + brand-* design tokens.

---

## File Map

| File | Change |
|------|--------|
| `src/lib/cost-tracking/elevenlabs.ts` | Fix char count calc; add pagination; add `character_count_change_to` |
| `src/app/api/cost-tracker/validate/[provider]/route.ts` | Add `elevenlabs` to supported providers + validation handler |
| `src/app/api/cost-tracker/credentials/[provider]/route.ts` | Add `PATCH` handler (label + key update) |
| `src/app/cost-tracker/hooks/useCostTracker.ts` | Add `updateCredential` function |
| `src/app/cost-tracker/components/Credentials.tsx` | Add ElevenLabs "Test" button; add Edit modal + onEdit prop |
| `src/app/cost-tracker/components/Transactions.tsx` | Add "Log One-Time Charge" card; add `onAddTransaction` prop |
| `src/app/cost-tracker/components/BudgetAlerts.tsx` | Add Budget Settings card; add `onUpdateBudget` prop |
| `src/app/cost-tracker/page.tsx` | Thread new props into Transactions and BudgetAlerts |

---

## Task 1 — Fix ElevenLabs Character Count + Add Pagination

**Files:**
- Modify: `src/lib/cost-tracking/elevenlabs.ts`

### Background
`character_count_change_from` = quota BEFORE generation (e.g. 50,000).
`character_count_change_to` = quota AFTER generation (e.g. 49,500).
Characters used = `from - to` = 500. Current code does `Math.abs(from)` = 50,000, inflating cost ~100×.
ElevenLabs history is paginated: `{ history, has_more, last_history_item_id }`. Default page size is 100.

- [ ] **Step 1.1: Write failing test for character count fix**

Create `src/lib/cost-tracking/elevenlabs.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    costTransaction: {
      findMany: vi.fn(() => Promise.resolve([])),
      createMany: vi.fn(() => Promise.resolve({ count: 1 })),
    },
  },
}));

// Helper to make a mock fetch response
function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

import { syncElevenLabsUsage } from "./elevenlabs";

describe("syncElevenLabsUsage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates cost using from - to (not abs(from))", async () => {
    const item = {
      history_item_id: "h1",
      voice_id: "v1",
      model_id: "m1",
      text: "hello",
      date_unix: 1700000000,
      character_count_change_from: 50000, // quota before
      character_count_change_to: 49500,   // quota after → 500 chars used
    };
    global.fetch = mockFetch({ history: [item], has_more: false });

    const { prisma } = await import("@/lib/prisma");
    let capturedData: unknown[] = [];
    (prisma.costTransaction.createMany as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: unknown[] }) => { capturedData = data; return Promise.resolve({ count: 1 }); }
    );

    await syncElevenLabsUsage({ userId: "u1", apiKey: "sk_test", credentialId: "c1" });

    expect(capturedData).toHaveLength(1);
    const tx = capturedData[0] as { amount: number };
    // 500 chars * $0.0003 = $0.15
    expect(tx.amount).toBeCloseTo(0.15, 4);
  });

  it("fetches next page when has_more is true", async () => {
    const item = (id: string) => ({
      history_item_id: id,
      voice_id: "v1",
      model_id: "m1",
      text: "hi",
      date_unix: 1700000000,
      character_count_change_from: 1000,
      character_count_change_to: 900,
    });

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        text: () => Promise.resolve(JSON.stringify({
          history: [item("h1")],
          has_more: true,
          last_history_item_id: "h1",
        })),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        text: () => Promise.resolve(JSON.stringify({
          history: [item("h2")],
          has_more: false,
          last_history_item_id: "h2",
        })),
      });

    const { prisma } = await import("@/lib/prisma");
    let capturedData: unknown[] = [];
    (prisma.costTransaction.createMany as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: unknown[] }) => { capturedData = data; return Promise.resolve({ count: data.length }); }
    );

    await syncElevenLabsUsage({ userId: "u1", apiKey: "sk_test", credentialId: "c1" });

    // Second fetch should use start_after_history_item_id=h1
    const secondCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(secondCall[0]).toContain("start_after_history_item_id=h1");
    expect(capturedData).toHaveLength(2);
  });
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
npx vitest run src/lib/cost-tracking/elevenlabs.test.ts
```
Expected: both tests FAIL (wrong amount, pagination not implemented).

- [ ] **Step 1.3: Rewrite elevenlabs.ts with fix + pagination**

Replace `src/lib/cost-tracking/elevenlabs.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { CostSyncError } from "./sync-error";

interface SyncParams {
  userId: string;
  apiKey: string;
  credentialId: string;
  test?: boolean;
}

interface SyncResult {
  synced: number;
  total: number;
}

interface ElevenLabsHistoryItem {
  history_item_id: string;
  voice_id: string;
  model_id: string;
  text: string;
  date_unix: number;
  character_count_change_from: number; // quota level BEFORE generation
  character_count_change_to: number;   // quota level AFTER generation
}

interface ElevenLabsHistoryPage {
  history: ElevenLabsHistoryItem[];
  has_more: boolean;
  last_history_item_id: string | null;
}

const COST_PER_CHAR = 0.0003; // $0.30 per 1000 characters (Creator tier estimate)
const MAX_ITEMS = 500;        // cap to avoid serverless timeout

async function fetchHistoryPage(apiKey: string, startAfter?: string): Promise<ElevenLabsHistoryPage> {
  const params = new URLSearchParams({ page_size: "100" });
  if (startAfter) params.set("start_after_history_item_id", startAfter);

  const response = await fetch(`https://api.elevenlabs.io/v1/history?${params}`, {
    headers: { "xi-api-key": apiKey },
  });
  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      throw new CostSyncError(
        "ElevenLabs rejected this API key (401). Use the key from https://elevenlabs.io/app/settings/api-keys — copy the full value, no spaces.",
        422
      );
    }
    let detail = "";
    try {
      const j = JSON.parse(text) as { detail?: { message?: string } | string };
      if (typeof j.detail === "string") detail = j.detail;
      else if (j.detail && typeof j.detail === "object" && "message" in j.detail) {
        detail = String((j.detail as { message?: string }).message ?? "");
      }
    } catch {
      if (text) detail = text.slice(0, 280);
    }
    throw new CostSyncError(
      `ElevenLabs API error (${response.status})${detail ? `: ${detail}` : ""}`,
      response.status >= 500 ? 502 : 400
    );
  }

  try {
    return JSON.parse(text) as ElevenLabsHistoryPage;
  } catch {
    throw new CostSyncError("Invalid JSON from ElevenLabs history API", 502);
  }
}

export async function syncElevenLabsUsage(params: SyncParams): Promise<SyncResult> {
  const { userId, apiKey, credentialId, test = false } = params;

  // Paginate up to MAX_ITEMS
  const allItems: ElevenLabsHistoryItem[] = [];
  let lastId: string | undefined;

  do {
    const page = await fetchHistoryPage(apiKey, lastId);
    allItems.push(...page.history);
    lastId = page.last_history_item_id ?? undefined;
    if (!page.has_more) break;
  } while (allItems.length < MAX_ITEMS);

  const items = allItems.slice(0, MAX_ITEMS);

  if (test || items.length === 0) {
    return { synced: 0, total: items.length };
  }

  // Deduplicate by historyItemId
  const existingTxns = await prisma.costTransaction.findMany({
    where: { userId, source: "sync-elevenlabs" },
    select: { metadata: true },
  });

  const existingIds = new Set(
    existingTxns
      .map((t) => (t.metadata as Record<string, unknown> | null)?.historyItemId as string | undefined)
      .filter(Boolean)
  );

  const newItems = items.filter((item) => !existingIds.has(item.history_item_id));

  if (newItems.length === 0) {
    return { synced: 0, total: items.length };
  }

  await prisma.costTransaction.createMany({
    data: newItems.map((item) => {
      // Characters used = quota before - quota after
      const chars = Math.max(0, item.character_count_change_from - item.character_count_change_to);
      return {
        userId,
        amount: Math.round(chars * COST_PER_CHAR * 100000) / 100000,
        category: "elevenlabs",
        description: item.text ? item.text.slice(0, 80) : "ElevenLabs generation",
        date: new Date(item.date_unix * 1000),
        source: "sync-elevenlabs",
        metadata: {
          historyItemId: item.history_item_id,
          voiceId: item.voice_id,
          modelId: item.model_id,
          characters: chars,
          credentialId,
        },
      };
    }),
  });

  return { synced: newItems.length, total: items.length };
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
npx vitest run src/lib/cost-tracking/elevenlabs.test.ts
```
Expected: 2 tests PASS.

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/cost-tracking/elevenlabs.ts src/lib/cost-tracking/elevenlabs.test.ts
git commit -m "fix(elevenlabs): correct character count calc and add pagination

Use from-to instead of abs(from) for character usage.
Paginate up to 500 history items per sync.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2 — Add ElevenLabs Validation Endpoint

**Files:**
- Modify: `src/app/api/cost-tracker/validate/[provider]/route.ts`

### Background
The validate route currently only supports `anthropic`. ElevenLabs validation calls `GET /v1/user/subscription` with the `xi-api-key` header. 200 = valid. 401 = bad key.

- [ ] **Step 2.1: Add ElevenLabs to the validate route**

Replace the top of `src/app/api/cost-tracker/validate/[provider]/route.ts` — change `SUPPORTED_PROVIDERS` and add the ElevenLabs handler block after the Anthropic `if` block:

```typescript
const SUPPORTED_PROVIDERS = ["anthropic", "elevenlabs"] as const;
```

Then add before the final `return NextResponse.json({ error: "Provider handler not implemented" }...`:

```typescript
  if (provider === "elevenlabs") {
    let valid = false;
    let validationError: string | null = null;

    try {
      const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        method: "GET",
        headers: { "xi-api-key": apiKey },
      });
      if (res.ok) {
        valid = true;
      } else if (res.status === 401) {
        validationError = "Invalid API key — copy the full key from https://elevenlabs.io/app/settings/api-keys.";
      } else {
        validationError = `ElevenLabs returned HTTP ${res.status}.`;
      }
    } catch (e) {
      validationError = e instanceof Error ? e.message : "Network error reaching ElevenLabs.";
    }

    if (!valid) {
      return NextResponse.json({ error: validationError ?? "Validation failed" }, { status: 422 });
    }

    return NextResponse.json({ valid: true, keyType: null });
  }
```

- [ ] **Step 2.2: Update ElevenLabs PROVIDERS entry to set validateSupported: true**

In `src/app/cost-tracker/components/Credentials.tsx`, change the ElevenLabs entry:

```typescript
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    icon: "🔊",
    placeholder: "sk_...",
    syncSupported: true,
    validateSupported: true,  // was false
  },
```

- [ ] **Step 2.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "validate\|credentials\|elevenlabs"
```
Expected: no output (no errors).

- [ ] **Step 2.4: Commit**

```bash
git add src/app/api/cost-tracker/validate/[provider]/route.ts src/app/cost-tracker/components/Credentials.tsx
git commit -m "feat(elevenlabs): add Test button validation via /v1/user/subscription

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3 — Credential PATCH Endpoint

**Files:**
- Modify: `src/app/api/cost-tracker/credentials/[provider]/route.ts`

### Background
The route segment is named `[provider]` for legacy reasons but captures the credential ID. We add a `PATCH` handler alongside the existing `DELETE`. The handler supports updating `label` (rename) and/or `apiKey` (re-encrypt). At least one must be provided.

- [ ] **Step 3.1: Write failing tests for PATCH**

Create `src/app/api/cost-tracker/credentials/[provider]/route.test.ts` — **append** these tests to the existing DELETE tests (or replace the whole file):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/credentials/encrypt", () => ({
  encryptKey: vi.fn(() => ({ encryptedKey: "enc2", iv: "iv2" })),
  decryptKey: vi.fn(() => "old-key"),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    lLMCredential: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { DELETE, PATCH } from "./route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const mockUser = { id: "bbbbbbbbbbbbbbbbbbbbbbbb" };
const otherUser = { id: "cccccccccccccccccccccccc" };
const mockCredential = {
  id: VALID_ID,
  userId: mockUser.id,
  provider: "anthropic",
  label: "Work",
  encryptedKey: "enc",
  iv: "iv",
  maskedKey: "••••••••abcd",
  keyType: "standard",
};

function makePatchReq(id: string, body: unknown) {
  return {
    req: new NextRequest(`http://localhost/api/cost-tracker/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: { params: Promise.resolve({ provider: id }) },
  };
}

describe("PATCH /api/cost-tracker/credentials/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockCredential,
      label: "Personal",
    });
  });

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { req, params } = makePatchReq(VALID_ID, { label: "Personal" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid credential id", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makePatchReq("bad-id", { label: "Personal" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it("returns 400 when neither label nor apiKey provided", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makePatchReq(VALID_ID, {});
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/label.*apiKey|at least one/i);
  });

  it("returns 400 for invalid label format", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makePatchReq(VALID_ID, { label: "!@#$bad" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it("returns 404 when credential belongs to another user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(otherUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    const { req, params } = makePatchReq(VALID_ID, { label: "Personal" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(404);
    expect(prisma.lLMCredential.update).not.toHaveBeenCalled();
  });

  it("updates label only when only label provided", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    const { req, params } = makePatchReq(VALID_ID, { label: "Personal" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const updateCall = (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.label).toBe("Personal");
    expect(updateCall.data.encryptedKey).toBeUndefined();
  });

  it("re-encrypts and re-detects keyType when apiKey provided", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    const { req, params } = makePatchReq(VALID_ID, { apiKey: "sk-ant-admin-newkey99" });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    const updateCall = (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.encryptedKey).toBe("enc2");
    expect(updateCall.data.keyType).toBe("admin");
  });

  it("maskedKey in PATCH response shows last 4 chars", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockCredential,
      label: "Personal",
      maskedKey: "••••••••••••9999",
    });
    const { req, params } = makePatchReq(VALID_ID, { apiKey: "sk-ant-api03-newkey9999", label: "Personal" });
    await PATCH(req, params);
    const updateCall = (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.maskedKey).toMatch(/9999$/);
  });
});

// Keep existing DELETE tests below (preserve the existing tests from the file)
describe("DELETE /api/cost-tracker/credentials/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.lLMCredential.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/cost-tracker/credentials/${VALID_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ provider: VALID_ID }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid id", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const req = new NextRequest("http://localhost/api/cost-tracker/credentials/bad", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ provider: "bad" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when credential belongs to another user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(otherUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    const req = new NextRequest(`http://localhost/api/cost-tracker/credentials/${VALID_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ provider: VALID_ID }) });
    expect(res.status).toBe(404);
  });

  it("deletes and returns 200", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCredential);
    const req = new NextRequest(`http://localhost/api/cost-tracker/credentials/${VALID_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ provider: VALID_ID }) });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3.2: Run tests to verify PATCH tests fail**

```bash
npx vitest run "src/app/api/cost-tracker/credentials/[provider]/route.test.ts"
```
Expected: PATCH tests FAIL (no PATCH export). DELETE tests PASS.

- [ ] **Step 3.3: Add PATCH handler to credentials/[provider]/route.ts**

Replace the entire file `src/app/api/cost-tracker/credentials/[provider]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptKey } from "@/lib/credentials/encrypt";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const LABEL_REGEX = /^[a-zA-Z0-9 _-]{1,64}$/;

// DELETE and PATCH /api/cost-tracker/credentials/[id]
// The route segment is named [provider] for legacy filesystem reasons; it captures the credential id.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: id } = await params;

  if (!OBJECT_ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid credential id" }, { status: 400 });
  }

  const credential = await prisma.lLMCredential.findUnique({ where: { id } });

  if (!credential || credential.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lLMCredential.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: id } = await params;

  if (!OBJECT_ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid credential id" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, apiKey } = body;

  // At least one field must be provided
  if (label === undefined && apiKey === undefined) {
    return NextResponse.json(
      { error: "Provide at least one of: label, apiKey" },
      { status: 400 }
    );
  }

  // Validate label if provided
  if (label !== undefined) {
    if (typeof label !== "string" || !LABEL_REGEX.test(label.trim())) {
      return NextResponse.json(
        { error: "label must be 1–64 chars, letters/numbers/spaces/hyphens/underscores" },
        { status: 400 }
      );
    }
  }

  // Validate apiKey if provided
  if (apiKey !== undefined) {
    if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
      return NextResponse.json(
        { error: "apiKey must be at least 8 characters" },
        { status: 400 }
      );
    }
  }

  const credential = await prisma.lLMCredential.findUnique({ where: { id } });

  if (!credential || credential.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (label !== undefined) {
    updateData.label = (label as string).trim();
  }

  if (apiKey !== undefined) {
    const trimmedKey = (apiKey as string).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const { encryptedKey, iv } = encryptKey(trimmedKey);

    const maskedKey =
      trimmedKey.length > 4
        ? `${"•".repeat(Math.min(trimmedKey.length - 4, 12))}${trimmedKey.slice(-4)}`
        : "•".repeat(trimmedKey.length);

    const keyType: string | null =
      credential.provider === "anthropic"
        ? trimmedKey.startsWith("sk-ant-admin-") ? "admin" : "standard"
        : null;

    updateData.encryptedKey = encryptedKey;
    updateData.iv = iv;
    updateData.maskedKey = maskedKey;
    updateData.keyType = keyType;
  }

  const updated = await prisma.lLMCredential.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    provider: updated.provider,
    label: updated.label,
    maskedKey: updated.maskedKey,
    keyType: updated.keyType ?? null,
  });
}
```

- [ ] **Step 3.4: Run tests to verify all pass**

```bash
npx vitest run "src/app/api/cost-tracker/credentials/[provider]/route.test.ts"
```
Expected: all tests PASS (PATCH + DELETE).

- [ ] **Step 3.5: Commit**

```bash
git add "src/app/api/cost-tracker/credentials/[provider]/route.ts" "src/app/api/cost-tracker/credentials/[provider]/route.test.ts"
git commit -m "feat(credentials): add PATCH endpoint for label and key update

Ownership check, re-encrypt on key change, keyType re-detection.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4 — Hook: updateCredential

**Files:**
- Modify: `src/app/cost-tracker/hooks/useCostTracker.ts`

- [ ] **Step 4.1: Add updateCredential to the hook**

In `src/app/cost-tracker/hooks/useCostTracker.ts`, add the following `useCallback` after `deleteCredential`:

```typescript
  const updateCredential = useCallback(async (id: string, data: { label?: string; apiKey?: string }) => {
    const response = await fetch(`/api/cost-tracker/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error((json as { error?: string }).error || "Failed to update credential");
    }
    return await response.json() as CredentialItem;
  }, []);
```

Also add `updateCredential` to the return object of `useCostTracker`:

```typescript
  return {
    overview,
    breakdown,
    daily,
    transactions,
    budget,
    credentials,
    isLoading,
    error,
    refreshData,
    addTransaction,
    deleteTransaction,
    updateBudget,
    addCredential,
    deleteCredential,
    updateCredential,   // add this line
    syncProvider,
    validateCredential,
  };
```

- [ ] **Step 4.2: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "useCostTracker\|updateCredential"
```
Expected: no output.

- [ ] **Step 4.3: Commit**

```bash
git add src/app/cost-tracker/hooks/useCostTracker.ts
git commit -m "feat(hook): add updateCredential for PATCH support

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5 — Credentials UI: Edit Modal

**Files:**
- Modify: `src/app/cost-tracker/components/Credentials.tsx`
- Modify: `src/app/cost-tracker/page.tsx`

- [ ] **Step 5.1: Add onEdit prop and edit state to Credentials.tsx**

At the top of `Credentials.tsx`, update `CredentialsProps` to add the `onEdit` prop:

```typescript
interface CredentialsProps {
  credentials: CredentialItem[];
  onAdd: (provider: string, apiKey: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSync: (provider: string, credentialId: string) => Promise<unknown>;
  onValidate: (provider: string, credentialId: string) => Promise<{ valid: boolean; keyType: string }>;
  onEdit: (id: string, data: { label?: string; apiKey?: string }) => Promise<void>;
}
```

In the `Credentials` function signature, add `onEdit`:

```typescript
export function Credentials({ credentials, onAdd, onDelete, onSync, onValidate, onEdit }: CredentialsProps) {
```

Add these state variables after the existing state declarations:

```typescript
  const [editingCred, setEditingCred] = useState<CredentialItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
```

Add the `openEditModal` and `handleEdit` functions after `handleValidate`:

```typescript
  const openEditModal = (cred: CredentialItem) => {
    setEditingCred(cred);
    setEditLabel(cred.label);
    setEditApiKey("");
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editingCred) return;
    const data: { label?: string; apiKey?: string } = {};
    if (editLabel.trim() && editLabel.trim() !== editingCred.label) {
      data.label = editLabel.trim();
    }
    if (editApiKey.trim()) {
      data.apiKey = editApiKey.trim();
    }
    if (!data.label && !data.apiKey) {
      setEditError("Change at least one field.");
      return;
    }
    setIsEditing(true);
    setEditError(null);
    try {
      await onEdit(editingCred.id, data);
      setEditingCred(null);
      setEditApiKey("");
      setEditLabel("");
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsEditing(false);
    }
  };
```

- [ ] **Step 5.2: Add Edit button to each credential card**

In the credential card action buttons section (after the "Test" button and before the "Remove" button), add:

```tsx
                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(cred)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                            title="Edit label or replace API key"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
```

- [ ] **Step 5.3: Add Edit modal JSX**

After the closing `</div>` of the existing "Add API Key Modal" section (before the final `</div>` closing the component), add:

```tsx
      {/* Edit Credential Modal */}
      {editingCred && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Edit Credential</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingCred.provider} · {editingCred.maskedKey}</p>
              </div>
              <button
                onClick={() => setEditingCred(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  maxLength={64}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Replace API Key <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder={editingCred.maskedKey}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                />
                {editError && <p className="text-xs text-red-500 mt-1.5">{editError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCred(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isEditing ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5.4: Wire onEdit in page.tsx**

In `src/app/cost-tracker/page.tsx`, destructure `updateCredential` from `useCostTracker()`:

```typescript
  const {
    ...
    updateCredential,   // add this
    ...
  } = useCostTracker();
```

Then in the `<Credentials>` usage, add the `onEdit` prop:

```tsx
              <Credentials
                credentials={credentials}
                onAdd={...}
                onDelete={...}
                onSync={...}
                onValidate={...}
                onEdit={async (id, data) => {
                  await updateCredential(id, data);
                  await refreshData();
                }}
              />
```

- [ ] **Step 5.5: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "Credentials\|onEdit"
```
Expected: no output.

- [ ] **Step 5.6: Commit**

```bash
git add src/app/cost-tracker/components/Credentials.tsx src/app/cost-tracker/page.tsx
git commit -m "feat(credentials): add Edit modal for label and key update

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6 — One-Time Charges Card in Transactions Tab

**Files:**
- Modify: `src/app/cost-tracker/components/Transactions.tsx`
- Modify: `src/app/cost-tracker/page.tsx`

- [ ] **Step 6.1: Add onAddTransaction prop and inline modal to Transactions.tsx**

Replace `src/app/cost-tracker/components/Transactions.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { TransactionForm } from "./TransactionForm";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  source: string;
  createdAt: string;
}

interface TransactionsProps {
  transactions: Transaction[] | null;
  onDelete: (id: string) => Promise<void>;
  onAddTransaction: (data: { amount: number; category: string; description?: string; date?: string }) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  claude: "bg-blue-100 text-blue-800",
  elevenlabs: "bg-purple-100 text-purple-800",
  vercel: "bg-gray-100 text-gray-800",
  railway: "bg-brand-light text-brand-primary",
  mongodb: "bg-brand-light text-brand-primary",
  cloudflare: "bg-orange-100 text-orange-800",
  discord: "bg-indigo-100 text-indigo-800",
  cursor: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

export function Transactions({ transactions, onDelete, onAddTransaction, isLoading }: TransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showChargeForm, setShowChargeForm] = useState(false);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCharge = async (data: { amount: number; category: string; description?: string; date?: string }) => {
    await onAddTransaction(data);
    setShowChargeForm(false);
  };

  return (
    <div className="space-y-4">
      {/* One-Time Charge Card */}
      <div className="bg-white rounded-xl border border-dashed border-brand-primary/30 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Log a One-Time Charge</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Record an ad-hoc spend — overage, one-off purchase, or anything not auto-synced.
            </p>
          </div>
          <button
            onClick={() => setShowChargeForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Charge
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Transactions {transactions && transactions.length > 0 ? `(${transactions.length})` : ""}
        </h2>

        {(!transactions || transactions.length === 0) ? (
          <p className="text-gray-500 text-sm">No transactions yet. Add your first charge above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...transactions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{tx.description || "-"}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-800">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id || isLoading}
                          className="text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors text-xs font-medium"
                        >
                          {deletingId === tx.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Charge Modal */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Log One-Time Charge</h2>
              <button
                onClick={() => setShowChargeForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <TransactionForm onSubmit={handleAddCharge} onCancel={() => setShowChargeForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.2: Thread onAddTransaction into Transactions in page.tsx**

In `src/app/cost-tracker/page.tsx`, update the Transactions usage:

```tsx
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <Transactions
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
              isLoading={isLoading}
            />
          </div>
        )}
```

- [ ] **Step 6.3: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "Transactions\|onAddTransaction"
```
Expected: no output.

- [ ] **Step 6.4: Commit**

```bash
git add src/app/cost-tracker/components/Transactions.tsx src/app/cost-tracker/page.tsx
git commit -m "feat(transactions): add Log One-Time Charge card in Transactions tab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7 — Budget Settings Card in Alerts Tab

**Files:**
- Modify: `src/app/cost-tracker/components/BudgetAlerts.tsx`
- Modify: `src/app/cost-tracker/page.tsx`

- [ ] **Step 7.1: Add onUpdateBudget prop and settings state to BudgetAlerts.tsx**

Replace `src/app/cost-tracker/components/BudgetAlerts.tsx` with:

```typescript
"use client";

import { useState } from "react";

interface BudgetData {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
  spentSoFar: number;
  percentUsed: number;
  alerts: string[];
}

interface BudgetAlertsProps {
  budget: BudgetData | null;
  onUpdateBudget: (data: { monthlyLimit: number }) => Promise<void>;
}

export function BudgetAlerts({ budget, onUpdateBudget }: BudgetAlertsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [limitInput, setLimitInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(limitInput);
    if (isNaN(val) || val < 0) {
      setSaveError("Enter a valid amount (0 or more).");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateBudget({ monthlyLimit: val });
      setIsEditing(false);
      setLimitInput("");
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (!budget) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <p className="text-gray-500">Loading budget data...</p>
      </div>
    );
  }

  const getAlertColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "bg-red-50 border-red-200";
    if (percentUsed >= 75) return "bg-yellow-50 border-yellow-200";
    return "bg-brand-light border-brand-primary/10";
  };

  const getAlertIcon = (percentUsed: number) => {
    if (percentUsed >= 90) return "🔴";
    if (percentUsed >= 75) return "🟡";
    return "🟢";
  };

  return (
    <div className="space-y-4">
      {/* Budget Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Monthly Budget</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Current limit:{" "}
              <span className="font-medium text-gray-700">${budget.monthlyLimit.toFixed(2)}</span>
              {savedMsg && <span className="ml-2 text-green-600 font-medium">Saved!</span>}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => { setLimitInput(String(budget.monthlyLimit)); setIsEditing(true); setSaveError(null); }}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Limit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setSaveError(null); }}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {saveError && <p className="text-xs text-red-500 mt-2">{saveError}</p>}
      </div>

      {/* Budget Status Card */}
      <div className={`rounded-xl p-6 border ${getAlertColor(budget.percentUsed)}`}>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{getAlertIcon(budget.percentUsed)}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">Budget Status</h2>
              <p className="text-gray-600 mt-1">
                You've spent <span className="font-semibold">${budget.spentSoFar.toFixed(2)} CAD</span> of your{" "}
                <span className="font-semibold">${budget.monthlyLimit.toFixed(2)} CAD</span> monthly budget
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-3">
            {budget.percentUsed >= 90 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800">Critical Alert</p>
                  <p className="text-sm text-red-700">
                    You've used {budget.percentUsed}% of your monthly budget. Only ${(budget.monthlyLimit - budget.spentSoFar).toFixed(2)} CAD remaining.
                  </p>
                </div>
              </div>
            )}

            {budget.percentUsed >= 75 && budget.percentUsed < 90 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Budget Warning</p>
                  <p className="text-sm text-yellow-700">
                    You've used {budget.percentUsed}% of your monthly budget. Consider reducing spending.
                  </p>
                </div>
              </div>
            )}

            {budget.percentUsed < 75 && (
              <div className="flex gap-3 items-start">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-semibold text-brand-primary">On Track</p>
                  <p className="text-sm text-brand-primary/80">
                    You've used {budget.percentUsed}% of your monthly budget. Great job staying within limits!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Overall Budget Usage</span>
              <span>{budget.percentUsed}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budget.percentUsed >= 90
                    ? "bg-red-500"
                    : budget.percentUsed >= 75
                    ? "bg-yellow-500"
                    : "bg-brand-primary"
                }`}
                style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {budget.alerts.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white space-y-2">
              <p className="font-semibold text-gray-800">Active Notifications</p>
              <ul className="space-y-2">
                {budget.alerts.map((alert, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span>📌</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Pass onUpdateBudget from page.tsx**

In `src/app/cost-tracker/page.tsx`, update the BudgetAlerts usage:

```tsx
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <BudgetAlerts
              budget={budget}
              onUpdateBudget={async (data) => {
                await updateBudget(data);
                await refreshData();
              }}
            />
          </div>
        )}
```

- [ ] **Step 7.3: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "BudgetAlerts\|onUpdateBudget"
```
Expected: no output.

- [ ] **Step 7.4: Commit**

```bash
git add src/app/cost-tracker/components/BudgetAlerts.tsx src/app/cost-tracker/page.tsx
git commit -m "feat(budget): add editable monthly limit settings card

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8 — Full Test Run + Final Commit

- [ ] **Step 8.1: Run all cost-tracker tests**

```bash
npx vitest run src/lib/cost-tracking/elevenlabs.test.ts "src/app/api/cost-tracker/credentials/[provider]/route.test.ts" "src/app/api/cost-tracker/credentials/route.test.ts" "src/app/api/cost-tracker/sync/[provider]/route.test.ts"
```
Expected: all tests PASS.

- [ ] **Step 8.2: Check TypeScript across all changed files**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "cost-tracker\|elevenlabs\|credentials\|BudgetAlerts\|Transactions" | head -20
```
Expected: no output.

- [ ] **Step 8.3: Run full test suite to check for regressions**

```bash
npx vitest run 2>&1 | tail -10
```
Expected: all tests pass, none newly failing.

---

## Self-Review Checklist

- ✅ ElevenLabs char fix: `from - to` with `Math.max(0, ...)` guard — covered Task 1
- ✅ ElevenLabs pagination: loop with `last_history_item_id` — covered Task 1
- ✅ ElevenLabs Test button: `validateSupported: true` + validate route update — covered Task 2
- ✅ Credential PATCH: label + key update, re-encrypt, keyType re-detect — covered Task 3
- ✅ `updateCredential` hook — covered Task 4
- ✅ Edit modal in Credentials.tsx — covered Task 5
- ✅ `onEdit` prop wired in page.tsx — covered Task 5
- ✅ One-Time Charge card in Transactions — covered Task 6
- ✅ `onAddTransaction` prop wired in page.tsx — covered Task 6
- ✅ Budget Settings card — covered Task 7
- ✅ `onUpdateBudget` prop wired in page.tsx — covered Task 7
- ✅ All new route handlers check authentication (401) + ownership (404)
- ✅ Test file for PATCH replaces (not appends to) the existing DELETE test file — the plan shows the complete test file in Task 3 to avoid duplication
