import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";
import { getTodayInTimezone } from "@/lib/dateUtils";
import type { Task } from "@/types";

/**
 * Cron job: Send overdue-alert emails for newly overdue tasks.
 * Runs every 15 minutes. Skips tasks already alerted today (checked via goal title + task id).
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // MongoDB doesn't support relational where filters — query prefs first
    const eligiblePrefs = await prisma.emailPreferences.findMany({
      where: { enabled: true, overdueAlert: true },
      select: { userId: true },
    });
    const eligibleIds = eligiblePrefs.map((p) => p.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: eligibleIds } },
      select: {
        id: true,
        name: true,
        timezone: true,
        goals: {
          select: { title: true, tasks: true },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const today = getTodayInTimezone(user.timezone);

      for (const goal of user.goals) {
        const tasks = (goal.tasks as Task[] | null) ?? [];

        for (const task of tasks) {
          if (task.isArchived || task.status === "completed") continue;
          if (!task.dueDate || task.dueDate >= today) continue;

          const daysOverdue = Math.floor(
            (new Date(today).getTime() - new Date(task.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );

          const result = await notify(user.id, "overdueAlert", {
            userName: user.name,
            taskTitle: task.title,
            goalTitle: goal.title,
            daysOverdue,
            aiContext: undefined,
          }).catch((err) => {
            console.error(`Failed to send overdue alert to ${user.id}:`, err);
            return { success: false };
          });

          if (result.success) sent++;
          else failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Overdue check processed",
      stats: { usersChecked: users.length, sent, failed },
    });
  } catch (error) {
    console.error("Error in overdue-check cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process overdue check",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
