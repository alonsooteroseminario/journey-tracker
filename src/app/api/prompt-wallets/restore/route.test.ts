import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const created = new Date("2024-01-01T00:00:00.000Z");

describe("POST /api/prompt-wallets/restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({ title: "R", groups: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when title missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({ groups: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when groups is not an array", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({ title: "R", groups: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid wallet lockLevel", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({
        title: "R",
        lockLevel: "invalid",
        groups: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when chunk missing content", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({
        title: "R",
        groups: [{ title: "G", chunks: [{ title: "C" }] }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates wallet tree from snapshot", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue(null);
    const wallet = {
      id: "w-new",
      userId: "u1",
      title: "Restored",
      icon: null,
      description: null,
      order: 0,
      lockLevel: "soft" as string | null,
      createdAt: created,
      updatedAt: created,
      groups: [
        {
          id: "g1",
          walletId: "w-new",
          title: "G",
          description: null,
          order: 0,
          lockLevel: null,
          createdAt: created,
          updatedAt: created,
          chunks: [
            {
              id: "c1",
              groupId: "g1",
              title: "C",
              content: "x",
              order: 0,
              lockLevel: null,
              createdAt: created,
              updatedAt: created,
            },
          ],
        },
      ],
    };
    vi.mocked(prisma.promptWallet.create).mockResolvedValue(wallet as never);
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({
        title: "Restored",
        lockLevel: "soft",
        groups: [
          {
            title: "G",
            chunks: [{ title: "C", content: "x", lockLevel: null }],
          },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe("Restored");
    expect(j.lockLevel).toBe("soft");
    expect(prisma.promptWallet.create).toHaveBeenCalled();
  });

  it("returns 500 on create failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.promptWallet.create).mockRejectedValue(new Error("db"));
    const req = new NextRequest("http://localhost/api/prompt-wallets/restore", {
      method: "POST",
      body: JSON.stringify({ title: "R", groups: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
