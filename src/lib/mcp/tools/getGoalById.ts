/**
 * Get a single goal by ID with full details
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { conversationStore } from '@/lib/agent/conversationStore';

export const toolDefinition: ToolDefinition = {
  name: 'get-goal-by-id',
  description: 'Gets detailed information about a specific goal including all tasks and substeps.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal to retrieve',
      },
    },
    required: ['goalId'],
  },
};

export async function executeGetGoalById(
  args: { goalId: string },
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

    if (!args.goalId) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID is required',
      };
    }
    args.goalId = args.goalId.replace(/^(goal_|task_|substep_|user_)/i, "");

    // Resolve Clerk userId to MongoDB user
    const user = await resolveUser(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        message: 'Could not find user in database',
      };
    }

    // Fetch goal with ownership verification
    const goal = await prisma.goal.findFirst({
      where: {
        id: args.goalId,
        userId: user.id,
      },
    });

    if (!goal) {
      return {
        success: false,
        error: 'Not found',
        message: 'Goal not found or you don\'t have access to it',
      };
    }

    // Update conversation context
    conversationStore.setLastGoal(userId, goal.id);

    // Transform to frontend format
    const goalData = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      tasks: goal.tasks || [],
      phases: goal.phases || undefined,
      budget: goal.budget || undefined,
      timeline: goal.timeline || undefined,
      documents: goal.documents || undefined,
      resources: goal.resources || undefined,
      startDate: goal.startDate?.toISOString().split('T')[0],
      targetDate: goal.targetDate?.toISOString().split('T')[0],
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      isPublic: goal.isPublic,
    };

    return {
      success: true,
      data: goalData,
      message: `Retrieved goal: ${goal.title}`,
    };
  } catch (error) {
    console.error('Error in executeGetGoalById:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to retrieve goal',
    };
  }
}
