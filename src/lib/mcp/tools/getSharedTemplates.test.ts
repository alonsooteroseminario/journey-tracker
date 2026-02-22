import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetSharedTemplates } from './getSharedTemplates';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    friendship: { findMany: vi.fn() },
    goalTemplate: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockFriendshipFindMany = prisma.friendship.findMany as ReturnType<typeof vi.fn>;
const mockTemplateFindMany = (prisma as any).goalTemplate.findMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const TEMPLATE = {
  id: 'tpl-1',
  title: 'Fitness Plan',
  description: 'Get fit',
  icon: '💪',
  authorId: 'mongo-2',
  difficulty: 'medium',
  category: 'health',
  tags: ['fitness'],
  forkCount: 3,
  visibility: 'friends',
  isPublished: true,
  createdAt: new Date('2026-01-01'),
  author: { id: 'mongo-2', name: 'Bob', profileImage: null },
};

describe('executeGetSharedTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockFriendshipFindMany.mockResolvedValue([{ friendId: 'mongo-2' }]);
    mockTemplateFindMany.mockResolvedValue([TEMPLATE]);
  });

  it('returns templates from friends and own', async () => {
    const result = await executeGetSharedTemplates({ includeOwn: true, visibility: 'all' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Fitness Plan');
    expect(result.data[0].authorName).toBe('Bob');
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetSharedTemplates({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetSharedTemplates({}, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns empty when no friends and includeOwn=false and visibility=friends', async () => {
    mockFriendshipFindMany.mockResolvedValue([]);
    const result = await executeGetSharedTemplates({ includeOwn: false, visibility: 'friends' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('includes own templates when includeOwn=true', async () => {
    const result = await executeGetSharedTemplates({ includeOwn: true }, 'clerk-1');
    expect(result.success).toBe(true);
    // templateFindMany was called (conditions include own)
    expect(mockTemplateFindMany).toHaveBeenCalledOnce();
  });

  it('maps template fields correctly', async () => {
    const result = await executeGetSharedTemplates({}, 'clerk-1');
    expect(result.success).toBe(true);
    const t = result.data[0];
    expect(t.id).toBe('tpl-1');
    expect(t.authorId).toBe('mongo-2');
    expect(t.difficulty).toBe('medium');
    expect(t.category).toBe('health');
    expect(t.forkCount).toBe(3);
    expect(t.visibility).toBe('friends');
    expect(t.isPublished).toBe(true);
  });
});
