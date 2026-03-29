import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    costTransaction: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { DELETE } from "./route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockUser = { id: "user-abc" };
const otherUser = { id: "user-xyz" };
const mockTransaction = { id: "txn-1", userId: "user-abc", amount: 5 };

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/cost-tracker/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.costTransaction.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("returns 401 when not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/cost-tracker/transactions/txn-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("txn-1"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when transaction does not exist", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.costTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/cost-tracker/transactions/txn-missing", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("txn-missing"));

    expect(res.status).toBe(404);
    expect(prisma.costTransaction.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when transaction belongs to another user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(otherUser);
    (prisma.costTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransaction);

    const req = new NextRequest("http://localhost/api/cost-tracker/transactions/txn-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("txn-1"));

    expect(res.status).toBe(403);
    expect(prisma.costTransaction.delete).not.toHaveBeenCalled();
  });

  it("deletes and returns 200 when owner calls it", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.costTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransaction);

    const req = new NextRequest("http://localhost/api/cost-tracker/transactions/txn-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams("txn-1"));

    expect(res.status).toBe(200);
    expect(prisma.costTransaction.delete).toHaveBeenCalledWith({ where: { id: "txn-1" } });
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
