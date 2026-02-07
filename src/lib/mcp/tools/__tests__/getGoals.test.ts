import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetGoals } from '../getGoals';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');

describe('executeGetGoals', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };
  const mockGoals = [
    {
      id: 'goal-1',
      title: 'Goal 1',
      description: 'Description 1',
      tasks: [
        { id: 'task-1', title: 'Task 1', completed: true },
        { id: 'task-2', title: 'Task 2', completed: false },
      ],
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      isPublic: true,
    },
    {
      id: 'goal-2',
      title: 'Goal 2',
      description: null,
      tasks: [],
      startDate: null,
      targetDate: null,
      createdAt: new Date('2024-01-02'),
      isPublic: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return goals for authenticated user', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue(mockGoals as any);

    const result = await executeGetGoals({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      id: 'goal-1',
      title: 'Goal 1',
      totalTasks: 2,
      completedTasks: 1,
      completionPercentage: 50,
    });
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetGoals({});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return error when user not found in database', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(null);

    const result = await executeGetGoals({}, 'nonexistent-clerk-id');
    expect(result.success).toBe(false);
  });

  it('should return empty message when no goals exist', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue([]);

    const result = await executeGetGoals({}, 'clerk-123');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('should handle database errors gracefully', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');
    vi.mocked(resolveUser).mockRejectedValue(new Error('DB error'));

    const result = await executeGetGoals({}, 'clerk-123');
    expect(result.success).toBe(false);
  });
});
