import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeleteGoal } from './deleteGoal';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logUnauthorizedAccess: vi.fn(),
    logGoalDeleted: vi.fn(),
  },
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalDelete = prisma.goal.delete as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', timezone: 'America/Toronto' };
const GOAL_STUB = { title: 'My Goal to Delete' };

describe('executeDeleteGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL_STUB);
    mockGoalDelete.mockResolvedValue({});
  });

  it('deletes goal and returns success message', async () => {
    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.message).toContain('My Goal to Delete');
    expect(mockGoalDelete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('sends email notification after deletion', async () => {
    const { notify } = await import('@/lib/email/notifications');
    await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');

    expect(notify).toHaveBeenCalledWith(USER.id, 'goalDeleted', expect.objectContaining({
      userName: USER.name,
      goalTitle: 'My Goal to Delete',
    }));
  });

  it('still deletes when goal not found (no email sent)', async () => {
    const { notify } = await import('@/lib/email/notifications');
    mockGoalFindUnique.mockResolvedValue(null);

    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(mockGoalDelete).toHaveBeenCalledOnce();
    expect(notify).not.toHaveBeenCalled();
  });

  it('returns error when userId missing', async () => {
    const result = await executeDeleteGoal({ goalId: 'goal-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeDeleteGoal({ goalId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns forbidden when access denied', async () => {
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValueOnce(false);

    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('strips ID prefix from goalId', async () => {
    await executeDeleteGoal({ goalId: 'goal_goal-1' }, 'clerk-1');
    expect(mockGoalDelete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('returns database error on exception', async () => {
    mockGoalDelete.mockRejectedValue(new Error('DB down'));
    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
