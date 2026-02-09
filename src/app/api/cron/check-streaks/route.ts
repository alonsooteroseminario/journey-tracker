import { NextResponse } from "next/server";
import { notifyFriendsOfAtRiskStreaks } from "@/lib/feed/streakChecker";

/**
 * GET /api/cron/check-streaks
 * Daily cron job to check for at-risk streaks and notify friends
 * Runs at 8 PM UTC (evening reminder)
 */
export async function GET(request: Request) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await notifyFriendsOfAtRiskStreaks();

    return NextResponse.json({
      success: true,
      message: "Streak check completed",
      stats: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Streak check cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check streaks",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
