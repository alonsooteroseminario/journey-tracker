import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillDefinition } from '../progressAnalytics';

vi.mock('../../tools/getGoals');
vi.mock('../../tools/getActivity');

describe('progressAnalytics skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze progress with velocity and projections', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');
    const { executeGetActivity } = await import('../../tools/getActivity');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'goal-1',
          totalTasks: 10,
          completedTasks: 5,
        },
      ],
    });

    vi.mocked(executeGetActivity).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'activity-1',
          type: 'task_completed',
          timestamp: new Date('2024-01-05').toISOString(),
        },
        {
          id: 'activity-2',
          type: 'task_completed',
          timestamp: new Date('2024-01-03').toISOString(),
        },
        {
          id: 'activity-3',
          type: 'substep_completed',
          timestamp: new Date('2024-01-01').toISOString(),
        },
      ],
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.velocity).toBeGreaterThan(0);
    expect(data.remainingTasks).toBe(5);
    expect(data.projectedCompletion.days).toBeGreaterThan(0);
    expect(result.message).toContain('Progress Analytics');
  });

  it('should handle case with no activity', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');
    const { executeGetActivity } = await import('../../tools/getActivity');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: true,
      data: [{ id: 'goal-1', totalTasks: 10, completedTasks: 0 }],
    });

    vi.mocked(executeGetActivity).mockResolvedValue({
      success: true,
      data: [],
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.velocity).toBe(0);
    expect(data.projectedCompletion.date).toBeNull();
  });

  it('should handle completed goals', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');
    const { executeGetActivity } = await import('../../tools/getActivity');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: true,
      data: [{ id: 'goal-1', totalTasks: 10, completedTasks: 10 }],
    });

    vi.mocked(executeGetActivity).mockResolvedValue({
      success: true,
      data: [],
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.remainingTasks).toBe(0);
    expect(result.message).toContain('All tasks completed');
  });
});
