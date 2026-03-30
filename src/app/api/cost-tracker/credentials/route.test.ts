import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/credentials/encrypt", () => ({
  encryptKey: vi.fn(() => ({ encryptedKey: "enc", iv: "iv" })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lLMCredential: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from "./route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockUser = { id: "aaaaaaaaaaaaaaaaaaaaaaaa" };

function makePostReq(body: unknown) {
  return new NextRequest("http://localhost/api/cost-tracker/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/cost-tracker/credentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns credential list with masked keys", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "cred-1",
        provider: "anthropic",
        label: "Work",
        keyType: "standard",
        maskedKey: "••••••••abcd",
        lastSyncedAt: null,
      },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].maskedKey).toBe("••••••••abcd");
    expect(body[0].keyType).toBe("standard");
  });
});

describe("POST /api/cost-tracker/credentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-test1234", label: "Work" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid provider", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const res = await POST(makePostReq({ provider: "openai", apiKey: "sk-test12345678", label: "Work" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/provider/i);
  });

  it("returns 400 for apiKey too short", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "short", label: "Work" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/apiKey/i);
  });

  it("returns 400 for invalid label", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-validkey", label: "!@#invalid" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/label/i);
  });

  it("creates credential and returns 201 with masked last-4 chars", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "cred-new",
      provider: "anthropic",
      label: "Work",
      keyType: "standard",
      maskedKey: "••••••••••••5678",
    });
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-abcd5678", label: "Work" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("cred-new");
    // "sk-ant-api03-abcd5678" is 22 chars → min(18, 12) = 12 bullets + last 4 = "••••••••••••5678"
    expect(body.maskedKey).toBe("••••••••••••5678");
  });

  it("returns 409 on duplicate label+provider (P2002)", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockRejectedValue({ code: "P2002" });
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-abcd5678", label: "Work" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it("detects admin key type from prefix", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    let capturedData: Record<string, unknown> = {};
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      capturedData = data;
      return Promise.resolve({ id: "cred-admin", ...data, maskedKey: "••••••••1234" });
    });
    await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-admin-abcd1234", label: "Admin" }));
    expect(capturedData.keyType).toBe("admin");
  });

  it("detects standard key type from prefix", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    let capturedData: Record<string, unknown> = {};
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      capturedData = data;
      return Promise.resolve({ id: "cred-std", ...data, maskedKey: "••••••••5678" });
    });
    await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-abcd5678", label: "Std" }));
    expect(capturedData.keyType).toBe("standard");
  });

  it("sets keyType null for non-anthropic providers", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    let capturedData: Record<string, unknown> = {};
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      capturedData = data;
      return Promise.resolve({ id: "cred-el", ...data, maskedKey: "••••••••abcd" });
    });
    await POST(makePostReq({ provider: "elevenlabs", apiKey: "sk_longerthaneight1234", label: "EL" }));
    expect(capturedData.keyType).toBeNull();
  });

  it("maskedKey shows last 4 chars of key", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.lLMCredential.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "cred-mask", ...data })
    );
    const res = await POST(makePostReq({ provider: "anthropic", apiKey: "sk-ant-api03-abcdZYXW", label: "Mask" }));
    const body = await res.json();
    expect(body.maskedKey).toMatch(/ZYXW$/);
  });
});
