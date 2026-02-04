/**
 * Security utilities for the agent
 * Handles rate limiting, input sanitization, and ownership verification
 */

import { prisma } from '@/lib/prisma';

// Rate limit: 30 requests per minute per user
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
      return false; // Rate limit exceeded
    }

    // Add current request
    entry.timestamps.push(now);
    this.rateLimitStore.set(userId, entry);

    return true; // Within limit
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

    // Remove old timestamps
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    const remaining = Math.max(0, RATE_LIMIT_MAX - entry.timestamps.length);
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW);

    return { remaining, resetTime };
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    // Remove script tags
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove SQL injection patterns (basic)
    sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');

    return sanitized.trim();
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
