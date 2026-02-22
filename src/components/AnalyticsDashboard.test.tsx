import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import type { AnalyticsData } from '@/types';

const BASE_ANALYTICS: AnalyticsData = {
  totalTasks: 10,
  completedTasks: 5,
  totalSubsteps: 0,
  completedSubsteps: 0,
  totalEstimatedCost: 1000,
  totalActualCost: 600,
  averageTasksPerDay: 1.5,
  projectedCompletionDate: null,
  daysRemaining: null,
  completionRate: 50,
  weeklyProgress: [],
  monthlyProgress: [],
  costByPhase: [],
  velocityTrend: [],
};

describe('AnalyticsDashboard', () => {
  it('renders the Analytics header', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows goalTitle when provided', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} goalTitle="My Goal" />);
    expect(screen.getByText('My Goal')).toBeInTheDocument();
  });

  it('does not show goalTitle element when not provided', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('My Goal')).not.toBeInTheDocument();
  });

  it('shows completion rate percentage', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    const matches = screen.getAllByText('50%');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows tasks done and remaining counts', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.getByText('Tasks Done')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('shows metric cards - Completion Rate, Avg Tasks, Budget Spent, Days Remaining', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg. Tasks/Day')).toBeInTheDocument();
    expect(screen.getByText('Budget Spent')).toBeInTheDocument();
    expect(screen.getByText('Days Remaining')).toBeInTheDocument();
  });

  it('shows averageTasksPerDay formatted to 1 decimal', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('shows projected completion as "Not enough data" when null', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.getByText('Not enough data')).toBeInTheDocument();
  });

  it('shows projected completion date when provided (not "Not enough data")', () => {
    const analytics = { ...BASE_ANALYTICS, projectedCompletionDate: '2026-06-15' };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.queryByText('Not enough data')).not.toBeInTheDocument();
  });

  it('shows days remaining when provided', () => {
    const analytics = { ...BASE_ANALYTICS, daysRemaining: 42 };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('42 days from now')).toBeInTheDocument();
  });

  it('shows "Most Productive" metric when mostProductiveDay provided', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      mostProductiveDay: { day: 'Monday', count: 5 },
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Most Productive')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
  });

  it('does not show Most Productive metric when not provided', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('Most Productive')).not.toBeInTheDocument();
  });

  it('shows weekly progress section when weeklyProgress has items', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      weeklyProgress: [
        { weekStart: '2026-01-01', weekEnd: '2026-01-07', tasksCompleted: 3, substepsCompleted: 5, costSpent: 100 },
      ],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
  });

  it('does not show weekly progress section when weeklyProgress is empty', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('Weekly Progress')).not.toBeInTheDocument();
  });

  it('shows budget by phase section when costByPhase has items', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      costByPhase: [{ phase: 'Application', estimated: 500, actual: 300, remaining: 200 }],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Budget by Phase')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
  });

  it('does not show budget by phase section when costByPhase is empty', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('Budget by Phase')).not.toBeInTheDocument();
  });

  it('shows substeps overview when totalSubsteps > 0', () => {
    const analytics = { ...BASE_ANALYTICS, totalSubsteps: 8, completedSubsteps: 4 };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Substeps Overview')).toBeInTheDocument();
    expect(screen.getByText('4/8')).toBeInTheDocument();
  });

  it('does not show substeps overview when totalSubsteps is 0', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('Substeps Overview')).not.toBeInTheDocument();
  });

  it('shows goal breakdown when goalBreakdown provided', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      goalBreakdown: [{ goalId: 'g1', title: 'Goal One', completionRate: 75, tasksCompleted: 3, totalTasks: 4 }],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Goal Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Goal One')).toBeInTheDocument();
  });

  it('does not show goal breakdown when goalBreakdown is empty', () => {
    const analytics = { ...BASE_ANALYTICS, goalBreakdown: [] };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.queryByText('Goal Breakdown')).not.toBeInTheDocument();
  });

  it('shows phase completion when phaseCompletion provided', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      phaseCompletion: [{ phaseId: 'p1', name: 'Phase Alpha', completionRate: 60, tasksCompleted: 3, totalTasks: 5 }],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Phase Completion')).toBeInTheDocument();
    expect(screen.getByText('Phase Alpha')).toBeInTheDocument();
  });

  it('does not show phase completion when phaseCompletion is empty', () => {
    const analytics = { ...BASE_ANALYTICS, phaseCompletion: [] };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.queryByText('Phase Completion')).not.toBeInTheDocument();
  });

  it('shows velocity trend when velocityTrend has more than 1 point', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      velocityTrend: [
        { date: '2026-01-01', velocity: 2, cumulativeCompleted: 2 },
        { date: '2026-01-02', velocity: 3, cumulativeCompleted: 5 },
      ],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Velocity Trend')).toBeInTheDocument();
  });

  it('does not show velocity trend when velocityTrend has 0 or 1 point', () => {
    render(<AnalyticsDashboard analytics={BASE_ANALYTICS} />);
    expect(screen.queryByText('Velocity Trend')).not.toBeInTheDocument();
  });

  it('shows budget summary Estimated/Spent/Remaining labels when costByPhase present', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      costByPhase: [{ phase: 'Flight', estimated: 1000, actual: 600, remaining: 400 }],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Estimated')).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    const remainingEls = screen.getAllByText('Remaining');
    expect(remainingEls.length).toBeGreaterThan(0);
  });

  it('shows Over Budget when actual exceeds estimated', () => {
    const analytics = {
      ...BASE_ANALYTICS,
      totalEstimatedCost: 500,
      totalActualCost: 800,
      costByPhase: [{ phase: 'Housing', estimated: 500, actual: 800, remaining: -300 }],
    };
    render(<AnalyticsDashboard analytics={analytics} />);
    expect(screen.getByText('Over Budget')).toBeInTheDocument();
  });
});
