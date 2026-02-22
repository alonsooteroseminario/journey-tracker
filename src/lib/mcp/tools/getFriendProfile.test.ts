import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetFriendProfile } from './getFriendProfile';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockFriendshipFindFirst = prisma.friendship.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockStreakFindUnique = prisma.streakData.findUnique as ReturnType<typeof vi.fn>;
const mockGoalFindMany = prisma.goal.findMany as ReturnType<typeof vi.fn>;
const mockActivityLogFindMany = prisma.activityLog.findMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const FRIEND = {
  id: 'mongo-2',
  name: 'Bob',
  bio: 'Hi there',
  location: 'NYC',
  joinedDate: new Date('2024-01-01'),
};

describe('executeGetFriendProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockFriendshipFindFirst.mockResolvedValue({
      id: 'fs-1',
      userId: USER.id,
      friendId: FRIEND.id,
      status: 'accepted',
    });
    mockUserFindUnique.mockResolvedValue(FRIEND);
    mockStreakFindUnique.mockResolvedValue({
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: new Date('2026-02-20'),
    });
    mockGoalFindMany.mockResolvedValue([]);
    mockActivityLogFindMany.mockResolvedValue([]);
  });

  it('returns friend profile with streak and goals', async () => {
    mockGoalFindMany.mockResolvedValue([
      {
        id: 'g-1',
        title: 'Bob goal',
        icon: '🎯',
        tasks: [{ completed: true }, { completed: false }],
      },
    ]);
    mockActivityLogFindMany.mockResolvedValue([
      { type: 'goal_created', action: 'Created goal', timestamp: new Date('2026-02-20') },
    ]);

    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Bob');
    expect(result.data.streak.currentStreak).toBe(7);
    expect(result.data.goals).toHaveLength(1);
    expect(result.data.goals[0].completionPercentage).toBe(50);
    expect(result.data.recentActivity).toHaveLength(1);
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when friendId missing', async () => {
    const result = await executeGetFriendProfile({ friendId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when friendship not found/accepted', async () => {
    mockFriendshipFindFirst.mockResolvedValue(null);
    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('uses defaults when no streak data', async () => {
    mockStreakFindUnique.mockResolvedValue(null);
    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data.streak.currentStreak).toBe(0);
    expect(result.data.streak.longestStreak).toBe(0);
    expect(result.data.streak.lastActivityDate).toBeNull();
  });

  it('returns 0% completion when goal has no tasks', async () => {
    mockGoalFindMany.mockResolvedValue([
      { id: 'g-2', title: 'Empty goal', icon: '📋', tasks: [] },
    ]);

    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data.goals[0].completionPercentage).toBe(0);
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('includes bio, location and joinedDate in response', async () => {
    const result = await executeGetFriendProfile({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data.bio).toBe('Hi there');
    expect(result.data.location).toBe('NYC');
    expect(result.data.joinedDate).toBe(new Date('2024-01-01').toISOString());
  });
});
