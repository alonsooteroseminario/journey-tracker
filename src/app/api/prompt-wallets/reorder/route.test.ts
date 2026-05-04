import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

describe("POST /api/prompt-wallets/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: ["w1"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when orderedIds is not an array", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: "w1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("succeeds when user has no wallets and orderedIds is empty", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([]);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns 400 when orderedIds length mismatches owned wallets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([
      { id: "w1" } as never,
      { id: "w2" } as never,
    ]);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: ["w1"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when orderedIds contains unknown id", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([{ id: "w1" } as never]);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: ["w2"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 on duplicate ids in orderedIds", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([
      { id: "w1" } as never,
      { id: "w2" } as never,
    ]);
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: ["w1", "w1"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("runs transaction to set order indices", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([
      { id: "w1" } as never,
      { id: "w2" } as never,
    ]);
    vi.mocked(prisma.promptWallet.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return undefined;
    });
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: ["w2", "w1"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.promptWallet.update).toHaveBeenCalledWith({
      where: { id: "w2" },
      data: { order: 0 },
    });
    expect(prisma.promptWallet.update).toHaveBeenCalledWith({
      where: { id: "w1" },
      data: { order: 1 },
    });
  });

  it("returns 500 on failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockRejectedValue(new Error("db"));
    const req = new NextRequest("http://localhost/api/prompt-wallets/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
