/**
 * Delete a goal
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { notify } from '@/lib/email/notifications';

export const toolDefinition: ToolDefinition = {
  name: 'delete-goal',
  description: 'Permanently deletes a goal and all its tasks.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal to delete',
      },
    },
    required: ['goalId'],
  },
};

export async function executeDeleteGoal(
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

    // Verify ownership
    const hasAccess = await securityGuard.verifyOwnership(args.goalId, user.id, 'goal');
    if (!hasAccess) {
      auditLogger.logUnauthorizedAccess(userId, args.goalId, 'goal');
      return {
        success: false,
        error: 'Forbidden',
        message: 'You don\'t have access to this goal',
      };
    }

    // Get goal title before deletion
    const goal = await prisma.goal.findUnique({
      where: { id: args.goalId },
      select: { title: true },
    });

    // Delete goal
    await prisma.goal.delete({
      where: { id: args.goalId },
    });

    // Audit log
    auditLogger.logGoalDeleted(userId, args.goalId);

    // Send email notification (non-blocking)
    if (goal) {
      notify(user.id, 'goalDeleted', {
        userName: user.name,
        goalTitle: goal.title,
      }).catch((err) => {
        console.error('Failed to send goal deleted email:', err);
      });
    }

    return {
      success: true,
      message: `Deleted goal: ${goal?.title || args.goalId}`,
    };
  } catch (error) {
    console.error('Error in executeDeleteGoal:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to delete goal',
    };
  }
}
