import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";
import { getTodayInTimezone, getCurrentHourInTimezone } from "@/lib/dateUtils";

interface AtRiskUser {
  userId: string;
  userName: string;
  currentStreak: number;
  friendIds: string[];
}

/**
 * Finds users whose streaks are at risk (active streak but no activity today)
 */
export async function findAtRiskUsers(): Promise<AtRiskUser[]> {
  const streakData = await prisma.streakData.findMany({
    where: { currentStreak: { gte: 1 } },
    include: {
      user: {
        select: { id: true, name: true, timezone: true },
      },
    },
  });

  const atRiskUsers: AtRiskUser[] = [];

  for (const data of streakData) {
    const today = getTodayInTimezone(data.user.timezone);
    const streakHistory = data.streakHistory || [];
    const hasActivityToday = streakHistory.includes(today);

    if (!hasActivityToday && data.currentStreak > 0) {
      const friendships = await prisma.friendship.findMany({
        where: { userId: data.userId },
        select: { friendId: true },
      });

      const reverseFriendships = await prisma.friendship.findMany({
        where: { friendId: data.userId },
        select: { userId: true },
      });

      const friendIds = [
        ...friendships.map((f) => f.friendId),
        ...reverseFriendships.map((f) => f.userId),
      ];

      const uniqueFriendIds = Array.from(new Set(friendIds));

      if (uniqueFriendIds.length > 0) {
        atRiskUsers.push({
          userId: data.userId,
          userName: data.user.name,
          currentStreak: data.currentStreak,
          friendIds: uniqueFriendIds,
        });
      }
    }
  }

  return atRiskUsers;
}

/**
 * Creates feed items and sends notifications for at-risk users.
 * Skips friends who are currently past their configured reminderStopTime.
 */
export async function notifyFriendsOfAtRiskStreaks(): Promise<{
  usersChecked: number;
  atRiskUsers: number;
  feedItemsCreated: number;
  notificationsSent: number;
  notificationsSkipped: number;
  errors: number;
}> {
  const atRiskUsers = await findAtRiskUsers();
  let feedItemsCreated = 0;
  let notificationsSent = 0;
  let notificationsSkipped = 0;
  let errors = 0;

  // Batch-fetch timezone + stop time for all friends involved
  const allFriendIds = Array.from(new Set(atRiskUsers.flatMap((u) => u.friendIds)));
  const nowUtc = new Date();

  const friendUsers = await prisma.user.findMany({
    where: { id: { in: allFriendIds } },
    select: {
      id: true,
      timezone: true,
      emailPreferences: { select: { reminderStopTime: true } },
    },
  });

  const friendInfoMap = new Map(
    friendUsers.map((u) => [
      u.id,
      {
        timezone: u.timezone,
        reminderStopTime: u.emailPreferences?.reminderStopTime ?? null,
      },
    ])
  );

  for (const user of atRiskUsers) {
    try {
      await prisma.feedItem.create({
        data: {
          userId: user.userId,
          type: "streak_at_risk",
          content: `${user.userName}'s ${user.currentStreak}-day streak is at risk! Send them some encouragement 💪`,
          metadata: { streakCount: user.currentStreak },
          visibility: "friends",
        },
      });
      feedItemsCreated++;

      for (const friendId of user.friendIds) {
        // Skip friend if they are past their configured quiet-window stop time
        const friendInfo = friendInfoMap.get(friendId);
        if (friendInfo?.reminderStopTime) {
          const stopHour = parseInt(friendInfo.reminderStopTime.split(":")[0], 10);
          const friendHour = getCurrentHourInTimezone(friendInfo.timezone, nowUtc);
          if (!isNaN(stopHour) && friendHour >= stopHour) {
            notificationsSkipped++;
            continue;
          }
        }

        try {
          await notify(friendId, "friendStreakReminder", {
            userName: user.userName,
            friendStreak: user.currentStreak,
          });
          notificationsSent++;
        } catch (error) {
          console.error(`Failed to send notification to friend ${friendId}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Failed to create feed item for user ${user.userId}:`, error);
      errors++;
    }
  }

  return {
    usersChecked: atRiskUsers.length,
    atRiskUsers: atRiskUsers.length,
    feedItemsCreated,
    notificationsSent,
    notificationsSkipped,
    errors,
  };
}
