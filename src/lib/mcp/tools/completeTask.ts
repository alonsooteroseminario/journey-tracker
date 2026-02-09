/**
 * Toggle task completion status
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { securityGuard } from '@/lib/agent/security';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { notify } from '@/lib/email/notifications';
import { Task } from '@/types';

export const toolDefinition: ToolDefinition = {
  name: 'complete-task',
  description: 'Marks a task as completed or uncompleted. Also records activity and updates streaks.',
  input_schema: {
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The ID of the goal containing the task',
      },
      taskId: {
        type: 'string',
        description: 'The ID of the task to complete/uncomplete',
      },
      completed: {
        type: 'boolean',
        description: 'True to mark complete, false to mark incomplete',
      },
    },
    required: ['goalId', 'taskId', 'completed'],
  },
};

export async function executeCompleteTask(
  args: { goalId: string; taskId: string; completed: boolean },
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

    if (!args.goalId || !args.taskId || args.completed === undefined) {
      return {
        success: false,
        error: 'Validation error',
        message: 'Goal ID, Task ID, and completed status are required',
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

    // Update task completion
    const task = tasks[taskIndex];
    task.completed = args.completed;
    task.completedAt = args.completed ? new Date().toISOString() : undefined;

    // Save back to database
    await prisma.goal.update({
      where: { id: args.goalId },
      data: { tasks: tasks as unknown as Prisma.InputJsonValue },
    });

    // Create activity log entry
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: args.completed ? 'task_completed' : 'task_uncompleted',
        action: args.completed ? `Completed task: ${task.title}` : `Uncompleted task: ${task.title}`,
        goalId: args.goalId,
        taskId: args.taskId,
      },
    });

    // Update streak if completing
    if (args.completed) {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await prisma.streakData.findUnique({
        where: { userId: user.id },
      });

      if (streakData) {
        const streakHistory = streakData.streakHistory || [];
        if (!streakHistory.includes(today)) {
          streakHistory.push(today);

          // Calculate new streak
          const sortedDates = streakHistory.sort();
          let currentStreak = 1;
          for (let i = sortedDates.length - 1; i > 0; i--) {
            const current = new Date(sortedDates[i]);
            const previous = new Date(sortedDates[i - 1]);
            const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }

          await prisma.streakData.update({
            where: { userId: user.id },
            data: {
              currentStreak,
              longestStreak: Math.max(currentStreak, streakData.longestStreak),
              lastActivityDate: new Date(today),
              streakHistory,
            },
          });

          // Send streak milestone email for notable achievements
          const milestones = [7, 14, 30, 60, 100];
          if (milestones.includes(currentStreak)) {
            notify(user.id, 'streakMilestone', {
              userName: user.name,
              streakCount: currentStreak,
            }).catch((err) => {
              console.error('Failed to send streak milestone email:', err);
            });

            // Create feed item for streak milestone
            prisma.feedItem.create({
              data: {
                userId: user.id,
                type: 'streak_milestone',
                content: `${user.name} reached a ${currentStreak}-day streak! 🔥`,
                metadata: { streakCount: currentStreak },
                visibility: 'friends',
              },
            }).catch((err) => {
              console.error('Failed to create feed item for streak milestone:', err);
            });
          }
        }
      }
    }

    // Update conversation context
    conversationStore.setLastTask(userId, args.taskId);

    // Audit log
    if (args.completed) {
      auditLogger.logTaskCompleted(userId, args.goalId, args.taskId);
    }

    return {
      success: true,
      data: task,
      message: args.completed
        ? `Completed task: ${task.title}`
        : `Uncompleted task: ${task.title}`,
    };
  } catch (error) {
    console.error('Error in executeCompleteTask:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to update task completion',
    };
  }
}
