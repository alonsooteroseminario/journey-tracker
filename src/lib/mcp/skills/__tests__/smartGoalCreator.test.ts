import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillDefinition } from '../smartGoalCreator';

vi.mock('../../tools/createGoal');

describe('smartGoalCreator skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create goal with extracted data', async () => {
    const { executeCreateGoal } = await import('../../tools/createGoal');

    vi.mocked(executeCreateGoal).mockResolvedValue({
      success: true,
      data: {
        id: 'new-goal-id',
        title: 'Learn TypeScript',
      },
      message: 'Created goal: Learn TypeScript',
    });

    const result = await skillDefinition.execute(
      {
        extractedData: {
          title: 'Learn TypeScript',
          description: 'Master TypeScript fundamentals',
          tasks: [{ title: 'Read documentation', order: 0 }],
        },
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(executeCreateGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Learn TypeScript',
      }),
      'clerk-123'
    );
  });

  it('should return error when title is missing', async () => {
    const result = await skillDefinition.execute(
      {
        extractedData: {
          description: 'A goal without a title',
        },
      },
      'clerk-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
    expect(result.message).toContain('title for the goal');
  });

  it('should provide helpful tips for incomplete goals', async () => {
    const { executeCreateGoal } = await import('../../tools/createGoal');

    vi.mocked(executeCreateGoal).mockResolvedValue({
      success: true,
      data: { id: 'goal-id', title: 'Simple Goal' },
      message: 'Created goal: Simple Goal',
    });

    const result = await skillDefinition.execute(
      {
        extractedData: {
          title: 'Simple Goal',
        },
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('Tips:');
    expect(result.message).toContain('description');
    expect(result.message).toContain('tasks');
    expect(result.message).toContain('target date');
  });

  it('should not show tips when all fields provided', async () => {
    const { executeCreateGoal } = await import('../../tools/createGoal');

    vi.mocked(executeCreateGoal).mockResolvedValue({
      success: true,
      data: { id: 'goal-id', title: 'Complete Goal' },
      message: 'Created goal: Complete Goal',
    });

    const result = await skillDefinition.execute(
      {
        extractedData: {
          title: 'Complete Goal',
          description: 'Full description',
          tasks: [{ title: 'Task 1', order: 0 }],
          targetDate: '2024-12-31',
        },
      },
      'clerk-123'
    );

    expect(result.success).toBe(true);
    expect(result.message).not.toContain('Tips:');
  });
});
