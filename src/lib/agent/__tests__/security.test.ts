import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityGuard } from '../security';
import { prisma } from '@/lib/prisma';


describe('securityGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const userId = 'test-user-1';

      for (let i = 0; i < 30; i++) {
        expect(securityGuard.checkRateLimit(userId)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const userId = 'test-user-2';

      // Fill up the rate limit
      for (let i = 0; i < 30; i++) {
        securityGuard.checkRateLimit(userId);
      }

      // 31st request should be blocked
      expect(securityGuard.checkRateLimit(userId)).toBe(false);
    });

    it('should track separate limits per user', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 makes 30 requests
      for (let i = 0; i < 30; i++) {
        securityGuard.checkRateLimit(user1);
      }

      // User 2 should still be able to make requests
      expect(securityGuard.checkRateLimit(user2)).toBe(true);

      // User 1 should be blocked
      expect(securityGuard.checkRateLimit(user1)).toBe(false);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return remaining requests', () => {
      const userId = 'test-user-3';

      securityGuard.checkRateLimit(userId);
      securityGuard.checkRateLimit(userId);
      securityGuard.checkRateLimit(userId);

      const status = securityGuard.getRateLimitStatus(userId);
      expect(status.remaining).toBe(27);
      expect(status.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('verifyOwnership', () => {
    it('should return true when user owns resource', async () => {
      vi.mocked(prisma.goal.findFirst).mockResolvedValue({
        id: 'goal-1',
        userId: 'user-123',
      } as any);

      const result = await securityGuard.verifyOwnership('goal-1', 'user-123', 'goal');

      expect(result).toBe(true);
    });

    it('should return false when user does not own resource', async () => {
      vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

      const result = await securityGuard.verifyOwnership('goal-1', 'other-user', 'goal');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.goal.findFirst).mockRejectedValue(new Error('DB error'));

      const result = await securityGuard.verifyOwnership('goal-1', 'user-123', 'goal');

      expect(result).toBe(false);
    });
  });
});
