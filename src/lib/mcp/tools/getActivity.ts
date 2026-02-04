/**
 * Get activity log entries
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-activity',
  description: 'Gets the user\'s recent activity log entries.',
  input_schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of entries to return (default: 20)',
      },
      type: {
        type: 'string',
        description: 'Filter by activity type (optional)',
      },
    },
  },
};

export async function executeGetActivity(
  args: { limit?: number; type?: string },
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

    const limit = args.limit || 20;
    const where: any = { userId: user.id };

    if (args.type) {
      where.type = args.type;
    }

    // Fetch activity log
    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const activityData = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      goalId: activity.goalId,
      taskId: activity.taskId,
      substepId: activity.substepId,
      metadata: activity.metadata,
      timestamp: activity.timestamp.toISOString(),
    }));

    return {
      success: true,
      data: activityData,
      message: `Found ${activityData.length} activity ${activityData.length === 1 ? 'entry' : 'entries'}`,
    };
  } catch (error) {
    console.error('Error in executeGetActivity:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to retrieve activity log',
    };
  }
}
