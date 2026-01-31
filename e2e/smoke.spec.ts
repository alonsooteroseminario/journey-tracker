import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests to verify the application loads correctly.
 * These tests run against the authentication flow provided by Clerk.
 */

test.describe('Application Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Should see either the main app or Clerk auth page
    // Wait for page to be in a stable state
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded (check for HTML content)
    const html = await page.content();
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have a title (either from app or Clerk)
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have any uncaught JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('should respond to API health check', async ({ request }) => {
    // Test that the API is responding
    // We'll try the goals endpoint - should return 401 if not authenticated
    const response = await request.get('/api/goals');
    
    // Should get a response (either 200 with auth or 401 without)
    expect([200, 401]).toContain(response.status());
  });
});
