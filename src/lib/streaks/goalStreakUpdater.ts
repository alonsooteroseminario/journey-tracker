import { prisma } from "@/lib/prisma";

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function updateGoalStreak(goalId: string, userId: string): Promise<void> {
  const now = new Date();
  const todayStr = toLocalDateStr(now);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const existing = await prisma.goalStreak.findUnique({
    where: { goalId_userId: { goalId, userId } },
  });

  let newStreak = 1;
  let longestStreak = 1;

  if (existing) {
    const lastDate = existing.lastCompletionDate
      ? new Date(existing.lastCompletionDate)
      : null;

    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const lastDateStr = toLocalDateStr(lastDate);

      if (lastDateStr === todayStr) {
        // Already completed today — no change needed
        return;
      } else if (lastDate.getTime() === yesterday.getTime()) {
        // Consecutive day — increment
        newStreak = existing.currentStreak + 1;
      }
      // else: gap — reset to 1
    }

    longestStreak = Math.max(existing.longestStreak, newStreak);
  }

  await prisma.goalStreak.upsert({
    where: { goalId_userId: { goalId, userId } },
    create: {
      goalId,
      userId,
      currentStreak: newStreak,
      longestStreak,
      lastCompletionDate: new Date(),
      streakHistory: [todayStr],
    },
    update: {
      currentStreak: newStreak,
      longestStreak,
      lastCompletionDate: new Date(),
      streakHistory: { push: todayStr },
    },
  });
}
