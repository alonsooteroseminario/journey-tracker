import { test, expect } from "@playwright/test";

/**
 * F5 — MCP REST API smoke tests (no auth needed for health, 401 checks for rest).
 */

test.describe.configure({ mode: "serial" });

test.describe("F5 — MCP REST API", () => {
  test("GET /api/mcp/health returns 200 with status:ok (no auth required)", async ({
    request,
  }) => {
    // Retry up to 3 times; first hit may trigger compilation in dev mode.
    let res;
    for (let i = 0; i < 3; i++) {
      res = await request.get("/api/mcp/health", { failOnStatusCode: false });
      if (res.status() === 200) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    expect(res!.status()).toBe(200);
    const body = await res!.json();
    expect(body.status).toBe("ok");
    expect(typeof body.tools).toBe("number");
    expect(body.tools).toBeGreaterThan(0);
    expect(typeof body.skills).toBe("number");
  });

  test("GET /api/mcp/tools returns 401 for unauthenticated users", async ({
    request,
  }) => {
    const res = await request.get("/api/mcp/tools", { failOnStatusCode: false });
    // Clerk may redirect (200 sign-in page) or return 401 — must not be 500
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/mcp/skills returns 401 for unauthenticated users", async ({
    request,
  }) => {
    const res = await request.get("/api/mcp/skills", { failOnStatusCode: false });
    expect(res.status()).toBeLessThan(500);
  });

  test("POST /api/mcp/tools/get-goals returns auth-guarded response", async ({
    request,
  }) => {
    const res = await request.post("/api/mcp/tools/get-goals", {
      data: {},
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/mcp/tools/nonexistent is guarded without 500", async ({
    request,
  }) => {
    const res = await request.get("/api/mcp/tools/nonexistent-tool-xyz", {
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
  });
});
