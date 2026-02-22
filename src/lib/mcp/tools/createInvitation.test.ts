import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateInvitation } from './createInvitation';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockInvitationCreate = prisma.invitation.create as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };

describe('executeCreateInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockInvitationCreate.mockResolvedValue({
      id: 'inv-1',
      code: 'ABC12345',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  });

  it('creates invitation and returns code', async () => {
    const result = await executeCreateInvitation({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.code).toBe('ABC12345');
    expect(typeof result.data.expiresAt).toBe('string'); // ISO string
    expect(result.message).toContain('ABC12345');
    expect(mockInvitationCreate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeCreateInvitation({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeCreateInvitation({}, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('creates invitation with 7-day expiry', async () => {
    const before = Date.now();
    await executeCreateInvitation({}, 'clerk-1');
    const after = Date.now();

    const callArgs = mockInvitationCreate.mock.calls[0][0];
    const expiresAt = callArgs.data.expiresAt.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + sevenDays + 1000);
  });
});
