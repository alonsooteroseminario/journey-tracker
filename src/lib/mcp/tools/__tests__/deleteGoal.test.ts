import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeleteGoal } from '../deleteGoal';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');

describe('executeDeleteGoal', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete goal with valid ownership', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({ title: 'Test Goal' } as any);
    vi.mocked(prisma.goal.delete).mockResolvedValue({} as any);
    vi.mocked(auditLogger.logGoalDeleted).mockImplementation(() => {});

    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Test Goal');
    expect(prisma.goal.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('should return error when user lacks ownership', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(false);

    const result = await executeDeleteGoal({ goalId: 'goal-1' }, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('should return error when goalId is missing', async () => {
    const result = await executeDeleteGoal({} as any, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });
});
