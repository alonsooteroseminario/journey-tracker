import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeGoalTier, computeGoldStatus } from "@/lib/streaks/computeTier";
import { GoalStreak } from "@/types";

// GET /api/streaks/tiers — computed tier summary with goal names
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [goalStreaks, goals] = await Promise.all([
      prisma.goalStreak.findMany({ where: { userId: user.id } }),
      prisma.goal.findMany({ where: { userId: user.id }, select: { id: true, title: true, icon: true } }),
    ]);

    const enriched = goalStreaks.map((s) => {
      const goal = goals.find((g) => g.id === s.goalId);
      return {
        ...s,
        goalTitle: goal?.title || "Unknown",
        goalIcon: goal?.icon,
        tier: computeGoalTier(s.currentStreak),
      };
    });

    const hasGold = computeGoldStatus(goalStreaks as unknown as GoalStreak[], goals.length);

    return NextResponse.json({
      goalStreaks: enriched,
      hasGold,
      silverCount: enriched.filter((s) => s.tier === "silver").length,
      bronzeCount: enriched.filter((s) => s.tier === "bronze").length,
    });
  } catch (error) {
    console.error("GET /api/streaks/tiers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
