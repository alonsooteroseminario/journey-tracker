import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillDefinition } from '../goalSummary';

vi.mock('../../tools/getGoals');
vi.mock('../../tools/getStreaks');

describe('goalSummary skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate comprehensive goal summary', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');
    const { executeGetStreaks } = await import('../../tools/getStreaks');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'goal-1',
          title: 'Goal 1',
          totalTasks: 10,
          completedTasks: 5,
          completionPercentage: 50,
        },
        {
          id: 'goal-2',
          title: 'Goal 2',
          totalTasks: 5,
          completedTasks: 5,
          completionPercentage: 100,
        },
        {
          id: 'goal-3',
          title: 'Goal 3',
          totalTasks: 8,
          completedTasks: 0,
          completionPercentage: 0,
        },
      ],
    });

    vi.mocked(executeGetStreaks).mockResolvedValue({
      success: true,
      data: {
        currentStreak: 7,
        longestStreak: 15,
        lastActivityDate: '2024-01-01',
        streakHistory: [],
      },
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.overview.totalGoals).toBe(3);
    expect(data.overview.totalTasks).toBe(23);
    expect(data.overview.completedTasks).toBe(10);
    expect(data.overview.currentStreak).toBe(7);
    expect(data.goalBreakdown.completed).toBe(1);
    expect(data.goalBreakdown.inProgress).toBe(1);
    expect(data.goalBreakdown.notStarted).toBe(1);
    expect(result.message).toContain('Goal Summary Report');
  });

  it('should handle empty goals list', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');
    const { executeGetStreaks } = await import('../../tools/getStreaks');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(executeGetStreaks).mockResolvedValue({
      success: true,
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakHistory: [],
      },
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(true);
    const data = result.data as any;
    expect(data.overview.totalGoals).toBe(0);
  });

  it('should return error when getGoals fails', async () => {
    const { executeGetGoals } = await import('../../tools/getGoals');

    vi.mocked(executeGetGoals).mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const result = await skillDefinition.execute({}, 'clerk-123');

    expect(result.success).toBe(false);
  });
});
