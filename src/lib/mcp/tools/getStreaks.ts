/**
 * Get streak data for the user
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { getTodayInTimezone } from '@/lib/dateUtils';
import { calculateStreakFromHistory } from '@/lib/streaks';

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

    // Recalculate from history — single source of truth.
    // Avoids timezone mismatch from lastActivityDate (stored as UTC DateTime).
    const today = getTodayInTimezone(user.timezone);
    const currentStreak = calculateStreakFromHistory(streakData.streakHistory || [], today);

    // Sync stored value if it diverged
    if (currentStreak !== streakData.currentStreak) {
      await prisma.streakData.update({
        where: { userId: user.id },
        data: { currentStreak },
      });
    }

    // Derive lastActivityDate from history — avoids UTC vs local date confusion
    const sortedHistory = [...(streakData.streakHistory || [])].sort();
    const lastActivityDate = sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;

    return {
      success: true,
      data: {
        currentStreak,
        longestStreak: streakData.longestStreak,
        lastActivityDate,
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
