import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetStreaks } from '../getStreaks';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/dateUtils', () => ({
  getTodayInTimezone: vi.fn(() => '2026-02-20'),
}));

describe('executeGetStreaks', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123', timezone: 'America/Vancouver' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return streak recalculated from history, not raw stored value', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-mongo-id',
      currentStreak: 99, // stale / wrong stored value
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-20T00:00:00Z'),
      streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    // Should be 3 (calculated from history), not 99 (stale stored)
    expect(data.currentStreak).toBe(3);
    expect(data.longestStreak).toBe(10);
  });

  it('should return 0 streak when today is not in history', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-mongo-id',
      currentStreak: 3,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-19T00:00:00Z'),
      streakHistory: ['2026-02-18', '2026-02-19'], // today (2026-02-20) not in history
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.currentStreak).toBe(0);
  });

  it('should return default data when no streak exists', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue(null);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetStreaks({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('derives lastActivityDate from history, not from lastActivityDate field', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-mongo-id',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date('2026-02-21T05:00:00Z'), // UTC next-day due to timezone offset
      streakHistory: ['2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await executeGetStreaks({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    // Should read '2026-02-20' from history, not '2026-02-21' from UTC DateTime
    expect(data.lastActivityDate).toBe('2026-02-20');
  });
});
