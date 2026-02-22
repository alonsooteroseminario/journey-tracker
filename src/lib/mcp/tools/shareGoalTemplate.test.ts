// src/lib/mcp/tools/shareGoalTemplate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeShareGoalTemplate } from './shareGoalTemplate';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goal: { findUnique: vi.fn() },
    goalTemplate: { create: vi.fn() },
    feedItem: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockTemplateCreate = prisma.goalTemplate.create as ReturnType<typeof vi.fn>;
const mockFeedItemCreate = prisma.feedItem.create as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const GOAL = {
  id: 'goal-1',
  title: 'My Fitness Goal',
  description: 'Get fit',
  icon: '💪',
  tasks: [],
  phases: [],
  timeline: {},
  resources: {},
  userId: USER.id,
};
const TEMPLATE = { id: 'tpl-1', title: 'My Fitness Goal', visibility: 'friends' };

describe('executeShareGoalTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL);
    mockTemplateCreate.mockResolvedValue(TEMPLATE);
    mockFeedItemCreate.mockResolvedValue({});
  });

  it('creates a template from the goal', async () => {
    const result = await executeShareGoalTemplate({ goalId: 'goal-1' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('tpl-1');
    expect(result.data.title).toBe('My Fitness Goal');
    expect(mockTemplateCreate).toHaveBeenCalledOnce();
  });

  it('returns error when userId missing', async () => {
    const result = await executeShareGoalTemplate({ goalId: 'goal-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeShareGoalTemplate({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeShareGoalTemplate({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('strips goal_ prefix from goalId', async () => {
    await executeShareGoalTemplate({ goalId: 'goal_goal-1' }, 'clerk-1');
    expect(mockGoalFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});
