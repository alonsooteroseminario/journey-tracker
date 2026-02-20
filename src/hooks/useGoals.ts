"use client";

import { useCallback } from "react";
import { SocialShare } from "@/types";
import { generateId } from "@/lib/storage";
import { useStreakData } from "./useStreakData";
import { useProfileData } from "./useProfileData";
import { useFriendsData } from "./useFriendsData";
import { useGoalsCRUD } from "./useGoalsCRUD";
import { useGoalAnalytics } from "./useGoalAnalytics";

/**
 * useGoals - Backward-compatible composition hook.
 *
 * Composes domain-specific hooks (useStreakData, useProfileData, useFriendsData,
 * useGoalsCRUD, useGoalAnalytics) into a single interface. Pages that used the
 * original monolithic hook continue to work without changes.
 *
 * For new code, prefer importing the domain-specific hooks directly to avoid
 * fetching data that the page doesn't need.
 */
export function useGoals() {
  const {
    streak, activityLog, streakLoading,
    logActivity, triggerStreakUpdate,
    hasCompletedTaskToday, getActivitiesForDate,
  } = useStreakData();

  const {
    goals, goalsLoading,
    addGoal, addGoalWithTasks, deleteGoal, updateGoal, reorderGoals,
    addTask, addPhase, updateTask, toggleTask, deleteTask, reorderTasks,
    addSubstep, updateSubstep, toggleSubstep, deleteSubstep,
    updateTaskCost, updateSubstepCost, updateDocumentStatus,
    addResource, deleteResource,
    getProgress, getTotalProgress,
  } = useGoalsCRUD(logActivity, triggerStreakUpdate);

  const { profile, profileLoading, updateProfile } = useProfileData();

  const {
    friends, friendsLoading, invitations,
    addFriend, removeFriend, createInvitation,
  } = useFriendsData();

  const { getAnalytics } = useGoalAnalytics(
    goals,
    streak.streakHistory,
    activityLog
  );

  const isLoaded =
    !goalsLoading && !profileLoading && !streakLoading && !friendsLoading;

  const setNotificationsEnabled = useCallback((_enabled: boolean) => {
    // No-op — notifications preference not yet persisted
  }, []);

  const addSocialShare = useCallback(
    (platform: SocialShare["platform"], message: string) => {
      const share: SocialShare = {
        id: generateId(),
        platform,
        sharedDate: new Date().toISOString(),
        streakAtTime: streak.currentStreak,
        message,
      };
      return share;
    },
    [streak.currentStreak]
  );

  return {
    goals,
    streak,
    notificationsEnabled: false,
    activityLog,
    profile,
    friends,
    invitations,
    isLoaded,
    addGoal,
    addGoalWithTasks,
    deleteGoal,
    updateGoal,
    reorderGoals,
    addTask,
    addPhase,
    updateTask,
    toggleTask,
    deleteTask,
    updateTaskCost,
    reorderTasks,
    addSubstep,
    updateSubstep,
    toggleSubstep,
    deleteSubstep,
    updateSubstepCost,
    updateDocumentStatus,
    addResource,
    deleteResource,
    setNotificationsEnabled,
    updateProfile,
    addFriend,
    removeFriend,
    createInvitation,
    addSocialShare,
    getProgress,
    getTotalProgress,
    hasCompletedTaskToday,
    getAnalytics,
    getActivitiesForDate,
  };
}
