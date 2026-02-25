import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateGoalStreak } from "@/lib/streaks/goalStreakUpdater";

// POST /api/streaks/goals/update — trigger streak update for a goalId
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId } = await req.json();
    if (!goalId) {
      return NextResponse.json({ error: "goalId required" }, { status: 400 });
    }

    await updateGoalStreak(goalId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/streaks/goals/update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
