import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn(),
  calculateStreakFromHistory: vi.fn(),
}));

describe('PATCH /api/streaks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls recordStreakActivity with user id and timezone', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { recordStreakActivity } = await import('@/lib/streaks');

    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      timezone: 'America/New_York',
    } as any);
    vi.mocked(recordStreakActivity).mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      lastActivityDate: '2026-02-20',
      streakHistory: ['2026-02-18', '2026-02-19', '2026-02-20'],
      milestone: null,
      isNew: true,
    });

    const { PATCH } = await import('./route');
    const response = await PATCH();
    const json = await response.json();

    expect(recordStreakActivity).toHaveBeenCalledWith('user-1', 'America/New_York');
    expect(json.currentStreak).toBe(3);
    expect(json.longestStreak).toBe(5);
    expect(json.lastActivityDate).toBe('2026-02-20');
  });

  it('returns 401 when user is not authenticated', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValue(null as any);

    const { PATCH } = await import('./route');
    const response = await PATCH();
    expect(response.status).toBe(401);
  });
});

describe('GET /api/streaks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('uses calculateStreakFromHistory as source of truth', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { calculateStreakFromHistory } = await import('@/lib/streaks');

    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      timezone: 'America/Vancouver',
    } as any);
    vi.mocked(calculateStreakFromHistory).mockReturnValue(5);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 3, // stale stored value — should be overridden
      longestStreak: 10,
      lastActivityDate: new Date('2026-02-20T00:00:00Z'),
      streakHistory: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);

    const { GET } = await import('./route');
    const response = await GET();
    const json = await response.json();

    // Should use the recalculated streak (5), not the stale stored value (3)
    expect(json.currentStreak).toBe(5);
    expect(json.longestStreak).toBe(10);
  });

  it('returns 401 when user is not authenticated', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    vi.mocked(getCurrentUser).mockResolvedValue(null as any);

    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('derives lastActivityDate from streakHistory not lastActivityDate field', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const { calculateStreakFromHistory } = await import('@/lib/streaks');

    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      timezone: 'America/Vancouver',
    } as any);
    vi.mocked(calculateStreakFromHistory).mockReturnValue(2);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 2,
      longestStreak: 5,
      lastActivityDate: new Date('2026-02-20T08:00:00Z'), // UTC — different from local date in some TZs
      streakHistory: ['2026-02-19', '2026-02-20'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { GET } = await import('./route');
    const response = await GET();
    const json = await response.json();

    // lastActivityDate should come from history, not from the DateTime field
    expect(json.lastActivityDate).toBe('2026-02-20');
  });
});
