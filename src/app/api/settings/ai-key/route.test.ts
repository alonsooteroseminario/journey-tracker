import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    lLMCredential: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/credentials/encrypt", () => ({
  encryptKey: vi.fn(),
}));
vi.mock("@/lib/anthropic/validateKey", () => ({
  validateAnthropicKey: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/credentials/encrypt";
import { validateAnthropicKey } from "@/lib/anthropic/validateKey";
import { GET, POST, DELETE } from "./route";

const mockGetUser = vi.mocked(getCurrentUser);
const mockFindFirst = vi.mocked(prisma.lLMCredential.findFirst);
const mockCreate = vi.mocked(prisma.lLMCredential.create);
const mockDelete = vi.mocked(prisma.lLMCredential.delete);
const mockEncrypt = vi.mocked(encryptKey);
const mockValidate = vi.mocked(validateAnthropicKey);

const MOCK_USER = { id: "user-1", clerkId: "clerk-1", email: "a@b.com", name: "A" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(MOCK_USER as never);
});

// ── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/settings/ai-key", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns hasKey:false when no credential stored", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.hasKey).toBe(false);
    expect(body.maskedKey).toBeNull();
  });

  it("returns hasKey:true with maskedKey when credential exists", async () => {
    mockFindFirst.mockResolvedValue({
      id: "cred-1",
      maskedKey: "••••XYZ",
      lastSyncedAt: new Date("2026-01-01"),
    } as never);
    const res = await GET();
    const body = await res.json();
    expect(body.hasKey).toBe(true);
    expect(body.maskedKey).toBe("••••XYZ");
    expect(body.lastValidated).toBeTruthy();
  });
});

// ── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/settings/ai-key", () => {
  function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/settings/ai-key", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await POST(makeReq({ apiKey: "sk-ant-xxx" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing apiKey", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for apiKey shorter than 8 chars", async () => {
    const res = await POST(makeReq({ apiKey: "short" }));
    expect(res.status).toBe(400);
  });

  it("returns 422 when Anthropic rejects the key", async () => {
    mockValidate.mockResolvedValue({ valid: false, reason: "invalid_key" });
    const res = await POST(makeReq({ apiKey: "sk-ant-badkey1234" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("invalid");
  });

  it("saves new credential and returns 201 on success", async () => {
    mockValidate.mockResolvedValue({ valid: true });
    mockEncrypt.mockReturnValue({ encryptedKey: "enc", iv: "iv" });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "cred-new", maskedKey: "••••NEW" } as never);

    const res = await POST(makeReq({ apiKey: "sk-ant-validkey0123" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.maskedKey).toBe("••••NEW");
  });

  it("replaces existing credential on POST (upsert)", async () => {
    mockValidate.mockResolvedValue({ valid: true });
    mockEncrypt.mockReturnValue({ encryptedKey: "enc", iv: "iv" });
    mockFindFirst.mockResolvedValue({ id: "old-cred" } as never);
    mockDelete.mockResolvedValue({} as never);
    mockCreate.mockResolvedValue({ id: "cred-new", maskedKey: "••••NEW" } as never);

    const res = await POST(makeReq({ apiKey: "sk-ant-validkey0123" }));
    expect(res.status).toBe(201);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "old-cred" } });
  });
});

// ── DELETE ───────────────────────────────────────────────────────────────────

describe("DELETE /api/settings/ai-key", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("returns 404 when no credential to delete", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(404);
  });

  it("deletes the credential and returns 204", async () => {
    mockFindFirst.mockResolvedValue({ id: "cred-1" } as never);
    mockDelete.mockResolvedValue({} as never);
    const res = await DELETE();
    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "cred-1" } });
  });
});
