import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    costTransaction: {
      create: vi.fn(),
    },
  },
}));

import { logAnthropicUsage } from "./anthropic";
import { prisma } from "@/lib/prisma";

const mockUser = { id: "user-prisma-id-123" };

describe("logAnthropicUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.costTransaction.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("creates a transaction with the correct amount for claude-sonnet-4-6", async () => {
    await logAnthropicUsage({
      clerkId: "clerk-123",
      model: "claude-sonnet-4-6",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      date: new Date("2026-01-01"),
    });

    expect(prisma.costTransaction.create).toHaveBeenCalledOnce();
    const call = (prisma.costTransaction.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // $3 input + $15 output = $18
    expect(call.data.amount).toBe(18);
    expect(call.data.category).toBe("anthropic");
    expect(call.data.source).toBe("auto-anthropic");
    expect(call.data.userId).toBe(mockUser.id);
  });

  it("creates a transaction with the correct amount for claude-opus-4-6", async () => {
    await logAnthropicUsage({
      clerkId: "clerk-123",
      model: "claude-opus-4-6",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      date: new Date("2026-01-01"),
    });

    const call = (prisma.costTransaction.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // $15 input + $75 output = $90
    expect(call.data.amount).toBe(90);
  });

  it("falls back to default price for unknown model", async () => {
    await logAnthropicUsage({
      clerkId: "clerk-123",
      model: "claude-unknown-model",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      date: new Date(),
    });

    const call = (prisma.costTransaction.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // default: $3 + $15 = $18
    expect(call.data.amount).toBe(18);
  });

  it("skips when user is not found", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await logAnthropicUsage({
      clerkId: "unknown-clerk",
      model: "claude-sonnet-4-6",
      inputTokens: 1000,
      outputTokens: 1000,
      date: new Date(),
    });

    expect(prisma.costTransaction.create).not.toHaveBeenCalled();
  });

  it("skips when token counts are zero", async () => {
    await logAnthropicUsage({
      clerkId: "clerk-123",
      model: "claude-sonnet-4-6",
      inputTokens: 0,
      outputTokens: 0,
      date: new Date(),
    });

    expect(prisma.costTransaction.create).not.toHaveBeenCalled();
  });

  it("stores model and token counts in metadata", async () => {
    await logAnthropicUsage({
      clerkId: "clerk-123",
      model: "claude-sonnet-4-6",
      inputTokens: 500,
      outputTokens: 250,
      date: new Date(),
    });

    const call = (prisma.costTransaction.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.data.metadata).toEqual({
      model: "claude-sonnet-4-6",
      inputTokens: 500,
      outputTokens: 250,
    });
  });
});
