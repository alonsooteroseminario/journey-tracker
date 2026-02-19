/**
 * Update an existing goal
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { UpdateGoalSchema, validateRequest } from '@/lib/validations';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { trackActivity, diffFields, formatDiffAction } from '@/lib/activity';

export const toolDefinition: ToolDefinition = {
  name: 'update-goal',
  description: 'Updates an existing goal\'s title, description, dates, or other properties.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal to update',
      },
      title: {
        type: 'string',
        description: 'New goal title (optional)',
      },
      description: {
        type: 'string',
        description: 'New goal description (optional)',
      },
      startDate: {
        type: 'string',
        description: 'New start date in YYYY-MM-DD format (optional)',
      },
      targetDate: {
        type: 'string',
        description: 'New target date in YYYY-MM-DD format (optional)',
      },
      isPublic: {
        type: 'boolean',
        description: 'Whether the goal is visible to friends (optional)',
      },
    },
    required: ['goalId'],
  },
};

export async function executeUpdateGoal(
  args: { goalId: string; [key: string]: any },
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

    // Validate update data
    const { goalId, ...updateData } = args;
    const validation = validateRequest(UpdateGoalSchema, updateData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation error',
        message: validation.error,
      };
    }

    const validatedData = validation.data;

    // Prepare update object
    const updateObject: any = {};
    if (validatedData.title !== undefined) updateObject.title = validatedData.title;
    if (validatedData.description !== undefined) updateObject.description = validatedData.description;
    if (validatedData.startDate !== undefined) {
      updateObject.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.targetDate !== undefined) {
      updateObject.targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (args.isPublic !== undefined) updateObject.isPublic = args.isPublic;

    // Fetch old goal for diff
    const oldGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { title: true, description: true, startDate: true, targetDate: true, isPublic: true },
    });

    // Update goal
    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateObject,
    });

    // Track activity with diff
    const oldRecord: Record<string, unknown> = {
      title: oldGoal?.title,
      description: oldGoal?.description,
      startDate: oldGoal?.startDate?.toISOString().split('T')[0],
      targetDate: oldGoal?.targetDate?.toISOString().split('T')[0],
      isPublic: oldGoal?.isPublic,
    };
    const newRecord: Record<string, unknown> = {
      title: goal.title,
      description: goal.description,
      startDate: goal.startDate?.toISOString().split('T')[0],
      targetDate: goal.targetDate?.toISOString().split('T')[0],
      isPublic: goal.isPublic,
    };
    const diffs = diffFields(oldRecord, newRecord, ['title', 'description', 'startDate', 'targetDate', 'isPublic']);
    await trackActivity({
      userId: user.id,
      type: 'goal_updated',
      action: formatDiffAction('goal', goal.title, diffs),
      goalId,
      metadata: { diffs, goalTitle: goal.title },
    });

    // Audit log (legacy — console only)
    auditLogger.logGoalUpdated(userId, goalId, updateObject);

    return {
      success: true,
      data: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        startDate: goal.startDate?.toISOString().split('T')[0],
        targetDate: goal.targetDate?.toISOString().split('T')[0],
        updatedAt: goal.updatedAt.toISOString(),
      },
      message: `Updated goal: ${goal.title}`,
    };
  } catch (error) {
    console.error('Error in executeUpdateGoal:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to update goal',
    };
  }
}
