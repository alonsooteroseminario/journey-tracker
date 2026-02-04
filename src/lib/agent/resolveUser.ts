/**
 * Shared utility to resolve Clerk userId to internal MongoDB user
 */

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Resolve Clerk userId to internal MongoDB user
 * Returns null if user not found
 */
export async function resolveUser(clerkId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    return user;
  } catch (error) {
    console.error('Error resolving user:', error);
    return null;
  }
}
