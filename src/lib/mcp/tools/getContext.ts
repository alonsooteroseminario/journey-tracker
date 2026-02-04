/**
 * Get conversation context
 */

import { ToolDefinition, ToolResult } from '@/types/agent';
import { conversationStore } from '@/lib/agent/conversationStore';

export const toolDefinition: ToolDefinition = {
  name: 'get-conversation-context',
  description: 'Gets the current conversation context including recently accessed goals.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function executeGetContext(
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

    const context = conversationStore.getContext(userId);
    const summary = conversationStore.getContextSummary(userId);

    return {
      success: true,
      data: {
        lastGoalId: context.lastGoalId,
        lastTaskId: context.lastTaskId,
        recentGoals: context.recentGoals,
        messageCount: context.messageCount,
        sessionDuration: Math.floor(
          (Date.now() - context.sessionStart.getTime()) / 1000 / 60
        ),
        summary,
      },
      message: 'Retrieved conversation context',
    };
  } catch (error) {
    console.error('Error in executeGetContext:', error);
    return {
      success: false,
      error: 'Error',
      message: 'Failed to retrieve context',
    };
  }
}
