import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCompleteSubstep } from '../completeSubstep';
import { prisma } from '@/lib/prisma';
import { recordStreakActivity } from '@/lib/streaks';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn().mockResolvedValue({
    currentStreak: 2,
    longestStreak: 5,
    milestone: null,
    isNew: true,
    lastActivityDate: '2026-02-20',
    streakHistory: ['2026-02-19', '2026-02-20'],
  }),
}));

describe('executeCompleteSubstep', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123', timezone: 'America/Vancouver' };
  const mockGoal = {
    id: 'goal-1',
    title: 'My Goal',
    tasks: [
      {
        id: 'task-1',
        title: 'Task 1',
        status: 'not_started',
        substeps: [
          { id: 'substep-1', title: 'Substep 1', status: 'not_started' },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update streak when substep is completed', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(recordStreakActivity).toHaveBeenCalledWith('user-mongo-id', 'America/Vancouver');
  });

  it('should NOT update streak when substep status is not completed', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({
      ...mockGoal,
      tasks: [{
        ...mockGoal.tasks[0],
        substeps: [{ id: 'substep-1', title: 'Substep 1', status: 'completed' }],
      }],
    } as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

    await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'not_started' },
      'clerk-123'
    );

    expect(recordStreakActivity).not.toHaveBeenCalled();
  });

  it('should return error when substep not found', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);

    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'nonexistent', status: 'completed' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});
