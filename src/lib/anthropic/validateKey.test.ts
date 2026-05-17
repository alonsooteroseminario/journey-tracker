import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAnthropicKey } from "./validateKey";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateAnthropicKey", () => {
  it("returns valid:true for a good key (200 response)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "msg_xxx", type: "message" }),
    });

    const result = await validateAnthropicKey("sk-ant-valid");

    expect(result).toEqual({ valid: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "sk-ant-valid",
          "anthropic-version": "2023-06-01",
        }),
      }),
    );
  });

  it("returns valid:false for a 401 response (bad key)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { type: "authentication_error" } }),
    });

    const result = await validateAnthropicKey("sk-ant-bad");

    expect(result).toEqual({ valid: false, reason: "invalid_key" });
  });

  it("returns valid:false with rate_limited reason on 429", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const result = await validateAnthropicKey("sk-ant-valid-but-limited");

    expect(result).toEqual({ valid: false, reason: "rate_limited" });
  });

  it("returns valid:false with network_error on fetch throw", async () => {
    mockFetch.mockRejectedValue(new Error("network unreachable"));

    const result = await validateAnthropicKey("sk-ant-valid");

    expect(result).toEqual({ valid: false, reason: "network_error" });
  });
});
