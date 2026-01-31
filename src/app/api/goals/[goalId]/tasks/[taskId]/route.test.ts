import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('PATCH /api/goals/[goalId]/tasks/[taskId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update task with valid data', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock existing goal with tasks
    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Test Goal',
      tasks: [
        {
          id: 'task-1',
          title: 'Old Task Title',
          description: 'Old description',
          completed: false,
          order: 0,
        },
        {
          id: 'task-2',
          title: 'Another Task',
          completed: false,
          order: 1,
        },
      ],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    // Mock updated goal
    const updatedGoal = {
      id: 'goal-123',
      title: 'Test Goal',
      tasks: [
        {
          id: 'task-1',
          title: 'Updated Task Title',
          description: 'Updated description',
          completed: true,
          order: 0,
        },
        {
          id: 'task-2',
          title: 'Another Task',
          completed: false,
          order: 1,
        },
      ],
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
    vi.mocked(prisma.goal.update).mockResolvedValue(updatedGoal as any);

    // Create request
    const requestBody = {
      title: 'Updated Task Title',
      description: 'Updated description',
      completed: true,
    };
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    // Execute
    const response = await PATCH(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.id).toBe('goal-123');
    expect(data.tasks[0].title).toBe('Updated Task Title');
    expect(data.tasks[0].completed).toBe(true);

    // Verify update was called with correct data
    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: 'goal-123' },
      data: {
        tasks: [
          {
            id: 'task-1',
            title: 'Updated Task Title',
            description: 'Updated description',
            completed: true,
            order: 0,
          },
          {
            id: 'task-2',
            title: 'Another Task',
            completed: false,
            order: 1,
          },
        ],
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should return 404 if goal does not exist', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-999/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const params = Promise.resolve({ goalId: 'goal-999', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should return 404 if user does not own the goal', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Ownership check fails
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-456/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Malicious Update' }),
    });
    const params = Promise.resolve({ goalId: 'goal-456', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should return 404 if task does not exist in goal', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-999', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-999' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Task not found' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should PREVENT id override attack (CRITICAL SECURITY FIX)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [
        { id: 'task-1', title: 'Task 1', order: 0 },
        { id: 'task-2', title: 'Task 2', order: 1 },
      ],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    // Malicious request trying to override task ID
    const maliciousBody = {
      id: 'task-2', // ⚠️ ATTACK: Trying to override task-1's ID to task-2
      title: 'Updated Title',
    };
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify(maliciousBody),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    // Execute
    const response = await PATCH(request, { params });

    // CRITICAL: Should return 400 (validation error) because UpdateTaskSchema.strict() blocks 'id' field
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();

    // CRITICAL: Update should NEVER be called with malicious data
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should return 400 if validation fails (title too long)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [{ id: 'task-1', title: 'Task 1' }],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'a'.repeat(201) }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should handle partial updates (only update provided fields)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [
        {
          id: 'task-1',
          title: 'Original Title',
          description: 'Original Description',
          completed: false,
          order: 0,
          notes: 'Original Notes',
        },
      ],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const updatedGoal = {
      id: 'goal-123',
      tasks: [
        {
          id: 'task-1',
          title: 'Original Title',
          description: 'Original Description',
          completed: true, // Only this changed
          order: 0,
          notes: 'Original Notes',
        },
      ],
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
    vi.mocked(prisma.goal.update).mockResolvedValue(updatedGoal as any);

    // Only update completed field
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    // Verify only completed was updated, other fields preserved
    const updateCall = vi.mocked(prisma.goal.update).mock.calls[0][0];
    const updatedTask = (updateCall.data.tasks as any[])[0];
    expect(updatedTask.completed).toBe(true);
    expect(updatedTask.title).toBe('Original Title');
    expect(updatedTask.description).toBe('Original Description');
    expect(updatedTask.notes).toBe('Original Notes');
  });

  it('should handle tasks array edge cases (empty tasks)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [], // Empty tasks array
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Task not found' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should handle nullable fields correctly', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          dueDate: '2024-12-31',
          completedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const updatedGoal = {
      id: 'goal-123',
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          dueDate: null,
          completedAt: null,
        },
      ],
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
    vi.mocked(prisma.goal.update).mockResolvedValue(updatedGoal as any);

    // Clear date fields
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ dueDate: null, completedAt: null }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);

    const updateCall = vi.mocked(prisma.goal.update).mock.calls[0][0];
    const updatedTask = (updateCall.data.tasks as any[])[0];
    expect(updatedTask.dueDate).toBeNull();
    expect(updatedTask.completedAt).toBeNull();
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      tasks: [{ id: 'task-1', title: 'Task 1' }],
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    // Mock database error
    vi.mocked(prisma.goal.update).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123/tasks/task-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const params = Promise.resolve({ goalId: 'goal-123', taskId: 'task-1' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
