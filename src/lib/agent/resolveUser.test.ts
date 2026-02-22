import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveUser } from './resolveUser';
import { prisma } from '@/lib/prisma';

const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;

describe('resolveUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns user when found by clerkId', async () => {
    const mockUser = { id: 'mongo-1', clerkId: 'clerk-1', name: 'Alice', email: 'alice@example.com' };
    mockUserFindUnique.mockResolvedValue(mockUser);

    const result = await resolveUser('clerk-1');

    expect(result).toEqual(mockUser);
    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { clerkId: 'clerk-1' } });
  });

  it('returns null when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const result = await resolveUser('clerk-missing');
    expect(result).toBeNull();
  });

  it('returns null on database error', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB connection failed'));
    const result = await resolveUser('clerk-1');
    expect(result).toBeNull();
  });
});
