/**
 * Update the authenticated user's profile
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { auditLogger } from '@/lib/agent/auditLog';

export const toolDefinition: ToolDefinition = {
  name: 'update-profile',
  description: 'Updates the current user\'s profile fields. All fields are optional — only the ones provided will be changed.',
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Display name',
      },
      bio: {
        type: 'string',
        description: 'Short bio / about text (max 500 characters)',
      },
      location: {
        type: 'string',
        description: 'Location string (e.g. "Vancouver, BC")',
      },
      timezone: {
        type: 'string',
        description: 'Timezone identifier (e.g. "America/Vancouver")',
      },
    },
  },
};

export async function executeUpdateProfile(
  args: { name?: string; bio?: string; location?: string; timezone?: string },
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

    // Build update payload — only include fields that were provided
    const updateData: Record<string, any> = {};
    if (args.name !== undefined) updateData.name = args.name.trim();
    if (args.bio !== undefined) updateData.bio = args.bio.trim();
    if (args.location !== undefined) updateData.location = args.location.trim();
    if (args.timezone !== undefined) updateData.timezone = args.timezone.trim();

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'Validation error', message: 'At least one field must be provided (name, bio, location, timezone)' };
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    auditLogger.logProfileUpdated(userId, updateData);

    return {
      success: true,
      data: {
        name: updated.name,
        bio: updated.bio,
        location: updated.location,
        timezone: updated.timezone,
      },
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('Error in executeUpdateProfile:', error);
    return { success: false, error: 'Database error', message: 'Failed to update profile' };
  }
}
