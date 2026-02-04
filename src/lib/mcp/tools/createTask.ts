/**
 * Create a new task within an existing goal
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { Task } from '@/types';
import { randomUUID } from 'crypto';

export const toolDefinition: ToolDefinition = {
  name: 'create-task',
  description: 'Creates a new task inside an existing goal. Use when the user wants to add a task to a goal they already have.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal to add the task to',
      },
      title: {
        type: 'string',
        description: 'Title of the new task',
      },
      description: {
        type: 'string',
        description: 'Description of the task (optional)',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Task priority (optional)',
      },
      dueDate: {
        type: 'string',
        description: 'Due date in YYYY-MM-DD format (optional)',
      },
      notes: {
        type: 'string',
        description: 'Additional notes for the task (optional)',
      },
    },
    required: ['goalId', 'title'],
  },
};

export async function executeCreateTask(
  args: { goalId: string; title: string; description?: string; priority?: string; dueDate?: string; notes?: string },
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

    if (!args.goalId || !args.title) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID and title are required',
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

    // Read current tasks and build new task
    const tasks = ((goal.tasks as unknown) as Task[]) || [];
    const newTask: Task = {
      id: randomUUID(),
      title: args.title.trim(),
      completed: false,
      order: tasks.length,
      ...(args.description && { description: args.description }),
      ...(args.priority && { priority: args.priority as Task['priority'] }),
      ...(args.dueDate && { dueDate: args.dueDate }),
      ...(args.notes && { notes: args.notes }),
      substeps: [],
    };

    tasks.push(newTask);

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Update conversation context
    conversationStore.setLastGoal(userId, args.goalId);
    conversationStore.setLastTask(userId, newTask.id);

    // Audit log
    auditLogger.logTaskUpdated(userId, args.goalId, newTask.id, { action: 'created', title: newTask.title });

    return {
      success: true,
      data: newTask,
      message: `Created task: ${newTask.title}`,
    };
  } catch (error) {
    console.error('Error in executeCreateTask:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to create task',
    };
  }
}
