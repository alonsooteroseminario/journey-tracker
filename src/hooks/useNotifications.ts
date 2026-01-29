"use client";

import { useEffect, useCallback } from "react";

export function useNotifications(
  enabled: boolean,
  hasCompletedTaskToday: boolean,
  currentStreak: number,
  onEnableChange: (enabled: boolean) => void
) {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  const enableNotifications = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      onEnableChange(true);
      // Show a test notification
      new Notification("Journey Tracker", {
        body: "Notifications enabled! We'll remind you to keep your streak going.",
        icon: "/favicon.ico",
      });
    }
    return granted;
  }, [requestPermission, onEnableChange]);

  const disableNotifications = useCallback(() => {
    onEnableChange(false);
  }, [onEnableChange]);

  const showStreakReminder = useCallback(() => {
    if (!enabled || hasCompletedTaskToday) return;

    if (Notification.permission === "granted") {
      const message =
        currentStreak > 0
          ? `Don't break your ${currentStreak}-day streak! Complete at least one task today.`
          : "Start your journey today! Complete a task to begin your streak.";

      new Notification("Journey Tracker Reminder", {
        body: message,
        icon: "/favicon.ico",
        tag: "streak-reminder",
      });
    }
  }, [enabled, hasCompletedTaskToday, currentStreak]);

  // Set up daily reminder check
  useEffect(() => {
    if (!enabled) return;

    // Check every hour if we should show a reminder
    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();

      // Show reminder at 6 PM if no task completed today
      if (hour >= 18 && !hasCompletedTaskToday) {
        showStreakReminder();
      }
    };

    // Check immediately
    checkReminder();

    // Then check every hour
    const interval = setInterval(checkReminder, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, hasCompletedTaskToday, showStreakReminder]);

  return {
    enableNotifications,
    disableNotifications,
    showStreakReminder,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    permission:
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "denied",
  };
}
