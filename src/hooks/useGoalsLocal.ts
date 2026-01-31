"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, Task, Substep, AppState, StreakData, DocumentItem, ActivityLogEntry, AnalyticsData, WeeklyProgress, MonthlyProgress, CostByPhase, VelocityPoint } from "@/types";
import {
  loadState,
  saveState,
  generateId,
  getToday,
  isToday,
  isYesterday,
  parseCostString,
  getWeekStart,
  addDays,
} from "@/lib/storage";

export function useGoals() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadState();
    const updatedStreak = checkAndUpdateStreak(savedState.streak);
    
    setState({
      ...savedState,
      streak: updatedStreak,
    });
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  const checkAndUpdateStreak = (streak: StreakData): StreakData => {
    if (!streak.lastActivityDate) {
      return streak;
    }

    if (isToday(streak.lastActivityDate) || isYesterday(streak.lastActivityDate)) {
      return streak;
    }

    return {
      ...streak,
      currentStreak: 0,
    };
  };

  const logActivity = useCallback((
    type: ActivityLogEntry["type"],
    goalId: string,
    description: string,
    taskId?: string,
    substepId?: string,
    metadata?: Record<string, unknown>
  ) => {
    const entry: ActivityLogEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      type,
      goalId,
      taskId,
      substepId,
      description,
      metadata,
    };

    setState((prev) => ({
      ...prev,
      activityLog: [...prev.activityLog, entry],
    }));
  }, []);

  const updateStreak = useCallback(() => {
    const today = getToday();
    
    setState((prev) => {
      if (isToday(prev.streak.lastActivityDate)) {
        return prev;
      }

      let newStreak = prev.streak.currentStreak;

      if (isYesterday(prev.streak.lastActivityDate)) {
        newStreak = prev.streak.currentStreak + 1;
      } else if (!prev.streak.lastActivityDate) {
        newStreak = 1;
      } else {
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, prev.streak.longestStreak);

      return {
        ...prev,
        streak: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: today,
          streakHistory: [...prev.streak.streakHistory, today],
        },
      };
    });
  }, []);

  // Goal Management
  const addGoal = useCallback((title: string, description?: string): Goal => {
    const newGoal: Goal = {
      id: generateId(),
      title,
      description,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: getToday(),
    };

    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));

    logActivity("goal_created", newGoal.id, `Created goal: ${title}`);

    return newGoal;
  }, [logActivity]);

  const addGoalWithTasks = useCallback((goal: Goal) => {
    const goalWithStartDate = {
      ...goal,
      startDate: goal.startDate || getToday(),
    };
    
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, goalWithStartDate],
    }));

    logActivity("goal_created", goal.id, `Created goal: ${goal.title}`);
  }, [logActivity]);

  const deleteGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;
        return {
          ...goal,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Task Management
  const addTask = useCallback(
    (goalId: string, title: string, description?: string) => {
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((goal) => {
          if (goal.id !== goalId) return goal;

          const newTask: Task = {
            id: generateId(),
            title,
            description,
            completed: false,
            order: goal.tasks.length + 1,
            substeps: [],
          };

          return {
            ...goal,
            tasks: [...goal.tasks, newTask],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  const updateTask = useCallback((goalId: string, taskId: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return { ...task, ...updates };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const reorderTasks = useCallback((goalId: string, reorderedTasks: Task[]) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: reorderedTasks,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const toggleTask = useCallback(
    (goalId: string, taskId: string) => {
      let taskTitle = "";
      
      setState((prev) => {
        const newGoals = prev.goals.map((goal) => {
          if (goal.id !== goalId) return goal;

          return {
            ...goal,
            tasks: goal.tasks.map((task) => {
              if (task.id !== taskId) return task;

              taskTitle = task.title;
              const newCompleted = !task.completed;

              return {
                ...task,
                completed: newCompleted,
                completedAt: newCompleted ? new Date().toISOString() : undefined,
                startDate: !task.startDate && newCompleted ? undefined : task.startDate,
              };
            }),
            updatedAt: new Date().toISOString(),
          };
        });

        return {
          ...prev,
          goals: newGoals,
        };
      });

      logActivity("task_completed", goalId, `Completed task: ${taskTitle}`, taskId);
      updateStreak();
    },
    [updateStreak, logActivity]
  );

  const deleteTask = useCallback((goalId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.filter((t) => t.id !== taskId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Substep Management
  const addSubstep = useCallback((goalId: string, taskId: string, title: string, description?: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;

            const newSubstep: Substep = {
              id: generateId(),
              title,
              description,
              completed: false,
              order: (task.substeps?.length || 0) + 1,
            };

            return {
              ...task,
              substeps: [...(task.substeps || []), newSubstep],
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const updateSubstep = useCallback((
    goalId: string,
    taskId: string,
    substepId: string,
    updates: Partial<Substep>
  ) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;

            return {
              ...task,
              substeps: task.substeps?.map((substep) => {
                if (substep.id !== substepId) return substep;
                return { ...substep, ...updates };
              }),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const toggleSubstep = useCallback((goalId: string, taskId: string, substepId: string) => {
    let substepTitle = "";

    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;

            return {
              ...task,
              substeps: task.substeps?.map((substep) => {
                if (substep.id !== substepId) return substep;

                substepTitle = substep.title;
                const newCompleted = !substep.completed;

                return {
                  ...substep,
                  completed: newCompleted,
                  completedAt: newCompleted ? new Date().toISOString() : undefined,
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    logActivity("substep_completed", goalId, `Completed substep: ${substepTitle}`, taskId, substepId);
    updateStreak();
  }, [updateStreak, logActivity]);

  const deleteSubstep = useCallback((goalId: string, taskId: string, substepId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;

            return {
              ...task,
              substeps: task.substeps?.filter((s) => s.id !== substepId),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Cost Management
  const updateTaskCost = useCallback((goalId: string, taskId: string, actualCost: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          tasks: goal.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return { ...task, actualCost };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    logActivity("cost_added", goalId, `Updated cost for task`, taskId, undefined, { cost: actualCost });
  }, [logActivity]);

  const updateSubstepCost = useCallback((
    goalId: string,
    taskId: string,
    substepId: string,
    cost: number
  ) => {
    updateSubstep(goalId, taskId, substepId, { cost });
    logActivity("cost_added", goalId, `Updated cost for substep`, taskId, substepId, { cost });
  }, [updateSubstep, logActivity]);

  // Document Management
  const updateDocumentStatus = useCallback(
    (goalId: string, docId: string, status: DocumentItem["status"]) => {
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((goal) => {
          if (goal.id !== goalId || !goal.documents) return goal;

          return {
            ...goal,
            documents: goal.documents.map((doc) =>
              doc.id === docId
                ? {
                    ...doc,
                    status,
                    obtainedDate: status === "obtained" ? getToday() : doc.obtainedDate,
                    submittedDate: status === "submitted" ? getToday() : doc.submittedDate,
                  }
                : doc
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  // Settings
  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      notificationsEnabled: enabled,
    }));
  }, []);

  // Profile Management
  const updateProfile = useCallback((updates: Partial<import("@/types").UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...updates,
      },
    }));
  }, []);

  // Friend Management
  const addFriend = useCallback((friend: import("@/types").Friend) => {
    setState((prev) => ({
      ...prev,
      friends: [...prev.friends, friend],
    }));
  }, []);

  const removeFriend = useCallback((friendId: string) => {
    setState((prev) => ({
      ...prev,
      friends: prev.friends.filter((f) => f.id !== friendId),
    }));
  }, []);

  const updateFriend = useCallback((friendId: string, updates: Partial<import("@/types").Friend>) => {
    setState((prev) => ({
      ...prev,
      friends: prev.friends.map((f) =>
        f.id === friendId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  // Invitation Management
  const createInvitation = useCallback(() => {
    const invitation: import("@/types").Invitation = {
      id: generateId(),
      code: generateId().substring(0, 8).toUpperCase(),
      createdDate: new Date().toISOString(),
      expiresDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      used: false,
    };

    setState((prev) => ({
      ...prev,
      invitations: [...prev.invitations, invitation],
    }));

    return invitation;
  }, []);

  const useInvitation = useCallback((code: string, userId: string) => {
    setState((prev) => ({
      ...prev,
      invitations: prev.invitations.map((inv) =>
        inv.code === code
          ? {
              ...inv,
              used: true,
              usedBy: userId,
              usedDate: new Date().toISOString(),
            }
          : inv
      ),
    }));
  }, []);

  // Social Share Management
  const addSocialShare = useCallback((platform: import("@/types").SocialShare["platform"], message: string) => {
    const share: import("@/types").SocialShare = {
      id: generateId(),
      platform,
      sharedDate: new Date().toISOString(),
      streakAtTime: state.streak.currentStreak,
      message,
    };

    setState((prev) => ({
      ...prev,
      socialShares: [...prev.socialShares, share],
      lastSocialShareReminder: getToday(),
    }));

    return share;
  }, [state.streak.currentStreak]);

  // Progress Calculations
  const getProgress = useCallback((goalId: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.tasks.length === 0) return 0;

    // Count both tasks and substeps for progress
    let totalItems = 0;
    let completedItems = 0;

    goal.tasks.forEach((task) => {
      const substeps = task.substeps || [];
      
      if (substeps.length > 0) {
        // If task has substeps, count substeps only (not the parent task)
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [state.goals]);

  const getTotalProgress = useCallback(() => {
    const allTasks = state.goals.flatMap((g) => g.tasks);
    if (allTasks.length === 0) return 0;

    // Count both tasks and substeps for total progress
    let totalItems = 0;
    let completedItems = 0;

    allTasks.forEach((task) => {
      const substeps = task.substeps || [];
      
      if (substeps.length > 0) {
        // If task has substeps, count substeps only (not the parent task)
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [state.goals]);

  const hasCompletedTaskToday = useCallback(() => {
    return isToday(state.streak.lastActivityDate);
  }, [state.streak.lastActivityDate]);

  // Analytics
  const getAnalytics = useCallback((goalId?: string): AnalyticsData => {
    const goals = goalId
      ? state.goals.filter((g) => g.id === goalId)
      : state.goals;

    const allTasks = goals.flatMap((g) => g.tasks);
    const allSubsteps = allTasks.flatMap((t) => t.substeps || []);

    // Keep original task counts for display purposes
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.completed).length;
    const totalSubsteps = allSubsteps.length;
    const completedSubsteps = allSubsteps.filter((s) => s.completed).length;

    // Calculate total items (tasks with substeps count substeps, tasks without count themselves)
    let totalItems = 0;
    let completedItems = 0;

    allTasks.forEach((task) => {
      const substeps = task.substeps || [];
      
      if (substeps.length > 0) {
        // If task has substeps, count substeps only
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        // If no substeps, count the task itself
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
      }
    });

    // Calculate costs
    let totalEstimatedCost = 0;
    let totalActualCost = 0;

    allTasks.forEach((task) => {
      if (task.cost) {
        totalEstimatedCost += parseCostString(task.cost);
      }
      if (task.estimatedCost) {
        totalEstimatedCost += task.estimatedCost;
      }
      if (task.actualCost) {
        totalActualCost += task.actualCost;
      }

      task.substeps?.forEach((substep) => {
        if (substep.estimatedCost) totalEstimatedCost += substep.estimatedCost;
        if (substep.cost) totalActualCost += substep.cost;
      });
    });

    // Calculate velocity and projections using total items (tasks + substeps)
    const streakHistory = state.streak.streakHistory;
    const uniqueDays = Array.from(new Set(streakHistory));
    const daysActive = uniqueDays.length;
    const averageTasksPerDay = daysActive > 0 ? completedItems / daysActive : 0;

    const remainingItems = totalItems - completedItems;
    const daysRemaining = averageTasksPerDay > 0
      ? Math.ceil(remainingItems / averageTasksPerDay)
      : null;

    const projectedCompletionDate = daysRemaining
      ? addDays(new Date(), daysRemaining).toISOString().split("T")[0]
      : null;

    // Use totalItems for completion rate (includes substeps)
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Weekly progress
    const weeklyProgress: WeeklyProgress[] = [];
    const activities = state.activityLog.filter(
      (a) => !goalId || a.goalId === goalId
    );

    // Group activities by week
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
      if (activity.type === "task_completed") {
        week.tasksCompleted++;
      } else if (activity.type === "substep_completed") {
        week.substepsCompleted++;
      } else if (activity.type === "cost_added" && activity.metadata?.cost) {
        week.costSpent += activity.metadata.cost as number;
      }
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
      if (activity.type === "task_completed") {
        month.tasksCompleted++;
      } else if (activity.type === "substep_completed") {
        month.substepsCompleted++;
      } else if (activity.type === "cost_added" && activity.metadata?.cost) {
        month.costSpent += activity.metadata.cost as number;
      }
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
      const estimated = task.cost ? parseCostString(task.cost) : (task.estimatedCost || 0);
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
      const velocity = (index + 1) > 0 ? cumulativeCompleted / (index + 1) : 0;

      velocityTrend.push({
        date,
        velocity: Math.round(velocity * 100) / 100,
        cumulativeCompleted,
      });
    });

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
    };
  }, [state.goals, state.streak.streakHistory, state.activityLog]);

  // Get activities for a specific date
  const getActivitiesForDate = useCallback((date: string) => {
    return state.activityLog.filter(
      (activity) => activity.date.split("T")[0] === date
    );
  }, [state.activityLog]);

  return {
    goals: state.goals,
    streak: state.streak,
    notificationsEnabled: state.notificationsEnabled,
    activityLog: state.activityLog,
    profile: state.profile,
    friends: state.friends,
    invitations: state.invitations,
    socialShares: state.socialShares,
    isLoaded,
    // Goal operations
    addGoal,
    addGoalWithTasks,
    deleteGoal,
    updateGoal,
    // Task operations
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    updateTaskCost,
    reorderTasks,
    // Substep operations
    addSubstep,
    updateSubstep,
    toggleSubstep,
    deleteSubstep,
    updateSubstepCost,
    // Document operations
    updateDocumentStatus,
    // Settings
    setNotificationsEnabled,
    // Profile operations
    updateProfile,
    // Friend operations
    addFriend,
    removeFriend,
    updateFriend,
    // Invitation operations
    createInvitation,
    useInvitation,
    // Social share operations
    addSocialShare,
    // Progress & Analytics
    getProgress,
    getTotalProgress,
    hasCompletedTaskToday,
    getAnalytics,
    getActivitiesForDate,
  };
}
