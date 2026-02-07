import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateGoal } from '../createGoal';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/conversationStore');
vi.mock('@/lib/agent/auditLog');

describe('executeCreateGoal', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a goal with valid input', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { conversationStore } = await import('@/lib/agent/conversationStore');
    const { auditLogger } = await import('@/lib/agent/auditLog');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.create).mockResolvedValue({
      id: 'new-goal-id',
      title: 'New Goal',
      description: 'Description',
      tasks: [],
      startDate: new Date('2024-01-01'),
      targetDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(conversationStore.setLastGoal).mockImplementation(() => {});
    vi.mocked(auditLogger.logGoalCreated).mockImplementation(() => {});

    const result = await executeCreateGoal(
      {
        title: 'New Goal',
        description: 'Description',
        startDate: '2024-01-01',
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: 'new-goal-id',
      title: 'New Goal',
    });
    expect(auditLogger.logGoalCreated).toHaveBeenCalled();
  });

  it('should return error when userId is missing', async () => {
    const result = await executeCreateGoal({ title: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error when title is missing', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);

    const result = await executeCreateGoal({}, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('should generate IDs for tasks without IDs', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.create).mockResolvedValue({
      id: 'goal-id',
      title: 'Goal',
      tasks: [{ id: 'generated-id', title: 'Task 1', completed: false, order: 0 }],
      createdAt: new Date(),
    } as any);

    const result = await executeCreateGoal(
      {
        title: 'Goal',
        tasks: [{ title: 'Task 1', order: 0 }],
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    const createCall = vi.mocked(prisma.goal.create).mock.calls[0][0];
    expect((createCall.data.tasks as any)[0]).toHaveProperty('id');
  });

  it('should handle database errors', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.create).mockRejectedValue(new Error('DB error'));

    const result = await executeCreateGoal({ title: 'Test' }, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
