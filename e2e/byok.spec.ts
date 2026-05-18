import { test, expect } from "@playwright/test";

/**
 * F2 — BYOK (Bring Your Own Key) flow.
 * Smoke-tests the settings API routes (no auth required for 401 tests).
 */

test.describe.configure({ mode: "serial" });

test.describe("F2 — Agent API key settings (API smoke tests)", () => {
  test("settings/ai-key API endpoints require authentication (no 200 unauth)", async ({
    request,
  }) => {
    // Verify all three methods are guarded — none should return 200 unauthenticated.
    const [getRes, postRes, deleteRes] = await Promise.all([
      request.get("/api/settings/ai-key"),
      request.post("/api/settings/ai-key", {
        data: { apiKey: "sk-ant-test123456789" },
        failOnStatusCode: false,
      }),
      request.delete("/api/settings/ai-key", { failOnStatusCode: false }),
    ]);
    // Must not be 200 (would mean unauth access succeeded)
    expect(getRes.status()).not.toBe(200);
    expect(postRes.status()).not.toBe(200);
    expect(deleteRes.status()).not.toBe(200);
    // Must not be 500 (server error)
    expect(getRes.status()).toBeLessThan(500);
    expect(postRes.status()).toBeLessThan(500);
    expect(deleteRes.status()).toBeLessThan(500);
  });

  test("/cost-tracker redirects away from itself (to sign-in or settings)", async ({ page }) => {
    await page.goto("/cost-tracker");
    await page.waitForLoadState("domcontentloaded");
    // Unauthenticated: Clerk redirects to sign-in first (before our redirect can run).
    // Authenticated: would land on /settings/ai-key.
    const url = page.url();
    expect(url).not.toContain("/cost-tracker");
  });

  test("/settings/ai-key page loads (redirects to sign-in when unauth)", async ({
    page,
  }) => {
    await page.goto("/settings/ai-key");
    await page.waitForLoadState("domcontentloaded");
    // Either sign-in redirect or the settings page itself
    const url = page.url();
    expect(
      url.includes("/sign-in") || url.includes("/settings/ai-key"),
    ).toBe(true);
  });
});
