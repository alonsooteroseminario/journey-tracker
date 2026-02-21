import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetProfile } from './getProfile';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;

describe('executeGetProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns profile for authenticated user', async () => {
    mockResolveUser.mockResolvedValue({
      id: 'mongo-1',
      name: 'Alice',
      email: 'alice@example.com',
      bio: 'Test bio',
      location: 'Vancouver',
      timezone: 'America/Vancouver',
      joinedDate: new Date('2024-01-01'),
    });

    const result = await executeGetProfile({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: 'mongo-1',
      name: 'Alice',
      email: 'alice@example.com',
      bio: 'Test bio',
      location: 'Vancouver',
      timezone: 'America/Vancouver',
    });
    expect(typeof result.data.joinedDate).toBe('string');
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetProfile({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetProfile({}, 'clerk-missing');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns null for optional fields when not set', async () => {
    mockResolveUser.mockResolvedValue({
      id: 'mongo-2',
      name: 'Bob',
      email: 'bob@example.com',
      bio: null,
      location: null,
      timezone: null,
      joinedDate: null,
    });

    const result = await executeGetProfile({}, 'clerk-2');
    expect(result.success).toBe(true);
    expect(result.data.bio).toBeNull();
    expect(result.data.location).toBeNull();
    expect(result.data.timezone).toBeNull();
    expect(result.data.joinedDate).toBeNull();
  });
});
