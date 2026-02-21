import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateTask } from './updateTask';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
  diffFields: vi.fn().mockReturnValue([{ field: 'title', from: 'Old', to: 'New' }]),
  formatDiffAction: vi.fn().mockReturnValue('Updated task "New"'),
}));
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logUnauthorizedAccess: vi.fn(),
    logTaskUpdated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/conversationStore', () => ({
  conversationStore: { setLastTask: vi.fn() },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const TASK = { id: 'task-1', title: 'Old Title', status: 'todo', substeps: [] };
const GOAL = { id: 'goal-1', userId: USER.id, title: 'My Goal', tasks: [TASK] };

describe('executeUpdateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL);
    mockGoalUpdate.mockResolvedValue({ ...GOAL });
  });

  it('updates task title successfully', async () => {
    const result = await executeUpdateTask(
      { goalId: 'goal-1', taskId: 'task-1', title: 'New Title' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('New Title');
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateTask({ goalId: 'goal-1', taskId: 'task-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId or taskId missing', async () => {
    const result = await executeUpdateTask({ goalId: '', taskId: 'task-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeUpdateTask({ goalId: 'goal-1', taskId: 'task-1', title: 'X' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found in goal', async () => {
    const result = await executeUpdateTask(
      { goalId: 'goal-1', taskId: 'nonexistent-task', title: 'X' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
    expect(result.message).toContain('Task not found');
  });

  it('strips ID prefix from goalId', async () => {
    await executeUpdateTask({ goalId: 'goal_goal-1', taskId: 'task-1', title: 'X' }, 'clerk-1');
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});
