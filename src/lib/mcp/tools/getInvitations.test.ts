import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetInvitations } from './getInvitations';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockInvitationFindMany = prisma.invitation.findMany as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };

describe('executeGetInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
  });

  it('returns list of invitations with computed status', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 1000);

    mockInvitationFindMany.mockResolvedValue([
      { id: 'inv-1', code: 'CODE1', used: false, expiresAt: future, createdAt: now, usedBy: null, usedAt: null },
      { id: 'inv-2', code: 'CODE2', used: true, expiresAt: future, createdAt: now, usedBy: 'user-x', usedAt: now },
      { id: 'inv-3', code: 'CODE3', used: false, expiresAt: past, createdAt: now, usedBy: null, usedAt: null },
    ]);

    const result = await executeGetInvitations({}, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].status).toBe('active');
    expect(result.data[1].status).toBe('used');
    expect(result.data[2].status).toBe('expired');
  });

  it('returns error when userId missing', async () => {
    const result = await executeGetInvitations({}, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeGetInvitations({}, 'clerk-missing');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns empty array when no invitations', async () => {
    mockInvitationFindMany.mockResolvedValue([]);
    const result = await executeGetInvitations({}, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.message).toContain('0 invitation');
  });
});
