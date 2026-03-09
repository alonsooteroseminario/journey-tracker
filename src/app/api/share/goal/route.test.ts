import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    goal: { findUnique: vi.fn() },
    goalStreak: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/streaks/computeTier', () => ({
  computeGoalTier: vi.fn().mockReturnValue('silver'),
}));

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
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalStreakFindFirst = prisma.goalStreak.findFirst as ReturnType<typeof vi.fn>;

const GOAL_WITH_TASKS = {
  id: 'goal-1',
  title: 'Learn Spanish',
  icon: '🎯',
  userId: 'mongo-1',
  tasks: [
    { id: 't1', status: 'completed', substeps: [] },
    { id: 't2', status: 'todo', substeps: [] },
    { id: 't3', status: 'completed', substeps: [] },
  ],
};

describe('GET /api/share/goal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-1' });
    mockGoalFindUnique.mockResolvedValue(GOAL_WITH_TASKS);
    mockGoalStreakFindFirst.mockResolvedValue({ currentStreak: 7 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest('http://localhost/api/share/goal?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when goalId is missing', async () => {
    const req = new NextRequest('http://localhost/api/share/goal');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 PNG for valid goal', async () => {
    const req = new NextRequest('http://localhost/api/share/goal?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('renders fallback card when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/share/goal?goalId=nonexistent');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('renders card without streak when no streak exists', async () => {
    mockGoalStreakFindFirst.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/share/goal?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('computes progress correctly from tasks', async () => {
    // 2 of 3 tasks completed = 67%
    const req = new NextRequest('http://localhost/api/share/goal?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('handles tasks with substeps for progress', async () => {
    mockGoalFindUnique.mockResolvedValue({
      ...GOAL_WITH_TASKS,
      tasks: [
        { id: 't1', status: 'todo', substeps: [{ status: 'completed' }, { status: 'completed' }] },
        { id: 't2', status: 'todo', substeps: [{ status: 'todo' }, { status: 'todo' }] },
      ],
    });
    const req = new NextRequest('http://localhost/api/share/goal?goalId=goal-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
