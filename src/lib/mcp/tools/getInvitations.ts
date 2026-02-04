/**
 * Get all invitation codes for the authenticated user
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';

export const toolDefinition: ToolDefinition = {
  name: 'get-invitations',
  description: 'Lists all invitation codes created by the current user, including their status (used/unused) and expiry dates.',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function executeGetInvitations(
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

    const invitations = await prisma.invitation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const data = invitations.map((inv) => ({
      id: inv.id,
      code: inv.code,
      status: inv.used ? 'used' : inv.expiresAt < now ? 'expired' : 'active',
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      usedBy: inv.usedBy || null,
      usedAt: inv.usedAt?.toISOString() || null,
    }));

    return {
      success: true,
      data,
      message: `Found ${data.length} invitation(s)`,
    };
  } catch (error) {
    console.error('Error in executeGetInvitations:', error);
    return { success: false, error: 'Database error', message: 'Failed to get invitations' };
  }
}
