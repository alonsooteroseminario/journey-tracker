import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('GET /api/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return activity log with default pagination', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockActivities = [
      {
        id: 'activity-1',
        userId: 'user-123',
        type: 'goal_created',
        action: 'Created goal "Test Goal"',
        goalId: 'goal-1',
        taskId: null,
        substepId: null,
        metadata: {},
        timestamp: new Date('2024-01-02T00:00:00Z'),
      },
      {
        id: 'activity-2',
        userId: 'user-123',
        type: 'task_completed',
        action: 'Completed task "Test Task"',
        goalId: 'goal-1',
        taskId: 'task-1',
        substepId: null,
        metadata: { goalTitle: 'Test Goal' },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      },
    ];
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue(mockActivities as any);

    const request = new NextRequest('http://localhost:3000/api/activity');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: 'activity-1',
      date: '2024-01-02T00:00:00.000Z',
      type: 'goal_created',
      goalId: 'goal-1',
      taskId: null,
      substepId: null,
      description: 'Created goal "Test Goal"',
      metadata: {},
    });

    // Verify default pagination (limit=50, offset=0)
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { timestamp: 'desc' },
      take: 50,
      skip: 0,
    });
  });

  it('should support custom pagination parameters', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/activity?limit=10&offset=20');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { timestamp: 'desc' },
      take: 10,
      skip: 20,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/activity');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
  });

  it('should return 400 if limit exceeds 100 (DoS protection)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/activity?limit=101');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('cannot exceed 100');
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
  });

  it('should return 400 if offset is negative', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/activity?offset=-1');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('must be non-negative');
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
  });

  it('should coerce string pagination parameters to numbers', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/activity?limit=25&offset=10');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { timestamp: 'desc' },
      take: 25,
      skip: 10,
    });
  });

  it('should return empty array if no activities', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/activity');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.findMany).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/activity');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /api/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create activity log with valid data', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockActivity = {
      id: 'activity-1',
      userId: 'user-123',
      type: 'goal_created',
      action: 'Created goal "New Goal"',
      goalId: 'goal-1',
      taskId: null,
      substepId: null,
      metadata: { goalTitle: 'New Goal' },
      timestamp: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.activityLog.create).mockResolvedValue(mockActivity as any);

    const requestBody = {
      type: 'goal_created',
      description: 'Created goal "New Goal"',
      goalId: 'goal-1',
      metadata: { goalTitle: 'New Goal' },
    };
    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: 'activity-1',
      date: '2024-01-01T00:00:00.000Z',
      type: 'goal_created',
      goalId: 'goal-1',
      taskId: null,
      substepId: null,
      description: 'Created goal "New Goal"',
      metadata: { goalTitle: 'New Goal' },
    });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        type: 'goal_created',
        action: 'Created goal "New Goal"',
        goalId: 'goal-1',
        taskId: undefined,
        substepId: undefined,
        metadata: { goalTitle: 'New Goal' },
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'goal_created', description: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });

  it('should return 400 if type is missing', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify({ description: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });

  it('should return 400 if description is missing', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'goal_created' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });

  it('should handle optional fields (taskId, substepId, metadata)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockActivity = {
      id: 'activity-1',
      userId: 'user-123',
      type: 'task_completed',
      action: 'Completed task',
      goalId: 'goal-1',
      taskId: 'task-1',
      substepId: 'substep-1',
      metadata: { extra: 'data' },
      timestamp: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.activityLog.create).mockResolvedValue(mockActivity as any);

    const requestBody = {
      type: 'task_completed',
      description: 'Completed task',
      goalId: 'goal-1',
      taskId: 'task-1',
      substepId: 'substep-1',
      metadata: { extra: 'data' },
    };
    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        type: 'task_completed',
        action: 'Completed task',
        goalId: 'goal-1',
        taskId: 'task-1',
        substepId: 'substep-1',
        metadata: { extra: 'data' },
      },
    });
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.activityLog.create).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'goal_created', description: 'Test', goalId: 'goal-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
