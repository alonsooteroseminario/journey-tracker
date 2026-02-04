import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGetContext } from '../getContext';

vi.mock('@/lib/agent/conversationStore');

describe('executeGetContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return conversation context', async () => {
    const { conversationStore } = await import('@/lib/agent/conversationStore');

    vi.mocked(conversationStore.getContext).mockReturnValue({
      userId: 'clerk-123',
      lastGoalId: 'goal-1',
      lastTaskId: 'task-1',
      recentGoals: ['goal-1', 'goal-2'],
      sessionStart: new Date('2024-01-01T10:00:00'),
      messageCount: 5,
    });
    vi.mocked(conversationStore.getContextSummary).mockReturnValue(
      'Last goal: goal-1 | Recent goals: goal-1, goal-2 | Messages: 5'
    );

    const result = await executeGetContext({}, 'clerk-123');

    expect(result.success).toBe(true);
    expect(result.data.lastGoalId).toBe('goal-1');
    expect(result.data.messageCount).toBe(5);
    expect(result.data.recentGoals).toHaveLength(2);
  });

  it('should return error when userId is missing', async () => {
    const result = await executeGetContext({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
