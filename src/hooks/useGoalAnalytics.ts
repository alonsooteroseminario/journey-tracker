"use client";

import { useCallback } from "react";
import {
  Goal,
  AnalyticsData,
  ActivityLogEntry,
  WeeklyProgress,
  MonthlyProgress,
  CostByPhase,
  VelocityPoint,
  GoalBreakdown,
  PhaseCompletion,
} from "@/types";
import { parseCostString, getWeekStart, addDays } from "@/lib/storage";

export function useGoalAnalytics(
  goals: Goal[],
  streakHistory: string[],
  activityLog: ActivityLogEntry[]
) {
  const getAnalytics = useCallback(
    (goalId?: string): AnalyticsData => {
      const filteredGoals = goalId
        ? goals.filter((g) => g.id === goalId)
        : goals;

      const allTasks = filteredGoals.flatMap((g) => g.tasks);
      const allSubsteps = allTasks.flatMap((t) => t.substeps || []);

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
      const totalSubsteps = allSubsteps.length;
      const completedSubsteps = allSubsteps.filter((s) => s.status === 'completed').length;

      let totalItems = 0;
      let completedItems = 0;

      allTasks.forEach ((task) => {
        const substeps = task.substeps || [];
        if (substeps.length > 0) {
          totalItems += substeps.length;
          completedItems += substeps.filter((s) => s.status === 'completed').length;
        } else {
          totalItems += 1;
          completedItems += task.status === 'completed' ? 1 : 0;
        }
      });

      let totalEstimatedCost = 0;
      let totalActualCost = 0;

      allTasks.forEach((task) => {
        if (task.cost) totalEstimatedCost += parseCostString(task.cost);
        if (task.estimatedCost) totalEstimatedCost += task.estimatedCost;
        if (task.actualCost) totalActualCost += task.actualCost;

        task.substeps?.forEach((substep) => {
          if (substep.estimatedCost) totalEstimatedCost += substep.estimatedCost;
          if (substep.cost) totalActualCost += substep.cost;
        });
      });

      const uniqueDays = Array.from(new Set(streakHistory));
      const daysActive = uniqueDays.length;
      const averageTasksPerDay = daysActive > 0 ? completedItems / daysActive : 0;

      const remainingItems = totalItems - completedItems;
      const daysRemaining =
        averageTasksPerDay > 0
          ? Math.ceil(remainingItems / averageTasksPerDay)
          : null;

      const projectedCompletionDate = daysRemaining
        ? addDays(new Date(), daysRemaining).toISOString().split("T")[0]
        : null;

      const completionRate =
        totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      // Weekly progress
      const weeklyProgress: WeeklyProgress[] = [];
      const activities = activityLog.filter(
        (a) => !goalId || a.goalId === goalId
      );

      const weekMap = new Map<string, WeeklyProgress>();
      activities.forEach((activity) => {
        const activityDate = new Date(activity.date);
        const weekStart = getWeekStart(activityDate);
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            weekStart: weekKey,
            weekEnd: addDays(weekStart, 6).toISOString().split("T")[0],
            tasksCompleted: 0,
            substepsCompleted: 0,
            costSpent: 0,
          });
        }

        const week = weekMap.get(weekKey)!;
        if (activity.type === "task_completed") week.tasksCompleted++;
        else if (activity.type === "substep_completed") week.substepsCompleted++;
        else if (activity.type === "cost_added" && activity.metadata?.cost)
          week.costSpent += activity.metadata.cost as number;
      });

      weekMap.forEach((value) => weeklyProgress.push(value));
      weeklyProgress.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      // Monthly progress
      const monthlyProgress: MonthlyProgress[] = [];
      const monthMap = new Map<string, MonthlyProgress>();

      activities.forEach((activity) => {
        const activityDate = new Date(activity.date);
        const monthKey = `${activityDate.getFullYear()}-${activityDate.getMonth()}`;

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: activityDate.toLocaleDateString("en-US", { month: "long" }),
            year: activityDate.getFullYear(),
            tasksCompleted: 0,
            substepsCompleted: 0,
            costSpent: 0,
          });
        }

        const month = monthMap.get(monthKey)!;
        if (activity.type === "task_completed") month.tasksCompleted++;
        else if (activity.type === "substep_completed") month.substepsCompleted++;
        else if (activity.type === "cost_added" && activity.metadata?.cost)
          month.costSpent += activity.metadata.cost as number;
      });

      monthMap.forEach((value) => monthlyProgress.push(value));

      // Cost by phase
      const costByPhase: CostByPhase[] = [];
      const phaseMap = new Map<string, CostByPhase>();

      allTasks.forEach((task) => {
        const phaseName = task.phase || "Other";
        if (!phaseMap.has(phaseName)) {
          phaseMap.set(phaseName, {
            phase: phaseName,
            estimated: 0,
            actual: 0,
            remaining: 0,
          });
        }

        const phase = phaseMap.get(phaseName)!;
        const estimated = task.cost
          ? parseCostString(task.cost)
          : task.estimatedCost || 0;
        const actual = task.actualCost || 0;

        phase.estimated += estimated;
        phase.actual += actual;
        phase.remaining = phase.estimated - phase.actual;
      });

      phaseMap.forEach((value) => costByPhase.push(value));

      // Velocity trend
      const velocityTrend: VelocityPoint[] = [];
      let cumulativeCompleted = 0;

      uniqueDays.sort().forEach((date, index) => {
        const dayActivities = activities.filter(
          (a) =>
            a.date.split("T")[0] === date &&
            (a.type === "task_completed" || a.type === "substep_completed")
        );

        cumulativeCompleted += dayActivities.length;
        const velocity =
          index + 1 > 0 ? cumulativeCompleted / (index + 1) : 0;

        velocityTrend.push({
          date,
          velocity: Math.round(velocity * 100) / 100,
          cumulativeCompleted,
        });
      });

      // Goal breakdown (only for global analytics, not individual goal)
      let goalBreakdown: GoalBreakdown[] | undefined;
      if (!goalId && filteredGoals.length > 0) {
        goalBreakdown = filteredGoals.map((goal) => {
          const goalTasks = goal.tasks;
          let goalTotalItems = 0;
          let goalCompletedItems = 0;

          goalTasks.forEach((task) => {
            const substeps = task.substeps || [];
            if (substeps.length > 0) {
              goalTotalItems += substeps.length;
              goalCompletedItems += substeps.filter((s) => s.status === 'completed').length;
            } else {
              goalTotalItems += 1;
              goalCompletedItems += task.status === 'completed' ? 1 : 0;
            }
          });

          return {
            goalId: goal.id,
            title: goal.title,
            completionRate: goalTotalItems > 0 ? Math.round((goalCompletedItems / goalTotalItems) * 100) : 0,
            tasksCompleted: goalCompletedItems,
            totalTasks: goalTotalItems,
          };
        });
      }

      // Phase completion (for goals with phases)
      let phaseCompletion: PhaseCompletion[] | undefined;
      const goalsWithPhases = filteredGoals.filter((g) => g.phases && g.phases.length > 0);
      if (goalsWithPhases.length > 0) {
        const phaseMap = new Map<string, { name: string; completed: number; total: number }>();

        goalsWithPhases.forEach((goal) => {
          goal.phases?.forEach((phase) => {
            const phaseTasks = goal.tasks.filter((t) => phase.taskIds.includes(t.id));
            let phaseTotal = 0;
            let phaseCompleted = 0;

            phaseTasks.forEach((task) => {
              const substeps = task.substeps || [];
              if (substeps.length > 0) {
                phaseTotal += substeps.length;
                phaseCompleted += substeps.filter((s) => s.status === 'completed').length;
              } else {
                phaseTotal += 1;
                phaseCompleted += task.status === 'completed' ? 1 : 0;
              }
            });

            if (!phaseMap.has(phase.id)) {
              phaseMap.set(phase.id, { name: phase.name, completed: 0, total: 0 });
            }
            const existing = phaseMap.get(phase.id)!;
            existing.completed += phaseCompleted;
            existing.total += phaseTotal;
          });
        });

        phaseCompletion = Array.from(phaseMap.entries()).map(([phaseId, data]) => ({
          phaseId,
          name: data.name,
          completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
          tasksCompleted: data.completed,
          totalTasks: data.total,
        }));
      }

      // Most productive day of week
      let mostProductiveDay: { day: string; count: number } | undefined;
      if (activities.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts = new Map<string, number>();

        activities
          .filter((a) => a.type === 'task_completed' || a.type === 'substep_completed')
          .forEach((activity) => {
            const date = new Date(activity.date);
            const dayName = dayNames[date.getDay()];
            dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
          });

        if (dayCounts.size > 0) {
          let maxDay = '';
          let maxCount = 0;
          dayCounts.forEach((count, day) => {
            if (count > maxCount) {
              maxCount = count;
              maxDay = day;
            }
          });
          mostProductiveDay = { day: maxDay, count: maxCount };
        }
      }

      return {
        totalTasks,
        completedTasks,
        totalSubsteps,
        completedSubsteps,
        totalEstimatedCost,
        totalActualCost,
        averageTasksPerDay: Math.round(averageTasksPerDay * 100) / 100,
        projectedCompletionDate,
        daysRemaining,
        completionRate: Math.round(completionRate * 100) / 100,
        weeklyProgress,
        monthlyProgress,
        costByPhase,
        velocityTrend,
        goalBreakdown,
        phaseCompletion,
        mostProductiveDay,
      };
    },
    [goals, streakHistory, activityLog]
  );

  return { getAnalytics };
}
