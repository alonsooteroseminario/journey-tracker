/**
 * Get a specific friend's detailed profile
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-friend-profile',
  description: 'Retrieves detailed profile and stats for a specific friend. Use get-friends first to obtain the friendId.',
  input_schema: {
    type: 'object',
    properties: {
      friendId: {
        type: 'string',
        description: 'The MongoDB user ID of the friend (from get-friends results)',
      },
    },
    required: ['friendId'],
  },
};

export async function executeGetFriendProfile(
  args: { friendId: string },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.friendId) {
      return { success: false, error: 'Validation error', message: 'Friend ID is required' };
    }

    args.friendId = args.friendId.replace(/^(goal_|task_|substep_|user_)/i, '');

    const user = await resolveUser(userId);
    if (!user) {
      return { success: false, error: 'User not found', message: 'Could not find user in database' };
    }

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        userId: user.id,
        friendId: args.friendId,
        status: 'accepted',
      },
    });

    if (!friendship) {
      return { success: false, error: 'Not found', message: 'Friend not found or not accepted' };
    }

    // Get friend's user record
    const friend = await prisma.user.findUnique({ where: { id: args.friendId } });
    if (!friend) {
      return { success: false, error: 'Not found', message: 'Friend user record not found' };
    }

    // Get friend's streak data
    const streakData = await prisma.streakData.findUnique({ where: { userId: args.friendId } });

    // Get friend's public goals with stats
    const goals = await prisma.goal.findMany({
      where: { userId: args.friendId, isPublic: true },
      orderBy: { createdAt: 'desc' },
    });

    const goalSummaries = goals.map((g) => {
      const tasks = (g.tasks as any[]) || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.completed).length;
      return {
        id: g.id,
        title: g.title,
        icon: g.icon,
        totalTasks,
        completedTasks,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { userId: args.friendId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        id: friend.id,
        name: friend.name,
        bio: friend.bio,
        location: friend.location,
        joinedDate: friend.joinedDate?.toISOString(),
        streak: {
          currentStreak: streakData?.currentStreak ?? 0,
          longestStreak: streakData?.longestStreak ?? 0,
          lastActivityDate: streakData?.lastActivityDate?.toISOString() ?? null,
        },
        goals: goalSummaries,
        recentActivity: recentActivity.map((a) => ({
          type: a.type,
          action: a.action,
          timestamp: a.timestamp.toISOString(),
        })),
      },
      message: `Retrieved profile for ${friend.name}`,
    };
  } catch (error) {
    console.error('Error in executeGetFriendProfile:', error);
    return { success: false, error: 'Database error', message: 'Failed to get friend profile' };
  }
}
