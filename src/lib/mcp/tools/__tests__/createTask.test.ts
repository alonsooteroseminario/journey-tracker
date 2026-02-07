import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateTask } from '../createTask';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security');
vi.mock('@/lib/agent/auditLog');
vi.mock('@/lib/agent/conversationStore');

describe('executeCreateTask', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };
  const mockGoal = {
    id: 'goal-1',
    tasks: [
      { id: 'task-1', title: 'Existing Task', completed: false, order: 0, substeps: [] },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a task with required fields only', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'New Task' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.title).toBe('New Task');
    expect(data.completed).toBe(false);
    expect(data.order).toBe(1); // appended after existing task at order 0
    expect(data.substeps).toEqual([]);
    expect(data.id).toBeDefined();
    expect(result.message).toBe('Created task: New Task');
    expect(prisma.goal.update).toHaveBeenCalled();
  });

  it('should create a task with all optional fields', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);

    const result = await executeCreateTask(
      {
        goalId: 'goal-1',
        title: 'Full Task',
        description: 'A detailed description',
        priority: 'high',
        dueDate: '2026-03-15',
        notes: 'Some notes',
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.title).toBe('Full Task');
    expect(data.description).toBe('A detailed description');
    expect(data.priority).toBe('high');
    expect(data.dueDate).toBe('2026-03-15');
    expect(data.notes).toBe('Some notes');
  });

  it('should create a task on a goal with no existing tasks', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({ id: 'goal-1', tasks: [] } as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'First Task' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.order).toBe(0);
  });

  it('should strip goal_ prefix from goalId', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);

    const result = await executeCreateTask(
      { goalId: 'goal_goal-1', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(prisma.goal.findUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });

  it('should return error when userId is missing', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      undefined
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error when goalId is missing', async () => {
    const result = await executeCreateTask(
      { goalId: '', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('should return error when title is missing', async () => {
    const result = await executeCreateTask(
      { goalId: 'goal-1', title: '' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('should return error when user is not found in database', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(null as any);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('should return error when user does not own the goal', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(false);
    vi.mocked(auditLogger.logUnauthorizedAccess).mockImplementation(() => {});

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
    expect(auditLogger.logUnauthorizedAccess).toHaveBeenCalled();
  });

  it('should return error when goal is not found', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(null as any);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('should return database error on unexpected exception', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockRejectedValue(new Error('DB connection lost'));

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Task' },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should update conversation context on success', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { securityGuard } = await import('@/lib/agent/security');
    const { conversationStore } = await import('@/lib/agent/conversationStore');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(securityGuard.verifyOwnership).mockResolvedValue(true);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({} as any);

    const result = await executeCreateTask(
      { goalId: 'goal-1', title: 'Context Task' },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(conversationStore.setLastGoal).toHaveBeenCalledWith('clerk-123', 'goal-1');
    const data = result.data as any;
    expect(conversationStore.setLastTask).toHaveBeenCalledWith('clerk-123', data.id);
  });
});
