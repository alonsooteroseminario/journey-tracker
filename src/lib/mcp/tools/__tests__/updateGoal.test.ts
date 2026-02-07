import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateGoal } from '../updateGoal';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');

describe('executeUpdateGoal', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update goal with valid input', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.update).mockResolvedValue({
      id: 'goal-1',
      title: 'Updated Title',
      description: 'Updated Description',
      updatedAt: new Date(),
    } as any);
    vi.mocked(auditLogger.logGoalUpdated).mockImplementation(() => {});

    const result = await executeUpdateGoal(
      {
        goalId: 'goal-1',
        title: 'Updated Title',
        description: 'Updated Description',
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.title).toBe('Updated Title');
    expect(auditLogger.logGoalUpdated).toHaveBeenCalled();
  });

  it('should return error when user lacks ownership', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(false);
    vi.mocked(auditLogger.logUnauthorizedAccess).mockImplementation(() => {});

    const result = await executeUpdateGoal(
      { goalId: 'goal-1', title: 'New' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
    expect(auditLogger.logUnauthorizedAccess).toHaveBeenCalled();
  });

  it('should return error when goalId is missing', async () => {
    const result = await executeUpdateGoal({} as any, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });
});
