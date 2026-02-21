/**
 * Update substep status (not_started / in_progress / completed)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { trackActivity } from '@/lib/activity';
import { Task, TaskStatus } from '@/types';
import { recordStreakActivity } from '@/lib/streaks';

export const toolDefinition: ToolDefinition = {
  name: 'complete-substep',
  description: 'Updates a substep status: not_started, in_progress, or completed.',
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
        description: 'The ID of the substep to update',
      },
      status: {
        type: 'string',
        enum: ['not_started', 'in_progress', 'completed'],
        description: 'The new status for the substep',
      },
    },
    required: ['goalId', 'taskId', 'substepId', 'status'],
  },
};

export async function executeCompleteSubstep(
  args: { goalId: string; taskId: string; substepId: string; status: TaskStatus },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.goalId || !args.taskId || !args.substepId || !args.status) {
      return { success: false, error: 'Validation error', message: 'Goal ID, Task ID, Substep ID, and status are required' };
    }
    args.goalId = args.goalId.replace(/^(goal_|task_|substep_|user_)/i, '');

    // Resolve Clerk userId to MongoDB user
    const user = await resolveUser(userId);
    if (!user) {
      return { success: false, error: 'User not found', message: 'Could not find user in database' };
    }

    // Verify ownership
    const hasAccess = await securityGuard.verifyOwnership(args.goalId, user.id, 'goal');
    if (!hasAccess) {
      return { success: false, error: 'Forbidden', message: "You don't have access to this goal" };
    }

    // Fetch goal
    const goal = await prisma.goal.findUnique({ where: { id: args.goalId } });
    if (!goal) {
      return { success: false, error: 'Not found', message: 'Goal not found' };
    }

    // Parse tasks
    const tasks = ((goal.tasks as unknown) as Task[]) || [];
    const taskIndex = tasks.findIndex((t) => t.id === args.taskId);
    if (taskIndex === -1) {
      return { success: false, error: 'Not found', message: 'Task not found in goal' };
    }

    // Find substep
    const task = tasks[taskIndex];
    const substeps = task.substeps || [];
    const substepIndex = substeps.findIndex((s) => s.id === args.substepId);
    if (substepIndex === -1) {
      return { success: false, error: 'Not found', message: 'Substep not found in task' };
    }

    // Capture old status for tracking
    const substep = substeps[substepIndex];
    const oldStatus = substep.status ?? ((substep as any).completed ? 'completed' : 'not_started');

    // Update substep status
    const now = new Date().toISOString();
    substep.status = args.status;
    if (args.status === 'completed') {
      substep.completedAt = now;
      substep.startedAt = substep.startedAt ?? now;
    } else if (args.status === 'in_progress') {
      substep.startedAt = substep.startedAt ?? now;
      substep.completedAt = undefined;
    } else {
      substep.completedAt = undefined;
      substep.startedAt = undefined;
    }

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Track activity
    await trackActivity({
      userId: user.id,
      type: 'substep_status_changed',
      action: `Changed substep "${substep.title}" status from ${oldStatus} to ${args.status}`,
      goalId: args.goalId,
      taskId: args.taskId,
      substepId: args.substepId,
      metadata: {
        oldStatus,
        newStatus: args.status,
        goalTitle: goal.title,
        taskTitle: task.title,
        substepTitle: substep.title,
      },
    });

    // Update streak and audit log when completing
    if (args.status === 'completed') {
      await recordStreakActivity(user.id, user.timezone);
      auditLogger.logSubstepCompleted(userId, args.goalId, args.taskId, args.substepId);
    }

    return {
      success: true,
      data: substep,
      message: `Substep "${substep.title}" is now ${args.status.replace('_', ' ')}`,
    };
  } catch (error) {
    console.error('Error in executeCompleteSubstep:', error);
    return { success: false, error: 'Database error', message: 'Failed to update substep status' };
  }
}
