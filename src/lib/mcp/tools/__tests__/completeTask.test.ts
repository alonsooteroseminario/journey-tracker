import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCompleteTask } from '../completeTask';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');
vi.mock('@/lib/agent/conversationStore');

describe('executeCompleteTask', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };
  const mockGoal = {
    id: 'goal-1',
    tasks: [
      { id: 'task-1', title: 'Task 1', status: 'not_started' },
      { id: 'task-2', title: 'Task 2', status: 'not_started' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark task as completed', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue({
      userId: 'user-mongo-id',
      currentStreak: 5,
      longestStreak: 10,
      streakHistory: ['2024-01-01', '2024-01-02'],
    } as any);
    vi.mocked(prisma.streakData.update).mockResolvedValue({} as any);
    vi.mocked(auditLogger.logTaskCompleted).mockImplementation(() => {});

    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.status).toBe('completed');
    expect(data.completedAt).toBeDefined();
    expect(prisma.activityLog.create).toHaveBeenCalled();
  });

  it('should mark task as uncompleted', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({
      ...mockGoal,
      tasks: [{ id: 'task-1', title: 'Task 1', status: 'completed', completedAt: '2024-01-01' }],
    } as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);
    vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'not_started' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.status).toBe('not_started');
    expect(data.completedAt).toBeUndefined();
  });

  it('should return error when task not found', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);

    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'nonexistent', status: 'completed' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});
