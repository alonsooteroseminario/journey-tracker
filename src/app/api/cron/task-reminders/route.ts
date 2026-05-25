import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { TaskReminderDigestEmail, type ReminderTask } from "@/lib/email/templates/task-reminder-digest";
import type { Task, Substep } from "@/types";
import * as React from "react";

/**
 * Cron job: Send task reminder digest every 2 hours for tasks/substeps flagged with reminderEnabled.
 * Runs every 2 hours. Sends as long as there are incomplete bell-flagged tasks — intentionally
 * persistent so users are motivated to finish.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Two-step query: find eligible prefs first (MongoDB can't filter across relations)
    const eligiblePrefs = await prisma.emailPreferences.findMany({
      where: { enabled: true, reminderDigest: true },
      select: { userId: true },
    });

    const eligibleIds = eligiblePrefs.map((p) => p.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: eligibleIds } },
      select: {
        id: true,
        email: true,
        name: true,
        goals: { select: { title: true, tasks: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
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
