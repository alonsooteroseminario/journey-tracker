import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/mcp/server", () => ({ getMCPServer: vi.fn() }));
vi.mock("@/app/api/mcp/_handler", () => ({ handleMcpCall: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";
import { handleMcpCall } from "@/app/api/mcp/_handler";
import { GET, POST } from "./route";

const TOOL_DEF = {
  name: "get-goals",
  description: "Get all goals",
  input_schema: { type: "object", properties: {} },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", clerkId: "c1" } as never);
  vi.mocked(getMCPServer).mockReturnValue({
    getTools: vi.fn().mockReturnValue([TOOL_DEF]),
  } as never);
  vi.mocked(handleMcpCall).mockResolvedValue(
    new Response(JSON.stringify({ result: [] }), { status: 200 }),
  );
});

const PARAMS = { params: Promise.resolve({ name: "get-goals" }) };

describe("GET /api/mcp/tools/[name]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null as never);
    const res = await GET(new NextRequest("http://localhost"), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown tool name", async () => {
    vi.mocked(getMCPServer).mockReturnValue({
      getTools: vi.fn().mockReturnValue([]),
    } as never);
    const res = await GET(new NextRequest("http://localhost"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns the tool definition for a known tool", async () => {
    const res = await GET(new NextRequest("http://localhost"), PARAMS);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("get-goals");
  });
});

describe("POST /api/mcp/tools/[name]", () => {
  it("delegates to handleMcpCall with kind=tool", async () => {
    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
      headers: { "content-type": "application/json" },
    });
    await POST(req, PARAMS);
    expect(handleMcpCall).toHaveBeenCalledWith("tool", "get-goals", { title: "Test" });
  });

  it("passes empty object when no body", async () => {
    const req = new NextRequest("http://localhost", { method: "POST" });
    await POST(req, PARAMS);
    expect(handleMcpCall).toHaveBeenCalledWith("tool", "get-goals", {});
  });
});
