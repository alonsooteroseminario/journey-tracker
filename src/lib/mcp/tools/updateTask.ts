/**
 * Update a task within a goal
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { UpdateTaskSchema, validateRequest } from '@/lib/validations';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { Task } from '@/types';

export const toolDefinition: ToolDefinition = {
  name: 'update-task',
  description: 'Updates a task\'s properties like title, description, priority, due date, or notes.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal containing the task',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task to update',
      },
      title: {
        type: 'string',
        description: 'New task title (optional)',
      },
      description: {
        type: 'string',
        description: 'New task description (optional)',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'New task priority (optional)',
      },
      notes: {
        type: 'string',
        description: 'New task notes (optional)',
      },
      dueDate: {
        type: 'string',
        description: 'New due date in YYYY-MM-DD format (optional)',
      },
    },
    required: ['goalId', 'taskId'],
  },
};

export async function executeUpdateTask(
  args: { goalId: string; taskId: string; [key: string]: any },
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

    if (!args.goalId || !args.taskId) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID and Task ID are required',
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

    // Validate update data
    const { goalId, taskId, ...updateData } = args;
    const validation = validateRequest(UpdateTaskSchema, updateData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation error',
        message: validation.error,
      };
    }

    // Update task
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...validation.data,
    } as typeof tasks[typeof taskIndex];

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Update conversation context
    conversationStore.setLastTask(userId, args.taskId);

    // Audit log
    auditLogger.logTaskUpdated(userId, args.goalId, args.taskId, validation.data);

    return {
      success: true,
      data: tasks[taskIndex],
      message: `Updated task: ${tasks[taskIndex].title}`,
    };
  } catch (error) {
    console.error('Error in executeUpdateTask:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to update task',
    };
  }
}
