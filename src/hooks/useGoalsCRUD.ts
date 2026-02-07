"use client";

import { useCallback, useMemo } from "react";
import { Goal, Task, Substep, DocumentItem, ActivityLogEntry } from "@/types";
import { generateId, getToday } from "@/lib/storage";
import {
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} from "@/store/slices/goalsSlice";

export function useGoalsCRUD(
  logActivity: (
    type: ActivityLogEntry["type"],
    goalId: string,
    description: string,
    taskId?: string,
    substepId?: string,
    metadata?: Record<string, unknown>
  ) => void,
  triggerStreakUpdate: () => void
) {
  const {
    data: apiGoals,
    isLoading: goalsLoading,
  } = useGetGoalsQuery();

  const [createGoalMutation] = useCreateGoalMutation();
  const [updateGoalMutation] = useUpdateGoalMutation();
  const [deleteGoalMutation] = useDeleteGoalMutation();

  const goals: Goal[] = useMemo(() => apiGoals || [], [apiGoals]);

  // Goal operations
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

  // Task operations
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

  // Substep operations
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

      if (!wasCompleted) {
        logActivity("substep_completed", goalId, `Completed substep: ${substepTitle}`, taskId, substepId);
        triggerStreakUpdate();
      } else {
        logActivity("substep_uncompleted", goalId, `Uncompleted substep: ${substepTitle}`, taskId, substepId);
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

  // Cost operations
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

  // Document operations
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

  // Progress calculations
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

  return {
    goals,
    goalsLoading,
    addGoal,
    addGoalWithTasks,
    deleteGoal,
    updateGoal,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
    addSubstep,
    updateSubstep,
    toggleSubstep,
    deleteSubstep,
    updateTaskCost,
    updateSubstepCost,
    updateDocumentStatus,
    getProgress,
    getTotalProgress,
  };
}
