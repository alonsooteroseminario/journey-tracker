import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";
import { getTodayInTimezone, getCurrentHourInTimezone, isInReminderWindow } from "@/lib/dateUtils";
import { generateAiContext } from "@/lib/email/generateAiContext";
import { sendDiscordMessage, buildMorningDigestEmbed } from "@/lib/discord/send";
import type { Task } from "@/types";

/**
 * Cron job: Send morning digest emails to opted-in users.
 * Runs at 8 AM UTC daily.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ?force=true bypasses reminder window check — for manual testing only
    const force = new URL(request.url).searchParams.get("force") === "true";

    // MongoDB doesn't support relational where filters — query prefs first
    const eligiblePrefs = await prisma.emailPreferences.findMany({
      where: { enabled: true, morningDigest: true },
      select: { userId: true, discordWebhookUrl: true, reminderStartTime: true, reminderStopTime: true },
    });
    const eligibleIds = eligiblePrefs.map((p) => p.userId);
    const prefsByUserId = Object.fromEntries(eligiblePrefs.map((p) => [p.userId, p]));

    const users = await prisma.user.findMany({
      where: { id: { in: eligibleIds } },
      select: {
        id: true,
        clerkId: true,
        name: true,
        timezone: true,
        goals: {
          select: { title: true, tasks: true },
        },
        streakData: { select: { currentStreak: true } },
      },
    });

    let sent = 0;
    let failed = 0;

    const nowUtc = new Date();
    for (const user of users) {
      const today = getTodayInTimezone(user.timezone);
      const prefs = prefsByUserId[user.id];
      const startTime = prefs?.reminderStartTime ?? "09:00";
      const currentHour = getCurrentHourInTimezone(user.timezone, nowUtc);
      if (!force && !isInReminderWindow(currentHour, startTime, prefs?.reminderStopTime)) continue;

      let overdueCount = 0;
      let todayTaskCount = 0;
      const goalTitles: string[] = [];

      for (const goal of user.goals) {
        goalTitles.push(goal.title);
        const tasks = (goal.tasks as Task[] | null) ?? [];
        for (const task of tasks) {
          if (task.isArchived || task.status === "completed") continue;
          if (!task.dueDate) continue;
          if (task.dueDate < today) overdueCount++;
          else if (task.dueDate === today) todayTaskCount++;
        }
      }

      if (overdueCount === 0 && todayTaskCount === 0) continue;

      const streakCount = user.streakData?.currentStreak ?? 0;

      const aiParagraph =
        (await generateAiContext(
          user.clerkId,
          `Write a concise 1-2 sentence motivational message for ${user.name} who has ${overdueCount} overdue task(s) and ${todayTaskCount} task(s) due today with a ${streakCount}-day streak. Goals: ${goalTitles.slice(0, 3).join(", ")}.`,
        )) ?? undefined;

      const result = await notify(user.id, "morningDigest", {
        userName: user.name,
        overdueCount,
        todayTaskCount,
        streakCount,
        aiParagraph,
      }).catch((err) => {
        console.error(`Failed to send digest to ${user.id}:`, err);
        return { success: false };
      });

      if (result.success) {
        sent++;
        const discordUrl = prefsByUserId[user.id]?.discordWebhookUrl ?? process.env.WEBHOOK_DISCORD_BOT;
        if (discordUrl) {
          sendDiscordMessage(discordUrl, {
            embeds: [buildMorningDigestEmbed(user.name, overdueCount, todayTaskCount, streakCount, aiParagraph)],
          }).catch(() => {});
        }
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Morning digest processed",
      stats: { usersChecked: users.length, sent, failed },
    });
  } catch (error) {
    console.error("Error in morning digest cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process morning digest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
