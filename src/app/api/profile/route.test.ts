import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user profile if authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-123',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Test bio',
      profileImage: 'https://example.com/image.jpg',
      location: 'San Francisco',
      timezone: 'America/Los_Angeles',
      joinedDate: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Test bio',
      profileImage: 'https://example.com/image.jpg',
      location: 'San Francisco',
      timezone: 'America/Los_Angeles',
      joinedDate: '2024-01-01',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 500 if database error occurs', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update profile with valid data', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Old Name',
      email: 'old@example.com',
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const updatedUser = {
      id: 'user-123',
      name: 'New Name',
      email: 'new@example.com',
      bio: 'Updated bio',
      profileImage: null,
      location: 'New York',
      timezone: 'America/New_York',
      joinedDate: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const requestBody = {
      name: 'New Name',
      email: 'new@example.com',
      bio: 'Updated bio',
      location: 'New York',
      timezone: 'America/New_York',
    };
    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('New Name');
    expect(data.email).toBe('new@example.com');
    expect(data.bio).toBe('Updated bio');
    expect(data.location).toBe('New York');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        name: 'New Name',
        email: 'new@example.com',
        bio: 'Updated bio',
        location: 'New York',
        timezone: 'America/New_York',
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return 400 if email format is invalid', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email format');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should return 400 if name exceeds max length', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'a'.repeat(101) }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should handle partial updates (only update provided fields)', async () => {
    const mockUser = { id: 'user-123', name: 'John', email: 'john@example.com' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const updatedUser = {
      id: 'user-123',
      name: 'John',
      email: 'john@example.com',
      bio: 'New bio only',
      profileImage: null,
      location: null,
      timezone: null,
      joinedDate: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    // Only update bio
    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio: 'New bio only' }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { bio: 'New bio only' },
    });
  });

  it('should handle empty update (no fields provided)', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'John',
      email: 'john@example.com',
      bio: null,
      profileImage: null,
      location: null,
      timezone: null,
      joinedDate: new Date('2024-01-01T00:00:00Z'),
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {},
    });
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
