/**
 * Create a new friend invitation code
 */

import { prisma } from '@/lib/prisma';
import { ToolDefinition, ToolResult } from '@/types/agent';
import { resolveUser } from '@/lib/agent/resolveUser';
import { randomBytes } from 'crypto';

export const toolDefinition: ToolDefinition = {
  name: 'create-invitation',
  description: 'Generates a new invitation code that can be shared with a friend so they can connect. The code is valid for 7 days.',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function executeCreateInvitation(
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

    const code = randomBytes(6).toString('base64url').substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        id: invitation.id,
        code: invitation.code,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      message: `Invitation code created: ${invitation.code} (expires in 7 days)`,
    };
  } catch (error) {
    console.error('Error in executeCreateInvitation:', error);
    return { success: false, error: 'Database error', message: 'Failed to create invitation' };
  }
}
