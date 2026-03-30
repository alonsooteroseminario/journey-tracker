import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/credentials/encrypt", () => ({
  decryptKey: vi.fn(() => "decrypted-api-key"),
}));

vi.mock("@/lib/cost-tracking/elevenlabs", () => ({
  syncElevenLabsUsage: vi.fn(),
}));

vi.mock("@/lib/cost-tracking/anthropic-admin", () => ({
  syncAnthropicAdminUsage: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lLMCredential: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncElevenLabsUsage } from "@/lib/cost-tracking/elevenlabs";
import { syncAnthropicAdminUsage } from "@/lib/cost-tracking/anthropic-admin";

const VALID_CRED_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const mockUser = { id: "bbbbbbbbbbbbbbbbbbbbbbbb" };
const otherUser = { id: "cccccccccccccccccccccccc" };

function makeReq(provider: string, body: unknown) {
  return {
    req: new NextRequest(`http://localhost/api/cost-tracker/sync/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: { params: Promise.resolve({ provider }) },
  };
}

const elevenLabsCredential = {
  id: VALID_CRED_ID,
  userId: mockUser.id,
  provider: "elevenlabs",
  keyType: null,
  encryptedKey: "enc",
  iv: "iv",
};

const anthropicAdminCredential = {
  id: VALID_CRED_ID,
  userId: mockUser.id,
  provider: "anthropic",
  keyType: "admin",
  encryptedKey: "enc",
  iv: "iv",
};

const anthropicStandardCredential = {
  ...anthropicAdminCredential,
  keyType: "standard",
};

describe("POST /api/cost-tracker/sync/[provider]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.lLMCredential.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { req, params } = makeReq("elevenlabs", { credentialId: VALID_CRED_ID });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it("returns 400 for unsupported provider", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makeReq("openai", { credentialId: VALID_CRED_ID });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it("returns 400 when credentialId is missing", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makeReq("elevenlabs", {});
    const res = await POST(req, params);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/credentialId/i);
  });

  it("returns 400 when credentialId is not a valid ObjectId", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const { req, params } = makeReq("elevenlabs", { credentialId: "not-an-objectid" });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it("returns 404 when credential not found", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { req, params } = makeReq("elevenlabs", { credentialId: VALID_CRED_ID });
    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });

  it("returns 404 when credential belongs to another user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(otherUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(elevenLabsCredential);
    const { req, params } = makeReq("elevenlabs", { credentialId: VALID_CRED_ID });
    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });

  it("returns 400 when credential provider does not match route provider", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(elevenLabsCredential);
    // credential is elevenlabs but requesting anthropic sync
    const { req, params } = makeReq("anthropic", { credentialId: VALID_CRED_ID });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  describe("ElevenLabs sync", () => {
    it("calls syncElevenLabsUsage and updates lastSyncedAt", async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(elevenLabsCredential);
      (syncElevenLabsUsage as ReturnType<typeof vi.fn>).mockResolvedValue({ synced: 3, total: 3 });

      const { req, params } = makeReq("elevenlabs", { credentialId: VALID_CRED_ID });
      const res = await POST(req, params);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(3);
      // lastSyncedAt update scoped to credentialId
      expect(prisma.lLMCredential.update).toHaveBeenCalledWith({
        where: { id: VALID_CRED_ID },
        data: { lastSyncedAt: expect.any(Date) },
      });
    });
  });

  describe("Anthropic admin sync", () => {
    it("returns 400 when key is not admin type", async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(anthropicStandardCredential);

      const { req, params } = makeReq("anthropic", { credentialId: VALID_CRED_ID });
      const res = await POST(req, params);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/admin/i);
      expect(syncAnthropicAdminUsage).not.toHaveBeenCalled();
    });

    it("calls syncAnthropicAdminUsage and updates lastSyncedAt for admin key", async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.lLMCredential.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(anthropicAdminCredential);
      (syncAnthropicAdminUsage as ReturnType<typeof vi.fn>).mockResolvedValue({ synced: 5, total: 5 });

      const { req, params } = makeReq("anthropic", { credentialId: VALID_CRED_ID });
      const res = await POST(req, params);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.synced).toBe(5);
      expect(prisma.lLMCredential.update).toHaveBeenCalledWith({
        where: { id: VALID_CRED_ID },
        data: { lastSyncedAt: expect.any(Date) },
      });
    });
  });
});
