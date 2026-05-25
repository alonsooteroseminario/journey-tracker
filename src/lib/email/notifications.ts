import { prisma } from "@/lib/prisma";
import { sendEmail } from "./send";
import { NotificationType } from "@/types";
import * as React from "react";

// Email template imports
import { WelcomeEmail } from "./templates/welcome";
import { ProfileChangedEmail } from "./templates/profile-changed";
import { GoalCreatedEmail } from "./templates/goal-created";
import { GoalDeletedEmail } from "./templates/goal-deleted";
import { FriendInvitationEmail } from "./templates/friend-invitation";
import { GoalPublishedEmail } from "./templates/goal-published";
import { GoalSharedEmail } from "./templates/goal-shared";
import { GoalUnsharedEmail } from "./templates/goal-unshared";
import { GoalForkedEmail } from "./templates/goal-forked";
import { StreakMilestoneEmail } from "./templates/streak-milestone";
import { StreakReminderEmail } from "./templates/streak-reminder";
import { FriendStreakReminderEmail } from "./templates/friend-streak-reminder";
import { MorningDigestEmail } from "./templates/morning-digest";
import { OverdueAlertEmail } from "./templates/overdue-alert";
import { TaskReminderDigestEmail, type ReminderTask } from "./templates/task-reminder-digest";

interface NotificationData {
  // Welcome
  userName?: string;

  // Profile
  changedFields?: string[];

  // Goal
  goalTitle?: string;
  goalIcon?: string;
  taskCount?: number;

  // Invitation
  invitationCode?: string;

  // Streak
  streakCount?: number;
  currentStreak?: number;

  // Friend
  friendName?: string;
  friendStreak?: number;

  // Fork
  forkerName?: string;
  totalForks?: number;

  // Morning digest
  overdueCount?: number;
  todayTaskCount?: number;
  aiParagraph?: string;

  // Overdue alert
  taskTitle?: string;
  daysOverdue?: number;
  aiContext?: string;

  // Task reminder digest
  reminderTasks?: ReminderTask[];
}

/**
 * Central notification dispatcher that checks user preferences before sending emails
 */
export async function notify(
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch user and email preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emailPreferences: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get or create default preferences
    let preferences = user.emailPreferences;
    if (!preferences) {
      preferences = await prisma.emailPreferences.create({
        data: { userId },
      });
    }

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return { success: true }; // User has disabled all notifications
    }

    // Check if this specific notification type is enabled
    if (!preferences[type]) {
      return { success: true }; // User has disabled this notification type
    }

    // Generate email template
    const emailContent = generateEmailTemplate(type, {
      ...data,
      userName: data.userName || user.name,
    });

    if (!emailContent) {
      return { success: false, error: "Unknown notification type" };
    }

    // Handle frequency
    if (preferences.frequency === "immediate") {
      // Send immediately
      return await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        react: emailContent.template,
      });
    } else {
      // For daily/weekly, we would queue the email
      // For now, we'll send immediately (queue implementation in Step 4 with cron)
      return await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        react: emailContent.template,
      });
    }
  } catch (error) {
    console.error("Notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateEmailTemplate(
  type: NotificationType,
  data: NotificationData
): { subject: string; template: React.ReactElement } | null {
  switch (type) {
    case "welcomeEmail":
      return {
        subject: "Welcome to Cadence!",
        template: React.createElement(WelcomeEmail, {
          userName: data.userName || "User",
        }),
      };

    case "profileChanges":
      return {
        subject: "Your profile has been updated",
        template: React.createElement(ProfileChangedEmail, {
          userName: data.userName || "User",
          changedFields: data.changedFields || [],
        }),
      };

    case "goalCreated":
      return {
        subject: `New goal created: ${data.goalTitle || "Untitled Goal"}`,
        template: React.createElement(GoalCreatedEmail, {
          userName: data.userName || "User",
          goalTitle: data.goalTitle || "Untitled Goal",
          goalIcon: data.goalIcon,
          taskCount: data.taskCount || 0,
        }),
      };

    case "goalDeleted":
      return {
        subject: `Goal deleted: ${data.goalTitle || "Untitled Goal"}`,
        template: React.createElement(GoalDeletedEmail, {
          userName: data.userName || "User",
          goalTitle: data.goalTitle || "Untitled Goal",
        }),
      };

    case "friendInvitation":
      return {
        subject: "Friend invitation code created",
        template: React.createElement(FriendInvitationEmail, {
          userName: data.userName || "User",
          invitationCode: data.invitationCode || "",
        }),
      };

    case "goalPublished":
      return {
        subject: `Template published: ${data.goalTitle || "Untitled Goal"}`,
        template: React.createElement(GoalPublishedEmail, {
          userName: data.userName || "User",
          goalTitle: data.goalTitle || "Untitled Goal",
          goalIcon: data.goalIcon,
        }),
      };

    case "goalShared":
      return {
        subject: `Goal shared: ${data.goalTitle || "Untitled Goal"}`,
        template: React.createElement(GoalSharedEmail, {
          userName: data.userName || "User",
          goalTitle: data.goalTitle || "Untitled Goal",
          goalIcon: data.goalIcon,
        }),
      };

    case "goalForked":
      return {
        subject: `${data.forkerName || "Someone"} forked your template!`,
        template: React.createElement(GoalForkedEmail, {
          userName: data.userName || "User",
          goalTitle: data.goalTitle || "Untitled Goal",
          goalIcon: data.goalIcon,
          forkerName: data.forkerName || "Someone",
          totalForks: data.totalForks || 1,
        }),
      };

    case "streakMilestone":
      return {
        subject: `${data.streakCount || 0}-day streak milestone!`,
        template: React.createElement(StreakMilestoneEmail, {
          userName: data.userName || "User",
          streakCount: data.streakCount || 0,
        }),
      };

    case "streakReminder":
      return {
        subject: "Don't break your streak!",
        template: React.createElement(StreakReminderEmail, {
          userName: data.userName || "User",
          currentStreak: data.currentStreak || 0,
        }),
      };

    case "friendActivity":
      return {
        subject: `${data.friendName || "A friend"} needs encouragement!`,
        template: React.createElement(FriendStreakReminderEmail, {
          userName: data.userName || "User",
          friendName: data.friendName || "A friend",
          friendStreak: data.friendStreak || 0,
        }),
      };

    case "morningDigest":
      return {
        subject: `Good morning — your Cadence digest`,
        template: React.createElement(MorningDigestEmail, {
          userName: data.userName || "User",
          overdueCount: data.overdueCount ?? 0,
          todayTaskCount: data.todayTaskCount ?? 0,
          streakCount: data.streakCount ?? 0,
          aiParagraph: data.aiParagraph,
        }),
      };

    case "overdueAlert":
      return {
        subject: `Task overdue: ${data.taskTitle || "A task"}`,
        template: React.createElement(OverdueAlertEmail, {
          userName: data.userName || "User",
          taskTitle: data.taskTitle || "A task",
          goalTitle: data.goalTitle || "Your goal",
          daysOverdue: data.daysOverdue ?? 1,
          aiContext: data.aiContext,
        }),
      };

    case "reminderDigest":
      return {
        subject: `Your daily reminder — ${(data.reminderTasks ?? []).length} task${(data.reminderTasks ?? []).length !== 1 ? "s" : ""} waiting`,
        template: React.createElement(TaskReminderDigestEmail, {
          userName: data.userName || "User",
          tasks: data.reminderTasks ?? [],
        }),
      };

    default:
      return null;
  }
}
