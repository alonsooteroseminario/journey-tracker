/**
 * Get the authenticated user's profile
 */

import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-profile',
  description: 'Retrieves the current user\'s profile information including name, bio, location, and timezone.',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function executeGetProfile(
  _args: Record<string, any>,
  userId?: string
): Promise<ToolResult> {
  try {
    if (!userId) {
      return { success: false, error: 'Unauthorized', message: 'User ID is required' };
    }

    const user = await resolveUser(userId);
    if (!user) {
      return { success: false, error: 'User not found', message: 'Could not find user in database' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || null,
        location: user.location || null,
        timezone: user.timezone || null,
        joinedDate: user.joinedDate?.toISOString?.() ?? user.joinedDate ?? null,
      },
      message: 'Profile retrieved successfully',
    };
  } catch (error) {
    console.error('Error in executeGetProfile:', error);
    return { success: false, error: 'Database error', message: 'Failed to retrieve profile' };
  }
}
