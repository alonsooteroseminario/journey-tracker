import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/mcp/server", () => ({ getMCPServer: vi.fn() }));
vi.mock("@/lib/agent/security", () => ({
  securityGuard: { checkRateLimit: vi.fn().mockReturnValue(true) },
}));

import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";
import { securityGuard } from "@/lib/agent/security";
import { handleMcpCall } from "./_handler";

const mockGetUser = vi.mocked(getCurrentUser);
const mockGetServer = vi.mocked(getMCPServer);
const mockRateLimit = vi.mocked(securityGuard.checkRateLimit);

const MOCK_USER = { id: "user-1", clerkId: "clerk-1" } as never;

function makeServer(overrides: object = {}) {
  return {
    getTools: vi.fn().mockReturnValue([
      {
        name: "get-goals",
        description: "Get all goals",
        input_schema: { type: "object", properties: {}, required: [] },
      },
    ]),
    getSkills: vi.fn().mockReturnValue([
      {
        name: "goal-summary",
        description: "Summarise goals",
        execute: vi.fn(),
      },
    ]),
    hasTool: vi.fn().mockReturnValue(true),
    getToolExecutor: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ success: true, data: [] })),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(MOCK_USER);
  mockRateLimit.mockReturnValue(true);
  mockGetServer.mockReturnValue(makeServer() as never);
});

describe("handleMcpCall", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null as never);
    const res = await handleMcpCall("tool", "get-goals", {});
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockReturnValue(false);
    const res = await handleMcpCall("tool", "get-goals", {});
    expect(res.status).toBe(429);
  });

  it("returns 404 when tool does not exist", async () => {
    mockGetServer.mockReturnValue(
      makeServer({ hasTool: vi.fn().mockReturnValue(false) }) as never,
    );
    const res = await handleMcpCall("tool", "nonexistent", {});
    expect(res.status).toBe(404);
  });

  it("returns 400 when args fail schema validation", async () => {
    mockGetServer.mockReturnValue(
      makeServer({
        getTools: vi.fn().mockReturnValue([
          {
            name: "create-goal",
            description: "Create goal",
            input_schema: {
              type: "object",
              properties: { title: { type: "string" } },
              required: ["title"],
            },
          },
        ]),
        hasTool: vi.fn().mockReturnValue(true),
        getToolExecutor: vi.fn(),
      }) as never,
    );
    // Missing required "title"
    const res = await handleMcpCall("tool", "create-goal", {});
    expect(res.status).toBe(400);
  });

  it("returns 200 with result on success", async () => {
    const res = await handleMcpCall("tool", "get-goals", {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("result");
  });

  it("returns 500 when executor throws", async () => {
    mockGetServer.mockReturnValue(
      makeServer({
        getToolExecutor: vi
          .fn()
          .mockReturnValue(vi.fn().mockRejectedValue(new Error("boom"))),
      }) as never,
    );
    const res = await handleMcpCall("tool", "get-goals", {});
    expect(res.status).toBe(500);
  });
});
