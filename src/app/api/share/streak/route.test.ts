import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goalStreak: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    goal: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock computeGoalTier
vi.mock('@/lib/streaks/computeTier', () => ({
  computeGoalTier: vi.fn().mockReturnValue('silver'),
}));

// Mock ImageResponse — just return a fake Response
vi.mock('next/og', () => ({
  ImageResponse: vi.fn().mockImplementation(() => new Response('fake-image', {
    status: 200,
    headers: { 'content-type': 'image/png' },
  })),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GET } from './route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any;
const mockGoalStreakFindFirst = prisma.goalStreak.findFirst as ReturnType<typeof vi.fn>;
const mockGoalStreakFindMany = prisma.goalStreak.findMany as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;

describe('GET /api/share/streak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest('http://localhost/api/share/streak');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 PNG for authenticated request (global)', async () => {
    mockGoalStreakFindMany.mockResolvedValue([
      { currentStreak: 7 },
    ]);
    const req = new NextRequest('http://localhost/api/share/streak');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('returns 200 PNG for authenticated request with goalId', async () => {
    mockGoalFindUnique.mockResolvedValue({ id: 'goal-1', title: 'My Goal', userId: 'mongo-1' });
    mockGoalStreakFindFirst.mockResolvedValue({ currentStreak: 14 });
    const req = new NextRequest('http://localhost/api/share/streak?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('renders fallback card when streak not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    mockGoalStreakFindFirst.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/share/streak?goalId=nonexistent');
    const res = await GET(req);
    // Should still render (fallback 0 streak), not 404
    expect(res.status).toBe(200);
  });
});
