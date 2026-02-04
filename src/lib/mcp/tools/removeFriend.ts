/**
 * Remove a friend (bidirectional)
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { auditLogger } from '@/lib/agent/auditLog';

export const toolDefinition: ToolDefinition = {
  name: 'remove-friend',
  description: 'Removes a friend from your friends list. This removes the friendship from both sides. Use get-friends first to find the friendId.',
  input_schema: {
    type: 'object',
    properties: {
      friendId: {
        type: 'string',
        description: 'The MongoDB user ID of the friend to remove (from get-friends results)',
      },
    },
    required: ['friendId'],
  },
};

export async function executeRemoveFriend(
  args: { friendId: string },
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    if (!args.friendId) {
      return { success: false, error: 'Validation error', message: 'Friend ID is required' };
    }

    args.friendId = args.friendId.replace(/^(goal_|task_|substep_|user_)/i, '');

    const user = await resolveUser(userId);
    if (!user) {
      return { success: false, error: 'User not found', message: 'Could not find user in database' };
    }

    // Verify friendship exists before deleting
    const friendship = await prisma.friendship.findFirst({
      where: { userId: user.id, friendId: args.friendId },
    });

    if (!friendship) {
      return { success: false, error: 'Not found', message: 'Friend not found in your friends list' };
    }

    // Get friend name for the response
    const friend = await prisma.user.findUnique({ where: { id: args.friendId } });

    // Delete both directions of the friendship
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId: args.friendId },
          { userId: args.friendId, friendId: user.id },
        ],
      },
    });

    auditLogger.logFriendRemoved(userId, args.friendId, { friendName: friend?.name });

    return {
      success: true,
      data: { friendId: args.friendId, friendName: friend?.name },
      message: `Removed ${friend?.name || 'friend'} from your friends list`,
    };
  } catch (error) {
    console.error('Error in executeRemoveFriend:', error);
    return { success: false, error: 'Database error', message: 'Failed to remove friend' };
  }
}
