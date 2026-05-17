import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptWallet: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockFindWallet = vi.mocked(prisma.promptWallet.findUnique);
const mockFindUser = vi.mocked(prisma.user.findUnique);

function makeReq(token: string) {
  return new NextRequest(`http://localhost/api/prompt-wallets/shared/${token}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/prompt-wallets/shared/[token]", () => {
  it("returns 404 for an unknown token", async () => {
    mockFindWallet.mockResolvedValue(null);
    const res = await GET(makeReq("bad-token"), { params: Promise.resolve({ token: "bad-token" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the wallet token has been revoked (null)", async () => {
    // findUnique by shareToken returns null when token was cleared
    mockFindWallet.mockResolvedValue(null);
    const res = await GET(makeReq("old-token"), { params: Promise.resolve({ token: "old-token" }) });
    expect(res.status).toBe(404);
  });

  it("returns a redacted DTO with wallet data for a valid token", async () => {
    mockFindWallet.mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      title: "My Wallet",
      icon: "💼",
      description: "desc",
      shareToken: "tok-abc",
      sharedAt: new Date("2026-01-01"),
      groups: [
        {
          id: "group-1",
          title: "Group A",
          description: null,
          chunks: [{ id: "chunk-1", title: "Chunk 1", content: "prompt here", order: 0 }],
        },
      ],
    } as never);
    mockFindUser.mockResolvedValue({ name: "Alice" } as never);

    const res = await GET(makeReq("tok-abc"), { params: Promise.resolve({ token: "tok-abc" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet.title).toBe("My Wallet");
    expect(body.wallet.id).toBe("wallet-1");
    // userId must NOT be in the response
    expect(body.wallet.userId).toBeUndefined();
    // shareToken must NOT be in the response
    expect(body.wallet.shareToken).toBeUndefined();
    expect(body.ownerName).toBe("Alice");
    expect(body.wallet.groups).toHaveLength(1);
    expect(body.wallet.groups[0].chunks[0].content).toBe("prompt here");
  });
});
