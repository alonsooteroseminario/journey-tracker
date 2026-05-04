import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertWalletOwnership, OwnershipError } from "@/lib/prompts/ownership";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prompts/ownership", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/prompts/ownership")>();
  return { ...mod, assertWalletOwnership: vi.fn() };
});

const created = new Date("2024-01-01T00:00:00.000Z");
const emptyWallet = {
  id: "w1",
  userId: "u1",
  title: "W",
  icon: null,
  description: null,
  order: 0,
  lockLevel: null,
  createdAt: created,
  updatedAt: created,
  groups: [],
};

describe("PATCH /api/prompt-wallets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertWalletOwnership).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ title: "X" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(401);
    expect(prisma.promptWallet.update).not.toHaveBeenCalled();
  });

  it("returns 404 when ownership fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(assertWalletOwnership).mockRejectedValue(new OwnershipError());
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ title: "New" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when no valid fields", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid lockLevel", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ lockLevel: "nope" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-integer order", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ order: 1.5 }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(400);
  });

  it("updates title and clears lock when none", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.update).mockResolvedValue({
      ...emptyWallet,
      title: "Renamed",
      lockLevel: null,
    } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Renamed", lockLevel: "none" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(200);
    expect(prisma.promptWallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "w1" },
        data: expect.objectContaining({
          title: "Renamed",
          lockLevel: null,
        }),
      })
    );
  });

  it("returns 500 on update error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.update).mockRejectedValue(new Error("db"));
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1", {
      method: "PATCH",
      body: JSON.stringify({ title: "X" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/prompt-wallets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertWalletOwnership).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(401);
    expect(prisma.promptWallet.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when ownership fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(assertWalletOwnership).mockRejectedValue(new OwnershipError());
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(404);
  });

  it("deletes wallet", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.delete).mockResolvedValue({} as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.promptWallet.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
  });

  it("returns 500 on delete error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.delete).mockRejectedValue(new Error("db"));
    const req = new NextRequest("http://localhost/api/prompt-wallets/w1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(500);
  });
});
