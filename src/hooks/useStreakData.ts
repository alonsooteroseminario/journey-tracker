"use client";

import { useCallback, useMemo } from "react";
import { StreakData, ActivityLogEntry } from "@/types";
import { getToday, isToday } from "@/lib/storage";
import {
  useGetStreakQuery,
  useUpdateStreakMutation,
  useGetActivityLogQuery,
  useLogActivityMutation,
} from "@/store/slices/streaksSlice";

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakHistory: [],
};

export function useStreakData() {
  const {
    data: apiStreak,
    isLoading: streakLoading,
  } = useGetStreakQuery();

  const {
    data: apiActivity,
  } = useGetActivityLogQuery({});

  const [updateStreakMutation] = useUpdateStreakMutation();
  const [logActivityMutation] = useLogActivityMutation();

  const streak: StreakData = useMemo(
    () => apiStreak || defaultStreak,
    [apiStreak]
  );

  const activityLog: ActivityLogEntry[] = useMemo(
    () => apiActivity || [],
    [apiActivity]
  );

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

  const hasCompletedTaskToday = useCallback(() => {
    return isToday(streak.lastActivityDate);
  }, [streak.lastActivityDate]);

  const getActivitiesForDate = useCallback(
    (date: string) => {
      return activityLog.filter(
        (activity) => activity.date.split("T")[0] === date
      );
    },
    [activityLog]
  );

  return {
    streak,
    activityLog,
    streakLoading,
    logActivity,
    triggerStreakUpdate,
    hasCompletedTaskToday,
    getActivitiesForDate,
  };
}
