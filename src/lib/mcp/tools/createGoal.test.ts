import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCreateGoal } from './createGoal';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/activity', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logGoalCreated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/conversationStore', () => ({
  conversationStore: { setLastGoal: vi.fn() },
}));
vi.mock('@/lib/agent/pickGoalIcon', () => ({
  pickGoalIcon: vi.fn().mockResolvedValue('🎯'),
}));
vi.mock('@/lib/email/notifications', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalCreate = prisma.goal.create as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice', timezone: 'America/Toronto' };

function makeCreatedGoal(overrides: Record<string, any> = {}) {
  return {
    id: 'new-goal-1',
    userId: USER.id,
    title: 'Fitness Goal',
    description: null,
    icon: '🎯',
    tasks: [],
    startDate: null,
    targetDate: null,
    isPublic: true,
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  };
}

describe('executeCreateGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalCreate.mockResolvedValue(makeCreatedGoal());
  });

  it('creates a goal and returns success with goal data', async () => {
    const result = await executeCreateGoal({ title: 'Fitness Goal' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('new-goal-1');
    expect(result.data.title).toBe('Fitness Goal');
    expect(result.data.icon).toBe('🎯');
    expect(mockGoalCreate).toHaveBeenCalledOnce();
  });

  it('creates goal with tasks and generates IDs', async () => {
    const goalWithTasks = makeCreatedGoal({ tasks: [] });
    mockGoalCreate.mockResolvedValue(goalWithTasks);

    const result = await executeCreateGoal({
      title: 'Goal With Tasks',
      tasks: [{ title: 'Task 1', order: 0 }],
    }, 'clerk-1');

    expect(result.success).toBe(true);
    // The create call should include tasks with auto-generated IDs
    const createArgs = mockGoalCreate.mock.calls[0][0];
    expect(createArgs.data.tasks).toHaveLength(1);
    expect(createArgs.data.tasks[0].id).toBeTypeOf('string');
    expect(createArgs.data.tasks[0].status).toBe('not_started');
  });

  it('converts startDate and targetDate strings to Date objects', async () => {
    const goalWithDates = makeCreatedGoal({
      startDate: new Date('2024-03-01'),
      targetDate: new Date('2024-06-30'),
    });
    mockGoalCreate.mockResolvedValue(goalWithDates);

    const result = await executeCreateGoal({
      title: 'Goal With Dates',
      startDate: '2024-03-01',
      targetDate: '2024-06-30',
    }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.startDate).toBe('2024-03-01');
    expect(result.data.targetDate).toBe('2024-06-30');

    const createArgs = mockGoalCreate.mock.calls[0][0];
    expect(createArgs.data.startDate).toBeInstanceOf(Date);
    expect(createArgs.data.targetDate).toBeInstanceOf(Date);
  });

  it('sends email notification after creation', async () => {
    const { notify } = await import('@/lib/email/notifications');
    await executeCreateGoal({ title: 'Email Test Goal' }, 'clerk-1');

    expect(notify).toHaveBeenCalledWith(
      USER.id,
      'goalCreated',
      expect.objectContaining({ userName: USER.name, goalTitle: 'Fitness Goal' })
    );
  });

  it('returns error when userId missing', async () => {
    const result = await executeCreateGoal({ title: 'Test' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when user not found', async () => {
    mockResolveUser.mockResolvedValue(null);
    const result = await executeCreateGoal({ title: 'Test' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns validation error when title missing', async () => {
    const result = await executeCreateGoal({}, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns database error on exception', async () => {
    mockGoalCreate.mockRejectedValue(new Error('DB down'));
    const result = await executeCreateGoal({ title: 'Test' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('defaults isPublic to true when not provided', async () => {
    await executeCreateGoal({ title: 'Public Goal' }, 'clerk-1');
    const createArgs = mockGoalCreate.mock.calls[0][0];
    expect(createArgs.data.isPublic).toBe(true);
  });

  it('respects isPublic: false when provided', async () => {
    await executeCreateGoal({ title: 'Private Goal', isPublic: false }, 'clerk-1');
    const createArgs = mockGoalCreate.mock.calls[0][0];
    expect(createArgs.data.isPublic).toBe(false);
  });
});
