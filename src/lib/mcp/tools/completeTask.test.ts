import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCompleteTask } from './completeTask';
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
    logUnauthorizedAccess: vi.fn(),
    logTaskCompleted: vi.fn(),
  },
}));
vi.mock('@/lib/agent/conversationStore', () => ({
  conversationStore: { setLastTask: vi.fn() },
}));
vi.mock('@/lib/streaks', () => ({
  recordStreakActivity: vi.fn().mockResolvedValue({ currentStreak: 3, longestStreak: 3, milestone: null }),
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', timezone: 'America/Toronto' };
function makeGoal() {
  return {
    id: 'goal-1',
    userId: USER.id,
    title: 'My Goal',
    tasks: [
      { id: 'task-1', title: 'Task One', status: 'not_started', substeps: [] },
    ],
  };
}

describe('executeCompleteTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(makeGoal());
    mockGoalUpdate.mockResolvedValue({});
  });

  it('marks task as completed and updates streak', async () => {
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('completed');
    expect(result.data.completedAt).toBeDefined();
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('marks task as in_progress', async () => {
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'in_progress' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('in_progress');
    expect(result.data.startedAt).toBeDefined();
    expect(result.data.completedAt).toBeUndefined();
  });

  it('marks task as not_started (clears timestamps)', async () => {
    const goal = makeGoal();
    (goal.tasks[0] as any).startedAt = '2024-01-01T00:00:00.000Z';
    (goal.tasks[0] as any).completedAt = '2024-01-02T00:00:00.000Z';
    mockGoalFindUnique.mockResolvedValue(goal);

    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'not_started' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('not_started');
    expect(result.data.completedAt).toBeUndefined();
    expect(result.data.startedAt).toBeUndefined();
  });

  it('sends milestone notification when streak milestone reached', async () => {
    const { recordStreakActivity } = await import('@/lib/streaks');
    const { notify } = await import('@/lib/email/notifications');
    vi.mocked(recordStreakActivity).mockResolvedValue({
      currentStreak: 7,
      longestStreak: 7,
      milestone: 7,
      lastActivityDate: '2024-01-01',
      streakHistory: [],
    });

    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    await vi.runAllTimersAsync().catch(() => {}); // flush pending .catch chains
    // notify may be called async — assert it was called or not (fire-and-forget)
    // At minimum, recordStreakActivity was called
    expect(recordStreakActivity).toHaveBeenCalledWith(USER.id, USER.timezone);
    expect(notify).toHaveBeenCalledWith(USER.id, 'streakMilestone', expect.objectContaining({ streakCount: 7 }));
  });

  it('returns error when userId missing', async () => {
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      undefined
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeCompleteTask(
      { goalId: '', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found in goal', async () => {
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'nonexistent-task', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Task not found');
  });

  it('strips ID prefix from goalId', async () => {
    await executeCompleteTask(
      { goalId: 'goal_goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('returns database error on exception', async () => {
    mockGoalUpdate.mockRejectedValue(new Error('DB down'));
    const result = await executeCompleteTask(
      { goalId: 'goal-1', taskId: 'task-1', status: 'completed' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
