import { prisma } from '@/lib/prisma';
import { getTodayInTimezone } from '@/lib/dateUtils';

const MILESTONES = [7, 14, 30, 60, 100];

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: string[];
  /** Non-null if a milestone was just reached */
  milestone: number | null;
  /** Whether a new day was actually recorded (false = already logged today) */
  isNew: boolean;
}

/**
 * Calculate current streak from a sorted history of YYYY-MM-DD date strings.
 * Counts consecutive days backward from `today`. Returns 0 if today is not in history.
 */
export function calculateStreakFromHistory(history: string[], today: string): number {
  if (history.length === 0) return 0;

  const sorted = [...history].sort();
  const todayIndex = sorted.indexOf(today);
  if (todayIndex === -1) return 0;

  let streak = 1;
  for (let i = todayIndex; i > 0; i--) {
    const current = new Date(sorted[i] + 'T00:00:00');
    const previous = new Date(sorted[i - 1] + 'T00:00:00');
    const diffMs = current.getTime() - previous.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Record a streak activity for the user. Idempotent per day.
 * Call this from ANY completion path (MCP tools, REST API, Kanban).
 */
export async function recordStreakActivity(
  userId: string,
  timezone?: string | null,
): Promise<StreakUpdateResult> {
  const today = getTodayInTimezone(timezone);

  const existing = await prisma.streakData.findUnique({
    where: { userId },
  });

  // No record yet — create with today as first entry
  if (!existing) {
    await prisma.streakData.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(today + 'T00:00:00'),
        streakHistory: [today],
      },
    });
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      streakHistory: [today],
      milestone: MILESTONES.includes(1) ? 1 : null,
      isNew: true,
    };
  }

  // Already logged today — return current data without writing
  if (existing.streakHistory.includes(today)) {
    return {
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      lastActivityDate: today,
      streakHistory: existing.streakHistory,
      milestone: null,
      isNew: false,
    };
  }

  // New day — add to history and recalculate
  const newHistory = [...existing.streakHistory, today];
  const currentStreak = calculateStreakFromHistory(newHistory, today);
  const longestStreak = Math.max(currentStreak, existing.longestStreak);
  const milestone = MILESTONES.includes(currentStreak) ? currentStreak : null;

  await prisma.streakData.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityDate: new Date(today + 'T00:00:00'),
      streakHistory: newHistory,
    },
  });

  return {
    currentStreak,
    longestStreak,
    lastActivityDate: today,
    streakHistory: newHistory,
    milestone,
    isNew: true,
  };
}
