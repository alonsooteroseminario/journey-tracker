import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetGoalById } from '../getGoalById';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/conversationStore');

describe('executeGetGoalById', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };
  const mockGoal = {
    id: 'goal-1',
    title: 'Test Goal',
    description: 'Test Description',
    tasks: [{ id: 'task-1', title: 'Task 1', completed: false }],
    phases: null,
    budget: null,
    timeline: null,
    documents: null,
    resources: null,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isPublic: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return goal by ID for authenticated user', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    const { conversationStore } = await import('@/lib/agent/conversationStore');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(conversationStore.setLastGoal).mockImplementation(() => {});

    const result = await executeGetGoalById({ goalId: 'goal-1' }, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: 'goal-1',
      title: 'Test Goal',
    });
    expect(conversationStore.setLastGoal).toHaveBeenCalledWith('clerk-123', 'goal-1');
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetGoalById({ goalId: 'goal-1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error when goalId is missing', async () => {
    const result = await executeGetGoalById({} as any, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('should return error when goal not found', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const result = await executeGetGoalById({ goalId: 'nonexistent' }, 'clerk-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('should verify ownership by checking userId', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await executeGetGoalById({ goalId: 'goal-1' }, 'clerk-123');

    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'goal-1',
        userId: 'user-mongo-id',
      },
    });
  });
});
