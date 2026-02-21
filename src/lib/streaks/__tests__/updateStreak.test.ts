import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateStreakFromHistory, recordStreakActivity } from '../updateStreak';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/dateUtils', () => ({
  getTodayInTimezone: vi.fn(() => '2026-02-20'),
}));

describe('calculateStreakFromHistory', () => {
  it('returns 0 for empty history', () => {
    expect(calculateStreakFromHistory([], '2026-02-20')).toBe(0);
  });

  it('returns 1 when only today is in history', () => {
    expect(calculateStreakFromHistory(['2026-02-20'], '2026-02-20')).toBe(1);
  });

  it('counts consecutive days backward from today', () => {
    const history = ['2026-02-18', '2026-02-19', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });

  it('stops counting at gaps', () => {
    const history = ['2026-02-15', '2026-02-18', '2026-02-19', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });

  it('returns 0 when today is NOT in history', () => {
    const history = ['2026-02-18', '2026-02-19'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(0);
  });

  it('handles single gap correctly', () => {
    const history = ['2026-02-17', '2026-02-20'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(1);
  });

  it('handles unsorted input', () => {
    const history = ['2026-02-20', '2026-02-18', '2026-02-19'];
    expect(calculateStreakFromHistory(history, '2026-02-20')).toBe(3);
  });
});

describe('recordStreakActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates StreakData if none exists', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.streakData.create).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date('2026-02-20T00:00:00Z'),
      streakHistory: ['2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        currentStreak: 1,
        streakHistory: ['2026-02-20'],
      }),
    });
    expect(result.currentStreak).toBe(1);
    expect(result.isNew).toBe(true);
  });

  it('skips update if today already recorded', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-20T00:00:00Z'),
      streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.update).not.toHaveBeenCalled();
    expect(result.currentStreak).toBe(5);
    expect(result.isNew).toBe(false);
  });

  it('adds today and recalculates streak', async () => {
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 2,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-19T00:00:00Z'),
      streakHistory: ['2026-02-18', '2026-02-19'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(prisma.streakData.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: expect.objectContaining({
        currentStreak: 3,
        longestStreak: 10,
        streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      }),
    });
    expect(result.currentStreak).toBe(3);
    expect(result.milestone).toBeNull();
  });

  it('detects milestone at 7 days', async () => {
    const history = ['2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'];
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 6,
      longestStreak: 6,
      lastActivityDate: new Date('2026-02-19T00:00:00Z'),
      streakHistory: history,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(result.currentStreak).toBe(7);
    expect(result.milestone).toBe(7);
    expect(result.longestStreak).toBe(7);
  });

  it('updates longestStreak when surpassed', async () => {
    const history = Array.from({ length: 10 }, (_, i) => {
      const d = new Date('2026-02-10T00:00:00');
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    }); // 2026-02-10 through 2026-02-19
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 10,
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-19T00:00:00Z'),
      streakHistory: history,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const result = await recordStreakActivity('user-1', 'America/Vancouver');

    expect(result.currentStreak).toBe(11);
    expect(result.longestStreak).toBe(11);
  });
});
