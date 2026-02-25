import { StreakTier, GoalStreak } from "@/types";

export function computeGoalTier(currentStreak: number): StreakTier {
  if (currentStreak >= 7) return "silver";
  if (currentStreak >= 1) return "bronze";
  return null;
}

export function computeGoldStatus(goalStreaks: GoalStreak[], totalGoalCount: number): boolean {
  if (totalGoalCount === 0) return false;
  if (goalStreaks.length < totalGoalCount) return false;
  return goalStreaks.every((s) => s.currentStreak >= 1);
}
