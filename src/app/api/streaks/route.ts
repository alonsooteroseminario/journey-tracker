import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTodayInTimezone } from "@/lib/dateUtils";
import { recordStreakActivity, calculateStreakFromHistory } from "@/lib/streaks";

// GET /api/streaks - Get current user's streak data
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const today = getTodayInTimezone(user.timezone);

    // Recalculate from history — this is the source of truth.
    // Avoids timezone mismatch from lastActivityDate (stored as UTC DateTime).
    const currentStreak = calculateStreakFromHistory(streakData.streakHistory, today);

    // Sync stored value if it diverged (e.g. streak expired while offline)
    if (currentStreak !== streakData.currentStreak) {
      await prisma.streakData.update({
        where: { id: streakData.id },
        data: { currentStreak },
      });
    }

    // Derive lastActivityDate from history — avoids UTC vs local date confusion
    const sortedHistory = [...streakData.streakHistory].sort();
    const lastActivityDate = sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;

    return NextResponse.json({
      currentStreak,
      longestStreak: streakData.longestStreak,
      lastActivityDate,
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

    const result = await recordStreakActivity(user.id, user.timezone);

    return NextResponse.json({
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      lastActivityDate: result.lastActivityDate,
      streakHistory: result.streakHistory,
    });
  } catch (error) {
    console.error("PATCH /api/streaks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
