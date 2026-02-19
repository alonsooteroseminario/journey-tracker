/**
 * Create a new goal
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { CreateGoalSchema, validateRequest } from '@/lib/validations';
import { auditLogger } from '@/lib/agent/auditLog';
import { conversationStore } from '@/lib/agent/conversationStore';
import { pickGoalIcon } from '@/lib/agent/pickGoalIcon';
import { notify } from '@/lib/email/notifications';
import { trackActivity } from '@/lib/activity';
import { randomUUID } from 'crypto';

export const toolDefinition: ToolDefinition = {
  name: 'create-goal',
  description: 'Creates a new goal with optional tasks and metadata.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Goal title (required)',
      },
      description: {
        type: 'string',
        description: 'Goal description (optional)',
      },
      tasks: {
        type: 'array',
        description: 'Array of task objects (optional)',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            dueDate: { type: 'string' },
          },
        },
      },
      startDate: {
        type: 'string',
        description: 'Start date in YYYY-MM-DD format (optional)',
      },
      targetDate: {
        type: 'string',
        description: 'Target completion date in YYYY-MM-DD format (optional)',
      },
      isPublic: {
        type: 'boolean',
        description: 'Whether goal is visible to friends (default: true)',
      },
    },
    required: ['title'],
  },
};

export async function executeCreateGoal(
  args: Record<string, any>,
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

    // Resolve Clerk userId to MongoDB user
    const user = await resolveUser(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        message: 'Could not find user in database',
      };
    }

    // Validate input
    const validation = validateRequest(CreateGoalSchema, args);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation error',
        message: validation.error,
      };
    }

    const validatedData = validation.data;

    // Generate IDs for tasks if not provided
    const tasksWithIds = (validatedData.tasks || []).map((task: any) => ({
      ...task,
      id: task.id || randomUUID(),
      status: task.status ?? (task.completed ? 'completed' : 'not_started'),
      substeps: (task.substeps || []).map((substep: any) => ({
        ...substep,
        id: substep.id || randomUUID(),
        status: substep.status ?? (substep.completed ? 'completed' : 'not_started'),
      })),
    }));

    // Pick icon via AI
    const icon = await pickGoalIcon(validatedData.title, validatedData.description);

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        icon,
        tasks: tasksWithIds,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        isPublic: validatedData.isPublic ?? true,
      },
    });

    // Update conversation context
    conversationStore.setLastGoal(userId, goal.id);

    // Audit log
    auditLogger.logGoalCreated(userId, goal.id, {
      title: goal.title,
      taskCount: tasksWithIds.length,
    });

    // Send email notification (non-blocking)
    notify(user.id, 'goalCreated', {
      userName: user.name,
      goalTitle: goal.title,
      goalIcon: goal.icon || undefined,
      taskCount: tasksWithIds.length,
    }).catch((err) => {
      console.error('Failed to send goal created email:', err);
    });

    // Track activity (creates ActivityLog + FeedItem per preferences)
    trackActivity({
      userId: user.id,
      type: 'goal_created',
      action: `Created new goal: ${goal.icon || '🎯'} ${goal.title}`,
      feedContent: `${user.name} created a new goal: ${goal.icon || '🎯'} ${goal.title}`,
      goalId: goal.id,
      metadata: { goalId: goal.id, goalTitle: goal.title, taskCount: tasksWithIds.length },
      feedVisibility: 'friends',
    }).catch((err) => {
      console.error('Failed to track goal_created activity:', err);
    });

    return {
      success: true,
      data: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        icon: goal.icon,
        tasks: goal.tasks,
        startDate: goal.startDate?.toISOString().split('T')[0],
        targetDate: goal.targetDate?.toISOString().split('T')[0],
        createdAt: goal.createdAt.toISOString(),
      },
      message: `Created goal: ${goal.title}`,
    };
  } catch (error) {
    console.error('Error in executeCreateGoal:', error);
    return {
      success: false,
      error: 'Database error',
      message: 'Failed to create goal',
    };
  }
}
