import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeleteSubstep } from './deleteSubstep';
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

// Factory to avoid shared mutable state: the source splices substeps in-place
function makeGoal() {
  return {
    id: 'goal-1',
    userId: USER.id,
    title: 'My Goal',
    tasks: [
      {
        id: 'task-1',
        title: 'Task One',
        status: 'todo',
        order: 0,
        substeps: [
          { id: 'sub-1', title: 'Sub One', status: 'not_started', order: 0 },
        ],
      },
    ],
  };
}

describe('executeDeleteSubstep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(makeGoal());
    mockGoalUpdate.mockResolvedValue({});
  });

  it('deletes substep successfully', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.deletedTitle).toBe('Sub One');
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' },
      undefined
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when any required ID missing', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: '' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Goal not found');
  });

  it('returns error when task not found', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'missing-task', substepId: 'sub-1' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Task not found');
  });

  it('returns error when substep not found', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'missing-sub' },
      'clerk-1'
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Substep not found');
  });

  it('returns data with all IDs on success', async () => {
    const result = await executeDeleteSubstep(
      { goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' },
      'clerk-1'
    );
    expect(result.success).toBe(true);
    expect(result.data.goalId).toBe('goal-1');
    expect(result.data.taskId).toBe('task-1');
    expect(result.data.substepId).toBe('sub-1');
  });

  it('refuses to delete a soft-locked substep', async () => {
    mockGoalFindUnique.mockResolvedValue({
      ...makeGoal(),
      tasks: [{
        id: 'task-1', title: 'Task One', status: 'todo', order: 0,
        substeps: [{ id: 'sub-1', title: 'Locked Sub', status: 'not_started', order: 0, lockLevel: 'soft' }],
      }],
    });
    const result = await executeDeleteSubstep({ goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Locked');
    expect(result.message).toContain('Locked Sub');
    expect(mockGoalUpdate).not.toHaveBeenCalled();
  });

  it('refuses to delete a hard-locked substep', async () => {
    mockGoalFindUnique.mockResolvedValue({
      ...makeGoal(),
      tasks: [{
        id: 'task-1', title: 'Task One', status: 'todo', order: 0,
        substeps: [{ id: 'sub-1', title: 'Hard Sub', status: 'not_started', order: 0, lockLevel: 'hard' }],
      }],
    });
    const result = await executeDeleteSubstep({ goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Locked');
    expect(mockGoalUpdate).not.toHaveBeenCalled();
  });

  it('allows deleting an unlocked substep', async () => {
    const result = await executeDeleteSubstep({ goalId: 'goal-1', taskId: 'task-1', substepId: 'sub-1' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(mockGoalUpdate).toHaveBeenCalledOnce();
  });
});
