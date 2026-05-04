import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertWalletOwnership, OwnershipError } from "@/lib/prompts/ownership";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prompts/ownership", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/prompts/ownership")>();
  return { ...mod, assertWalletOwnership: vi.fn() };
});

const created = new Date("2024-01-01T00:00:00.000Z");

const sourceWallet = {
  id: "w1",
  userId: "u1",
  title: "Original",
  icon: "🧠" as string | null,
  description: null as string | null,
  order: 0,
  lockLevel: null as string | null,
  createdAt: created,
  updatedAt: created,
  groups: [
    {
      id: "g1",
      walletId: "w1",
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
          content: "body",
          order: 0,
          lockLevel: null,
          createdAt: created,
          updatedAt: created,
        },
      ],
    },
  ],
};

describe("POST /api/prompt-wallets/[id]/duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertWalletOwnership).mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/prompt-wallets/w1/duplicate"),
      { params: Promise.resolve({ id: "w1" }) }
    );
    expect(res.status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns 404 when ownership fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(assertWalletOwnership).mockRejectedValue(new OwnershipError());
    const res = await POST(
      new Request("http://localhost/api/prompt-wallets/w1/duplicate"),
      { params: Promise.resolve({ id: "w1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("deep-copies wallet with new title suffix", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const createdWallet = {
      id: "w2",
      userId: "u1",
      title: "Original (copy)",
      icon: "🧠",
      description: null,
      order: 3,
      lockLevel: null,
      createdAt: created,
      updatedAt: created,
      groups: [
        {
          id: "g2",
          walletId: "w2",
          title: "G",
          description: null,
          order: 0,
          lockLevel: null,
          createdAt: created,
          updatedAt: created,
          chunks: [
            {
              id: "c2",
              groupId: "g2",
              title: "C",
              content: "body",
              order: 0,
              lockLevel: null,
              createdAt: created,
              updatedAt: created,
            },
          ],
        },
      ],
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: typeof prisma) => Promise<unknown>)(prisma)
    );
    vi.mocked(prisma.promptWallet.findFirst)
      .mockResolvedValueOnce(sourceWallet as never)
      .mockResolvedValueOnce({ order: 2 } as never);
    vi.mocked(prisma.promptWallet.create).mockResolvedValue(createdWallet as never);

    const res = await POST(
      new Request("http://localhost/api/prompt-wallets/w1/duplicate"),
      { params: Promise.resolve({ id: "w1" }) }
    );
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.title).toBe("Original (copy)");
    expect(j.groups[0].chunks[0].content).toBe("body");
    expect(prisma.promptWallet.create).toHaveBeenCalled();
  });

  it("returns 404 when source missing inside transaction", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      (fn as (tx: typeof prisma) => Promise<unknown>)(prisma)
    );
    vi.mocked(prisma.promptWallet.findFirst).mockResolvedValueOnce(null as never);
    const res = await POST(
      new Request("http://localhost/api/prompt-wallets/w1/duplicate"),
      { params: Promise.resolve({ id: "w1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 on transaction error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("tx fail"));
    const res = await POST(
      new Request("http://localhost/api/prompt-wallets/w1/duplicate"),
      { params: Promise.resolve({ id: "w1" }) }
    );
    expect(res.status).toBe(500);
  });
});
