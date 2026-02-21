import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeUpdateGoalIcon } from './updateGoalIcon';
import { resolveUser } from '@/lib/agent/resolveUser';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/agent/resolveUser');
vi.mock('@/lib/agent/security', () => ({
  securityGuard: { verifyOwnership: vi.fn().mockResolvedValue(true) },
}));
vi.mock('@/lib/agent/auditLog', () => ({
  auditLogger: {
    logUnauthorizedAccess: vi.fn(),
    logGoalUpdated: vi.fn(),
  },
}));
vi.mock('@/lib/agent/pickGoalIcon', () => ({
  pickGoalIcon: vi.fn().mockResolvedValue('🎯'),
  EMOJI_SET: ['🎯', '💪', '📚', '🏃', '✅'],
}));

const mockResolveUser = resolveUser as ReturnType<typeof vi.fn>;
const mockGoalFindUnique = prisma.goal.findUnique as ReturnType<typeof vi.fn>;
const mockGoalUpdate = prisma.goal.update as ReturnType<typeof vi.fn>;

const USER = { id: 'mongo-1', name: 'Alice' };
const GOAL = { id: 'goal-1', userId: USER.id, title: 'Fitness Goal', description: 'Get fit', icon: '💪' };

describe('executeUpdateGoalIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUser.mockResolvedValue(USER);
    mockGoalFindUnique.mockResolvedValue(GOAL);
    mockGoalUpdate.mockResolvedValue({ ...GOAL, icon: '🎯' });
  });

  it('uses explicit icon when provided and valid', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1', icon: '💪' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.icon).toBe('💪');
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { icon: '💪' } })
    );
  });

  it('uses AI-picked icon when no explicit icon provided', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1', hint: 'running' }, 'clerk-1');

    expect(result.success).toBe(true);
    expect(result.data.icon).toBe('🎯'); // from mock pickGoalIcon
  });

  it('returns error when userId missing', async () => {
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1' }, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when goalId missing', async () => {
    const result = await executeUpdateGoalIcon({ goalId: '' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('returns error when goal not found', async () => {
    mockGoalFindUnique.mockResolvedValue(null);
    const result = await executeUpdateGoalIcon({ goalId: 'goal-1' }, 'clerk-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});
