import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetStreaks } from '../getStreaks';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');

describe('executeGetStreaks', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return streak data for user', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    const today = new Date();
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      userId: 'user-mongo-id',
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: today,
      streakHistory: [today.toISOString().split('T')[0]],
    } as any);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data.currentStreak).toBe(5);
    expect(result.data.longestStreak).toBe(10);
  });

  it('should return default data when no streak exists', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue(null);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data.currentStreak).toBe(0);
    expect(result.data.longestStreak).toBe(0);
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetStreaks({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
