"use client";

import { useCallback, useMemo } from "react";
import {
  Goal,
  Task,
  Substep,
  StreakData,
  DocumentItem,
  ActivityLogEntry,
  AnalyticsData,
  WeeklyProgress,
  MonthlyProgress,
  CostByPhase,
  VelocityPoint,
  UserProfile,
  Friend,
  Invitation,
  SocialShare,
} from "@/types";
import {
  generateId,
  getToday,
  isToday,
  isYesterday,
  parseCostString,
  getWeekStart,
  addDays,
} from "@/lib/storage";
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} from "@/store/slices/goalsSlice";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/store/slices/profileSlice";
import {
  useGetFriendsQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
  useCreateInvitationMutation,
  useGetInvitationsQuery,
} from "@/store/slices/friendsSlice";
import {
  useGetStreakQuery,
  useUpdateStreakMutation,
  useGetActivityLogQuery,
  useLogActivityMutation,
} from "@/store/slices/streaksSlice";

// ==========================================
// Default fallback values (used while loading)
// ==========================================
const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakHistory: [],
};

const defaultProfile: UserProfile = {
  id: "",
  name: "Loading...",
  joinedDate: getToday(),
};

/**
 * useGoals - Backward-compatible hook that wraps RTK Query.
 *
 * Every page that used the old localStorage-based useGoals()
 * continues to work without any code changes. Under the hood,
 * data now flows through: Redux Store -> RTK Query -> API Routes -> Prisma -> MongoDB
 */
