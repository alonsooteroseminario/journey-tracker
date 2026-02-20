/**
 * Get streak data for the user
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { getTodayInTimezone } from '@/lib/dateUtils';

export const toolDefinition: ToolDefinition = {
  name: 'get-streaks',
  description: 'Gets the user\'s current streak data including current streak, longest streak, and history.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function executeGetStreaks(
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

    // Fetch streak data
    const streakData = await prisma.streakData.findUnique({
      where: { userId: user.id },
    });

    if (!streakData) {
      return {
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakHistory: [],
        },
        message: 'No streak data yet. Complete a task to start your streak!',
      };
    }

    // Check if streak needs to be reset
    const today = getTodayInTimezone(user.timezone);
    const lastActivity = streakData.lastActivityDate
      ? new Date(streakData.lastActivityDate).toISOString().split('T')[0]
      : null;

    let currentStreak = streakData.currentStreak;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Reset streak if more than 1 day has passed
      if (diffDays > 1) {
        currentStreak = 0;
        await prisma.streakData.update({
          where: { userId: user.id },
          data: { currentStreak: 0 },
        });
      }
    }

    return {
      success: true,
      data: {
        currentStreak,
        longestStreak: streakData.longestStreak,
        lastActivityDate: streakData.lastActivityDate
          ? new Date(streakData.lastActivityDate).toISOString().split('T')[0]
          : null,
        streakHistory: streakData.streakHistory || [],
      },
      message: currentStreak > 0
        ? `You're on a ${currentStreak}-day streak! Keep it up!`
        : 'Complete a task today to start a new streak!',
    };
  } catch (error) {
    console.error('Error in executeGetStreaks:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to retrieve streak data',
    };
  }
}
