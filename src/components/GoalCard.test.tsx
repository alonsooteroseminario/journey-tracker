import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalCard } from './GoalCard';
import { Goal, AnalyticsData, ActivityLogEntry } from '@/types';

describe('GoalCard', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    title: 'Learn Spanish',
    description: 'Complete B2 level',
    tasks: [
      {
        id: 'task-1',
        title: 'Complete Module 1',
        description: 'Basics',
        completed: true,
        order: 1,
        substeps: [],
      },
      {
        id: 'task-2',
        title: 'Complete Module 2',
        description: 'Intermediate',
        completed: false,
        order: 2,
        substeps: [],
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAnalytics: AnalyticsData = {
    totalTasks: 2,
    completedTasks: 1,
    totalSubsteps: 0,
    completedSubsteps: 0,
    totalEstimatedCost: 0,
    totalActualCost: 0,
    averageTasksPerDay: 1,
    projectedCompletionDate: null,
    daysRemaining: null,
    completionRate: 50,
    weeklyProgress: [],
    monthlyProgress: [],
    costByPhase: [],
    velocityTrend: [],
  };

  const mockActivityLog: ActivityLogEntry[] = [
    {
      id: 'activity-1',
      type: 'task_completed',
      goalId: 'goal-1',
      taskId: 'task-1',
      description: 'Completed Module 1',
      date: '2024-01-01T00:00:00Z',
    },
  ];

  const mockStreakHistory = ['2024-01-01', '2024-01-02'];

  const mockHandlers = {
    onToggleTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onAddTask: vi.fn(),
    onAddSubstep: vi.fn(),
    onUpdateSubstep: vi.fn(),
    onToggleSubstep: vi.fn(),
    onDeleteSubstep: vi.fn(),
    onDeleteGoal: vi.fn(),
    onUpdateDocumentStatus: vi.fn(),
    onReorderTasks: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render goal title and description', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Learn Spanish')).toBeInTheDocument();
      expect(screen.getByText('Complete B2 level')).toBeInTheDocument();
    });

    it('should display correct progress information', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('1 of 2 steps completed')).toBeInTheDocument();
    });

    it('should show completion celebration when progress is 100%', () => {
      const completedGoal = {
        ...mockGoal,
        tasks: mockGoal.tasks.map((t) => ({ ...t, completed: true })),
      };

      render(
        <GoalCard
          goal={completedGoal}
          progress={100}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Complete!')).toBeInTheDocument();
      expect(screen.getByTitle('Goal completed!')).toBeInTheDocument();
    });

    it('should count substeps correctly in progress', () => {
      const goalWithSubsteps: Goal = {
        ...mockGoal,
        tasks: [
          {
            id: 'task-1',
            title: 'Task with substeps',
            completed: false,
            order: 1,
            substeps: [
              {
                id: 'substep-1',
                title: 'Substep 1',
                completed: true,
                order: 1,
              },
              {
                id: 'substep-2',
                title: 'Substep 2',
                completed: false,
                order: 2,
              },
            ],
          },
        ],
      };

      render(
        <GoalCard
          goal={goalWithSubsteps}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('1 of 2 steps completed')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should toggle expand/collapse when clicking expand button', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      // Get the first (main goal) collapse button
      const expandButtons = screen.getAllByTitle('Collapse');
      const mainCollapseButton = expandButtons[0];
      fireEvent.click(mainCollapseButton);

      // Content should be hidden when collapsed
      expect(screen.queryByText('Complete Module 1')).not.toBeInTheDocument();

      // Click again to expand
      const collapseButtons = screen.getAllByTitle('Expand');
      const mainExpandButton = collapseButtons[0];
      fireEvent.click(mainExpandButton);

      // Content should be visible again
      expect(screen.getByText('Complete Module 1')).toBeInTheDocument();
    });

    it('should show delete confirmation modal when clicking delete button', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      const deleteButton = screen.getByTitle('Delete goal');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Goal?')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('should call onDeleteGoal when confirming deletion', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      // Open delete modal
      const deleteButton = screen.getByTitle('Delete goal');
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      expect(mockHandlers.onDeleteGoal).toHaveBeenCalledWith('goal-1');
    });

    it('should close delete modal when clicking cancel', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      // Open delete modal
      const deleteButton = screen.getByTitle('Delete goal');
      fireEvent.click(deleteButton);

      // Cancel deletion
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Delete Goal?')).not.toBeInTheDocument();
      expect(mockHandlers.onDeleteGoal).not.toHaveBeenCalled();
    });
  });

  describe('View Modes', () => {
    it('should switch to tasks view when clicking tasks tab', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      const tasksTab = screen.getByText('✅ Tasks');
      fireEvent.click(tasksTab);

      // Should show tasks (they're shown in both views, so just verify tab is active)
      expect(tasksTab).toHaveClass('bg-white', 'text-blue-600');
    });

    it('should switch to calendar view when clicking calendar tab', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      const calendarTab = screen.getByText('📅 Calendar');
      fireEvent.click(calendarTab);

      expect(calendarTab).toHaveClass('bg-white', 'text-blue-600');
    });

    it('should switch to analytics view when clicking analytics tab', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      const analyticsTab = screen.getByText('📈 Analytics');
      fireEvent.click(analyticsTab);

      expect(analyticsTab).toHaveClass('bg-white', 'text-blue-600');
    });
  });

  describe('Extended Goal Features', () => {
    it('should show phases tab for goals with phases', () => {
      const goalWithPhases: Goal = {
        ...mockGoal,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: 'First phase',
            taskIds: ['task-1'],
          },
        ],
      };

      render(
        <GoalCard
          goal={goalWithPhases}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('📊 Phases')).toBeInTheDocument();
    });

    it('should show resources tab for goals with resources', () => {
      const goalWithResources: Goal = {
        ...mockGoal,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: 'First phase',
            taskIds: ['task-1'],
          },
        ],
        resources: [],
      };

      render(
        <GoalCard
          goal={goalWithResources}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('ℹ️ Resources')).toBeInTheDocument();
    });

    it('should not show phases tab for goals without phases', () => {
      render(
        <GoalCard
          goal={mockGoal}
          progress={50}
          analytics={mockAnalytics}
          activityLog={mockActivityLog}
          streakHistory={mockStreakHistory}
          {...mockHandlers}
        />
      );

      expect(screen.queryByText('📊 Phases')).not.toBeInTheDocument();
    });
  });
});
