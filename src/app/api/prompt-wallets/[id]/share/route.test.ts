import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptWallet: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prompts/shareToken", () => ({
  generateShareToken: vi.fn().mockReturnValue("tok-abc123"),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST, DELETE } from "./route";

const mockGetUser = vi.mocked(getCurrentUser);
const mockFindFirst = vi.mocked(prisma.promptWallet.findFirst);
const mockUpdate = vi.mocked(prisma.promptWallet.update);

const USER = { id: "user-1" } as never;
const WALLET = { id: "wallet-1", userId: "user-1", title: "Test", shareToken: null };

function makeReq(id: string) {
  return new NextRequest(`http://localhost/api/prompt-wallets/${id}/share`, {
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(USER);
});

describe("POST /api/prompt-wallets/[id]/share", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await POST(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when wallet not found or not owned", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(404);
  });

  it("mints a shareToken and returns the share URL on success", async () => {
    mockFindFirst.mockResolvedValue(WALLET as never);
    mockUpdate.mockResolvedValue({ ...WALLET, shareToken: "tok-abc123", sharedAt: new Date() } as never);

    const res = await POST(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shareToken).toBe("tok-abc123");
    expect(body.shareUrl).toContain("/wallet/share/tok-abc123");
  });

  it("re-uses existing shareToken if wallet already shared", async () => {
    const shared = { ...WALLET, shareToken: "existing-tok" };
    mockFindFirst.mockResolvedValue(shared as never);
    // update should NOT be called for re-use
    const res = await POST(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shareToken).toBe("existing-tok");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/prompt-wallets/[id]/share", () => {
  it("returns 204 and clears shareToken", async () => {
    mockFindFirst.mockResolvedValue({ ...WALLET, shareToken: "tok-abc123" } as never);
    mockUpdate.mockResolvedValue({ ...WALLET, shareToken: null } as never);
    const res = await DELETE(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ shareToken: null }) }),
    );
  });

  it("returns 404 when no wallet or not owned", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await DELETE(makeReq("wallet-1"), { params: Promise.resolve({ id: "wallet-1" }) });
    expect(res.status).toBe(404);
  });
});
