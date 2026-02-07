/**
 * Security utilities for the agent
 * Handles rate limiting and ownership verification.
 *
 * NOTE: Rate limiting uses an in-memory Map. On serverless platforms
 * (e.g. Vercel), each cold start resets the store. This provides
 * per-instance protection but is NOT a globally consistent rate limiter.
 * For strict global rate limiting, replace with Redis (e.g. Vercel KV).
 */

import { prisma } from '@/lib/prisma';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms
const RATE_LIMIT_MAX = 30;

interface RateLimitEntry {
  timestamps: number[];
}

class SecurityGuard {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if user has exceeded rate limit
   */
  checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(userId) || { timestamps: [] };

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    // Check if limit exceeded
    if (entry.timestamps.length >= RATE_LIMIT_MAX) {
      return false;
    }

    // Add current request
    entry.timestamps.push(now);
    this.rateLimitStore.set(userId, entry);

    return true;
  }

  /**
   * Get rate limit status for user
   */
  getRateLimitStatus(userId: string): {
    remaining: number;
    resetTime: Date;
  } {
    const now = Date.now();
    const entry = this.rateLimitStore.get(userId) || { timestamps: [] };

    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    const remaining = Math.max(0, RATE_LIMIT_MAX - entry.timestamps.length);
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW);

    return { remaining, resetTime };
  }

  /**
   * Get standard rate limit response headers
   */
  getRateLimitHeaders(userId: string): Record<string, string> {
    const status = this.getRateLimitStatus(userId);
    return {
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
      'X-RateLimit-Remaining': String(status.remaining),
      'X-RateLimit-Reset': String(Math.ceil(status.resetTime.getTime() / 1000)),
    };
  }

  /**
   * Verify that a user owns a resource
   */
  async verifyOwnership(
    resourceId: string,
    userId: string,
    resourceType: 'goal'
  ): Promise<boolean> {
    try {
      if (resourceType === 'goal') {
        const goal = await prisma.goal.findFirst({
          where: {
            id: resourceId,
            userId,
          },
        });
        return !!goal;
      }

      return false;
    } catch (error) {
      console.error('Ownership verification error:', error);
      return false;
    }
  }
}

// Singleton instance
export const securityGuard = new SecurityGuard();
