import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/mcp/server", () => ({ getMCPServer: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { getMCPServer } from "@/lib/mcp/server";
import { GET } from "./route";

vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", clerkId: "c1" } as never);
vi.mocked(getMCPServer).mockReturnValue({
  getTools: vi.fn().mockReturnValue([
    { name: "get-goals", description: "Get goals", input_schema: { type: "object", properties: {} } },
    { name: "create-goal", description: "Create goal", input_schema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } },
  ]),
} as never);

describe("GET /api/mcp/tools", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the tool list with name, description, input_schema", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tools).toHaveLength(2);
    expect(body.tools[0].name).toBe("get-goals");
    expect(body.tools[0]).toHaveProperty("input_schema");
  });

  it("includes a count field", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.count).toBe(2);
  });
});
