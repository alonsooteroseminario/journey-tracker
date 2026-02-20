import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTodayInTimezone, isTodayInTimezone, isYesterdayInTimezone } from "@/lib/dateUtils";

// GET /api/streaks - Get current user's streak data
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tz = user.timezone;

    let streakData = await prisma.streakData.findUnique({
      where: { userId: user.id },
    });

    // Create streak data if it doesn't exist
    if (!streakData) {
      streakData = await prisma.streakData.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          streakHistory: [],
        },
      });
    }

    // Check if streak should be reset (didn't log yesterday or today)
    const lastDate = streakData.lastActivityDate
      ? streakData.lastActivityDate.toISOString().split("T")[0]
      : null;

    let currentStreak = streakData.currentStreak;
    if (lastDate && !isTodayInTimezone(lastDate, tz) && !isYesterdayInTimezone(lastDate, tz)) {
      // Streak is broken, reset
      currentStreak = 0;
      await prisma.streakData.update({
        where: { id: streakData.id },
        data: { currentStreak: 0 },
      });
    }

    return NextResponse.json({
      currentStreak,
      longestStreak: streakData.longestStreak,
      lastActivityDate: lastDate,
      streakHistory: streakData.streakHistory,
    }, {
      headers: { 'Cache-Control': 'private, no-cache' },
    });
  } catch (error) {
    console.error("GET /api/streaks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/streaks - Record activity and update streak
export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tz = user.timezone;

    let streakData = await prisma.streakData.findUnique({
      where: { userId: user.id },
    });

    if (!streakData) {
      streakData = await prisma.streakData.create({
        data: {
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          streakHistory: [],
        },
      });
    }

    const today = getTodayInTimezone(tz);
    const lastDate = streakData.lastActivityDate
      ? streakData.lastActivityDate.toISOString().split("T")[0]
      : null;

    // Already logged today
    if (isTodayInTimezone(lastDate, tz)) {
      return NextResponse.json({
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastActivityDate: lastDate,
        streakHistory: streakData.streakHistory,
      });
    }

    // Calculate new streak
    let newStreak: number;
    if (isYesterdayInTimezone(lastDate, tz)) {
      newStreak = streakData.currentStreak + 1;
    } else {
      newStreak = 1; // Reset or start
    }

    const newLongest = Math.max(newStreak, streakData.longestStreak);
    const newHistory = [...streakData.streakHistory, today];

    const updated = await prisma.streakData.update({
      where: { id: streakData.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: new Date(today),
        streakHistory: newHistory,
      },
    });

    return NextResponse.json({
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastActivityDate: today,
      streakHistory: updated.streakHistory,
    });
  } catch (error) {
    console.error("PATCH /api/streaks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
