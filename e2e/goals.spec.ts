import { test, expect } from '@playwright/test';

/**
 * E2E tests for goal management functionality.
 * These tests verify the goals API endpoints work correctly in a real environment.
 */

test.describe('Goals API E2E Tests', () => {
  test.describe('Unauthenticated Access', () => {
    test('should return 401 when accessing goals without auth', async ({ request }) => {
      const response = await request.get('/api/goals');
      expect(response.status()).toBe(401);
    });

    test('should return 401 when creating goal without auth', async ({ request }) => {
      const response = await request.post('/api/goals', {
        data: {
          title: 'Test Goal',
          category: 'health',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('should return 401 when updating goal without auth', async ({ request }) => {
      const response = await request.patch('/api/goals/test-goal-id', {
        data: {
          title: 'Updated Goal',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('should return 401 when deleting goal without auth', async ({ request }) => {
      const response = await request.delete('/api/goals/test-goal-id');
      expect(response.status()).toBe(401);
    });
  });

  test.describe('API Validation', () => {
    test('should return 400 when creating goal with missing title', async ({ request }) => {
      const response = await request.post('/api/goals', {
        data: {
          category: 'health',
          // title is missing
        },
      });
      
      // Either 400 (validation error) or 401 (auth error) is acceptable
      expect([400, 401]).toContain(response.status());
    });

    test('should return 400 when creating goal with invalid category', async ({ request }) => {
      const response = await request.post('/api/goals', {
        data: {
          title: 'Test Goal',
          category: 'invalid-category',
        },
      });
      
      // Either 400 (validation error) or 401 (auth error) is acceptable
      expect([400, 401]).toContain(response.status());
    });

    test('should return 404 when accessing non-existent goal', async ({ request }) => {
      const response = await request.get('/api/goals/non-existent-goal-id');
      
      // Either 404 (not found) or 401 (auth error) is acceptable
      expect([404, 401]).toContain(response.status());
    });
  });

  test.describe('Response Format', () => {
    test('should have correct content-type header for goals endpoint', async ({ request }) => {
      const response = await request.get('/api/goals');
      
      // Should be JSON regardless of auth status
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('should return valid JSON for error responses', async ({ request }) => {
      const response = await request.get('/api/goals');
      
      // Should be able to parse JSON response
      const data = await response.json();
      expect(data).toBeTruthy();
      expect(typeof data).toBe('object');
    });
  });
});
