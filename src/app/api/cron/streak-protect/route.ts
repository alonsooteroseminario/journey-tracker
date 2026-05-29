import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { StreakReminderEmail } from "@/lib/email/templates/streak-reminder";
import { getCurrentHourInTimezone, getTodayInTimezone } from "@/lib/dateUtils";
import { sendDiscordMessage, buildStreakReminderEmbed } from "@/lib/discord/send";
import * as React from "react";

/**
 * Cron job: Send a streak-at-risk warning to users who have an active streak but
 * haven't completed any activity today, once they hit their configured warning time.
 * Runs hourly. Sends at most once per day per user (deduped via streakProtectLastSentDate).
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowUtc = new Date();
    // ?force=true bypasses time check and dedup — for manual testing only
    const force = new URL(request.url).searchParams.get("force") === "true";

    // Two-step query: find prefs with streak reminder enabled
    const eligiblePrefs = await prisma.emailPreferences.findMany({
      where: { enabled: true, streakReminder: true },
      select: { userId: true, streakProtectTime: true, streakProtectLastSentDate: true, discordWebhookUrl: true, reminderStopTime: true },
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
        streakData: { select: { currentStreak: true, streakHistory: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      // Skip users with no active streak — nothing to protect
      const streak = user.streakData;
      if (!streak || streak.currentStreak < 1) {
        skipped++;
        continue;
      }

      const prefs = prefsByUserId[user.id];
      const protectTime = prefs.streakProtectTime ?? "20:00";
      const protectHour = parseInt(protectTime.split(":")[0], 10);

      // Only fire at or after the user's configured warning hour in their timezone
      const currentHour = getCurrentHourInTimezone(user.timezone, nowUtc);
      if (!force && currentHour < protectHour) {
        skipped++;
        continue;
      }

      // Stop sending if we're past the user's quiet-window stop time
      if (!force && prefs.reminderStopTime) {
        const stopHour = parseInt(prefs.reminderStopTime.split(":")[0], 10);
        if (!isNaN(stopHour) && currentHour >= stopHour) {
          skipped++;
          continue;
        }
      }

      // Streak is NOT at risk if the user already logged activity today
      const today = getTodayInTimezone(user.timezone);
      if ((streak.streakHistory ?? []).includes(today)) {
        skipped++;
        continue;
      }

      // Daily dedup — only one warning per day
      if (!force && prefs.streakProtectLastSentDate === today) {
        skipped++;
        continue;
      }

      const result = await sendEmail({
        to: user.email,
        subject: `Don't lose your ${streak.currentStreak}-day streak, ${user.name}!`,
        react: React.createElement(StreakReminderEmail, {
          userName: user.name,
          currentStreak: streak.currentStreak,
        }),
      }).catch((err) => {
        console.error(`Failed to send streak warning to ${user.id}:`, err);
        return { success: false };
      });

      if (result.success) {
        await prisma.emailPreferences.update({
          where: { userId: user.id },
          data: { streakProtectLastSentDate: today },
        });
        sent++;

        const discordUrl = prefs.discordWebhookUrl ?? process.env.WEBHOOK_DISCORD_BOT;
        if (discordUrl) {
          sendDiscordMessage(discordUrl, {
            embeds: [buildStreakReminderEmbed(user.name, streak.currentStreak, undefined)],
          }).catch(() => {});
        }
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Streak protection check completed",
      stats: { usersChecked: users.length, sent, skipped, failed },
    });
  } catch (error) {
    console.error("Error in streak-protect cron:", error);
    return NextResponse.json(
      {
        error: "Failed to check streaks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

