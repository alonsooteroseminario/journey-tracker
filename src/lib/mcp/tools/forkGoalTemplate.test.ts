// src/lib/mcp/tools/forkGoalTemplate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeForkGoalTemplate } from './forkGoalTemplate';
import { resolveUser } from '@/lib/agent/resolveUser';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    goalTemplate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    goal: { create: vi.fn() },
    goalFork: { create: vi.fn() },
    friendship: { findFirst: vi.fn() },
    feedItem: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockTemplateFindUnique = prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>;
const mockTemplateUpdate = prisma.goalTemplate.update as ReturnType<typeof vi.fn>;
const mockGoalCreate = prisma.goal.create as ReturnType<typeof vi.fn>;
const mockGoalForkCreate = prisma.goalFork.create as ReturnType<typeof vi.fn>;
const mockFriendshipFindFirst = prisma.friendship.findFirst as ReturnType<typeof vi.fn>;
const mockFeedItemCreate = prisma.feedItem.create as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const AUTHOR = { id: 'author-1', name: 'Bob' };

const PUBLIC_TEMPLATE = {
  id: 'tpl-1',
  title: 'Running Plan',
  description: 'A running plan',
  icon: '🏃',
  tasks: [],
  phases: [],
  timeline: {},
  resources: {},
  visibility: 'public',
  authorId: AUTHOR.id,
  forkCount: 5,
  author: AUTHOR,
};

const FRIENDS_TEMPLATE = {
  ...PUBLIC_TEMPLATE,
  id: 'tpl-2',
  visibility: 'friends',
};

const OWN_TEMPLATE = {
  ...PUBLIC_TEMPLATE,
  id: 'tpl-3',
  authorId: USER.id,
  author: { id: USER.id, name: USER.name },
};

const NEW_GOAL = {
  id: 'goal-new',
  title: 'Running Plan',
  userId: USER.id,
};

describe('executeForkGoalTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockTemplateFindUnique.mockResolvedValue(PUBLIC_TEMPLATE);
    mockGoalCreate.mockResolvedValue(NEW_GOAL);
    mockGoalForkCreate.mockResolvedValue({});
    mockTemplateUpdate.mockResolvedValue({ ...PUBLIC_TEMPLATE, forkCount: 6 });
    mockFriendshipFindFirst.mockResolvedValue(null);
    mockFeedItemCreate.mockResolvedValue({});
  });

  it('forks a public template into a new goal', async () => {
    const result = await executeForkGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.goalId).toBe('goal-new');
    expect(result.data.title).toBe('Running Plan');
    expect(mockGoalCreate).toHaveBeenCalledOnce();
    expect(mockGoalForkCreate).toHaveBeenCalledOnce();
    expect(mockTemplateUpdate).toHaveBeenCalledWith({
      where: { id: 'tpl-1' },
      data: { forkCount: { increment: 1 } },
    });
  });

  it('uses customTitle when provided', async () => {
    const result = await executeForkGoalTemplate(
      { templateId: 'tpl-1', customTitle: 'My Custom Running Plan' },
      'clerk-1'
    );

    expect(result.success).toBe(true);
    expect(mockGoalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'My Custom Running Plan' }),
      })
    );
  });

  it('resets task completion status when forking', async () => {
    const templateWithTasks = {
      ...PUBLIC_TEMPLATE,
      tasks: [
        { id: 't1', title: 'Task 1', completed: true, completedAt: '2026-01-01', substeps: [] },
        {
          id: 't2',
          title: 'Task 2',
          completed: false,
          substeps: [{ id: 's1', title: 'Sub 1', completed: true, completedAt: '2026-01-02' }],
        },
      ],
    };
    mockTemplateFindUnique.mockResolvedValue(templateWithTasks);

    await executeForkGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');

    const createCall = mockGoalCreate.mock.calls[0][0];
    const tasks = createCall.data.tasks as Array<{
      completed: boolean;
      completedAt: unknown;
      substeps: Array<{ completed: boolean; completedAt: unknown }>;
    }>;
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].completedAt).toBeUndefined();
    expect(tasks[1].substeps[0].completed).toBe(false);
    expect(tasks[1].substeps[0].completedAt).toBeUndefined();
  });

  it('returns error when userId missing', async () => {
    const result = await executeForkGoalTemplate({ templateId: 'tpl-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeForkGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns error when template not found', async () => {
    mockTemplateFindUnique.mockResolvedValue(null);
    const result = await executeForkGoalTemplate({ templateId: 'missing' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('returns error when friends-only template and no friendship exists', async () => {
    mockTemplateFindUnique.mockResolvedValue(FRIENDS_TEMPLATE);
    mockFriendshipFindFirst.mockResolvedValue(null);

    const result = await executeForkGoalTemplate({ templateId: 'tpl-2' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('allows forking friends-only template when friendship exists', async () => {
    mockTemplateFindUnique.mockResolvedValue(FRIENDS_TEMPLATE);
    mockFriendshipFindFirst.mockResolvedValue({ id: 'friendship-1' });

    const result = await executeForkGoalTemplate({ templateId: 'tpl-2' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(mockGoalCreate).toHaveBeenCalledOnce();
  });

  it('allows forking own friends-only template without friendship check', async () => {
    mockTemplateFindUnique.mockResolvedValue({ ...FRIENDS_TEMPLATE, authorId: USER.id });

    const result = await executeForkGoalTemplate({ templateId: 'tpl-2' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(mockFriendshipFindFirst).not.toHaveBeenCalled();
  });

  it('does not notify author when forking own template', async () => {
    const { notify } = await import('@/lib/email/notifications');
    mockTemplateFindUnique.mockResolvedValue(OWN_TEMPLATE);

    await executeForkGoalTemplate({ templateId: 'tpl-3' }, 'clerk-1');
    expect(notify).not.toHaveBeenCalled();
    expect(mockFeedItemCreate).not.toHaveBeenCalled();
  });

  it('notifies author when forking another user template', async () => {
    const { notify } = await import('@/lib/email/notifications');

    await executeForkGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(notify).toHaveBeenCalledWith(
      AUTHOR.id,
      'goalForked',
      expect.objectContaining({ forkerName: USER.name })
    );
  });

  it('returns taskCount in response data', async () => {
    const templateWithTasks = {
      ...PUBLIC_TEMPLATE,
      tasks: [
        { id: 't1', title: 'Task 1', completed: false, substeps: [] },
        { id: 't2', title: 'Task 2', completed: false, substeps: [] },
      ],
    };
    mockTemplateFindUnique.mockResolvedValue(templateWithTasks);

    const result = await executeForkGoalTemplate({ templateId: 'tpl-1' }, 'clerk-1');
    expect(result.success).toBe(true);
    expect(result.data.taskCount).toBe(2);
  });
});
