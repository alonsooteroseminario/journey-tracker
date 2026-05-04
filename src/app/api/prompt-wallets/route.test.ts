import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

describe("GET /api/prompt-wallets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(prisma.promptWallet.findMany).not.toHaveBeenCalled();
  });

  it("returns empty list", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns serialized wallets with nested groups and chunks", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const created = new Date("2024-01-01T00:00:00.000Z");
    vi.mocked(prisma.promptWallet.findMany).mockResolvedValue([
      {
        id: "w1",
        userId: "u1",
        title: "Main",
        icon: "🧠",
        description: null,
        order: 0,
        lockLevel: "soft",
        createdAt: created,
        updatedAt: created,
        groups: [
          {
            id: "g1",
            walletId: "w1",
            title: "G1",
            description: null,
            order: 0,
            lockLevel: null,
            createdAt: created,
            updatedAt: created,
            chunks: [
              {
                id: "c1",
                groupId: "g1",
                title: "C1",
                content: "hello",
                order: 0,
                lockLevel: null,
                createdAt: created,
                updatedAt: created,
              },
            ],
          },
        ],
      } as never,
    ]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("w1");
    expect(data[0].lockLevel).toBe("soft");
    expect(data[0].groups[0].chunks[0].content).toBe("hello");
    expect(data[0].createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(prisma.promptWallet.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { order: "asc" },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: { chunks: { orderBy: { order: "asc" } } },
        },
      },
    });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findMany).mockRejectedValue(new Error("db"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});

describe("POST /api/prompt-wallets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({ title: "A" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(prisma.promptWallet.create).not.toHaveBeenCalled();
  });

  it("returns 400 when title missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toContain("Title");
  });

  it("returns 400 when title too long", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({ title: "x".repeat(201) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when description invalid type", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({ title: "OK", description: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates wallet with next order", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue({ order: 2 } as never);
    const created = new Date("2024-01-01T00:00:00.000Z");
    vi.mocked(prisma.promptWallet.create).mockResolvedValue({
      id: "w-new",
      userId: "u1",
      title: "My Wallet",
      icon: null,
      description: null,
      order: 3,
      lockLevel: null,
      createdAt: created,
      updatedAt: created,
      groups: [],
    } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({ title: "  My Wallet  " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.id).toBe("w-new");
    expect(j.title).toBe("My Wallet");
    expect(prisma.promptWallet.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        title: "My Wallet",
        icon: null,
        description: null,
        order: 3,
        lockLevel: null,
      },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: { chunks: { orderBy: { order: "asc" } } },
        },
      },
    });
  });

  it("returns 500 on create failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptWallet.create).mockRejectedValue(new Error("fail"));
    const req = new NextRequest("http://localhost/api/prompt-wallets", {
      method: "POST",
      body: JSON.stringify({ title: "A" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
