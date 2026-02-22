import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAddSubstep } from './addSubstep';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({ trackActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };

// Factory to avoid shared mutable state
function makeGoal() {
  return {
    id: 'goal-1',
    userId: USER.id,
    title: 'My Goal',
    tasks: [
      { id: 'task-1', title: 'Task One', status: 'todo', order: 0, substeps: [] },
    ],
  };
}

describe('executeAddSubstep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(makeGoal());
    mockGoalUpdate.mockResolvedValue({});
  });

  it('adds substep to task successfully', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'New Substep' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('New Substep');
    expect(result.data.id).toBeTypeOf('string');
    expect(result.data.id).not.toBe('');
    expect(result.data.status).toBe('not_started');
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'X' },
      undefined
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when required fields missing', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: '' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'X' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'missing-task', title: 'X' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Task not found');
  });

  it('sets correct order based on existing substeps', async () => {
    const goalWithExistingSub = {
      ...makeGoal(),
      tasks: [
        {
          id: 'task-1',
          title: 'Task One',
          status: 'todo',
          order: 0,
          substeps: [{ id: 'existing', title: 'Existing', status: 'not_started', order: 0 }],
        },
      ],
    };
    mockGoalFindUnique.mockResolvedValue(goalWithExistingSub);

    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'Second' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.order).toBe(1); // appended after existing substep
  });

  it('includes optional description when provided', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'With Desc', description: 'Some detail' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.description).toBe('Some detail');
  });

  it('sets order 0 when task has no existing substeps', async () => {
    const result = await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'First Sub' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.order).toBe(0);
  });

  it('calls prisma.goal.update with the new substep in the tasks', async () => {
    await executeAddSubstep(
      { goalId: 'goal-1', taskId: 'task-1', title: 'Check Update' },
      'clerk-1'
    );
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'goal-1' } })
    );
  });
});
