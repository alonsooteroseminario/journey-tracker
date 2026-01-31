import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('GET /api/goals/[goalId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return goal if user owns it', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock Prisma findFirst
    const mockGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Test Goal',
      description: 'Test description',
      tasks: [{ id: 'task-1', title: 'Task 1' }],
      phases: null,
      budget: null,
      timeline: null,
      documents: null,
      resources: null,
      startDate: new Date('2024-01-01'),
      targetDate: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      isPublic: true,
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);

    // Create request with params
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123');
    const params = Promise.resolve({ goalId: 'goal-123' });

    // Execute
    const response = await GET(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.id).toBe('goal-123');
    expect(data.title).toBe('Test Goal');
    expect(data.startDate).toBe('2024-01-01');

    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-123', userId: 'user-123' },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123');
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 404 if goal does not exist', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123');
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
  });

  it('should return 404 if user does not own the goal', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    
    // Prisma returns null because of userId mismatch in where clause
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-456');
    const params = Promise.resolve({ goalId: 'goal-456' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
  });
});

describe('PATCH /api/goals/[goalId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update goal with valid data', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Mock existing goal (ownership check)
    const existingGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Old Title',
    };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    // Mock updated goal
    const updatedGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'New Title',
      description: 'Updated description',
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
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
    vi.mocked(prisma.goal.update).mockResolvedValue(updatedGoal as any);

    // Create request
    const requestBody = {
      title: 'New Title',
      description: 'Updated description',
    };
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123', {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });
    const params = Promise.resolve({ goalId: 'goal-123' });

    // Execute
    const response = await PATCH(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.title).toBe('New Title');
    expect(data.description).toBe('Updated description');

    // Verify ownership was checked BEFORE updating
    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-123', userId: 'user-123' },
    });

    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: 'goal-123' },
      data: {
        title: 'New Title',
        description: 'Updated description',
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should return 404 if goal does not exist (ownership check)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Ownership check fails
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-999', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const params = Promise.resolve({ goalId: 'goal-999' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should prevent updating another user\'s goal (SECURITY FIX)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Ownership check fails because goal belongs to user-456
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-456', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Malicious Update' }),
    });
    const params = Promise.resolve({ goalId: 'goal-456' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    // Should return 404 (not 403) to prevent information disclosure
    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });

    // CRITICAL: Update should never be called
    expect(prisma.goal.update).not.toHaveBeenCalled();

    // Verify ownership check was performed with correct userId
    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-456', userId: 'user-123' },
    });
  });

  it('should return 400 if validation fails', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = { id: 'goal-123', userId: 'user-123' };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    // Invalid: title too long
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'a'.repeat(201) }),
    });
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('should handle nullable dates correctly', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = { id: 'goal-123', userId: 'user-123' };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);

    const updatedGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Goal',
      description: null,
      tasks: [],
      startDate: null,
      targetDate: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
    vi.mocked(prisma.goal.update).mockResolvedValue(updatedGoal as any);

    // Set dates to null
    const request = new NextRequest('http://localhost:3000/api/goals/goal-123', {
      method: 'PATCH',
      body: JSON.stringify({ startDate: null, targetDate: null }),
    });
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(200);
    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: 'goal-123' },
      data: {
        startDate: null,
        targetDate: null,
      },
    });
  });
});

describe('DELETE /api/goals/[goalId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete goal if user owns it', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const existingGoal = { id: 'goal-123', userId: 'user-123' };
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(existingGoal as any);
    vi.mocked(prisma.goal.delete).mockResolvedValue(existingGoal as any);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123');
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    expect(prisma.goal.delete).toHaveBeenCalledWith({
      where: { id: 'goal-123' },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-123');
    const params = Promise.resolve({ goalId: 'goal-123' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.goal.delete).not.toHaveBeenCalled();
  });

  it('should return 404 if goal does not exist', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-999');
    const params = Promise.resolve({ goalId: 'goal-999' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
    expect(prisma.goal.delete).not.toHaveBeenCalled();
  });

  it('should prevent deleting another user\'s goal (SECURITY)', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // Ownership check fails
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/goals/goal-456');
    const params = Promise.resolve({ goalId: 'goal-456' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Goal not found' });
    expect(prisma.goal.delete).not.toHaveBeenCalled();
  });
});
