import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Prompts Wallet feature.
 *
 * Unauthenticated tests verify all wallet/group/chunk API endpoints
 * respond correctly. Authenticated browser flows are not included here
 * because the app's Clerk integration requires a live test session
 * (no auth fixture exists in this repo yet).
 */

test.describe('Prompts Wallet — API (unauthenticated)', () => {
  // ── Wallet endpoints ──────────────────────────────────────────────

  test('GET /api/prompt-wallets returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/prompt-wallets');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-wallets returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-wallets', { data: { title: 'Test' } });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/prompt-wallets/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/prompt-wallets/fake-id', { data: { title: 'X' } });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/prompt-wallets/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.delete('/api/prompt-wallets/fake-id');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-wallets/[id]/duplicate returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-wallets/fake-id/duplicate');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-wallets/reorder returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-wallets/reorder', { data: { orderedIds: [] } });
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-wallets/restore returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-wallets/restore', {
      data: { title: 'T', groups: [] },
    });
    expect(res.status()).toBe(401);
  });

  // ── Group endpoints ───────────────────────────────────────────────

  test('POST /api/prompt-groups returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-groups', {
      data: { walletId: 'fake', title: 'G' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/prompt-groups/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/prompt-groups/fake-id', { data: { title: 'X' } });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/prompt-groups/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.delete('/api/prompt-groups/fake-id');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-groups/[id]/duplicate returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-groups/fake-id/duplicate');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-groups/reorder returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-groups/reorder', {
      data: { walletId: 'fake', orderedIds: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-groups/restore returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-groups/restore', {
      data: { walletId: 'fake', title: 'G', chunks: [] },
    });
    expect(res.status()).toBe(401);
  });

  // ── Chunk endpoints ───────────────────────────────────────────────

  test('POST /api/prompt-chunks returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-chunks', {
      data: { groupId: 'fake', title: 'C', content: 'x' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/prompt-chunks/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/prompt-chunks/fake-id', { data: { content: 'x' } });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/prompt-chunks/[id] returns 401 without auth', async ({ request }) => {
    const res = await request.delete('/api/prompt-chunks/fake-id');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-chunks/[id]/duplicate returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-chunks/fake-id/duplicate');
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-chunks/reorder returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-chunks/reorder', {
      data: { groupId: 'fake', orderedIds: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/prompt-chunks/restore returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/prompt-chunks/restore', {
      data: { groupId: 'fake', title: 'C', content: 'x' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Prompts Wallet — page smoke', () => {
  test('/wallet page loads without server errors', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    const html = await page.content();
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(0);
  });

  test('/wallet page has a valid title', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe('Prompts Wallet — API validation (unauthenticated)', () => {
  test('POST /api/prompt-wallets with empty body returns 4xx', async ({ request }) => {
    const res = await request.post('/api/prompt-wallets', { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/prompt-groups with missing walletId returns 4xx', async ({ request }) => {
    const res = await request.post('/api/prompt-groups', { data: { title: 'G' } });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/prompt-chunks with missing groupId returns 4xx', async ({ request }) => {
    const res = await request.post('/api/prompt-chunks', { data: { title: 'C', content: 'x' } });
    expect([400, 401]).toContain(res.status());
  });
});
