import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/email/notifications";

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
  const today = new Date().toISOString().split("T")[0];

  // Find all users with active streaks
  const streakData = await prisma.streakData.findMany({
    where: {
      currentStreak: {
        gte: 1,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const atRiskUsers: AtRiskUser[] = [];

  for (const data of streakData) {
    const streakHistory = data.streakHistory || [];
    const hasActivityToday = streakHistory.includes(today);

    // Only consider users who haven't completed activity today
    if (!hasActivityToday && data.currentStreak > 0) {
      // Get user's friends
      const friendships = await prisma.friendship.findMany({
        where: { userId: data.userId },
        select: { friendId: true },
      });

      // Also get reverse friendships (people who added this user)
      const reverseFriendships = await prisma.friendship.findMany({
        where: { friendId: data.userId },
        select: { userId: true },
      });

      const friendIds = [
        ...friendships.map((f) => f.friendId),
        ...reverseFriendships.map((f) => f.userId),
      ];

      // Remove duplicates
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
 * Creates feed items and sends notifications for at-risk users
 */
export async function notifyFriendsOfAtRiskStreaks(): Promise<{
  usersChecked: number;
  atRiskUsers: number;
  feedItemsCreated: number;
  notificationsSent: number;
  errors: number;
}> {
  const atRiskUsers = await findAtRiskUsers();
  let feedItemsCreated = 0;
  let notificationsSent = 0;
  let errors = 0;

  for (const user of atRiskUsers) {
    try {
      // Create feed item visible to friends
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

      // Send email notifications to friends
      for (const friendId of user.friendIds) {
        try {
          await notify(friendId, "friendStreakReminder", {
            userName: user.userName,
            friendStreak: user.currentStreak,
          });
          notificationsSent++;
        } catch (error) {
          console.error(
            `Failed to send notification to friend ${friendId}:`,
            error
          );
          errors++;
        }
      }
    } catch (error) {
      console.error(
        `Failed to create feed item for user ${user.userId}:`,
        error
      );
      errors++;
    }
  }

  return {
    usersChecked: atRiskUsers.length,
    atRiskUsers: atRiskUsers.length,
    feedItemsCreated,
    notificationsSent,
    errors,
  };
}
