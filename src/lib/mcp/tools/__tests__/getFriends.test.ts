import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetFriends } from '../getFriends';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');

describe('executeGetFriends', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return friends list with stats', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.friendship.findMany).mockResolvedValue([
      {
        id: 'friendship-1',
        friendId: 'friend-1',
        addedDate: new Date('2024-01-01'),
        friend: {
          id: 'friend-1',
          name: 'Friend 1',
          profileImage: null,
          streakData: {
            currentStreak: 3,
            longestStreak: 5,
          },
        },
      },
    ] as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue([
      { id: 'goal-1', tasks: [] },
    ] as any);

    const result = await executeGetFriends({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Friend 1');
    expect(data[0].currentStreak).toBe(3);
  });

  it('should return empty list when no friends', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.friendship.findMany).mockResolvedValue([]);

    const result = await executeGetFriends({}, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetFriends({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
