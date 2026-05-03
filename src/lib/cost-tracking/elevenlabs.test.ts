import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    costTransaction: {
      findMany: vi.fn(() => Promise.resolve([])),
      createMany: vi.fn(() => Promise.resolve({ count: 1 })),
    },
  },
}));

// Helper to make a mock fetch response
function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

import { syncElevenLabsUsage } from "./elevenlabs";

describe("syncElevenLabsUsage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates cost using from - to (not abs(from))", async () => {
    const item = {
      history_item_id: "h1",
      voice_id: "v1",
      model_id: "m1",
      text: "hello",
      date_unix: 1700000000,
      character_count_change_from: 50000, // quota before
      character_count_change_to: 49500,   // quota after → 500 chars used
    };
    global.fetch = mockFetch({ history: [item], has_more: false });

    const { prisma } = await import("@/lib/prisma");
    let capturedData: unknown[] = [];
    (prisma.costTransaction.createMany as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: unknown[] }) => { capturedData = data; return Promise.resolve({ count: 1 }); }
    );

    await syncElevenLabsUsage({ userId: "u1", apiKey: "sk_test", credentialId: "c1" });

    expect(capturedData).toHaveLength(1);
    const tx = capturedData[0] as { amount: number };
    // 500 chars * $0.0003 = $0.15
    expect(tx.amount).toBeCloseTo(0.15, 4);
  });

  it("fetches next page when has_more is true", async () => {
    const item = (id: string) => ({
      history_item_id: id,
      voice_id: "v1",
      model_id: "m1",
      text: "hi",
      date_unix: 1700000000,
      character_count_change_from: 1000,
      character_count_change_to: 900,
    });

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        text: () => Promise.resolve(JSON.stringify({
          history: [item("h1")],
          has_more: true,
          last_history_item_id: "h1",
        })),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        text: () => Promise.resolve(JSON.stringify({
          history: [item("h2")],
          has_more: false,
          last_history_item_id: "h2",
        })),
      });

    const { prisma } = await import("@/lib/prisma");
    let capturedData: unknown[] = [];
    (prisma.costTransaction.createMany as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: unknown[] }) => { capturedData = data; return Promise.resolve({ count: data.length }); }
    );

    await syncElevenLabsUsage({ userId: "u1", apiKey: "sk_test", credentialId: "c1" });

    // Second fetch should use start_after_history_item_id=h1
    const secondCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(secondCall[0]).toContain("start_after_history_item_id=h1");
    expect(capturedData).toHaveLength(2);
  });
});
