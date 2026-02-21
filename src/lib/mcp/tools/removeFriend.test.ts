import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRemoveFriend } from './removeFriend';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({ trackActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: { logFriendRemoved: vi.fn() },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockFriendshipFindFirst = prisma.friendship.findFirst as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockFriendshipDeleteMany = prisma.friendship.deleteMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const FRIEND = { id: 'mongo-2', name: 'Bob' };

describe('executeRemoveFriend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockFriendshipFindFirst.mockResolvedValue({ id: 'fs-1', userId: USER.id, friendId: FRIEND.id });
    mockUserFindUnique.mockResolvedValue(FRIEND);
    mockFriendshipDeleteMany.mockResolvedValue({ count: 2 });
  });

  it('removes friend successfully', async () => {
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.friendId).toBe(FRIEND.id);
    expect(result.data.friendName).toBe('Bob');
    expect(mockFriendshipDeleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: USER.id, friendId: FRIEND.id },
          { userId: FRIEND.id, friendId: USER.id },
        ],
      },
    });
  });

  it('returns error when userId missing', async () => {
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when friendId missing', async () => {
    const result = await executeRemoveFriend({ friendId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when friendship does not exist', async () => {
    mockFriendshipFindFirst.mockResolvedValue(null);
    const result = await executeRemoveFriend({ friendId: FRIEND.id }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('strips ID prefix before lookup', async () => {
    await executeRemoveFriend({ friendId: 'user_mongo-2' }, 'clerk-1');
    expect(mockFriendshipFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER.id, friendId: 'mongo-2' } })
    );
  });
});
