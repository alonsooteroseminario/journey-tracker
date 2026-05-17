import { test, expect } from "@playwright/test";

/**
 * F4 — Wallet sharing: API auth guards + page smoke.
 * Unit tests in route.test.ts verify 404 for unknown token — here we
 * just confirm endpoints respond without 500s.
 */
test("F4 — Wallet sharing endpoints are reachable without 500 errors", async ({
  request,
  page,
}) => {
  // 1. Mutation endpoints: must not return 500
  const [sharePost, shareDel, clonePost] = await Promise.all([
    request.post("/api/prompt-wallets/fake-id/share", { failOnStatusCode: false }),
    request.delete("/api/prompt-wallets/fake-id/share", { failOnStatusCode: false }),
    request.post("/api/prompt-wallets/shared/any-token/clone", { failOnStatusCode: false }),
  ]);
  expect(sharePost.status()).toBeLessThan(500);
  expect(shareDel.status()).toBeLessThan(500);
  expect(clonePost.status()).toBeLessThan(500);

  // 2. Public read: must not return 500 (404 confirmed by unit tests)
  const readRes = await request.get(
    "/api/prompt-wallets/shared/completely-nonexistent-xyz9999",
    { failOnStatusCode: false },
  );
  expect(readRes.status()).toBeLessThan(500);

  // 3. Share page: unknown token renders a page (not a 500)
  await page.goto("/wallet/share/completely-nonexistent-xyz9999");
  await page.waitForLoadState("domcontentloaded");
  const title = await page.title();
  expect(title.toLowerCase()).not.toContain("500");
  expect(title.toLowerCase()).not.toContain("server error");
});
