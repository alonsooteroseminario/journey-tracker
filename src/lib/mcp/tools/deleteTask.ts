/**
 * Delete a task from a goal
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
  name: 'delete-task',
  description: 'Permanently removes a task (and all its substeps) from a goal. Use when the user wants to delete or remove a task entirely.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal that contains the task',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task to delete',
      },
    },
    required: ['goalId', 'taskId'],
  },
};

export async function executeDeleteTask(
  args: { goalId: string; taskId: string },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.goalId || !args.taskId) {
      return { success: false, error: 'Validation error', message: 'Goal ID and Task ID are required' };
    }

    args.goalId = args.goalId.replace(/^(goal_|task_|substep_|user_)/i, '');
    args.taskId = args.taskId.replace(/^(goal_|task_|substep_|user_)/i, '');

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
    const taskIndex = tasks.findIndex((t) => t.id === args.taskId);

    if (taskIndex === -1) {
      return { success: false, error: 'Not found', message: 'Task not found' };
    }

    const deletedTitle = tasks[taskIndex].title;
    tasks.splice(taskIndex, 1);

    // Re-index order after removal
    tasks.forEach((t, i) => { t.order = i; });

    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Track activity
    await trackActivity({
      userId: user.id,
      type: 'task_deleted',
      action: `Deleted task "${deletedTitle}" from goal "${goal.title}"`,
      goalId: args.goalId,
      taskId: args.taskId,
      metadata: { goalTitle: goal.title, taskTitle: deletedTitle },
    });

    // Audit log (legacy — console only)
    auditLogger.logTaskUpdated(userId, args.goalId, args.taskId, { action: 'deleted', title: deletedTitle });

    return {
      success: true,
      data: { goalId: args.goalId, taskId: args.taskId, deletedTitle },
      message: `Deleted task: ${deletedTitle}`,
    };
  } catch (error) {
    console.error('Error in executeDeleteTask:', error);
    return { success: false, error: 'Database error', message: 'Failed to delete task' };
  }
}
