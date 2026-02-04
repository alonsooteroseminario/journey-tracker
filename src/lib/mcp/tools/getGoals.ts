/**
 * Get all goals for the authenticated user
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-goals',
  description: 'Retrieves all goals for the authenticated user. Use when user wants to see, list, or view their goals.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function executeGetGoals(
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

    // Fetch goals from database
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include useful computed fields
    const goalsWithStats = goals.map((goal) => {
      const tasks = (goal.tasks as any[]) || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.completed).length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        totalTasks,
        completedTasks,
        completionPercentage,
        startDate: goal.startDate?.toISOString().split('T')[0],
        targetDate: goal.targetDate?.toISOString().split('T')[0],
        createdAt: goal.createdAt.toISOString(),
        isPublic: goal.isPublic,
      };
    });

    if (goalsWithStats.length === 0) {
      return {
        success: true,
        data: [],
        message: 'You don\'t have any goals yet. Create one to get started!',
      };
    }

    return {
      success: true,
      data: goalsWithStats,
      message: `Found ${goalsWithStats.length} goal(s)`,
    };
  } catch (error) {
    console.error('Error in executeGetGoals:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to retrieve goals',
    };
  }
}
