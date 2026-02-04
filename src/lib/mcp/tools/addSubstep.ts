/**
 * Add a substep to a task
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { Task } from '@/types';
import { randomUUID } from 'crypto';

export const toolDefinition: ToolDefinition = {
  name: 'add-substep',
  description: 'Adds a new substep (mini-task) to an existing task.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal containing the task',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task to add the substep to',
      },
      title: {
        type: 'string',
        description: 'Title of the new substep',
      },
      description: {
        type: 'string',
        description: 'Description of the substep (optional)',
      },
    },
    required: ['goalId', 'taskId', 'title'],
  },
};

export async function executeAddSubstep(
  args: { goalId: string; taskId: string; title: string; description?: string },
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

    if (!args.goalId || !args.taskId || !args.title) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID, Task ID, and title are required',
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

    // Add substep
    const task = tasks[taskIndex];
    const substeps = task.substeps || [];
    const newSubstep = {
      id: randomUUID(),
      title: args.title,
      description: args.description,
      completed: false,
      order: substeps.length,
    };

    substeps.push(newSubstep);
    task.substeps = substeps;

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    return {
      success: true,
      data: newSubstep,
      message: `Added substep: ${newSubstep.title}`,
    };
  } catch (error) {
    console.error('Error in executeAddSubstep:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to add substep',
    };
  }
}
