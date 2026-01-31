import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from './auth';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if no Clerk user is authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return existing user if found in database', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);

    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await getCurrentUser();

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkId: 'clerk-123' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should create new user if not found (first login)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-new' } as any);

    // First findUnique returns null (user doesn't exist)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const newUser = {
      id: 'user-new',
      clerkId: 'clerk-new',
      email: 'clerk-new@placeholder.com',
      name: 'New User',
    };
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as any);

    const result = await getCurrentUser();

    expect(result).toEqual(newUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId: 'clerk-new',
        email: 'clerk-new@placeholder.com',
        name: 'New User',
        streakData: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            streakHistory: [],
          },
        },
      },
    });
  });

  it('should handle race condition - P2002 error (CRITICAL)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-race' } as any);

    // First findUnique returns null
    // Create throws P2002 (another request created the user)
    // Second findUnique returns the user
    const mockUser = {
      id: 'user-race',
      clerkId: 'clerk-race',
      email: 'race@example.com',
      name: 'Race User',
    };

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null) // First call: user not found
      .mockResolvedValueOnce(mockUser as any); // Second call: user found

    const p2002Error = new Error('Unique constraint failed');
    (p2002Error as any).code = 'P2002';
    vi.mocked(prisma.user.create).mockRejectedValue(p2002Error);

    const result = await getCurrentUser();

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });

  it('should throw error if race condition retry fails', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-fail' } as any);

    // First findUnique returns null
    // Create throws P2002
    // Second findUnique also returns null (should never happen)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null) // First call
      .mockResolvedValueOnce(null); // Second call after race condition

    const p2002Error = new Error('Unique constraint failed');
    (p2002Error as any).code = 'P2002';
    vi.mocked(prisma.user.create).mockRejectedValue(p2002Error);

    await expect(getCurrentUser()).rejects.toThrow('Unique constraint failed');
  });

  it('should re-throw non-P2002 errors', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-error' } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const otherError = new Error('Database connection failed');
    vi.mocked(prisma.user.create).mockRejectedValue(otherError);

    await expect(getCurrentUser()).rejects.toThrow('Database connection failed');
    
    // Should NOT retry on non-P2002 errors
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should create user with placeholder email', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-placeholder' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const newUser = {
      id: 'user-placeholder',
      clerkId: 'clerk-placeholder',
      email: 'clerk-placeholder@placeholder.com',
      name: 'New User',
    };
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as any);

    await getCurrentUser();

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'clerk-placeholder@placeholder.com',
      }),
    });
  });

  it('should create user with streak data', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-streak' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const newUser = {
      id: 'user-streak',
      clerkId: 'clerk-streak',
      email: 'clerk-streak@placeholder.com',
      name: 'New User',
    };
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as any);

    await getCurrentUser();

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        streakData: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            streakHistory: [],
          },
        },
      }),
    });
  });

  it('should handle Clerk auth returning undefined userId', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: undefined } as any);

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should handle Clerk auth returning empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: '' } as any);

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
