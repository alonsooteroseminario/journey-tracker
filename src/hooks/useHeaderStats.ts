import { useGoals } from "@/hooks/useGoals";
import { useGetStreakQuery } from "@/store/slices/streaksSlice";

export interface HeaderStats {
  progress: number;
  streak: number;
}

/**
 * Aggregates the two numbers shown in the app header:
 * - overall goal progress (integer %)
 * - current streak (days)
 *
 * Both default to 0 while data is loading.
 */
export function useHeaderStats(): HeaderStats {
  const { getTotalProgress } = useGoals();
  const { data: streakData } = useGetStreakQuery();

  return {
    progress: Math.floor(getTotalProgress()),
    streak: streakData?.currentStreak ?? 0,
  };
}
