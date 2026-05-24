import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@anthropic-ai/sdk");
vi.mock("@/lib/agent/getUserAgentKey", () => ({
  getUserAgentKey: vi.fn(),
}));
vi.mock("@/lib/cost-tracking/anthropic", () => ({
  logAnthropicUsage: vi.fn().mockResolvedValue(undefined),
}));

import { generateAiContext } from "./generateAiContext";
import { getUserAgentKey } from "@/lib/agent/getUserAgentKey";
import { logAnthropicUsage } from "@/lib/cost-tracking/anthropic";
import Anthropic from "@anthropic-ai/sdk";

const mockCreate = vi.fn();

describe("generateAiContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Anthropic).mockImplementation(
      function () {
        return { messages: { create: mockCreate } };
      } as unknown as typeof Anthropic,
    );
    vi.mocked(logAnthropicUsage).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when user has no BYOK key", async () => {
    vi.mocked(getUserAgentKey).mockResolvedValue(null);

    const result = await generateAiContext("clerk_123", "Write a summary.");

    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns trimmed AI paragraph on successful API call", async () => {
    vi.mocked(getUserAgentKey).mockResolvedValue("sk-ant-test-key");
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "  You're crushing Learn Spanish this week.  " }],
      usage: { input_tokens: 50, output_tokens: 20 },
    });

    const result = await generateAiContext("clerk_123", "Write a summary.");

    expect(result).toBe("You're crushing Learn Spanish this week.");
  });

  it("returns null when Anthropic throws", async () => {
    vi.mocked(getUserAgentKey).mockResolvedValue("sk-ant-test-key");
    mockCreate.mockRejectedValue(new Error("API error"));

    const result = await generateAiContext("clerk_123", "Write a summary.");

    expect(result).toBeNull();
  });

  it("returns null when the 5-second timeout fires", async () => {
    vi.useFakeTimers();
    vi.mocked(getUserAgentKey).mockResolvedValue("sk-ant-test-key");

    let rejectFn!: (err: Error) => void;
    mockCreate.mockReturnValue(
      new Promise<never>((_, reject) => {
        rejectFn = reject;
      }),
    );

    const resultPromise = generateAiContext("clerk_123", "Write a summary.");
    vi.advanceTimersByTime(5001);
    rejectFn(Object.assign(new Error("aborted"), { name: "AbortError" }));

    const result = await resultPromise;
    expect(result).toBeNull();
  });

  it("logs cost transaction on successful call", async () => {
    vi.mocked(getUserAgentKey).mockResolvedValue("sk-ant-test-key");
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Great progress!" }],
      usage: { input_tokens: 40, output_tokens: 15 },
    });

    await generateAiContext("clerk_xyz", "Write a summary.");

    await vi.waitFor(() => {
      expect(vi.mocked(logAnthropicUsage)).toHaveBeenCalledWith({
        clerkId: "clerk_xyz",
        model: "claude-haiku-4-5-20251001",
        inputTokens: 40,
        outputTokens: 15,
        date: expect.any(Date),
      });
    });
  });
});
