/**
 * Get friends list with stats
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-friends',
  description: 'Gets the user\'s friends with their streak data and goal stats.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function executeGetFriends(
  args: Record<string, any>,
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        message: 'User ID is required',
      };
    }

    // Resolve Clerk userId to MongoDB user
    const user = await resolveUser(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        message: 'Could not find user in database',
      };
    }

    // Fetch friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        userId: user.id,
        status: 'accepted',
      },
      include: {
        friend: {
          include: {
            streakData: true,
          },
        },
      },
    });

    // Get goal counts for each friend
    const friendsWithStats = await Promise.all(
      friendships.map(async (friendship) => {
        const goals = await prisma.goal.findMany({
          where: {
            userId: friendship.friendId,
            isPublic: true,
          },
        });

        const totalGoals = goals.length;
        const completedGoals = goals.filter((g) => {
          const tasks = (g.tasks as any[]) || [];
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.completed).length;
          return totalTasks > 0 && completedTasks === totalTasks;
        }).length;

        return {
          id: friendship.id,
          profileId: friendship.friendId,
          name: friendship.friend.name,
          profileImage: friendship.friend.profileImage,
          currentStreak: friendship.friend.streakData?.currentStreak || 0,
          longestStreak: friendship.friend.streakData?.longestStreak || 0,
          totalGoals,
          completedGoals,
          addedDate: friendship.addedDate.toISOString(),
        };
      })
    );

    return {
      success: true,
      data: friendsWithStats,
      message: `Found ${friendsWithStats.length} friend(s)`,
    };
  } catch (error) {
    console.error('Error in executeGetFriends:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to retrieve friends',
    };
  }
}
