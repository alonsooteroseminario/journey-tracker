import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeleteTask } from './deleteTask';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({ trackActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: { logUnauthorizedAccess: vi.fn(), logTaskUpdated: vi.fn() },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };

// Use factory functions to avoid shared mutable state between tests
function makeGoal() {
  return {
    id: 'goal-1',
    userId: USER.id,
    title: 'My Goal',
    tasks: [
      { id: 'task-1', title: 'Task One', status: 'todo', order: 0, substeps: [] },
      { id: 'task-2', title: 'Task Two', status: 'todo', order: 1, substeps: [] },
    ],
  };
}

describe('executeDeleteTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(makeGoal());
    mockGoalUpdate.mockResolvedValue({});
  });

  it('deletes task and re-indexes order', async () => {
    const result = await executeDeleteTask({ goalId: 'goal-1', taskId: 'task-1' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.deletedTitle).toBe('Task One');
    // Goal should be updated with only task-2, re-indexed to order 0
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          tasks: [{ id: 'task-2', title: 'Task Two', status: 'todo', order: 0, substeps: [] }],
        }),
      })
    );
  });

  it('returns error when userId missing', async () => {
    const result = await executeDeleteTask({ goalId: 'goal-1', taskId: 'task-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId or taskId missing', async () => {
    const result = await executeDeleteTask({ goalId: '', taskId: 'task-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeDeleteTask({ goalId: 'goal-1', taskId: 'task-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found', async () => {
    const result = await executeDeleteTask({ goalId: 'goal-1', taskId: 'missing-task' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Task not found');
  });

  it('returns data with goalId and taskId on success', async () => {
    const result = await executeDeleteTask({ goalId: 'goal-1', taskId: 'task-1' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data.goalId).toBe('goal-1');
    expect(result.data.taskId).toBe('task-1');
  });

  it('strips ID prefix from goalId and taskId', async () => {
    await executeDeleteTask({ goalId: 'goal_goal-1', taskId: 'task_task-1' }, 'clerk-1');
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});
