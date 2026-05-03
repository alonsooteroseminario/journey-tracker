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
