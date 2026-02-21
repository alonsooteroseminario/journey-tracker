import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateProfile } from './updateProfile';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
  diffFields: vi.fn().mockReturnValue([]),
  formatDiffAction: vi.fn().mockReturnValue('Updated profile'),
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: { logProfileUpdated: vi.fn() },
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', bio: 'Old bio', location: 'NYC', timezone: 'UTC' };

describe('executeUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockUserUpdate.mockResolvedValue({
      ...USER,
      name: 'Alice Updated',
      bio: 'New bio',
      location: 'NYC',
      timezone: 'UTC',
    });
  });

  it('updates profile fields successfully', async () => {
    const result = await executeUpdateProfile({ name: 'Alice Updated', bio: 'New bio' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Alice Updated');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER.id },
        data: expect.objectContaining({ name: 'Alice Updated', bio: 'New bio' }),
      })
    );
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateProfile({ name: 'X' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when no fields provided', async () => {
    const result = await executeUpdateProfile({}, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeUpdateProfile({ name: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('trims whitespace from string fields', async () => {
    mockUserUpdate.mockResolvedValue({ ...USER, name: 'Alice', bio: 'Clean bio', location: 'NYC', timezone: 'UTC' });
    await executeUpdateProfile({ name: '  Alice  ', bio: '  Clean bio  ' }, 'clerk-1');
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Alice', bio: 'Clean bio' }),
      })
    );
  });
});
