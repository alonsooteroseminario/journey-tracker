/**
 * Update task status (not_started / in_progress / completed)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { notify } from '@/lib/email/notifications';
import { trackActivity } from '@/lib/activity';
import { Task, TaskStatus } from '@/types';
import { recordStreakActivity } from '@/lib/streaks';

export const toolDefinition: ToolDefinition = {
  name: 'complete-task',
  description: 'Updates a task status: not_started, in_progress, or completed. Also records activity and updates streaks when completed.',
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
      status: {
        type: 'string',
        enum: ['not_started', 'in_progress', 'completed'],
        description: 'The new status for the task',
      },
    },
    required: ['goalId', 'taskId', 'status'],
  },
};

export async function executeCompleteTask(
  args: { goalId: string; taskId: string; status: TaskStatus },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.goalId || !args.taskId || !args.status) {
      return { success: false, error: 'Validation error', message: 'Goal ID, Task ID, and status are required' };
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
      auditLogger.logUnauthorizedAccess(userId, args.goalId, 'goal');
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

    // Capture old status for activity tracking
    const task = tasks[taskIndex];
    const oldStatus = task.status ?? (task as any).completed ? 'completed' : 'not_started';

    // Update task status
    const now = new Date().toISOString();
    task.status = args.status;
    if (args.status === 'completed') {
      task.completedAt = now;
      task.startedAt = task.startedAt ?? now;
    } else if (args.status === 'in_progress') {
      task.startedAt = task.startedAt ?? now;
      task.completedAt = undefined;
    } else {
      task.completedAt = undefined;
      task.startedAt = undefined;
    }

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Track activity (always logs + creates feed item per preferences)
    await trackActivity({
      userId: user.id,
      type: 'task_status_changed',
      action: `Changed task "${task.title}" status from ${oldStatus} to ${args.status}`,
      goalId: args.goalId,
      taskId: args.taskId,
      metadata: {
        oldStatus,
        newStatus: args.status,
        goalTitle: goal.title,
        taskTitle: task.title,
      },
    });

    // Update streak and send milestone notifications only when completing
    if (args.status === 'completed') {
      const streakResult = await recordStreakActivity(user.id, user.timezone);

      if (streakResult.milestone) {
        notify(user.id, 'streakMilestone', {
          userName: user.name,
          streakCount: streakResult.milestone,
        }).catch((err) => console.error('Failed to send streak milestone email:', err));

        trackActivity({
          userId: user.id,
          type: 'streak_milestone',
          action: `${user.name} reached a ${streakResult.milestone}-day streak! 🔥`,
          metadata: { streakCount: streakResult.milestone },
          createFeedItem: true,
          feedVisibility: 'friends',
        }).catch((err) => console.error('Failed to track streak milestone:', err));
      }

      auditLogger.logTaskCompleted(userId, args.goalId, args.taskId);
    }

    // Update conversation context
    conversationStore.setLastTask(userId, args.taskId);

    return {
      success: true,
      data: task,
      message: `Task "${task.title}" is now ${args.status.replace('_', ' ')}`,
    };
  } catch (error) {
    console.error('Error in executeCompleteTask:', error);
    return { success: false, error: 'Database error', message: 'Failed to update task status' };
  }
}
