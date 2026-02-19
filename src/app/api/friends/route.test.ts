import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getCurrentUser
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

describe('GET /api/friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return friends list with stats', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockFriendships = [
      {
        id: 'friendship-1',
        userId: 'user-123',
        friendId: 'friend-1',
        status: 'accepted',
        addedDate: new Date('2024-01-01T00:00:00Z'),
        user: { id: 'user-123', name: 'Me' },
        friend: {
          id: 'friend-1',
          clerkId: 'clerk-friend-1',
          name: 'Friend One',
          email: 'friend1@example.com',
          profileImage: null,
          bio: 'Bio 1',
          location: 'SF',
          joinedDate: new Date('2024-01-01T00:00:00Z'),
        },
      },
    ];
    vi.mocked(prisma.friendship.findMany).mockResolvedValue(mockFriendships as any);

    const mockStreakData = {
      userId: 'friend-1',
      currentStreak: 5,
      longestStreak: 10,
    };
    vi.mocked(prisma.streakData.findUnique).mockResolvedValue(mockStreakData as any);

    const mockGoals = [
      { id: 'goal-1', userId: 'friend-1', isPublic: true, tasks: [{ status: 'completed' }] },
      { id: 'goal-2', userId: 'friend-1', isPublic: true, tasks: [{ status: 'not_started' }] },
    ];
    vi.mocked(prisma.goal.findMany).mockResolvedValue(mockGoals as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
      id: 'friend-1',
      clerkId: 'clerk-friend-1',
      name: 'Friend One',
      email: 'friend1@example.com',
      profileImage: null,
      bio: 'Bio 1',
      location: 'SF',
      joinedDate: '2024-01-01',
      friendshipId: 'friendship-1',
      addedDate: '2024-01-01',
      status: 'accepted',
      currentStreak: 5,
      longestStreak: 10,
      totalGoals: 2,
      completedGoals: 1,
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return empty array if user has no friends', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.friendship.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.friendship.findMany).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /api/friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add friend with valid invitation code', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockInvitation = {
      id: 'inv-1',
      code: 'ABC123',
      userId: 'friend-1',
      used: false,
      expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      user: { name: 'Friend Name' },
    };
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);
    vi.mocked(prisma.friendship.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.friendship.createMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.invitation.update).mockResolvedValue(mockInvitation as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, friendName: 'Friend Name' });

    // Verify bidirectional friendship created
    expect(prisma.friendship.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-123',
          friendId: 'friend-1',
          status: 'accepted',
        },
        {
          userId: 'friend-1',
          friendId: 'user-123',
          status: 'accepted',
        },
      ],
    });

    // Verify invitation marked as used
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        used: true,
        usedBy: 'clerk-123',
        usedAt: expect.any(Date),
      },
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if code is missing', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it('should return 404 if invitation code is invalid', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'INVALID' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Invalid invitation code' });
  });

  it('should return 400 if invitation already used', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockInvitation = {
      id: 'inv-1',
      code: 'ABC123',
      userId: 'friend-1',
      used: true, // Already used
      expiresAt: new Date(Date.now() + 86400000),
      user: { name: 'Friend' },
    };
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invitation already used' });
  });

  it('should return 400 if invitation is expired', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockInvitation = {
      id: 'inv-1',
      code: 'ABC123',
      userId: 'friend-1',
      used: false,
      expiresAt: new Date(Date.now() - 86400000), // Yesterday (expired)
      user: { name: 'Friend' },
    };
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invitation expired' });
  });

  it('should return 400 if trying to add yourself as friend', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockInvitation = {
      id: 'inv-1',
      code: 'ABC123',
      userId: 'user-123', // Same as current user
      used: false,
      expiresAt: new Date(Date.now() + 86400000),
      user: { name: 'Me' },
    };
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Cannot add yourself as friend' });
  });

  it('should return 400 if already friends', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    const mockInvitation = {
      id: 'inv-1',
      code: 'ABC123',
      userId: 'friend-1',
      used: false,
      expiresAt: new Date(Date.now() + 86400000),
      user: { name: 'Friend' },
    };
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

    // Already friends
    const existingFriendship = { id: 'friendship-1' };
    vi.mocked(prisma.friendship.findFirst).mockResolvedValue(existingFriendship as any);

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Already friends' });
    expect(prisma.friendship.createMany).not.toHaveBeenCalled();
  });

  it('should return 500 if database error occurs', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.invitation.findUnique).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/friends', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
