import { prisma } from "@/lib/prisma";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function updateGoalStreak(goalId: string, userId: string): Promise<void> {
  const todayStr = toDateStr(new Date());
  const today = new Date();
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
      const lastDateStr = toDateStr(lastDate);

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
