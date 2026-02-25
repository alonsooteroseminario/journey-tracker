import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/streaks/goals — list all per-goal streaks for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalStreaks = await prisma.goalStreak.findMany({
      where: { userId: user.id },
    });

    return NextResponse.json(goalStreaks);
  } catch (error) {
    console.error("GET /api/streaks/goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
