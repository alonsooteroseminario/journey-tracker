import { describe, it, expect, beforeEach } from 'vitest';
import { conversationStore } from '../conversationStore';

describe('conversationStore', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    conversationStore.clearContext(userId);
  });

  it('should create context for new user', () => {
    const context = conversationStore.getContext(userId);

    expect(context).toMatchObject({
      userId,
      recentGoals: [],
      messageCount: 0,
    });
    expect(context.sessionStart).toBeInstanceOf(Date);
  });

  it('should set last goal ID', () => {
    conversationStore.setLastGoal(userId, 'goal-123');

    const context = conversationStore.getContext(userId);
    expect(context.lastGoalId).toBe('goal-123');
  });

  it('should add goal to recent goals', () => {
    conversationStore.setLastGoal(userId, 'goal-1');
    conversationStore.setLastGoal(userId, 'goal-2');

    const context = conversationStore.getContext(userId);
    expect(context.recentGoals).toEqual(['goal-2', 'goal-1']);
  });

  it('should not duplicate goals in recent list', () => {
    conversationStore.setLastGoal(userId, 'goal-1');
    conversationStore.setLastGoal(userId, 'goal-2');
    conversationStore.setLastGoal(userId, 'goal-1');

    const context = conversationStore.getContext(userId);
    expect(context.recentGoals).toEqual(['goal-2', 'goal-1']);
  });

  it('should maintain max 10 recent goals', () => {
    for (let i = 1; i <= 15; i++) {
      conversationStore.setLastGoal(userId, `goal-${i}`);
    }

    const context = conversationStore.getContext(userId);
    expect(context.recentGoals).toHaveLength(10);
    expect(context.recentGoals[0]).toBe('goal-15');
  });

  it('should set last task ID', () => {
    conversationStore.setLastTask(userId, 'task-123');

    const context = conversationStore.getContext(userId);
    expect(context.lastTaskId).toBe('task-123');
  });

  it('should increment message count', () => {
    conversationStore.incrementMessages(userId);
    conversationStore.incrementMessages(userId);
    conversationStore.incrementMessages(userId);

    const context = conversationStore.getContext(userId);
    expect(context.messageCount).toBe(3);
  });

  it('should clear context', () => {
    conversationStore.setLastGoal(userId, 'goal-1');
    conversationStore.incrementMessages(userId);
    conversationStore.clearContext(userId);

    const context = conversationStore.getContext(userId);
    expect(context.recentGoals).toHaveLength(0);
    expect(context.messageCount).toBe(0);
  });

  it('should generate context summary', () => {
    conversationStore.setLastGoal(userId, 'goal-1');
    conversationStore.setLastTask(userId, 'task-1');
    conversationStore.incrementMessages(userId);

    const summary = conversationStore.getContextSummary(userId);

    expect(summary).toContain('Last goal: goal-1');
    expect(summary).toContain('Last task: task-1');
    expect(summary).toContain('Messages: 1');
  });
});
