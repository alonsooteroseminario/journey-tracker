/**
 * Delete a substep from a task
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { trackActivity } from '@/lib/activity';
import { Task } from '@/types';

export const toolDefinition: ToolDefinition = {
  name: 'delete-substep',
  description: 'Permanently removes a substep from a task within a goal. Use when the user wants to delete or remove a substep.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task that contains the substep',
      },
      substepId: {
        type: 'string',
        description: 'The ID of the substep to delete',
      },
    },
    required: ['goalId', 'taskId', 'substepId'],
  },
};

export async function executeDeleteSubstep(
  args: { goalId: string; taskId: string; substepId: string },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.goalId || !args.taskId || !args.substepId) {
      return { success: false, error: 'Validation error', message: 'Goal ID, Task ID, and Substep ID are required' };
    }

    args.goalId = args.goalId.replace(/^(goal_|task_|substep_|user_)/i, '');
    args.taskId = args.taskId.replace(/^(goal_|task_|substep_|user_)/i, '');
    args.substepId = args.substepId.replace(/^(goal_|task_|substep_|user_)/i, '');

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

    const tasks = ((goal.tasks as unknown) as Task[]) || [];
    const task = tasks.find((t) => t.id === args.taskId);

    if (!task) {
      return { success: false, error: 'Not found', message: 'Task not found' };
    }

    const substeps = task.substeps || [];
    const substepIndex = substeps.findIndex((s) => s.id === args.substepId);

    if (substepIndex === -1) {
      return { success: false, error: 'Not found', message: 'Substep not found' };
    }

    const deletedTitle = substeps[substepIndex].title;
    substeps.splice(substepIndex, 1);

    // Re-index order after removal
    substeps.forEach((s, i) => { s.order = i; });
    task.substeps = substeps;

    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Track activity
    await trackActivity({
      userId: user.id,
      type: 'substep_deleted',
      action: `Deleted substep "${deletedTitle}" from task "${task.title}"`,
      goalId: args.goalId,
      taskId: args.taskId,
      substepId: args.substepId,
      metadata: { goalTitle: goal.title, taskTitle: task.title, substepTitle: deletedTitle },
    });

    // Audit log (legacy — console only)
    auditLogger.logTaskUpdated(userId, args.goalId, args.taskId, { action: 'substep_deleted', substepId: args.substepId, title: deletedTitle });

    return {
      success: true,
      data: { goalId: args.goalId, taskId: args.taskId, substepId: args.substepId, deletedTitle },
      message: `Deleted substep: ${deletedTitle}`,
    };
  } catch (error) {
    console.error('Error in executeDeleteSubstep:', error);
    return { success: false, error: 'Database error', message: 'Failed to delete substep' };
  }
}
