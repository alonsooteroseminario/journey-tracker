import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetActivity } from '../getActivity';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');

describe('executeGetActivity', () => {
  const mockUser = { id: 'user-mongo-id', clerkId: 'clerk-123' };
  const mockActivities = [
    {
      id: 'activity-1',
      userId: 'user-mongo-id',
      type: 'task_completed',
      action: 'Completed task',
      goalId: 'goal-1',
      taskId: 'task-1',
      substepId: null,
      metadata: null,
      timestamp: new Date('2024-01-01'),
    },
    {
      id: 'activity-2',
      userId: 'user-mongo-id',
      type: 'goal_created',
      action: 'Created goal',
      goalId: 'goal-2',
      taskId: null,
      substepId: null,
      metadata: null,
      timestamp: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return activity log for user', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue(mockActivities as any);

    const result = await executeGetActivity({}, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].type).toBe('task_completed');
  });

  it('should respect limit parameter', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue(mockActivities as any);

    await executeGetActivity({ limit: 10 }, 'clerk-123');

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it('should filter by type when provided', async () => {
    const { resolveUser } = await import('@/lib/agent/resolveUser');

    vi.mocked(resolveUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue([mockActivities[0]] as any);

    await executeGetActivity({ type: 'task_completed' }, 'clerk-123');

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-mongo-id', type: 'task_completed' },
      })
    );
  });
});
