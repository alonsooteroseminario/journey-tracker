/**
 * Update the icon of an existing goal.
 * Accepts either an explicit emoji or a free-text hint that Claude
 * will use to pick the best icon automatically.
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { pickGoalIcon, EMOJI_SET } from '@/lib/agent/pickGoalIcon';

export const toolDefinition: ToolDefinition = {
  name: 'update-goal-icon',
  description:
    'Changes the icon/emoji displayed on a goal. ' +
    'Provide either a specific emoji from the available set, or a text hint describing what the icon should represent and the AI will pick the best one. ' +
    `Available emojis: ${EMOJI_SET.join(' ')}`,
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal to update',
      },
      icon: {
        type: 'string',
        description: 'A specific emoji to use (must be from the available set)',
      },
      hint: {
        type: 'string',
        description: 'A description of what the icon should represent. The AI will pick the best emoji based on this.',
      },
    },
    required: ['goalId'],
  },
};

export async function executeUpdateGoalIcon(
  args: { goalId: string; icon?: string; hint?: string },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.goalId) {
      return { success: false, error: 'Validation error', message: 'Goal ID is required' };
    }

    args.goalId = args.goalId.replace(/^(goal_|task_|substep_|user_)/i, '');

    const user = await resolveUser(userId);
    if (!user) {
      return { success: false, error: 'User not found', message: 'Could not find user in database' };
    }

    const hasAccess = await securityGuard.verifyOwnership(args.goalId, user.id, 'goal');
    if (!hasAccess) {
      auditLogger.logUnauthorizedAccess(userId, args.goalId, 'goal');
      return { success: false, error: 'Forbidden', message: "You don't have access to this goal" };
    }

    const goal = await prisma.goal.findUnique({ where: { id: args.goalId } });
    if (!goal) {
      return { success: false, error: 'Not found', message: 'Goal not found' };
    }

    // Determine icon: explicit > hint-based AI pick > title-based AI pick
    let icon: string;
    if (args.icon && EMOJI_SET.includes(args.icon)) {
      icon = args.icon;
    } else {
      icon = await pickGoalIcon(goal.title, goal.description, args.hint);
    }

    await prisma.goal.update({
      where: { id: args.goalId },
      data: { icon },
    });

    auditLogger.logGoalUpdated(userId, args.goalId, { icon });

    return {
      success: true,
      data: { goalId: args.goalId, icon },
      message: `Updated goal icon to ${icon}`,
    };
  } catch (error) {
    console.error('Error in executeUpdateGoalIcon:', error);
    return { success: false, error: 'Database error', message: 'Failed to update goal icon' };
  }
}
