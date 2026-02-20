import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";
import { getTodayInTimezone } from "@/lib/dateUtils";

/**
 * Cron job: Send daily streak reminders to users who haven't completed a task today
 * Runs at 9 AM UTC daily
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron Jobs send this header)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find users with active streaks but no activity today
    const usersWithStreaks = await prisma.streakData.findMany({
      where: {
        currentStreak: {
          gt: 0, // Has an active streak
        },
      },
      include: {
        user: true,
      },
    });

    const remindersToSend: Array<{ userId: string; userName: string; streak: number }> = [];

    for (const streakData of usersWithStreaks) {
      // Check if user has activity today (using their timezone)
      const today = getTodayInTimezone(streakData.user.timezone);
      const hasActivityToday = streakData.streakHistory.includes(today);

      if (!hasActivityToday) {
        remindersToSend.push({
          userId: streakData.user.id,
          userName: streakData.user.name,
          streak: streakData.currentStreak,
        });
      }
    }

    // Send reminder emails (non-blocking)
    const emailPromises = remindersToSend.map((reminder) =>
      notify(reminder.userId, "streakReminder", {
        userName: reminder.userName,
        currentStreak: reminder.streak,
      }).catch((err) => {
        console.error(`Failed to send reminder to ${reminder.userId}:`, err);
        return { success: false, userId: reminder.userId };
      })
    );

    const results = await Promise.all(emailPromises);
    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;

    return NextResponse.json({
      success: true,
      message: "Daily reminders processed",
      stats: {
        usersChecked: usersWithStreaks.length,
        remindersToSend: remindersToSend.length,
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error("Error in daily-reminders cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process daily reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
