import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { TaskReminderDigestEmail, type ReminderTask } from "@/lib/email/templates/task-reminder-digest";
import type { Task, Substep } from "@/types";
import * as React from "react";

/**
 * Cron job: Send task reminder digest every 2 hours for tasks/substeps flagged with reminderEnabled.
 * Runs every 2 hours. Only fires for a user when the current hour (in their timezone) is >= their
 * configured start time (reminderStartTime, default 09:00). Sends every eligible firing until all
 * bell-flagged tasks are done — intentionally persistent.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowUtc = new Date();
    // ?force=true bypasses start-time check — for manual testing only
    const force = new URL(request.url).searchParams.get("force") === "true";

    // Two-step query: find eligible prefs first (MongoDB can't filter across relations)
    const eligiblePrefs = await prisma.emailPreferences.findMany({
      where: { enabled: true, reminderDigest: true },
      select: { userId: true, reminderStartTime: true },
    });

    const eligibleIds = eligiblePrefs.map((p) => p.userId);
    const prefsByUserId = Object.fromEntries(eligiblePrefs.map((p) => [p.userId, p]));

    const users = await prisma.user.findMany({
      where: { id: { in: eligibleIds } },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        goals: { select: { title: true, tasks: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const prefs = prefsByUserId[user.id];
      const startTime = prefs.reminderStartTime ?? "09:00";
      const startHour = parseInt(startTime.split(":")[0], 10);

      // Only send at or after the user's chosen start hour in their timezone
      const currentHour = getCurrentHourInTimezone(user.timezone, nowUtc);
      if (!force && currentHour < startHour) {
        skipped++;
        continue;
      }

      // Collect all reminder-enabled, incomplete tasks and substeps
      const reminderTasks: ReminderTask[] = [];

      for (const goal of user.goals) {
        const tasks = (goal.tasks as Task[] | null) ?? [];
        for (const task of tasks) {
          if (task.isArchived || task.status === "completed") continue;
          if (task.reminderEnabled) {
            reminderTasks.push({ title: task.title, goalTitle: goal.title, dueDate: task.dueDate });
          }
          for (const substep of (task.substeps as Substep[] | null) ?? []) {
            if (substep.isArchived || substep.status === "completed") continue;
            if (substep.reminderEnabled) {
              reminderTasks.push({ title: substep.title, goalTitle: `${goal.title} › ${task.title}`, dueDate: substep.dueDate });
            }
          }
        }
      }

      if (reminderTasks.length === 0) {
        skipped++;
        continue;
      }

      const result = await sendEmail({
        to: user.email,
        subject: `Still waiting — ${reminderTasks.length} task${reminderTasks.length !== 1 ? "s" : ""} need your attention`,
        react: React.createElement(TaskReminderDigestEmail, {
          userName: user.name,
          tasks: reminderTasks,
        }),
      }).catch((err) => {
        console.error(`Failed to send reminder to ${user.id}:`, err);
        return { success: false };
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Task reminders processed",
      stats: { usersChecked: users.length, sent, skipped, failed },
    });
  } catch (error) {
    console.error("Error in task-reminders cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process task reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getCurrentHourInTimezone(timezone: string | null | undefined, now: Date): number {
  const tz = timezone || "UTC";
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const hour = parseInt(formatted, 10);
    // Intl hour12:false returns "24" for midnight in some locales — normalize
    return hour === 24 ? 0 : hour;
  } catch {
    return now.getUTCHours();
  }
}
