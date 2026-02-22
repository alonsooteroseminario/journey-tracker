import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateTask } from './createTask';
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
    logTaskUpdated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/conversationStore', () => ({
  conversationStore: {
    setLastGoal: vi.fn(),
    setLastTask: vi.fn(),
  },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', timezone: 'UTC' };
const GOAL = {
  id: 'goal-1',
  userId: USER.id,
  title: 'My Goal',
  tasks: [],
};

describe('executeCreateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue({ ...GOAL, tasks: [] });
    mockGoalUpdate.mockResolvedValue({});
  });

  it('creates a task and returns success', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'New Task' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('New Task');
    expect(result.data.status).toBe('not_started');
    expect(result.data.id).toBeTypeOf('string');
    expect(result.data.substeps).toEqual([]);
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('includes optional fields when provided', async () => {
    const result = await executeCreateTask({
      goalId: 'goal-1',
      title: 'Detailed Task',
      description: 'A detailed description',
      priority: 'high',
      dueDate: '2024-06-30',
      notes: 'Some notes',
    }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.description).toBe('A detailed description');
    expect(result.data.priority).toBe('high');
    expect(result.data.dueDate).toBe('2024-06-30');
    expect(result.data.notes).toBe('Some notes');
  });

  it('appends task to existing tasks list', async () => {
    const existingTask = { id: 'existing-task', title: 'Existing', status: 'not_started', substeps: [] };
    mockGoalFindUnique.mockResolvedValue({ ...GOAL, tasks: [existingTask] });

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Second Task' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.order).toBe(1); // appended at index 1
    const updateArgs = mockGoalUpdate.mock.calls[0][0];
    expect(updateArgs.data.tasks).toHaveLength(2);
  });

  it('returns error when userId missing', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      undefined
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeCreateTask(
      { goalId: '', title: 'Task' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when title missing', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: '' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns forbidden when access denied', async () => {
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValueOnce(false);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('strips ID prefix from goalId', async () => {
    await executeCreateTask({ goalId: 'goal_goal-1', title: 'Task' }, 'clerk-1');
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('trims whitespace from title', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: '  Trimmed Task  ' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Trimmed Task');
  });

  it('returns database error on exception', async () => {
    mockGoalUpdate.mockRejectedValue(new Error('DB down'));
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