export function useGoals() {
  // ==========================================
  // RTK Query hooks (fetch data from API)
  // ==========================================
  const {
    data: apiGoals,
    isLoading: goalsLoading,
    refetch: refetchGoals,
  } = useGetGoalsQuery();

  const {
    data: apiProfile,
    isLoading: profileLoading,
  } = useGetProfileQuery();

  const {
    data: apiStreak,
    isLoading: streakLoading,
  } = useGetStreakQuery();

  const {
    data: apiFriends,
    isLoading: friendsLoading,
  } = useGetFriendsQuery();

  const {
    data: apiActivity,
    isLoading: activityLoading,
  } = useGetActivityLogQuery({});

  const {
    data: apiInvitations,
  } = useGetInvitationsQuery();

  // ==========================================
  // RTK Query mutations
  // ==========================================
  const [createGoalMutation] = useCreateGoalMutation();
  const [updateGoalMutation] = useUpdateGoalMutation();
  const [deleteGoalMutation] = useDeleteGoalMutation();
  const [updateProfileMutation] = useUpdateProfileMutation();
  const [addFriendMutation] = useAddFriendMutation();
  const [removeFriendMutation] = useRemoveFriendMutation();
  const [createInvitationMutation] = useCreateInvitationMutation();
  const [updateStreakMutation] = useUpdateStreakMutation();
  const [logActivityMutation] = useLogActivityMutation();

  // ==========================================
  // Derived state (same shape as old hook)
  // ==========================================
  const goals: Goal[] = useMemo(() => apiGoals || [], [apiGoals]);
  const profile: UserProfile = useMemo(
    () => apiProfile || defaultProfile,
    [apiProfile]
  );
  const streak: StreakData = useMemo(
    () => apiStreak || defaultStreak,
    [apiStreak]
  );

  // Map API friends to the existing Friend type
  const friends: Friend[] = useMemo(
    () =>
      (apiFriends || []).map((f: any) => ({
        id: f.id,
        profileId: f.clerkId || f.id,
        name: f.name,
        profileImage: f.profileImage,
        currentStreak: f.currentStreak ?? 0,
        longestStreak: f.longestStreak ?? 0,
        totalGoals: f.totalGoals ?? 0,
        completedGoals: f.completedGoals ?? 0,
        addedDate: f.addedDate || getToday(),
        sharedData: undefined, // Full data fetched on friend profile page
      })),
    [apiFriends]
  );

  const activityLog: ActivityLogEntry[] = useMemo(
    () => apiActivity || [],
    [apiActivity]
  );

  const invitations: Invitation[] = useMemo(
    () => apiInvitations || [],
    [apiInvitations]
  );

  const isLoaded =
    !goalsLoading && !profileLoading && !streakLoading && !friendsLoading;

  // ==========================================
  // Helper: log activity + update streak
  // ==========================================
  const logActivity = useCallback(
    (
      type: ActivityLogEntry["type"],
      goalId: string,
      description: string,
      taskId?: string,
      substepId?: string,
      metadata?: Record<string, unknown>
    ) => {
      logActivityMutation({ type, description, goalId, taskId, substepId, metadata });
    },
    [logActivityMutation]
  );

  const triggerStreakUpdate = useCallback(() => {
    updateStreakMutation();
  }, [updateStreakMutation]);

  // ==========================================
  // Goal Management
  // ==========================================
  const addGoal = useCallback(
    async (title: string, description?: string, phases?: Goal["phases"]): Promise<Goal> => {
      const result = await createGoalMutation({
        title,
        description,
        tasks: [],
        startDate: getToday(),
        phases,
      }).unwrap();

      return result as Goal;
    },
    [createGoalMutation]
  );

  const addGoalWithTasks = useCallback(
    (goal: Goal) => {
      createGoalMutation({
        title: goal.title,
        description: goal.description,
        tasks: goal.tasks,
        phases: goal.phases,
        budget: goal.budget,
        timeline: goal.timeline,
        documents: goal.documents,
        resources: goal.resources,
        startDate: goal.startDate || getToday(),
        targetDate: goal.targetDate,
      });
    },
    [createGoalMutation]
  );

  const deleteGoal = useCallback(
    (goalId: string) => {
      deleteGoalMutation(goalId);
    },
    [deleteGoalMutation]
  );

  const updateGoal = useCallback(
    (goalId: string, updates: Partial<Goal>) => {
      updateGoalMutation({
        id: goalId,
        updates: { ...updates, updatedAt: new Date().toISOString() },
      });
    },
    [updateGoalMutation]
  );

  // ==========================================
  // Task Management
  // ==========================================
  const addTask = useCallback(
    (goalId: string, title: string, description?: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const newTask: Task = {
        id: generateId(),
        title,
        description,
        completed: false,
        order: goal.tasks.length + 1,
        substeps: [],
      };

      updateGoalMutation({
        id: goalId,
        updates: {
          tasks: [...goal.tasks, newTask],
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [goals, updateGoalMutation]
  );

  const updateTask = useCallback(
    (goalId: string, taskId: string, updates: Partial<Task>) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return { ...task, ...updates };
      });

      updateGoalMutation({
        id: goalId,
        updates: {
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [goals, updateGoalMutation]
  );

  const reorderTasks = useCallback(
    (goalId: string, reorderedTasks: Task[]) => {
      updateGoalMutation({
        id: goalId,
        updates: {
          tasks: reorderedTasks,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [updateGoalMutation]
  );

  const toggleTask = useCallback(
    (goalId: string, taskId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      let taskTitle = "";
      let wasCompleted = false;
      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        taskTitle = task.title;
        wasCompleted = task.completed;
        const newCompleted = !task.completed;
        return {
          ...task,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined,
        };
      });

      updateGoalMutation({
        id: goalId,
        updates: {
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        },
      });

      // Only log completion and update streak when completing (not un-completing)
      if (!wasCompleted) {
        logActivity("task_completed", goalId, `Completed task: ${taskTitle}`, taskId);
        triggerStreakUpdate();
      } else {
        logActivity("task_uncompleted", goalId, `Uncompleted task: ${taskTitle}`, taskId);
      }
    },
    [goals, updateGoalMutation, logActivity, triggerStreakUpdate]
  );

  const deleteTask = useCallback(
    (goalId: string, taskId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      updateGoalMutation({
        id: goalId,
        updates: {
          tasks: goal.tasks.filter((t) => t.id !== taskId),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [goals, updateGoalMutation]
  );

  // ==========================================
  // Substep Management
  // ==========================================
  const addSubstep = useCallback(
    (goalId: string, taskId: string, title: string, description?: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedTasks = goal.tasks.map((task) => {
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
      });

      updateGoalMutation({
        id: goalId,
        updates: { tasks: updatedTasks, updatedAt: new Date().toISOString() },
      });
    },
    [goals, updateGoalMutation]
  );

  const updateSubstep = useCallback(
    (goalId: string, taskId: string, substepId: string, updates: Partial<Substep>) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          substeps: task.substeps?.map((substep) => {
            if (substep.id !== substepId) return substep;
            return { ...substep, ...updates };
          }),
        };
      });

      updateGoalMutation({
        id: goalId,
        updates: { tasks: updatedTasks, updatedAt: new Date().toISOString() },
      });
    },
    [goals, updateGoalMutation]
  );

  const toggleSubstep = useCallback(
    (goalId: string, taskId: string, substepId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      let substepTitle = "";
      let wasCompleted = false;
      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          substeps: task.substeps?.map((substep) => {
            if (substep.id !== substepId) return substep;
            substepTitle = substep.title;
            wasCompleted = substep.completed;
            const newCompleted = !substep.completed;
            return {
              ...substep,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : undefined,
            };
          }),
        };
      });

      updateGoalMutation({
        id: goalId,
        updates: { tasks: updatedTasks, updatedAt: new Date().toISOString() },
      });

      // Only log completion and update streak when completing (not un-completing)
      if (!wasCompleted) {
        logActivity(
          "substep_completed",
          goalId,
          `Completed substep: ${substepTitle}`,
          taskId,
          substepId
        );
        triggerStreakUpdate();
      } else {
        logActivity(
          "substep_uncompleted",
          goalId,
          `Uncompleted substep: ${substepTitle}`,
          taskId,
          substepId
        );
      }
    },
    [goals, updateGoalMutation, logActivity, triggerStreakUpdate]
  );

  const deleteSubstep = useCallback(
    (goalId: string, taskId: string, substepId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          substeps: task.substeps?.filter((s) => s.id !== substepId),
        };
      });

      updateGoalMutation({
        id: goalId,
        updates: { tasks: updatedTasks, updatedAt: new Date().toISOString() },
      });
    },
    [goals, updateGoalMutation]
  );

  // ==========================================
  // Cost Management
  // ==========================================
  const updateTaskCost = useCallback(
    (goalId: string, taskId: string, actualCost: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedTasks = goal.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return { ...task, actualCost };
      });

      updateGoalMutation({
        id: goalId,
        updates: { tasks: updatedTasks, updatedAt: new Date().toISOString() },
      });

      logActivity("cost_added", goalId, `Updated cost for task`, taskId, undefined, {
        cost: actualCost,
      });
    },
    [goals, updateGoalMutation, logActivity]
  );

  const updateSubstepCost = useCallback(
    (goalId: string, taskId: string, substepId: string, cost: number) => {
      updateSubstep(goalId, taskId, substepId, { cost });
      logActivity("cost_added", goalId, `Updated cost for substep`, taskId, substepId, {
        cost,
      });
    },
    [updateSubstep, logActivity]
  );

  // ==========================================
  // Document Management
  // ==========================================
  const updateDocumentStatus = useCallback(
    (goalId: string, docId: string, status: DocumentItem["status"]) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || !goal.documents) return;

      const updatedDocuments = goal.documents.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status,
              obtainedDate: status === "obtained" ? getToday() : doc.obtainedDate,
              submittedDate: status === "submitted" ? getToday() : doc.submittedDate,
            }
          : doc
      );

      updateGoalMutation({
        id: goalId,
        updates: { documents: updatedDocuments, updatedAt: new Date().toISOString() },
      });
    },
    [goals, updateGoalMutation]
  );

  // ==========================================
  // Settings
  // ==========================================
  const setNotificationsEnabled = useCallback((_enabled: boolean) => {
    // Notifications stored as user preference - could be persisted via profile API
    // For now this is a no-op on server; the UI still toggles locally
  }, []);

  // ==========================================
  // Profile Management
  // ==========================================
  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      updateProfileMutation(updates);
    },
    [updateProfileMutation]
  );

  // ==========================================
  // Friend Management
  // ==========================================
  const addFriend = useCallback(
    (friend: Friend) => {
      // In the new system, friends are added via invite code
      // This maintains backward compatibility for the UI
      addFriendMutation({ code: friend.profileId });
    },
    [addFriendMutation]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      removeFriendMutation(friendId);
    },
    [removeFriendMutation]
  );

  const updateFriend = useCallback(
    (_friendId: string, _updates: Partial<Friend>) => {
      // Friends are updated via their own profile - no direct update needed
    },
    []
  );

  // ==========================================
  // Invitation Management
  // ==========================================
  const createInvitation = useCallback(async (): Promise<Invitation> => {
    const result = await createInvitationMutation().unwrap();
    return result as Invitation;
  }, [createInvitationMutation]);

  const useInvitation = useCallback(
    (code: string, _userId: string) => {
      addFriendMutation({ code });
    },
    [addFriendMutation]
  );

  // ==========================================
  // Social Share Management
  // ==========================================
  const addSocialShare = useCallback(
    (
      platform: SocialShare["platform"],
      message: string
    ) => {
      const share: SocialShare = {
        id: generateId(),
        platform,
        sharedDate: new Date().toISOString(),
        streakAtTime: streak.currentStreak,
        message,
      };
      // Could persist via API in the future
      return share;
    },
    [streak.currentStreak]
  );

  // ==========================================
  // Progress Calculations (pure, computed from goals)
  // ==========================================
  const getProgress = useCallback(
    (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || goal.tasks.length === 0) return 0;

      let totalItems = 0;
      let completedItems = 0;

      goal.tasks.forEach((task) => {
        const substeps = task.substeps || [];
        if (substeps.length > 0) {
          totalItems += substeps.length;
          completedItems += substeps.filter((s) => s.completed).length;
        } else {
          totalItems += 1;
          completedItems += task.completed ? 1 : 0;
        }
      });

      return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    },
    [goals]
  );

  const getTotalProgress = useCallback(() => {
    const allTasks = goals.flatMap((g) => g.tasks);
    if (allTasks.length === 0) return 0;

    let totalItems = 0;
    let completedItems = 0;

    allTasks.forEach((task) => {
      const substeps = task.substeps || [];
      if (substeps.length > 0) {
        totalItems += substeps.length;
        completedItems += substeps.filter((s) => s.completed).length;
      } else {
        totalItems += 1;
        completedItems += task.completed ? 1 : 0;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [goals]);

  const hasCompletedTaskToday = useCallback(() => {
    return isToday(streak.lastActivityDate);
  }, [streak.lastActivityDate]);

  // ==========================================
  // Analytics (pure computation from state)
  // ==========================================
  const getAnalytics = useCallback(
    (goalId?: string): AnalyticsData => {
      const filteredGoals = goalId
        ? goals.filter((g) => g.id === goalId)
        : goals;

      const allTasks = filteredGoals.flatMap((g) => g.tasks);
      const allSubsteps = allTasks.flatMap((t) => t.substeps || []);

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const totalSubsteps = allSubsteps.length;
      const completedSubsteps = allSubsteps.filter((s) => s.completed).length;

      let totalItems = 0;
      let completedItems = 0;

      allTasks.forEach((task) => {
        const substeps = task.substeps || [];
        if (substeps.length > 0) {
          totalItems += substeps.length;
          completedItems += substeps.filter((s) => s.completed).length;
        } else {
          totalItems += 1;
          completedItems += task.completed ? 1 : 0;
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

      const uniqueDays = Array.from(new Set(streak.streakHistory));
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
    },
    [goals, streak.streakHistory, activityLog]
  );

  const getActivitiesForDate = useCallback(
    (date: string) => {
      return activityLog.filter(
        (activity) => activity.date.split("T")[0] === date
      );
    },
    [activityLog]
  );

  // ==========================================
  // Return identical interface to old hook
  // ==========================================
  return {
    goals,
    streak,
    notificationsEnabled: false,
    activityLog,
    profile,
    friends,
    invitations,
    socialShares: [] as SocialShare[],
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
