import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/agent/pickGoalIcon', () => ({
  pickGoalIcon: vi.fn().mockResolvedValue('🎯'),
}));

describe('POST /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a goal with valid data', async () => {
    // Mock authenticated user
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma create
    const mockGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Test Goal',
      description: 'Test description',
      tasks: [],
      phases: null,
      budget: null,
      timeline: null,
      documents: null,
      resources: null,
      startDate: null,
      targetDate: null,
      isPublic: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.goal.create).mockResolvedValue(mockGoal as any);

    // Create request
    const requestBody = {
      title: 'Test Goal',
      description: 'Test description',
      tasks: [],
      isPublic: true,
    };
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: 'goal-123',
      title: 'Test Goal',
      description: 'Test description',
      icon: undefined,
      tasks: [],
      phases: null,
      budget: null,
      timeline: null,
      documents: null,
      resources: null,
      startDate: undefined,
      targetDate: undefined,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(prisma.goal.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        title: 'Test Goal',
        description: 'Test description',
        icon: '🎯',
        tasks: [],
        phases: undefined,
        budget: undefined,
        timeline: undefined,
        documents: undefined,
        resources: undefined,
        startDate: null,
        targetDate: null,
        isPublic: true,
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated user
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.goal.create).not.toHaveBeenCalled();
  });

  it('should return 400 if title is missing', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Create request with missing title
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ description: 'No title' }),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('title');
    expect(prisma.goal.create).not.toHaveBeenCalled();
  });

  it('should return 400 if title is too long', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Create request with title > 200 chars
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'a'.repeat(201) }),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('Title too long');
    expect(prisma.goal.create).not.toHaveBeenCalled();
  });

  it('should handle goals with dates', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma create
    const mockGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Goal with dates',
      description: null,
      tasks: [],
      phases: null,
      budget: null,
      timeline: null,
      documents: null,
      resources: null,
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2024-12-31'),
      isPublic: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.goal.create).mockResolvedValue(mockGoal as any);

    // Create request
    const requestBody = {
      title: 'Goal with dates',
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
    };
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.startDate).toBe('2024-01-01');
    expect(data.targetDate).toBe('2024-12-31');

    expect(prisma.goal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2024-12-31'),
      }),
    });
  });

  it('should return 500 if database error occurs', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma error
    vi.mocked(prisma.goal.create).mockRejectedValue(new Error('Database error'));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/goals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    // Execute
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});

describe('GET /api/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all goals for authenticated user', async () => {
    // Mock authenticated user
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma findMany
    const mockGoals = [
      {
        id: 'goal-1',
        userId: 'user-123',
        title: 'Goal 1',
        description: 'Description 1',
        tasks: [{ id: 'task-1', title: 'Task 1' }],
        phases: null,
        budget: null,
        timeline: null,
        documents: null,
        resources: null,
        startDate: null,
        targetDate: null,
        isPublic: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'goal-2',
        userId: 'user-123',
        title: 'Goal 2',
        description: null,
        tasks: [],
        phases: null,
        budget: null,
        timeline: null,
        documents: null,
        resources: null,
        startDate: new Date('2024-02-01'),
        targetDate: new Date('2024-02-28'),
        isPublic: false,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
      },
    ];
    vi.mocked(prisma.goal.findMany).mockResolvedValue(mockGoals as any);

    // Execute
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: 'goal-1',
      title: 'Goal 1',
      description: 'Description 1',
      tasks: [{ id: 'task-1', title: 'Task 1' }],
      phases: undefined,
      budget: undefined,
      timeline: undefined,
      documents: undefined,
      resources: undefined,
      startDate: undefined,
      targetDate: undefined,
      isPublic: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    expect(data[1].startDate).toBe('2024-02-01');
    expect(data[1].targetDate).toBe('2024-02-28');

    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock unauthenticated user
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    // Execute
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.goal.findMany).not.toHaveBeenCalled();
  });

  it('should return empty array if user has no goals', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock empty results
    vi.mocked(prisma.goal.findMany).mockResolvedValue([]);

    // Execute
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return 500 if database error occurs', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma error
    vi.mocked(prisma.goal.findMany).mockRejectedValue(new Error('Database error'));

    // Execute
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
