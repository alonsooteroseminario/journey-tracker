/**
 * Toggle substep completion status
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { Task } from '@/types';

export const toolDefinition: ToolDefinition = {
  name: 'complete-substep',
  description: 'Marks a substep as completed or uncompleted.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task containing the substep',
      },
      substepId: {
        type: 'string',
        description: 'The ID of the substep to complete/uncomplete',
      },
      completed: {
        type: 'boolean',
        description: 'True to mark complete, false to mark incomplete',
      },
    },
    required: ['goalId', 'taskId', 'substepId', 'completed'],
  },
};

export async function executeCompleteSubstep(
  args: { goalId: string; taskId: string; substepId: string; completed: boolean },
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

    if (!args.goalId || !args.taskId || !args.substepId || args.completed === undefined) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID, Task ID, Substep ID, and completed status are required',
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
      return {
        success: false,
        error: 'Forbidden',
        message: 'You don\'t have access to this goal',
      };
    }

    // Fetch goal
    const goal = await prisma.goal.findUnique({
      where: { id: args.goalId },
    });

    if (!goal) {
      return {
        success: false,
        error: 'Not found',
        message: 'Goal not found',
      };
    }

    // Parse tasks
    const tasks = ((goal.tasks as unknown) as Task[]) || [];
    const taskIndex = tasks.findIndex((t) => t.id === args.taskId);

    if (taskIndex === -1) {
      return {
        success: false,
        error: 'Not found',
        message: 'Task not found in goal',
      };
    }

    // Find substep
    const task = tasks[taskIndex];
    const substeps = task.substeps || [];
    const substepIndex = substeps.findIndex((s) => s.id === args.substepId);

    if (substepIndex === -1) {
      return {
        success: false,
        error: 'Not found',
        message: 'Substep not found in task',
      };
    }

    // Update substep
    const substep = substeps[substepIndex];
    substep.completed = args.completed;
    substep.completedAt = args.completed ? new Date().toISOString() : undefined;

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Create activity log entry
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: args.completed ? 'substep_completed' : 'substep_uncompleted',
        action: args.completed
          ? `Completed substep: ${substep.title}`
          : `Uncompleted substep: ${substep.title}`,
        goalId: args.goalId,
        taskId: args.taskId,
        substepId: args.substepId,
      },
    });

    // Audit log
    if (args.completed) {
      auditLogger.logSubstepCompleted(userId, args.goalId, args.taskId, args.substepId);
    }

    return {
      success: true,
      data: substep,
      message: args.completed
        ? `Completed substep: ${substep.title}`
        : `Uncompleted substep: ${substep.title}`,
    };
  } catch (error) {
    console.error('Error in executeCompleteSubstep:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to update substep completion',
    };
  }
}
