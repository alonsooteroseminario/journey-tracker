import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCompleteSubstep } from './completeSubstep';
import { resolveUser } from '@/lib/agent/resolveUser';
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
    logSubstepCompleted: vi.fn(),
  },
}));
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn().mockResolvedValue({ currentStreak: 2, longestStreak: 2, milestone: null }),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', timezone: 'UTC' };

function makeGoal() {
  return {
    id: 'goal-1',
    userId: USER.id,
    title: 'My Goal',
    tasks: [
      {
        id: 'task-1',
        title: 'Task One',
        status: 'not_started',
        substeps: [
          { id: 'substep-1', title: 'Substep One', status: 'not_started' },
        ],
      },
    ],
  };
}

describe('executeCompleteSubstep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(makeGoal());
    mockGoalUpdate.mockResolvedValue({});
  });

  it('marks substep as completed and updates streak', async () => {
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('completed');
    expect(result.data.completedAt).toBeDefined();

    const { recordStreakActivity } = await import('@/lib/streaks');
    expect(recordStreakActivity).toHaveBeenCalledWith(USER.id, USER.timezone);
  });

  it('marks substep as in_progress', async () => {
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'in_progress' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('in_progress');
    expect(result.data.startedAt).toBeDefined();
    expect(result.data.completedAt).toBeUndefined();
  });

  it('marks substep as not_started (clears timestamps)', async () => {
    const goal = makeGoal();
    (goal.tasks[0].substeps[0] as any).startedAt = '2024-01-01T00:00:00.000Z';
    (goal.tasks[0].substeps[0] as any).completedAt = '2024-01-02T00:00:00.000Z';
    mockGoalFindUnique.mockResolvedValue(goal);

    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'not_started' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('not_started');
    expect(result.data.completedAt).toBeUndefined();
    expect(result.data.startedAt).toBeUndefined();
  });

  it('returns error when userId missing', async () => {
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      undefined
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeCompleteSubstep(
      { goalId: '', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found in goal', async () => {
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'nonexistent-task', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Task not found');
  });

  it('returns error when substep not found in task', async () => {
    const result = await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'nonexistent-substep', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Substep not found');
  });

  it('strips ID prefix from goalId', async () => {
    await executeCompleteSubstep(
      { goalId: 'goal_goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'completed' },
      'clerk-1'
    );
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('does not update streak for non-completed status', async () => {
    const { recordStreakActivity } = await import('@/lib/streaks');
    await executeCompleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'substep-1', status: 'in_progress' },
      'clerk-1'
    );
    expect(recordStreakActivity).not.toHaveBeenCalled();
  });
});
