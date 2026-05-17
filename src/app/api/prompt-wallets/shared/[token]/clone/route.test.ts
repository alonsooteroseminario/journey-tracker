import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptWallet: { findUnique: vi.fn(), create: vi.fn() },
    promptGroup: { create: vi.fn() },
    promptChunk: { create: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const mockGetUser = vi.mocked(getCurrentUser);
const mockFindWallet = vi.mocked(prisma.promptWallet.findUnique);
const mockCreateWallet = vi.mocked(prisma.promptWallet.create);
const mockCreateGroup = vi.mocked(prisma.promptGroup.create);
const mockCreateChunk = vi.mocked(prisma.promptChunk.create);

const SOURCE_WALLET = {
  id: "src-1",
  userId: "owner-1",
  title: "Source Wallet",
  icon: "💼",
  description: "desc",
  shareToken: "tok-xyz",
  sharedAt: new Date(),
  groups: [
    {
      id: "grp-1",
      title: "Group A",
      description: null,
      order: 0,
      chunks: [
        { id: "chk-1", title: "Chunk 1", content: "prompt", order: 0, lockLevel: "full" },
      ],
    },
  ],
};

function makeReq(token: string) {
  return new NextRequest(`http://localhost/api/prompt-wallets/shared/${token}/clone`, {
    method: "POST",
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/prompt-wallets/shared/[token]/clone", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await POST(makeReq("tok-xyz"), { params: Promise.resolve({ token: "tok-xyz" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when token is invalid", async () => {
    mockGetUser.mockResolvedValue({ id: "viewer-1" } as never);
    mockFindWallet.mockResolvedValue(null);
    const res = await POST(makeReq("bad"), { params: Promise.resolve({ token: "bad" }) });
    expect(res.status).toBe(404);
  });

  it("creates a cloned wallet for the viewer and returns its id", async () => {
    mockGetUser.mockResolvedValue({ id: "viewer-1" } as never);
    mockFindWallet.mockResolvedValue(SOURCE_WALLET as never);
    mockCreateWallet.mockResolvedValue({ id: "clone-1" } as never);
    mockCreateGroup.mockResolvedValue({ id: "grp-clone-1" } as never);
    mockCreateChunk.mockResolvedValue({ id: "chk-clone-1" } as never);

    const res = await POST(makeReq("tok-xyz"), { params: Promise.resolve({ token: "tok-xyz" }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.walletId).toBe("clone-1");

    // Clone gets a null shareToken (private by default)
    expect(mockCreateWallet).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "viewer-1", shareToken: null }),
      }),
    );
    // Locks are reset on clone
    expect(mockCreateChunk).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockLevel: null }),
      }),
    );
  });
});
